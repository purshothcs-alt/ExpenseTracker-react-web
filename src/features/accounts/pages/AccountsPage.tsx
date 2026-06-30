import {
  Box,
  Button,
  Grid,
  Card,
  CardContent,
  Typography,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  MenuItem,
  IconButton,
  Tooltip,
  Chip,
  LinearProgress,
  Avatar,
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import AccountBalanceIcon from '@mui/icons-material/AccountBalance';
import { useState } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { PageHeader } from '@core/components/common/PageHeader';
import { EmptyState } from '@core/components/common/EmptyState';
import { ConfirmDialog } from '@core/components/common/ConfirmDialog';
import { StatCard } from '@core/components/common/StatCard';
import {
  useGetAccountsQuery,
  useGetAccountTypesQuery,
  useCreateAccountMutation,
  useUpdateAccountMutation,
  useDeleteAccountMutation,
} from '@app/api/accountsApi';
import { useAppSettings } from '@core/hooks/useAppSettings';
import { useSnackbar } from 'notistack';
import type { Account } from '@core/database/types';

const schema = z.object({
  name: z.string().min(1, 'Name is required').max(100),
  accountTypeId: z.number().positive('Account type is required'),
  openingBalance: z.number(),
  currency: z.string().min(1),
  description: z.string().optional(),
  isActive: z.boolean(),
});
type FormData = z.infer<typeof schema>;

export function AccountsPage() {
  const { formatCurrency } = useAppSettings();
  const { enqueueSnackbar } = useSnackbar();
  const { data: accounts = [], isLoading } = useGetAccountsQuery();
  const { data: accountTypes = [] } = useGetAccountTypesQuery();
  const [createAccount, { isLoading: creating }] = useCreateAccountMutation();
  const [updateAccount, { isLoading: updating }] = useUpdateAccountMutation();
  const [deleteAccount, { isLoading: deleting }] = useDeleteAccountMutation();

  const [formOpen, setFormOpen] = useState(false);
  const [editAccount, setEditAccount] = useState<Account | undefined>();
  const [deleteId, setDeleteId] = useState<number | null>(null);

  const {
    control,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: { openingBalance: 0, currency: 'INR', isActive: true },
  });

  const openForm = (account?: Account) => {
    setEditAccount(account);
    reset(
      account
        ? { ...account, openingBalance: account.openingBalance ?? 0 }
        : { openingBalance: 0, currency: 'INR', isActive: true },
    );
    setFormOpen(true);
  };

  const onSubmit = async (data: FormData) => {
    try {
      if (editAccount?.id) {
        await updateAccount({ id: editAccount.id, data }).unwrap();
        enqueueSnackbar('Account updated', { variant: 'success' });
      } else {
        await createAccount({ ...data, currentBalance: data.openingBalance }).unwrap();
        enqueueSnackbar('Account created', { variant: 'success' });
      }
      setFormOpen(false);
    } catch {
      enqueueSnackbar('Failed to save account', { variant: 'error' });
    }
  };

  const totalBalance = accounts.reduce((s, a) => s + a.currentBalance, 0);

  return (
    <Box>
      <PageHeader
        title="Accounts"
        icon={<AccountBalanceIcon sx={{ fontSize: 28 }} />}
        subtitle={`${accounts.length} active accounts`}
        actions={
          <Button variant="contained" startIcon={<AddIcon />} onClick={() => openForm()}>
            Add Account
          </Button>
        }
      />

      <Grid container spacing={2} mb={3}>
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <StatCard
            title="Total Balance"
            value={formatCurrency(totalBalance)}
            icon={<AccountBalanceIcon />}
            color="#2563EB"
            loading={isLoading}
          />
        </Grid>
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <StatCard
            title="Active Accounts"
            value={accounts.length}
            color="#059669"
            loading={isLoading}
          />
        </Grid>
      </Grid>

      {accounts.length === 0 && !isLoading ? (
        <EmptyState
          title="No accounts yet"
          description="Add your first account to start tracking your finances."
          action={{ label: 'Add Account', onClick: () => openForm() }}
        />
      ) : (
        <Grid container spacing={2}>
          {accounts.map((account) => {
            const accountType = accountTypes.find((t) => t.id === account.accountTypeId);
            const gain = account.currentBalance - account.openingBalance;
            return (
              <Grid key={account.id} size={{ xs: 12, sm: 6, md: 4, lg: 3 }}>
                <Card sx={{ height: '100%', position: 'relative', overflow: 'hidden' }}>
                  <Box
                    sx={{
                      position: 'absolute',
                      top: 0,
                      left: 0,
                      right: 0,
                      height: 4,
                      bgcolor: accountType?.color || '#9E9E9E',
                    }}
                  />
                  <CardContent sx={{ pt: 2 }}>
                    <Box display="flex" justifyContent="space-between" alignItems="flex-start">
                      <Box display="flex" alignItems="center" gap={1.5}>
                        <Avatar
                          sx={{
                            bgcolor: `${accountType?.color || '#9E9E9E'}20`,
                            color: accountType?.color || '#9E9E9E',
                            width: 40,
                            height: 40,
                          }}
                        >
                          {account.name[0]}
                        </Avatar>
                        <Box>
                          <Typography variant="subtitle2" fontWeight={700}>
                            {account.name}
                          </Typography>
                          <Chip
                            label={accountType?.name || 'Unknown'}
                            size="small"
                            sx={{ height: 18, fontSize: '0.65rem' }}
                          />
                        </Box>
                      </Box>
                      <Box>
                        <Tooltip title="Edit">
                          <IconButton size="small" onClick={() => openForm(account)}>
                            <EditIcon fontSize="small" />
                          </IconButton>
                        </Tooltip>
                        <Tooltip title="Delete">
                          <IconButton
                            size="small"
                            color="error"
                            onClick={() => setDeleteId(account.id!)}
                          >
                            <DeleteIcon fontSize="small" />
                          </IconButton>
                        </Tooltip>
                      </Box>
                    </Box>

                    <Box mt={2}>
                      <Typography variant="caption" color="text.secondary">
                        Current Balance
                      </Typography>
                      <Typography
                        variant="h5"
                        fontWeight={800}
                        color={account.currentBalance < 0 ? 'error.main' : 'text.primary'}
                      >
                        {formatCurrency(account.currentBalance)}
                      </Typography>
                      <Box display="flex" alignItems="center" gap={0.5} mt={0.5}>
                        <Typography variant="caption" color="text.secondary">
                          Opening: {formatCurrency(account.openingBalance)}
                        </Typography>
                        <Typography
                          variant="caption"
                          color={gain >= 0 ? 'success.main' : 'error.main'}
                          fontWeight={600}
                        >
                          ({gain >= 0 ? '+' : ''}
                          {formatCurrency(gain)})
                        </Typography>
                      </Box>
                    </Box>

                    {account.description && (
                      <Typography variant="caption" color="text.secondary" mt={1} display="block">
                        {account.description}
                      </Typography>
                    )}
                  </CardContent>
                  {isLoading && <LinearProgress />}
                </Card>
              </Grid>
            );
          })}
        </Grid>
      )}

      <Dialog open={formOpen} onClose={() => setFormOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle fontWeight={700}>{editAccount ? 'Edit Account' : 'New Account'}</DialogTitle>
        <form onSubmit={handleSubmit(onSubmit)}>
          <DialogContent>
            <Grid container spacing={2}>
              <Grid size={12}>
                <Controller
                  name="name"
                  control={control}
                  render={({ field }) => (
                    <TextField
                      {...field}
                      fullWidth
                      label="Account Name *"
                      error={!!errors.name}
                      helperText={errors.name?.message}
                    />
                  )}
                />
              </Grid>
              <Grid size={12}>
                <Controller
                  name="accountTypeId"
                  control={control}
                  render={({ field }) => (
                    <TextField
                      {...field}
                      select
                      fullWidth
                      label="Account Type *"
                      error={!!errors.accountTypeId}
                      helperText={errors.accountTypeId?.message}
                      value={field.value || ''}
                      onChange={(e) => field.onChange(Number(e.target.value))}
                    >
                      {accountTypes.map((t) => (
                        <MenuItem key={t.id} value={t.id!}>
                          {t.name}
                        </MenuItem>
                      ))}
                    </TextField>
                  )}
                />
              </Grid>
              <Grid size={6}>
                <Controller
                  name="openingBalance"
                  control={control}
                  render={({ field }) => (
                    <TextField
                      {...field}
                      type="number"
                      fullWidth
                      label="Opening Balance"
                      value={field.value || ''}
                      onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                    />
                  )}
                />
              </Grid>
              <Grid size={6}>
                <Controller
                  name="currency"
                  control={control}
                  render={({ field }) => <TextField {...field} fullWidth label="Currency" />}
                />
              </Grid>
              <Grid size={12}>
                <Controller
                  name="description"
                  control={control}
                  render={({ field }) => (
                    <TextField
                      {...field}
                      fullWidth
                      label="Description (optional)"
                      multiline
                      rows={2}
                      value={field.value || ''}
                    />
                  )}
                />
              </Grid>
            </Grid>
          </DialogContent>
          <DialogActions sx={{ px: 3, pb: 2 }}>
            <Button onClick={() => setFormOpen(false)}>Cancel</Button>
            <Button type="submit" variant="contained" disabled={creating || updating}>
              {creating || updating ? 'Saving...' : editAccount ? 'Update' : 'Create'}
            </Button>
          </DialogActions>
        </form>
      </Dialog>

      <ConfirmDialog
        open={deleteId !== null}
        title="Delete Account"
        message="Are you sure? All transactions linked to this account will remain but the account will be removed."
        onConfirm={async () => {
          await deleteAccount(deleteId!).unwrap();
          enqueueSnackbar('Account deleted', { variant: 'success' });
          setDeleteId(null);
        }}
        onCancel={() => setDeleteId(null)}
        loading={deleting}
      />
    </Box>
  );
}
