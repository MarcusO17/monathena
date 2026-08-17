param(
    [Parameter(Mandatory=$false)]
    [string]$Base64Payload = ""
)

$ErrorActionPreference = "Stop"

$FilePath = "H:\My Drive\Finance\Budget.xlsx"
$DateStr = (Get-Date).ToString("yyyy-MM-dd")
$TypeStr = "Expenses"
$Category = "Dining Out"
$Amount = "0.00"
$Details = ""
$Fund = ""

if ($Base64Payload) {
    try {
        $jsonBytes = [System.Convert]::FromBase64String($Base64Payload)
        $jsonStr = [System.Text.Encoding]::UTF8.GetString($jsonBytes)
        $data = $jsonStr | ConvertFrom-Json
        if ($data.filePath) { $FilePath = [string]$data.filePath }
        if ($data.date) { $DateStr = [string]$data.date }
        if ($data.type) { $TypeStr = [string]$data.type }
        if ($data.category) { $Category = [string]$data.category }
        if ($data.amount -ne $null) { $Amount = [string]$data.amount }
        if ($data.details) { $Details = [string]$data.details }
        if ($data.fund) { $Fund = [string]$data.fund }
    } catch {
        Write-Output (ConvertTo-Json @{
            success = $false
            error = "Failed to decode payload: " + $_.Exception.Message
        })
        exit 0
    }
}

$excel = $null
$wb = $null
$ws = $null

try {
    try {
        $excel = [System.Runtime.InteropServices.Marshal]::GetActiveObject("Excel.Application")
    } catch {
        $excel = New-Object -ComObject Excel.Application
    }

    $excel.Visible = $false
    $excel.DisplayAlerts = $false
    $excel.ScreenUpdating = $false

    $wb = $excel.Workbooks | Where-Object { $_.FullName -eq $FilePath } | Select-Object -First 1
    $wasAlreadyOpen = ($wb -ne $null)

    if (-not $wb) {
        $wb = $excel.Workbooks.Open($FilePath, $false, $false)
    }

    $ws = $wb.Worksheets | Where-Object { $_.Name -like "*Tracking*" } | Select-Object -First 1
    if (-not $ws) {
        $ws = $wb.Worksheets.Item("Budget Tracking")
    }

    # Find the FIRST AVAILABLE EMPTY SLOT starting from Row 12 (Columns C=3, D=4, F=6, G=7)
    $targetRow = 12
    $maxScanRow = [Math]::Max($ws.UsedRange.Rows.Count + 10, 5000)

    for ($r = 12; $r -le $maxScanRow; $r++) {
        $dateVal = $ws.Cells.Item($r, 3).Value2
        $typeVal = $ws.Cells.Item($r, 4).Value2
        $amtVal  = $ws.Cells.Item($r, 6).Value2
        $detVal  = $ws.Cells.Item($r, 7).Value2

        $isDateEmpty = ($dateVal -eq $null -or [string]$dateVal -eq "")
        $isTypeEmpty = ($typeVal -eq $null -or [string]$typeVal -eq "")
        $isAmtEmpty  = ($amtVal  -eq $null -or [string]$amtVal  -eq "")
        $isDetEmpty  = ($detVal  -eq $null -or [string]$detVal  -eq "")

        if ($isDateEmpty -and $isTypeEmpty -and $isAmtEmpty -and $isDetEmpty) {
            $targetRow = $r
            break
        }
    }

    # Insert into the first available slot (Columns C=3, D=4, E=5, F=6, G=7, J=10)
    $ws.Cells.Item($targetRow, 3).Value2 = [string]$DateStr
    $ws.Cells.Item($targetRow, 4).Value2 = [string]$TypeStr
    $ws.Cells.Item($targetRow, 5).Value2 = [string]$Category
    $ws.Cells.Item($targetRow, 6).Value2 = [string]$Amount
    $ws.Cells.Item($targetRow, 7).Value2 = [string]$Details
    if ($Fund) {
        $ws.Cells.Item($targetRow, 10).Value2 = [string]$Fund
    }

    $wb.Save()

    if (-not $wasAlreadyOpen) {
        $wb.Close($false)
        $excel.Quit()
        [System.Runtime.InteropServices.Marshal]::ReleaseComObject($ws) | Out-Null
        [System.Runtime.InteropServices.Marshal]::ReleaseComObject($wb) | Out-Null
        [System.Runtime.InteropServices.Marshal]::ReleaseComObject($excel) | Out-Null
        [System.GC]::Collect()
        [System.GC]::WaitForPendingFinalizers()
    }

    Write-Output (ConvertTo-Json @{
        success = $true
        row = $targetRow
        date = $DateStr
        type = $TypeStr
        category = $Category
        amount = $Amount
        details = $Details
        fund = $Fund
    })
} catch {
    $errLine = $_.InvocationInfo.ScriptLineNumber
    $errMsg = $_.Exception.ToString()
    if ($wb -and -not $wasAlreadyOpen) { $wb.Close($false) }
    if ($excel -and -not $wasAlreadyOpen) { $excel.Quit() }
    Write-Output (ConvertTo-Json @{
        success = $false
        error = "$errMsg (at line $errLine)"
    })
}
