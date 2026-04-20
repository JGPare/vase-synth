import { create } from 'zustand'
import { apiJson } from '../api/client'

const isJuliaType = (t) => t === 'julia_radial' || t === 'julia_edge_find'

// Clear focus only if the focused index is no longer a valid Julia modifier.
// Does NOT auto-pick a new one — that would reopen the picker on unrelated edits.
const keepValidFocus = (prev, vaseData) => {
  const mods = vaseData?.modifiers ?? []
  if (prev != null && mods[prev] && isJuliaType(mods[prev].type)) return prev
  return null
}

// Only used on load paths (load-vase, load-default, load-random, delete):
// if no focus and the vase has a Julia modifier, auto-focus the first one.
const autoFocusOnLoad = (vaseData) => {
  const mods = vaseData?.modifiers ?? []
  const firstJulia = mods.findIndex((m) => isJuliaType(m.type))
  return firstJulia === -1 ? null : firstJulia
}

export const useVaseStore = create((set, get) => ({
  settings: null,
  vaseData: null,
  appearance: null,
  vaseName: 'Untitled',
  username: '',
  access: 'public',
  indexList: [],
  downloads: 0,
  focusedJuliaIndex: null,

  setVaseData: (data) =>
    set((state) => ({
      vaseData: data,
      focusedJuliaIndex: keepValidFocus(state.focusedJuliaIndex, data),
    })),
  setVaseName: (name) => set({ vaseName: name }),
  setAccess: (access) => set({ access }),
  setAppearance: (appearance) => set({ appearance }),
  setFocusedJuliaIndex: (i) => set({ focusedJuliaIndex: i }),

  loadSettings: async () => {
    const data = await apiJson('/api/load-settings')
    set({ settings: data })
    // After settings, load default vase
    get().loadDefault()
  },

  loadDefault: async () => {
    const res = await apiJson('/api/load-vase', {
      method: 'POST',
      body: JSON.stringify(null),
    })
    const [vaseDataStr] = res
    const vaseData = typeof vaseDataStr === 'string' ? JSON.parse(vaseDataStr) : vaseDataStr
    set({ vaseData, focusedJuliaIndex: autoFocusOnLoad(vaseData) })
  },

  loadVase: async (name, user) => {
    const res = await apiJson('/api/load-vase', {
      method: 'POST',
      body: JSON.stringify({ name, user }),
    })
    const [vaseDataStr, appearanceStr, downloads] = res
    const vaseData = typeof vaseDataStr === 'string' ? JSON.parse(vaseDataStr) : vaseDataStr
    const appearance = appearanceStr ? (typeof appearanceStr === 'string' ? JSON.parse(appearanceStr) : appearanceStr) : null
    vaseData.name = name
    set({
      vaseData,
      appearance,
      downloads,
      vaseName: name,
      username: user,
      focusedJuliaIndex: autoFocusOnLoad(vaseData),
    })
  },

  saveVase: async (data) => {
    await apiJson('/api/save-vase', {
      method: 'POST',
      body: JSON.stringify(data),
    })
  },

  getIndex: async () => {
    const access = get().access
    const data = await apiJson('/api/get-index', {
      method: 'POST',
      body: JSON.stringify({ access }),
    })
    set({ indexList: data })
  },

  loadRandom: async () => {
    const res = await apiJson('/api/load-random')
    const [vaseDataStr, , downloads] = res
    const vaseData = typeof vaseDataStr === 'string' ? JSON.parse(vaseDataStr) : vaseDataStr
    vaseData.name = get().vaseName
    set({ vaseData, downloads, focusedJuliaIndex: autoFocusOnLoad(vaseData) })
  },

  deleteVase: async (name) => {
    const res = await apiJson('/api/delete-vase', {
      method: 'POST',
      body: JSON.stringify(name),
    })
    const vaseData = typeof res === 'string' ? JSON.parse(res) : res
    vaseData.name = name
    set({ vaseData, vaseName: 'Untitled', focusedJuliaIndex: autoFocusOnLoad(vaseData) })
    get().getIndex()
  },

  incrementDownloads: async () => {
    const { vaseName, username } = get()
    await apiJson('/api/increment-download', {
      method: 'POST',
      body: JSON.stringify({ name: vaseName, user: username }),
    })
  },
}))
