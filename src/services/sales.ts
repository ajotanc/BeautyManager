import { databases, APPWRITE_DATABASE_ID, TABLES } from './appwrite'
import type { CreateSaleInput, ISale, ISaleItem } from '@/types/sale'
import { toDecimalString } from '@/utils/currency'
import { inventory } from './inventory'
import { ID, Query } from 'appwrite'
import { IProduct } from '@/types/product'

export class Sales {
  async listRecent(limitCount: number = 100): Promise<ISale[]> {
    const response = await databases.listRows<ISale>({
      databaseId: APPWRITE_DATABASE_ID,
      tableId: TABLES.SALES,
      queries: [Query.orderDesc('$createdAt'), Query.limit(limitCount)]
    })
    return response.rows
  }

  async getSaleWithItems(saleId: string): Promise<ISale> {
    const sale = await databases.getRow<ISale>({
      databaseId: APPWRITE_DATABASE_ID,
      tableId: TABLES.SALES,
      rowId: saleId
    })

    const itemsResponse = await databases.listRows<ISaleItem>({
      databaseId: APPWRITE_DATABASE_ID,
      tableId: TABLES.SALE_ITEMS,
      queries: [Query.equal('sale', saleId), Query.limit(100)]
    })

    sale.items = itemsResponse.rows
    return sale
  }

  async createSale(dto: CreateSaleInput): Promise<ISale> {
    if (dto.items && dto.items.length > 0) {
      for (const item of dto.items) {
        const product = item.product as IProduct
        if ((product.stock_quantity ?? 0) < item.quantity) {
          throw new Error(`Estoque insuficiente para o produto ${product.name ?? product.$id}`)
        }
      }
    }

    const { items, ...saleData } = dto

    const createdSale = await databases.createRow<ISale>({
      databaseId: APPWRITE_DATABASE_ID,
      tableId: TABLES.SALES,
      rowId: ID.unique(),
      data: {
        ...saleData,
        total_amount: toDecimalString(saleData.total_amount),
        discount_amount: toDecimalString(saleData.discount_amount || 0),
      }
    })

    const createdItems: ISaleItem[] = []
    if (items && items.length > 0) {
      for (const item of items) {
        const product = item.product as IProduct

        const itemRow = await databases.createRow<ISaleItem>({
          databaseId: APPWRITE_DATABASE_ID,
          tableId: TABLES.SALE_ITEMS,
          rowId: ID.unique(),
          data: {
            product,
            quantity: item.quantity,
            unit_price: toDecimalString(item.unit_price),
            subtotal: toDecimalString(item.subtotal)
          }
        })
        createdItems.push(itemRow)

        await inventory.recordTransaction({
          product: product.$id,
          transaction_type: 'OUT',
          quantity: item.quantity,
          reason: 'Sale'
        })
      }
    }

    createdSale.items = createdItems
    return createdSale
  }

  async cancelSale(saleId: string): Promise<ISale> {
    const sale = await this.getSaleWithItems(saleId)

    if (sale.status === 'Canceled') {
      return sale
    }

    // Estorna os itens de volta ao estoque
    if (sale.items) {
      for (const item of sale.items) {
        const prodId = typeof item.product === 'object' && item.product ? item.product.$id : (item.product as string)
        await inventory.recordTransaction({
          product: prodId,
          transaction_type: 'IN',
          quantity: item.quantity,
          reason: 'Devolution'
        })
      }
    }

    // Atualiza status da venda para Canceled via updateRow
    const updated = await databases.updateRow<ISale>({
      databaseId: APPWRITE_DATABASE_ID,
      tableId: TABLES.SALES,
      rowId: saleId,
      data: { status: 'Canceled' }
    })

    return updated
  }
}

export const sales = new Sales()
