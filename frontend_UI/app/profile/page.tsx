'use client'
import { useState, useEffect, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import type { User } from '@supabase/supabase-js'

function ProfileContent() {
  const [user, setUser] = useState<User | null>(null)
  const [firstName, setFirstName] = useState('')
  const [lastName, setLastName] = useState('')
  const [email, setEmail] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')
  const router = useRouter()
  const searchParams = useSearchParams()
  const isPasswordReset = searchParams.get('set_password') === '1'

  useEffect(() => {
    const supabase = createClient()
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (!user) { router.push('/auth'); return }
      setUser(user)
      setFirstName(user.user_metadata?.first_name ?? '')
      setLastName(user.user_metadata?.last_name ?? '')
      setEmail(user.email ?? '')
    })
  }, [router])

  const flash = (msg: string, isError = false) => {
    if (isError) setError(msg)
    else setMessage(msg)
    setTimeout(() => { setMessage(''); setError('') }, 4000)
  }

  const handleSaveProfile = async () => {
    setSaving(true)
    const supabase = createClient()
    const { error } = await supabase.auth.updateUser({
      data: { first_name: firstName, last_name: lastName },
    })
    setSaving(false)
    if (error) flash(error.message, true)
    else flash('Profile updated.')
  }

  const handleUpdateEmail = async () => {
    if (!email.includes('@')) { flash('Enter a valid email.', true); return }
    setSaving(true)
    const supabase = createClient()
    const { error } = await supabase.auth.updateUser({ email })
    setSaving(false)
    if (error) flash(error.message, true)
    else flash('Confirmation sent to new email address.')
  }

  const handleUpdatePassword = async () => {
    if (newPassword.length < 6) { flash('Password must be at least 6 characters.', true); return }
    if (newPassword !== confirmPassword) { flash('Passwords do not match.', true); return }
    setSaving(true)
    const supabase = createClient()
    const { error } = await supabase.auth.updateUser({ password: newPassword })
    setSaving(false)
    if (error) flash(error.message, true)
    else { flash('Password updated.'); setNewPassword(''); setConfirmPassword('') }
  }

  if (!user) return null

  return (
    <div className="min-h-screen bg-[#020402] pt-24 pb-16 px-6 flex justify-center">
      <div className="w-full max-w-[560px]">

        {/* Header */}
        <div className="mb-10">
          <span className="text-[10px] uppercase tracking-widest text-[#00ff50]/50 font-bold">[ ACCOUNT ]</span>
          <h1 className="text-3xl font-bold text-white font-syne mt-2">Your Profile</h1>
          <p className="text-white/30 text-sm mt-1">Manage your identity and credentials.</p>
        </div>

        {/* Notification */}
        {(message || error) && (
          <div style={{
            padding: '12px 16px', borderRadius: '10px', marginBottom: '24px', fontSize: '12px', fontWeight: 600,
            background: error ? 'rgba(255,60,60,0.08)' : 'rgba(0,255,80,0.06)',
            border: `1px solid ${error ? 'rgba(255,60,60,0.2)' : 'rgba(0,255,80,0.2)'}`,
            color: error ? 'rgba(255,100,100,0.9)' : 'rgba(0,255,80,0.9)',
          }}>
            {error || message}
          </div>
        )}

        {/* Password reset prompt */}
        {isPasswordReset && (
          <div style={{ padding: '14px 18px', borderRadius: '12px', marginBottom: '28px', background: 'rgba(0,255,80,0.05)', border: '1px solid rgba(0,255,80,0.2)' }}>
            <p className="text-xs text-[#00ff50]/80 font-semibold">Set your new password below to complete the reset.</p>
          </div>
        )}

        {/* Identity card */}
        <div style={{ background: 'rgba(255,255,255,0.025)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: '16px', padding: '24px', marginBottom: '16px' }}>
          <div className="flex items-center gap-4 mb-6">
            <div style={{ width: 52, height: 52, borderRadius: '50%', background: 'rgba(0,255,80,0.12)', border: '1px solid rgba(0,255,80,0.25)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '20px', fontWeight: 800, color: '#00ff50', fontFamily: "'Syne', sans-serif" }}>
              {(firstName || user.email || 'U')[0].toUpperCase()}
            </div>
            <div>
              <div className="text-white font-bold font-syne text-base">{firstName || lastName ? `${firstName} ${lastName}`.trim() : 'Anonymous'}</div>
              <div className="text-white/30 text-xs mt-0.5">{user.email}</div>
            </div>
          </div>

          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-[10px] uppercase tracking-widest text-[#00ff50]/60 font-semibold">First Name</label>
                <input
                  type="text"
                  value={firstName}
                  onChange={e => setFirstName(e.target.value)}
                  placeholder="First name"
                  className="w-full h-11 px-3 rounded-xl text-white text-sm bg-white/[0.04] border border-white/[0.08] focus:outline-none focus:border-[#00ff50]/30 focus:bg-white/[0.06] transition-all"
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-[10px] uppercase tracking-widest text-[#00ff50]/60 font-semibold">Last Name</label>
                <input
                  type="text"
                  value={lastName}
                  onChange={e => setLastName(e.target.value)}
                  placeholder="Last name"
                  className="w-full h-11 px-3 rounded-xl text-white text-sm bg-white/[0.04] border border-white/[0.08] focus:outline-none focus:border-[#00ff50]/30 focus:bg-white/[0.06] transition-all"
                />
              </div>
            </div>
            <button
              onClick={handleSaveProfile}
              disabled={saving}
              className="h-10 px-6 rounded-xl text-[11px] font-bold uppercase tracking-wider transition-all hover:scale-[1.01] active:scale-[0.98]"
              style={{ background: 'rgba(0,255,80,0.1)', border: '1px solid rgba(0,255,80,0.25)', color: '#00ff50' }}
            >
              {saving ? 'Saving…' : 'Save Name'}
            </button>
          </div>
        </div>

        {/* Email */}
        <div style={{ background: 'rgba(255,255,255,0.025)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: '16px', padding: '24px', marginBottom: '16px' }}>
          <div className="text-[10px] uppercase tracking-widest text-[#00ff50]/50 font-bold mb-4">Email Address</div>
          <div className="space-y-3">
            <input
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              className="w-full h-11 px-3 rounded-xl text-white text-sm bg-white/[0.04] border border-white/[0.08] focus:outline-none focus:border-[#00ff50]/30 focus:bg-white/[0.06] transition-all"
            />
            <button
              onClick={handleUpdateEmail}
              disabled={saving || email === user.email}
              className="h-10 px-6 rounded-xl text-[11px] font-bold uppercase tracking-wider transition-all hover:scale-[1.01] active:scale-[0.98] disabled:opacity-40"
              style={{ background: 'rgba(0,255,80,0.1)', border: '1px solid rgba(0,255,80,0.25)', color: '#00ff50' }}
            >
              Update Email
            </button>
          </div>
        </div>

        {/* Password */}
        <div style={{ background: 'rgba(255,255,255,0.025)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: '16px', padding: '24px', marginBottom: '32px' }}>
          <div className="text-[10px] uppercase tracking-widest text-[#00ff50]/50 font-bold mb-4">
            {isPasswordReset ? 'Set New Password' : 'Change Password'}
          </div>
          <div className="space-y-3">
            <input
              type="password"
              value={newPassword}
              onChange={e => setNewPassword(e.target.value)}
              placeholder="New password"
              className="w-full h-11 px-3 rounded-xl text-white text-sm bg-white/[0.04] border border-white/[0.08] focus:outline-none focus:border-[#00ff50]/30 focus:bg-white/[0.06] transition-all"
            />
            <input
              type="password"
              value={confirmPassword}
              onChange={e => setConfirmPassword(e.target.value)}
              placeholder="Confirm password"
              className="w-full h-11 px-3 rounded-xl text-white text-sm bg-white/[0.04] border border-white/[0.08] focus:outline-none focus:border-[#00ff50]/30 focus:bg-white/[0.06] transition-all"
            />
            <button
              onClick={handleUpdatePassword}
              disabled={saving || !newPassword}
              className="h-10 px-6 rounded-xl text-[11px] font-bold uppercase tracking-wider transition-all hover:scale-[1.01] active:scale-[0.98] disabled:opacity-40"
              style={{ background: 'rgba(0,255,80,0.1)', border: '1px solid rgba(0,255,80,0.25)', color: '#00ff50' }}
            >
              {saving ? 'Saving…' : isPasswordReset ? 'Set Password' : 'Update Password'}
            </button>
          </div>
        </div>

        {/* Back home */}
        <button
          onClick={() => router.push('/')}
          className="text-[11px] uppercase tracking-widest text-white/30 hover:text-white/60 transition-colors font-bold flex items-center gap-2"
        >
          <svg width="12" height="12" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"><path d="M8 2L4 6L8 10"/></svg>
          Back to Dashboard
        </button>
      </div>
    </div>
  )
}

export default function ProfilePage() {
  return (
    <Suspense fallback={null}>
      <ProfileContent />
    </Suspense>
  )
}
