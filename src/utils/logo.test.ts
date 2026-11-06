import { describe, expect, it } from 'vitest'
import { fitSize } from './logo'

describe('fitSize', () => {
  it('reduz mantendo a proporção e não amplia', () => {
    expect(fitSize(560, 280, 280, 140)).toEqual({ width: 280, height: 140 })
    expect(fitSize(1000, 100, 280, 140)).toEqual({ width: 280, height: 28 })
    expect(fitSize(100, 50, 280, 140)).toEqual({ width: 100, height: 50 })
  })
})
