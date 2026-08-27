import { Client, Account, TablesDB } from 'appwrite'

export const APPWRITE_ENDPOINT = import.meta.env.VITE_APPWRITE_ENDPOINT || 'https://api.ajotanc.com.br/v1'
export const APPWRITE_PROJECT_ID = import.meta.env.VITE_APPWRITE_PROJECT_ID || 'beauty-manager'
export const APPWRITE_DATABASE_ID = import.meta.env.VITE_APPWRITE_DATABASE_ID || 'beauty_manager'

export const TABLES = {
  CATEGORIES: 'categories',
  BRANDS: 'brands',
  PRODUCTS: 'products',
  INVENTORY_TRANSACTIONS: 'inventory_transactions',
  SALES: 'sales',
  SALE_ITEMS: 'sale_items',
  CASH_REGISTER: 'cash_register',
  STORE_SETTINGS: 'settings'
} as const

// Inicialização oficial do Appwrite Client
export const client = new Client()
client
  .setEndpoint(APPWRITE_ENDPOINT)
  .setProject(APPWRITE_PROJECT_ID)

export const account = new Account(client)

// Instância oficial TablesDB do SDK Appwrite 1.8.x
export const databases = new TablesDB(client)