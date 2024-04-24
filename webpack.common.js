const HtmlWebpackPlugin = require('html-webpack-plugin');
const { CleanWebpackPlugin } = require('clean-webpack-plugin');
const CopyWebpackPlugin = require('copy-webpack-plugin');
const MiniCssExtractPlugin = require('mini-css-extract-plugin');
const { ProvidePlugin } = require('webpack');
const JSON5 = require('json5');
const packageInformation = require('./package.json');
require('dotenv').config();

module.exports = {
	entry: {
		background: './src/background/podstation_bg.js',
		feedFinder: './src/feedFinder.js',
		podstation: './src/podstation.js',
		popup: './src/popup.js',
	},
	plugins: [
		new CleanWebpackPlugin({ cleanStaleWebpackAssets: false }),
		new HtmlWebpackPlugin({ 
			template: 'src/podstation.html',
			filename: 'podstation.html',
			chunks: ['podstation'],
		}),
		new HtmlWebpackPlugin({ 
			filename: 'background.html',
			chunks: ['background'],
		}),
		new HtmlWebpackPlugin({ 
			template: 'src/popup.html',
			filename: 'popup.html',
			chunks: ['popup'],
		}),
		new CopyWebpackPlugin({
			patterns: [
				{ from: './src/manifest.json', transform: injectDataToManifest },
				{ from: './src/_locales', to: '_locales', transform: stripJsonComments },
				{ from: './src/images', to: 'images' },
				{ from: './src/ui/ng/partials', to: 'ui/ng/partials' },
			],
		}),
		new MiniCssExtractPlugin(),
		new ProvidePlugin({
			qrcode: 'qrcode-generator',
		}),
	],
	module: {
		rules: [
			{
				test: /\.css$/i,
				use: [MiniCssExtractPlugin.loader, 'css-loader'],
			},
			// https://stackoverflow.com/a/39609018/4274827
			{
				test: /\.woff(2)?(\?v=[0-9]\.[0-9]\.[0-9])?$/, 
				use: "url-loader" 
			},
			{
				test: /\.(ttf|eot|svg)(\?v=[0-9]\.[0-9]\.[0-9])?$/, 
				use: "file-loader" 
			},
			{
				test: /\.tsx?$/,
				use: 'ts-loader',
				exclude: /node_modules/,
			},
		],
	},
	resolve: {
		extensions: ['.ts', '...'],
	},
}

function injectDataToManifest(content) {
	// Inject version from package to the manifest
	const parsedManifest = JSON.parse(content.toString());
	parsedManifest.version = packageInformation.version;

	// Inject extension key from environment
	if(process.env.EXTENSION_KEY) {
		parsedManifest.key = process.env.EXTENSION_KEY;
	}

	return JSON.stringify(parsedManifest, null, 4);
}

function stripJsonComments(content) {
	const parsedManifest = JSON5.parse(content.toString());

	return JSON.stringify(parsedManifest, null, 4);
}