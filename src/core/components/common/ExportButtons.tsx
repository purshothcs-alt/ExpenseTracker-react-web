import {
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  List,
  ListItemButton,
  ListItemText,
} from '@mui/material';
import PictureAsPdfIcon from '@mui/icons-material/PictureAsPdf';
import TableChartIcon from '@mui/icons-material/TableChart';
import DownloadIcon from '@mui/icons-material/Download';
import { useState, type ReactNode } from 'react';
import { useSnackbar } from 'notistack';

export type ExportFormat = 'pdf' | 'excel' | 'csv';
export type ExportScope = 'page' | 'all';

const FORMATS: Record<ExportFormat, { label: string; icon: ReactNode }> = {
  pdf: { label: 'PDF', icon: <PictureAsPdfIcon /> },
  excel: { label: 'Excel', icon: <TableChartIcon /> },
  csv: { label: 'CSV', icon: <DownloadIcon /> },
};

interface Props {
  formats?: ExportFormat[];
  onExport: (format: ExportFormat, scope: ExportScope) => unknown;
  /** Records on the visible page. Pass with totalCount on paginated screens. */
  pageCount?: number;
  /** Records matching the current filters across all pages. */
  totalCount?: number;
}

/**
 * Export buttons shared by every screen. On paginated screens (when there are more
 * records than the visible page) it asks whether to export the current page or all records.
 */
export function ExportButtons({
  formats = ['excel', 'csv'],
  onExport,
  pageCount,
  totalCount,
}: Props) {
  const [pendingFormat, setPendingFormat] = useState<ExportFormat | null>(null);
  const [busy, setBusy] = useState(false);
  const { enqueueSnackbar } = useSnackbar();

  const hasMorePages =
    pageCount !== undefined && totalCount !== undefined && totalCount > pageCount;

  const run = async (format: ExportFormat, scope: ExportScope) => {
    setPendingFormat(null);
    setBusy(true);
    try {
      await onExport(format, scope);
    } catch {
      enqueueSnackbar('Export failed', { variant: 'error' });
    } finally {
      setBusy(false);
    }
  };

  return (
    <>
      {formats.map((format) => (
        <Button
          key={format}
          variant="outlined"
          startIcon={FORMATS[format].icon}
          size="small"
          disabled={busy}
          onClick={() => (hasMorePages ? setPendingFormat(format) : void run(format, 'all'))}
        >
          {FORMATS[format].label}
        </Button>
      ))}

      <Dialog
        open={pendingFormat !== null}
        onClose={() => setPendingFormat(null)}
        maxWidth="xs"
        fullWidth
      >
        <DialogTitle fontWeight={700}>
          Export to {pendingFormat ? FORMATS[pendingFormat].label : ''}
        </DialogTitle>
        <DialogContent sx={{ pb: 0 }}>
          <List disablePadding>
            <ListItemButton onClick={() => pendingFormat && void run(pendingFormat, 'page')}>
              <ListItemText
                primary="Current page"
                secondary={`${pageCount} record${pageCount !== 1 ? 's' : ''} shown on this page`}
              />
            </ListItemButton>
            <ListItemButton onClick={() => pendingFormat && void run(pendingFormat, 'all')}>
              <ListItemText
                primary="All records"
                secondary={`${totalCount} records matching the current filters`}
              />
            </ListItemButton>
          </List>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={() => setPendingFormat(null)}>Cancel</Button>
        </DialogActions>
      </Dialog>
    </>
  );
}
