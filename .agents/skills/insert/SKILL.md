---
name: insert
description: Quick shorthand transaction inserter for Monathena Budget Tracking. Infers Type and Category from amount and details and records into the first available slot in H:\My Drive\Finance\Budget.xlsx.
---

# Insert Transaction Skill (/insert)

Use this skill when the user runs `/insert` or explicitly asks to insert/log a new financial transaction into `Budget Tracking`.

## Target Spreadsheet & Sheet
- **File**: `H:\My Drive\Finance\Budget.xlsx`
- **Worksheet**: `Budget Tracking` (Columns C–J starting at Row 11 header, data on Row 12+)

## Shorthand Parsing & Inference Rules
When the user provides an amount and merchant/description (e.g. `/insert 15 chicken rice lunch`, `/insert 45 grab`, `/insert 4129 salary keysight`):
1. **Extract Amount & Details**:
   - Amount: numeric value (e.g. `15.00`, `45.00`, `4129.00`)
   - Details: merchant / description (e.g. `Chicken Rice Lunch`, `Grab to office`, `Keysight Salary`)
2. **Date**:
   - Use the provided date (YYYY-MM-DD) or default to today's date.
3. **Infer Type**:
   - `Income`: salary, paycheck, bonus, dividend, cashback, refunds.
   - `Savings`: stock investments (VT, shares), emergency savings transfers.
   - `Expenses`: all regular purchases, food, transport, bills, shopping.
4. **Infer Category**:
   - Food & Dining: `Dining Out`, `Cafeteria / Work Lunch`
   - Supermarket: `Groceries`
   - Transit & Fuel: `Transportation`
   - Personal Care: `Leisure and Personal Care`
   - Sports: `Fitness`
   - Home Bills: `Utilities (Home)`
   - Phone / Mobile: `Telecommunications`
   - Parents / Family: `Family Commitment`
   - Social / Drinks: `Social & Giving`
   - Health / Clinic: `Medical`, `Insurance`
   - Salary: `Employment (Net)`
   - Investments: `Stock Portfolio`
5. **Execution**:
   - Call `insert_excel_row` with `date`, `type`, `category`, `amount`, and `details`.
   - Confirm to the user the row number, date, type, category, amount, and details recorded.
