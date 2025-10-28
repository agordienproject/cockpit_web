import { useState, useEffect } from 'react';
import {
  Card,
  Title,
  Text,
  Tab,
  TabList,
  TabGroup,
  TabPanel,
  TabPanels,
  Grid,
  BarChart,
  DonutChart,
  LineChart,
  Legend,
  Metric,
  Table,
  TableHead,
  TableRow,
  TableHeaderCell,
  TableBody,
  TableCell,
  DatePicker,
  Select,
  SelectItem
} from '@tremor/react';
import { dashboardService } from '../services';

export default function Dashboard() {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [validationTimes, setValidationTimes] = useState([]);
  const [validationLoading, setValidationLoading] = useState(false);
  const [validationError, setValidationError] = useState(null);
  const [validationFrom, setValidationFrom] = useState(null);
  const [validationTo, setValidationTo] = useState(null);
  const [validationGroupBy, setValidationGroupBy] = useState('day');

  useEffect(() => {
    fetchDashboardData();
  }, []);

  useEffect(() => {
    fetchValidationTimes(validationFrom, validationTo, validationGroupBy);
  }, [validationFrom, validationTo, validationGroupBy]);

  const mapStatsKeys = (data) => ({
    totalInspections: Number(data.total_inspections) || 0,
    validatedInspections: Number(data.validated_inspections) || 0,
    pendingInspections: Number(data.pending_inspections) || 0,
    rejectedInspections: Number(data.deleted_inspections) || 0,
    uniquePiecesInspected: Number(data.unique_pieces_inspected) || 0,
    inspectionsWithDents: Number(data.inspections_with_dents) || 0,
    inspectionsWithCorrosions: Number(data.inspections_with_corrosions) || 0,
    inspectionsWithScratches: Number(data.inspections_with_scratches) || 0,
  });

  const mapDailyTrends = (data) =>
    (data || []).map(item => ({
      date: item.inspection_day,
      total: Number(item.total_inspections) || 0,
      validated: Number(item.validated_count) || 0,
      dents: Number(item.dents_found) || 0,
      corrosions: Number(item.corrosions_found) || 0,
      scratches: Number(item.scratches_found) || 0,
    }));

  const mapInspectorPerformance = (data) =>
    (data || []).map(item => {
      const total = Number(item.total_inspections) || 0;
      const validated = Number(item.validated_inspections) || 0;
      return {
        ...item,
        inspector: `${item.first_name} ${item.last_name}`,
        total_inspections: total,
        validated_inspections: validated,
        unique_pieces_inspected: Number(item.unique_pieces_inspected) || 0,
        validationRate: total > 0 ? Math.round((validated / total) * 100) : 0,
      };
    });

  const fetchDashboardData = async () => {
    try {
      const [inspectionStats, dailyTrends, pieceCurrentState, inspectorPerformance] = await Promise.all([
        dashboardService.getInspectionStats(),
        dashboardService.getDailyTrends(),
        dashboardService.getPieceCurrentState(),
        dashboardService.getInspectorPerformance()
      ]);
      setStats({
        ...mapStatsKeys(inspectionStats),
        trends: {
          daily: mapDailyTrends(dailyTrends),
          inspectorPerformance: mapInspectorPerformance(inspectorPerformance),
          inspectorEfficiency: mapInspectorPerformance(inspectorPerformance),
          validationTimes: mapDailyTrends(dailyTrends)
        },
        pieceData: pieceCurrentState
      });
    } catch (err) {
      setError(err.message || 'Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  };

  const fetchValidationTimes = async (from, to, groupBy) => {
    setValidationLoading(true);
    setValidationError(null);
    try {
      const data = await dashboardService.getValidationTimeDistribution({ from, to, groupBy });
      setValidationTimes(data.map(item => ({
        date: item.validation_period || item.validation_day,
        avg: Number(item.avg_validation_minutes),
        min: Number(item.min_validation_minutes),
        max: Number(item.max_validation_minutes),
      })));
    } catch (err) {
      setValidationError(err.message || 'Failed to load validation time data');
    } finally {
      setValidationLoading(false);
    }
  };

  // For toggling series in Validation Time Distribution
  const [visibleValidationSeries, setVisibleValidationSeries] = useState(['avg', 'min', 'max']);
  const validationSeries = [
    { key: 'avg', label: 'Avg', color: 'blue' },
    { key: 'min', label: 'Min', color: 'emerald' },
    { key: 'max', label: 'Max', color: 'rose' },
  ];
  const handleToggleValidationSeries = (key) => {
    setVisibleValidationSeries((prev) =>
      prev.includes(key)
        ? prev.filter((k) => k !== key)
        : [...prev, key]
    );
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-lg">Loading dashboard data...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-red-600 text-lg">{error}</div>
      </div>
    );
  }

  if (!stats) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-lg">No data available</div>
      </div>
    );
  }

  return (
    <main className="p-4 md:p-10 w-full">
      <Title>Inspection Dashboard</Title>
      <Text>A comprehensive overview of inspection activities and metrics.</Text>

      <TabGroup className="mt-6">
        <TabList>
          <Tab>Overview</Tab>
          <Tab>Trends</Tab>
          <Tab>Performance</Tab>
        </TabList>
        
        <TabPanels>
          <TabPanel>
            <Grid numItemsMd={2} numItemsLg={3} className="gap-6 mt-6">
              <Card>
                <Title>Total Inspections</Title>
                <Metric>{stats.totalInspections || 0}</Metric>
                <DonutChart
                  className="mt-6"
                  data={[
                    { name: 'Validated', value: stats.validatedInspections || 0 },
                    { name: 'Pending', value: stats.pendingInspections || 0 },
                    { name: 'Rejected', value: stats.rejectedInspections || 0 },
                  ]}
                  category="value"
                  index="name"
                  colors={['emerald', 'yellow', 'rose']}
                />
                <Legend
                  className="mt-3"
                  categories={['Validated', 'Pending', 'Rejected']}
                  colors={['emerald', 'yellow', 'rose']}
                />
              </Card>

              <Card>
                <Title>Unique Pieces</Title>
                <Metric>{stats.uniquePiecesInspected || 0}</Metric>
                <BarChart
                  className="mt-6"
                  data={[
                    { name: 'With Dents', value: stats.inspectionsWithDents || 0 },
                    { name: 'With Corrosion', value: stats.inspectionsWithCorrosions || 0 },
                    { name: 'With Scratches', value: stats.inspectionsWithScratches || 0 },
                  ]}
                  index="name"
                  categories={['value']}
                  colors={['blue']}
                />
              </Card>

              <Card>
                <Title>Inspector Performance</Title>
                <Table className="mt-6">
                  <TableHead>
                    <TableRow>
                      <TableHeaderCell>Inspector</TableHeaderCell>
                      <TableHeaderCell>Total Inspections</TableHeaderCell>
                      <TableHeaderCell>Validated</TableHeaderCell>
                      <TableHeaderCell>Unique Pieces</TableHeaderCell>
                      <TableHeaderCell>Last Inspection</TableHeaderCell>
                      <TableHeaderCell>Efficiency (%)</TableHeaderCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {(stats.trends?.inspectorPerformance || []).map((inspector) => (
                      <TableRow key={inspector.id_user}>
                        <TableCell>{inspector.first_name} {inspector.last_name}</TableCell>
                        <TableCell>{inspector.total_inspections}</TableCell>
                        <TableCell>{inspector.validated_inspections}</TableCell>
                        <TableCell>{inspector.unique_pieces_inspected}</TableCell>
                        <TableCell>{inspector.last_inspection_date ? new Date(inspector.last_inspection_date).toLocaleDateString() : '-'}</TableCell>
                        <TableCell>{inspector.validationRate}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </Card>
            </Grid>
          </TabPanel>

          <TabPanel>
            <Grid numItemsMd={2} className="gap-6 mt-6">
              <Card>
                <Title>Daily Inspection Trends</Title>
                <LineChart
                  className="mt-6"
                  data={stats.trends?.daily || []}
                  index="date"
                  categories={['total', 'validated']}
                  colors={['blue', 'green']}
                />
              </Card>

              <Card>
                <Title>Issue Distribution</Title>
                <DonutChart
                  className="mt-6"
                  data={[
                    { name: 'Dents', value: stats.inspectionsWithDents || 0 },
                    { name: 'Corrosion', value: stats.inspectionsWithCorrosions || 0 },
                    { name: 'Scratches', value: stats.inspectionsWithScratches || 0 },
                  ]}
                  category="value"
                  index="name"
                  colors={['blue', 'cyan', 'indigo']}
                />
                <Legend
                  className="mt-3"
                  categories={['Dents', 'Corrosion', 'Scratches']}
                  colors={['blue', 'cyan', 'indigo']}
                />
              </Card>
            </Grid>
          </TabPanel>

          <TabPanel>
            <Grid numItemsMd={2} className="gap-6 mt-6">
              <Card>
                <Title>Inspector Efficiency</Title>
                <BarChart
                  className="mt-6"
                  data={stats.trends?.inspectorEfficiency || []}
                  index="inspector"
                  categories={['total_inspections', 'validationRate']}
                  colors={['violet', 'indigo']}
                  yAxisWidth={40}
                  showGridLines
                  referenceLines={[{ y: 100, color: 'red', label: '100%' }]}
                />
              </Card>

              <Card>
                <Title>Validation Time Distribution</Title>
                <div className="flex flex-wrap gap-4 mb-4">
                  <DatePicker
                    value={validationFrom}
                    onValueChange={setValidationFrom}
                    placeholder="Min date"
                  />
                  <DatePicker
                    value={validationTo}
                    onValueChange={setValidationTo}
                    placeholder="Max date"
                  />
                  <Select value={validationGroupBy} onValueChange={setValidationGroupBy}>
                    <SelectItem value="day">Day</SelectItem>
                    <SelectItem value="week">Week</SelectItem>
                    <SelectItem value="month">Month</SelectItem>
                    <SelectItem value="year">Year</SelectItem>
                  </Select>
                </div>
                {/* Custom Legend for toggling series */}
                <div className="flex gap-4 mb-2">
                  {validationSeries.map((series) => (
                    <button
                      key={series.key}
                      onClick={() => handleToggleValidationSeries(series.key)}
                      style={{
                        color: visibleValidationSeries.includes(series.key) ? series.color : '#aaa',
                        fontWeight: visibleValidationSeries.includes(series.key) ? 'bold' : 'normal',
                        textDecoration: visibleValidationSeries.includes(series.key) ? 'none' : 'line-through',
                        border: 'none',
                        background: 'none',
                        cursor: 'pointer',
                      }}
                    >
                      <span style={{
                        display: 'inline-block',
                        width: 12,
                        height: 12,
                        backgroundColor: visibleValidationSeries.includes(series.key) ? series.color : '#eee',
                        borderRadius: '50%',
                        marginRight: 6,
                        border: '1px solid #ccc',
                        verticalAlign: 'middle',
                      }} />
                      {series.label}
                    </button>
                  ))}
                </div>
                {validationLoading ? (
                  <div>Loading validation time data...</div>
                ) : validationError ? (
                  <div className="text-red-600">{validationError}</div>
                ) : (
                  <LineChart
                    className="mt-6"
                    data={validationTimes}
                    index="date"
                    categories={visibleValidationSeries}
                    colors={validationSeries.filter(s => visibleValidationSeries.includes(s.key)).map(s => s.color)}
                    yAxisWidth={60}
                  />
                )}
              </Card>
            </Grid>
          </TabPanel>
        </TabPanels>
      </TabGroup>
    </main>
  );
}