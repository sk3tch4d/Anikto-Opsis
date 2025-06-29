# ==============================
# CONFIG.PY — GLOBAL SETTINGS
# ==============================

from utils.dev_mode import generate_dev_code

# ==============================
# GLOBAL DATAFRAMES
# ==============================
ZWDISEG_DF = None
ZWDISEG_PATH = None
INVENTORY_DF = None
INVENTORY_PATH = None
MOVEMENT_DF = None
MOVEMENT_PATH = None
OPTIMIZATION_DF = None
OPTIMIZATION_PATH = None

# ==============================
# GLOBAL REGEX MATCHERS
# ==============================
ARG_REGEX = r"(arg|flowsheet).*?\.(pdf)$"
CATALOG_REGEX = r"(catalog|inventory|cat[_-]?v[\d.]+).*?\.(xlsx|db)$"
OPTIMIZE_REGEX = r"^KG01-[A-Z0-9]{1,4}-.*\.xlsx$"
MOVEMENT_REGEX = r".*mm.*\.xlsx$"
SENIORITY_REGEX = r"(?i)(cupe|opseu)?[^/\\]*?(seniority|sen)[\s_-]*(list|lists|lst)?[^/\\]*\.xlsx$"
ZWDISEG_REGEX = r".*zwdiseg.*\.xlsx$"
CLEAN_REGEX = r".*clean.*\.xlsx$"
MERGE_REGEX = r'^merge_.*\\.xlsx$'
VALID_EXTENSIONS = r"\.(pdf|xlsx|db)$"

# ==============================
# GLOBAL SETTINGS
# ==============================
UPLOAD_FOLDER = "/tmp"
MAX_PDFS = 30
ALLOWED_UPLOAD_TYPES = ["pdf", "xlsx", "db"]
DEBUG_MODE = True
DEV_MODE = {"112737", "ryce", "rvp", "pineapple", generate_dev_code()}
COLS_ORDER = [
    "Cost_Center", "USL", "Num", "QTY", "ROP", "ROQ", "Counted", "Consumed",
    "Difference", "Changed", "MVT", "Description", "Cost", "UOM",
    "Old", "Group", "Date", "Time", "Name", "Position", "Status", "Years", 
    "Valid", "Created", "Vendor_Name", "Vendor_Material"
]
