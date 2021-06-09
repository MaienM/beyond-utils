/* eslint-disable @typescript-eslint/no-var-requires */

require('dotenv').config();

const fs = require('fs');
const path = require('path');
const stylus = require('stylus');
const svgo = require('svgo');
const TsconfigPathsPlugin = require('tsconfig-paths-webpack-plugin');
const webpack = require('webpack');
const WebpackUserscript = require('webpack-userscript');

const IN_DEV = process.env.ENV !== 'production';
const INFO = JSON.parse(fs.readFileSync(path.resolve(__dirname, 'package.json')));
const VERSION = IN_DEV ? `${INFO.version}-dev` : INFO.version;
const REPO_URL = INFO.repository.url;
const SOURCE_URL = `${REPO_URL}/releases/download/latest/main.user.js`;
const META_URL = `${REPO_URL}/releases/download/latest/main.meta.js`;

module.exports = {
	mode: IN_DEV ? 'development' : 'production',
	entry: path.resolve(__dirname, 'src', 'index.ts'),
	output: {
		path: path.resolve(__dirname, 'dist'),
	},
	resolve: {
		extensions: ['.ts', '.js'],
		plugins: [
			new TsconfigPathsPlugin({
				extensions: ['.ts', '.tsx', '.js'],
			}),
		],
	},
	devtool: 'inline-source-map',
	plugins: [
		new webpack.DefinePlugin({
			IN_DEV: JSON.stringify(IN_DEV),
			VERSION: JSON.stringify(VERSION),
			REPO_URL: JSON.stringify(REPO_URL),
			SOURCE_URL: JSON.stringify(SOURCE_URL),
			META_URL: JSON.stringify(META_URL),
		}),
		new WebpackUserscript({
			headers() {
				return {
					name: INFO.name,
					version: VERSION,
					author: INFO.author,
					namespace: INFO.homepage,
					updateURL: META_URL,
					downloadURL: SOURCE_URL,
					...INFO.headers,
				};
			},
			pretty: false,
		}),
	],
	module: {
		rules: [
			{
				test: /\.tsx?$/,
				loader: 'ts-loader',
			},
			{
				test: /\.(css|styl)$/,
				use: [
					{
						loader: 'style-loader',
						options: {
							attributes: {
								'added-by': 'beyond-utils',
							},
						},
					},
					'css-loader',
					{
						loader: 'stylus-loader',
						options: {
							stylusOptions: (loaderContext) => ({
								define: [
									['embedsvg', (svgPath) => {
										stylus.utils.assertType(svgPath, 'string', 'svgPath');
										const fullPath = path.resolve(path.dirname(svgPath.filename), svgPath.val);
										loaderContext.addDependency(fullPath);
										const data = fs.readFileSync(fullPath);
										const optimized = svgo.optimize(data, { path: fullPath }).data;
										const base64 = Buffer.from(optimized, 'utf-8').toString('base64');
										return new stylus.nodes.Literal(`url("data:image/svg+xml;base64,${base64}")`);
									}],
								],
							}),
						},
					},
				],
			},
			{
				test: /\.svg$/,
				loader: './svg-loader.js',
			},
		],
	},
	devServer: {
		hot: false,
		inline: false,
		host: process.env.APP_HOSTNAME || 'localhost',
		port: process.env.APP_PORT || 8000,
		contentBase: path.resolve(__dirname, 'dist'),
	},
};

/* eslint-enable @typescript-eslint/no-var-requires */
