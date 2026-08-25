import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Grid,
  TextField,
  MenuItem,
  Divider,
  Box,
  Typography,
  Alert,
  Chip,
  InputAdornment,
} from '@mui/material';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import {
  transactionSchema,
  type TransactionFormData,
} from '@features/transactions/validation/transaction.schema';
import { useGetAccountsQuery } from '@app/api/accountsApi';
import { useGetAllCategoriesQuery } from '@app/api/categoriesApi';
import { useGetTransactionTypesQuery } from '@app/api/transactionsApi';
import {
  useApproveSmsTransactionMutation,
  useUpdatePendingSmsTransactionMutation,
} from '@app/api/smsImportApi';
import { useAppSettings } from '@core/hooks/useAppSettings';
import { useSnackbar } from 'notistack';
import { useEffect, useMemo } from 'react';
import type { PendingSmsTransactionWithDetails } from '@core/database/types';

interface Props {
  open: boolean;
  onClose: () => void;
  pending: PendingSmsTransactionWithDetails | null;
}

export function SmsReviewDialog({ open, onClose, pending }: Props) {
  const { data: accounts = [] } = useGetAccountsQuery();
  const { data: categories = [] } = useGetAllCategoriesQuery();
  const { data: txTypes = [] } = useGetTransactionTypesQuery();
  const [approveSms, { isLoading: approving }] = useApproveSmsTransactionMutation();
  const [updatePending, { isLoading: saving }] = useUpdatePendingSmsTransactionMutation();
  const { settings } = useAppSettings();
  const { enqueueSnackbar } = useSnackbar();

  const parentCategories = useMemo(() => categories.filter((c) => !c.parentId), [categories]);

  const matchingTypes = useMemo(
    () => (pending ? txTypes.filter((t) => t.direction === pending.direction) : []),
    [pending, txTypes],
  );

  const {
    control,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<TransactionFormData>({
    resolver: zodResolver(transactionSchema),
    defaultValues: {
      transactionDate: new Date().toISOString().split('T')[0],
      isRecurring: false,
      tagIds: [],
    },
  });

  useEffect(() => {
    if (open && pending) {
      reset({
        transactionDate: pending.smsTimestamp.split('T')[0],
        transactionTypeId: matchingTypes.length === 1 ? matchingTypes[0].id! : 0,
        accountId: pending.matchedAccountId ?? 0,
        categoryId: pending.suggestedCategoryId ?? null,
        amount: pending.amount,
        vendor: pending.merchant ?? '',
        referenceNumber: pending.referenceId ?? '',
        notes: `Imported from SMS (${pending.bankKey})`,
        isRecurring: false,
        tagIds: [],
      });
    }
  }, [open, pending, matchingTypes, reset]);

  if (!pending) return null;

  const handleSave = async (data: TransactionFormData) => {
    try {
      await updatePending({
        id: pending.id!,
        data: {
          matchedAccountId: data.accountId || undefined,
          suggestedCategoryId: data.categoryId ?? undefined,
          amount: data.amount,
        },
      }).unwrap();
      enqueueSnackbar('Changes saved', { variant: 'success' });
      onClose();
    } catch {
      enqueueSnackbar('Failed to save changes', { variant: 'error' });
    }
  };

  const handleApprove = async (data: TransactionFormData) => {
    const { tagIds, toAccountId, categoryId, subCategoryId, projectId, ...rest } = data;
    try {
      await approveSms({
        id: pending.id!,
        data: {
          ...rest,
          toAccountId: toAccountId ?? undefined,
          categoryId: categoryId ?? undefined,
          subCategoryId: subCategoryId ?? undefined,
          projectId: projectId ?? undefined,
        },
        tagIds,
      }).unwrap();
      enqueueSnackbar('Transaction created', { variant: 'success' });
      onClose();
    } catch {
      enqueueSnackbar('Failed to approve transaction', { variant: 'error' });
    }
  };

  const isBusy = approving || saving;

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="sm"
      fullWidth
      PaperProps={{ sx: { borderRadius: 3 } }}
    >
      <DialogTitle fontWeight={700}>Review SMS Transaction</DialogTitle>
      <Divider />
      <DialogContent sx={{ pt: 2 }}>
        <Box display="flex" gap={1} flexWrap="wrap" mb={2}>
          <Chip size="small" label={pending.bankKey} variant="outlined" />
          <Chip size="small" label={`Sender: ${pending.smsSender}`} variant="outlined" />
          <Chip
            size="small"
            label={`Confidence: ${pending.confidenceScore}%`}
            color={
              pending.confidenceScore >= 85
                ? 'success'
                : pending.confidenceScore >= 60
                  ? 'warning'
                  : 'default'
            }
          />
        </Box>

        {!pending.matchedAccountId && (
          <Alert severity="warning" sx={{ mb: 2 }}>
            No account matched from the SMS. Select the correct account below before approving.
          </Alert>
        )}
        {matchingTypes.length === 0 && (
          <Alert severity="error" sx={{ mb: 2 }}>
            No active transaction type is configured for "{pending.direction}" transactions. Add one
            in Administration before approving.
          </Alert>
        )}

        <Grid container spacing={2}>
          <Grid size={12}>
            <Controller
              name="transactionTypeId"
              control={control}
              render={({ field }) => (
                <TextField
                  {...field}
                  select
                  fullWidth
                  label="Transaction Type *"
                  error={!!errors.transactionTypeId}
                  helperText={errors.transactionTypeId?.message}
                  value={field.value || ''}
                  onChange={(e) => field.onChange(Number(e.target.value))}
                >
                  {txTypes.map((t) => (
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
              name="transactionDate"
              control={control}
              render={({ field }) => (
                <TextField
                  {...field}
                  type="date"
                  fullWidth
                  label="Date *"
                  InputLabelProps={{ shrink: true }}
                  error={!!errors.transactionDate}
                  helperText={errors.transactionDate?.message}
                />
              )}
            />
          </Grid>

          <Grid size={6}>
            <Controller
              name="amount"
              control={control}
              render={({ field }) => (
                <TextField
                  {...field}
                  type="number"
                  fullWidth
                  label="Amount *"
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">{settings.currencySymbol}</InputAdornment>
                    ),
                  }}
                  error={!!errors.amount}
                  helperText={errors.amount?.message}
                  value={field.value || ''}
                  onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                />
              )}
            />
          </Grid>

          <Grid size={12}>
            <Controller
              name="accountId"
              control={control}
              render={({ field }) => (
                <TextField
                  {...field}
                  select
                  fullWidth
                  label="Account *"
                  error={!!errors.accountId}
                  helperText={
                    errors.accountId?.message ||
                    (pending.accountLast4
                      ? `SMS mentioned account ending ${pending.accountLast4}`
                      : undefined)
                  }
                  value={field.value || ''}
                  onChange={(e) => field.onChange(Number(e.target.value))}
                >
                  {accounts.map((a) => (
                    <MenuItem key={a.id} value={a.id!}>
                      {a.name}
                      {a.accountNumberLast4 ? ` (••${a.accountNumberLast4})` : ''}
                    </MenuItem>
                  ))}
                </TextField>
              )}
            />
          </Grid>

          <Grid size={6}>
            <Controller
              name="categoryId"
              control={control}
              render={({ field }) => (
                <TextField
                  {...field}
                  select
                  fullWidth
                  label="Category"
                  value={field.value || ''}
                  onChange={(e) => field.onChange(e.target.value ? Number(e.target.value) : null)}
                >
                  <MenuItem value="">
                    <em>None</em>
                  </MenuItem>
                  {parentCategories.map((c) => (
                    <MenuItem key={c.id} value={c.id!}>
                      {c.name}
                    </MenuItem>
                  ))}
                </TextField>
              )}
            />
          </Grid>

          <Grid size={6}>
            <Controller
              name="vendor"
              control={control}
              render={({ field }) => (
                <TextField {...field} fullWidth label="Vendor / Payee" value={field.value || ''} />
              )}
            />
          </Grid>

          <Grid size={6}>
            <Controller
              name="referenceNumber"
              control={control}
              render={({ field }) => (
                <TextField {...field} fullWidth label="Reference #" value={field.value || ''} />
              )}
            />
          </Grid>

          {pending.upiId && (
            <Grid size={6}>
              <TextField fullWidth label="UPI ID" value={pending.upiId} disabled />
            </Grid>
          )}

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

        {pending.rawText && (
          <Box mt={2} p={1.5} bgcolor="action.hover" borderRadius={2}>
            <Typography variant="caption" color="text.secondary" display="block" gutterBottom>
              Original SMS (only kept until you approve or ignore this transaction):
            </Typography>
            <Typography variant="body2">{pending.rawText}</Typography>
          </Box>
        )}
      </DialogContent>
      <Divider />
      <DialogActions sx={{ px: 3, py: 2 }}>
        <Button onClick={onClose} disabled={isBusy}>
          Cancel
        </Button>
        <Button onClick={handleSubmit(handleSave)} disabled={isBusy}>
          Save Changes
        </Button>
        <Button
          variant="contained"
          onClick={handleSubmit(handleApprove)}
          disabled={isBusy || matchingTypes.length === 0}
        >
          {approving ? 'Approving...' : 'Approve'}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
