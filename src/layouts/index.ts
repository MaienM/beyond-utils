import { upperFirst } from 'lodash';
import { makePopup } from 'src/popup';
import { CURRENT_LAYOUT, LAYOUTS_SWITCHER_COLORS, LAYOUTS_SWITCHER_LABELS } from 'src/settings';
import { replaceContainerIfNeeded } from 'src/utils';
import iconLayoutDefault from './icons/layout-default.svg';
import iconLayoutFocus from './icons/layout-focus.svg';
import iconLayoutStacked from './icons/layout-stacked.svg';
import iconLayoutTallStacked from './icons/layout-tall-stacked.svg';
import iconLayoutTall from './icons/layout-tall.svg';

import './style.styl';

const LAYOUTS: [string, SVGSVGElement][] = [
	['default', iconLayoutDefault],
	['tall', iconLayoutTall],
	['tall-stacked', iconLayoutTallStacked],
	['stacked', iconLayoutStacked],
	['focus', iconLayoutFocus],
];

const LAYOUT_AREAS = {
	'saving-throws': ['1', 'Saving Throws'],
	senses: ['2', 'Senses'],
	proficiencies: ['3', 'Proficiencies'],
	skills: ['4', 'Skills'],
	combat: ['5', 'Combat'],
	'primary-box': ['6', 'Actions, Spells, Equipment, etc'],
};

const PICKER_COLORSCHEMES = [
	[
		['white', 'black'],
		['white', 'black'],
		['white', 'black'],
		['white', 'black'],
		['white', 'black'],
		['white', 'black'],
	],
	[
		['#F3DBCE', 'black'],
		['#FFCDB2', 'black'],
		['#FFB4A2', 'black'],
		['#E5989B', 'black'],
		['#B5838D', 'white'],
		['#6D6875', 'white'],
	],
	[
		['#264653', 'white'],
		['#287271', 'white'],
		['#2A9D8F', 'white'],
		['#E9C46A', 'black'],
		['#F4A261', 'black'],
		['#E76F51', 'white'],
	],
	[
		['#006D77', 'white'],
		['#42999B', 'white'],
		['#83C5BE', 'black'],
		['#EDF6F9', 'black'],
		['#FFDDD2', 'black'],
		['#E29578', 'black'],
	],
	[
		['#EF476F', 'white'],
		['#F78C6B', 'black'],
		['#FFD166', 'black'],
		['#06D6A0', 'white'],
		['#118AB2', 'white'],
		['#073B4C', 'white'],
	],
];

const buildPopupContents = (root: HTMLElement, innerBox: HTMLElement): void => {
	const colorscheme = PICKER_COLORSCHEMES[LAYOUTS_SWITCHER_COLORS.get()] || PICKER_COLORSCHEMES[0];
	const container = document.createElement('div');

	innerBox.addEventListener('click', () => {
		root.remove();
	});

	const controls = document.createElement('div');
	controls.classList.add('beyond-utils-layout-popup__controls');
	controls.addEventListener('click', (e) => {
		e.stopPropagation();
	});
	container.append(controls);

	const labelToggle = document.createElement('div');
	labelToggle.classList.add('beyond-utils-layout-popup__toggle');
	labelToggle.dataset.enabled = JSON.stringify(LAYOUTS_SWITCHER_LABELS.get());
	labelToggle.textContent = 'Labels';
	labelToggle.addEventListener('click', () => {
		LAYOUTS_SWITCHER_LABELS.set(!LAYOUTS_SWITCHER_LABELS.get());
		buildPopupContents(root, innerBox);
	});
	controls.append(labelToggle);

	const pickers = document.createElement('div');
	pickers.classList.add('beyond-utils-layout-popup__colorschemes');
	PICKER_COLORSCHEMES.forEach((colors, i) => {
		const picker = document.createElement('div');
		picker.classList.add('beyond-utils-layout-popup__colorscheme');
		picker.dataset.active = JSON.stringify(i === LAYOUTS_SWITCHER_COLORS.get());
		colors.forEach(([color]) => {
			const slice = document.createElement('div');
			slice.classList.add('beyond-utils-layout-popup__colorscheme-segment');
			slice.style.background = color;
			picker.append(slice);
		});
		picker.addEventListener('click', () => {
			LAYOUTS_SWITCHER_COLORS.set(i);
			buildPopupContents(root, innerBox);
		});
		pickers.append(picker);
	});
	controls.append(pickers);

	const layouts = document.createElement('div');
	layouts.classList.add('beyond-utils-layout-popup__layouts');
	LAYOUTS.forEach(([layout, svg]) => {
		const button = document.createElement('div');
		button.classList.add('beyond-utils-layout-popup__layout-button');
		button.dataset.layout = layout;
		button.dataset.name = upperFirst(layout);
		button.append(svg.cloneNode(true));
		Object.entries(LAYOUT_AREAS).forEach(([name, [label, title]], i) => {
			const color = colorscheme[i];
			const rect = button.querySelector(`svg rect[data-name=${name}]`) as SVGRectElement;
			if (!rect) {
				return;
			}
			rect.setAttribute('fill', color[0]);

			if (LAYOUTS_SWITCHER_LABELS.get()) {
				const labelNode = document.createElementNS('http://www.w3.org/2000/svg', 'text');
				labelNode.setAttribute('x', `${rect.x.baseVal.value + rect.width.baseVal.value / 2}`);
				labelNode.setAttribute('y', `${rect.y.baseVal.value + rect.height.baseVal.value / 2}`);
				labelNode.setAttribute('text-anchor', 'middle');
				labelNode.setAttribute('dominant-baseline', 'central');
				labelNode.setAttribute('fill', color[1]);
				labelNode.textContent = label;
				rect.after(labelNode);
			}

			const titleNode = document.createElementNS('http://www.w3.org/2000/svg', 'title');
			titleNode.textContent = title;
			rect.append(titleNode);
		});
		button.addEventListener('click', () => {
			document.body.dataset.layout = layout;
			CURRENT_LAYOUT.set(layout);
			root.remove();
		});
		layouts.append(button);
	});
	container.append(layouts);

	innerBox.innerHTML = '';
	innerBox.append(container);
};

/**
 * Inject the layout toggle button into the page.
 */
export const addLayoutButton = (): void => {
	const container = replaceContainerIfNeeded(document.querySelector('.ct-character-header-desktop'));
	if (!container) {
		return;
	}
	container.classList.add('ct-character-header-desktop__group', 'ct-character-header-desktop__group--beyond-utils');

	const button = document.createElement('div');
	button.id = 'utils-layout-button';
	button.addEventListener('click', () => {
		makePopup('beyond-utils-layout-popup', buildPopupContents);
	});
	LAYOUTS.forEach(([layout, svg]) => {
		const icon = document.createElement('div');
		icon.classList.add('beyond-utils-layout-button');
		icon.dataset.layout = layout;
		icon.append(svg.cloneNode(true));
		button.append(icon);
	});
	container.append(button);

	const layout = CURRENT_LAYOUT.get();
	document.body.dataset.layout = layout;

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
