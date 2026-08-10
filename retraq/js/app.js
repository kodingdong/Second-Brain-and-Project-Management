const Settings = {
    render: function() {
        var container = document.getElementById('view-settings');
        if (!container) return;

        var srInterval = localStorage.getItem('retraq_sr_interval') || '7';

        container.innerHTML =
            '<div class="settings-grid">' +
                // Appearance
                '<div class="card settings-card">' +
                    '<h3>🎨 Appearance</h3>' +
                    '<div class="settings-actions">' +
                        '<div class="settings-action-row">' +
                            '<div>' +
                                '<div class="settings-action-label">Theme Mode</div>' +
                                '<div class="settings-action-desc">Switch between dark and light mode</div>' +
                            '</div>' +
                            '<select id="theme-select" class="sort-select">' +
                                '<option value="dark">Dark</option>' +
                                '<option value="light">Light</option>' +
                            '</select>' +
                        '</div>' +
                    '</div>' +
                '</div>' +
                // Data Backup
                '<div class="card settings-card">' +
                    '<h3>💾 Data Backup</h3>' +
                    '<p class="muted" style="margin-bottom:0.75rem;font-size:0.8rem">All data stored locally in IndexedDB. Export regularly for backup.</p>' +
                    '<div class="settings-actions">' +
                        '<div class="settings-action-row">' +
                            '<div>' +
                                '<div class="settings-action-label">Export JSON Backup</div>' +
                                '<div class="settings-action-desc">Full database backup as JSON file</div>' +
                            '</div>' +
                            '<button type="button" class="btn btn-primary btn-sm" id="btn-export">Export</button>' +
                        '</div>' +
                        '<div class="settings-action-row">' +
                            '<div>' +
                                '<div class="settings-action-label">Import JSON Backup</div>' +
                                '<div class="settings-action-desc">Restore from a previous backup file</div>' +
                            '</div>' +
                            '<label class="btn btn-sm" style="cursor:pointer">' +
                                'Import' +
                                '<input type="file" id="import-file" accept="application/json,.json" hidden>' +
                            '</label>' +
                        '</div>' +
                    '</div>' +
                '</div>' +
                // Export Markdown
                '<div class="card settings-card">' +
                    '<h3>📝 Export as Markdown</h3>' +
                    '<p class="muted" style="margin-bottom:0.75rem;font-size:0.8rem">Download all notes as .md files. Compatible with Obsidian vaults.</p>' +
                    '<div class="settings-actions">' +
                        '<div class="settings-action-row">' +
                            '<div>' +
                                '<div class="settings-action-label">Export All Notes</div>' +
                                '<div class="settings-action-desc">Each note becomes a separate .md file</div>' +
                            '</div>' +
                            '<button type="button" class="btn btn-sm" id="btn-export-md">Export .md</button>' +
                        '</div>' +
                        '</div>' +
                    '</div>' +
                '</div>' +
                // Templates
                '<div class="card settings-card">' +
                    '<h3>📝 Templates</h3>' +
                    '<p class="muted" style="margin-bottom:0.75rem;font-size:0.8rem">Define default content for new notes.</p>' +
                    '<div class="settings-actions">' +
                        '<div class="settings-action-row">' +
                            '<div>' +
                                '<div class="settings-action-label">Daily Note Template</div>' +
                                '<div class="settings-action-desc">Default layout for new daily notes</div>' +
                            '</div>' +
                            '<button type="button" class="btn btn-sm" id="btn-edit-tpl-daily">Edit</button>' +
                        '</div>' +
                        '<div class="settings-action-row">' +
                            '<div>' +
                                '<div class="settings-action-label">General Note Template</div>' +
                                '<div class="settings-action-desc">Default layout for standard notes</div>' +
                            '</div>' +
                            '<button type="button" class="btn btn-sm" id="btn-edit-tpl-note">Edit</button>' +
                        '</div>' +
                    '</div>' +
                '</div>' +
                // Spaced Repetition
                '<div class="card settings-card">' +
                    '<h3>🧠 Active Brain</h3>' +
                    '<div class="settings-actions">' +
                        '<div class="settings-action-row">' +
                            '<div>' +
                                '<div class="settings-action-label">Resurface Interval</div>' +
                                '<div class="settings-action-desc">Days before old notes appear in Review queue</div>' +
                            '</div>' +
                            '<select id="sr-interval" class="sort-select">' +
                                '<option value="3"' + (srInterval === '3' ? ' selected' : '') + '>3 days</option>' +
                                '<option value="5"' + (srInterval === '5' ? ' selected' : '') + '>5 days</option>' +
                                '<option value="7"' + (srInterval === '7' ? ' selected' : '') + '>7 days</option>' +
                                '<option value="14"' + (srInterval === '14' ? ' selected' : '') + '>14 days</option>' +
                                '<option value="30"' + (srInterval === '30' ? ' selected' : '') + '>30 days</option>' +
                            '</select>' +
                        '</div>' +
                    '</div>' +
                '</div>' +
                // Seed & Danger Zone
                '<div class="card settings-card">' +
                    '<h3>⚙️ Advanced</h3>' +
                    '<div class="settings-actions">' +
                        '<div class="settings-action-row">' +
                            '<div>' +
                                '<div class="settings-action-label">Save as Seed Data</div>' +
                                '<div class="settings-action-desc">For deployment — auto-loads on fresh installs</div>' +
                            '</div>' +
                            '<button type="button" class="btn btn-sm" id="btn-save-seed">💾 Save</button>' +
                        '</div>' +
                        '<div class="settings-action-row">' +
                            '<div>' +
                                '<div class="settings-action-label" style="color:var(--color-danger)">Clear All Data</div>' +
                                '<div class="settings-action-desc">Permanently delete everything</div>' +
                            '</div>' +
                            '<button type="button" class="btn btn-sm btn-danger" id="btn-clear-data">🗑️ Clear</button>' +
                        '</div>' +
                    '</div>' +
                '</div>' +
                // About
                '<div class="card settings-card">' +
                    '<h3>ℹ️ About Retraq</h3>' +
                    '<p style="font-size:0.85rem"><strong>Retraq</strong> — v2.0</p>' +
                    '<p class="muted" style="font-size:0.8rem;margin-top:0.35rem">Vanilla JS · IndexedDB · Offline-first PWA</p>' +
                    '<p class="muted" style="font-size:0.8rem;margin-top:0.2rem"><kbd>Ctrl+K</kbd> Search · <kbd>N</kbd> New Project · <kbd>C</kbd> Quick Capture</p>' +
                    '<p class="muted" style="font-size:0.75rem;margin-top:0.5rem">Obsidian × Notion — Second Brain & Project Management</p>' +
                '</div>' +
            '</div>';

        var themeSelect = container.querySelector('#theme-select');
        if (themeSelect) {
            themeSelect.value = localStorage.getItem('retraq_theme') || 'dark';
            themeSelect.addEventListener('change', function(e) {
                var theme = e.target.value;
                localStorage.setItem('retraq_theme', theme);
                if (theme === 'light') {
                    document.documentElement.setAttribute('data-theme', 'light');
                } else {
                    document.documentElement.removeAttribute('data-theme');
                }
            });
        }

        container.querySelector('#btn-export').addEventListener('click', function() {
            RetraqDB.exportJSON().then(function(payload) {
                var blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' });
                var url = URL.createObjectURL(blob);
                var a = document.createElement('a');
                a.href = url;
                a.download = 'retraq-backup-' + Utils.today() + '.json';
                a.click();
                URL.revokeObjectURL(url);
                Components.toast('Backup exported');
            }).catch(function(err) {
                Components.toast(err.message || 'Export failed', 'error');
            });
        });

        container.querySelector('#import-file').addEventListener('change', function(e) {
            var file = e.target.files[0];
            if (!file) return;

            var reader = new FileReader();
            reader.onload = function() {
                try {
                    var payload = JSON.parse(reader.result);
                    var replace = confirm('Replace all existing data with backup? Cancel = merge/overwrite items by id.');
                    RetraqDB.importJSON(payload, replace).then(function() {
                        Components.toast('Import successful');
                        App.navigate(window.location.hash);
                    }).catch(function(err) {
                        Components.toast(err.message || 'Import failed', 'error');
                    });
                } catch (err) {
                    Components.toast('Invalid JSON file', 'error');
                }
            };
            reader.readAsText(file);
            e.target.value = '';
        });

        container.querySelector('#btn-save-seed').addEventListener('click', function() {
            RetraqDB.exportJSON().then(function(payload) {
                var blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' });
                var url = URL.createObjectURL(blob);
                var a = document.createElement('a');
                a.href = url;
                a.download = 'seed.json';
                a.click();
                URL.revokeObjectURL(url);
                Components.toast('Seed downloaded! Simpan ke folder retraq/data/seed.json');
            });
        });

        container.querySelector('#btn-clear-data').addEventListener('click', function() {
            if (!confirm('Hapus SEMUA data? Aksi ini tidak bisa di-undo.')) return;
            if (!confirm('Yakin? Semua projects, notes, habits akan hilang.')) return;
            RetraqDB.clearAllData().then(function() {
                Components.toast('All data cleared');
                App.navigate('#/');
            });
        });

        // Export to Markdown
        var exportMdBtn = container.querySelector('#btn-export-md');
        if (exportMdBtn) {
            exportMdBtn.addEventListener('click', function() {
                RetraqDB.getAllNotes().then(function(notes) {
                    if (!notes.length) {
                        Components.toast('No notes to export', 'error');
                        return;
                    }

                    // Build a combined markdown file (since we can't create ZIP without a lib)
                    var combined = '# Retraq Notes Export\n';
                    combined += '> Exported on ' + new Date().toLocaleDateString() + '\n\n---\n\n';

                    notes.forEach(function(note) {
                        combined += '## ' + (note.title || 'Untitled') + '\n';
                        combined += '**Type:** ' + (note.type || 'note') + ' | ';
                        combined += '**Updated:** ' + (note.updated_at || '').slice(0, 10) + '\n\n';
                        combined += (note.content || '_Empty note_') + '\n\n';
                        combined += '---\n\n';
                    });

                    var blob = new Blob([combined], { type: 'text/markdown;charset=utf-8' });
                    var url = URL.createObjectURL(blob);
                    var a = document.createElement('a');
                    a.href = url;
                    a.download = 'retraq-notes-' + Utils.today() + '.md';
                    a.click();
                    URL.revokeObjectURL(url);
                    Components.toast(notes.length + ' notes exported as Markdown');
                });
            });
        }

        // Templates
        var editDailyBtn = container.querySelector('#btn-edit-tpl-daily');
        if (editDailyBtn) {
            editDailyBtn.addEventListener('click', function() {
                var currentTpl = localStorage.getItem('retraq_tpl_daily') || '';
                Components.modal({
                    title: 'Daily Note Template',
                    body: '<div class="form-group"><textarea id="tpl-daily-input" class="form-control" rows="8" placeholder="# Daily Note\n- [ ] Task 1...">' + Utils.escapeHtml(currentTpl) + '</textarea></div>' +
                          '<p class="muted" style="font-size:0.8rem">This markdown will be pre-filled when creating new daily notes.</p>',
                    footer: '<button type="button" class="btn" data-modal-close>Cancel</button><button type="button" class="btn btn-primary" id="btn-save-tpl-daily">Save</button>',
                    onMount: function(modal, close) {
                        modal.querySelector('#btn-save-tpl-daily').addEventListener('click', function() {
                            var val = modal.querySelector('#tpl-daily-input').value;
                            localStorage.setItem('retraq_tpl_daily', val);
                            Components.toast('Daily template saved');
                            close();
                        });
                    }
                });
            });
        }

        var editNoteBtn = container.querySelector('#btn-edit-tpl-note');
        if (editNoteBtn) {
            editNoteBtn.addEventListener('click', function() {
                var currentTpl = localStorage.getItem('retraq_tpl_note') || '';
                Components.modal({
                    title: 'General Note Template',
                    body: '<div class="form-group"><textarea id="tpl-note-input" class="form-control" rows="8" placeholder="# Title\n\nContext...">' + Utils.escapeHtml(currentTpl) + '</textarea></div>' +
                          '<p class="muted" style="font-size:0.8rem">This markdown will be pre-filled when creating standard notes.</p>',
                    footer: '<button type="button" class="btn" data-modal-close>Cancel</button><button type="button" class="btn btn-primary" id="btn-save-tpl-note">Save</button>',
                    onMount: function(modal, close) {
                        modal.querySelector('#btn-save-tpl-note').addEventListener('click', function() {
                            var val = modal.querySelector('#tpl-note-input').value;
                            localStorage.setItem('retraq_tpl_note', val);
                            Components.toast('Note template saved');
                            close();
                        });
                    }
                });
            });
        }

        // Spaced repetition interval
        var srSelect = container.querySelector('#sr-interval');
        if (srSelect) {
            srSelect.addEventListener('change', function() {
                localStorage.setItem('retraq_sr_interval', srSelect.value);
                Components.toast('Resurface interval set to ' + srSelect.value + ' days');
            });
        }
    }
};

window.Settings = Settings;

const App = {
    currentRoute: null,

    init: function() {
        var savedTheme = localStorage.getItem('retraq_theme');
        if (savedTheme === 'light') {
            document.documentElement.setAttribute('data-theme', 'light');
        }

        RetraqDB.init().then(function() {
            return App.loadSeedIfEmpty();
        }).then(function() {
            Capture.init();
            CommandPalette.initShortcuts();
            App.bindEvents();
            App.updateInboxBadge();
            Utils.checkHabitReminders();
            App.navigate(window.location.hash || '#/');
        }).catch(function(err) {
            console.error(err);
            Components.toast('Failed to open database', 'error');
        });
    },

    loadSeedIfEmpty: function() {
        return RetraqDB.getAllProjects().then(function(projects) {
            // Only seed if DB is completely empty (no projects exist)
            if (projects.length > 0) return Promise.resolve();

            // Check if already seeded this origin
            if (localStorage.getItem('retraq_seeded')) return Promise.resolve();

            return fetch('data/seed.json').then(function(response) {
                if (!response.ok) return;
                return response.json();
            }).then(function(payload) {
                if (!payload || !payload.data) return;

                // Check if seed has actual data
                var hasData = Object.keys(payload.data).some(function(key) {
                    return Array.isArray(payload.data[key]) && payload.data[key].length > 0;
                });
                if (!hasData) return;

                console.log('[Retraq] Loading seed data...');
                return RetraqDB.importJSON(payload, true).then(function() {
                    localStorage.setItem('retraq_seeded', Utils.now());
                    console.log('[Retraq] Seed data loaded successfully');
                });
            }).catch(function(err) {
                // Silently fail — seed file might not exist
                console.log('[Retraq] No seed data found, starting fresh');
            });
        });
    },

    updateInboxBadge: function() {
        RetraqDB.getInboxCount().then(function(count) {
            // Sidebar badge
            var badge = document.getElementById('inbox-badge');
            if (badge) {
                badge.hidden = count <= 0;
                badge.textContent = count > 0 ? count : '';
            }
            // Bottom nav badge
            var bottomBadge = document.getElementById('inbox-badge-bottom');
            if (bottomBadge) {
                bottomBadge.hidden = count <= 0;
                bottomBadge.textContent = count > 0 ? count : '';
            }
        });
    },

    bindEvents: function() {
        var sidebar = document.getElementById('sidebar');
        var backdrop = document.getElementById('sidebar-backdrop');

        window.addEventListener('hashchange', function() {
            App.navigate(window.location.hash);
        });

        // Sidebar nav links — close sidebar on mobile
        document.querySelectorAll('.nav-link').forEach(function(link) {
            link.addEventListener('click', function() {
                App.closeSidebar();
            });
        });

        // Menu toggle (hamburger)
        var menuToggle = document.getElementById('menu-toggle');
        if (menuToggle) {
            menuToggle.addEventListener('click', function() {
                App.toggleSidebar();
            });
        }

        // Sidebar backdrop — close on tap
        if (backdrop) {
            backdrop.addEventListener('click', function() {
                App.closeSidebar();
            });
        }

        // Header action button
        var headerAction = document.getElementById('header-action');
        if (headerAction) {
            headerAction.addEventListener('click', function() {
                App.handleHeaderAction();
            });
        }

        // Bottom nav: capture FAB
        var bottomCapture = document.getElementById('bottom-capture');
        if (bottomCapture) {
            bottomCapture.addEventListener('click', function() {
                Capture.showQuickCapture();
            });
        }

        // Bottom nav: More button → open sidebar
        var bottomMore = document.getElementById('bottom-more');
        if (bottomMore) {
            bottomMore.addEventListener('click', function() {
                App.toggleSidebar();
            });
        }

        // Keyboard shortcuts
        document.addEventListener('keydown', function(e) {
            if (e.target.matches('input, textarea, select')) return;
            if (e.key === 'n' || e.key === 'N') {
                Projects.showCreateModal();
            }
            if (e.key === 'c' || e.key === 'C') {
                Capture.showQuickCapture();
            }
        });

        // Search trigger button
        var cmdTrigger = document.getElementById('cmd-trigger');
        if (cmdTrigger) {
            cmdTrigger.addEventListener('click', function() {
                CommandPalette.open();
            });
        }
    },

    toggleSidebar: function() {
        var sidebar = document.getElementById('sidebar');
        var backdrop = document.getElementById('sidebar-backdrop');
        if (sidebar.classList.contains('open')) {
            App.closeSidebar();
        } else {
            sidebar.classList.add('open');
            if (backdrop) backdrop.classList.add('visible');
        }
    },

    closeSidebar: function() {
        var sidebar = document.getElementById('sidebar');
        var backdrop = document.getElementById('sidebar-backdrop');
        sidebar.classList.remove('open');
        if (backdrop) backdrop.classList.remove('visible');
    },

    handleHeaderAction: function() {
        var route = App.currentRoute;
        if (!route) return;
        if (route.name === 'inbox') {
            Capture.showQuickCapture();
        } else if (route.name === 'daily') {
            window.location.hash = '#/daily/' + Utils.today();
        } else if (route.name === 'search') {
            var input = document.getElementById('search-input');
            if (input) input.focus();
        } else if (route.name === 'library') {
            Library.showEditor({ onSave: function() { Library.render(); } });
        } else if (route.name === 'areas') {
            Areas.showEditor({ onSave: function() { Areas.render(); } });
        } else if (route.name === 'habits') {
            Habits.showEditor({});
        } else {
            Projects.showCreateModal();
        }
    },

    parseRoute: function(hash) {
        var raw = (hash || '#/').replace(/^#/, '') || '/';
        var parts = raw.split('?');
        var path = parts[0];
        var query = new URLSearchParams(parts[1] || '');

        var projectMatch = path.match(/^\/project\/([^/]+)/);
        if (projectMatch) {
            return { name: 'project-detail', projectId: projectMatch[1] };
        }
        var noteMatch = path.match(/^\/note\/([^/]+)/);
        if (noteMatch) {
            return { name: 'note-editor', noteId: noteMatch[1], projectId: query.get('project') || '', title: query.get('title') || '' };
        }
        var dailyMatch = path.match(/^\/daily(?:\/(\d{4}-\d{2}-\d{2}))?/);
        if (dailyMatch) {
            return { name: 'daily', date: dailyMatch[1] || Utils.today() };
        }
        if (path === '/projects') return { name: 'projects' };
        if (path === '/inbox') return { name: 'inbox' };
        if (path === '/daily') return { name: 'daily', date: Utils.today() };
        if (path === '/library') return { name: 'library' };
        if (path === '/areas') return { name: 'areas' };
        if (path === '/habits') return { name: 'habits' };
        if (path === '/search') return { name: 'search', query: query.get('q') || '' };
        if (path === '/review') return { name: 'review' };
        if (path === '/settings') return { name: 'settings' };
        if (path === '/graph') return { name: 'graph' };

        return { name: 'dashboard' };
    },

    getNavPath: function(route) {
        if (route.name === 'dashboard') return '/';
        if (route.name === 'projects') return '/projects';
        if (route.name === 'inbox') return '/inbox';
        if (route.name === 'daily') return '/daily';
        if (route.name === 'library') return '/library';
        if (route.name === 'areas') return '/areas';
        if (route.name === 'habits') return '/habits';
        if (route.name === 'search') return '/search';
        if (route.name === 'review') return '/review';
        if (route.name === 'settings') return '/settings';
        return null;
    },

    navigate: function(hash) {
        var route = App.parseRoute(hash);
        App.currentRoute = route;

        document.querySelectorAll('.view').forEach(function(view) {
            view.hidden = true;
        });

        var navPath = App.getNavPath(route);
        document.querySelectorAll('.nav-link').forEach(function(link) {
            link.classList.remove('active');
            if (navPath && link.getAttribute('data-route') === navPath) {
                link.classList.add('active');
            }
        });

        // Bottom nav active state
        document.querySelectorAll('.bottom-nav-item[data-route]').forEach(function(item) {
            item.classList.remove('active');
            if (navPath && item.getAttribute('data-route') === navPath) {
                item.classList.add('active');
            }
        });

        var titleEl = document.getElementById('page-title');
        var headerAction = document.getElementById('header-action');

        if (route.name === 'dashboard') {
            document.getElementById('view-dashboard').hidden = false;
            if (titleEl) titleEl.textContent = 'Dashboard';
            if (headerAction) { headerAction.hidden = false; headerAction.textContent = '+ New Project'; }
            Dashboard.render();
        } else if (route.name === 'note-editor') {
            document.getElementById('view-note').hidden = false;
            if (headerAction) headerAction.hidden = true;
            if (titleEl) titleEl.textContent = 'Edit Note';
            Notes.renderEditor(route.noteId, route.projectId, route.title);
        } else if (route.name === 'projects') {
            document.getElementById('view-projects').hidden = false;
            if (titleEl) titleEl.textContent = 'Projects';
            if (headerAction) { headerAction.hidden = false; headerAction.textContent = '+ New Project'; }
            Projects.render();
        } else if (route.name === 'project-detail') {
            document.getElementById('view-project-detail').hidden = false;
            if (headerAction) headerAction.hidden = true;
            RetraqDB.getProject(route.projectId).then(function(project) {
                if (titleEl) titleEl.textContent = project ? project.title : 'Project';
            });
            ProjectDetail.render(route.projectId);
        } else if (route.name === 'inbox') {
            document.getElementById('view-inbox').hidden = false;
            if (titleEl) titleEl.textContent = 'Inbox';
            if (headerAction) { headerAction.hidden = false; headerAction.textContent = '+ Capture'; }
            Inbox.render();
        } else if (route.name === 'daily') {
            document.getElementById('view-daily').hidden = false;
            if (titleEl) titleEl.textContent = 'Daily Notes';
            if (headerAction) { headerAction.hidden = false; headerAction.textContent = 'Today'; }
            DailyNotes.render(route.date);
        } else if (route.name === 'search') {
            document.getElementById('view-search').hidden = false;
            if (titleEl) titleEl.textContent = 'Search';
            if (headerAction) headerAction.hidden = true;
            Search.render(route.query);
        } else if (route.name === 'library') {
            document.getElementById('view-library').hidden = false;
            if (titleEl) titleEl.textContent = 'Library';
            if (headerAction) { headerAction.hidden = false; headerAction.textContent = '+ Add Reference'; }
            Library.render();
        } else if (route.name === 'areas') {
            document.getElementById('view-areas').hidden = false;
            if (titleEl) titleEl.textContent = 'Areas';
            if (headerAction) { headerAction.hidden = false; headerAction.textContent = '+ New Area'; }
            Areas.render();
        } else if (route.name === 'graph') {
            document.getElementById('view-graph').hidden = false;
            if (titleEl) titleEl.textContent = 'Knowledge Graph';
            if (headerAction) headerAction.hidden = true;
            if (window.Graph && Graph.render) Graph.render();
        } else if (route.name === 'habits') {
            document.getElementById('view-habits').hidden = false;
            if (titleEl) titleEl.textContent = 'Habits';
            if (headerAction) { headerAction.hidden = false; headerAction.textContent = '+ New Habit'; }
            Habits.render();
        } else if (route.name === 'review') {
            document.getElementById('view-review').hidden = false;
            if (titleEl) titleEl.textContent = 'Review';
            if (headerAction) headerAction.hidden = true;
            Review.render();
        } else if (route.name === 'settings') {
            document.getElementById('view-settings').hidden = false;
            if (titleEl) titleEl.textContent = 'Settings';
            if (headerAction) headerAction.hidden = true;
            Settings.render();
        }
    }
};

window.App = App;

document.addEventListener('DOMContentLoaded', function() {
    App.init();
});
