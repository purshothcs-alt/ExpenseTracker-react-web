import { Grid, Button, Box } from '@mui/material';
import DashboardIcon from '@mui/icons-material/Dashboard';
import TuneIcon from '@mui/icons-material/Tune';
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

export function DashboardPage() {
  const [customizerOpen, setCustomizerOpen] = useState(false);

  return (
    <Box>
      <PageHeader
        title="Dashboard"
        icon={<DashboardIcon sx={{ fontSize: 28 }} />}
        subtitle="Overview of your finances"
        actions={
          <Box display="flex" gap={1}>
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
          </Box>
        }
      />

      <SummaryWidgets />

      <Grid container spacing={2}>
        <Grid size={{ xs: 12, lg: 8 }}>
          <IncomeExpenseChart months={6} />
        </Grid>
        <Grid size={{ xs: 12, lg: 4 }}>
          <AccountBalancesWidget />
        </Grid>

        <Grid size={{ xs: 12, md: 6 }}>
          <TopCategoriesWidget limit={6} />
        </Grid>
        <Grid size={{ xs: 12, md: 6 }}>
          <BudgetStatusWidget />
        </Grid>

        <Grid size={{ xs: 12, md: 7 }}>
          <RecentTransactionsWidget limit={8} />
        </Grid>
        <Grid size={{ xs: 12, md: 5 }}>
          <GoalProgressWidget />
        </Grid>
      </Grid>

      <DashboardCustomizer open={customizerOpen} onClose={() => setCustomizerOpen(false)} />
    </Box>
  );
}
