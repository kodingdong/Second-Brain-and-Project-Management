const Habits = {
    FREQ_OPTIONS: [
        { value: 'daily', label: 'Daily' },
        { value: 'weekly', label: 'Weekly' }
    ],

    ICONS: ['🏃', '📖', '💪', '🧘', '💻', '✍️', '🎯', '💤', '🥗', '💧', '🎵', '🧠', '📝', '🚶', '🎨', '🌅'],

    render: function() {
        var container = document.getElementById('view-habits');
        if (!container) return;

        Promise.all([
            RetraqDB.getAllHabits(),
            RetraqDB.getTodayHabitStatus()
        ]).then(function(results) {
            var habits = results[0];
            var todayStatus = results[1];

            container.innerHTML =
                '<div class="section-header">' +
                    '<div>' +
                        '<h2 class="section-title">Habits</h2>' +
                        '<p class="muted">Build consistency, track streaks</p>' +
                    '</div>' +
                    '<div style="display:flex; gap:0.5rem">' +
                        (('Notification' in window && Notification.permission === 'default') ? '<button type="button" class="btn btn-sm" id="btn-enable-reminders">🔔 Enable Reminders</button>' : '') +
                        '<button type="button" class="btn btn-primary btn-sm" data-action="new-habit">+ New Habit</button>' +
                    '</div>' +
                '</div>' +
                (habits.length ?
                    '<div class="section">' +
                        '<h3 class="section-title" style="margin-bottom:0.75rem">Today\'s Check-in</h3>' +
                        '<div class="habit-checkin-list">' +
                            habits.map(function(habit) {
                                var isChecked = todayStatus[habit.id] || false;
                                return Habits.renderCheckinItem(habit, isChecked);
                            }).join('') +
                        '</div>' +
                    '</div>' +
                    '<div class="section">' +
                        '<h3 class="section-title" style="margin-bottom:0.75rem">All Habits</h3>' +
                        habits.map(function(habit) {
                            return Habits.renderHabitCard(habit);
                        }).join('') +
                    '</div>' :
                    '<div class="empty-state card">' +
                        Utils.getEmptyStateSvg() +
                        '<p>Belum ada habit yang dilacak. Konsistensi adalah kunci.</p>' +
                        '<button type="button" class="btn btn-primary" data-action="new-habit" style="margin-top:0.75rem">+ New Habit</button>' +
                    '</div>'
                );

            var reminderBtn = container.querySelector('#btn-enable-reminders');
            if (reminderBtn) {
                reminderBtn.addEventListener('click', function() {
                    Notification.requestPermission().then(function(perm) {
                        if (perm === 'granted') {
                            Utils.checkHabitReminders();
                            Habits.render();
                        }
                    });
                });
            }

            Habits.bindActions(container);
        });
    },

    renderCheckinItem: function(habit, isChecked) {
        return (
            '<div class="habit-checkin-item' + (isChecked ? ' checked' : '') + '">' +
                '<button type="button" class="habit-check-btn' + (isChecked ? ' active' : '') + '" data-action="toggle-checkin" data-id="' + habit.id + '" aria-label="Check in">' +
                    (isChecked ? '✓' : '') +
                '</button>' +
                '<div class="habit-checkin-info">' +
                    '<span class="habit-checkin-icon">' + Utils.escapeHtml(habit.icon) + '</span>' +
                    '<span class="habit-checkin-name">' + Utils.escapeHtml(habit.name) + '</span>' +
                '</div>' +
                '<span class="badge badge-' + (habit.frequency === 'daily' ? 'active' : 'planning') + '">' + habit.frequency + '</span>' +
            '</div>'
        );
    },

    renderHabitCard: function(habit) {
        return (
            '<article class="card card-clickable" data-action="open-habit" data-id="' + habit.id + '">' +
                '<div class="card-header">' +
                    '<div style="display:flex;gap:0.75rem;align-items:center">' +
                        '<span class="project-icon">' + Utils.escapeHtml(habit.icon) + '</span>' +
                        '<div>' +
                            '<div class="project-title">' + Utils.escapeHtml(habit.name) + '</div>' +
                            '<p class="muted" style="margin-top:0.15rem">' + Utils.escapeHtml(habit.frequency) + ' · target ' + habit.target_streak + ' day streak</p>' +
                        '</div>' +
                    '</div>' +
                '</div>' +
            '</article>'
        );
    },

    bindActions: function(container) {
        container.querySelectorAll('[data-action="new-habit"]').forEach(function(btn) {
            btn.addEventListener('click', function() {
                Habits.showEditor({});
            });
        });

        container.querySelectorAll('[data-action="toggle-checkin"]').forEach(function(btn) {
            btn.addEventListener('click', function(e) {
                e.stopPropagation();
                var habitId = btn.dataset.id;
                RetraqDB.toggleHabitCheckin(habitId).then(function() {
                    Habits.render();
                });
            });
        });

        container.querySelectorAll('[data-action="open-habit"]').forEach(function(card) {
            card.addEventListener('click', function() {
                Habits.showDetail(card.dataset.id);
            });
        });
    },

    showEditor: function(options) {
        var habit = options.habit || null;
        var isEdit = !!habit;

        Components.modal({
            title: isEdit ? 'Edit Habit' : 'New Habit',
            body:
                '<div class="form-group">' +
                    '<label for="habit-name">Name</label>' +
                    '<input type="text" id="habit-name" placeholder="e.g. Morning Exercise" value="' + Utils.escapeHtml(habit ? habit.name : '') + '">' +
                '</div>' +
                '<div class="form-group">' +
                    '<label>Icon</label>' +
                    '<div class="area-icon-picker" id="habit-icon-picker">' +
                        Habits.ICONS.map(function(icon) {
                            var selected = (habit && habit.icon === icon) || (!habit && icon === '🎯');
                            return '<button type="button" class="area-icon-btn' + (selected ? ' area-icon-selected' : '') + '" data-icon="' + icon + '">' + icon + '</button>';
                        }).join('') +
                    '</div>' +
                '</div>' +
                '<div class="grid-2">' +
                    '<div class="form-group">' +
                        '<label for="habit-freq">Frequency</label>' +
                        '<select id="habit-freq">' +
                            Habits.FREQ_OPTIONS.map(function(f) {
                                var sel = (habit && habit.frequency === f.value) ? ' selected' : '';
                                return '<option value="' + f.value + '"' + sel + '>' + f.label + '</option>';
                            }).join('') +
                        '</select>' +
                    '</div>' +
                    '<div class="form-group">' +
                        '<label for="habit-target">Target Streak</label>' +
                        '<input type="number" id="habit-target" min="1" max="365" value="' + (habit ? habit.target_streak : 21) + '">' +
                    '</div>' +
                '</div>' +
                '<div class="form-group">' +
                    '<label for="habit-project">Link to Project (optional)</label>' +
                    '<select id="habit-project"><option value="">— None —</option></select>' +
                '</div>',
            footer:
                (isEdit ? '<button type="button" class="btn btn-danger" data-action="delete-habit">Delete</button>' : '') +
                '<button type="button" class="btn" data-modal-close>Cancel</button>' +
                '<button type="button" class="btn btn-primary" data-action="save-habit">Save</button>',
            onMount: function(modal, close) {
                var selectedIcon = habit ? habit.icon : '🎯';

                // Icon picker
                modal.querySelectorAll('[data-icon]').forEach(function(btn) {
                    btn.addEventListener('click', function() {
                        modal.querySelectorAll('[data-icon]').forEach(function(b) { b.classList.remove('area-icon-selected'); });
                        btn.classList.add('area-icon-selected');
                        selectedIcon = btn.dataset.icon;
                    });
                });

                // Load projects for dropdown
                RetraqDB.getAllProjects().then(function(projects) {
                    var sel = modal.querySelector('#habit-project');
                    projects.forEach(function(p) {
                        var opt = document.createElement('option');
                        opt.value = p.id;
                        opt.textContent = p.icon + ' ' + p.title;
                        if (habit && habit.project_id === p.id) opt.selected = true;
                        sel.appendChild(opt);
                    });
                });

                // Save
                modal.querySelector('[data-action="save-habit"]').addEventListener('click', function() {
                    var name = modal.querySelector('#habit-name').value.trim();
                    if (!name) { Components.toast('Name is required', 'error'); return; }

                    var data = {
                        name: name,
                        icon: selectedIcon,
                        frequency: modal.querySelector('#habit-freq').value,
                        target_streak: parseInt(modal.querySelector('#habit-target').value, 10) || 21,
                        project_id: modal.querySelector('#habit-project').value || null
                    };

                    var promise = isEdit
                        ? RetraqDB.updateHabit(habit.id, data)
                        : RetraqDB.createHabit(data);

                    promise.then(function() {
                        Components.toast(isEdit ? 'Habit updated' : 'Habit created');
                        close();
                        Habits.render();
                        if (typeof options.onSave === 'function') options.onSave();
                    });
                });

                // Delete
                if (isEdit) {
                    modal.querySelector('[data-action="delete-habit"]').addEventListener('click', function() {
                        if (!confirm('Delete this habit and all its logs?')) return;
                        RetraqDB.deleteHabit(habit.id).then(function() {
                            Components.toast('Habit deleted');
                            close();
                            Habits.render();
                        });
                    });
                }
            }
        });
    },

    showDetail: function(habitId) {
        Promise.all([
            RetraqDB.getHabit(habitId),
            RetraqDB.getHabitLogs(habitId),
            RetraqDB.getHabitStreak(habitId)
        ]).then(function(results) {
            var habit = results[0];
            var logs = results[1];
            var streakData = results[2];

            if (!habit) { Components.toast('Habit not found', 'error'); return; }

            var heatmapHtml = Habits.renderHeatmap(logs);
            var rate = Habits.calcCompletionRate(logs, habit);

            Components.modal({
                title: habit.icon + ' ' + habit.name,
                body:
                    '<div class="habit-stats-grid">' +
                        '<div class="habit-stat-card">' +
                            '<div class="habit-stat-value">' + streakData.current + '</div>' +
                            '<div class="habit-stat-label">Current Streak</div>' +
                        '</div>' +
                        '<div class="habit-stat-card">' +
                            '<div class="habit-stat-value">' + streakData.longest + '</div>' +
                            '<div class="habit-stat-label">Longest Streak</div>' +
                        '</div>' +
                        '<div class="habit-stat-card">' +
                            '<div class="habit-stat-value">' + rate + '%</div>' +
                            '<div class="habit-stat-label">Completion Rate</div>' +
                        '</div>' +
                        '<div class="habit-stat-card">' +
                            '<div class="habit-stat-value">' + logs.length + '</div>' +
                            '<div class="habit-stat-label">Total Check-ins</div>' +
                        '</div>' +
                    '</div>' +
                    Components.renderProgress(streakData.current, habit.target_streak) +
                    '<p class="muted" style="margin-top:0.5rem;text-align:center">Target: ' + habit.target_streak + ' day streak · ' + habit.frequency + '</p>' +
                    '<div class="section" style="margin-top:1.5rem">' +
                        '<h3 class="section-title" style="margin-bottom:0.75rem">Activity Heatmap (90 days)</h3>' +
                        heatmapHtml +
                    '</div>',
                footer:
                    '<button type="button" class="btn" data-action="edit-habit">Edit</button>' +
                    '<button type="button" class="btn btn-primary" data-modal-close>Close</button>',
                onMount: function(modal, close) {
                    modal.querySelector('[data-action="edit-habit"]').addEventListener('click', function() {
                        close();
                        Habits.showEditor({ habit: habit });
                    });
                }
            });
        });
    },

    renderHeatmap: function(logs) {
        var logDates = {};
        logs.forEach(function(log) {
            logDates[log.date] = true;
        });

        var today = new Date();
        var cells = [];
        var months = {};

        for (var i = 89; i >= 0; i--) {
            var d = new Date(today);
            d.setDate(d.getDate() - i);
            var dateStr = d.toISOString().slice(0, 10);
            var dayOfWeek = d.getDay();
            var monthKey = d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0');
            var monthLabel = d.toLocaleDateString('en', { month: 'short' });

            if (!months[monthKey]) {
                months[monthKey] = { label: monthLabel, col: 90 - i };
            }

            var hasLog = logDates[dateStr] || false;
            var isToday = i === 0;

            cells.push(
                '<div class="heatmap-cell' +
                    (hasLog ? ' heatmap-active' : '') +
                    (isToday ? ' heatmap-today' : '') +
                '" title="' + dateStr + (hasLog ? ' ✓' : '') +
                '" style="grid-row:' + (dayOfWeek + 1) + '"></div>'
            );
        }

        // Month labels
        var monthLabels = '';
        var prevLabel = '';
        Object.keys(months).forEach(function(key) {
            var m = months[key];
            if (m.label !== prevLabel) {
                monthLabels += '<span class="heatmap-month-label">' + m.label + '</span>';
                prevLabel = m.label;
            }
        });

        return (
            '<div class="heatmap-months">' + monthLabels + '</div>' +
            '<div class="heatmap-grid">' +
                cells.join('') +
            '</div>' +
            '<div class="heatmap-legend">' +
                '<span class="muted">Less</span>' +
                '<div class="heatmap-cell"></div>' +
                '<div class="heatmap-cell heatmap-active"></div>' +
                '<span class="muted">More</span>' +
            '</div>'
        );
    },

    calcCompletionRate: function(logs, habit) {
        if (!habit || !habit.created_at) return 0;

        var created = new Date(habit.created_at);
        var today = new Date();
        var diffDays = Math.floor((today - created) / (1000 * 60 * 60 * 24)) + 1;

        var expectedDays = habit.frequency === 'weekly'
            ? Math.ceil(diffDays / 7)
            : diffDays;

        if (expectedDays <= 0) return 0;
        return Math.min(100, Math.round((logs.length / expectedDays) * 100));
    },

    // Dashboard widget — render a compact version
    renderDashboardWidget: function() {
        return Promise.all([
            RetraqDB.getAllHabits(),
            RetraqDB.getTodayHabitStatus()
        ]).then(function(results) {
            var habits = results[0];
            var todayStatus = results[1];

            if (!habits.length) return '';

            var checkedCount = 0;
            habits.forEach(function(h) {
                if (todayStatus[h.id]) checkedCount++;
            });

            var items = habits.slice(0, 5).map(function(habit) {
                var isChecked = todayStatus[habit.id] || false;
                return (
                    '<div class="habit-checkin-item compact' + (isChecked ? ' checked' : '') + '">' +
                        '<button type="button" class="habit-check-btn' + (isChecked ? ' active' : '') + '" data-action="dash-toggle-checkin" data-id="' + habit.id + '">' +
                            (isChecked ? '✓' : '') +
                        '</button>' +
                        '<span class="habit-checkin-icon">' + Utils.escapeHtml(habit.icon) + '</span>' +
                        '<span class="habit-checkin-name">' + Utils.escapeHtml(habit.name) + '</span>' +
                    '</div>'
                );
            }).join('');

            return (
                '<div class="section">' +
                    '<div class="section-header">' +
                        '<h2 class="section-title">Today\'s Habits</h2>' +
                        '<a href="#/habits" class="btn btn-sm">' + checkedCount + '/' + habits.length + ' done →</a>' +
                    '</div>' +
                    '<div class="habit-checkin-list">' + items + '</div>' +
                '</div>'
            );
        });
    }
};

window.Habits = Habits;
