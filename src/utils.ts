import type { Fiber } from 'react-reconciler';

export const CONTAINER_CLASS = 'beyond-utils-container';

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
export const replaceContainerIfNeeded = (parentNode: ParentNode | null, key: unknown = 'static'): HTMLElement | null => {
	if (parentNode === null) {
		return null;
	}

	const keyAsString = JSON.stringify(key);
	const oldContainer = parentNode.querySelector(`:scope > .${CONTAINER_CLASS}`);
	if (oldContainer && oldContainer instanceof HTMLElement && oldContainer.dataset.key === keyAsString) {
		return null;
	}
	oldContainer?.remove();

	const container = document.createElement('div');
	container.classList.add(CONTAINER_CLASS);
	container.dataset.key = keyAsString;
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

/**
 * Show all passed elements by clearing their display style.
 */
export const show = (...elements: HTMLElement[]): void => {
	elements.forEach((element) => {
		element.style.removeProperty('display');
	});
};

/**
 * Hide all passed elements by setting them to 'display: none'.
 */
export const hide = (...elements: HTMLElement[]): void => {
	elements.forEach((element) => {
		element.style.display = 'none';
	});
};

/**
 * Remove nodes in such a way that React will not throw a hissy fit.
 *
 * Text nodes can just be removed, but Elements cannot and are instead hidden.
 */
export const remove = (...nodes: (Node | null | undefined)[]): void => {
	nodes.forEach((node) => {
		if (!node) {
			return;
		}
		if (node.nodeType === Node.TEXT_NODE) {
			node.textContent = '';
		} else if (node instanceof HTMLElement) {
			hide(node);
		} else {
			throw new Error(`Don't know how to handle node ${node}.`);
		}
	});
};
