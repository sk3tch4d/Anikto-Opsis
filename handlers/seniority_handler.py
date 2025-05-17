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

    IGNORE_SUFFIXES = {"PT", "CAS"}
    NOTE_SUFFIXES = {"WW", "HOLD", "PSDC"}
    ALL_SUFFIXES = IGNORE_SUFFIXES | NOTE_SUFFIXES

    def normalize(raw_position):
        raw_position = str(raw_position).replace("–", "-").replace("—", "-").strip() if pd.notna(raw_position) else ""
        if not raw_position:
            return "", "", ""

        parts = raw_position.split(" - ", 1)
        base_title = parts[0].strip()
        department = parts[1].strip() if len(parts) > 1 else ""
        note = ""

        # Check full string for suffix
        full_upper = raw_position.upper()
        for suffix in ALL_SUFFIXES:
            if full_upper.endswith(f" {suffix}"):
                if suffix in NOTE_SUFFIXES:
                    note = suffix
                if department.upper().endswith(f" {suffix}"):
                    department = department[:-(len(suffix) + 1)].strip()
                elif base_title.upper().endswith(f" {suffix}"):
                    base_title = " ".join(base_title.split()[:-1])
                break

        # Remove any remaining suffix from word list
        words = base_title.split()
        if words and words[-1].upper() in ALL_SUFFIXES:
            words = words[:-1]

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
