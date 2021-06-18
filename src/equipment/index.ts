import {
	isEmpty,
	pull,
	pullAll,
	sortBy,
	round,
} from 'lodash';
import {
	getReactInternalState,
	hide,
	remove,
	replaceContainerIfNeeded,
	show,
} from 'src/utils';
import { ICONS, ICON_ON_PERSON, ICON_UNKNOWN } from './icons';
import svgOverweight from './icons/overweight.svg';
import { BeyondItem } from './internals';
import { ContainerItem, Item, ItemManager } from './Item';

import './style.styl';

const CONTAINER_ID_NONE = -2;
const CONTAINER_ID_ON_PERSON = -1;

class InventoryContainerManager {
	private static containerId: number = CONTAINER_ID_NONE;

	private static listeners: Record<string, () => void> = {};

	static getContainerId(): number {
		return this.containerId;
	}

	static setContainerId(containerId: number): void {
		if (containerId === this.containerId) {
			return;
		}
		this.containerId = containerId;
		Object.values(this.listeners).forEach((handler) => handler());
	}

	static registerListener(key: string, handler: () => void): void {
		this.listeners[key] = handler;
	}
}

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
 * Process the headers so that each container is available as a filter.
 */
const processHeaders = (equipmentContainer: HTMLElement, headerContainer: HTMLElement): void => {
	const HEADER_CLASS_ACTIVE = 'beyond-utils-equipment__header-item--is-active';
	const DDBC_HEADER_CLASS_ACTIVE = 'ddbc-tab-options__header--is-active';
	const DDBC_HEADING_CLASS_ACTIVE = 'ddbc-tab-options__header-heading--is-active';
	const updateActive = () => {
		headerContainer.querySelectorAll('.ddbc-tab-options__header').forEach((header) => {
			if (!(header instanceof HTMLElement && header.firstChild instanceof HTMLElement)) {
				return;
			}

			InventoryContainerManager
				.setContainerId(parseInt(equipmentContainer.dataset.activeContainer || `${CONTAINER_ID_NONE}`, 10));
			if (header.dataset.containerId || equipmentContainer.dataset.activeContainer) {
				const isActive = header.dataset.containerId === equipmentContainer.dataset.activeContainer;
				header.classList.toggle(HEADER_CLASS_ACTIVE, isActive);
				header.classList.toggle(DDBC_HEADER_CLASS_ACTIVE, isActive);
				header.firstChild.classList.toggle(DDBC_HEADING_CLASS_ACTIVE, isActive);
			}
		});
	};

	equipmentContainer.classList.add('beyond-utils-equipment');

	const inventories = ItemManager.getContainers();
	const key = [
		equipmentContainer.dataset.activeContainer,
		...sortBy(inventories, (i) => i.getId()).map((i) => ({ _id: i.getId(), ...i.getContainerSettings() })),
	];
	const container = replaceContainerIfNeeded(headerContainer, key);
	if (!container) {
		updateActive();
		return;
	}
	container.classList.add('beyond-utils-equipment__header');

	const originalHeaders = headerContainer.querySelectorAll('.ddbc-tab-options__header');
	const inventoryHeader = Array.from(headerContainer.children).find((child) => child.textContent?.trim() === 'Inventory');
	if (!(inventoryHeader instanceof HTMLElement)) {
		return;
	}
	const { onItemClick, tabKey } = getReactInternalState(inventoryHeader)?.return?.memoizedProps;

	originalHeaders.forEach((header) => {
		header.addEventListener('click', () => {
			delete equipmentContainer.dataset.activeContainer;
		});
	});

	inventoryHeader.addEventListener('click', () => {
		equipmentContainer.dataset.activeContainer = `${CONTAINER_ID_NONE}`;
		updateActive();
	});
	inventoryHeader.dataset.containerId = `${CONTAINER_ID_NONE}`;

	const containers: [number, string, SVGSVGElement][] = [
		[CONTAINER_ID_ON_PERSON, ICON_ON_PERSON.name, ICON_ON_PERSON.element],
		...inventories.map((i): [number, string, SVGSVGElement] => [i.getId(), i.getName(), i.getIcon().element]),
	];
	containers.forEach(([id, name, icon]) => {
		const header = originalHeaders.item(0).cloneNode(true);
		if (!(header instanceof HTMLElement && header.firstChild instanceof HTMLElement)) {
			return;
		}

		header.classList.add('beyond-utils-equipment__header-item');
		header.dataset.containerId = `${id}`;
		header.firstChild.textContent = name;
		header.firstChild.prepend(icon.cloneNode(true));
		header.addEventListener('click', () => {
			equipmentContainer.dataset.activeContainer = `${id}`;
			onItemClick(tabKey);
			updateActive();
		});

		container.append(header);
	});

	updateActive();
};

/**
 * Process the item list to have a single extra item above it displaying the details of the current container.
 */
const processItems = (element: HTMLElement): void => {
	const containerNode = replaceContainerIfNeeded(element);
	const items = element.querySelector('.ct-inventory__items');
	if (!containerNode || !(items instanceof HTMLElement)) {
		return;
	}
	const row = items.firstChild?.cloneNode(true);
	if (!(row instanceof HTMLElement)) {
		return;
	}
	const dispatch = getReactInternalState(element)?.return?.memoizedProps?.dispatch;
	if (!dispatch) {
		return;
	}

	row.classList.add('beyond-utils-equipment__active-container');
	containerNode.append(row);

	const actionNode = row.querySelector('.ct-inventory-item__action');
	const nameNode = row.querySelector('.ct-inventory-item__name .ddbc-item-name');
	const nameMetaNode = row.querySelector('.ct-inventory-item__name .ct-inventory-item__meta-item');
	const weightNode = row.querySelector('.ct-inventory-item__weight');
	const quantityNode = row.querySelector('.ct-inventory-item__quantity');
	const costNode = row.querySelector('.ct-inventory-item__cost');
	const locationNode = row.querySelector('.ct-inventory-item__location');
	const noteNode = row.querySelector('.ct-inventory-item__notes');

	if (!(
		actionNode instanceof HTMLElement
		&& nameNode instanceof HTMLElement
		&& nameMetaNode instanceof HTMLElement
		&& weightNode instanceof HTMLElement
		&& quantityNode instanceof HTMLElement
		&& costNode instanceof HTMLElement
		&& locationNode instanceof HTMLElement
	)) {
		return;
	}
	items.before(containerNode);

	nameMetaNode.nextSibling?.remove();
	const nameMetaNodeSecondary = nameMetaNode.cloneNode(true) as HTMLElement;
	nameMetaNode.after(nameMetaNodeSecondary);

	actionNode.innerHTML = '<div class="ct-inventory-item__action-empty">--</div>';
	locationNode.innerHTML = '<span class="ct-inventory-item__empty">--</span>';

	const onChange = () => {
		const containerId = InventoryContainerManager.getContainerId();

		if (containerId === CONTAINER_ID_NONE) {
			hide(row);
			return;
		}

		const isOnPerson = containerId === CONTAINER_ID_ON_PERSON;
		const container = ItemManager.getContainerById(containerId);
		const contents = isOnPerson ? ItemManager.getUnassignedContents() : container?.getContents();
		if (!contents) {
			return;
		}

		ItemManager.getItems()
			.forEach((item) => item.registerListeners(['amounts', 'weight', 'cost'], 'active-container-row', onChange, false));

		nameNode.classList.remove(
			'ddbc-item-name--rarity-common',
			'ddbc-item-name--rarity-uncommon',
			'ddbc-item-name--rarity-rare',
			'ddbc-item-name--rarity-very-rare',
			'ddbc-item-name--rarity-very-rare',
		);
		nameNode.classList.add(`ddbc-item-name--rarity-${container?.getRarity().toLowerCase() || 'common'}`);

		let maxWeight: number | undefined;
		if (isOnPerson) {
			nameNode.textContent = ICON_ON_PERSON.name;
			nameMetaNode.textContent = document.querySelector('.ddbc-character-name')?.textContent || '';
			hide(nameMetaNodeSecondary);
		} else if (container) {
			nameNode.textContent = container.getName() || '';
			nameMetaNode.textContent = container.getType();
			if (container.getSubType()) {
				nameMetaNodeSecondary.textContent = container.getSubType();
				show(nameMetaNodeSecondary);
			} else {
				hide(nameMetaNodeSecondary);
			}
			maxWeight = container.getContainerSettings()?.maxContainedWeight;
		}

		weightNode.textContent = '';
		weightNode.append(formatWeight(contents.weight));
		if (maxWeight) {
			const weightMetaNode = document.createElement('div');
			weightMetaNode.classList.add('ct-inventory-item__meta');
			weightMetaNode.append('Max ', formatWeight(maxWeight));
			weightNode.append(weightMetaNode);

			addOverweightNode(weightNode, contents.weight, maxWeight);
		}
		quantityNode.textContent = contents.count ? `${contents.count}` : '--';
		costNode.textContent = contents.cost ? `${round(contents.cost, 2)}` : '--';
		if (noteNode) {
			noteNode.textContent = '';
		} else {
			nameMetaNode.textContent = '';
		}
		(noteNode || nameMetaNode).append(
			'Shown attributes are the totals for the contents of the container, excluding the container itself.',
		);

		show(row);
	};
	InventoryContainerManager.registerListener('active-container-row', onChange);
	onChange();

	row.addEventListener('click', () => setTimeout(() => {
		const containerId = InventoryContainerManager.getContainerId();
		const container = ItemManager.getContainerById(containerId);
		switch (containerId) {
			case CONTAINER_ID_NONE:
				break;
			case CONTAINER_ID_ON_PERSON:
				dispatch({
					type: 'sidebar.PANE_HISTORY_START',
					payload: {
						id: null,
						componentType: 'DESCRIPTION',
						componentIdentifiers: null,
						componentProps: null,
					},
				});
				break;
			default:
				dispatch({
					type: 'sidebar.PANE_HISTORY_START',
					payload: {
						id: null,
						componentType: container?.isCustom() ? 'CUSTOM_ITEM' : 'ITEM_DETAIL',
						componentIdentifiers: {
							id: containerId,
						},
						componentProps: null,
					},
				});
				break;
		}
	}, 10));
};

const getItemCountForContainer = (item: Item, containerId: number): number => {
	switch (containerId) {
		case CONTAINER_ID_NONE:
			return item.getQuantity();
		case CONTAINER_ID_ON_PERSON:
			return item.getUnassignedQuantity();
		default:
			return item.getAmount(containerId);
	}
};

/**
 * Process an item row so that it is appropriate for the amount in the currently selected inventory.
 */
const processItemRowCurrentInventory = (row: HTMLElement, beyondItem: BeyondItem, item: Item): void => {
	const weightNode = row.querySelector('.ct-inventory-item__weight');
	const quantityNode = row.querySelector('.ct-inventory-item__quantity');
	const costNode = row.querySelector('.ct-inventory-item__cost');

	const weightContainer = replaceContainerIfNeeded(weightNode);
	const quantityContainer = replaceContainerIfNeeded(quantityNode);
	const costContainer = replaceContainerIfNeeded(costNode);

	if (!(weightContainer || quantityContainer || costContainer)) {
		return;
	}

	remove(weightContainer?.previousSibling, quantityContainer?.previousSibling, costContainer?.previousSibling);

	const onChange = () => {
		const amount = getItemCountForContainer(item, InventoryContainerManager.getContainerId());
		if (amount === 0) {
			hide(row);
			return;
		}
		row.classList.toggle(
			'ct-inventory-item--active',
			InventoryContainerManager.getContainerId() === item.getId(),
		);
		if (weightContainer) {
			weightContainer.innerHTML = '';
			weightContainer.append(formatWeight(item.getOwnWeight(amount)));

			const contents = item.getContents();
			if (contents?.count) {
				const meta = document.createElement('div');
				meta.classList.add('ct-inventory-item__meta');
				meta.append(formatWeight((contents.weight / item.getQuantity()) * item.getBundleSize() * amount));
				weightContainer.append(meta);

				const maxWeight = item.getContainerSettings()?.maxContainedWeight;
				if (maxWeight) {
					addOverweightNode(weightContainer, contents.weight, maxWeight);
				}
			}
		}
		if (quantityContainer) {
			quantityContainer.textContent = item.isStackable() ? `${amount}` : '--';
		}
		if (costContainer) {
			costContainer.textContent = beyondItem.cost ? `${round(item.getCost(amount), 2)}` : '--';
		}
		show(row);
	};

	InventoryContainerManager.registerListener(`${item.getId()}`, onChange);
	item.registerListeners(['weight', 'cost', 'amounts', 'contents', 'containerSettings'], 'row-amounts', onChange);
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

	const contentsContainer = document.createElement('span');
	const contentsNode = plainNode.cloneNode(false);
	contentsContainer.classList.add('beyond-utils-equipment__note-item', 'beyond-utils-equipment__note-contents');
	contentsContainer.append(separator.cloneNode(true), contentsNode);
	item.registerListener('contents', 'row-note', () => {
		const contents = item.getContents();
		if (contents) {
			contentsNode.textContent = contents.count > 0
				? `Holds ${contents.count} item${contents.count > 1 ? 's' : ''}`
				: 'Empty';
			show(contentsContainer);
		} else {
			hide(contentsContainer);
		}
	});

	const amountsContainer = document.createElement('span');
	const amountsNode = plainNode.cloneNode(false) as HTMLElement;
	amountsContainer.classList.add('beyond-utils-equipment__note-item', 'beyond-utils-equipment__note-amounts');
	amountsContainer.append(separator.cloneNode(true), amountsNode);
	const onChange = () => {
		const amounts = item.getAmounts();
		if (!isEmpty(amounts)) {
			const eventKey = `${item.getId()}::row-note`;
			ItemManager.getItems().forEach((otherItem) => {
				otherItem.unregisterListener('containerSettings', eventKey);
			});

			amountsNode.innerHTML = '';
			Object.entries(amounts).forEach(([containerId, amount]) => {
				amountsNode.append(!amountsNode.firstChild ? 'Stored in ' : ', ');
				const containerItem = ItemManager.getContainerById(containerId);
				const iconNode = document.createElement('span');
				amountsNode.append(iconNode, containerItem?.getName() || '');
				if (item.isStackable() && amount !== item.getQuantity()) {
					amountsNode.append(` (${amount})`);
				}
				containerItem?.registerListener('containerSettings', eventKey, () => {
					iconNode.innerHTML = '';
					iconNode.append(containerItem?.getIcon()?.element.cloneNode(true) || '');
				});
			});
			if (amountsNode.firstChild && item.getUnassignedQuantity()) {
				amountsNode.prepend(
					amountsNode.firstChild,
					ICON_ON_PERSON.element.cloneNode(true),
					ICON_ON_PERSON.name,
					` (${item.getUnassignedQuantity()})`,
					', ',
				);
			}
			show(amountsContainer);
		} else {
			hide(amountsContainer);
		}
	};
	item.registerListener('amounts', 'row-note', onChange);

	if (plainNode.previousSibling?.nodeType === Node.TEXT_NODE && plainNode?.previousSibling.textContent?.trim() === ',') {
		plainNode.previousSibling.remove();
	}
	plainNode.remove();
	container.append(noteContainer, contentsContainer, amountsContainer);
};

/**
 * Process an item row so that it reflects the data in the Item
 * shows the contents of the container, if the item is marked as one.
 */
const processItemRow = (row: HTMLElement): void => {
	const beyondItem: BeyondItem = getReactInternalState(row)?.return?.memoizedProps.item;
	const item = ItemManager.getItem(beyondItem);

	processItemRowCurrentInventory(row, beyondItem, item);
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

const createItemPaneDetailsItem = (label: string, contents: string): [HTMLElement, HTMLElement] => {
	const containerNode = document.createElement('div');
	containerNode.classList.add('beyond-utils-item-pane__properties__field', 'ddbc-property-list__property');

	const labelNode = document.createElement('div');
	labelNode.classList.add('ddbc-property-list__property-label');
	labelNode.textContent = label;

	const contentsNode = document.createElement('div');
	contentsNode.classList.add('ddbc-property-list__property-content');
	contentsNode.textContent = contents;

	containerNode.append(labelNode, contentsNode);
	return [containerNode, contentsNode];
};

/**
 * Process the details list in the item pane to include a list of the contents of the container, if the current item is
 * marked as one.
 */
const processItemPaneDetailsContents = (details: HTMLElement, item: Item): void => {
	const container = replaceContainerIfNeeded(details);
	if (!container) {
		return;
	}
	container.classList.add('beyond-utils-item-pane__properties');

	const [contentsContainerNode, contentsEmptyNode] = createItemPaneDetailsItem('Contents:', 'Empty');
	const [weightContainerNode, weightValueNode] = createItemPaneDetailsItem('Weight of contents:', '');

	const contentsListWrapperNode = document.createElement('div');
	contentsListWrapperNode.classList.add('beyond-utils-item-pane__properties__contents-list');
	const contentsListNode = document.createElement('ul');
	contentsListWrapperNode.append(contentsListNode);

	container.append(contentsContainerNode, contentsListWrapperNode, weightContainerNode);

	item.registerListener('contents', 'details', () => {
		const contents = item.getContents();
		if (!contents) {
			hide(container);
			return;
		}
		show(container);

		if (contents.count > 0) {
			contentsListNode.innerHTML = '';
			const items = contents.items.map(([childItem, amount]) => {
				const listItem = document.createElement('li');
				listItem.textContent = `${amount}x ${childItem.getName()}`;
				return listItem;
			});
			contentsListNode.append(...items);

			weightValueNode.textContent = `${contents.weight} lb.`;
			const maxWeight = item.getContainerSettings()?.maxContainedWeight;
			if (maxWeight) {
				weightValueNode.textContent += ` (max ${maxWeight} lb.)`;
				addOverweightNode(weightValueNode, contents.weight, maxWeight, 'beyond-utils-item-pane__properties__marker-overweight');
			}

			show(contentsListNode, weightContainerNode);
			hide(contentsEmptyNode);
		} else {
			show(contentsEmptyNode);
			hide(contentsListNode, weightContainerNode);
		}
	});
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
	) {
		return;
	}
	container.classList.add('beyond-utils-item-pane__settings');
	customize.querySelector('.ct-remove-button')?.before(container);

	const [toggleRoot, toggle] = createCheckbox('Use as container?');
	toggle.checked = !!item.getContainerSettings();
	container.prepend(toggleRoot);

	const collapsible = document.createElement('div');
	collapsible.classList.add('beyond-utils-item-pane__settings__collapsible');
	collapsible.hidden = !toggle.checked;
	toggle.addEventListener('change', () => {
		if (toggle.checked) {
			item.setContainerSettings({ iconKey: ICON_UNKNOWN.key });
		} else {
			item.clearContainerSettings();
		}
		collapsible.hidden = !toggle.checked;
	});
	container.append(collapsible);

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

	const iconContainer = document.createElement('div');
	iconContainer.classList.add('beyond-utils-item-pane__settings__icon-picker');
	const CLASS_ACTIVE = 'beyond-utils-item-pane__settings__icon--is-active';
	const icons = [...Object.values(ICONS)].map((icon) => {
		const wrapper = document.createElement('span');
		wrapper.classList.add('beyond-utils-item-pane__settings__icon');
		wrapper.dataset.key = icon.key;
		wrapper.title = icon.name;
		wrapper.append(icon.element.cloneNode(true));
		wrapper.addEventListener('click', () => {
			icons.forEach((i) => i.classList.remove(CLASS_ACTIVE));
			wrapper.classList.add(CLASS_ACTIVE);
			item.setContainerSettings({ iconKey: icon.key });
		});
		return wrapper;
	});
	iconContainer.append(...icons);
	const currentIcon = iconContainer.querySelector(
		`.beyond-utils-item-pane__settings__icon[data-key=${item.getContainerSettings()?.iconKey}]`,
	);
	(currentIcon || icons[0]).classList.add(CLASS_ACTIVE);

	collapsible.append(countContentWeightRoot, maxWeightField, iconContainer);

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
 * Process the item pane to add quantity segments below the quantity to manage where the items are stored.
 */
const processItemPaneActionsStackable = (
	actions: HTMLElement,
	container: HTMLElement,
	item: Item,
	parents: ContainerItem[],
): void => {
	interface Segment {
		root: HTMLElement;
		label: HTMLElement;
		input: HTMLInputElement;
		btnDecrease: HTMLButtonElement;
		btnIncrease: HTMLButtonElement;
	}
	const toSegment = (root: Node | null): Segment | null => {
		if (!(root instanceof HTMLElement)) {
			return null;
		}
		const label = root.querySelector('.ct-simple-quantity__label');
		const input = root.querySelector('.ct-simple-quantity__value input');
		const btnDecrease = root.querySelector('.ct-simple-quantity__decrease button');
		const btnIncrease = root.querySelector('.ct-simple-quantity__increase button');
		if (!(
			label instanceof HTMLElement
			&& input instanceof HTMLInputElement
			&& btnDecrease instanceof HTMLButtonElement
			&& btnIncrease instanceof HTMLButtonElement
		)) {
			return null;
		}
		return {
			root, label, input, btnDecrease, btnIncrease,
		};
	};
	const updateMin = (segment: Segment, min: number, message = '') => {
		const realMin = Math.max(min, 0);
		segment.input.min = `${realMin}`;
		const disabled = segment.input.valueAsNumber <= realMin;
		segment.btnDecrease.disabled = disabled;
		segment.btnDecrease.title = disabled ? message : '';
	};
	const updateMax = (segment: Segment, max: number, message = '') => {
		const realMax = Math.max(max, 0);
		segment.input.max = `${realMax}`;
		const disabled = segment.input.valueAsNumber >= realMax;
		segment.btnIncrease.disabled = disabled;
		segment.btnIncrease.title = disabled ? message : '';
	};
	const setupEvents = (segment: Segment, onChange: () => void): void => {
		segment.input.addEventListener('input', (e) => {
			e.stopPropagation();
			onChange();
		});
		segment.btnDecrease.addEventListener('click', (e) => {
			e.stopPropagation();
			segment.input.stepDown();
			onChange();
		});
		segment.btnIncrease.addEventListener('click', (e) => {
			e.stopPropagation();
			segment.input.stepUp();
			onChange();
		});
	};

	container.classList.add('beyond-utils-item-pane__amounts-stackable');

	const total = toSegment(actions.querySelector('.ct-simple-quantity'));
	if (!total) {
		return;
	}
	total.root.classList.add('beyond-utils-item-pane__amounts-stackable__item');
	total.root.after(container);
	container.append(total.root);
	const onUpdate: (amount: number) => void = getReactInternalState(total.root)?.return?.memoizedProps?.onUpdate;

	const onPerson = toSegment(total.root.cloneNode(true));
	if (!onPerson || !onPerson) {
		return;
	}
	onPerson.root.classList.add('beyond-utils-item-pane__amounts-stackable__item--on-person');
	onPerson.label.textContent = ICON_ON_PERSON.name;
	onPerson.label.prepend(ICON_ON_PERSON.element.cloneNode(true));
	onPerson.input.readOnly = true;
	container.append(onPerson.root);

	const containerSegments: Record<number, Segment> = {};
	parents.forEach((containerItem) => {
		const segment = toSegment(total.root.cloneNode(true));
		if (!segment) {
			return;
		}
		containerSegments[containerItem.getId()] = segment;

		segment.label.textContent = containerItem.getName();
		segment.label.prepend(containerItem.getIcon().element.cloneNode(true));

		setupEvents(segment, () => {
			item.setAmount(containerItem.getId(), segment.input.valueAsNumber);
		});

		container.append(segment.root);
	});

	setupEvents(total, () => {
		onUpdate(total.input.valueAsNumber);
		item.setQuantity(total.input.valueAsNumber);
	});
	item.registerListeners(['weight', 'amounts'], 'amount-editor', () => {
		const unassigned = item.getUnassignedQuantity();
		updateMin(
			total,
			item.getQuantity() - unassigned,
			item.getQuantity() === unassigned ? '' : 'Take items out of containers first.',
		);
		onPerson.input.valueAsNumber = unassigned;
		Object.entries(containerSegments).forEach(([containerId, segment]) => {
			const weight = item.getWeightWithContents(1);
			const availableCarryCapacity = weight > 0
				? Math.floor((ItemManager.getContainerById(containerId)?.getAvailableWeight() || 0) / weight)
				: Number.POSITIVE_INFINITY;

			segment.input.valueAsNumber = item.getAmount(containerId);
			updateMin(segment, 0);
			if (unassigned <= availableCarryCapacity) {
				updateMax(segment, segment.input.valueAsNumber + unassigned, 'Would exceed available amount of items.');
			} else {
				updateMax(segment, segment.input.valueAsNumber + availableCarryCapacity, 'Would exceed maximum weight.');
			}
		});
	});
};

/**
 * Process the item pane to add a selector to manage where the item is stored.
 */
const processItemPaneActionsUnstackable = (
	actions: HTMLElement,
	container: HTMLElement,
	item: Item,
	parents: ContainerItem[],
): void => {
	actions.prepend(container);
	container.classList.add('beyond-utils-item-pane__amounts-unstackable');

	const CLASS_ACTIVE = 'beyond-utils-item-pane__amounts-unstackable__item--is-active';

	const resetActive = () => {
		Object.keys(item.getAmounts()).forEach((containerId) => item.setAmount(containerId, 0));
		container.querySelectorAll(`.${CLASS_ACTIVE}`).forEach((element) => {
			element.classList.remove(CLASS_ACTIVE);
		});
	};

	{
		const element = document.createElement('span');
		element.classList.add('beyond-utils-item-pane__amounts-unstackable__item');
		if (item.getUnassignedQuantity() > 0) {
			element.classList.add(CLASS_ACTIVE);
		}
		element.append(ICON_ON_PERSON.element.cloneNode(true), ICON_ON_PERSON.name);
		element.addEventListener('click', () => {
			resetActive();
			item.clearAmounts();
			element.classList.add(CLASS_ACTIVE);
		});
		container.append(element);
	}

	parents.forEach((parent) => {
		const element = document.createElement('span');
		element.classList.add('beyond-utils-item-pane__amounts-unstackable__item');
		const isActive = item.getAmount(parent.getId()) > 0;
		if (isActive) {
			element.classList.add(CLASS_ACTIVE);
		}
		element.append(parent.getIcon().element.cloneNode(true), parent.getName());
		if (!isActive && item.getWeightWithContents() > parent.getAvailableWeight()) {
			element.classList.add('beyond-utils-item-pane__amounts-unstackable__item--is-disabled');
			element.title = 'Would exceed maximum weight.';
		} else {
			element.addEventListener('click', () => {
				resetActive();
				item.setAmount(parent.getId(), 1);
				element.classList.add(CLASS_ACTIVE);
			});
		}
		container.append(element);
	});
};

/**
 * Process the item pane to add constrol to manage where the item is stored.
 */
const processItemPaneActions = (actions: HTMLElement, item: Item): void => {
	const container = replaceContainerIfNeeded(actions);
	if (!container) {
		return;
	}

	const parents = ItemManager.getContainers();
	pull(parents, item); // Item cannot be its own parent.
	pullAll(parents, item.getAllChildren()); // Storage cannot be circular.

	if (item.isStackable()) {
		processItemPaneActionsStackable(actions, container, item, parents);
	} else {
		processItemPaneActionsUnstackable(actions, container, item, parents);
	}
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
		processItemPaneDetailsContents(details, item);
	}

	const customize = pane.querySelector('.ct-editor-box');
	if (customize instanceof HTMLElement) {
		processItemPaneCustomize(customize, item);
	}

	const actions = pane.querySelector('.ct-item-detail__actions, .ct-custom-item-pane__action');
	if (actions instanceof HTMLElement) {
		processItemPaneActions(actions, item);
	}
};

/**
 * Enhance the equipment tab with the ability to track where items are stored.
 *
 * The basic approach is that each item can be marked as being usable as a container. Each item can also be assigned to
 * a container (or multiple containers if the quantity allows this).
 */
export const enhanceEquipment = (): void => {
	Array.from(document.querySelectorAll('.ct-equipment'))
		.filter((elem): elem is HTMLElement => elem instanceof HTMLElement)
		.forEach((container) => {
			Array.from(container.querySelectorAll('.ddbc-tab-options__nav'))
				.filter((elem): elem is HTMLElement => elem instanceof HTMLElement)
				.forEach((elem) => processHeaders(container, elem));
		});
	Array.from(document.getElementsByClassName('ct-inventory'))
		.filter((elem): elem is HTMLElement => elem instanceof HTMLElement)
		.forEach((elem) => processItems(elem));
	Array.from(document.querySelectorAll('.ct-inventory__items .ct-inventory-item'))
		.filter((elem): elem is HTMLElement => elem instanceof HTMLElement)
		.forEach((elem) => processItemRow(elem));
	Array.from(document.querySelectorAll('.ct-item-pane, .ct-custom-item-pane'))
		.filter((elem): elem is HTMLElement => elem instanceof HTMLElement)
		.forEach((elem) => processItemPane(elem));
};
