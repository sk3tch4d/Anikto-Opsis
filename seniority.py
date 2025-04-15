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
    df = pd.read_excel(path, sheet_name=0)
    df.columns = [col.strip() for col in df.columns]
    return df


# ==============================
# BASIC NAME LOOKUP
# ==============================
def lookup_seniority(df, query):
    query = query.lower()
    return df[df.apply(lambda row: query in str(row).lower(), axis=1)]


# ==============================
# FILTER BY FIELD MATCHES
# ==============================
def filter_seniority(df, filters):
    result = df.copy()
    for key, val in filters.items():
        if key in df.columns and val:
            result = result[result[key].astype(str).str.contains(val, case=False)]
    return result


# ==============================
# (DEPRECATED) API REGISTRATION
# ==============================
# Only needed if API-based lookup is enabled
# Not used in the new version which directly renders seniority.html
# ==============================
def register_seniority_routes(app, file_path):
    df = load_seniority_file(file_path)

    @app.route("/api/seniority_lookup")
    def api_seniority_lookup():
        from flask import request, jsonify
        name = request.args.get("q", "")
        filters = {
            "Classification": request.args.get("class"),
            "Department": request.args.get("dept"),
            "Status": request.args.get("status")
        }
        filtered = filter_seniority(df, filters)
        if name:
            filtered = lookup_seniority(filtered, name)
        return filtered.to_dict(orient="records")
