<%@ Language="VBScript" %>
<!--#include file="incs/db.asp" -->
<%
' templatesAdmin.asp - manage template definitions
Const adVarChar = 200
Const adInteger = 3
Const adBoolean = 11 ' optional

Dim action : action = LCase(Trim(Request("action")))
Dim message : message = ""

If Request.ServerVariables("REQUEST_METHOD") = "POST" And action = "add" Then
  Dim tName, tPath, createdBy
  tName = Trim(Request.Form("TemplateName"))
  tPath = Trim(Request.Form("TemplatePath"))
  createdBy = Trim(Request.Form("CreatedBy"))

  If Len(tName) = 0 Or Len(tPath) = 0 Then
    message = "Template name and path are required"
  Else
    ' Insert and fetch identity
    Dim sql, params, rows
    sql = "INSERT INTO Templates (TemplateName, TemplatePath, CreatedBy) VALUES (?, ?, ?); SELECT SCOPE_IDENTITY() AS NewID" 
    params = Array( _
      Array("@TemplateName", tName, adVarChar, 200), _
      Array("@TemplatePath", tPath, adVarChar, 500), _
      Array("@CreatedBy", createdBy, adVarChar, 100) _
    )
    rows = DbQuery(sql, params)
    If IsArray(rows) And UBound(rows) >= 0 Then
      message = "Added template ID " & rows(0)("NewID")
    Else
      message = "Template added (identity not returned)."
    End If
  End If
End If

' Toggle active status
If action = "toggle" Then
  Dim toggleId, toggleVal
  toggleId = CLng(0 & Request("id"))
  toggleVal = CLng(0 & Request("val"))
  If toggleId > 0 Then
    Dim upSql, upParams, affected
    upSql = "UPDATE Templates SET IsActive = ? WHERE TemplateID = ?"
    upParams = Array( _
        Array("@IsActive", toggleVal, adInteger, 0), _
        Array("@TemplateID", toggleId, adInteger, 0) _
    )
    affected = DbExecute(upSql, upParams)
    If affected = 1 Then
      message = "Template ID " & toggleId & IIf(toggleVal=1, " activated", " deactivated")
    Else
      message = "No change applied (ID may be invalid)."
    End If
  Else
    message = "Invalid template ID for toggle."
  End If
End If

' Fetch templates list
Dim listSql, templates
listSql = "SELECT TemplateID, TemplateName, TemplatePath, IsActive, CreatedAt, CreatedBy FROM Templates ORDER BY TemplateName"
templates = DbQuery(listSql, Array())
%>
<!DOCTYPE html>
<html>
<head>
  <title>Templates Admin</title>
  <meta charset="utf-8" />
  <style>
    body { font:14px/1.4 Arial, sans-serif; margin:20px; }
    table { border-collapse: collapse; width:100%; margin-top:1rem; }
    th, td { border:1px solid #ccc; padding:6px 8px; text-align:left; }
    th { background:#f5f5f5; }
    .msg { padding:8px; background:#eef; border:1px solid #99c; margin-bottom:12px; }
    form.add { border:1px solid #ddd; padding:12px; max-width:520px; }
    label { display:block; margin-top:8px; font-weight:600; }
    input[type=text] { width:100%; box-sizing:border-box; padding:6px; }
    .path { font-family: Consolas, monospace; }
  </style>
</head>
<body>
  <h1>Template Administration</h1>
  <p>Manage Word mail merge templates stored on a network path.</p>
  <% If Len(message) > 0 Then %>
    <div class="msg"><%= Server.HTMLEncode(message) %></div>
  <% End If %>

  <form class="add" method="post" action="templatesAdmin.asp">
    <input type="hidden" name="action" value="add" />
    <h2>Add Template</h2>
    <label for="TemplateName">Template Name</label>
    <input type="text" id="TemplateName" name="TemplateName" maxlength="200" required />
    <label for="TemplatePath">Template Network Path (.dotx)</label>
    <input type="text" id="TemplatePath" name="TemplatePath" maxlength="500" class="path" placeholder="\\\server\share\MyTemplate.dotx" required />
    <label for="CreatedBy">Created By (optional)</label>
    <input type="text" id="CreatedBy" name="CreatedBy" maxlength="100" />
    <div style="margin-top:12px;">
      <button type="submit">Add Template</button>
    </div>
  </form>

  <h2>Existing Templates</h2>
  <table>
    <thead>
      <tr>
        <th>ID</th>
        <th>Name</th>
        <th>Path</th>
        <th>Active</th>
        <th>Created</th>
        <th>By</th>
      </tr>
    </thead>
    <tbody>
      <% If IsArray(templates) And UBound(templates) >= 0 Then
           Dim i, row
           For i = 0 To UBound(templates)
             Set row = templates(i) %>
             <tr>
               <td><%= row("TemplateID") %></td>
               <td><%= Server.HTMLEncode(row("TemplateName")) %></td>
               <td class="path"><%= Server.HTMLEncode(row("TemplatePath")) %></td>
               <td>
                 <%= IIf(row("IsActive") = 1, "Yes", "No") %>
                 (<a href="templatesAdmin.asp?action=toggle&id=<%= row("TemplateID") %>&val=<%= IIf(row("IsActive") = 1, "0", "1") %>"><%= IIf(row("IsActive") = 1, "Deactivate", "Activate") %></a>)
               </td>
               <td><%= row("CreatedAt") %></td>
               <td><%= Server.HTMLEncode(row("CreatedBy")) %></td>
             </tr>
           <% Next
         Else %>
         <tr><td colspan="6">No templates found.</td></tr>
      <% End If %>
    </tbody>
  </table>

  <p style="margin-top:2rem; font-size:12px; color:#666;">Security note: ensure the network share is read-only for normal users to protect template integrity.</p>
</body>
</html>
