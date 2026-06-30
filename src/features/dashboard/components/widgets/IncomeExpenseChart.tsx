import { Card, CardContent, Typography, Box, useTheme } from '@mui/material';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';
import { useGetMonthlySummaryQuery } from '@app/api/transactionsApi';
import { useAppSettings } from '@core/hooks/useAppSettings';
import { formatCompact } from '@core/utils/currency';
import dayjs from 'dayjs';

export function IncomeExpenseChart({ months = 6 }: { months?: number }) {
  const { data = [], isLoading } = useGetMonthlySummaryQuery(months);
  const theme = useTheme();
  const { settings } = useAppSettings();
  const symbol = settings.currencySymbol;

  const chartData = data.map((d) => ({
    month: dayjs(d.month + '-01').format('MMM YY'),
    Income: d.income,
    Expense: d.expense,
  }));

  return (
    <Card sx={{ height: '100%' }}>
      <CardContent>
        <Typography variant="subtitle1" fontWeight={600} mb={2}>
          Income vs Expense
        </Typography>
        {isLoading ? (
          <Box height={220} display="flex" alignItems="center" justifyContent="center">
            <Typography color="text.secondary">Loading...</Typography>
          </Box>
        ) : (
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={chartData} margin={{ top: 4, right: 8, left: -8, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke={theme.palette.divider} />
              <XAxis dataKey="month" tick={{ fontSize: 11 }} />
              <YAxis
                tick={{ fontSize: 11 }}
                tickFormatter={(v) => formatCompact(v as number, symbol)}
              />
              <Tooltip
                formatter={(v: number) => [`${symbol}${v.toLocaleString()}`, '']}
                contentStyle={{ borderRadius: 8, border: 'none', boxShadow: theme.shadows[3] }}
              />
              <Legend wrapperStyle={{ fontSize: 12 }} />
              <Bar dataKey="Income" fill={theme.palette.success.main} radius={[4, 4, 0, 0]} />
              <Bar dataKey="Expense" fill={theme.palette.error.main} radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        )}
      </CardContent>
    </Card>
  );
}
