/**
 * Convert KeyboardEvent to Tauri shortcut string format
 * e.g. "CommandOrControl+Shift+Space"
 */
export function keyEventToShortcut(e: KeyboardEvent): string {
  e.preventDefault()
  e.stopPropagation()
  const parts: string[] = []
  if (e.metaKey) parts.push('Command')
  if (e.ctrlKey) parts.push('Control')
  if (e.altKey) parts.push('Alt')
  if (e.shiftKey) parts.push('Shift')

  const code = e.code
  if (!code || ['MetaLeft', 'MetaRight', 'ControlLeft', 'ControlRight', 'AltLeft', 'AltRight', 'ShiftLeft', 'ShiftRight'].includes(code)) {
    return ''
  }
  parts.push(code)

  return parts.join('+')
}

/**
 * Format shortcut for display (e.g. "⌘⇧Space")
 */
export function formatShortcutForDisplay(shortcut: string): string {
  return shortcut
    .replace(/CommandOrControl/g, navigator.platform.includes('Mac') ? '⌘' : 'Ctrl')
    .replace(/Command/g, '⌘')
    .replace(/Control/g, 'Ctrl')
    .replace(/Alt/g, '⌥')
    .replace(/Shift/g, '⇧')
    .replace(/Key([A-Z])/g, '$1')
    .replace(/Key([a-z])/g, (_, c) => c.toUpperCase())
    .replace(/Digit(\d)/g, '$1')
}
