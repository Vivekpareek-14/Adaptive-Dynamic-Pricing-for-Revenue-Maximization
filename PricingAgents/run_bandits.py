import os
import time

import matplotlib.pyplot as plt
import numpy as np
import pandas as pd
import seaborn as sns

from agents import GreedyOLSAgent, PolicyAgent, StaticAgent, ThompsonAgent
from env import GAUSSIAN_NOISE_SIGMA, PRICE_BOUNDS, TRUE_THETA, PricingEnv
from utils import find_optimal_static_price, oracle_policy_factory, summarize_all


def run_one_agent(name, agent, seed, T=1000):
    env = PricingEnv(T=T, seed=seed)
    forced_exp = int(env.forced_exploration)
    ctx = env.reset()
    done = False
    t = 0
    logs, cumulative = [], 0.0

    while not done:
        if t < forced_exp:
            price = float(env.rng.uniform(*env.price_bounds))
            forced = True
        else:
            price = agent.act(ctx, t)
            forced = False

        ctx_next, demand, revenue, done, info = env.step(price)
        agent.update(price, ctx, demand)
        cumulative += revenue

        logs.append(
            {
                "seed": seed,
                "t": t,
                "agent": name,
                "price": price,
                "revenue": revenue,
                "cum_revenue": cumulative,
                "oracle_rev": info["oracle_expected_revenue"],
                "forced": forced,
            }
        )
        ctx = ctx_next
        t += 1
    return logs, cumulative


def run_experiment(seeds=None, T=1000, results_dir="results"):
    os.makedirs(results_dir, exist_ok=True)
    if seeds is None:
        seeds = range(2000, 2010)

    # 1. Get Baseline dynamically
    print("Step 1: Finding optimal static baseline...")
    OPTIMAL_PRICE = find_optimal_static_price()
    print("-" * 30)

    # 2. Setup Oracle
    oracle_fn = oracle_policy_factory(TRUE_THETA, *PRICE_BOUNDS)

    all_logs, final_rows = [], []
    start = time.time()

    print(f"Step 2: Running experiment on {len(seeds)} seeds...")
    for seed in seeds:
        # Instantiate fresh agents per seed
        agents = {
            "static": StaticAgent(fixed_price=OPTIMAL_PRICE),
            "greedy_ols": GreedyOLSAgent(),
            "thompson": ThompsonAgent(sigma_noise=GAUSSIAN_NOISE_SIGMA, seed=seed),
            "oracle": PolicyAgent(oracle_fn),
        }

        seed_results = {"seed": seed}
        for name, agent in agents.items():
            logs, total_rev = run_one_agent(name, agent, seed, T)
            all_logs.extend(logs)
            seed_results[name] = total_rev

        final_rows.append(seed_results)
        print(f"Seed {seed} done.")

    print(f"Runtime: {time.time() - start:.2f}s")

    # 3. Save Data
    df = pd.DataFrame(all_logs)
    df_final = pd.DataFrame(final_rows)
    df.to_csv(f"{results_dir}/results.csv", index=False)
    df_final.to_csv(f"{results_dir}/final_summary.csv", index=False)

    # 4. Plots
    print("Generating plots...")
    # Revenue
    plt.figure(figsize=(10, 6))
    sns.lineplot(data=df, x="t", y="cum_revenue", hue="agent", ci="sd")
    plt.title("Cumulative Revenue")
    plt.savefig(f"{results_dir}/cumulative_revenue.png")

    # Regret
    df["regret"] = df["oracle_rev"] - df["revenue"]
    # Group by agent/seed to cumsum, then plot mean over seeds
    df["cum_regret"] = df.groupby(["agent", "seed"])["regret"].cumsum()
    plt.figure(figsize=(10, 6))
    sns.lineplot(data=df, x="t", y="cum_regret", hue="agent", ci="sd")
    plt.title("Cumulative Regret")
    plt.savefig(f"{results_dir}/cumulative_regret.png")

    # Prices (Learning Agents Only)
    plt.figure(figsize=(10, 6))
    learning_df = df[~df["agent"].isin(["static", "oracle"])]
    sns.lineplot(data=learning_df, x="t", y="price", hue="agent", ci="sd")
    plt.axhline(OPTIMAL_PRICE, color="r", linestyle="--", label="Static Opt")
    plt.title("Price Trajectories (Learning Agents)")
    plt.savefig(f"{results_dir}/price_trajectories.png")

    # 5. Stats
    results_dict = {
        "thompson": df_final["thompson"].values,
        "greedy_ols": df_final["greedy_ols"].values,
        "static": df_final["static"].values,
        "oracle": df_final["oracle"].values,
    }
    summarize_all(results_dict, baseline="static", oracle="oracle")


if __name__ == "__main__":
    run_experiment()
