const Inbox = {
    render: function() {
        var container = document.getElementById('view-inbox');
        if (!container) return;

        RetraqDB.getInboxNotes().then(function(notes) {
            container.innerHTML =
                '<div class="section-header">' +
                    '<div>' +
                        '<h2 class="section-title">Inbox</h2>' +
                        '<p class="muted">Capture first, process later · ' + notes.length + ' unprocessed</p>' +
                    '</div>' +
                    '<button type="button" class="btn btn-primary btn-sm" data-action="quick-capture">+ Capture</button>' +
                '</div>' +
                (notes.length ?
                    notes.map(function(note) {
                        return Inbox.renderInboxItem(note);
                    }).join('') :
                    '<div class="empty-state card">' +
                        Utils.getEmptyStateSvg('inbox') +
                        '<p>Inbox kosong. Tap <strong>+</strong> di bottom bar untuk quick capture.</p>' +
                        '<button type="button" class="btn btn-primary" data-action="quick-capture">Quick Capture</button>' +
                    '</div>'
                );

            container.querySelectorAll('[data-action="quick-capture"]').forEach(function(btn) {
                btn.addEventListener('click', function() { Capture.showQuickCapture(); });
            });

            container.querySelectorAll('[data-action="process"]').forEach(function(btn) {
                btn.addEventListener('click', function() {
                    window.location.hash = '#/note/' + btn.dataset.id;
                });
            });

            container.querySelectorAll('[data-action="delete-inbox"]').forEach(function(btn) {
                btn.addEventListener('click', function() {
                    if (!confirm('Delete this capture?')) return;
                    RetraqDB.deleteNote(btn.dataset.id).then(function() {
                        Components.toast('Deleted');
                        App.updateInboxBadge();
                        Inbox.render();
                    });
                });
            });
        });
    },

    renderInboxItem: function(note) {
        var preview = (note.content || '').trim();
        return (
            '<article class="card inbox-item">' +
                '<p class="inbox-content">' + Utils.escapeHtml(preview) + '</p>' +
                '<div class="inbox-actions">' +
                    '<span class="muted">' + Utils.escapeHtml(Utils.formatDate(note.created_at.slice(0, 10))) + '</span>' +
                    '<div style="display:flex;gap:0.5rem">' +
                        '<button type="button" class="btn btn-sm btn-primary" data-action="process" data-id="' + note.id + '">Process</button>' +
                        '<button type="button" class="btn btn-sm btn-danger" data-action="delete-inbox" data-id="' + note.id + '">Delete</button>' +
                    '</div>' +
                '</div>' +
            '</article>'
        );
    }
};

window.Inbox = Inbox;
