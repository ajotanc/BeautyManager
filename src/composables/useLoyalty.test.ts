import { describe, expect, it, vi } from 'vitest'
import { ref } from 'vue'

const settings: { loyalty_milestone?: number } = {}
vi.mock('@/stores/settingsStore', () => ({ useSettingsStore: () => ({ settings }) }))

const { useLoyalty } = await import('./useLoyalty')

describe('useLoyalty', () => {
  it('sem configuração usa a meta padrão de 2 compras', () => {
    delete settings.loyalty_milestone
    expect(useLoyalty(ref(0)).milestoneTarget.value).toBe(2)
  })

  it('meta 0 desativa a fidelidade (antes virava 2)', () => {
    settings.loyalty_milestone = 0
    const loyalty = useLoyalty(ref(1))
    expect(loyalty.isLoyaltyEnabled.value).toBe(false)
    expect(loyalty.isNextPurchaseMilestone.value).toBe(false)
  })

  it('a compra premiada é a de número múltiplo da meta', () => {
    settings.loyalty_milestone = 3
    expect(useLoyalty(ref(2)).isNextPurchaseMilestone.value).toBe(true) // 3ª compra
    expect(useLoyalty(ref(3)).isNextPurchaseMilestone.value).toBe(false) // 4ª
  })

  it('conta quantas compras faltam para o brinde', () => {
    settings.loyalty_milestone = 5
    expect(useLoyalty(ref(1)).purchasesUntilGift.value).toBe(3) // próxima é a 2ª, brinde na 5ª
    expect(useLoyalty(ref(4)).purchasesUntilGift.value).toBe(0)
  })
})
