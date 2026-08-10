/* =======================================================
   Reference Library — v1.2
   Save bookmarks/links with title, URL, notes, and tags.
   Browse, search, and link references to projects.
   ======================================================= */

const Library = {
    render: function() {
        var container = document.getElementById('view-library');
        if (!container) return;

        RetraqDB.getAllReferences().then(function(refs) {
            container.innerHTML =
                '<div class="section-header">' +
                    '<h2 class="section-title">Reference Library</h2>' +
                    '<button type="button" class="btn btn-primary btn-sm" id="btn-add-ref">+ Add Reference</button>' +
                '</div>' +
                '<div class="search-bar" style="margin-bottom:1rem">' +
                    '<input type="text" id="library-search" placeholder="Search references…">' +
                '</div>' +
                '<div id="library-list">' +
                    Library.renderList(refs) +
                '</div>';

            container.querySelector('#btn-add-ref').addEventListener('click', function() {
                Library.showEditor({ onSave: function() { Library.render(); } });
            });

            var searchInput = container.querySelector('#library-search');
            var debounceTimer;
            searchInput.addEventListener('input', function() {
                clearTimeout(debounceTimer);
                debounceTimer = setTimeout(function() {
                    var q = searchInput.value.trim().toLowerCase();
                    var filtered = refs.filter(function(r) {
                        return !q ||
                            (r.title + ' ' + r.url + ' ' + (r.notes || '')).toLowerCase().indexOf(q) !== -1;
                    });
                    document.getElementById('library-list').innerHTML = Library.renderList(filtered);
                    Library.bindCards(container);
                }, 200);
            });

            Library.bindCards(container);
        });
    },

    renderList: function(refs) {
        if (!refs || !refs.length) {
            return '<div class="empty-state card">' + Utils.getEmptyStateSvg('notes') + '<p>No references yet. Add bookmarks, articles, and links to build your library.</p></div>';
        }

        return refs.map(function(ref) {
            var domain = '';
            try {
                domain = new URL(ref.url).hostname.replace('www.', '');
            } catch (e) {
                domain = ref.url;
            }

            var tagsHtml = '';
            if (ref.tags && ref.tags.length) {
                tagsHtml = ref.tags.map(function(t) {
                    return '<span class="tag-chip">' + Utils.escapeHtml(t) + '</span>';
                }).join('');
            }

            return '<article class="card card-clickable ref-card" data-ref-id="' + ref.id + '">' +
                '<div class="card-header">' +
                    '<div>' +
                        '<div class="project-title">' + Utils.escapeHtml(ref.title) + '</div>' +
                        '<div class="ref-meta">' +
                            '<a href="' + Utils.escapeHtml(ref.url) + '" target="_blank" rel="noopener" class="ref-domain" onclick="event.stopPropagation()">' +
                                '🔗 ' + Utils.escapeHtml(domain) +
                            '</a>' +
                            (tagsHtml ? '<span class="ref-tags">' + tagsHtml + '</span>' : '') +
                        '</div>' +
                    '</div>' +
                    '<span class="muted">' + Utils.escapeHtml(Utils.formatDate(ref.created_at.slice(0, 10))) + '</span>' +
                '</div>' +
                (ref.notes ? '<p class="note-preview">' + Utils.escapeHtml(ref.notes.slice(0, 120)) + (ref.notes.length > 120 ? '…' : '') + '</p>' : '') +
            '</article>';
        }).join('');
    },

    bindCards: function(container) {
        container.querySelectorAll('[data-ref-id]').forEach(function(card) {
            card.addEventListener('click', function() {
                RetraqDB.getReference(card.dataset.refId).then(function(ref) {
                    if (ref) Library.showEditor({ ref: ref, onSave: function() { Library.render(); } });
                });
            });
        });
    },

    showEditor: function(options) {
        options = options || {};
        var ref = options.ref;
        var isNew = !ref;

        RetraqDB.getAllProjects().then(function(projects) {
            var projectOptions = '<option value="">— No project —</option>' +
                projects.map(function(p) {
                    return '<option value="' + p.id + '"' +
                        (ref && ref.project_id === p.id ? ' selected' : '') + '>' +
                        Utils.escapeHtml(p.icon + ' ' + p.title) + '</option>';
                }).join('');

            Components.modal({
                title: isNew ? 'Add Reference' : 'Edit Reference',
                body:
                    '<form id="ref-form">' +
                        '<div class="form-group">' +
                            '<label for="ref-title">Title</label>' +
                            '<input id="ref-title" name="title" value="' + Utils.escapeHtml(ref ? ref.title : '') + '" placeholder="Article or resource title" required>' +
                        '</div>' +
                        '<div class="form-group">' +
                            '<label for="ref-url">URL</label>' +
                            '<input id="ref-url" name="url" type="url" value="' + Utils.escapeHtml(ref ? ref.url : '') + '" placeholder="https://…" required>' +
                        '</div>' +
                        '<div class="form-group">' +
                            '<label for="ref-notes">Notes</label>' +
                            '<textarea id="ref-notes" name="notes" rows="4" placeholder="Key takeaways, why this matters…">' +
                                Utils.escapeHtml(ref ? ref.notes || '' : '') +
                            '</textarea>' +
                        '</div>' +
                        '<div class="grid-2">' +
                            '<div class="form-group">' +
                                '<label for="ref-tags">Tags</label>' +
                                '<input id="ref-tags" name="tags" value="' + Utils.escapeHtml(ref ? (ref.tags || []).join(', ') : '') + '" placeholder="javascript, design">' +
                            '</div>' +
                            '<div class="form-group">' +
                                '<label for="ref-project">Link to project</label>' +
                                '<select id="ref-project" name="project_id">' + projectOptions + '</select>' +
                            '</div>' +
                        '</div>' +
                    '</form>',
                footer:
                    (ref ? '<button type="button" class="btn btn-danger" id="btn-delete-ref">Delete</button>' : '') +
                    '<button type="button" class="btn" data-modal-close>Cancel</button>' +
                    '<button type="button" class="btn btn-primary" id="btn-save-ref">Save</button>',
                onMount: function(modal, close) {
                    modal.querySelector('#btn-save-ref').addEventListener('click', function() {
                        var form = modal.querySelector('#ref-form');
                        var title = form.title.value.trim();
                        var url = form.url.value.trim();

                        if (!title || !url) {
                            Components.toast('Title and URL are required', 'error');
                            return;
                        }

                        var data = {
                            title: title,
                            url: url,
                            notes: form.notes.value.trim(),
                            tags: Utils.parseTags(form.tags.value),
                            project_id: form.project_id.value || null
                        };

                        var savePromise;
                        if (ref) {
                            savePromise = RetraqDB.updateReference(ref.id, data);
                        } else {
                            savePromise = RetraqDB.createReference(data);
                        }

                        savePromise.then(function() {
                            Components.toast(isNew ? 'Reference added' : 'Reference updated');
                            close();
                            if (options.onSave) options.onSave();
                        }).catch(function(err) {
                            Components.toast(err.message || 'Save failed', 'error');
                        });
                    });

                    var deleteBtn = modal.querySelector('#btn-delete-ref');
                    if (deleteBtn) {
                        deleteBtn.addEventListener('click', function() {
                            if (!confirm('Delete this reference?')) return;
                            RetraqDB.deleteReference(ref.id).then(function() {
                                Components.toast('Reference deleted');
                                close();
                                if (options.onSave) options.onSave();
                            });
                        });
                    }
                }
            });
        });
    }
};

window.Library = Library;
