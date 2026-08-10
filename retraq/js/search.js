const Search = {
    render: function(query) {
        var container = document.getElementById('view-search');
        if (!container) return;

        query = query || '';

        container.innerHTML =
            '<div class="search-bar card">' +
                '<input type="search" id="search-input" placeholder="Search projects, tasks, notes, references…" value="' + Utils.escapeHtml(query) + '">' +
            '</div>' +
            '<div id="search-results"></div>';

        var input = container.querySelector('#search-input');
        input.focus();

        if (Search.worker) {
            Search.worker.postMessage({ type: 'refresh' });
        }

        function runSearch() {
            var q = input.value.trim();
            window.location.hash = '#/search' + (q ? '?q=' + encodeURIComponent(q) : '');
            Search.renderResults(q);
        }

        input.addEventListener('input', function() {
            clearTimeout(Search._timer);
            Search._timer = setTimeout(runSearch, 250);
        });

        input.addEventListener('keydown', function(e) {
            if (e.key === 'Enter') runSearch();
        });

        if (query) Search.renderResults(query);
    },

    renderResults: function(query) {
        var resultsEl = document.getElementById('search-results');
        if (!resultsEl) return;

        if (!query.trim()) {
            resultsEl.innerHTML = '<div class="empty-state card">' + Utils.getEmptyStateSvg('search') + '<p>Type to search across your brain.</p></div>';
            return;
        }

        if (!Search.worker) {
            Search.worker = new Worker('js/search-worker.js');
            Search.worker.onmessage = function(e) {
                var data = e.data;
                if (data.type === 'results') {
                    if (data.query === Search.lastQuery) {
                        Search._renderHTML(data.results, data.query);
                    }
                }
            };
        }

        Search.lastQuery = query;
        Search.worker.postMessage({ type: 'search', query: query });
    },

    _renderHTML: function(results, query) {
        var resultsEl = document.getElementById('search-results');
        if (!resultsEl) return;

        var total = results.projects.length + results.tasks.length + results.notes.length + results.refs.length;

        if (!total) {
            resultsEl.innerHTML = '<div class="empty-state card">' + Utils.getEmptyStateSvg('search') + '<p>No results for "' + Utils.escapeHtml(query) + '"</p></div>';
            return;
        }

        var html = '<p class="muted" style="margin-bottom:1rem">' + total + ' results</p>';

        if (results.projects.length) {
            html += '<div class="section"><h3 class="section-title">Projects (' + results.projects.length + ')</h3>';
            html += results.projects.map(function(p) {
                return (
                    '<article class="card card-clickable" onclick="window.location.hash=\'#/project/' + p.id + '\'">' +
                        '<strong>' + Utils.escapeHtml(p.icon + ' ' + p.title) + '</strong>' +
                        (p.description ? '<p class="muted" style="margin-top:0.25rem">' + Utils.escapeHtml(p.description) + '</p>' : '') +
                    '</article>'
                );
            }).join('');
            html += '</div>';
        }

        if (results.tasks.length) {
            html += '<div class="section"><h3 class="section-title">Tasks (' + results.tasks.length + ')</h3>';
            html += '<div class="task-list">';
            html += results.tasks.map(function(task) {
                return (
                    '<div class="task-item" onclick="window.location.hash=\'#/project/' + task.project_id + '\'">' +
                        '<div class="task-body"><div class="task-title">' + Utils.escapeHtml(task.title) + '</div></div>' +
                    '</div>'
                );
            }).join('');
            html += '</div></div>';
        }

        if (results.notes.length) {
            html += '<div class="section"><h3 class="section-title">Notes (' + results.notes.length + ')</h3>';
            html += results.notes.map(function(note) {
                if (note.type === 'daily' && note.daily_date) {
                    return (
                        '<article class="card card-clickable" onclick="window.location.hash=\'#/daily/' + note.daily_date + '\'">' +
                            '<strong>' + Utils.escapeHtml(note.title) + '</strong>' +
                            '<p class="note-preview">' + Utils.escapeHtml((note.content || '').slice(0, 120)) + '</p>' +
                        '</article>'
                    );
                }
                return Notes.renderNoteCard(note);
            }).join('');
            html += '</div>';
        }

        if (results.refs.length) {
            html += '<div class="section"><h3 class="section-title">References (' + results.refs.length + ')</h3>';
            html += results.refs.map(function(ref) {
                return (
                    '<article class="card card-clickable" onclick="window.location.hash=\'#/library\'">' +
                        '<strong>🔗 ' + Utils.escapeHtml(ref.title) + '</strong>' +
                        '<p class="muted" style="margin-top:0.25rem">' + Utils.escapeHtml(ref.url) + '</p>' +
                    '</article>'
                );
            }).join('');
            html += '</div>';
        }

        resultsEl.innerHTML = html;

        Notes.bindNoteCards(resultsEl, function(noteId) {
            window.location.hash = '#/note/' + noteId;
        });
    }
};

window.Search = Search;
