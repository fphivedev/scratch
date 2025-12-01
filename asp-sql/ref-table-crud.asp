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
Dim bulkUpdate : bulkUpdate = Trim(Request("bulk_update") & "")

' Handle POST actions
If Request.ServerVariables("REQUEST_METHOD") = "POST" Then
  ' Handle bulk update
  If bulkUpdate = "1" Then
    Dim updateCount : updateCount = CInt(Request("update_count"))
    Dim idx, upItemId, upDesc, upActive
    
    ' Process new item first if description provided
    Dim newDesc : newDesc = Trim(Request("new_description") & "")
    Dim newActive : newActive = Trim(Request("new_isActive") & "")
    If newDesc <> "" Then
      description = newDesc
      isActive = newActive
      Call CreateItem()
    End If
    
    ' Process all updates
    For idx = 0 To updateCount - 1
      upItemId = Request("update_" & idx & "_id")
      upDesc = Trim(Request("update_" & idx & "_description") & "")
      upActive = Trim(Request("update_" & idx & "_isActive") & "")
      
      ' Update this item
      itemId = upItemId
      description = upDesc
      isActive = upActive
      Call UpdateItem()
    Next
    
    Response.Redirect "?table=" & Server.URLEncode(tableName)
    Response.End
  End If
  
  ' Handle individual delete action
  action = Trim(Request("action") & "")
  If action = "delete" Then
    itemId = Trim(Request("id") & "")
    Call DeleteItem()
    Response.Redirect "?table=" & Server.URLEncode(tableName)
    Response.End
  End If
End If

' Load all items
Dim items : items = LoadItems()
Dim action, itemId, description, isActive

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
  
  <!-- Editable Table -->
  <div class="card">
    <div class="card-header d-flex justify-content-between align-items-center">
      <span>Edit <%= Server.HTMLEncode(tableName) %> Items</span>
      <button type="button" class="btn btn-success" id="saveAllBtn">Save All Changes</button>
    </div>
    <div class="card-body">
      <form method="post" action="?table=<%= Server.URLEncode(tableName) %>" id="bulkEditForm">
        <table class="table table-striped">
          <thead>
            <tr>
              <th style="width: 80px;">ID</th>
              <th>Description</th>
              <th style="width: 120px;">Active</th>
              <th style="width: 100px;">Action</th>
            </tr>
          </thead>
          <tbody>
            <!-- New Record Row (always first) -->
            <tr class="table-success">
              <td><em>New</em></td>
              <td>
                <input type="text" class="form-control form-control-sm" 
                       name="new_description" 
                       placeholder="Enter description to add new item" 
                       maxlength="500">
              </td>
              <td>
                <select class="form-select form-select-sm" name="new_isActive">
                  <option value="1" selected>Yes</option>
                  <option value="0">No</option>
                </select>
              </td>
              <td><em>--</em></td>
            </tr>

            <!-- Existing Items -->
            <% If IsArray(items) And UBound(items) >= 0 Then %>
              <% 
              Dim i, row
              For i = 0 To UBound(items)
                Set row = items(i)
              %>
              <tr data-id="<%= row(idColumn) %>">
                <td><%= Server.HTMLEncode(CStr(row(idColumn))) %></td>
                <td>
                  <input type="text" class="form-control form-control-sm" 
                         name="desc_<%= row(idColumn) %>" 
                         value="<%= Server.HTMLEncode(row("description")) %>" 
                         maxlength="500">
                </td>
                <td>
                  <select class="form-select form-select-sm" name="active_<%= row(idColumn) %>">
                    <option value="1" <% If CBool(row("isActive")) Then Response.Write "selected" %>>Yes</option>
                    <option value="0" <% If Not CBool(row("isActive")) Then Response.Write "selected" %>>No</option>
                  </select>
                </td>
                <td>
                  <button type="button" class="btn btn-sm btn-outline-danger btn-delete" 
                          data-id="<%= row(idColumn) %>"
                          title="Delete">
                    ×
                  </button>
                </td>
              </tr>
              <% 
                Set row = Nothing
              Next 
              %>
            <% Else %>
              <tr>
                <td colspan="4" class="text-muted text-center">No items found. Add one above.</td>
              </tr>
            <% End If %>
          </tbody>
        </table>
      </form>
    </div>
  </div>
</div>

<script>
document.addEventListener('DOMContentLoaded', () => {
  const form = document.getElementById('bulkEditForm');
  const saveBtn = document.getElementById('saveAllBtn');
  
  // Save all changes
  saveBtn.addEventListener('click', () => {
    const updates = [];
    const newDesc = document.querySelector('[name="new_description"]').value.trim();
    const newActive = document.querySelector('[name="new_isActive"]').value;
    
    // Collect all existing row updates
    const rows = form.querySelectorAll('tbody tr[data-id]');
    rows.forEach(row => {
      const id = row.dataset.id;
      const description = row.querySelector('[name="desc_' + id + '"]').value;
      const isActive = row.querySelector('[name="active_' + id + '"]').value;
      
      updates.push({
        action: 'update',
        id: id,
        description: description,
        isActive: isActive
      });
    });
    
    // Build combined form and submit
    const submitForm = document.createElement('form');
    submitForm.method = 'post';
    submitForm.action = '?table=<%= Server.URLEncode(tableName) %>';
    
    // Add new item if description provided
    if (newDesc) {
      submitForm.innerHTML += `
        <input type="hidden" name="action" value="create">
        <input type="hidden" name="description" value="${newDesc}">
        <input type="hidden" name="isActive" value="${newActive}">
      `;
    }
    
    // Add all updates
    updates.forEach((upd, idx) => {
      submitForm.innerHTML += `
        <input type="hidden" name="update_${idx}_id" value="${upd.id}">
        <input type="hidden" name="update_${idx}_description" value="${upd.description}">
        <input type="hidden" name="update_${idx}_isActive" value="${upd.isActive}">
      `;
    });
    
    submitForm.innerHTML += `<input type="hidden" name="bulk_update" value="1">`;
    submitForm.innerHTML += `<input type="hidden" name="update_count" value="${updates.length}">`;
    
    document.body.appendChild(submitForm);
    submitForm.submit();
  });
  
  // Delete button handler
  form.addEventListener('click', (e) => {
    const deleteBtn = e.target.closest('.btn-delete');
    if (!deleteBtn) return;
    
    if (!confirm('Delete this item?')) return;
    
    const id = deleteBtn.dataset.id;
    const deleteForm = document.createElement('form');
    deleteForm.method = 'post';
    deleteForm.action = '?table=<%= Server.URLEncode(tableName) %>';
    deleteForm.innerHTML = `
      <input type="hidden" name="action" value="delete">
      <input type="hidden" name="id" value="${id}">
    `;
    document.body.appendChild(deleteForm);
    deleteForm.submit();
  });
});
</script>

<script src="https://cdn.jsdelivr.net/npm/bootstrap@5.3.0/dist/js/bootstrap.bundle.min.js"></script>
</body>
</html>
