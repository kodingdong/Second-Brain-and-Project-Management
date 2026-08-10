/**
 * Markdown — Lightweight zero-dependency Markdown renderer
 * Supports: headings, bold, italic, strikethrough, code, blockquote,
 *           ordered/unordered lists, horizontal rules, images, links,
 *           [[wikilinks]], checkboxes, and code blocks.
 */
const Markdown = {
    /**
     * Convert markdown text to HTML string
     * @param {string} text - raw markdown content
     * @param {Object} resolvedLinks - map of lowercased title → note object (from BiLinks)
     * @returns {string} rendered HTML
     */
    render: function(text, resolvedLinks) {
        if (!text) return '<p class="md-empty">Empty note</p>';
        resolvedLinks = resolvedLinks || {};

        var lines = text.split('\n');
        var html = [];
        var inCodeBlock = false;
        var codeBlockLang = '';
        var codeBuffer = [];
        var inList = false;
        var listType = '';
        var listBuffer = [];

        for (var i = 0; i < lines.length; i++) {
            var line = lines[i];

            // --- Fenced code blocks ---
            if (line.trim().match(/^```/)) {
                if (inCodeBlock) {
                    html.push('<pre class="md-code-block"><code class="md-code-lang-' +
                        Utils.escapeHtml(codeBlockLang || 'text') + '">' +
                        Utils.escapeHtml(codeBuffer.join('\n')) + '</code></pre>');
                    codeBuffer = [];
                    codeBlockLang = '';
                    inCodeBlock = false;
                } else {
                    // Flush any open list
                    if (inList) {
                        html.push(Markdown._flushList(listType, listBuffer, resolvedLinks));
                        inList = false;
                        listBuffer = [];
                    }
                    inCodeBlock = true;
                    codeBlockLang = line.trim().slice(3).trim();
                }
                continue;
            }
            if (inCodeBlock) {
                codeBuffer.push(line);
                continue;
            }

            // --- Horizontal rule ---
            if (line.trim().match(/^(-{3,}|\*{3,}|_{3,})$/)) {
                if (inList) {
                    html.push(Markdown._flushList(listType, listBuffer, resolvedLinks));
                    inList = false;
                    listBuffer = [];
                }
                html.push('<hr class="md-hr">');
                continue;
            }

            // --- Headings ---
            var headingMatch = line.match(/^(#{1,6})\s+(.+)$/);
            if (headingMatch) {
                if (inList) {
                    html.push(Markdown._flushList(listType, listBuffer, resolvedLinks));
                    inList = false;
                    listBuffer = [];
                }
                var level = headingMatch[1].length;
                html.push('<h' + level + ' class="md-h' + level + '">' +
                    Markdown._inline(headingMatch[2], resolvedLinks) + '</h' + level + '>');
                continue;
            }

            // --- Blockquote ---
            if (line.match(/^>\s?/)) {
                if (inList) {
                    html.push(Markdown._flushList(listType, listBuffer, resolvedLinks));
                    inList = false;
                    listBuffer = [];
                }
                var quoteContent = line.replace(/^>\s?/, '');
                html.push('<blockquote class="md-blockquote">' +
                    Markdown._inline(quoteContent, resolvedLinks) + '</blockquote>');
                continue;
            }

            // --- Unordered list ---
            var ulMatch = line.match(/^(\s*)([-*+])\s+(.+)$/);
            if (ulMatch) {
                if (!inList || listType !== 'ul') {
                    if (inList) {
                        html.push(Markdown._flushList(listType, listBuffer, resolvedLinks));
                        listBuffer = [];
                    }
                    inList = true;
                    listType = 'ul';
                }
                listBuffer.push(ulMatch[3]);
                continue;
            }

            // --- Ordered list ---
            var olMatch = line.match(/^(\s*)\d+[.)]\s+(.+)$/);
            if (olMatch) {
                if (!inList || listType !== 'ol') {
                    if (inList) {
                        html.push(Markdown._flushList(listType, listBuffer, resolvedLinks));
                        listBuffer = [];
                    }
                    inList = true;
                    listType = 'ol';
                }
                listBuffer.push(olMatch[2]);
                continue;
            }

            // --- Non-list line: flush any open list ---
            if (inList) {
                html.push(Markdown._flushList(listType, listBuffer, resolvedLinks));
                inList = false;
                listBuffer = [];
            }

            // --- Empty line ---
            if (!line.trim()) {
                // Only add spacer if previous element isn't already a spacer
                if (html.length > 0 && html[html.length - 1] !== '<div class="md-spacer"></div>') {
                    html.push('<div class="md-spacer"></div>');
                }
                continue;
            }

            // --- Paragraph ---
            html.push('<p class="md-p">' + Markdown._inline(line, resolvedLinks) + '</p>');
        }

        // Close any open code block
        if (inCodeBlock) {
            html.push('<pre class="md-code-block"><code>' +
                Utils.escapeHtml(codeBuffer.join('\n')) + '</code></pre>');
        }
        // Close any open list
        if (inList) {
            html.push(Markdown._flushList(listType, listBuffer, resolvedLinks));
        }

        return html.join('\n');
    },

    /**
     * Flush a list buffer into an <ul> or <ol>
     */
    _flushList: function(type, items, resolvedLinks) {
        var tag = type === 'ol' ? 'ol' : 'ul';
        return '<' + tag + ' class="md-list md-' + tag + '">' +
            items.map(function(item) {
                // Checkbox support: - [ ] or - [x]
                var checkMatch = item.match(/^\[( |x|X)\]\s*(.*)/);
                if (checkMatch) {
                    var checked = checkMatch[1].toLowerCase() === 'x';
                    return '<li class="md-checkbox-item">' +
                        '<span class="md-checkbox ' + (checked ? 'md-checked' : '') + '">' +
                            (checked ? '✓' : '') +
                        '</span>' +
                        '<span' + (checked ? ' class="md-checked-text"' : '') + '>' +
                            Markdown._inline(checkMatch[2], resolvedLinks) +
                        '</span></li>';
                }
                return '<li>' + Markdown._inline(item, resolvedLinks) + '</li>';
            }).join('') +
        '</' + tag + '>';
    },

    /**
     * Process inline markdown: bold, italic, code, strikethrough, links, images, wikilinks
     */
    _inline: function(text, resolvedLinks) {
        if (!text) return '';
        var s = Utils.escapeHtml(text);

        // Inline code (must be first to prevent other transforms inside code)
        s = s.replace(/`([^`]+)`/g, '<code class="md-inline-code">$1</code>');

        // Images: ![alt](url)
        s = s.replace(/!\[([^\]]*)\]\(([^)]+)\)/g,
            '<img class="md-img" src="$2" alt="$1" loading="lazy">');

        // Links: [text](url)
        s = s.replace(/\[([^\]]+)\]\(([^)]+)\)/g,
            '<a class="md-link" href="$2" target="_blank" rel="noopener">$1</a>');

        // Wikilinks: [[title]] → clickable bilinks
        s = s.replace(/\[\[([^\]]+)\]\]/g, function(match, target) {
            var key = target.trim().toLowerCase();
            var note = resolvedLinks[key];
            if (note) {
                return '<a href="#" class="bilink bilink-resolved" data-note-id="' +
                    Utils.escapeHtml(note.id) + '" title="Open: ' +
                    Utils.escapeHtml(note.title) + '">' +
                    Utils.escapeHtml(target.trim()) + '</a>';
            } else {
                return '<a href="#" class="bilink bilink-unresolved" data-create-title="' +
                    Utils.escapeHtml(target.trim()) + '" title="Create note: ' +
                    Utils.escapeHtml(target.trim()) + '">' +
                    Utils.escapeHtml(target.trim()) + '<sup>+</sup></a>';
            }
        });

        // Bold + Italic: ***text*** or ___text___
        s = s.replace(/\*{3}(.+?)\*{3}/g, '<strong><em>$1</em></strong>');
        s = s.replace(/_{3}(.+?)_{3}/g, '<strong><em>$1</em></strong>');

        // Bold: **text** or __text__
        s = s.replace(/\*{2}(.+?)\*{2}/g, '<strong>$1</strong>');
        s = s.replace(/_{2}(.+?)_{2}/g, '<strong>$1</strong>');

        // Italic: *text* or _text_
        s = s.replace(/\*(.+?)\*/g, '<em>$1</em>');
        s = s.replace(/_(.+?)_/g, '<em>$1</em>');

        // Strikethrough: ~~text~~
        s = s.replace(/~~(.+?)~~/g, '<del>$1</del>');

        // Highlight: ==text==
        s = s.replace(/==(.+?)==/g, '<mark class="md-highlight">$1</mark>');

        // Tags: #tag or #parent/child
        s = s.replace(/(^|\s)#([a-zA-Z_][\w/-]*)/g, '$1<span class="md-tag" data-tag="$2">#$2</span>');

        return s;
    }
};

window.Markdown = Markdown;
