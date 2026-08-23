import { useQuery } from '@tanstack/react-query'
import { useState } from 'react'
import { Link } from 'react-router-dom'
import { getHistory, getStats } from '../api/heritage'
import { AppShell } from '../components/AppShell'
import type { HeritageMode } from '../types'

const statItems = [
  { key: 'uniqueRead', label: '読んだ世界遺産' },
  { key: 'totalReads', label: '総読了回数' },
  { key: 'savedVocabulary', label: '保存した表現' },
  { key: 'memorizationVocabulary', label: '暗記カード' },
] as const

export default function HomePage() {
  const [mode, setMode] = useState<HeritageMode>(() =>
    window.localStorage.getItem('heritage-mode') === 'famous'
      ? 'famous'
      : 'all',
  )
  const stats = useQuery({ queryKey: ['stats'], queryFn: getStats })
  const history = useQuery({ queryKey: ['history'], queryFn: getHistory })

  function updateMode(nextMode: HeritageMode) {
    setMode(nextMode)
    window.localStorage.setItem('heritage-mode', nextMode)
  }

  return (
    <AppShell>
      <section className="mx-auto grid min-h-[620px] w-[min(1240px,calc(100%-48px))] grid-cols-[minmax(0,1fr)_minmax(350px,0.72fr)] items-center gap-[clamp(60px,9vw,140px)] py-16 max-[900px]:grid-cols-1 max-[760px]:w-[min(100%-32px,720px)]">
        <div>
          <p className="text-[0.68rem] font-extrabold tracking-[0.22em] text-[#b85635]">
            READ THE WORLD IN ENGLISH
          </p>
          <h1 className="mt-5 font-serif text-[clamp(3rem,6vw,5.5rem)] leading-[1.16] font-medium tracking-[-0.055em]">
            世界遺産を探す旅を、
            <br />
            <span className="text-[#b85635]">ここから。</span>
          </h1>
          <p className="mt-7 max-w-xl text-base leading-8 text-[#18352f]/68">
            世界遺産の英文を読み、分からない表現をその場で記録。訳に頼りすぎず、必要なときだけ確かめながら読み進めます。
          </p>

          <fieldset className="mt-8">
            <legend className="text-xs font-bold text-[#18352f]/55">
              抽選モード
            </legend>
            <div className="mt-3 inline-flex border border-[#18352f]/20 p-1">
              {(['all', 'famous'] as const).map((value) => (
                <button
                  className={`px-5 py-2.5 text-xs font-bold ${mode === value ? 'bg-[#18352f] text-white' : ''}`}
                  key={value}
                  onClick={() => updateMode(value)}
                  type="button"
                >
                  {value === 'all' ? 'すべて' : '有名な世界遺産'}
                </button>
              ))}
            </div>
          </fieldset>

          <div className="mt-7 flex flex-wrap gap-3">
            <Link
              className="inline-flex min-h-14 items-center bg-[#18352f] px-6 text-sm font-bold tracking-[0.06em] text-white shadow-[5px_5px_0_#c98c47]"
              to={`/random-heritage${mode === 'famous' ? '?mode=famous' : ''}`}
            >
              ランダムに世界遺産を読む →
            </Link>
            <Link
              className="inline-flex min-h-14 items-center border border-[#b85635] px-6 text-sm font-bold text-[#b85635]"
              to="/memorize"
            >
              暗記カードを始める
            </Link>
          </div>
        </div>

        <div className="relative border border-[#18352f]/15 bg-white/45 p-7 shadow-[16px_16px_0_rgb(201_140_71_/_16%)]">
          <p className="text-[0.62rem] font-extrabold tracking-[0.18em] text-[#b85635]">
            LEARNING RECORD
          </p>
          <div className="mt-5 grid grid-cols-2 gap-px bg-[#18352f]/15">
            {statItems.map((item) => (
              <div className="bg-[#fbf8f1] p-5" key={item.key}>
                <strong className="block font-serif text-3xl">
                  {stats.data?.[item.key] ?? '—'}
                </strong>
                <span className="mt-2 block text-[0.65rem] text-[#18352f]/55">
                  {item.label}
                </span>
              </div>
            ))}
          </div>
          <div className="mt-7">
            <div className="flex items-center justify-between">
              <h2 className="font-serif text-xl">最近読んだ場所</h2>
              <Link className="text-xs font-bold text-[#b85635]" to="/stats">
                すべて見る →
              </Link>
            </div>
            {history.data?.length ? (
              <ul className="mt-4 divide-y divide-[#18352f]/12">
                {history.data.slice(0, 5).map((item) => (
                  <li key={item.id}>
                    <Link
                      className="flex items-center justify-between gap-4 py-3 text-sm hover:text-[#b85635]"
                      to={`/heritage/${item.heritageSiteId}`}
                    >
                      <span className="line-clamp-1">{item.site.nameEn}</span>
                      <time className="shrink-0 text-[0.6rem] text-[#18352f]/45">
                        {new Date(item.readAt).toLocaleDateString('ja-JP')}
                      </time>
                    </Link>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="mt-4 text-sm leading-7 text-[#18352f]/50">
                まだ読了記録はありません。最初の世界遺産を読んでみましょう。
              </p>
            )}
          </div>
        </div>
      </section>
    </AppShell>
  )
}
