const DailyNotes = {
    render: function(date) {
        var container = document.getElementById('view-daily');
        if (!container) return;

        date = date || Utils.today();

        Promise.all([
            RetraqDB.getOrCreateDailyNote(date),
            RetraqDB.getDailyNoteDates(),
            RetraqDB.getAllNotes()
        ]).then(function(results) {
            var note = results[0];
            var dates = results[1];
            var allNotes = results[2];
            if (dates.indexOf(date) === -1) dates.unshift(date);

            // Build calendar mini-widget
            var calendarHtml = DailyNotes._renderCalendar(date, dates);

            var dateList = dates.slice(0, 14).map(function(d) {
                var isActive = d === date;
                var label = d === Utils.today() ? 'Today' : Utils.formatDate(d);
                return '<a href="#/daily/' + d + '" class="daily-date-link' + (isActive ? ' active' : '') + '">' +
                    Utils.escapeHtml(label) + '</a>';
            }).join('');

            // Resolve wikilinks for preview
            var linkTargets = BiLinks.extractLinks(note.content);
            BiLinks.resolveLinks(linkTargets).then(function(resolvedMap) {
                var previewHtml = Markdown.render(note.content, resolvedMap);

                container.innerHTML =
                    '<div class="daily-layout">' +
                        '<aside class="daily-sidebar card">' +
                            calendarHtml +
                            '<h3 class="section-title" style="margin-bottom:0.75rem;margin-top:1rem">Recent</h3>' +
                            '<div class="daily-date-list">' + dateList + '</div>' +
                        '</aside>' +
                        '<div class="daily-editor card">' +
                            '<div class="section-header">' +
                                '<div>' +
                                    '<h2 class="section-title">' + Utils.escapeHtml(Utils.formatDate(date)) + '</h2>' +
                                    '<p class="muted">Daily note · auto-saved · supports Markdown</p>' +
                                '</div>' +
                                '<div style="display:flex;gap:0.35rem">' +
                                    '<button type="button" class="btn btn-sm" id="daily-prev" title="Previous day">← Prev</button>' +
                                    '<button type="button" class="btn btn-sm btn-primary" id="daily-today">Today</button>' +
                                    '<button type="button" class="btn btn-sm" id="daily-next" title="Next day">Next →</button>' +
                                '</div>' +
                            '</div>' +
                            '<div class="daily-split">' +
                                '<div class="md-editor-wrap">' +
                                    '<div class="md-editor-toolbar">' +
                                        '<button type="button" class="md-toolbar-btn" data-md="bold" title="Bold (**text**)"><b>B</b></button>' +
                                        '<button type="button" class="md-toolbar-btn" data-md="italic" title="Italic (*text*)"><i>I</i></button>' +
                                        '<button type="button" class="md-toolbar-btn" data-md="strike" title="Strikethrough (~~text~~)"><s>S</s></button>' +
                                        '<span class="md-toolbar-sep"></span>' +
                                        '<button type="button" class="md-toolbar-btn" data-md="h2" title="Heading">H</button>' +
                                        '<button type="button" class="md-toolbar-btn" data-md="code" title="Inline code">&lt;/&gt;</button>' +
                                        '<button type="button" class="md-toolbar-btn" data-md="link" title="Wiki link [[]]">🔗</button>' +
                                        '<span class="md-toolbar-sep"></span>' +
                                        '<button type="button" class="md-toolbar-btn" data-md="ul" title="Bullet list">•</button>' +
                                        '<button type="button" class="md-toolbar-btn" data-md="ol" title="Numbered list">1.</button>' +
                                        '<button type="button" class="md-toolbar-btn" data-md="check" title="Checkbox">☑</button>' +
                                        '<button type="button" class="md-toolbar-btn" data-md="quote" title="Blockquote">❝</button>' +
                                    '</div>' +
                                    '<textarea id="daily-content" class="md-editor-textarea" placeholder="Write with Markdown… Use [[Note Title]] for links">' +
                                        Utils.escapeHtml(note.content) +
                                    '</textarea>' +
                                '</div>' +
                                '<div class="md-preview-card">' +
                                    '<div class="md-preview-label">Preview</div>' +
                                    '<div class="md-rendered" id="daily-preview">' + previewHtml + '</div>' +
                                '</div>' +
                            '</div>' +
                        '</div>' +
                    '</div>';

                DailyNotes._bindEditor(container, note, date, resolvedMap);
            });
        });
    },

    _bindEditor: function(container, note, date, resolvedMap) {
        var textarea = container.querySelector('#daily-content');
        var preview = container.querySelector('#daily-preview');
        var saveTimer = null;

        // Attach link autocomplete
        LinkAutocomplete.attach(textarea);

        // Auto-save + live preview
        textarea.addEventListener('input', function() {
            clearTimeout(saveTimer);
            saveTimer = setTimeout(function() {
                RetraqDB.updateNote(note.id, { content: textarea.value });

                // Update preview
                var targets = BiLinks.extractLinks(textarea.value);
                BiLinks.resolveLinks(targets).then(function(newMap) {
                    preview.innerHTML = Markdown.render(textarea.value, newMap);
                    DailyNotes._bindPreviewLinks(preview);
                });
            }, 400);
        });

        // Bind preview bilinks
        DailyNotes._bindPreviewLinks(preview);

        // Navigation buttons
        var prevBtn = container.querySelector('#daily-prev');
        var nextBtn = container.querySelector('#daily-next');
        var todayBtn = container.querySelector('#daily-today');

        if (prevBtn) {
            prevBtn.addEventListener('click', function() {
                var d = new Date(date + 'T00:00:00');
                d.setDate(d.getDate() - 1);
                window.location.hash = '#/daily/' + d.toISOString().slice(0, 10);
            });
        }
        if (nextBtn) {
            nextBtn.addEventListener('click', function() {
                var d = new Date(date + 'T00:00:00');
                d.setDate(d.getDate() + 1);
                window.location.hash = '#/daily/' + d.toISOString().slice(0, 10);
            });
        }
        if (todayBtn) {
            todayBtn.addEventListener('click', function() {
                window.location.hash = '#/daily/' + Utils.today();
            });
        }

        // Toolbar buttons
        container.querySelectorAll('[data-md]').forEach(function(btn) {
            btn.addEventListener('click', function() {
                DailyNotes._insertMarkdown(textarea, btn.dataset.md);
            });
        });
    },

    _bindPreviewLinks: function(container) {
        BiLinks.bindLinks(container, function(noteId) {
            if (noteId) {
                window.location.hash = '#/note/' + noteId;
            }
        });
    },

    _insertMarkdown: function(textarea, type) {
        var start = textarea.selectionStart;
        var end = textarea.selectionEnd;
        var text = textarea.value;
        var selected = text.slice(start, end);
        var before = text.slice(0, start);
        var after = text.slice(end);
        var insertion = '';
        var cursorOffset = 0;

        switch (type) {
            case 'bold':
                insertion = '**' + (selected || 'bold text') + '**';
                cursorOffset = selected ? insertion.length : 2;
                break;
            case 'italic':
                insertion = '*' + (selected || 'italic text') + '*';
                cursorOffset = selected ? insertion.length : 1;
                break;
            case 'strike':
                insertion = '~~' + (selected || 'text') + '~~';
                cursorOffset = selected ? insertion.length : 2;
                break;
            case 'h2':
                insertion = '## ' + (selected || 'Heading');
                cursorOffset = insertion.length;
                break;
            case 'code':
                insertion = '`' + (selected || 'code') + '`';
                cursorOffset = selected ? insertion.length : 1;
                break;
            case 'link':
                insertion = '[[' + (selected || '') + ']]';
                cursorOffset = selected ? insertion.length : 2;
                break;
            case 'ul':
                insertion = '- ' + (selected || 'item');
                cursorOffset = insertion.length;
                break;
            case 'ol':
                insertion = '1. ' + (selected || 'item');
                cursorOffset = insertion.length;
                break;
            case 'check':
                insertion = '- [ ] ' + (selected || 'task');
                cursorOffset = insertion.length;
                break;
            case 'quote':
                insertion = '> ' + (selected || 'quote');
                cursorOffset = insertion.length;
                break;
        }

        textarea.focus();

        // Use execCommand to preserve the native Undo/Redo stack (Phase 5.3)
        var success = false;
        try {
            success = document.execCommand('insertText', false, insertion);
        } catch (e) {}

        if (!success) {
            textarea.value = before + insertion + after;
        }

        textarea.selectionStart = start + cursorOffset;
        textarea.selectionEnd = start + cursorOffset;
        textarea.dispatchEvent(new Event('input', { bubbles: true }));
    },

    _renderCalendar: function(currentDate, noteDates) {
        var current = new Date(currentDate + 'T00:00:00');
        var year = current.getFullYear();
        var month = current.getMonth();
        var today = Utils.today();

        var monthName = new Date(year, month, 1).toLocaleDateString('en', { month: 'long', year: 'numeric' });

        // Days of week headers
        var headers = ['S', 'M', 'T', 'W', 'T', 'F', 'S'].map(function(d) {
            return '<span class="cal-header">' + d + '</span>';
        }).join('');

        // Calendar grid
        var firstDay = new Date(year, month, 1).getDay();
        var daysInMonth = new Date(year, month + 1, 0).getDate();
        var cells = '';

        // Empty cells before first day
        for (var e = 0; e < firstDay; e++) {
            cells += '<span class="cal-day cal-empty"></span>';
        }

        for (var d = 1; d <= daysInMonth; d++) {
            var dateStr = year + '-' + String(month + 1).padStart(2, '0') + '-' + String(d).padStart(2, '0');
            var isToday = dateStr === today;
            var isCurrent = dateStr === currentDate;
            var hasNote = noteDates.indexOf(dateStr) !== -1;

            var classes = 'cal-day';
            if (isToday) classes += ' cal-today';
            if (isCurrent) classes += ' cal-active';
            if (hasNote) classes += ' cal-has-note';

            cells += '<a href="#/daily/' + dateStr + '" class="' + classes + '">' + d + '</a>';
        }

        // Navigation
        var prevMonth = new Date(year, month - 1, 1);
        var nextMonth = new Date(year, month + 1, 1);
        var prevDate = prevMonth.toISOString().slice(0, 10);
        var nextDate = nextMonth.toISOString().slice(0, 10);

        return '<div class="cal-widget">' +
            '<div class="cal-nav">' +
                '<a href="#/daily/' + prevDate + '" class="cal-nav-btn">‹</a>' +
                '<span class="cal-month">' + monthName + '</span>' +
                '<a href="#/daily/' + nextDate + '" class="cal-nav-btn">›</a>' +
            '</div>' +
            '<div class="cal-grid">' + headers + cells + '</div>' +
        '</div>';
    }
};

window.DailyNotes = DailyNotes;
