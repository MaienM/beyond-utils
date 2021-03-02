import { sanitize } from 'dompurify';
import EasyMDE from 'easymde';
import marked from 'marked';
import { hasMarker, setMarker } from './marker';

import 'easymde/dist/easymde.min.css';
import './markdown.css';

/**
 * Compile markdown into sanitized HTML.
 *
 * @param markdown The markdown code.
 * @returns The HTML code.
 */
const renderMarkdown = (markdown: string): string => sanitize(marked(markdown, { gfm: true }));

/**
 * Replace a plain-text note with a markdown version.
 *
 * @param note The note element.
 */
const markdownifyNote = (note: HTMLElement): void => {
	// On a rerender the contents are replaced with text, so we can look at the presence of the markdown-body element to see if this needs processing.
	if (note.classList.contains('ct-notes__note--no-content') || note.querySelector('.markdown-body')) {
		return;
	}

	const textNode = note.childNodes[0];
	let markdown = textNode.textContent || '';
	if (markdown.trim() === '') {
		const title = note.parentNode?.parentNode?.children[0].textContent || 'note';
		markdown = `\\+ Add ${title}`;
		note.classList.add('ct-notes__note--no-content');
	}
	markdown = renderMarkdown(markdown);

	const markdownNode = document.createElement('div');
	markdownNode.classList.add('markdown-body');
	markdownNode.innerHTML = markdown;

	textNode.remove();
	note.append(markdownNode);
};

/**
 * Replace all plain-text notes with markdown versions.
 */
export const markdownifyNotes = (): void => {
	Array.from(document.getElementsByClassName('ct-notes__note'))
		.filter((elem): elem is HTMLElement => elem instanceof HTMLElement)
		.forEach((elem) => markdownifyNote(elem));
};

/**
 * Replace a plain-text note editor with a markdown version.
 *
 * @param editableDiv The editable div acting as the editor.
 */
const fancifyEditor = (editableDiv: HTMLElement): void => {
	if (hasMarker(editableDiv)) {
		return;
	}
	setMarker(editableDiv);

	// This is an awful thing to do, but browsers do not allow you dispatching synthetic keyup events because of security considerations, so we cannot pass change events to the editableDiv to trigger autosave. To work around this we dig into the React metadata to get the onKeyUp prop, which contains the callback responsible for this behaviour.
	const reactHandle: { onKeyUp: () => void } = Object.entries(editableDiv).find(([key]) => key.startsWith('__reactEventHandlers$'))?.[1];
	const onKeyUp = reactHandle ? reactHandle.onKeyUp : () => null;

	const textarea = document.createElement('textarea');
	editableDiv.parentNode?.append(textarea);
	// eslint-disable-next-line no-param-reassign
	editableDiv.style.display = 'none';

	const editor = new EasyMDE({
		element: textarea,
		initialValue: editableDiv.textContent || undefined,
		autofocus: true,
		// Use marked for preview.
		previewRender: renderMarkdown,
		// The built-in spellchecker is pretty bad, so use the native one.
		spellChecker: false,
		inputStyle: 'contenteditable',
		// Show some of the simple actions that are most likely to be used in  notes, and hide the rest in a menu. Also only show the header buttons for header types that have custom styling.
		toolbar: [
			'bold',
			'italic',
			'strikethrough',
			'|',
			'heading-1',
			'heading-2',
			'heading-3',
			{
				name: 'others',
				className: 'fa fa-ellipsis-v',
				title: 'More',
				children: [
					'quote',
					'unordered-list',
					'ordered-list',
					'table',
					'horizontal-rule',
					'image',
					'link',
				],
			},
			'|',
			'preview',
		],
	});
	editor.codemirror.on('change', () => {
		// eslint-disable-next-line no-param-reassign
		editableDiv.textContent = editor.value();
		onKeyUp();
	});
	editor.codemirror.on('blur', () => {
		editableDiv.dispatchEvent(new Event('blur'));
	});
};

/**
 * Replace all plain-text note editors with markdown versions.
 */
export const fancifyEditors = (): void => {
	Array.from(document.getElementsByClassName('ct-note-manage-pane__input'))
		.filter((elem): elem is HTMLElement => elem instanceof HTMLElement)
		.forEach((elem) => fancifyEditor(elem));
};
