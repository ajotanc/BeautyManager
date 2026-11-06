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

/** Rótulo e conteúdo do QR Code do cupom conforme as configurações da loja. */
export function getReceiptQr(settings?: Partial<ISettings> | null): { label: string; payload: string } {
  if (!settings) return { label: 'ESCANEIE AQUI', payload: 'https://beautymanager.loja' }
  if (settings.qrcode_type === 'whatsapp') {
    const rawPhone = settings.phone?.replace(/\D/g, '') || ''
    return {
      label: 'WHATSAPP DA LOJA',
      payload: rawPhone ? `https://api.whatsapp.com/send?phone=55${rawPhone}` : settings.qrcode_payload || 'https://api.whatsapp.com/'
    }
  }
  if (settings.qrcode_type === 'instagram') {
    const cleanUser = settings.instagram?.replace('@', '').trim() || ''
    return {
      label: 'INSTAGRAM DA LOJA',
      payload: cleanUser ? `https://instagram.com/${cleanUser}` : settings.qrcode_payload || 'https://instagram.com'
    }
  }
  if (settings.qrcode_type === 'pix') {
    return { label: 'CHAVE PIX', payload: settings.pix_key || settings.qrcode_payload || 'pix-chave' }
  }
  return { label: 'ESCANEIE AQUI', payload: settings.qrcode_payload || 'https://beautymanager.loja' }
}
