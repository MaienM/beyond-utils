import './style.styl';

/**
 * Create a popup element.
 */
export const makePopup = (
	baseClass: string,
	builder: (root: HTMLElement, innerBox: HTMLElement) => void,
): HTMLElement => {
	const root = document.createElement('div');
	root.classList.add('beyond-utils-popup', baseClass);

	const shadow = document.createElement('div');
	shadow.classList.add('beyond-utils-popup__shadow', `${baseClass}__shadow`);
	shadow.addEventListener('click', (e) => {
		e.stopPropagation();
		root.remove();
	});
	root.append(shadow);

	const box = document.createElement('div');
	box.classList.add('beyond-utils-popup__box', `${baseClass}__box`);
	box.addEventListener('click', (e) => {
		e.stopPropagation();
	});
	root.append(box);

	const background = document.querySelector('.ct-primary-box > .ddbc-box-background')?.cloneNode(true) as HTMLElement;
	if (background) {
		background?.classList.add('beyond-utils-popup__box-background', `${baseClass}__box-background`);
		box.append(background || '');
	}

	const innerBox = document.createElement('div');
	innerBox.classList.add('beyond-utils-popup__inner-box', `${baseClass}__inner-box`);
	builder(root, innerBox);
	box.append(innerBox);

	const container = document.getElementById('ddbcc-popup-container') || document.body;
	container.append(root);

	return root;
};
