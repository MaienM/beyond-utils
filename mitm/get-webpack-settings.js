const get = require('lodash').get;
const webpack = require('webpack');
const config = require('../webpack.config');

const plugin = (config.plugins || []).find((p) => p instanceof webpack.DefinePlugin);

console.log(JSON.stringify({
	dev_server_host: get(config, ['devServer', 'host']),
	dev_server_port: get(config, ['devServer', 'port']),
	build_dir: get(config, ['output', 'path']),
	upstream_url: JSON.parse(get(plugin, ['definitions', 'SOURCE_URL'], 'undefined')),
}));
