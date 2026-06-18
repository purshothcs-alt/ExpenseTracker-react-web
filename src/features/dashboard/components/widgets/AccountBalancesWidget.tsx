import { Card, CardContent, Typography, List, ListItem, ListItemText, ListItemAvatar, Avatar, Box } from '@mui/material';
import { useGetAccountsQuery } from '@app/api/accountsApi';
import { useAppSettings } from '@core/hooks/useAppSettings';

export function AccountBalancesWidget() {
  const { data: accounts = [], isLoading } = useGetAccountsQuery();
  const { formatCurrency } = useAppSettings();

  const totalBalance = accounts.reduce((s, a) => s + a.currentBalance, 0);

  return (
    <Card sx={{ height: '100%' }}>
      <CardContent>
        <Typography variant="subtitle1" fontWeight={600} mb={0.5}>Account Balances</Typography>
        <Typography variant="h5" fontWeight={800} color="primary.main" mb={1.5}>
          {formatCurrency(totalBalance)}
        </Typography>
        {isLoading ? (
          <Typography color="text.secondary" variant="body2">Loading...</Typography>
        ) : (
          <List dense disablePadding>
            {accounts.map(acc => (
              <ListItem key={acc.id} disablePadding sx={{ py: 0.5 }}>
                <ListItemAvatar sx={{ minWidth: 36 }}>
                  <Avatar sx={{ width: 28, height: 28, bgcolor: `${acc.accountType?.color || '#9E9E9E'}20`, color: acc.accountType?.color || '#9E9E9E', fontSize: 12 }}>
                    {acc.name[0]}
                  </Avatar>
                </ListItemAvatar>
                <ListItemText
                  primary={<Typography variant="body2" fontWeight={500}>{acc.name}</Typography>}
                  secondary={<Typography variant="caption" color="text.secondary">{acc.accountType?.name}</Typography>}
                />
                <Box>
                  <Typography variant="body2" fontWeight={700} color={acc.currentBalance < 0 ? 'error.main' : 'text.primary'}>
                    {formatCurrency(acc.currentBalance)}
                  </Typography>
                </Box>
              </ListItem>
            ))}
          </List>
        )}
      </CardContent>
    </Card>
  );
}
