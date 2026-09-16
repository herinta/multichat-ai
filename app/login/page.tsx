'use client'

import { useState, useEffect, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { login, signup } from './actions'
import { Button } from '@/components/Modern/Button'
import { Sparkles, ArrowLeft, Mail, Lock, User, CheckCircle2, AlertCircle } from 'lucide-react'

export function LoginFormContent({ initialMode }: { initialMode?: 'login' | 'register' }) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const paramMode = searchParams.get('mode') || searchParams.get('tab')
  
  const [isLogin, setIsLogin] = useState<boolean>(
    initialMode ? initialMode === 'login' : paramMode !== 'register'
  )
  const [errorMsg, setErrorMsg] = useState<string | null>(null)
  const [successMsg, setSuccessMsg] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)

  useEffect(() => {
    if (paramMode === 'register') {
      setIsLogin(false)
    } else if (paramMode === 'login') {
      setIsLogin(true)
    }
  }, [paramMode])

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setIsLoading(true)
    setErrorMsg(null)
    setSuccessMsg(null)
    
    const formData = new FormData(e.currentTarget)
    
    try {
      if (isLogin) {
        const res = await login(formData)
        if (res?.error) {
          setErrorMsg(res.error)
        } else if (res?.success) {
          window.location.href = '/'
        }
      } else {
        const res = await signup(formData)
        if (res?.error) {
          setErrorMsg(res.error)
        } else if (res?.needsVerification) {
          setSuccessMsg(res.message || 'Pendaftaran berhasil! Silakan periksa email Anda atau masuk.')
          setIsLogin(true)
        } else if (res?.success) {
          window.location.href = '/'
        }
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Terjadi kesalahan tidak terduga.'
      setErrorMsg(msg)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div 
      className="min-h-screen flex flex-col justify-center items-center relative overflow-hidden bg-cover bg-center bg-no-repeat px-4 py-12"
      style={{ backgroundImage: "url('/auth-bg.jpg')" }}
    >
      {/* Ambient Cyber Glass Overlays for contrast and depth */}
      <div className="absolute inset-0 bg-slate-950/40 backdrop-blur-[2px] pointer-events-none" />
      <div className="absolute inset-0 bg-gradient-to-t from-slate-950/70 via-transparent to-slate-950/40 pointer-events-none" />

      {/* Back to Home button */}
      <div className="w-full max-w-md mb-6 z-10">
        <Link 
          href="/" 
          className="inline-flex items-center gap-2 text-xs sm:text-sm font-semibold text-white/90 hover:text-white bg-white/15 hover:bg-white/25 backdrop-blur-md px-4 py-2 rounded-full border border-white/25 shadow-md transition-all cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4" />
          Kembali ke Beranda
        </Link>
      </div>

      {/* Card Container - Frosted Glassmorphism */}
      <div className="w-full max-w-md backdrop-blur-2xl bg-white/95 border border-white/80 shadow-[0_25px_60px_rgba(0,0,0,0.35)] rounded-3xl p-8 z-10">
        
        {/* Header Branding */}
        <div className="text-center mb-6">
          <div className="w-14 h-14 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-2xl mx-auto mb-3 flex items-center justify-center shadow-lg shadow-blue-500/30">
            <Sparkles className="w-7 h-7 text-white" />
          </div>
          <h1 className="text-2xl font-extrabold text-gray-900 tracking-tight">
            {isLogin ? 'Selamat Datang' : 'Buat Akun Baru'}
          </h1>
          <p className="text-gray-500 text-xs sm:text-sm mt-1">
            {isLogin 
              ? 'Masuk untuk mulai mengobrol & menelpon karakter AI Anda' 
              : 'Daftar sekarang gratis untuk menjelajahi dunia Multi-AI'}
          </p>
        </div>

        {/* Tab Switcher: Masuk vs Daftar */}
        <div className="flex bg-blue-50/80 p-1 rounded-2xl mb-6 border border-blue-100/60">
          <button
            type="button"
            onClick={() => {
              setIsLogin(true)
              setErrorMsg(null)
              setSuccessMsg(null)
            }}
            className={`flex-1 py-2.5 text-xs font-bold rounded-xl transition-all ${
              isLogin 
                ? 'bg-white text-blue-600 shadow-xs' 
                : 'text-gray-500 hover:text-gray-800'
            }`}
          >
            Masuk (Login)
          </button>
          <button
            type="button"
            onClick={() => {
              setIsLogin(false)
              setErrorMsg(null)
              setSuccessMsg(null)
            }}
            className={`flex-1 py-2.5 text-xs font-bold rounded-xl transition-all ${
              !isLogin 
                ? 'bg-white text-blue-600 shadow-xs' 
                : 'text-gray-500 hover:text-gray-800'
            }`}
          >
            Daftar (Register)
          </button>
        </div>

        {/* Error Alert */}
        {errorMsg && (
          <div className="mb-5 p-3.5 bg-red-50 border border-red-200 text-red-700 rounded-2xl text-xs font-medium flex items-start gap-2.5">
            <AlertCircle className="w-4 h-4 text-red-500 shrink-0 mt-0.5" />
            <span>{errorMsg}</span>
          </div>
        )}

        {/* Success Alert */}
        {successMsg && (
          <div className="mb-5 p-3.5 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-2xl text-xs font-medium flex items-start gap-2.5">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
            <span>{successMsg}</span>
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          {!isLogin && (
            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1.5" htmlFor="username">
                Username
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-gray-400">
                  <User className="w-4 h-4" />
                </div>
                <input
                  id="username"
                  name="username"
                  type="text"
                  required={!isLogin}
                  className="w-full pl-10 pr-4 py-2.5 bg-gray-50/80 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-100 focus:border-blue-500 outline-none transition-all"
                  placeholder="Username Anda (misal: fajar_ai)"
                />
              </div>
            </div>
          )}

          <div>
            <label className="block text-xs font-bold text-gray-700 mb-1.5" htmlFor="email">
              Alamat Email
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-gray-400">
                <Mail className="w-4 h-4" />
              </div>
              <input
                id="email"
                name="email"
                type="email"
                required
                className="w-full pl-10 pr-4 py-2.5 bg-gray-50/80 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-100 focus:border-blue-500 outline-none transition-all"
                placeholder="nama@email.com"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-gray-700 mb-1.5" htmlFor="password">
              Kata Sandi
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-gray-400">
                <Lock className="w-4 h-4" />
              </div>
              <input
                id="password"
                name="password"
                type="password"
                required
                minLength={6}
                className="w-full pl-10 pr-4 py-2.5 bg-gray-50/80 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-100 focus:border-blue-500 outline-none transition-all"
                placeholder="Minimal 6 karakter"
              />
            </div>
          </div>

          <Button 
            type="submit" 
            variant="primary" 
            className="w-full py-3 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-bold rounded-xl shadow-md shadow-blue-500/20 text-sm mt-2 transition-all cursor-pointer" 
            disabled={isLoading}
          >
            {isLoading ? (
              <span className="flex items-center justify-center gap-2">
                <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
                Memproses...
              </span>
            ) : (
              isLogin ? 'Masuk ke Akun' : 'Daftar Sekarang'
            )}
          </Button>
        </form>

        {/* Footer Toggle */}
        <div className="mt-6 text-center text-xs text-gray-500">
          {isLogin ? "Belum memiliki akun? " : "Sudah memiliki akun? "}
          <button 
            type="button" 
            onClick={() => {
              setIsLogin(!isLogin)
              setErrorMsg(null)
              setSuccessMsg(null)
            }}
            className="text-blue-600 font-bold hover:underline cursor-pointer"
          >
            {isLogin ? 'Daftar sekarang' : 'Masuk di sini'}
          </button>
        </div>

      </div>
    </div>
  )
}

export default function LoginPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
      </div>
    }>
      <LoginFormContent />
    </Suspense>
  )
}
