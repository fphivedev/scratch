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
' -----------------------------------------------------------------------
%>
