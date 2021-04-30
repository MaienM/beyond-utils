const MARKER_KEY = 'utilitiesProcessedMarkerData';

/**
 * Check whether the given element has the processed marker with the appropriate data.
 *
 * @param element The HTML element.
 * @param data The value the marker must have.
 * @returns Whether the element has the marker with the right data.
 */
export const hasMarker = (element: HTMLOrSVGElement, data = 'yes'): boolean => {
	const markerData = element.dataset[MARKER_KEY];
	return markerData === data;
};

/**
 * Set the processed marker on the given element.
 *
 * @param element The HTML element.
 * @param data The value to set the marker to.
 */
export const setMarker = (element: HTMLOrSVGElement, data = 'yes'): void => {
	element.dataset[MARKER_KEY] = data;
};
