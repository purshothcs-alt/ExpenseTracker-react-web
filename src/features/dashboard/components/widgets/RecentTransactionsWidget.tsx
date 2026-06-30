import {
  Card,
  CardContent,
  Typography,
  List,
  ListItem,
  ListItemText,
  ListItemAvatar,
  Avatar,
  Box,
  Chip,
  Button,
} from '@mui/material';
import { Link } from 'react-router';
import { useGetRecentTransactionsQuery } from '@app/api/transactionsApi';
import { useAppSettings } from '@core/hooks/useAppSettings';

export function RecentTransactionsWidget({ limit = 8 }: { limit?: number }) {
  const { data: transactions = [], isLoading } = useGetRecentTransactionsQuery(limit);
  const { formatCurrency, formatDate } = useAppSettings();

  return (
    <Card sx={{ height: '100%' }}>
      <CardContent sx={{ pb: '8px !important' }}>
        <Box display="flex" alignItems="center" justifyContent="space-between" mb={1}>
          <Typography variant="subtitle1" fontWeight={600}>
            Recent Transactions
          </Typography>
          <Button
            component={Link}
            to="/transactions"
            size="small"
            sx={{ textTransform: 'none', fontWeight: 600 }}
          >
            View All
          </Button>
        </Box>

        {isLoading ? (
          <Typography color="text.secondary" variant="body2">
            Loading...
          </Typography>
        ) : transactions.length === 0 ? (
          <Typography color="text.secondary" variant="body2">
            No transactions yet
          </Typography>
        ) : (
          <List dense disablePadding>
            {transactions.map((tx, i) => {
              const isDebit = tx.transactionType?.direction === 'debit';
              const isTransfer = tx.transactionType?.direction === 'transfer';
              return (
                <ListItem key={tx.id || i} disablePadding sx={{ py: 0.5 }}>
                  <ListItemAvatar sx={{ minWidth: 40 }}>
                    <Avatar
                      sx={{
                        width: 32,
                        height: 32,
                        bgcolor: `${tx.transactionType?.color || '#9E9E9E'}20`,
                        color: tx.transactionType?.color || '#9E9E9E',
                        fontSize: 14,
                      }}
                    >
                      {tx.category?.name?.[0] || tx.transactionType?.name?.[0] || '?'}
                    </Avatar>
                  </ListItemAvatar>
                  <ListItemText
                    primary={
                      <Typography variant="body2" fontWeight={500} noWrap>
                        {tx.notes || tx.transactionType?.name}
                      </Typography>
                    }
                    secondary={
                      <Typography variant="caption" color="text.secondary">
                        {tx.account?.name} • {formatDate(tx.transactionDate)}
                      </Typography>
                    }
                  />
                  <Box textAlign="right">
                    <Typography
                      variant="body2"
                      fontWeight={700}
                      color={isDebit ? 'error.main' : isTransfer ? 'info.main' : 'success.main'}
                    >
                      {isDebit ? '-' : '+'}
                      {formatCurrency(tx.amount)}
                    </Typography>
                    {tx.category && (
                      <Chip
                        label={tx.category.name}
                        size="small"
                        sx={{ height: 16, fontSize: '0.6rem', mt: 0.25 }}
                      />
                    )}
                  </Box>
                </ListItem>
              );
            })}
          </List>
        )}
      </CardContent>
    </Card>
  );
}
