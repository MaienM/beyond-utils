import { debounce } from 'lodash';
import { CONTAINER_CLASS } from 'src/utils';
import { enhanceEquipment } from './equipment';
import { addLayoutButton, prepareBackgroundsForScaling, duplicateSkillHeader } from './layouts';
import { logInfo } from './log';
import { fancifyEditors, markdownifyNotes } from './markdown';

import './style.styl';

const INSTANCE_ID = Math.floor(Math.random() * Number.MAX_SAFE_INTEGER).toString();

/**
 * Add version info to the character manage page.
 */
const addVersionInfo = () => {
	// This doesn't use replaceContainerIfNeeded if for some reason two instances of this script are running this should be visible to the user, so we want to incorporate a unique id into the container element.
	const header = document.querySelector('.ct-character-manage-pane__summary-description');
	if (!header) {
		return;
	}

	const oldContainer = header.querySelector(`:scope > .${CONTAINER_CLASS}[data-instance-id=${JSON.stringify(INSTANCE_ID)}]`);
	if (oldContainer) {
		return;
	}

	const container = document.createElement('div');
	container.classList.add(CONTAINER_CLASS);
	container.dataset.instanceId = INSTANCE_ID;
	container.append(`Beyond Utils v${VERSION}`);
	header.append(container);
};

const update = () => {
	addVersionInfo();
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
