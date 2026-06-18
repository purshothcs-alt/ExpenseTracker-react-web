import {
  Box, Button, Grid, Card, CardContent, Typography,
  Dialog, DialogTitle, DialogContent, DialogActions,
  TextField, MenuItem, LinearProgress, Chip, IconButton,
  InputAdornment,
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import DonutLargeIcon from '@mui/icons-material/DonutLarge';
import WarningIcon from '@mui/icons-material/Warning';
import { useState } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { PageHeader } from '@core/components/common/PageHeader';
import { EmptyState } from '@core/components/common/EmptyState';
import { ConfirmDialog } from '@core/components/common/ConfirmDialog';
import { useGetBudgetsQuery, useCreateBudgetMutation, useUpdateBudgetMutation, useDeleteBudgetMutation } from '@app/api/budgetsApi';
import { useGetAllCategoriesQuery } from '@app/api/categoriesApi';
import { useGetAccountsQuery } from '@app/api/accountsApi';
import { useAppSettings } from '@core/hooks/useAppSettings';
import { useSnackbar } from 'notistack';
import dayjs from 'dayjs';
import type { Budget, BudgetWithDetails } from '@core/database/types';

const schema = z.object({
  name: z.string().min(1, 'Name is required'),
  categoryId: z.number().optional().nullable(),
  accountId: z.number().optional().nullable(),
  amount: z.number().positive('Amount must be greater than 0'),
  startDate: z.string().min(1),
  endDate: z.string().min(1),
  period: z.enum(['daily', 'weekly', 'monthly', 'quarterly', 'yearly', 'custom']),
  alertThreshold: z.number().min(1).max(100),
  isActive: z.boolean(),
});
type FormData = z.infer<typeof schema>;

function BudgetCard({ budget, onEdit, onDelete, formatCurrency }: {
  budget: BudgetWithDetails;
  onEdit: () => void;
  onDelete: () => void;
  formatCurrency: (n: number) => string;
}) {
  const pct = budget.utilizationPct || 0;
  const isOver = pct >= 100;
  const isNear = pct >= budget.alertThreshold && !isOver;
  const barColor = isOver ? '#DC2626' : isNear ? '#D97706' : '#059669';

  return (
    <Card sx={{ height: '100%' }}>
      <CardContent>
        <Box display="flex" justifyContent="space-between" alignItems="flex-start" mb={1}>
          <Box>
            <Typography variant="subtitle1" fontWeight={700}>{budget.name}</Typography>
            {budget.category && (
              <Chip label={budget.category.name} size="small" sx={{ height: 18, fontSize: '0.65rem', mt: 0.25 }} />
            )}
          </Box>
          <Box display="flex" alignItems="center" gap={0.5}>
            {isOver && <Chip label="Over Budget" color="error" size="small" icon={<WarningIcon />} />}
            {isNear && <Chip label="Near Limit" color="warning" size="small" icon={<WarningIcon />} />}
            <IconButton size="small" onClick={onEdit}><EditIcon fontSize="small" /></IconButton>
            <IconButton size="small" color="error" onClick={onDelete}><DeleteIcon fontSize="small" /></IconButton>
          </Box>
        </Box>

        <Box mt={2}>
          <Box display="flex" justifyContent="space-between" mb={0.5}>
            <Typography variant="h6" fontWeight={800}>{formatCurrency(budget.spent || 0)}</Typography>
            <Typography variant="body2" color="text.secondary">of {formatCurrency(budget.amount)}</Typography>
          </Box>
          <LinearProgress
            variant="determinate"
            value={Math.min(pct, 100)}
            sx={{
              height: 8, borderRadius: 4,
              bgcolor: `${barColor}20`,
              '& .MuiLinearProgress-bar': { bgcolor: barColor, borderRadius: 4 },
            }}
          />
          <Box display="flex" justifyContent="space-between" mt={0.75}>
            <Typography variant="caption" color="text.secondary">
              Remaining: {formatCurrency(Math.max(0, budget.remaining || 0))}
            </Typography>
            <Typography variant="caption" fontWeight={700} color={barColor}>{pct.toFixed(1)}%</Typography>
          </Box>
        </Box>

        <Box mt={1.5} display="flex" justifyContent="space-between">
          <Typography variant="caption" color="text.secondary">
            {dayjs(budget.startDate).format('DD MMM')} - {dayjs(budget.endDate).format('DD MMM YYYY')}
          </Typography>
          <Chip label={budget.period} size="small" variant="outlined" sx={{ height: 18, fontSize: '0.6rem' }} />
        </Box>
      </CardContent>
    </Card>
  );
}

export function BudgetsPage() {
  const { formatCurrency } = useAppSettings();
  const { enqueueSnackbar } = useSnackbar();
  const { data: budgets = [], isLoading } = useGetBudgetsQuery();
  const { data: categories = [] } = useGetAllCategoriesQuery();
  const { data: accounts = [] } = useGetAccountsQuery();
  const [create, { isLoading: creating }] = useCreateBudgetMutation();
  const [update, { isLoading: updating }] = useUpdateBudgetMutation();
  const [deleteBudget, { isLoading: deleting }] = useDeleteBudgetMutation();

  const [formOpen, setFormOpen] = useState(false);
  const [editBudget, setEditBudget] = useState<Budget | undefined>();
  const [deleteId, setDeleteId] = useState<number | null>(null);

  const { control, handleSubmit, reset, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: {
      amount: 0, alertThreshold: 80, isActive: true,
      startDate: dayjs().startOf('month').format('YYYY-MM-DD'),
      endDate: dayjs().endOf('month').format('YYYY-MM-DD'),
      period: 'monthly',
    },
  });

  const openForm = (b?: Budget) => {
    setEditBudget(b);
    reset(b ?? {
      amount: 0, alertThreshold: 80, isActive: true,
      startDate: dayjs().startOf('month').format('YYYY-MM-DD'),
      endDate: dayjs().endOf('month').format('YYYY-MM-DD'),
      period: 'monthly',
    });
    setFormOpen(true);
  };

  const onSubmit = async (data: FormData) => {
    const { categoryId, accountId, ...rest } = data;
    const sanitized = { ...rest, categoryId: categoryId ?? undefined, accountId: accountId ?? undefined };
    try {
      if (editBudget?.id) {
        await update({ id: editBudget.id, data: sanitized }).unwrap();
        enqueueSnackbar('Budget updated', { variant: 'success' });
      } else {
        await create(sanitized as Omit<Budget, 'id' | 'createdAt' | 'updatedAt'>).unwrap();
        enqueueSnackbar('Budget created', { variant: 'success' });
      }
      setFormOpen(false);
    } catch { enqueueSnackbar('Failed to save', { variant: 'error' }); }
  };

  const parentCategories = categories.filter(c => !c.parentId);

  return (
    <Box>
      <PageHeader
        title="Budgets"
        icon={<DonutLargeIcon sx={{ fontSize: 28 }} />}
        subtitle={`${budgets.length} active budgets`}
        actions={<Button variant="contained" startIcon={<AddIcon />} onClick={() => openForm()}>Add Budget</Button>}
      />

      {!isLoading && budgets.length === 0 ? (
        <EmptyState title="No budgets yet" description="Create budgets to control your spending." action={{ label: 'Add Budget', onClick: () => openForm() }} />
      ) : (
        <Grid container spacing={2}>
          {budgets.map(b => (
            <Grid key={b.id} size={{ xs: 12, sm: 6, md: 4 }}>
              <BudgetCard budget={b} onEdit={() => openForm(b)} onDelete={() => setDeleteId(b.id!)} formatCurrency={formatCurrency} />
            </Grid>
          ))}
        </Grid>
      )}

      <Dialog open={formOpen} onClose={() => setFormOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle fontWeight={700}>{editBudget ? 'Edit Budget' : 'New Budget'}</DialogTitle>
        <form onSubmit={handleSubmit(onSubmit)}>
          <DialogContent>
            <Grid container spacing={2}>
              <Grid size={12}>
                <Controller name="name" control={control} render={({ field }) => (
                  <TextField {...field} fullWidth label="Budget Name *" error={!!errors.name} helperText={errors.name?.message} />
                )} />
              </Grid>
              <Grid size={12}>
                <Controller name="categoryId" control={control} render={({ field }) => (
                  <TextField {...field} select fullWidth label="Category" value={field.value || ''} onChange={e => field.onChange(e.target.value ? Number(e.target.value) : null)}>
                    <MenuItem value=""><em>All Categories</em></MenuItem>
                    {parentCategories.map(c => <MenuItem key={c.id} value={c.id!}>{c.name}</MenuItem>)}
                  </TextField>
                )} />
              </Grid>
              <Grid size={12}>
                <Controller name="accountId" control={control} render={({ field }) => (
                  <TextField {...field} select fullWidth label="Account" value={field.value || ''} onChange={e => field.onChange(e.target.value ? Number(e.target.value) : null)}>
                    <MenuItem value=""><em>All Accounts</em></MenuItem>
                    {accounts.map(a => <MenuItem key={a.id} value={a.id!}>{a.name}</MenuItem>)}
                  </TextField>
                )} />
              </Grid>
              <Grid size={6}>
                <Controller name="amount" control={control} render={({ field }) => (
                  <TextField {...field} type="number" fullWidth label="Budget Amount *"
                    InputProps={{ startAdornment: <InputAdornment position="start">₹</InputAdornment> }}
                    error={!!errors.amount} helperText={errors.amount?.message}
                    value={field.value || ''} onChange={e => field.onChange(parseFloat(e.target.value) || 0)} />
                )} />
              </Grid>
              <Grid size={6}>
                <Controller name="period" control={control} render={({ field }) => (
                  <TextField {...field} select fullWidth label="Period">
                    {['daily', 'weekly', 'monthly', 'quarterly', 'yearly', 'custom'].map(p => <MenuItem key={p} value={p}>{p.charAt(0).toUpperCase() + p.slice(1)}</MenuItem>)}
                  </TextField>
                )} />
              </Grid>
              <Grid size={6}>
                <Controller name="startDate" control={control} render={({ field }) => (
                  <TextField {...field} type="date" fullWidth label="Start Date" InputLabelProps={{ shrink: true }} />
                )} />
              </Grid>
              <Grid size={6}>
                <Controller name="endDate" control={control} render={({ field }) => (
                  <TextField {...field} type="date" fullWidth label="End Date" InputLabelProps={{ shrink: true }} />
                )} />
              </Grid>
              <Grid size={12}>
                <Controller name="alertThreshold" control={control} render={({ field }) => (
                  <TextField {...field} type="number" fullWidth label="Alert Threshold (%)"
                    InputProps={{ endAdornment: <InputAdornment position="end">%</InputAdornment> }}
                    value={field.value || 80} onChange={e => field.onChange(Number(e.target.value))} />
                )} />
              </Grid>
            </Grid>
          </DialogContent>
          <DialogActions sx={{ px: 3, pb: 2 }}>
            <Button onClick={() => setFormOpen(false)}>Cancel</Button>
            <Button type="submit" variant="contained" disabled={creating || updating}>
              {creating || updating ? 'Saving...' : editBudget ? 'Update' : 'Create'}
            </Button>
          </DialogActions>
        </form>
      </Dialog>

      <ConfirmDialog open={deleteId !== null} title="Delete Budget" message="Are you sure you want to delete this budget?" onConfirm={async () => { await deleteBudget(deleteId!); enqueueSnackbar('Budget deleted', { variant: 'success' }); setDeleteId(null); }} onCancel={() => setDeleteId(null)} loading={deleting} />
    </Box>
  );
}
