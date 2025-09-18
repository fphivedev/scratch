<%
' Upload Library for Classic ASP
' This library handles file uploads and form data processing
Option Explicit

Dim p, isFile, lengthVal

' Create a dictionary for demonstration
Set p = CreateObject("Scripting.Dictionary")

' Add some test data
p.Add "IsFile", True
p.Add "Length", 1024
p.Add "FileName", "test.txt"
p.Add "ContentType", "text/plain"

Function ProcessUploadData()
    Dim result
    Set result = CreateObject("Scripting.Dictionary")
    
    ' Some example processing code (lines before the problematic ones)
    If p.Exists("FileName") Then
        result.Item("fileName") = p.Item("FileName")
    End If
    
    If p.Exists("ContentType") Then
        result.Item("contentType") = p.Item("ContentType")
    End If
    
    ' More processing code to reach around line 69
    ' Line 60
    ' Line 61
    ' Line 62
    ' Line 63
    ' Line 64
    ' Line 65
    ' Line 66
    ' Line 67
    ' Line 68
    ' THE PROBLEMATIC LINES (around line 69):
    If p.Exists("IsFile") Then isFile = CBool(p.Item("IsFile"))
    If p.Exists("Length") Then lengthVal = CLng(p.Item("Length"))
    
    ' Additional dictionary access that also needs fixing
    If p.Exists("FileName") Then
        Dim fileName
        fileName = p.Item("FileName")
        result.Item("processedFileName") = fileName
    End If
    
    ' Another problematic access
    If p.Exists("ContentType") Then
        result.Item("processedContentType") = p.Item("ContentType")
    End If
    
    Set ProcessUploadData = result
End Function

' Test the function
Dim uploadResult
Set uploadResult = ProcessUploadData()

Response.Write "IsFile: " & isFile & "<br>"
Response.Write "Length: " & lengthVal & "<br>"
%>