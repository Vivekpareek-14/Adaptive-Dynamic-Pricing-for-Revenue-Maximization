import React, { useState } from 'react'
import { uploadDataset } from '../api'

export default function DatasetUpload({ onUploaded }) {
  const [file, setFile] = useState(null)
  const [loading, setLoading] = useState(false)
  const [msg, setMsg] = useState(null)

  const submit = async () => {
    if (!file) return setMsg('Select CSV first')
    setLoading(true)
    try {
      const data = await uploadDataset(file)
      setMsg('Uploaded: ' + data.n_rows + ' rows')
      onUploaded && onUploaded(data)
    } catch (e) {
      setMsg('Upload failed: ' + (e?.response?.data?.detail || e.message))
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="card">
      <h3 className="font-semibold mb-2">1) Upload dataset</h3>
      <input type="file" accept=".csv" onChange={e => setFile(e.target.files[0])} />
      <div className="mt-3 flex gap-2">
        <button onClick={submit} className="px-4 py-2 bg-indigo-600 text-white rounded" disabled={loading}>
          {loading ? 'Uploading...' : 'Upload'}
        </button>
      </div>
      {msg && <p className="mt-2 text-sm text-gray-600">{msg}</p>}
    </div>
  )
}
