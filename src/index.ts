import { debounce } from 'lodash';
import { addAboutButton } from './about';
import { enhanceEquipment } from './equipment';
import { addLayoutButton, prepareBackgroundsForScaling, duplicateSkillHeader } from './layouts';
import { logInfo } from './log';
import { fancifyEditors, markdownifyNotes } from './markdown';
import * as settings from './settings';

import './style.styl';

const update = () => {
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
	if (settings.ENABLE_ITEM_CONTAINERS.get()) {
		enhanceEquipment();
	}
};

const main = () => {
	const observer = new MutationObserver(debounce(update, 500, { leading: true, trailing: true }));
	observer.observe(document, { subtree: true, childList: true });
	logInfo('Started page observer.');

	update();
};

main();
