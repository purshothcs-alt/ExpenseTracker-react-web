import { Grid } from '@mui/material';
import AccountBalanceWalletIcon from '@mui/icons-material/AccountBalanceWallet';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import TrendingDownIcon from '@mui/icons-material/TrendingDown';
import SwapVertIcon from '@mui/icons-material/SwapVert';
import DiamondIcon from '@mui/icons-material/Diamond';
import { StatCard } from '@core/components/common/StatCard';
import { useGetDashboardSummaryQuery } from '@app/api/dashboardApi';
import { useAppSettings } from '@core/hooks/useAppSettings';

export function SummaryWidgets() {
  const { data: summary, isLoading } = useGetDashboardSummaryQuery();
  const { formatCurrency } = useAppSettings();

  const cards = [
    {
      title: 'Total Balance',
      value: summary ? formatCurrency(summary.totalBalance) : '—',
      icon: <AccountBalanceWalletIcon />,
      color: '#2563EB',
      subtitle: 'Across all accounts',
    },
    {
      title: 'Monthly Income',
      value: summary ? formatCurrency(summary.monthlyIncome) : '—',
      icon: <TrendingUpIcon />,
      color: '#059669',
      subtitle: 'This month',
    },
    {
      title: 'Monthly Expense',
      value: summary ? formatCurrency(summary.monthlyExpense) : '—',
      icon: <TrendingDownIcon />,
      color: '#DC2626',
      subtitle: 'This month',
    },
    {
      title: 'Cash Flow',
      value: summary ? formatCurrency(summary.cashFlow) : '—',
      icon: <SwapVertIcon />,
      color: summary?.cashFlow && summary.cashFlow >= 0 ? '#059669' : '#DC2626',
      subtitle: 'Net this month',
    },
    {
      title: 'Net Worth',
      value: summary ? formatCurrency(summary.netWorth) : '—',
      icon: <DiamondIcon />,
      color: '#7C3AED',
      subtitle: 'Assets - Liabilities',
    },
  ];

  return (
    <Grid container spacing={2} mb={3}>
      {cards.map((card) => (
        <Grid
          key={card.title}
          size={{ xs: 6, sm: 4, md: 3, lg: 'auto' }}
          sx={{ flexGrow: 1, minWidth: 140 }}
        >
          <StatCard {...card} loading={isLoading} />
        </Grid>
      ))}
    </Grid>
  );
}
