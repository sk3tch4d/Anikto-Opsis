// ==============================
// INVENTORY.PY
// Process Inventory Dateset
// ==============================
import pandas as pd

// ==============================
// INIT INVENTORY PROCESSING
// ==============================
import pandas as pd

def load_inventory_data():
    df = pd.read_excel("Stores_Inventory_V7.7.xlsx").fillna("")
    df.columns = [c.strip() for c in df.columns]
    return df
