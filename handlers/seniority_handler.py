# ==============================
# SENIORITY_HANDLER.PY
# ==============================

from flask import render_template, current_app as app
import pandas as pd
import json

# ==============================
# NORMALIZE POSITIONS WITH DEPARTMENT + SUFFIX
# ==============================
def normalize_positions(df, mapping_path="static/pos_adjust.json"):
    """Normalize the Position column in-place, add Department and Note columns."""
    try:
        with open(mapping_path, "r") as f:
            mapping = json.load(f)
    except Exception as e:
        app.logger.error(f"Failed to load normalization map: {e}")
        return df

    full_title_map = {k.upper(): v for k, v in mapping.items()}
    word_sub_map = full_title_map.copy()
    SUFFIXES = {"PT", "CAS", "WW", "HOLD", "PSDC"}

    def normalize(raw_position):
        # Handle NaN, None, or anything non-string gracefully
        raw_position = str(raw_position).strip() if pd.notna(raw_position) else ""
        raw_position = str(raw_position).replace("–", "-").replace("—", "-").strip()

        if not raw_position:
            return "", "", ""

        parts = raw_position.split(" - ", 1)
        base_title = parts[0].strip()
        department = parts[1].strip() if len(parts) > 1 else ""

        note = ""
        full_upper = raw_position.upper()
        for suffix in SUFFIXES:
            if full_upper.endswith(f" {suffix}"):
                note = suffix
                if department.upper().endswith(f" {suffix}"):
                    department = department[:-(len(suffix) + 1)].strip()
                elif base_title.upper().endswith(f" {suffix}"):
                    base_title = " ".join(base_title.split()[:-1])
                break

        words = base_title.split()
        full_key = " ".join(words).upper()

        if full_key in full_title_map:
            normalized = full_title_map[full_key]
        else:
            normalized_words = [word_sub_map.get(w.upper(), w.title()) for w in words]
            normalized = " ".join(normalized_words)

        return normalized.strip(), department.strip(), note.strip()

    if "Position" in df.columns:
        df = df.copy()
        df[["Position", "Department", "Note"]] = df["Position"].apply(lambda x: pd.Series(normalize(x)))
    else:
        app.logger.warning("No 'Position' column found in DataFrame.")

    return df

# ==============================
# HANDLE CUPE SENIORITY DATAFRAME
# ==============================
def handle(df):
    try:
        df = normalize_positions(df)

        if "Years" not in df.columns:
            print("[WARNING] 'Years' column missing in seniority data!")

        return render_template("seniority.html", table=df.to_dict(orient="records"))

    except Exception as e:
        import traceback
        traceback.print_exc()
        app.logger.error(f"Seniority handler failed: {e}")
        return render_template("index.html", error="Failed to process seniority file.")
