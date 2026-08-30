export type ImageWidth = 320 | 480 | 640 | 960

const UNESCO_IMAGE_PROXY = 'https://images.weserv.nl/'

export function optimizedImageUrl(url: string | null, width: ImageWidth) {
  if (!url) return null

  try {
    const parsed = new URL(url)
    const isUnescoDocument =
      parsed.protocol === 'https:' &&
      (parsed.hostname === 'whc.unesco.org' ||
        parsed.hostname === 'www.whc.unesco.org') &&
      parsed.pathname.startsWith('/document/')
    if (!isUnescoDocument) return url

    // UNESCO document images can be multi-megabyte originals. Use the public
    // image proxy only for this allow-listed source and keep the original as
    // the browser-side fallback if the proxy is unavailable.
    const proxy = new URL(UNESCO_IMAGE_PROXY)
    proxy.searchParams.set('url', parsed.toString())
    proxy.searchParams.set('w', String(width))
    proxy.searchParams.set('q', '80')
    proxy.searchParams.set('output', 'webp')
    return proxy.toString()
  } catch {
    return url
  }
}
