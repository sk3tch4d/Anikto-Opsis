# ==============================
# DATA_SEARCH.PY
# ==============================

import numpy as np
from flask import request, jsonify

# ==============================
# SEARCH REQUEST
# ==============================
def handle_search_request(df, search_fn, default_sort="QTY"):
    try:
        term = request.args.get("term", "")
        usl = request.args.get("usl", "Any")
        sort = request.args.get("sort", default_sort)
        direction = request.args.get("dir", "desc")

        results = search_fn(df, term, usl, sort, direction)

        for r in results:
            for k, v in r.items():
                if isinstance(v, float) and np.isnan(v):
                    r[k] = None

        return jsonify(results)

    except Exception as e:
        return jsonify({"error": str(e)}), 500
