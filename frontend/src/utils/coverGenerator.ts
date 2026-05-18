const CATEGORY_COLORS: Record<string, string> = {
  '玄幻': '#6366f1',
  '仙侠': '#8b5cf6',
  '都市': '#3b82f6',
  '历史': '#d97706',
  '科幻': '#06b6d4',
  '游戏': '#10b981',
  '悬疑': '#64748b',
  '言情': '#ec4899',
  '技术': '#0ea5e9',
  '文学': '#f59e0b',
}

export function getCoverColor(category?: string): string {
  if (category && CATEGORY_COLORS[category]) {
    return CATEGORY_COLORS[category]
  }
  return '#667eea'
}

function escapeXml(s: string): string {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;')
}

function wrapTitle(title: string): { lines: string[]; fontSize: number; lineHeight: number } {
  const cleaned = title.replace(/[《》「」『』]/g, '').trim()
  const len = cleaned.length

  if (len === 0) return { lines: ['书'], fontSize: 22, lineHeight: 30 }

  // 1-4字：单行大字
  if (len <= 4) {
    return { lines: [cleaned], fontSize: 22, lineHeight: 30 }
  }

  // 5-6字：两行，均分
  if (len <= 6) {
    const mid = Math.ceil(len / 2)
    return { lines: [cleaned.slice(0, mid), cleaned.slice(mid)], fontSize: 18, lineHeight: 26 }
  }

  // 7-9字：两行，小一点
  if (len <= 9) {
    const mid = Math.ceil(len / 2)
    return { lines: [cleaned.slice(0, mid), cleaned.slice(mid)], fontSize: 16, lineHeight: 24 }
  }

  // 10-12字：三行
  if (len <= 12) {
    const chunk = Math.ceil(len / 3)
    return {
      lines: [cleaned.slice(0, chunk), cleaned.slice(chunk, chunk * 2), cleaned.slice(chunk * 2)],
      fontSize: 15,
      lineHeight: 22,
    }
  }

  // 13-16字：三行小字
  if (len <= 16) {
    const chunk = Math.ceil(len / 3)
    return {
      lines: [cleaned.slice(0, chunk), cleaned.slice(chunk, chunk * 2), cleaned.slice(chunk * 2)],
      fontSize: 13,
      lineHeight: 19,
    }
  }

  // 17字以上：三行更小字
  const chunk = Math.ceil(len / 3)
  return {
    lines: [cleaned.slice(0, chunk), cleaned.slice(chunk, chunk * 2), cleaned.slice(chunk * 2)],
    fontSize: 11,
    lineHeight: 17,
  }
}

export interface CoverOptions {
  title: string
  author?: string
  category?: string
  width?: number
  height?: number
}

export function generateCoverSVG(options: CoverOptions): string {
  const { title, author, category, width = 200, height = 280 } = options
  const color = getCoverColor(category)
  const { lines, fontSize, lineHeight } = wrapTitle(title)
  const safeAuthor = escapeXml(author || '')
  const displayAuthor = safeAuthor.length > 8 ? safeAuthor.slice(0, 8) + '...' : safeAuthor

  const totalTextHeight = lines.length * lineHeight
  const titleYStart = Math.round((height - totalTextHeight) / 2) + 10

  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${width} ${height}" width="${width}" height="${height}">
  <defs>
    <linearGradient id="bg" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stop-color="${color}" stop-opacity="0.9"/>
      <stop offset="100%" stop-color="${color}" stop-opacity="0.7"/>
    </linearGradient>
    <linearGradient id="overlay" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stop-color="#fff" stop-opacity="0.12"/>
      <stop offset="40%" stop-color="#fff" stop-opacity="0"/>
      <stop offset="70%" stop-color="#000" stop-opacity="0"/>
      <stop offset="100%" stop-color="#000" stop-opacity="0.15"/>
    </linearGradient>
  </defs>
  <rect width="${width}" height="${height}" fill="url(#bg)"/>
  <rect width="${width}" height="${height}" fill="url(#overlay)"/>
  <circle cx="170" cy="50" r="80" fill="#fff" fill-opacity="0.06"/>
  <circle cx="30" cy="230" r="60" fill="#fff" fill-opacity="0.05"/>
  <line x1="30" y1="48" x2="170" y2="48" stroke="#fff" stroke-opacity="0.15" stroke-width="0.5"/>
  <line x1="30" y1="232" x2="170" y2="232" stroke="#fff" stroke-opacity="0.12" stroke-width="0.5"/>
  ${lines.map((line, i) =>
    `<text x="100" y="${titleYStart + i * lineHeight}" text-anchor="middle" font-family="Georgia, 'Noto Serif SC', 'Source Han Serif SC', serif" font-size="${fontSize}" font-weight="bold" fill="#fff" fill-opacity="0.95" letter-spacing="${line.length <= 2 ? '4' : '2'}">${escapeXml(line)}</text>`
  ).join('\n  ')}
  ${safeAuthor ? `<text x="100" y="${titleYStart + totalTextHeight + 14}" text-anchor="middle" font-family="-apple-system, 'PingFang SC', 'Microsoft YaHei', sans-serif" font-size="11" fill="#fff" fill-opacity="0.65">${displayAuthor}</text>` : ''}
  ${category ? `<text x="15" y="22" font-family="-apple-system, 'PingFang SC', 'Microsoft YaHei', sans-serif" font-size="10" fill="#fff" fill-opacity="0.6">${escapeXml(category)}</text>` : ''}
  <rect x="10" y="10" width="${width - 20}" height="${height - 20}" rx="4" fill="none" stroke="#fff" stroke-opacity="0.1" stroke-width="1"/>
</svg>`

  return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`
}
