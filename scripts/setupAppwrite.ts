import { Client, Databases, Permission, Role, ID, AppwriteException } from 'node-appwrite'

const ENDPOINT = process.env.VITE_APPWRITE_ENDPOINT || 'https://api.ajotanc.com.br/v1'
const PROJECT_ID = process.env.VITE_APPWRITE_PROJECT_ID || 'beauty-manager'
const API_KEY = process.env.APPWRITE_API_KEY || ''
const DATABASE_ID = process.env.VITE_APPWRITE_DATABASE_ID || 'beauty_manager'

console.log('🚀 Iniciando configuração do banco de dados Appwrite para o Beauty Manager...')
console.log(`📡 Endpoint: ${ENDPOINT}`)
console.log(`📂 Project ID: ${PROJECT_ID}`)
console.log(`🗄️ Database ID: ${DATABASE_ID}`)

if (!API_KEY) {
  console.warn('⚠️ AVISO: APPWRITE_API_KEY não foi informada nas variáveis de ambiente. Defina APPWRITE_API_KEY para execução automatizada.')
}

const client = new Client()
  .setEndpoint(ENDPOINT)
  .setProject(PROJECT_ID)

if (API_KEY) {
  client.setKey(API_KEY)
}

const databases = new Databases(client)

async function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

async function ensureDatabase(): Promise<void> {
  try {
    await databases.get(DATABASE_ID)
    console.log(`✅ Banco de dados "${DATABASE_ID}" já existe.`)
  } catch (error: unknown) {
    if (error instanceof AppwriteException && error.code === 404) {
      console.log(`➕ Criando banco de dados "${DATABASE_ID}"...`)
      await databases.create(DATABASE_ID, 'Beauty Manager DB')
      console.log(`✅ Banco de dados "${DATABASE_ID}" criado com sucesso!`)
    } else {
      throw error
    }
  }
}

async function ensureCollection(
  collectionId: string,
  name: string,
  permissions: string[] = [
    Permission.read(Role.any()),
    Permission.create(Role.users()),
    Permission.update(Role.users()),
    Permission.delete(Role.users())
  ]
): Promise<void> {
  try {
    await databases.getCollection(DATABASE_ID, collectionId)
    console.log(`  📦 Coleção "${collectionId}" já existe.`)
  } catch (error: unknown) {
    if (error instanceof AppwriteException && error.code === 404) {
      console.log(`  ➕ Criando coleção "${collectionId}" (${name})...`)
      await databases.createCollection(DATABASE_ID, collectionId, name, permissions)
      console.log(`  ✅ Coleção "${collectionId}" criada!`)
      await sleep(1000)
    } else {
      throw error
    }
  }
}

async function setupSchema(): Promise<void> {
  try {
    await ensureDatabase()

    // 1. Categories
    console.log('\n--- Configurando Coleção: categories ---')
    await ensureCollection('categories', 'Categorias de Produtos')
    try {
      await databases.createStringAttribute(DATABASE_ID, 'categories', 'name', 255, true)
      console.log('    + Atributo name criado em categories')
      await sleep(800)
    } catch {
      // Atributo já existe
    }

    // 2. Brands
    console.log('\n--- Configurando Coleção: brands ---')
    await ensureCollection('brands', 'Marcas e Fabricantes')
    try {
      await databases.createStringAttribute(DATABASE_ID, 'brands', 'name', 255, true)
      console.log('    + Atributo name criado em brands')
      await sleep(800)
    } catch {
      // Atributo já existe
    }

    // 3. Products
    console.log('\n--- Configurando Coleção: products ---')
    await ensureCollection('products', 'Produtos e Cosméticos')
    const productAttrs = [
      () => databases.createStringAttribute(DATABASE_ID, 'products', 'barcode', 100, true),
      () => databases.createStringAttribute(DATABASE_ID, 'products', 'name', 255, true),
      () => databases.createStringAttribute(DATABASE_ID, 'products', 'category', 50, false),
      () => databases.createStringAttribute(DATABASE_ID, 'products', 'brand', 50, false),
      () => databases.createStringAttribute(DATABASE_ID, 'products', 'cost_price', 50, true),
      () => databases.createStringAttribute(DATABASE_ID, 'products', 'profit_margin', 50, true),
      () => databases.createStringAttribute(DATABASE_ID, 'products', 'selling_price', 50, true),
      () => databases.createIntegerAttribute(DATABASE_ID, 'products', 'stock_quantity', true),
      () => databases.createIntegerAttribute(DATABASE_ID, 'products', 'min_stock_alert', true, undefined, undefined, 5),
      () => databases.createDatetimeAttribute(DATABASE_ID, 'products', 'expiry_date', false),
      () => databases.createBooleanAttribute(DATABASE_ID, 'products', 'is_quick_sale', false, false)
    ]
    for (const createAttr of productAttrs) {
      try {
        await createAttr()
        await sleep(600)
      } catch {
        // Atributo já existe
      }
    }

    // 4. Inventory Transactions
    console.log('\n--- Configurando Coleção: inventory_transactions ---')
    await ensureCollection('inventory_transactions', 'Movimentações de Estoque')
    const invAttrs = [
      () => databases.createStringAttribute(DATABASE_ID, 'inventory_transactions', 'product', 50, true),
      () => databases.createEnumAttribute(DATABASE_ID, 'inventory_transactions', 'transaction_type', ['IN', 'OUT'], true),
      () => databases.createIntegerAttribute(DATABASE_ID, 'inventory_transactions', 'quantity', true),
      () => databases.createEnumAttribute(DATABASE_ID, 'inventory_transactions', 'reason', ['Purchase', 'Sale', 'Adjustment', 'Damage', 'Devolution'], true)
    ]
    for (const createAttr of invAttrs) {
      try {
        await createAttr()
        await sleep(600)
      } catch {
        // Atributo já existe
      }
    }

    // 5. Sales
    console.log('\n--- Configurando Coleção: sales ---')
    await ensureCollection('sales', 'Vendas Realizadas')
    const saleAttrs = [
      () => databases.createStringAttribute(DATABASE_ID, 'sales', 'total_amount', 50, true),
      () => databases.createStringAttribute(DATABASE_ID, 'sales', 'discount_amount', 50, false, '0.00'),
      () => databases.createEnumAttribute(DATABASE_ID, 'sales', 'payment_method', ['Pix', 'Credit', 'Debit', 'Cash'], true),
      () => databases.createStringAttribute(DATABASE_ID, 'sales', 'customer_name', 255, false),
      () => databases.createStringAttribute(DATABASE_ID, 'sales', 'customer_phone', 50, false),
      () => databases.createEnumAttribute(DATABASE_ID, 'sales', 'status', ['Completed', 'Canceled'], true),
      () => databases.createStringAttribute(DATABASE_ID, 'sales', 'user_id', 50, true)
    ]
    for (const createAttr of saleAttrs) {
      try {
        await createAttr()
        await sleep(600)
      } catch {
        // Atributo já existe
      }
    }

    // 6. Sale Items
    console.log('\n--- Configurando Coleção: sale_items ---')
    await ensureCollection('sale_items', 'Itens das Vendas')
    const itemAttrs = [
      () => databases.createStringAttribute(DATABASE_ID, 'sale_items', 'sale', 50, true),
      () => databases.createStringAttribute(DATABASE_ID, 'sale_items', 'product', 50, true),
      () => databases.createIntegerAttribute(DATABASE_ID, 'sale_items', 'quantity', true),
      () => databases.createStringAttribute(DATABASE_ID, 'sale_items', 'unit_price', 50, true),
      () => databases.createStringAttribute(DATABASE_ID, 'sale_items', 'subtotal', 50, true)
    ]
    for (const createAttr of itemAttrs) {
      try {
        await createAttr()
        await sleep(600)
      } catch {
        // Atributo já existe
      }
    }

    // 7. Cash Register
    console.log('\n--- Configurando Coleção: cash_register ---')
    await ensureCollection('cash_register', 'Caixa Diário')
    const cashAttrs = [
      () => databases.createDatetimeAttribute(DATABASE_ID, 'cash_register', 'opened_at', true),
      () => databases.createDatetimeAttribute(DATABASE_ID, 'cash_register', 'closed_at', false),
      () => databases.createStringAttribute(DATABASE_ID, 'cash_register', 'opening_balance', 50, true),
      () => databases.createStringAttribute(DATABASE_ID, 'cash_register', 'total_in', 50, true),
      () => databases.createStringAttribute(DATABASE_ID, 'cash_register', 'total_out', 50, true),
      () => databases.createStringAttribute(DATABASE_ID, 'cash_register', 'closing_balance', 50, false),
      () => databases.createEnumAttribute(DATABASE_ID, 'cash_register', 'status', ['Open', 'Closed'], true),
      () => databases.createStringAttribute(DATABASE_ID, 'cash_register', 'user_id', 50, true),
      () => databases.createStringAttribute(DATABASE_ID, 'cash_register', 'notes', 1000, false)
    ]
    for (const createAttr of cashAttrs) {
      try {
        await createAttr()
        await sleep(600)
      } catch {
        // Atributo já existe
      }
    }

    // 8. Store Settings
    console.log('\n--- Configurando Coleção: settings ---')
    await ensureCollection('settings', 'Configurações da Loja e Cupom')
    const settingsAttrs = [
      () => databases.createStringAttribute(DATABASE_ID, 'settings', 'store_name', 255, true),
      () => databases.createStringAttribute(DATABASE_ID, 'settings', 'document_number', 50, false),
      () => databases.createStringAttribute(DATABASE_ID, 'settings', 'phone', 50, false),
      () => databases.createStringAttribute(DATABASE_ID, 'settings', 'instagram', 100, false),
      () => databases.createStringAttribute(DATABASE_ID, 'settings', 'address', 255, false),
      () => databases.createStringAttribute(DATABASE_ID, 'settings', 'receipt_header', 500, false),
      () => databases.createStringAttribute(DATABASE_ID, 'settings', 'receipt_footer', 500, false),
      () => databases.createEnumAttribute(DATABASE_ID, 'settings', 'receipt_width', ['58mm', '80mm'], false, '58mm'),
      () => databases.createBooleanAttribute(DATABASE_ID, 'settings', 'show_qrcode', false, true),
      () => databases.createEnumAttribute(DATABASE_ID, 'settings', 'qrcode_type', ['whatsapp', 'instagram', 'pix', 'custom'], false, 'whatsapp'),
      () => databases.createStringAttribute(DATABASE_ID, 'settings', 'qrcode_payload', 1000, false),
      () => databases.createStringAttribute(DATABASE_ID, 'settings', 'pix_key', 255, false)
    ]
    for (const createAttr of settingsAttrs) {
      try {
        await createAttr()
        await sleep(600)
      } catch {
        // Atributo já existe
      }
    }

    console.log('\n🎉 Todas as coleções e atributos foram criados com sucesso no Appwrite!')
  } catch (error: unknown) {
    if (error instanceof Error) {
      console.error('❌ Erro durante a configuração do Appwrite:', error.message)
    } else {
      console.error('❌ Erro desconhecido durante a configuração do Appwrite:', error)
    }
  }
}

setupSchema()
