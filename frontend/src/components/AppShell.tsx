import type { ReactNode } from 'react'
import { Link, NavLink } from 'react-router-dom'

const navigation = [
  { to: '/', label: 'ホーム' },
  { to: '/random-heritage', label: '読む' },
  { to: '/explore', label: '探す' },
  { to: '/map', label: '地図' },
  { to: '/timeline', label: '年代' },
  { to: '/challenges', label: '目標' },
  { to: '/vocabulary', label: '単語帳' },
  { to: '/memorize', label: '暗記' },
  { to: '/stats', label: '記録' },
]

export function AppShell({ children }: { children: ReactNode }) {
  return (
    <main className="min-h-screen bg-[#fbf8f1] font-sans text-[#18352f] selection:bg-[#b85635] selection:text-[#fbf8f1]">
      <header className="sticky top-0 z-40 border-b border-[#18352f]/15 bg-[#fbf8f1]/95 backdrop-blur">
        <div className="mx-auto flex min-h-[84px] w-[min(1240px,calc(100%-48px))] items-center justify-between gap-8 max-[760px]:w-[min(100%-32px,720px)] max-[760px]:flex-wrap max-[760px]:gap-3 max-[760px]:py-4">
          <Link
            className="inline-flex shrink-0 items-center gap-3 focus-visible:outline-3 focus-visible:outline-offset-4 focus-visible:outline-[#c98c47]/45"
            to="/"
            aria-label="World Heritage Atlas ホーム"
          >
            <span className="grid size-10 place-items-center rounded-full border border-current font-serif text-xs font-bold">
              WH
            </span>
            <span>
              <span className="block font-serif text-sm font-bold tracking-[0.01em]">
                World Heritage Atlas
              </span>
              <span className="mt-0.5 block text-[0.5rem] font-bold tracking-[0.18em] text-[#18352f]/55">
                READ · DISCOVER · REMEMBER
              </span>
            </span>
          </Link>

          <nav
            className="flex flex-wrap items-center justify-end gap-x-5 gap-y-2 text-[0.68rem] font-bold tracking-[0.06em] max-[760px]:w-full max-[760px]:justify-start"
            aria-label="メインナビゲーション"
          >
            {navigation.map((item) => (
              <NavLink
                key={item.to}
                className={({ isActive }) =>
                  `border-b py-1 transition-colors hover:text-[#b85635] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#c98c47] ${
                    isActive
                      ? 'border-[#b85635] text-[#b85635]'
                      : 'border-transparent text-[#18352f]/65'
                  }`
                }
                end={item.to === '/'}
                to={item.to}
              >
                {item.label}
              </NavLink>
            ))}
          </nav>
        </div>
      </header>
      {children}
      <footer className="mx-auto flex min-h-[76px] w-[min(1240px,calc(100%-48px))] items-center justify-between border-t border-[#18352f]/15 text-[0.6rem] font-bold tracking-[0.15em] text-[#18352f]/45 uppercase max-[600px]:flex-col max-[600px]:items-start max-[600px]:justify-center max-[600px]:gap-2">
        <p>WORLD HERITAGE ATLAS</p>
        <p>One place at a time.</p>
      </footer>
    </main>
  )
}
