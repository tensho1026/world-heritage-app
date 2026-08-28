export function SpeakButton({ text, label }: { text: string; label: string }) {
  const supported = typeof window !== 'undefined' && 'speechSynthesis' in window

  function speak() {
    if (!supported) return
    window.speechSynthesis.cancel()
    const utterance = new SpeechSynthesisUtterance(text)
    utterance.lang = 'en-US'
    const voices = window.speechSynthesis.getVoices()
    utterance.voice =
      voices.find((voice) => voice.lang === 'en-US') ??
      voices.find((voice) => voice.lang.startsWith('en')) ??
      null
    window.speechSynthesis.speak(utterance)
  }

  return (
    <button
      className="shrink-0 rounded-full border border-[#18352f]/20 px-2.5 py-1.5 text-[0.62rem] text-[#18352f]/55 hover:border-[#b85635] hover:text-[#b85635] disabled:opacity-35"
      disabled={!supported}
      onClick={speak}
      type="button"
      aria-label={label}
      title={supported ? label : 'このブラウザは読み上げに対応していません'}
    >
      ▶ 音声
    </button>
  )
}
