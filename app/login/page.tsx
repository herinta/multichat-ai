'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { login, signup } from './actions'
import { Button } from '@/components/Modern/Button'

export default function LoginPage() {
  const router = useRouter()
  const [isLogin, setIsLogin] = useState(true)
  const [errorMsg, setErrorMsg] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setIsLoading(true)
    setErrorMsg(null)
    
    const formData = new FormData(e.currentTarget)
    
    try {
      if (isLogin) {
        const res = await login(formData)
        if (res?.error) setErrorMsg(res.error)
        else if (res?.success) router.push('/')
      } else {
        const res = await signup(formData)
        if (res?.error) setErrorMsg(res.error)
        else if (res?.success) router.push('/')
      }
    } catch (err: Error | unknown) {
      const errorMessage = err instanceof Error ? err.message : 'An unexpected error occurred.';
      setErrorMsg(errorMessage)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] bg-blend-overlay p-4">
      <div className="bg-white p-8 rounded-2xl shadow-xl w-full max-w-md border border-gray-100">
        
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-full mx-auto mb-4 flex items-center justify-center shadow-md">
            <svg className="w-8 h-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8h2a2 2 0 012 2v6a2 2 0 01-2 2h-2v4l-4-4H9a1.994 1.994 0 01-1.414-.586m0 0L11 14h4a2 2 0 002-2V6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2v4l.586-.586z" />
            </svg>
          </div>
          <h1 className="text-2xl font-bold text-gray-900">
            {isLogin ? 'Welcome Back' : 'Create an Account'}
          </h1>
          <p className="text-gray-500 text-sm mt-2">
            {isLogin 
              ? 'Sign in to access your multi-agent chats.' 
              : 'Sign up to start chatting with AI personas.'}
          </p>
        </div>

        {errorMsg && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 text-red-600 rounded-xl text-sm font-medium flex items-start gap-3">
            <svg className="w-5 h-5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
               <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span>{errorMsg}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5">
          {!isLogin && (
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1" htmlFor="username">Username</label>
              <input
                id="username"
                name="username"
                type="text"
                required={!isLogin}
                className="w-full bg-gray-50 border border-gray-200 rounded-xl p-3 text-sm focus:ring-2 focus:ring-blue-100 focus:border-blue-400 outline-none transition-all"
                placeholder="e.g. john_doe"
              />
            </div>
          )}
          
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1" htmlFor="email">Email</label>
            <input
              id="email"
              name="email"
              type="email"
              required
              className="w-full bg-gray-50 border border-gray-200 rounded-xl p-3 text-sm focus:ring-2 focus:ring-blue-100 focus:border-blue-400 outline-none transition-all"
              placeholder="you@example.com"
            />
          </div>
          
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1" htmlFor="password">Password</label>
            <input
              id="password"
              name="password"
              type="password"
              required
              className="w-full bg-gray-50 border border-gray-200 rounded-xl p-3 text-sm focus:ring-2 focus:ring-blue-100 focus:border-blue-400 outline-none transition-all"
              placeholder="••••••••"
            />
          </div>

          <Button type="submit" variant="primary" className="w-full py-3" disabled={isLoading}>
            {isLoading ? 'Processing...' : (isLogin ? 'Sign In' : 'Sign Up')}
          </Button>
        </form>

        <div className="mt-8 text-center text-sm text-gray-500">
          {isLogin ? "Don't have an account? " : "Already have an account? "}
          <button 
            type="button" 
            onClick={() => setIsLogin(!isLogin)}
            className="text-blue-600 font-semibold hover:underline"
          >
            {isLogin ? 'Sign up' : 'Sign in'}
          </button>
        </div>
      </div>
    </div>
  )
}
