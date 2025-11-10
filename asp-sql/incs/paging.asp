<%
' asp-sql/incs/paging.asp
' Paging helpers that integrate with LoadSqlByKey + DbQuery (array-of-dictionaries)
' Provides:
'  - MapOrderBy(sortKey)         -> returns safe ORDER BY clause for a symbolic sort key
'  - PagedQueryByKeySafe(...)     -> main paging function using MapOrderBy
'  - PagedQueryByKey(...)         -> direct orderBy variant (use carefully)
'  - PagedQueryByKey_RowNumber(...) -> fallback for older SQL Server using ROW_NUMBER()
'  - RenderPager(currentPage, totalPages, baseUrl) -> small pager renderer
'
Option Explicit

'------------------ Safe orderBy mapping ------------------
' Maintain a server-side whitelist of allowed sort keys to prevent SQL injection.
' Add entries here mapping a short symbolic key to a full ORDER BY clause.
Public Function MapOrderBy(sortKey)
  Dim sk
  sk = LCase(Trim(CStr(sortKey)))
  Select Case sk
    Case "date_desc"
      MapOrderBy = "OrderDate DESC, ID DESC"
    Case "date_asc"
      MapOrderBy = "OrderDate ASC, ID ASC"
    Case "id_desc"
      MapOrderBy = "ID DESC"
    Case "id_asc"
      MapOrderBy = "ID ASC"
    Case "name_asc"
      MapOrderBy = "CustomerName ASC, ID ASC"
    Case "name_desc"
      MapOrderBy = "CustomerName DESC, ID DESC"
    Case Else
      ' Unknown sort key
      MapOrderBy = ""
  End Select
End Function

'------------------ Primary paging function (OFFSET/FETCH) ------------------
' Requires SQL Server 2012+ (OFFSET/FETCH and COUNT() OVER()).
' key      - logical key for LoadSqlByKey(key) (SQL must be SELECT ... FROM ... [WHERE ...], no ORDER BY)
' sortKey  - symbolic sort key used with MapOrderBy (safe mapping)
' pageNum  - 1-based page number
' pageSize - number of rows per page
' params   - passed to DbQuery (your existing params container) or Empty
' totalRows (ByRef) - returns total number of matching rows
' Returns: array-of-dictionaries (rows) or empty array
Public Function PagedQueryByKeySafe(key, sortKey, pageNum, pageSize, params, ByRef totalRows)
  On Error Resume Next
  totalRows = 0
  PagedQueryByKeySafe = Array()

  If Len(Trim(CStr(key))) = 0 Then
    Err.Raise vbObjectError + 7100, "PagedQueryByKeySafe", "Missing key"
  End If

  Dim orderBy
  orderBy = MapOrderBy(sortKey)
  If Len(Trim(orderBy)) = 0 Then
    Err.Raise vbObjectError + 7101, "PagedQueryByKeySafe", "Invalid sort key"
  End If

  If pageNum < 1 Then pageNum = 1
  If pageSize < 1 Then pageSize = 25
  Dim offset : offset = (pageNum - 1) * pageSize

  Dim baseSql : baseSql = LoadSqlByKey(key)

  Dim pagedSql
  pagedSql = "SELECT t.*, COUNT(1) OVER() AS TotalCount FROM (" & vbCrLf & _
             baseSql & vbCrLf & ") AS t" & vbCrLf & _
             "ORDER BY " & orderBy & vbCrLf & _
             "OFFSET " & CStr(offset) & " ROWS FETCH NEXT " & CStr(pageSize) & " ROWS ONLY;"

  Dim rows
  rows = DbQuery(pagedSql, params)

  If IsArray(rows) Then
    On Error Resume Next
    Dim ub : ub = UBound(rows)
    If Err.Number = 0 And ub >= 0 Then
      Dim firstRow : Set firstRow = rows(0)
      On Error Resume Next
      Dim tc
      tc = firstRow("TotalCount")
      If Err.Number = 0 Then
        totalRows = CLng(tc)
      Else
        totalRows = 0
        Err.Clear
      End If
      Set firstRow = Nothing
    Else
      totalRows = 0
    End If
    Err.Clear
  Else
    totalRows = 0
  End If

  PagedQueryByKeySafe = rows
End Function

'------------------ Direct orderBy variant (use carefully) ------------------
' Same as above but accepts a raw orderBy clause. Prefer PagedQueryByKeySafe with MapOrderBy.
Public Function PagedQueryByKey(key, orderBy, pageNum, pageSize, params, ByRef totalRows)
  On Error Resume Next
  totalRows = 0
  PagedQueryByKey = Array()

  If Len(Trim(CStr(key))) = 0 Then
    Err.Raise vbObjectError + 7120, "PagedQueryByKey", "Missing key"
  End If
  If Len(Trim(CStr(orderBy))) = 0 Then
    Err.Raise vbObjectError + 7121, "PagedQueryByKey", "orderBy required"
  End If

  If pageNum < 1 Then pageNum = 1
  If pageSize < 1 Then pageSize = 25
  Dim offset : offset = (pageNum - 1) * pageSize

  Dim baseSql : baseSql = LoadSqlByKey(key)

  Dim pagedSql
  pagedSql = "SELECT t.*, COUNT(1) OVER() AS TotalCount FROM (" & vbCrLf & _
             baseSql & vbCrLf & ") AS t" & vbCrLf & _
             "ORDER BY " & orderBy & vbCrLf & _
             "OFFSET " & CStr(offset) & " ROWS FETCH NEXT " & CStr(pageSize) & " ROWS ONLY;"

  Dim rows
  rows = DbQuery(pagedSql, params)

  If IsArray(rows) Then
    On Error Resume Next
    Dim ub : ub = UBound(rows)
    If Err.Number = 0 And ub >= 0 Then
      Dim firstRow : Set firstRow = rows(0)
      On Error Resume Next
      Dim tc
      tc = firstRow("TotalCount")
      If Err.Number = 0 Then
        totalRows = CLng(tc)
      Else
        totalRows = 0
        Err.Clear
      End If
      Set firstRow = Nothing
    Else
      totalRows = 0
    End If
    Err.Clear
  Else
    totalRows = 0
  End If

  PagedQueryByKey = rows
End Function

'------------------ Fallback: ROW_NUMBER approach ------------------
Public Function PagedQueryByKey_RowNumber(key, sortKey, pageNum, pageSize, params, ByRef totalRows)
  On Error Resume Next
  totalRows = 0
  PagedQueryByKey_RowNumber = Array()

  If Len(Trim(CStr(key))) = 0 Then Err.Raise vbObjectError + 7130, "PagedQueryByKey_RowNumber", "Missing key"
  Dim orderBy
  orderBy = MapOrderBy(sortKey)
  If Len(Trim(orderBy)) = 0 Then Err.Raise vbObjectError + 7131, "PagedQueryByKey_RowNumber", "Invalid sort key"

  If pageNum < 1 Then pageNum = 1
  If pageSize < 1 Then pageSize = 25

  Dim startRow, endRow
  startRow = (pageNum - 1) * pageSize + 1
  endRow   = pageNum * pageSize

  Dim baseSql : baseSql = LoadSqlByKey(key)

  Dim sqlPaged
  sqlPaged = "WITH OrderedRows AS (" & vbCrLf & _
             "  SELECT ROW_NUMBER() OVER (ORDER BY " & orderBy & ") AS rn, * FROM (" & vbCrLf & _
             baseSql & vbCrLf & ") AS src" & vbCrLf & _
             ")" & vbCrLf & _
             "SELECT * FROM OrderedRows WHERE rn BETWEEN " & CStr(startRow) & " AND " & CStr(endRow) & ";"

  Dim rows
  rows = DbQuery(sqlPaged, params)

  ' Total count via separate COUNT() (robust fallback)
  Dim cntSql
  cntSql = "SELECT COUNT(1) AS TotalCount FROM (" & vbCrLf & baseSql & vbCrLf & ") AS csrc;"
  Dim cntRows
  cntRows = DbQuery(cntSql, params)
  If IsArray(cntRows) And UBound(cntRows) >= 0 Then
    On Error Resume Next
    totalRows = CLng( GetRowValue( cntRows(0), "TotalCount", 0 ) )
    Err.Clear
  Else
    totalRows = 0
  End If

  PagedQueryByKey_RowNumber = rows
End Function

'------------------ Small pager renderer ------------------
Public Function RenderPager(currentPage, totalPages, baseUrl)
  Dim out, i
  out = ""
  If totalPages <= 1 Then
    RenderPager = out
    Exit Function
  End If
  out = out & "<nav class='pager'>"
  If currentPage > 1 Then out = out & "<a href='" & Server.HTMLEncode(baseUrl) & "?page=" & (currentPage-1) & "'>&laquo; Prev</a> "
  For i = 1 To totalPages
    If i = currentPage Then
      out = out & "<strong>" & i & "</strong> "
    Else
      out = out & "<a href='" & Server.HTMLEncode(baseUrl) & "?page=" & i & "'>" & i & "</a> "
    End If
  Next
  If currentPage < totalPages Then out = out & "<a href='" & Server.HTMLEncode(baseUrl) & "?page=" & (currentPage+1) & "'>Next &raquo;</a>"
  out = out & "</nav>"
  RenderPager = out
End Function
%>