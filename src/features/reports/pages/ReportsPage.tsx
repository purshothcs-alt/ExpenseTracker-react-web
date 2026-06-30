import {
  Box,
  Button,
  Card,
  CardContent,
  Grid,
  Typography,
  TextField,
  MenuItem,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Chip,
  Divider,
} from '@mui/material';
import AssessmentIcon from '@mui/icons-material/Assessment';
import PictureAsPdfIcon from '@mui/icons-material/PictureAsPdf';
import TableChartIcon from '@mui/icons-material/TableChart';
import DownloadIcon from '@mui/icons-material/Download';
import { useState, useMemo } from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend,
} from 'recharts';
import { PageHeader } from '@core/components/common/PageHeader';
import {
  useGetTransactionsQuery,
  useGetMonthlySummaryQuery,
  useGetCategoryTotalsQuery,
} from '@app/api/transactionsApi';
import { useGetAllCategoriesQuery } from '@app/api/categoriesApi';
import { useAppSettings } from '@core/hooks/useAppSettings';
import { exportToPDF, exportToCSV, exportToExcel } from '@core/utils/export';
import { useTheme } from '@mui/material/styles';
import dayjs from 'dayjs';

const REPORT_TYPES = [
  { value: 'monthly', label: 'Monthly Summary' },
  { value: 'category', label: 'Category Report' },
  { value: 'cashflow', label: 'Cash Flow Report' },
  { value: 'transactions', label: 'Transaction List' },
];

const CHART_COLORS = [
  '#2563EB',
  '#DC2626',
  '#059669',
  '#D97706',
  '#7C3AED',
  '#0891B2',
  '#DB2777',
  '#65A30D',
];

export function ReportsPage() {
  const theme = useTheme();
  const { formatCurrency, formatDate } = useAppSettings();
  const { settings } = useAppSettings();

  const [reportType, setReportType] = useState('monthly');
  const [startDate, setStartDate] = useState(dayjs().startOf('year').format('YYYY-MM-DD'));
  const [endDate, setEndDate] = useState(dayjs().endOf('month').format('YYYY-MM-DD'));

  const { data: monthlySummary = [] } = useGetMonthlySummaryQuery(12);
  const { data: categoryTotals = [] } = useGetCategoryTotalsQuery({ startDate, endDate });
  const { data: categories = [] } = useGetAllCategoriesQuery();
  const { data: txResult } = useGetTransactionsQuery({
    startDate,
    endDate,
    page: 1,
    pageSize: 500,
    sortOrder: 'desc',
  });

  const catMap = useMemo(() => new Map(categories.map((c) => [c.id!, c])), [categories]);

  const monthlyChartData = monthlySummary.map((d) => ({
    month: dayjs(d.month + '-01').format('MMM YY'),
    Income: d.income,
    Expense: d.expense,
    Net: d.income - d.expense,
  }));

  const pieData = categoryTotals.slice(0, 8).map((d) => ({
    name: catMap.get(d.categoryId)?.name || 'Other',
    value: d.total,
  }));

  const transactions = txResult?.data || [];
  const totalIncome = monthlySummary.reduce((s, m) => s + m.income, 0);
  const totalExpense = monthlySummary.reduce((s, m) => s + m.expense, 0);
  const netSavings = totalIncome - totalExpense;

  const handleExportPDF = () => {
    exportToPDF(
      'Financial Report',
      [
        { header: 'Date', key: 'transactionDate' as never },
        {
          header: 'Amount',
          key: 'amount' as never,
          format: (v: unknown) => formatCurrency(v as number),
        },
        { header: 'Notes', key: 'notes' as never },
      ],
      transactions,
      'financial-report',
    );
  };

  const handleExportExcel = () => {
    exportToExcel(
      'Transactions',
      [
        { header: 'Date', key: 'transactionDate' as never },
        { header: 'Amount', key: 'amount' as never, format: (v: unknown) => String(v) },
        { header: 'Notes', key: 'notes' as never },
      ],
      transactions,
      'financial-report',
    );
  };

  const handleExportCSV = () => {
    exportToCSV(
      [
        { header: 'Date', key: 'transactionDate' as never },
        { header: 'Amount', key: 'amount' as never },
        { header: 'Notes', key: 'notes' as never },
      ],
      transactions,
      'financial-report',
    );
  };

  return (
    <Box>
      <PageHeader
        title="Reports"
        icon={<AssessmentIcon sx={{ fontSize: 28 }} />}
        subtitle="Financial analytics and reports"
        actions={
          <Box display="flex" gap={1} flexWrap="wrap" width={{ xs: '100%', sm: 'auto' }}>
            <Button
              variant="outlined"
              startIcon={<PictureAsPdfIcon />}
              size="small"
              onClick={handleExportPDF}
            >
              PDF
            </Button>
            <Button
              variant="outlined"
              startIcon={<TableChartIcon />}
              size="small"
              onClick={handleExportExcel}
            >
              Excel
            </Button>
            <Button
              variant="outlined"
              startIcon={<DownloadIcon />}
              size="small"
              onClick={handleExportCSV}
            >
              CSV
            </Button>
          </Box>
        }
      />

      <Card sx={{ mb: 2 }}>
        <CardContent sx={{ pb: '12px !important' }}>
          <Box display="flex" gap={2} flexWrap="wrap" alignItems="center">
            <TextField
              size="small"
              select
              label="Report Type"
              value={reportType}
              onChange={(e) => setReportType(e.target.value)}
              sx={{ minWidth: 200 }}
            >
              {REPORT_TYPES.map((r) => (
                <MenuItem key={r.value} value={r.value}>
                  {r.label}
                </MenuItem>
              ))}
            </TextField>
            <TextField
              size="small"
              type="date"
              label="From"
              InputLabelProps={{ shrink: true }}
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              sx={{ width: 160 }}
            />
            <TextField
              size="small"
              type="date"
              label="To"
              InputLabelProps={{ shrink: true }}
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              sx={{ width: 160 }}
            />
          </Box>
        </CardContent>
      </Card>

      <Grid container spacing={2} mb={2}>
        <Grid size={{ xs: 12, sm: 4 }}>
          <Card sx={{ textAlign: 'center', py: 1 }}>
            <CardContent>
              <Typography variant="caption" color="text.secondary" fontWeight={600}>
                TOTAL INCOME
              </Typography>
              <Typography variant="h5" color="success.main" fontWeight={800}>
                {formatCurrency(totalIncome)}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid size={{ xs: 12, sm: 4 }}>
          <Card sx={{ textAlign: 'center', py: 1 }}>
            <CardContent>
              <Typography variant="caption" color="text.secondary" fontWeight={600}>
                TOTAL EXPENSE
              </Typography>
              <Typography variant="h5" color="error.main" fontWeight={800}>
                {formatCurrency(totalExpense)}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid size={{ xs: 12, sm: 4 }}>
          <Card sx={{ textAlign: 'center', py: 1 }}>
            <CardContent>
              <Typography variant="caption" color="text.secondary" fontWeight={600}>
                NET SAVINGS
              </Typography>
              <Typography
                variant="h5"
                color={netSavings >= 0 ? 'success.main' : 'error.main'}
                fontWeight={800}
              >
                {formatCurrency(netSavings)}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      <Grid container spacing={2}>
        <Grid size={{ xs: 12, lg: 8 }}>
          <Card>
            <CardContent>
              <Typography variant="subtitle1" fontWeight={600} mb={2}>
                Monthly Cash Flow
              </Typography>
              <ResponsiveContainer width="100%" height={280}>
                <BarChart data={monthlyChartData}>
                  <CartesianGrid strokeDasharray="3 3" stroke={theme.palette.divider} />
                  <XAxis dataKey="month" tick={{ fontSize: 11 }} />
                  <YAxis
                    tick={{ fontSize: 11 }}
                    tickFormatter={(v) => `${settings.currencySymbol}${(v / 1000).toFixed(0)}K`}
                  />
                  <Tooltip
                    formatter={(v: number) => [
                      `${settings.currencySymbol}${v.toLocaleString()}`,
                      '',
                    ]}
                  />
                  <Legend />
                  <Bar dataKey="Income" fill={theme.palette.success.main} radius={[3, 3, 0, 0]} />
                  <Bar dataKey="Expense" fill={theme.palette.error.main} radius={[3, 3, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </Grid>

        <Grid size={{ xs: 12, lg: 4 }}>
          <Card sx={{ height: '100%' }}>
            <CardContent>
              <Typography variant="subtitle1" fontWeight={600} mb={2}>
                Expense by Category
              </Typography>
              <ResponsiveContainer width="100%" height={280}>
                <PieChart>
                  <Pie
                    data={pieData}
                    cx="50%"
                    cy="50%"
                    outerRadius={90}
                    dataKey="value"
                    label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                    labelLine={false}
                    fontSize={11}
                  >
                    {pieData.map((_, i) => (
                      <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(v: number) => [formatCurrency(v), '']} />
                </PieChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </Grid>

        <Grid size={12}>
          <Card>
            <CardContent>
              <Box display="flex" alignItems="center" justifyContent="space-between" mb={2}>
                <Typography variant="subtitle1" fontWeight={600}>
                  Category Summary
                </Typography>
              </Box>
              <TableContainer>
                <Table size="small">
                  <TableHead>
                    <TableRow>
                      <TableCell>#</TableCell>
                      <TableCell>Category</TableCell>
                      <TableCell align="right">Amount</TableCell>
                      <TableCell align="right">% of Total</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {categoryTotals.slice(0, 15).map((item, i) => {
                      const cat = catMap.get(item.categoryId);
                      const pct = totalExpense > 0 ? (item.total / totalExpense) * 100 : 0;
                      return (
                        <TableRow key={item.categoryId} hover>
                          <TableCell>{i + 1}</TableCell>
                          <TableCell>
                            <Box display="flex" alignItems="center" gap={1}>
                              <Box
                                sx={{
                                  width: 10,
                                  height: 10,
                                  borderRadius: '50%',
                                  bgcolor: cat?.color || '#9E9E9E',
                                }}
                              />
                              {cat?.name || 'Unknown'}
                            </Box>
                          </TableCell>
                          <TableCell align="right" sx={{ fontWeight: 700 }}>
                            {formatCurrency(item.total)}
                          </TableCell>
                          <TableCell align="right">
                            <Chip
                              label={`${pct.toFixed(1)}%`}
                              size="small"
                              sx={{ height: 18, fontSize: '0.7rem' }}
                            />
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </TableContainer>
            </CardContent>
          </Card>
        </Grid>

        {reportType === 'transactions' && (
          <Grid size={12}>
            <Card>
              <CardContent>
                <Typography variant="subtitle1" fontWeight={600} mb={2}>
                  Transaction List ({formatDate(startDate)} - {formatDate(endDate)})
                </Typography>
                <Divider sx={{ mb: 1 }} />
                <TableContainer>
                  <Table size="small">
                    <TableHead>
                      <TableRow>
                        <TableCell>Date</TableCell>
                        <TableCell>Notes</TableCell>
                        <TableCell align="right">Amount</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {transactions.map((tx) => (
                        <TableRow key={tx.id} hover>
                          <TableCell>{formatDate(tx.transactionDate)}</TableCell>
                          <TableCell>{tx.notes || '—'}</TableCell>
                          <TableCell align="right" sx={{ fontWeight: 700, color: 'text.primary' }}>
                            {formatCurrency(tx.amount)}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
              </CardContent>
            </Card>
          </Grid>
        )}
      </Grid>
    </Box>
  );
}
