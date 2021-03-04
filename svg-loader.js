const svgo = require('svgo');

module.exports = function (content) {
	const svg = svgo.optimize(content, {
		path: this.resourcePath,
		plugins: svgo.extendDefaultPlugins([
			{
				name: 'removeViewBox',
				active: false,
			},
		]),
	}).data;
	return `
		const element = document.createElement('div');
		element.innerHTML = ${JSON.stringify(svg)};
		module.exports = element.firstChild;
	`;
};
