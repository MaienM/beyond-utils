// eslint-disable-next-line max-classes-per-file
import {
	isEmpty,
	isEqual,
	union,
	sum,
} from 'lodash';
import { logInfo } from 'src/log';
import { getReactInternalState } from 'src/utils';
import { ContainerIcon, ICONS, ICON_UNKNOWN } from './icons';
import { BeyondItem, BeyondReduxDispatch } from './internals';

type Rarity = BeyondItem['definition']['rarity'];

/**
 * A simple manager to handle the creation and retrieval of Item instances.
 */
export class ItemManager {
	private static initialized = false;

	private static itemMap: Record<string, Item> = {};

	private static dispatch: BeyondReduxDispatch;

	/**
	 * Get the current instance, creating it first if no instance exists yet.
	 */
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
	}

	static getItem(beyondItem: BeyondItem): Item {
		this.initialize();
		if (!(beyondItem.id in this.itemMap)) {
			// eslint-disable-next-line no-use-before-define
			this.itemMap[beyondItem.id] = new Item(this.dispatch);
		}
		const item = this.itemMap[beyondItem.id];
		item.update(beyondItem);
		return item;
	}

	static getItemById(id: number | string): Item {
		this.initialize();
		return this.itemMap[`${id}`] || null;
	}

	static getItems(): Item[] {
		this.initialize();
		return Object.values(this.itemMap);
	}

	static getContainers(): ContainerItem[] {
		this.initialize();
		return this.getItems()
			.map((item) => item.asContainerItem())
			.filter((item): item is ContainerItem => item !== undefined)
			.sort((a, b) => a.getId() - b.getId());
	}

	static getUnassignedContents(): ContainerContents {
		this.initialize();
		const items = this.getItems()
			.map((item): [Item, number] => [item, item.getUnassignedQuantity()])
			.filter(([, amount]) => amount > 0);
		return new ContainerContents(items);
	}
}

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

	protected entityTypeId = -1;

	protected name = '';

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

	constructor(dispatch: BeyondReduxDispatch) {
		this.dispatch = dispatch;

		this.registerListeners(['weight', 'cost', 'contents', 'containerSettings'], 'deriveWeight', () => {
			const compensatedWeight = this.containerSettings?.ignoreContainedWeight ? this.getContents()?.weight || 0 : 0;
			const weight = this.ownWeight - compensatedWeight / this.quantity * this.bundleSize;
			if (weight !== this.weight) {
				this.weight = weight;
				this.schedulePropagate();
			}
		}, false);
	}

	update(internal: BeyondItem): void {
		if (this.processed.has(internal)) {
			return;
		}
		this.processed.add(internal);

		this.id = internal.id;
		this.entityTypeId = internal.entityTypeId;
		this.name = internal.name;
		this.stackable = internal.definition.stackable;
		this.bundleSize = internal.definition.bundleSize;
		this.previousWeight = internal.weight / internal.quantity * internal.definition.bundleSize;
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
			ItemManager.getItemById(containerId)?.triggerListeners('contents', `${this.getId()}::update`);
		});
	}

	protected dispatchPropagate(): void {
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
		if (note !== this.previousNote) {
			this.dispatchValueSet(9, note);
		}

		if (this.weight !== this.previousWeight) {
			const weight = this.weight === this.definitionWeight ? null : this.weight;
			this.dispatchValueSet(22, weight);
		}
	}

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

	protected schedulePropagate(): void {
		if (this.updateTimer) {
			clearTimeout(this.updateTimer);
		}
		this.updateTimer = window.setTimeout(this.dispatchPropagate.bind(this), 1000);
	}

	registerListener(type: ItemEvent, key: string, handler: () => void, triggerNow = true): void {
		if (!this.eventListeners.has(type)) {
			this.eventListeners.set(type, new Map());
		}
		this.eventListeners.get(type)?.set(key, handler);

		if (triggerNow) {
			handler();
		}
	}

	registerListeners(types: ItemEvent[], key: string, handler: () => void, triggerNow = true): void {
		types.forEach((type, i) => this.registerListener(type, key, handler, i === 0 ? triggerNow : false));
	}

	unregisterListener(type: ItemEvent, key: string): void {
		this.eventListeners.get(type)?.delete(key);
	}

	protected triggerListeners(type: ItemEvent, _caller: string): void {
		this.eventListeners.get(type)?.forEach((handler, _key) => {
			handler();
		});
	}

	getNote(): string {
		return this.note;
	}

	setNote(note: string): void {
		this.note = note;
		this.triggerListeners('note', 'setNote');
		this.schedulePropagate();
	}

	getContainerSettings(): ContainerSettings | undefined {
		return this.containerSettings ? { ...this.containerSettings } : undefined;
	}

	setContainerSettings(containerSettings: Partial<ContainerSettings>): void {
		this.containerSettings = {
			...DEFAULT_CONTAINER_SETTINGS,
			...(this.containerSettings || {}),
			...containerSettings,
		};
		this.triggerListeners('containerSettings', 'setContainerSettings');
		this.schedulePropagate();
	}

	clearContainerSettings(): void {
		this.containerSettings = undefined;
		this.triggerListeners('containerSettings', 'clearContainerSettings');
		this.triggerListeners('contents', 'clearContainerSettings');
		this.schedulePropagate();
	}

	asContainerItem(): ContainerItem | undefined {
		return this.containerSettings ? this as ContainerItem : undefined;
	}

	getIcon(): ContainerIcon | undefined {
		return this.containerSettings ? ICONS[this.containerSettings.iconKey] : undefined;
	}

	getId(): number {
		return this.id;
	}

	getName(): string {
		return this.name;
	}

	getCost(quantity = this.quantity): number {
		return this.cost * quantity / this.bundleSize;
	}

	getRarity(): Rarity {
		return this.rarity;
	}

	getType(): string {
		return this.type;
	}

	getSubType(): string | null {
		return this.subType;
	}

	getOwnWeight(quantity = this.quantity): number {
		return this.ownWeight * quantity / this.bundleSize;
	}

	setOwnWeight(ownWeight: number): void {
		this.ownWeight = ownWeight;
		this.triggerListeners('weight', 'setOwnWeight');
		this.schedulePropagate();
	}

	isOwnWeightCustomized(): boolean {
		return this.ownWeight !== this.definitionWeight;
	}

	clearOwnWeight(): void {
		this.setOwnWeight(this.definitionWeight);
	}

	getWeightWithContents(quantity = this.quantity): number {
		let unitWeight = this.ownWeight / this.bundleSize;
		if (this.containerSettings && !this.containerSettings.ignoreContainedWeight) {
			unitWeight += (this.getContents()?.weight || 0) / this.quantity;
		}
		return unitWeight * quantity;
	}

	getAvailableWeight(): number {
		const contentWeight = this.getContents()?.weight || 0;
		const ownLimit = this.containerSettings?.maxContainedWeight || Number.POSITIVE_INFINITY;
		if (isEmpty(this.amounts) || this.containerSettings?.ignoreContainedWeight === true) {
			return ownLimit - contentWeight;
		}
		const parentLimit = sum(Object.entries(this.amounts).map(([containerId, amount]) => (
			ItemManager.getItemById(containerId).getAvailableWeight() * amount / this.quantity
		)));
		return Math.min(ownLimit, parentLimit) - contentWeight;
	}

	isStackable(): boolean {
		return this.stackable;
	}

	getQuantity(): number {
		return this.quantity;
	}

	/** Note that this will NOT_ be propagated into the Redux tree. */
	setQuantity(quantity: number): void {
		this.quantity = quantity;
		this.triggerListeners('amounts', 'setQuantity');
	}

	getUnassignedQuantity(): number {
		return this.quantity - Object.values(this.amounts).reduce((a, b) => a + b, 0);
	}

	getBundleSize(): number {
		return this.bundleSize;
	}

	getAmount(containerId: number | string): number {
		return this.amounts[containerId] || 0;
	}

	setAmount(containerId: number | string, amount: number): void {
		if (amount === 0) {
			delete this.amounts[containerId];
		} else {
			this.amounts[containerId] = amount;
		}
		this.triggerListeners('amounts', 'setAmount');
		ItemManager.getItemById(containerId)?.triggerListeners('contents', `${this.getId()}::setAmount`);
		this.schedulePropagate();
	}

	clearAmounts() {
		this.amounts = {};
		this.triggerListeners('amounts', 'clearAmounts');
		this.schedulePropagate();
	}

	getAmounts(): Record<number, number> {
		return { ...this.amounts };
	}

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

	getAllParents(stack: Item[] = []): Item[] {
		if (stack.includes(this)) {
			throw new Error(`Found cycle trying to gather parents: ${stack.map((i) => i.getId()).join(' -> ')} -> ${this.getId()}`);
		}
		return Object.keys(this.amounts).flatMap((containerId) => {
			const parent = ItemManager.getItemById(containerId);
			return parent ? [parent, ...this.getAllParents([...stack, this])] : [];
		});
	}

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
