<%
' /inc/db.asp
Const adCmdText = 1
Const adOpenForwardOnly = 0
Const adLockReadOnly = 1
Const adStateOpen = 1

Function DbConn()
  Dim cn : Set cn = Server.CreateObject("ADODB.Connection")
  cn.Open Application("ConnString") ' put your DSN/connection string in Application
  Set DbConn = cn
End Function

Function DbQuery(sqlText, params)
  Dim cn : Set cn = DbConn()
  Dim cmd : Set cmd = Server.CreateObject("ADODB.Command")
  Set cmd.ActiveConnection = cn
  cmd.CommandType = adCmdText
  cmd.CommandText = sqlText

  ' params is an array of arrays: Array(Array("name","value","type","size"))
  Dim i, p
  If IsArray(params) Then
    For i = 0 To UBound(params)
      p = params(i)
	  if p(2)=3 then
		cmd.Parameters.Append cmd.CreateParameter(p(0), p(2), 1, , cInt(p(1)))
	  else 	  
		cmd.Parameters.Append cmd.CreateParameter(p(0), p(2), 1, p(3), p(1))
	  end if 
      ' 1 = adParamInput
    Next
  End If

  Dim rs, recordsAffected
  Set rs = Nothing
  recordsAffected = 0
  
  ' Execute and let errors bubble up
  Set rs = cmd.Execute(recordsAffected)

  ' If a recordset object was returned and is open, read rows. Otherwise return an empty array.
  If (IsObject(rs) And Not rs Is Nothing) Then
    If rs.State = adStateOpen Then
      ' Check if recordset is empty (BOF and EOF both true)
      If rs.BOF And rs.EOF Then
        rs.Close: Set rs = Nothing
        cn.Close: Set cn = Nothing
        DbQuery = Array()
        Exit Function
      End If
      
      ' Collect field names from the recordset (some providers don't expose cmd.Fields)
      Dim fieldCount, fi, fieldNames
      fieldCount = rs.Fields.Count
      ReDim fieldNames(fieldCount - 1)
      For fi = 0 To fieldCount - 1
        fieldNames(fi) = rs.Fields(fi).Name
      Next

      Dim data : data = rs.GetRows() ' fast extraction
      rs.Close: Set rs = Nothing
      cn.Close: Set cn = Nothing

      DbQuery = ArrayToObjects(data, fieldNames) ' convert to [{col:val}, ...]
      Exit Function
    End If
  End If

  ' No recordset returned (e.g. INSERT/UPDATE/DELETE). Clean up and return empty array.
  If Not rs Is Nothing Then
    On Error Resume Next
    rs.Close
    Set rs = Nothing
    Err.Clear
  End If
  cn.Close: Set cn = Nothing
  DbQuery = Array()
End Function

' Execute a non-SELECT statement (INSERT/UPDATE/DELETE) and return the number of records affected
' Params format is the same as DbQuery: Array(Array("name","value","type","size"))
Function DbExecute(sqlText, params)
  Dim cn, cmd, i, p, rs, recordsAffected
  Set cn = DbConn()
  Set cmd = Server.CreateObject("ADODB.Command")
  Set cmd.ActiveConnection = cn
  cmd.CommandType = adCmdText
  cmd.CommandText = sqlText

  If IsArray(params) Then
    For i = 0 To UBound(params)
      p = params(i)
      If p(2) = 3 Then
        cmd.Parameters.Append cmd.CreateParameter(p(0), p(2), 1, , CLng(p(1)))
      Else
        cmd.Parameters.Append cmd.CreateParameter(p(0), p(2), 1, p(3), p(1))
      End If
    Next
  End If

  recordsAffected = 0
  Set rs = Nothing
  
  ' Execute and let errors bubble up
  Set rs = cmd.Execute(recordsAffected)

  ' If an unexpected recordset was returned, close it
  If IsObject(rs) And Not rs Is Nothing Then
    On Error Resume Next
    If rs.State = adStateOpen Then rs.Close
    Set rs = Nothing
    Err.Clear
  End If

  cn.Close: Set cn = Nothing
  DbExecute = CLng(recordsAffected)
End Function

Function ArrayToObjects(data, fieldNames)
  Dim rows(), r, c, cols, i
  If IsEmpty(data) Then
    ArrayToObjects = Array()
    Exit Function
  End If

  cols = UBound(fieldNames) - LBound(fieldNames) + 1
  ReDim rows(UBound(data,2))
  For r = 0 To UBound(data,2)
    Dim o : Set o = Server.CreateObject("Scripting.Dictionary")
    For c = 0 To UBound(fieldNames)
      o(fieldNames(c)) = data(c, r)
    Next
    Set rows(r) = o
  Next
  ArrayToObjects = rows
End Function
%>
