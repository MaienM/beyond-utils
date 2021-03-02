import type { Fiber } from 'react-reconciler';

const CONTAINER_CLASS = 'dnd-utils-container';

/**
 * Create a container element to work in if needed, and clean up old containers.
 *
 * Each element in which we make adjustments will have a single element (the container element) injected into it. This element will contain all our changes so that we can easily find and replace them on subsequent runs.
 *
 * To detect whether a container needs to be recreated a key is passed. If the key stays the same the container can stay, if the key changes the container needs to be recreated.
 *
 * This function looks for existing container elements and compares the new key with the one the container was created with.
 *
 * If the container exists and has the right key, null is returned.
 * If the container exists and has the wrong key **it is deleted** and a new container is returned.
 * If the element does not exist a new container is returned.
 *
 * @param parentNode The parent node that the container should exist in.
 * @param key The key.
 * @returns A new container if work has to be done, or null if the parent contains an up-to-date container.
 */
export const replaceContainerIfNeeded = (parentNode: ParentNode | null, key = 'static'): HTMLElement | null => {
	if (parentNode === null) {
		return null;
	}

	const oldContainer = parentNode.querySelector(`.${CONTAINER_CLASS}`);
	if (oldContainer && oldContainer instanceof HTMLElement && oldContainer.dataset.key === key) {
		return null;
	}
	oldContainer?.remove();

	const container = document.createElement('div');
	container.classList.add(CONTAINER_CLASS);
	container.dataset.key = key;
	parentNode.append(container);
	return container;
};

/**
 * Get the internal React state for a given DOM node.
 *
 * @param node The DOM node to get the state of.
 * @returns The internal state if it was found, or null otherwise.
 */
export const getReactInternalState = (node: Node): Fiber | null => (
	Object.entries(node).find(([key]) => key.startsWith('__reactInternalInstance$'))?.[1]
);
