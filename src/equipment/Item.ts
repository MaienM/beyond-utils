// eslint-disable-next-line max-classes-per-file
import {
	isEmpty,
	isEqual,
	union,
	sum,
} from 'lodash';
import { getReactInternalState } from 'src/utils';
import { ContainerIcon, ICONS, ICON_UNKNOWN } from './icons';
import { BeyondItem, BeyondReduxDispatch } from './internals';

type Rarity = BeyondItem['definition']['rarity'];

/**
 * The contents of a container.
 */
class ContainerContents {
	readonly items: [Item, number][];

	readonly count: number;

	readonly weight: number;

	readonly cost: number;

	constructor(items: [Item, number][]) {
		this.items = items;
		this.count = sum(this.items.map(([, amount]) => amount));
		this.weight = sum(this.items.map(([item, amount]) => item.getWeightWithContents(amount)));
		this.cost = sum(this.items.map(([item, amount]) => item.getCost(amount)));
	}
}

/**
 * A simple manager to handle the creation and retrieval of Item instances.
 */
export class ItemManager {
	private static initialized = false;

	private static itemMap: Record<string, Item> = {};

	private static dispatch: BeyondReduxDispatch;

	/** Initialize the manager. */
	private static initialize(): void {
		if (this.initialized) {
			return;
		}
		const container = document.querySelector('.ct-equipment');
		if (!container) {
			throw new Error('Unable to instantiate ItemManager');
		}
		const props = getReactInternalState(container)?.return?.memoizedProps;
		this.dispatch = props.dispatch;
		this.initialized = true;
		props.inventory.forEach((item: BeyondItem) => this.getItem(item));
		props.customItems.forEach((item: BeyondItem) => this.getItem(item));
	}

	/** Get the Item instance for the given BeyondItem. */
	static getItem(beyondItem: BeyondItem): Item {
		if (!beyondItem) {
			throw new Error('beyondItem is null/undefined.');
		}
		this.initialize();
		if (!(beyondItem.id in this.itemMap)) {
			// eslint-disable-next-line no-use-before-define
			this.itemMap[beyondItem.id] = new Item(this.dispatch);
		}
		const item = this.itemMap[beyondItem.id];
		item.update(beyondItem);
		return item;
	}

	/** Get all Item instances. */
	static getItems(): Item[] {
		this.initialize();
		return Object.values(this.itemMap);
	}

	/** Get all items that are marked for use as a container as ContainerItem instances. */
	static getContainers(): ContainerItem[] {
		this.initialize();
		return this.getItems()
			.map((item) => item.asContainerItem())
			.filter((item): item is ContainerItem => item !== undefined)
			.sort((a, b) => a.getId() - b.getId());
	}

	/** Get a ContainerItem instance by id. */
	static getContainerById(id: number | string): ContainerItem | null {
		this.initialize();
		return this.itemMap[`${id}`]?.asContainerItem() || null;
	}

	/** Get everything that isn't assigned to a container as a ContainerContents intance.  */
	static getUnassignedContents(): ContainerContents {
		this.initialize();
		const items = this.getItems()
			.map((item): [Item, number] => [item, item.getUnassignedQuantity()])
			.filter(([, amount]) => amount > 0);
		return new ContainerContents(items);
	}
}

/**
 * Settings for an item that has been marked as being usable as a container.
 */
interface ContainerSettings {
	iconKey: string;
	ignoreContainedWeight: boolean;
	maxContainedWeight?: number;
}
const DEFAULT_CONTAINER_SETTINGS: ContainerSettings = {
	iconKey: ICON_UNKNOWN.key,
	ignoreContainedWeight: false,
};

/**
 * Metadata stored on a item, at the end of its note.
 */
interface ItemMetadata {
	weight?: number;
	containerSettings?: Pick<ContainerSettings, 'iconKey'> & Partial<Omit<ContainerSettings, 'iconKey'>>;
	amounts?: Record<string, number>;
}

/**
 * The available events for Items.
 */
type ItemEvent = 'note' | 'weight' | 'cost' | 'amounts' | 'contents' | 'containerSettings';

/**
 * A wrapper around a single inventory item that manages all storage related metadata, including changes from various
 * sources and events.
 */
export class Item {
	/**
	 * The dispatch function for the redux store.
	 *
	 * Used to update the note to store note + metadata.
	 */
	protected dispatch: BeyondReduxDispatch;

	/**
	 * Already processed base item objects.
	 */
	protected processed: WeakSet<BeyondItem> = new WeakSet();

	/**
	 * The container settings for this item, if it has been marked as being usable as a container.
	 */
	protected containerSettings?: ContainerSettings;

	/**
	 * The note for the item, without any metadata in them.
	 */
	protected note = '';

	/**
	 * A mapping of container id -> amount in container.
	 */
	protected amounts: Record<string, number> = {};

	/**
	 * The weight of the item itself, without any adjustments for contents.
	 *
	 * This is per-bundle weight.
	 */
	protected ownWeight = 0;

	/**
	 * The weight of the item, adjusted to account for the weight of its contents.
	 *
	 * For a container with ignoreContainedWeight === true this means its own weight - the weight of the contained items.  This way the weight of the container compensates for the weight of the items, making the weight carried attribute for the character correct.
	 *
	 * In all other cases this is identical to ownWeight.
	 *
	 * Note that this is always per-bundle, so if the quantity > 1 the weight of the contents will be spread out.
	 */
	protected weight = 0;

	/**
	 * Timer ID for the scheduled update.
	 */
	protected updateTimer?: number;

	/**
	 * The map of event listeners that have been registered.
	 */
	protected eventListeners: Map<ItemEvent, Map<string, () => void>> = new Map();

	/**
	 * Some values that are copied from the internal item.
	 *
	 * None of these are managed, so changes to them (if allowed at all) are not propagated to the Redux state.
	 */
	protected id = -1;

	protected isCustom = false;

	protected entityTypeId = -1;

	protected name = '';

	protected description = '';

	protected previousNote = '';

	protected stackable = false;

	protected quantity = 0;

	protected bundleSize = 1;

	protected previousWeight = 0;

	protected definitionWeight = 0;

	protected cost = 0;

	protected rarity: Rarity = 'Common';

	protected type = '';

	protected subType: string | null = null;

	/**
	 * Create a new instance for a new BeyondItem.
	 *
	 * Should not be used directly, use ItemManager.getItem() instead.
	 */
	constructor(dispatch: BeyondReduxDispatch) {
		this.dispatch = dispatch;

		this.registerListeners(['weight', 'cost', 'contents', 'containerSettings'], 'deriveWeight', () => {
			const compensateWeight = (this.containerSettings?.ignoreContainedWeight && this.getContents()?.weight) || 0;
			const weight = this.ownWeight - (compensateWeight / this.quantity) * this.bundleSize;
			if (weight !== this.weight) {
				this.weight = weight;
				this.scheduleDispatchChanges();
			}
		}, false);
	}

	/**
	 * Update the state of this item based on a new BeyondItem instance.
	 *
	 * Should not be used directly, use ItemManager.getItem() instead.
	 */
	update(internal: BeyondItem): void {
		if (this.processed.has(internal)) {
			return;
		}
		this.processed.add(internal);

		this.id = internal.id;
		this.isCustom = internal.isCustom;
		this.entityTypeId = internal.entityTypeId;
		this.name = internal.name;
		this.description = internal.description;
		this.stackable = internal.definition.stackable;
		this.bundleSize = internal.definition.bundleSize;
		this.previousWeight = (internal.weight / internal.quantity) * internal.definition.bundleSize;
		this.definitionWeight = internal.definition.weight;
		this.rarity = internal.definition.rarity;
		this.type = internal.definition.type;
		this.subType = internal.definition.subType;

		const pendingEvents = new Set<ItemEvent>();
		const pendingAmountTargets = new Set<string>();

		if (internal.notes !== this.previousNote) {
			this.previousNote = internal.notes;

			const oldState = {
				note: this.note,
				amounts: this.amounts,
				containerSettings: this.containerSettings,
				ownWeight: this.ownWeight,
			};

			this.note = internal.notes;
			this.ownWeight = this.definitionWeight;
			this.containerSettings = undefined;
			this.amounts = {};

			const match = /^(.*)\|(.*)$/.exec(internal.notes);
			if (match) {
				const [, note, rawMeta] = match;
				this.note = note;
				const meta = JSON.parse(rawMeta) as ItemMetadata;
				if (meta.weight !== undefined) {
					this.ownWeight = meta.weight;
				}
				if (meta.containerSettings) {
					this.containerSettings = {
						...DEFAULT_CONTAINER_SETTINGS,
						...meta.containerSettings,
					};
				}
				if (meta.amounts) {
					this.amounts = meta.amounts;
				}
			}

			if (this.ownWeight !== oldState.ownWeight) {
				pendingEvents.add('weight');
			}

			if (this.note !== oldState.note) {
				pendingEvents.add('note');
			}

			if (!isEqual(this.containerSettings, oldState.containerSettings)) {
				pendingEvents.add('containerSettings');
			}

			Object.entries(this.amounts).forEach(([containerId, amount]) => {
				if (amount === 0) {
					delete this.amounts[containerId];
				}
			});
			if (!isEqual(this.amounts, oldState.amounts)) {
				pendingEvents.add('amounts');
				union(Object.keys(this.amounts), Object.keys(oldState.amounts)).forEach((containerId) => {
					if (this.amounts[containerId] !== oldState.amounts[containerId]) {
						pendingAmountTargets.add(containerId);
					}
				});
			}
		}

		if (internal.quantity !== this.quantity) {
			this.quantity = internal.quantity;
			pendingEvents.add('amounts');
		}

		if (internal.cost !== this.cost) {
			this.cost = internal.cost;
			pendingEvents.add('cost');
		}

		pendingEvents.forEach((event) => this.triggerListeners(event, 'update'));
		pendingAmountTargets.forEach((containerId) => {
			ItemManager.getContainerById(containerId)?.triggerListeners('contents', `${this.getId()}::update`);
		});
	}

	/** Dispatch a change of a single field to the DNDBeyond Redux store. */
	protected dispatchValueSet(typeId: number, value: unknown): void {
		this.dispatch({
			type: 'character.VALUE_SET',
			payload: {
				typeId,
				value,
				notes: null,
				valueId: `${this.id}`,
				valueTypeId: `${this.entityTypeId}`,
				contextId: null,
				contextTypeId: null,
			},
			meta: {
				commit: {
					type: 'character.VALUE_SET_COMMIT',
				},
			},
		});
	}

	/** Dispatch a change in a custom item to the DNDBeyond Redux store. */
	protected dispatchCustomItemSet(note: string | null, weight: number | null): void {
		this.dispatch({
			type: 'character.CUSTOM_ITEM_SET',
			payload: {
				id: this.id,
				properties: {
					id: this.id,
					name: this.name,
					description: '',
					weight,
					cost: this.cost,
					quantity: this.quantity,
					notes: note,
				},
			},
			meta: {
				commit: {
					type: 'character.CUSTOM_ITEM_SET_COMMIT',
				},
			},
		});
	}

	/** Dispatch all pending changes to the DNDBeyond Redux store. */
	protected dispatchChanges(): void {
		this.updateTimer = undefined;

		const meta: ItemMetadata = {};
		if (this.containerSettings) {
			meta.containerSettings = this.containerSettings;
		}
		if (!isEmpty(this.amounts)) {
			meta.amounts = this.amounts;
		}
		if (this.ownWeight !== this.definitionWeight) {
			meta.weight = this.ownWeight;
		}
		const note = isEmpty(meta) ? (this.note || null) : `${this.note || ''}|${JSON.stringify(meta)}`;
		const weight = this.weight === this.definitionWeight ? null : this.weight;

		if (this.isCustom) {
			if (note !== this.previousNote || this.weight !== this.previousWeight) {
				this.dispatchCustomItemSet(note, weight);
			}
		} else {
			if (note !== this.previousNote) {
				this.dispatchValueSet(9, note);
			}
			if (this.weight !== this.previousWeight) {
				this.dispatchValueSet(22, weight);
			}
		}
	}

	/** Debounced dispatchChanges. */
	protected scheduleDispatchChanges(): void {
		if (this.updateTimer) {
			clearTimeout(this.updateTimer);
		}
		this.updateTimer = window.setTimeout(this.dispatchChanges.bind(this), 1000);
	}

	/**
	 * Register an event listener for the given event with the given key.
	 *
	 * This will replace the existing listener for that event with that key if one exists.
	 */
	registerListener(type: ItemEvent, key: string, handler: () => void, triggerNow = true): void {
		if (!this.eventListeners.has(type)) {
			this.eventListeners.set(type, new Map());
		}
		this.eventListeners.get(type)?.set(key, handler);

		if (triggerNow) {
			handler();
		}
	}

	/** As registerListener(), but for multiple events at once. */
	registerListeners(types: ItemEvent[], key: string, handler: () => void, triggerNow = true): void {
		types.forEach((type, i) => this.registerListener(type, key, handler, i === 0 ? triggerNow : false));
	}

	/** Remove the event listener for the given event with the given key, if any. */
	unregisterListener(type: ItemEvent, key: string): void {
		this.eventListeners.get(type)?.delete(key);
	}

	/** As unregisterListener(), but for multiple events at once. */
	unregisterListeners(types: ItemEvent[], key: string): void {
		types.forEach((type) => this.unregisterListener(type, key));
	}

	/** Trigger listeners for the given event. */
	protected triggerListeners(type: ItemEvent, _caller: string): void {
		this.eventListeners.get(type)?.forEach((handler, _key) => {
			handler();
		});
	}

	/** Get the user's note. */
	getNote(): string {
		return this.note;
	}

	/** Set the user's note. */
	setNote(note: string): void {
		this.note = note;
		this.triggerListeners('note', 'setNote');
		this.scheduleDispatchChanges();
	}

	/**
	 * Get the container settings, if any.
	 *
	 * If this is not undefined the item can be used as a container.
	 */
	getContainerSettings(): ContainerSettings | undefined {
		return this.containerSettings ? { ...this.containerSettings } : undefined;
	}

	/**
	 * Update the container settings.
	 *
	 * Any portions of the settings that are not provided will be taken from the current value or the defaults if there is no current value.
	 */
	setContainerSettings(containerSettings: Partial<ContainerSettings>): void {
		this.containerSettings = {
			...DEFAULT_CONTAINER_SETTINGS,
			...(this.containerSettings || {}),
			...containerSettings,
		};
		this.triggerListeners('containerSettings', 'setContainerSettings');
		this.scheduleDispatchChanges();
	}

	/**
	 * CLear all container settings, marking this item as not-a-container.
	 */
	clearContainerSettings(): void {
		this.containerSettings = undefined;
		this.triggerListeners('containerSettings', 'clearContainerSettings');
		this.triggerListeners('contents', 'clearContainerSettings');
		this.scheduleDispatchChanges();
	}

	/**
	 * Get the item as a ContainerItem instance if it is a container, or undefined otherwise.
	 */
	asContainerItem(): ContainerItem | undefined {
		return this.containerSettings ? this as ContainerItem : undefined;
	}

	/**
	 * Get the icon for this item if it is a container, or undefined otherwise.
	 */
	getIcon(): ContainerIcon | undefined {
		return this.containerSettings ? (ICONS[this.containerSettings.iconKey] || ICON_UNKNOWN) : undefined;
	}

	/**
	 * Get the unique id for the item.
	 */
	getId(): number {
		return this.id;
	}

	/**
	 * Get the name of the item.
	 */
	getName(): string {
		return this.name;
	}

	/**
	 * Set the name of this stack.
	 *
	 * Note that this will _NOT_ cause a change to the Redux tree.
	 */
	setName(name: string): void {
		this.name = name;
	}

	/**
	 * Get the description of the item.
	 */
	getDescription(): string {
		return this.description;
	}

	/**
	 * Set the description of this stack.
	 *
	 * Note that this will _NOT_ cause a change to the Redux tree.
	 */
	setDescription(description: string): void {
		this.description = description;
	}

	/**
	 * Get the cost for the given amount of the item, or fo the full stack if no amount is provided.
	 */
	getCost(quantity = this.quantity): number {
		return (this.cost / this.quantity) * quantity;
	}

	/**
	 * Get the rarity of the item.
	 */
	getRarity(): Rarity {
		return this.rarity;
	}

	/**
	 * Get the type of the item.
	 */
	getType(): string {
		return this.type;
	}

	/**
	 * Get the subtype of the item, if it has one.
	 */
	getSubType(): string | null {
		return this.subType;
	}

	/**
	 * Get the weight for the given amount of the item, or for the full stack if no amount is provided.
	 *
	 * Weight of contents (if any) are ignored.
	 */
	getOwnWeight(quantity = this.quantity): number {
		return this.ownWeight * (quantity / this.bundleSize);
	}

	/**
	 * Set the weight per bundle size for the full stack of items.
	 */
	setOwnWeight(ownWeight: number): void {
		this.ownWeight = ownWeight;
		this.triggerListeners('weight', 'setOwnWeight');
		this.scheduleDispatchChanges();
	}

	/**
	 * Return whether the weigh of the item (ignoring contents) is different from the default for this type of item.
	 */
	isOwnWeightCustomized(): boolean {
		return this.ownWeight !== this.definitionWeight;
	}

	/**
	 * Clear the defined weight for the item, going back to using the default weight for this type of item.
	 */
	clearOwnWeight(): void {
		this.setOwnWeight(this.definitionWeight);
	}

	/**
	 * Get the weight for the given amount of the item, or for the full stack if no amount is provided.
	 *
	 * Weight of contents (if any) are included, and are assumed to be spread evenly over the items.
	 */
	getWeightWithContents(quantity = this.quantity): number {
		let unitWeight = this.ownWeight / this.bundleSize;
		if (this.containerSettings && !this.containerSettings.ignoreContainedWeight) {
			unitWeight += (this.getContents()?.weight || 0) / this.quantity;
		}
		return unitWeight * quantity;
	}

	/**
	 * Get the amount of weight that can be added to this container before exceeding its weight limit or the weight limit of its parents.
	 */
	getAvailableWeight(): number {
		const contentWeight = this.getContents()?.weight || 0;
		const ownLimit = this.containerSettings?.maxContainedWeight || Number.POSITIVE_INFINITY;
		if (isEmpty(this.amounts) || this.containerSettings?.ignoreContainedWeight === true) {
			return ownLimit - contentWeight;
		}
		const parentLimit = sum(Object.entries(this.amounts).map(([containerId, amount]) => (
			(ItemManager.getContainerById(containerId)?.getAvailableWeight() || 0) * (amount / this.quantity)
		)));
		return Math.min(ownLimit, parentLimit) - contentWeight;
	}

	/**
	 * Whether the quantity of this item can exceed 1.
	 */
	isStackable(): boolean {
		return this.stackable;
	}

	/**
	 * Get the quantity of this stack.
	 */
	getQuantity(): number {
		return this.quantity;
	}

	/**
	 * Set the quantity of this stack.
	 *
	 * Note that this will _NOT_ cause a change to the Redux tree.
	 */
	setQuantity(quantity: number): void {
		this.quantity = quantity;
		this.triggerListeners('amounts', 'setQuantity');
	}

	/**
	 * Get the quantity of this stack that has not been assigned to a container (and is thus carried on-person).
	 */
	getUnassignedQuantity(): number {
		return this.quantity - Object.values(this.amounts).reduce((a, b) => a + b, 0);
	}

	/**
	 * Get the bundle size.
	 *
	 * The bundle size is the amount of an item that is traded in. The cost and weight are set and defined for an entire bundle, and you can typically not buy the item in smaller quantities.
	 */
	getBundleSize(): number {
		return this.bundleSize;
	}

	/**
	 * Get the amount of this stack that is stored in the given container.
	 */
	getAmount(containerId: number | string): number {
		return this.amounts[containerId] || 0;
	}

	/**
	 * Set the amount of this stack that is stored in the given container.
	 */
	setAmount(containerId: number | string, amount: number): void {
		if (amount === 0) {
			delete this.amounts[containerId];
		} else {
			this.amounts[containerId] = amount;
		}
		this.triggerListeners('amounts', 'setAmount');
		ItemManager.getContainerById(containerId)?.triggerListeners('contents', `${this.getId()}::setAmount`);
		this.scheduleDispatchChanges();
	}

	/**
	 * Remove this stack from all containers it is currently stored in.
	 */
	clearAmounts(): void {
		this.amounts = {};
		this.triggerListeners('amounts', 'clearAmounts');
		this.scheduleDispatchChanges();
	}

	/**
	 * Get a mapping from container to amount stored in that container.
	 */
	getAmounts(): Record<number, number> {
		return { ...this.amounts };
	}

	/**
	 * Get the contents of this item if it is a container, or undefined otherwise.
	 */
	getContents(): ContainerContents | undefined {
		if (!this.containerSettings) {
			return undefined;
		}
		const items = ItemManager.getItems()
			.filter((item) => item !== this)
			.map((item): [Item, number] => [item, item.getAmount(this.getId())])
			.filter(([, amount]) => amount > 0);
		return new ContainerContents(items);
	}

	/**
	 * Get all items that (directly or indirectly) contain this stack.
	 */
	getAllParents(stack: Item[] = []): Item[] {
		if (stack.includes(this)) {
			throw new Error(`Found cycle trying to gather parents: ${stack.map((i) => i.getId()).join(' -> ')} -> ${this.getId()}`);
		}
		return Object.keys(this.amounts).flatMap((containerId) => {
			const parent = ItemManager.getContainerById(containerId);
			return parent ? [parent, ...this.getAllParents([...stack, this])] : [];
		});
	}

	/**
	 * Get all items that (directly or indirectly) are contained in this stack.
	 */
	getAllChildren(stack: Item[] = []): Item[] {
		if (stack.includes(this)) {
			throw new Error(`Found cycle trying to gather children: ${stack.map((i) => i.getId()).join(' -> ')} -> ${this.getId()}`);
		}
		return this.getContents()?.items.flatMap(([item]) => [item, ...item.getAllChildren([...stack, this])]) || [];
	}
}

/**
 * An item that is marked as being usable as a container.
 */
export interface ContainerItem extends Item {
	getContainerSettings(): ContainerSettings;
	getIcon(): ContainerIcon;
	getContents(): ContainerContents;
}
