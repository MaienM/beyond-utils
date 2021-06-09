import { debounce } from 'lodash';
import { addAboutButton } from './about';
import { enhanceEquipment } from './equipment';
import { addLayoutButton, prepareBackgroundsForScaling, duplicateSkillHeader } from './layouts';
import { logInfo } from './log';
import { fancifyEditors, markdownifyNotes } from './markdown';

import './style.styl';

const update = () => {
	addAboutButton();
	markdownifyNotes();
	fancifyEditors();
	prepareBackgroundsForScaling();
	addLayoutButton();
	duplicateSkillHeader();
	enhanceEquipment();
};

const main = () => {
	const observer = new MutationObserver(debounce(update, 500, { leading: true, trailing: true }));
	observer.observe(document, { subtree: true, childList: true });
	logInfo('Started page observer.');

	update();
};

main();
