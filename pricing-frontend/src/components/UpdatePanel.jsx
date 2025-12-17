import React, { useState, useEffect } from "react";
import { updateActual } from "../api";

export default function UpdatePanel({ lastContext, lastPrediction }) {
  const [price, setPrice] = useState("");
  const [sales, setSales] = useState("");
  const [status, setStatus] = useState({ type: "", msg: "" });
  const [busy, setBusy] = useState(false);

  // If we receive a prediction, auto-fill the price to save time
  useEffect(() => {
    if (lastPrediction && lastPrediction.result) {
      setPrice(lastPrediction.result.proposed_price.toFixed(2));
    }
  }, [lastPrediction]);

  const disabled = !lastContext;

  const send = async () => {
    if (!lastContext) return;

    setBusy(true);
    setStatus({ type: "", msg: "" });

    try {
      await updateActual(lastContext, Number(price), Number(sales));
      setStatus({
        type: "success",
        msg: "Model successfully retrained with new data.",
      });
      // Optional: Clear sales after submit to prevent double submission
      setSales("");
    } catch (e) {
      setStatus({
        type: "error",
        msg: e?.response?.data?.detail || e.message || "Update failed",
      });
    } finally {
      setBusy(false);
    }
  };

  return (
    <div
      className={`relative bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden transition-all duration-300 ${
        disabled ? "opacity-60 grayscale" : ""
      }`}
    >
      {/* Overlay when disabled (waiting for prediction) */}
      {disabled && (
        <div className="absolute inset-0 z-10 bg-slate-50/20 backdrop-blur-[1px] flex items-center justify-center cursor-not-allowed">
          {/* Tooltip-like message handled by opacity, but we can add an icon if needed */}
        </div>
      )}

      {/* Header */}
      <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
        <div className="flex items-center gap-3">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-amber-100 text-amber-700 font-bold text-xs">
            04
          </div>
          <h3 className="font-semibold text-slate-800">
            Ground Truth Feedback
          </h3>
        </div>

        {/* Status Indicator */}
        {!disabled && (
          <div className="flex items-center gap-1.5 px-2 py-1 bg-amber-50 rounded text-[10px] font-bold text-amber-600 border border-amber-100 uppercase tracking-wide">
            <span className="relative flex h-1.5 w-1.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-amber-500"></span>
            </span>
            Ready to Learn
          </div>
        )}
      </div>

      <div className="p-6 space-y-5">
        <div className="grid grid-cols-2 gap-4">
          {/* Price Input */}
          <div>
            <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">
              Offered Price
            </label>
            <div className="relative group">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <span className="text-slate-400 font-mono font-bold">$</span>
              </div>
              <input
                type="number"
                step="0.01"
                value={price}
                onChange={(e) => setPrice(e.target.value)}
                disabled={disabled}
                placeholder="0.00"
                className="w-full bg-slate-50 border border-slate-300 text-slate-900 text-sm rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-amber-500 block w-full pl-8 p-2.5 font-mono transition-all"
              />
            </div>
          </div>

          {/* Sales Input */}
          <div>
            <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">
              Actual Sales
            </label>
            <div className="relative group">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-4 w-4 text-slate-400"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z"
                  />
                </svg>
              </div>
              <input
                type="number"
                value={sales}
                onChange={(e) => setSales(e.target.value)}
                disabled={disabled}
                placeholder="Units"
                className="w-full bg-slate-50 border border-slate-300 text-slate-900 text-sm rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-amber-500 block w-full pl-9 p-2.5 font-mono transition-all"
              />
            </div>
          </div>
        </div>

        {/* Submit Button */}
        <button
          onClick={send}
          disabled={busy || disabled}
          className={`
            w-full flex items-center justify-center py-2.5 rounded-lg text-sm font-medium transition-all duration-200
            ${
              busy || disabled
                ? "bg-slate-100 text-slate-400 cursor-not-allowed"
                : "bg-gradient-to-r from-amber-500 to-orange-600 text-white hover:shadow-lg hover:shadow-orange-200 hover:from-amber-600 hover:to-orange-700"
            }
          `}
        >
          {busy ? (
            <>
              <svg
                className="animate-spin -ml-1 mr-2 h-4 w-4 text-white"
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
              Retraining Agent...
            </>
          ) : (
            <>
              <span>Submit & Retrain</span>
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-4 w-4 ml-2"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z"
                />
              </svg>
            </>
          )}
        </button>

        {/* Status Messages */}
        {status.msg && (
          <div
            className={`
                p-3 rounded-lg text-sm flex items-start gap-2 border
                ${
                  status.type === "error"
                    ? "bg-rose-50 text-rose-600 border-rose-100"
                    : "bg-emerald-50 text-emerald-600 border-emerald-100"
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
