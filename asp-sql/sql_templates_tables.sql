-- SQL Server DDL for template storage and template data used for mail merge

IF NOT EXISTS (SELECT 1 FROM sys.tables WHERE name = 'Templates')
BEGIN
    CREATE TABLE dbo.Templates (
        TemplateID     INT IDENTITY(1,1) PRIMARY KEY,
        TemplateName   NVARCHAR(200) NOT NULL,
        TemplatePath   NVARCHAR(500) NOT NULL,  -- UNC path or relative path to .dotx file
        IsActive       BIT NOT NULL CONSTRAINT DF_Templates_IsActive DEFAULT (1),
        CreatedAt      DATETIME2(0) NOT NULL CONSTRAINT DF_Templates_CreatedAt DEFAULT (SYSUTCDATETIME()),
        CreatedBy      NVARCHAR(100) NULL
    );
    CREATE UNIQUE INDEX UX_Templates_Name ON dbo.Templates(TemplateName);
END
GO

IF NOT EXISTS (SELECT 1 FROM sys.tables WHERE name = 'TemplateData')
BEGIN
    CREATE TABLE dbo.TemplateData (
        TemplateDataID INT IDENTITY(1,1) PRIMARY KEY,
        TemplateID     INT NOT NULL CONSTRAINT FK_TemplateData_Templates FOREIGN KEY REFERENCES dbo.Templates(TemplateID),
        StartDate      DATE NULL,
        Title          NVARCHAR(200) NULL,
        UserName       NVARCHAR(200) NULL,
        CreatedAt      DATETIME2(0) NOT NULL CONSTRAINT DF_TemplateData_CreatedAt DEFAULT (SYSUTCDATETIME()),
        CreatedBy      NVARCHAR(100) NULL
    );
    CREATE INDEX IX_TemplateData_TemplateID ON dbo.TemplateData(TemplateID);
END
GO

-- Example query a Word mail merge could use (filtering by TemplateDataID):
--   SELECT TemplateDataID, StartDate, Title, UserName FROM dbo.TemplateData WHERE TemplateDataID = @ID;
-- Word's built‑in filtering can store a filter (TemplateDataID = 123) in the merge document; for dynamic ID based automation
-- an intermediate process (ASP page generating a one‑row text/CSV file) can be used.
