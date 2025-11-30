// api.js - API utility functions
const API_BASE_URL = '/api'

export const methods = {
  get: async (endpoint) => {
    const res = await fetch(`${API_BASE_URL}${endpoint}`)
    const { code, data } = await res.json()
    console.log({ code, data, res })
    if (code != 0) return Promise.reject('err')
    return data || []
  },

  post: async (endpoint, payload) => {
    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(payload)
    })
    const { code, data } = await response.json()
    if (code != 0) return Promise.reject('err')
    return { code, data }
  },

  put: async (endpoint, payload) => {
    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(payload)
    })
    const { code, data } = await response.json()
    if (code != 0) return Promise.reject('err')
    return { code, data }
  },

  delete: async (endpoint) => {
    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      method: 'DELETE'
    })
    const { code, data } = await response.json()
    if (code != 0) return Promise.reject('err')
    return { code, data }
  },

  form: async (endpoint, formData) => {
    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      method: 'POST',
      body: formData
    })
    const { code, data } = await response.json()
    if (code != 0) return Promise.reject('err')
    return { code, data }
  }
}