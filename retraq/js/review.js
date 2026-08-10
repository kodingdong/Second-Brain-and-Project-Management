const Review = {
    RESURFACE_INTERVAL_DAYS: 14,
    WEEKLY_REVIEW_STEPS: [
        { id: 'inbox', label: 'Process Inbox', description: 'Clear all captures in Inbox.', route: '#/inbox', icon: '📥' },
        { id: 'projects', label: 'Review Active Projects', description: 'Check progress on every active project. Pause or archive stale ones.', route: '#/projects', icon: '📋' },
        { id: 'stale', label: 'Handle Stale Projects', description: 'Decide: continue, pause, or archive projects with no recent activity.', route: '#/', icon: '⚠️' },
        { id: 'habits', label: 'Review Habits', description: 'Check your streak stats. Adjust or remove habits that no longer serve you.', route: '#/habits', icon: '🔄' },
        { id: 'notes', label: 'Review This Week\'s Notes', description: 'Re-read notes from the past 7 days. Add tags, link to projects.', route: '#/search', icon: '📝' },
        { id: 'resurface', label: 'Resurface Queue', description: 'Review notes flagged for spaced resurfacing.', route: '#/review', icon: '🧠' },
        { id: 'plan', label: 'Plan Next Week', description: 'Set priorities: which project gets focus? Any new habits?', route: '#/', icon: '🎯' }
    ],

    render: function() {
        var container = document.getElementById('view-review');
        if (!container) return;

        Promise.all([
            Review.getResurfaceQueue(),
            Review.getWeeklyReviewState(),
            Review.getOnThisDay(),
            Review.getRandomNote()
        ]).then(function(results) {
            var queue = results[0];
            var reviewState = results[1];
            var onThisDay = results[2];
            var randomNote = results[3];

            container.innerHTML =
                // Weekly Review section
                '<div class="section">' +
                    '<div class="section-header">' +
                        '<div>' +
                            '<h2 class="section-title">Weekly Review</h2>' +
                            '<p class="muted">~15 minute guided ritual</p>' +
                        '</div>' +
                        '<button type="button" class="btn btn-primary btn-sm" data-action="start-review">' +
                            (reviewState.inProgress ? 'Continue Review' : 'Start Review') +
                        '</button>' +
                    '</div>' +
                    (reviewState.inProgress ? Review.renderReviewProgress(reviewState) : '') +
                    (reviewState.lastCompleted ?
                        '<div class="card"><p class="muted">Last review: ' + Utils.formatDate(reviewState.lastCompleted) + '</p></div>' :
                        '<div class="card"><p class="muted">No review completed yet. Start your first one!</p></div>'
                    ) +
                '</div>' +

                // Resurface Queue section
                '<div class="section">' +
                    '<div class="section-header">' +
                        '<h2 class="section-title">Resurface Queue</h2>' +
                        '<span class="badge badge-active">' + queue.length + ' notes</span>' +
                    '</div>' +
                    (queue.length ?
                        queue.slice(0, 10).map(function(note) {
                            return Review.renderResurfaceCard(note);
                        }).join('') :
                        '<div class="card"><p class="muted">No notes due for resurfacing. Notes will appear here after ' + Review.RESURFACE_INTERVAL_DAYS + ' days.</p></div>'
                    ) +
                '</div>' +

                // Memory Lane
                (onThisDay.length ?
                    '<div class="section">' +
                        '<h2 class="section-title" style="margin-bottom:0.75rem">📅 On This Day</h2>' +
                        onThisDay.map(function(item) {
                            return Review.renderMemoryCard(item);
                        }).join('') +
                    '</div>' : '') +

                // Random Note (Serendipity)
                (randomNote ?
                    '<div class="section">' +
                        '<div class="section-header">' +
                            '<h2 class="section-title">🎲 Random Rediscovery</h2>' +
                            '<button type="button" class="btn btn-sm" data-action="refresh-random">Shuffle</button>' +
                        '</div>' +
                        Review.renderResurfaceCard(randomNote) +
                    '</div>' : '');

            Review.bindActions(container);
        });
    },

    renderResurfaceCard: function(note) {
        var preview = (note.content || '').trim();
        if (preview.length > 150) preview = preview.slice(0, 150) + '…';
        var daysAgo = Utils.daysSince(note.updated_at);

        return (
            '<article class="card resurface-card">' +
                '<div class="card-header">' +
                    '<div style="flex:1;min-width:0">' +
                        '<div class="project-title" style="font-size:0.95rem">' + Utils.escapeHtml(note.title) + '</div>' +
                        '<p class="note-preview" style="margin-top:0.35rem">' + Utils.escapeHtml(preview) + '</p>' +
                    '</div>' +
                '</div>' +
                '<div class="resurface-actions">' +
                    '<span class="muted">' + daysAgo + ' days ago · ' + Utils.noteTypeLabel(note.type) + '</span>' +
                    '<div style="display:flex;gap:0.5rem">' +
                        '<button type="button" class="btn btn-sm" data-action="resurface-snooze" data-id="' + note.id + '" title="Snooze 7 days">💤 Snooze</button>' +
                        '<button type="button" class="btn btn-sm btn-primary" data-action="resurface-open" data-id="' + note.id + '">Open</button>' +
                        '<button type="button" class="btn btn-sm" data-action="resurface-done" data-id="' + note.id + '" title="Mark as reviewed">✓ Done</button>' +
                    '</div>' +
                '</div>' +
            '</article>'
        );
    },

    renderMemoryCard: function(item) {
        var daysAgoText = '';
        if (item.yearsAgo === 0) {
            daysAgoText = 'Earlier today';
        } else if (item.yearsAgo === 1) {
            daysAgoText = '1 year ago';
        } else {
            daysAgoText = item.yearsAgo + ' years ago';
        }
        var preview = (item.note.content || '').trim();
        if (preview.length > 120) preview = preview.slice(0, 120) + '…';

        return (
            '<article class="card memory-card">' +
                '<div class="memory-badge">' + daysAgoText + '</div>' +
                '<div class="project-title" style="font-size:0.9rem">' + Utils.escapeHtml(item.note.title) + '</div>' +
                '<p class="note-preview">' + Utils.escapeHtml(preview) + '</p>' +
                '<div style="margin-top:0.5rem">' +
                    '<button type="button" class="btn btn-sm" data-action="resurface-open" data-id="' + item.note.id + '">Open</button>' +
                '</div>' +
            '</article>'
        );
    },

    renderReviewProgress: function(state) {
        var steps = Review.WEEKLY_REVIEW_STEPS;
        var completedSet = state.completedSteps || {};
        var doneCount = 0;
        steps.forEach(function(s) { if (completedSet[s.id]) doneCount++; });

        return (
            '<div class="review-progress-card card">' +
                Components.renderProgress(doneCount, steps.length) +
                '<div class="review-steps">' +
                    steps.map(function(step) {
                        var done = completedSet[step.id] || false;
                        return (
                            '<div class="review-step' + (done ? ' review-step-done' : '') + '">' +
                                '<button type="button" class="review-step-check" data-action="toggle-review-step" data-step="' + step.id + '">' +
                                    (done ? '✓' : step.icon) +
                                '</button>' +
                                '<div class="review-step-info">' +
                                    '<div class="review-step-label">' + step.label + '</div>' +
                                    '<p class="muted">' + step.description + '</p>' +
                                '</div>' +
                                '<a href="' + step.route + '" class="btn btn-sm">Go →</a>' +
                            '</div>'
                        );
                    }).join('') +
                '</div>' +
                (doneCount === steps.length ?
                    '<div style="text-align:center;margin-top:1rem">' +
                        '<button type="button" class="btn btn-primary" data-action="complete-review">🎉 Complete Review</button>' +
                    '</div>' : '') +
            '</div>'
        );
    },

    bindActions: function(container) {
        container.querySelectorAll('[data-action="start-review"]').forEach(function(btn) {
            btn.addEventListener('click', function() {
                Review.startWeeklyReview().then(function() {
                    Review.render();
                });
            });
        });

        container.querySelectorAll('[data-action="toggle-review-step"]').forEach(function(btn) {
            btn.addEventListener('click', function() {
                Review.toggleReviewStep(btn.dataset.step).then(function() {
                    Review.render();
                });
            });
        });

        container.querySelectorAll('[data-action="complete-review"]').forEach(function(btn) {
            btn.addEventListener('click', function() {
                Review.completeWeeklyReview().then(function() {
                    Components.toast('Weekly review completed! 🎉');
                    Review.render();
                });
            });
        });

        container.querySelectorAll('[data-action="resurface-open"]').forEach(function(btn) {
            btn.addEventListener('click', function() {
                window.location.hash = '#/note/' + btn.dataset.id;
            });
        });

        container.querySelectorAll('[data-action="resurface-snooze"]').forEach(function(btn) {
            btn.addEventListener('click', function() {
                RetraqDB.updateNote(btn.dataset.id, {
                    last_resurfaced_at: Utils.now(),
                    resurface_snooze_until: Review.dateFromNow(7)
                }).then(function() {
                    Components.toast('Snoozed for 7 days');
                    Review.render();
                });
            });
        });

        container.querySelectorAll('[data-action="resurface-done"]').forEach(function(btn) {
            btn.addEventListener('click', function() {
                RetraqDB.updateNote(btn.dataset.id, {
                    last_resurfaced_at: Utils.now()
                }).then(function() {
                    Components.toast('Marked as reviewed');
                    Review.render();
                });
            });
        });

        container.querySelectorAll('[data-action="refresh-random"]').forEach(function(btn) {
            btn.addEventListener('click', function() {
                Review.render();
            });
        });
    },

    // --- Data Methods ---

    getResurfaceQueue: function() {
        return RetraqDB.getAllNotes().then(function(notes) {
            var today = Utils.today();
            return notes.filter(function(note) {
                if (note.status === 'inbox' || note.status === 'archived') return false;
                if (note.type === 'daily') return false;

                // Skip if snoozed
                if (note.resurface_snooze_until && note.resurface_snooze_until > today) return false;

                var lastSeen = note.last_resurfaced_at || note.updated_at;
                var daysSince = Utils.daysSince(lastSeen);
                return daysSince >= Review.RESURFACE_INTERVAL_DAYS;
            }).sort(function(a, b) {
                var aDate = a.last_resurfaced_at || a.updated_at;
                var bDate = b.last_resurfaced_at || b.updated_at;
                return new Date(aDate) - new Date(bDate);
            });
        });
    },

    getOnThisDay: function() {
        var today = new Date();
        var todayMD = String(today.getMonth() + 1).padStart(2, '0') + '-' + String(today.getDate()).padStart(2, '0');

        return RetraqDB.getAllNotes().then(function(notes) {
            var matches = [];
            notes.forEach(function(note) {
                if (note.status === 'inbox' || note.status === 'archived') return;
                var created = new Date(note.created_at);
                var noteMD = String(created.getMonth() + 1).padStart(2, '0') + '-' + String(created.getDate()).padStart(2, '0');
                if (noteMD === todayMD && created.getFullYear() !== today.getFullYear()) {
                    matches.push({
                        note: note,
                        yearsAgo: today.getFullYear() - created.getFullYear()
                    });
                }
            });
            return matches.sort(function(a, b) { return a.yearsAgo - b.yearsAgo; });
        });
    },

    getRandomNote: function() {
        return RetraqDB.getAllNotes().then(function(notes) {
            var eligible = notes.filter(function(n) {
                return n.status !== 'inbox' && n.status !== 'archived' && n.type !== 'daily';
            });
            if (!eligible.length) return null;
            return eligible[Math.floor(Math.random() * eligible.length)];
        });
    },

    // --- Weekly Review State ---
    REVIEW_STATE_KEY: 'retraq_weekly_review',

    getWeeklyReviewState: function() {
        try {
            var raw = localStorage.getItem(Review.REVIEW_STATE_KEY);
            if (!raw) return Promise.resolve({ inProgress: false, completedSteps: {}, lastCompleted: null });
            return Promise.resolve(JSON.parse(raw));
        } catch (e) {
            return Promise.resolve({ inProgress: false, completedSteps: {}, lastCompleted: null });
        }
    },

    saveWeeklyReviewState: function(state) {
        localStorage.setItem(Review.REVIEW_STATE_KEY, JSON.stringify(state));
        return Promise.resolve(state);
    },

    startWeeklyReview: function() {
        return Review.getWeeklyReviewState().then(function(state) {
            if (state.inProgress) return Promise.resolve(state);
            state.inProgress = true;
            state.completedSteps = {};
            state.startedAt = Utils.now();
            return Review.saveWeeklyReviewState(state);
        });
    },

    toggleReviewStep: function(stepId) {
        return Review.getWeeklyReviewState().then(function(state) {
            if (!state.completedSteps) state.completedSteps = {};
            state.completedSteps[stepId] = !state.completedSteps[stepId];
            return Review.saveWeeklyReviewState(state);
        });
    },

    completeWeeklyReview: function() {
        return Review.getWeeklyReviewState().then(function(state) {
            state.inProgress = false;
            state.completedSteps = {};
            state.lastCompleted = Utils.today();
            state.startedAt = null;
            return Review.saveWeeklyReviewState(state);
        });
    },

    dateFromNow: function(days) {
        var d = new Date();
        d.setDate(d.getDate() + days);
        return d.toISOString().slice(0, 10);
    },

    // Dashboard widget — random resurface card
    renderDashboardWidget: function() {
        return Promise.all([
            Review.getResurfaceQueue(),
            Review.getRandomNote()
        ]).then(function(results) {
            var queue = results[0];
            var randomNote = results[1];

            var html = '';

            // Resurface queue summary
            if (queue.length > 0) {
                var topNote = queue[0];
                var preview = (topNote.content || '').trim();
                if (preview.length > 100) preview = preview.slice(0, 100) + '…';

                html +=
                    '<div class="section">' +
                        '<div class="section-header">' +
                            '<h2 class="section-title">🧠 Resurface</h2>' +
                            '<a href="#/review" class="btn btn-sm">' + queue.length + ' to review →</a>' +
                        '</div>' +
                        '<article class="card resurface-card">' +
                            '<div class="project-title" style="font-size:0.9rem">' + Utils.escapeHtml(topNote.title) + '</div>' +
                            '<p class="note-preview">' + Utils.escapeHtml(preview) + '</p>' +
                            '<div class="resurface-actions">' +
                                '<span class="muted">' + Utils.daysSince(topNote.updated_at) + ' days ago</span>' +
                                '<button type="button" class="btn btn-sm btn-primary" data-action="dash-resurface-open" data-id="' + topNote.id + '">Open</button>' +
                            '</div>' +
                        '</article>' +
                    '</div>';
            }

            // Random rediscovery (only if different from resurface)
            if (randomNote && (!queue.length || randomNote.id !== queue[0].id)) {
                var rPreview = (randomNote.content || '').trim();
                if (rPreview.length > 100) rPreview = rPreview.slice(0, 100) + '…';

                html +=
                    '<div class="section">' +
                        '<div class="section-header">' +
                            '<h2 class="section-title">🎲 Rediscovery</h2>' +
                        '</div>' +
                        '<article class="card">' +
                            '<div class="project-title" style="font-size:0.9rem">' + Utils.escapeHtml(randomNote.title) + '</div>' +
                            '<p class="note-preview">' + Utils.escapeHtml(rPreview) + '</p>' +
                            '<span class="muted">' + Utils.noteTypeLabel(randomNote.type) + ' · ' + Utils.daysSince(randomNote.updated_at) + ' days ago</span>' +
                        '</article>' +
                    '</div>';
            }

            return html;
        });
    }
};

window.Review = Review;
