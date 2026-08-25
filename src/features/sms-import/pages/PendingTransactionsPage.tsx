import {
  Box,
  Card,
  CardContent,
  Typography,
  Chip,
  Button,
  Tabs,
  Tab,
  Stack,
  TextField,
  IconButton,
  Tooltip,
  Divider,
} from '@mui/material';
import SmsIcon from '@mui/icons-material/Sms';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import CancelIcon from '@mui/icons-material/Cancel';
import EditIcon from '@mui/icons-material/Edit';
import DeleteSweepIcon from '@mui/icons-material/DeleteSweep';
import { useMemo, useState } from 'react';
import { useSnackbar } from 'notistack';
import { PageHeader } from '@core/components/common/PageHeader';
import { EmptyState } from '@core/components/common/EmptyState';
import { ConfirmDialog } from '@core/components/common/ConfirmDialog';
import { useAppSettings } from '@core/hooks/useAppSettings';
import { useGetTransactionTypesQuery } from '@app/api/transactionsApi';
import {
  useGetPendingSmsTransactionsQuery,
  useApproveSmsTransactionMutation,
  useIgnoreSmsTransactionMutation,
  useImportSmsTextMutation,
  useClearSmsImportHistoryMutation,
} from '@app/api/smsImportApi';
import { SmsReviewDialog } from '../components/SmsReviewDialog';
import type { PendingSmsTransactionWithDetails, SmsTransactionStatus } from '@core/database/types';

const TABS: { value: SmsTransactionStatus; label: string }[] = [
  { value: 'pending', label: 'Pending' },
  { value: 'approved', label: 'Approved' },
  { value: 'ignored', label: 'Ignored' },
];

export function PendingTransactionsPage() {
  const [tab, setTab] = useState<SmsTransactionStatus>('pending');
  const [editTarget, setEditTarget] = useState<PendingSmsTransactionWithDetails | null>(null);
  const [ignoreTarget, setIgnoreTarget] = useState<PendingSmsTransactionWithDetails | null>(null);
  const [clearConfirmOpen, setClearConfirmOpen] = useState(false);
  const [pasteText, setPasteText] = useState('');
  const [pasteSender, setPasteSender] = useState('');

  const { formatCurrency, formatDate } = useAppSettings();
  const { enqueueSnackbar } = useSnackbar();

  const { data: rows = [], isLoading } = useGetPendingSmsTransactionsQuery(tab);
  const { data: txTypes = [] } = useGetTransactionTypesQuery();
  const [approveSms] = useApproveSmsTransactionMutation();
  const [ignoreSms, { isLoading: ignoring }] = useIgnoreSmsTransactionMutation();
  const [importSmsText, { isLoading: importing }] = useImportSmsTextMutation();
  const [clearHistory] = useClearSmsImportHistoryMutation();

  const typesByDirection = useMemo(() => {
    const map = new Map<string, number>();
    for (const t of txTypes) {
      if (t.isActive === false) continue;
      const count = txTypes.filter(
        (x) => x.direction === t.direction && x.isActive !== false,
      ).length;
      if (count === 1) map.set(t.direction, t.id!);
    }
    return map;
  }, [txTypes]);

  const handleQuickApprove = async (row: PendingSmsTransactionWithDetails) => {
    const transactionTypeId = typesByDirection.get(row.direction);
    if (!row.matchedAccountId || !transactionTypeId) return;
    try {
      await approveSms({
        id: row.id!,
        data: {
          transactionDate: row.smsTimestamp.split('T')[0],
          accountId: row.matchedAccountId,
          transactionTypeId,
          categoryId: row.suggestedCategoryId,
          amount: row.amount,
          vendor: row.merchant,
          referenceNumber: row.referenceId,
          notes: `Imported from SMS (${row.bankKey})`,
          isRecurring: false,
        },
      }).unwrap();
      enqueueSnackbar('Transaction created', { variant: 'success' });
    } catch {
      enqueueSnackbar('Failed to approve transaction', { variant: 'error' });
    }
  };

  const handleIgnore = async () => {
    if (!ignoreTarget) return;
    try {
      await ignoreSms(ignoreTarget.id!).unwrap();
      enqueueSnackbar('Transaction ignored', { variant: 'success' });
    } catch {
      enqueueSnackbar('Failed to ignore transaction', { variant: 'error' });
    } finally {
      setIgnoreTarget(null);
    }
  };

  const handleClearHistory = async () => {
    try {
      const count = await clearHistory().unwrap();
      enqueueSnackbar(`Removed ${count} resolved SMS record${count === 1 ? '' : 's'}`, {
        variant: 'success',
      });
    } catch {
      enqueueSnackbar('Failed to clear history', { variant: 'error' });
    } finally {
      setClearConfirmOpen(false);
    }
  };

  const handleImportPasted = async () => {
    if (!pasteText.trim()) return;
    try {
      const result = await importSmsText({
        sender: pasteSender.trim() || 'MANUAL',
        body: pasteText.trim(),
        timestamp: new Date().toISOString(),
      }).unwrap();

      switch (result.status) {
        case 'import-disabled':
          enqueueSnackbar('SMS import is turned off in Settings', { variant: 'warning' });
          break;
        case 'ignored-not-financial':
          enqueueSnackbar("This doesn't look like a bank/UPI transaction message", {
            variant: 'info',
          });
          break;
        case 'unparseable':
          enqueueSnackbar('Could not recognize the transaction format — add it manually instead', {
            variant: 'warning',
          });
          break;
        case 'duplicate':
          enqueueSnackbar('This transaction was already imported', { variant: 'info' });
          break;
        case 'auto-approved':
          enqueueSnackbar('Transaction detected and added automatically', { variant: 'success' });
          break;
        case 'created-pending':
          enqueueSnackbar('Transaction detected — review it below', { variant: 'success' });
          break;
      }
      setPasteText('');
      setPasteSender('');
    } catch {
      enqueueSnackbar('Failed to process the message', { variant: 'error' });
    }
  };

  return (
    <Box>
      <PageHeader
        title="Pending Transactions"
        subtitle="Bank/UPI transactions detected from SMS, waiting for your review"
        icon={<SmsIcon fontSize="large" />}
        actions={
          <Button
            startIcon={<DeleteSweepIcon />}
            onClick={() => setClearConfirmOpen(true)}
            disabled={tab === 'pending'}
          >
            Clear History
          </Button>
        }
      />

      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Typography variant="subtitle2" fontWeight={600} gutterBottom>
            Import an SMS manually
          </Typography>
          <Typography variant="body2" color="text.secondary" mb={2}>
            Until a bank/UPI SMS is shared to this app from your messaging app, you can paste one
            here to test parsing or import it directly.
          </Typography>
          <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
            <TextField
              label="Sender (optional)"
              placeholder="e.g. HDFCBK"
              value={pasteSender}
              onChange={(e) => setPasteSender(e.target.value)}
              sx={{ width: { xs: '100%', sm: 200 } }}
            />
            <TextField
              label="SMS text"
              placeholder="Rs.1,299.00 debited from A/c XX1234 to AMAZON on 25-08-26. UPI Ref 123456789012."
              value={pasteText}
              onChange={(e) => setPasteText(e.target.value)}
              fullWidth
              multiline
              minRows={1}
            />
            <Button
              variant="contained"
              onClick={handleImportPasted}
              disabled={importing || !pasteText.trim()}
              sx={{ minWidth: 120 }}
            >
              {importing ? 'Checking...' : 'Import'}
            </Button>
          </Stack>
        </CardContent>
      </Card>

      <Tabs value={tab} onChange={(_, v) => setTab(v)} sx={{ mb: 2 }}>
        {TABS.map((t) => (
          <Tab key={t.value} value={t.value} label={t.label} />
        ))}
      </Tabs>

      {!isLoading && rows.length === 0 && (
        <EmptyState
          icon={<SmsIcon />}
          title={`No ${tab} SMS transactions`}
          description={
            tab === 'pending'
              ? 'Detected bank/UPI SMS transactions will show up here for review before they are added.'
              : undefined
          }
        />
      )}

      <Stack spacing={2}>
        {rows.map((row) => {
          const canQuickApprove =
            row.status === 'pending' &&
            !!row.matchedAccountId &&
            typesByDirection.has(row.direction);
          return (
            <Card key={row.id} variant="outlined">
              <CardContent>
                <Box display="flex" justifyContent="space-between" flexWrap="wrap" gap={1}>
                  <Box>
                    <Stack direction="row" spacing={1} alignItems="center" mb={0.5}>
                      <Chip
                        size="small"
                        label={row.direction === 'credit' ? 'Income' : 'Expense'}
                        color={row.direction === 'credit' ? 'success' : 'error'}
                      />
                      <Typography variant="h6" fontWeight={700}>
                        {formatCurrency(row.amount)}
                      </Typography>
                    </Stack>
                    <Typography variant="body2" color="text.secondary">
                      {row.merchant || 'Unknown merchant'} · {row.bankKey} ·{' '}
                      {formatDate(row.smsTimestamp)}
                    </Typography>
                    <Stack direction="row" spacing={1} mt={1} flexWrap="wrap" useFlexGap>
                      {row.matchedAccount ? (
                        <Chip
                          size="small"
                          variant="outlined"
                          label={`Account: ${row.matchedAccount.name}`}
                        />
                      ) : (
                        <Chip size="small" color="warning" label="Account not matched" />
                      )}
                      {row.suggestedCategory && (
                        <Chip
                          size="small"
                          variant="outlined"
                          label={`Category: ${row.suggestedCategory.name}`}
                        />
                      )}
                      <Chip
                        size="small"
                        variant="outlined"
                        label={`Confidence: ${row.confidenceScore}%`}
                        color={
                          row.confidenceScore >= 85
                            ? 'success'
                            : row.confidenceScore >= 60
                              ? 'warning'
                              : 'default'
                        }
                      />
                    </Stack>
                  </Box>

                  {row.status === 'pending' && (
                    <Stack direction="row" spacing={1} alignItems="flex-start">
                      <Tooltip
                        title={
                          canQuickApprove ? 'Approve' : 'Select account/category first via Edit'
                        }
                      >
                        <span>
                          <IconButton
                            color="success"
                            disabled={!canQuickApprove}
                            onClick={() => handleQuickApprove(row)}
                          >
                            <CheckCircleIcon />
                          </IconButton>
                        </span>
                      </Tooltip>
                      <Tooltip title="Edit">
                        <IconButton onClick={() => setEditTarget(row)}>
                          <EditIcon />
                        </IconButton>
                      </Tooltip>
                      <Tooltip title="Ignore">
                        <IconButton
                          color="error"
                          disabled={ignoring}
                          onClick={() => setIgnoreTarget(row)}
                        >
                          <CancelIcon />
                        </IconButton>
                      </Tooltip>
                    </Stack>
                  )}
                </Box>
              </CardContent>
            </Card>
          );
        })}
      </Stack>

      <Divider sx={{ my: 3 }} />
      <Typography variant="caption" color="text.disabled">
        Only the fields needed for review are stored — original SMS text is kept solely while a
        transaction is pending and is deleted automatically once you approve or ignore it.
      </Typography>

      <SmsReviewDialog
        open={!!editTarget}
        onClose={() => setEditTarget(null)}
        pending={editTarget}
      />

      <ConfirmDialog
        open={!!ignoreTarget}
        title="Ignore this transaction?"
        message="This SMS transaction will be marked as ignored and won't be imported."
        confirmLabel="Ignore"
        confirmColor="warning"
        loading={ignoring}
        onConfirm={handleIgnore}
        onCancel={() => setIgnoreTarget(null)}
      />

      <ConfirmDialog
        open={clearConfirmOpen}
        title="Clear SMS import history?"
        message="This permanently deletes approved and ignored SMS import records. Transactions already created in your ledger are not affected."
        confirmLabel="Clear"
        confirmColor="error"
        onConfirm={handleClearHistory}
        onCancel={() => setClearConfirmOpen(false)}
      />
    </Box>
  );
}
