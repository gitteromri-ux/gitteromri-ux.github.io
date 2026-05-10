------------------------------------------------------------
-- 1. ONE-TIME HISTORICAL BACKFILL
------------------------------------------------------------
-- NOTES
-- 1. Reads source tables from:
--    dwh_et.dbo
--    dwh_et.CallCenter
--
-- 2. Writes final table to:
--    [HelpDB].PowerBI.fact_EmployeesRank_NewLogic
--
-- 3. Logic is based on the WEEKLY pattern:
--    - no ecommerce contacted logic
--    - uses #BaseKeys
--    - includes IsBelow2Months
--
-- 4. Runs all Sundays starting from 2023-12-31
--    until the last completed Sunday
------------------------------------------------------------

set nocount on;
set datefirst 7;

declare @BackfillFrom date = '2023-12-31';
declare @Today date = cast(getdate() as date);
declare @LastSunday date;
declare @SnapshotSunday date;
declare @WindowStart date;

-- last completed Sunday
set @LastSunday = dateadd(day, 1 - datepart(weekday, @Today), @Today);

-- first snapshot Sunday = 2023-12-31
set @SnapshotSunday = @BackfillFrom;

drop table if exists [HelpDB].PowerBI.fact_EmployeesRank_NewLogic;

create table [HelpDB].PowerBI.fact_EmployeesRank_NewLogic
(
    EmployeeID int not null,
    [Date] date not null,
    gk_semester int not null,
    MainLanguageID int not null,
    AgeInMonth int null,
	AgeInWeeks int null,
    IsBelow2Months int null,
    NumOfCalls int null,
    NumOfContacted int null,
    NumOfReg int null,
    RegFromContacted decimal(18,12) null,
    RegFromCalls decimal(18,12) null,
    RankRegFromContacted int null,
    RankRegFromCalls int null
);

while @SnapshotSunday <= @LastSunday
begin
    set @WindowStart = dateadd(week, -10, @SnapshotSunday);

    print 'Running historical snapshot for Sunday = '
        + convert(varchar(10), @SnapshotSunday, 120)
        + ' | WindowStart = '
        + convert(varchar(10), @WindowStart, 120);

    ------------------------------------------------------------
    -- STEP 1: Build #ContactedTable
    ------------------------------------------------------------

    drop table if exists #ContactedTable;

    select  fl.SalePersonID as EmployeeID,
            ds.Category,
            fl.MainLanguageID,
            count(*) as NumOfContacted
    into #ContactedTable
    from dwh_et.dbo.fact_Leads fl
         inner join dwh_et.dbo.dmn_Semesters ds
            on fl.gk_semester = ds.gk_semester
         inner join dwh_et.dbo.dmn_LeadStatuses ls
            on ls.LeadStatusID = fl.LeadStatusID
    where fl.LeadActionID = 3 -- Contacted
      and fl.[Date] between @WindowStart and @SnapshotSunday
      and ls.IsQualityLead = 'Quality Lead'
    group by fl.SalePersonID, ds.Category, fl.MainLanguageID;

    ------------------------------------------------------------
    -- STEP 2: Build #RegTable
    ------------------------------------------------------------

    drop table if exists #RegTable;

    select  fo.EmployeeID,
            ds.Category,
            fo.MainLanguageID,
            count(*) as NumOfReg
    into #RegTable
    from dwh_et.dbo.fact_Orders fo
         inner join dwh_et.dbo.dmn_Semesters ds
            on fo.gk_semester = ds.gk_semester
    where fo.[Date] between @WindowStart and @SnapshotSunday
    group by fo.EmployeeID, ds.Category, fo.MainLanguageID;

    ------------------------------------------------------------
    -- STEP 3: Build #CallsTable
    ------------------------------------------------------------

    drop table if exists #CallsTable;

    select  fc.EmployeeID,
            ds.Category,
            fc.MainLanguageID,
            count(*) as NumOfCalls
    into #CallsTable
    from dwh_et.CallCenter.fact_CallCenterCalls fc
         inner join dwh_et.dbo.dmn_Semesters ds
            on fc.gk_semester = ds.gk_semester
    where fc.[Date] between @WindowStart and @SnapshotSunday
    group by fc.EmployeeID, ds.Category, fc.MainLanguageID;

    ------------------------------------------------------------
    -- STEP 4: Build #BaseKeys
    ------------------------------------------------------------

    drop table if exists #BaseKeys;

    select 
		EmployeeID,
        Category,
        MainLanguageID
    into #BaseKeys
    from
    (
        select EmployeeID, Category, MainLanguageID from #ContactedTable
        union
        select EmployeeID, Category, MainLanguageID from #RegTable
		union
        select EmployeeID, Category, MainLanguageID from #CallsTable
    ) x;

    ------------------------------------------------------------
    -- STEP 5: Build #RegContactedTable
    ------------------------------------------------------------

    drop table if exists #RegContactedTable;

    select
        bk.EmployeeID,
        @SnapshotSunday as [Date],
        bk.Category,
        bk.MainLanguageID,
        datediff(mm, dr.StartWorkingDate, @SnapshotSunday) as AgeInMonth,
		datediff(ww, dr.StartWorkingDate, @SnapshotSunday) as AgeInWeeks,
        case when datediff(dd, dr.StartWorkingDate, @SnapshotSunday) <= 60 then 1 else 0 end as IsBelow2Months,
        coalesce(ca.NumOfCalls, 0) as NumOfCalls,
        coalesce(c.NumOfContacted, 0) as NumOfContacted,
        coalesce(r.NumOfReg, 0) as NumOfReg,
        coalesce(case when coalesce(c.NumOfContacted,0)=0 then 0 else 1.0 * r.NumOfReg / c.NumOfContacted end,0) as RegFromContacted,
        coalesce(case when coalesce(ca.NumOfCalls,0)=0 then 0 else 1.0 * r.NumOfReg / ca.NumOfCalls end,0) as RegFromCalls
    into #RegContactedTable
    from #BaseKeys bk
         LEFT join #ContactedTable c
            on bk.EmployeeID = c.EmployeeID
           and bk.Category = c.Category
           and bk.MainLanguageID = c.MainLanguageID
         LEFT join #RegTable r
            on bk.EmployeeID = r.EmployeeID
           and bk.Category = r.Category
           and bk.MainLanguageID = r.MainLanguageID
         LEFT join #CallsTable ca
            on bk.EmployeeID = ca.EmployeeID
           and bk.Category = ca.Category
           and bk.MainLanguageID = ca.MainLanguageID
         inner join dwh_et.dbo.dmn_Representatives dr
            on dr.EmployeeID = bk.EmployeeID
    where dr.EmployeeID in (select distinct EmployeeID from dwh_et.dbo.fact_EmployeesRank fe where fe.Date = @SnapshotSunday)
	--dr.Department = 'Sales'
      --and dr.Team = 'New';
------------------------------------------------------------
-- STEP 6: Build #EmployeeRankTable
-- Balanced ranking by contacted / calls volume
------------------------------------------------------------

drop table if exists #EmployeeRankTable;

;with RankedBase as
(
    select
        rct.*,

        sum(rct.NumOfContacted) over (
            partition by rct.[Date], rct.Category, rct.MainLanguageID
        ) as TotalContactedInGroup,

        sum(rct.NumOfContacted) over (
            partition by rct.[Date], rct.Category, rct.MainLanguageID
            order by
                rct.RegFromContacted,
                rct.NumOfReg,
                rct.EmployeeID
            rows between unbounded preceding and current row
        ) as CumContactedByQuality,

        sum(rct.NumOfCalls) over (
            partition by rct.[Date], rct.Category, rct.MainLanguageID
        ) as TotalCallsInGroup,

        sum(rct.NumOfCalls) over (
            partition by rct.[Date], rct.Category, rct.MainLanguageID
            order by
                rct.RegFromCalls,
                rct.NumOfReg,
                rct.EmployeeID
            rows between unbounded preceding and current row
        ) as CumCallsByQuality

    from #RegContactedTable rct
)

select
    EmployeeID,
    [Date],
    Category,
    MainLanguageID,
    AgeInMonth,
    AgeInWeeks,
    IsBelow2Months,
    NumOfCalls,
    NumOfContacted,
    NumOfReg,
    RegFromContacted,
    RegFromCalls,

    case
        when NumOfContacted = 0 then -1
        when TotalContactedInGroup = 0 then -1

        when 1.0 * (CumContactedByQuality - NumOfContacted / 2.0)
             / TotalContactedInGroup <= 0.25 then 1

        when 1.0 * (CumContactedByQuality - NumOfContacted / 2.0)
             / TotalContactedInGroup <= 0.50 then 2

        when 1.0 * (CumContactedByQuality - NumOfContacted / 2.0)
             / TotalContactedInGroup <= 0.75 then 3

        else 4
    end as RankRegFromContacted,

    case
        when NumOfCalls = 0 then -1
        when TotalCallsInGroup = 0 then -1

        when 1.0 * (CumCallsByQuality - NumOfCalls / 2.0)
             / TotalCallsInGroup <= 0.25 then 1

        when 1.0 * (CumCallsByQuality - NumOfCalls / 2.0)
             / TotalCallsInGroup <= 0.50 then 2

        when 1.0 * (CumCallsByQuality - NumOfCalls / 2.0)
             / TotalCallsInGroup <= 0.75 then 3

        else 4
    end as RankRegFromCalls

into #EmployeeRankTable
from RankedBase;

    ------------------------------------------------------------
    -- STEP 7: Insert that Sunday snapshot
    ------------------------------------------------------------

INSERT INTO [HelpDB].PowerBI.fact_EmployeesRank_NewLogic
(
    EmployeeID,
    [Date],
    gk_semester,
    MainLanguageID,
    AgeInMonth,
    AgeInWeeks,
    IsBelow2Months,
    NumOfCalls,
    NumOfContacted,
    NumOfReg,
    RegFromContacted,
    RegFromCalls,
    RankRegFromContacted,
    RankRegFromCalls
)
SELECT
    EmployeeID,
    [Date],
	CASE
		WHEN Category = 'Biblical Related'  THEN 330
		WHEN Category = 'Hebrew Related'    THEN 327
		WHEN Category = 'Langaroo'          THEN 1044
		WHEN Category = 'Popular Languages' THEN 2083
		WHEN Category = 'Coding'            THEN 652
		ELSE -1
	END AS gk_semester,
    MainLanguageID,
    AgeInMonth,
    AgeInWeeks,
    IsBelow2Months,
    NumOfCalls,
    NumOfContacted,
    NumOfReg,
    RegFromContacted,
    RegFromCalls,
    RankRegFromContacted,
    RankRegFromCalls
FROM #EmployeeRankTable;

SET @SnapshotSunday = DATEADD(WEEK, 1, @SnapshotSunday);
END;

------------------------------------------------------------
-- QA
------------------------------------------------------------
/*
select *
from [HelpDB].PowerBI.fact_EmployeesRank_NewLogic
order by [Date] desc, Category, MainLanguageID, EmployeeID;
*/