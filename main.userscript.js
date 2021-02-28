// ==UserScript==
// @name         DND Beyond Utilities
// @namespace    https://maienm.com/
// @version      0.1
// @description  DND Beyond stuff.
// @author       You
// @match        https://www.dndbeyond.com/profile/*/characters/*
// @grant        none
// @require      https://cdnjs.cloudflare.com/ajax/libs/lodash.js/4.17.21/lodash.min.js
// @require      https://cdnjs.cloudflare.com/ajax/libs/marked/2.0.0/marked.min.js
// @require      https://cdnjs.cloudflare.com/ajax/libs/dompurify/2.2.6/purify.min.js
// @require      https://unpkg.com/easymde/dist/easymde.min.js
// ==/UserScript==

(() => {
	'use strict';

	const EMPTY_CLASS = 'ct-notes__note--no-content';
	const MARKER_KEY = 'utilitiesProcessedMarkerData';

	const addLink = (url) => {
		const link = document.createElement('link');
		link.rel = 'stylesheet';
		link.href = url;
		document.head.append(link);
	};

	const addStyle = (content) => {
		const style = document.createElement('style');
		style.type = 'text/css';
		style.innerHTML = content;
		document.head.append(style);
	};

	addLink('https://unpkg.com/easymde/dist/easymde.min.css');
	addStyle(`
		.markdown-body {
			width: 100%;
			min-height: 32px;
			margin-bottom: -24px;
		}
		.markdown-body *,
		.ct-sidebar .editor-preview * {
			margin-bottom: -10px;
		}
		.ct-sidebar .editor-preview h1,
		.ct-sidebar .editor-preview h2,
		.ct-sidebar .editor-preview h3 {
			font-family: Roboto,Helvetica,sans-serif;
		}
		.markdown-body h1,
		.ct-sidebar .editor-preview h1,
		.ct-sidebar .CodeMirror .cm-header-1 {
			font-size: 10px;
			font-weight: 700;
			color: #7E4F3D;
			text-transform: uppercase;
			border-bottom: 1px solid #eaeaea;
			margin-top: 2px;
		}
		.markdown-body h2,
		.markdown-body h3,
		.ct-sidebar .editor-preview h2,
		.ct-sidebar .editor-preview h3,
		.ct-sidebar .CodeMirror .cm-header-2,
		.ct-sidebar .CodeMirror .cm-header-3 {
			font-size: 13px;
			font-weight: 700;
			color: #3F271E;
			margin-top: 5px;
		}
		.markdown-body h3,
		.ct-sidebar .editor-preview h3,
		.ct-sidebar .CodeMirror .cm-header-3 {
			font-weight: 500;
			margin-top: 3px;
		}
		.editor-toolbar button {
			width: 24px;
			height: 24px;
		}
	`);

	const update = () => {
		markdownifyNotes();
		fancifyEditors();
	};

	const hasMarker = (container, data = 'yes') => {
		const markerData = container.dataset[MARKER_KEY];
		return markerData === data;
	};

	const setMarker = (container, data = 'yes') => {
		container.dataset[MARKER_KEY] = data;
	};

	const renderMarkdown = (content) => {
		return DOMPurify.sanitize(marked(content, { gfm: true }));
	};

	const markdownifyNotes = () => {
		document.getElementsByClassName('ct-notes__note').forEach(markdownifyNote);
	};

	const markdownifyNote = (note) => {
		if (hasMarker(note) || note.classList.contains(EMPTY_CLASS)) {
			return;
		}
		setMarker(note);

		let markdown = note.textContent;
		if (markdown.trim() === '') {
			const title = note.parentNode.parentNode.children[0].textContent;
			markdown = `\\+ Add ${title}`;
			note.classList.add(EMPTY_CLASS);
		}
		markdown = renderMarkdown(markdown);

		const content = document.createElement('div');
		content.classList.add('markdown-body');
		content.innerHTML = markdown;
		note.replaceChildren(content);
	};

	const fancifyEditors = () => {
		document.getElementsByClassName('ct-note-manage-pane__content').forEach(fancifyEditor);
	};

	const fancifyEditor = (container) => {
		if (hasMarker(container)) {
			return;
		}
		setMarker(container);

		const div = container.children[0];
		div.hidden = true;

		// This is an awful thing to do, but dispatching keyup events doesn't work because of security considerations.
		const reactHandle = div[Object.keys(div).find((key) => key.startsWith('__reactEventHandlers$'))];
		const onKeyUp = reactHandle ? reactHandle.onKeyUp : () => null;

		const textarea = document.createElement('textarea');
		container.append(textarea)

		const editor = new EasyMDE({
			element: textarea,
			value: div.textContent,
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
					name: "others",
					className: "fa fa-ellipsis-v",
					title: "More",
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
		editor.value(div.textContent);
		editor.codemirror.on('change', () => {
			div.textContent = editor.value();
			onKeyUp();
		});
		editor.codemirror.on('blur', () => {
			div.dispatchEvent(new Event('blur'));
		});
	};

	MutationObserver = window.MutationObserver || window.WebKitMutationObserver;
	const observer = new MutationObserver(_.debounce(update, 500, { leading: true, trailing: true }));
	observer.observe(document, { subtree: true, childList: true });
})();
