import { create } from 'zustand'
import { apiJson } from '../api/client'

export const useAuthStore = create((set) => ({
  user: null,
  isAuthenticated: false,

  checkAuth: async () => {
    try {
      const data = await apiJson('/api/auth/me')
      if (data.authenticated) {
        set({ user: { username: data.username, id: data.id }, isAuthenticated: true })
      } else {
        set({ user: null, isAuthenticated: false })
      }
    } catch {
      set({ user: null, isAuthenticated: false })
    }
  },

  login: async (email, password) => {
    const res = await apiJson('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    })
    if (res.username) {
      set({ user: { username: res.username }, isAuthenticated: true })
      return { success: true }
    }
    return { success: false, detail: res.detail }
  },

  register: async (email, username, password, passConfirm, notARobot) => {
    const res = await apiJson('/api/auth/register', {
      method: 'POST',
      body: JSON.stringify({
        email,
        username,
        password,
        pass_confirm: passConfirm,
        not_a_robot: notARobot,
      }),
    })
    return res
  },

  logout: async () => {
    await apiJson('/api/auth/logout', { method: 'POST' })
    set({ user: null, isAuthenticated: false })
  },
}))
