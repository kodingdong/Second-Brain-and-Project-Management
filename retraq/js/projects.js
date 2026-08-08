const Projects = {
    render: function() {
        var container = document.getElementById('view-projects');
        if (!container) return;

        RetraqDB.getAllProjects().then(function(projects) {
            if (!projects.length) {
                container.innerHTML =
                    '<div class="empty-state card">' +
                        '<p>Belum ada proyek. Buat proyek pertama untuk mulai tracking.</p>' +
                        '<button type="button" class="btn btn-primary" data-action="new-project">+ New Project</button>' +
                    '</div>';
                Projects.bindActions(container);
                return;
            }

            Promise.all(projects.map(function(project) {
                return RetraqDB.getProjectProgress(project.id).then(function(progress) {
                    return { project: project, progress: progress };
                });
            })).then(function(items) {
                container.innerHTML =
                    '<div class="section-header">' +
                        '<div><h2 class="section-title">All Projects</h2><p class="muted">' + items.length + ' proyek</p></div>' +
                        '<button type="button" class="btn btn-primary btn-sm" data-action="new-project">+ New Project</button>' +
                    '</div>' +
                    items.map(function(item) {
                        return Projects.renderCard(item.project, item.progress);
                    }).join('');

                Projects.bindActions(container);
            });
        });
    },

    renderCard: function(project, progress) {
        progress = progress || { done: 0, total: 0, percent: 0 };
        return (
            '<article class="card card-clickable" data-action="open-project" data-id="' + project.id + '">' +
                '<div class="card-header">' +
                    '<div style="display:flex;gap:0.75rem;align-items:flex-start">' +
                        '<span class="project-icon">' + Utils.escapeHtml(project.icon) + '</span>' +
                        '<div>' +
                            '<div class="project-title">' + Utils.escapeHtml(project.title) + '</div>' +
                            (project.description ? '<p class="muted" style="margin-top:0.25rem">' + Utils.escapeHtml(project.description) + '</p>' : '') +
                        '</div>' +
                    '</div>' +
                    Components.renderBadge(Utils.statusLabel(project.status), project.status) +
                '</div>' +
                Components.renderProgress(progress.done, progress.total) +
                (project.target_date ? '<p class="muted" style="margin-top:0.5rem">Target: ' + Utils.escapeHtml(Utils.formatDate(project.target_date)) + '</p>' : '') +
            '</article>'
        );
    },

    bindActions: function(container) {
        container.querySelectorAll('[data-action="new-project"]').forEach(function(btn) {
            btn.addEventListener('click', function() {
                Projects.showCreateModal();
            });
        });

        container.querySelectorAll('[data-action="open-project"]').forEach(function(card) {
            card.addEventListener('click', function() {
                window.location.hash = '#/project/' + card.dataset.id;
            });
        });
    },

    showCreateModal: function() {
        var templateOptions = Utils.PROJECT_TEMPLATES.map(function(t) {
            return '<option value="' + t.id + '">' + Utils.escapeHtml(t.icon + ' ' + t.label) + '</option>';
        }).join('');

        RetraqDB.getAllAreas().then(function(areas) {
            var areaOptions = '<option value="">— No area —</option>' +
                areas.map(function(a) {
                    return '<option value="' + a.id + '">' + Utils.escapeHtml(a.icon + ' ' + a.name) + '</option>';
                }).join('');

            Components.modal({
                title: 'New Project',
                body:
                    '<form id="project-form">' +
                        '<div class="form-group">' +
                            '<label for="project-title">Title</label>' +
                            '<input id="project-title" name="title" required placeholder="e.g. Retraq Personal PWA">' +
                        '</div>' +
                        '<div class="form-group">' +
                            '<label for="project-description">Description</label>' +
                            '<textarea id="project-description" name="description" placeholder="Optional short description"></textarea>' +
                        '</div>' +
                        '<div class="grid-2">' +
                            '<div class="form-group">' +
                                '<label for="project-status">Status</label>' +
                                '<select id="project-status" name="status">' +
                                    Utils.PROJECT_STATUSES.map(function(s) {
                                        var selected = s === 'planning' ? ' selected' : '';
                                        return '<option value="' + s + '"' + selected + '>' + Utils.statusLabel(s) + '</option>';
                                    }).join('') +
                                '</select>' +
                            '</div>' +
                            '<div class="form-group">' +
                                '<label for="project-template">Template</label>' +
                                '<select id="project-template" name="template">' + templateOptions + '</select>' +
                            '</div>' +
                        '</div>' +
                        '<div class="grid-2">' +
                            '<div class="form-group">' +
                                '<label for="project-target-date">Target date</label>' +
                                '<input id="project-target-date" name="target_date" type="date">' +
                            '</div>' +
                            '<div class="form-group">' +
                                '<label for="project-area">Area</label>' +
                                '<select id="project-area" name="area_id">' + areaOptions + '</select>' +
                            '</div>' +
                        '</div>' +
                    '</form>',
                footer:
                    '<button type="button" class="btn" data-modal-close>Cancel</button>' +
                    '<button type="button" class="btn btn-primary" id="btn-save-project">Create Project</button>',
                onMount: function(modal, close) {
                    var templateSelect = modal.querySelector('#project-template');
                    var titleInput = modal.querySelector('#project-title');

                    templateSelect.addEventListener('change', function() {
                        if (!titleInput.value.trim()) {
                            var tpl = Utils.PROJECT_TEMPLATES.find(function(t) { return t.id === templateSelect.value; });
                            if (tpl && tpl.id !== 'blank') {
                                titleInput.placeholder = 'e.g. My ' + tpl.label;
                            }
                        }
                    });

                    modal.querySelector('#btn-save-project').addEventListener('click', function() {
                        var form = modal.querySelector('#project-form');
                        var title = form.title.value.trim();
                        if (!title) {
                            Components.toast('Title wajib diisi', 'error');
                            return;
                        }

                        var template = Utils.PROJECT_TEMPLATES.find(function(t) {
                            return t.id === form.template.value;
                        }) || Utils.PROJECT_TEMPLATES[3];

                        RetraqDB.createProject({
                            title: title,
                            description: form.description.value,
                            status: form.status.value,
                            icon: template.icon,
                            target_date: form.target_date.value || null,
                            area_id: form.area_id.value || null
                        }).then(function(project) {
                            return RetraqDB.createMilestonesForProject(project.id, template.milestones).then(function() {
                                return project;
                            });
                        }).then(function(project) {
                            Components.toast('Proyek dibuat');
                            close();
                            App.navigate(window.location.hash);
                            window.location.hash = '#/project/' + project.id;
                        }).catch(function(err) {
                            Components.toast(err.message || 'Gagal buat proyek', 'error');
                        });
                    });
                }
            });
        });
    }
};

window.Projects = Projects;
