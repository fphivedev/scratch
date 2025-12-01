<!--#include file="/incs/db.asp" -->
<%
' Generic CRUD page for reference tables with pattern: {tableName}ID, description, isActive
' Usage: ref-table-crud.asp?table=notes_type
' Or create named pages like ref_notes_type.asp that include this file with a Const

' Configuration - set table name from query string or hardcoded constant
Dim tableName
If IsDefined("TABLE_NAME") Then
  tableName = TABLE_NAME ' Use constant if defined (for dedicated pages)
Else
  tableName = Trim(Request("table") & "")
  If tableName = "" Then tableName = "notes_type" ' default
End If

' Validate table name (basic whitelist check - only allow alphanumeric and underscore)
If Not IsValidTableName(tableName) Then
  Response.Write "<div class='alert alert-danger'>Invalid table name</div>"
  Response.End
End If

' Build column names based on convention
Dim idColumn : idColumn = tableName & "ID"
Dim tableFull : tableFull = "ref_" & tableName

' Get action
Dim action : action = Trim(Request("action") & "")
Dim itemId : itemId = Trim(Request("id") & "")
Dim description : description = Trim(Request("description") & "")
Dim isActive : isActive = Trim(Request("isActive") & "")

' Handle POST actions
If Request.ServerVariables("REQUEST_METHOD") = "POST" Then
  Select Case action
    Case "create"
      Call CreateItem()
    Case "update"
      Call UpdateItem()
    Case "delete"
      Call DeleteItem()
  End Select
  ' Redirect to clear POST data
  Response.Redirect "?table=" & Server.URLEncode(tableName)
  Response.End
End If

' Load all items
Dim items : items = LoadItems()

Function IsValidTableName(name)
  ' Only allow alphanumeric and underscore
  Dim regex : Set regex = New RegExp
  regex.Pattern = "^[a-zA-Z0-9_]+$"
  IsValidTableName = regex.Test(name)
  Set regex = Nothing
End Function

Function LoadItems()
  Dim sql : sql = "SELECT " & idColumn & ", description, isActive FROM " & tableFull & " ORDER BY description"
  LoadItems = DbQuery(sql, Array())
End Function

Sub CreateItem()
  Dim sql : sql = "INSERT INTO " & tableFull & " (description, isActive) VALUES (@desc, @active)"
  Dim params : params = Array( _
    Array("@desc", description, 200, 500), _
    Array("@active", IIf(isActive = "1", 1, 0), 11, 0) _
  )
  Call DbExecute(sql, params)
End Sub

Sub UpdateItem()
  Dim sql : sql = "UPDATE " & tableFull & " SET description = @desc, isActive = @active WHERE " & idColumn & " = @id"
  Dim params : params = Array( _
    Array("@desc", description, 200, 500), _
    Array("@active", IIf(isActive = "1", 1, 0), 11, 0), _
    Array("@id", CLng(itemId), 3, 0) _
  )
  Call DbExecute(sql, params)
End Sub

Sub DeleteItem()
  Dim sql : sql = "DELETE FROM " & tableFull & " WHERE " & idColumn & " = @id"
  Dim params : params = Array( _
    Array("@id", CLng(itemId), 3, 0) _
  )
  Call DbExecute(sql, params)
End Sub
%>
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Manage <%= Server.HTMLEncode(tableName) %></title>
  <link href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.0/dist/css/bootstrap.min.css" rel="stylesheet">
</head>
<body>
<div class="container mt-4">
  <h1>Manage <%= Server.HTMLEncode(tableName) %></h1>
  
  <!-- Create Form -->
  <div class="card mb-4">
    <div class="card-header">Add New <%= Server.HTMLEncode(tableName) %></div>
    <div class="card-body">
      <form method="post" action="?table=<%= Server.URLEncode(tableName) %>">
        <input type="hidden" name="action" value="create">
        <div class="row g-3">
          <div class="col-md-8">
            <label for="description" class="form-label">Description</label>
            <input type="text" class="form-control" id="description" name="description" required maxlength="500">
          </div>
          <div class="col-md-2">
            <label for="isActive" class="form-label">Active</label>
            <select class="form-select" id="isActive" name="isActive">
              <option value="1" selected>Yes</option>
              <option value="0">No</option>
            </select>
          </div>
          <div class="col-md-2 d-flex align-items-end">
            <button type="submit" class="btn btn-primary w-100">Add</button>
          </div>
        </div>
      </form>
    </div>
  </div>

  <!-- Items Table -->
  <div class="card">
    <div class="card-header">Existing <%= Server.HTMLEncode(tableName) %> Items</div>
    <div class="card-body">
      <% If IsArray(items) And UBound(items) >= 0 Then %>
        <table class="table table-striped">
          <thead>
            <tr>
              <th>ID</th>
              <th>Description</th>
              <th>Active</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            <% 
            Dim i, row
            For i = 0 To UBound(items)
              Set row = items(i)
            %>
            <tr id="row-<%= row(idColumn) %>">
              <td><%= Server.HTMLEncode(CStr(row(idColumn))) %></td>
              <td>
                <span class="view-mode"><%= Server.HTMLEncode(row("description")) %></span>
                <input type="text" class="form-control form-control-sm edit-mode d-none" 
                       value="<%= Server.HTMLEncode(row("description")) %>" 
                       data-field="description" maxlength="500">
              </td>
              <td>
                <span class="view-mode">
                  <% If CBool(row("isActive")) Then %>
                    <span class="badge bg-success">Yes</span>
                  <% Else %>
                    <span class="badge bg-secondary">No</span>
                  <% End If %>
                </span>
                <select class="form-select form-select-sm edit-mode d-none" data-field="isActive">
                  <option value="1" <% If CBool(row("isActive")) Then Response.Write "selected" %>>Yes</option>
                  <option value="0" <% If Not CBool(row("isActive")) Then Response.Write "selected" %>>No</option>
                </select>
              </td>
              <td>
                <div class="btn-group btn-group-sm view-mode" role="group">
                  <button type="button" class="btn btn-outline-primary btn-edit" 
                          data-id="<%= row(idColumn) %>">Edit</button>
                  <form method="post" action="?table=<%= Server.URLEncode(tableName) %>" 
                        style="display:inline" 
                        onsubmit="return confirm('Delete this item?');">
                    <input type="hidden" name="action" value="delete">
                    <input type="hidden" name="id" value="<%= row(idColumn) %>">
                    <button type="submit" class="btn btn-outline-danger">Delete</button>
                  </form>
                </div>
                <div class="btn-group btn-group-sm edit-mode d-none" role="group">
                  <button type="button" class="btn btn-success btn-save" 
                          data-id="<%= row(idColumn) %>">Save</button>
                  <button type="button" class="btn btn-secondary btn-cancel">Cancel</button>
                </div>
              </td>
            </tr>
            <% 
              Set row = Nothing
            Next 
            %>
          </tbody>
        </table>
      <% Else %>
        <p class="text-muted">No items found.</p>
      <% End If %>
    </div>
  </div>
</div>

<script>
// Simple inline edit functionality
document.addEventListener('DOMContentLoaded', () => {
  const table = document.querySelector('table');
  if (!table) return;

  // Edit button click
  table.addEventListener('click', (e) => {
    const editBtn = e.target.closest('.btn-edit');
    if (editBtn) {
      const row = editBtn.closest('tr');
      row.querySelectorAll('.view-mode').forEach(el => el.classList.add('d-none'));
      row.querySelectorAll('.edit-mode').forEach(el => el.classList.remove('d-none'));
      return;
    }

    // Cancel button click
    const cancelBtn = e.target.closest('.btn-cancel');
    if (cancelBtn) {
      const row = cancelBtn.closest('tr');
      row.querySelectorAll('.edit-mode').forEach(el => el.classList.add('d-none'));
      row.querySelectorAll('.view-mode').forEach(el => el.classList.remove('d-none'));
      return;
    }

    // Save button click
    const saveBtn = e.target.closest('.btn-save');
    if (saveBtn) {
      const row = saveBtn.closest('tr');
      const id = saveBtn.dataset.id;
      const description = row.querySelector('[data-field="description"]').value;
      const isActive = row.querySelector('[data-field="isActive"]').value;

      // Create and submit form
      const form = document.createElement('form');
      form.method = 'post';
      form.action = '?table=<%= Server.URLEncode(tableName) %>';
      form.innerHTML = `
        <input type="hidden" name="action" value="update">
        <input type="hidden" name="id" value="${id}">
        <input type="hidden" name="description" value="${description}">
        <input type="hidden" name="isActive" value="${isActive}">
      `;
      document.body.appendChild(form);
      form.submit();
    }
  });
});
</script>

<script src="https://cdn.jsdelivr.net/npm/bootstrap@5.3.0/dist/js/bootstrap.bundle.min.js"></script>
</body>
</html>
