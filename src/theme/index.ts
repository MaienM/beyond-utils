import { range } from 'lodash';
import { addPatch } from 'src/redux';
import { ENABLE_THEME, THEME_FORCE, THEME_TRANSPARENCY } from 'src/settings';
import { replaceContainerIfNeeded } from 'src/utils';

import './style.styl';

addPatch((state) => {
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
	return {
		...state,
		character: {
			...state.character,
			preferences: {
				...state.character.preferences,
				enableDarkMode,
			},
		},
	};
});

const SELECTOR_SVG_BACKGROUND_ELEMENTS = '.ddbc-box-background svg :is([fill="#FEFEFE"], [fill="#10161ADB"])';

/**
 * Apply the chosen transparancy.
 */
export const applyTransparency = (): void => {
	const transparancy = THEME_TRANSPARENCY.get();
	if (transparancy === null) {
		document.querySelectorAll(`${SELECTOR_SVG_BACKGROUND_ELEMENTS}[opacity]`).forEach((path) => {
			if (!(path instanceof SVGElement)) {
				return;
			}
			if (typeof path.dataset.fillOrig === 'string') {
				path.setAttribute('fill', path.dataset.fillOrig);
			}
			path.removeAttribute('opacity');
		});
	} else {
		const opacity = 1 - (transparancy / 100);
		document.querySelectorAll(`${SELECTOR_SVG_BACKGROUND_ELEMENTS}:not([opacity="${opacity}"])`).forEach((path) => {
			if (!(path instanceof SVGElement)) {
				return;
			}
			const fill = path.getAttribute('fill');
			if (fill?.length === 5) {
				path.dataset.fillOrig = fill;
				path.setAttribute('fill', fill.slice(0, 4));
			} else if (fill?.length === 9) {
				path.dataset.fillOrig = fill;
				path.setAttribute('fill', fill.slice(0, 7));
			}
			path.setAttribute('opacity', opacity.toString());
		});
	}
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
