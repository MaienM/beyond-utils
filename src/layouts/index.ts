import { upperFirst } from 'lodash';
import { replaceContainerIfNeeded } from 'src/utils';
import iconLayoutDefault from './icons/layout-default.svg';
import iconLayoutFocus from './icons/layout-focus.svg';
import iconLayoutStacked from './icons/layout-stacked.svg';
import iconLayoutTall from './icons/layout-tall.svg';

import './style.styl';

const LAYOUTS: [string, SVGSVGElement][] = [
	['default', iconLayoutDefault],
	['tall', iconLayoutTall],
	['stacked', iconLayoutStacked],
	['focus', iconLayoutFocus],
];

/**
 * Inject the layout toggle button into the page.
 */
export const addLayoutButton = (): void => {
	const sheet = document.getElementsByClassName('ct-character-sheet')[0];
	if (!sheet || !(sheet instanceof HTMLElement)) {
		return;
	}
	const container = replaceContainerIfNeeded(document.querySelector('.ct-character-header-desktop'));
	if (!container) {
		return;
	}
	container.classList.add('ct-character-header-desktop__group', 'ct-character-header-desktop__group--beyond-utils');

	const button = document.createElement('div');
	button.id = 'utils-layout-button';
	container.append(button);

	const icons = LAYOUTS.map(([layout, svg]) => {
		const icon = document.createElement('div');
		icon.classList.add('layout-button');
		icon.title = upperFirst(layout);
		icon.dataset.layout = layout;
		icon.addEventListener('click', () => {
			sheet.dataset.layout = layout;
			localStorage.setItem('dndbeyond-utils-layout', layout);
		});
		icon.append(svg);
		return icon;
	});
	button.append(...icons);

	const layout = localStorage.getItem('dndbeyond-utils-layout') || LAYOUTS[0][0];
	sheet.dataset.layout = layout;

	document.querySelector('.ct-character-header-desktop__group--builder')?.before(container);
};

/**
 * Alter a background box so that the background works for nonstandard dimensions.
 *
 * By default all background SVGs are a single SVG, which causes them to look stretched/squished if the box is resized. To fix this we cut the SVG into 9 areas: the 4 corners (which will not scale), the 4 borders (which will stretch in a single direction), and the center (which will stretch in both directions).
 *
 * @param svg The svg to make scale properly.
 */
const prepareBackgroundForScaling = (svg: SVGSVGElement): void => {
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

/**
 * Duplicate the skill list's header.
 *
 * Some layouts diplay the skill list in two columns, and for those we need a copy of the header for the second column.
 */
export const duplicateSkillHeader = (): void => {
	if (document.getElementById('ct-skills-headers')) {
		return;
	}

	const header = document.getElementsByClassName('ct-skills__header')[0];
	if (!header) {
		return;
	}

	const headers = document.createElement('div');
	headers.id = 'ct-skills-headers';
	headers.classList.add('ct-skills__headers');
	headers.append(header.cloneNode(true));
	headers.append(header.cloneNode(true));
	header.outerHTML = headers.outerHTML;
};
