/* eslint-disable @typescript-eslint/no-var-requires */

require('dotenv').config();

const fs = require('fs');
const path = require('path');
const stylus = require('stylus');
const svgo = require('svgo');
const TsconfigPathsPlugin = require('tsconfig-paths-webpack-plugin');
const WebpackUserscript = require('webpack-userscript');

const IN_DEV = process.env.ENV !== 'production';

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
		new WebpackUserscript({
			headers() {
				const info = JSON.parse(fs.readFileSync(path.resolve(__dirname, 'package.json')));
				return {
					name: info.name,
					version: IN_DEV ? `${info.version}-dev` : info.version,
					author: info.author,
					namespace: info.homepage,
					...info.headers,
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
