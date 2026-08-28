import { useCallback, useEffect, useMemo, useState } from 'react'

export function useSpeechSynthesis(text: string) {
  const supported = typeof window !== 'undefined' && 'speechSynthesis' in window
  const [status, setStatus] = useState<'idle' | 'playing' | 'paused'>('idle')
  const [rate, setRate] = useState(1)

  const voices = useMemo(
    () => (supported ? window.speechSynthesis.getVoices() : []),
    [supported],
  )

  const stop = useCallback(() => {
    if (!supported) return
    window.speechSynthesis.cancel()
    setStatus('idle')
  }, [supported])

  const play = useCallback(() => {
    if (!supported || !text.trim()) return

    if (status === 'paused') {
      window.speechSynthesis.resume()
      setStatus('playing')
      return
    }

    window.speechSynthesis.cancel()
    const utterance = new SpeechSynthesisUtterance(text)
    utterance.lang = 'en-US'
    utterance.rate = rate
    utterance.voice =
      voices.find((voice) => voice.lang === 'en-US') ??
      voices.find((voice) => voice.lang === 'en-GB') ??
      voices.find((voice) => voice.lang.startsWith('en')) ??
      null
    utterance.onend = () => setStatus('idle')
    utterance.onerror = () => setStatus('idle')
    window.speechSynthesis.speak(utterance)
    setStatus('playing')
  }, [rate, status, supported, text, voices])

  const pause = useCallback(() => {
    if (!supported || status !== 'playing') return
    window.speechSynthesis.pause()
    setStatus('paused')
  }, [status, supported])

  useEffect(() => stop, [stop, text])

  return { supported, status, rate, setRate, play, pause, stop }
}
