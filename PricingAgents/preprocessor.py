import numpy as np
import pandas as pd
from sklearn.preprocessing import LabelEncoder, StandardScaler


class Preprocessor:
    def __init__(self):
        self.cat_cols = []
        self.num_cols = []
        self.encoders = {}
        self.scaler = None
        self.fitted = False

    def fit(self, df: pd.DataFrame):
        """
        Fit encoders/scalers on given dataframe.
        """
        # Select candidate columns
        cat_candidates = [
            "Product_Category",
            "Region",
            "Customer_Type",
            "Sales_Channel",
            "Sales_Rep",
        ]
        num_candidates = ["Discount", "Unit_Cost"]

        self.cat_cols = [c for c in cat_candidates if c in df.columns][:2]
        while len(self.cat_cols) < 2:
            self.cat_cols.append(None)

        self.num_cols = [c for c in num_candidates if c in df.columns][:2]
        while len(self.num_cols) < 2:
            self.num_cols.append(None)

        # Fit encoders
        for c in self.cat_cols:
            if c is None:
                continue
            le = LabelEncoder()
            le.fit(df[c].fillna("NA").astype(str))
            self.encoders[c] = le

        # Fit scaler
        num_matrix = []
        for c in self.num_cols:
            if c is None:
                num_matrix.append(pd.Series(0.0, index=df.index))
            else:
                num_matrix.append(df[c].fillna(0.0).astype(float))

        num_matrix = pd.concat(num_matrix, axis=1)
        self.scaler = StandardScaler()
        self.scaler.fit(num_matrix)

        self.fitted = True

    def transform_row(self, row: pd.Series, price_value=None):
        """
        Convert a single row into:
          - ctx4
          - ctx6
          - ctx_dict (numeric-only)
        """
        if not self.fitted:
            raise RuntimeError("Preprocessor not fitted")

        # categorical
        cat_vals = []
        for c in self.cat_cols:
            if c is None:
                cat_vals.append(0.0)
            else:
                raw = str(row.get(c, "NA"))
                le = self.encoders[c]
                if raw in le.classes_:
                    cat_vals.append(float(le.transform([raw])[0]))
                else:
                    cat_vals.append(-1.0)

        # numeric
        num_vals_raw = []
        for c in self.num_cols:
            if c is None:
                num_vals_raw.append(0.0)
            else:
                num_vals_raw.append(float(row.get(c, 0.0)))

        # ensure num_vals_raw has exactly 2 elements
        while len(num_vals_raw) < 2:
            num_vals_raw.append(0.0)
        num_array = np.array([num_vals_raw], dtype=float)
        scaled_nums = self.scaler.transform(num_array)[0]

        # ctx4
        ctx4 = np.array(
            [scaled_nums[0], scaled_nums[1], cat_vals[0], cat_vals[1]], dtype=float
        )

        # ctx6
        ctx6 = np.array([1.0, ctx4[0], ctx4[1], ctx4[2], ctx4[3], 0.0], dtype=float)

        # ctx_dict for demand model (only numeric)
        ctx_dict = {
            "discount": float(row.get("Discount", 0.0)),
            "unit_cost": float(row.get("Unit_Cost", 0.0)),
            "product_category_enc": cat_vals[0],
            "region_enc": cat_vals[1],
        }

        if price_value is not None:
            ctx_dict["_price_"] = float(price_value)

        return ctx4, ctx6, ctx_dict
