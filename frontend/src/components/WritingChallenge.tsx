import { useMutation, useQuery } from '@tanstack/react-query'
import { useMemo, useState } from 'react'
import { recordPracticeAttempt } from '../api/practice'
import { getVocabulary } from '../api/vocabulary'
import {
  comparePracticeAnswer,
  normalizePracticeText,
  practiceSentences,
} from '../lib/practice'

export function WritingChallenge({
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
  const [translation, setTranslation] = useState<string>()
  const [translationPending, setTranslationPending] = useState(false)
  const [answer, setAnswer] = useState('')
  const [submitted, setSubmitted] = useState(false)
  const [hintsUsed, setHintsUsed] = useState(0)
  const sentence = sentences[index] ?? ''
  const translatedSentences = (translation ?? '')
    .split(/(?<=[。！？])\s*/)
    .map((item) => item.trim())
    .filter(Boolean)
  const promptJa = translatedSentences[index] ?? translation
  const result = submitted ? comparePracticeAnswer(answer, sentence) : undefined
  const saveAttempt = useMutation({
    mutationFn: () =>
      recordPracticeAttempt({
        heritageSiteId,
        type: 'writing',
        sourceSentenceEn: sentence,
        answerText: answer,
        score: result?.score ?? 0,
        hintsUsed,
        playbackCount: 0,
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

  async function begin() {
    setOpen(true)
    if (translation) return
    setTranslationPending(true)
    try {
      setTranslation(await onLoadTranslation())
    } finally {
      setTranslationPending(false)
    }
  }

  function next() {
    setIndex((value) => (value + 1) % sentences.length)
    setAnswer('')
    setSubmitted(false)
    setHintsUsed(0)
    saveAttempt.reset()
  }

  function retry() {
    setAnswer('')
    setSubmitted(false)
    setHintsUsed(0)
    saveAttempt.reset()
  }

  if (!sentences.length) return null
  const expectedWords = sentence.replace(/[.!?]/g, '').split(/\s+/)
  const keywords = comparePracticeAnswer('', sentence).keywords

  return (
    <section className="mt-5 border border-[#18352f]/15 bg-white/40 p-6">
      <button
        className="flex w-full items-center justify-between text-left"
        onClick={() => (open ? setOpen(false) : void begin())}
        type="button"
        aria-expanded={open}
      >
        <span>
          <span className="block text-[0.62rem] font-extrabold tracking-[0.18em] text-[#b85635]">
            WRITING CHALLENGE
          </span>
          <span className="mt-2 block font-serif text-2xl">
            日本語から英文を組み立てる
          </span>
        </span>
        <span aria-hidden="true">{open ? '−' : '＋'}</span>
      </button>

      {open && (
        <div className="mt-6 border-t border-[#18352f]/12 pt-5">
          {translationPending ? (
            <p className="text-sm text-[#18352f]/55">日本語訳を準備中…</p>
          ) : promptJa ? (
            <>
              <p className="text-xs font-bold text-[#18352f]/50">
                この内容を英語で再現してください
              </p>
              <p className="mt-3 border-l-4 border-[#c98c47] pl-4 text-sm leading-7 text-[#b85635]">
                {promptJa}
              </p>
            </>
          ) : (
            <div>
              <p className="text-sm text-[#b85635]">
                日本語訳を取得できませんでした。
              </p>
              <button
                className="mt-2 text-xs font-bold underline"
                onClick={() => void begin()}
                type="button"
              >
                再試行
              </button>
            </div>
          )}

          <div className="mt-5 flex flex-wrap gap-3 text-xs font-bold">
            <button
              className="text-[#b85635] underline disabled:opacity-40"
              disabled={hintsUsed >= 1}
              onClick={() => setHintsUsed(1)}
              type="button"
            >
              ヒント1: 単語数
            </button>
            <button
              className="text-[#b85635] underline disabled:opacity-40"
              disabled={hintsUsed >= 2}
              onClick={() => setHintsUsed(2)}
              type="button"
            >
              ヒント2: 頭文字
            </button>
            <button
              className="text-[#b85635] underline disabled:opacity-40"
              disabled={hintsUsed >= 3}
              onClick={() => setHintsUsed(3)}
              type="button"
            >
              ヒント3: 重要語彙
            </button>
            <button
              className="text-[#b85635] underline disabled:opacity-40"
              disabled={hintsUsed >= 4}
              onClick={() => setHintsUsed(4)}
              type="button"
            >
              ヒント4: 語順候補
            </button>
          </div>
          {hintsUsed >= 1 && (
            <p className="mt-2 text-xs">原文は{expectedWords.length}語です。</p>
          )}
          {hintsUsed >= 2 && (
            <p className="mt-2 font-mono text-xs tracking-[0.16em]">
              {expectedWords
                .map((word) => normalizePracticeText(word)[0])
                .join(' ')}
            </p>
          )}
          {hintsUsed >= 3 && (
            <p className="mt-2 text-xs">
              重要語彙: {keywords.length ? keywords.join(' / ') : 'なし'}
            </p>
          )}
          {hintsUsed >= 4 && (
            <p className="mt-2 text-xs leading-6 text-[#18352f]/60">
              {expectedWords
                .map((word, wordIndex) => (wordIndex % 3 === 0 ? word : '____'))
                .join(' ')}
            </p>
          )}

          <label className="mt-5 block text-xs font-bold">
            あなたの英文
            <textarea
              className="mt-2 min-h-32 w-full border border-[#18352f]/20 bg-[#fbf8f1] p-3 text-sm leading-7"
              onChange={(event) => setAnswer(event.target.value)}
              placeholder="Write the sentence in English..."
              value={answer}
            />
          </label>
          <button
            className="mt-3 bg-[#b85635] px-5 py-2.5 text-xs font-bold text-white disabled:opacity-40"
            disabled={!answer.trim() || submitted || !promptJa}
            onClick={() => setSubmitted(true)}
            type="button"
          >
            原文と比較
          </button>

          {result && (
            <div className="mt-6 border-l-4 border-[#c98c47] bg-[#fbf8f1] p-5">
              <div className="grid grid-cols-3 gap-4 max-[680px]:grid-cols-1">
                <div>
                  <span className="text-[0.62rem] font-bold text-[#18352f]/50">
                    原文との総合一致
                  </span>
                  <strong className="mt-1 block font-serif text-3xl">
                    {result.score}%
                  </strong>
                </div>
                <div>
                  <span className="text-[0.62rem] font-bold text-[#18352f]/50">
                    重要語彙
                  </span>
                  <strong className="mt-1 block font-serif text-3xl">
                    {result.matchedKeywords.length}/{result.keywords.length}
                  </strong>
                </div>
                <div>
                  <span className="text-[0.62rem] font-bold text-[#18352f]/50">
                    語順の近さ
                  </span>
                  <strong className="mt-1 block font-serif text-3xl">
                    {result.orderScore}%
                  </strong>
                </div>
              </div>
              <p className="mt-5 text-xs font-bold text-[#18352f]/50">
                UNESCO記事の原文
              </p>
              <p className="mt-2 text-sm leading-7">{sentence}</p>
              <div
                className="mt-3 flex flex-wrap gap-1"
                aria-label="原文との差分"
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
              <p className="mt-3 text-xs text-[#18352f]/55">
                この文の保存済み語彙:{' '}
                {savedExpressions.length
                  ? savedExpressions.join(' / ')
                  : 'まだありません'}
              </p>
              <p className="mt-4 text-xs leading-6 text-[#18352f]/55">
                この判定は原文の再現度を見るものです。完全一致しなくても、あなたの英文が文法的に誤りとは限りません。原文だけが唯一の正解表現ではありません。
              </p>
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
                <button
                  className="border border-[#18352f]/25 px-4 py-2.5 text-xs font-bold"
                  onClick={retry}
                  type="button"
                >
                  同じ文を再挑戦
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
