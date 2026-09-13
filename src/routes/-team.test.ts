import { describe, expect, it } from 'vitest'

import { HOME_IMAGES, Route, TEAM } from './index'

describe('home image delivery', () => {
  it('keeps the responsive hero source in HTML without a redundant preload', async () => {
    expect(HOME_IMAGES.skyline).toMatchObject({
      src: '/brand/skyline-1920.webp',
      sizes: '(max-width: 720px) 380vw, 140vw',
      loading: 'eager',
      fetchPriority: 'high',
    })
    expect(HOME_IMAGES.skyline.srcSet).toContain('/brand/skyline.webp 3832w')
    const head = await Route.options.head?.({} as never)
    expect(head?.links).not.toEqual(
      expect.arrayContaining([expect.objectContaining({ rel: 'preload' })]),
    )
  })

  it('offers right-sized computer and machine candidates', () => {
    expect(HOME_IMAGES.computer.srcSet).toContain('480w')
    expect(HOME_IMAGES.computer.srcSet).toContain('1448w')
    expect(HOME_IMAGES.computer).toMatchObject({
      loading: 'eager',
      fetchPriority: 'low',
    })
    expect(HOME_IMAGES.machine.srcSet).toContain('240w')
    expect(HOME_IMAGES.machine.srcSet).toContain('776w')
    expect(HOME_IMAGES.machine).toMatchObject({
      loading: 'lazy',
      fetchPriority: 'low',
    })
  })
})

describe('team links', () => {
  it('embeds Gonzalo Saavedra’s personal site', () => {
    const gonzalo = TEAM.find((person) => person.name === 'Gonzalo Saavedra')

    expect(gonzalo).toMatchObject({
      url: 'https://gonzalodev.cl',
      host: 'gonzalodev.cl',
      external: false,
    })
  })
})
