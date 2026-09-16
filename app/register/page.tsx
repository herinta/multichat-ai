'use client'

import { Suspense } from 'react'
import { LoginFormContent } from '../login/page'

export default function RegisterPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
      </div>
    }>
      <LoginFormContent initialMode="register" />
    </Suspense>
  )
}
