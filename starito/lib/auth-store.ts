import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { User, Parent } from './types'

interface AuthState {
  currentUser: User | null
  currentParent: Parent | null
  isAuthenticated: boolean
  userType: 'child' | 'parent' | null
  
  loginChild: (user: User) => void
  loginParent: (parent: Parent) => void
  logout: () => void
  updateUserStars: (stars: number) => void
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      currentUser: null,
      currentParent: null,
      isAuthenticated: false,
      userType: null,

      loginChild: (user: User) => 
        set({
          currentUser: user,
          currentParent: null,
          isAuthenticated: true,
          userType: 'child'
        }),

      loginParent: (parent: Parent) =>
        set({
          currentUser: null,
          currentParent: parent,
          isAuthenticated: true,
          userType: 'parent'
        }),

      logout: () =>
        set({
          currentUser: null,
          currentParent: null,
          isAuthenticated: false,
          userType: null
        }),

      updateUserStars: (stars: number) =>
        set((state) => ({
          currentUser: state.currentUser
            ? { ...state.currentUser, total_stars: stars }
            : null
        }))
    }),
    {
      name: 'starito-auth'
    }
  )
)