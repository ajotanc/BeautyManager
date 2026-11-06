import { describe, expect, it } from 'vitest'
import { formatCurrency, toMoney, toNumber } from './currency'

describe('toNumber', () => {
  it('lê decimais simples do banco sem tratar inteiros como centavos', () => {
    expect(toNumber('10')).toBe(10)
    expect(toNumber('1000')).toBe(1000)
    expect(toNumber('3.50')).toBe(3.5)
    expect(toNumber('129.90')).toBe(129.9)
  })

  it('lê o formato brasileiro', () => {
    expect(toNumber('3,50')).toBe(3.5)
    expect(toNumber('1.234,56')).toBe(1234.56)
    expect(toNumber('R$ 6,99')).toBe(6.99)
  })

  it('devolve 0 para vazio, nulo e inválido', () => {
    expect(toNumber(undefined)).toBe(0)
    expect(toNumber(null)).toBe(0)
    expect(toNumber('')).toBe(0)
    expect(toNumber(Number.NaN)).toBe(0)
  })

  it('mantém números como estão', () => {
    expect(toNumber(12.5)).toBe(12.5)
  })
})

describe('toMoney / formatCurrency', () => {
  it('grava sempre com 2 casas e lê de volta igual', () => {
    expect(toMoney(10)).toBe(10)
    expect(toMoney(0.1 + 0.2)).toBe(0.3)
    expect(toMoney('7.10')).toBe(7.1)
  })

  it('formata em reais', () => {
    expect(formatCurrency(6.99).replace(/\s/g, ' ')).toBe('R$ 6,99')
  })
})
