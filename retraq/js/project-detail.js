const ProjectDetail = {
    currentProjectId: null,
    activeTab: 'tasks',

    render: function(projectId, activeTab) {
        if (activeTab) ProjectDetail.activeTab = activeTab;
        var container = document.getElementById('view-project-detail');
        if (!container) return;

        ProjectDetail.currentProjectId = projectId;

        RetraqDB.getProject(projectId).then(function(project) {
            if (!project) {
                container.innerHTML =
                    '<div class="empty-state card">' +
                        '<p>Proyek tidak ditemukan.</p>' +
                        '<button type="button" class="btn btn-primary" onclick="window.location.hash=\'#/projects\'">Back to Projects</button>' +
                    '</div>';
                return;
            }

            Promise.all([
                RetraqDB.getProjectProgress(projectId),
                RetraqDB.getTasksByProject(projectId),
                RetraqDB.getMilestonesByProject(projectId),
                RetraqDB.getNotesByProject(projectId),
                RetraqDB.getActivityLog(projectId, 50)
            ]).then(function(results) {
                var progress = results[0];
                var tasks = results[1];
                var milestones = results[2];
                var notes = results[3];
                var logs = results[4];

                container.innerHTML =
                    '<div class="project-overview card">' +
                        '<div class="card-header">' +
                            '<div style="display:flex;gap:0.75rem;align-items:flex-start">' +
                                '<span class="project-icon" style="font-size:2rem">' + Utils.escapeHtml(project.icon) + '</span>' +
                                '<div>' +
                                    '<h2 class="project-title" style="font-size:1.25rem">' + Utils.escapeHtml(project.title) + '</h2>' +
                                    (project.description ? '<p class="muted" style="margin-top:0.35rem">' + Utils.escapeHtml(project.description) + '</p>' : '') +
                                '</div>' +
                            '</div>' +
                            Components.renderBadge(Utils.statusLabel(project.status), project.status) +
                        '</div>' +
                        Components.renderProgress(progress.done, progress.total) +
                        '<div style="display:flex;gap:0.5rem;margin-top:1rem;flex-wrap:wrap">' +
                            '<select id="project-status-select" class="btn btn-sm">' +
                                Utils.PROJECT_STATUSES.map(function(s) {
                                    return '<option value="' + s + '"' + (project.status === s ? ' selected' : '') + '>' +
                                        Utils.statusLabel(s) + '</option>';
                                }).join('') +
                            '</select>' +
                            '<button type="button" class="btn btn-sm btn-danger" id="btn-delete-project">Delete Project</button>' +
                        '</div>' +
                    '</div>' +
                    '<div class="tabs">' +
                        '<button type="button" class="tab' + (ProjectDetail.activeTab === 'tasks' ? ' active' : '') + '" data-tab="tasks">Tasks (' + tasks.length + ')</button>' +
                        '<button type="button" class="tab' + (ProjectDetail.activeTab === 'milestones' ? ' active' : '') + '" data-tab="milestones">Milestones (' + milestones.length + ')</button>' +
                        '<button type="button" class="tab' + (ProjectDetail.activeTab === 'notes' ? ' active' : '') + '" data-tab="notes">Notes (' + notes.length + ')</button>' +
                        '<button type="button" class="tab' + (ProjectDetail.activeTab === 'activity' ? ' active' : '') + '" data-tab="activity">Activity (' + logs.length + ')</button>' +
                    '</div>' +
                    '<div id="project-tab-content"></div>';

                if (ProjectDetail.activeTab === 'milestones') {
                    ProjectDetail.renderMilestonesTab(project, milestones);
                } else if (ProjectDetail.activeTab === 'notes') {
                    ProjectDetail.renderNotesTab(project, notes);
                } else if (ProjectDetail.activeTab === 'activity') {
                    ProjectDetail.renderActivityTab(project, logs);
                } else {
                    ProjectDetail.renderTasksTab(project, tasks);
                }
                ProjectDetail.bindActions(container, project);
            });
        });
    },

    renderTasksTab: function(project, tasks) {
        var tab = document.getElementById('project-tab-content');
        if (!tab) return;

        var openTasks = tasks.filter(function(t) { return !t.is_done; });
        var doneTasks = tasks.filter(function(t) { return t.is_done; });

        tab.innerHTML =
            '<div class="task-add-form card" style="margin-bottom:1rem">' +
                '<div class="task-add-row">' +
                    '<input type="text" id="new-task-input" placeholder="Add a task…" maxlength="200">' +
                    '<button type="button" class="btn btn-primary btn-sm" id="btn-add-task">Add</button>' +
                '</div>' +
                '<div class="grid-2" style="margin-top:0.75rem">' +
                    '<div class="form-group" style="margin:0">' +
                        '<label for="new-task-priority">Priority</label>' +
                        '<select id="new-task-priority">' +
                            Utils.TASK_PRIORITIES.map(function(p) {
                                return '<option value="' + p + '"' + (p === 'medium' ? ' selected' : '') + '>' +
                                    p.charAt(0).toUpperCase() + p.slice(1) + '</option>';
                            }).join('') +
                        '</select>' +
                    '</div>' +
                    '<div class="form-group" style="margin:0">' +
                        '<label for="new-task-due">Due date</label>' +
                        '<input type="date" id="new-task-due">' +
                    '</div>' +
                '</div>' +
            '</div>' +
            (openTasks.length ? '<div class="task-list" id="open-tasks">' +
                openTasks.map(function(task) { return Tasks.renderTaskItem(task); }).join('') +
            '</div>' : '<p class="muted" style="margin-bottom:1rem">No open tasks. Add one above.</p>') +
            (doneTasks.length ?
                '<div class="section" style="margin-top:1.5rem">' +
                    '<h3 class="section-title" style="margin-bottom:0.75rem">Completed (' + doneTasks.length + ')</h3>' +
                    '<div class="task-list" id="done-tasks">' +
                        doneTasks.map(function(task) { return Tasks.renderTaskItem(task); }).join('') +
                    '</div>' +
                '</div>' : '');

        Tasks.bindTaskActions(tab, function() {
            ProjectDetail.render(project.id, 'tasks');
        });

        var input = tab.querySelector('#new-task-input');
        var addBtn = tab.querySelector('#btn-add-task');

        function addTask() {
            var title = input.value.trim();
            if (!title) return;
            var priority = tab.querySelector('#new-task-priority').value;
            var dueDate = tab.querySelector('#new-task-due').value || null;

            RetraqDB.createTask({
                project_id: project.id,
                title: title,
                priority: priority,
                due_date: dueDate
            }).then(function() {
                input.value = '';
                tab.querySelector('#new-task-due').value = '';
                ProjectDetail.render(project.id);
            }).catch(function(err) {
                Components.toast(err.message || 'Gagal tambah task', 'error');
            });
        }

        addBtn.addEventListener('click', addTask);
        input.addEventListener('keydown', function(e) {
            if (e.key === 'Enter') addTask();
        });
    },

    renderMilestonesTab: function(project, milestones) {
        var tab = document.getElementById('project-tab-content');
        if (!tab) return;

        tab.innerHTML =
            '<div class="task-add-row" style="margin-bottom:1rem">' +
                '<input type="text" id="new-milestone-input" placeholder="Add milestone…" maxlength="120">' +
                '<button type="button" class="btn btn-primary btn-sm" id="btn-add-milestone">Add</button>' +
            '</div>' +
            (milestones.length ?
                milestones.map(function(ms) {
                    return (
                        '<div class="card milestone-item' + (ms.is_completed ? ' done' : '') + '">' +
                            '<div class="card-header">' +
                                '<label style="display:flex;align-items:center;gap:0.75rem;cursor:pointer">' +
                                    '<input type="checkbox" class="task-checkbox" ' + (ms.is_completed ? 'checked' : '') +
                                        ' data-action="toggle-milestone" data-id="' + ms.id + '">' +
                                    '<strong' + (ms.is_completed ? ' style="text-decoration:line-through;color:var(--color-text-muted)"' : '') + '>' +
                                        Utils.escapeHtml(ms.title) + '</strong>' +
                                '</label>' +
                                '<button type="button" class="btn-icon" data-action="delete-milestone" data-id="' + ms.id + '" aria-label="Delete milestone">×</button>' +
                            '</div>' +
                        '</div>'
                    );
                }).join('') :
                '<div class="empty-state card">' + Utils.getEmptyStateSvg() + '<p>Belum ada milestone. Tambahkan checkpoint proyek di atas.</p></div>'
            );

        var msInput = tab.querySelector('#new-milestone-input');
        var msBtn = tab.querySelector('#btn-add-milestone');

        function addMilestone() {
            var title = msInput.value.trim();
            if (!title) return;
            RetraqDB.createMilestone({ project_id: project.id, title: title }).then(function() {
                msInput.value = '';
                ProjectDetail.render(project.id, 'milestones');
            });
        }

        msBtn.addEventListener('click', addMilestone);
        msInput.addEventListener('keydown', function(e) {
            if (e.key === 'Enter') addMilestone();
        });

        tab.querySelectorAll('[data-action="toggle-milestone"]').forEach(function(cb) {
            cb.addEventListener('change', function() {
                RetraqDB.toggleMilestoneComplete(cb.dataset.id).then(function() {
                    ProjectDetail.render(project.id, 'milestones');
                });
            });
        });

        tab.querySelectorAll('[data-action="delete-milestone"]').forEach(function(btn) {
            btn.addEventListener('click', function() {
                if (!confirm('Hapus milestone ini?')) return;
                RetraqDB.deleteMilestone(btn.dataset.id).then(function() {
                    ProjectDetail.render(project.id, 'milestones');
                });
            });
        });
    },

    renderNotesTab: function(project, notes) {
        var tab = document.getElementById('project-tab-content');
        if (!tab) return;

        tab.innerHTML =
            '<div style="display:flex;justify-content:flex-end;margin-bottom:1rem">' +
                '<button type="button" class="btn btn-primary btn-sm" id="btn-add-project-note">+ Add Note</button>' +
            '</div>' +
            (notes.length ?
                notes.map(function(note) {
                    return Notes.renderNoteCard(note);
                }).join('') :
                '<div class="empty-state card">' + Utils.getEmptyStateSvg('notes') + '<p>Belum ada catatan ter-link ke proyek ini.</p></div>'
            );

        tab.querySelector('#btn-add-project-note').addEventListener('click', function() {
            window.location.hash = '#/note/new?project=' + project.id;
        });

        Notes.bindNoteCards(tab, function(noteId) {
            window.location.hash = '#/note/' + noteId;
        });
    },

    // === ACTIVITY LOG TAB ===
    renderActivityTab: function(project, logs) {
        var tab = document.getElementById('project-tab-content');
        if (!tab) return;

        if (!logs.length) {
            tab.innerHTML =
                '<div class="empty-state card">' +
                    '<p style="font-size:1.5rem;margin-bottom:0.5rem">📋</p>' +
                    '<p>No activity recorded yet.</p>' +
                '</div>';
            return;
        }

        // Group logs by date
        var groups = {};
        logs.forEach(function(log) {
            var dateKey = log.created_at.slice(0, 10);
            if (!groups[dateKey]) groups[dateKey] = [];
            groups[dateKey].push(log);
        });

        var html = '<div class="activity-timeline">';

        Object.keys(groups).forEach(function(dateKey) {
            var isToday = dateKey === Utils.today();
            var dateLabel = isToday ? 'Today' : Utils.formatDate(dateKey);

            html += '<div class="activity-date-group">' +
                '<div class="activity-date-label">' + dateLabel + '</div>' +
                '<div class="activity-items">';

            groups[dateKey].forEach(function(log) {
                var icon = ProjectDetail._getActivityIcon(log.entity_type, log.action);
                var label = ProjectDetail._getActivityLabel(log.entity_type, log.action);
                var time = new Date(log.created_at).toLocaleTimeString('id-ID', {
                    hour: '2-digit',
                    minute: '2-digit'
                });

                html += '<div class="activity-item">' +
                    '<span class="activity-icon">' + icon + '</span>' +
                    '<div class="activity-body">' +
                        '<span class="activity-label">' + label + '</span>' +
                        '<span class="activity-time">' + time + '</span>' +
                    '</div>' +
                '</div>';
            });

            html += '</div></div>';
        });

        html += '</div>';
        tab.innerHTML = html;
    },

    _getActivityIcon: function(entityType, action) {
        var icons = {
            'project_created': '🚀',
            'project_updated': '✏️',
            'task_created': '➕',
            'task_updated': '✏️',
            'task_completed': '✅',
            'task_uncompleted': '↩️',
            'task_deleted': '🗑️',
            'milestone_created': '🏁',
            'milestone_completed': '🏆',
            'milestone_uncompleted': '↩️',
            'milestone_deleted': '🗑️',
            'note_linked': '🔗',
            'note_created': '📝'
        };
        return icons[entityType + '_' + action] || '📌';
    },

    _getActivityLabel: function(entityType, action) {
        var labels = {
            'project_created': 'Project created',
            'project_updated': 'Project updated',
            'task_created': 'Task added',
            'task_updated': 'Task updated',
            'task_completed': 'Task completed',
            'task_uncompleted': 'Task reopened',
            'task_deleted': 'Task deleted',
            'milestone_created': 'Milestone added',
            'milestone_completed': 'Milestone completed',
            'milestone_uncompleted': 'Milestone reopened',
            'milestone_deleted': 'Milestone deleted',
            'note_linked': 'Note linked',
            'note_created': 'Note created'
        };
        return labels[entityType + '_' + action] || (action + ' ' + entityType);
    },

    bindActions: function(container, project) {
        container.querySelectorAll('.tab').forEach(function(tabBtn) {
            tabBtn.addEventListener('click', function() {
                ProjectDetail.activeTab = tabBtn.dataset.tab;

                if (tabBtn.dataset.tab === 'milestones') {
                    RetraqDB.getMilestonesByProject(project.id).then(function(ms) {
                        ProjectDetail.renderMilestonesTab(project, ms);
                    });
                } else if (tabBtn.dataset.tab === 'notes') {
                    RetraqDB.getNotesByProject(project.id).then(function(notes) {
                        ProjectDetail.renderNotesTab(project, notes);
                    });
                } else if (tabBtn.dataset.tab === 'activity') {
                    RetraqDB.getActivityLog(project.id, 50).then(function(logs) {
                        ProjectDetail.renderActivityTab(project, logs);
                    });
                } else {
                    RetraqDB.getTasksByProject(project.id).then(function(tasks) {
                        ProjectDetail.renderTasksTab(project, tasks);
                    });
                }

                container.querySelectorAll('.tab').forEach(function(t) { t.classList.remove('active'); });
                tabBtn.classList.add('active');
            });
        });

        var statusSelect = container.querySelector('#project-status-select');
        if (statusSelect) {
            statusSelect.addEventListener('change', function() {
                RetraqDB.updateProject(project.id, { status: statusSelect.value }).then(function() {
                    Components.toast('Status updated');
                    ProjectDetail.render(project.id);
                });
            });
        }

        var deleteBtn = container.querySelector('#btn-delete-project');
        if (deleteBtn) {
            deleteBtn.addEventListener('click', function() {
                if (!confirm('Hapus proyek "' + project.title + '" dan semua task-nya?')) return;
                RetraqDB.deleteProject(project.id).then(function() {
                    Components.toast('Proyek dihapus');
                    window.location.hash = '#/projects';
                });
            });
        }
    }
};

window.ProjectDetail = ProjectDetail;
