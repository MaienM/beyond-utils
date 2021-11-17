import { debounce, round } from 'lodash';
import {
	getReactInternalState,
	hide,
	remove,
	replaceContainerIfNeeded,
	show,
} from 'src/utils';
import svgOverweight from './icons/overweight.svg';
import { BeyondItem } from './internals';
import { Item, ItemManager } from './Item';

import './style.styl';

const formatWeight = (weight: number): string | Node => {
	if (weight === 0) {
		return '--';
	}

	const root = document.createElement('span');
	root.classList.add('ddbc-weight-number');

	const number = document.createElement('span');
	number.classList.add('ddbc-weight-number__number');
	number.textContent = `${round(weight, 2)}`;

	const label = document.createElement('span');
	label.classList.add('ddbc-weight-number__label');
	label.textContent = 'lb.';

	root.append(number, label);
	return root;
};

const addOverweightNode = (
	container: HTMLElement,
	weight: number,
	maxWeight: number,
	className = 'beyond-utils-equipment__overweight-marker',
): void => {
	if (weight <= maxWeight) {
		return;
	}
	const iconNode = document.createElement('span');
	iconNode.classList.add(className);
	iconNode.title = `Weight of contents (${weight} lb) exceeds maximum weight (${maxWeight}).`;
	iconNode.append(svgOverweight.cloneNode(true));
	container.prepend(iconNode);
};

/**
 * Process the item list to have a single extra item above it displaying the details of the current container.
 */
const processItems = (element: HTMLElement): void => {
	const header = element.parentElement?.parentElement?.querySelector('.ct-content-group__header-content > .ct-equipment__container');
	if (!(header instanceof HTMLElement)) {
		return;
	}
	const containerNode = replaceContainerIfNeeded(header);
	if (!containerNode) {
		return;
	}
	const dispatch = getReactInternalState(element)?.return?.memoizedProps?.dispatch;
	const containerId = getReactInternalState(element)?.return?.memoizedProps?.container?.mappingId;
	if (!dispatch || !containerId) {
		return;
	}

	const weightNode = document.createElement('div');
	weightNode.classList.add('ct-equipment__container-weight', 'ct-inventory-item__weight');
	const quantityNode = document.createElement('div');
	quantityNode.classList.add('ct-equipment__container-quantity', 'ct-inventory-item__quantity');
	const costNode = document.createElement('div');
	costNode.classList.add('ct-equipment__container-cost', 'ct-inventory-item__cost');
	const noteNode = document.createElement('div');
	noteNode.classList.add('ct-equipment__container-notes', 'ct-inventory-item__notes');

	containerNode.classList.add('beyond-utils-equipment-header');
	containerNode.append(weightNode, quantityNode, costNode, noteNode);
	header.append(containerNode);

	if (!(
		weightNode instanceof HTMLElement
		&& quantityNode instanceof HTMLElement
		&& costNode instanceof HTMLElement
	)) {
		return;
	}

	const onChange = debounce(() => {
		const container = ItemManager.getContainerById(containerId);
		const contents = container?.getContents();
		if (!container || !contents) {
			return;
		}

		ItemManager.getItems().forEach((item) => item.registerListeners(
			['weight', 'cost', 'containerSettings', 'contents'],
			`${containerId}::totals-row`,
			onChange,
			false,
		));

		weightNode.textContent = '';
		weightNode.append(formatWeight(contents.weight));

		quantityNode.textContent = contents.count ? `${contents.count}` : '--';
		costNode.textContent = contents.cost ? `${round(contents.cost, 2)}` : '--';

		const maxWeight = container.getContainerSettings()?.maxContainedWeight;
		if (maxWeight) {
			addOverweightNode(weightNode, contents.weight, maxWeight);
		}

		if (noteNode) {
			noteNode.innerHTML = '';
			if (maxWeight) {
				noteNode.append('Max ', formatWeight(maxWeight));
			}
		}
	}, 50);

	ItemManager.getContainerById(containerId)?.registerListeners(
		['containerSettings', 'contents'],
		'active-container-row',
		onChange,
		true,
	);
};

/**
 * Process an item row so that the note segment only shows the actual note text. Also adds a contents section which
 * shows the contents of the container, if the item is marked as one.
 */
const processItemRowNotes = (row: HTMLElement, beyondItem: BeyondItem, item: Item): void => {
	const noteSegment = row.querySelector('.ct-inventory-item__notes .ddbc-note-components');
	const plainParts = noteSegment?.querySelectorAll('.ddbc-note-components__component--plain');
	const plainNode = plainParts
		? Array.from(plainParts).find((node) => node.textContent === beyondItem.notes)
		: null;
	if (!plainNode) {
		return;
	}

	const container = replaceContainerIfNeeded(noteSegment);
	if (!container) {
		return;
	}
	container.classList.add('beyond-utils-equipment__note');

	const separator = document.createElement('span');
	separator.classList.add('beyond-utils-equipment__note-separator');
	separator.textContent = ', ';

	const noteContainer = document.createElement('span');
	const noteNode = plainNode.cloneNode(false);
	noteContainer.classList.add('beyond-utils-equipment__note-item', 'beyond-utils-equipment__note-note');
	noteContainer.append(separator.cloneNode(true), noteNode);
	item.registerListener('note', 'row-note', () => {
		if (item.getNote()) {
			noteNode.textContent = item.getNote();
			show(noteContainer);
		} else {
			hide(noteContainer);
		}
	});

	if (plainNode.previousSibling?.nodeType === Node.TEXT_NODE && plainNode?.previousSibling.textContent?.trim() === ',') {
		plainNode.previousSibling.remove();
	}
	plainNode.remove();
	container.append(noteContainer);
};

/**
 * Process an item row so that it reflects the data in the Item
 * shows the contents of the container, if the item is marked as one.
 */
const processItemRow = (row: HTMLElement): void => {
	const beyondItem: BeyondItem = getReactInternalState(row)?.return?.memoizedProps.item;
	const item = ItemManager.getItem(beyondItem);

	processItemRowNotes(row, beyondItem, item);
};
/**
 * Process the note in the details list in the item pane to only show the note text, not the metadata.
 */
const processItemPaneDetailsNote = (details: HTMLElement, item: Item): void => {
	const labelNodes = Array.from(details.querySelectorAll('.ddbc-property-list__property-label'));

	interface Field {
		root: HTMLElement;
		label: HTMLElement;
		value: HTMLElement;
	}
	const getField = (labelText: string): Field | null => {
		const label = labelNodes.find((node) => node.textContent?.trim() === labelText);
		const value = label?.nextSibling;
		const root = label?.parentElement;
		if (!(label instanceof HTMLElement && value instanceof HTMLElement && root instanceof HTMLElement)) {
			return null;
		}
		return { root, label, value };
	};

	const note = getField('Notes:');
	if (note) {
		const noteContainer = replaceContainerIfNeeded(note.value);
		if (noteContainer) {
			item.registerListener('note', 'details', () => {
				remove(noteContainer?.previousSibling);
				if (item.getNote()) {
					noteContainer.textContent = item.getNote();
					show(note.root);
				} else {
					hide(note.root);
				}
			});
		}
	} else {
		item.unregisterListener('note', 'details');
	}

	const weight = getField('Weight:');
	if (weight) {
		const weightContainer = replaceContainerIfNeeded(weight.value);
		if (weightContainer) {
			item.registerListener('weight', 'details', () => {
				remove(weightContainer.previousSibling);
				weightContainer.innerHTML = '';
				weightContainer.append(formatWeight(item.getOwnWeight()));
			});
		}
	} else {
		item.unregisterListener('weight', 'details');
	}
};
/**
 * Create a checkbox field for in the customize box.
 */
const createCheckbox = (labelText: string): [HTMLElement, HTMLInputElement] => {
	const root = document.createElement('div');
	root.classList.add('ct-value-editor__property--text', 'ct-value-editor__property', 'ct-value-editor__property--block');

	const value = document.createElement('div');
	value.classList.add('ct-value-editor__property-value');

	const input = document.createElement('input');
	input.classList.add('ct-value-editor__property-input');
	input.type = 'checkbox';

	const label = document.createElement('div');
	label.classList.add('ct-value-editor__property-label');
	label.textContent = labelText;
	label.style.flex = '100';

	value.append(input);
	root.append(value, label);

	return [root, input];
};

/**
 * Process the customize collapsible in the item pane to use a replacement field for weight, managed by the Item class.
 */
const processItemPaneCustomizeWeight = (customize: HTMLElement, item: Item): void => {
	const field = customize.querySelector('.ct-value-editor__property--22, .ct-customize-data-editor__property--weight');
	if (!(field instanceof HTMLElement)) {
		return;
	}
	const container = replaceContainerIfNeeded(field);
	if (!container) {
		return;
	}
	field.prepend(container);

	const oldInput = field.querySelector('input') as HTMLInputElement;
	if (!(oldInput instanceof HTMLInputElement)) {
		return;
	}

	const input = oldInput.cloneNode(true) as HTMLInputElement;
	input.value = item.isOwnWeightCustomized() ? `${item.getOwnWeight(item.getBundleSize())}` : '';
	input.addEventListener('change', () => {
		if (input.value) {
			item.setOwnWeight(input.valueAsNumber);
		} else {
			item.clearOwnWeight();
		}
	});

	container.append(input);
	hide(oldInput);
};

/**
 * Process the customize collapsible in the item pane to use a replacement field for notes, managed by the Item class.
 */
const processItemPaneCustomizeNotes = (customize: HTMLElement, item: Item): void => {
	const field = customize.querySelector('.ct-value-editor__property--9, .ct-customize-data-editor__property--notes');
	if (!(field instanceof HTMLElement)) {
		return;
	}
	const container = replaceContainerIfNeeded(field);
	if (!container) {
		return;
	}
	container.classList.add('beyond-utils-item-pane__settings__field-wrapper');
	field.prepend(container);

	const oldInput = field.querySelector('input') as HTMLInputElement;
	if (!(oldInput instanceof HTMLInputElement)) {
		return;
	}

	const input = oldInput.cloneNode(true) as HTMLInputElement;
	input.value = item.getNote() || '';
	input.addEventListener('change', () => {
		item.setNote(input.value || '');
	});

	container.append(input);
	hide(oldInput);
};

/**
 * Process the customize collapsible in the item pane to include controls for the added information.
 */
const processItemPaneCustomizeExtra = (customize: HTMLElement, item: Item): void => {
	const costField = customize.querySelector('.ct-value-editor__property--19, .ct-customize-data-editor__property--cost');
	const container = replaceContainerIfNeeded(customize);
	if (
		!container
		|| !(costField instanceof HTMLElement && costField.querySelector('input') instanceof HTMLInputElement)
		|| !item.isContainer()
	) {
		return;
	}
	container.classList.add('beyond-utils-item-pane__settings');
	customize.querySelector('.ct-remove-button')?.before(container);

	const [countContentWeightRoot, countContentWeight] = createCheckbox('Count weight of contents as carried weight?');
	countContentWeight.checked = !item.getContainerSettings()?.ignoreContainedWeight;
	countContentWeight.addEventListener('change', () => {
		item.setContainerSettings({ ignoreContainedWeight: !countContentWeight.checked });
	});

	const maxWeightField = costField.cloneNode(true) as HTMLElement;
	maxWeightField.classList.remove('ct-value-editor__property--19', 'ct-customize-data-editor__property--cost');
	maxWeightField.classList.add('beyond-utils-item-pane__settings__weight-field');

	const maxWeightLabel = maxWeightField.querySelector('.ct-value-editor__property-label, .ct-customize-data-editor__property-label');
	maxWeightLabel?.firstChild?.remove();
	maxWeightLabel?.append('Max Contained Weight');

	const maxWeightInput = maxWeightField.querySelector('input') as HTMLInputElement;
	maxWeightInput.value = `${item.getContainerSettings()?.maxContainedWeight}` || '';
	maxWeightInput.addEventListener('change', () => {
		if (maxWeightInput.value) {
			item.setContainerSettings({ maxContainedWeight: maxWeightInput.valueAsNumber });
		} else {
			item.setContainerSettings({ maxContainedWeight: undefined });
		}
	});

	container.append(countContentWeightRoot, maxWeightField);

	customize.querySelector('.ct-button__confirming')?.addEventListener('click', () => {
		container.remove();
	});
};

/**
 * Process the customize collapsible in the item pane to watch for changes in fields for custom items.
 */
const processItemPaneCustomizeCustomItemFields = (customize: HTMLElement, item: Item): void => {
	const nameNode = customize.querySelector('.ct-customize-data-editor__property--name input');
	if (nameNode instanceof HTMLInputElement) {
		nameNode.addEventListener('blur', () => {
			item.setName(nameNode.value);
		});
	}

	const descriptionNode = customize.querySelector('.ct-customize-data-editor__property--description textarea');
	if (descriptionNode instanceof HTMLInputElement) {
		descriptionNode.addEventListener('blur', () => {
			item.setDescription(descriptionNode.value);
		});
	}
};

/**
 * Process the customize collapsible in the item pane to include controls for the added information.
 */
const processItemPaneCustomize = (customize: HTMLElement, item: Item): void => {
	processItemPaneCustomizeWeight(customize, item);
	processItemPaneCustomizeNotes(customize, item);
	processItemPaneCustomizeExtra(customize, item);
	processItemPaneCustomizeCustomItemFields(customize, item);
};

/**
 * Process a pane that is being used to view/edit an item.
 */
const processItemPane = (pane: HTMLElement): void => {
	const detailNode = pane.querySelector('.ct-item-detail');
	if (!(detailNode instanceof HTMLElement)) {
		return;
	}
	const item = ItemManager.getItem(getReactInternalState(detailNode)?.return?.memoizedProps.item);

	const details = pane.querySelector('.ddbc-property-list');
	if (details instanceof HTMLElement) {
		processItemPaneDetailsNote(details, item);
	}

	const customize = pane.querySelector('.ct-editor-box');
	if (customize instanceof HTMLElement) {
		processItemPaneCustomize(customize, item);
	}
};

/**
 * Enhance the containers to provide information about their total stats (such as weight).
 */
export const enhanceEquipment = (): void => {
	Array.from(document.getElementsByClassName('ct-inventory'))
		.filter((elem): elem is HTMLElement => elem instanceof HTMLElement)
		.forEach((elem) => processItems(elem));
	Array.from(document.querySelectorAll('.ct-inventory__items .ct-inventory-item'))
		.filter((elem): elem is HTMLElement => elem instanceof HTMLElement)
		.forEach((elem) => processItemRow(elem));
	Array.from(document.querySelectorAll('.ct-item-pane, .ct-custom-item-pane, .ct-container-pane'))
		.filter((elem): elem is HTMLElement => elem instanceof HTMLElement)
		.forEach((elem) => processItemPane(elem));
};
