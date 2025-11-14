<%@ Language="VBScript" %>
<!--#include file="incs/db.asp" -->
<%
' templateCreate.asp - user selects template, enters data, saves, and gets link to launch template
Const adVarChar = 200
Const adInteger = 3
Const adDate = 7

Dim action : action = LCase(Trim(Request("action")))
Dim message : message = ""
Dim newId : newId = 0
Dim selTemplateID : selTemplateID = 0

If Request.ServerVariables("REQUEST_METHOD") = "POST" And action = "create" Then
  selTemplateID = CLng(0 & Request.Form("TemplateID"))
  Dim startDate, title, userName, createdBy
  startDate = Trim(Request.Form("StartDate")) ' Expect dd/mm/yyyy or yyyy-mm-dd
  title = Trim(Request.Form("Title"))
  userName = Trim(Request.Form("UserName"))
  createdBy = userName

  If selTemplateID = 0 Then
    message = "Please select a template."
  ElseIf Len(title) = 0 Or Len(userName) = 0 Then
    message = "Title and User Name are required."
  Else
    Dim sql, params, rows
    sql = "INSERT INTO TemplateData (TemplateID, StartDate, Title, UserName, CreatedBy) VALUES (?,?,?,?,?); SELECT SCOPE_IDENTITY() AS NewID" 

    ' Try to parse StartDate - if invalid, store NULL
    Dim parsedDate, dateParamVal
    On Error Resume Next
    parsedDate = CDate(startDate)
    If Err.Number <> 0 Then
      dateParamVal = Null
      Err.Clear
    Else
      dateParamVal = parsedDate
    End If
    On Error GoTo 0

    params = Array( _
      Array("@TemplateID", selTemplateID, adInteger, 0), _
      Array("@StartDate", dateParamVal, adDate, 0), _
      Array("@Title", title, adVarChar, 200), _
      Array("@UserName", userName, adVarChar, 200), _
      Array("@CreatedBy", createdBy, adVarChar, 100) _
    )
    rows = DbQuery(sql, params)
    If IsArray(rows) And UBound(rows) >= 0 Then
      newId = CLng(rows(0)("NewID"))
      message = "Saved template data record ID " & newId
    Else
      message = "Record saved (identity not returned)."
    End If
  End If
End If

' Fetch templates for dropdown
Dim templatesSql, templates
templatesSql = "SELECT TemplateID, TemplateName FROM Templates WHERE IsActive = 1 ORDER BY TemplateName"
templates = DbQuery(templatesSql, Array())

' If we have a new record, fetch its template path for launch link
Dim launchPath : launchPath = ""
If newId > 0 Then
  Dim pathRows, pathSql
  pathSql = "SELECT t.TemplatePath FROM Templates t INNER JOIN TemplateData d ON t.TemplateID = d.TemplateID WHERE d.TemplateDataID = ?"
  pathRows = DbQuery(pathSql, Array(Array("@TemplateDataID", newId, adInteger, 0)))
  If IsArray(pathRows) And UBound(pathRows) >= 0 Then
    launchPath = pathRows(0)("TemplatePath")
  End If
End If
%>
<!DOCTYPE html>
<html>
<head>
  <title>Create Template Data</title>
  <meta charset="utf-8" />
  <style>
    body { font:14px/1.4 Arial, sans-serif; margin:20px; }
    form { max-width:560px; border:1px solid #ddd; padding:16px; }
    label { display:block; margin-top:10px; font-weight:600; }
    input[type=text], select { width:100%; padding:6px; box-sizing:border-box; }
    .msg { padding:8px; background:#eef; border:1px solid #99c; margin-bottom:12px; }
    .launch { margin-top:18px; padding:12px; background:#f9f9f9; border:1px solid #ddd; }
    .hint { font-size:12px; color:#666; }
    .path { font-family:Consolas, monospace; }
  </style>
</head>
<body>
  <h1>Create Template Data</h1>
  <p>Enter data that will populate merge fields in the selected Word template.</p>
  <% If Len(message) > 0 Then %>
    <div class="msg"><%= Server.HTMLEncode(message) %></div>
  <% End If %>

  <form method="post" action="templateCreate.asp">
    <input type="hidden" name="action" value="create" />
    <label for="TemplateID">Template</label>
    <select id="TemplateID" name="TemplateID" required>
      <option value="">-- Select --</option>
      <% If IsArray(templates) And UBound(templates) >= 0 Then
           Dim i, row
           For i = 0 To UBound(templates)
             Set row = templates(i) %>
             <option value="<%= row("TemplateID") %>" <%= IIf(selTemplateID = row("TemplateID"), "selected", "") %>><%= Server.HTMLEncode(row("TemplateName")) %></option>
           <% Next
         End If %>
    </select>

    <label for="StartDate">Start Date (optional)</label>
    <input type="text" id="StartDate" name="StartDate" placeholder="dd/mm/yyyy" />

    <label for="Title">Title</label>
    <input type="text" id="Title" name="Title" maxlength="200" required />

    <label for="UserName">User Name</label>
    <input type="text" id="UserName" name="UserName" maxlength="200" required />

    <div style="margin-top:16px;">
      <button type="submit">Save Data</button>
    </div>
  </form>

  <% If newId > 0 And Len(launchPath) > 0 Then %>
    <div class="launch">
      <h2>Launch Template</h2>
      <p>Open the Word template to perform the merge. Ensure it is configured to filter on this record ID: <strong><%= newId %></strong>.</p>
      <p class="hint">If the template uses a static mail merge connection, open it and refresh; apply a filter TemplateDataID = <%= newId %> via Mailings &gt; Edit Recipient List &gt; Filter.</p>
      <p>Template path:</p>
      <p class="path"><%= Server.HTMLEncode(launchPath) %></p>
      <p>
        <a href="streamTemplate.asp?templateDataID=<%= newId %>" target="_blank">Download / Open Template (.dotx)</a>
        &nbsp;|&nbsp;
        <a href="templateDataSource.asp?templateDataID=<%= newId %>&format=csv" target="_blank">Download CSV data</a>
        &nbsp;|&nbsp;
        <a href="templateDataSource.asp?templateDataID=<%= newId %>&format=tsv" target="_blank">Download TSV data</a>
      </p>
    </div>
  <% End If %>

  <p class="hint" style="margin-top:30px;">Future enhancement: automate mail merge server-side (OpenXML) to deliver a merged document directly.</p>
</body>
</html>
