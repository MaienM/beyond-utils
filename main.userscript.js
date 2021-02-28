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
// ==/UserScript==

(() => {
	'use strict';

	const EMPTY_CLASS = 'ct-notes__note--no-content';
	const MARKER_KEY = 'utilitiesProcessedMarkerData';

	const addStyle = (content) => {
		const style = document.createElement('style');
		style.type = 'text/css';
		style.innerHTML = content;
		document.head.append(style);
	};

	addStyle(`
		.markdown-body {
			width: 100%;
			min-height: 32px;
			margin-bottom: -24px;
		}
		.markdown-body * {
			margin-bottom: -10px;
		}
		.markdown-body h1 {
			font-size: 10px;
			font-weight: 700;
			color: #7E4F3D;
			text-transform: uppercase;
			border-bottom: 1px solid #eaeaea;
			margin-top: 2px;
		}
		.markdown-body h2,
		.markdown-body h3 {
			font-size: 13px;
			font-weight: 700;
			color: #3F271E;
			margin-top: 5px;
		}
		.markdown-body h3 {
			font-weight: 500;
			margin-top: 3px;
		}
	`);

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

	MutationObserver = window.MutationObserver || window.WebKitMutationObserver;
	const observer = new MutationObserver(_.debounce(markdownifyNotes, 500, { leading: true, trailing: true }));
	observer.observe(document, { subtree: true, childList: true });
})();
