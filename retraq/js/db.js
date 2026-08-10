const DB_NAME = 'RetraqDB';
const DB_VERSION = 4;

const STORE_NAMES = ['projects', 'milestones', 'tasks', 'activity_log', 'notes', 'tags', 'note_tags', 'project_notes', 'references', 'areas', 'habits', 'habit_logs'];

var dbPromise = null;

function openDB() {
    if (dbPromise) return dbPromise;

    dbPromise = new Promise(function(resolve, reject) {
        var request = indexedDB.open(DB_NAME, DB_VERSION);

        request.onupgradeneeded = function(event) {
            var db = event.target.result;

            if (!db.objectStoreNames.contains('projects')) {
                var projects = db.createObjectStore('projects', { keyPath: 'id' });
                projects.createIndex('status', 'status', { unique: false });
                projects.createIndex('last_activity_at', 'last_activity_at', { unique: false });
            }

            if (!db.objectStoreNames.contains('milestones')) {
                var milestones = db.createObjectStore('milestones', { keyPath: 'id' });
                milestones.createIndex('project_id', 'project_id', { unique: false });
            }

            if (!db.objectStoreNames.contains('tasks')) {
                var tasks = db.createObjectStore('tasks', { keyPath: 'id' });
                tasks.createIndex('project_id', 'project_id', { unique: false });
                tasks.createIndex('milestone_id', 'milestone_id', { unique: false });
                tasks.createIndex('is_done', 'is_done', { unique: false });
            }

            if (!db.objectStoreNames.contains('activity_log')) {
                var logs = db.createObjectStore('activity_log', { keyPath: 'id' });
                logs.createIndex('project_id', 'project_id', { unique: false });
                logs.createIndex('created_at', 'created_at', { unique: false });
            }

            if (!db.objectStoreNames.contains('notes')) {
                var notes = db.createObjectStore('notes', { keyPath: 'id' });
                notes.createIndex('status', 'status', { unique: false });
                notes.createIndex('type', 'type', { unique: false });
                notes.createIndex('daily_date', 'daily_date', { unique: false });
                notes.createIndex('updated_at', 'updated_at', { unique: false });
            }

            if (!db.objectStoreNames.contains('tags')) {
                var tags = db.createObjectStore('tags', { keyPath: 'id' });
                tags.createIndex('name', 'name', { unique: true });
            }

            if (!db.objectStoreNames.contains('note_tags')) {
                var noteTags = db.createObjectStore('note_tags', { keyPath: 'id' });
                noteTags.createIndex('note_id', 'note_id', { unique: false });
                noteTags.createIndex('tag_id', 'tag_id', { unique: false });
            }

            if (!db.objectStoreNames.contains('project_notes')) {
                var projectNotes = db.createObjectStore('project_notes', { keyPath: 'id' });
                projectNotes.createIndex('project_id', 'project_id', { unique: false });
                projectNotes.createIndex('note_id', 'note_id', { unique: false });
            }

            // v3: Reference Library
            if (!db.objectStoreNames.contains('references')) {
                var refs = db.createObjectStore('references', { keyPath: 'id' });
                refs.createIndex('project_id', 'project_id', { unique: false });
                refs.createIndex('created_at', 'created_at', { unique: false });
            }

            // v3: PARA-lite Areas
            if (!db.objectStoreNames.contains('areas')) {
                var areas = db.createObjectStore('areas', { keyPath: 'id' });
                areas.createIndex('name', 'name', { unique: false });
            }

            // v4: Habits
            if (!db.objectStoreNames.contains('habits')) {
                var habits = db.createObjectStore('habits', { keyPath: 'id' });
                habits.createIndex('project_id', 'project_id', { unique: false });
            }

            if (!db.objectStoreNames.contains('habit_logs')) {
                var habitLogs = db.createObjectStore('habit_logs', { keyPath: 'id' });
                habitLogs.createIndex('habit_id', 'habit_id', { unique: false });
                habitLogs.createIndex('date', 'date', { unique: false });
            }
        };

        request.onsuccess = function() { resolve(request.result); };
        request.onerror = function() { reject(request.error); };
    });

    return dbPromise;
}

function tx(storeNames, mode) {
    return openDB().then(function(db) {
        return db.transaction(storeNames, mode || 'readonly');
    });
}

function getAll(storeName) {
    return tx([storeName]).then(function(transaction) {
        return new Promise(function(resolve, reject) {
            var store = transaction.objectStore(storeName);
            var request = store.getAll();
            request.onsuccess = function() { resolve(request.result || []); };
            request.onerror = function() { reject(request.error); };
        });
    });
}

function getById(storeName, id) {
    return tx([storeName]).then(function(transaction) {
        return new Promise(function(resolve, reject) {
            var request = transaction.objectStore(storeName).get(id);
            request.onsuccess = function() { resolve(request.result || null); };
            request.onerror = function() { reject(request.error); };
        });
    });
}

function put(storeName, item) {
    return tx([storeName], 'readwrite').then(function(transaction) {
        return new Promise(function(resolve, reject) {
            var request = transaction.objectStore(storeName).put(item);
            request.onsuccess = function() { resolve(item); };
            request.onerror = function() { reject(request.error); };
        });
    });
}

function remove(storeName, id) {
    return tx([storeName], 'readwrite').then(function(transaction) {
        return new Promise(function(resolve, reject) {
            var request = transaction.objectStore(storeName).delete(id);
            request.onsuccess = function() { resolve(true); };
            request.onerror = function() { reject(request.error); };
        });
    });
}

function getByIndex(storeName, indexName, value) {
    return tx([storeName]).then(function(transaction) {
        return new Promise(function(resolve, reject) {
            var store = transaction.objectStore(storeName);
            var index = store.index(indexName);
            var request = index.getAll(value);
            request.onsuccess = function() { resolve(request.result || []); };
            request.onerror = function() { reject(request.error); };
        });
    });
}

function clearStore(storeName) {
    return tx([storeName], 'readwrite').then(function(transaction) {
        return new Promise(function(resolve, reject) {
            var request = transaction.objectStore(storeName).clear();
            request.onsuccess = function() { resolve(true); };
            request.onerror = function() { reject(request.error); };
        });
    });
}

const RetraqDB = {
    init: function() {
        return openDB();
    },

    logActivity: function(projectId, entityType, entityId, action) {
        return put('activity_log', {
            id: Utils.generateId(),
            project_id: projectId,
            entity_type: entityType,
            entity_id: entityId,
            action: action,
            created_at: Utils.now()
        });
    },

    getActivityLog: function(projectId, limit) {
        return getByIndex('activity_log', 'project_id', projectId).then(function(logs) {
            logs.sort(function(a, b) {
                return new Date(b.created_at) - new Date(a.created_at);
            });
            return limit ? logs.slice(0, limit) : logs;
        });
    },

    touchProject: function(projectId) {
        return getById('projects', projectId).then(function(project) {
            if (!project) return null;
            project.last_activity_at = Utils.now();
            project.updated_at = Utils.now();
            return put('projects', project);
        });
    },

    getAllProjects: function() {
        return getAll('projects').then(function(projects) {
            return projects.sort(function(a, b) {
                return new Date(b.last_activity_at || b.updated_at) - new Date(a.last_activity_at || a.updated_at);
            });
        });
    },

    getProject: function(id) {
        return getById('projects', id);
    },

    createProject: function(data) {
        var now = Utils.now();
        var project = {
            id: Utils.generateId(),
            title: data.title.trim(),
            description: (data.description || '').trim(),
            status: data.status || 'planning',
            color: data.color || '#6366f1',
            icon: data.icon || '📁',
            target_date: data.target_date || null,
            created_at: now,
            updated_at: now,
            last_activity_at: now
        };

        return put('projects', project).then(function(saved) {
            return RetraqDB.logActivity(saved.id, 'project', saved.id, 'created').then(function() {
                return saved;
            });
        });
    },

    updateProject: function(id, updates) {
        return getById('projects', id).then(function(project) {
            if (!project) return null;
            Object.assign(project, updates, {
                updated_at: Utils.now(),
                last_activity_at: Utils.now()
            });
            return put('projects', project);
        });
    },

    deleteProject: function(id) {
        return Promise.all([
            getByIndex('tasks', 'project_id', id),
            getByIndex('milestones', 'project_id', id),
            getByIndex('activity_log', 'project_id', id),
            getByIndex('project_notes', 'project_id', id)
        ]).then(function(results) {
            var tasks = results[0];
            var milestones = results[1];
            var logs = results[2];
            var projectNotes = results[3];
            var deletions = [remove('projects', id)];
            tasks.forEach(function(task) { deletions.push(remove('tasks', task.id)); });
            milestones.forEach(function(ms) { deletions.push(remove('milestones', ms.id)); });
            logs.forEach(function(log) { deletions.push(remove('activity_log', log.id)); });
            projectNotes.forEach(function(link) { deletions.push(remove('project_notes', link.id)); });
            return Promise.all(deletions);
        });
    },

    createMilestonesForProject: function(projectId, titles) {
        if (!titles || !titles.length) return Promise.resolve([]);

        var promises = titles.map(function(title, index) {
            return put('milestones', {
                id: Utils.generateId(),
                project_id: projectId,
                title: title,
                due_date: null,
                is_completed: false,
                sort_order: index
            });
        });

        return Promise.all(promises);
    },

    getMilestonesByProject: function(projectId) {
        return getByIndex('milestones', 'project_id', projectId).then(function(items) {
            return items.sort(function(a, b) { return a.sort_order - b.sort_order; });
        });
    },

    createMilestone: function(data) {
        return RetraqDB.getMilestonesByProject(data.project_id).then(function(existing) {
            var milestone = {
                id: Utils.generateId(),
                project_id: data.project_id,
                title: data.title.trim(),
                due_date: data.due_date || null,
                is_completed: false,
                sort_order: existing.length
            };

            return put('milestones', milestone).then(function(saved) {
                return RetraqDB.touchProject(saved.project_id).then(function() {
                    return RetraqDB.logActivity(saved.project_id, 'milestone', saved.id, 'created').then(function() {
                        return saved;
                    });
                });
            });
        });
    },

    toggleMilestoneComplete: function(id) {
        return getById('milestones', id).then(function(milestone) {
            if (!milestone) return null;
            milestone.is_completed = !milestone.is_completed;
            return put('milestones', milestone).then(function(saved) {
                return RetraqDB.touchProject(saved.project_id).then(function() {
                    return RetraqDB.logActivity(
                        saved.project_id,
                        'milestone',
                        saved.id,
                        saved.is_completed ? 'completed' : 'reopened'
                    ).then(function() {
                        return saved;
                    });
                });
            });
        });
    },

    deleteMilestone: function(id) {
        return getById('milestones', id).then(function(milestone) {
            if (!milestone) return false;
            return remove('milestones', id).then(function() {
                return RetraqDB.touchProject(milestone.project_id);
            });
        });
    },

    getTasksByProject: function(projectId) {
        return getByIndex('tasks', 'project_id', projectId).then(function(items) {
            return items.sort(function(a, b) { return a.sort_order - b.sort_order; });
        });
    },

    getAllTasks: function() {
        return getAll('tasks');
    },

    createTask: function(data) {
        return getTasksByProject(data.project_id).then(function(existing) {
            var task = {
                id: Utils.generateId(),
                project_id: data.project_id,
                milestone_id: data.milestone_id || null,
                title: data.title.trim(),
                is_done: false,
                priority: data.priority || 'medium',
                due_date: data.due_date || null,
                sort_order: existing.length
            };

            return put('tasks', task).then(function(saved) {
                return RetraqDB.touchProject(saved.project_id).then(function() {
                    return RetraqDB.logActivity(saved.project_id, 'task', saved.id, 'created').then(function() {
                        return saved;
                    });
                });
            });
        });
    },

    updateTask: function(id, updates) {
        return getById('tasks', id).then(function(task) {
            if (!task) return null;
            Object.assign(task, updates);
            return put('tasks', task).then(function(saved) {
                return RetraqDB.touchProject(saved.project_id).then(function() {
                    return RetraqDB.logActivity(saved.project_id, 'task', saved.id, 'updated').then(function() {
                        return saved;
                    });
                });
            });
        });
    },

    toggleTaskDone: function(id) {
        return getById('tasks', id).then(function(task) {
            if (!task) return null;
            task.is_done = !task.is_done;
            return put('tasks', task).then(function(saved) {
                return RetraqDB.touchProject(saved.project_id).then(function() {
                    return RetraqDB.logActivity(
                        saved.project_id,
                        'task',
                        saved.id,
                        saved.is_done ? 'completed' : 'reopened'
                    ).then(function() {
                        return saved;
                    });
                });
            });
        });
    },

    deleteTask: function(id) {
        return getById('tasks', id).then(function(task) {
            if (!task) return false;
            return remove('tasks', id).then(function() {
                return RetraqDB.touchProject(task.project_id);
            });
        });
    },

    getProjectProgress: function(projectId) {
        return Promise.all([
            RetraqDB.getTasksByProject(projectId),
            RetraqDB.getMilestonesByProject(projectId)
        ]).then(function(results) {
            var tasks = results[0];
            var milestones = results[1];
            var tasksDone = tasks.filter(function(t) { return t.is_done; }).length;
            var msDone = milestones.filter(function(m) { return m.is_completed; }).length;
            var total = tasks.length + milestones.length;
            var done = tasksDone + msDone;
            return {
                done: done,
                total: total,
                tasksDone: tasksDone,
                tasksTotal: tasks.length,
                milestonesDone: msDone,
                milestonesTotal: milestones.length,
                percent: total ? Math.round((done / total) * 100) : 0
            };
        });
    },

    getActiveProjects: function() {
        return RetraqDB.getAllProjects().then(function(projects) {
            return projects.filter(function(p) {
                return p.status === 'active' || p.status === 'planning';
            }).slice(0, 5);
        });
    },

    getStaleProjects: function(days) {
        days = days || 7;
        return RetraqDB.getAllProjects().then(function(projects) {
            return projects.filter(function(p) {
                if (p.status === 'done' || p.status === 'archived') return false;
                return Utils.daysSince(p.last_activity_at) >= days;
            });
        });
    },

    getTasksDueSoon: function(withinDays) {
        withinDays = withinDays || 7;
        var today = Utils.today();

        return RetraqDB.getAllTasks().then(function(tasks) {
            return tasks.filter(function(task) {
                if (task.is_done || !task.due_date) return false;
                var due = new Date(task.due_date + 'T00:00:00');
                var now = new Date(today + 'T00:00:00');
                var diff = (due - now) / (1000 * 60 * 60 * 24);
                return diff >= 0 && diff <= withinDays;
            }).sort(function(a, b) {
                return a.due_date.localeCompare(b.due_date);
            });
        });
    },

    getOverdueTasks: function() {
        var today = Utils.today();

        return RetraqDB.getAllTasks().then(function(tasks) {
            return tasks.filter(function(task) {
                if (task.is_done || !task.due_date) return false;
                return task.due_date < today;
            }).sort(function(a, b) {
                return a.due_date.localeCompare(b.due_date);
            });
        });
    },

    // --- Knowledge: Notes ---

    createNote: function(data) {
        var now = Utils.now();
        var content = (data.content || '').trim();
        var note = {
            id: Utils.generateId(),
            title: (data.title || Utils.titleFromContent(content, 'Untitled')).trim(),
            content: content,
            type: data.type || 'note',
            status: data.status || 'active',
            daily_date: data.daily_date || null,
            created_at: now,
            updated_at: now
        };

        return put('notes', note).then(function(saved) {
            var chain = Promise.resolve(saved);
            if (data.tags && data.tags.length) {
                chain = chain.then(function(s) {
                    return RetraqDB.setNoteTags(s.id, data.tags).then(function() { return s; });
                });
            }
            if (data.project_id) {
                chain = chain.then(function(s) {
                    return RetraqDB.linkNoteToProject(s.id, data.project_id).then(function() { return s; });
                });
            }
            return chain;
        });
    },

    createInboxCapture: function(content) {
        return RetraqDB.createNote({
            content: content,
            type: 'idea',
            status: 'inbox'
        });
    },

    getNote: function(id) {
        return getById('notes', id);
    },

    getAllNotes: function() {
        return getAll('notes').then(function(notes) {
            return notes.sort(function(a, b) {
                return new Date(b.updated_at) - new Date(a.updated_at);
            });
        });
    },

    getInboxNotes: function() {
        return getByIndex('notes', 'status', 'inbox').then(function(notes) {
            return notes.sort(function(a, b) {
                return new Date(b.created_at) - new Date(a.created_at);
            });
        });
    },

    getInboxCount: function() {
        return RetraqDB.getInboxNotes().then(function(notes) { return notes.length; });
    },

    updateNote: function(id, updates) {
        return getById('notes', id).then(function(note) {
            if (!note) return null;
            Object.assign(note, updates, { updated_at: Utils.now() });
            if (updates.content !== undefined && !updates.title) {
                note.title = Utils.titleFromContent(note.content, note.title);
            }
            return put('notes', note);
        });
    },

    processInboxNote: function(id, data) {
        return RetraqDB.updateNote(id, {
            status: 'active',
            type: data.type || 'note',
            content: data.content,
            title: data.title
        }).then(function(note) {
            var chain = Promise.resolve(note);
            if (data.tags) chain = chain.then(function(n) {
                return RetraqDB.setNoteTags(n.id, data.tags).then(function() { return n; });
            });
            if (data.project_id) chain = chain.then(function(n) {
                return RetraqDB.linkNoteToProject(n.id, data.project_id).then(function() { return n; });
            });
            return chain;
        });
    },

    deleteNote: function(id) {
        return Promise.all([
            getByIndex('note_tags', 'note_id', id),
            getByIndex('project_notes', 'note_id', id)
        ]).then(function(results) {
            var deletions = [remove('notes', id)];
            results[0].forEach(function(link) { deletions.push(remove('note_tags', link.id)); });
            results[1].forEach(function(link) { deletions.push(remove('project_notes', link.id)); });
            return Promise.all(deletions);
        });
    },

    getOrCreateDailyNote: function(date) {
        date = date || Utils.today();
        return getByIndex('notes', 'daily_date', date).then(function(notes) {
            if (notes.length) return notes[0];
            
            var initialContent = '';
            if (typeof localStorage !== 'undefined') {
                initialContent = localStorage.getItem('retraq_tpl_daily') || '';
            }
            
            return RetraqDB.createNote({
                title: 'Daily · ' + Utils.formatDate(date),
                content: initialContent,
                type: 'daily',
                status: 'active',
                daily_date: date
            });
        });
    },

    getDailyNoteDates: function() {
        return RetraqDB.getAllNotes().then(function(notes) {
            return notes
                .filter(function(n) { return n.type === 'daily' && n.daily_date; })
                .map(function(n) { return n.daily_date; })
                .filter(function(date, index, arr) { return arr.indexOf(date) === index; })
                .sort(function(a, b) { return b.localeCompare(a); });
        });
    },

    getOrCreateTag: function(name) {
        name = name.trim().toLowerCase();
        if (!name) return Promise.resolve(null);

        return getByIndex('tags', 'name', name).then(function(existing) {
            if (existing.length) return existing[0];
            var tag = { id: Utils.generateId(), name: name };
            return put('tags', tag);
        });
    },

    getNoteTags: function(noteId) {
        return getByIndex('note_tags', 'note_id', noteId).then(function(links) {
            return Promise.all(links.map(function(link) {
                return getById('tags', link.tag_id);
            })).then(function(tags) {
                return tags.filter(Boolean).sort(function(a, b) {
                    return a.name.localeCompare(b.name);
                });
            });
        });
    },

    setNoteTags: function(noteId, tagNames) {
        return getByIndex('note_tags', 'note_id', noteId).then(function(existing) {
            var deletions = existing.map(function(link) { return remove('note_tags', link.id); });
            return Promise.all(deletions).then(function() {
                var unique = tagNames.filter(function(name, i, arr) {
                    return name && arr.indexOf(name) === i;
                });
                return Promise.all(unique.map(function(name) {
                    return RetraqDB.getOrCreateTag(name).then(function(tag) {
                        if (!tag) return null;
                        return put('note_tags', {
                            id: Utils.generateId(),
                            note_id: noteId,
                            tag_id: tag.id
                        });
                    });
                }));
            });
        });
    },

    linkNoteToProject: function(noteId, projectId) {
        return getByIndex('project_notes', 'note_id', noteId).then(function(links) {
            var exists = links.some(function(l) { return l.project_id === projectId; });
            if (exists) return Promise.resolve(true);
            return put('project_notes', {
                id: Utils.generateId(),
                project_id: projectId,
                note_id: noteId
            }).then(function() {
                return RetraqDB.touchProject(projectId);
            });
        });
    },

    unlinkNoteFromProject: function(noteId, projectId) {
        return getByIndex('project_notes', 'note_id', noteId).then(function(links) {
            var link = links.find(function(l) { return l.project_id === projectId; });
            if (!link) return Promise.resolve(false);
            return remove('project_notes', link.id);
        });
    },

    getNotesByProject: function(projectId) {
        return getByIndex('project_notes', 'project_id', projectId).then(function(links) {
            return Promise.all(links.map(function(link) {
                return getById('notes', link.note_id);
            })).then(function(notes) {
                return notes.filter(Boolean).sort(function(a, b) {
                    return new Date(b.updated_at) - new Date(a.updated_at);
                });
            });
        });
    },

    getProjectsForNote: function(noteId) {
        return getByIndex('project_notes', 'note_id', noteId).then(function(links) {
            return Promise.all(links.map(function(link) {
                return getById('projects', link.project_id);
            })).then(function(projects) {
                return projects.filter(Boolean);
            });
        });
    },

    searchAll: function(query) {
        var q = (query || '').trim().toLowerCase();
        if (!q) return Promise.resolve({ projects: [], tasks: [], notes: [] });

        return Promise.all([
            RetraqDB.getAllProjects(),
            RetraqDB.getAllTasks(),
            RetraqDB.getAllNotes()
        ]).then(function(results) {
            var projects = results[0].filter(function(p) {
                return (p.title + ' ' + (p.description || '')).toLowerCase().indexOf(q) !== -1;
            });
            var tasks = results[1].filter(function(t) {
                return t.title.toLowerCase().indexOf(q) !== -1;
            });
            var notes = results[2].filter(function(n) {
                return n.status !== 'archived' &&
                    ((n.title + ' ' + n.content).toLowerCase().indexOf(q) !== -1);
            });
            return { projects: projects, tasks: tasks, notes: notes };
        });
    },

    exportJSON: function() {
        return Promise.all(STORE_NAMES.map(getAll)).then(function(results) {
            var payload = {
                version: 2,
                exported_at: Utils.now(),
                data: {}
            };
            STORE_NAMES.forEach(function(name, index) {
                payload.data[name] = results[index];
            });
            return payload;
        });
    },

    importJSON: function(payload, replace) {
        if (!payload || !payload.data) {
            return Promise.reject(new Error('Invalid backup file'));
        }

        var importStores = STORE_NAMES.filter(function(name) {
            return Array.isArray(payload.data[name]);
        });

        var chain = Promise.resolve();

        if (replace) {
            chain = Promise.all(STORE_NAMES.map(clearStore));
        }

        return chain.then(function() {
            var writes = [];
            importStores.forEach(function(storeName) {
                payload.data[storeName].forEach(function(item) {
                    writes.push(put(storeName, item));
                });
            });
            return Promise.all(writes);
        });
    },

    // --- Reference Library ---

    createReference: function(data) {
        var now = Utils.now();
        var ref = {
            id: Utils.generateId(),
            title: (data.title || '').trim(),
            url: (data.url || '').trim(),
            notes: (data.notes || '').trim(),
            tags: data.tags || [],
            project_id: data.project_id || null,
            created_at: now,
            updated_at: now
        };
        return put('references', ref);
    },

    getReference: function(id) {
        return getById('references', id);
    },

    getAllReferences: function() {
        return getAll('references').then(function(refs) {
            return refs.sort(function(a, b) {
                return new Date(b.created_at) - new Date(a.created_at);
            });
        });
    },

    updateReference: function(id, updates) {
        return getById('references', id).then(function(ref) {
            if (!ref) return null;
            Object.assign(ref, updates, { updated_at: Utils.now() });
            return put('references', ref);
        });
    },

    deleteReference: function(id) {
        return remove('references', id);
    },

    // --- PARA-lite Areas ---

    createArea: function(data) {
        var now = Utils.now();
        var area = {
            id: Utils.generateId(),
            name: (data.name || '').trim(),
            description: (data.description || '').trim(),
            icon: data.icon || '\ud83d\udcc2',
            created_at: now,
            updated_at: now
        };
        return put('areas', area);
    },

    getArea: function(id) {
        return getById('areas', id);
    },

    getAllAreas: function() {
        return getAll('areas').then(function(areas) {
            return areas.sort(function(a, b) {
                return a.name.localeCompare(b.name);
            });
        });
    },

    updateArea: function(id, updates) {
        return getById('areas', id).then(function(area) {
            if (!area) return null;
            Object.assign(area, updates, { updated_at: Utils.now() });
            return put('areas', area);
        });
    },

    deleteArea: function(id) {
        // Unlink projects and notes from this area
        return Promise.all([
            RetraqDB.getProjectsByArea(id),
            RetraqDB.getNotesByArea(id)
        ]).then(function(results) {
            var updates = [];
            results[0].forEach(function(p) {
                updates.push(RetraqDB.updateProject(p.id, { area_id: null }));
            });
            results[1].forEach(function(n) {
                updates.push(RetraqDB.updateNote(n.id, { area_id: null }));
            });
            return Promise.all(updates);
        }).then(function() {
            return remove('areas', id);
        });
    },

    getProjectsByArea: function(areaId) {
        return RetraqDB.getAllProjects().then(function(projects) {
            return projects.filter(function(p) { return p.area_id === areaId; });
        });
    },

    getNotesByArea: function(areaId) {
        return RetraqDB.getAllNotes().then(function(notes) {
            return notes.filter(function(n) { return n.area_id === areaId; });
        });
    },

    // --- Habits ---

    createHabit: function(data) {
        var now = Utils.now();
        var habit = {
            id: Utils.generateId(),
            name: (data.name || '').trim(),
            icon: data.icon || '🎯',
            frequency: data.frequency || 'daily',
            target_streak: data.target_streak || 21,
            project_id: data.project_id || null,
            created_at: now,
            updated_at: now
        };
        return put('habits', habit);
    },

    getHabit: function(id) {
        return getById('habits', id);
    },

    getAllHabits: function() {
        return getAll('habits').then(function(habits) {
            return habits.sort(function(a, b) {
                return new Date(a.created_at) - new Date(b.created_at);
            });
        });
    },

    updateHabit: function(id, updates) {
        return getById('habits', id).then(function(habit) {
            if (!habit) return null;
            Object.assign(habit, updates, { updated_at: Utils.now() });
            return put('habits', habit);
        });
    },

    deleteHabit: function(id) {
        return getByIndex('habit_logs', 'habit_id', id).then(function(logs) {
            var deletions = [remove('habits', id)];
            logs.forEach(function(log) { deletions.push(remove('habit_logs', log.id)); });
            return Promise.all(deletions);
        });
    },

    getHabitLogs: function(habitId) {
        return getByIndex('habit_logs', 'habit_id', habitId).then(function(logs) {
            return logs.sort(function(a, b) {
                return b.date.localeCompare(a.date);
            });
        });
    },

    toggleHabitCheckin: function(habitId) {
        var today = Utils.today();
        return getByIndex('habit_logs', 'habit_id', habitId).then(function(logs) {
            var existing = logs.find(function(l) { return l.date === today; });
            if (existing) {
                return remove('habit_logs', existing.id);
            } else {
                return put('habit_logs', {
                    id: Utils.generateId(),
                    habit_id: habitId,
                    date: today,
                    created_at: Utils.now()
                });
            }
        });
    },

    getTodayHabitStatus: function() {
        var today = Utils.today();
        return getAll('habit_logs').then(function(logs) {
            var status = {};
            logs.forEach(function(log) {
                if (log.date === today) {
                    status[log.habit_id] = true;
                }
            });
            return status;
        });
    },

    getHabitStreak: function(habitId) {
        return getByIndex('habit_logs', 'habit_id', habitId).then(function(logs) {
            if (!logs.length) return { current: 0, longest: 0 };

            var dates = logs.map(function(l) { return l.date; })
                .filter(function(d, i, arr) { return arr.indexOf(d) === i; })
                .sort();

            // Calculate current streak (from today backwards)
            var today = Utils.today();
            var current = 0;
            var checkDate = new Date(today + 'T00:00:00');

            // Check if today is logged, if not start from yesterday
            if (dates.indexOf(today) === -1) {
                checkDate.setDate(checkDate.getDate() - 1);
            }

            while (true) {
                var dateStr = checkDate.toISOString().slice(0, 10);
                if (dates.indexOf(dateStr) !== -1) {
                    current++;
                    checkDate.setDate(checkDate.getDate() - 1);
                } else {
                    break;
                }
            }

            // Calculate longest streak
            var longest = 0;
            var streak = 1;
            for (var i = 1; i < dates.length; i++) {
                var prev = new Date(dates[i - 1] + 'T00:00:00');
                var curr = new Date(dates[i] + 'T00:00:00');
                var diff = (curr - prev) / (1000 * 60 * 60 * 24);
                if (diff === 1) {
                    streak++;
                } else {
                    longest = Math.max(longest, streak);
                    streak = 1;
                }
            }
            longest = Math.max(longest, streak, current);

            return { current: current, longest: longest };
        });
    },

    clearAllData: function() {
        return Promise.all(STORE_NAMES.map(clearStore)).then(function() {
            localStorage.removeItem('retraq_seeded');
            localStorage.removeItem('retraq_weekly_review');
        });
    }
};

if (typeof window !== 'undefined') window.RetraqDB = RetraqDB;
if (typeof self !== 'undefined') self.RetraqDB = RetraqDB;
