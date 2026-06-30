import {
  Box,
  Button,
  Card,
  CardContent,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TablePagination,
  TextField,
  MenuItem,
  Chip,
  IconButton,
  Tooltip,
  Checkbox,
  Typography,
  InputAdornment,
  Skeleton,
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import SearchIcon from '@mui/icons-material/Search';
import FilterListIcon from '@mui/icons-material/FilterList';
import FileDownloadIcon from '@mui/icons-material/FileDownload';
import ReceiptLongIcon from '@mui/icons-material/ReceiptLong';
import { useState, useMemo } from 'react';
import { PageHeader } from '@core/components/common/PageHeader';
import { EmptyState } from '@core/components/common/EmptyState';
import { ConfirmDialog } from '@core/components/common/ConfirmDialog';
import { TransactionForm } from '../components/TransactionForm';
import {
  useGetTransactionsQuery,
  useDeleteTransactionMutation,
  useBulkDeleteTransactionsMutation,
  useDuplicateTransactionMutation,
  useGetTransactionTypesQuery,
} from '@app/api/transactionsApi';
import { useGetAccountsQuery } from '@app/api/accountsApi';
import { useGetAllCategoriesQuery } from '@app/api/categoriesApi';
import { useAppSettings } from '@core/hooks/useAppSettings';
import { useDebounce } from '@core/hooks/useDebounce';
import { exportToCSV, exportToExcel } from '@core/utils/export';
import type { TransactionFilter, Transaction } from '@core/database/types';
import { useSnackbar } from 'notistack';
import dayjs from 'dayjs';

export function TransactionsPage() {
  const { formatCurrency, formatDate } = useAppSettings();
  const { enqueueSnackbar } = useSnackbar();

  const [formOpen, setFormOpen] = useState(false);
  const [editTx, setEditTx] = useState<Transaction | undefined>();
  const [deleteConfirm, setDeleteConfirm] = useState<number | null>(null);
  const [selectedIds, setSelectedIds] = useState<number[]>([]);
  const [bulkDeleteConfirm, setBulkDeleteConfirm] = useState(false);
  const [page, setPage] = useState(0);
  const [pageSize, setPageSize] = useState(20);
  const [search, setSearch] = useState('');
  const [filterType, setFilterType] = useState('');
  const [filterAccount, setFilterAccount] = useState('');
  const [filterStart, setFilterStart] = useState(dayjs().startOf('month').format('YYYY-MM-DD'));
  const [filterEnd, setFilterEnd] = useState(dayjs().endOf('month').format('YYYY-MM-DD'));

  const debouncedSearch = useDebounce(search, 300);

  const filter: TransactionFilter = useMemo(
    () => ({
      search: debouncedSearch || undefined,
      transactionTypeId: filterType ? Number(filterType) : undefined,
      accountId: filterAccount ? Number(filterAccount) : undefined,
      startDate: filterStart || undefined,
      endDate: filterEnd || undefined,
      page: page + 1,
      pageSize,
      sortOrder: 'desc',
    }),
    [debouncedSearch, filterType, filterAccount, filterStart, filterEnd, page, pageSize],
  );

  const { data: result, isLoading } = useGetTransactionsQuery(filter);
  const { data: txTypes = [] } = useGetTransactionTypesQuery();
  const { data: accounts = [] } = useGetAccountsQuery();
  const { data: categories = [] } = useGetAllCategoriesQuery();
  const [deleteTransaction, { isLoading: deleting }] = useDeleteTransactionMutation();
  const [bulkDelete, { isLoading: bulkDeleting }] = useBulkDeleteTransactionsMutation();
  const [duplicate] = useDuplicateTransactionMutation();

  const transactions = result?.data || [];
  const total = result?.total || 0;

  const catMap = useMemo(() => new Map(categories.map((c) => [c.id!, c])), [categories]);
  const typeMap = useMemo(() => new Map(txTypes.map((t) => [t.id!, t])), [txTypes]);
  const accMap = useMemo(() => new Map(accounts.map((a) => [a.id!, a])), [accounts]);

  const handleDelete = async () => {
    if (!deleteConfirm) return;
    await deleteTransaction(deleteConfirm).unwrap();
    enqueueSnackbar('Transaction deleted', { variant: 'success' });
    setDeleteConfirm(null);
  };

  const handleBulkDelete = async () => {
    await bulkDelete(selectedIds).unwrap();
    enqueueSnackbar(`${selectedIds.length} transactions deleted`, { variant: 'success' });
    setSelectedIds([]);
    setBulkDeleteConfirm(false);
  };

  const handleDuplicate = async (id: number) => {
    await duplicate(id).unwrap();
    enqueueSnackbar('Transaction duplicated', { variant: 'success' });
  };

  const handleExportCSV = () => {
    exportToCSV(
      [
        { header: 'Date', key: 'transactionDate' as never },
        {
          header: 'Type',
          key: 'transactionTypeId' as never,
          format: (v: unknown) => typeMap.get(v as number)?.name || '',
        },
        {
          header: 'Account',
          key: 'accountId' as never,
          format: (v: unknown) => accMap.get(v as number)?.name || '',
        },
        {
          header: 'Category',
          key: 'categoryId' as never,
          format: (v: unknown) => catMap.get(v as number)?.name || '',
        },
        { header: 'Amount', key: 'amount' as never, format: (v: unknown) => String(v) },
        { header: 'Notes', key: 'notes' as never },
      ],
      transactions,
      'transactions',
    );
  };

  const handleExportExcel = () => {
    exportToExcel(
      'Transactions',
      [
        { header: 'Date', key: 'transactionDate' as never },
        {
          header: 'Type',
          key: 'transactionTypeId' as never,
          format: (v: unknown) => typeMap.get(v as number)?.name || '',
        },
        {
          header: 'Account',
          key: 'accountId' as never,
          format: (v: unknown) => accMap.get(v as number)?.name || '',
        },
        {
          header: 'Category',
          key: 'categoryId' as never,
          format: (v: unknown) => catMap.get(v as number)?.name || '',
        },
        { header: 'Amount', key: 'amount' as never, format: (v: unknown) => String(v) },
        { header: 'Notes', key: 'notes' as never },
      ],
      transactions,
      'transactions',
    );
  };

  const isAllSelected = transactions.length > 0 && selectedIds.length === transactions.length;
  const toggleSelectAll = () => {
    setSelectedIds(isAllSelected ? [] : transactions.map((t) => t.id!));
  };
  const toggleSelect = (id: number) => {
    setSelectedIds((prev) => (prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]));
  };

  return (
    <Box>
      <PageHeader
        title="Transactions"
        icon={<ReceiptLongIcon sx={{ fontSize: 28 }} />}
        subtitle={`${total} transaction${total !== 1 ? 's' : ''}`}
        actions={
          <Box display="flex" gap={1} flexWrap="wrap" width={{ xs: '100%', sm: 'auto' }}>
            {selectedIds.length > 0 && (
              <Button
                variant="outlined"
                color="error"
                onClick={() => setBulkDeleteConfirm(true)}
                size="small"
              >
                Delete ({selectedIds.length})
              </Button>
            )}
            <Button
              variant="outlined"
              startIcon={<FileDownloadIcon />}
              size="small"
              onClick={handleExportCSV}
            >
              CSV
            </Button>
            <Button
              variant="outlined"
              startIcon={<FileDownloadIcon />}
              size="small"
              onClick={handleExportExcel}
            >
              Excel
            </Button>
            <Button
              variant="contained"
              startIcon={<AddIcon />}
              onClick={() => {
                setEditTx(undefined);
                setFormOpen(true);
              }}
            >
              Add Transaction
            </Button>
          </Box>
        }
      />

      <Card sx={{ mb: 2 }}>
        <CardContent sx={{ pb: '12px !important' }}>
          <Box display="flex" gap={2} flexWrap="wrap" alignItems="center">
            <TextField
              size="small"
              placeholder="Search transactions..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <SearchIcon fontSize="small" />
                  </InputAdornment>
                ),
              }}
              sx={{ minWidth: 240 }}
            />
            <TextField
              size="small"
              select
              label="Type"
              value={filterType}
              onChange={(e) => setFilterType(e.target.value)}
              sx={{ minWidth: 160 }}
            >
              <MenuItem value="">
                <em>All Types</em>
              </MenuItem>
              {txTypes.map((t) => (
                <MenuItem key={t.id} value={t.id!}>
                  {t.name}
                </MenuItem>
              ))}
            </TextField>
            <TextField
              size="small"
              select
              label="Account"
              value={filterAccount}
              onChange={(e) => setFilterAccount(e.target.value)}
              sx={{ minWidth: 160 }}
            >
              <MenuItem value="">
                <em>All Accounts</em>
              </MenuItem>
              {accounts.map((a) => (
                <MenuItem key={a.id} value={a.id!}>
                  {a.name}
                </MenuItem>
              ))}
            </TextField>
            <TextField
              size="small"
              type="date"
              label="From"
              InputLabelProps={{ shrink: true }}
              value={filterStart}
              onChange={(e) => {
                setFilterStart(e.target.value);
                setPage(0);
              }}
              sx={{ width: 160 }}
            />
            <TextField
              size="small"
              type="date"
              label="To"
              InputLabelProps={{ shrink: true }}
              value={filterEnd}
              onChange={(e) => {
                setFilterEnd(e.target.value);
                setPage(0);
              }}
              sx={{ width: 160 }}
            />
            <Tooltip title="More Filters">
              <IconButton size="small">
                <FilterListIcon />
              </IconButton>
            </Tooltip>
          </Box>
        </CardContent>
      </Card>

      <Card>
        <TableContainer>
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell padding="checkbox">
                  <Checkbox
                    size="small"
                    checked={isAllSelected}
                    indeterminate={selectedIds.length > 0 && !isAllSelected}
                    onChange={toggleSelectAll}
                  />
                </TableCell>
                <TableCell>Date</TableCell>
                <TableCell>Type</TableCell>
                <TableCell>Account</TableCell>
                <TableCell>Category</TableCell>
                <TableCell>Notes</TableCell>
                <TableCell align="right">Amount</TableCell>
                <TableCell align="center">Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {isLoading ? (
                Array.from({ length: 10 }).map((_, i) => (
                  <TableRow key={i}>
                    {Array.from({ length: 8 }).map((__, j) => (
                      <TableCell key={j}>
                        <Skeleton variant="text" />
                      </TableCell>
                    ))}
                  </TableRow>
                ))
              ) : transactions.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8}>
                    <EmptyState
                      title="No transactions found"
                      description="Try adjusting your filters or add a new transaction."
                    />
                  </TableCell>
                </TableRow>
              ) : (
                transactions.map((tx) => {
                  const txType = typeMap.get(tx.transactionTypeId);
                  const account = accMap.get(tx.accountId);
                  const category = tx.categoryId ? catMap.get(tx.categoryId) : undefined;
                  const isDebit = txType?.direction === 'debit';
                  const isTransfer = txType?.direction === 'transfer';

                  return (
                    <TableRow key={tx.id} hover selected={selectedIds.includes(tx.id!)}>
                      <TableCell padding="checkbox">
                        <Checkbox
                          size="small"
                          checked={selectedIds.includes(tx.id!)}
                          onChange={() => toggleSelect(tx.id!)}
                        />
                      </TableCell>
                      <TableCell sx={{ whiteSpace: 'nowrap', fontSize: '0.8rem' }}>
                        {formatDate(tx.transactionDate)}
                      </TableCell>
                      <TableCell>
                        <Chip
                          label={txType?.name || '—'}
                          size="small"
                          sx={{
                            height: 20,
                            fontSize: '0.7rem',
                            bgcolor: `${txType?.color || '#9E9E9E'}15`,
                            color: txType?.color,
                            border: 'none',
                          }}
                        />
                      </TableCell>
                      <TableCell>
                        <Typography variant="caption">{account?.name || '—'}</Typography>
                      </TableCell>
                      <TableCell>
                        {category && (
                          <Chip
                            label={category.name}
                            size="small"
                            sx={{ height: 18, fontSize: '0.65rem' }}
                          />
                        )}
                      </TableCell>
                      <TableCell sx={{ maxWidth: 200 }}>
                        <Typography variant="caption" noWrap display="block">
                          {tx.notes || tx.vendor || '—'}
                        </Typography>
                      </TableCell>
                      <TableCell align="right">
                        <Typography
                          variant="body2"
                          fontWeight={700}
                          color={isDebit ? 'error.main' : isTransfer ? 'info.main' : 'success.main'}
                        >
                          {isDebit ? '-' : '+'}
                          {formatCurrency(tx.amount)}
                        </Typography>
                      </TableCell>
                      <TableCell align="center">
                        <Box display="flex" justifyContent="center">
                          <Tooltip title="Edit">
                            <IconButton
                              size="small"
                              onClick={() => {
                                setEditTx(tx);
                                setFormOpen(true);
                              }}
                            >
                              <EditIcon fontSize="small" />
                            </IconButton>
                          </Tooltip>
                          <Tooltip title="Duplicate">
                            <IconButton size="small" onClick={() => handleDuplicate(tx.id!)}>
                              <ContentCopyIcon fontSize="small" />
                            </IconButton>
                          </Tooltip>
                          <Tooltip title="Delete">
                            <IconButton
                              size="small"
                              color="error"
                              onClick={() => setDeleteConfirm(tx.id!)}
                            >
                              <DeleteIcon fontSize="small" />
                            </IconButton>
                          </Tooltip>
                        </Box>
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </TableContainer>
        <TablePagination
          component="div"
          count={total}
          page={page}
          onPageChange={(_, p) => setPage(p)}
          rowsPerPage={pageSize}
          onRowsPerPageChange={(e) => {
            setPageSize(Number(e.target.value));
            setPage(0);
          }}
          rowsPerPageOptions={[10, 20, 50, 100]}
        />
      </Card>

      <TransactionForm open={formOpen} onClose={() => setFormOpen(false)} transaction={editTx} />
      <ConfirmDialog
        open={deleteConfirm !== null}
        title="Delete Transaction"
        message="Are you sure you want to delete this transaction? This will update account balances."
        onConfirm={handleDelete}
        onCancel={() => setDeleteConfirm(null)}
        loading={deleting}
      />
      <ConfirmDialog
        open={bulkDeleteConfirm}
        title="Delete Transactions"
        message={`Are you sure you want to delete ${selectedIds.length} transactions?`}
        onConfirm={handleBulkDelete}
        onCancel={() => setBulkDeleteConfirm(false)}
        loading={bulkDeleting}
      />
    </Box>
  );
}
