require('dotenv').config();

const fs = require('fs');
const path = require('path');
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
				test: /\.css$/,
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
				],
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
