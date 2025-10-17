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
