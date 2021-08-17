import { cloneDeep } from 'lodash';
import type { Store } from 'redux';

type InfectedStore = Store & { __beyondUtilsPatched: boolean };

/**
 * Get the internal Redux store.
 *
 * @returns The internal store.
 */
const getReduxStore = (): Store => {
	const root = document.getElementById('character-tools-target');
	if (!root) {
		throw new Error('Unable to find root node.');
	}
	const state = Object.entries(root).find(([key]) => key.startsWith('__reactContainere$'))?.[1];
	const store = state?.memoizedState?.element?.props?.store;
	if (!(store && store.dispatch && store.getState)) {
		throw new Error('Unable to get Redux store from root node.');
	}
	return store;
};

export type State = Record<string, unknown>;

/**
 * A patch function for the redux state.
 *
 * This methos should make changes directly in the passed state (which is already a cloned version).
 */
export type Patch = (state: State) => void;

const patches: Patch[] = [];

/**
 * Register a patch to be applied to the state returned from getState.
 */
export const addPatch = (patch: Patch): void => {
	patches.push(patch);
};

/**
 * Modify the store to use a modified getState method that applies the patches.
 *
 * Idempotent.
 */
export const infectStore = (): void => {
	const store = getReduxStore() as InfectedStore;
	if (store.__beyondUtilsPatched) {
		return;
	}
	store.__beyondUtilsPatched = true;
	const origGetState = store.getState.bind(store);
	let prevState: unknown;
	let prevModifiedState: unknown;
	store.getState = () => {
		const state = origGetState();
		if (state === prevState) {
			return prevModifiedState;
		}
		prevState = state;

		const modifiedState = cloneDeep(state);
		patches.forEach((patch) => patch(modifiedState));
		prevModifiedState = modifiedState;
		return modifiedState;
	};
};
