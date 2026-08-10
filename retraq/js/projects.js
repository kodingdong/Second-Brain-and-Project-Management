/**
 * Projects — Notion-style multi-view (Gallery / Kanban / Table)
 * with Filter & Sort capabilities
 */
const Projects = {
    currentView: 'gallery',
    VIEWS: ['gallery', 'kanban', 'table'],
    currentFilter: 'all',
    currentSort: 'activity',

    render: function() {
        var container = document.getElementById('view-projects');
        if (!container) return;

        // Restore saved preferences
        var saved = localStorage.getItem('retraq_projects_view');
        if (saved && Projects.VIEWS.indexOf(saved) !== -1) {
            Projects.currentView = saved;
        }
        var savedFilter = localStorage.getItem('retraq_projects_filter');
        if (savedFilter) Projects.currentFilter = savedFilter;
        var savedSort = localStorage.getItem('retraq_projects_sort');
        if (savedSort) Projects.currentSort = savedSort;

        Promise.all([
            RetraqDB.getAllProjects(),
        ]).then(function(results) {
            var projects = results[0];

            return Promise.all(projects.map(function(project) {
                return RetraqDB.getProjectProgress(project.id).then(function(progress) {
                    return { project: project, progress: progress };
                });
            }));
        }).then(function(items) {
            // Apply filter
            var filtered = Projects._applyFilter(items);
            // Apply sort
            var sorted = Projects._applySort(filtered);

            container.innerHTML =
                '<div class="projects-header">' +
                    '<div>' +
                        '<h2 class="section-title">Projects</h2>' +
                        '<p class="muted">' + sorted.length + ' of ' + items.length + ' project' + (items.length !== 1 ? 's' : '') + '</p>' +
                    '</div>' +
                    '<div class="projects-toolbar">' +
                        Projects.renderViewSwitcher() +
                        '<button type="button" class="btn btn-primary btn-sm" data-action="new-project">+ New</button>' +
                    '</div>' +
                '</div>' +
                '<div class="projects-filter-bar">' +
                    Projects._renderFilterBar(items) +
                '</div>' +
                '<div id="projects-view-container">' +
                    Projects.renderCurrentView(sorted) +
                '</div>';

            Projects.bindActions(container);
        });
    },

    _renderFilterBar: function(allItems) {
        var statusCounts = {};
        allItems.forEach(function(item) {
            var s = item.project.status;
            statusCounts[s] = (statusCounts[s] || 0) + 1;
        });

        var filters = [
            { id: 'all', label: 'All', count: allItems.length }
        ];
        Utils.PROJECT_STATUSES.forEach(function(s) {
            if (statusCounts[s]) {
                filters.push({ id: s, label: Utils.statusLabel(s), count: statusCounts[s] });
            }
        });

        var sortOptions = [
            { id: 'activity', label: 'Last Active' },
            { id: 'name', label: 'Name A-Z' },
            { id: 'name-desc', label: 'Name Z-A' },
            { id: 'progress', label: 'Progress ↑' },
            { id: 'progress-desc', label: 'Progress ↓' },
            { id: 'date', label: 'Target Date' }
        ];

        return '<div class="filter-chips">' +
            filters.map(function(f) {
                return '<button type="button" class="filter-chip' +
                    (Projects.currentFilter === f.id ? ' active' : '') +
                    '" data-filter="' + f.id + '">' +
                    f.label + ' <span class="filter-count">' + f.count + '</span>' +
                '</button>';
            }).join('') +
        '</div>' +
        '<div class="sort-control">' +
            '<label class="sort-label">Sort:</label>' +
            '<select class="sort-select" id="projects-sort">' +
                sortOptions.map(function(o) {
                    return '<option value="' + o.id + '"' +
                        (Projects.currentSort === o.id ? ' selected' : '') + '>' +
                        o.label + '</option>';
                }).join('') +
            '</select>' +
        '</div>';
    },

    _applyFilter: function(items) {
        if (Projects.currentFilter === 'all') return items;
        return items.filter(function(item) {
            return item.project.status === Projects.currentFilter;
        });
    },

    _applySort: function(items) {
        var sorted = items.slice();
        switch (Projects.currentSort) {
            case 'name':
                sorted.sort(function(a, b) { return a.project.title.localeCompare(b.project.title); });
                break;
            case 'name-desc':
                sorted.sort(function(a, b) { return b.project.title.localeCompare(a.project.title); });
                break;
            case 'progress':
                sorted.sort(function(a, b) { return a.progress.percent - b.progress.percent; });
                break;
            case 'progress-desc':
                sorted.sort(function(a, b) { return b.progress.percent - a.progress.percent; });
                break;
            case 'date':
                sorted.sort(function(a, b) {
                    var da = a.project.target_date || '9999';
                    var db = b.project.target_date || '9999';
                    return da.localeCompare(db);
                });
                break;
            default: // activity — already sorted by db
                break;
        }
        return sorted;
    },

    renderViewSwitcher: function() {
        var icons = { gallery: '▦', kanban: '⊞', table: '≡' };
        return '<div class="view-switcher">' +
            Projects.VIEWS.map(function(view) {
                return '<button type="button" class="view-switch-btn' +
                    (Projects.currentView === view ? ' active' : '') +
                    '" data-view="' + view + '" title="' + view.charAt(0).toUpperCase() + view.slice(1) + ' view">' +
                    icons[view] + '</button>';
            }).join('') +
        '</div>';
    },

    renderCurrentView: function(items) {
        switch (Projects.currentView) {
            case 'kanban': return Projects.renderKanban(items);
            case 'table': return Projects.renderTable(items);
            default: return Projects.renderGallery(items);
        }
    },

    // === GALLERY VIEW ===
    renderGallery: function(items) {
        if (!items.length) {
            return '<div class="empty-state card">' +
                Utils.getEmptyStateSvg('projects') +
                '<p>No projects match this filter.</p>' +
                '<button type="button" class="btn btn-primary" data-action="new-project" style="margin-top:0.75rem">+ New Project</button>' +
            '</div>';
        }

        return '<div class="project-gallery">' +
            items.map(function(item) {
                var p = item.project;
                var prog = item.progress;
                var statusColor = 'var(--status-' + p.status + ')';

                return (
                    '<article class="gallery-card card-clickable" data-action="open-project" data-id="' + p.id + '">' +
                        '<div class="gallery-cover" style="background: linear-gradient(135deg, ' + statusColor + '22, ' + statusColor + '08)">' +
                            '<span class="gallery-icon">' + Utils.escapeHtml(p.icon) + '</span>' +
                        '</div>' +
                        '<div class="gallery-body">' +
                            '<div class="gallery-title">' + Utils.escapeHtml(p.title) + '</div>' +
                            (p.description ? '<p class="gallery-desc">' + Utils.escapeHtml(p.description).slice(0, 60) + '</p>' : '') +
                            '<div class="gallery-footer">' +
                                Components.renderBadge(Utils.statusLabel(p.status), p.status) +
                                '<span class="muted" style="font-size:0.75rem">' + prog.percent + '%</span>' +
                            '</div>' +
                            '<div class="gallery-progress">' +
                                '<div class="gallery-progress-fill" style="width:' + prog.percent + '%"></div>' +
                            '</div>' +
                        '</div>' +
                    '</article>'
                );
            }).join('') +
        '</div>';
    },

    // === KANBAN VIEW ===
    renderKanban: function(items) {
        var columns = [
            { id: 'idea', label: 'Idea', color: 'var(--status-idea)' },
            { id: 'planning', label: 'Planning', color: 'var(--status-planning)' },
            { id: 'active', label: 'Active', color: 'var(--status-active)' },
            { id: 'paused', label: 'Paused', color: 'var(--status-paused)' },
            { id: 'done', label: 'Done', color: 'var(--status-done)' }
        ];

        return '<div class="kanban-board">' +
            columns.map(function(col) {
                var colItems = items.filter(function(item) {
                    return item.project.status === col.id;
                });

                return (
                    '<div class="kanban-column" data-status="' + col.id + '">' +
                        '<div class="kanban-col-header">' +
                            '<div class="kanban-col-dot" style="background:' + col.color + '"></div>' +
                            '<span class="kanban-col-title">' + col.label + '</span>' +
                            '<span class="kanban-col-count">' + colItems.length + '</span>' +
                        '</div>' +
                        '<div class="kanban-col-body">' +
                            colItems.map(function(item) {
                                var p = item.project;
                                var prog = item.progress;
                                return (
                                    '<div class="kanban-card card-clickable" draggable="true" data-action="open-project" data-id="' + p.id + '">' +
                                        '<div class="kanban-card-title">' +
                                            '<span>' + Utils.escapeHtml(p.icon) + '</span> ' +
                                            Utils.escapeHtml(p.title) +
                                        '</div>' +
                                        (prog.total > 0 ?
                                            '<div class="kanban-card-progress">' +
                                                '<div class="gallery-progress"><div class="gallery-progress-fill" style="width:' + prog.percent + '%"></div></div>' +
                                                '<span class="muted" style="font-size:0.7rem">' + prog.done + '/' + prog.total + '</span>' +
                                            '</div>' : '') +
                                        (p.target_date ?
                                            '<div class="kanban-card-date muted">' + Utils.formatDate(p.target_date) + '</div>' : '') +
                                    '</div>'
                                );
                            }).join('') +
                            '<button type="button" class="kanban-add-btn" data-action="new-project-status" data-status="' + col.id + '">+ Add</button>' +
                        '</div>' +
                    '</div>'
                );
            }).join('') +
        '</div>';
    },

    // === TABLE VIEW ===
    renderTable: function(items) {
        if (!items.length) {
            return '<div class="empty-state card">' +
                Utils.getEmptyStateSvg('projects') +
                '<p>No projects match this filter.</p>' +
                '<button type="button" class="btn btn-primary" data-action="new-project" style="margin-top:0.75rem">+ New Project</button>' +
            '</div>';
        }

        return (
            '<div class="table-wrap">' +
                '<table class="data-table">' +
                    '<thead>' +
                        '<tr>' +
                            '<th class="table-th-icon"></th>' +
                            '<th>Title</th>' +
                            '<th>Status</th>' +
                            '<th>Progress</th>' +
                            '<th>Target</th>' +
                            '<th>Tasks</th>' +
                        '</tr>' +
                    '</thead>' +
                    '<tbody>' +
                        items.map(function(item) {
                            var p = item.project;
                            var prog = item.progress;
                            return (
                                '<tr class="table-row-clickable" data-action="open-project" data-id="' + p.id + '">' +
                                    '<td class="table-td-icon">' + Utils.escapeHtml(p.icon) + '</td>' +
                                    '<td>' +
                                        '<div class="table-title">' + Utils.escapeHtml(p.title) + '</div>' +
                                        (p.description ? '<div class="table-subtitle">' + Utils.escapeHtml(p.description).slice(0, 50) + '</div>' : '') +
                                    '</td>' +
                                    '<td>' + Components.renderBadge(Utils.statusLabel(p.status), p.status) + '</td>' +
                                    '<td>' +
                                        '<div class="table-progress-cell">' +
                                            '<div class="gallery-progress" style="width:60px"><div class="gallery-progress-fill" style="width:' + prog.percent + '%"></div></div>' +
                                            '<span class="muted" style="font-size:0.75rem">' + prog.percent + '%</span>' +
                                        '</div>' +
                                    '</td>' +
                                    '<td class="muted">' + (p.target_date ? Utils.formatDate(p.target_date) : '\u2014') + '</td>' +
                                    '<td class="muted">' + prog.tasksDone + '/' + prog.tasksTotal + '</td>' +
                                '</tr>'
                            );
                        }).join('') +
                    '</tbody>' +
                '</table>' +
            '</div>'
        );
    },

    bindActions: function(container) {
        // View switcher
        container.querySelectorAll('[data-view]').forEach(function(btn) {
            btn.addEventListener('click', function() {
                Projects.currentView = btn.dataset.view;
                localStorage.setItem('retraq_projects_view', Projects.currentView);
                Projects.render();
            });
        });

        // Filter chips
        container.querySelectorAll('[data-filter]').forEach(function(btn) {
            btn.addEventListener('click', function() {
                Projects.currentFilter = btn.dataset.filter;
                localStorage.setItem('retraq_projects_filter', Projects.currentFilter);
                Projects.render();
            });
        });

        // Sort select
        var sortSelect = container.querySelector('#projects-sort');
        if (sortSelect) {
            sortSelect.addEventListener('change', function() {
                Projects.currentSort = sortSelect.value;
                localStorage.setItem('retraq_projects_sort', Projects.currentSort);
                Projects.render();
            });
        }

        // New project
        container.querySelectorAll('[data-action="new-project"]').forEach(function(btn) {
            btn.addEventListener('click', function() {
                Projects.showCreateModal();
            });
        });

        // New project with pre-set status
        container.querySelectorAll('[data-action="new-project-status"]').forEach(function(btn) {
            btn.addEventListener('click', function() {
                Projects.showCreateModal(btn.dataset.status);
            });
        });

        // Open project
        container.querySelectorAll('[data-action="open-project"]').forEach(function(el) {
            el.addEventListener('click', function() {
                window.location.hash = '#/project/' + el.dataset.id;
            });
        });

        // Kanban Drag & Drop
        var draggedCard = null;

        container.querySelectorAll('.kanban-card').forEach(function(card) {
            card.addEventListener('dragstart', function(e) {
                draggedCard = card;
                e.dataTransfer.effectAllowed = 'move';
                e.dataTransfer.setData('text/plain', card.dataset.id);
                setTimeout(function() { card.style.opacity = '0.5'; }, 0);
            });
            card.addEventListener('dragend', function() {
                draggedCard = null;
                card.style.opacity = '1';
                container.querySelectorAll('.kanban-column').forEach(function(col) {
                    col.classList.remove('drag-over');
                });
            });
        });

        container.querySelectorAll('.kanban-column').forEach(function(col) {
            col.addEventListener('dragover', function(e) {
                e.preventDefault();
                e.dataTransfer.dropEffect = 'move';
                if (draggedCard && !col.contains(draggedCard)) {
                    col.classList.add('drag-over');
                }
            });
            col.addEventListener('dragleave', function(e) {
                if (!col.contains(e.relatedTarget)) {
                    col.classList.remove('drag-over');
                }
            });
            col.addEventListener('drop', function(e) {
                e.preventDefault();
                col.classList.remove('drag-over');
                var projectId = e.dataTransfer.getData('text/plain');
                var newStatus = col.dataset.status;

                if (projectId && newStatus) {
                    RetraqDB.updateProject(projectId, { status: newStatus }).then(function() {
                        Projects.render();
                    });
                }
            });
        });
    },

    showCreateModal: function(defaultStatus) {
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
                                        var selected = s === (defaultStatus || 'planning') ? ' selected' : '';
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
