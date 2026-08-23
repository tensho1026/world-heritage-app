import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useState } from 'react'
import { Link } from 'react-router-dom'
import { getApiErrorMessage } from '../api/client'
import {
  deleteVocabulary,
  getVocabulary,
  updateVocabularyLearningState,
} from '../api/vocabulary'
import { AppShell } from '../components/AppShell'
import { PageError, PageLoading } from '../components/AsyncState'

type Filter = 'all' | 'memorization' | 'uncertain'

export default function VocabularyPage() {
  const [search, setSearch] = useState('')
  const [sort, setSort] = useState('newest')
  const [filter, setFilter] = useState<Filter>('all')
  const queryClient = useQueryClient()
  const vocabulary = useQuery({
    queryKey: ['vocabulary', search, sort, filter],
    queryFn: () =>
      getVocabulary({
        search: search || undefined,
        sort,
        memorization: filter === 'memorization' ? true : undefined,
        uncertain: filter === 'uncertain' ? true : undefined,
      }),
  })
  const stateMutation = useMutation({
    mutationFn: ({
      id,
      changes,
    }: {
      id: number
      changes: { isInMemorization?: boolean; isUncertain?: boolean }
    }) => updateVocabularyLearningState(id, changes),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['vocabulary'] })
      void queryClient.invalidateQueries({ queryKey: ['stats'] })
    },
  })
  const deleteMutation = useMutation({
    mutationFn: deleteVocabulary,
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['vocabulary'] })
      void queryClient.invalidateQueries({ queryKey: ['stats'] })
    },
  })

  return (
    <AppShell>
      <section className="mx-auto min-h-[70vh] w-[min(1050px,calc(100%-48px))] py-14 max-[760px]:w-[calc(100%-32px)]">
        <div className="flex flex-wrap items-end justify-between gap-5">
          <div>
            <p className="text-[0.65rem] font-extrabold tracking-[0.2em] text-[#b85635]">
              SAVED VOCABULARY
            </p>
            <h1 className="mt-3 font-serif text-[clamp(2.6rem,5vw,4.5rem)]">
              保存した英語表現
            </h1>
            <p className="mt-3 text-sm text-[#18352f]/60">
              暗記カードと「まだ不安」は別々に管理できます。
            </p>
          </div>
          <Link
            className="border border-[#18352f] bg-[#18352f] px-5 py-3 text-xs font-bold text-white"
            to="/memorize"
          >
            暗記カードを始める →
          </Link>
        </div>

        <div className="mt-10 grid grid-cols-[minmax(220px,1fr)_auto_auto] gap-3 max-[720px]:grid-cols-1">
          <label>
            <span className="sr-only">単語または訳を検索</span>
            <input
              className="h-11 w-full border border-[#18352f]/25 bg-white/50 px-4 text-sm outline-none focus:border-[#b85635]"
              onChange={(event) => setSearch(event.target.value)}
              placeholder="単語または訳を検索"
              type="search"
              value={search}
            />
          </label>
          <select
            className="h-11 border border-[#18352f]/25 bg-[#fbf8f1] px-3 text-xs"
            onChange={(event) => setSort(event.target.value)}
            value={sort}
            aria-label="並べ替え"
          >
            <option value="newest">新しい順</option>
            <option value="oldest">古い順</option>
            <option value="alphabetical">アルファベット順</option>
          </select>
          <select
            className="h-11 border border-[#18352f]/25 bg-[#fbf8f1] px-3 text-xs"
            onChange={(event) => setFilter(event.target.value as Filter)}
            value={filter}
            aria-label="状態で絞り込み"
          >
            <option value="all">すべて</option>
            <option value="memorization">暗記カード</option>
            <option value="uncertain">まだ不安</option>
          </select>
        </div>

        {vocabulary.isPending && (
          <PageLoading label="単語帳を読み込んでいます" />
        )}
        {vocabulary.isError && (
          <PageError
            message={getApiErrorMessage(vocabulary.error)}
            onRetry={() => vocabulary.refetch()}
          />
        )}
        {vocabulary.data && !vocabulary.data.length && (
          <div className="mt-12 border border-[#18352f]/15 bg-white/40 p-10 text-center">
            <p className="font-serif text-2xl">該当する表現はありません</p>
            <p className="mt-3 text-sm text-[#18352f]/55">
              世界遺産の記事で「単語を記録する」を使って追加できます。
            </p>
            <Link
              className="mt-5 inline-block text-sm font-bold text-[#b85635] underline"
              to="/random-heritage"
            >
              英文を読みに行く →
            </Link>
          </div>
        )}

        <div className="mt-8 space-y-4">
          {vocabulary.data?.map((item) => (
            <article
              className="border border-[#18352f]/15 bg-white/45 p-6"
              key={item.id}
            >
              <div className="flex flex-wrap items-start justify-between gap-5">
                <div>
                  <h2 className="font-serif text-2xl">{item.expression}</h2>
                  <p className="mt-2 text-base text-[#b85635]">
                    {item.translationJa}
                  </p>
                </div>
                <div className="flex flex-wrap gap-2">
                  <button
                    className={`border px-3 py-2 text-[0.68rem] font-bold ${item.isInMemorization ? 'border-[#c98c47] bg-[#c98c47]/15' : 'border-[#18352f]/20'}`}
                    disabled={stateMutation.isPending}
                    onClick={() =>
                      stateMutation.mutate({
                        id: item.id,
                        changes: {
                          isInMemorization: !item.isInMemorization,
                        },
                      })
                    }
                    type="button"
                  >
                    {item.isInMemorization
                      ? '暗記カードから外す'
                      : '暗記に戻す'}
                  </button>
                  <button
                    className={`border px-3 py-2 text-[0.68rem] font-bold ${item.isUncertain ? 'border-[#b85635] bg-[#b85635]/10 text-[#b85635]' : 'border-[#18352f]/20'}`}
                    disabled={stateMutation.isPending}
                    onClick={() =>
                      stateMutation.mutate({
                        id: item.id,
                        changes: { isUncertain: !item.isUncertain },
                      })
                    }
                    type="button"
                  >
                    {item.isUncertain ? 'まだ不安' : '理解済み'}
                  </button>
                </div>
              </div>

              <div className="mt-5 space-y-3 border-t border-[#18352f]/12 pt-4">
                {item.sources.map((source) => (
                  <div key={source.id}>
                    <p className="text-sm leading-7 text-[#18352f]/68">
                      {source.sourceSentenceEn}
                    </p>
                    <Link
                      className="mt-1 inline-block text-[0.65rem] font-bold text-[#b85635]"
                      to={`/heritage/${source.heritageSiteId}`}
                    >
                      {source.heritageNameEn} →
                    </Link>
                  </div>
                ))}
              </div>

              <div className="mt-5 flex items-center justify-between gap-4">
                <time className="text-[0.6rem] text-[#18352f]/40">
                  {new Date(item.createdAt).toLocaleDateString('ja-JP')} 保存
                </time>
                <button
                  className="text-[0.65rem] text-[#18352f]/45 underline hover:text-[#b85635]"
                  disabled={deleteMutation.isPending}
                  onClick={() => {
                    if (
                      window.confirm(
                        `「${item.expression}」を単語帳から削除しますか？`,
                      )
                    ) {
                      deleteMutation.mutate(item.id)
                    }
                  }}
                  type="button"
                >
                  削除
                </button>
              </div>
            </article>
          ))}
        </div>

        {(stateMutation.isError || deleteMutation.isError) && (
          <p className="mt-5 text-sm text-[#b85635]">
            {getApiErrorMessage(stateMutation.error ?? deleteMutation.error)}
          </p>
        )}
      </section>
    </AppShell>
  )
}
