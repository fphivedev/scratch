<%
' /inc/db.asp
Const adCmdText = 1
Const adOpenForwardOnly = 0
Const adLockReadOnly = 1

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
      ' Some providers expect parameter names without the leading '@'.
      Dim paramName : paramName = p(0)
      If Len(paramName) > 0 Then
        If Left(paramName,1) = "@" Then paramName = Mid(paramName,2)
      End If
      cmd.Parameters.Append cmd.CreateParameter(paramName, p(2), 1, p(3), p(1))
      ' 1 = adParamInput
    Next
  End If

  Dim rs : Set rs = cmd.Execute()
  Dim data : data = rs.GetRows() ' fast extraction
  rs.Close: Set rs = Nothing
  cn.Close: Set cn = Nothing

  Set DbQuery = ArrayToObjects(data, cmd) ' convert to [{col:val}, ...]
End Function

Function ArrayToObjects(data, cmd)
  Dim rows(), r, c, cols, i
  If IsEmpty(data) Then
    ArrayToObjects = Array()
    Exit Function
  End If
  cols = cmd.Fields.Count
  ReDim rows(UBound(data,2))
  For r = 0 To UBound(data,2)
    Dim o : Set o = Server.CreateObject("Scripting.Dictionary")
    For c = 0 To cols-1
      o(cmd.Fields(c).Name) = data(c, r)
    Next
    Set rows(r) = o
  Next
  ArrayToObjects = rows
End Function
%>
