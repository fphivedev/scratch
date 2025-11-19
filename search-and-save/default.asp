<link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css" integrity="sha512-p1CmYd3Q2Jm6w7O8fVnF0q3KJQh3Yt5b1ZQ1l9sE4U6k9Jk8YfZ0J1n/6p1G8K9X2ZV3FQ4q5R6s7T8u9V0Yw==" crossorigin="anonymous" referrerpolicy="no-referrer" />
<script src="/search-and-save.js"></script>
<script src="siteInit.js"></script>
<%
' Search and Save Default ASP Page


%>
<form>
<div>A bunch of other stuff in a larger edit form</div>
<input type="text" name="search" id="searchInput" value="<%= Server.HTMLEncode(Request.QueryString("search")) %>" />
<span id="searchAdd">Search</span>

<span id="searchResult" data-url="search.asp?id=12&searchInput=">
    <!-- search results will be displayed here -->
</span>


<span id="addedResults" data-url="existing.asp?id=12">
    <!-- existing added results will be displayed here -->
</span>
</form>