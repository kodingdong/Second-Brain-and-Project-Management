/**
 * Command Palette — Obsidian-style quick switcher (Ctrl+K)
 * Fuzzy search across pages, notes, projects, and actions
 */
const CommandPalette = {
    isOpen: false,
    selectedIndex: 0,
    results: [],

    open: function() {
        if (CommandPalette.isOpen) return;
        CommandPalette.isOpen = true;
        CommandPalette.selectedIndex = 0;

        var backdrop = document.createElement('div');
        backdrop.className = 'cmd-backdrop';
        backdrop.id = 'cmd-backdrop';

        var palette = document.createElement('div');
        palette.className = 'cmd-palette';
        palette.id = 'cmd-palette';
        palette.innerHTML =
            '<div class="cmd-input-wrap">' +
                '<span class="cmd-input-icon">⌕</span>' +
                '<input type="text" class="cmd-input" id="cmd-input" placeholder="Search or jump to…" autocomplete="off" spellcheck="false">' +
                '<kbd class="cmd-kbd">ESC</kbd>' +
            '</div>' +
            '<div class="cmd-results" id="cmd-results"></div>' +
            '<div class="cmd-footer">' +
                '<span><kbd>↑↓</kbd> navigate</span>' +
                '<span><kbd>↵</kbd> open</span>' +
                '<span><kbd>esc</kbd> close</span>' +
            '</div>';

        backdrop.appendChild(palette);
        document.body.appendChild(backdrop);

        var input = document.getElementById('cmd-input');
        setTimeout(function() { input.focus(); }, 50);

        // Show recent/default items
        CommandPalette.showDefaults();

        // Bind events
        input.addEventListener('input', function() {
            CommandPalette.search(input.value);
        });

        input.addEventListener('keydown', function(e) {
            if (e.key === 'ArrowDown') {
                e.preventDefault();
                CommandPalette.moveSelection(1);
            } else if (e.key === 'ArrowUp') {
                e.preventDefault();
                CommandPalette.moveSelection(-1);
            } else if (e.key === 'Enter') {
                e.preventDefault();
                CommandPalette.executeSelected();
            } else if (e.key === 'Escape') {
                CommandPalette.close();
            }
        });

        backdrop.addEventListener('click', function(e) {
            if (e.target === backdrop) CommandPalette.close();
        });
    },

    close: function() {
        var backdrop = document.getElementById('cmd-backdrop');
        if (backdrop) {
            backdrop.classList.add('cmd-closing');
            setTimeout(function() {
                if (backdrop.parentNode) backdrop.parentNode.removeChild(backdrop);
            }, 150);
        }
        CommandPalette.isOpen = false;
    },

    showDefaults: function() {
        var items = [
            { type: 'page', icon: '⊞', label: 'Dashboard', action: function() { window.location.hash = '#/'; } },
            { type: 'page', icon: '◧', label: 'Projects', action: function() { window.location.hash = '#/projects'; } },
            { type: 'page', icon: '◫', label: 'Inbox', action: function() { window.location.hash = '#/inbox'; } },
            { type: 'page', icon: '◇', label: 'Daily Notes', action: function() { window.location.hash = '#/daily'; } },
            { type: 'page', icon: '◉', label: 'Habits', action: function() { window.location.hash = '#/habits'; } },
            { type: 'page', icon: '▤', label: 'Library', action: function() { window.location.hash = '#/library'; } },
            { type: 'page', icon: '⌕', label: 'Search', action: function() { window.location.hash = '#/search'; } },
            { type: 'page', icon: '↻', label: 'Review', action: function() { window.location.hash = '#/review'; } },
            { type: 'action', icon: '＋', label: 'New Project', action: function() { Projects.showCreateModal(); } },
            { type: 'action', icon: '✎', label: 'Quick Capture', action: function() { Capture.showQuickCapture(); } },
            { type: 'action', icon: '📝', label: 'New Note', action: function() { window.location.hash = '#/note/new'; } }
        ];

        CommandPalette.results = items;
        CommandPalette.selectedIndex = 0;
        CommandPalette.renderResults(items, '');
    },

    search: function(query) {
        var q = (query || '').trim().toLowerCase();
        if (!q) {
            CommandPalette.showDefaults();
            return;
        }

        // Search pages
        var pages = [
            { type: 'page', icon: '⊞', label: 'Dashboard', action: function() { window.location.hash = '#/'; } },
            { type: 'page', icon: '◧', label: 'Projects', action: function() { window.location.hash = '#/projects'; } },
            { type: 'page', icon: '◫', label: 'Inbox', action: function() { window.location.hash = '#/inbox'; } },
            { type: 'page', icon: '◇', label: 'Daily Notes', action: function() { window.location.hash = '#/daily'; } },
            { type: 'page', icon: '◉', label: 'Habits', action: function() { window.location.hash = '#/habits'; } },
            { type: 'page', icon: '▤', label: 'Library', action: function() { window.location.hash = '#/library'; } },
            { type: 'page', icon: '⌕', label: 'Search', action: function() { window.location.hash = '#/search'; } },
            { type: 'page', icon: '↻', label: 'Review', action: function() { window.location.hash = '#/review'; } },
            { type: 'page', icon: '⚙', label: 'Settings', action: function() { window.location.hash = '#/settings'; } },
            { type: 'page', icon: '◈', label: 'Areas', action: function() { window.location.hash = '#/areas'; } }
        ];

        var matchedPages = pages.filter(function(p) {
            return p.label.toLowerCase().indexOf(q) !== -1;
        });

        // Search DB
        Promise.all([
            RetraqDB.getAllProjects(),
            RetraqDB.getAllNotes(),
            RetraqDB.getAllHabits ? RetraqDB.getAllHabits() : Promise.resolve([])
        ]).then(function(results) {
            var projects = results[0] || [];
            var notes = results[1] || [];
            var habits = results[2] || [];

            var matchedProjects = projects.filter(function(p) {
                return (p.title + ' ' + (p.description || '')).toLowerCase().indexOf(q) !== -1;
            }).slice(0, 5).map(function(p) {
                return {
                    type: 'project',
                    icon: p.icon || '📁',
                    label: p.title,
                    meta: p.status,
                    action: function() { window.location.hash = '#/project/' + p.id; }
                };
            });

            var matchedNotes = notes.filter(function(n) {
                return n.status !== 'archived' &&
                    (n.title + ' ' + (n.content || '')).toLowerCase().indexOf(q) !== -1;
            }).slice(0, 5).map(function(n) {
                return {
                    type: 'note',
                    icon: '📝',
                    label: n.title,
                    meta: n.type,
                    action: function() {
                        window.location.hash = '#/note/' + n.id;
                    }
                };
            });

            var matchedHabits = habits.filter(function(h) {
                return h.name.toLowerCase().indexOf(q) !== -1;
            }).slice(0, 3).map(function(h) {
                return {
                    type: 'habit',
                    icon: h.icon || '🎯',
                    label: h.name,
                    meta: h.frequency,
                    action: function() { window.location.hash = '#/habits'; }
                };
            });

            var all = matchedPages.concat(matchedProjects, matchedNotes, matchedHabits);
            CommandPalette.results = all;
            CommandPalette.selectedIndex = 0;
            CommandPalette.renderResults(all, q);
        });
    },

    renderResults: function(items, query) {
        var container = document.getElementById('cmd-results');
        if (!container) return;

        if (!items.length) {
            container.innerHTML = '<div class="cmd-empty">No results found</div>';
            return;
        }

        container.innerHTML = items.map(function(item, index) {
            var typeLabel = item.type === 'page' ? 'Page' :
                           item.type === 'project' ? 'Project' :
                           item.type === 'note' ? 'Note' :
                           item.type === 'habit' ? 'Habit' :
                           item.type === 'action' ? 'Action' : '';

            var labelHtml = query ? CommandPalette.highlightMatch(item.label, query) : Utils.escapeHtml(item.label);

            return (
                '<div class="cmd-item' + (index === CommandPalette.selectedIndex ? ' cmd-item-active' : '') + '" data-index="' + index + '">' +
                    '<span class="cmd-item-icon">' + item.icon + '</span>' +
                    '<span class="cmd-item-label">' + labelHtml + '</span>' +
                    (item.meta ? '<span class="cmd-item-meta">' + Utils.escapeHtml(item.meta) + '</span>' : '') +
                    '<span class="cmd-item-type">' + typeLabel + '</span>' +
                '</div>'
            );
        }).join('');

        // Bind clicks
        container.querySelectorAll('.cmd-item').forEach(function(el) {
            el.addEventListener('click', function() {
                CommandPalette.selectedIndex = parseInt(el.dataset.index, 10);
                CommandPalette.executeSelected();
            });
            el.addEventListener('mouseenter', function() {
                container.querySelectorAll('.cmd-item-active').forEach(function(a) { a.classList.remove('cmd-item-active'); });
                el.classList.add('cmd-item-active');
                CommandPalette.selectedIndex = parseInt(el.dataset.index, 10);
            });
        });
    },

    highlightMatch: function(text, query) {
        var escaped = Utils.escapeHtml(text);
        var idx = text.toLowerCase().indexOf(query.toLowerCase());
        if (idx === -1) return escaped;
        var before = Utils.escapeHtml(text.slice(0, idx));
        var match = Utils.escapeHtml(text.slice(idx, idx + query.length));
        var after = Utils.escapeHtml(text.slice(idx + query.length));
        return before + '<mark class="cmd-highlight">' + match + '</mark>' + after;
    },

    moveSelection: function(delta) {
        var container = document.getElementById('cmd-results');
        if (!container || !CommandPalette.results.length) return;

        CommandPalette.selectedIndex = (CommandPalette.selectedIndex + delta + CommandPalette.results.length) % CommandPalette.results.length;

        container.querySelectorAll('.cmd-item').forEach(function(el, i) {
            el.classList.toggle('cmd-item-active', i === CommandPalette.selectedIndex);
            if (i === CommandPalette.selectedIndex) {
                el.scrollIntoView({ block: 'nearest' });
            }
        });
    },

    executeSelected: function() {
        var item = CommandPalette.results[CommandPalette.selectedIndex];
        if (item && item.action) {
            CommandPalette.close();
            setTimeout(function() { item.action(); }, 50);
        }
    },

    initShortcuts: function() {
        document.addEventListener('keydown', function(e) {
            // Ctrl+K or Cmd+K
            if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
                e.preventDefault();
                if (CommandPalette.isOpen) {
                    CommandPalette.close();
                } else {
                    CommandPalette.open();
                }
            }
        });
    }
};

window.CommandPalette = CommandPalette;
