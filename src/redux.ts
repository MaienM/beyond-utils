import type { Store } from 'redux';
import { logInfo } from 'src/log';
import { getReactInternalState } from 'src/utils';

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
const getReduxStore = (): Store | null => {
	const element = document.querySelector('#character-tools-target .sync-blocker');
	if (!element) {
		return null;
	}

	let internal = getReactInternalState(element);
	while (internal) {
		const store = internal?.memoizedProps?.value?.store;
		if (store) {
			return store;
		}

		internal = internal.return;
	}

	return null;
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
	if (!store || store.__beyondUtilsPatched) {
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
	logInfo('Infected Redux store.');
};
