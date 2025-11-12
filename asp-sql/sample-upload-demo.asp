<!--#include file="/asp-sql/incs/uploadLibrary.asp" -->
<%
' Simple demo page for uploadLibrary
Option Explicit

Dim message
message = ""

If Request.ServerVariables("REQUEST_METHOD") = "POST" Then
  On Error Resume Next
  Dim uploader
  Set uploader = New FileUploader

  Dim fromVal
  fromVal = uploader("from").Value

  ' target folder for demo saves (relative to site root)
  Dim appealsID, notes_documentID, targetFolder, savedPath
  appealsID = "demo"  ' for demo purposes
  notes_documentID = "1"
  targetFolder = Server.MapPath("/uploads/demo/" & appealsID & "/" & notes_documentID & "/")

  Dim fld
  Set fld = uploader("notes_document")
  If fld.HasFile() Then
    If fld.Error Then
      message = "Upload rejected: " & fld.ErrorMessage
    Else
      ' safe filename
      Dim safeName
      safeName = fld.FileName
      If Len(Trim(safeName)) = 0 Then safeName = "upload.bin"
      savedPath = targetFolder & safeName
      On Error Resume Next
      fld.SaveAs savedPath
      If Err.Number <> 0 Then
        message = "Save failed: " & Err.Description
        Err.Clear
      Else
        message = "Saved as: " & Server.HTMLEncode(savedPath)
      End If
    End If
  Else
    message = "No file uploaded. Field value: " & Server.HTMLEncode(fromVal)
  End If
  Set fld = Nothing
  Set uploader = Nothing
  On Error GoTo 0
End If
%>
<!doctype html>
<html>
<head>
  <meta charset="utf-8">
  <title>Upload demo</title>
  <style>body{font-family:Arial,Helvetica,sans-serif;padding:20px}label{display:block;margin-top:8px}</style>
</head>
<body>
  <h1>Upload demo</h1>
  <% If Len(message) > 0 Then %>
    <p><strong><%= Server.HTMLEncode(message) %></strong></p>
  <% End If %>

  <form method="post" enctype="multipart/form-data">
    <label>From (text): <input type="text" name="from" /></label>
    <label>Notes document: <input type="file" name="notes_document" /></label>
    <button type="submit">Upload</button>
  </form>

  <p>Max upload size: <strong><%= MaxUploadBytes() %></strong> bytes</p>
  <p>Saved demo uploads to <code>/uploads/demo/</code> (server path: <%= Server.HTMLEncode(Server.MapPath("/uploads/demo/")) %>)</p>
</body>
</html>
