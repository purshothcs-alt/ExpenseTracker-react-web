import { useEffect, useRef } from 'react';
import { useSearchParams, useNavigate } from 'react-router';
import { Box, CircularProgress, Typography } from '@mui/material';
import { useSnackbar } from 'notistack';
import { useImportSmsTextMutation } from '@app/api/smsImportApi';

const RESULT_MESSAGES: Record<string, string> = {
  'import-disabled': 'SMS import is turned off in Settings',
  'ignored-not-financial': "This doesn't look like a bank/UPI transaction message",
  unparseable: 'Could not recognize the transaction format — add it manually instead',
  duplicate: 'This transaction was already imported',
  'auto-approved': 'Transaction detected and added automatically',
  'created-pending': 'Transaction detected — review it now',
};

/**
 * Registered as the app's Web Share Target (see vite.config.ts manifest).
 * When a user shares a bank/UPI SMS from their messaging app to this PWA,
 * Android navigates here with the message text in the query string. This
 * is the safe, permission-free alternative to native background SMS
 * reading (see README/architecture notes) — the user still has to
 * initiate the share, but everything downstream reuses the exact same
 * detector/parser/dedup pipeline a future native listener would use.
 *
 * Note: the Share Target API does not expose the original SMS sender
 * header, only the message body (and sometimes a title). Bank-specific
 * parsers therefore usually can't be matched by sender here — the generic
 * UPI/bank-agnostic parser handles it instead, at a slightly lower base
 * confidence.
 */
export function ShareTargetPage() {
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const { enqueueSnackbar } = useSnackbar();
  const [importSmsText] = useImportSmsTextMutation();
  const handled = useRef(false);

  useEffect(() => {
    if (handled.current) return;
    handled.current = true;

    const text = params.get('text') || params.get('title') || '';
    if (!text.trim()) {
      enqueueSnackbar('No message content was shared', { variant: 'warning' });
      navigate('/pending-transactions', { replace: true });
      return;
    }

    importSmsText({ sender: 'SHARED', body: text, timestamp: new Date().toISOString() })
      .unwrap()
      .then((result) => {
        const isPositive = result.status === 'auto-approved' || result.status === 'created-pending';
        enqueueSnackbar(RESULT_MESSAGES[result.status] ?? 'Processed', {
          variant: isPositive ? 'success' : 'info',
        });
      })
      .catch(() => enqueueSnackbar('Failed to process the shared message', { variant: 'error' }))
      .finally(() => navigate('/pending-transactions', { replace: true }));
  }, [params, navigate, importSmsText, enqueueSnackbar]);

  return (
    <Box
      display="flex"
      flexDirection="column"
      alignItems="center"
      justifyContent="center"
      minHeight="60vh"
      gap={2}
    >
      <CircularProgress />
      <Typography color="text.secondary">Processing shared message...</Typography>
    </Box>
  );
}
