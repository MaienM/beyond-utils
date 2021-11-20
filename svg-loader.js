const svgo = require('svgo');

module.exports = function svgLoader(content) {
	const svg = svgo.optimize(content, {
		path: this.resourcePath,
		plugins: [
			{
				name: 'preset-default',
				params: {
					overrides: {
						removeViewBox: false,
					},
				},
			},

			'removeDimensions',
		],
	}).data;
	return `
		const element = document.createElement('div');
		element.innerHTML = ${JSON.stringify(svg)};
		const svg = element.firstChild;
		svg.setAttribute('path', ${JSON.stringify(this.resourcePath)});
		module.exports = svg;
	`;
};
