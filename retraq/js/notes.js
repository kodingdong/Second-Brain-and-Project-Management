const Notes = {
    renderTags: function(tags) {
        if (!tags || !tags.length) return '';
        return tags.map(function(tag) {
            return '<span class="tag-chip">' + Utils.escapeHtml(tag.name) + '</span>';
        }).join('');
    },

    renderNoteCard: function(note, options) {
        options = options || {};
        var preview = (note.content || '').trim().slice(0, 160);
        if (preview.length < (note.content || '').trim().length) preview += '…';

        return (
            '<article class="card card-clickable note-card" data-note-id="' + note.id + '">' +
                '<div class="card-header">' +
                    '<div>' +
                        '<div class="project-title">' + Utils.escapeHtml(note.title) + '</div>' +
                        '<div class="note-meta">' +
                            Components.renderBadge(Utils.noteTypeLabel(note.type), note.type === 'daily' ? 'planning' : 'active') +
                            (options.tagsHtml || '') +
                        '</div>' +
                    '</div>' +
                    '<span class="muted">' + Utils.escapeHtml(Utils.formatDate(note.updated_at.slice(0, 10))) + '</span>' +
                '</div>' +
                (preview ? '<p class="note-preview">' + Utils.escapeHtml(preview) + '</p>' : '<p class="muted">Empty note</p>') +
            '</article>'
        );
    },

    bindNoteCards: function(container, onOpen) {
        container.querySelectorAll('[data-note-id]').forEach(function(card) {
            card.addEventListener('click', function() {
                if (onOpen) onOpen(card.dataset.noteId);
            });
        });
    },

    renderEditor: function(noteId, projectId, initialTitle) {
        var container = document.getElementById('view-note');
        if (!container) return;

        Promise.all([
            noteId && noteId !== 'new' ? RetraqDB.getNote(noteId) : Promise.resolve(null),
            noteId && noteId !== 'new' ? RetraqDB.getNoteTags(noteId) : Promise.resolve([]),
            noteId && noteId !== 'new' ? RetraqDB.getProjectsForNote(noteId) : Promise.resolve([]),
            RetraqDB.getAllProjects(),
            RetraqDB.getAllAreas(),
            RetraqDB.getAllNotes()
        ]).then(function(results) {
            var note = results[0];
            var tags = results[1];
            var linkedProjects = results[2];
            var allProjects = results[3];
            var allAreas = results[4];
            var allNotes = results[5];
            
            var isInbox = note && note.status === 'inbox';
            var isNew = !note;

            var linkedId = linkedProjects.length ? linkedProjects[0].id : (projectId || '');
            var noteAreaId = note ? (note.area_id || '') : '';

            // Calculate Backlinks
            var backlinks = [];
            if (note && note.title) {
                var searchStr = '[[' + note.title.toLowerCase() + ']]';
                backlinks = allNotes.filter(function(n) {
                    if (n.id === note.id || !n.content) return false;
                    return n.content.toLowerCase().indexOf(searchStr) !== -1;
                });
            }

            var typeOptions = Utils.NOTE_TYPES.map(function(t) {
                var selected = (note ? note.type : 'note') === t ? ' selected' : '';
                return '<option value="' + t + '"' + selected + '>' + Utils.noteTypeLabel(t) + '</option>';
            }).join('');

            var projectOptions = '<option value="">— No project —</option>' +
                allProjects.map(function(p) {
                    return '<option value="' + p.id + '"' + (p.id === linkedId ? ' selected' : '') + '>' +
                        Utils.escapeHtml(p.icon + ' ' + p.title) + '</option>';
                }).join('');

            var areaOptions = '<option value="">— No area —</option>' +
                allAreas.map(function(a) {
                    return '<option value="' + a.id + '"' + (a.id === noteAreaId ? ' selected' : '') + '>' +
                        Utils.escapeHtml(a.icon + ' ' + a.name) + '</option>';
                }).join('');

            var backlinksHtml = '';
            if (backlinks.length > 0) {
                backlinksHtml = '<div class="backlinks-section" style="margin-top:1.5rem">' +
                    '<h3 style="font-size:0.9rem;margin-bottom:0.5rem;color:var(--color-text-secondary)">🔗 Backlinks (' + backlinks.length + ')</h3>' +
                    '<div class="backlinks-list">' +
                        backlinks.map(function(b) {
                            return '<a href="#/note/' + b.id + '" class="backlink-item" style="display:block;padding:0.5rem;background:var(--color-bg-secondary);border-radius:6px;margin-bottom:0.25rem;text-decoration:none;color:var(--color-text)">' +
                                '📄 ' + Utils.escapeHtml(b.title || 'Untitled') +
                            '</a>';
                        }).join('') +
                    '</div>' +
                '</div>';
            }

            var initialContent = note ? note.content : '';
            if (isNew && !initialContent && typeof localStorage !== 'undefined') {
                initialContent = localStorage.getItem('retraq_tpl_note') || '';
            }

            var linkTargets = BiLinks.extractLinks(initialContent);

            BiLinks.resolveLinks(linkTargets).then(function(resolvedMap) {
                var initialPreview = Markdown.render(
                    initialContent,
                    resolvedMap
                );

                container.innerHTML =
                    '<div class="card" style="max-width:900px;margin:0 auto;padding:1.5rem">' +
                        '<div class="section-header" style="margin-bottom:1.5rem;padding-bottom:1rem;border-bottom:1px solid var(--color-divider)">' +
                            '<div>' +
                                '<h2 class="section-title">' + (isInbox ? 'Process Inbox' : (isNew ? 'New Note' : 'Edit Note')) + '</h2>' +
                            '</div>' +
                            '<div style="display:flex;gap:0.5rem">' +
                                (note && !isInbox ? '<button type="button" class="btn btn-sm btn-danger" id="btn-delete-note">Delete</button>' : '') +
                                '<button type="button" class="btn btn-sm" id="btn-cancel-note">Cancel</button>' +
                                '<button type="button" class="btn btn-sm btn-primary" id="btn-save-note">' + (isInbox ? 'Process &amp; Save' : 'Save') + '</button>' +
                            '</div>' +
                        '</div>' +
                        '<form id="note-form">' +
                            '<div class="form-group">' +
                                '<input id="note-title" name="title" value="' + Utils.escapeHtml(note ? note.title : (initialTitle || '')) + '" placeholder="Note Title (Optional)" style="font-size:1.5rem;font-weight:600;padding:0.75rem;border:none;border-bottom:2px solid var(--color-border);background:transparent;width:100%;color:var(--color-text)">' +
                            '</div>' +
                            '<div class="daily-split" style="margin-top:1.5rem">' +
                                '<div class="md-editor-wrap">' +
                                    '<div class="md-editor-toolbar">' +
                                        '<button type="button" class="md-toolbar-btn" data-md="bold" title="Bold"><b>B</b></button>' +
                                        '<button type="button" class="md-toolbar-btn" data-md="italic" title="Italic"><i>I</i></button>' +
                                        '<button type="button" class="md-toolbar-btn" data-md="strike" title="Strikethrough"><s>S</s></button>' +
                                        '<span class="md-toolbar-sep"></span>' +
                                        '<button type="button" class="md-toolbar-btn" data-md="h2" title="Heading">H</button>' +
                                        '<button type="button" class="md-toolbar-btn" data-md="code" title="Code">&lt;/&gt;</button>' +
                                        '<button type="button" class="md-toolbar-btn" data-md="link" title="Wiki link">🔗</button>' +
                                        '<span class="md-toolbar-sep"></span>' +
                                        '<button type="button" class="md-toolbar-btn" data-md="check" title="Checkbox">☑</button>' +
                                        '<button type="button" class="md-toolbar-btn" data-md="quote" title="Quote">❝</button>' +
                                    '</div>' +
                                    '<textarea id="note-content" name="content" class="md-editor-textarea" style="min-height:400px" placeholder="Write with Markdown… Use [[Note Title]] for bi-links">' +
                                        Utils.escapeHtml(initialContent) +
                                    '</textarea>' +
                                '</div>' +
                                '<div class="md-preview-card">' +
                                    '<div class="md-preview-label">Live Preview</div>' +
                                    '<div class="md-preview-area md-rendered" id="note-modal-preview">' +
                                        initialPreview +
                                    '</div>' +
                                '</div>' +
                            '</div>' +
                            '<div class="grid-2" style="margin-top:1.5rem">' +
                                '<div class="form-group">' +
                                    '<label for="note-type">Type</label>' +
                                    '<select id="note-type" name="type" class="sort-select" style="width:100%">' + typeOptions + '</select>' +
                                '</div>' +
                                '<div class="form-group">' +
                                    '<label for="note-project">Link to project</label>' +
                                    '<select id="note-project" name="project_id" class="sort-select" style="width:100%">' + projectOptions + '</select>' +
                                '</div>' +
                            '</div>' +
                            '<div class="grid-2">' +
                                '<div class="form-group">' +
                                    '<label for="note-area">Area</label>' +
                                    '<select id="note-area" name="area_id" class="sort-select" style="width:100%">' + areaOptions + '</select>' +
                                '</div>' +
                                '<div class="form-group">' +
                                    '<label for="note-tags">Tags (comma separated)</label>' +
                                    '<input id="note-tags" name="tags" class="form-control" value="' + Utils.escapeHtml(tags.map(function(t) { return t.name; }).join(', ')) + '" placeholder="e.g. javascript, pkm">' +
                                '</div>' +
                            '</div>' +
                            backlinksHtml +
                        '</form>' +
                    '</div>';

                var contentTextarea = container.querySelector('#note-content');
                var previewEl = container.querySelector('#note-modal-preview');

                LinkAutocomplete.attach(contentTextarea);

                var previewTimer = null;
                contentTextarea.addEventListener('input', function() {
                    clearTimeout(previewTimer);
                    previewTimer = setTimeout(function() {
                        var targets = BiLinks.extractLinks(contentTextarea.value);
                        BiLinks.resolveLinks(targets).then(function(newMap) {
                            previewEl.innerHTML = Markdown.render(contentTextarea.value, newMap);
                            BiLinks.bindLinks(previewEl, function(nId) {
                                if (nId) {
                                    window.location.hash = '#/note/' + nId;
                                }
                            });
                        });
                    }, 300);
                });

                container.querySelectorAll('[data-md]').forEach(function(btn) {
                    btn.addEventListener('click', function(e) {
                        e.preventDefault();
                        Notes._insertMarkdown(contentTextarea, btn.dataset.md);
                    });
                });

                container.querySelector('#btn-cancel-note').addEventListener('click', function() {
                    window.history.back();
                });

                container.querySelector('#btn-save-note').addEventListener('click', function() {
                    var form = container.querySelector('#note-form');
                    var content = form.content.value.trim();
                    if (!content) {
                        Components.toast('Content cannot be empty', 'error');
                        return;
                    }

                    var payload = {
                        title: form.title.value.trim(),
                        content: content,
                        type: form.type.value,
                        tags: Utils.parseTags(form.tags.value),
                        project_id: form.project_id.value || null,
                        area_id: form.area_id.value || null
                    };

                    var savePromise;
                    if (isInbox && note) {
                        savePromise = RetraqDB.processInboxNote(note.id, payload);
                    } else if (note) {
                        savePromise = RetraqDB.updateNote(note.id, payload).then(function(saved) {
                            return RetraqDB.setNoteTags(saved.id, payload.tags).then(function() {
                                if (payload.project_id) {
                                    return RetraqDB.linkNoteToProject(saved.id, payload.project_id).then(function() { return saved; });
                                }
                                return saved;
                            });
                        });
                    } else {
                        savePromise = RetraqDB.createNote(Object.assign({}, payload, { status: 'active' }));
                    }

                    savePromise.then(function() {
                        Components.toast(isInbox ? 'Processed to note' : 'Note saved');
                        LinkAutocomplete.detach();
                        LinkAutocomplete.refresh();
                        window.history.back();
                        App.updateInboxBadge();
                    }).catch(function(err) {
                        Components.toast(err.message || 'Save failed', 'error');
                    });
                });

                var deleteBtn = container.querySelector('#btn-delete-note');
                if (deleteBtn) {
                    deleteBtn.addEventListener('click', function() {
                        if (!confirm('Delete this note?')) return;
                        RetraqDB.deleteNote(note.id).then(function() {
                            Components.toast('Note deleted');
                            LinkAutocomplete.detach();
                            window.history.back();
                        });
                    });
                }
                
                // Also bind initial preview bilinks
                BiLinks.bindLinks(previewEl, function(nId) {
                    if (nId) window.location.hash = '#/note/' + nId;
                });
            });
        });
    },

    /**
     * Insert markdown syntax at cursor position
     */
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
                insertion = '**' + (selected || 'bold') + '**';
                cursorOffset = selected ? insertion.length : 2;
                break;
            case 'italic':
                insertion = '*' + (selected || 'italic') + '*';
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
            // Fallback if execCommand is not supported
            textarea.value = before + insertion + after;
        }
        
        textarea.selectionStart = start + cursorOffset;
        textarea.selectionEnd = start + cursorOffset;
        textarea.dispatchEvent(new Event('input', { bubbles: true }));
    }
};

window.Notes = Notes;
