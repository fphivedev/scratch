 ' Query map include - keep SQL mapping here so code changes are separate
 ' Edit these entries to add/remove queries without touching sql_loader.asp
Private Function QueryMap()
  Dim m : Set m = Server.CreateObject("Scripting.Dictionary")
  m.CompareMode = 1 ' TextCompare

  ' Configure mappings: key -> relative .sql path under your SQL base
  m.Add "orders_report",      "reports\orders_report.sql"
  m.Add "customer_summary",   "reports\customer_summary.sql"
  m.Add "invoice_detail",     "invoices\invoice_detail.sql"

  Set QueryMap = m
End Function

