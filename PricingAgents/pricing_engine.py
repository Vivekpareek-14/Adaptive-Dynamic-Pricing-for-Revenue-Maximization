import numpy as np
import pandas as pd

from PricingAgents.agents import GreedyOLSAgent, StaticAgent, ThompsonAgent
from PricingAgents.demand_model import DemandModel
from PricingAgents.model_manager import ModelManager
from PricingAgents.preprocessor import Preprocessor
from PricingAgents.run_bandits import (
    LinearAdapter,
    NeuralAdapter,
    NonLinearAdapter,
    OracleWrapper,
)


class PricingEngine:
    def __init__(self, price_bounds=(1.0, 500.0)):
        self.df = None
        self.preproc = Preprocessor()
        self.dm = None
        self.mm = None  # model manager
        self.agent = None
        self.price_bounds = price_bounds
        self.warmup_done = False

    # --------------------------
    #   DATASET LOADING
    # --------------------------
    def load_dataset(self, df: pd.DataFrame):
        self.df = df.reset_index(drop=True)
        self.preproc.fit(df)
        self.warmup_done = False

    # --------------------------
    #   WARMUP TRAINING
    # --------------------------
    def warmup_train(self, n_warmup=50, agent_name="linear_thompson"):
        if self.df is None:
            raise RuntimeError("No dataset loaded")

        if n_warmup >= len(self.df):
            raise ValueError("n_warmup too large")

        df_warm = self.df.iloc[:n_warmup]
        price_col = "Unit_Price" if "Unit_Price" in self.df.columns else "price"
        sales_col = "Quantity_Sold"

        # Prepare encoded warmup rows
        enc_rows = []
        for idx, row in df_warm.iterrows():
            _, _, ctx_dict = self.preproc.transform_row(row)
            enc_rows.append(ctx_dict)

        df_enc = pd.DataFrame(enc_rows)
        df_enc[price_col] = df_warm[price_col].astype(float).values
        df_enc["sales"] = df_warm[sales_col].astype(float).values

        df_enc = df_enc.select_dtypes(include=[np.number])
        df_enc = df_enc.rename(columns={price_col: "price"})

        # Train demand model
        self.dm = DemandModel()
        self.dm.fit(df_enc, price_col="price", sales_col="sales")

        # Build model manager
        self.mm = ModelManager(self.dm)

        # Replace the agent instantiation section in PricingEngine.warmup_train
        # -------------------------
        # Instantiate pricing agent
        if agent_name == "static":
            self.agent = StaticAgent(fixed_price=55.0)
        elif agent_name == "linear_thompson":
            # pass seed and price_bounds to LinearAdapter
            self.agent = LinearAdapter(
                ThompsonAgent, seed=42, price_bounds=self.price_bounds
            )
        elif agent_name == "greedy_ols":
            self.agent = LinearAdapter(
                GreedyOLSAgent, seed=42, price_bounds=self.price_bounds
            )
        elif agent_name == "nonlinear_xgb":
            self.agent = NonLinearAdapter(self.price_bounds, seed=42)
        elif agent_name == "neural":
            # NeuralAdapter expects a context_dim (we use ctx4)
            self.agent = NeuralAdapter(4, self.price_bounds, seed=42)
        else:
            # fallback
            self.agent = LinearAdapter(
                ThompsonAgent, seed=42, price_bounds=self.price_bounds
            )
        # -------------------------

        self.warmup_done = True

    # --------------------------
    #   PREDICT STEP
    # --------------------------
    def predict(self, row: pd.Series):
        if not self.warmup_done:
            raise RuntimeError("Warmup training not done.")

        ctx4, ctx6, ctx_dict = self.preproc.transform_row(row)

        # choose price
        try:
            price = self.agent.act(ctx6, 0)
        except Exception:
            price = self.agent.act(ctx4, 0)

        # predict sales
        predicted_sales = self.mm.predict_sales(price, ctx_dict)
        predicted_sales = max(0.0, float(predicted_sales))
        expected_revenue = predicted_sales * price

        return {
            "proposed_price": float(price),
            "predicted_sales": float(predicted_sales),
            "expected_revenue": float(expected_revenue),
            "ctx_dict": ctx_dict,
            "ctx4": ctx4.tolist(),
            "ctx6": ctx6.tolist(),
        }

    # --------------------------
    #   UPDATE STEP (actual sales)
    # --------------------------
    def update(self, row: pd.Series, price: float, actual_sales: float):
        ctx4, ctx6, ctx_dict = self.preproc.transform_row(row, price_value=price)
        ctx6[-1] = -price  # IMPORTANT for linear agents

        # Update agent
        try:
            self.agent.update(price, ctx6, actual_sales)
        except Exception:
            try:
                self.agent.update(price, ctx4, actual_sales)
            except Exception:
                pass

        # Feed ModelManager
        self.mm.append_observation(ctx_dict, price, actual_sales)
        retrained = self.mm.maybe_retrain()

        return {
            "updated": True,
            "retrained": retrained,
        }

    # --------------------------
    #   RESET ENGINE
    # --------------------------
    def reset(self):
        self.df = None
        self.preproc = Preprocessor()
        self.dm = None
        self.mm = None
        self.agent = None
        self.warmup_done = False
        return {"reset": True}

    # --------------------------
    #   INTERNAL STATE
    # --------------------------
    def get_state(self):
        return {
            "warmup_done": self.warmup_done,
            "buffer_size": 0 if self.mm is None else len(self.mm.buffer),
            "last_retrain": None if self.mm is None else self.mm.last_retrain_ts,
            "agent_type": None if self.agent is None else self.agent.__class__.__name__,
        }
