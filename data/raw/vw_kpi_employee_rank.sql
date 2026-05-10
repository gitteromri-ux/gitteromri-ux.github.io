CREATE OR ALTER VIEW vw_kpi_employee_rank AS

WITH cte AS
(
    --------------------------------------------------
    -- contacted
    --------------------------------------------------
    SELECT
        CAST(fl.[Date] AS date) AS [Date],
        CASE
            WHEN ds.Category = 'Biblical Related'  THEN 330
            WHEN ds.Category = 'Hebrew Related'    THEN 327
            WHEN ds.Category = 'Langaroo'          THEN 1044
            WHEN ds.Category = 'Popular Languages' THEN 2083
            WHEN ds.Category = 'Coding'            THEN 652
            ELSE -1
        END AS gk_semester,
        fl.MainLanguageID,
        fl.SalePersonID AS EmployeeID,
        SUM(CASE WHEN fl.LeadActionID = 3 THEN fl.LeadCounter ELSE 0 END) AS Contacted,
        0 AS Acquisitions,
        0 AS Orders,
        0 AS ActualStatCRMCourseSOV,
        0 AS StatSOVCRM,
        0 AS UpsalesAmount,
        0 AS Calls
    FROM [dwh_et].[dbo].[fact_Leads] fl
    INNER JOIN [dwh_et].[dbo].[dmn_Semesters] ds
        ON ds.gk_semester = fl.gk_semester
    INNER JOIN [dwh_et].[dbo].[dmn_LeadStatuses] dls
        ON dls.LeadStatusID = fl.LeadStatusID
    WHERE CAST(fl.[Date] AS date) >= '2024-01-01'
      AND CAST(fl.[Date] AS date) < CAST(GETDATE() AS date)
      AND dls.LeadType = 'Quality'
      AND fl.LeadActionID = 3
    GROUP BY
        CAST(fl.[Date] AS date),
        CASE
            WHEN ds.Category = 'Biblical Related'  THEN 330
            WHEN ds.Category = 'Hebrew Related'    THEN 327
            WHEN ds.Category = 'Langaroo'          THEN 1044
            WHEN ds.Category = 'Popular Languages' THEN 2083
            WHEN ds.Category = 'Coding'            THEN 652
            ELSE -1
        END,
        fl.MainLanguageID,
        fl.SalePersonID

    UNION ALL

    --------------------------------------------------
    -- acquisitions
    --------------------------------------------------
    SELECT
        CAST(fa.[Date] AS date) AS [Date],
        CASE
            WHEN ds.Category = 'Biblical Related'  THEN 330
            WHEN ds.Category = 'Hebrew Related'    THEN 327
            WHEN ds.Category = 'Langaroo'          THEN 1044
            WHEN ds.Category = 'Popular Languages' THEN 2083
            WHEN ds.Category = 'Coding'            THEN 652
            ELSE -1
        END AS gk_semester,
        fa.MainLanguageID,
        fa.EmployeeID,
        0 AS Contacted,
        SUM(ISNULL(fa.StudentCounter, 0)) AS Acquisitions,
        0 AS Orders,
        0 AS ActualStatCRMCourseSOV,
        0 AS StatSOVCRM,
        0 AS UpsalesAmount,
        0 AS Calls
    FROM [dwh_et].[dbo].[fact_Acquisitions] fa
    INNER JOIN [dwh_et].[dbo].[dmn_Semesters] ds
        ON ds.gk_semester = fa.gk_semester
    INNER JOIN [dwh_et].[dbo].[dmn_OrderTypes] dot
        ON dot.SubOrderTypeID = fa.FirstSubOrderTypeID
    WHERE CAST(fa.[Date] AS date) >= '2024-01-01'
      AND CAST(fa.[Date] AS date) < CAST(GETDATE() AS date)
      AND dot.OrderTypeName = 'New'
    GROUP BY
        CAST(fa.[Date] AS date),
        CASE
            WHEN ds.Category = 'Biblical Related'  THEN 330
            WHEN ds.Category = 'Hebrew Related'    THEN 327
            WHEN ds.Category = 'Langaroo'          THEN 1044
            WHEN ds.Category = 'Popular Languages' THEN 2083
            WHEN ds.Category = 'Coding'            THEN 652
            ELSE -1
        END,
        fa.MainLanguageID,
        fa.EmployeeID

    UNION ALL

    --------------------------------------------------
    -- orders
    --------------------------------------------------
    SELECT
        CAST(fo.[Date] AS date) AS [Date],
        CASE
            WHEN ds.Category = 'Biblical Related'  THEN 330
            WHEN ds.Category = 'Hebrew Related'    THEN 327
            WHEN ds.Category = 'Langaroo'          THEN 1044
            WHEN ds.Category = 'Popular Languages' THEN 2083
            WHEN ds.Category = 'Coding'            THEN 652
            ELSE -1
        END AS gk_semester,
        fo.MainLanguageID,
        fo.EmployeeID,
        0 AS Contacted,
        0 AS Acquisitions,
        SUM(ISNULL(fo.OrderCounter, 0)) AS Orders,
        SUM(ISNULL(fo.ActualStatCRMCourseSOV, 0)) AS ActualStatCRMCourseSOV,
        SUM(ISNULL(fo.StatSOVCRM, 0)) AS StatSOVCRM,
        0 AS UpsalesAmount,
        0 AS Calls
    FROM [dwh_et].[dbo].[fact_Orders] fo
    INNER JOIN [dwh_et].[dbo].[dmn_Semesters] ds
        ON ds.gk_semester = fo.gk_semester
    INNER JOIN [dwh_et].[dbo].[dmn_OrderTypes] dot
        ON dot.SubOrderTypeID = fo.SubOrderTypeID
    WHERE CAST(fo.[Date] AS date) >= '2024-01-01'
      AND CAST(fo.[Date] AS date) < CAST(GETDATE() AS date)
      AND dot.OrderTypeName = 'New'
    GROUP BY
        CAST(fo.[Date] AS date),
        CASE
            WHEN ds.Category = 'Biblical Related'  THEN 330
            WHEN ds.Category = 'Hebrew Related'    THEN 327
            WHEN ds.Category = 'Langaroo'          THEN 1044
            WHEN ds.Category = 'Popular Languages' THEN 2083
            WHEN ds.Category = 'Coding'            THEN 652
            ELSE -1
        END,
        fo.MainLanguageID,
        fo.EmployeeID

    UNION ALL

    --------------------------------------------------
    -- upsales
    --------------------------------------------------
    SELECT
        CAST(fp.[Date] AS date) AS [Date],
        CASE
            WHEN ds.Category = 'Biblical Related'  THEN 330
            WHEN ds.Category = 'Hebrew Related'    THEN 327
            WHEN ds.Category = 'Langaroo'          THEN 1044
            WHEN ds.Category = 'Popular Languages' THEN 2083
            WHEN ds.Category = 'Coding'            THEN 652
            ELSE -1
        END AS gk_semester,
        fp.MainLanguageID,
        fp.EmployeeID,
        0 AS Contacted,
        0 AS Acquisitions,
        0 AS Orders,
        0 AS ActualStatCRMCourseSOV,
        0 AS StatSOVCRM,
        SUM(ISNULL(fp.UpsalesAmount, 0)) AS UpsalesAmount,
        0 AS Calls
    FROM [dwh_et].SAP.[fact_SAP] fp
    INNER JOIN [dwh_et].[dbo].[dmn_Semesters] ds
        ON ds.gk_semester = fp.gk_semester
    INNER JOIN [dwh_et].[dbo].[dmn_OrderTypes] dot
        ON dot.SubOrderTypeID = fp.SubOrderTypeID
    WHERE CAST(fp.[Date] AS date) >= '2024-01-01'
      AND CAST(fp.[Date] AS date) < CAST(GETDATE() AS date)
      AND dot.OrderTypeName = 'New'
    GROUP BY
        CAST(fp.[Date] AS date),
        CASE
            WHEN ds.Category = 'Biblical Related'  THEN 330
            WHEN ds.Category = 'Hebrew Related'    THEN 327
            WHEN ds.Category = 'Langaroo'          THEN 1044
            WHEN ds.Category = 'Popular Languages' THEN 2083
            WHEN ds.Category = 'Coding'            THEN 652
            ELSE -1
        END,
        fp.MainLanguageID,
        fp.EmployeeID

    UNION ALL

    --------------------------------------------------
    -- calls
    --------------------------------------------------
    SELECT
        CAST(fcc.[Date] AS date) AS [Date],
        CASE
            WHEN ds.Category = 'Biblical Related'  THEN 330
            WHEN ds.Category = 'Hebrew Related'    THEN 327
            WHEN ds.Category = 'Langaroo'          THEN 1044
            WHEN ds.Category = 'Popular Languages' THEN 2083
            WHEN ds.Category = 'Coding'            THEN 652
            ELSE -1
        END AS gk_semester,
        fcc.MainLanguageID,
        fcc.EmployeeID,
        0 AS Contacted,
        0 AS Acquisitions,
        0 AS Orders,
        0 AS ActualStatCRMCourseSOV,
        0 AS StatSOVCRM,
        0 AS UpsalesAmount,
        SUM(ISNULL(fcc.CallCounter, 0)) AS Calls
    FROM [dwh_et].CallCenter.[fact_CallCenterCalls] fcc
    INNER JOIN [dwh_et].[dbo].[dmn_Semesters] ds
        ON ds.gk_semester = fcc.gk_semester
    WHERE CAST(fcc.[Date] AS date) >= '2024-01-01'
      AND CAST(fcc.[Date] AS date) < CAST(GETDATE() AS date)
    GROUP BY
        CAST(fcc.[Date] AS date),
        CASE
            WHEN ds.Category = 'Biblical Related'  THEN 330
            WHEN ds.Category = 'Hebrew Related'    THEN 327
            WHEN ds.Category = 'Langaroo'          THEN 1044
            WHEN ds.Category = 'Popular Languages' THEN 2083
            WHEN ds.Category = 'Coding'            THEN 652
            ELSE -1
        END,
        fcc.MainLanguageID,
        fcc.EmployeeID
),

cte_agg AS
(
    SELECT
        [Date],
        DATEADD(
            day,
            -(DATEDIFF(day, '19000107', [Date]) % 7),
            [Date]
        ) AS RankDate,
        gk_semester,
        MainLanguageID,
        EmployeeID,
        SUM(Contacted) AS Contacted,
        SUM(Acquisitions) AS Acquisitions,
        SUM(Orders) AS Orders,
        SUM(ActualStatCRMCourseSOV) AS ActualStatCRMCourseSOV,
        SUM(StatSOVCRM) AS StatSOVCRM,
        SUM(UpsalesAmount) AS UpsalesAmount,
        SUM(Calls) AS Calls
    FROM cte
    GROUP BY
        [Date],
        gk_semester,
        MainLanguageID,
        EmployeeID
    HAVING
        SUM(Contacted) <> 0
        OR SUM(Acquisitions) <> 0
        OR SUM(Orders) <> 0
        OR SUM(ActualStatCRMCourseSOV) <> 0
        OR SUM(StatSOVCRM) <> 0
        OR SUM(UpsalesAmount) <> 0
        OR SUM(Calls) <> 0
)

SELECT
    c.[Date],
    c.RankDate,
    ds.Category AS SemesterCategory,
    dl.LanguageName,
    c.EmployeeID,
    dr.EmployeeName,
    c.Contacted,
    c.Acquisitions,
    c.Orders,
    c.ActualStatCRMCourseSOV,
    c.StatSOVCRM,
    c.UpsalesAmount,
    c.Calls,
    f.RankRegFromContacted,
    f.RankRegFromCalls
FROM cte_agg c
INNER JOIN [dwh_et].[dbo].[dmn_Semesters] ds
    ON ds.gk_semester = c.gk_semester
INNER JOIN [dwh_et].[dbo].[dmn_Languages] dl
    ON dl.LanguageID = c.MainLanguageID
INNER JOIN [dwh_et].[dbo].[dmn_Representatives] dr
    ON dr.EmployeeID = c.EmployeeID
LEFT JOIN HelpDB.PowerBI.[fact_EmployeesRank_NewLogic] f
    ON f.EmployeeID = c.EmployeeID
   AND f.MainLanguageID = c.MainLanguageID
   AND f.gk_semester = c.gk_semester
   AND CAST(f.[Date] AS date) = c.RankDate
WHERE EXISTS (--only brings rep ='sales' ,team ='new' as merav kept it originally for each Sunday 
    SELECT 1
    FROM [dwh_et].[dbo].[fact_EmployeesRank] fe
    WHERE fe.EmployeeID = c.EmployeeID
      AND fe.[Date] = c.RankDate
);

/*
SELECT *
FROM vw_kpi_employee_rank
ORDER BY
    [Date],
    SemesterCategory,
    LanguageName,
    EmployeeID;
*/

/*
SELECT
    RankRegFromCalls,
	sum(calls) calls,
	sum(Contacted) Contacted,
	sum(Orders) Orders,
    SUM(Orders) * 1.0 / NULLIF(SUM(Contacted), 0) AS OrdersFromContactedRate
FROM vw_kpi_employee_rank
where SemesterCategory='Hebrew Related' and LanguageName='English'
GROUP BY
    RankRegFromCalls
	order by RankRegFromCalls;

*/


SELECT
    RankRegFromCalls,
	sum(calls) calls,
	sum(Contacted) Contacted,
	sum(Orders) Orders,
	SUM(Orders) * 100.0 / NULLIF(SUM(calls), 0) AS OrdersFromCallsRate,
    SUM(Orders) * 100.0 / NULLIF(SUM(Contacted), 0) AS OrdersFromContactedRate
FROM vw_kpi_employee_rank
where SemesterCategory='Hebrew Related' and LanguageName='Spanish'
GROUP BY
    RankRegFromCalls
	order by RankRegFromCalls;

