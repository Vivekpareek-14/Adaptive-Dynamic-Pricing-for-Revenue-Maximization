import React, { useState } from 'react'
import { warmup } from '../api'

export default function WarmupPanel({ onWarmup }) {
  const [n, setN] = useState(30)
  const [agent, setAgent] = useState('linear_thompson')
  const [busy, setBusy] = useState(false)
  const [msg, setMsg] = useState(null)

  const run = async () => {
    setBusy(true); setMsg(null)
    try {
      const r = await warmup(Number(n), agent)
      setMsg('Warmup done: ' + JSON.stringify(r))
      onWarmup && onWarmup(r)
    } catch (e) {
      setMsg('Warmup failed: ' + (e?.response?.data?.detail || e.message))
    } finally { setBusy(false) }
  }

  return (
    <div className="card">
      <h3 className="font-semibold mb-2">2) Warmup training</h3>
      <div className="flex gap-2">
        <label className="flex items-center gap-2">
          <span className="text-sm">N</span>
          <input type="number" value={n} onChange={e=>setN(e.target.value)} className="border rounded px-2 py-1 w-20"/>
        </label>
        <select value={agent} onChange={e=>setAgent(e.target.value)} className="border rounded px-2 py-1">
          <option value="linear_thompson">Linear Thompson</option>
          <option value="greedy_ols">Greedy OLS</option>
          <option value="nonlinear_xgb">Nonlinear XGB</option>
          <option value="static">Static</option>
        </select>
        <button onClick={run} className="px-3 py-1 bg-green-600 text-white rounded" disabled={busy}>
          {busy ? 'Training...' : 'Warmup'}
        </button>
      </div>
      {msg && <p className="mt-2 text-sm text-gray-600">{msg}</p>}
    </div>
  )
}

