import { getReactInternalState, replaceContainerIfNeeded } from 'src/utils';

import './style.styl';

const cloneWithClick = (element: HTMLElement): HTMLElement => {
	const onClick = getReactInternalState(element.querySelector('.ct-inventory-item') || element)?.memoizedProps?.onClick;

	const clone = element.cloneNode(true) as HTMLElement;
	clone.addEventListener('click', (e) => {
		onClick({ ...e, nativeEvent: e });
	});

	return clone;
};

/**
 * Make the headers in the inventory sticky.
 */
export const applyStickyInventoryHeaders = () => {
	const equipmentContainer = document.querySelector('.ct-equipment__content > .ddbc-tab-options');
	if (!(equipmentContainer instanceof HTMLElement)) {
		return;
	}

	const container = replaceContainerIfNeeded(equipmentContainer);
	if (!container) {
		return;
	}

	const scrolling = equipmentContainer.querySelector('.ddbc-tab-options__body');
	const header = scrolling?.querySelector('.ct-inventory__row-header');
	if (!(scrolling instanceof HTMLElement) || !(header instanceof HTMLElement)) {
		return;
	}

	scrolling.before(container);
	container.append(header.cloneNode(true));

	let currentTargetHeader = scrolling.querySelector('.ct-content-group__header');
	if (!(currentTargetHeader instanceof HTMLElement)) {
		return;
	}
	let currentHeader = cloneWithClick(currentTargetHeader);
	container.append(currentHeader);

	scrolling.addEventListener('scroll', () => {
		const headers = Array.from(scrolling.querySelectorAll('.ct-content-group__header')) as HTMLElement[];

		// The headers' offsetParent is not the scrolling container (but it is the same as the offsetParent of the scrolling container), so account for that in the scrollTop to compare to.
		const scrollingOffset = scrolling.offsetTop + scrolling.scrollTop;
		const indexFirstVisible = headers.findIndex((e) => e.offsetTop > scrollingOffset);

		const newTargetHeader = headers[Math.max(1, indexFirstVisible === -1 ? headers.length : indexFirstVisible) - 1];
		const newHeader = newTargetHeader === currentTargetHeader ? currentHeader : cloneWithClick(newTargetHeader);
		currentTargetHeader = newTargetHeader;

		// Position header such that if the non-sticky version hasn't quite scrolled off-screen it completes the clipped portion, giving the appearance of a single not-yet-sticky header that extends into the region above the scrolled area.
		const margin = Math.max(0, newTargetHeader.offsetTop + newTargetHeader.offsetHeight - scrollingOffset);
		newHeader.style.setProperty('margin-top', `${margin}px`);

		if (newHeader === currentHeader) {
			// No need to do anything.
		} else if (newHeader && currentHeader) {
			container.replaceChild(newHeader, currentHeader);
		} else if (newHeader) {
			container.appendChild(newHeader);
		} else {
			container.removeChild(currentHeader);
		}
		currentHeader = newHeader;
	});
	scrolling.dispatchEvent(new Event('scroll'));
};
