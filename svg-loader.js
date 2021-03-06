const svgo = require('svgo');

module.exports = function (content) {
	const svg = svgo.optimize(content, {
		path: this.resourcePath,
		plugins: svgo.extendDefaultPlugins([
			{
				name: 'removeViewBox',
				active: false,
			},
			'removeDimensions',
		]),
	}).data;
	return `
		const element = document.createElement('div');
		element.innerHTML = ${JSON.stringify(svg)};
		const svg = element.firstChild;
		svg.setAttribute('path', ${JSON.stringify(this.resourcePath)});
		module.exports = svg;
	`;
};
