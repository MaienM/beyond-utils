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
	addStyle(`
		#tall-layout-button {
			position: fixed;
			bottom: 0;
			height: 15px;
			width: 100%;
			background-color: gray;
			opacity: 10%;
		}
		#tall-layout-button:hover {
			opacity: 100%;
		}
		#tall-layout-button::before {
			content: "Expand";
			position: relative;
			bottom: 3px;
			display: inline-block;
			width: 100%;
			text-align: center;
			font-size: 8pt;
			color: white;
		}
		.ct-character-sheet.layout-tall #tall-layout-button::before {
			content: "Collapse";
		}

		.ct-character-sheet .ct-subsection.ct-subsection--primary-box .ct-primary-box {
			--dynamic-height: 660px;
			height: var(--dynamic-height);
		}
		.ct-character-sheet .ct-subsection.ct-subsection--primary-box .ct-primary-box .ddbc-tab-list__content {
			height: calc(var(--dynamic-height) - 57px);
		}
		.ct-character-sheet .ct-subsection.ct-subsection--primary-box .ct-primary-box .ddbc-tab-options__content  {
			height: calc(var(--dynamic-height) - 100px);
		}
		.ct-character-sheet .ct-subsection.ct-subsection--primary-box .ct-primary-box .ct-equipment {
			height: calc(var(--dynamic-height) - 60px);
		}

		@media(min-width: 1200px) {
			.ct-character-sheet.layout-tall .ct-subsection.ct-subsection--skills .ct-skills-box {
				height: calc(100vh - 345px);
			}
			.ct-character-sheet.layout-tall .ct-subsection.ct-subsection--proficiency-groups .ct-proficiency-groups-box {
				height: calc(100vh - 773px);
			}
			.ct-character-sheet.layout-tall .ct-subsection.ct-subsection--primary-box .ct-primary-box {
				--dynamic-height: calc(max(100vh, 800px) - 450px);
			}
		}

		@media(max-width: 1199px) {
			.ct-character-sheet.layout-tall .ct-subsection.ct-subsection--combat {
				left: 0;
				right: auto;
			}
			.ct-character-sheet.layout-tall .ct-subsection.ct-subsection--combat .ct-combat {
				width: 464px;
			}

			.ct-character-sheet.layout-tall .ct-subsection.ct-subsection--abilities {
				top: 104px;
			}

			.ct-character-sheet.layout-tall .ct-subsection.ct-subsection--senses {
				top: 316px;
			}

			.ct-character-sheet.layout-tall .ct-subsection.ct-subsection--proficiency-groups {
				left: 236px;
				top: 104px;
			}
			.ct-character-sheet.layout-tall .ct-subsection.ct-subsection--proficiency-groups .ct-proficiency-groups-box {
				height: 414px;
			}

			.ct-character-sheet.layout-tall .ct-subsection.ct-subsection--skills {
				left: auto;
				right: 0;
				top: 10;
			}
			.ct-character-sheet.layout-tall .ct-subsection.ct-subsection--skills .ct-skills-box {
				width: 520px;
				height: 518px;
			}
			.ct-character-sheet.layout-tall .ct-subsection.ct-subsection--skills .ct-skills__headers,
			.ct-character-sheet.layout-tall .ct-subsection.ct-subsection--skills .ct-skills__list {
				column-count: 2;
				column-fill: balance;
				gap: 24px;
			}
			.ct-character-sheet.layout-tall .ct-subsection.ct-subsection--skills .ct-skills__header,
			.ct-character-sheet.layout-tall .ct-subsection.ct-subsection--skills .ct-skills__item {
				width: 225px;
			}
			.ct-character-sheet:not(.layout-tall) .ct-subsection.ct-subsection--skills .ct-skills__header:not(:first-child) {
				display: none;
			}
			.ct-character-sheet.layout-tall .ct-subsection.ct-subsection--skills .ct-skills__additional--empty {
				position: absolute;
				left: 0;
				right: 0;
			}

			.ct-character-sheet.layout-tall .ct-subsection.ct-subsection--primary-box {
				top: 531px;
				left: 0;
				width: 100%;
			}
			.ct-character-sheet.layout-tall .ct-subsection.ct-subsection--primary-box .ct-primary-box {
				--dynamic-height: calc(max(100vh, 1200px) - 838px);
				width: auto;
			}
			.ct-character-sheet.layout-tall .ct-subsection.ct-subsection--primary-box .ct-primary-box .ddbc-attack-table__col--name,
			.ct-character-sheet.layout-tall .ct-subsection.ct-subsection--primary-box .ct-primary-box .ddbc-combat-attack__name,
			.ct-character-sheet.layout-tall .ct-subsection.ct-subsection--primary-box .ct-primary-box .ct-spells-level__spells-col--name,
			.ct-character-sheet.layout-tall .ct-subsection.ct-subsection--primary-box .ct-primary-box .ct-spells-spell__name,
			.ct-character-sheet.layout-tall .ct-subsection.ct-subsection--primary-box .ct-primary-box .ct-inventory__col--name,
			.ct-character-sheet.layout-tall .ct-subsection.ct-subsection--primary-box .ct-primary-box .ct-inventory-item__name {
				width: 200px;
			}
		}
	`);

	const update = () => {
		markdownifyNotes();
		fancifyEditors();
		addButtons();
		fixBackgrounds();
		duplicateSkillHeader();
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

	const addButtons = () => {
		const sheet = document.getElementsByClassName('ct-character-sheet')[0];
		if (document.getElementById('tall-layout-button') || !sheet) {
			return;
		}

		const button = document.createElement('div');
		button.id = 'tall-layout-button';
		button.addEventListener('click', () => {
			sheet.classList.toggle('layout-tall');
		});
		sheet.append(button);
	};

	const fixBackgrounds = () => {
		document.getElementsByClassName('ddbc-box-background').forEach(fixBackground);
	};

	const fixBackground = (bg) => {
		const svg = bg.children[0];
		const key = svg.innerHTML; //[...svg.children].map((c) => c.attributes.fill.value).join('|');
		if (!svg || hasMarker(bg, key)) {
			return;
		}
		setMarker(bg, key);

		const { width, height } = svg.viewBox.baseVal;
		if (width < 200 || height < 90) {
			return;
		}
		// Slice the background into 9 parts: the 4 corners (which will not scale), the 4 borders (which will stretch in a single direction), and the center (which will stretch in both directions).
		const xSlice = Math.min(Math.floor(width * 0.45), 50);
		const ySlice = Math.min(Math.floor(height * 0.45), 90);
		const parts = [
			{
				viewbox: [0, 0, xSlice, ySlice],
				element: [`${xSlice}px`, `${ySlice}px`],
			},
			{
				viewbox: [xSlice, 0, width - 2 * xSlice, ySlice],
				element: [`calc(100% - ${2 * xSlice}px)`, `${ySlice}px`],
			},
			{
				viewbox: [width - xSlice, 0, xSlice, ySlice],
				element: [`${xSlice}px`, `${ySlice}px`],
			},
			{
				viewbox: [0, ySlice, xSlice, height - 2 * ySlice],
				element: [`${xSlice}px`, `calc(100% - ${2 * ySlice}px)`],
			},
			{
				viewbox: [xSlice, ySlice, width - 2 * xSlice, height - 2 * ySlice],
				element: [`calc(100% - ${2 * xSlice}px)`, `calc(100% - ${2 * ySlice}px)`],
			},
			{
				viewbox: [width - xSlice, ySlice, xSlice, height - 2 * ySlice],
				element: [`${xSlice}px`, `calc(100% - ${2 * ySlice}px)`],
			},
			{
				viewbox: [0, height - ySlice, xSlice, ySlice],
				element: [`${xSlice}px`, `${ySlice}px`],
			},
			{
				viewbox: [xSlice, height - ySlice, width - 2 * xSlice, ySlice],
				element: [`calc(100% - ${2 * xSlice}px)`, `${ySlice}px`],
			},
			{
				viewbox: [width - xSlice, height - ySlice, xSlice, ySlice],
				element: [`${xSlice}px`, `${ySlice}px`],
			},
		].map(({ viewbox: [vbX, vbY, vbW, vbH], element: [elemW, elemH] }) => {
			const part = svg.cloneNode(true);
			part.viewBox.baseVal.x = vbX;
			part.viewBox.baseVal.y = vbY;
			part.viewBox.baseVal.width = vbW;
			part.viewBox.baseVal.height = vbH;
			part.preserveAspectRatio.baseVal.align = 1;
			part.style.display = 'inline';
			part.style.width = elemW;
			part.style.height = elemH;
			part.style.float = 'left';
			return part;
		});

		svg.style.display = 'none';
		bg.replaceChildren(svg, ...parts);
	};

	const duplicateSkillHeader = () => {
		if (document.getElementById('ct-skills-headers')) {
			return;
		}

		const header = document.getElementsByClassName('ct-skills__header')[0];
		if (!header) {
			return;
		}

		const headers = document.createElement('div');
		headers.id = 'ct-skills-headers';
		headers.classList.add('ct-skills__headers');
		headers.append(header.cloneNode(true));
		headers.append(header.cloneNode(true));
		header.outerHTML = headers.outerHTML;
	};

	MutationObserver = window.MutationObserver || window.WebKitMutationObserver;
	const observer = new MutationObserver(_.debounce(update, 500, { leading: true, trailing: true }));
	observer.observe(document, { subtree: true, childList: true });
})();
