<%
' asp-sql/admin/cache.asp
' Simple admin UI to manage Application-level SQL cache
' IMPORTANT: protect this page (Windows auth, IP restrict, or password)
Option Explicit

' --- Basic access guard: adjust to your environment ---
Dim allowed
allowed = False
' Example: allow only local requests (useful for dev)
If Request.ServerVariables("REMOTE_ADDR") = "127.0.0.1" Or Request.ServerVariables("REMOTE_ADDR") = "::1" Then
  allowed = True
End If
' Example: allow authenticated windows user (uncomment if using Windows auth)
' If Request.ServerVariables("AUTH_USER") <> "" Then allowed = True

If Not allowed Then
  Response.Status = "403 Forbidden"
  Response.Write "Forbidden"
  Response.End
End If

' --- Handle actions ---
Dim action, key, msg
action = Request.Form("action")
msg = ""

If action <> "" Then
  If action = "clear_key" Then
    key = Trim(Request.Form("key"))
    If key <> "" Then
      ' normalize short key -> sql_cache.<key>
      If LCase(Left(key,9)) <> "sql_cache." Then key = "sql_cache." & key

      Application.Lock
      On Error Resume Next
      Application.Remove key
      If Err.Number <> 0 Then
        msg = "Error removing " & Server.HTMLEncode(key) & ": " & Err.Description
        Err.Clear
      Else
        msg = "Removed: " & Server.HTMLEncode(key)
      End If
      On Error GoTo 0
      Application.UnLock
    Else
      msg = "No key supplied"
    End If

  ElseIf action = "clear_all" Then
    ' Remove all Application keys that begin with sql_cache.
    Dim removedCount, k
    removedCount = 0
    Application.Lock
    On Error Resume Next
    For Each k In Application.Contents
      If LCase(Left(k,9)) = "sql_cache." Then
        Application.Remove k
        removedCount = removedCount + 1
      End If
    Next
    On Error GoTo 0
    Application.UnLock
    msg = "Removed " & removedCount & " cache entries."

  ElseIf action = "rewarm" Then
    key = Trim(Request.Form("key"))
    If key <> "" Then
      ' Accept either short key or full "sql_cache.x" - convert to logical loader key
      If LCase(Left(key,9)) = "sql_cache." Then
        key = Mid(key, 10)
      End If
      ' Call your existing loader that will populate Application("sql_cache." & key)
      On Error Resume Next
      LoadSqlCached key
      If Err.Number <> 0 Then
        msg = "Error rewarming " & Server.HTMLEncode(key) & ": " & Err.Description
        Err.Clear
      Else
        msg = "Rewarmed: " & Server.HTMLEncode(key)
      End If
      On Error GoTo 0
    Else
      msg = "No key supplied to re-warm"
    End If
  End If
End If
%>

<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8">
<title>Admin — SQL Cache</title>
<style>
  body { font-family: Arial, Helvetica, sans-serif; padding: 20px; }
  form { margin-bottom: 1rem; }
  input[type=text] { width: 360px; }
  .msg { margin: .5rem 0; color: #064; }
  .warn { color: #a00; }
</style>
</head>
<body>
<h1>Admin — SQL Cache</h1>

<% If msg <> "" Then %>
  <div class="msg"><%= Server.HTMLEncode(msg) %></div>
<% End If %>

<form method="post">
  <label>Cache key (either "orders_report" or "sql_cache.orders_report")</label><br>
  <input type="text" name="key" placeholder="orders_report" />
  <button type="submit" name="action" value="clear_key">Clear key</button>
  <button type="submit" name="action" value="rewarm">Re-warm key</button>
</form>

<form method="post" onsubmit="return confirm('Remove all sql_cache.* entries?')">
  <button type="submit" name="action" value="clear_all">Clear all sql_cache.*</button>
</form>

<p class="warn">Warning: Only use this on a maintenance window — clearing caches may cause extra DB load.</p>

<p>
  Tip: Use the exact logical key (the one you pass to LoadSqlCached) — the admin page will add/remove the Application entry `sql_cache.&lt;key&gt;`.
</p>
</body>
</html>
