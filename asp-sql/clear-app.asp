<!-- admin_sql_cache.asp -->
<%
' --- basic guard (replace with your auth) ---
If Session("IsAdmin") <> True Then
  Response.Status = "403 Forbidden"
  Response.End
End If

Dim action : action = LCase(Request("action"))

If action = "clear" Then
  Application.Lock
  Dim key
  For Each key In Application.Contents
    If Left(CStr(key), 10) = "sql_cache." Or Left(CStr(key), 15) = "sql_cache.frag." Then
      Application.Contents.Remove key
    End If
  Next
  Application.UnLock
  Response.Write "<p>SQL cache cleared.</p>"
End If
%>
<form method="post">
  <input type="hidden" name="action" value="clear" />
  <button type="submit">Clear cached SQL</button>
</form>
