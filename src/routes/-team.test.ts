import { describe, expect, it } from 'vitest'

import { TEAM } from './index'

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
