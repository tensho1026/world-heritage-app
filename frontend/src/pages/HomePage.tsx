import { Link } from 'react-router-dom'
import * as Separator from '@radix-ui/react-separator'
import { Slot } from '@radix-ui/react-slot'

function HomePage() {
  return (
    <main className="min-h-screen bg-[#fbf8f1] font-sans text-[#18352f] selection:bg-[#b85635] selection:text-[#fbf8f1]">
      <header className="mx-auto flex min-h-[108px] w-[min(1240px,calc(100%-80px))] items-center justify-between border-b border-[#18352f]/20 max-[900px]:w-[min(calc(100%-40px),720px)] max-[580px]:min-h-20">
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
        <span className="font-serif text-[0.78rem] italic text-[#18352f]/55 max-[580px]:hidden">
          A journey through 1,200+ places
        </span>
      </header>

      <section
        className="mx-auto grid min-h-[calc(100vh-184px)] w-[min(1240px,calc(100%-80px))] grid-cols-[minmax(0,0.93fr)_minmax(420px,0.75fr)] items-center gap-[clamp(60px,8vw,130px)] py-16 pb-[70px] max-[900px]:w-[min(calc(100%-40px),720px)] max-[900px]:grid-cols-1 max-[900px]:gap-[30px] max-[900px]:pt-[54px] max-[580px]:min-h-0 max-[580px]:py-[46px] max-[580px]:pb-[54px]"
        aria-labelledby="home-heading"
      >
        <div>
          <p className="m-0 text-[0.7rem] font-extrabold tracking-[0.22em] text-[#b85635] uppercase">
            DISCOVER THE WORLD
          </p>
          <h1
            id="home-heading"
            className="mt-[22px] max-w-[720px] font-['Yu_Mincho','Hiragino_Mincho_ProN',Georgia,serif] text-[clamp(2.8rem,5vw,5.15rem)] leading-[1.28] font-medium tracking-[-0.055em] max-[580px]:text-[clamp(2.55rem,13vw,3.75rem)] max-[580px]:leading-[1.3]"
          >
            世界遺産を探す旅を、
            <br />
            <span className="text-[#b85635]">ここから。</span>
          </h1>
          <p className="mt-7 font-['Yu_Mincho','Hiragino_Mincho_ProN',Georgia,serif] text-[clamp(0.94rem,1.3vw,1.08rem)] leading-8 text-[#18352f]/75 max-[580px]:[&_br]:hidden">
            まだ知らない風景、文化、物語へ。
            <br />
            世界中の遺産から、次の出会いを見つけよう。
          </p>

          <Slot className="mt-[38px] inline-flex min-h-[58px] items-center justify-center gap-[22px] rounded-[2px] border border-[#18352f] bg-[#18352f] px-6 text-[0.84rem] font-bold tracking-[0.08em] text-[#fbf8f1] shadow-[5px_5px_0_#c98c47] transition-[transform,box-shadow,background-color] duration-200 hover:translate-x-0.5 hover:translate-y-0.5 hover:bg-[#21473f] hover:shadow-[3px_3px_0_#c98c47] focus-visible:outline-3 focus-visible:outline-offset-4 focus-visible:outline-[#c98c47]/45 motion-reduce:transition-none max-[580px]:w-full max-[580px]:px-[18px]">
            <Link to="/random-heritage">
              ランダムに世界遺産をめぐる
              <svg
                className="w-[19px] fill-none stroke-current stroke-[1.7] [stroke-linecap:round] [stroke-linejoin:round]"
                viewBox="0 0 24 24"
                aria-hidden="true"
              >
                <path d="M5 12h14M13 6l6 6-6 6" />
              </svg>
            </Link>
          </Slot>

          <div className="mt-5 flex items-center gap-2.5 text-[0.68rem] tracking-[0.07em] text-[#18352f]/50">
            <span className="text-[#c98c47]" aria-hidden="true">
              ✦
            </span>
            <span>クリックするたび、新しい世界遺産へ</span>
          </div>
        </div>

        <div
          className="relative min-h-[590px] max-[900px]:min-h-[520px] max-[580px]:min-h-[390px]"
          aria-hidden="true"
        >
          <div className="absolute top-0 right-[2%] size-[310px] rounded-full bg-[#e7c778] opacity-60 max-[580px]:size-[210px]" />
          <div className="absolute top-1 left-[-35px] origin-top-left -translate-y-full -rotate-90 font-serif text-[8.5rem] leading-none font-bold text-transparent [-webkit-text-stroke:1px_rgb(24_53_47_/_14%)] max-[580px]:hidden">
            1400
          </div>
          <div className="absolute top-[70px] right-7 bottom-12 left-[35px] rotate-[2.5deg] overflow-hidden border-[12px] border-[#f5f0e6] shadow-[0_28px_60px_rgb(43_57_44_/_22%)] max-[580px]:top-10 max-[580px]:right-[15px] max-[580px]:left-2.5">
            <div className="absolute inset-0 bg-[linear-gradient(180deg,rgb(35_97_105_/_12%),transparent_45%)] bg-[#b5c7b7]" />
            <div className="absolute top-[31%] right-[-12%] left-[-12%] h-[36%] -rotate-3 skew-x-[-10deg] rounded-t-[50%] bg-[#8c6048] [clip-path:polygon(0_100%,0_70%,22%_27%,39%_54%,63%_9%,100%_56%,100%_100%)]" />
            <div className="absolute top-[47%] right-[-12%] left-[-12%] h-[38%] -rotate-3 skew-x-[-10deg] rounded-t-[50%] bg-[#b8754d] [clip-path:polygon(0_100%,0_58%,30%_23%,44%_49%,73%_6%,100%_47%,100%_100%)]" />
            <div className="absolute right-[-10%] bottom-[-10%] left-[-10%] h-[42%] rounded-t-[50%] bg-[#326c6b] bg-[repeating-linear-gradient(175deg,transparent_0_14px,rgb(230_220_174_/_32%)_15px_17px)]" />
          </div>
          <p className="absolute right-0 bottom-0 m-0 text-right font-serif text-[0.82rem] leading-[1.6] italic">
            <span className="block font-sans text-[0.56rem] font-extrabold tracking-[0.18em] text-[#b85635] not-italic">
              FEATURED LANDSCAPE
            </span>
            Lakes of Ounianga · Chad
          </p>
        </div>
      </section>

      <Separator.Root
        className="mx-auto block h-px w-[min(1240px,calc(100%-80px))] bg-[#18352f]/20 max-[900px]:w-[min(calc(100%-40px),720px)]"
        decorative
      />

      <footer className="mx-auto flex min-h-[76px] w-[min(1240px,calc(100%-80px))] items-center justify-between text-[0.62rem] font-bold tracking-[0.16em] text-[#18352f]/50 uppercase max-[900px]:w-[min(calc(100%-40px),720px)] max-[580px]:flex-col max-[580px]:items-start max-[580px]:justify-center max-[580px]:gap-[7px] [&_p]:m-0">
        <p>Culture · Nature · Memory</p>
        <p>Explore our shared heritage</p>
      </footer>
    </main>
  )
}

export default HomePage
