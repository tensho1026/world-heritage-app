import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useCallback, useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { getApiErrorMessage } from '../api/client'
import {
  getDueVocabulary,
  getReviewSummary,
  recordVocabularyReview,
  updateVocabularyLearningState,
} from '../api/vocabulary'
import { AppShell } from '../components/AppShell'
import { PageError, PageLoading } from '../components/AsyncState'
import type { ReviewRating, SavedVocabulary } from '../types'

const ratings: Array<{
  value: ReviewRating
  label: string
  hint: string
  className: string
}> = [
  {
    value: 'again',
    label: '覚えていない',
    hint: '10分後',
    className: 'border-[#b85635] text-[#b85635]',
  },
  {
    value: 'hard',
    label: '少し不安',
    hint: '約1日後',
    className: 'border-[#c98c47] text-[#93622c]',
  },
  {
    value: 'good',
    label: '覚えた',
    hint: '間隔を延長',
    className: 'border-[#315f4c] bg-[#315f4c] text-white',
  },
]

export default function MemorizePage() {
  const queryClient = useQueryClient()
  const vocabulary = useQuery({
    queryKey: ['vocabulary', 'due'],
    queryFn: getDueVocabulary,
  })
  const summary = useQuery({
    queryKey: ['review-summary'],
    queryFn: getReviewSummary,
  })
  const [revealed, setRevealed] = useState(false)
  const [completedCount, setCompletedCount] = useState(0)
  const [sessionComplete, setSessionComplete] = useState(false)
  const cards = vocabulary.data ?? []
  const current = cards[0]

  const removeCard = useCallback(
    (id: number) => {
      queryClient.setQueryData<SavedVocabulary[]>(
        ['vocabulary', 'due'],
        (items) => items?.filter((item) => item.id !== id) ?? [],
      )
      setRevealed(false)
      setCompletedCount((count) => count + 1)
      if (cards.length === 1) setSessionComplete(true)
    },
    [cards.length, queryClient],
  )

  const reviewMutation = useMutation({
    mutationFn: ({ id, rating }: { id: number; rating: ReviewRating }) =>
      recordVocabularyReview(id, rating),
    onSuccess: (_, variables) => {
      removeCard(variables.id)
      void queryClient.invalidateQueries({ queryKey: ['review-summary'] })
      void queryClient.invalidateQueries({ queryKey: ['vocabulary'] })
      void queryClient.invalidateQueries({ queryKey: ['stats'] })
    },
  })

  const removeFromMemorization = useMutation({
    mutationFn: (id: number) =>
      updateVocabularyLearningState(id, { isInMemorization: false }),
    onSuccess: (_, id) => {
      removeCard(id)
      void queryClient.invalidateQueries({ queryKey: ['review-summary'] })
      void queryClient.invalidateQueries({ queryKey: ['vocabulary'] })
      void queryClient.invalidateQueries({ queryKey: ['stats'] })
    },
  })

  const advance = useCallback(() => {
    if (!current || sessionComplete || reviewMutation.isPending) return
    if (!revealed) {
      setRevealed(true)
      return
    }
    reviewMutation.mutate({ id: current.id, rating: 'good' })
  }, [current, revealed, reviewMutation, sessionComplete])

  useEffect(() => {
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key !== 'Enter') return
      const target = event.target
      if (
        target instanceof HTMLElement &&
        target.closest('a, button, input, select, textarea') &&
        !target.closest('[data-memory-card]')
      ) {
        return
      }
      event.preventDefault()
      advance()
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [advance])

  function restart() {
    setCompletedCount(0)
    setSessionComplete(false)
    setRevealed(false)
    void vocabulary.refetch()
    void summary.refetch()
  }

  const error = reviewMutation.error ?? removeFromMemorization.error

  return (
    <AppShell>
      <section className="mx-auto min-h-[calc(100vh-160px)] w-[min(850px,calc(100%-48px))] py-12 max-[760px]:w-[calc(100%-32px)]">
        <div className="mb-8 grid grid-cols-3 gap-px bg-[#18352f]/15">
          {[
            ['今日の復習', summary.data?.dueToday ?? '—'],
            ['今日完了', summary.data?.reviewedToday ?? '—'],
            ['7日以内', summary.data?.upcomingWeek ?? '—'],
          ].map(([label, value]) => (
            <div className="bg-[#fbf8f1] p-4 text-center" key={label}>
              <strong className="block font-serif text-2xl">{value}</strong>
              <span className="text-[0.62rem] text-[#18352f]/50">{label}</span>
            </div>
          ))}
        </div>

        {vocabulary.isPending && (
          <PageLoading label="今日の復習カードを準備しています" />
        )}
        {vocabulary.isError && (
          <PageError
            message={getApiErrorMessage(vocabulary.error)}
            onRetry={() => vocabulary.refetch()}
          />
        )}
        {vocabulary.data && !cards.length && !sessionComplete && (
          <div className="py-20 text-center">
            <p className="text-[0.65rem] font-extrabold tracking-[0.2em] text-[#b85635]">
              SPACED REPETITION
            </p>
            <h1 className="mt-4 font-serif text-4xl">今日の復習は完了です</h1>
            <p className="mt-4 text-sm leading-7 text-[#18352f]/60">
              次の復習日は回答に応じて自動調整されます。
            </p>
            <Link
              className="mt-7 inline-block bg-[#18352f] px-6 py-3 text-xs font-bold text-white"
              to="/random-heritage"
            >
              英文を読みに行く →
            </Link>
          </div>
        )}
        {sessionComplete && (
          <div className="py-20 text-center">
            <p className="text-[0.65rem] font-extrabold tracking-[0.2em] text-[#b85635]">
              SESSION COMPLETE
            </p>
            <h1 className="mt-4 font-serif text-5xl">{completedCount} 枚</h1>
            <p className="mt-4 text-sm text-[#18352f]/60">
              今日の復習結果から次回の出題日を設定しました。
            </p>
            <button
              className="mt-7 bg-[#18352f] px-6 py-3 text-xs font-bold text-white"
              onClick={restart}
              type="button"
            >
              未完了カードを再確認
            </button>
          </div>
        )}
        {current && !sessionComplete && (
          <div className="w-full">
            <div className="mb-5 flex items-end justify-between gap-4">
              <div>
                <p className="text-[0.62rem] font-extrabold tracking-[0.18em] text-[#b85635]">
                  SPACED REPETITION
                </p>
                <h1 className="mt-2 font-serif text-3xl">忘れる前に思い出す</h1>
              </div>
              <p className="text-xs text-[#18352f]/50">
                残り {cards.length} 枚
              </p>
            </div>

            <button
              className="grid min-h-[420px] w-full place-items-center border border-[#18352f]/20 bg-white/55 p-10 text-center shadow-[12px_12px_0_rgb(201_140_71_/_20%)] focus-visible:outline-3 focus-visible:outline-[#b85635] max-[600px]:min-h-[340px]"
              data-memory-card="true"
              disabled={reviewMutation.isPending}
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

            {revealed && (
              <div className="mt-6 grid grid-cols-3 gap-3 max-[620px]:grid-cols-1">
                {ratings.map((rating) => (
                  <button
                    className={`border px-4 py-3 text-xs font-bold disabled:opacity-50 ${rating.className}`}
                    disabled={reviewMutation.isPending}
                    key={rating.value}
                    onClick={() =>
                      reviewMutation.mutate({
                        id: current.id,
                        rating: rating.value,
                      })
                    }
                    type="button"
                  >
                    <span className="block">{rating.label}</span>
                    <span className="mt-1 block text-[0.58rem] opacity-65">
                      {rating.hint}
                    </span>
                  </button>
                ))}
              </div>
            )}

            <div className="mt-7 flex flex-wrap items-center justify-between gap-3">
              <Link
                className="text-xs font-bold text-[#18352f]/50 underline"
                to="/vocabulary"
              >
                ← 単語帳へ
              </Link>
              <button
                className="text-xs font-bold text-[#18352f]/45 underline disabled:opacity-50"
                disabled={removeFromMemorization.isPending}
                onClick={() => removeFromMemorization.mutate(current.id)}
                type="button"
              >
                この表現を暗記対象から外す
              </button>
            </div>
            <p className="mt-4 text-center text-[0.65rem] leading-5 text-[#18352f]/45">
              「覚えた」は次回間隔を延ばします。暗記対象から外す操作とは独立しています。
            </p>
            {error && (
              <p className="mt-3 text-center text-xs text-[#b85635]">
                {getApiErrorMessage(error)}
              </p>
            )}
          </div>
        )}
      </section>
    </AppShell>
  )
}
