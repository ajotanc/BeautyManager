import { databases, APPWRITE_DATABASE_ID, TABLES } from './appwrite'
import type { ICashRegister, ICashMovement } from '@/types/cashRegister'
import { nowIso, dayjs } from '@/utils/date'
import { toNumber, toDecimalString } from '@/utils/currency'
import { ID, Query } from 'appwrite'

export const CashRegisterService = {
  async row(rowId: string): Promise<ICashRegister> {
    try {
      return await databases.getRow<ICashRegister>({
        databaseId: APPWRITE_DATABASE_ID,
        tableId: TABLES.CASH_REGISTER,
        rowId
      })
    } catch (error) {
      console.error('Erro ao buscar registro de caixa:', error)
      throw error
    }
  },

  async getOpenRegister(): Promise<ICashRegister | null> {
    try {
      const response = await databases.listRows<ICashRegister>({
        databaseId: APPWRITE_DATABASE_ID,
        tableId: TABLES.CASH_REGISTER,
        queries: [Query.equal('status', 'open'), Query.orderDesc('opened_at'), Query.limit(1)]
      })
      return response.rows.length > 0 ? response.rows[0] : null
    } catch (error) {
      console.error('Erro ao buscar caixa aberto:', error)
      return null
    }
  },

  async listHistory(limitCount: number = 30): Promise<ICashRegister[]> {
    try {
      const response = await databases.listRows<ICashRegister>({
        databaseId: APPWRITE_DATABASE_ID,
        tableId: TABLES.CASH_REGISTER,
        queries: [Query.orderDesc('opened_at'), Query.limit(limitCount)]
      })
      return response.rows
    } catch (error) {
      console.error('Erro ao listar histórico de caixa:', error)
      return []
    }
  },

  async create(data: Partial<ICashRegister>): Promise<ICashRegister> {
    try {
      return await databases.createRow({
        databaseId: APPWRITE_DATABASE_ID,
        tableId: TABLES.CASH_REGISTER,
        rowId: ID.unique(),
        data: data as ICashRegister
      })
    } catch (error) {
      console.error('Erro ao criar registro de caixa:', error)
      throw error
    }
  },

  async update(rowId: string, data: Partial<ICashRegister>): Promise<ICashRegister> {
    try {
      return await databases.updateRow({
        databaseId: APPWRITE_DATABASE_ID,
        tableId: TABLES.CASH_REGISTER,
        rowId,
        data: data as Record<string, unknown>
      })
    } catch (error) {
      console.error('Erro ao atualizar registro de caixa:', error)
      throw error
    }
  },

  async upsert(
    rowId: string | undefined,
    data: Partial<ICashRegister>
  ): Promise<ICashRegister> {
    try {
      const id = rowId || ID.unique()

      return await databases.upsertRow({
        databaseId: APPWRITE_DATABASE_ID,
        tableId: TABLES.CASH_REGISTER,
        rowId: id,
        data: data as Record<string, unknown>
      })
    } catch (error) {
      console.error('Erro no upsert de caixa:', error)
      throw error
    }
  },

  async openRegister(dto: Partial<ICashRegister>): Promise<ICashRegister> {
    const active = await this.getOpenRegister()
    if (active) {
      throw new Error('Já existe um caixa aberto no sistema. Feche o caixa atual antes de abrir um novo.')
    }

    return await this.create({
      opened_at: nowIso(),
      opening_balance: toDecimalString(dto.opening_balance || 0),
      total_in: toDecimalString(0),
      total_out: toDecimalString(0),
      status: 'open',
      user_id: dto.user_id || '',
      notes: dto.notes || null
    })
  },

  async recordCashMovement(registerId: string, movement: ICashMovement): Promise<ICashRegister> {
    const register = await this.row(registerId)

    let newTotalIn = toNumber(register.total_in)
    let newTotalOut = toNumber(register.total_out)
    const movAmount = toNumber(movement.amount)

    if (movement.type === 'IN') {
      newTotalIn += movAmount
    } else {
      newTotalOut += movAmount
    }

    const timeStr = dayjs().format('HH:mm:ss')
    const noteAppend = `\n[${timeStr}] ${movement.type === 'IN' ? 'Suprimento' : 'Sangria'}: R$ ${movAmount.toFixed(2)} - ${movement.reason}`
    const updatedNotes = (register.notes || '') + noteAppend

    return await this.update(registerId, {
      total_in: toDecimalString(newTotalIn),
      total_out: toDecimalString(newTotalOut),
      notes: updatedNotes
    })
  },

  async addCashSale(registerId: string, amount: number | string): Promise<ICashRegister> {
    const register = await this.row(registerId)

    const currentTotalIn = toNumber(register.total_in)
    const added = toNumber(amount)

    return await this.update(registerId, {
      total_in: toDecimalString(currentTotalIn + added)
    })
  },

  async closeRegister(registerId: string, dto: Partial<ICashRegister>): Promise<ICashRegister> {
    return await this.update(registerId, {
      closed_at: nowIso(),
      closing_balance: toDecimalString(dto.closing_balance || 0),
      status: 'closed',
      notes: dto.notes || null
    })
  },

  async delete(rowId: string): Promise<void> {
    try {
      await databases.deleteRow({
        databaseId: APPWRITE_DATABASE_ID,
        tableId: TABLES.CASH_REGISTER,
        rowId
      })
    } catch (error) {
      console.error('Erro ao excluir registro de caixa:', error)
      throw error
    }
  }
}

export const cashRegister = CashRegisterService
