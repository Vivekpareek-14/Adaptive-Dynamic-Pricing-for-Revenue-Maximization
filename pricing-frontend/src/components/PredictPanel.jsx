import React, { useState } from "react";
import { predict } from "../api";

export default function PredictPanel({ onPredicted, warmupDone }) {
  const [ctxText, setCtxText] = useState(`{
  "Product_ID": 1052,
  "Unit_Cost": 152.75,
  "Unit_Price": 267.22,
  "Discount": 0.09,
  "Product_Category": "Furniture",
  "Region": "North"
}`);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const disabled = !warmupDone;

  const doPredict = async () => {
    let ctx;
    try {
      ctx = JSON.parse(ctxText);
    } catch (e) {
      alert("Invalid JSON context");
      return;
    }

    setLoading(true);
    try {
      const r = await predict(ctx, null);
      setResult(r);
      onPredicted && onPredicted(ctx, r);
    } catch (e) {
      alert("Prediction failed: " + (e?.response?.data?.detail || e.message));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={`card ${disabled ? "opacity-50 pointer-events-none" : ""}`}>
      <div className="flex items-center gap-2 mb-2">
        <div className="bg-indigo-600 text-white text-xs px-2 py-1 rounded">
          STEP 3
        </div>
        <h3 className="font-semibold text-lg">
          Predict Price & Expected Sales
        </h3>
      </div>

      <p className="text-sm mb-2 text-gray-600">Paste or edit context JSON:</p>

      <textarea
        rows={8}
        className="w-full border rounded p-2 font-mono text-sm bg-gray-50"
        value={ctxText}
        onChange={(e) => setCtxText(e.target.value)}
      />

      <button
        onClick={doPredict}
        disabled={loading}
        className="mt-3 w-full py-2 bg-indigo-600 text-white text-sm rounded hover:bg-indigo-700"
      >
        {loading ? "Predicting…" : "Predict"}
      </button>

      {result && result.ok && (
        <div className="mt-4 border rounded p-3 bg-gray-50 shadow-sm">
          <p>
            <strong>Proposed price:</strong> {result.result.proposed_price}
          </p>
          <p>
            <strong>Predicted sales:</strong>{" "}
            {result.result.predicted_sales.toFixed(3)}
          </p>
          <p>
            <strong>Expected revenue:</strong>{" "}
            {result.result.expected_revenue.toFixed(2)}
          </p>
        </div>
      )}
    </div>
  );
}
