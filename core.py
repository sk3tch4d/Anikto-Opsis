
import os
import pandas as pd
from datetime import datetime

from argx import write_argx, make_pay_period_fn
from parser import parse_pdf

# Initialize pay period function
get_pay_period = make_pay_period_fn(datetime(2025, 1, 13))

def generate_argx_from_pdfs(pdf_paths, output_xlsx, log_duplicates=True):
    """Legacy-compatible function for writing an ARGX Excel file."""
    frames = [parse_pdf(p) for p in pdf_paths]
    df = pd.concat(frames, ignore_index=True)

    print(f"Total parsed rows: {len(df)}")
    print(f"PDF paths: {pdf_paths}")

    if df.empty:
        print("No data found.")
        return None

    if log_duplicates:
        dups = df[df.duplicated(subset=["Name", "DateObj", "Shift"], keep="first")]
        if not dups.empty:
            dups.to_excel("ARGX_DroppedDuplicates_Log.xlsx", index=False)

    df = df.drop_duplicates(subset=["Name", "DateObj", "Shift"])
    write_argx(df, output_xlsx, get_pay_period)
    print(f"Saved: {output_xlsx}")
    return output_xlsx
