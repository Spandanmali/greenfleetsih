import { User } from '../types'

export function getStoredUser(): User | null {
  try {
    const raw = localStorage.getItem('user')
    return raw ? JSON.parse(raw) : null
  } catch {
    return null
  }
}

export function storeSession(token: string, user: User) {
  localStorage.setItem('token', token)
  localStorage.setItem('user', JSON.stringify(user))
}

export function clearSession() {
  localStorage.removeItem('token')
  localStorage.removeItem('user')
}

function onboardingKey(user: User): string {
  return `greenfleet-onboarding-complete:${user.id || user.email}`
}

export function hasCompletedOnboarding(user: User | null): boolean {
  return user ? localStorage.getItem(onboardingKey(user)) === 'true' : false
}

export function completeOnboarding(user: User | null) {
  if (user) localStorage.setItem(onboardingKey(user), 'true')
}

export function canWrite(user: User | null): boolean {
  return user?.role === 'admin' || user?.role === 'full_access'
}
