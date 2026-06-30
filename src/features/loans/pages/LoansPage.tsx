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
  Chip,
  IconButton,
  Tooltip,
  Avatar,
  LinearProgress,
  InputAdornment,
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import PaymentIcon from '@mui/icons-material/Payment';
import MoneyOffIcon from '@mui/icons-material/MoneyOff';
import { useState } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { PageHeader } from '@core/components/common/PageHeader';
import { EmptyState } from '@core/components/common/EmptyState';
import { ConfirmDialog } from '@core/components/common/ConfirmDialog';
import {
  useGetLoansQuery,
  useGetLoanTypesQuery,
  useCreateLoanMutation,
  useUpdateLoanMutation,
  useDeleteLoanMutation,
  useAddRepaymentMutation,
} from '@app/api/loansApi';
import { useAppSettings } from '@core/hooks/useAppSettings';
import { useSnackbar } from 'notistack';
import type { Loan } from '@core/database/types';

const schema = z.object({
  lenderBorrower: z.string().min(1, 'Name is required'),
  loanTypeId: z.number().positive('Loan type is required'),
  direction: z.enum(['borrowed', 'lent']),
  principal: z.number().positive('Amount must be greater than 0'),
  interestRate: z.number().optional(),
  startDate: z.string().min(1),
  dueDate: z.string().optional(),
  notes: z.string().optional(),
  isSettled: z.boolean(),
});
type FormData = z.infer<typeof schema>;

export function LoansPage() {
  const { formatCurrency, formatDate } = useAppSettings();
  const { enqueueSnackbar } = useSnackbar();
  const { data: loans = [], isLoading } = useGetLoansQuery();
  const { data: loanTypes = [] } = useGetLoanTypesQuery();
  const [create, { isLoading: creating }] = useCreateLoanMutation();
  const [update, { isLoading: updating }] = useUpdateLoanMutation();
  const [deleteLoan, { isLoading: deleting }] = useDeleteLoanMutation();
  const [addRepayment] = useAddRepaymentMutation();

  const [formOpen, setFormOpen] = useState(false);
  const [editLoan, setEditLoan] = useState<Loan | undefined>();
  const [deleteId, setDeleteId] = useState<number | null>(null);
  const [repaymentLoan, setRepaymentLoan] = useState<Loan | undefined>();
  const [repaymentAmount, setRepaymentAmount] = useState('');

  const {
    control,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: {
      direction: 'borrowed',
      isSettled: false,
      startDate: new Date().toISOString().split('T')[0],
    },
  });

  const openForm = (l?: Loan) => {
    setEditLoan(l);
    reset(
      l ?? {
        direction: 'borrowed',
        isSettled: false,
        startDate: new Date().toISOString().split('T')[0],
      },
    );
    setFormOpen(true);
  };

  const onSubmit = async (data: FormData) => {
    try {
      if (editLoan?.id) {
        await update({ id: editLoan.id, data }).unwrap();
        enqueueSnackbar('Loan updated', { variant: 'success' });
      } else {
        await create(data as Omit<Loan, 'id' | 'createdAt' | 'updatedAt'>).unwrap();
        enqueueSnackbar('Loan created', { variant: 'success' });
      }
      setFormOpen(false);
    } catch {
      enqueueSnackbar('Failed to save', { variant: 'error' });
    }
  };

  const handleRepayment = async () => {
    if (!repaymentLoan || !repaymentAmount) return;
    const amount = parseFloat(repaymentAmount);
    if (isNaN(amount) || amount <= 0) return;
    await addRepayment({
      loanId: repaymentLoan.id!,
      amount,
      paymentDate: new Date().toISOString().split('T')[0],
    }).unwrap();
    enqueueSnackbar('Repayment recorded', { variant: 'success' });
    setRepaymentLoan(undefined);
    setRepaymentAmount('');
  };

  const totalBorrowed = loans
    .filter((l) => l.direction === 'borrowed' && !l.isSettled)
    .reduce((s, l) => s + (l.outstanding || 0), 0);
  const totalLent = loans
    .filter((l) => l.direction === 'lent' && !l.isSettled)
    .reduce((s, l) => s + (l.outstanding || 0), 0);

  return (
    <Box>
      <PageHeader
        title="Loans"
        icon={<MoneyOffIcon sx={{ fontSize: 28 }} />}
        subtitle={`${loans.length} loans tracked`}
        actions={
          <Button variant="contained" startIcon={<AddIcon />} onClick={() => openForm()}>
            Add Loan
          </Button>
        }
      />

      <Grid container spacing={2} mb={3}>
        <Grid size={{ xs: 12, sm: 6 }}>
          <Card sx={{ bgcolor: 'error.light', color: 'error.contrastText' }}>
            <CardContent sx={{ py: 1.5 }}>
              <Typography variant="caption" fontWeight={600}>
                OUTSTANDING BORROWED
              </Typography>
              <Typography variant="h5" fontWeight={800}>
                {formatCurrency(totalBorrowed)}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid size={{ xs: 12, sm: 6 }}>
          <Card sx={{ bgcolor: 'success.light', color: 'success.contrastText' }}>
            <CardContent sx={{ py: 1.5 }}>
              <Typography variant="caption" fontWeight={600}>
                OUTSTANDING LENT
              </Typography>
              <Typography variant="h5" fontWeight={800}>
                {formatCurrency(totalLent)}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {!isLoading && loans.length === 0 ? (
        <EmptyState
          title="No loans yet"
          description="Track borrowed and lent money."
          action={{ label: 'Add Loan', onClick: () => openForm() }}
        />
      ) : (
        <Grid container spacing={2}>
          {loans.map((loan) => {
            const pctPaid = loan.principal > 0 ? ((loan.totalPaid || 0) / loan.principal) * 100 : 0;
            const isBorrowed = loan.direction === 'borrowed';
            const color = loan.isSettled ? '#059669' : isBorrowed ? '#DC2626' : '#2563EB';
            return (
              <Grid key={loan.id} size={{ xs: 12, sm: 6, md: 4 }}>
                <Card>
                  <CardContent>
                    <Box display="flex" justifyContent="space-between" alignItems="flex-start">
                      <Box display="flex" alignItems="center" gap={1.5}>
                        <Avatar sx={{ bgcolor: `${color}20`, color, width: 40, height: 40 }}>
                          {loan.lenderBorrower[0]}
                        </Avatar>
                        <Box>
                          <Typography variant="subtitle1" fontWeight={700}>
                            {loan.lenderBorrower}
                          </Typography>
                          <Box display="flex" gap={0.5}>
                            <Chip
                              label={isBorrowed ? 'Borrowed' : 'Lent'}
                              size="small"
                              color={isBorrowed ? 'error' : 'success'}
                              sx={{ height: 18, fontSize: '0.6rem' }}
                            />
                            {loan.isSettled && (
                              <Chip
                                label="Settled"
                                size="small"
                                color="success"
                                variant="outlined"
                                sx={{ height: 18, fontSize: '0.6rem' }}
                              />
                            )}
                          </Box>
                        </Box>
                      </Box>
                      <Box>
                        {!loan.isSettled && (
                          <Tooltip title="Add Repayment">
                            <IconButton
                              size="small"
                              color="primary"
                              onClick={() => {
                                setRepaymentLoan(loan);
                                setRepaymentAmount('');
                              }}
                            >
                              <PaymentIcon fontSize="small" />
                            </IconButton>
                          </Tooltip>
                        )}
                        <IconButton size="small" onClick={() => openForm(loan)}>
                          <EditIcon fontSize="small" />
                        </IconButton>
                        <IconButton
                          size="small"
                          color="error"
                          onClick={() => setDeleteId(loan.id!)}
                        >
                          <DeleteIcon fontSize="small" />
                        </IconButton>
                      </Box>
                    </Box>

                    <Box mt={2}>
                      <Box display="flex" justifyContent="space-between">
                        <Typography variant="caption" color="text.secondary">
                          Principal
                        </Typography>
                        <Typography variant="caption" fontWeight={600}>
                          {formatCurrency(loan.principal)}
                        </Typography>
                      </Box>
                      <Box display="flex" justifyContent="space-between">
                        <Typography variant="caption" color="text.secondary">
                          Paid
                        </Typography>
                        <Typography variant="caption" color="success.main" fontWeight={600}>
                          {formatCurrency(loan.totalPaid || 0)}
                        </Typography>
                      </Box>
                      <Box display="flex" justifyContent="space-between" mt={0.5}>
                        <Typography variant="body2" fontWeight={700}>
                          Outstanding
                        </Typography>
                        <Typography variant="body2" fontWeight={800} color={color}>
                          {formatCurrency(loan.outstanding || 0)}
                        </Typography>
                      </Box>
                      <LinearProgress
                        variant="determinate"
                        value={pctPaid}
                        sx={{
                          mt: 1,
                          height: 6,
                          borderRadius: 3,
                          bgcolor: `${color}20`,
                          '& .MuiLinearProgress-bar': { bgcolor: color },
                        }}
                      />
                    </Box>

                    {loan.dueDate && (
                      <Typography variant="caption" color="text.secondary" mt={1} display="block">
                        Due: {formatDate(loan.dueDate)}
                        {loan.interestRate && ` • ${loan.interestRate}% interest`}
                      </Typography>
                    )}
                  </CardContent>
                </Card>
              </Grid>
            );
          })}
        </Grid>
      )}

      <Dialog open={formOpen} onClose={() => setFormOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle fontWeight={700}>{editLoan ? 'Edit Loan' : 'New Loan'}</DialogTitle>
        <form onSubmit={handleSubmit(onSubmit)}>
          <DialogContent>
            <Grid container spacing={2}>
              <Grid size={12}>
                <Controller
                  name="lenderBorrower"
                  control={control}
                  render={({ field }) => (
                    <TextField
                      {...field}
                      fullWidth
                      label="Lender / Borrower Name *"
                      error={!!errors.lenderBorrower}
                      helperText={errors.lenderBorrower?.message}
                    />
                  )}
                />
              </Grid>
              <Grid size={6}>
                <Controller
                  name="direction"
                  control={control}
                  render={({ field }) => (
                    <TextField {...field} select fullWidth label="Direction">
                      <MenuItem value="borrowed">Borrowed (I owe)</MenuItem>
                      <MenuItem value="lent">Lent (They owe me)</MenuItem>
                    </TextField>
                  )}
                />
              </Grid>
              <Grid size={6}>
                <Controller
                  name="loanTypeId"
                  control={control}
                  render={({ field }) => (
                    <TextField
                      {...field}
                      select
                      fullWidth
                      label="Loan Type *"
                      value={field.value || ''}
                      onChange={(e) => field.onChange(Number(e.target.value))}
                    >
                      {loanTypes.map((t) => (
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
                  name="principal"
                  control={control}
                  render={({ field }) => (
                    <TextField
                      {...field}
                      type="number"
                      fullWidth
                      label="Principal Amount *"
                      InputProps={{
                        startAdornment: <InputAdornment position="start">₹</InputAdornment>,
                      }}
                      error={!!errors.principal}
                      helperText={errors.principal?.message}
                      value={field.value || ''}
                      onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                    />
                  )}
                />
              </Grid>
              <Grid size={6}>
                <Controller
                  name="interestRate"
                  control={control}
                  render={({ field }) => (
                    <TextField
                      {...field}
                      type="number"
                      fullWidth
                      label="Interest Rate (%)"
                      InputProps={{
                        endAdornment: <InputAdornment position="end">%</InputAdornment>,
                      }}
                      value={field.value || ''}
                      onChange={(e) => field.onChange(parseFloat(e.target.value) || undefined)}
                    />
                  )}
                />
              </Grid>
              <Grid size={6}>
                <Controller
                  name="startDate"
                  control={control}
                  render={({ field }) => (
                    <TextField
                      {...field}
                      type="date"
                      fullWidth
                      label="Start Date"
                      InputLabelProps={{ shrink: true }}
                    />
                  )}
                />
              </Grid>
              <Grid size={6}>
                <Controller
                  name="dueDate"
                  control={control}
                  render={({ field }) => (
                    <TextField
                      {...field}
                      type="date"
                      fullWidth
                      label="Due Date"
                      InputLabelProps={{ shrink: true }}
                      value={field.value || ''}
                    />
                  )}
                />
              </Grid>
              <Grid size={12}>
                <Controller
                  name="notes"
                  control={control}
                  render={({ field }) => (
                    <TextField
                      {...field}
                      fullWidth
                      label="Notes"
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
              {creating || updating ? 'Saving...' : editLoan ? 'Update' : 'Create'}
            </Button>
          </DialogActions>
        </form>
      </Dialog>

      <Dialog
        open={!!repaymentLoan}
        onClose={() => setRepaymentLoan(undefined)}
        maxWidth="xs"
        fullWidth
      >
        <DialogTitle>Add Repayment</DialogTitle>
        <DialogContent>
          <Typography variant="body2" color="text.secondary" mb={2}>
            Loan: <strong>{repaymentLoan?.lenderBorrower}</strong>
          </Typography>
          <TextField
            fullWidth
            label="Amount"
            type="number"
            InputProps={{ startAdornment: <InputAdornment position="start">₹</InputAdornment> }}
            value={repaymentAmount}
            onChange={(e) => setRepaymentAmount(e.target.value)}
            autoFocus
          />
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={() => setRepaymentLoan(undefined)}>Cancel</Button>
          <Button variant="contained" onClick={handleRepayment} disabled={!repaymentAmount}>
            Record
          </Button>
        </DialogActions>
      </Dialog>

      <ConfirmDialog
        open={deleteId !== null}
        title="Delete Loan"
        message="Delete this loan and all repayment records?"
        onConfirm={async () => {
          await deleteLoan(deleteId!);
          enqueueSnackbar('Loan deleted', { variant: 'success' });
          setDeleteId(null);
        }}
        onCancel={() => setDeleteId(null)}
        loading={deleting}
      />
    </Box>
  );
}
