# ==============================
# DATA_SEARCH.PY
# ==============================

import numpy as np
from flask import request, jsonify

# ==============================
# SEARCH REQUEST
# ==============================
def handle_search_request(df, search_fn, default_sort="QTY", filter_param="usl"):
    try:
        term = request.args.get("term", "")
        filter_value = request.args.get(filter_param, "All")
        sort = request.args.get("sort", default_sort)
        direction = request.args.get("dir", "desc")

        results = search_fn(df, term, filter_value, sort, direction)

        # Fix NaNs to None before jsonify
        for r in results:
            for k, v in r.items():
                if isinstance(v, float) and np.isnan(v):
                    r[k] = None

        return jsonify(results)

    except Exception as e:
        return jsonify({"error": str(e)}), 500
