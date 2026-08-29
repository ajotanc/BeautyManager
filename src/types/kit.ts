import type { Models } from 'appwrite'
import type { IProduct } from './product'

export type CampaignEventType =
  | 'mothers_day'
  | 'valentines_day'
  | 'christmas'
  | 'womens_day'
  | 'fathers_day'
  | 'black_friday'
  | 'easter'
  | 'new_year_sales'
  | 'back_to_school'
  | 'carnival'
  | 'consumer_day'
  | 'client_day'
  | 'childrens_day'
  | 'custom'

export interface ICampaignEventOption {
  value: CampaignEventType
  label: string
  icon: string
  color: string
  bgLight: string
  defaultDate?: string
}

export const CAMPAIGN_EVENTS: Record<CampaignEventType, ICampaignEventOption> = {
  mothers_day: {
    value: 'mothers_day',
    label: 'Dia das Mães',
    icon: 'ri-heart-3-line',
    color: '#ec4899',
    bgLight: 'rgba(236, 72, 153, 0.12)',
    defaultDate: '10/05'
  },
  valentines_day: {
    value: 'valentines_day',
    label: 'Dia dos Namorados',
    icon: 'ri-hearts-line',
    color: '#e11d48',
    bgLight: 'rgba(225, 29, 72, 0.12)',
    defaultDate: '12/06'
  },
  christmas: {
    value: 'christmas',
    label: 'Natal & Fim de Ano',
    icon: 'ri-gift-line',
    color: '#16a34a',
    bgLight: 'rgba(22, 163, 74, 0.12)',
    defaultDate: '25/12'
  },
  womens_day: {
    value: 'womens_day',
    label: 'Dia da Mulher',
    icon: 'ri-sparkling-line',
    color: '#9333ea',
    bgLight: 'rgba(147, 51, 234, 0.12)',
    defaultDate: '08/03'
  },
  fathers_day: {
    value: 'fathers_day',
    label: 'Dia dos Pais',
    icon: 'ri-user-star-line',
    color: '#2563eb',
    bgLight: 'rgba(37, 99, 235, 0.12)',
    defaultDate: '09/08'
  },
  black_friday: {
    value: 'black_friday',
    label: 'Black Friday',
    icon: 'ri-percent-line',
    color: '#0f172a',
    bgLight: 'rgba(15, 23, 42, 0.12)',
    defaultDate: '27/11'
  },
  easter: {
    value: 'easter',
    label: 'Páscoa',
    icon: 'ri-cake-3-line',
    color: '#ea580c',
    bgLight: 'rgba(234, 88, 12, 0.12)',
    defaultDate: '05/04'
  },
  new_year_sales: {
    value: 'new_year_sales',
    label: 'Ano Novo',
    icon: 'ri-calendar-line',
    color: '#0284c7',
    bgLight: 'rgba(2, 132, 199, 0.12)',
    defaultDate: '10/01'
  },
  back_to_school: {
    value: 'back_to_school',
    label: 'Volta às Aulas',
    icon: 'ri-book-open-line',
    color: '#14b8a6',
    bgLight: 'rgba(20, 184, 166, 0.12)',
    defaultDate: '25/01'
  },
  carnival: {
    value: 'carnival',
    label: 'Carnaval',
    icon: 'ri-vip-crown-line',
    color: '#8b5cf6',
    bgLight: 'rgba(139, 92, 246, 0.12)',
    defaultDate: '15/02'
  },
  consumer_day: {
    value: 'consumer_day',
    label: 'Dia do Consumidor',
    icon: 'ri-shopping-cart-2-line',
    color: '#d946ef',
    bgLight: 'rgba(217, 70, 239, 0.12)',
    defaultDate: '15/03'
  },
  client_day: {
    value: 'client_day',
    label: 'Dia do Cliente',
    icon: 'ri-group-line',
    color: '#f59e0b',
    bgLight: 'rgba(245, 158, 11, 0.12)',
    defaultDate: '15/09'
  },
  childrens_day: {
    value: 'childrens_day',
    label: 'Dia das Crianças',
    icon: 'ri-bear-smile-line',
    color: '#06b6d4',
    bgLight: 'rgba(6, 182, 212, 0.12)',
    defaultDate: '12/10'
  },
  custom: {
    value: 'custom',
    label: 'Campanha Especial / Outros',
    icon: 'ri-calendar-event-line',
    color: '#c28b38',
    bgLight: 'rgba(194, 139, 56, 0.14)'
  }
}

export const CAMPAIGN_EVENT_OPTIONS: ICampaignEventOption[] = Object.values(CAMPAIGN_EVENTS)

export function getCampaignEvent(type: CampaignEventType | string | null | undefined): ICampaignEventOption {
  if (!type || !(type in CAMPAIGN_EVENTS)) {
    return CAMPAIGN_EVENTS.custom
  }
  return CAMPAIGN_EVENTS[type as CampaignEventType]
}

export interface IKitItem extends Models.Row {
  product: IProduct
  quantity: number
}

export interface IKit extends Models.Row {
  name: string
  barcode: string
  campaign_event: CampaignEventType | string
  event_date?: string | null // Formato brasileiro DD/MM/YYYY ou DD/MM
  packaging_cost?: string | null // Armazenado como string (ex: "4.50")
  selling_price: string // Armazenado como string (ex: "89.90")
  description?: string | null
  is_active: boolean
  items?: IKitItem[]
}
