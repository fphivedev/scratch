<%
' asp-sql/incs/uploadLibrary.asp
' Minimal multipart/form-data parser and FileUploader helper for Classic ASP
' Usage:
'   Set uploader = New FileUploader
'   Dim from : from = uploader("from").value
'   ' Save uploaded file:
'   uploader("notes_document").SaveAs Server.MapPath("documents\" & appealsID & "\" & notes_documentID & "\") & "\" & uploader.Fields("notes_document").FileName
'
Option Explicit

' Configuration: default max upload size (bytes). Can be overridden by Application("MaxUploadBytes")
Const DEFAULT_MAX_UPLOAD_BYTES = 5 * 1024 * 1024 ' 5 MB

' Helper: convert byte array to string using ISO-8859-1 (single-byte) preservation
Private Function BytesToString(byts)
  Dim stm
  Set stm = Server.CreateObject("ADODB.Stream")
  stm.Type = 1 ' adTypeBinary
  stm.Open
  stm.Write byts
  stm.Position = 0
  stm.Type = 2 ' adTypeText
  stm.Charset = "iso-8859-1"
  BytesToString = stm.ReadText
  stm.Close
  Set stm = Nothing
End Function

' Helper: convert string (iso-8859-1) back to byte array
Private Function StringToBytes(s)
  Dim stm
  Set stm = Server.CreateObject("ADODB.Stream")
  stm.Type = 2 ' text
  stm.Charset = "iso-8859-1"
  stm.Open
  stm.WriteText s
  stm.Position = 0
  stm.Type = 1 ' binary
  StringToBytes = stm.Read
  stm.Close
  Set stm = Nothing
End Function

' Return configured max upload size in bytes
Private Function MaxUploadBytes()
  On Error Resume Next
  Dim m
  m = DEFAULT_MAX_UPLOAD_BYTES
  If Not IsEmpty(Application("MaxUploadBytes")) Then
    If IsNumeric(Application("MaxUploadBytes")) Then
      m = CLng(Application("MaxUploadBytes"))
    End If
  End If
  MaxUploadBytes = m
End Function

' Sanitize a filename: remove path segments, strip ../, remove illegal chars and limit length
Private Function SanitizeFileName(fn)
  If IsEmpty(fn) Then
    SanitizeFileName = ""
    Exit Function
  End If
  fn = CStr(fn)
  ' Remove any directory separators
  fn = Replace(fn, "\", "_")
  fn = Replace(fn, "/", "_")
  ' Strip any parent traversal markers
  fn = Replace(fn, "..", "")
  ' Remove control characters and a small set of unsafe characters
  Dim illegalChars, ch, i
  ' Use Chr(34) for double-quote (VBScript string escape is double-quote """).
  illegalChars = Array(Chr(0), Chr(1), Chr(2), Chr(3), Chr(4), Chr(5), Chr(6), Chr(7), Chr(8), Chr(9), Chr(10), Chr(11), Chr(12), Chr(13), Chr(14), Chr(15), Chr(16), Chr(17), Chr(18), Chr(19), Chr(20), Chr(21), Chr(22), Chr(23), Chr(24), Chr(25), Chr(26), Chr(27), Chr(28), Chr(29), Chr(30), Chr(31), ":", Chr(34), "<", ">", "|", "?", "*", "%" )
  For i = 0 To UBound(illegalChars)
    ch = illegalChars(i)
    fn = Replace(fn, ch, "_")
  Next
  ' Trim and limit length
  fn = Trim(fn)
  If Len(fn) > 200 Then fn = Right(fn, 200)
  SanitizeFileName = fn
End Function

' Ensure folder exists (creates intermediate folders)
Private Sub EnsureFolderExists(folderPath)
  Dim fso, parts, i, cur
  Set fso = Server.CreateObject("Scripting.FileSystemObject")
  If Len(Trim(folderPath)) = 0 Then Exit Sub
  folderPath = Replace(folderPath, "/", "\")
  If Right(folderPath,1) = "\" Then folderPath = Left(folderPath, Len(folderPath)-1)
  If fso.FolderExists(folderPath) Then
    Set fso = Nothing
    Exit Sub
  End If
  parts = Split(folderPath, "\\")
  cur = parts(0)
  ' If absolute path like C:\... keep the first element
  For i = 1 To UBound(parts)
    cur = cur & "\\" & parts(i)
    If Not fso.FolderExists(cur) Then
      On Error Resume Next
      fso.CreateFolder cur
      On Error GoTo 0
    End If
  Next
  Set fso = Nothing
End Sub

' UploadField class: represents either a simple form field (Value) or a file with Binary data
Class UploadField
  Public Name
  Public Value
  Public FileName
  Public ContentType
  Public Error
  Public ErrorMessage
  Private m_binary ' byte array

  Public Sub SetBinary(byts)
    m_binary = byts
  End Sub

  Public Function BinaryLength()
    On Error Resume Next
    If IsEmpty(m_binary) Then
      BinaryLength = 0
    Else
      BinaryLength = (UBound(m_binary) - LBound(m_binary) + 1)
    End If
  End Function

  Public Function HasFile()
    HasFile = (Len(Trim(CStr(FileName))) > 0)
  End Function

  Public Sub SaveAs(path)
    If Len(Trim(CStr(path))) = 0 Then
      Err.Raise vbObjectError + 7200, "UploadField", "SaveAs requires a path"
    End If
    If Not HasFile() Then
      Err.Raise vbObjectError + 7201, "UploadField", "No file to save for field: " & Name
    End If
    ' Ensure directory exists
    Dim dir
    dir = Left(path, InStrRev(path, "\") )
    EnsureFolderExists(dir)

    ' Check max file size before writing
    Dim maxBytes, blen
    maxBytes = MaxUploadBytes()
    blen = BinaryLength()
    If blen > maxBytes Then
      Err.Raise vbObjectError + 7202, "UploadField", "File exceeds maximum allowed size"
    End If

    Dim stm
    Set stm = Server.CreateObject("ADODB.Stream")
    stm.Type = 1 ' binary
    stm.Open
    stm.Write m_binary
    stm.SaveToFile path, 2 ' adSaveCreateOverWrite
    stm.Close
    Set stm = Nothing
  End Sub
End Class

' FileUploader class: default accessor returns UploadField object
Class FileUploader
  Private m_all ' dictionary of all fields (UploadField objects)
  Private m_files ' dictionary of file fields

  Private Sub Class_Initialize()
    Set m_all = Server.CreateObject("Scripting.Dictionary")
    Set m_files = Server.CreateObject("Scripting.Dictionary")
    Call ParseRequest
  End Sub

  Private Sub ParseRequest()
    Dim contentType
    contentType = Request.ServerVariables("CONTENT_TYPE")
    If Len(Trim(CStr(contentType))) = 0 Then
      ' No request content type — parse simple form variables
      Call LoadSimpleForm
      Exit Sub
    End If

    If InStr(LCase(contentType), "multipart/form-data") > 0 Then
      Call ParseMultipart(contentType)
    Else
      ' standard urlencoded/form data
      Call LoadSimpleForm
    End If
  End Sub

  Private Sub LoadSimpleForm()
    Dim k
    For Each k In Request.Form
      Dim f
      Set f = New UploadField
      f.Name = k
      f.Value = Request.Form(k)
      f.FileName = ""
      f.ContentType = ""
      m_all.Add k, f
    Next
  End Sub

  Private Sub ParseMultipart(contentType)
    On Error Resume Next
    Dim boundaryPos, boundary
    boundaryPos = InStr(contentType, "boundary=")
    If boundaryPos = 0 Then
      Call LoadSimpleForm
      Exit Sub
    End If
    boundary = "--" & Mid(contentType, boundaryPos + 9)

    Dim totalBytes
    totalBytes = Request.TotalBytes
    If totalBytes <= 0 Then Exit Sub

    Dim rawBytes
    rawBytes = Request.BinaryRead(totalBytes)
    Dim raw
    raw = BytesToString(rawBytes)

    Dim parts
    parts = Split(raw, boundary)

    Dim i
    For i = 0 To UBound(parts)
      Dim part
      part = parts(i)
      If Len(Trim(part)) = 0 Then
        ' skip empty part
      Else
        ' strip leading CRLF
        If Left(part,2) = vbCrLf Then
          part = Mid(part,3)
        End If

        ' strip trailing -- or CRLF
        If Right(part,2) = "--" Then
          part = Left(part, Len(part)-2)
        End If

        ' find header/body separator
        Dim hdrEnd
        hdrEnd = InStr(part, vbCrLf & vbCrLf)
        If hdrEnd = 0 Then
          ' skip this part without headers
        Else
          Dim hdrText, bodyText
          hdrText = Left(part, hdrEnd - 1)
          bodyText = Mid(part, hdrEnd + 4)

          ' remove trailing CRLF
          If Right(bodyText,2) = vbCrLf Then
            bodyText = Left(bodyText, Len(bodyText)-2)
          End If

          ' parse headers
          Dim hlines
          hlines = Split(hdrText, vbCrLf)
          Dim name, filename, ctype
          name = ""
          filename = ""
          ctype = ""
          Dim h
          For Each h In hlines
            Dim l
            l = Trim(h)
            If LCase(Left(l,19)) = "content-disposition" Then
              ' parse name and filename
              Dim nmPos
              nmPos = InStr(l, "name=")
              If nmPos > 0 Then
                name = ExtractQuotedString(Mid(l, nmPos))
              End If
              Dim fnPos
              fnPos = InStr(l, "filename=")
              If fnPos > 0 Then
                filename = ExtractQuotedString(Mid(l, fnPos))
              End If
            ElseIf LCase(Left(l,12)) = "content-type" Then
              Dim colon
              colon = InStr(l, ":")
              If colon > 0 Then
                ctype = Trim(Mid(l, colon+1))
              End If
            End If
          Next

          Dim fld
          Set fld = New UploadField
          fld.Name = name
          fld.FileName = filename
          fld.ContentType = ctype

          If Len(Trim(filename)) > 0 Then
            ' file part - obtain binary from bodyText
            Dim byts
            byts = StringToBytes(bodyText)
            Call fld.SetBinary(byts)
            ' sanitize filename
            fld.FileName = SanitizeFileName(filename)

            ' size check
            Dim blen
            If IsEmpty(byts) Then
              blen = 0
            Else
              blen = (UBound(byts) - LBound(byts) + 1)
            End If
            If blen > MaxUploadBytes() Then
              fld.Error = True
              fld.ErrorMessage = "File exceeds maximum allowed size"
              fld.FileName = ""
            Else
              fld.Error = False
              fld.ErrorMessage = ""
              ' add to file dict
              If Not m_files.Exists(name) Then m_files.Add name, fld
            End If
          Else
            ' form field
            fld.Value = bodyText
          End If

          If Not m_all.Exists(name) Then m_all.Add name, fld
        End If ' hdrEnd
      End If ' part empty
    Next
  End Sub

  ' Extracts a quoted string like name="value" or filename="file.ext"
  Private Function ExtractQuotedString(s)
    Dim p1, p2, res
    p1 = InStr(s, "\"")
    If p1 = 0 Then
      ExtractQuotedString = Trim(s)
      Exit Function
    End If
    p2 = InStr(p1+1, s, "\"")
    If p2 = 0 Then
      ExtractQuotedString = Trim(Mid(s, p1+1))
    Else
      ExtractQuotedString = Mid(s, p1+1, p2 - p1 - 1)
    End If
  End Function

  ' Default accessor: uploader(name) -> UploadField object
  Public Default Function Item(fieldName)
    If m_all.Exists(fieldName) Then
      Set Item = m_all(fieldName)
    Else
      ' return an empty UploadField with empty value
      Dim f
      Set f = New UploadField
      f.Name = fieldName
      f.Value = ""
      f.FileName = ""
      f.ContentType = ""
      Set Item = f
    End If
  End Function

  ' Expose Fields dictionary for direct access: Uploader.Fields("notes_document").FileName
  Public Property Get Fields()
    Set Fields = m_files
  End Property

End Class
%>