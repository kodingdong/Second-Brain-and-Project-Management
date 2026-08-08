const Tasks = {
    renderTaskItem: function(task, options) {
        options = options || {};
        var showProject = options.showProject;
        var projectTitle = options.projectTitle || '';
        var isOverdue = !task.is_done && task.due_date && task.due_date < Utils.today();
        var dueLabel = task.due_date
            ? (isOverdue ? 'Overdue · ' : 'Due ') + Utils.formatDate(task.due_date)
            : '';

        return (
            '<div class="task-item' + (task.is_done ? ' done' : '') + (isOverdue ? ' overdue' : '') + '" data-task-id="' + task.id + '">' +
                '<input type="checkbox" class="task-checkbox" ' + (task.is_done ? 'checked' : '') +
                    ' aria-label="Toggle task" data-action="toggle-task" data-id="' + task.id + '">' +
                '<div class="task-body">' +
                    '<div class="task-title">' + Utils.escapeHtml(task.title) + '</div>' +
                    '<div class="task-meta">' +
                        Components.renderBadge(task.priority, task.priority) +
                        (dueLabel ? '<span class="muted' + (isOverdue ? ' overdue-text' : '') + '">' + Utils.escapeHtml(dueLabel) + '</span>' : '') +
                        (showProject && projectTitle ? '<span class="muted">' + Utils.escapeHtml(projectTitle) + '</span>' : '') +
                    '</div>' +
                '</div>' +
                '<button type="button" class="btn-icon" data-action="delete-task" data-id="' + task.id + '" aria-label="Delete task">×</button>' +
            '</div>'
        );
    },

    bindTaskActions: function(container, onChange) {
        if (!container) return;

        container.addEventListener('click', function(e) {
            var toggle = e.target.closest('[data-action="toggle-task"]');
            if (toggle) {
                RetraqDB.toggleTaskDone(toggle.dataset.id).then(function() {
                    if (onChange) onChange();
                }).catch(function(err) {
                    Components.toast(err.message || 'Gagal update task', 'error');
                });
                return;
            }

            var del = e.target.closest('[data-action="delete-task"]');
            if (del) {
                if (!confirm('Hapus task ini?')) return;
                RetraqDB.deleteTask(del.dataset.id).then(function() {
                    Components.toast('Task dihapus');
                    if (onChange) onChange();
                }).catch(function(err) {
                    Components.toast(err.message || 'Gagal hapus task', 'error');
                });
            }
        });
    }
};

window.Tasks = Tasks;
