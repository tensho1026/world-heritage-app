import { useState } from 'react'
import { getHeritageImageUrl } from '../api/client'
import { optimizedImageUrl } from '../lib/media'

type HeritageImageProps = {
  siteId: string
  imageClassName: string
  fallbackClassName: string
  loading?: 'eager' | 'lazy'
  src?: string | null
  imageWidth?: 320 | 480 | 960
}

export function HeritageImage({
  siteId,
  imageClassName,
  fallbackClassName,
  loading = 'lazy',
  src,
  imageWidth = 960,
}: HeritageImageProps) {
  const [failedSiteId, setFailedSiteId] = useState<string | null>(null)
  const [fallbackSiteId, setFallbackSiteId] = useState<string | null>(null)
  const failed = failedSiteId === siteId
  const optimizedSource = src
    ? optimizedImageUrl(src, imageWidth)
    : getHeritageImageUrl(siteId, imageWidth)
  const source =
    fallbackSiteId === siteId && src ? src : (optimizedSource ?? undefined)

  if (failed) {
    return <div className={fallbackClassName}>◇</div>
  }

  return (
    <img
      alt=""
      className={imageClassName}
      decoding="async"
      loading={loading}
      onError={() => {
        if (src && optimizedSource !== src && fallbackSiteId !== siteId) {
          setFallbackSiteId(siteId)
        } else {
          setFailedSiteId(siteId)
        }
      }}
      src={source}
    />
  )
}
