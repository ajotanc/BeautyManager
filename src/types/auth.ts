import type { Models } from 'appwrite'

export type UserRole = 'admin' | 'cashier'

export interface UserPreferences extends Models.Preferences {
  role?: UserRole
  store_name?: string
}

export type AuthUser = Models.User<UserPreferences>

export interface LoginCredentials {
  email: string
  password: string
}
