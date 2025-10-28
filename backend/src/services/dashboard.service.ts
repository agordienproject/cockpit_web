import { prismaPSQL } from "../prisma/client_psql";

// Get overall inspection statistics
export const getInspectionStats = async () => {
    console.log("Getting inspection stats");
    console.log("Inspection stats: ", await prismaPSQL.vW_INSPECTION_STATS.findFirst());
    return await prismaPSQL.vW_INSPECTION_STATS.findFirst();
};
// Get current state of all pieces
export const getCurrentPieceStates = async () => {
    return await prismaPSQL.vW_PIECE_CURRENT_STATE.findMany();
};

// Get inspector performance metrics
export const getInspectorPerformance = async () => {
    return await prismaPSQL.vW_INSPECTOR_PERFORMANCE.findMany();
};

// Get daily inspection trends
export const getDailyInspectionTrends = async (days: number = 30) => {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    return await prismaPSQL.vW_DAILY_INSPECTION_TRENDS.findMany({
        where: {
            inspection_day: {
                gte: startDate
            }
        },
        orderBy: {
            inspection_day: 'asc'
        }
    });
};

// Get piece history summary
export const getPieceHistorySummary = async () => {
    return await prismaPSQL.vW_PIECE_HISTORY_SUMMARY.findMany();
};

// Get piece history summary for a specific piece
export const getPieceHistorySummaryByRef = async (ref_piece: string) => {
    return await prismaPSQL.vW_PIECE_HISTORY_SUMMARY.findUnique({
        where: {
            ref_piece: ref_piece
        }
    });
};

// Get detailed piece history (all DIM_PIECE versions) for a specific piece
export const getPieceHistoryDetailByRef = async (ref_piece: string) => {
    return await prismaPSQL.dIM_PIECE.findMany({
        where: { ref_piece, deleted: false },
        orderBy: { start_date: 'asc' },
    });
};

// Get validation time distribution for inspections
export const getValidationTimeDistribution = async (
    from?: string,
    to?: string,
    groupBy: 'day' | 'week' | 'month' | 'year' = 'day'
) => {
    let groupByClause = '';
    let dateCol = 'validation_date';
    switch (groupBy) {
        case 'week':
        dateCol = 'validation_date';
            console.log('Grouping by week');
            groupByClause = `DATE_TRUNC('week', ${dateCol})::date`;
            break;
        case 'month':
            console.log('Grouping by month');
            groupByClause = `DATE_TRUNC('month', ${dateCol})::date`;
            break;
        case 'year':
            console.log('Grouping by year');
            groupByClause = `DATE_TRUNC('year', ${dateCol})::date`;
            break;
        default:
            console.log('Grouping by day');
            groupByClause = `DATE(${dateCol})`;
    }
    const where = [
        "inspection_status = 'VALIDATED'",
        'deleted = false',
        from ? `${dateCol} >= '${from}'` : null,
        to ? `${dateCol} <= '${to}'` : null
    ].filter(Boolean).join(' AND ');
    const query = `
    SELECT
      ${groupByClause} AS validation_period,
      COUNT(*) AS validated_count,
      AVG(EXTRACT(EPOCH FROM (validation_date - creation_date)) / 60) AS avg_validation_minutes,
      MIN(EXTRACT(EPOCH FROM (validation_date - creation_date)) / 60) AS min_validation_minutes,
      MAX(EXTRACT(EPOCH FROM (validation_date - creation_date)) / 60) AS max_validation_minutes
    FROM "FCT_INSPECTION"
    WHERE ${where}
    GROUP BY validation_period
    ORDER BY validation_period ASC;
  `;
    // @ts-ignore
    const result = await prismaPSQL.$queryRawUnsafe(query);
    return result;
};