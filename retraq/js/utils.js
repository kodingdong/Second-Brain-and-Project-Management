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
    ]
};

window.Utils = Utils;
