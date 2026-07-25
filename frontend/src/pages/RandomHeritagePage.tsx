import { Link } from 'react-router-dom'
import * as AspectRatio from '@radix-ui/react-aspect-ratio'
import * as Separator from '@radix-ui/react-separator'
import { Slot } from '@radix-ui/react-slot'
import * as Tooltip from '@radix-ui/react-tooltip'
import { useRandomHeritage } from '../hooks/useRandomHeritage'

export default function RandomHeritagePage() {
  const { data } = useRandomHeritage()
  console.log('テスト', data)
  return (
    <Tooltip.Provider delayDuration={250}>
      <main className="min-h-screen bg-[#fbf8f1] bg-[linear-gradient(90deg,transparent_0_49.95%,rgb(24_53_47_/_3%)_50%,transparent_50.05%)] font-sans text-[#18352f] selection:bg-[#b85635] selection:text-[#fbf8f1]">
        <header className="mx-auto flex min-h-[92px] w-[min(1240px,calc(100%-80px))] items-center justify-between border-b border-[#18352f]/20 max-[900px]:w-[min(calc(100%-40px),720px)] max-[580px]:min-h-20">
          <Link
            className="inline-flex items-center gap-[13px] focus-visible:outline-3 focus-visible:outline-offset-4 focus-visible:outline-[#c98c47]/45"
            to="/"
            aria-label="World Heritage Atlas ホーム"
          >
            <span
              className="grid size-[42px] place-items-center rounded-full border border-current font-serif text-xs font-bold tracking-[-0.04em] max-[580px]:size-9"
              aria-hidden="true"
            >
              WH
            </span>
            <span>
              <span className="block font-serif text-base font-bold tracking-[0.01em] max-[580px]:text-[0.85rem]">
                World Heritage Atlas
              </span>
              <span className="mt-1 block text-[0.56rem] font-bold tracking-[0.18em] text-[#18352f]/60 max-[580px]:hidden">
                UNESCO DISCOVERY GUIDE
              </span>
            </span>
          </Link>

          <nav aria-label="ページナビゲーション">
            <Slot className="inline-flex items-center gap-2 text-xs font-bold tracking-[0.06em] text-[#18352f]/70 hover:text-[#b85635] focus-visible:outline-3 focus-visible:outline-offset-4 focus-visible:outline-[#c98c47]/45 max-[580px]:text-[0]">
              <Link to="/">
                <svg
                  className="w-4 fill-none stroke-current stroke-[1.7] [stroke-linecap:round] [stroke-linejoin:round] max-[580px]:w-[22px]"
                  viewBox="0 0 24 24"
                  aria-hidden="true"
                >
                  <path d="m15 18-6-6 6-6" />
                </svg>
                ホームへ戻る
              </Link>
            </Slot>
          </nav>
        </header>

        <section
          className="mx-auto grid w-[min(1240px,calc(100%-80px))] grid-cols-[minmax(360px,0.82fr)_minmax(0,1fr)] items-center gap-[clamp(60px,8vw,116px)] py-[58px] pb-[72px] max-[900px]:w-[min(calc(100%-40px),720px)] max-[900px]:grid-cols-1 max-[900px]:gap-[62px] max-[900px]:pt-[42px] max-[580px]:gap-12 max-[580px]:py-[30px] max-[580px]:pb-14"
          aria-labelledby="heritage-title"
        >
          <div className="relative max-w-[500px] after:absolute after:inset-[18px_-18px_-18px_18px] after:border after:border-[#b85635]/40 after:content-[''] max-[900px]:mx-auto max-[900px]:w-4/5 max-[580px]:ml-0 max-[580px]:w-[calc(100%-18px)]">
            <AspectRatio.Root
              ratio={4 / 5}
              className="relative z-10 overflow-hidden bg-[#d9d0bd] shadow-[0_24px_55px_rgb(32_48_43_/_20%)]"
            >
              {/* <img
                className="size-full object-cover"
                src=""
                alt="ウニアンガ湖群の湖と砂漠"
              /> */}
              <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(180deg,transparent_60%,rgb(15_35_31_/_70%)),linear-gradient(120deg,rgb(212_161_91_/_10%),transparent_50%)]" />
              <p className="absolute right-6 bottom-5 left-6 m-0 text-right font-serif text-[0.67rem] italic text-white/80">
                <span className="mb-[3px] block font-sans text-[0.55rem] font-extrabold tracking-[0.16em] text-white not-italic">
                  LAKE BOUKOU
                </span>
                Photo: Sven Oehm
              </p>
            </AspectRatio.Root>
          </div>

          <div className="max-w-[630px]">
            <div className="flex items-center justify-between gap-6 max-[580px]:items-start">
              <div className="inline-flex min-h-[29px] items-center gap-2 rounded-full border border-[#18352f]/25 px-3 text-[0.68rem] font-bold">
                <span className="size-[7px] rounded-full bg-[#4f8871]" />
                自然遺産
              </div>
              <span className="text-[0.6rem] font-bold tracking-[0.15em] text-[#18352f]/50">
                UNESCO ID 1400
              </span>
            </div>

            <p className="mt-[42px] flex items-center gap-2 text-[0.68rem] font-extrabold tracking-[0.18em] text-[#b85635] max-[580px]:mt-[34px]">
              <svg
                className="w-4 fill-none stroke-current stroke-[1.7] [stroke-linecap:round] [stroke-linejoin:round]"
                viewBox="0 0 24 24"
                aria-hidden="true"
              >
                <path d="M20 10c0 5-8 11-8 11S4 15 4 10a8 8 0 1 1 16 0Z" />
                <circle cx="12" cy="10" r="2.5" />
              </svg>
              AFRICA · CHAD
            </p>

            <h1
              id="heritage-title"
              className="mt-4 font-['Yu_Mincho','Hiragino_Mincho_ProN',Georgia,serif] text-[clamp(2.5rem,4.2vw,4.5rem)] leading-[1.15] font-medium tracking-[-0.055em] max-[580px]:text-[2.75rem]"
            >
              ウニアンガ湖群
            </h1>
            <p className="mt-3 font-serif text-[1.16rem] italic text-[#18352f]/60">
              Lakes of Ounianga
            </p>

            <p className="mt-7 max-w-[580px] font-['Yu_Mincho','Hiragino_Mincho_ProN',Georgia,serif] text-[0.98rem] leading-8 text-[#18352f]/75">
              サハラ砂漠の超乾燥地域に浮かぶ、色彩豊かな18の湖。地下水に育まれた湖と砂丘が、
              世界でも類を見ない景観をつくり出しています。
            </p>

            <div
              className="mt-[34px] flex items-stretch border-y border-[#18352f]/20 py-5"
              aria-label="基本情報"
            >
              <div className="min-w-0 flex-1">
                <span className="mb-2 block text-[0.62rem] font-bold tracking-[0.1em] text-[#18352f]/50">
                  登録年
                </span>
                <strong className="font-serif text-[1.24rem] font-medium max-[580px]:text-[1.03rem]">
                  2012
                </strong>
              </div>
              <Separator.Root
                className="mx-6 w-px bg-[#18352f]/20 max-[580px]:mx-3.5"
                decorative
                orientation="vertical"
              />
              <div className="min-w-0 flex-1">
                <span className="mb-2 block text-[0.62rem] font-bold tracking-[0.1em] text-[#18352f]/50">
                  登録基準
                </span>
                <strong className="font-serif text-[1.24rem] font-medium max-[580px]:text-[1.03rem]">
                  (vii)
                </strong>
              </div>
              <Separator.Root
                className="mx-6 w-px bg-[#18352f]/20 max-[580px]:mx-3.5"
                decorative
                orientation="vertical"
              />
              <div className="min-w-0 flex-1">
                <span className="mb-2 block text-[0.62rem] font-bold tracking-[0.1em] text-[#18352f]/50">
                  面積
                </span>
                <strong className="font-serif text-[1.24rem] font-medium max-[580px]:text-[1.03rem]">
                  62,808{' '}
                  <small className="text-[0.68rem] font-normal">ha</small>
                </strong>
              </div>
            </div>

            <Tooltip.Root>
              <Tooltip.Trigger asChild>
                <button
                  className="mt-[31px] inline-flex min-h-[58px] items-center justify-center gap-[22px] rounded-[2px] border border-[#18352f] bg-[#18352f] px-6 text-[0.84rem] font-bold tracking-[0.08em] text-[#fbf8f1] shadow-[5px_5px_0_#c98c47] transition-[transform,box-shadow,background-color] duration-200 hover:translate-x-0.5 hover:translate-y-0.5 hover:bg-[#21473f] hover:shadow-[3px_3px_0_#c98c47] focus-visible:outline-3 focus-visible:outline-offset-4 focus-visible:outline-[#c98c47]/45 motion-reduce:transition-none max-[580px]:w-full max-[580px]:px-[18px]"
                  type="button"
                >
                  次の世界遺産へ
                  <svg
                    className="w-[19px] fill-none stroke-current stroke-[1.7] [stroke-linecap:round] [stroke-linejoin:round]"
                    viewBox="0 0 24 24"
                    aria-hidden="true"
                  >
                    <path d="M16 3h5v5M4 20 21 3M21 16v5h-5M15 15l6 6M4 4l5 5" />
                  </svg>
                </button>
              </Tooltip.Trigger>
              <Tooltip.Portal>
                <Tooltip.Content
                  className="rounded-[3px] bg-[#18352f] px-[11px] py-2 text-[0.68rem] text-[#fbf8f1] shadow-[0_8px_24px_rgb(20_35_31_/_18%)]"
                  sideOffset={8}
                >
                  ランダムにもう一件表示
                  <Tooltip.Arrow className="fill-[#18352f]" />
                </Tooltip.Content>
              </Tooltip.Portal>
            </Tooltip.Root>
            <p className="mt-3 ml-1 text-[0.62rem] text-[#18352f]/45">
              このボタンはUIサンプルです
            </p>
          </div>
        </section>

        <Separator.Root
          className="mx-auto block h-px w-[min(1240px,calc(100%-80px))] bg-[#18352f]/20 max-[900px]:w-[min(calc(100%-40px),720px)]"
          decorative
        />

        <section
          className="mx-auto grid w-[min(1240px,calc(100%-80px))] grid-cols-[minmax(0,1fr)_360px] gap-[clamp(70px,10vw,150px)] py-[72px] pb-[86px] max-[900px]:w-[min(calc(100%-40px),720px)] max-[900px]:grid-cols-1 max-[900px]:gap-[58px] max-[580px]:py-[54px] max-[580px]:pb-16"
          aria-label="世界遺産の詳細"
        >
          <article className="grid grid-cols-[44px_minmax(0,1fr)] gap-7 max-[580px]:grid-cols-1 max-[580px]:gap-2.5">
            <p className="mt-px font-serif text-[0.88rem] italic text-[#c98c47]">
              01
            </p>
            <div>
              <p className="m-0 text-[0.7rem] font-extrabold tracking-[0.22em] text-[#b85635] uppercase">
                ABOUT THE SITE
              </p>
              <h2 className="mt-[15px] mb-[26px] font-['Yu_Mincho','Hiragino_Mincho_ProN',Georgia,serif] text-[clamp(1.7rem,2.6vw,2.65rem)] font-medium tracking-[-0.035em]">
                砂漠の中で、水が描く奇跡。
              </h2>
              <p className="mb-4 text-[0.9rem] leading-[2.05] text-[#18352f]/75">
                サハラ砂漠のエネディ地方、62,808ヘクタールに広がる18の湖で構成されています。
                塩湖・高塩湖・淡水湖が地下水によって保たれ、約40km離れた2つの湖群を形成しています。
              </p>
              <p className="mb-4 text-[0.9rem] leading-[2.05] text-[#18352f]/75">
                青や緑、赤みを帯びた水面、湖を分ける砂丘、浮かぶ葦の緑。
                厳しい乾燥地帯にありながら、一部の淡水湖では魚などの水生生物も暮らしています。
              </p>
            </div>
          </article>

          <aside className="border-l border-[#18352f]/20 pl-10 max-[900px]:border-0 max-[900px]:p-0">
            <div>
              <p className="m-0 text-[0.7rem] font-extrabold tracking-[0.22em] text-[#b85635] uppercase">
                LOCATION
              </p>
              <p className="my-[14px] mb-[18px] font-serif text-[1.22rem] leading-[1.55]">
                19.0550° N
                <br />
                20.5056° E
              </p>
              <div
                className="relative h-[120px] overflow-hidden border border-[#18352f]/15 bg-[#e7e0d1]"
                aria-label="アフリカ、チャド北東部"
              >
                <span className="absolute inset-0 bg-[linear-gradient(rgb(24_53_47_/_9%)_1px,transparent_1px),linear-gradient(90deg,rgb(24_53_47_/_9%)_1px,transparent_1px)] bg-[length:24px_24px]" />
                <span className="absolute top-[29px] left-[56%] grid size-8 -rotate-45 place-items-center rounded-[50%_50%_50%_0] border border-[#b85635] bg-[#fbf8f1]">
                  <span className="size-[7px] rounded-full bg-[#b85635]" />
                </span>
                <span className="absolute right-[9px] bottom-[7px] text-[0.5rem] font-extrabold tracking-[0.12em] text-[#18352f]/55">
                  NORTH-EASTERN CHAD
                </span>
              </div>
            </div>

            <Separator.Root
              className="my-[34px] block h-px bg-[#18352f]/20"
              decorative
            />

            <div>
              <p className="m-0 text-[0.7rem] font-extrabold tracking-[0.22em] text-[#b85635] uppercase">
                HERITAGE CRITERIA
              </p>
              <div className="mt-[17px] flex items-start gap-4">
                <span className="grid size-11 shrink-0 place-items-center rounded-full border border-[#b85635] font-serif text-[0.82rem] text-[#b85635]">
                  VII
                </span>
                <p className="m-0 text-[0.78rem] leading-[1.85] text-[#18352f]/70">
                  最上級の自然現象、または類まれな自然美・美的価値を有する地域。
                </p>
              </div>
            </div>
          </aside>
        </section>

        <footer className="mx-auto flex min-h-[76px] w-[min(1240px,calc(100%-80px))] items-center justify-between border-t border-[#18352f]/20 text-[0.62rem] font-bold tracking-[0.16em] text-[#18352f]/50 uppercase max-[900px]:w-[min(calc(100%-40px),720px)] max-[580px]:flex-col max-[580px]:items-start max-[580px]:justify-center max-[580px]:gap-[7px] [&_p]:m-0">
          <p>WORLD HERITAGE ATLAS</p>
          <p>One place at a time.</p>
        </footer>
      </main>
    </Tooltip.Provider>
  )
}
