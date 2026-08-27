import { databases, APPWRITE_DATABASE_ID, TABLES } from './appwrite'
import type { ICashRegister, ICashMovement } from '@/types/cashRegister'
import { nowIso, dayjs } from '@/utils/date'
import { toNumber, toDecimalString } from '@/utils/currency'
import { ID, Query } from 'appwrite'

export class CashRegister {
  async getOpenRegister(): Promise<ICashRegister | null> {
    const response = await databases.listRows<ICashRegister>({
      databaseId: APPWRITE_DATABASE_ID,
      tableId: TABLES.CASH_REGISTER,
      queries: [Query.equal('status', 'Open'), Query.orderDesc('opened_at'), Query.limit(1)]
    })
    return response.rows.length > 0 ? response.rows[0] : null
  }

  async listHistory(limitCount: number = 30): Promise<ICashRegister[]> {
    const response = await databases.listRows<ICashRegister>({
      databaseId: APPWRITE_DATABASE_ID,
      tableId: TABLES.CASH_REGISTER,
      queries: [Query.orderDesc('opened_at'), Query.limit(limitCount)]
    })
    return response.rows
  }

  async openRegister(dto: Partial<ICashRegister>): Promise<ICashRegister> {
    const active = await this.getOpenRegister()
    if (active) {
      throw new Error('Já existe um caixa aberto no sistema. Feche o caixa atual antes de abrir um novo.')
    }

    return await databases.createRow<ICashRegister>({
      databaseId: APPWRITE_DATABASE_ID,
      tableId: TABLES.CASH_REGISTER,
      rowId: ID.unique(),
      data: {
        opened_at: nowIso(),
        opening_balance: toDecimalString(dto.opening_balance || 0),
        total_in: toDecimalString(0),
        total_out: toDecimalString(0),
        status: 'Open',
        user_id: dto.user_id || '',
        notes: dto.notes || null
      }
    })
  }

  async recordCashMovement(registerId: string, movement: ICashMovement): Promise<ICashRegister> {
    const register = await databases.getRow<ICashRegister>({
      databaseId: APPWRITE_DATABASE_ID,
      tableId: TABLES.CASH_REGISTER,
      rowId: registerId
    })

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

    return await databases.updateRow<ICashRegister>({
      databaseId: APPWRITE_DATABASE_ID,
      tableId: TABLES.CASH_REGISTER,
      rowId: registerId,
      data: {
        total_in: toDecimalString(newTotalIn),
        total_out: toDecimalString(newTotalOut),
        notes: updatedNotes
      }
    })
  }

  async addCashSale(registerId: string, amount: number | string): Promise<ICashRegister> {
    const register = await databases.getRow<ICashRegister>({
      databaseId: APPWRITE_DATABASE_ID,
      tableId: TABLES.CASH_REGISTER,
      rowId: registerId
    })

    const currentTotalIn = toNumber(register.total_in)
    const added = toNumber(amount)

    return await databases.updateRow<ICashRegister>({
      databaseId: APPWRITE_DATABASE_ID,
      tableId: TABLES.CASH_REGISTER,
      rowId: registerId,
      data: {
        total_in: toDecimalString(currentTotalIn + added)
      }
    })
  }

  async closeRegister(registerId: string, dto: Partial<ICashRegister>): Promise<ICashRegister> {
    return await databases.updateRow<ICashRegister>({
      databaseId: APPWRITE_DATABASE_ID,
      tableId: TABLES.CASH_REGISTER,
      rowId: registerId,
      data: {
        closed_at: nowIso(),
        closing_balance: toDecimalString(dto.closing_balance || 0),
        status: 'Closed',
        notes: dto.notes || null
      }
    })
  }
}

export const cashRegister = new CashRegister()
