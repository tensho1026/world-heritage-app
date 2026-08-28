import { useMutation, useQuery } from '@tanstack/react-query'
import { useMemo, useState } from 'react'
import { recordPracticeAttempt } from '../api/practice'
import { getVocabulary } from '../api/vocabulary'
import {
  comparePracticeAnswer,
  normalizePracticeText,
  practiceSentences,
} from '../lib/practice'

export function DictationPractice({
  heritageSiteId,
  text,
  onLoadTranslation,
}: {
  heritageSiteId: string
  text: string
  onLoadTranslation: () => Promise<string | undefined>
}) {
  const sentences = useMemo(() => practiceSentences(text), [text])
  const [open, setOpen] = useState(false)
  const [index, setIndex] = useState(0)
  const [answer, setAnswer] = useState('')
  const [submitted, setSubmitted] = useState(false)
  const [hintsUsed, setHintsUsed] = useState(0)
  const [playbackCount, setPlaybackCount] = useState(0)
  const [rate, setRate] = useState(0.85)
  const [paused, setPaused] = useState(false)
  const [translation, setTranslation] = useState<string>()
  const [translationPending, setTranslationPending] = useState(false)
  const sentence = sentences[index] ?? ''
  const translatedSentences = (translation ?? '')
    .split(/(?<=[。！？])\s*/)
    .map((item) => item.trim())
    .filter(Boolean)
  const translationJa = translatedSentences[index] ?? translation
  const result = submitted ? comparePracticeAnswer(answer, sentence) : undefined
  const speechAvailable =
    typeof window !== 'undefined' && 'speechSynthesis' in window
  const saveAttempt = useMutation({
    mutationFn: () =>
      recordPracticeAttempt({
        heritageSiteId,
        type: 'dictation',
        sourceSentenceEn: sentence,
        answerText: answer,
        score: result?.score ?? 0,
        hintsUsed,
        playbackCount,
      }),
  })
  const vocabulary = useQuery({
    queryKey: ['vocabulary', 'practice', heritageSiteId],
    queryFn: () => getVocabulary({ heritageSiteId }),
    enabled: open,
  })
  const savedExpressions = (vocabulary.data ?? [])
    .map((item) => item.expression)
    .filter((expression) =>
      normalizePracticeText(sentence).includes(
        normalizePracticeText(expression),
      ),
    )

  function play(words = sentence) {
    if (!speechAvailable || !words) return
    window.speechSynthesis.cancel()
    const utterance = new SpeechSynthesisUtterance(words)
    utterance.lang = 'en-US'
    utterance.rate = rate
    window.speechSynthesis.speak(utterance)
    setPaused(false)
    setPlaybackCount((value) => value + 1)
  }

  function togglePause() {
    if (!speechAvailable) return
    if (paused) {
      window.speechSynthesis.resume()
    } else {
      window.speechSynthesis.pause()
    }
    setPaused((value) => !value)
  }

  function next() {
    setIndex((value) => (value + 1) % sentences.length)
    setAnswer('')
    setSubmitted(false)
    setHintsUsed(0)
    setPlaybackCount(0)
    setTranslation(undefined)
    window.speechSynthesis?.cancel()
    setPaused(false)
    saveAttempt.reset()
  }

  async function loadTranslation() {
    setTranslationPending(true)
    try {
      setTranslation(await onLoadTranslation())
    } finally {
      setTranslationPending(false)
    }
  }

  if (!sentences.length) return null
  const words = sentence.split(/\s+/)
  const midpoint = Math.ceil(words.length / 2)

  return (
    <section className="mt-10 border border-[#18352f]/15 bg-white/40 p-6">
      <button
        className="flex w-full items-center justify-between text-left"
        onClick={() => setOpen((value) => !value)}
        type="button"
        aria-expanded={open}
      >
        <span>
          <span className="block text-[0.62rem] font-extrabold tracking-[0.18em] text-[#b85635]">
            DICTATION
          </span>
          <span className="mt-2 block font-serif text-2xl">
            音だけを頼りに一文を書き取る
          </span>
        </span>
        <span aria-hidden="true">{open ? '−' : '＋'}</span>
      </button>
      {open && (
        <div className="mt-6 border-t border-[#18352f]/12 pt-5">
          <p className="text-xs leading-6 text-[#18352f]/55">
            正解文は回答するまで隠れています。再生回数に制限はありません。
          </p>
          <div className="mt-4 flex flex-wrap items-center gap-2">
            <button
              className="bg-[#18352f] px-4 py-2.5 text-xs font-bold text-white disabled:opacity-40"
              disabled={!speechAvailable}
              onClick={() => play()}
              type="button"
            >
              ▶ 一文を再生
            </button>
            <button
              className="border border-[#18352f]/25 px-3 py-2.5 text-xs font-bold disabled:opacity-40"
              disabled={!speechAvailable}
              onClick={togglePause}
              type="button"
            >
              {paused ? '▶ 再開' : '⏸ 一時停止'}
            </button>
            <button
              className="border border-[#18352f]/25 px-3 py-2.5 text-xs font-bold disabled:opacity-40"
              disabled={!speechAvailable}
              onClick={() => play(words.slice(0, midpoint).join(' '))}
              type="button"
            >
              前半をリピート
            </button>
            <button
              className="border border-[#18352f]/25 px-3 py-2.5 text-xs font-bold disabled:opacity-40"
              disabled={!speechAvailable}
              onClick={() => play(words.slice(midpoint).join(' '))}
              type="button"
            >
              後半をリピート
            </button>
            <label className="text-xs font-bold">
              速度
              <select
                className="ml-2 border border-[#18352f]/20 bg-[#fbf8f1] px-2 py-2"
                onChange={(event) => setRate(Number(event.target.value))}
                value={rate}
              >
                <option value={0.65}>0.65</option>
                <option value={0.85}>0.85</option>
                <option value={1}>1.0</option>
                <option value={1.2}>1.2</option>
              </select>
            </label>
          </div>
          {!speechAvailable && (
            <p className="mt-3 text-xs text-[#b85635]">
              このブラウザでは英語の読み上げを利用できません。
            </p>
          )}

          <div className="mt-4 flex flex-wrap gap-2">
            <button
              className="text-xs font-bold text-[#b85635] underline"
              disabled={hintsUsed >= 1}
              onClick={() => setHintsUsed(1)}
              type="button"
            >
              ヒント1: 単語数
            </button>
            <button
              className="text-xs font-bold text-[#b85635] underline"
              disabled={hintsUsed >= 2}
              onClick={() => setHintsUsed(2)}
              type="button"
            >
              ヒント2: 頭文字
            </button>
            <button
              className="text-xs font-bold text-[#b85635] underline"
              disabled={hintsUsed >= 3}
              onClick={() => setHintsUsed(3)}
              type="button"
            >
              ヒント3: 保存済み語彙
            </button>
          </div>
          {hintsUsed >= 1 && (
            <p className="mt-2 text-xs">{words.length}語の英文です。</p>
          )}
          {hintsUsed >= 2 && (
            <p className="mt-2 font-mono text-xs tracking-[0.16em]">
              {words.map((word) => normalizePracticeText(word)[0]).join(' ')}
            </p>
          )}
          {hintsUsed >= 3 && (
            <p className="mt-2 text-xs">
              保存済み語彙:{' '}
              {savedExpressions.length
                ? savedExpressions.join(' / ')
                : 'この文に含まれる保存済み語彙はありません'}
            </p>
          )}

          <label className="mt-5 block text-xs font-bold">
            聞こえた英文
            <textarea
              className="mt-2 min-h-28 w-full border border-[#18352f]/20 bg-[#fbf8f1] p-3 text-sm leading-7"
              onChange={(event) => setAnswer(event.target.value)}
              placeholder="Type what you hear..."
              value={answer}
            />
          </label>
          <button
            className="mt-3 bg-[#b85635] px-5 py-2.5 text-xs font-bold text-white disabled:opacity-40"
            disabled={!answer.trim() || submitted}
            onClick={() => setSubmitted(true)}
            type="button"
          >
            答え合わせ
          </button>

          {result && (
            <div className="mt-6 border-l-4 border-[#c98c47] bg-[#fbf8f1] p-5">
              <strong className="font-serif text-3xl">
                一致率 {result.score}%
              </strong>
              <p className="mt-4 text-xs font-bold text-[#18352f]/50">正解文</p>
              <p className="mt-2 text-sm leading-7">{sentence}</p>
              <div
                className="mt-3 flex flex-wrap gap-1"
                aria-label="単語ごとの差分"
              >
                {result.comparison.map((item, wordIndex) => (
                  <span
                    className={`px-1.5 py-1 text-xs ${item.status === 'correct' ? 'bg-[#4f8871]/15 text-[#315f4c]' : 'bg-[#b85635]/12 text-[#b85635]'}`}
                    key={`${item.word}-${wordIndex}`}
                  >
                    {item.word}
                  </span>
                ))}
              </div>
              {translationJa ? (
                <p className="mt-4 border-t border-[#18352f]/10 pt-4 text-sm leading-7 text-[#b85635]">
                  {translationJa}
                </p>
              ) : (
                <button
                  className="mt-4 text-xs font-bold text-[#b85635] underline"
                  disabled={translationPending}
                  onClick={() => void loadTranslation()}
                  type="button"
                >
                  {translationPending ? '翻訳中…' : '日本語訳を確認'}
                </button>
              )}
              <div className="mt-5 flex flex-wrap gap-3">
                <button
                  className="bg-[#18352f] px-4 py-2.5 text-xs font-bold text-white disabled:opacity-40"
                  disabled={saveAttempt.isPending || saveAttempt.isSuccess}
                  onClick={() => saveAttempt.mutate()}
                  type="button"
                >
                  {saveAttempt.isSuccess ? '学習記録に保存済み' : '結果を記録'}
                </button>
                <button
                  className="border border-[#18352f]/25 px-4 py-2.5 text-xs font-bold"
                  onClick={next}
                  type="button"
                >
                  次の一文
                </button>
                <a
                  className="border border-[#18352f]/25 px-4 py-2.5 text-xs font-bold"
                  href="#about-site"
                >
                  元の記事へ
                </a>
              </div>
              {saveAttempt.isError && (
                <p className="mt-3 text-xs text-[#b85635]">
                  結果を保存できませんでした。もう一度お試しください。
                </p>
              )}
            </div>
          )}
        </div>
      )}
    </section>
  )
}
