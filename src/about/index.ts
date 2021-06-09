import { CONTAINER_CLASS, replaceContainerIfNeeded } from 'src/utils';

import './style.styl';

const INSTANCE_ID = Math.floor(Math.random() * Number.MAX_SAFE_INTEGER).toString();

const showAbout = () => {
	const container = replaceContainerIfNeeded(document.getElementById('ddbcc-popup-container'));
	if (!container) {
		return;
	}
	container.classList.add('beyond-utils-about-box');

	const shadow = document.createElement('div');
	shadow.classList.add('beyond-utils-about-box__shadow');
	shadow.addEventListener('click', (e) => {
		e.stopPropagation();
		container.remove();
	});
	container.append(shadow);

	const box = document.createElement('div');
	box.classList.add('beyond-utils-about-box__box');
	box.addEventListener('click', (e) => {
		e.stopPropagation();
	});
	container.append(box);

	const background = document.querySelector('.ct-primary-box > .ddbc-box-background')?.cloneNode(true) || '';
	box.append(background);

	const innerBox = document.createElement('div');
	innerBox.classList.add('beyond-utils-about-box__inner-box');
	box.append(innerBox);

	const header = document.createElement('h2');
	header.textContent = 'beyond-utils';
	innerBox.append(header);
	const infoBox = document.createElement('dl');
	const versionInfo = document.createElement('dt');
	const versionLabel = document.createElement('strong');
	versionLabel.append('Version:');
	versionInfo.append(versionLabel, VERSION);
	const repoInfo = document.createElement('dt');
	const repoLink = document.createElement('a');
	repoLink.classList.add('beyond-utils-about-box__link');
	repoLink.href = REPO_URL;
	repoLink.append('Repository');
	repoInfo.append(repoLink);
	const sourceInfo = document.createElement('dt');
	const sourceLink = document.createElement('a');
	sourceLink.classList.add('beyond-utils-about-box__link');
	sourceLink.href = SOURCE_URL;
	sourceLink.append('Install link');
	sourceInfo.append(sourceLink);
	infoBox.append(versionInfo, repoInfo, sourceInfo);
	innerBox.append(infoBox);

	const creditsHeader = document.createElement('h5');
	creditsHeader.textContent = 'Credits';
	innerBox.append(creditsHeader);

	const creditsText = document.createElement('div');
	creditsText.innerHTML = 'Icons made by <a href="https://www.freepik.com" title="Freepik" class="beyond-utils-about-box__link">Freepik</a> from <a href="https://www.flaticon.com/" title="Flaticon" class="beyond-utils-about-box__link">www.flaticon.com</a>.';
	innerBox.append(creditsText);
};

/**
 * Add utils button to character manage pane.
 */
export const addAboutButton = (): void => {
	// This doesn't use replaceContainerIfNeeded if for some reason two instances of this script are running this should be visible to the user, so we want to incorporate a unique id into the container element.
	const menu = document.querySelector('.ct-character-manage-pane .ct-pane-menu');
	if (!menu) {
		return;
	}

	const oldContainer = menu.querySelector(`:scope > .${CONTAINER_CLASS}[data-instance-id=${JSON.stringify(INSTANCE_ID)}]`);
	if (oldContainer) {
		return;
	}

	const container = document.createElement('div');
	container.classList.add(CONTAINER_CLASS, 'ct-pane-menu__item');
	container.dataset.instanceId = INSTANCE_ID;
	container.addEventListener('click', showAbout);

	const prefix = document.createElement('div');
	prefix.classList.add('ct-pane-menu__item-prefix');

	const label = document.createElement('div');
	label.classList.add('ct-pane-menu__item-label');
	label.append(`Beyond Utils v${VERSION}`);

	const suffix = document.createElement('div');
	suffix.classList.add('ct-pane-menu__item-suffix');

	container.append(prefix, label, suffix);
	menu.append(container);
};
