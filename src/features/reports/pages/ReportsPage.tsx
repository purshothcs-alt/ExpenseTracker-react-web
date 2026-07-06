import {
  Box,
  Button,
  Card,
  CardContent,
  Grid,
  Typography,
  TextField,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Chip,
  Divider,
  Tabs,
  Tab,
  Autocomplete,
  IconButton,
} from '@mui/material';
import AssessmentIcon from '@mui/icons-material/Assessment';
import PictureAsPdfIcon from '@mui/icons-material/PictureAsPdf';
import TableChartIcon from '@mui/icons-material/TableChart';
import DownloadIcon from '@mui/icons-material/Download';
import BarChartIcon from '@mui/icons-material/BarChart';
import DonutLargeIcon from '@mui/icons-material/DonutLarge';
import ShowChartIcon from '@mui/icons-material/ShowChart';
import ReceiptLongIcon from '@mui/icons-material/ReceiptLong';
import CloseIcon from '@mui/icons-material/Close';
import FilterListIcon from '@mui/icons-material/FilterList';
import { useState, useMemo } from 'react';
import {
  BarChart,
  Bar,
  LineChart,
  Line,
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

const REPORT_TABS = [
  { value: 'monthly', label: 'Monthly Summary', icon: <BarChartIcon fontSize="small" /> },
  { value: 'category', label: 'Category Report', icon: <DonutLargeIcon fontSize="small" /> },
  { value: 'cashflow', label: 'Cash Flow', icon: <ShowChartIcon fontSize="small" /> },
  { value: 'transactions', label: 'Transactions', icon: <ReceiptLongIcon fontSize="small" /> },
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
  const [filterCategoryIds, setFilterCategoryIds] = useState<number[]>([]);
  const [drillCategoryId, setDrillCategoryId] = useState<number | null>(null);

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
  const { data: drillTxResult } = useGetTransactionsQuery(
    drillCategoryId != null
      ? {
          startDate,
          endDate,
          categoryId: drillCategoryId,
          page: 1,
          pageSize: 200,
          sortOrder: 'desc',
        }
      : { page: 1, pageSize: 0, sortOrder: 'desc' },
    { skip: drillCategoryId == null },
  );

  const catMap = useMemo(() => new Map(categories.map((c) => [c.id!, c])), [categories]);
  const monthlyChartData = monthlySummary.map((d) => ({
    month: dayjs(d.month + '-01').format('MMM YY'),
    Income: d.income,
    Expense: d.expense,
    Net: d.income - d.expense,
  }));

  // Filter: direct id match OR parent match (selecting a parent shows all its subcategories)
  const filteredCategoryTotals = useMemo(() => {
    if (filterCategoryIds.length === 0) return categoryTotals;
    return categoryTotals.filter((d) => {
      const cat = catMap.get(d.categoryId);
      if (!cat) return false;
      if (filterCategoryIds.includes(cat.id!)) return true;
      if (cat.parentId && filterCategoryIds.includes(cat.parentId)) return true;
      return false;
    });
  }, [categoryTotals, filterCategoryIds, catMap]);

  const pieData = filteredCategoryTotals.slice(0, 8).map((d) => ({
    name: catMap.get(d.categoryId)?.name || 'Other',
    value: d.total,
  }));

  const transactions = txResult?.data || [];
  const drillTransactions = drillTxResult?.data || [];
  const totalIncome = monthlySummary.reduce((s, m) => s + m.income, 0);
  const totalExpense = monthlySummary.reduce((s, m) => s + m.expense, 0);
  const netSavings = totalIncome - totalExpense;

  const handleExportPDF = () => {
    if (reportType === 'monthly') {
      exportToPDF(
        'Monthly Summary Report',
        [
          { header: 'Month', key: 'month' as never },
          {
            header: 'Income',
            key: 'income' as never,
            format: (v: unknown) => formatCurrency(v as number),
          },
          {
            header: 'Expense',
            key: 'expense' as never,
            format: (v: unknown) => formatCurrency(v as number),
          },
          {
            header: 'Net Savings',
            key: 'net' as never,
            format: (v: unknown) => formatCurrency(v as number),
          },
        ],
        monthlySummary.map((d) => ({
          ...d,
          month: dayjs(d.month + '-01').format('MMMM YYYY'),
          net: d.income - d.expense,
        })),
        'monthly-summary',
      );
    } else if (reportType === 'category') {
      const exportTotal = filteredCategoryTotals.reduce((s, d) => s + d.total, 0);
      exportToPDF(
        'Category Expense Report',
        [
          { header: 'Category', key: 'name' as never },
          {
            header: 'Amount',
            key: 'total' as never,
            format: (v: unknown) => formatCurrency(v as number),
          },
          {
            header: '% of Total',
            key: 'pct' as never,
            format: (v: unknown) => `${(v as number).toFixed(1)}%`,
          },
        ],
        filteredCategoryTotals.map((d) => ({
          name: catMap.get(d.categoryId)?.name || 'Unknown',
          total: d.total,
          pct: exportTotal > 0 ? (d.total / exportTotal) * 100 : 0,
        })),
        'category-report',
      );
    } else if (reportType === 'cashflow') {
      exportToPDF(
        'Cash Flow Report',
        [
          { header: 'Month', key: 'month' as never },
          {
            header: 'Income',
            key: 'income' as never,
            format: (v: unknown) => formatCurrency(v as number),
          },
          {
            header: 'Expense',
            key: 'expense' as never,
            format: (v: unknown) => formatCurrency(v as number),
          },
          {
            header: 'Net',
            key: 'net' as never,
            format: (v: unknown) => formatCurrency(v as number),
          },
        ],
        monthlySummary.map((d) => ({
          month: dayjs(d.month + '-01').format('MMMM YYYY'),
          income: d.income,
          expense: d.expense,
          net: d.income - d.expense,
        })),
        'cashflow-report',
      );
    } else {
      exportToPDF(
        'Transaction Report',
        [
          {
            header: 'Date',
            key: 'transactionDate' as never,
            format: (v: unknown) => formatDate(v as string),
          },
          {
            header: 'Amount',
            key: 'amount' as never,
            format: (v: unknown) => formatCurrency(v as number),
          },
          { header: 'Vendor', key: 'vendor' as never, format: (v: unknown) => String(v ?? '') },
          { header: 'Notes', key: 'notes' as never, format: (v: unknown) => String(v ?? '') },
        ],
        transactions,
        'transaction-report',
      );
    }
  };

  const handleExportExcel = () => {
    exportToExcel(
      reportType === 'transactions' ? 'Transactions' : 'Report',
      [
        { header: 'Date', key: 'transactionDate' as never },
        { header: 'Amount', key: 'amount' as never, format: (v: unknown) => String(v) },
        { header: 'Vendor', key: 'vendor' as never },
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
        { header: 'Vendor', key: 'vendor' as never },
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

      {/* Report type sub-navigation */}
      <Card sx={{ mb: 2 }}>
        <Tabs
          value={reportType}
          onChange={(_, v) => setReportType(v)}
          variant="scrollable"
          scrollButtons="auto"
          sx={{ borderBottom: '1px solid', borderColor: 'divider', px: 1 }}
        >
          {REPORT_TABS.map((tab) => (
            <Tab
              key={tab.value}
              value={tab.value}
              label={tab.label}
              icon={tab.icon}
              iconPosition="start"
              sx={{ minHeight: 48, fontSize: '0.8rem', gap: 0.5 }}
            />
          ))}
        </Tabs>
        <CardContent sx={{ pb: '12px !important' }}>
          <Box display="flex" gap={2} flexWrap="wrap" alignItems="center">
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

      {/* Summary cards — always visible */}
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

      {/* ── Monthly Summary ── */}
      {reportType === 'monthly' && (
        <Grid container spacing={2}>
          <Grid size={12}>
            <Card>
              <CardContent>
                <Typography variant="subtitle1" fontWeight={600} mb={2}>
                  Monthly Income vs Expense
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
          <Grid size={12}>
            <Card>
              <CardContent>
                <Typography variant="subtitle1" fontWeight={600} mb={2}>
                  Monthly Breakdown
                </Typography>
                <TableContainer>
                  <Table size="small">
                    <TableHead>
                      <TableRow>
                        <TableCell>Month</TableCell>
                        <TableCell align="right">Income</TableCell>
                        <TableCell align="right">Expense</TableCell>
                        <TableCell align="right">Net Savings</TableCell>
                        <TableCell align="right">Savings Rate</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {monthlySummary.map((d) => {
                        const net = d.income - d.expense;
                        const rate = d.income > 0 ? (net / d.income) * 100 : 0;
                        return (
                          <TableRow key={d.month} hover>
                            <TableCell sx={{ fontWeight: 500 }}>
                              {dayjs(d.month + '-01').format('MMMM YYYY')}
                            </TableCell>
                            <TableCell
                              align="right"
                              sx={{ color: 'success.main', fontWeight: 600 }}
                            >
                              {formatCurrency(d.income)}
                            </TableCell>
                            <TableCell align="right" sx={{ color: 'error.main', fontWeight: 600 }}>
                              {formatCurrency(d.expense)}
                            </TableCell>
                            <TableCell
                              align="right"
                              sx={{
                                color: net >= 0 ? 'success.main' : 'error.main',
                                fontWeight: 700,
                              }}
                            >
                              {formatCurrency(net)}
                            </TableCell>
                            <TableCell align="right">
                              <Chip
                                label={`${rate.toFixed(1)}%`}
                                size="small"
                                color={rate >= 0 ? 'success' : 'error'}
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
        </Grid>
      )}

      {/* ── Category Report ── */}
      {reportType === 'category' && (
        <Grid container spacing={2}>
          {/* Category filter bar */}
          <Grid size={12}>
            <Card sx={{ bgcolor: 'action.hover' }}>
              <CardContent sx={{ py: '10px !important' }}>
                <Box display="flex" gap={2} alignItems="center" flexWrap="wrap">
                  <FilterListIcon fontSize="small" color="action" />
                  <Autocomplete
                    multiple
                    options={categories}
                    getOptionLabel={(o) => {
                      if (!o.parentId) return o.name;
                      const parent = catMap.get(o.parentId);
                      return parent ? `${o.name} (${parent.name})` : o.name;
                    }}
                    groupBy={(o) => {
                      if (!o.parentId) return o.name;
                      return catMap.get(o.parentId)?.name ?? '';
                    }}
                    isOptionEqualToValue={(a, b) => a.id === b.id}
                    value={categories.filter((c) => filterCategoryIds.includes(c.id!))}
                    onChange={(_, newVal) => {
                      setFilterCategoryIds(newVal.map((c) => c.id!));
                      setDrillCategoryId(null);
                    }}
                    renderTags={(val, getTagProps) =>
                      val.map((opt, i) => {
                        const label = opt.parentId
                          ? `${catMap.get(opt.parentId)?.name} › ${opt.name}`
                          : opt.name;
                        return (
                          <Chip
                            {...getTagProps({ index: i })}
                            key={opt.id}
                            label={label}
                            size="small"
                            sx={{ bgcolor: `${opt.color}22`, color: opt.color }}
                          />
                        );
                      })
                    }
                    renderOption={(props, opt) => {
                      // eslint-disable-next-line @typescript-eslint/no-explicit-any
                      const { key, ...rest } = props as any;
                      return (
                        <li key={key} {...rest}>
                          <Box display="flex" alignItems="center" gap={1}>
                            <Box
                              sx={{
                                width: 8,
                                height: 8,
                                borderRadius: '50%',
                                bgcolor: opt.color,
                                flexShrink: 0,
                              }}
                            />
                            <Typography variant="body2">{opt.name}</Typography>
                            {opt.parentId && (
                              <Typography variant="caption" color="text.secondary">
                                — sub
                              </Typography>
                            )}
                          </Box>
                        </li>
                      );
                    }}
                    renderInput={(params) => (
                      <TextField
                        {...params}
                        label="Filter by Category / Sub Category"
                        placeholder={filterCategoryIds.length === 0 ? 'All categories' : ''}
                        sx={{ minWidth: 320 }}
                      />
                    )}
                  />
                  {filterCategoryIds.length > 0 && (
                    <Button
                      size="small"
                      onClick={() => {
                        setFilterCategoryIds([]);
                        setDrillCategoryId(null);
                      }}
                    >
                      Clear filter
                    </Button>
                  )}
                  <Typography variant="caption" color="text.secondary" sx={{ ml: 'auto' }}>
                    {filteredCategoryTotals.length} categories ·{' '}
                    {formatCurrency(filteredCategoryTotals.reduce((s, d) => s + d.total, 0))} total
                  </Typography>
                </Box>
              </CardContent>
            </Card>
          </Grid>

          <Grid size={{ xs: 12, lg: 5 }}>
            <Card sx={{ height: '100%' }}>
              <CardContent>
                <Typography variant="subtitle1" fontWeight={600} mb={2}>
                  Expense by Category
                </Typography>
                <ResponsiveContainer width="100%" height={320}>
                  <PieChart>
                    <Pie
                      data={pieData}
                      cx="50%"
                      cy="50%"
                      outerRadius={110}
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

          <Grid size={{ xs: 12, lg: 7 }}>
            <Card>
              <CardContent>
                <Typography variant="subtitle1" fontWeight={600} mb={0.5}>
                  Category Breakdown
                </Typography>
                <Typography variant="caption" color="text.secondary" display="block" mb={1.5}>
                  Click a row to see transactions for that category
                </Typography>
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
                      {filteredCategoryTotals.map((item, i) => {
                        const cat = catMap.get(item.categoryId);
                        const rowTotal = filteredCategoryTotals.reduce((s, d) => s + d.total, 0);
                        const pct = rowTotal > 0 ? (item.total / rowTotal) * 100 : 0;
                        const isSelected = drillCategoryId === item.categoryId;
                        return (
                          <TableRow
                            key={item.categoryId}
                            hover
                            onClick={() => setDrillCategoryId(isSelected ? null : item.categoryId)}
                            sx={{
                              cursor: 'pointer',
                              bgcolor: isSelected ? 'action.selected' : undefined,
                            }}
                          >
                            <TableCell>{i + 1}</TableCell>
                            <TableCell>
                              <Box display="flex" alignItems="center" gap={1}>
                                <Box
                                  sx={{
                                    width: 10,
                                    height: 10,
                                    borderRadius: '50%',
                                    bgcolor: cat?.color || '#9E9E9E',
                                    flexShrink: 0,
                                  }}
                                />
                                <Typography variant="body2" fontWeight={isSelected ? 700 : 400}>
                                  {cat?.name || 'Unknown'}
                                </Typography>
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

          {/* Drill-down: transactions for selected category */}
          {drillCategoryId != null && (
            <Grid size={12}>
              <Card sx={{ border: '2px solid', borderColor: 'primary.main' }}>
                <CardContent>
                  <Box display="flex" alignItems="center" justifyContent="space-between" mb={1.5}>
                    <Box display="flex" alignItems="center" gap={1.5}>
                      <Box
                        sx={{
                          width: 12,
                          height: 12,
                          borderRadius: '50%',
                          bgcolor: catMap.get(drillCategoryId)?.color || '#9E9E9E',
                        }}
                      />
                      <Typography variant="subtitle1" fontWeight={700}>
                        {catMap.get(drillCategoryId)?.name} — Transactions ({formatDate(startDate)}{' '}
                        to {formatDate(endDate)})
                      </Typography>
                      <Chip
                        label={`${drillTransactions.length} records`}
                        size="small"
                        color="primary"
                        variant="outlined"
                      />
                    </Box>
                    <IconButton size="small" onClick={() => setDrillCategoryId(null)}>
                      <CloseIcon fontSize="small" />
                    </IconButton>
                  </Box>
                  <Divider sx={{ mb: 1.5 }} />
                  {drillTransactions.length === 0 ? (
                    <Typography
                      variant="body2"
                      color="text.secondary"
                      sx={{ py: 2, textAlign: 'center' }}
                    >
                      No transactions found for this category in the selected date range
                    </Typography>
                  ) : (
                    <TableContainer>
                      <Table size="small">
                        <TableHead>
                          <TableRow>
                            <TableCell>Date</TableCell>
                            <TableCell>Vendor / Notes</TableCell>
                            <TableCell align="right">Amount</TableCell>
                          </TableRow>
                        </TableHead>
                        <TableBody>
                          {drillTransactions.map((tx) => (
                            <TableRow key={tx.id} hover>
                              <TableCell sx={{ whiteSpace: 'nowrap' }}>
                                {formatDate(tx.transactionDate)}
                              </TableCell>
                              <TableCell>{tx.vendor || tx.notes || '—'}</TableCell>
                              <TableCell align="right" sx={{ fontWeight: 700 }}>
                                {formatCurrency(tx.amount)}
                              </TableCell>
                            </TableRow>
                          ))}
                          <TableRow sx={{ bgcolor: 'action.hover' }}>
                            <TableCell colSpan={2} sx={{ fontWeight: 700 }}>
                              Total
                            </TableCell>
                            <TableCell align="right" sx={{ fontWeight: 800, color: 'error.main' }}>
                              {formatCurrency(drillTransactions.reduce((s, t) => s + t.amount, 0))}
                            </TableCell>
                          </TableRow>
                        </TableBody>
                      </Table>
                    </TableContainer>
                  )}
                </CardContent>
              </Card>
            </Grid>
          )}
        </Grid>
      )}

      {/* ── Cash Flow Report ── */}
      {reportType === 'cashflow' && (
        <Grid container spacing={2}>
          <Grid size={12}>
            <Card>
              <CardContent>
                <Typography variant="subtitle1" fontWeight={600} mb={2}>
                  Net Cash Flow Over Time
                </Typography>
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={monthlyChartData}>
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
                    <Line
                      type="monotone"
                      dataKey="Income"
                      stroke={theme.palette.success.main}
                      strokeWidth={2}
                      dot={{ r: 3 }}
                    />
                    <Line
                      type="monotone"
                      dataKey="Expense"
                      stroke={theme.palette.error.main}
                      strokeWidth={2}
                      dot={{ r: 3 }}
                    />
                    <Line
                      type="monotone"
                      dataKey="Net"
                      stroke={theme.palette.primary.main}
                      strokeWidth={2.5}
                      dot={{ r: 4 }}
                      strokeDasharray="5 3"
                    />
                  </LineChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </Grid>
          <Grid size={12}>
            <Card>
              <CardContent>
                <Typography variant="subtitle1" fontWeight={600} mb={2}>
                  Cash Flow Details
                </Typography>
                <TableContainer>
                  <Table size="small">
                    <TableHead>
                      <TableRow>
                        <TableCell>Month</TableCell>
                        <TableCell align="right">Income</TableCell>
                        <TableCell align="right">Expense</TableCell>
                        <TableCell align="right">Net Cash Flow</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {monthlySummary.map((d) => {
                        const net = d.income - d.expense;
                        return (
                          <TableRow key={d.month} hover>
                            <TableCell>{dayjs(d.month + '-01').format('MMMM YYYY')}</TableCell>
                            <TableCell align="right" sx={{ color: 'success.main' }}>
                              {formatCurrency(d.income)}
                            </TableCell>
                            <TableCell align="right" sx={{ color: 'error.main' }}>
                              {formatCurrency(d.expense)}
                            </TableCell>
                            <TableCell
                              align="right"
                              sx={{
                                fontWeight: 700,
                                color: net >= 0 ? 'success.main' : 'error.main',
                              }}
                            >
                              {net >= 0 ? '+' : ''}
                              {formatCurrency(net)}
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
        </Grid>
      )}

      {/* ── Transaction List ── */}
      {reportType === 'transactions' && (
        <Card>
          <CardContent>
            <Box display="flex" alignItems="center" justifyContent="space-between" mb={1}>
              <Typography variant="subtitle1" fontWeight={600}>
                Transaction List ({formatDate(startDate)} — {formatDate(endDate)})
              </Typography>
              <Typography variant="caption" color="text.secondary">
                {transactions.length} records
              </Typography>
            </Box>
            <Divider sx={{ mb: 1 }} />
            <TableContainer>
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell>Date</TableCell>
                    <TableCell>Vendor / Notes</TableCell>
                    <TableCell align="right">Amount</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {transactions.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={3} align="center" sx={{ py: 4, color: 'text.secondary' }}>
                        No transactions in this date range
                      </TableCell>
                    </TableRow>
                  ) : (
                    transactions.map((tx) => (
                      <TableRow key={tx.id} hover>
                        <TableCell sx={{ whiteSpace: 'nowrap' }}>
                          {formatDate(tx.transactionDate)}
                        </TableCell>
                        <TableCell>{tx.vendor || tx.notes || '—'}</TableCell>
                        <TableCell align="right" sx={{ fontWeight: 700 }}>
                          {formatCurrency(tx.amount)}
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </TableContainer>
          </CardContent>
        </Card>
      )}
    </Box>
  );
}
