import React, { useState, useRef } from "react";
import { uploadDataset } from "../api";

export default function DatasetUpload({ onUploaded }) {
  const [file, setFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState({ type: "", msg: "" });
  const fileInputRef = useRef(null);

  const handleFileChange = (e) => {
    const selected = e.target.files[0];
    if (selected) {
      setFile(selected);
      setStatus({ type: "", msg: "" }); // Clear old messages
    }
  };

  const submit = async () => {
    if (!file)
      return setStatus({
        type: "error",
        msg: "Please select a CSV file first.",
      });

    setLoading(true);
    setStatus({ type: "", msg: "" });

    try {
      const data = await uploadDataset(file);
      setStatus({
        type: "success",
        msg: `Successfully uploaded ${data.n_rows} rows.`,
      });
      onUploaded && onUploaded(data);
    } catch (e) {
      setStatus({
        type: "error",
        msg: e?.response?.data?.detail || e.message || "Upload failed.",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
      {/* Header */}
      <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
        <div className="flex items-center gap-3">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-indigo-100 text-indigo-600 font-bold text-xs">
            01
          </div>
          <h3 className="font-semibold text-slate-800">Dataset Upload</h3>
        </div>
        {/* Optional: Add a subtle icon or tooltip here */}
      </div>

      {/* Body */}
      <div className="p-6 space-y-4">
        {/* Custom File Input / Drop Zone Look */}
        <div
          onClick={() => fileInputRef.current.click()}
          className={`
                group relative flex flex-col items-center justify-center w-full h-32 
                rounded-xl border-2 border-dashed transition-all cursor-pointer
                ${
                  file
                    ? "border-emerald-400 bg-emerald-50/30"
                    : "border-slate-300 hover:border-indigo-400 hover:bg-slate-50"
                }
            `}
        >
          <input
            ref={fileInputRef}
            type="file"
            accept=".csv"
            onChange={handleFileChange}
            className="hidden"
          />

          {/* Inner Content of Drop Zone */}
          <div className="flex flex-col items-center text-center p-4">
            {file ? (
              <>
                <div className="h-10 w-10 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mb-2">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-6 w-6"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M5 13l4 4L19 7"
                    />
                  </svg>
                </div>
                <p className="text-sm font-medium text-slate-700 truncate max-w-[200px]">
                  {file.name}
                </p>
                <p className="text-xs text-slate-400">
                  {(file.size / 1024).toFixed(1)} KB
                </p>
              </>
            ) : (
              <>
                <div className="h-10 w-10 bg-indigo-50 text-indigo-500 rounded-full flex items-center justify-center mb-2 group-hover:scale-110 transition-transform">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-6 w-6"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
                    />
                  </svg>
                </div>
                <p className="text-sm font-medium text-slate-600">
                  Click to upload CSV
                </p>
                <p className="text-xs text-slate-400 mt-1">
                  or drag and drop here
                </p>
              </>
            )}
          </div>
        </div>

        {/* Action Button */}
        <button
          onClick={submit}
          disabled={loading || !file}
          className={`
                w-full flex items-center justify-center py-2.5 rounded-lg text-sm font-medium transition-all
                ${
                  loading || !file
                    ? "bg-slate-100 text-slate-400 cursor-not-allowed"
                    : "bg-indigo-600 text-white hover:bg-indigo-700 shadow-md hover:shadow-lg shadow-indigo-200"
                }
            `}
        >
          {loading ? (
            <>
              <svg
                className="animate-spin -ml-1 mr-2 h-4 w-4 text-current"
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
              >
                <circle
                  className="opacity-25"
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="currentColor"
                  strokeWidth="4"
                ></circle>
                <path
                  className="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                ></path>
              </svg>
              Processing...
            </>
          ) : (
            "Upload Dataset"
          )}
        </button>

        {/* Status Messages */}
        {status.msg && (
          <div
            className={`
                p-3 rounded-lg text-sm flex items-start gap-2
                ${
                  status.type === "error"
                    ? "bg-rose-50 text-rose-600 border border-rose-100"
                    : "bg-emerald-50 text-emerald-600 border border-emerald-100"
                }
            `}
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-5 w-5 shrink-0"
              viewBox="0 0 20 20"
              fill="currentColor"
            >
              {status.type === "error" ? (
                <path
                  fillRule="evenodd"
                  d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z"
                  clipRule="evenodd"
                />
              ) : (
                <path
                  fillRule="evenodd"
                  d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                  clipRule="evenodd"
                />
              )}
            </svg>
            <span>{status.msg}</span>
          </div>
        )}
      </div>
    </div>
  );
}
