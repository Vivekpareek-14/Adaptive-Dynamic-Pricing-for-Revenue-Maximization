import io
import time
from typing import Any, Dict, List, Optional

import pandas as pd
from fastapi import FastAPI, File, HTTPException, UploadFile
from fastapi.encoders import jsonable_encoder
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse, StreamingResponse

from PricingAgents.pricing_engine import PricingEngine

# Create engine singleton
engine = PricingEngine()

app = FastAPI(
    title="Pricing Engine API",
    description="Backend for demand-model + pricing-agent demo (Phase 2)",
    version="0.1",
)

# Allow CORS for local React frontend (adjust origins as needed)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://127.0.0.1:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# ---------------------------
# Dataset endpoints
# ---------------------------
@app.post("/dataset/upload")
async def upload_dataset(file: UploadFile = File(...)):
    """
    Upload a CSV dataset and load into the engine.
    Returns basic metadata (n_rows, columns).
    """
    if not file.filename.endswith(".csv"):
        raise HTTPException(status_code=400, detail="Only CSV files are accepted.")
    content = await file.read()
    try:
        df = pd.read_csv(io.BytesIO(content))
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Failed to parse CSV: {e}")
    engine.load_dataset(df)
    return {
        "ok": True,
        "n_rows": len(df),
        "columns": df.columns.tolist(),
        "message": "Dataset loaded successfully. Call /model/warmup to train.",
    }


@app.post("/dataset/reset")
def reset_dataset():
    """
    Reset the engine. Removes dataset, models, agents, buffer.
    """
    result = engine.reset()
    return {"ok": True, "result": result}


@app.get("/dataset/status")
def dataset_status():
    """
    Return simple dataset metadata and state (if loaded).
    """
    if engine.df is None:
        return {"loaded": False}
    return {
        "loaded": True,
        "n_rows": len(engine.df),
        "columns": engine.df.columns.tolist(),
        "warmup_done": engine.warmup_done,
    }


# ---------------------------
# Model / Warmup endpoints
# ---------------------------
@app.post("/model/warmup")
def model_warmup(body: Dict[str, Any]):
    """
    Train demand model on first N warmup rows and initialize pricing agent.
    Request JSON:
      { "n_warmup": 50, "agent_name": "linear_thompson" }
    """
    n_warmup = int(body.get("n_warmup", 50))
    agent_name = str(body.get("agent_name", "linear_thompson"))
    if engine.df is None:
        raise HTTPException(status_code=400, detail="No dataset loaded. Upload first.")
    try:
        engine.warmup_train(n_warmup=n_warmup, agent_name=agent_name)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Warmup failed: {e}")
    return {"ok": True, "warmup_done": engine.warmup_done, "agent": agent_name}


# ---------------------------
# Prediction endpoint
# ---------------------------
@app.post("/predict")
def predict(payload: Dict[str, Any]):
    """
    Predict for a single data point (context).
    """
    if not engine.warmup_done:
        raise HTTPException(
            status_code=400, detail="Warmup not done. Call /model/warmup first."
        )
    context = payload.get("context")
    if context is None or not isinstance(context, dict):
        raise HTTPException(
            status_code=400, detail="Field 'context' (object) is required."
        )
    price_override = payload.get("price_override", None)

    # Build a pandas Series row (engine expects pd.Series)
    row = pd.Series(context)

    # If user provided an override price, compute predicted sales for that price
    if price_override is not None:
        try:
            _, _, ctx_dict = engine.preproc.transform_row(row, price_value=None)
            predicted = engine.mm.predict_sales(float(price_override), ctx_dict)
            predicted = float(max(0.0, predicted))
        except Exception as e:
            raise HTTPException(status_code=500, detail=f"Prediction failed: {e}")
        resp = {
            "ok": True,
            "price": float(price_override),
            "predicted_sales": predicted,
            "expected_revenue": float(price_override) * predicted,
        }
        return JSONResponse(content=jsonable_encoder(resp))

    # Otherwise use the agent to propose price & return its prediction
    try:
        response = engine.predict(row)
        print("ENGINE PREDICT RESPONSE:", response)
        resp = {"ok": True, "result": response}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Agent prediction failed: {e}")

    # ----- LOG prediction into engine buffer for dashboard -----
    if engine.mm is not None:
        # ----- SMART LOGGING: auto-detect keys -----
        try:
            # many engines return different keys
            price_key = None
            pred_key = None

            for k in response.keys():
                if "price" in k.lower():
                    price_key = k
                if "pred" in k.lower():
                    pred_key = k

            engine.mm.buffer.append(
                {
                    "predicted_sales": float(response[pred_key]) if pred_key else None,
                    "_price_": float(response[price_key]) if price_key else None,
                    "sales": None,
                    "timestamp": time.time(),
                }
            )

        except Exception as e:
            print("Logging failed:", e)

    # Ensure everything is JSON serializable (numpy -> native) and return
    return JSONResponse(content=jsonable_encoder(resp))


# ---------------------------
# Update endpoint (feed actual sales)
# ---------------------------
@app.post("/update")
def update_actual(payload: Dict[str, Any]):
    if not engine.warmup_done:
        raise HTTPException(status_code=400, detail="Warmup not done.")

    context = payload.get("context")
    price = payload.get("price")
    actual_sales = payload.get("actual_sales")

    if context is None or price is None or actual_sales is None:
        raise HTTPException(
            status_code=400, detail="'context', 'price', 'actual_sales' required."
        )

    row = pd.Series(context)

    try:
        out = engine.update(row, float(price), float(actual_sales))
        # --- Attach actual_sales to the most-recent prediction record (if any) ---
        if engine.mm and len(engine.mm.buffer) > 0:
            # Search backwards for the latest prediction record (has key 'predicted_sales')
            found = False
            for i in range(len(engine.mm.buffer) - 1, -1, -1):
                rec = engine.mm.buffer[i]
                # treat presence of key 'predicted_sales' as marker for prediction log
                if isinstance(rec, dict) and "predicted_sales" in rec:
                    # only fill if sales is None / missing
                    if rec.get("sales", None) is None:
                        rec["sales"] = float(actual_sales)
                        found = True
                        break
            # Fallback: if no prior prediction record found, attach to last record
            if not found:
                engine.mm.buffer[-1]["sales"] = float(actual_sales)

    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Update failed: {e}")

    return {"ok": True, "updated": out["updated"], "retrained": out["retrained"]}


# ---------------------------
# State endpoint
# ---------------------------
@app.get("/state")
def state():
    try:
        st = engine.get_state()
        return {"ok": True, "state": st}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"State retrieval failed: {e}")


# ---------------------------
# Graph data endpoint
# ---------------------------
@app.get("/graph/data")
def graph_data(limit: int = 500):
    if engine.mm is None:
        return {"ok": True, "observations": []}

    # keep ONLY prediction records
    filtered = []
    for rec in engine.mm.buffer:
        if isinstance(rec, dict) and "predicted_sales" in rec:
            filtered.append(rec)

    obs = filtered[-limit:]

    clean = []
    for rec in obs:
        out = {}
        for k, v in rec.items():
            if isinstance(v, (float, int, str)) or v is None:
                out[k] = v
            else:
                try:
                    out[k] = float(v)
                except:
                    out[k] = str(v)
        clean.append(out)

    return {"ok": True, "observations": clean}
