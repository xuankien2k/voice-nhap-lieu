import { useState, useEffect, useRef, useCallback } from 'react'
import { invoke, isTauri } from '@tauri-apps/api/core'
import { writeText } from '@tauri-apps/plugin-clipboard-manager'
import { register, unregister } from '@tauri-apps/plugin-global-shortcut'
import { useSettings, type OutputMode, type RecordingMode } from './hooks/useSettings'
import { keyEventToShortcut, formatShortcutForDisplay } from './utils/hotkey'
import './App.css'

// Web Speech API types
interface SpeechRecognitionEvent extends Event {
  results: SpeechRecognitionResultList
  resultIndex: number
}

interface SpeechRecognitionResultList {
  length: number
  item(index: number): SpeechRecognitionResult
  [index: number]: SpeechRecognitionResult
}

interface SpeechRecognitionResult {
  isFinal: boolean
  length: number
  item(index: number): SpeechRecognitionAlternative
  [index: number]: SpeechRecognitionAlternative
}

interface SpeechRecognitionAlternative {
  transcript: string
  confidence: number
}

interface SpeechRecognition extends EventTarget {
  continuous: boolean
  interimResults: boolean
  lang: string
  start(): void
  stop(): void
  abort(): void
  onresult: ((event: SpeechRecognitionEvent) => void) | null
  onerror: ((event: Event) => void) | null
  onend: (() => void) | null
}

declare global {
  interface Window {
    SpeechRecognition: new () => SpeechRecognition
    webkitSpeechRecognition: new () => SpeechRecognition
  }
}

const SpeechRecognitionAPI = window.SpeechRecognition || window.webkitSpeechRecognition

function App() {
  const { settings, loaded, updateSetting } = useSettings()
  const { outputMode, recordingMode, hotkey } = settings

  const [showSettings, setShowSettings] = useState(false)
  const [isRecording, setIsRecording] = useState(false)
  const [status, setStatus] = useState<string>('Sẵn sàng')
  const [transcript, setTranscript] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [capturingHotkey, setCapturingHotkey] = useState(false)
  const [hotkeyError, setHotkeyError] = useState<string | null>(null)
  const recognitionRef = useRef<SpeechRecognition | null>(null)
  const finalTranscriptRef = useRef('')
  const shouldProcessRef = useRef(false)

  const processResult = useCallback(
    async (text: string) => {
      const trimmed = text.trim()
      if (!trimmed) {
        setStatus('Không có văn bản để xử lý')
        return
      }

      setStatus('Đang xử lý...')

      try {
        if (outputMode === 'clipboard') {
          if (isTauri() && typeof writeText === 'function') {
            await writeText(trimmed)
          } else if (navigator.clipboard?.writeText) {
            await navigator.clipboard.writeText(trimmed)
          } else {
            throw new Error('Không thể truy cập clipboard.')
          }
          setStatus('Đã lưu vào clipboard!')
        } else {
          if (!isTauri() || typeof invoke !== 'function') {
            throw new Error('Chế độ "Tự động nhập" chỉ hoạt động khi chạy ứng dụng Tauri (npm run tauri dev).')
          }
          await invoke('simulate_keyboard_type', { text: trimmed })
          setStatus('Đã nhập tại vị trí con trỏ!')
        }
      } catch (err) {
        const msg = err instanceof Error ? err.message : String(err)
        setError(msg)
        setStatus('Lỗi: ' + msg)
        if (outputMode === 'type') {
          setError(
            msg + '\n\nTrên macOS: Vào System Settings > Privacy & Security > Accessibility và thêm quyền cho ứng dụng.'
          )
        }
      }
    },
    [outputMode]
  )

  const stopRecording = useCallback(() => {
    const recognition = recognitionRef.current
    if (recognition) {
      shouldProcessRef.current = true
      recognition.stop()
    }
  }, [])

  const startRecording = useCallback(() => {
    if (!SpeechRecognitionAPI) {
      setError('Trình duyệt không hỗ trợ nhận diện giọng nói. Vui lòng dùng Chrome hoặc Safari.')
      return
    }

    setError(null)
    setTranscript('')
    finalTranscriptRef.current = ''

    const recognition = new SpeechRecognitionAPI()
    recognition.continuous = true
    recognition.interimResults = true
    recognition.lang = 'vi-VN'

    recognition.onresult = (event: SpeechRecognitionEvent) => {
      let interimTranscript = ''
      for (let i = event.resultIndex; i < event.results.length; i++) {
        const result = event.results[i]
        const alt = result[0]
        if (result.isFinal) {
          finalTranscriptRef.current += alt.transcript
        } else {
          interimTranscript += alt.transcript
        }
      }
      setTranscript(finalTranscriptRef.current + interimTranscript)
    }

    recognition.onerror = (event: Event) => {
      const e = event as unknown as { error: string; message: string }
      if (e.error === 'not-allowed') {
        setError('Bị từ chối quyền microphone. Vui lòng cấp quyền trong Settings.')
      } else {
        setError(e.message || 'Lỗi nhận diện giọng nói')
      }
      setIsRecording(false)
      setStatus('Lỗi')
    }

    recognition.onend = () => {
      if (shouldProcessRef.current) {
        shouldProcessRef.current = false
        const text = finalTranscriptRef.current.trim()
        if (text) {
          processResult(text)
        } else {
          setStatus('Không nhận diện được giọng nói')
        }
      }
      setIsRecording(false)
    }

    recognitionRef.current = recognition
    recognition.start()
    setIsRecording(true)
    setStatus('Đang thu âm... Nói vào microphone')
  }, [processResult])

  const toggleRecording = useCallback(() => {
    if (isRecording) {
      stopRecording()
    } else {
      startRecording()
    }
  }, [isRecording, startRecording, stopRecording])

  const handlerRef = useRef<{
    recordingMode: RecordingMode
    startRecording: () => void
    stopRecording: () => void
    toggleRecording: () => void
    isRecording: boolean
  }>({ recordingMode, startRecording, stopRecording, toggleRecording, isRecording: false })
  handlerRef.current = { recordingMode, startRecording, stopRecording, toggleRecording, isRecording }

  useEffect(() => {
    if (!isTauri() || !loaded || !hotkey) return
    const shortcut = hotkey
    register(shortcut, (event) => {
      const { recordingMode: mode, startRecording: start, stopRecording: stop, toggleRecording: toggle, isRecording: rec } = handlerRef.current
      if (event.state === 'Pressed' || event.state === 'Released') {
        if (mode === 'push-to-talk') {
          if (event.state === 'Pressed') {
            if (!rec) start()
          } else {
            if (rec) stop()
          }
        } else {
          if (event.state === 'Pressed') toggle()
        }
      }
    }).catch((err) => {
      console.error('Failed to register shortcut:', err)
      setHotkeyError('Không thể đăng ký phím tắt. Thử tổ hợp khác.')
    })
    return () => {
      unregister(shortcut).catch(() => {})
    }
  }, [hotkey, loaded])

  useEffect(() => {
    if (!capturingHotkey) return
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setCapturingHotkey(false)
        setHotkeyError(null)
        e.preventDefault()
        return
      }
      const shortcut = keyEventToShortcut(e)
      if (shortcut) {
        updateSetting('hotkey', shortcut)
        setCapturingHotkey(false)
        setHotkeyError(null)
      }
    }
    window.addEventListener('keydown', onKeyDown, { capture: true })
    return () => window.removeEventListener('keydown', onKeyDown, { capture: true })
  }, [capturingHotkey, updateSetting])

  return (
    <div className="app">
      <header className="header">
        <h1>🎤 Voice Nhập Liệu</h1>
        <p className="subtitle">
          {recordingMode === 'push-to-talk'
            ? 'Giữ phím tắt để nói, thả ra để lưu/nhập'
            : 'Nhấn phím tắt hoặc nút để bắt đầu thu âm'}
        </p>
        <div className="hotkey-row">
          <kbd className="hotkey">{formatShortcutForDisplay(hotkey)}</kbd>
          <button
            type="button"
            className="settings-btn"
            onClick={() => setShowSettings(!showSettings)}
            title="Cài đặt"
          >
            ⚙️ Cài đặt
          </button>
        </div>
      </header>

      {showSettings && (
        <section className="settings">
          <h2>⚙️ Cài đặt</h2>

          <div className="setting-group">
            <label>Chế độ thu âm</label>
            <div className="radio-group">
              <label className={`option ${recordingMode === 'toggle' ? 'active' : ''}`}>
                <input
                  type="radio"
                  name="recordingMode"
                  value="toggle"
                  checked={recordingMode === 'toggle'}
                  onChange={() => updateSetting('recordingMode', 'toggle' as RecordingMode)}
                />
                <span>Toggle</span>
                <span className="option-desc">Nhấn để bật, nhấn lại để tắt</span>
              </label>
              <label className={`option ${recordingMode === 'push-to-talk' ? 'active' : ''}`}>
                <input
                  type="radio"
                  name="recordingMode"
                  value="push-to-talk"
                  checked={recordingMode === 'push-to-talk'}
                  onChange={() => updateSetting('recordingMode', 'push-to-talk' as RecordingMode)}
                />
                <span>Push-to-talk</span>
                <span className="option-desc">Giữ phím để nói, thả ra để lưu/nhập</span>
              </label>
            </div>
          </div>

          <div className="setting-group">
            <label>Phím tắt thu âm</label>
            <div className="hotkey-setting">
              <kbd className="hotkey-display">{formatShortcutForDisplay(hotkey)}</kbd>
              {isTauri() && (
                <button
                    type="button"
                    className={`capture-btn ${capturingHotkey ? 'capturing' : ''}`}
                    onClick={() => {
                      setCapturingHotkey(true)
                      setHotkeyError(null)
                    }}
                    disabled={capturingHotkey}
                  >
                    {capturingHotkey ? 'Nhấn tổ hợp phím... (Esc hủy)' : 'Đổi phím tắt'}
                  </button>
              )}
            </div>
            {hotkeyError && <p className="hotkey-error">{hotkeyError}</p>}
          </div>

          <div className="setting-group">
            <label>Cách xuất văn bản</label>
            <div className="radio-group">
              <label className={`option ${outputMode === 'clipboard' ? 'active' : ''}`}>
                <input
                  type="radio"
                  name="output"
                  value="clipboard"
                  checked={outputMode === 'clipboard'}
                  onChange={() => updateSetting('outputMode', 'clipboard' as OutputMode)}
                />
                <span>📋 Lưu vào clipboard</span>
              </label>
              <label className={`option ${outputMode === 'type' ? 'active' : ''}`}>
                <input
                  type="radio"
                  name="output"
                  value="type"
                  checked={outputMode === 'type'}
                  onChange={() => updateSetting('outputMode', 'type' as OutputMode)}
                />
                <span>⌨️ Tự động nhập tại con trỏ</span>
              </label>
            </div>
          </div>
        </section>
      )}

      {!showSettings && (
        <section className="options">
          <h2>Chọn cách xuất văn bản:</h2>
          <div className="option-group">
            <label className={`option ${outputMode === 'clipboard' ? 'active' : ''}`}>
              <input
                type="radio"
                name="output"
                value="clipboard"
                checked={outputMode === 'clipboard'}
                onChange={() => updateSetting('outputMode', 'clipboard' as OutputMode)}
              />
              <span className="option-icon">📋</span>
              <span>Lưu vào khay nhớ tạm</span>
              <span className="option-desc">Sao chép văn bản vào clipboard, sau đó dán (⌘V/Ctrl+V)</span>
            </label>
            <label className={`option ${outputMode === 'type' ? 'active' : ''}`}>
              <input
                type="radio"
                name="output"
                value="type"
                checked={outputMode === 'type'}
                onChange={() => updateSetting('outputMode', 'type' as OutputMode)}
              />
              <span className="option-icon">⌨️</span>
              <span>Tự động nhập tại vị trí con trỏ</span>
              <span className="option-desc">Gõ trực tiếp vào Excel, Word, VSCode...</span>
            </label>
          </div>
        </section>
      )}

      <section className="control">
        <button
          className={`record-btn ${isRecording ? 'recording' : ''}`}
          onClick={toggleRecording}
          disabled={!SpeechRecognitionAPI}
        >
          {isRecording ? (
            <>
              <span className="pulse" />
              Đang thu âm... {recordingMode === 'toggle' ? 'Nhấn lại để dừng' : 'Thả phím để dừng'}
            </>
          ) : (
            <>Bắt đầu thu âm</>
          )}
        </button>
        <p className="status">{status}</p>
      </section>

      {(transcript || error) && (
        <section className="result">
          {error && (
            <div className="error">
              <strong>⚠️ Lỗi:</strong> {error}
            </div>
          )}
          {transcript && (
            <div className="transcript">
              <strong>Văn bản nhận diện:</strong>
              <p>{transcript}</p>
            </div>
          )}
        </section>
      )}

      <footer className="footer">
        <p>
          <strong>Lưu ý macOS:</strong> Chế độ &quot;Tự động nhập&quot; cần quyền <strong>Accessibility</strong> trong
          System Settings → Privacy & Security.
        </p>
      </footer>
    </div>
  )
}

export default App
