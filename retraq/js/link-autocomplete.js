/**
 * LinkAutocomplete — Obsidian-style [[ autocomplete for textareas
 * Shows a floating dropdown with matching note titles when typing [[
 */
const LinkAutocomplete = {
    dropdown: null,
    textarea: null,
    items: [],
    selectedIndex: 0,
    isOpen: false,
    allNotes: [],

    /**
     * Attach autocomplete to a textarea element
     * @param {HTMLTextAreaElement} textarea
     */
    attach: function(textarea) {
        if (!textarea) return;
        LinkAutocomplete.textarea = textarea;

        // Pre-load note titles
        RetraqDB.getAllNotes().then(function(notes) {
            LinkAutocomplete.allNotes = notes.filter(function(n) {
                return n.status !== 'archived' && n.title;
            });
        });

        textarea.addEventListener('input', LinkAutocomplete._onInput);
        textarea.addEventListener('keydown', LinkAutocomplete._onKeydown);
        textarea.addEventListener('blur', function() {
            // Delay close so click on dropdown item registers
            setTimeout(function() { LinkAutocomplete.close(); }, 200);
        });
    },

    /**
     * Detach autocomplete from current textarea
     */
    detach: function() {
        if (LinkAutocomplete.textarea) {
            LinkAutocomplete.textarea.removeEventListener('input', LinkAutocomplete._onInput);
            LinkAutocomplete.textarea.removeEventListener('keydown', LinkAutocomplete._onKeydown);
        }
        LinkAutocomplete.close();
        LinkAutocomplete.textarea = null;
    },

    _onInput: function() {
        var textarea = LinkAutocomplete.textarea;
        if (!textarea) return;

        var pos = textarea.selectionStart;
        var text = textarea.value;

        // Find the last [[ before cursor that isn't closed by ]]
        var before = text.slice(0, pos);
        var openIdx = before.lastIndexOf('[[');

        if (openIdx === -1) {
            LinkAutocomplete.close();
            return;
        }

        // Check if there's a ]] between [[ and cursor
        var between = before.slice(openIdx + 2);
        if (between.indexOf(']]') !== -1) {
            LinkAutocomplete.close();
            return;
        }

        var query = between.toLowerCase().trim();

        // Filter matching notes
        var matches = LinkAutocomplete.allNotes.filter(function(note) {
            return note.title.toLowerCase().indexOf(query) !== -1;
        }).slice(0, 8);

        if (matches.length === 0 && query.length > 0) {
            // Show "create new" option
            matches = [{ id: '__create__', title: 'Create "' + between.trim() + '"', _createTitle: between.trim() }];
        }

        if (matches.length > 0) {
            LinkAutocomplete.items = matches;
            LinkAutocomplete.selectedIndex = 0;
            LinkAutocomplete.show(textarea, openIdx);
        } else {
            LinkAutocomplete.close();
        }
    },

    _onKeydown: function(e) {
        if (!LinkAutocomplete.isOpen) return;

        if (e.key === 'ArrowDown') {
            e.preventDefault();
            LinkAutocomplete.selectedIndex = (LinkAutocomplete.selectedIndex + 1) % LinkAutocomplete.items.length;
            LinkAutocomplete._renderItems();
        } else if (e.key === 'ArrowUp') {
            e.preventDefault();
            LinkAutocomplete.selectedIndex = (LinkAutocomplete.selectedIndex - 1 + LinkAutocomplete.items.length) % LinkAutocomplete.items.length;
            LinkAutocomplete._renderItems();
        } else if (e.key === 'Enter' || e.key === 'Tab') {
            if (LinkAutocomplete.isOpen && LinkAutocomplete.items.length > 0) {
                e.preventDefault();
                LinkAutocomplete._selectItem(LinkAutocomplete.selectedIndex);
            }
        } else if (e.key === 'Escape') {
            e.preventDefault();
            LinkAutocomplete.close();
        }
    },

    show: function(textarea, openIdx) {
        if (!LinkAutocomplete.dropdown) {
            LinkAutocomplete.dropdown = document.createElement('div');
            LinkAutocomplete.dropdown.className = 'link-autocomplete';
            LinkAutocomplete.dropdown.id = 'link-autocomplete';
            document.body.appendChild(LinkAutocomplete.dropdown);
        }

        // Position dropdown below cursor
        var coords = LinkAutocomplete._getCaretCoords(textarea, openIdx);
        var rect = textarea.getBoundingClientRect();
        var scrollTop = window.pageYOffset || document.documentElement.scrollTop;
        var scrollLeft = window.pageXOffset || document.documentElement.scrollLeft;

        var top = rect.top + scrollTop + coords.top + 24;
        var left = rect.left + scrollLeft + coords.left;

        // Keep within viewport
        var maxLeft = window.innerWidth - 280;
        if (left > maxLeft) left = maxLeft;

        LinkAutocomplete.dropdown.style.top = top + 'px';
        LinkAutocomplete.dropdown.style.left = left + 'px';

        LinkAutocomplete.isOpen = true;
        LinkAutocomplete._renderItems();
    },

    _renderItems: function() {
        if (!LinkAutocomplete.dropdown) return;

        LinkAutocomplete.dropdown.innerHTML = LinkAutocomplete.items.map(function(item, idx) {
            var isCreate = item.id === '__create__';
            var icon = isCreate ? '＋' : (item.type === 'daily' ? '◇' : '📝');
            var typeLabel = isCreate ? 'New' : Utils.noteTypeLabel(item.type || 'note');
            return '<div class="lac-item' + (idx === LinkAutocomplete.selectedIndex ? ' lac-active' : '') +
                '" data-index="' + idx + '">' +
                '<span class="lac-icon">' + icon + '</span>' +
                '<span class="lac-label">' + Utils.escapeHtml(item.title) + '</span>' +
                '<span class="lac-type">' + typeLabel + '</span>' +
            '</div>';
        }).join('');

        // Bind click handlers
        LinkAutocomplete.dropdown.querySelectorAll('.lac-item').forEach(function(el) {
            el.addEventListener('mousedown', function(e) {
                e.preventDefault();
                LinkAutocomplete._selectItem(parseInt(el.dataset.index, 10));
            });
            el.addEventListener('mouseenter', function() {
                LinkAutocomplete.selectedIndex = parseInt(el.dataset.index, 10);
                LinkAutocomplete._renderItems();
            });
        });
    },

    _selectItem: function(index) {
        var item = LinkAutocomplete.items[index];
        if (!item) return;

        var textarea = LinkAutocomplete.textarea;
        if (!textarea) return;

        var pos = textarea.selectionStart;
        var text = textarea.value;
        var before = text.slice(0, pos);
        var openIdx = before.lastIndexOf('[[');

        if (openIdx === -1) { LinkAutocomplete.close(); return; }

        var title = item._createTitle || item.title;
        var replacement = '[[' + title + ']]';
        var newText = text.slice(0, openIdx) + replacement + text.slice(pos);

        textarea.value = newText;

        // Set cursor after ]]
        var newPos = openIdx + replacement.length;
        textarea.selectionStart = newPos;
        textarea.selectionEnd = newPos;
        textarea.focus();

        // Trigger input event for auto-save
        textarea.dispatchEvent(new Event('input', { bubbles: true }));

        LinkAutocomplete.close();
    },

    close: function() {
        if (LinkAutocomplete.dropdown && LinkAutocomplete.dropdown.parentNode) {
            LinkAutocomplete.dropdown.parentNode.removeChild(LinkAutocomplete.dropdown);
        }
        LinkAutocomplete.dropdown = null;
        LinkAutocomplete.isOpen = false;
        LinkAutocomplete.items = [];
        LinkAutocomplete.selectedIndex = 0;
    },

    /**
     * Approximate caret coordinates within a textarea
     * Creates a mirror div to measure text position
     */
    _getCaretCoords: function(textarea, position) {
        var mirror = document.createElement('div');
        var computed = window.getComputedStyle(textarea);

        mirror.style.position = 'absolute';
        mirror.style.visibility = 'hidden';
        mirror.style.whiteSpace = 'pre-wrap';
        mirror.style.wordWrap = 'break-word';
        mirror.style.overflow = 'hidden';
        mirror.style.width = computed.width;
        mirror.style.font = computed.font;
        mirror.style.padding = computed.padding;
        mirror.style.border = computed.border;
        mirror.style.lineHeight = computed.lineHeight;
        mirror.style.letterSpacing = computed.letterSpacing;

        document.body.appendChild(mirror);

        var text = textarea.value.slice(0, position);
        mirror.textContent = text;

        var span = document.createElement('span');
        span.textContent = textarea.value.slice(position) || '.';
        mirror.appendChild(span);

        var coords = {
            top: span.offsetTop - textarea.scrollTop,
            left: span.offsetLeft - textarea.scrollLeft
        };

        document.body.removeChild(mirror);
        return coords;
    },

    /**
     * Refresh the note list cache (call after creating/deleting notes)
     */
    refresh: function() {
        RetraqDB.getAllNotes().then(function(notes) {
            LinkAutocomplete.allNotes = notes.filter(function(n) {
                return n.status !== 'archived' && n.title;
            });
        });
    }
};

window.LinkAutocomplete = LinkAutocomplete;
