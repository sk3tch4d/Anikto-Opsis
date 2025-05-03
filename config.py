# ==============================
# CONFIG.PY — GLOBAL SETTINGS
# ==============================

# Shared global DataFrames
INVENTORY_DF = None
OPTIMIZATION_DF = None

# ==============================
# REGEX MATCHERS (Shared Patterns)
# ==============================
CATALOG_REGEX = r"(catalog|inventory|cat[_-]?v[\d.]+).*?\.(xlsx|db)$"
ARG_REGEX = r"(arg|flowsheet).*?\.(pdf)$"
SENIORITY_REGEX = r"(cupe).*seniority.*(list)?.*\.xlsx$"
USL_OPT_REGEX = r"^KG01-[A-Z0-9]{1,4}-.*\.xlsx$"
VALID_EXTENSIONS = r"\.(pdf|xlsx|db)$"

# ==============================
# SETTINGS
# ==============================
UPLOAD_FOLDER = "/tmp"
MAX_PDFS = 30
ALLOWED_UPLOAD_TYPES = ["pdf", "xlsx", "db"]
DEBUG_MODE = True
