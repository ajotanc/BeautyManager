import type { ISale } from '@/types/sale'
import type { ISettings } from '@/types/storeSettings'
import { formatCurrency } from './currency'
import { formatDateTime } from './date'

export function generateSaleReceiptText(sale: ISale, settings?: ISettings | null): string {
  const storeName = settings?.store_name || 'Beauty Manager'
  const storePhone = settings?.phone ? `\nWhatsApp: ${settings.phone}` : ''
  const storeInstagram = settings?.instagram ? `\nInstagram: ${settings.instagram}` : ''
  const footer = settings?.receipt_footer ? `\n\n${settings.receipt_footer}` : ''

  let text = `*${storeName}*${storePhone}${storeInstagram}\n`
  text += `--------------------------------\n`
  text += `*COMPROVANTE DE COMPRA*\n`
  text += `Data: ${formatDateTime(sale.$createdAt)}\n`
  if (sale.customer_name) {
    text += `Cliente: ${sale.customer_name}\n`
  }
  text += `Pagamento: ${sale.payment_method}\n`
  text += `--------------------------------\n`

  if (sale.items && sale.items.length > 0) {
    for (const item of sale.items) {
      const prodName = typeof item.product === 'object' && item.product ? item.product.name : 'Produto'
      text += `${item.quantity}x ${prodName} - ${formatCurrency(item.subtotal)}\n`
    }
    text += `--------------------------------\n`
  }

  if (sale.discount_amount && Number(sale.discount_amount) > 0) {
    text += `Desconto: -${formatCurrency(sale.discount_amount)}\n`
  }
  text += `*TOTAL: ${formatCurrency(sale.total_amount)}*`
  text += `${footer}\n\nAgradecemos a sua preferência!`

  return text
}
