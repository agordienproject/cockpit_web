import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Card,
  Title,
  BarChart,
  Table,
  TableHead,
  TableRow,
  TableHeaderCell,
  TableBody,
  TableCell,
  Badge,
  Button,
  DateRangePicker,
  Select,
  SelectItem,
  Metric,
  Grid,
  Col,
  Text,
  Divider,
} from '@tremor/react';
import { verifService, systemService } from '../services';

export default function SystemVerificationHistory() {
  const { systemId } = useParams();
  const navigate = useNavigate();
  const [verifications, setVerifications] = useState([]);
  const [systemInfo, setSystemInfo] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedVerif, setSelectedVerif] = useState(null);
  
  // Filters - Default to last 7 days
  const [dateRange, setDateRange] = useState(() => {
    const today = new Date();
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(today.getDate() - 7);
    return { from: sevenDaysAgo, to: today };
  });
  const [statusFilter, setStatusFilter] = useState('');
  const [showAllDates, setShowAllDates] = useState(false);

  useEffect(() => {
    fetchData();
  }, [systemId, dateRange, statusFilter, showAllDates]);

  const fetchData = async () => {
    setLoading(true);
    setError(null);
    try {
      const filters = {};
      if (!showAllDates) {
        if (dateRange?.from) filters.startDate = dateRange.from.toISOString();
        if (dateRange?.to) filters.endDate = dateRange.to.toISOString();
      }
      if (statusFilter && statusFilter !== 'ALL') filters.status = statusFilter;

      const [verifs, sysInfo] = await Promise.all([
        verifService.getSystemVerifications(systemId, filters),
        systemService.getSystemById(systemId),
      ]);

      setVerifications(verifs || []);
      setSystemInfo(sysInfo);
    } catch (err) {
      setError(err.message || 'Failed to load verification history');
    } finally {
      setLoading(false);
    }
  };

  // Prepare data for chart (grouped by date)
  const prepareChartData = () => {
    if (!verifications.length) return [];

    // Group by date and store verification IDs
    const grouped = verifications.reduce((acc, v) => {
      const date = new Date(v.creation_date).toLocaleDateString('fr-FR');
      if (!acc[date]) {
        acc[date] = { date, OK: 0, WARN: 0, ERROR: 0, verifs: [] };
      }
      acc[date][v.status] = (acc[date][v.status] || 0) + 1;
      acc[date].verifs.push(v);
      return acc;
    }, {});

    return Object.values(grouped);
  };

  // Handle chart bar click
  const handleChartClick = (data) => {
    if (data?.verifs && data.verifs.length > 0) {
      // If only one verification, show it directly
      if (data.verifs.length === 1) {
        setSelectedVerif(data.verifs[0]);
      } else {
        // If multiple, show the first one (you could also show a list)
        setSelectedVerif(data.verifs[0]);
      }
    }
  };

  // Calculate statistics
  const stats = {
    total: verifications.length,
    ok: verifications.filter(v => v.status === 'OK').length,
    warn: verifications.filter(v => v.status === 'WARN').length,
    error: verifications.filter(v => v.status === 'ERROR').length,
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'OK': return 'green';
      case 'WARN': return 'yellow';
      case 'ERROR': return 'red';
      default: return 'gray';
    }
  };

  if (loading) return <div className="flex items-center justify-center min-h-screen">Loading...</div>;

  return (
    <main className="p-4 md:p-10 w-full">
      <div className="flex justify-between items-center mb-6">
        <div>
          <Title>Historique de Vérification</Title>
          {systemInfo && (
            <Text className="mt-2">
              Système: <span className="font-semibold">{systemInfo.name_sys}</span>
              {systemInfo.version_sys && <span className="ml-2 text-gray-500">v{systemInfo.version_sys}</span>}
            </Text>
          )}
        </div>
        <Button onClick={() => navigate('/systems')} variant="secondary">
          Retour aux systèmes
        </Button>
      </div>

      {error && (
        <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-md">
          <div className="text-red-600 text-sm">{error}</div>
        </div>
      )}

      {/* Statistics Cards */}
      <Grid numItemsSm={2} numItemsLg={4} className="gap-6 mb-6">
        <Card decoration="top" decorationColor="indigo">
          <Text>Total Vérifications</Text>
          <Metric>{stats.total}</Metric>
        </Card>
        <Card decoration="top" decorationColor="green">
          <Text>OK</Text>
          <Metric>{stats.ok}</Metric>
          <Text className="text-sm text-gray-500">
            {stats.total > 0 ? ((stats.ok / stats.total) * 100).toFixed(1) : 0}%
          </Text>
        </Card>
        <Card decoration="top" decorationColor="yellow">
          <Text>WARN</Text>
          <Metric>{stats.warn}</Metric>
          <Text className="text-sm text-gray-500">
            {stats.total > 0 ? ((stats.warn / stats.total) * 100).toFixed(1) : 0}%
          </Text>
        </Card>
        <Card decoration="top" decorationColor="red">
          <Text>ERROR</Text>
          <Metric>{stats.error}</Metric>
          <Text className="text-sm text-gray-500">
            {stats.total > 0 ? ((stats.error / stats.total) * 100).toFixed(1) : 0}%
          </Text>
        </Card>
      </Grid>

      {/* Filters */}
      <Card className="mb-6">
        <Title>Filtres</Title>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Période</label>
            <div className="space-y-2">
              <DateRangePicker
                value={dateRange}
                onValueChange={(value) => {
                  setDateRange(value);
                  setShowAllDates(false);
                }}
                placeholder="Sélectionner une période..."
                enableClear={true}
                disabled={showAllDates}
              />
              <Button
                size="xs"
                variant={showAllDates ? "primary" : "secondary"}
                onClick={() => setShowAllDates(!showAllDates)}
                className="w-full"
              >
                {showAllDates ? "✓ Toute la période" : "Voir toute la période"}
              </Button>
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Statut</label>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectItem value="">Tous</SelectItem>
              <SelectItem value="OK">OK</SelectItem>
              <SelectItem value="WARN">WARN</SelectItem>
              <SelectItem value="ERROR">ERROR</SelectItem>
            </Select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Info</label>
            <Text className="text-sm text-gray-600">
              Par défaut: 7 derniers jours
              <br />
              Cliquez sur le graphique pour voir les détails
            </Text>
          </div>
        </div>
      </Card>

      {/* Chart */}
      {prepareChartData().length > 0 && (
        <Card className="mb-6">
          <div className="flex justify-between items-center mb-4">
            <Title>Évolution des Vérifications</Title>
            <Text className="text-sm text-gray-500">
              {verifications.length} vérification(s) • Cliquez sur une barre pour voir les détails
            </Text>
          </div>
          <BarChart
            className="mt-6 cursor-pointer"
            data={prepareChartData()}
            index="date"
            categories={['OK', 'WARN', 'ERROR']}
            colors={['green', 'yellow', 'red']}
            valueFormatter={(value) => value.toString()}
            yAxisWidth={40}
            showLegend={true}
            stack={true}
            onValueChange={(v) => v && handleChartClick(v)}
          />
        </Card>
      )}

      {/* No data message */}
      {verifications.length === 0 && !loading && (
        <Card>
          <div className="text-center py-8">
            <Text className="text-gray-500">
              Aucune vérification trouvée pour ce système.
            </Text>
          </div>
        </Card>
      )}

      {/* Modal for verification details */}
      {selectedVerif && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <Card className="max-w-2xl w-full max-h-[80vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <Title>Détails de la Vérification</Title>
              <Button
                size="xs"
                variant="secondary"
                onClick={() => setSelectedVerif(null)}
              >
                Fermer
              </Button>
            </div>
            <Divider />
            <div className="mt-4 space-y-4">
              <div>
                <Text className="font-semibold">ID Vérification</Text>
                <Text>{selectedVerif.id_verif}</Text>
              </div>
              <div>
                <Text className="font-semibold">Statut</Text>
                <Badge color={getStatusColor(selectedVerif.status)} className="mt-1">
                  {selectedVerif.status}
                </Badge>
              </div>
              <div>
                <Text className="font-semibold">Date de création</Text>
                <Text>{new Date(selectedVerif.creation_date).toLocaleString('fr-FR')}</Text>
              </div>
              <div>
                <Text className="font-semibold">Worker ID</Text>
                <Text>{selectedVerif.id_worker || 'N/A'}</Text>
              </div>
              <div>
                <Text className="font-semibold">Machine ID</Text>
                <Text>{selectedVerif.id_machine || 'N/A'}</Text>
              </div>
              <div>
                <Text className="font-semibold">Détails</Text>
                <Card className="mt-2 bg-gray-50">
                  <Text className="whitespace-pre-wrap">{selectedVerif.details || 'Aucun détail disponible'}</Text>
                </Card>
              </div>
            </div>
          </Card>
        </div>
      )}
    </main>
  );
}
