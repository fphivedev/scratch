<!--#include file="/incs/db.asp" -->
<!--#include file="/incs/sql_loader.asp" -->
<%
' Safer: call by key (enforced whitelist) + cached
Dim sql : sql = LoadSqlByKeyCached("orders_report")

' Parameters example
Dim p : p = Array( _
  Array("@From", Request("from"), 135, 0), _  ' adDBTimeStamp
  Array("@To",   Request("to"),   135, 0), _
  Array("@Cust", IIf(Request("customer")="", Null, Request("customer")), 202, 50) _
)

Dim rows : rows = DbQuery(sql, p)
' ... render rows ...
%>

<!--
 Example usages for the sql_loader helpers added in /incs/sql_loader.asp
 (FirstRow, RowValue, ColumnValues)
-->

<%
' Get the first row when you expect a single record
Dim firstRow : Set firstRow = FirstRow(rows)
If Not firstRow Is Nothing Then
  Dim orderId : orderId = RowValue(firstRow, "OrderID", "")
  Response.Write "OrderID: " & Server.HTMLEncode(orderId) & "<br/>"
End If

' Get a simple array of values from a column (multi-row)
Dim ids : ids = ColumnValues(rows, "OrderID")
If IsArray(ids) Then
  Dim i
  For i = 0 To UBound(ids)
    Response.Write "Row " & i & " OrderID=" & Server.HTMLEncode( CStr( ids(i) ) ) & "<br/>"
  Next
End If
%>

<!--
 Multi-row / multi-column HTML table example
 This shows a minimal, safe way to output the resultset as a table.
 Replace the column names with the actual columns returned by your query.
-->

<%
If IsArray(rows) And UBound(rows) >= 0 Then
  Response.Write "<table border=1 cellpadding=6 cellspacing=0>"
  Response.Write "<thead><tr>"
  Response.Write "<th>OrderID</th><th>Customer</th><th>OrderDate</th><th>Total</th>"
  Response.Write "</tr></thead>"
  Response.Write "<tbody>"

  Dim rIndex
  For rIndex = 0 To UBound(rows)
    Dim rowObj : Set rowObj = rows(rIndex)
    Response.Write "<tr>"
    ' Direct dictionary access works (rowObj("ColumnName"))
  Response.Write "<td>" & Server.HTMLEncode( CStr( GetRowValue(rowObj, "OrderID", "") ) ) & "</td>"
  Response.Write "<td>" & Server.HTMLEncode( CStr( GetRowValue(rowObj, "CustomerName", "") ) ) & "</td>"
  Response.Write "<td>" & Server.HTMLEncode( CStr( GetRowValue(rowObj, "OrderDate", "") ) ) & "</td>"
  Response.Write "<td style=\"text-align:right\">" & Server.HTMLEncode( CStr( GetRowValue(rowObj, "TotalAmount", "0.00") ) ) & "</td>"
    Response.Write "</tr>"
    Set rowObj = Nothing
  Next

  Response.Write "</tbody></table>"
Else
  Response.Write "<p>No rows returned.</p>"
End If
%>

<!-- Examples using the generic renderer added in sql_loader.asp -->
<%
' 1) Auto-discovered headers
Response.Write "<h3>Auto headers</h3>"
Response.Write RenderTableHtml(rows)

' 2) Explicit columns & ordering
Dim cols : cols = Array("OrderID", "CustomerName", "OrderDate", "TotalAmount")
Response.Write "<h3>Explicit columns</h3>"
Response.Write RenderTableHtml(rows, cols)
%>
