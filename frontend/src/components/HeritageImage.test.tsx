import { fireEvent, render } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { HeritageImage } from './HeritageImage'

describe('HeritageImage', () => {
  it('tries the image endpoint even when only a site id is available', () => {
    const { container } = render(
      <HeritageImage
        fallbackClassName="fallback"
        imageClassName="image"
        siteId="site-id"
      />,
    )

    expect(container.querySelector('img')).toHaveAttribute(
      'src',
      '/api/heritage/site-id/image',
    )
  })

  it('shows a placeholder when no fallback image can be loaded', () => {
    const { container } = render(
      <HeritageImage
        fallbackClassName="fallback"
        imageClassName="image"
        siteId="missing-site"
      />,
    )

    fireEvent.error(container.querySelector('img')!)

    expect(container.querySelector('img')).not.toBeInTheDocument()
    expect(container.querySelector('.fallback')).toHaveTextContent('◇')
  })
})
