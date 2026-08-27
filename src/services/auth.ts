import { account } from './appwrite'
import type { AuthUser, LoginCredentials, UserPreferences } from '@/types/auth'
import { ID } from 'appwrite'

export class Auth {
  /**
   * Realiza login com e-mail e senha
   */
  async login(credentials: LoginCredentials): Promise<void> {
    await account.createEmailPasswordSession({ email: credentials.email, password: credentials.password })
  }

  /**
   * Obtém o usuário atualmente autenticado com suas preferências
   */
  async getCurrentUser(): Promise<AuthUser | null> {
    try {
      const user = await account.get<UserPreferences>()
      return user
    } catch {
      return null
    }
  }

  /**
   * Encerra a sessão ativa do usuário
   */
  async logout(): Promise<void> {
    await account.deleteSession('current')
  }

  /**
   * Atualiza as preferências do usuário (ex: papel de admin/caixa)
   */
  async updatePreferences(prefs: UserPreferences): Promise<UserPreferences> {
    const updated = await account.updatePrefs<UserPreferences>({ prefs })
    return updated.prefs
  }

  /**
   * Registra um novo usuário (para setup inicial)
   */
  async register(email: string, password: string, name: string): Promise<void> {
    await account.create({ userId: ID.unique(), email, password, name })
  }
}

export const auth = new Auth()
// Alias para compatibilidade
export const authService = auth
