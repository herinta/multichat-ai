'use server'

import { createClient } from '@/utils/supabase/server'
import { cookies } from 'next/headers'

export async function login(formData: FormData) {
  const cookieStore = await cookies()
  const supabase = createClient(cookieStore)

  const email = formData.get('email') as string
  const password = formData.get('password') as string

  const { error } = await supabase.auth.signInWithPassword({
    email,
    password,
  })

  if (error) {
    return { error: error.message }
  }

  return { success: true }
}

export async function signup(formData: FormData) {
  const cookieStore = await cookies()
  const supabase = createClient(cookieStore)

  const email = formData.get('email') as string
  const password = formData.get('password') as string
  const username = formData.get('username') as string

  if (!username) {
    return { error: 'Username is required.' }
  }

  // 1. Sign up the user in Supabase Auth
  // We pass the username in the metadata so a Database Trigger can handle the profile creation.
  const { error: authError } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: {
        username: username,
      }
    }
  })

  if (authError) {
    return { error: authError.message }
  }

  return { success: true }
}
