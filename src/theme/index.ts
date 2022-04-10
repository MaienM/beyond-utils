import Color from 'color';
import { isEqual } from 'lodash';
import { addPatch } from 'src/redux';
import { ENABLE_THEME, THEME_FORCE, THEME_TRANSPARENCY } from 'src/settings';

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
