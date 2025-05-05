import sqlite3
import os
import shutil
from whoosh.fields import Schema, TEXT, ID, NUMERIC
from whoosh.analysis import StemmingAnalyzer
from whoosh.index import create_in

DB_PATH = "Stores_Inventory_V7.7.db"
INDEX_DIR = "inventory_index"

schema = Schema(
    table=ID(stored=True),
    Cost_Center=TEXT(stored=True, analyzer=StemmingAnalyzer()),
    USL=TEXT(stored=True),
    Bin=TEXT(stored=True),
    Num=NUMERIC(stored=True),
    Description=TEXT(stored=True, analyzer=StemmingAnalyzer()),
    QTY=NUMERIC(stored=True),
    ROP=NUMERIC(stored=True),
    ROQ=NUMERIC(stored=True),
    UOM=TEXT(stored=True),
    Group=TEXT(stored=True),
    Old=TEXT(stored=True),
    Assignment=NUMERIC(stored=True),
    Cost=NUMERIC(stored=True),
    Created=TEXT(stored=True),
    Last_Change=TEXT(stored=True)
)

def build_index():
    if os.path.exists(INDEX_DIR):
        shutil.rmtree(INDEX_DIR)
    os.mkdir(INDEX_DIR)

    ix = create_in(INDEX_DIR, schema)
    writer = ix.writer()

    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()

    cursor.execute("SELECT * FROM inventory")
    columns = [description[0] for description in cursor.description]

    for row in cursor.fetchall():
        data = dict(zip(columns, row))
        writer.add_document(
            table="inventory",
            Cost_Center=str(data.get("Cost_Center", "")),
            USL=str(data.get("USL", "")),
            Bin=str(data.get("Bin", "")),
            Num=int(data.get("Num", 0)),
            Description=str(data.get("Description", "")),
            QTY=int(data.get("QTY", 0)),
            ROP=int(data.get("ROP", 0)),
            ROQ=int(data.get("ROQ", 0)),
            UOM=str(data.get("UOM", "")),
            Group=str(data.get("Group", "")),
            Old=str(data.get("Old", "")) if data.get("Old") is not None else "",
            Assignment=int(data.get("Assignment", 0)),
            Cost=float(data.get("Cost", 0.0)),
            Created=str(data.get("Created", "")),
            Last_Change=str(data.get("Last_Change", ""))
        )

    writer.commit()
    conn.close()

if __name__ == "__main__":
    build_index()
    print("Whoosh index created successfully.")
