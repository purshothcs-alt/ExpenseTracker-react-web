import { Grid, Button, Box } from '@mui/material';
import DashboardIcon from '@mui/icons-material/Dashboard';
import TuneIcon from '@mui/icons-material/Tune';
import AddIcon from '@mui/icons-material/Add';
import ReceiptLongIcon from '@mui/icons-material/ReceiptLong';
import { useState } from 'react';
import { Link } from 'react-router';
import { PageHeader } from '@core/components/common/PageHeader';
import { SummaryWidgets } from '../components/widgets/SummaryWidget';
import { IncomeExpenseChart } from '../components/widgets/IncomeExpenseChart';
import { TopCategoriesWidget } from '../components/widgets/TopCategoriesWidget';
import { RecentTransactionsWidget } from '../components/widgets/RecentTransactionsWidget';
import { AccountBalancesWidget } from '../components/widgets/AccountBalancesWidget';
import { BudgetStatusWidget } from '../components/widgets/BudgetStatusWidget';
import { GoalProgressWidget } from '../components/widgets/GoalProgressWidget';
import { DashboardCustomizer } from '../components/DashboardCustomizer';
import { TransactionForm } from '@features/transactions/components/TransactionForm';
import {
  useGetUserDashboardConfigQuery,
  useGetAllDashboardWidgetsQuery,
} from '@app/api/dashboardApi';

export function DashboardPage() {
  const [customizerOpen, setCustomizerOpen] = useState(false);
  const [transactionFormOpen, setTransactionFormOpen] = useState(false);
  const { data: configuredWidgets = [] } = useGetUserDashboardConfigQuery();
  const { data: allWidgets = [] } = useGetAllDashboardWidgetsQuery();

  const activeKeys = new Set(configuredWidgets.map((c) => c.widget?.componentKey).filter(Boolean));
  const allKeys = new Set(allWidgets.map((w) => w.componentKey));

  // Show a widget if: no config at all yet, OR it's explicitly in the config,
  // OR the widget doesn't exist in the DB at all (safety fallback).
  const show = (key: string) => activeKeys.size === 0 || activeKeys.has(key) || !allKeys.has(key);

  return (
    <Box>
      <PageHeader
        title="Dashboard"
        icon={<DashboardIcon sx={{ fontSize: 28 }} />}
        subtitle="Overview of your finances"
        actions={
          <Box display="flex" gap={1} flexWrap="wrap" width={{ xs: '100%', sm: 'auto' }}>
            <Button
              component={Link}
              to="/transactions"
              variant="outlined"
              size="small"
              startIcon={<ReceiptLongIcon />}
            >
              Transactions
            </Button>
            <Button
              variant="outlined"
              size="small"
              startIcon={<TuneIcon />}
              onClick={() => setCustomizerOpen(true)}
            >
              Customize
            </Button>
            <Button
              variant="contained"
              size="small"
              startIcon={<AddIcon />}
              onClick={() => setTransactionFormOpen(true)}
            >
              Add Transaction
            </Button>
          </Box>
        }
      />

      <SummaryWidgets />

      <Grid container spacing={2}>
        {show('income-expense-chart') && (
          <Grid size={{ xs: 12, lg: 8 }}>
            <IncomeExpenseChart months={6} />
          </Grid>
        )}
        {show('account-balances') && (
          <Grid size={{ xs: 12, lg: show('income-expense-chart') ? 4 : 12 }}>
            <AccountBalancesWidget />
          </Grid>
        )}

        {show('top-categories') && (
          <Grid size={{ xs: 12, md: 6 }}>
            <TopCategoriesWidget limit={6} />
          </Grid>
        )}
        {show('budget-status') && (
          <Grid size={{ xs: 12, md: 6 }}>
            <BudgetStatusWidget />
          </Grid>
        )}

        {show('recent-transactions') && (
          <Grid size={{ xs: 12, md: show('goal-progress') ? 7 : 12 }}>
            <RecentTransactionsWidget limit={8} />
          </Grid>
        )}
        {show('goal-progress') && (
          <Grid size={{ xs: 12, md: show('recent-transactions') ? 5 : 12 }}>
            <GoalProgressWidget />
          </Grid>
        )}
      </Grid>

      <DashboardCustomizer open={customizerOpen} onClose={() => setCustomizerOpen(false)} />
      <TransactionForm open={transactionFormOpen} onClose={() => setTransactionFormOpen(false)} />
    </Box>
  );
}
