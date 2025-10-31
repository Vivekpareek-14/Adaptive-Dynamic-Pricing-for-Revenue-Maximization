# src/environment.py
import numpy as np

class PricingEnvironment:
    def __init__(self, price_points):
        """
        price_points: list or array of possible prices (arms)
        """
        self.price_points = price_points

    def true_demand(self, price):
        """
        Define the actual (hidden) demand curve.
        For now, use a simple decreasing nonlinear function.
        Later, you can replace this with your XGBoost model.
        """
        return max(0, 200 - 3 * price + np.random.normal(0, 5))  # noisy demand

    def get_reward(self, price_index):
        """
        Compute revenue for chosen price arm
        """
        price = self.price_points[price_index]
        demand = self.true_demand(price)
        revenue = price * demand
        return revenue