/* =======================================================
   PARA-lite Areas — v1.2
   Areas = ongoing responsibilities/interests (e.g. Health,
   Learning, Career). Projects & notes can belong to areas.
   ======================================================= */

const Areas = {
    render: function() {
        var container = document.getElementById('view-areas');
        if (!container) return;

        RetraqDB.getAllAreas().then(function(areas) {
            container.innerHTML =
                '<div class="section-header">' +
                    '<h2 class="section-title">Areas</h2>' +
                    '<button type="button" class="btn btn-primary btn-sm" id="btn-add-area">+ New Area</button>' +
                '</div>' +
                '<p class="muted" style="margin-bottom:1.25rem">Ongoing responsibilities & interests that don\'t have a deadline.</p>' +
                '<div id="areas-list">' +
                    Areas.renderList(areas) +
                '</div>';

            container.querySelector('#btn-add-area').addEventListener('click', function() {
                Areas.showEditor({ onSave: function() { Areas.render(); } });
            });

            Areas.bindCards(container);
        });
    },

    renderList: function(areas) {
        if (!areas || !areas.length) {
            return '<div class="empty-state card">' +
                '<p>No areas yet.</p>' +
                '<p class="muted" style="margin-top:0.5rem">Areas are ongoing parts of life: Health, Career, Finance, Learning, etc.</p>' +
            '</div>';
        }

        return areas.map(function(area) {
            return '<div class="card card-clickable area-card" data-area-id="' + area.id + '">' +
                '<div class="card-header">' +
                    '<div style="display:flex;align-items:center;gap:0.75rem">' +
                        '<span class="project-icon">' + Utils.escapeHtml(area.icon || '📂') + '</span>' +
                        '<div>' +
                            '<div class="project-title">' + Utils.escapeHtml(area.name) + '</div>' +
                            (area.description ? '<p class="muted" style="margin-top:0.2rem;font-size:0.8rem">' + Utils.escapeHtml(area.description) + '</p>' : '') +
                        '</div>' +
                    '</div>' +
                    '<span class="area-counts muted" data-area-count="' + area.id + '"></span>' +
                '</div>' +
            '</div>';
        }).join('');
    },

    loadCounts: function(areas) {
        areas.forEach(function(area) {
            Promise.all([
                RetraqDB.getProjectsByArea(area.id),
                RetraqDB.getNotesByArea(area.id)
            ]).then(function(results) {
                var el = document.querySelector('[data-area-count="' + area.id + '"]');
                if (el) {
                    var pCount = results[0].length;
                    var nCount = results[1].length;
                    var parts = [];
                    if (pCount) parts.push(pCount + ' project' + (pCount > 1 ? 's' : ''));
                    if (nCount) parts.push(nCount + ' note' + (nCount > 1 ? 's' : ''));
                    el.textContent = parts.join(' · ') || '';
                }
            });
        });
    },

    bindCards: function(container) {
        RetraqDB.getAllAreas().then(function(areas) {
            Areas.loadCounts(areas);

            container.querySelectorAll('[data-area-id]').forEach(function(card) {
                card.addEventListener('click', function() {
                    Areas.renderDetail(card.dataset.areaId);
                });
            });
        });
    },

    renderDetail: function(areaId) {
        var container = document.getElementById('view-areas');
        if (!container) return;

        RetraqDB.getArea(areaId).then(function(area) {
            if (!area) return;

            Promise.all([
                RetraqDB.getProjectsByArea(areaId),
                RetraqDB.getNotesByArea(areaId)
            ]).then(function(results) {
                var projects = results[0];
                var notes = results[1];

                container.innerHTML =
                    '<div style="margin-bottom:1rem">' +
                        '<button type="button" class="btn btn-sm" id="btn-areas-back">← Back to Areas</button>' +
                    '</div>' +
                    '<div class="card" style="margin-bottom:1.5rem">' +
                        '<div class="card-header">' +
                            '<div style="display:flex;align-items:center;gap:0.75rem">' +
                                '<span style="font-size:2rem">' + Utils.escapeHtml(area.icon || '📂') + '</span>' +
                                '<div>' +
                                    '<h2 style="font-size:1.25rem;font-weight:600">' + Utils.escapeHtml(area.name) + '</h2>' +
                                    (area.description ? '<p class="muted" style="margin-top:0.35rem">' + Utils.escapeHtml(area.description) + '</p>' : '') +
                                '</div>' +
                            '</div>' +
                            '<div style="display:flex;gap:0.5rem">' +
                                '<button type="button" class="btn btn-sm" id="btn-edit-area">Edit</button>' +
                                '<button type="button" class="btn btn-sm btn-danger" id="btn-delete-area">Delete</button>' +
                            '</div>' +
                        '</div>' +
                    '</div>' +

                    '<div class="section">' +
                        '<div class="section-header">' +
                            '<h3 class="section-title">Projects (' + projects.length + ')</h3>' +
                        '</div>' +
                        (projects.length ?
                            projects.map(function(p) {
                                return '<div class="card card-clickable" onclick="window.location.hash=\'#/project/' + p.id + '\'">' +
                                    '<div style="display:flex;align-items:center;gap:0.5rem">' +
                                        '<span>' + Utils.escapeHtml(p.icon) + '</span>' +
                                        '<span class="project-title">' + Utils.escapeHtml(p.title) + '</span>' +
                                        Components.renderBadge(Utils.statusLabel(p.status), p.status) +
                                    '</div>' +
                                '</div>';
                            }).join('') :
                            '<p class="muted">No projects in this area. Assign projects via project settings.</p>'
                        ) +
                    '</div>' +

                    '<div class="section">' +
                        '<div class="section-header">' +
                            '<h3 class="section-title">Notes (' + notes.length + ')</h3>' +
                        '</div>' +
                        (notes.length ?
                            notes.map(function(note) {
                                return Notes.renderNoteCard(note);
                            }).join('') :
                            '<p class="muted">No notes in this area.</p>'
                        ) +
                    '</div>';

                container.querySelector('#btn-areas-back').addEventListener('click', function() {
                    Areas.render();
                });

                container.querySelector('#btn-edit-area').addEventListener('click', function() {
                    Areas.showEditor({
                        area: area,
                        onSave: function() { Areas.renderDetail(areaId); }
                    });
                });

                container.querySelector('#btn-delete-area').addEventListener('click', function() {
                    if (!confirm('Delete area "' + area.name + '"? Projects and notes will be unlinked but not deleted.')) return;
                    RetraqDB.deleteArea(areaId).then(function() {
                        Components.toast('Area deleted');
                        Areas.render();
                    });
                });

                Notes.bindNoteCards(container, function(noteId) {
                    RetraqDB.getNote(noteId).then(function(note) {
                        Notes.showEditor({
                            note: note,
                            onSave: function() { Areas.renderDetail(areaId); }
                        });
                    });
                });
            });
        });
    },

    showEditor: function(options) {
        options = options || {};
        var area = options.area;
        var isNew = !area;

        var AREA_ICONS = ['📂', '💪', '💼', '📚', '💰', '🏠', '🎨', '🧠', '❤️', '🔧', '🌍', '🎯'];

        var iconsHtml = AREA_ICONS.map(function(icon) {
            var selected = (area ? area.icon : '📂') === icon ? ' area-icon-selected' : '';
            return '<button type="button" class="area-icon-btn' + selected + '" data-icon="' + icon + '">' + icon + '</button>';
        }).join('');

        Components.modal({
            title: isNew ? 'New Area' : 'Edit Area',
            body:
                '<form id="area-form">' +
                    '<div class="form-group">' +
                        '<label>Icon</label>' +
                        '<div class="area-icon-picker">' + iconsHtml + '</div>' +
                        '<input type="hidden" id="area-icon" name="icon" value="' + Utils.escapeHtml(area ? area.icon : '📂') + '">' +
                    '</div>' +
                    '<div class="form-group">' +
                        '<label for="area-name">Name</label>' +
                        '<input id="area-name" name="name" value="' + Utils.escapeHtml(area ? area.name : '') + '" placeholder="e.g. Health, Career, Learning" required>' +
                    '</div>' +
                    '<div class="form-group">' +
                        '<label for="area-desc">Description</label>' +
                        '<input id="area-desc" name="description" value="' + Utils.escapeHtml(area ? area.description || '' : '') + '" placeholder="Optional short description">' +
                    '</div>' +
                '</form>',
            footer:
                '<button type="button" class="btn" data-modal-close>Cancel</button>' +
                '<button type="button" class="btn btn-primary" id="btn-save-area">Save</button>',
            onMount: function(modal, close) {
                // Icon picker
                modal.querySelectorAll('.area-icon-btn').forEach(function(btn) {
                    btn.addEventListener('click', function(e) {
                        e.preventDefault();
                        modal.querySelectorAll('.area-icon-btn').forEach(function(b) { b.classList.remove('area-icon-selected'); });
                        btn.classList.add('area-icon-selected');
                        modal.querySelector('#area-icon').value = btn.dataset.icon;
                    });
                });

                modal.querySelector('#btn-save-area').addEventListener('click', function() {
                    var form = modal.querySelector('#area-form');
                    var name = form.name.value.trim();
                    if (!name) {
                        Components.toast('Name is required', 'error');
                        return;
                    }

                    var data = {
                        name: name,
                        description: form.description.value.trim(),
                        icon: form.icon.value || '📂'
                    };

                    var savePromise;
                    if (area) {
                        savePromise = RetraqDB.updateArea(area.id, data);
                    } else {
                        savePromise = RetraqDB.createArea(data);
                    }

                    savePromise.then(function() {
                        Components.toast(isNew ? 'Area created' : 'Area updated');
                        close();
                        if (options.onSave) options.onSave();
                    }).catch(function(err) {
                        Components.toast(err.message || 'Save failed', 'error');
                    });
                });
            }
        });
    }
};

window.Areas = Areas;
