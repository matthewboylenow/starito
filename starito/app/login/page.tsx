'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuthStore } from '@/lib/auth-store'

interface Kid {
  id: string
  name: string
  avatar_url?: string
}

export default function LoginPage() {
  const [loginMode, setLoginMode] = useState<'choose' | 'kid-selection' | 'kid-pin' | 'parent'>('choose')
  const [pin, setPin] = useState(['', '', '', ''])
  const [parentCreds, setParentCreds] = useState({ username: '', password: '' })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [kids, setKids] = useState<Kid[]>([])
  const [selectedKid, setSelectedKid] = useState<Kid | null>(null)
  const [loadingKids, setLoadingKids] = useState(false)
  
  const router = useRouter()
  const { loginChild, loginParent } = useAuthStore()

  const handlePinChange = (index: number, value: string) => {
    if (value.length <= 1 && /^\d*$/.test(value)) {
      const newPin = [...pin]
      newPin[index] = value
      setPin(newPin)
      
      if (value && index < 3) {
        const nextInput = document.getElementById(`pin-${index + 1}`)
        nextInput?.focus()
      }
      
      if (newPin.every(digit => digit !== '') && newPin.join('').length === 4) {
        handleChildLogin(newPin.join(''))
      }
    }
  }

  const fetchKids = async () => {
    setLoadingKids(true)
    setError('')
    
    try {
      const response = await fetch('/api/get-kids')
      const data = await response.json()
      
      if (data.success) {
        setKids(data.kids)
        if (data.kids.length === 1) {
          // If only one kid, skip selection and go directly to PIN
          setSelectedKid(data.kids[0])
          setLoginMode('kid-pin')
        } else {
          setLoginMode('kid-selection')
        }
      } else {
        setError('Failed to load kids. Please try again.')
      }
    } catch (err) {
      setError('Failed to load kids. Please try again.')
    } finally {
      setLoadingKids(false)
    }
  }

  const handleKidSelection = (kid: Kid) => {
    setSelectedKid(kid)
    setLoginMode('kid-pin')
    setPin(['', '', '', '']) // Reset PIN
    setError('') // Clear any errors
  }

  const handleChildLogin = async (pinValue: string) => {
    setLoading(true)
    setError('')
    
    try {
      const response = await fetch('/api/login-child', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          pin: pinValue,
          kidId: selectedKid?.id 
        })
      })
      
      const data = await response.json()
      
      if (data.success) {
        loginChild(data.user)
        router.push('/kid')
      } else {
        setError('Invalid PIN. Please try again.')
        setPin(['', '', '', ''])
      }
    } catch (err) {
      setError('Login failed. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const handleParentLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    
    try {
      const response = await fetch('/api/login-parent', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(parentCreds)
      })
      
      const data = await response.json()
      
      if (data.success) {
        loginParent(data.parent)
        router.push('/parent')
      } else {
        setError('Invalid credentials. Please try again.')
      }
    } catch (err) {
      setError('Login failed. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  if (loginMode === 'choose') {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <div className="w-full max-w-md">
          <div className="text-center mb-8">
            <h1 className="font-heading text-4xl font-bold text-primary mb-2">
              🌟 Starito
            </h1>
            <p className="text-gray-600">Welcome! Who are you?</p>
          </div>
          
          <div className="space-y-4">
            <button
              onClick={fetchKids}
              disabled={loadingKids}
              className="btn-primary w-full py-6 text-xl focus:ring-4 focus:ring-primary/30 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
              aria-describedby="kid-login-desc"
            >
              {loadingKids ? '⏳ Loading...' : '👦 I\'m a Kid'}
            </button>
            <p id="kid-login-desc" className="sr-only">Login as a child using PIN authentication</p>
            
            <button
              onClick={() => setLoginMode('parent')}
              className="btn-secondary w-full py-4 focus:ring-4 focus:ring-gray-300 focus:ring-offset-2"
              aria-describedby="parent-login-desc"
            >
              👨 I&apos;m a Parent
            </button>
            <p id="parent-login-desc" className="sr-only">Login as a parent using username and password</p>
          </div>
        </div>
      </div>
    )
  }

  if (loginMode === 'kid-selection') {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <div className="w-full max-w-md">
          <div className="text-center mb-8">
            <button
              onClick={() => setLoginMode('choose')}
              className="mb-4 text-gray-500 hover:text-gray-700 focus:ring-2 focus:ring-primary focus:ring-offset-1 rounded px-2 py-1"
              aria-label="Go back to login type selection"
            >
              ← Back
            </button>
            <h2 className="font-heading text-3xl font-bold text-primary mb-2">
              Which Kid Are You?
            </h2>
            <p className="text-gray-600">Choose your profile</p>
          </div>
          
          <div className="space-y-4">
            {kids.map((kid) => (
              <button
                key={kid.id}
                onClick={() => handleKidSelection(kid)}
                className="w-full p-4 bg-white border-2 border-gray-200 rounded-2xl hover:border-primary hover:bg-blue-50 transition-all duration-200 transform hover:scale-105 active:scale-95 touch-manipulation focus:ring-4 focus:ring-primary/30 focus:ring-offset-2"
                aria-label={`Select ${kid.name} profile`}
              >
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-primary rounded-full flex items-center justify-center text-white text-xl font-bold">
                    {kid.avatar_url ? (
                      <img 
                        src={kid.avatar_url} 
                        alt={`${kid.name}'s avatar`}
                        className="w-full h-full rounded-full object-cover"
                      />
                    ) : (
                      kid.name?.charAt(0)?.toUpperCase() || '?'
                    )}
                  </div>
                  <div className="text-left">
                    <div className="font-heading text-lg font-semibold text-gray-800">
                      {kid.name}
                    </div>
                  </div>
                </div>
              </button>
            ))}
          </div>
          
          {error && (
            <div className="text-accent-pink text-center mt-4 font-semibold" role="alert" aria-live="polite">
              {error}
            </div>
          )}
        </div>
      </div>
    )
  }

  if (loginMode === 'kid-pin') {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <div className="w-full max-w-md">
          <div className="text-center mb-8">
            <button
              onClick={() => kids.length > 1 ? setLoginMode('kid-selection') : setLoginMode('choose')}
              className="mb-4 text-gray-500 hover:text-gray-700"
            >
              ← Back
            </button>
            <div className="mb-4">
              {selectedKid && (
                <div className="flex items-center justify-center gap-3 mb-4">
                  <div className="w-16 h-16 bg-primary rounded-full flex items-center justify-center text-white text-xl font-bold">
                    {selectedKid.avatar_url ? (
                      <img 
                        src={selectedKid.avatar_url} 
                        alt={selectedKid.name}
                        className="w-full h-full rounded-full object-cover"
                      />
                    ) : (
                      selectedKid.name?.charAt(0)?.toUpperCase() || '?'
                    )}
                  </div>
                  <div className="text-center">
                    <div className="font-heading text-xl font-semibold text-gray-800">
                      Hi, {selectedKid.name || 'there'}!
                    </div>
                  </div>
                </div>
              )}
            </div>
            <h2 className="font-heading text-3xl font-bold text-primary mb-2">
              Enter Your PIN
            </h2>
            <p className="text-gray-600">Type your 4-digit PIN</p>
          </div>
          
          <div className="flex justify-center gap-4 mb-6">
            {pin.map((digit, index) => (
              <input
                key={index}
                id={`pin-${index}`}
                type="text"
                inputMode="numeric"
                value={digit}
                onChange={(e) => handlePinChange(index, e.target.value)}
                className="pin-input focus:ring-4 focus:ring-primary/30 focus:ring-offset-1"
                maxLength={1}
                autoFocus={index === 0}
                aria-label={`PIN digit ${index + 1}`}
                autoComplete="off"
              />
            ))}
          </div>
          
          {error && (
            <div className="text-accent-pink text-center mb-4 font-semibold">
              {error}
            </div>
          )}
          
          {loading && (
            <div className="text-center text-gray-600">
              Logging in...
            </div>
          )}
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <button
            onClick={() => setLoginMode('choose')}
            className="mb-4 text-gray-500 hover:text-gray-700"
          >
            ← Back
          </button>
          <h2 className="font-heading text-3xl font-bold text-primary mb-2">
            Parent Login
          </h2>
          <p className="text-gray-600">Enter your credentials</p>
        </div>
        
        <form onSubmit={handleParentLogin} className="space-y-4">
          <div>
            <label htmlFor="username" className="sr-only">Username</label>
            <input
              id="username"
              type="text"
              placeholder="Username"
              value={parentCreds.username}
              onChange={(e) => setParentCreds(prev => ({ ...prev, username: e.target.value }))}
              className="w-full py-3 px-4 border-2 border-gray-300 rounded-xl focus:border-primary focus:outline-none focus:ring-4 focus:ring-primary/30 focus:ring-offset-1 transition-colors"
              required
              autoComplete="username"
            />
          </div>
          
          <div>
            <label htmlFor="password" className="sr-only">Password</label>
            <input
              id="password"
              type="password"
              placeholder="Password"
              value={parentCreds.password}
              onChange={(e) => setParentCreds(prev => ({ ...prev, password: e.target.value }))}
              className="w-full py-3 px-4 border-2 border-gray-300 rounded-xl focus:border-primary focus:outline-none focus:ring-4 focus:ring-primary/30 focus:ring-offset-1 transition-colors"
              required
              autoComplete="current-password"
            />
          </div>
          
          {error && (
            <div className="text-accent-pink text-center font-semibold">
              {error}
            </div>
          )}
          
          <button
            type="submit"
            disabled={loading}
            className="btn-primary w-full focus:ring-4 focus:ring-primary/30 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
            aria-describedby={loading ? 'login-status' : undefined}
          >
            {loading ? 'Logging in...' : 'Login'}
          </button>
          {loading && <p id="login-status" className="sr-only">Login in progress</p>}
        </form>
      </div>
    </div>
  )
}