import { Link } from 'react-router-dom'
import type { SiteSummary } from '../types'
import { HeritageImage } from './HeritageImage'

export function HeritageCard({ site }: { site: SiteSummary }) {
  return (
    <article className="group overflow-hidden border border-[#18352f]/15 bg-white/45 transition-transform hover:-translate-y-1">
      <Link
        className="block focus-visible:outline-3 focus-visible:outline-[#c98c47]"
        to={`/heritage/${site.uuid}`}
      >
        <div className="aspect-[16/10] overflow-hidden bg-[#e3dccd]">
          <HeritageImage
            fallbackClassName="grid size-full place-items-center bg-[linear-gradient(135deg,#d9d0bd,#9db0a3)] text-4xl text-white/70"
            imageClassName="size-full object-cover transition-transform duration-500 group-hover:scale-[1.03]"
            imageWidth={480}
            siteId={site.uuid}
            src={site.mainImageUrl}
          />
        </div>
        <div className="p-5">
          <p className="text-[0.62rem] font-bold tracking-[0.15em] text-[#b85635] uppercase">
            {site.category} · {site.region ?? 'World'}
          </p>
          <h2 className="mt-2 font-serif text-xl leading-snug">
            {site.nameEn}
          </h2>
          <p className="mt-3 text-xs leading-5 text-[#18352f]/60">
            {site.statesNames.join(', ') || 'Country information unavailable'}
            {site.dateInscribed ? ` · ${site.dateInscribed}` : ''}
          </p>
        </div>
      </Link>
    </article>
  )
}
