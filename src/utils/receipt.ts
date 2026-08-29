import { formatPaymentMethod, type ISale } from '@/types/sale'
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
  text += `Pagamento: ${formatPaymentMethod(sale.payment_method)}\n`
  text += `--------------------------------\n`

  if (sale.items && sale.items.length > 0) {
    const kitMap = new Map<string, { name: string; total: number; components: string[] }>()
    const regularItems: string[] = []

    for (const item of sale.items) {
      const prodName = item.product.name;

      if (item.kit) {
        const kitId = item.kit.$id
        if (!kitMap.has(kitId)) {
          kitMap.set(kitId, {
            name: item.kit.name,
            total: 0,
            components: []
          })
        }
        const kitEntry = kitMap.get(kitId)!
        kitEntry.total += Number(item.subtotal)
        kitEntry.components.push(`- ${item.quantity}x ${prodName}`)
      } else {
        regularItems.push(`*${item.quantity}x ${prodName}* - ${formatCurrency(item.subtotal)}`)
      }
    }

    for (const [_, kitData] of kitMap) {
      text += `*1x ${kitData.name}* - ${formatCurrency(kitData.total)}\n`
      text += kitData.components.join('\n') + '\n'
    }

    if (regularItems.length > 0) {
      text += regularItems.join('\n') + '\n'
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
