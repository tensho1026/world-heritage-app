import { Link } from 'react-router-dom'
import type { DiscoverySite } from '../types'
import { HeritageImage } from './HeritageImage'

export function DiscoveryCard({ site }: { site: DiscoverySite }) {
  return (
    <article className="grid grid-cols-[120px_minmax(0,1fr)] overflow-hidden border border-[#18352f]/15 bg-white/45 max-[520px]:grid-cols-1">
      <div className="min-h-36 bg-[#d9d0bd]">
        <HeritageImage
          fallbackClassName="grid size-full place-items-center text-2xl text-white/70"
          imageClassName="size-full object-cover"
          siteId={site.uuid}
          src={site.mainImageUrl}
        />
      </div>
      <div className="p-5">
        <div className="flex flex-wrap gap-2 text-[0.58rem] font-bold tracking-[0.08em]">
          <span>{site.category}</span>
          {site.isFeatured && <span className="text-[#b85635]">★ FAMOUS</span>}
          <span
            className={site.readCount ? 'text-[#315f4c]' : 'text-[#18352f]/40'}
          >
            {site.readCount ? `READ × ${site.readCount}` : 'UNREAD'}
          </span>
          {site.isFavorite && <span className="text-[#b85635]">♥</span>}
        </div>
        <h2 className="mt-2 font-serif text-xl leading-7">{site.nameEn}</h2>
        <p className="mt-2 text-xs text-[#18352f]/52">
          {site.statesNames.join(' / ')} · {site.dateInscribed ?? '—'}
        </p>
        <Link
          className="mt-4 inline-block text-xs font-bold text-[#b85635] underline"
          to={`/heritage/${site.uuid}`}
        >
          英文を読む →
        </Link>
      </div>
    </article>
  )
}
