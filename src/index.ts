import { debounce } from 'lodash';
import { addLayoutButton, prepareBackgroundsForScaling, duplicateSkillHeader } from './layouts';
import { logInfo } from './log';
import { fancifyEditors, markdownifyNotes } from './markdown';

const update = () => {
	markdownifyNotes();
	fancifyEditors();
	prepareBackgroundsForScaling();
	addLayoutButton();
	duplicateSkillHeader();
};

const main = () => {
	const observer = new MutationObserver(debounce(update, 500, { leading: true, trailing: true }));
	observer.observe(document, { subtree: true, childList: true });
	logInfo('[BeyondUtils] Started page observer.');

	update();
};

main();
