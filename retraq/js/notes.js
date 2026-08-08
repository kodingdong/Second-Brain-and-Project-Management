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

    showEditor: function(options) {
        options = options || {};
        var note = options.note;
        var isInbox = note && note.status === 'inbox';
        var isNew = !note;

        Promise.all([
            note ? RetraqDB.getNoteTags(note.id) : Promise.resolve([]),
            note ? RetraqDB.getProjectsForNote(note.id) : Promise.resolve([]),
            RetraqDB.getAllProjects(),
            RetraqDB.getAllAreas(),
            RetraqDB.getAllNotes()
        ]).then(function(results) {
            var tags = results[0];
            var linkedProjects = results[1];
            var allProjects = results[2];
            var allAreas = results[3];
            var allNotes = results[4];
            var linkedId = linkedProjects.length ? linkedProjects[0].id : (options.projectId || '');
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
                backlinksHtml = '<div class="backlinks-section">' +
                    '<label>Backlinks (' + backlinks.length + ')</label>' +
                    '<div class="backlinks-list">' +
                        backlinks.map(function(b) {
                            return '<div class="backlink-item" data-action="open-backlink" data-id="' + b.id + '">' +
                                '<span class="nav-icon">🔗</span> ' + Utils.escapeHtml(b.title || 'Untitled') +
                            '</div>';
                        }).join('') +
                    '</div>' +
                '</div>';
            }

            Components.modal({
                title: isInbox ? 'Process Inbox' : (isNew ? 'New Note' : 'Edit Note'),
                body:
                    '<form id="note-form">' +
                        '<div class="form-group">' +
                            '<label for="note-title">Title</label>' +
                            '<input id="note-title" name="title" value="' + Utils.escapeHtml(note ? note.title : '') + '" placeholder="Optional — auto from first line">' +
                        '</div>' +
                        '<div class="form-group">' +
                            '<label for="note-content">Content <span class="muted" style="font-weight:400;font-size:0.75rem">Use [[Note Title]] to link notes</span></label>' +
                            '<textarea id="note-content" name="content" rows="8" placeholder="Write your note… Use [[Note Title]] for bi-links">' +
                                Utils.escapeHtml(note ? note.content : (options.content || '')) +
                            '</textarea>' +
                        '</div>' +
                        '<div class="grid-2">' +
                            '<div class="form-group">' +
                                '<label for="note-type">Type</label>' +
                                '<select id="note-type" name="type">' + typeOptions + '</select>' +
                            '</div>' +
                            '<div class="form-group">' +
                                '<label for="note-project">Link to project</label>' +
                                '<select id="note-project" name="project_id">' + projectOptions + '</select>' +
                            '</div>' +
                        '</div>' +
                        '<div class="grid-2">' +
                            '<div class="form-group">' +
                                '<label for="note-area">Area</label>' +
                                '<select id="note-area" name="area_id">' + areaOptions + '</select>' +
                            '</div>' +
                            '<div class="form-group">' +
                                '<label for="note-tags">Tags (comma separated)</label>' +
                                '<input id="note-tags" name="tags" value="' + Utils.escapeHtml(tags.map(function(t) { return t.name; }).join(', ')) + '" placeholder="e.g. javascript, pkm">' +
                            '</div>' +
                        '</div>' +
                        backlinksHtml +
                    '</form>',
                footer:
                    (note && !isInbox ? '<button type="button" class="btn btn-danger" id="btn-delete-note">Delete</button>' : '') +
                    '<button type="button" class="btn" data-modal-close>Cancel</button>' +
                    '<button type="button" class="btn btn-primary" id="btn-save-note">' +
                        (isInbox ? 'Process &amp; Save' : 'Save') +
                    '</button>',
                onMount: function(modal, close) {
                    modal.querySelector('#btn-save-note').addEventListener('click', function() {
                        var form = modal.querySelector('#note-form');
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
                            close();
                            if (options.onSave) options.onSave();
                            App.updateInboxBadge();
                        }).catch(function(err) {
                            Components.toast(err.message || 'Save failed', 'error');
                        });
                    });

                    var deleteBtn = modal.querySelector('#btn-delete-note');
                    if (deleteBtn) {
                        deleteBtn.addEventListener('click', function() {
                            if (!confirm('Delete this note?')) return;
                            RetraqDB.deleteNote(note.id).then(function() {
                                Components.toast('Note deleted');
                                close();
                                if (options.onSave) options.onSave();
                            });
                        });
                    }

                    // Open backlink
                    modal.querySelectorAll('[data-action="open-backlink"]').forEach(function(el) {
                        el.addEventListener('click', function() {
                            RetraqDB.getNote(el.dataset.id).then(function(targetNote) {
                                if (targetNote) {
                                    close();
                                    Notes.showEditor({ note: targetNote, onSave: options.onSave });
                                }
                            });
                        });
                    });
                }
            });
        });
    }
};

window.Notes = Notes;
