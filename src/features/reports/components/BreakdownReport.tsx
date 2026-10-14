import {
  Box,
  Card,
  CardContent,
  Grid,
  Typography,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Chip,
  Divider,
  IconButton,
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import { useEffect, useMemo, useState } from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts';
import { useTheme } from '@mui/material/styles';
import { useGetTransactionsQuery, useGetAllTransactionTypesQuery } from '@app/api/transactionsApi';
import { useAppSettings } from '@core/hooks/useAppSettings';
import type { GroupedTotal, ReportGroupBy, TransactionFilter } from '@core/database/types';

interface Props {
  groupBy: ReportGroupBy;
  /** Singular name of the grouped dimension, e.g. "Account". */
  label: string;
  rows: GroupedTotal[];
  startDate: string;
  endDate: string;
}

const drillFilter = (groupBy: ReportGroupBy, row: GroupedTotal): TransactionFilter => {
  switch (groupBy) {
    case 'account':
      return { accountId: Number(row.key) };
    case 'category':
      return { categoryId: Number(row.key) };
    case 'subCategory':
      return { subCategoryId: Number(row.key) };
    case 'tag':
      return { tagIds: [Number(row.key)] };
    case 'project':
      return { projectId: Number(row.key) };
    case 'payee':
      return { vendor: row.name };
  }
};

export function BreakdownReport({ groupBy, label, rows, startDate, endDate }: Props) {
  const theme = useTheme();
  const { settings, formatCurrency, formatDate } = useAppSettings();
  const [drillKey, setDrillKey] = useState<string | null>(null);

  useEffect(() => {
    setDrillKey(null);
  }, [groupBy, startDate, endDate]);

  const drillRow = rows.find((r) => r.key && r.key === drillKey);
  const { data: drillResult } = useGetTransactionsQuery(
    drillRow
      ? {
          ...drillFilter(groupBy, drillRow),
          startDate,
          endDate,
          page: 1,
          pageSize: 500,
          sortOrder: 'desc',
        }
      : { page: 1, pageSize: 1 },
    { skip: !drillRow },
  );
  const { data: txTypes = [] } = useGetAllTransactionTypesQuery();
  const typeMap = useMemo(() => new Map(txTypes.map((t) => [t.id!, t])), [txTypes]);
  const drillTransactions = drillRow ? drillResult?.data || [] : [];

  const totalIncome = rows.reduce((s, r) => s + r.income, 0);
  const totalExpense = rows.reduce((s, r) => s + r.expense, 0);
  const totalCount = rows.reduce((s, r) => s + r.count, 0);

  const chartData = rows
    .filter((r) => r.key)
    .slice(0, 10)
    .map((r) => ({ name: r.name, Income: r.income, Expense: r.expense }));

  if (rows.length === 0) {
    return (
      <Card>
        <CardContent>
          <Typography variant="body2" color="text.secondary" sx={{ py: 4, textAlign: 'center' }}>
            No income or expense transactions in this date range
          </Typography>
        </CardContent>
      </Card>
    );
  }

  return (
    <Grid container spacing={2}>
      {chartData.length > 0 && (
        <Grid size={12}>
          <Card>
            <CardContent>
              <Typography variant="subtitle1" fontWeight={600} mb={2}>
                Income vs Expense by {label}
                {rows.filter((r) => r.key).length > 10 ? ' (top 10)' : ''}
              </Typography>
              <ResponsiveContainer width="100%" height={280}>
                <BarChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" stroke={theme.palette.divider} />
                  <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                  <YAxis
                    tick={{ fontSize: 11 }}
                    tickFormatter={(v) => `${settings.currencySymbol}${(v / 1000).toFixed(0)}K`}
                  />
                  <Tooltip formatter={(v: number) => [formatCurrency(v), '']} />
                  <Legend />
                  <Bar dataKey="Income" fill={theme.palette.success.main} radius={[3, 3, 0, 0]} />
                  <Bar dataKey="Expense" fill={theme.palette.error.main} radius={[3, 3, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </Grid>
      )}

      <Grid size={12}>
        <Card>
          <CardContent>
            <Typography variant="subtitle1" fontWeight={600} mb={0.5}>
              {label} Breakdown
            </Typography>
            <Typography variant="caption" color="text.secondary" display="block" mb={1.5}>
              Click a row to see its transactions. Transfers are not included.
              {groupBy === 'tag' &&
                ' A transaction with several tags is counted under each tag, so rows can add up to more than the overall total.'}
            </Typography>
            <TableContainer>
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell>#</TableCell>
                    <TableCell>{label}</TableCell>
                    <TableCell align="right">Transactions</TableCell>
                    <TableCell align="right">Income</TableCell>
                    <TableCell align="right">Expense</TableCell>
                    <TableCell align="right">Net</TableCell>
                    <TableCell align="right">% of Expense</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {rows.map((row, i) => {
                    const net = row.income - row.expense;
                    const pct = totalExpense > 0 ? (row.expense / totalExpense) * 100 : 0;
                    const isSelected = !!row.key && drillKey === row.key;
                    return (
                      <TableRow
                        key={row.key || 'none'}
                        hover
                        onClick={
                          row.key ? () => setDrillKey(isSelected ? null : row.key) : undefined
                        }
                        sx={{
                          cursor: row.key ? 'pointer' : 'default',
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
                                bgcolor: row.color || '#9E9E9E',
                                flexShrink: 0,
                              }}
                            />
                            <Typography
                              variant="body2"
                              fontWeight={isSelected ? 700 : 400}
                              color={row.key ? 'text.primary' : 'text.secondary'}
                            >
                              {row.name}
                            </Typography>
                            {row.parentName && (
                              <Typography variant="caption" color="text.secondary">
                                {row.parentName}
                              </Typography>
                            )}
                          </Box>
                        </TableCell>
                        <TableCell align="right">{row.count}</TableCell>
                        <TableCell align="right" sx={{ color: 'success.main' }}>
                          {formatCurrency(row.income)}
                        </TableCell>
                        <TableCell align="right" sx={{ color: 'error.main' }}>
                          {formatCurrency(row.expense)}
                        </TableCell>
                        <TableCell
                          align="right"
                          sx={{ fontWeight: 700, color: net >= 0 ? 'success.main' : 'error.main' }}
                        >
                          {formatCurrency(net)}
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
                  {groupBy !== 'tag' && (
                    <TableRow sx={{ bgcolor: 'action.hover' }}>
                      <TableCell colSpan={2} sx={{ fontWeight: 700 }}>
                        Total
                      </TableCell>
                      <TableCell align="right" sx={{ fontWeight: 700 }}>
                        {totalCount}
                      </TableCell>
                      <TableCell align="right" sx={{ fontWeight: 700, color: 'success.main' }}>
                        {formatCurrency(totalIncome)}
                      </TableCell>
                      <TableCell align="right" sx={{ fontWeight: 700, color: 'error.main' }}>
                        {formatCurrency(totalExpense)}
                      </TableCell>
                      <TableCell align="right" sx={{ fontWeight: 800 }}>
                        {formatCurrency(totalIncome - totalExpense)}
                      </TableCell>
                      <TableCell />
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </TableContainer>
          </CardContent>
        </Card>
      </Grid>

      {drillRow && (
        <Grid size={12}>
          <Card sx={{ border: '2px solid', borderColor: 'primary.main' }}>
            <CardContent>
              <Box display="flex" alignItems="center" justifyContent="space-between" mb={1.5}>
                <Box display="flex" alignItems="center" gap={1.5} flexWrap="wrap">
                  <Typography variant="subtitle1" fontWeight={700}>
                    {drillRow.name} — Transactions ({formatDate(startDate)} to {formatDate(endDate)}
                    )
                  </Typography>
                  <Chip
                    label={`${drillTransactions.length} records`}
                    size="small"
                    color="primary"
                    variant="outlined"
                  />
                </Box>
                <IconButton size="small" onClick={() => setDrillKey(null)}>
                  <CloseIcon fontSize="small" />
                </IconButton>
              </Box>
              <Divider sx={{ mb: 1.5 }} />
              <TableContainer>
                <Table size="small">
                  <TableHead>
                    <TableRow>
                      <TableCell>Date</TableCell>
                      <TableCell>Type</TableCell>
                      <TableCell>Payee / Notes</TableCell>
                      <TableCell align="right">Amount</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {drillTransactions.map((tx) => {
                      const txType = typeMap.get(tx.transactionTypeId);
                      return (
                        <TableRow key={tx.id} hover>
                          <TableCell sx={{ whiteSpace: 'nowrap' }}>
                            {formatDate(tx.transactionDate)}
                          </TableCell>
                          <TableCell>{txType?.name || '—'}</TableCell>
                          <TableCell>{tx.vendor || tx.notes || '—'}</TableCell>
                          <TableCell
                            align="right"
                            sx={{
                              fontWeight: 700,
                              color:
                                txType?.direction === 'debit'
                                  ? 'error.main'
                                  : txType?.direction === 'credit'
                                    ? 'success.main'
                                    : 'info.main',
                            }}
                          >
                            {formatCurrency(tx.amount)}
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
      )}
    </Grid>
  );
}
