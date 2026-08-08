const Dashboard = {
    render: function() {
        var container = document.getElementById('view-dashboard');
        if (!container) return;

        Promise.all([
            RetraqDB.getActiveProjects(),
            RetraqDB.getOverdueTasks(),
            RetraqDB.getTasksDueSoon(7),
            RetraqDB.getStaleProjects(7),
            RetraqDB.getAllProjects(),
            RetraqDB.getInboxCount()
        ]).then(function(results) {
            var activeProjects = results[0];
            var overdueTasks = results[1];
            var dueTasks = results[2];
            var staleProjects = results[3];
            var allProjects = results[4];
            var inboxCount = results[5];

            return Promise.all([
                Promise.resolve({
                    activeProjects: activeProjects,
                    overdueTasks: overdueTasks,
                    dueTasks: dueTasks,
                    staleProjects: staleProjects,
                    allProjects: allProjects,
                    inboxCount: inboxCount
                }),
                Promise.all(activeProjects.map(function(p) {
                    return RetraqDB.getProjectProgress(p.id).then(function(progress) {
                        return { project: p, progress: progress };
                    });
                })),
                Promise.all(overdueTasks.map(function(task) {
                    return RetraqDB.getProject(task.project_id).then(function(project) {
                        return { task: task, project: project };
                    });
                })),
                Promise.all(dueTasks.map(function(task) {
                    return RetraqDB.getProject(task.project_id).then(function(project) {
                        return { task: task, project: project };
                    });
                }))
            ]);
        }).then(function(results) {
            var meta = results[0];
            var activeWithProgress = results[1];
            var overdueWithProject = results[2];
            var dueWithProject = results[3];

            container.innerHTML =
                '<div class="section">' +
                    '<div class="section-header">' +
                        '<div><h2 class="section-title">Active Projects</h2><p class="muted">Max 5 proyek aktif/planning</p></div>' +
                        '<button type="button" class="btn btn-primary btn-sm" data-action="new-project">+ New Project</button>' +
                    '</div>' +
                    (activeWithProgress.length ?
                        activeWithProgress.map(function(item) {
                            return (
                                '<article class="card card-clickable" data-action="open-project" data-id="' + item.project.id + '">' +
                                    '<div class="card-header">' +
                                        '<div style="display:flex;gap:0.75rem;align-items:center">' +
                                            '<span class="project-icon">' + Utils.escapeHtml(item.project.icon) + '</span>' +
                                            '<div class="project-title">' + Utils.escapeHtml(item.project.title) + '</div>' +
                                        '</div>' +
                                        Components.renderBadge(Utils.statusLabel(item.project.status), item.project.status) +
                                    '</div>' +
                                    Components.renderProgress(item.progress.done, item.progress.total) +
                                '</article>'
                            );
                        }).join('') :
                        '<div class="empty-state card"><p>Belum ada proyek aktif. Buat proyek pertama!</p></div>'
                    ) +
                '</div>' +
                (meta.inboxCount > 0 ?
                    '<div class="section">' +
                        '<div class="section-header">' +
                            '<h2 class="section-title">Inbox</h2>' +
                            '<a href="#/inbox" class="btn btn-sm">' + meta.inboxCount + ' to process →</a>' +
                        '</div>' +
                        '<div class="card"><p class="muted">' + meta.inboxCount + ' capture(s) waiting to be processed.</p></div>' +
                    '</div>' : '') +
                '<div class="section">' +
                    '<h2 class="section-title" style="margin-bottom:0.75rem">Overdue Tasks</h2>' +
                    (overdueWithProject.length ?
                        '<div class="task-list">' +
                            overdueWithProject.map(function(item) {
                                return Tasks.renderTaskItem(item.task, {
                                    showProject: true,
                                    projectTitle: item.project ? item.project.title : 'Unknown'
                                });
                            }).join('') +
                        '</div>' :
                        '<div class="card"><p class="muted">Tidak ada task yang telat. Bagus!</p></div>'
                    ) +
                '</div>' +
                '<div class="section">' +
                    '<h2 class="section-title" style="margin-bottom:0.75rem">Tasks Due Soon</h2>' +
                    (dueWithProject.length ?
                        '<div class="task-list">' +
                            dueWithProject.map(function(item) {
                                return Tasks.renderTaskItem(item.task, {
                                    showProject: true,
                                    projectTitle: item.project ? item.project.title : 'Unknown'
                                });
                            }).join('') +
                        '</div>' :
                        '<div class="card"><p class="muted">Tidak ada task dengan deadline 7 hari ke depan.</p></div>'
                    ) +
                '</div>' +
                '<div class="section">' +
                    '<h2 class="section-title" style="margin-bottom:0.75rem">Stale Projects</h2>' +
                    (meta.staleProjects.length ?
                        meta.staleProjects.map(function(project) {
                            return (
                                '<article class="card card-clickable" data-action="open-project" data-id="' + project.id + '">' +
                                    '<div class="card-header">' +
                                        '<div><strong>' + Utils.escapeHtml(project.icon + ' ' + project.title) + '</strong>' +
                                        '<p class="muted">No activity for ' + Utils.daysSince(project.last_activity_at) + ' days</p></div>' +
                                        Components.renderBadge(Utils.statusLabel(project.status), project.status) +
                                    '</div>' +
                                '</article>'
                            );
                        }).join('') :
                        '<div class="card"><p class="muted">Semua proyek aktif masih bergerak 👍</p></div>'
                    ) +
                '</div>' +
                '<div class="section">' +
                    '<p class="muted">Total projects: ' + meta.allProjects.length + '</p>' +
                '</div>';

            Dashboard.bindActions(container);
            Tasks.bindTaskActions(container, function() {
                Dashboard.render();
            });

            // Inject async widgets: Habits + Review
            Dashboard.injectWidgets(container);
        });
    },

    injectWidgets: function(container) {
        Promise.all([
            Habits.renderDashboardWidget(),
            Review.renderDashboardWidget()
        ]).then(function(results) {
            var habitsHtml = results[0];
            var reviewHtml = results[1];

            // Find insertion point — after first section (Active Projects)
            var insertTarget = container.querySelector('.section:nth-child(2)');
            if (!insertTarget) insertTarget = container.firstElementChild;

            if (habitsHtml) {
                var habitsDiv = document.createElement('div');
                habitsDiv.innerHTML = habitsHtml;
                if (insertTarget && insertTarget.nextSibling) {
                    container.insertBefore(habitsDiv.firstElementChild, insertTarget);
                } else {
                    container.appendChild(habitsDiv.firstElementChild);
                }
            }

            if (reviewHtml) {
                var reviewDiv = document.createElement('div');
                reviewDiv.innerHTML = reviewHtml;
                // Append review widgets at the end, before total projects
                var totalSection = container.querySelector('.section:last-child');
                while (reviewDiv.firstElementChild) {
                    if (totalSection) {
                        container.insertBefore(reviewDiv.firstElementChild, totalSection);
                    } else {
                        container.appendChild(reviewDiv.firstElementChild);
                    }
                }
            }

            // Bind widget-specific actions
            Dashboard.bindWidgetActions(container);
        });
    },

    bindWidgetActions: function(container) {
        // Habit check-in toggles from dashboard
        container.querySelectorAll('[data-action="dash-toggle-checkin"]').forEach(function(btn) {
            btn.addEventListener('click', function(e) {
                e.stopPropagation();
                RetraqDB.toggleHabitCheckin(btn.dataset.id).then(function() {
                    Dashboard.render();
                });
            });
        });

        // Resurface open from dashboard
        container.querySelectorAll('[data-action="dash-resurface-open"]').forEach(function(btn) {
            btn.addEventListener('click', function() {
                RetraqDB.getNote(btn.dataset.id).then(function(note) {
                    if (note) {
                        Notes.showEditor({ note: note, onSave: function() { Dashboard.render(); } });
                    }
                });
            });
        });
    },

    bindActions: function(container) {
        container.querySelectorAll('[data-action="new-project"]').forEach(function(btn) {
            btn.addEventListener('click', function() {
                Projects.showCreateModal();
            });
        });

        container.querySelectorAll('[data-action="open-project"]').forEach(function(card) {
            card.addEventListener('click', function(e) {
                if (e.target.closest('[data-action="toggle-task"], [data-action="delete-task"]')) return;
                window.location.hash = '#/project/' + card.dataset.id;
            });
        });
    }
};

window.Dashboard = Dashboard;
