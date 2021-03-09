/**
 * The items as they are stored by D&D Beyond internally.
 */
export interface BeyondItem {
	readonly cost: number;
	readonly definition: {
		readonly stackable: boolean;
		readonly weight: number;
		readonly bundleSize: number;
		readonly rarity: 'Common' | 'Uncommon' | 'Rare' | 'Very Rare' | 'Legendary';
		readonly type: string;
		readonly subType: string | null;
	};
	readonly entityTypeId: number;
	readonly id: number;
	readonly name: string;
	readonly notes: string;
	readonly quantity: number;
	readonly weight: number;
}

/**
 * The basic form used when dispatching actions in D&D Beyond's Redux store.
 */
export interface BeyondReduxAction {
	type: string;
	payload: unknown;
	meta: {
		commit: {
			type: string;
		}
	}
}

export type BeyondReduxDispatch = (action: BeyondReduxAction) => void;
