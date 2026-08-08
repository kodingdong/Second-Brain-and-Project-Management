const Components = {
    toast: function(message, type) {
        type = type || 'info';
        var root = document.getElementById('toast-root');
        if (!root) return;

        var el = document.createElement('div');
        el.className = 'toast toast-' + type;
        el.textContent = message;
        root.appendChild(el);

        setTimeout(function() {
            el.remove();
        }, 3000);
    },

    modal: function(options) {
        var root = document.getElementById('modal-root');
        if (!root) return;

        var backdrop = document.createElement('div');
        backdrop.className = 'modal-backdrop';

        var modal = document.createElement('div');
        modal.className = 'modal';
        modal.innerHTML =
            '<h2 class="modal-title">' + Utils.escapeHtml(options.title) + '</h2>' +
            '<div class="modal-body">' + (options.body || '') + '</div>' +
            (options.footer ? '<div class="form-actions">' + options.footer + '</div>' : '');

        backdrop.appendChild(modal);
        root.innerHTML = '';
        root.appendChild(backdrop);

        function close() {
            root.innerHTML = '';
        }

        backdrop.addEventListener('click', function(e) {
            if (e.target === backdrop) close();
        });

        modal.querySelectorAll('[data-modal-close]').forEach(function(btn) {
            btn.addEventListener('click', close);
        });

        if (typeof options.onMount === 'function') {
            options.onMount(modal, close);
        }

        return { close: close, el: modal };
    },

    renderBadge: function(text, type) {
        return '<span class="badge badge-' + Utils.escapeHtml(type) + '">' + Utils.escapeHtml(text) + '</span>';
    },

    renderProgress: function(done, total) {
        var pct = total > 0 ? Math.round((done / total) * 100) : 0;
        return (
            '<div class="progress-wrap">' +
                '<div class="progress-label"><span>Progress</span><span>' + pct + '%</span></div>' +
                '<div class="progress-bar"><div class="progress-fill" style="width:' + pct + '%"></div></div>' +
            '</div>'
        );
    }
};

window.Components = Components;
