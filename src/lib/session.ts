import { cookies } from 'next/headers'

export async function getSession(): Promise<SessionData | null> {
  try {
    const cookieStore = await cookies()
    const sessionCookie = cookieStore.get('42-session')
    
    if (!sessionCookie) {
      return null
    }

    return JSON.parse(sessionCookie.value)
  } catch (error) {
    console.error('Error getting session:', error)
    return null
  }
}

export async function signOut() {
  const cookieStore = await cookies()
  cookieStore.delete('42-session')
}
