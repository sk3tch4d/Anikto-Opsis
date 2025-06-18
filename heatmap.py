# ==============================
# HEATMAP.PY
# ==============================

import os
import pandas as pd
import matplotlib.pyplot as plt
import seaborn as sns
from datetime import timedelta

# ==============================
# GENERATE HEATMAP PNG
# ==============================
def generate_heatmap_png(df, date_label):
    df["WeekStart"] = df["DateObj"].apply(lambda d: d - timedelta(days=d.weekday()))
    
    pivot = df.pivot_table(index="Name", columns="WeekStart", values="Hours", aggfunc="sum", fill_value=0)
    pivot = pivot.round(0).astype(int)

    plt.figure(figsize=(10, 6))
    sns.heatmap(pivot, annot=True, fmt="d", cmap="Blues")
    path = f"/tmp/ARGM_{date_label}.png"
    plt.title("Weekly Hours per Person")
    plt.tight_layout()
    plt.savefig(path)
    plt.close()

    print(f"Saved Heatmap: {path}")
    return path
