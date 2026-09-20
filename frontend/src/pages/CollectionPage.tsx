import { queryKeys } from '../api/queryKeys'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useSearchParams } from 'react-router-dom'
import { getApiErrorMessage } from '../api/client'
import {
  getFavorites,
  getReadLater,
  updateFavorite,
  updateReadLater,
} from '../api/heritage'
import { AppShell } from '../components/AppShell'
import { PageError, PageLoading } from '../components/AsyncState'
import { HeritageCard } from '../components/HeritageCard'
import { Pagination } from '../components/Pagination'

export default function CollectionPage({
  kind,
}: {
  kind: 'favorites' | 'read-later'
}) {
  const queryClient = useQueryClient()
  const [searchParams, setSearchParams] = useSearchParams()
  const page = Math.max(1, Number(searchParams.get('page')) || 1)
  const isFavorites = kind === 'favorites'
  const collection = useQuery({
    queryKey: queryKeys.collections.page(kind, page),
    queryFn: () => (isFavorites ? getFavorites(page) : getReadLater(page)),
  })
  const remove = useMutation({
    mutationFn: (id: string) =>
      isFavorites ? updateFavorite(id, false) : updateReadLater(id, false),
    onSuccess: () => {
      if (collection.data?.items.length === 1 && page > 1) {
        setSearchParams({ page: String(page - 1) })
      }
      void queryClient.invalidateQueries({
        queryKey: queryKeys.collections.all(kind),
      })
      void queryClient.invalidateQueries({ queryKey: queryKeys.stats })
    },
  })

  const title = isFavorites ? 'お気に入り' : '後で読む'
  const description = isFavorites
    ? '特に好きな世界遺産を、いつでも読み返せます。'
    : 'まだ読んでいない、後で読みたい世界遺産です。読了すると自動的に外れます。'

  return (
    <AppShell>
      <section className="mx-auto min-h-[70vh] w-[min(1120px,calc(100%-48px))] py-14 max-[760px]:w-[calc(100%-32px)]">
        <p className="text-[0.65rem] font-extrabold tracking-[0.2em] text-[#b85635]">
          {isFavorites ? 'FAVORITE PLACES' : 'READ LATER'}
        </p>
        <h1 className="mt-3 font-serif text-[clamp(2.8rem,5vw,4.5rem)]">
          {title}
        </h1>
        <p className="mt-3 text-sm text-[#18352f]/60">{description}</p>

        {collection.isPending && <PageLoading />}
        {collection.isError && (
          <PageError
            message={getApiErrorMessage(collection.error)}
            onRetry={() => collection.refetch()}
          />
        )}
        {collection.data && !collection.data.items.length && (
          <div className="mt-12 border border-[#18352f]/15 bg-white/40 p-10 text-center">
            <p className="font-serif text-2xl">まだ登録されていません</p>
            <p className="mt-3 text-sm text-[#18352f]/55">
              世界遺産の記事上部にある「{title}」ボタンから追加できます。
            </p>
          </div>
        )}
        <div className="mt-10 grid grid-cols-3 gap-6 max-[900px]:grid-cols-2 max-[600px]:grid-cols-1">
          {collection.data?.items.map((site) => (
            <div key={site.uuid}>
              <HeritageCard site={site} />
              <button
                className="mt-2 w-full border border-[#18352f]/20 py-2 text-[0.65rem] text-[#18352f]/55 hover:border-[#b85635] hover:text-[#b85635]"
                disabled={remove.isPending}
                onClick={() => remove.mutate(site.uuid)}
                type="button"
              >
                {title}から外す
              </button>
            </div>
          ))}
        </div>
        {collection.data && (
          <Pagination
            onChange={(nextPage) =>
              setSearchParams(nextPage === 1 ? {} : { page: String(nextPage) })
            }
            page={collection.data.page}
            total={collection.data.total}
            totalPages={collection.data.totalPages}
          />
        )}
        {remove.isError && (
          <p className="mt-5 text-sm text-[#b85635]">
            {getApiErrorMessage(remove.error)}
          </p>
        )}
      </section>
    </AppShell>
  )
}
