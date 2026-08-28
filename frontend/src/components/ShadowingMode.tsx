import { useEffect, useMemo, useRef, useState } from 'react'

export function ShadowingMode({ text }: { text: string }) {
  const sentences = useMemo(() => splitSentences(text), [text])
  const [open, setOpen] = useState(false)
  const [currentIndex, setCurrentIndex] = useState(0)
  const [playing, setPlaying] = useState(false)
  const [intervalSeconds, setIntervalSeconds] = useState(3)
  const [recording, setRecording] = useState(false)
  const [recordingUrl, setRecordingUrl] = useState<string | null>(null)
  const [recordingError, setRecordingError] = useState('')
  const recorderRef = useRef<MediaRecorder | null>(null)
  const streamRef = useRef<MediaStream | null>(null)
  const chunksRef = useRef<Blob[]>([])
  const timerRef = useRef<number | null>(null)

  useEffect(() => {
    return () => {
      window.speechSynthesis?.cancel()
      if (timerRef.current) window.clearTimeout(timerRef.current)
      streamRef.current?.getTracks().forEach((track) => track.stop())
      if (recordingUrl) URL.revokeObjectURL(recordingUrl)
    }
  }, [recordingUrl])

  function speak(index: number, continuePlaying = true) {
    if (!('speechSynthesis' in window) || !sentences[index]) return
    window.speechSynthesis.cancel()
    if (timerRef.current) window.clearTimeout(timerRef.current)
    setCurrentIndex(index)
    setPlaying(continuePlaying)
    const utterance = new SpeechSynthesisUtterance(sentences[index])
    utterance.lang = 'en-US'
    utterance.rate = 0.86
    utterance.onend = () => {
      if (!continuePlaying) return setPlaying(false)
      if (index >= sentences.length - 1) return setPlaying(false)
      timerRef.current = window.setTimeout(
        () => speak(index + 1, true),
        intervalSeconds * 1_000,
      )
    }
    utterance.onerror = () => setPlaying(false)
    window.speechSynthesis.speak(utterance)
  }

  function stop() {
    window.speechSynthesis?.cancel()
    if (timerRef.current) window.clearTimeout(timerRef.current)
    setPlaying(false)
  }

  async function startRecording() {
    setRecordingError('')
    if (!navigator.mediaDevices?.getUserMedia || !('MediaRecorder' in window)) {
      setRecordingError('このブラウザは音声録音に対応していません。')
      return
    }
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      const recorder = new MediaRecorder(stream)
      streamRef.current = stream
      recorderRef.current = recorder
      chunksRef.current = []
      recorder.ondataavailable = (event) => {
        if (event.data.size) chunksRef.current.push(event.data)
      }
      recorder.onstop = () => {
        const blob = new Blob(chunksRef.current, {
          type: recorder.mimeType || 'audio/webm',
        })
        if (recordingUrl) URL.revokeObjectURL(recordingUrl)
        setRecordingUrl(URL.createObjectURL(blob))
        stream.getTracks().forEach((track) => track.stop())
        streamRef.current = null
      }
      recorder.start()
      setRecording(true)
    } catch {
      setRecordingError(
        'マイクの利用が許可されませんでした。ブラウザ設定を確認してください。',
      )
    }
  }

  function stopRecording() {
    recorderRef.current?.stop()
    setRecording(false)
  }

  return (
    <section className="mt-5 border border-[#18352f]/15 bg-white/40 p-4">
      <button
        className="flex w-full items-center justify-between text-left"
        onClick={() => setOpen((value) => !value)}
        type="button"
        aria-expanded={open}
      >
        <span>
          <span className="block text-[0.58rem] font-extrabold tracking-[0.14em] text-[#b85635]">
            SHADOWING MODE
          </span>
          <span className="mt-1 block font-serif text-xl">
            一文ずつ聞いて声に出す
          </span>
        </span>
        <span>{open ? '−' : '+'}</span>
      </button>
      {open && (
        <div className="mt-5">
          <div className="flex flex-wrap items-center gap-2">
            <button
              className="bg-[#18352f] px-4 py-2.5 text-xs font-bold text-white"
              onClick={() => (playing ? stop() : speak(currentIndex, true))}
              type="button"
            >
              {playing ? '停止' : 'ここから連続再生'}
            </button>
            <button
              className="border border-[#18352f]/25 px-4 py-2.5 text-xs font-bold"
              onClick={() => speak(currentIndex, false)}
              type="button"
            >
              現在の文を繰り返す
            </button>
            <label className="ml-auto text-xs font-bold">
              文の間隔
              <select
                className="ml-2 border border-[#18352f]/20 bg-[#fbf8f1] px-2 py-2"
                onChange={(event) =>
                  setIntervalSeconds(Number(event.target.value))
                }
                value={intervalSeconds}
              >
                <option value={0}>なし</option>
                <option value={3}>3秒</option>
                <option value={5}>5秒</option>
              </select>
            </label>
          </div>
          <ol className="mt-5 max-h-72 space-y-2 overflow-y-auto pr-2">
            {sentences.map((sentence, index) => (
              <li key={`${sentence}-${index}`}>
                <button
                  className={`w-full border-l-4 px-4 py-3 text-left text-sm leading-7 ${index === currentIndex ? 'border-[#b85635] bg-[#e7c778]/22' : 'border-transparent'}`}
                  onClick={() => speak(index, false)}
                  type="button"
                >
                  {sentence}
                </button>
              </li>
            ))}
          </ol>
          <div className="mt-5 border-t border-[#18352f]/12 pt-5">
            <p className="text-xs font-bold">自分の音読を録音して聞き比べる</p>
            <div className="mt-3 flex flex-wrap items-center gap-3">
              <button
                className={`px-4 py-2.5 text-xs font-bold text-white ${recording ? 'bg-[#b85635]' : 'bg-[#315f4c]'}`}
                onClick={recording ? stopRecording : startRecording}
                type="button"
              >
                {recording ? '■ 録音を停止' : '● 録音を開始'}
              </button>
              {recordingUrl && <audio controls src={recordingUrl} />}
              {recordingUrl && (
                <button
                  className="text-xs font-bold text-[#b85635] underline"
                  onClick={() => {
                    URL.revokeObjectURL(recordingUrl)
                    setRecordingUrl(null)
                  }}
                  type="button"
                >
                  録音を削除
                </button>
              )}
            </div>
            <p className="mt-2 text-[0.62rem] text-[#18352f]/45">
              録音はサーバーへ送信せず、この画面を開いている間だけ保持します。
            </p>
            {recordingError && (
              <p className="mt-2 text-xs text-[#b85635]">{recordingError}</p>
            )}
          </div>
        </div>
      )}
    </section>
  )
}

function splitSentences(text: string) {
  return text
    .replace(/\s+/g, ' ')
    .trim()
    .split(/(?<=[.!?])\s+(?=[A-Z“"'])/)
    .map((sentence) => sentence.trim())
    .filter(Boolean)
}
