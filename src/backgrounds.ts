import { replaceContainerIfNeeded } from 'src/utils';

/**
 * Alter a background box so that the background works for nonstandard dimensions.
 *
 * By default all background SVGs are a single SVG, which causes them to look stretched/squished if the box is resized. To fix this we cut the SVG into 9 areas: the 4 corners (which will not scale), the 4 borders (which will stretch in a single direction), and the center (which will stretch in both directions).
 *
 * @param svg The svg to make scale properly.
 */
export const prepareBackgroundForScaling = (svg: SVGSVGElement): void => {
	// The contents of the SVG element are updated without it being replaced, so we need to look at the contents to determine whether this needs re-processing.
	const container = replaceContainerIfNeeded(svg.parentNode, svg.innerHTML);
	if (!container) {
		return;
	}

	// Slice the background into 9 parts: the 4 corners (which will not scale), the 4 borders (which will stretch in a single direction), and the center (which will stretch in both directions).
	const { width, height } = svg.viewBox.baseVal;
	const xSlice = Math.min(Math.floor(width * 0.45), 50);
	const ySlice = Math.min(Math.floor(height * 0.45), 90);
	const parts = [
		{
			viewbox: [0, 0, xSlice, ySlice],
			element: [[`${xSlice}px`, `${ySlice}px`], ['0', 'auto', 'auto', '0']],
			container: ['0', `calc(100% - min(${xSlice}px, 50%))`, `calc(100% - min(${ySlice}px, 50%))`, '0'],
		},
		{
			viewbox: [xSlice, 0, width - 2 * xSlice, ySlice],
			element: [['100%', `${ySlice}px`], ['0', '0', 'auto', '0']],
			container: ['0', `${xSlice}px`, `calc(100% - min(${ySlice}px, 50%))`, `${xSlice}px`],
		},
		{
			viewbox: [width - xSlice, 0, xSlice, ySlice],
			element: [[`${xSlice}px`, `${ySlice}px`], ['0', '0', 'auto', 'auto']],
			container: ['0', '0', `calc(100% - min(${ySlice}px, 50%))`, `calc(100% - min(${xSlice}px, 50%))`],
		},
		{
			viewbox: [0, ySlice, xSlice, height - 2 * ySlice],
			element: [[`${xSlice}px`, '100%'], ['0', 'auto', '0', '0']],
			container: [`${ySlice}px`, `calc(100% - min(${xSlice}px, 50%))`, `${ySlice}px`, '0'],
		},
		{
			viewbox: [xSlice, ySlice, width - 2 * xSlice, height - 2 * ySlice],
			element: [['100%', '100%'], ['0', '0', '0', '0']],
			container: [`${ySlice}px`, `${xSlice}px`, `${ySlice}px`, `${xSlice}px`],
		},
		{
			viewbox: [width - xSlice, ySlice, xSlice, height - 2 * ySlice],
			element: [[`${xSlice}px`, '100%'], ['0', '0', '0', 'auto']],
			container: [`${ySlice}px`, '0', `${ySlice}px`, `calc(100% - min(${xSlice}px, 50%))`],
		},
		{
			viewbox: [0, height - ySlice, xSlice, ySlice],
			element: [[`${xSlice}px`, `${ySlice}px`], ['auto', 'auto', '0', '0']],
			container: [`calc(100% - min(${ySlice}px, 50%))`, `calc(100% - min(${xSlice}px, 50%))`, '0', '0'],
		},
		{
			viewbox: [xSlice, height - ySlice, width - 2 * xSlice, ySlice],
			element: [['100%', `${ySlice}px`], ['auto', '0', '0', '0']],
			container: [`calc(100% - min(${ySlice}px, 50%))`, `${xSlice}px`, '0', `${xSlice}px`],
		},
		{
			viewbox: [width - xSlice, height - ySlice, xSlice, ySlice],
			element: [[`${xSlice}px`, `${ySlice}px`], ['auto', '0', '0', 'auto']],
			container: [`calc(100% - min(${ySlice}px, 50%))`, '0', '0', `calc(100% - min(${xSlice}px, 50%))`],
		},
	].map(({
		viewbox: [vbX, vbY, vbW, vbH],
		element: [[eWidth, eHeight], [eTop, eRight, eBottom, eLeft]],
		container: [cTop, cRight, cBottom, cLeft],
	}) => {
		const part = svg.cloneNode(true) as SVGSVGElement;
		part.viewBox.baseVal.x = vbX;
		part.viewBox.baseVal.y = vbY;
		part.viewBox.baseVal.width = vbW;
		part.viewBox.baseVal.height = vbH;
		part.preserveAspectRatio.baseVal.align = SVGPreserveAspectRatio.SVG_PRESERVEASPECTRATIO_NONE;
		part.preserveAspectRatio.baseVal.meetOrSlice = SVGPreserveAspectRatio.SVG_MEETORSLICE_SLICE;
		part.style.display = 'block';
		part.style.position = 'absolute';
		part.style.width = eWidth;
		part.style.height = eHeight;
		part.style.top = eTop;
		part.style.bottom = eBottom;
		part.style.left = eLeft;
		part.style.right = eRight;

		const partContainer = document.createElement('div');
		partContainer.style.position = 'absolute';
		partContainer.style.overflow = 'hidden';
		partContainer.append(part);
		partContainer.style.top = cTop;
		partContainer.style.bottom = cBottom;
		partContainer.style.left = cLeft;
		partContainer.style.right = cRight;
		return partContainer;
	});

	container.style.width = '100%';
	container.style.height = '100%';
	container.style.position = 'relative';
	container.append(...parts);
	svg.style.display = 'none';
};

/**
 * Alter all background boxes so that the backgrounds work for nonstandard dimensions.
 */
export const prepareBackgroundsForScaling = (): void => {
	[
		'ct-saving-throws-box',
		'ct-senses-box',
		'ct-proficiency-groups-box',
		'ct-skills-box',
		'ct-combat__statuses',
		'ct-primary-box',
	]
		.map((box) => document.querySelector(`.${box} .ddbc-box-background .ddbc-svg`))
		.filter((svg): svg is SVGSVGElement => svg instanceof SVGSVGElement)
		.forEach((svg) => prepareBackgroundForScaling(svg));
};
