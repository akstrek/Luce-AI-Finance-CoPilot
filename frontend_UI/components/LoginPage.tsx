'use client'
import React, { useState } from 'react';
import { motion } from 'motion/react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { createClient } from '@/lib/supabase/client';
import { useRouter } from 'next/navigation';

interface LoginPageProps {
  onLoginSuccess?: () => void;
  onBack?: () => void;
  onSignup?: () => void;
}

export default function LoginPage({ onSignup }: LoginPageProps) {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [resetSent, setResetSent] = useState(false)
  const router = useRouter()

  const handleForgotPassword = async () => {
    setError('')
    if (!email) { setError('Enter your email address first.'); return }
    const supabase = createClient()
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/auth/callback?next=/profile&type=recovery`,
    })
    if (error) { setError(error.message); return }
    setResetSent(true)
  }

  const handleSignIn = async () => {
    setError('')
    setLoading(true)
    const supabase = createClient()
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) {
      setError(error.message)
      setLoading(false)
    } else {
      router.push('/')
      router.refresh()
    }
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
      className="min-h-screen w-full flex flex-col items-center justify-center relative bg-[#020402] px-6"
    >
      {/* Background Decorative Rings/Logic */}
      <div className="absolute inset-0 pointer-events-none opacity-30">
        <div className="fog f1"></div>
        <div className="fog f2"></div>
      </div>

      <div className="w-full max-w-[400px] flex flex-col items-center z-10">
        {/* 3D revolving Luce logo */}
        <div className="scene-logo scale-125 mb-8">
          <div className="logo-3d-wrapper">
            <div className="l-diamond ld-outer"></div>
            <div className="l-diamond ld-inner"></div>
            <div className="l-diamond ld-inner-2"></div>
          </div>
        </div>

        <h2 className="text-3xl font-bold text-white mb-8 font-syne text-center">
          Log in to LUCE
        </h2>

        <div className="w-full space-y-4">
          <div className="space-y-1.5">
            <label className="text-[10px] uppercase tracking-widest text-[#00ff50]/70 font-semibold ml-1">
              Email Address
            </label>
            <Input
              type="email"
              placeholder="name@company.com"
              value={email}
              onChange={e => setEmail(e.target.value)}
              className="bg-[#0a140a]/80 border-[#00ff50]/10 border-white/5 focus-visible:ring-[#00ff50]/30 text-white h-12"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-[10px] uppercase tracking-widest text-[#00ff50]/70 font-semibold ml-1">
              Password
            </label>
            <Input
              type="password"
              placeholder="••••••••"
              value={password}
              onChange={e => setPassword(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleSignIn()}
              className="bg-[#0a140a]/80 border-[#00ff50]/10 border-white/5 focus-visible:ring-[#00ff50]/30 text-white h-12"
            />
          </div>

          <div className="flex justify-end">
            <button
              type="button"
              onClick={handleForgotPassword}
              className="text-[10px] text-[#00ff50]/50 hover:text-[#00ff50] transition-colors uppercase tracking-widest font-semibold"
            >
              Forgot password?
            </button>
          </div>

          {error && <p className="text-xs text-red-400 ml-1">{error}</p>}
          {resetSent && <p className="text-xs text-[#00ff50]/80 ml-1">Reset link sent — check your email.</p>}

          <Button
            className="w-full h-12 mt-4 bg-white text-black hover:bg-white/90 font-bold tracking-tight rounded-xl transition-all hover:scale-[1.01] active:scale-[0.98]"
            onClick={handleSignIn}
            disabled={loading}
          >
            {loading ? 'Signing in…' : 'Sign In'}
          </Button>
        </div>

        <div className="mt-8 text-center">
          <p className="text-sm text-white/50">
            Not on LUCE?{' '}
            <button
              className="text-white hover:underline underline-offset-4 font-bold decoration-white/30"
              onClick={onSignup ?? (() => router.push('/signup'))}
            >
              Create an account
            </button>
          </p>
        </div>
      </div>
    </motion.div>
  );
}
