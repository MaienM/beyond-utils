import Color from 'color';
import { range, isEqual } from 'lodash';
import { addPatch } from 'src/redux';
import { ENABLE_THEME, THEME_FORCE, THEME_TRANSPARENCY } from 'src/settings';
import { replaceContainerIfNeeded } from 'src/utils';

import './style.styl';

addPatch((state, prevState) => {
	if (!ENABLE_THEME.get()) {
		return state;
	}

	let enableDarkMode: boolean | undefined;
	switch (THEME_FORCE.get()) {
		case 'light':
			enableDarkMode = false;
			break;
		case 'dark':
			enableDarkMode = true;
			break;
		default:
			return state;
	}

	let preferences = {
		...state.character.preferences,
		enableDarkMode,
	};
	if (isEqual(preferences, prevState?.character?.preferences)) {
		// This prevents creating a "new" preferences object that is identical to the old one, which results in an infinite loop in one of the D&D Beyond components.
		preferences = prevState?.character?.preferences;
	}

	return {
		...state,
		character: {
			...state.character,
			preferences,
		},
	};
});

// All these selectors MUST be written in such a way that they are only a single selector, since some additional selectors are added onto the end when using them (and if there were multiple selectors only the last would use this addition).
const SELECTOR_SVG_BACKGROUND_ELEMENTS = '.ddbc-box-background svg :is([fill="#FEFEFE"], [fill="#10161ADB"], [data-transparancy])';
const SELECTOR_SVG_BACKGROUND_STRIP = '.ct-mobile-divider svg [fill="#FEFEFE"]';
const SELECTOR_CSS_BACKGROUND_ELEMENTS = ':is(.ct-tablet-box__inner, .ct-combat-tablet__cta-button, .ddbc-campaign-summary)';

/**
 * Apply the chosen transparancy.
 */
export const applyTransparency = (): void => {
	const transparancy = THEME_TRANSPARENCY.get();
	const alpha = transparancy ? 1 - transparancy / 100 : 1;

	// SVG backgrounds (mostly desktop).
	if (transparancy === null) {
		document.querySelectorAll(`${SELECTOR_SVG_BACKGROUND_ELEMENTS}[data-transparancy]`).forEach((path) => {
			if (!(path instanceof SVGElement)) {
				return;
			}
			delete path.dataset.transparancy;
			if (typeof path.dataset.fillOrig === 'string') {
				path.setAttribute('fill', path.dataset.fillOrig);
			}
		});
	} else {
		document.querySelectorAll(`${SELECTOR_SVG_BACKGROUND_ELEMENTS}:not([data-transparancy="${transparancy}"])`).forEach((path) => {
			if (!(path instanceof SVGElement)) {
				return;
			}
			path.dataset.transparancy = transparancy.toString();
			const fill = path.getAttribute('fill');
			if (fill) {
				if (path.dataset.fillOrig === undefined) {
					path.dataset.fillOrig = fill;
				}
				path.setAttribute('fill', new Color(fill).alpha(alpha).string());
			}
		});
	}

	// CSS backgrounds (tablet mode).
	if (transparancy === null) {
		document.querySelectorAll(`${SELECTOR_CSS_BACKGROUND_ELEMENTS}[data-transparancy]`).forEach((div) => {
			if (!(div instanceof HTMLElement)) {
				return;
			}
			delete div.dataset.transparancy;
			if (typeof div.dataset.backgroundOrig === 'string') {
				div.style.backgroundColor = div.dataset.backgroundOrig;
			}
		});
	} else {
		document.querySelectorAll(`${SELECTOR_CSS_BACKGROUND_ELEMENTS}:not([data-transparancy="${transparancy}"])`).forEach((div) => {
			if (!(div instanceof HTMLElement)) {
				return;
			}
			div.dataset.transparancy = transparancy.toString();
			const { backgroundColor } = window.getComputedStyle(div);
			if (backgroundColor) {
				if (div.dataset.backgroundOrig === undefined) {
					div.dataset.backgroundOrig = backgroundColor;
				}
				div.style.backgroundColor = new Color(backgroundColor).alpha(alpha).string();
			}
		});
	}

	// Strip SVG backgrounds (the top and bottom edge of some tablet mode pages in light mode). The color of these is redundant since they are all also already managed with css.
	document.querySelectorAll(SELECTOR_SVG_BACKGROUND_STRIP).forEach((path) => {
		if (!(path instanceof SVGElement)) {
			return;
		}
		path.setAttribute('fill', 'none');
	});
};

/**
 * Add controls for the theme settings to the character management sidebar.
 */
export const addThemeControls = (): void => {
	const underdarkToggleContainer = document.querySelector('.ct-cta-preference-manager__primary');
	const container = replaceContainerIfNeeded(underdarkToggleContainer);
	if (!container) {
		return;
	}
	container.classList.add('beyond-utils-theme-settings');
	container.addEventListener('click', (e) => e.stopPropagation());

	container.append('Local override');

	const forceDropdown = document.createElement('select');
	const forceDropdownOptions: [unknown, string][] = [
		[null, '-'],
		['light', 'Light'],
		['dark', 'Underdark'],
	]; // as [string | null, string][]
	forceDropdownOptions.forEach(([value, label]) => {
		const option = document.createElement('option');
		option.value = JSON.stringify(value);
		option.textContent = label;
		forceDropdown.appendChild(option);
	});
	forceDropdown.addEventListener('change', () => {
		THEME_FORCE.set(JSON.parse(forceDropdown.value));
	});
	forceDropdown.value = JSON.stringify(THEME_FORCE.get());
	container.appendChild(forceDropdown);

	container.append('Transparancy');

	const transparancy = document.createElement('select');
	const transparancyOptions: [unknown, string][] = [
		[null, 'Default'],
		...range(0, 100, 5).map((n): [number, string] => [n, `${n}%`]),
	];
	transparancyOptions.forEach(([value, label]) => {
		const option = document.createElement('option');
		option.value = JSON.stringify(value);
		option.textContent = label;
		transparancy.appendChild(option);
		applyTransparency();
	});
	transparancy.addEventListener('change', () => {
		THEME_TRANSPARENCY.set(JSON.parse(transparancy.value));
	});
	transparancy.value = JSON.stringify(THEME_TRANSPARENCY.get());
	container.appendChild(transparancy);
};
