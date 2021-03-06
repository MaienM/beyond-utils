import { upperFirst } from 'lodash';
import { makePopup, PopupBuilderOptions } from 'src/popup';
import { CURRENT_LAYOUT, LAYOUTS_SWITCHER_COLORS, LAYOUTS_SWITCHER_LABELS } from 'src/settings';
import { replaceContainerIfNeeded } from 'src/utils';
import iconLayoutDefault from './icons/layout-default.svg';
import iconLayoutFocus from './icons/layout-focus.svg';
import iconLayoutStacked from './icons/layout-stacked.svg';
import iconLayoutTall from './icons/layout-tall.svg';
import iconLayoutWide from './icons/layout-wide.svg';

import './style.styl';

const LAYOUTS: [string, SVGSVGElement][] = [
	['default', iconLayoutDefault],
	['tall', iconLayoutTall],
	['wide', iconLayoutWide],
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

const buildPopupContents = ({ root, innerBox, redraw }: PopupBuilderOptions): void => {
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
		redraw();
	});
	controls.append(labelToggle);

	const pickers = document.createElement('div');
	pickers.classList.add('beyond-utils-layout-popup__colorscheme');
	PICKER_COLORSCHEMES.forEach((colors, i) => {
		const picker = document.createElement('div');
		picker.classList.add('beyond-utils-layout-popup__colorscheme-item');
		picker.dataset.active = JSON.stringify(i === LAYOUTS_SWITCHER_COLORS.get());
		colors.forEach(([color]) => {
			const slice = document.createElement('div');
			slice.classList.add('beyond-utils-layout-popup__colorscheme-item-segment');
			slice.style.background = color;
			picker.append(slice);
		});
		picker.addEventListener('click', () => {
			LAYOUTS_SWITCHER_COLORS.set(i);
			redraw();
		});
		pickers.append(picker);
	});
	controls.append(pickers);

	const layouts = document.createElement('div');
	layouts.classList.add('beyond-utils-layout-popup__layout');
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
	container.classList.add('ct-character-header-desktop__group');

	const button = document.createElement('div');
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
