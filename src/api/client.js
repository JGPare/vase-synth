export async function apiFetch(url, options = {}) {
  const res = await fetch(url, {
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
    ...options,
  })
  return res
}

export async function apiJson(url, options = {}) {
  const res = await apiFetch(url, options)
  return res.json()
}
