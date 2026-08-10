const Utils = {
    generateId: function() {
        if (typeof crypto !== 'undefined' && crypto.randomUUID) {
            return crypto.randomUUID();
        }
        return 'id-' + Date.now().toString(36) + '-' + Math.random().toString(36).slice(2, 9);
    },

    now: function() {
        return new Date().toISOString();
    },

    today: function() {
        return new Date().toISOString().slice(0, 10);
    },

    formatDate: function(isoDate) {
        if (!isoDate) return '';
        try {
            return new Date(isoDate + (isoDate.length === 10 ? 'T00:00:00' : '')).toLocaleDateString('id-ID', {
                day: 'numeric',
                month: 'short',
                year: 'numeric'
            });
        } catch (e) {
            return isoDate;
        }
    },

    daysSince: function(isoDate) {
        if (!isoDate) return Infinity;
        var then = new Date(isoDate).getTime();
        var now = Date.now();
        return Math.floor((now - then) / (1000 * 60 * 60 * 24));
    },

    escapeHtml: function(str) {
        if (str == null) return '';
        return String(str)
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&#39;');
    },

    statusLabel: function(status) {
        var labels = {
            idea: 'Idea',
            planning: 'Planning',
            active: 'Active',
            paused: 'Paused',
            done: 'Done',
            archived: 'Archived'
        };
        return labels[status] || status;
    },

    NOTE_TYPES: ['idea', 'note', 'til', 'snippet'],
    NOTE_TYPE_LABELS: { idea: 'Idea', note: 'Note', til: 'TIL', snippet: 'Snippet', daily: 'Daily' },

    noteTypeLabel: function(type) {
        return Utils.NOTE_TYPE_LABELS[type] || type;
    },

    titleFromContent: function(content, fallback) {
        var line = (content || '').trim().split('\n')[0].trim();
        if (!line) return fallback || 'Untitled';
        return line.length > 80 ? line.slice(0, 80) + '…' : line;
    },

    parseTags: function(input) {
        if (!input) return [];
        return input.split(',').map(function(t) { return t.trim().toLowerCase(); }).filter(Boolean);
    },

    PROJECT_STATUSES: ['idea', 'planning', 'active', 'paused', 'done', 'archived'],
    TASK_PRIORITIES: ['low', 'medium', 'high'],

    PROJECT_TEMPLATES: [
        {
            id: 'side-project',
            label: 'Side Project',
            icon: '🚀',
            milestones: ['Research', 'MVP', 'Launch', 'Iterate']
        },
        {
            id: 'learning',
            label: 'Learning',
            icon: '📚',
            milestones: ['Goal', 'Study', 'Practice', 'Review']
        },
        {
            id: 'personal-goal',
            label: 'Personal Goal',
            icon: '🎯',
            milestones: ['Plan', 'Execute', 'Measure', 'Done']
        },
        {
            id: 'blank',
            label: 'Blank',
            icon: '◻️',
            milestones: []
        }
    ],

    getEmptyStateSvg: function(type) {
        var svg = '';
        if (type === 'inbox') {
            svg = '<svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" class="empty-svg"><path d="M4 7h16M4 7v11a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7M4 7l8-4 8 4M12 11v6M9 14h6"/></svg>';
        } else if (type === 'projects') {
            svg = '<svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" class="empty-svg"><path d="M3 3v18h18M7 16l4-4 4 4 4-4"/></svg>';
        } else if (type === 'search') {
            svg = '<svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" class="empty-svg"><circle cx="11" cy="11" r="8"/><path d="M21 21l-4.35-4.35"/></svg>';
        } else if (type === 'notes') {
            svg = '<svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" class="empty-svg"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><polyline points="14 2 14 8 20 8"></polyline><line x1="16" y1="13" x2="8" y2="13"></line><line x1="16" y1="17" x2="8" y2="17"></line><polyline points="10 9 9 9 8 9"></polyline></svg>';
        } else {
            // default
            svg = '<svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" class="empty-svg"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"/><line x1="9" y1="9" x2="15" y2="15"/><line x1="15" y1="9" x2="9" y2="15"/></svg>';
        }
        return svg;
    },

    requestNotificationPermission: function() {
        if (!('Notification' in window)) return;
        if (Notification.permission !== 'granted' && Notification.permission !== 'denied') {
            Notification.requestPermission();
        }
    },

    checkHabitReminders: function() {
        if (!('Notification' in window) || Notification.permission !== 'granted') return;

        // Check if we already notified today
        var lastNotified = localStorage.getItem('retraq_last_notified');
        if (lastNotified === Utils.today()) return;

        RetraqDB.getAllHabits().then(function(habits) {
            if (!habits.length) return;
            
            RetraqDB.getTodayHabitStatus().then(function(status) {
                var pendingCount = 0;
                habits.forEach(function(h) {
                    if (!status[h.id]) pendingCount++;
                });

                if (pendingCount > 0) {
                    new Notification("Retraq Habits", {
                        body: "You have " + pendingCount + " habit(s) left to complete today. Keep the streak alive!",
                        icon: "assets/icons/icon.svg"
                    });
                    localStorage.setItem('retraq_last_notified', Utils.today());
                }
            });
        });
    }
};

window.Utils = Utils;
