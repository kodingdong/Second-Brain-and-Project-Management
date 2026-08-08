const Capture = {
    init: function() {
        if (document.getElementById('fab-capture')) return;

        var fab = document.createElement('button');
        fab.id = 'fab-capture';
        fab.className = 'fab';
        fab.type = 'button';
        fab.title = 'Quick capture (C)';
        fab.setAttribute('aria-label', 'Quick capture');
        fab.textContent = '+';
        fab.addEventListener('click', function() {
            Capture.showQuickCapture();
        });
        document.body.appendChild(fab);
    },

    showQuickCapture: function() {
        Components.modal({
            title: 'Quick Capture → Inbox',
            body:
                '<form id="capture-form">' +
                    '<div class="form-group">' +
                        '<label for="capture-content">Capture anything — process later</label>' +
                        '<textarea id="capture-content" rows="5" placeholder="Idea, thought, link, TIL…" autofocus></textarea>' +
                    '</div>' +
                '</form>',
            footer:
                '<button type="button" class="btn" data-modal-close>Cancel</button>' +
                '<button type="button" class="btn btn-primary" id="btn-save-capture">Save to Inbox</button>',
            onMount: function(modal, close) {
                var textarea = modal.querySelector('#capture-content');
                textarea.focus();

                modal.querySelector('#btn-save-capture').addEventListener('click', function() {
                    var content = textarea.value.trim();
                    if (!content) {
                        Components.toast('Write something first', 'error');
                        return;
                    }
                    RetraqDB.createInboxCapture(content).then(function() {
                        Components.toast('Saved to Inbox');
                        close();
                        App.updateInboxBadge();
                        if (App.currentRoute && App.currentRoute.name === 'inbox') {
                            Inbox.render();
                        }
                    });
                });

                textarea.addEventListener('keydown', function(e) {
                    if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
                        modal.querySelector('#btn-save-capture').click();
                    }
                });
            }
        });
    }
};

window.Capture = Capture;
