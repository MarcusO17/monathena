$excel = New-Object -ComObject Excel.Application
$excel.Visible = $false
$excel.DisplayAlerts = $false
$wb = $excel.Workbooks.Open("H:\My Drive\Finance\Budget.xlsx", $false, $false)
$ws = $wb.Worksheets.Item("Budget Tracking")
if ($ws.ListObjects.Count -gt 0) {
    $table = $ws.ListObjects.Item(1)
    for ($i = $table.ListRows.Count; $i -ge 1; $i--) {
        $lr = $table.ListRows.Item($i)
        if ($lr.Range.Row -ge 1680) {
            Write-Output ("Deleted extra row: " + $lr.Range.Row)
            $lr.Delete()
        }
    }
}
$wb.Save()
$wb.Close($false)
$excel.Quit()
[System.Runtime.InteropServices.Marshal]::ReleaseComObject($excel) | Out-Null
