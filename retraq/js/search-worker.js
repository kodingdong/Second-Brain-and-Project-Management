importScripts('db.js');

var cache = null;

function loadData() {
    return Promise.all([
        self.RetraqDB.getAllProjects(),
        self.RetraqDB.getAllTasks(),
        self.RetraqDB.getAllNotes(),
        self.RetraqDB.getAllReferences()
    ]).then(function(results) {
        cache = {
            projects: results[0] || [],
            tasks: results[1] || [],
            notes: results[2] || [],
            refs: results[3] || []
        };
        return cache;
    });
}

// Load data immediately when worker starts
loadData();

self.onmessage = function(e) {
    var data = e.data;
    if (data.type === 'refresh') {
        loadData().then(function() {
            self.postMessage({ type: 'ready' });
        });
        return;
    }

    if (data.type === 'search') {
        var query = data.query;
        var q = (query || '').trim().toLowerCase();

        var performSearch = function() {
            var projects = cache.projects;
            var tasks = cache.tasks;
            var notes = cache.notes;
            var refs = cache.refs;

            var matchedProjects = projects.filter(function(p) {
                if (p.status === 'archived') return false;
                return (p.title + ' ' + (p.description || '')).toLowerCase().indexOf(q) !== -1;
            });

            var matchedTasks = tasks.filter(function(t) {
                if (t.status === 'done' || t.status === 'archived') return false;
                return t.title.toLowerCase().indexOf(q) !== -1;
            });

            var matchedNotes = notes.filter(function(n) {
                if (n.status === 'archived') return false;
                var contentStr = (n.title + ' ' + (n.content || '') + ' ' + (n.tags || '')).toLowerCase();
                return contentStr.indexOf(q) !== -1;
            });

            var matchedRefs = refs.filter(function(r) {
                var refStr = (r.title + ' ' + r.url + ' ' + (r.notes || '') + ' ' + (r.tags || '')).toLowerCase();
                return refStr.indexOf(q) !== -1;
            });

            self.postMessage({
                type: 'results',
                query: query,
                results: {
                    projects: matchedProjects,
                    tasks: matchedTasks,
                    notes: matchedNotes,
                    refs: matchedRefs
                }
            });
        };

        if (!cache) {
            loadData().then(performSearch);
        } else {
            performSearch();
        }
    }
};
