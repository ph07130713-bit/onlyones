import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react'
import type { ReactNode } from 'react'
import type { Session, User } from '@supabase/supabase-js'
import { supabase } from './supabase'

type AuthState = {
  currentUser: User | null
  session: Session | null
  loading: boolean
  signInWithGoogle: () => Promise<void>
  signInWithEmailPassword: (email: string, password: string) => Promise<void>
  signUpWithEmailPassword: (email: string, password: string) => Promise<void>
  signOut: () => Promise<void>
}

const AuthContext = createContext<AuthState | undefined>(undefined)

async function ensureUserRecord(user: User) {
  const { error } = await supabase
    .from('users')
    .upsert(
      {
        id: user.id,
        email: user.email ?? '',
      },
      {
        onConflict: 'id',
        ignoreDuplicates: true,
      },
    )

  if (error) {
    console.error(error)
  }
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [currentUser, setCurrentUser] = useState<User | null>(null)
  const [session, setSession] = useState<Session | null>(null)
  const [loading, setLoading] = useState(true)

  const setFromSession = useCallback((nextSession: Session | null) => {
    setSession(nextSession)
    setCurrentUser(nextSession?.user ?? null)
    setLoading(false)
    if (nextSession?.user) {
      void ensureUserRecord(nextSession.user)
    }
  }, [])

  useEffect(() => {
    let active = true

    supabase.auth
      .getSession()
      .then(({ data, error }) => {
        if (!active) return
        if (error) {
          console.error(error)
        }
        setFromSession(data.session ?? null)
      })
      .catch((error) => {
        if (!active) return
        console.error(error)
        setLoading(false)
      })

    const { data } = supabase.auth.onAuthStateChange((_, nextSession) => {
      setFromSession(nextSession)
    })

    return () => {
      active = false
      data.subscription.unsubscribe()
    }
  }, [setFromSession])

  const signInWithGoogle = useCallback(async () => {
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${window.location.origin}/auth/callback`,
      },
    })

    if (error) {
      throw error
    }
  }, [])

  const signInWithEmailPassword = useCallback(
    async (email: string, password: string) => {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      })

      if (error) {
        throw error
      }
    },
    [],
  )

  const signUpWithEmailPassword = useCallback(
    async (email: string, password: string) => {
      const { error } = await supabase.auth.signUp({
        email,
        password,
      })

      if (error) {
        throw error
      }
    },
    [],
  )

  const signOut = useCallback(async () => {
    const { error } = await supabase.auth.signOut()
    if (error) {
      throw error
    }
  }, [])

  const value = useMemo(
    () => ({
      currentUser,
      session,
      loading,
      signInWithGoogle,
      signInWithEmailPassword,
      signUpWithEmailPassword,
      signOut,
    }),
    [
      currentUser,
      session,
      loading,
      signInWithGoogle,
      signInWithEmailPassword,
      signUpWithEmailPassword,
      signOut,
    ],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const context = useContext(AuthContext)

  if (!context) {
    throw new Error('useAuth must be used within AuthProvider')
  }

  return context
}
