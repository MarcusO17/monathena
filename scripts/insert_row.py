import sys
import json
import os
from datetime import datetime
import openpyxl

def insert_budget_row(file_path, date_str, trans_type, category, amount, details, fund=""):
    if not os.path.exists(file_path):
        print(json.dumps({"success": False, "error": f"File not found: {file_path}"}))
        return

    # Load workbook preserving all formulas, styles, and table schemas
    wb = openpyxl.load_workbook(file_path, data_only=False, keep_vba=True)
    
    # Locate Budget Tracking worksheet
    sheet_name = "Budget Tracking"
    if sheet_name not in wb.sheetnames:
        for s in wb.sheetnames:
            if "tracking" in s.lower():
                sheet_name = s
                break
    ws = wb[sheet_name]

    # Header is at Row 11 starting at Column C (Col 3).
    # Data starts at Row 12. Find the next empty row in Column C.
    target_row = 12
    for r in range(12, max(ws.max_row + 2, 10000)):
        date_cell = ws.cell(row=r, column=3).value
        type_cell = ws.cell(row=r, column=4).value
        amt_cell = ws.cell(row=r, column=6).value
        if (date_cell is None or str(date_cell).strip() == "") and (type_cell is None or str(type_cell).strip() == "") and (amt_cell is None or str(amt_cell).strip() == ""):
            target_row = r
            break

    # Parse date
    try:
        date_val = datetime.strptime(date_str, "%Y-%m-%d")
    except Exception:
        date_val = date_str

    # Parse amount
    try:
        amt_val = float(amount)
    except Exception:
        amt_val = amount

    # Column C (3): Date
    ws.cell(row=target_row, column=3, value=date_val)
    # Column D (4): Type
    ws.cell(row=target_row, column=4, value=trans_type)
    # Column E (5): Category
    ws.cell(row=target_row, column=5, value=category)
    # Column F (6): Amount
    ws.cell(row=target_row, column=6, value=amt_val)
    # Column G (7): Details
    ws.cell(row=target_row, column=7, value=details)
    # Column J (10): Fund (if provided)
    if fund:
        ws.cell(row=target_row, column=10, value=fund)

    wb.save(file_path)
    wb.close()

    print(json.dumps({
        "success": True,
        "row": target_row,
        "date": str(date_str),
        "type": trans_type,
        "category": category,
        "amount": amt_val,
        "details": details,
        "fund": fund
    }))

if __name__ == "__main__":
    if len(sys.argv) > 1:
        try:
            params = json.loads(sys.argv[1])
            insert_budget_row(
                params.get("filePath", r"H:\My Drive\Finance\Budget.xlsx"),
                params.get("date", datetime.now().strftime("%Y-%m-%d")),
                params.get("type", "Expenses"),
                params.get("category", "Dining Out"),
                params.get("amount", 0),
                params.get("details", ""),
                params.get("fund", "")
            )
        except Exception as e:
            print(json.dumps({"success": False, "error": str(e)}))
