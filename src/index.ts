import { debounce } from 'lodash';
import { addAboutButton } from './about';
import { addLayoutButton, prepareBackgroundsForScaling, duplicateSkillHeader } from './layouts';
import { logInfo } from './log';
import { fancifyEditors, markdownifyNotes } from './markdown';
import { initializePopupManager } from './popup';
import { infectStore } from './redux';
import * as settings from './settings';
import { addThemeControls, applyTransparency } from './theme';

import './style.styl';

const update = () => {
	infectStore();
	initializePopupManager();
	addAboutButton();
	if (settings.ENABLE_MARKDOWN_NOTES.get()) {
		markdownifyNotes();
	}
	if (settings.ENABLE_MARKDOWN_EDITOR.get()) {
		fancifyEditors();
	}
	if (settings.ENABLE_LAYOUTS.get()) {
		prepareBackgroundsForScaling();
		addLayoutButton();
		duplicateSkillHeader();
	}
	if (settings.ENABLE_THEME.get()) {
		addThemeControls();
		applyTransparency();
	}
};

const main = () => {
	const observer = new MutationObserver(debounce(update, 500, { leading: true, trailing: true }));
	observer.observe(document, { subtree: true, childList: true });
	logInfo('Started page observer.');

	update();
};

main();
