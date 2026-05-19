# Reader Bottom Bar Features Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Extend Reader page bottom bar with chapter catalog drawer, 6-preset reading theme selector, and bookmark functionality.

**Architecture:** All features are frontend-only. Theme and bookmarks persist via localStorage. Catalog reuses existing `chapters` state. A bottom-sheet drawer handles catalog/bookmark-tab switching. A theme picker bar slides up above the settingsBar.

**Tech Stack:** React 18.3 + TypeScript 5.2, CSS Modules, lucide-react 1.16

---

### Task 1: Add Bookmark type

**Files:**
- Modify: `frontend/src/types/index.ts`

- [ ] **Add Bookmark interface to types/index.ts**

```typescript
export interface Bookmark {
  bookId: number
  chapterId: number
  chapterTitle: string
  timestamp: number
}
```

---

### Task 2: Add theme/color definitions, update Reader.tsx state and settingsBar

**Files:**
- Modify: `frontend/src/pages/Reader.tsx`

- [ ] **Step 1: Replace the lucide-react import to add needed icons**

At line 3, change:
```typescript
import { ArrowLeft } from 'lucide-react'
```
to:
```typescript
import { ArrowLeft, Bookmark, List, Palette } from 'lucide-react'
```

- [ ] **Step 2: Add theme config after existing imports (before `interface UnlockStatus`)**

```typescript
interface ThemePreset {
  name: string
  label: string
  bg: string
  color: string
}

const THEMES: ThemePreset[] = [
  { name: 'white', label: '白', bg: '#fbf9f7', color: '#2c1f14' },
  { name: 'lightYellow', label: '淡黄', bg: '#f5f0c0', color: '#2c1f14' },
  { name: 'parchment', label: '羊皮纸', bg: '#f0e4c8', color: '#2c1f14' },
  { name: 'lightGray', label: '浅灰', bg: '#e8e4df', color: '#2c1f14' },
  { name: 'darkGray', label: '深灰', bg: '#3a3530', color: '#d4c8b8' },
  { name: 'black', label: '纯黑', bg: '#1a1a1a', color: '#c8c0b8' },
]

interface Bookmark {
  bookId: number
  chapterId: number
  chapterTitle: string
  timestamp: number
}

function loadBookmarks(): Bookmark[] {
  try {
    const raw = localStorage.getItem('readerBookmarks')
    return raw ? JSON.parse(raw) : []
  } catch { return [] }
}

function saveBookmarks(list: Bookmark[]) {
  localStorage.setItem('readerBookmarks', JSON.stringify(list))
}
```

- [ ] **Step 3: Add new state variables. After the existing `useState` lines (after `const [unlocking, setUnlocking] = useState(false)` at line 37), add:**

```typescript
const [showCatalog, setShowCatalog] = useState(false)
const [showThemePicker, setShowThemePicker] = useState(false)
const [readerTheme, setReaderTheme] = useState(() => {
  return localStorage.getItem('readerTheme') || 'white'
})
const [bookmarks, setBookmarks] = useState<Bookmark[]>(loadBookmarks)
const [catalogTab, setCatalogTab] = useState<'chapters' | 'bookmarks'>('chapters')
```

- [ ] **Step 4: Apply theme to the reader container. Change the outer div style (around line 301) from:**

```tsx
<div style={{ background: 'var(--color-bg)', minHeight: '100vh', paddingBottom: '80px' }}>
```
to:
```tsx
const currentTheme = THEMES.find(t => t.name === readerTheme)!
// later in JSX:
<div style={{ background: currentTheme.bg, color: currentTheme.color, minHeight: '100vh', paddingBottom: '80px' }}>
```

- [ ] **Step 5: Add bookmark toggle handler (before `handleGoBack`, around line 199):**

```typescript
const isBookmarked = bookmarks.some(
  b => b.bookId === Number(bookId) && b.chapterId === Number(chapterId)
)

const toggleBookmark = () => {
  let updated: Bookmark[]
  if (isBookmarked) {
    updated = bookmarks.filter(
      b => !(b.bookId === Number(bookId) && b.chapterId === Number(chapterId))
    )
  } else {
    const newBookmark: Bookmark = {
      bookId: Number(bookId),
      chapterId: Number(chapterId),
      chapterTitle: chapter?.title || '',
      timestamp: Date.now(),
    }
    updated = [newBookmark, ...bookmarks]
  }
  setBookmarks(updated)
  saveBookmarks(updated)
}

const handleThemeChange = (name: string) => {
  setReaderTheme(name)
  localStorage.setItem('readerTheme', name)
  setShowThemePicker(false)
}
```

- [ ] **Step 6: Replace the settingsBar (around lines 347-365) with the extended version:**

```tsx
<div className={styles.settingsBar}>
  <button className={styles.settingsBtn} onClick={() => { setShowCatalog(true); setCatalogTab('chapters') }}>
    <List size={16} />
    <span>目录</span>
  </button>
  <button className={styles.settingsBtn} onClick={() => setShowThemePicker(!showThemePicker)}>
    <Palette size={16} />
    <span>主题</span>
  </button>
  <div className={styles.fontSizeGroup}>
    <button
      className={styles.fontSizeBtn}
      onClick={() => handleFontSizeChange(fontSize - 2)}
      disabled={fontSize <= 12}
    >
      A⁻
    </button>
    <span style={{ fontWeight: 600 }}>Aa</span>
    <button
      className={styles.fontSizeBtn}
      onClick={() => handleFontSizeChange(fontSize + 2)}
      disabled={fontSize >= 24}
    >
      A⁺
    </button>
  </div>
  <button className={styles.settingsBtn} onClick={toggleBookmark}>
    <Bookmark size={16} fill={isBookmarked ? 'currentColor' : 'none'} />
    <span>{isBookmarked ? '已存' : '书签'}</span>
  </button>
  <button className={styles.settingsBtn} onClick={() => navigate(`/book/${bookId}/comments`)}>
    <span>💬</span>
    <span>评论</span>
  </button>
</div>
```

- [ ] **Step 7: Add theme picker bar (between the nav div and the settingsBar):**

```tsx
{showThemePicker && (
  <div className={styles.themePicker}>
    {THEMES.map(t => (
      <button
        key={t.name}
        className={`${styles.themeDot} ${readerTheme === t.name ? styles.themeDotActive : ''}`}
        style={{ backgroundColor: t.bg, borderColor: t.name === 'black' ? '#555' : 'var(--color-border)' }}
        onClick={() => handleThemeChange(t.name)}
        title={t.label}
      >
        <span style={{ color: t.color }}>Aa</span>
      </button>
    ))}
  </div>
)}
```

- [ ] **Step 8: Add catalog/bookmark drawer overlay (at the very end of the main return, before the closing `</div>`):**

```tsx
{showCatalog && (
  <div className={styles.drawerOverlay} onClick={() => setShowCatalog(false)}>
    <div className={styles.drawer} onClick={e => e.stopPropagation()}>
      <div className={styles.drawerHandle} />
      <div className={styles.drawerTabs}>
        <button
          className={`${styles.drawerTab} ${catalogTab === 'chapters' ? styles.drawerTabActive : ''}`}
          onClick={() => setCatalogTab('chapters')}
        >
          目录
        </button>
        <button
          className={`${styles.drawerTab} ${catalogTab === 'bookmarks' ? styles.drawerTabActive : ''}`}
          onClick={() => setCatalogTab('bookmarks')}
        >
          书签
        </button>
      </div>
      <div className={styles.drawerBody}>
        {catalogTab === 'chapters' ? (
          chapters.map((ch) => (
            <div
              key={ch.id}
              className={`${styles.drawerItem} ${ch.id === Number(chapterId) ? styles.drawerItemActive : ''}`}
              onClick={() => {
                navigate(`/read/${bookId}/${ch.id}`, { state: { from: fromPath.current } })
                setShowCatalog(false)
              }}
            >
              <span className={styles.drawerItemTitle}>{ch.title}</span>
              {ch.id === Number(chapterId) && <span className={styles.drawerItemTag}>当前</span>}
            </div>
          ))
        ) : bookmarks.length === 0 ? (
          <div className={styles.drawerEmpty}>暂无书签</div>
        ) : (
          bookmarks
            .filter(b => b.bookId === Number(bookId))
            .map((b) => (
              <div
                key={`${b.bookId}-${b.chapterId}`}
                className={`${styles.drawerItem} ${b.chapterId === Number(chapterId) ? styles.drawerItemActive : ''}`}
                onClick={() => {
                  navigate(`/read/${b.bookId}/${b.chapterId}`, { state: { from: fromPath.current } })
                  setShowCatalog(false)
                }}
              >
                <span className={styles.drawerItemTitle}>{b.chapterTitle}</span>
                <span className={styles.drawerItemDate}>
                  {new Date(b.timestamp).toLocaleDateString()}
                </span>
              </div>
            ))
        )}
      </div>
    </div>
  </div>
)}
```

---

### Task 3: Add CSS styles

**Files:**
- Modify: `frontend/src/pages/Reader.module.css`

- [ ] **Append new styles to Reader.module.css:**

```css
/* ---- settings bar buttons ---- */
.settingsBtn {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 2px;
  padding: 4px 6px;
  font-size: 10px;
  color: var(--color-text-secondary);
  cursor: pointer;
  background: none;
  border: none;
  line-height: 1;
}

.fontSizeGroup {
  display: flex;
  align-items: center;
  gap: 4px;
}

/* ---- theme picker ---- */
.themePicker {
  position: fixed;
  bottom: 54px;
  left: 0;
  right: 0;
  display: flex;
  justify-content: center;
  gap: var(--space-lg);
  padding: var(--space-md) var(--space-xl);
  background: var(--color-card);
  border-top: 1px solid var(--color-divider);
  z-index: 99;
}

.themeDot {
  width: 36px;
  height: 36px;
  border-radius: 50%;
  border: 2px solid var(--color-border);
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 10px;
  font-weight: 600;
  transition: transform var(--transition-fast);
}

.themeDot:hover {
  transform: scale(1.15);
}

.themeDotActive {
  box-shadow: 0 0 0 2px var(--color-primary);
  border-color: var(--color-primary);
}

/* ---- catalog / bookmark drawer ---- */
.drawerOverlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.4);
  z-index: 200;
  display: flex;
  align-items: flex-end;
}

.drawer {
  width: 100%;
  max-height: 60vh;
  background: var(--color-card);
  border-radius: var(--radius-lg) var(--radius-lg) 0 0;
  display: flex;
  flex-direction: column;
  animation: slideUp 0.25s ease;
}

@keyframes slideUp {
  from { transform: translateY(100%); }
  to { transform: translateY(0); }
}

.drawerHandle {
  width: 36px;
  height: 4px;
  background: var(--color-border);
  border-radius: 2px;
  margin: 10px auto 0;
}

.drawerTabs {
  display: flex;
  border-bottom: 1px solid var(--color-divider);
  padding: 0 var(--space-xl);
  margin-top: var(--space-md);
}

.drawerTab {
  padding: var(--space-sm) var(--space-lg);
  font-size: var(--font-size-base);
  color: var(--color-text-tertiary);
  cursor: pointer;
  background: none;
  border: none;
  border-bottom: 2px solid transparent;
  transition: color var(--transition-fast), border-color var(--transition-fast);
}

.drawerTabActive {
  color: var(--color-primary);
  border-bottom-color: var(--color-primary);
  font-weight: 600;
}

.drawerBody {
  flex: 1;
  overflow-y: auto;
  padding: var(--space-sm) 0;
}

.drawerItem {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: var(--space-md) var(--space-xl);
  cursor: pointer;
  transition: background var(--transition-fast);
}

.drawerItem:hover {
  background: var(--color-surface);
}

.drawerItemActive {
  color: var(--color-primary);
  font-weight: 600;
}

.drawerItemActive .drawerItemTitle {
  color: var(--color-primary);
}

.drawerItemTitle {
  font-size: var(--font-size-base);
  color: var(--color-text-primary);
}

.drawerItemTag {
  font-size: var(--font-size-xs);
  color: var(--color-primary);
  background: var(--color-primary-light);
  padding: 2px 6px;
  border-radius: var(--radius-sm);
}

.drawerItemDate {
  font-size: var(--font-size-xs);
  color: var(--color-text-placeholder);
}

.drawerEmpty {
  text-align: center;
  padding: var(--space-3xl);
  color: var(--color-text-placeholder);
  font-size: var(--font-size-base);
}
```

---

### Task 4: Verify

- [ ] **Step 1: Confirm frontend compiles without errors**

```bash
cd d:/TRAE/Novel/frontend && npx tsc --noEmit 2>&1 | head -30
```

- [ ] **Step 2: Verify frontend dev server is running and hot-reloads**

Check `http://localhost:3000` in browser, navigate to a book's reading page, and test:
1. Click 「目录」→ drawer opens, chapters listed, current highlighted, click to jump
2. Switch to 「书签」 tab → shows "暂无书签" or existing bookmarks
3. Click 「主题」→ color dots appear, click one → background changes, persists on reload
4. Click 「书签」→ icon fills, saves position; click again → removes
5. Click A⁻/A⁺ → font size changes, bottom bar stays fixed
6. Click 「评论」→ navigates to comments page
