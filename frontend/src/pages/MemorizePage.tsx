import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useCallback, useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { getApiErrorMessage } from '../api/client'
import { getVocabulary, updateVocabularyLearningState } from '../api/vocabulary'
import { AppShell } from '../components/AppShell'
import { PageError, PageLoading } from '../components/AsyncState'

export default function MemorizePage() {
  const queryClient = useQueryClient()
  const vocabulary = useQuery({
    queryKey: ['vocabulary', 'memorization'],
    queryFn: () => getVocabulary({ memorization: true, sort: 'oldest' }),
  })
  const [index, setIndex] = useState(0)
  const [revealed, setRevealed] = useState(false)
  const [completed, setCompleted] = useState(false)
  const [studiedCount, setStudiedCount] = useState(0)
  const cards = vocabulary.data ?? []
  const current = cards[index]

  const advance = useCallback(() => {
    if (!current || completed) return
    if (!revealed) {
      setRevealed(true)
      setStudiedCount((count) => count + 1)
      return
    }
    if (index >= cards.length - 1) {
      setCompleted(true)
      return
    }
    setIndex((value) => value + 1)
    setRevealed(false)
  }, [cards.length, completed, current, index, revealed])

  useEffect(() => {
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === 'Enter') {
        event.preventDefault()
        advance()
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [advance])

  const learnedMutation = useMutation({
    mutationFn: (id: number) =>
      updateVocabularyLearningState(id, { isInMemorization: false }),
    onSuccess: (_, id) => {
      queryClient.setQueryData(
        ['vocabulary', 'memorization'],
        cards.filter((card) => card.id !== id),
      )
      setRevealed(false)
      if (index >= cards.length - 1) setIndex(Math.max(0, index - 1))
      void queryClient.invalidateQueries({ queryKey: ['vocabulary'] })
      void queryClient.invalidateQueries({ queryKey: ['stats'] })
    },
  })

  function restart() {
    setIndex(0)
    setRevealed(false)
    setCompleted(false)
    setStudiedCount(0)
  }

  return (
    <AppShell>
      <section className="mx-auto grid min-h-[calc(100vh-160px)] w-[min(850px,calc(100%-48px))] place-items-center py-12 max-[760px]:w-[calc(100%-32px)]">
        {vocabulary.isPending && (
          <PageLoading label="暗記カードを準備しています" />
        )}
        {vocabulary.isError && (
          <PageError
            message={getApiErrorMessage(vocabulary.error)}
            onRetry={() => vocabulary.refetch()}
          />
        )}
        {vocabulary.data && !cards.length && (
          <div className="text-center">
            <p className="text-[0.65rem] font-extrabold tracking-[0.2em] text-[#b85635]">
              MEMORY CARDS
            </p>
            <h1 className="mt-4 font-serif text-4xl">暗記カードはありません</h1>
            <p className="mt-4 text-sm leading-7 text-[#18352f]/60">
              単語を保存すると自動的に暗記カードへ入ります。
              <br />
              単語帳から「暗記に戻す」こともできます。
            </p>
            <Link
              className="mt-7 inline-block bg-[#18352f] px-6 py-3 text-xs font-bold text-white"
              to="/random-heritage"
            >
              英文を読みに行く →
            </Link>
          </div>
        )}
        {cards.length > 0 && completed && (
          <div className="text-center">
            <p className="text-[0.65rem] font-extrabold tracking-[0.2em] text-[#b85635]">
              SESSION COMPLETE
            </p>
            <h1 className="mt-4 font-serif text-5xl">{studiedCount} 枚</h1>
            <p className="mt-4 text-sm text-[#18352f]/60">
              今回確認したカード数です。お疲れさまでした。
            </p>
            <button
              className="mt-7 bg-[#18352f] px-6 py-3 text-xs font-bold text-white"
              onClick={restart}
              type="button"
            >
              もう一周する
            </button>
          </div>
        )}
        {current && !completed && (
          <div className="w-full">
            <div className="mb-5 flex items-end justify-between gap-4">
              <div>
                <p className="text-[0.62rem] font-extrabold tracking-[0.18em] text-[#b85635]">
                  MEMORY CARDS
                </p>
                <h1 className="mt-2 font-serif text-3xl">タップして覚える</h1>
              </div>
              <p className="text-xs text-[#18352f]/50">
                {index + 1} / {cards.length}
              </p>
            </div>

            <button
              className="grid min-h-[420px] w-full place-items-center border border-[#18352f]/20 bg-white/55 p-10 text-center shadow-[12px_12px_0_rgb(201_140_71_/_20%)] focus-visible:outline-3 focus-visible:outline-[#b85635] max-[600px]:min-h-[340px]"
              onClick={advance}
              type="button"
            >
              <span>
                <span className="block font-serif text-[clamp(2.5rem,8vw,5rem)] leading-tight">
                  {current.expression}
                </span>
                {revealed ? (
                  <span className="mt-8 block border-t border-[#18352f]/15 pt-7 font-serif text-2xl text-[#b85635]">
                    {current.translationJa}
                  </span>
                ) : (
                  <span className="mt-9 block text-xs tracking-[0.1em] text-[#18352f]/45">
                    TAP OR PRESS ENTER TO REVEAL
                  </span>
                )}
              </span>
            </button>

            <div className="mt-7 flex flex-wrap items-center justify-between gap-3">
              <Link
                className="text-xs font-bold text-[#18352f]/50 underline"
                to="/vocabulary"
              >
                ← 単語帳へ
              </Link>
              <button
                className="border border-[#b85635] px-5 py-3 text-xs font-bold text-[#b85635] disabled:opacity-50"
                disabled={learnedMutation.isPending}
                onClick={() => learnedMutation.mutate(current.id)}
                type="button"
              >
                ✓ 覚えたので暗記から外す
              </button>
            </div>
            <p className="mt-4 text-center text-[0.65rem] leading-5 text-[#18352f]/45">
              「覚えた」を押しても「まだ不安」の状態は変わりません。
            </p>
            {learnedMutation.isError && (
              <p className="mt-3 text-center text-xs text-[#b85635]">
                {getApiErrorMessage(learnedMutation.error)}
              </p>
            )}
          </div>
        )}
      </section>
    </AppShell>
  )
}
