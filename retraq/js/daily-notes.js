const DailyNotes = {
    render: function(date) {
        var container = document.getElementById('view-daily');
        if (!container) return;

        date = date || Utils.today();

        Promise.all([
            RetraqDB.getOrCreateDailyNote(date),
            RetraqDB.getDailyNoteDates()
        ]).then(function(results) {
            var note = results[0];
            var dates = results[1];
            if (dates.indexOf(date) === -1) dates.unshift(date);

            var dateList = dates.slice(0, 14).map(function(d) {
                var isActive = d === date;
                var label = d === Utils.today() ? 'Today' : Utils.formatDate(d);
                return '<a href="#/daily/' + d + '" class="daily-date-link' + (isActive ? ' active' : '') + '">' +
                    Utils.escapeHtml(label) + '</a>';
            }).join('');

            container.innerHTML =
                '<div class="daily-layout">' +
                    '<aside class="daily-sidebar card">' +
                        '<h3 class="section-title" style="margin-bottom:0.75rem">Recent</h3>' +
                        '<div class="daily-date-list">' + dateList + '</div>' +
                    '</aside>' +
                    '<div class="daily-editor card">' +
                        '<div class="section-header">' +
                            '<div>' +
                                '<h2 class="section-title">' + Utils.escapeHtml(Utils.formatDate(date)) + '</h2>' +
                                '<p class="muted">Daily note · auto-saved locally</p>' +
                            '</div>' +
                        '</div>' +
                        '<textarea id="daily-content" class="daily-textarea" placeholder="What are you thinking about today?">' +
                            Utils.escapeHtml(note.content) +
                        '</textarea>' +
                        '<p class="muted" style="margin-top:0.5rem;font-size:0.75rem">Tip: use this as a daily anchor for ideas & reflections.</p>' +
                    '</div>' +
                '</div>';

            var textarea = container.querySelector('#daily-content');
            var saveTimer = null;

            textarea.addEventListener('input', function() {
                clearTimeout(saveTimer);
                saveTimer = setTimeout(function() {
                    RetraqDB.updateNote(note.id, { content: textarea.value });
                }, 400);
            });
        });
    }
};

window.DailyNotes = DailyNotes;
