Option Explicit

Private Sub Document_New()
    On Error GoTo ohno

    Dim id As Long: id = 17  ' <- change or prompt for this
    Dim cn As ADODB.Connection, cmd As ADODB.Command, rs As ADODB.Recordset

    Set cn = New ADODB.Connection
    ' For SQL Server / Azure SQL (AAD or SQL Auth – pick one):
    ' Integrated Security example:
    'cn.Open "Provider=SQLOLEDB;Data Source=YOURSERVER;Initial Catalog=YOURDB;Integrated Security=SSPI;"
    ' SQL auth example:
    'cn.Open "Provider=SQLOLEDB;Data Source=YOURSERVER;Initial Catalog=YOURDB;User ID=USER;Password=PWD;"

    ' Azure SQL with OLE DB Driver 19 (if installed):
    'cn.Open "Provider=MSOLEDBSQL;Server=tcp:YOURSERVER.database.windows.net,1433;Database=YOURDB;User ID=USER;Password=PWD;Encrypt=yes;TrustServerCertificate=no;"

    ' TODO: pick ONE and configure it:
    cn.Open "Provider=MSOLEDBSQL;Server=tcp:YOURSERVER;Database=YOURDB;Integrated Security=SSPI;Encrypt=yes;TrustServerCertificate=no;"

    Set cmd = New ADODB.Command
    Set cmd.ActiveConnection = cn
    cmd.CommandText = "SELECT name, description FROM dbo.YourTable WHERE id = ?"
    cmd.Parameters.Append cmd.CreateParameter("id", adInteger, adParamInput, , id)

    Set rs = cmd.Execute
    If Not rs.EOF Then
        SetCC "name", Nz(rs.Fields("name").Value)
        SetCC "description", Nz(rs.Fields("description").Value)
    Else
        MsgBox "No record found for id=" & id, vbExclamation
    End If

cleanup:
    On Error Resume Next
    If Not rs Is Nothing Then rs.Close
    If Not cn Is Nothing Then cn.Close
    Set rs = Nothing: Set cmd = Nothing: Set cn = Nothing
    Exit Sub

ohno:
    MsgBox "Error: " & Err.Number & " - " & Err.Description, vbCritical
    Resume cleanup
End Sub

Private Sub SetCC(ByVal tag As String, ByVal textVal As String)
    Dim cc As ContentControl
    For Each cc In ActiveDocument.ContentControls
        If LCase$(cc.Tag) = LCase$(tag) Then
            cc.Range.Text = textVal
            Exit For
        End If
    Next cc
End Sub

Private Function Nz(v) As String
    If IsNull(v) Or IsEmpty(v) Then Nz = "" Else Nz = CStr(v)
End Function








---------


Option Explicit

'========================
' Entry points
'========================
Private Sub Document_New()
    ' New doc from template: often named "Document1" until saved.
    ' We enforce filename-only: if no id token, we do nothing.
    TryFillFromFilename
End Sub

Private Sub Document_Open()
    ' When opening a saved/renamed doc, we try again.
    TryFillFromFilename
End Sub

Private Sub TryFillFromFilename()
    On Error GoTo ohno

    Dim recId As Variant
    recId = ExtractIdFromName(ActiveDocument.Name) ' strictly from filename

    If IsEmpty(recId) Then
        ' No fallback, no prompts. Exit silently.
        Exit Sub
    End If

    ' Found an ID in the filename; go fill the fields.
    FillFromDatabase CLng(recId)
    Exit Sub

ohno:
    ' Silent failure is an option; keep a MsgBox if you want dev visibility.
    'MsgBox "Error: " & Err.Number & " - " & Err.Description, vbCritical
End Sub

'========================
' ID extraction (filename-only, strict)
'========================
' Convention: filename must contain token "id###"
' Examples: "Case id17 - Intake.docx", "id42.docx", "ABC_id123_X.docx"
' Matches "id=17", "id:17", "id-17", "id17" etc.
Private Function ExtractIdFromName(ByVal fileName As String) As Variant
    Dim re As Object, m As Object
    Set re = CreateObject("VBScript.RegExp")
    re.Global = False
    re.IgnoreCase = True
    re.Pattern = "\bid\s*[:=\-_]?\s*(\d+)\b" ' requires the literal token "id"
    If re.Test(fileName) Then
        Set m = re.Execute(fileName)(0)
        ExtractIdFromName = CLng(m.SubMatches(0))
    Else
        ExtractIdFromName = Empty
    End If
End Function

'========================
' Database fill
'========================
Private Sub FillFromDatabase(ByVal id As Long)
    On Error GoTo ohno

    Dim cn As Object, cmd As Object, rs As Object
    Set cn = CreateObject("ADODB.Connection")
    Set cmd = CreateObject("ADODB.Command")

    ' --- Pick and configure ONE connection string below ---
    ' SQL Server / Azure SQL via OLE DB Driver 19:
    cn.Open "Provider=MSOLEDBSQL;" & _
            "Server=tcp:YOURSERVER;Database=YOURDB;" & _
            "Integrated Security=SSPI;Encrypt=yes;TrustServerCertificate=no;"

    ' SQL authentication example:
    'cn.Open "Provider=MSOLEDBSQL;Server=tcp:YOURSERVER;Database=YOURDB;User ID=USER;Password=PWD;Encrypt=yes;TrustServerCertificate=no;"

    Set cmd.ActiveConnection = cn
    cmd.CommandText = "SELECT name, description FROM dbo.YourTable WHERE id = ?"
    cmd.Parameters.Append cmd.CreateParameter("id", 3, 1, , id) ' 3=adInteger, 1=adParamInput

    Set rs = cmd.Execute
    If Not rs.EOF Then
        SetCC "name", Nz(rs.Fields("name").Value)
        SetCC "description", Nz(rs.Fields("description").Value)
    End If

cleanup:
    On Error Resume Next
    If Not rs Is Nothing Then rs.Close
    If Not cn Is Nothing Then cn.Close
    Set rs = Nothing: Set cmd = Nothing: Set cn = Nothing
    Exit Sub

ohno:
    ' Optional dev visibility:
    'MsgBox "DB error: " & Err.Number & " - " & Err.Description, vbCritical
    Resume cleanup
End Sub

'========================
' Helpers
'========================
Private Sub SetCC(ByVal tag As String, ByVal textVal As String)
    Dim cc As ContentControl
    For Each cc In ActiveDocument.ContentControls
        If LCase$(cc.Tag) = LCase$(tag) Then
            cc.Range.Text = textVal
            Exit For
        End If
    Next cc
End Sub

Private Function Nz(v) As String
    If IsNull(v) Or IsEmpty(v) Then Nz = "" Else Nz = CStr(v)
End Function
