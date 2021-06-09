import {
	Setting,
	ENABLE_MARKDOWN_NOTES,
	ENABLE_MARKDOWN_EDITOR,
	ENABLE_LAYOUTS,
	ENABLE_ITEM_CONTAINERS,
} from 'src/settings';
import { CONTAINER_CLASS, replaceContainerIfNeeded } from 'src/utils';

import './style.styl';

const INSTANCE_ID = Math.floor(Math.random() * Number.MAX_SAFE_INTEGER).toString();

const addToggle = (container: HTMLElement, setting: Setting<boolean>, label: string, help: string) => {
	const root = document.createElement('div');
	root.classList.add('ct-preferences-pane__field-toggle');
	container.append(root);

	const input = document.createElement('div');
	input.classList.add('ct-preferences-pane__field-input');
	root.append(input);

	const toggle = document.createElement('div');
	toggle.classList.add('ddbc-toggle-field', 'ddbc-toggle-field--is-interactive');
	input.append(toggle);

	const nub = document.createElement('div');
	nub.classList.add('ddbc-toggle-field__nub');
	toggle.append(nub);

	const labelNode = document.createElement('div');
	labelNode.classList.add('ct-preferences-pane__field-label');
	labelNode.textContent = label;
	root.append(labelNode);

	const setToggle = (enabled: boolean) => {
		toggle.classList.remove('ddbc-toggle-field--is-enabled', 'ddbc-toggle-field--is-disabled');
		toggle.classList.add(`ddbc-toggle-field--is-${enabled ? 'enabled' : 'disabled'}`);
	};
	toggle.addEventListener('click', () => {
		const enabled = !setting.get();
		setting.set(enabled);
		setToggle(enabled);
		document.querySelectorAll(`.ct-character-sheet .${CONTAINER_CLASS}`).forEach((node) => node.remove());
	});
	setToggle(setting.get());

	const helpNode = document.createElement('span');
	helpNode.classList.add('ddbc-tooltip');
	helpNode.textContent = '?';
	helpNode.title = help.trim().replace(/\n/gm, ' ');
	root.append(helpNode);
};

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

	const settingsHeader = document.createElement('h5');
	settingsHeader.textContent = 'Settings';
	innerBox.append(settingsHeader);
	innerBox.append('A reload might be required after changing the settings.');

	const settingsBox = document.createElement('div');
	settingsBox.classList.add('ct-preferences-pane__field-toggles', 'beyond-utils-about-box__settings');
	addToggle(settingsBox, ENABLE_MARKDOWN_NOTES, 'Markdown notes', `
		Render the notes as markdown.
	`.replace(/^\t\t/gm, ''));
	addToggle(settingsBox, ENABLE_MARKDOWN_EDITOR, 'Markdown note editor', `
		Use an editor with markdown support (toolbar, previews) instead of the normal editor for fields that support
		markdown.
	`.replace(/^\t\t/gm, ''));
	addToggle(settingsBox, ENABLE_LAYOUTS, 'Extra layouts', `
		Add options for how the main sheet is laid out that make better use of the additional space that might be
		available on some screen sizes/orientations.
	`.replace(/^\t\t/gm, ''));
	addToggle(settingsBox, ENABLE_ITEM_CONTAINERS, 'Item container management', `
		Add the option to mark items as being stored in other items, including proper weight calculations. First go to
		customize on the container and mark it as a container, and then you can go to items and assign them to it. This
		information is stored in the notes, so be aware that the notes might look odd on devices that don't have this
		userscript installed.
	`.replace(/^\t\t/gm, ''));
	innerBox.append(settingsBox);

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
