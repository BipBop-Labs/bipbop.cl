import { expect, test } from 'vitest'

import { eyeOffset } from './wordmark'

test('the pupil leans toward the cursor, y flipped, capped', () => {
  expect(eyeOffset(0, 0)).toEqual({ x: 0, y: -0 })

  expect(eyeOffset(130, 0).x).toBeCloseTo(55)
  expect(eyeOffset(0, 130).y).toBeCloseTo(-55)

  const far = eyeOffset(4000, 4000)
  expect(Math.hypot(far.x, far.y)).toBeCloseTo(110)
  expect(far.x).toBeGreaterThan(0)
  expect(far.y).toBeLessThan(0)
})
