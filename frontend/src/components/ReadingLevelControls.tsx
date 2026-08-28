import { buildFullRewriteUrl } from '../lib/learning-tools'
import type { ReadingLevel } from '../lib/simplify-english'
import type { WorldHeritageSite } from '../types'

export function ReadingLevelControls({
  level,
  site,
  onChange,
}: {
  level: ReadingLevel
  site: WorldHeritageSite
  onChange: (level: ReadingLevel) => void
}) {
  return (
    <section className="mt-7 border border-[#18352f]/15 bg-white/40 p-4">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <p className="text-[0.58rem] font-extrabold tracking-[0.14em] text-[#b85635]">
            READING LEVEL
          </p>
          <p className="mt-1 text-xs text-[#18352f]/55">
            英文の難しさを切り替える
          </p>
        </div>
        <div className="inline-flex border border-[#18352f]/20 p-1">
          {(['original', 'B1', 'A2'] as const).map((value) => (
            <button
              className={`px-4 py-2 text-xs font-bold ${level === value ? 'bg-[#18352f] text-white' : ''}`}
              key={value}
              onClick={() => onChange(value)}
              type="button"
            >
              {value === 'original' ? '原文' : value}
            </button>
          ))}
        </div>
      </div>
      {level !== 'original' && (
        <div className="mt-4 border-l-2 border-[#c98c47] pl-4 text-xs leading-6 text-[#18352f]/58">
          <p>
            アプリ内の語彙置換による学習用参考文です。意味や事実の確認には原文を使ってください。
          </p>
          <a
            className="mt-2 inline-block font-bold text-[#b85635] underline"
            href={buildFullRewriteUrl(site, level)}
            rel="noreferrer"
            target="_blank"
          >
            ChatGPTでより自然な{level}全文を作る ↗
          </a>
        </div>
      )}
    </section>
  )
}
