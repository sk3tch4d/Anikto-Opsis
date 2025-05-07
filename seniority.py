# ==============================
# SENIORITY.PY — XLSX Loader & Search Utilities
# ==============================
# Handles loading and searching of seniority Excel files
# Used for one-time analysis and in-page lookup only
# ==============================

import pandas as pd

# ==============================
# LOAD EXCEL FILE
# ==============================
def load_seniority_file(path):
    # Load the Excel file assuming cleaned headers and structure
    df = pd.read_excel(path, sheet_name=0, header=2)
    df.columns = [str(col).strip() for col in df.columns]
    df = df.dropna(how="all")

    # Debugging output
    print(f"[DEBUG] Loaded file: {path}")
    print(f"[DEBUG] Columns: {list(df.columns)}")
    print(f"[DEBUG] Rows after dropna: {len(df)}")

    # Check for required column
    if "Years" not in df.columns:
        print("[WARNING] 'Years' column missing in seniority data!")

    return df



# ==============================
# BASIC NAME LOOKUP (fuzzy search)
# ==============================
def lookup_seniority(df, query):
    query = query.lower()
    return df[df.apply(lambda row: query in str(row).lower(), axis=1)]


# ==============================
# FILTER BY FIELD MATCHES (case-insensitive)
# ==============================
def filter_seniority(df, filters):
    result = df.copy()
    for key, val in filters.items():
        if key in df.columns and val:
            result = result[result[key].astype(str).str.contains(val, case=False)]
    return result


# ==============================
# API ROUTE REGISTRATION (Deprecated)
# Only needed if API-based search is exposed
# ==============================
def register_seniority_routes(app, file_path):
    df = load_seniority_file(file_path)

    @app.route("/api/seniority_lookup")
    def api_seniority_lookup():
        from flask import request, jsonify
        name = request.args.get("q", "")
        filters = {
            "Position": request.args.get("position"),
            "Status": request.args.get("status"),
            "Department": request.args.get("dept"),
        }
        filtered = filter_seniority(df, filters)
        if name:
            filtered = lookup_seniority(filtered, name)
        return jsonify(filtered.to_dict(orient="records"))
