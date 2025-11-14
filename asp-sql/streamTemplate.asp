<%@ Language="VBScript" %>
<!--#include file="incs/db.asp" -->
<%
' streamTemplate.asp - streams the .dotx template file to the browser
Const adInteger = 3

Response.Buffer = True
Response.Expires = -1

Dim templateDataID : templateDataID = CLng(0 & Request.QueryString("templateDataID"))
If templateDataID = 0 Then
  Response.Status = "400 Bad Request"
  Response.Write "Missing templateDataID"
  Response.End
End If

' Lookup template path via TemplateData
Dim sql, rows
sql = "SELECT t.TemplatePath FROM Templates t INNER JOIN TemplateData d ON t.TemplateID = d.TemplateID WHERE d.TemplateDataID = ?"
rows = DbQuery(sql, Array(Array("@TemplateDataID", templateDataID, adInteger, 0)))
If Not IsArray(rows) Or UBound(rows) < 0 Then
  Response.Status = "404 Not Found"
  Response.Write "Template path not found"
  Response.End
End If

Dim templatePath : templatePath = rows(0)("TemplatePath")
If Len(templatePath) = 0 Then
  Response.Status = "404 Not Found"
  Response.Write "Empty template path"
  Response.End
End If

' Basic sanitisation: disallow relative parent traversal
If InStr(templatePath, "..") > 0 Then
  Response.Status = "400 Bad Request"
  Response.Write "Invalid path"
  Response.End
End If

On Error Resume Next
Dim stm : Set stm = Server.CreateObject("ADODB.Stream")
stm.Type = 1 ' adTypeBinary
stm.Open
stm.LoadFromFile templatePath
If Err.Number <> 0 Then
  Err.Clear
  On Error GoTo 0
  Response.Status = "404 Not Found"
  Response.Write "Unable to load template file."
  Response.End
End If
On Error GoTo 0

Dim ext, ct
ext = LCase(Right(templatePath, Len(templatePath) - InStrRev(templatePath, ".")))
Select Case ext
  Case "dotx" ct = "application/vnd.openxmlformats-officedocument.wordprocessingml.template"
  Case "docx" ct = "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
  Case Else ct = "application/octet-stream"
End Select

Dim downloadName : downloadName = "Template_" & templateDataID & "." & ext
Response.ContentType = ct
Response.AddHeader "Content-Disposition", "attachment; filename=" & downloadName
Response.AddHeader "X-Template-Source", templatePath

Dim chunkSize : chunkSize = 32768
Do While Not stm.EOS
  Response.BinaryWrite stm.Read(chunkSize)
Loop

stm.Close:Set stm = Nothing
Response.Flush
%>