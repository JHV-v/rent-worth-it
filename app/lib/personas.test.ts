import { describe, expect, it } from 'vitest'
import { PERSONAS, pickPersona } from './personas'

describe('pickPersona', () => {
  it('0/10/20/.../100 都能选到 persona', () => {
    for (let score = 0; score <= 100; score += 10) {
      const p = pickPersona(score)
      expect(p).toBeDefined()
      expect(typeof p.label).toBe('string')
      expect(p.label.length).toBeGreaterThan(0)
    }
  })

  it('每个分档边界值命中对应 persona', () => {
    expect(pickPersona(0).id).toBe('doomed')
    expect(pickPersona(10).id).toBe('collapse')
    expect(pickPersona(20).id).toBe('grind')
    expect(pickPersona(30).id).toBe('endure')
    expect(pickPersona(40).id).toBe('meh')
    expect(pickPersona(50).id).toBe('okay')
    expect(pickPersona(60).id).toBe('decent')
    expect(pickPersona(70).id).toBe('stable')
    expect(pickPersona(80).id).toBe('winner')
    expect(pickPersona(90).id).toBe('blessed')
    expect(pickPersona(100).id).toBe('blessed')
  })

  it('PERSONAS 数组按 min 从高到低严格递减', () => {
    for (let i = 1; i < PERSONAS.length; i++) {
      expect(PERSONAS[i - 1].min).toBeGreaterThan(PERSONAS[i].min)
    }
  })

  it('低于最低门槛或异常分数命中 fallback（最后一档）', () => {
    expect(pickPersona(-5).id).toBe('doomed')
  })
})
