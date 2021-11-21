import type { Store } from 'redux';

type InfectedStore = Store & { __beyondUtilsPatched: boolean };

/**
 * A subset of the Redux state of D&D Beyond.
 */
export interface State {
	character: {
		preferences: {
			enableDarkMode: boolean,
		},
	},
}

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

/**
 * A patch function for the redux state.
 *
 * Similar to a reducer this should _not_ mutate the passed state, but instead it should return the new state.
 */
export type Patch = (state: State) => State;

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
	let prevPatchedState: unknown;
	store.getState = () => {
		const state = origGetState();
		if (state === prevState) {
			return prevPatchedState;
		}
		prevState = state;

		let patchedState = state;
		patches.forEach((patch) => {
			patchedState = patch(patchedState);
		});
		prevPatchedState = patchedState;
		return patchedState;
	};
};
