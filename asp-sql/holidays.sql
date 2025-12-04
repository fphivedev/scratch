DECLARE @StartDate date = '2025-12-01';
DECLARE @DaysToAdd int  = 28;

;WITH
-- Simple numbers/tally (1..N) without system tables
Numbers AS (
    SELECT 1 AS n
    UNION ALL
    SELECT n + 1
    FROM Numbers
    WHERE n < 1000          -- <-- increase if you might need to look further ahead
),

-- Expand HolidayRange rows into individual dates
HolidayDays AS (
    SELECT 
        HolidayStartDate,
        HolidayEndDate,
        HolidayStartDate AS HolidayDate
    FROM dbo.HolidayRange

    UNION ALL

    SELECT
        h.HolidayStartDate,
        h.HolidayEndDate,
        DATEADD(day, 1, h.HolidayDate)
    FROM HolidayDays h
    WHERE h.HolidayDate < h.HolidayEndDate
),

-- Future calendar days after @StartDate
FutureDates AS (
    SELECT
        DATEADD(day, n, @StartDate) AS d
    FROM Numbers
),

-- Keep only days that are NOT in any holiday range
ValidDates AS (
    SELECT 
        d,
        ROW_NUMBER() OVER (ORDER BY d) AS rn
    FROM (
        SELECT DISTINCT d
        FROM FutureDates fd
        WHERE NOT EXISTS (
            SELECT 1
            FROM HolidayDays hd
            WHERE hd.HolidayDate = fd.d
        )
    ) x
)

SELECT d AS AdjustedDate
FROM ValidDates
WHERE rn = @DaysToAdd
OPTION (MAXRECURSION 32767);   -- allow deep recursion for long holiday ranges
