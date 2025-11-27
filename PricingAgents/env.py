import os
from math import pi

import numpy as np

# ---------------------------
# Configuration / Defaults
# ---------------------------
DEFAULT_SEED = 42
T_DEFAULT = 1000
PRICE_BOUNDS = (5.0, 50.0)

# Exploration: Minimal warm-up for OLS invertibility
FORCED_EXPLORATION = 10

# Noise & Context
GAUSSIAN_NOISE_SIGMA = 3.0
TRAFFIC_MEAN = 500
TRAFFIC_POISSON = True
COMP_BASE = 25.0
COMP_AMPLITUDE = 15.0
COMP_PERIOD = 30.0
COMP_NOISE_SIGMA = 5.0

DATA_DIR = "data"
os.makedirs(DATA_DIR, exist_ok=True)

# ---------------------------
# True Parameters
# theta = [intercept, sin, cos, traffic, comp, price_sens]
# ---------------------------
TRUE_THETA = np.array(
    [10.0, 2.0, -1.0, 0.02, 0.5, 1.0],  # b=1.0 (Positive, because phi has -price)
    dtype=float,
)


def cyclical_day_features(day_index):
    """Maps 0..6 to (sin, cos)."""
    angle = 2.0 * pi * (day_index % 7) / 7.0
    return float(np.sin(angle)), float(np.cos(angle))


def compute_c_t(theta, day_sin, day_cos, traffic, comp_price):
    """Computes dynamic demand intercept."""
    return (
        theta[0]
        + theta[1] * day_sin
        + theta[2] * day_cos
        + theta[3] * traffic
        + theta[4] * comp_price
    )


def oracle_price_and_expected_revenue(
    theta, day_sin, day_cos, traffic, comp_price, pmin, pmax
):
    """Analytical optimum: p* = c_t / (2b)."""
    c_t = compute_c_t(theta, day_sin, day_cos, traffic, comp_price)
    b = theta[-1]  # Correct: b is positive

    if b <= 1e-9:
        p_star = 0.5 * (pmin + pmax)
        mu = max(0.0, c_t - b * p_star)
        return p_star, p_star * mu, c_t, b

    p_star_unconstrained = c_t / (2.0 * b)
    p_star = float(np.clip(p_star_unconstrained, pmin, pmax))
    mu_at_p_star = max(0.0, c_t - b * p_star)
    R_star = p_star * mu_at_p_star

    return p_star, float(R_star), float(c_t), float(b)


class PricingEnv:
    def __init__(
        self,
        T=T_DEFAULT,
        seed=DEFAULT_SEED,
        theta=None,
        sigma=GAUSSIAN_NOISE_SIGMA,
        price_bounds=PRICE_BOUNDS,
        comp_base=COMP_BASE,
        comp_amp=COMP_AMPLITUDE,
        comp_period=COMP_PERIOD,
        comp_noise_sigma=COMP_NOISE_SIGMA,
        forced_exploration=FORCED_EXPLORATION,
        traffic_mean=TRAFFIC_MEAN,
        traffic_poisson=TRAFFIC_POISSON,
    ):
        self.T = int(T)
        self.seed = int(seed)
        self.rng = np.random.RandomState(self.seed)
        self.sigma = float(sigma)
        self.price_bounds = tuple(float(x) for x in price_bounds)
        self.comp_base = float(comp_base)
        self.comp_amp = float(comp_amp)
        self.comp_period = float(comp_period)
        self.comp_noise_sigma = float(comp_noise_sigma)
        self.forced_exploration = int(forced_exploration)
        self.traffic_mean = float(traffic_mean)
        self.traffic_poisson = bool(traffic_poisson)
        self.theta = np.array(theta if theta is not None else TRUE_THETA, dtype=float)
        self.t = 0
        self.day_counter = 0
        self.curr_context = None

    def reset(self):
        self.t = 0
        self.day_counter = 0
        self.rng = np.random.RandomState(self.seed)
        self.curr_context = self._get_context()
        return self.curr_context

    def _sample_competitor_price(self):
        val = (
            self.comp_base
            + self.comp_amp
            * np.sin(2.0 * np.pi * (self.t % self.comp_period) / self.comp_period)
            + self.rng.normal(0.0, self.comp_noise_sigma)
        )
        return float(np.clip(val, self.price_bounds[0], self.price_bounds[1]))

    def _sample_traffic(self):
        if self.traffic_poisson:
            lam = max(
                1.0,
                self.traffic_mean
                + 400.0 * np.sin(2.0 * np.pi * (self.day_counter % 7) / 7.0),
            )
            return float(self.rng.poisson(lam))
        return float(max(0.0, self.rng.normal(self.traffic_mean, 50.0)))

    def _get_context(self):
        day = self.day_counter % 7
        sin_d, cos_d = cyclical_day_features(day)
        traffic = self._sample_traffic()
        comp_price = self._sample_competitor_price()
        return np.array([sin_d, cos_d, traffic, comp_price], dtype=float)

    def step(self, price):
        price = float(np.clip(price, self.price_bounds[0], self.price_bounds[1]))
        context_t = self.curr_context
        day = self.day_counter % 7
        sin_d, cos_d, traffic, comp_price = context_t

        phi = np.array([1.0, sin_d, cos_d, traffic, comp_price, -price], dtype=float)
        mu = float(np.dot(self.theta, phi))
        demand = float(max(0.0, mu + self.rng.normal(0.0, self.sigma)))
        revenue = float(price * demand)

        p_star, R_star, c_t, b = oracle_price_and_expected_revenue(
            self.theta,
            sin_d,
            cos_d,
            traffic,
            comp_price,
            self.price_bounds[0],
            self.price_bounds[1],
        )

        info = {
            "phi": phi,
            "c_t": c_t,
            "b": b,
            "oracle_price": p_star,
            "oracle_expected_revenue": R_star,
            "day": int(day),
            "traffic": float(traffic),
            "competitor_price": float(comp_price),
            "context": context_t,
        }

        self.t += 1
        self.day_counter += 1
        done = self.t >= self.T
        self.curr_context = self._get_context()
        return self.curr_context, demand, revenue, done, info
