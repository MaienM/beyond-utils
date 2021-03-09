import { sanitize } from 'dompurify';
import EasyMDE from 'easymde';
import marked from 'marked';
import { getReactInternalState, hide, replaceContainerIfNeeded } from 'src/utils';

import 'easymde/dist/easymde.min.css';
import './style.styl';

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
	if (note.classList.contains('ct-notes__note--no-content')) {
		return;
	}
	const container = replaceContainerIfNeeded(note);
	if (container === null) {
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

	container.append(markdownNode);
	textNode.remove();
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
	const reactState = getReactInternalState(editableDiv);
	const noteKey = reactState?.return?.key;
	const onKeyUp = reactState?.memoizedProps.onKeyUp;
	if (!noteKey || !onKeyUp) {
		return;
	}
	const container = replaceContainerIfNeeded(editableDiv.parentNode, noteKey);
	if (!container) {
		return;
	}

	const textarea = document.createElement('textarea');
	container.append(textarea);

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

	hide(editableDiv);
};

/**
 * Replace all plain-text note editors with markdown versions.
 */
export const fancifyEditors = (): void => {
	Array.from(document.getElementsByClassName('ct-note-manage-pane__input'))
		.filter((elem): elem is HTMLElement => elem instanceof HTMLElement)
		.forEach((elem) => fancifyEditor(elem));
};
