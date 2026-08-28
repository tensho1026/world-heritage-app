import { useQuery } from '@tanstack/react-query'
import { Link } from 'react-router-dom'
import { getThemes } from '../api/discovery'
import { AppShell } from '../components/AppShell'
import { PageError, PageLoading } from '../components/AsyncState'

export default function ThemesPage() {
  const themes = useQuery({ queryKey: ['themes'], queryFn: getThemes })
  return (
    <AppShell>
      <section className="mx-auto min-h-[75vh] w-[min(1100px,calc(100%-48px))] py-14 max-[760px]:w-[calc(100%-32px)]">
        <p className="text-[0.65rem] font-extrabold tracking-[0.2em] text-[#b85635]">
          THEMED COLLECTIONS
        </p>
        <h1 className="mt-3 font-serif text-[clamp(2.8rem,5vw,4.5rem)]">
          テーマを一つずつ読破する
        </h1>
        <p className="mt-5 max-w-2xl text-sm leading-7 text-[#18352f]/60">
          興味のある風景や歴史から英文を選べます。読了状態は各コレクションでも引き継がれます。
        </p>
        {themes.isPending && <PageLoading label="テーマを集計しています" />}
        {themes.isError && (
          <PageError
            message="テーマを取得できませんでした。"
            onRetry={() => themes.refetch()}
          />
        )}
        {themes.data && (
          <div className="mt-10 grid grid-cols-3 gap-5 max-[800px]:grid-cols-2 max-[520px]:grid-cols-1">
            {themes.data.map((theme, index) => (
              <Link
                className="group min-h-56 border border-[#18352f]/15 bg-white/45 p-6 shadow-[7px_7px_0_rgb(201_140_71_/_13%)] transition-transform hover:-translate-y-1"
                key={theme.slug}
                to={`/explore?theme=${encodeURIComponent(theme.slug)}`}
              >
                <span className="font-serif text-5xl text-[#c98c47]/35">
                  {String(index + 1).padStart(2, '0')}
                </span>
                <h2 className="mt-5 font-serif text-2xl">{theme.nameJa}</h2>
                <p className="mt-1 text-xs font-bold tracking-[0.08em] text-[#b85635]">
                  {theme.nameEn}
                </p>
                <p className="mt-4 text-xs leading-6 text-[#18352f]/55">
                  {theme.descriptionJa}
                </p>
                <span className="mt-5 block text-xs font-bold">
                  {theme.count}件を見る →
                </span>
              </Link>
            ))}
          </div>
        )}
      </section>
    </AppShell>
  )
}
