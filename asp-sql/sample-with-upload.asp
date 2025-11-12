<!--#include file="/incs/db.asp" -->
<!--#include file="/incs/query_map.asp" -->
<!--#include file="/incs/sql_loader.asp" -->
<!--#include file="/incs/uploadLibrary.asp" -->
<%
' Safer: call by key (enforced whitelist) + cached
Dim sql : sql = LoadSqlByKeyCached("orders_report")

Set uploader = new FileUploader
Dim from = uploader("from").value 
' Parameters example
Dim p : p = Array( _
  Array("@From", from, 3, 0), _  
)

Dim rows : rows = DbQuery(sql, p)
' ... render rows ...
%>
