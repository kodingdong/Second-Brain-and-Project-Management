# 🔮 Retraq — Obsidian × Notion Hybrid Redesign Plan

## Vision

Transform Retraq from a functional but basic project tracker into a **premium personal workspace** that combines:

| From **Notion** | From **Obsidian** |
|---|---|
| Beautiful database views (table, kanban, gallery) | `[[Wikilink]]` bi-directional links |
| Cover images & icon picker per page | Graph view (knowledge connections) |
| Toggle blocks & callout blocks | Backlinks panel |
| Inline property editing | Command palette (`Ctrl+P`) |
| Clean, spacious typography | Quick switcher (`Ctrl+K`) |
| Drag-and-drop organization | Local-first, offline |
| Multi-view for same data | Markdown-native editing |

## Current State Assessment

The app has solid foundations:
- ✅ IndexedDB data layer with 12 stores
- ✅ Hash-based SPA router with 10+ routes
- ✅ Dark theme with Inter font
- ✅ Mobile-first responsive layout
- ✅ PWA with service worker

**What's missing for Obsidian × Notion feel:**
- ❌ Premium visual polish (glassmorphism, gradients, micro-animations)
- ❌ Database views (kanban, table, gallery)
- ❌ Rich-text / block editor
- ❌ Graph view for knowledge connections
- ❌ Command palette & quick switcher
- ❌ Cover images & emoji picker
- ❌ Inline property editing
- ❌ Page-style layout (vs current card-list layout)
- ❌ Smooth transitions between views

---

## Phase 1: Premium Design System Overhaul ⭐ HIGH IMPACT

### 1.1 — Enhanced Color System & Glassmorphism

```css
/* New accent palette — richer, more vibrant */
--color-accent-purple: #8b5cf6;
--color-accent-blue: #3b82f6;
--color-accent-cyan: #06b6d4;
--color-accent-pink: #ec4899;
--color-accent-amber: #f59e0b;

/* Glassmorphism surfaces */
--glass-bg: rgba(24, 24, 31, 0.75);
--glass-border: rgba(255, 255, 255, 0.06);
--glass-blur: 20px;

/* Gradient accents */
--gradient-primary: linear-gradient(135deg, #6366f1, #8b5cf6);
--gradient-glow: radial-gradient(circle at top right, rgba(99,102,241,0.15), transparent 50%);
```

### 1.2 — Sidebar Redesign (Notion-style)
- Collapsible sections with chevrons
- Hover reveal for action buttons
- Page tree with indentation
- Favorites / pinned pages section
- User avatar area at top
- Smooth slide transitions

### 1.3 — Typography & Spacing
- Heading hierarchy: 2rem → 1.5rem → 1.2rem → 1rem
- Increased line-height: 1.7 for content areas
- Letter-spacing adjustments
- Notion-like max-width (720px for content, 960px for databases)

### 1.4 — Micro-animations
- Page transitions (fade + slide)
- Card hover lift with subtle glow
- Button press ripple effect
- Skeleton loading states
- Smooth accordion/collapse animations
- Staggered list entry animations

---

## Phase 2: Notion-style Database Views 🗂️

### 2.1 — Project Views (Table / Kanban / Gallery)

**Table View:**
- Inline-editable cells
- Column sorting & filtering
- Status pills with color
- Progress bar column
- Date column with calendar picker

**Kanban View:**
- Columns per status (Idea → Planning → Active → Paused → Done)
- Drag & drop cards between columns (using native drag API)
- Card shows: icon, title, progress %, due date
- "+" button at bottom of each column

**Gallery View:**
- Grid of cards with cover color/gradient
- Icon prominently displayed
- Title + status badge
- Progress bar

### 2.2 — View Switcher Component
```
[≡ Table] [⊞ Kanban] [▦ Gallery]   [+ Filter] [↕ Sort]
```

### 2.3 — Inline Property Editing
- Click on any property to edit in-place
- Status dropdown opens on click
- Date picker popup
- Tags as chips with autocomplete

---

## Phase 3: Obsidian-style Editor & Graph 🧠

### 3.1 — Enhanced Note Editor
- **Split view**: Edit (left) + Preview (right)
- Live `[[wikilink]]` autocomplete dropdown
- Markdown preview with syntax highlighting
- Callout blocks: `> [!info]`, `> [!warning]`, `> [!tip]`
- Toggle/collapsible blocks
- Code blocks with language tag
- Checkbox lists `- [ ]` rendering

### 3.2 — Backlinks Panel (Enhanced)
- Show at bottom of every note
- Group by source note
- Show context snippet around the link
- Click to navigate

### 3.3 — Knowledge Graph View ✨ Signature Feature
- Force-directed graph using Canvas API
- Nodes = notes, sized by connection count
- Edges = `[[links]]` between notes
- Click node → navigate to note
- Zoom & pan controls
- Filter by tag/area/project
- Animated node layout
- Color-coded by note type

### 3.4 — Daily Notes Enhancement
- Calendar widget (mini) for date navigation
- "On this day" section
- Quick-link templates for common entries
- Auto-backlink section showing what was created today

---

## Phase 4: Command Palette & Quick Switcher ⚡

### 4.1 — Command Palette (`Ctrl+P` or `Ctrl+Shift+P`)
- Fuzzy search across all actions
- Recent commands
- Commands: navigate, create, toggle theme, export, search
- Keyboard-navigable (↑↓ Enter Esc)
- Grouped: Navigation, Create, Tools, Settings

### 4.2 — Quick Switcher (`Ctrl+K`)
- Search notes, projects, habits, references
- Recent items at top
- Type indicators (📁 Project, 📝 Note, 🎯 Habit)
- Fuzzy matching with highlighted characters
- Instant navigation on Enter

### 4.3 — Slash Commands (in Editor)
- `/heading`, `/callout`, `/code`, `/todo`, `/link`
- `/date` → insert today's date
- `/project` → link to project
- Dropdown menu appears at cursor

---

## Phase 5: Polish & Premium Feel 💎

### 5.1 — Cover Images & Page Headers
- Gradient cover per project/note (auto-generated from color)
- Large emoji icon overlapping cover
- Page title inline-editable
- Breadcrumb navigation

### 5.2 — Emoji Picker Component
- Grid of common emojis
- Search functionality
- Recent emojis
- Category tabs

### 5.3 — Drag & Drop
- Reorder tasks within a project
- Reorder milestones
- Move cards between kanban columns

### 5.4 — Theme System
- Dark mode (current, enhanced)
- Light mode option
- Custom accent color picker
- Store preference in localStorage

### 5.5 — Empty States
- Beautiful illustrated empty states
- Contextual call-to-action
- Animated illustrations (CSS-only)

---

## Implementation Priority

| Priority | What | Impact | Effort |
|----------|-------|--------|--------|
| 🔴 P0 | Design System overhaul (CSS) | Immediate visual WOW | Medium |
| 🔴 P0 | Sidebar redesign (collapsible, Notion-style) | Navigation feel | Medium |
| 🟡 P1 | Command palette & quick switcher | Power-user productivity | Medium |
| 🟡 P1 | View switcher (Table/Kanban/Gallery) for Projects | Core Notion feature | High |
| 🟡 P1 | Enhanced note editor with live preview | Core Obsidian feature | High |
| 🟢 P2 | Knowledge graph view | Signature wow feature | High |
| 🟢 P2 | Cover images & page headers | Visual polish | Low |
| 🟢 P2 | Emoji picker | Minor delight | Low |
| 🔵 P3 | Drag & drop | Nice-to-have | Medium |
| 🔵 P3 | Theme system (light/dark) | Preference | Medium |

---

## File Changes Summary

| File | Action | Description |
|------|--------|-------------|
| `css/style.css` | **Rewrite** | Complete design system overhaul |
| `index.html` | **Update** | New sidebar structure, graph view container, command palette |
| `js/app.js` | **Update** | Command palette, quick switcher, keyboard shortcuts |
| `js/dashboard.js` | **Rewrite** | New premium dashboard layout |
| `js/projects.js` | **Rewrite** | Table/Kanban/Gallery views |
| `js/project-detail.js` | **Update** | Page-style layout with cover |
| `js/notes.js` | **Rewrite** | Split editor, markdown preview |
| `js/graph.js` | **New** | Knowledge graph visualization |
| `js/command-palette.js` | **New** | Command palette & quick switcher |
| `js/kanban.js` | **New** | Kanban board component |
| `js/emoji-picker.js` | **New** | Emoji picker component |
| `js/components.js` | **Update** | New reusable components |

> [!IMPORTANT]
> This is a **massive** redesign. Recommended approach: start with Phase 1 (CSS overhaul) 
> which gives the biggest visual impact with the least code changes, then proceed phase by phase.

**Estimated timeline (solo dev):**
- Phase 1: ~3-4 days
- Phase 2: ~5-7 days
- Phase 3: ~5-7 days
- Phase 4: ~2-3 days
- Phase 5: ~3-4 days
- **Total: ~3-4 weeks**
