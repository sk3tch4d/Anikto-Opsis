def parse_exceptions_section(text, schedule_df, file_name, file_date):
    import re
    from static import emp_all
    def extract_name_from_line(line):
        for name in emp_all.EMP_ALL:
            if name in line:
                return name
        return None
    all_swaps = []
    used_coverers = set()
    on_lines = text.splitlines()  # placeholder for real on_lines parsing
    for line in on_lines:
        if "Covering Vacant" in line:
            name = extract_name_from_line(line)
            if not name or name in used_coverers:
                continue
            time_matches = re.findall(r"(\d{2}:\d{2})\s*-\s*(\d{2}:\d{2})", line)
            if not time_matches:
                continue
            start, end = time_matches[0]
            suffix_match = re.findall(r"\b([NPCpnc]{1,2})\b", line)
            suffix = suffix_match[-1].upper() if suffix_match else ""
            scheduled_row = schedule_df[schedule_df["Name"] == name]
            if scheduled_row.empty:
                continue
            shift = scheduled_row["Shift"].values[0]
            actual_type = scheduled_row["Type"].values[0]
            day_type = scheduled_row["DayType"].values[0]
            used_coverers.add(name)
            all_swaps.append({
                "org_employee": "Vacant",
                "cov_employee": name,
                "start": start,
                "end": end,
                "date": str(file_date),
                "reason_raw": "Covering Vacant",
                "reason": "Covering Vacant",
                "type": actual_type.title(),
                "day_type": day_type.title(),
                "notes": suffix,
                "shift": f"d{shift.replace('d', '').replace('n', '')}"
            })

    return all_swaps