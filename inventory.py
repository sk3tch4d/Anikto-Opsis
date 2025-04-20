# ==============================
# INVENTORY LOADER
# ==============================
import pandas as pd


# ==============================
# INIT INVENTORY PROCESSING
# ==============================
import pandas as pd

def load_inventory_data(path="Stores_Inventory_V7.7.xlsx"):
    df = pd.read_excel(path).fillna("")
    df.columns = [c.strip() for c in df.columns]
    return df

