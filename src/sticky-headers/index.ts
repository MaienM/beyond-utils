import { getReactInternalState, replaceContainerIfNeeded } from 'src/utils';

import './style.styl';

const isDesktop = (): boolean => !!document.querySelector('.ct-character-sheet-desktop');

const cloneWithClick = (element: HTMLElement): HTMLElement => {
	const onClick = getReactInternalState(element.querySelector('.ct-inventory-item') || element)?.memoizedProps?.onClick;

	const clone = element.cloneNode(true) as HTMLElement;
	clone.addEventListener('click', (e) => {
		onClick({ ...e, nativeEvent: e });
	});

	return clone;
};

class ContainerHeaderManager {
	// eslint-disable-next-line no-use-before-define
	private static _instance?: ContainerHeaderManager;

	static initialize(): ContainerHeaderManager {
		if (!this._instance) {
			this._instance = new ContainerHeaderManager();
		}
		return this._instance;
	}

	public container: HTMLElement;

	public sourceHeader: HTMLElement;

	public header: HTMLElement;

	private constructor() {
		this.container = document.createElement('div');
		this.sourceHeader = document.createElement('div');
		this.header = document.createElement('div');
		this.container.appendChild(this.header);
	}

	setContainer(container: HTMLElement) {
		container.appendChild(this.header);
		this.container = container;
	}

	updateHeader(scrollingOffset: number) {
		const headers = Array.from(document.querySelectorAll('.ct-equipment .ddbc-tab-options__content .ct-content-group__header')) as HTMLElement[];
		if (headers.length === 0) {
			return;
		}
		const indexFirstVisible = headers.findIndex((e) => e.offsetTop > scrollingOffset);

		const newSourceHeader = headers[Math.max(1, indexFirstVisible === -1 ? headers.length : indexFirstVisible) - 1];
		if (newSourceHeader === this.sourceHeader) {
			this.updatePosition(this.header, scrollingOffset);
			return;
		}
		this.sourceHeader = newSourceHeader;

		const newHeader = cloneWithClick(newSourceHeader);
		this.updatePosition(newHeader, scrollingOffset);

		if (newHeader && this.header) {
			this.container.replaceChild(newHeader, this.header);
		} else if (newHeader) {
			this.container.appendChild(newHeader);
		} else {
			this.container.removeChild(this.header);
		}
		this.header = newHeader;
	}

	private updatePosition(header: HTMLElement, scrollingOffset: number) {
		// Position header such that if the non-sticky version hasn't quite scrolled off-screen it completes the clipped portion, giving the appearance of a single not-yet-sticky header that extends into the region above the scrolled area.
		const margin = Math.max(0, this.sourceHeader.offsetTop + this.sourceHeader.offsetHeight - scrollingOffset);
		header.style.setProperty('margin-top', `${margin}px`);
	}
}

/**
 * Create the container for the sticky headers.
 */
const addStickyHeaderContainer = () => {
	const equipmentContainer = document.querySelector('.ct-equipment__content > .ddbc-tab-options');
	if (!(equipmentContainer instanceof HTMLElement)) {
		return;
	}

	const container = replaceContainerIfNeeded(equipmentContainer);
	if (!container) {
		return;
	}

	const scrolling = equipmentContainer.querySelector('.ddbc-tab-options__body');
	const columnHeader = scrolling?.querySelector('.ct-inventory__row-header');
	if (!(scrolling instanceof HTMLElement) || !(columnHeader instanceof HTMLElement)) {
		return;
	}

	scrolling.before(container);
	container.append(columnHeader.cloneNode(true));

	const headerManager = ContainerHeaderManager.initialize();
	headerManager.setContainer(container);

	// Desktop.
	scrolling.addEventListener('scroll', () => {
		const scrollingOffset = scrolling.offsetTop + scrolling.scrollTop;
		headerManager.updateHeader(scrollingOffset);
	});
	scrolling.dispatchEvent(new Event('scroll'));
};

let setupScrollHandlers = false;

/**
 * Setup scrolling handlers for tablet/mobile.
 */
const addStickyHeaderScrollHandlers = () => {
	if (setupScrollHandlers) {
		return;
	}
	setupScrollHandlers = true;

	const headerManager = ContainerHeaderManager.initialize();
	let lastScrollingOffset = -1;
	let lastChange = -1;
	let running = false;
	const update = (timestamp: number) => {
		const scrollingOffset = headerManager.container.offsetTop + headerManager.container.offsetHeight;
		if (scrollingOffset !== lastScrollingOffset) {
			lastChange = timestamp;
		} else if (timestamp - lastChange > 200) {
			running = false;
			return;
		}
		const movementCompensation = Math.max(0, scrollingOffset - lastScrollingOffset) ** 1.4;
		lastScrollingOffset = scrollingOffset;

		headerManager.updateHeader(scrollingOffset);

		const body = document.querySelector('.ct-equipment .ddbc-tab-options__body');
		if (body instanceof HTMLElement) {
			body.style.setProperty('clip-path', `inset(${scrollingOffset - body.offsetTop + movementCompensation}px 0 0)`);
		}

		requestAnimationFrame(update);
	};

	window.addEventListener('scroll', () => {
		if (isDesktop() || running) {
			return;
		}
		running = true;
		requestAnimationFrame(update);
	});
};

/**
 * Make the headers in the inventory sticky.
 */
export const applyStickyInventoryHeaders = () => {
	addStickyHeaderContainer();
	addStickyHeaderScrollHandlers();
};
