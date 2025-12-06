# model_manager.py
import time

import numpy as np
import pandas as pd

from PricingAgents.demand_model import DemandModel


class ModelManager:
    def __init__(
        self, initial_dm: DemandModel, sliding_window=2000, retrain_every=50, min_new=20
    ):
        self.dm = initial_dm
        self.sliding_window = sliding_window
        self.retrain_every = retrain_every
        self.min_new = min_new
        self.buffer = []  # list of dicts
        self.new_since_retrain = 0
        self.steps = 0
        self.last_retrain_ts = None
        self.models_archive = []  # optionally keep old models

    def append_observation(self, ctx_dict: dict, price: float, sales: float):
        # ctx_dict should be numeric-encoded values created by your mapping
        rec = dict(ctx_dict)
        rec["_price_"] = float(price)
        rec["sales"] = float(sales)
        self.buffer.append(rec)
        self.new_since_retrain += 1
        self.steps += 1

    def maybe_retrain(self):
        if self.new_since_retrain < self.min_new:
            return False
        if self.steps % self.retrain_every != 0:
            return False
        # prepare DataFrame
        df = pd.DataFrame(self.buffer)
        if len(df) == 0:
            return False
        # keep last sliding_window rows
        if len(df) > self.sliding_window:
            df = df.tail(self.sliding_window).copy()
        # keep numeric cols
        df_num = df.select_dtypes(include=[np.number]).copy()
        if "_price_" not in df_num.columns or "sales" not in df_num.columns:
            return False
        df_fit = df_num.rename(columns={"_price_": "price", "sales": "sales"})
        # archival
        self.models_archive.append((time.time(), self.dm))
        # new model
        new_dm = DemandModel()
        new_dm.fit(df_fit, price_col="price", sales_col="sales")
        self.dm = new_dm
        self.new_since_retrain = 0
        self.last_retrain_ts = time.time()
        return True

    def predict_sales(self, price, ctx_dict):
        return self.dm.predict_sales(price, ctx_dict)
