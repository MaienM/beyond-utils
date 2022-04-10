import { range } from 'lodash';
import { makePopup, PopupBuilderOptions } from 'src/popup';
import {
	ENABLE_LAYOUTS,
	ENABLE_MARKDOWN_EDITOR,
	ENABLE_MARKDOWN_NOTES,
	ENABLE_STICKY_HEADERS,
	ENABLE_THEME,
	THEME_FORCE,
	THEME_TRANSPARENCY,
	Setting,
} from 'src/settings';
import { CONTAINER_CLASS } from 'src/utils';

import './style.styl';

const INSTANCE_ID = Math.floor(Math.random() * Number.MAX_SAFE_INTEGER).toString();

const addToggle = (
	container: HTMLElement,
	setting: Setting<boolean>,
	controlIsEnabled: boolean,
	label: string,
	help: string,
	onToggle: (enabled: boolean) => void = () => null,
) => {
	const root = document.createElement('div');
	root.classList.add('ct-preferences-pane__field-toggle');
	if (!controlIsEnabled) {
		root.classList.add('ct-preferences-pane__field-toggle--disabled');
	}
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
	setToggle(setting.get());
	if (controlIsEnabled) {
		toggle.addEventListener('click', () => {
			const enabled = !setting.get();
			setting.set(enabled);
			setToggle(enabled);
			document.querySelectorAll(`.ct-character-sheet :not(.beyond-utils-popup__box-background) > .${CONTAINER_CLASS}`).forEach((node) => node.remove());
			onToggle(enabled);
		});
	}

	const helpNode = document.createElement('p');
	helpNode.innerHTML = help.trim().replace(/^\t\t/gm, '').replace(/\n/gm, ' ');
	container.append(helpNode);
};

const addOption = <T extends string | number | null>(
	container: HTMLElement,
	setting: Setting<T>,
	controlIsEnabled: boolean,
	options: [T, string][],
) => {
	const root = document.createElement('div');
	root.classList.add('ct-preferences-pane__field-input');
	container.append(root);

	const select = document.createElement('select');
	select.classList.add('ddbc-select');
	select.disabled = !controlIsEnabled;
	root.append(select);

	select.addEventListener('change', () => {
		const value = JSON.parse(select.value);
		setting.set(value);
		document.querySelectorAll(`.ct-character-sheet :not(.beyond-utils-popup__box-background) > .${CONTAINER_CLASS}`).forEach((node) => node.remove());
	});

	options.forEach(([optionValue, optionLabel]) => {
		const option = document.createElement('option');
		option.value = JSON.stringify(optionValue);
		option.textContent = optionLabel;
		select.appendChild(option);
	});
	select.value = JSON.stringify(setting.get());
};

const buildAboutContents = ({ innerBox, redraw }: PopupBuilderOptions) => {
	const header = document.createElement('h2');
	header.textContent = 'beyond-utils';
	innerBox.append(header);

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

	const infoBox = document.createElement('dl');
	infoBox.append(versionInfo, repoInfo, sourceInfo);
	innerBox.append(infoBox);

	const settingsHeader = document.createElement('h5');
	settingsHeader.textContent = 'Settings';
	innerBox.append(settingsHeader);
	innerBox.append('A reload might be required after changing the settings.');

	const settingsBox = document.createElement('div');
	settingsBox.classList.add('ct-preferences-pane__field-toggles', 'beyond-utils-about-box__settings');
	addToggle(settingsBox, ENABLE_MARKDOWN_NOTES, true, 'Markdown notes', `
		Render the notes as markdown.
	`, redraw);
	addToggle(settingsBox, ENABLE_MARKDOWN_EDITOR, ENABLE_MARKDOWN_NOTES.get(), 'Markdown note editor', `
		Use an editor with markdown support (toolbar, previews) instead of the normal editor for fields that support
		markdown.
	`);
	addToggle(settingsBox, ENABLE_STICKY_HEADERS, true, 'Sticky headers', `
		Make the headers in the inventory tab sticky so that it is always visible what the columns are and what container
		the items are in.
	`);
	addToggle(settingsBox, ENABLE_LAYOUTS, true, 'Extra layouts', `
		Add options for how the main sheet is laid out that make better use of the additional space that might be
		available on some screen sizes/orientations.
	`);
	addToggle(settingsBox, ENABLE_THEME, true, 'Theme customizations', `
		Allows locally choosing whether to use underdark mode without changing the server-side per-character setting.
		Also allows tweaking the amount of transparency the backgrounds have in both the normal and the underdark theme.
	`, redraw);
	addOption(settingsBox, THEME_FORCE, ENABLE_THEME.get(), [
		[null, "Use character's chosen mode"],
		['light', 'Always use light mode'],
		['dark', 'Always use underdark mode'],
	]);
	addOption(settingsBox, THEME_TRANSPARENCY, ENABLE_THEME.get(), [
		[null, 'Use default transparency for the chosen mode'],
		...range(0, 101, 5).map((n: number): [number, string] => [n, `Use ${n}% transparency`]),
	]);
	innerBox.append(settingsBox);
};

/**
 * Add utils button to character manage pane.
 */
export const addAboutButton = (): void => {
	// This doesn't use replaceContainerIfNeeded because if for some reason two instances of this script are running this should be visible to the user, so we want to incorporate a unique id into the container element.
	const menu = document.querySelector('.ct-character-manage-pane__intro');
	if (!menu) {
		return;
	}

	const oldContainer = menu.querySelector(`:scope > .${CONTAINER_CLASS}[data-instance-id=${JSON.stringify(INSTANCE_ID)}]`);
	if (oldContainer) {
		return;
	}

	const container = document.createElement('div');
	container.classList.add(CONTAINER_CLASS, 'ct-character-manage-pane__feature-callout');
	container.dataset.instanceId = INSTANCE_ID;

	const button = document.createElement('div');
	button.classList.add('ct-character-header-desktop__button', 'ct-character-manage-pane__decorate-button');
	button.addEventListener('click', () => {
		makePopup('beyond-utils-about-box', buildAboutContents);
	});

	const icon = document.createElement('div');
	icon.classList.add('ct-character-header-desktop__button-icon');

	const label = document.createElement('div');
	label.classList.add('ct-character-header-desktop__button-label');
	label.append(`Beyond Utils v${VERSION}`);

	button.append(icon, label);
	container.append(button);
	menu.append(container);
};
