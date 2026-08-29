import { useState } from 'react'
import { getHeritageImageUrl } from '../api/client'

type HeritageImageProps = {
  siteId: string
  imageClassName: string
  fallbackClassName: string
  loading?: 'eager' | 'lazy'
}

export function HeritageImage({
  siteId,
  imageClassName,
  fallbackClassName,
  loading = 'lazy',
}: HeritageImageProps) {
  const [failedSiteId, setFailedSiteId] = useState<string | null>(null)
  const failed = failedSiteId === siteId

  if (failed) {
    return <div className={fallbackClassName}>◇</div>
  }

  return (
    <img
      alt=""
      className={imageClassName}
      decoding="async"
      loading={loading}
      onError={() => setFailedSiteId(siteId)}
      src={getHeritageImageUrl(siteId)}
    />
  )
}
