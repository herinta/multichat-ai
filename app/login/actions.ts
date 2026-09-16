'use server'

import { createClient } from '@/utils/supabase/server'
import { cookies } from 'next/headers'

export async function login(formData: FormData) {
  const cookieStore = await cookies()
  const supabase = createClient(cookieStore)

  const email = (formData.get('email') as string)?.trim()
  const password = formData.get('password') as string

  if (!email || !password) {
    return { error: 'Email dan kata sandi wajib diisi.' }
  }

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

  const email = (formData.get('email') as string)?.trim()
  const password = formData.get('password') as string
  const username = (formData.get('username') as string)?.trim()

  if (!username) {
    return { error: 'Username wajib diisi.' }
  }

  if (!email || !password) {
    return { error: 'Email dan kata sandi wajib diisi.' }
  }

  if (password.length < 6) {
    return { error: 'Kata sandi minimal 6 karakter.' }
  }

  // Sign up user in Supabase Auth
  const { data, error: authError } = await supabase.auth.signUp({
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

  if (data?.session) {
    return { success: true }
  }

  return { 
    success: true, 
    needsVerification: true,
    message: 'Pendaftaran berhasil! Akun Anda telah dibuat. Silakan periksa email jika konfirmasi diperlukan, atau beralih ke Masuk.' 
  }
}
