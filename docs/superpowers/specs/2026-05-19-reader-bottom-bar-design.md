# 阅读页底部栏功能扩展

## 背景

当前阅读器底部栏（`.settingsBar`）仅含字号调节和评论入口。需要扩展为功能完善的阅读工具栏。

## 新增功能

### 1. 目录

- **交互**: 点击底部栏「📋目录」→ 从底部滑出半屏抽屉
- **内容**: 所有章节标题列表，当前章节高亮（金驼色）
- **跳转**: 点击任意章节 → `navigate(/read/:bookId/:chapterId)` → 抽屉关闭
- **加载**: 复用已有的 `chapters` 状态，无需额外请求

### 2. 阅读主题（6 档背景色）

- **交互**: 点击底部栏「🎨主题」→ 底部栏上方弹出色块选择行
- **六色预设**:

| 名称 | 背景色 | 文字色 |
|------|--------|--------|
| 白 | `#fbf9f7` | `#2c1f14` |
| 淡黄 | `#f5f0c0` | `#2c1f14` |
| 羊皮纸 | `#f0e4c8` | `#2c1f14` |
| 浅灰 | `#e8e4df` | `#2c1f14` |
| 深灰 | `#3a3530` | `#d4c8b8` |
| 纯黑 | `#1a1a1a` | `#c8c0b8` |

- **持久化**: `localStorage` key `readerTheme`，初始化时读取
- **实现**: 在阅读页容器 div 上设置 `style={{ backgroundColor, color }}`，覆盖全局背景色

### 3. 书签

- **交互**: 点击「🔖」→ 存储/删除当前阅读位置书签
- **状态区分**: 当前章节已书签 → 实心图标 `Bookmark`；未书签 → 空心图标 `BookmarkIcon`
- **持久化**: `localStorage` key `readerBookmarks`
- **数据结构**: `{ bookId, chapterId, chapterTitle, position, timestamp }[]`
- **书签列表**: 目录抽屉顶部加 tab 切换「目录 | 书签」

## 底部栏布局

```
┌──────────────────────────────────────────────────┐
│  📋目录   🎨主题   A⁻ Aa A⁺   🔖书签   💬评论   │
└──────────────────────────────────────────────────┘
```

5 组均分，`justify-content: space-around`（保持现有布局方式）。

## 数据存储

| Key | 类型 | 说明 |
|-----|------|------|
| `readerTheme` | `string` | 当前主题名（`white`/`lightYellow`/`parchment`/`lightGray`/`darkGray`/`black`） |
| `readerBookmarks` | `Bookmark[]` | 书签数组 |

## 不涉及

- 后端改动（书签纯前端 localStorage）
- 自动滚动、TTS（本次不实现）
- 移动端自适应（桌面优先）
