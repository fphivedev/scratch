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
	  if p(2)=3 then
		cmd.Parameters.Append cmd.CreateParameter(p(0), p(2), 1, , cInt(p(1)))
	  else 	  
		cmd.Parameters.Append cmd.CreateParameter(p(0), p(2), 1, p(3), p(1))
	  end if 
      ' 1 = adParamInput
    Next
  End If

  Dim rs : Set rs = cmd.Execute()
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

  Set DbQuery = ArrayToObjects(data, fieldNames) ' convert to [{col:val}, ...]
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
