<%
' Security: fixed base folder, explicit whitelist, read-only, caching.

' Ensures we have a base path
Private Function SqlBasePath()
  Dim basePath : basePath = Application("SqlBasePath")
  If Len(basePath) = 0 Then
    Err.Raise vbObjectError + 6000, "SqlLoader", "Application('SqlBasePath') is not set."
  End If
  SqlBasePath = basePath
End Function

' Combine base path + file, no traversal, .sql only
Private Function CombineSqlPath(fileName)
  ' Normalize: strip leading slashes
  Do While Left(fileName,1)="/" Or Left(fileName,1)="\"
    fileName = Mid(fileName,2)
  Loop

  ' Disallow traversal
  If InStr(fileName, "..") > 0 Then
    Err.Raise vbObjectError + 6001, "SqlLoader", "Path traversal not allowed."
  End If

  ' Force .sql extension
  If LCase(Right(fileName,4)) <> ".sql" Then
    Err.Raise vbObjectError + 6002, "SqlLoader", "Only .sql files are allowed."
  End If

  CombineSqlPath = SqlBasePath() & "\" & Replace(fileName, "/", "\")
End Function

' Raw file read (internal)
Private Function ReadAllText(absPath)
  Dim fso, ts
  Set fso = Server.CreateObject("Scripting.FileSystemObject")
  If Not fso.FileExists(absPath) Then
    Err.Raise vbObjectError + 6003, "SqlLoader", "SQL file not found: " & absPath
  End If
  Set ts = fso.OpenTextFile(absPath, 1, False) ' ForReading
  ReadAllText = ts.ReadAll()
  ts.Close
  Set ts = Nothing
  Set fso = Nothing
End Function

' Public: load a specific .sql file by relative path (for code-side control)
Public Function LoadSql(relativeFile)
  LoadSql = ReadAllText(CombineSqlPath(relativeFile))
End Function

' Public: cached variant
Public Function LoadSqlCached(cacheKey, relativeFile)
  Dim fullKey : fullKey = "sql_cache." & cacheKey
  Dim txt
  txt = Application(fullKey)

  If IsEmpty(txt) Or Len(txt)=0 Then
    Application.Lock
    txt = Application(fullKey) ' double-check
    If IsEmpty(txt) Or Len(txt)=0 Then
      txt = ReadAllText(CombineSqlPath(relativeFile))
      Application(fullKey) = txt
    End If
    Application.UnLock
  End If

  LoadSqlCached = txt
End Function

' ----------------- WHITELISTED LOADER -----------------
' Define the only query keys you’ll allow the app to request.
' Left side is the key used in code, right side is the file on disk.
Private Function QueryMap()
  ' You can expand this list as needed
  ' key -> file
  Dim m : Set m = Server.CreateObject("Scripting.Dictionary")
  m.CompareMode = 1 ' TextCompare
  m.Add "orders_report",      "reports\orders_report.sql"
  m.Add "customer_summary",   "reports\customer_summary.sql"
  m.Add "invoice_detail",     "invoices\invoice_detail.sql"
  Set QueryMap = m
End Function

' Load by whitelist key (no file paths in calling code)
Public Function LoadSqlByKey(key)
  Dim map : Set map = QueryMap()
  If Not map.Exists(key) Then
    Err.Raise vbObjectError + 6004, "SqlLoader", "Unknown SQL key: " & key
  End If
  LoadSqlByKey = LoadSql(map(key))
End Function

Public Function LoadSqlByKeyCached(key)
  Dim map : Set map = QueryMap()
  If Not map.Exists(key) Then
    Err.Raise vbObjectError + 6005, "SqlLoader", "Unknown SQL key: " & key
  End If
  LoadSqlByKeyCached = LoadSqlCached(key, map(key))
End Function

' ----------------- RESULT HELPERS -----------------
' Convenience helpers to reduce boilerplate when working with
' the array-of-dictionary results returned by DbQuery / ArrayToObjects.
'
' Usage examples:
'   Dim rows : rows = DbQuery(sql, params)
'   Dim r : Set r = FirstRow(rows)          ' returns the first Dictionary or Nothing
'   If Not r Is Nothing Then x = r("col")  ' Dictionary access works as before
'
'   x = RowValue(r, "col", "default")     ' safe access with default
'
'   Dim vals : vals = ColumnValues(rows, "id") ' returns an array of values for the column

Public Function FirstRow(rows)
  ' Return the first row object from an array of dictionaries, or Nothing
  If Not IsArray(rows) Then
    Set FirstRow = Nothing
    Exit Function
  End If

  On Error Resume Next
  Dim ub : ub = UBound(rows)
  If Err.Number <> 0 Then
    Err.Clear
    Set FirstRow = Nothing
    Exit Function
  End If

  If ub < 0 Then
    Set FirstRow = Nothing
  Else
    Set FirstRow = rows(0)
  End If
End Function

Public Function GetRowValue(rowObj, colName, Optional defVal)
  ' Safely return rowObj(colName). If the column or row is missing, return defVal
  ' If defVal is omitted the function returns Null when missing.
  If IsObject(rowObj) Then
    On Error Resume Next
    Dim v
    v = rowObj(colName)
    If Err.Number <> 0 Then
      Err.Clear
      If IsEmpty(defVal) Then
        GetRowValue = Null
      Else
        GetRowValue = defVal
      End If
    Else
      GetRowValue = v
    End If
  Else
    If IsEmpty(defVal) Then
      GetRowValue = Null
    Else
      GetRowValue = defVal
    End If
  End If
End Function

' Backwards-compatible wrapper
Public Function RowValue(rowObj, colName, Optional defVal)
  RowValue = GetRowValue(rowObj, colName, defVal)
End Function

Public Function ColumnValues(rows, colName)
  ' Return a simple zero-based array of the values for colName from each row.
  ' Missing rows or missing columns produce Null entries.
  If Not IsArray(rows) Then
    ColumnValues = Array()
    Exit Function
  End If

  On Error Resume Next
  Dim ub : ub = UBound(rows)
  If Err.Number <> 0 Then
    Err.Clear
    ColumnValues = Array()
    Exit Function
  End If

  Dim i, vals
  ReDim vals(ub)
  For i = 0 To ub
    On Error Resume Next
    Dim v
    v = rows(i)(colName)
    If Err.Number <> 0 Then
      Err.Clear
      v = Null
    End If
    vals(i) = v
  Next

  ColumnValues = vals
End Function

' Return an array of column names (keys) discovered from the first row Dictionary.
' If rows is empty or not an array, returns an empty array.
Public Function GetColumnNames(rows)
  If Not IsArray(rows) Then
    GetColumnNames = Array()
    Exit Function
  End If

  On Error Resume Next
  Dim ub : ub = UBound(rows)
  If Err.Number <> 0 Then
    Err.Clear
    GetColumnNames = Array()
    Exit Function
  End If

  If ub < 0 Then
    GetColumnNames = Array()
    Exit Function
  End If

  Dim firstRow : Set firstRow = rows(0)
  If Not IsObject(firstRow) Then
    GetColumnNames = Array()
    Exit Function
  End If

  ' Dictionary.Keys is not directly enumerable in VBScript in all hosts,
  ' so build the list by iterating Fields from the Dictionary object when available.
  On Error Resume Next
  Dim keys, k
  keys = firstRow.Keys
  If Err.Number = 0 Then
    ' keys is a variant array
    GetColumnNames = keys
    Exit Function
  End If
  Err.Clear

  ' Fallback: attempt to enumerate using For Each on the Dictionary
  Dim arr(), idx
  idx = -1
  ReDim arr(0)
  On Error Resume Next
  For Each k In firstRow
    idx = idx + 1
    ReDim Preserve arr(idx)
    arr(idx) = k
  Next
  If idx = -1 Then
    GetColumnNames = Array()
  Else
    GetColumnNames = arr
  End If
End Function

' RenderTableHtml(rows, Optional cols)
' Returns an HTML string containing a table built from rows. If cols is provided
' (array of column names), those columns and their order are used; otherwise
' column names are discovered from the first row via GetColumnNames.
' Values are HTML-encoded.
Public Function RenderTableHtml(rows, Optional cols)
  Dim out
  out = ""

  If Not IsArray(rows) Then
    RenderTableHtml = ""
    Exit Function
  End If

  On Error Resume Next
  Dim ub : ub = UBound(rows)
  If Err.Number <> 0 Or ub < 0 Then
    RenderTableHtml = ""
    Exit Function
  End If

  Dim columns
  If IsMissing(cols) Then
    columns = GetColumnNames(rows)
  Else
    columns = cols
  End If

  If Not IsArray(columns) Or UBound(columns) < 0 Then
    RenderTableHtml = ""
    Exit Function
  End If

  out = out & "<table border=1 cellpadding=6 cellspacing=0>"
  out = out & "<thead><tr>"
  Dim c
  For Each c In columns
    out = out & "<th>" & Server.HTMLEncode( CStr(c) ) & "</th>"
  Next
  out = out & "</tr></thead>"
  out = out & "<tbody>"

  Dim rIndex, rowObj
  For rIndex = 0 To ub
    Set rowObj = rows(rIndex)
    out = out & "<tr>"
    For Each c In columns
      On Error Resume Next
      Dim v
      v = rowObj(c)
      If Err.Number <> 0 Then
        Err.Clear
        v = ""
      End If
      out = out & "<td>" & Server.HTMLEncode( CStr( v ) ) & "</td>"
    Next
    out = out & "</tr>"
    Set rowObj = Nothing
  Next

  out = out & "</tbody></table>"
  RenderTableHtml = out
End Function
' -----------------------------------------------------------------------
%>
