import axios from 'axios'

const BASE = 'http://localhost:8000'

export async function uploadDataset(file) {
  const fd = new FormData()
  fd.append('file', file)
  const res = await axios.post(`${BASE}/dataset/upload`, fd, {
    headers: { 'Content-Type': 'multipart/form-data' }
  })
  return res.data
}

export async function warmup(n_warmup=50, agent_name='linear_thompson') {
  const res = await axios.post(`${BASE}/model/warmup`, { n_warmup, agent_name })
  return res.data
}

export async function predict(context, price_override=null) {
  const res = await axios.post(`${BASE}/predict`, { context, price_override })
  return res.data
}

export async function updateActual(context, price, actual_sales) {
  const res = await axios.post(`${BASE}/update`, { context, price, actual_sales })
  return res.data
}

export async function state() {
  const res = await axios.get(`${BASE}/state`)
  return res.data
}

export async function graphData(limit=500) {
  const res = await axios.get(`${BASE}/graph/data?limit=${limit}`)
  return res.data
}

export async function reset() {
  const res = await axios.post(`${BASE}/dataset/reset`)
  return res.data
}

