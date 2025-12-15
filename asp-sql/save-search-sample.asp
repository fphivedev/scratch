<!--#include file="/incs/db.asp" -->
<%
' Handle save search POST
If Request.ServerVariables("REQUEST_METHOD") = "POST" Then
  Dim action : action = Trim(Request.Form("action") & "")
  
  If action = "save_search" Then
    Dim description : description = Trim(Request.Form("description") & "")
    Dim searchParams : searchParams = Trim(Request.Form("search_params") & "")
    Dim userID : userID = CLng(Session("UserID")) ' Assumes user ID is in session
    
    If description <> "" And searchParams <> "" Then
      Dim sql : sql = "INSERT INTO SavedSearches (UserID, Description, SearchParams, CreatedDate) VALUES (@userID, @desc, @params, GETDATE())"
      Dim params : params = Array( _
        Array("@userID", userID, 3, 0), _
        Array("@desc", description, 200, 255), _
        Array("@params", searchParams, 200, 4000) _
      )
      
      Call DbExecute(sql, params)
      
      ' Return success JSON
      Response.ContentType = "application/json"
      Response.Write "{""success"": true, ""message"": ""Search saved successfully""}"
      Response.End
    Else
      Response.ContentType = "application/json"
      Response.Write "{""success"": false, ""message"": ""Description and search parameters are required""}"
      Response.End
    End If
  End If
End If

' Sample search parameters from query string
Dim searchTerm : searchTerm = Request("search")
Dim statusFilter : statusFilter = Request("status")
Dim dateFrom : dateFrom = Request("dateFrom")
Dim dateTo : dateTo = Request("dateTo")
%>
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Save Search Example</title>
  <link href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.0/dist/css/bootstrap.min.css" rel="stylesheet">
</head>
<body>
<div class="container mt-4">
  <h1>Search Results</h1>
  
  <!-- Search Form -->
  <div class="card mb-4">
    <div class="card-body">
      <form method="get" action="" id="searchForm">
        <div class="row g-3">
          <div class="col-md-4">
            <label for="search" class="form-label">Search Term</label>
            <input type="text" class="form-control" id="search" name="search" 
                   value="<%= Server.HTMLEncode(searchTerm) %>">
          </div>
          <div class="col-md-3">
            <label for="status" class="form-label">Status</label>
            <select class="form-select" id="status" name="status">
              <option value="">All</option>
              <option value="active" <% If statusFilter = "active" Then Response.Write "selected" %>>Active</option>
              <option value="pending" <% If statusFilter = "pending" Then Response.Write "selected" %>>Pending</option>
              <option value="closed" <% If statusFilter = "closed" Then Response.Write "selected" %>>Closed</option>
            </select>
          </div>
          <div class="col-md-2">
            <label for="dateFrom" class="form-label">Date From</label>
            <input type="date" class="form-control" id="dateFrom" name="dateFrom" 
                   value="<%= Server.HTMLEncode(dateFrom) %>">
          </div>
          <div class="col-md-2">
            <label for="dateTo" class="form-label">Date To</label>
            <input type="date" class="form-control" id="dateTo" name="dateTo" 
                   value="<%= Server.HTMLEncode(dateTo) %>">
          </div>
          <div class="col-md-1 d-flex align-items-end">
            <button type="submit" class="btn btn-primary w-100">Search</button>
          </div>
        </div>
      </form>
      
      <!-- Save Search Button -->
      <div class="mt-3">
        <button type="button" class="btn btn-outline-secondary" id="saveSearchBtn">
          <i class="bi bi-bookmark"></i> Save This Search
        </button>
      </div>
    </div>
  </div>

  <!-- Sample Results -->
  <div class="card">
    <div class="card-header">
      <h5 class="mb-0">Results</h5>
    </div>
    <div class="card-body">
      <p class="text-muted">Your search results would appear here...</p>
      <% If searchTerm <> "" Or statusFilter <> "" Or dateFrom <> "" Or dateTo <> "" Then %>
        <div class="alert alert-info">
          <strong>Active Filters:</strong><br>
          <% If searchTerm <> "" Then Response.Write "Search: " & Server.HTMLEncode(searchTerm) & "<br>" %>
          <% If statusFilter <> "" Then Response.Write "Status: " & Server.HTMLEncode(statusFilter) & "<br>" %>
          <% If dateFrom <> "" Then Response.Write "From: " & Server.HTMLEncode(dateFrom) & "<br>" %>
          <% If dateTo <> "" Then Response.Write "To: " & Server.HTMLEncode(dateTo) & "<br>" %>
        </div>
      <% End If %>
    </div>
  </div>
</div>

<!-- Save Search Modal -->
<div class="modal fade" id="saveSearchModal" tabindex="-1" aria-labelledby="saveSearchModalLabel" aria-hidden="true">
  <div class="modal-dialog">
    <div class="modal-content">
      <div class="modal-header">
        <h5 class="modal-title" id="saveSearchModalLabel">Save Search</h5>
        <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
      </div>
      <div class="modal-body">
        <form id="saveSearchForm">
          <input type="hidden" name="action" value="save_search">
          <input type="hidden" name="search_params" id="searchParamsInput">
          
          <div class="mb-3">
            <label for="searchDescription" class="form-label">Description</label>
            <input type="text" class="form-control" id="searchDescription" name="description" 
                   placeholder="E.g., Active cases from last month" required maxlength="255">
            <div class="form-text">Give this search a name so you can find it later.</div>
          </div>
          
          <div class="alert alert-info" id="searchSummary">
            <!-- Will be populated with current search parameters -->
          </div>
        </form>
      </div>
      <div class="modal-footer">
        <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Cancel</button>
        <button type="button" class="btn btn-primary" id="confirmSaveBtn">
          <span class="spinner-border spinner-border-sm d-none" role="status" aria-hidden="true"></span>
          Save Search
        </button>
      </div>
    </div>
  </div>
</div>

<script src="https://cdn.jsdelivr.net/npm/bootstrap@5.3.0/dist/js/bootstrap.bundle.min.js"></script>
<script>
document.addEventListener('DOMContentLoaded', () => {
  const saveSearchBtn = document.getElementById('saveSearchBtn');
  const saveSearchModal = new bootstrap.Modal(document.getElementById('saveSearchModal'));
  const saveSearchForm = document.getElementById('saveSearchForm');
  const confirmSaveBtn = document.getElementById('confirmSaveBtn');
  const searchParamsInput = document.getElementById('searchParamsInput');
  const searchSummary = document.getElementById('searchSummary');
  const searchDescription = document.getElementById('searchDescription');

  // Get current search parameters
  function getCurrentSearchParams() {
    const params = new URLSearchParams(window.location.search);
    return params.toString();
  }

  // Generate human-readable summary of search
  function generateSearchSummary() {
    const params = new URLSearchParams(window.location.search);
    const summary = [];
    
    if (params.get('search')) {
      summary.push('<strong>Search:</strong> ' + escapeHtml(params.get('search')));
    }
    if (params.get('status')) {
      summary.push('<strong>Status:</strong> ' + escapeHtml(params.get('status')));
    }
    if (params.get('dateFrom')) {
      summary.push('<strong>From:</strong> ' + escapeHtml(params.get('dateFrom')));
    }
    if (params.get('dateTo')) {
      summary.push('<strong>To:</strong> ' + escapeHtml(params.get('dateTo')));
    }
    
    if (summary.length === 0) {
      return '<em>No filters applied</em>';
    }
    
    return summary.join('<br>');
  }

  function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }

  // Open modal when save button clicked
  saveSearchBtn.addEventListener('click', () => {
    const searchParams = getCurrentSearchParams();
    
    if (!searchParams) {
      alert('No search parameters to save. Please apply some filters first.');
      return;
    }
    
    // Populate hidden field and summary
    searchParamsInput.value = searchParams;
    searchSummary.innerHTML = generateSearchSummary();
    searchDescription.value = '';
    
    // Show modal
    saveSearchModal.show();
  });

  // Handle save confirmation
  confirmSaveBtn.addEventListener('click', async () => {
    if (!saveSearchForm.checkValidity()) {
      saveSearchForm.reportValidity();
      return;
    }

    // Show loading state
    const spinner = confirmSaveBtn.querySelector('.spinner-border');
    const originalText = confirmSaveBtn.innerHTML;
    confirmSaveBtn.disabled = true;
    spinner.classList.remove('d-none');
    confirmSaveBtn.innerHTML = '<span class="spinner-border spinner-border-sm me-1" role="status" aria-hidden="true"></span>Saving...';

    try {
      const formData = new FormData(saveSearchForm);
      
      const response = await fetch(window.location.pathname, {
        method: 'POST',
        body: formData,
        credentials: 'same-origin'
      });

      const result = await response.json();

      if (result.success) {
        // Show success message
        searchSummary.className = 'alert alert-success';
        searchSummary.innerHTML = '<i class="bi bi-check-circle"></i> ' + escapeHtml(result.message);
        
        // Close modal after short delay
        setTimeout(() => {
          saveSearchModal.hide();
          searchSummary.className = 'alert alert-info';
        }, 1500);
      } else {
        // Show error
        searchSummary.className = 'alert alert-danger';
        searchSummary.innerHTML = '<i class="bi bi-exclamation-triangle"></i> ' + escapeHtml(result.message);
      }
    } catch (error) {
      console.error('Save search failed:', error);
      searchSummary.className = 'alert alert-danger';
      searchSummary.innerHTML = '<i class="bi bi-exclamation-triangle"></i> Failed to save search. Please try again.';
    } finally {
      // Reset button state
      confirmSaveBtn.disabled = false;
      confirmSaveBtn.innerHTML = originalText;
    }
  });

  // Reset modal state when closed
  document.getElementById('saveSearchModal').addEventListener('hidden.bs.modal', () => {
    saveSearchForm.reset();
    searchSummary.className = 'alert alert-info';
    confirmSaveBtn.disabled = false;
  });
});
</script>

</body>
</html>
