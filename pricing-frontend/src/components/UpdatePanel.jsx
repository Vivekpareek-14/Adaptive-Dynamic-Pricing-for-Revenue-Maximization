import React, { useState } from "react";
import { updateActual } from "../api";

export default function UpdatePanel({ lastContext, lastPrediction }) {
  const [price, setPrice] = useState("");
  const [sales, setSales] = useState("");
  const [msg, setMsg] = useState(null);
  const [busy, setBusy] = useState(false);

  const disabled = !lastContext || !lastPrediction;

  React.useEffect(() => {
    if (lastPrediction) {
      setPrice(lastPrediction.result.proposed_price.toFixed(2));
    }
  }, [lastPrediction]);

  const send = async () => {
    if (!lastContext) return;
    setBusy(true);
    setMsg(null);

    try {
      const r = await updateActual(lastContext, Number(price), Number(sales));
      setMsg("Update complete. Retrained: " + r.retrained);
    } catch (e) {
      setMsg("Update failed: " + (e?.response?.data?.detail || e.message));
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className={`card ${disabled ? "opacity-50 pointer-events-none" : ""}`}>
      <div className="flex items-center gap-2 mb-2">
        <div className="bg-indigo-600 text-white text-xs px-2 py-1 rounded">
          STEP 4
        </div>
        <h3 className="font-semibold text-lg">Enter Actual Sales</h3>
      </div>

      <p className="text-sm text-gray-600 mb-2">
        The price is pre-filled from the last prediction.
      </p>

      <div className="flex flex-col gap-3 mt-2">
        <input
          placeholder="Price used"
          value={price}
          onChange={(e) => setPrice(e.target.value)}
          className="border rounded px-2 py-1"
        />

        <input
          placeholder="Actual sales"
          value={sales}
          onChange={(e) => setSales(e.target.value)}
          className="border rounded px-2 py-1"
        />
      </div>

      <button
        onClick={send}
        disabled={busy}
        className="mt-3 w-full bg-amber-600 text-white py-2 rounded hover:bg-amber-700"
      >
        {busy ? "Sending…" : "Submit Actual Sales"}
      </button>

      {msg && <p className="mt-2 text-sm text-gray-700">{msg}</p>}
    </div>
  );
}
