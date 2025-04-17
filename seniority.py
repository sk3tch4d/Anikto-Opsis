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
    df = pd.read_excel(path, sheet_name=0, header=3)
    df.columns = [str(col).strip() for col in df.columns]
    df = df.dropna(how="all")

    # Explicit column normalization
    rename_map = {
        "First Name": "First Name",
        "Last Name": "Last Name",
        "Position": "Position",
        "Status": "Status",
        "Limited Seniority Years": "Years"
    }

    df = df.rename(columns={k: v for k, v in rename_map.items() if k in df.columns})
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
