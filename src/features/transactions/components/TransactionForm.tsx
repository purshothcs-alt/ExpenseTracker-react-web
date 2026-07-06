import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Grid,
  TextField,
  MenuItem,
  Autocomplete,
  createFilterOptions,
  Chip,
  Box,
  InputAdornment,
  Divider,
  Typography,
  useMediaQuery,
  useTheme,
} from '@mui/material';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { transactionSchema, type TransactionFormData } from '../validation/transaction.schema';
import { useGetAccountsQuery } from '@app/api/accountsApi';
import { useGetAllCategoriesQuery, useGetTagsQuery } from '@app/api/categoriesApi';
import { useGetTransactionTypesQuery } from '@app/api/transactionsApi';
import { useGetAllProjectsQuery } from '@app/api/projectsApi';
import {
  useCreateTransactionMutation,
  useUpdateTransactionMutation,
} from '@app/api/transactionsApi';
import { useAppSettings } from '@core/hooks/useAppSettings';
import type { Transaction, Tag, CategoryType, Category } from '@core/database/types';

type CategoryOption =
  | Category
  | { __addNew: true; name: string; id?: undefined; color?: undefined };
const catFilter = createFilterOptions<CategoryOption>();
import { useSnackbar } from 'notistack';
import { useEffect, useMemo, useState } from 'react';
import AddIcon from '@mui/icons-material/Add';
import { QuickAddCategoryDialog } from './QuickAddCategoryDialog';

interface Props {
  open: boolean;
  onClose: () => void;
  transaction?: Transaction & { tagIds?: number[] };
}

export function TransactionForm({ open, onClose, transaction }: Props) {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const { data: accounts = [] } = useGetAccountsQuery();
  const { data: categories = [] } = useGetAllCategoriesQuery();
  const { data: txTypes = [] } = useGetTransactionTypesQuery();
  const { data: tags = [] } = useGetTagsQuery();
  const { data: projects = [] } = useGetAllProjectsQuery();
  const [createTransaction, { isLoading: creating }] = useCreateTransactionMutation();
  const [updateTransaction, { isLoading: updating }] = useUpdateTransactionMutation();
  const { settings } = useAppSettings();
  const { enqueueSnackbar } = useSnackbar();
  const isLoading = creating || updating;

  const [quickAddCategoryOpen, setQuickAddCategoryOpen] = useState(false);
  const [quickAddSubCategoryOpen, setQuickAddSubCategoryOpen] = useState(false);

  const {
    control,
    handleSubmit,
    watch,
    reset,
    setValue,
    formState: { errors },
  } = useForm<TransactionFormData>({
    resolver: zodResolver(transactionSchema),
    defaultValues: {
      transactionDate: new Date().toISOString().split('T')[0],
      isRecurring: false,
      tagIds: [],
      ...transaction,
    },
  });

  useEffect(() => {
    if (open) {
      reset({
        transactionDate: new Date().toISOString().split('T')[0],
        isRecurring: false,
        tagIds: [],
        ...transaction,
      });
    }
  }, [open, transaction, reset]);

  const selectedTypeId = watch('transactionTypeId');
  const selectedType = txTypes.find((t) => t.id === selectedTypeId);
  const isTransfer = selectedType?.direction === 'transfer';
  const isExpenseType = selectedType?.direction === 'debit';

  const newCategoryType: CategoryType = selectedType?.direction === 'credit' ? 'income' : 'expense';

  const parentCategories = useMemo(() => categories.filter((c) => !c.parentId), [categories]);
  const allSubCategories = useMemo(() => categories.filter((c) => !!c.parentId), [categories]);
  const selectedCategoryId = watch('categoryId');
  const selectedSubCategoryId = watch('subCategoryId');

  // Build a label for each subcategory showing its parent for context
  const parentMap = useMemo(
    () => new Map(parentCategories.map((c) => [c.id!, c])),
    [parentCategories],
  );

  // Clear subCategory when category changes to a different parent
  useEffect(() => {
    if (!selectedSubCategoryId) return;
    const sub = allSubCategories.find((c) => c.id === selectedSubCategoryId);
    if (sub && sub.parentId !== selectedCategoryId) {
      setValue('subCategoryId', null);
    }
  }, [selectedCategoryId, selectedSubCategoryId, allSubCategories, setValue]);

  const projectIdValue = watch('projectId');
  useEffect(() => {
    if (txTypes.length === 0) return;
    if (selectedTypeId && !isExpenseType && projectIdValue) {
      setValue('projectId', null);
    }
  }, [isExpenseType, selectedTypeId, txTypes.length, projectIdValue, setValue]);

  const onSubmit = async (data: TransactionFormData) => {
    const { tagIds, toAccountId, categoryId, subCategoryId, projectId, ...rest } = data;
    const txData = {
      ...rest,
      toAccountId: toAccountId ?? undefined,
      categoryId: categoryId ?? undefined,
      subCategoryId: subCategoryId ?? undefined,
      projectId: projectId ?? undefined,
    };
    try {
      if (transaction?.id) {
        await updateTransaction({ id: transaction.id, data: txData, tagIds }).unwrap();
        enqueueSnackbar('Transaction updated', { variant: 'success' });
      } else {
        await createTransaction({ data: txData, tagIds }).unwrap();
        enqueueSnackbar('Transaction created', { variant: 'success' });
      }
      onClose();
    } catch {
      enqueueSnackbar('Failed to save transaction', { variant: 'error' });
    }
  };

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="sm"
      fullWidth
      fullScreen={isMobile}
      PaperProps={{ sx: { borderRadius: isMobile ? 0 : 3 } }}
    >
      <DialogTitle fontWeight={700}>
        {transaction?.id ? 'Edit Transaction' : 'New Transaction'}
      </DialogTitle>
      <Divider />
      <form onSubmit={handleSubmit(onSubmit)}>
        <DialogContent sx={{ pt: 2 }}>
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
                        <Box display="flex" alignItems="center" gap={1}>
                          <Box
                            sx={{ width: 10, height: 10, borderRadius: '50%', bgcolor: t.color }}
                          />
                          {t.name}
                        </Box>
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

            <Grid size={isTransfer ? 6 : 12}>
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
                    helperText={errors.accountId?.message}
                    value={field.value || ''}
                    onChange={(e) => field.onChange(Number(e.target.value))}
                  >
                    {accounts.map((a) => (
                      <MenuItem key={a.id} value={a.id!}>
                        {a.name}
                      </MenuItem>
                    ))}
                  </TextField>
                )}
              />
            </Grid>

            {isTransfer && (
              <Grid size={6}>
                <Controller
                  name="toAccountId"
                  control={control}
                  render={({ field }) => (
                    <TextField
                      {...field}
                      select
                      fullWidth
                      label="To Account *"
                      value={field.value || ''}
                      onChange={(e) => field.onChange(Number(e.target.value))}
                    >
                      {accounts.map((a) => (
                        <MenuItem key={a.id} value={a.id!}>
                          {a.name}
                        </MenuItem>
                      ))}
                    </TextField>
                  )}
                />
              </Grid>
            )}

            {!isTransfer && (
              <>
                <Grid size={6}>
                  <Controller
                    name="categoryId"
                    control={control}
                    render={({ field }) => (
                      <Autocomplete<CategoryOption>
                        options={isExpenseType ? parentCategories : parentCategories}
                        getOptionLabel={(opt) => ('__addNew' in opt ? opt.name : opt.name)}
                        isOptionEqualToValue={(opt, val) =>
                          !('__addNew' in opt) && !('__addNew' in val) && opt.id === val.id
                        }
                        value={parentCategories.find((c) => c.id === field.value) ?? null}
                        onChange={(_, newVal) => {
                          if (newVal && '__addNew' in newVal) {
                            setQuickAddCategoryOpen(true);
                          } else {
                            field.onChange(newVal?.id ?? null);
                          }
                        }}
                        filterOptions={(options, params) => {
                          const filtered = catFilter(options as CategoryOption[], params);
                          filtered.push({ __addNew: true, name: '+ Add New Category' });
                          return filtered;
                        }}
                        renderOption={(props, opt) => {
                          // eslint-disable-next-line @typescript-eslint/no-explicit-any
                          const { key, ...rest } = props as any;
                          if ('__addNew' in opt) {
                            return (
                              <li key={key} {...rest}>
                                <Box
                                  display="flex"
                                  alignItems="center"
                                  gap={1}
                                  color="primary.main"
                                  fontWeight={600}
                                >
                                  <AddIcon fontSize="small" />
                                  {opt.name}
                                </Box>
                              </li>
                            );
                          }
                          return (
                            <li key={key} {...rest}>
                              <Box display="flex" alignItems="center" gap={1}>
                                <Box
                                  sx={{
                                    width: 8,
                                    height: 8,
                                    borderRadius: '50%',
                                    bgcolor: opt.color,
                                    flexShrink: 0,
                                  }}
                                />
                                {opt.name}
                              </Box>
                            </li>
                          );
                        }}
                        renderInput={(params) => <TextField {...params} label="Category" />}
                      />
                    )}
                  />
                </Grid>

                <Grid size={6}>
                  <Controller
                    name="subCategoryId"
                    control={control}
                    render={({ field }) => (
                      <Autocomplete<CategoryOption>
                        options={allSubCategories as CategoryOption[]}
                        getOptionLabel={(opt) => {
                          if ('__addNew' in opt) return opt.name;
                          const parent = parentMap.get(opt.parentId!);
                          return parent ? `${opt.name} · ${parent.name}` : opt.name;
                        }}
                        isOptionEqualToValue={(opt, val) =>
                          !('__addNew' in opt) && !('__addNew' in val) && opt.id === val.id
                        }
                        value={allSubCategories.find((c) => c.id === field.value) ?? null}
                        onChange={(_, newVal) => {
                          if (newVal && '__addNew' in newVal) {
                            setQuickAddSubCategoryOpen(true);
                            return;
                          }
                          field.onChange(newVal?.id ?? null);
                          if (newVal?.parentId) {
                            setValue('categoryId', newVal.parentId);
                          }
                        }}
                        filterOptions={(options, params) => {
                          const filtered = catFilter(options, params);
                          filtered.push({ __addNew: true, name: '+ Add New Sub Category' });
                          return filtered;
                        }}
                        groupBy={(opt) =>
                          '__addNew' in opt ? '' : (parentMap.get(opt.parentId!)?.name ?? '')
                        }
                        renderOption={(props, opt) => {
                          // eslint-disable-next-line @typescript-eslint/no-explicit-any
                          const { key, ...rest } = props as any;
                          if ('__addNew' in opt) {
                            return (
                              <li key={key} {...rest}>
                                <Box
                                  display="flex"
                                  alignItems="center"
                                  gap={1}
                                  color="primary.main"
                                  fontWeight={600}
                                >
                                  <AddIcon fontSize="small" />
                                  {opt.name}
                                </Box>
                              </li>
                            );
                          }
                          return (
                            <li key={key} {...rest}>
                              <Box display="flex" alignItems="center" gap={1}>
                                <Box
                                  sx={{
                                    width: 8,
                                    height: 8,
                                    borderRadius: '50%',
                                    bgcolor: opt.color,
                                    flexShrink: 0,
                                  }}
                                />
                                {opt.name}
                              </Box>
                            </li>
                          );
                        }}
                        renderInput={(params) => (
                          <TextField {...params} label="Sub Category (optional)" />
                        )}
                      />
                    )}
                  />
                </Grid>
              </>
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

            <Grid size={6}>
              <Controller
                name="vendor"
                control={control}
                render={({ field }) => (
                  <TextField
                    {...field}
                    fullWidth
                    label="Vendor / Payee"
                    value={field.value || ''}
                  />
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

            <Grid size={12}>
              <Controller
                name="tagIds"
                control={control}
                render={({ field }) => (
                  <Autocomplete
                    multiple
                    options={tags}
                    getOptionLabel={(t: Tag) => t.name}
                    value={tags.filter((t) => (field.value || []).includes(t.id!))}
                    onChange={(_, newVal) => field.onChange(newVal.map((t: Tag) => t.id!))}
                    renderTags={(val, getTagProps) =>
                      val.map((tag: Tag, index: number) => (
                        <Chip
                          {...getTagProps({ index })}
                          key={tag.id}
                          label={tag.name}
                          size="small"
                          sx={{
                            bgcolor: `${tag.color}20`,
                            color: tag.color,
                            borderColor: tag.color,
                          }}
                          variant="outlined"
                        />
                      ))
                    }
                    renderInput={(params) => <TextField {...params} label="Tags" />}
                  />
                )}
              />
            </Grid>

            {isExpenseType && projects.length > 0 && (
              <Grid size={12}>
                <Controller
                  name="projectId"
                  control={control}
                  render={({ field }) => (
                    <TextField
                      {...field}
                      select
                      fullWidth
                      label="Project (optional)"
                      value={field.value || ''}
                      onChange={(e) =>
                        field.onChange(e.target.value ? Number(e.target.value) : null)
                      }
                    >
                      <MenuItem value="">
                        <em>None</em>
                      </MenuItem>
                      {projects.map((p) => (
                        <MenuItem key={p.id} value={p.id!}>
                          {p.name}
                        </MenuItem>
                      ))}
                    </TextField>
                  )}
                />
              </Grid>
            )}
          </Grid>

          <Box mt={2} p={1.5} bgcolor="action.hover" borderRadius={2}>
            <Typography variant="caption" color="text.secondary">
              Quick tip: Use tags to categorize and filter transactions across multiple categories.
            </Typography>
          </Box>
        </DialogContent>
        <Divider />
        <DialogActions sx={{ px: 3, py: 2 }}>
          <Button onClick={onClose}>Cancel</Button>
          <Button type="submit" variant="contained" disabled={isLoading}>
            {isLoading ? 'Saving...' : transaction?.id ? 'Update' : 'Create'}
          </Button>
        </DialogActions>
      </form>

      <QuickAddCategoryDialog
        open={quickAddCategoryOpen}
        onClose={() => setQuickAddCategoryOpen(false)}
        categoryType={newCategoryType}
        onCreated={(id) => setValue('categoryId', id)}
      />

      <QuickAddCategoryDialog
        open={quickAddSubCategoryOpen}
        onClose={() => setQuickAddSubCategoryOpen(false)}
        categoryType={newCategoryType}
        parentId={selectedCategoryId ?? undefined}
        onCreated={(id) => setValue('subCategoryId', id)}
      />
    </Dialog>
  );
}
