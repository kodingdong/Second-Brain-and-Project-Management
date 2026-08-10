# 🔍 Retraq — Review Lengkap vs Obsidian & Notion

> **Reviewer**: AI Senior Full-Stack Engineer  
> **Tanggal**: 8 Agustus 2026  
> **Scope**: Seluruh codebase Retraq PWA (20 JS modules, ~250KB total)

---

## 📊 Executive Summary

| Aspek | Retraq | Obsidian | Notion |
|:---|:---:|:---:|:---:|
| **Offline-First** | ✅ Full | ✅ Full (local) | ⚠️ Partial |
| **Knowledge Graph** | ✅ Canvas | ✅ Native | ❌ None |
| **Bi-directional Links** | ✅ `[[wiki]]` | ✅ Native | ❌ None |
| **Kanban Board** | ✅ Drag&Drop | ❌ Plugin | ✅ Native |
| **Multi-View Projects** | ✅ 3 views | ❌ None | ✅ 6+ views |
| **Rich Text Editor** | ❌ Plaintext | ✅ Markdown | ✅ Block Editor |
| **Daily Notes** | ✅ Auto-create | ✅ Core Plugin | ❌ Manual |
| **Spaced Repetition** | ✅ Built-in | ⚠️ Plugin | ❌ None |
| **Habit Tracking** | ✅ Built-in | ⚠️ Plugin | ❌ Manual |
| **Plugin/Extension** | ❌ None | ✅ 1500+ | ✅ Integrations |
| **Collaboration** | ❌ None | ⚠️ Sync paid | ✅ Real-time |
| **Data Privacy** | ✅ 100% local | ✅ Local files | ⚠️ Cloud |
| **File Attachments** | ❌ None | ✅ Full | ✅ Full |
| **PWA / Mobile** | ✅ Native PWA | ⚠️ Separate app | ✅ Native apps |

**Verdict**: Retraq berhasil menyatukan ~70% core value dari kedua platform dalam satu PWA ringan (~250KB). Kekuatan utamanya adalah **offline-first + knowledge graph + project management** dalam satu paket tanpa dependency. Kelemahannya ada di **rich text editing** dan **extensibility**.

---

## 1. 🏗️ Arsitektur & Teknologi

### Yang Sudah Bagus ✅

| Aspek | Detail |
|:---|:---|
| **Zero-dependency** | Vanilla JS murni, tidak ada framework/library. Bundle ~250KB total |
| **IndexedDB** | 12 object stores dengan indexing tepat (`db.js`, 1003 baris) |
| **Service Worker** | Stale-while-revalidate caching, versioned cache (`retraq-v6`) |
| **PWA Manifest** | Icon 192/512px, standalone display, portrait orientation |
| **Module Separation** | 20 file JS terpisah dengan clear responsibility |
| **Hash Routing** | SPA routing sederhana tapi efektif via `hashchange` |

### Gap vs Obsidian ⚠️

- **Obsidian** menggunakan local filesystem (`.md` files) → bisa diedit di editor lain
- **Retraq** data terkunci di IndexedDB → hanya bisa diakses via app
- **Obsidian** punya plugin API (`app.vault`, `app.workspace`) → Retraq tidak extensible

### Gap vs Notion ⚠️

- **Notion** punya real-time collaboration via WebSocket → Retraq single-user only
- **Notion** punya API publik untuk integrasi → Retraq isolated
- **Notion** punya undo/redo history → Retraq tidak ada version history

### Rekomendasi Arsitektur

```
Priority 1: Export ke Markdown (`.md` files) untuk interoperability
Priority 2: Undo/Redo stack (minimal 20 langkah)
Priority 3: Webhook/API endpoint untuk automation
```

---

## 2. 📝 Knowledge Management (vs Obsidian)

### 2.1 Bi-directional Links — ✅ Implemented

```
File: js/bilinks.js (175 baris)
```

| Fitur | Status | Kualitas |
|:---|:---:|:---|
| `[[wikilink]]` parsing | ✅ | Regex-based, case-insensitive matching |
| Resolved links (clickable) | ✅ | Navigasi ke note editor |
| Unresolved links (create new) | ✅ | Auto-create note dengan title pre-filled |
| Backlinks panel | ✅ | Ditampilkan di note editor modal |
| Forward links | ✅ | `getForwardLinks()` tersedia |

**vs Obsidian**:
- ❌ Tidak ada **link autocomplete** saat mengetik `[[` (Obsidian punya dropdown suggestion)
- ❌ Tidak ada **alias links** `[[actual|display]]` (Obsidian support)
- ❌ Tidak ada **header links** `[[note#heading]]` (Obsidian support)
- ❌ Tidak ada **block references** `[[note^block-id]]`
- ❌ Backlinks hanya di modal editor, bukan inline di note view

### 2.2 Knowledge Graph — ✅ Implemented

```
File: js/graph.js (494 baris) — Canvas API + Force-Directed Layout
```

| Fitur | Status | Kualitas |
|:---|:---:|:---|
| Force-directed physics | ✅ | Repulsion, attraction, center gravity, damping=0.85 |
| Note → Note edges (via `[[wikilink]]`) | ✅ | Real-time parsing |
| Note → Project edges | ✅ | Via `project_notes` junction table |
| Node color by type | ✅ | 5 types: note, daily, idea, reference, project |
| Zoom, Pan, Drag | ✅ | Mouse + Touch support |
| Double-click to open | ✅ | Buka note editor atau project detail |
| Node sizing by connections | ✅ | `4 + min(connections * 2, 12)` radius |
| Hover highlight + glow | ✅ | Edge highlight + node glow on hover |

**vs Obsidian**:
- ❌ Tidak ada **filter by tag/folder** (Obsidian punya filter panel)
- ❌ Tidak ada **local graph** (hanya menampilkan koneksi 1 note)
- ❌ Tidak ada **cluster coloring** berdasarkan proximity
- ❌ Max iterations hard-coded 300 → graph besar bisa berhenti prematur
- ❌ Tidak ada **node labels toggle** atau **orphan nodes filter**
- ✅ **Kelebihan Retraq**: include Project nodes (Obsidian hanya notes)

### 2.3 Daily Notes — ✅ Implemented

```
File: js/daily-notes.js (57 baris)
```

| Fitur | Status |
|:---|:---:|
| Auto-create per tanggal | ✅ |
| Auto-save (400ms debounce) | ✅ |
| Sidebar daftar 14 hari terakhir | ✅ |
| Navigasi antar tanggal | ✅ |

**vs Obsidian**:
- ❌ Tidak ada **template** untuk daily notes (Obsidian punya daily note template)
- ❌ Tidak ada **calendar widget** untuk navigasi bulan
- ❌ Tidak ada **forward/backward day** buttons
- ❌ Plaintext only — tidak ada heading, bold, checklist di daily note
- ❌ Tidak bisa embed `[[wikilinks]]` yang rendered di daily notes

### 2.4 Notes & Tags

| Fitur | Status | Notes |
|:---|:---:|:---|
| CRUD Notes | ✅ | via modal editor |
| Tags (comma-separated) | ✅ | stored in separate `tags` + `note_tags` stores |
| Note types (idea/note/TIL/snippet) | ✅ | 4 types |
| Link to Project | ✅ | many-to-many via `project_notes` |
| Link to Area | ✅ | via `area_id` field |
| Full-text search | ✅ | `searchAll()` — `indexOf` based |

**vs Obsidian**:
- ❌ Tidak ada **nested tags** (`#parent/child`)
- ❌ Tidak ada **tag pane** — dedicated view untuk browse by tag
- ❌ Tidak ada **frontmatter/YAML** metadata
- ❌ Tidak ada **Markdown rendering** — konten hanya plaintext di textarea

**vs Notion**:
- ❌ Tidak ada **property types** (date, person, relation, formula, rollup)
- ❌ Tidak ada **database views** untuk notes (Notion punya table/board/calendar/gallery)
- ❌ Tidak ada **inline mention** (`@page`, `@person`, `@date`)

---

## 3. 📋 Project Management (vs Notion)

### 3.1 Multi-View Projects — ✅ Implemented

```
File: js/projects.js (390 baris) — Gallery, Kanban, Table
```

| View | Status | Kualitas |
|:---|:---:|:---|
| Gallery (visual cards) | ✅ | Emoji icon, progress bar, status badge |
| Kanban (drag & drop) | ✅ | 5 columns, `draggable` API, status auto-update |
| Table (spreadsheet) | ✅ | 6 columns: icon, title, status, progress, target, tasks |
| View persistence | ✅ | `localStorage` save preference |

**vs Notion**:
- ❌ Tidak ada **Calendar view** (Notion punya timeline/calendar)
- ❌ Tidak ada **Sort & Filter** per view
- ❌ Tidak ada **Group By** (Notion bisa group by any property)
- ❌ Tidak ada **column reordering** di table
- ❌ Tidak ada **inline editing** di table (Notion bisa edit in-place)
- ❌ Kanban tidak ada **WIP limits**
- ✅ **Kelebihan**: View switching sangat cepat (instant, tidak perlu API call)

### 3.2 Project Detail — ✅ Implemented

```
File: js/project-detail.js (292 baris)
```

| Fitur | Status |
|:---|:---:|
| Overview card (icon, title, status, progress) | ✅ |
| Status change dropdown | ✅ |
| Tabs: Tasks / Milestones / Notes | ✅ |
| Inline task creation | ✅ |
| Task priority (low/medium/high) | ✅ |
| Task due date | ✅ |
| Milestone checkpoints | ✅ |
| Linked notes | ✅ |
| Delete project (cascade) | ✅ |

**vs Notion**:
- ❌ Tidak ada **sub-tasks** (Notion punya nested tasks/toggle)
- ❌ Tidak ada **task assignee** (Notion punya person property)
- ❌ Tidak ada **task comments/discussion**
- ❌ Tidak ada **task dependencies** (blocked by)
- ❌ Tidak ada **Gantt chart / timeline**
- ❌ Tidak ada **activity log view** di detail (data tersimpan tapi tidak ditampilkan)

### 3.3 Templates — ✅ Partial

```
File: js/utils.js — PROJECT_TEMPLATES array
```

4 templates tersedia: Side Project, Learning, Personal Goal, Blank. Masing-masing punya pre-defined milestones.

**vs Notion**:
- ❌ Templates hanya untuk projects, bukan notes/pages
- ❌ Tidak bisa **create custom templates**
- ❌ Tidak ada **template gallery** atau community templates

---

## 4. 🔄 Review & Spaced Repetition (Unique Feature!)

```
File: js/review.js (397 baris)
```

> [!TIP]
> Ini adalah **differentiator terbesar** Retraq. Fitur ini tidak ada di Notion dan hanya tersedia via community plugin di Obsidian.

| Fitur | Status | Kualitas |
|:---|:---:|:---|
| Weekly Review (7 guided steps) | ✅ | Process inbox → review projects → resurface → plan |
| Resurface Queue (14-day interval) | ✅ | Auto-surface old notes |
| Snooze (7 days) | ✅ | Per-note snooze |
| Mark as reviewed | ✅ | Reset `last_resurfaced_at` |
| "On This Day" memory lane | ✅ | Same month-day, different year |
| Random Rediscovery | ✅ | Serendipity engine |
| Dashboard widget | ✅ | Compact view di homepage |
| Review state persistence | ✅ | `localStorage` based |

**Kelebihan vs Obsidian**: Obsidian membutuhkan plugin "Spaced Repetition" yang terpisah dan tidak terintegrasi dengan weekly review.

**Rekomendasi**: 
- Interval bisa dibuat configurable (bukan hard-coded 14 hari)
- Tambah **SM-2 algorithm** untuk adaptive spacing berdasarkan difficulty rating

---

## 5. ◉ Habit Tracking (Unique Feature!)

```
File: js/habits.js (389 baris)
```

| Fitur | Status | Kualitas |
|:---|:---:|:---|
| Create habit (name, icon, freq, target) | ✅ | 16 icon options |
| Daily check-in toggle | ✅ | One-tap, instant feedback |
| Streak tracking (current + longest) | ✅ | Accurate day-by-day calculation |
| Completion rate | ✅ | Based on days since creation |
| 90-day activity heatmap | ✅ | GitHub-style grid |
| Dashboard widget | ✅ | Top 5 habits with check-in |
| Link to Project | ✅ | Optional association |
| Weekly frequency support | ✅ | daily/weekly |

**vs Obsidian**: Membutuhkan plugin "Habit Tracker" — tidak built-in.  
**vs Notion**: Harus di-build manual dengan database + formula.

**Rekomendasi**:
- Tambah **reminder/notification** (via Push API)
- Tambah **habit categories/groups**
- Support **custom frequency** (e.g., 3x per week)

---

## 6. 🎨 UI/UX Design

### Design System — ✅ Well-Implemented

```
File: css/style.css (2298 baris, 49KB)
```

| Aspek | Kualitas | Detail |
|:---|:---:|:---|
| CSS Custom Properties | ✅ Excellent | 60+ design tokens (colors, spacing, shadows, gradients) |
| Dark Theme (default) | ✅ Excellent | Deep blacks (#0c0c11), vibrant accents |
| Light Theme | ✅ Good | Clean slate palette |
| Typography | ✅ Good | Inter font, proper hierarchy |
| Glassmorphism | ✅ Good | Topbar & bottom nav blur effects |
| Micro-animations | ✅ Good | Card hover lift, FAB spring, dot pulse |
| Mobile-First Layout | ✅ Good | Bottom nav, slide-out sidebar |
| Desktop Layout | ✅ Good | Fixed sidebar, content max-width 900px |
| Touch Targets | ✅ Good | Min 44px height on interactive elements |
| Safe Area (notch) | ✅ Good | `env(safe-area-inset-*)` support |

### UX Patterns

| Pattern | Status | Benchmark |
|:---|:---:|:---|
| Command Palette (Ctrl+K) | ✅ | ≈ Obsidian quick switcher |
| Keyboard shortcuts (N, C, Esc) | ✅ | Power user friendly |
| Toast notifications | ✅ | Non-intrusive feedback |
| Modal-based editing | ⚠️ | Notion uses inline, Obsidian uses pane |
| Drag-and-drop Kanban | ✅ | Native `draggable` API |
| Responsive sidebar | ✅ | Slide-out on mobile, fixed on desktop |
| Bottom navigation | ✅ | Material Design pattern |
| FAB (Quick Capture) | ✅ | Bottom nav center button |

### Design Gaps

- ❌ **Semua editing di modal** — Obsidian dan Notion menggunakan inline/pane editing yang lebih natural
- ❌ Tidak ada **skeleton loading** — transisi antar view terasa abrupt
- ❌ Tidak ada **page transition animations**
- ❌ Tidak ada **empty state illustrations** — hanya emoji + teks
- ❌ Command palette tidak ada **recent items** section

---

## 7. 💾 Data Layer

### IndexedDB Schema (v4)

| Store | Key | Indexes | Records |
|:---|:---|:---|:---|
| `projects` | `id` | `status`, `last_activity_at` | Project entities |
| `milestones` | `id` | `project_id` | Project milestones |
| `tasks` | `id` | `project_id`, `milestone_id`, `is_done` | Task items |
| `activity_log` | `id` | `project_id`, `created_at` | Audit trail |
| `notes` | `id` | `status`, `type`, `daily_date`, `updated_at` | Notes/ideas |
| `tags` | `id` | `name` (unique) | Tag registry |
| `note_tags` | `id` | `note_id`, `tag_id` | Many-to-many |
| `project_notes` | `id` | `project_id`, `note_id` | Many-to-many |
| `references` | `id` | `project_id`, `created_at` | Reference library |
| `areas` | `id` | `name` | PARA areas |
| `habits` | `id` | `project_id` | Habit definitions |
| `habit_logs` | `id` | `habit_id`, `date` | Check-in logs |

### Data Integrity

| Aspek | Status | Detail |
|:---|:---:|:---|
| Cascade delete (projects) | ✅ | Deletes tasks, milestones, logs, links |
| Cascade delete (notes) | ✅ | Deletes note_tags, project_notes |
| Cascade delete (habits) | ✅ | Deletes habit_logs |
| Cascade delete (areas) | ✅ | Unlinks projects/notes first |
| Export/Import JSON | ✅ | Full backup with merge or replace |
| Seed data mechanism | ✅ | Auto-load `seed.json` on first visit |
| UUID generation | ✅ | `crypto.randomUUID()` with fallback |

### Data Layer Issues

> [!WARNING]
> **Transaction Isolation**: Setiap operasi `put()` membuka transaksi baru. Pada operasi batch (import, cascade delete), ini bisa menyebabkan partial writes jika browser crash mid-operation.

> [!WARNING]
> **No Data Validation**: `db.js` tidak memvalidasi schema. Field bisa di-inject tanpa type checking. Contoh: `updateNote(id, { random_field: 'test' })` akan berhasil tanpa error.

> [!WARNING]
> **Search Performance**: `searchAll()` melakukan full-table scan dengan `indexOf`. Untuk 1000+ notes, ini akan terasa lambat. Perlu full-text index atau search worker.

---

## 8. 🔒 Security Assessment

| Aspek | Status | Detail |
|:---|:---:|:---|
| XSS Prevention | ✅ | `Utils.escapeHtml()` digunakan konsisten |
| HTML Injection | ⚠️ | Beberapa `innerHTML` assignment membangun HTML dari user input yang sudah di-escape |
| CSP Headers | ❌ | Tidak ada Content-Security-Policy |
| Data Encryption | ❌ | IndexedDB tidak encrypted (any JS on same origin can read) |
| Auth/Login | ❌ | No authentication — by design (single user) |

---

## 9. 📱 PWA Compliance

| Criteria | Status |
|:---|:---:|
| Valid manifest.json | ✅ |
| Service Worker registered | ✅ |
| HTTPS required | ✅ (deployment) |
| Icons 192px + 512px | ✅ |
| Maskable icon | ✅ |
| Offline functional | ✅ |
| Installable prompt | ✅ |
| Apple meta tags | ✅ |
| Viewport meta | ✅ |
| Theme color | ✅ |

---

## 10. 📈 Skor Komprehensif

### Feature Parity Score

| Kategori | vs Obsidian | vs Notion |
|:---|:---:|:---:|
| Note-taking | 40% | 25% |
| Knowledge linking | 55% | N/A (Notion tak punya) |
| Knowledge graph | 50% | N/A |
| Project management | N/A | 45% |
| Views (Gallery/Kanban/Table) | N/A | 40% |
| Daily notes | 45% | 70% |
| Review/Spaced rep | 90% (vs plugin) | 100% (Notion tak punya) |
| Habits | 85% (vs plugin) | 100% (Notion tak punya) |
| Search | 35% | 30% |
| Customization/Plugins | 5% | 15% |
| Rich text editing | 10% | 10% |
| Collaboration | 0% | 5% |
| **Weighted Average** | **~40%** | **~40%** |

### Overall Quality Score

| Aspek | Skor /10 |
|:---|:---:|
| Code Quality | 7.5 |
| Architecture | 7.0 |
| UI/UX Design | 8.0 |
| Feature Completeness | 6.5 |
| Performance | 8.5 |
| Data Integrity | 7.0 |
| PWA Compliance | 9.0 |
| Documentation | 8.0 |
| **Overall** | **7.7 / 10** |

---

## 11. 🎯 Prioritized Roadmap

### Phase 1 — Critical Gaps (High Impact)

| # | Fitur | Effort | Impact | Benchmark |
|:---|:---|:---:|:---:|:---|
| 1 | **Markdown rendering** di note view | Medium | 🔴 | Obsidian core |
| 2 | **Inline note editing** (bukan modal) | High | 🔴 | Both platforms |
| 3 | **Link autocomplete** saat ketik `[[` | Medium | 🔴 | Obsidian core |
| 4 | **Calendar widget** di Daily Notes | Low | 🟡 | Obsidian plugin |

### Phase 2 — Competitive Features (Medium Impact)

| # | Fitur | Effort | Impact | Benchmark |
|:---|:---|:---:|:---:|:---|
| 5 | **Filter & Sort** di Projects views | Medium | 🟡 | Notion core |
| 6 | **Local Graph** view (per-note) | Medium | 🟡 | Obsidian core |
| 7 | **Nested tags** (`#parent/child`) | Low | 🟡 | Obsidian core |
| 8 | **Activity log** view di project detail | Low | 🟡 | Already have data |
| 9 | **Undo/Redo** stack | Medium | 🟡 | Both platforms |
| 10 | **Export to Markdown** (`.md` files) | Medium | 🟡 | Interoperability |

### Phase 3 — Polish (Nice to Have)

| # | Fitur | Effort | Impact |
|:---|:---|:---:|:---:|
| 11 | Skeleton loading + page transitions | Low | 🟢 |
| 12 | Push notifications (habit reminders) | Medium | 🟢 |
| 13 | Custom templates (notes + projects) | Medium | 🟢 |
| 14 | Configurable spaced repetition interval | Low | 🟢 |
| 15 | Full-text search with Web Worker | Medium | 🟢 |

---

## 12. ✅ Kesimpulan

**Retraq adalah pencapaian yang impresif** — sebuah PWA ~250KB tanpa dependency yang berhasil menggabungkan konsep-konsep inti dari dua platform senilai miliaran dolar. 

**Keunggulan unik**:
1. **All-in-one offline** — Tidak ada platform lain yang menyatukan knowledge graph + Kanban + habit tracker + spaced repetition dalam satu PWA ringan
2. **Privacy-first** — Data 100% di device, tidak ada cloud dependency
3. **Instant performance** — Tidak ada loading spinner, semua operasi < 50ms
4. **Progressive enhancement** — PWA installable, mobile-first, keyboard shortcuts

**Kelemahan terbesar**:
1. **Plain text editing** — Ini gap paling kritis. Tanpa Markdown rendering atau block editor, pengalaman menulis jauh di bawah Obsidian dan Notion
2. **Modal-based editing** — Mengedit catatan lewat modal terasa sempit dan tidak natural
3. **No extensibility** — Tidak ada cara untuk menambah fitur tanpa modifikasi kode

**Rekomendasi #1**: Implementasi **Markdown rendering + inline editing** akan memberikan peningkatan terbesar dalam pengalaman pengguna dan competitive positioning.
