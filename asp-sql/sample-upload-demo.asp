<!--#include file="/asp-sql/incs/uploadLibrary.asp" -->
'<%
 ' Option Explicit is provided by the included uploadLibrary to avoid duplicate declarations
' Simple demo page for uploadLibrary

' Explicit variable declarations to satisfy Option Explicit
Dim message
Dim uploader
Dim fromVal
Dim appealsID, notes_documentID, targetFolder, savedPath
Dim fld
Dim safeName
Dim probeName, probePath, fso, probeErrNum, probeErrDesc, tf
Dim keys, i, k, item, fieldList

message = ""

If Request.ServerVariables("REQUEST_METHOD") = "POST" Then
  On Error Resume Next
  Set uploader = New FileUploader

  ' Build a small debug listing of all submitted fields (names + values/files)
  fieldList = ""
  keys = uploader.FieldNames()
  If IsArray(keys) Then
    For i = LBound(keys) To UBound(keys)
      k = keys(i)
      Set item = uploader(k)
      If item.HasFile() Then
        fieldList = fieldList & k & " (file): " & item.FileName & " - " & item.ContentType & vbCrLf
      Else
        fieldList = fieldList & k & ": " & item.Value & vbCrLf
      End If
      Set item = Nothing
    Next
  End If

  fromVal = uploader("from").Value

  ' target folder for demo saves (relative to site root)
  appealsID = "demo"  ' for demo purposes
  notes_documentID = "1"
  targetFolder = Server.MapPath("/uploads/demo/" & appealsID & "/" & notes_documentID & "/")

  Set fld = uploader("notes_document")
  If fld.HasFile() Then
    If fld.Error Then
      message = "Upload rejected: " & fld.ErrorMessage
    Else
      ' safe filename
      safeName = fld.FileName
      If Len(Trim(safeName)) = 0 Then safeName = "upload.bin"
      savedPath = targetFolder & safeName

      ' Probe write permission by trying to create a zero-byte temp file
      probeErrNum = 0
      probeErrDesc = ""
      On Error Resume Next
      Set fso = Server.CreateObject("Scripting.FileSystemObject")
      probeName = "__probe__" & Replace(CStr(Timer()), ".", "") & ".tmp"
      probePath = targetFolder & probeName
      Set tf = Nothing
      If Not fso Is Nothing Then
        Set tf = fso.CreateTextFile(probePath, True)
      End If
      If Err.Number <> 0 Then
        probeErrNum = Err.Number
        probeErrDesc = Err.Description
        Err.Clear
      Else
        If Not tf Is Nothing Then tf.Write "": tf.Close
        ' attempt to remove probe file
        On Error Resume Next
        If Not fso Is Nothing Then fso.DeleteFile probePath, True
        Err.Clear
      End If
      Set tf = Nothing
      Set fso = Nothing

      If probeErrNum <> 0 Then
        message = "Write-probe failed: Err " & probeErrNum & " - " & probeErrDesc & " (target folder: " & Server.HTMLEncode(targetFolder) & ")"
      Else
        ' Now attempt to save the uploaded file; report Err.Number/Description on failure
        On Error Resume Next
        fld.SaveAs savedPath
        If Err.Number <> 0 Then
          message = "Save failed: Err " & Err.Number & " - " & Err.Description & " (target path: " & Server.HTMLEncode(savedPath) & ")"
          Err.Clear
        Else
          message = "Saved as: " & Server.HTMLEncode(savedPath)
        End If
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
  <% If Len(fieldList) > 0 Then %>
    <h2>Submitted fields</h2>
    <pre><%= Server.HTMLEncode(fieldList) %></pre>
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
