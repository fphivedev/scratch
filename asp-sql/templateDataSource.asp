<%@ Language="VBScript" %>
<!--#include file="incs/db.asp" -->
<%
' templateDataSource.asp - returns a one-row CSV or TSV for a TemplateData record
' Usage: templateDataSource.asp?templateDataID=123[&format=csv|tsv]

Response.Buffer = True
Dim id : id = CLng(0 & Request.QueryString("templateDataID"))
If id = 0 Then
  Response.Status = "400 Bad Request"
  Response.Write "Missing templateDataID"
  Response.End
End If

Dim fmt : fmt = LCase(Trim(Request.QueryString("format")))
If fmt <> "tsv" Then fmt = "csv" ' default to csv
Dim sep : sep = IIf(fmt = "tsv", vbTab, ",")

Const adInteger = 3
Dim rows
rows = DbQuery("SELECT TemplateDataID, StartDate, Title, UserName FROM TemplateData WHERE TemplateDataID = ?", Array(Array("@id", id, adInteger, 0)))
If Not IsArray(rows) Or UBound(rows) < 0 Then
  Response.Status = "404 Not Found"
  Response.Write "Record not found"
  Response.End
End If

Dim r : Set r = rows(0)

' Set content-type and attachment filename
If fmt = "tsv" Then
  Response.ContentType = "text/tab-separated-values"
  Response.AddHeader "Content-Disposition", "attachment; filename=templateData_" & id & ".tsv"
Else
  Response.ContentType = "text/csv"
  Response.AddHeader "Content-Disposition", "attachment; filename=templateData_" & id & ".csv"
End If

Function qval(v)
  If IsNull(v) Then
    qval = """" & "" & """"
  Else
    Dim s : s = CStr(v)
    s = Replace(s, """", """""") ' escape quotes
    qval = """" & s & """"
  End If
End Function

Function fmtDate(v)
  If IsNull(v) Then
    fmtDate = ""
  Else
    On Error Resume Next
    Dim y, m, d
    y = Year(v) : m = Right("0" & Month(v), 2) : d = Right("0" & Day(v), 2)
    fmtDate = y & "-" & m & "-" & d
    On Error GoTo 0
  End If
End Function

' Output header row (ensure these match your Word merge fields)
Response.Write "TemplateDataID" & sep & "StartDate" & sep & "Title" & sep & "UserName" & vbCrLf

' Output data row
Dim out
out = qval(r("TemplateDataID")) & sep & qval(fmtDate(r("StartDate"))) & sep & qval(r("Title")) & sep & qval(r("UserName"))
Response.Write out
%>
