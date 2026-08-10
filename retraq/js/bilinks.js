/* =======================================================
   Bi-directional Links — v1.2
   Parse [[note title]] in content, render clickable links,
   show backlinks panel on note detail.
   ======================================================= */

const BiLinks = {
    LINK_REGEX: /\[\[([^\]]+)\]\]/g,

    /**
     * Extract all [[link]] targets from text
     * @returns {string[]} unique lowercased link targets
     */
    extractLinks: function(text) {
        if (!text) return [];
        var matches = [];
        var match;
        var regex = new RegExp(BiLinks.LINK_REGEX.source, 'g');
        while ((match = regex.exec(text)) !== null) {
            var target = match[1].trim().toLowerCase();
            if (target && matches.indexOf(target) === -1) {
                matches.push(target);
            }
        }
        return matches;
    },

    /**
     * Resolve [[link]] targets to actual note IDs
     * @returns {Promise<Object>} map of lowercased title → note object
     */
    resolveLinks: function(targets) {
        if (!targets || !targets.length) return Promise.resolve({});

        return RetraqDB.getAllNotes().then(function(allNotes) {
            var map = {};
            allNotes.forEach(function(note) {
                var key = (note.title || '').trim().toLowerCase();
                if (key && targets.indexOf(key) !== -1) {
                    map[key] = note;
                }
            });
            return map;
        });
    },

    /**
     * Render text with [[links]] converted to clickable elements
     * Unresolved links show as create-new prompts
     */
    renderContent: function(text, resolvedMap) {
        if (!text) return '';
        resolvedMap = resolvedMap || {};

        return Utils.escapeHtml(text).replace(/\[\[([^\]]+)\]\]/g, function(match, target) {
            var key = target.trim().toLowerCase();
            var note = resolvedMap[key];
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
    },

    /**
     * Find all notes that link TO a given note (backlinks)
     * @returns {Promise<Object[]>} notes that contain [[noteTitle]] in their content
     */
    getBacklinks: function(noteId) {
        return RetraqDB.getNote(noteId).then(function(note) {
            if (!note) return [];
            var title = (note.title || '').trim().toLowerCase();
            if (!title) return [];

            return RetraqDB.getAllNotes().then(function(allNotes) {
                return allNotes.filter(function(n) {
                    if (n.id === noteId) return false;
                    var links = BiLinks.extractLinks(n.content);
                    return links.indexOf(title) !== -1;
                });
            });
        });
    },

    /**
     * Get forward links for a note (notes this note links to)
     * @returns {Promise<Object[]>}
     */
    getForwardLinks: function(noteId) {
        return RetraqDB.getNote(noteId).then(function(note) {
            if (!note) return [];
            var targets = BiLinks.extractLinks(note.content);
            if (!targets.length) return [];

            return BiLinks.resolveLinks(targets).then(function(map) {
                return Object.keys(map).map(function(key) { return map[key]; });
            });
        });
    },

    /**
     * Render a backlinks panel HTML
     */
    renderBacklinksPanel: function(backlinks) {
        if (!backlinks || !backlinks.length) {
            return '<div class="backlinks-panel">' +
                '<h4 class="backlinks-title">🔗 Backlinks</h4>' +
                '<p class="muted">No other notes link to this note.</p>' +
            '</div>';
        }

        return '<div class="backlinks-panel">' +
            '<h4 class="backlinks-title">🔗 Backlinks (' + backlinks.length + ')</h4>' +
            '<div class="backlinks-list">' +
                backlinks.map(function(note) {
                    var preview = (note.content || '').trim().slice(0, 100);
                    if (preview.length < (note.content || '').length) preview += '…';
                    return '<div class="backlink-item card card-clickable" data-backlink-id="' + note.id + '">' +
                        '<div class="project-title" style="font-size:0.9rem">' + Utils.escapeHtml(note.title) + '</div>' +
                        '<p class="muted" style="font-size:0.8rem;margin-top:0.25rem">' + Utils.escapeHtml(preview) + '</p>' +
                    '</div>';
                }).join('') +
            '</div>' +
        '</div>';
    },

    /**
     * Bind click handlers for bilinks and backlinks inside a container
     */
    bindLinks: function(container, onNavigate) {
        // Resolved bilinks — open the note
        container.querySelectorAll('.bilink-resolved').forEach(function(link) {
            link.addEventListener('click', function(e) {
                e.preventDefault();
                if (onNavigate) onNavigate(link.dataset.noteId);
            });
        });

        // Unresolved bilinks — create new note with that title
        container.querySelectorAll('.bilink-unresolved').forEach(function(link) {
            link.addEventListener('click', function(e) {
                e.preventDefault();
                var title = link.dataset.createTitle;
                window.location.hash = '#/note/new?title=' + encodeURIComponent(title);
            });
        });

        // Backlink items
        container.querySelectorAll('[data-backlink-id]').forEach(function(item) {
            item.addEventListener('click', function() {
                if (onNavigate) onNavigate(item.dataset.backlinkId);
            });
        });
    }
};

window.BiLinks = BiLinks;
