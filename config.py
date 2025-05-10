# ==============================
# CONFIG.PY — GLOBAL SETTINGS
# ==============================

# ==============================
# GLOBAL DATAFRAMES
# ==============================
ZWDISEG_DF = None
ZWDISEG_PATH = None
INVENTORY_DF = None
INVENTORY_PATH = None
OPTIMIZATION_DF = None
OPTIMIZATION_PATH = None

# ==============================
# GLOBAL REGEX MATCHERS
# ==============================
CATALOG_REGEX = r"(catalog|inventory|cat[_-]?v[\d.]+).*?\.(xlsx|db)$"
ARG_REGEX = r"(arg|flowsheet).*?\.(pdf)$"
SENIORITY_REGEX = r"(cupe).*seniority.*(list)?.*\.xlsx$"
USL_OPT_REGEX = r"^KG01-[A-Z0-9]{1,4}-.*\.xlsx$"
ZWDISEG_REGEX = r".*zwdiseg.*\.xlsx$"
CLEAN_REGEX = r".*clean.*\.xlsx$"
VALID_EXTENSIONS = r"\.(pdf|xlsx|db)$"

# ==============================
# GLOBAL SETTINGS
# ==============================
UPLOAD_FOLDER = "/tmp"
MAX_PDFS = 30
ALLOWED_UPLOAD_TYPES = ["pdf", "xlsx", "db"]
DEBUG_MODE = True
COLS_ORDER = [
    "Cost_Center", "USL", "Num", "QTY", "ROP", "ROQ", "Counted", "Consumed",
    "Difference", "Changed", "MVT", "Description", "Cost", "UOM",
    "Old", "Group", "Date", "Time", "Name", "Position", "Status", "Years", 
    "Valid", "Created", "Vendor_Name", "Vendor_Material"
]
