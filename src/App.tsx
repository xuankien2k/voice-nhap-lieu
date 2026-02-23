import { useState, useEffect, useRef, useCallback } from 'react'
import { listen } from '@tauri-apps/api/event'
import { invoke } from '@tauri-apps/api/core'
import { writeText } from '@tauri-apps/plugin-clipboard-manager'
import './App.css'

type OutputMode = 'clipboard' | 'type'

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
  const [outputMode, setOutputMode] = useState<OutputMode>('clipboard')
  const [isRecording, setIsRecording] = useState(false)
  const [status, setStatus] = useState<string>('Sẵn sàng')
  const [transcript, setTranscript] = useState('')
  const [error, setError] = useState<string | null>(null)
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
          await writeText(trimmed)
          setStatus('Đã lưu vào clipboard!')
        } else {
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

  useEffect(() => {
    const unlisten = listen('toggle-record', () => {
      toggleRecording()
    })
    return () => {
      unlisten.then((fn) => fn())
    }
  }, [toggleRecording])

  return (
    <div className="app">
      <header className="header">
        <h1>🎤 Voice Nhập Liệu</h1>
        <p className="subtitle">Nhấn phím tắt hoặc nút bên dưới để bắt đầu thu âm</p>
        <kbd className="hotkey">⌘⇧Space</kbd>
        <span className="hotkey-hint">(Ctrl+Shift+Space trên Windows)</span>
      </header>

      <section className="options">
        <h2>Chọn cách xuất văn bản:</h2>
        <div className="option-group">
          <label className={`option ${outputMode === 'clipboard' ? 'active' : ''}`}>
            <input
              type="radio"
              name="output"
              value="clipboard"
              checked={outputMode === 'clipboard'}
              onChange={() => setOutputMode('clipboard')}
            />
            <span className="option-icon">📋</span>
            <span>Lưu vào khay nhớ tạm</span>
            <span className="option-desc">Sao chép văn bản vào clipboard, sau đó dán (⌘V/Ctrl+V) vào vị trí mong muốn</span>
          </label>
          <label className={`option ${outputMode === 'type' ? 'active' : ''}`}>
            <input
              type="radio"
              name="output"
              value="type"
              checked={outputMode === 'type'}
              onChange={() => setOutputMode('type')}
            />
            <span className="option-icon">⌨️</span>
            <span>Tự động nhập tại vị trí con trỏ</span>
            <span className="option-desc">Gõ trực tiếp vào Excel, Word, VSCode... tại vị trí con trỏ chuột</span>
          </label>
        </div>
      </section>

      <section className="control">
        <button
          className={`record-btn ${isRecording ? 'recording' : ''}`}
          onClick={toggleRecording}
          disabled={!SpeechRecognitionAPI}
        >
          {isRecording ? (
            <>
              <span className="pulse" />
              Đang thu âm... Nhấn lại để dừng
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
          <strong>Lưu ý macOS:</strong> Với chế độ "Tự động nhập", cần cấp quyền <strong>Accessibility</strong> trong
          System Settings → Privacy & Security.
        </p>
      </footer>
    </div>
  )
}

export default App
