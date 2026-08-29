import type { Models } from 'appwrite'

export type ReceiptWidth = '58mm' | '80mm'
export type QrCodeType = 'whatsapp' | 'instagram' | 'pix' | 'custom'

export interface ISettings extends Models.Row {
  store_name: string
  document_number: string
  phone: string
  instagram: string
  address: string
  receipt_header: string
  receipt_footer: string
  receipt_width: ReceiptWidth
  show_qrcode: boolean
  qrcode_type: QrCodeType
  qrcode_payload: string
  pix_key?: string
  loyalty_milestone?: number
}