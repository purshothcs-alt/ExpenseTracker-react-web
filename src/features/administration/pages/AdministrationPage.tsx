import {
  Box,
  Card,
  CardContent,
  Typography,
  TextField,
  MenuItem,
  Button,
  IconButton,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Tabs,
  Tab,
  Chip,
  Switch,
  InputAdornment,
  ToggleButtonGroup,
  ToggleButton,
} from '@mui/material';
import AdminPanelSettingsIcon from '@mui/icons-material/AdminPanelSettings';
import AddIcon from '@mui/icons-material/Add';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import SearchIcon from '@mui/icons-material/Search';
import { useState } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { PageHeader } from '@core/components/common/PageHeader';
import { ConfirmDialog } from '@core/components/common/ConfirmDialog';
import { ColorPicker } from '@core/components/common/ColorPicker';
import { useSnackbar } from 'notistack';
import {
  useGetAllCategoriesQuery,
  useCreateCategoryMutation,
  useUpdateCategoryMutation,
  useDeleteCategoryMutation,
  useGetTagsQuery,
  useCreateTagMutation,
  useUpdateTagMutation,
  useDeleteTagMutation,
} from '@app/api/categoriesApi';
import {
  useGetAllAccountTypesQuery,
  useCreateAccountTypeMutation,
  useUpdateAccountTypeMutation,
  useDeleteAccountTypeMutation,
} from '@app/api/accountsApi';
import {
  useGetAllTransactionTypesQuery,
  useCreateTransactionTypeMutation,
  useUpdateTransactionTypeMutation,
} from '@app/api/transactionsApi';
import {
  useGetGoalTypesQuery,
  useCreateGoalTypeMutation,
  useUpdateGoalTypeMutation,
  useDeleteGoalTypeMutation,
} from '@app/api/goalsApi';
import {
  useGetLoanTypesQuery,
  useCreateLoanTypeMutation,
  useUpdateLoanTypeMutation,
  useDeleteLoanTypeMutation,
} from '@app/api/loansApi';
import {
  useGetAssetTypesQuery,
  useCreateAssetTypeMutation,
  useUpdateAssetTypeMutation,
  useDeleteAssetTypeMutation,
} from '@app/api/assetsApi';
import {
  useGetMerchantCategoryMappingsQuery,
  useCreateMerchantCategoryMappingMutation,
  useUpdateMerchantCategoryMappingMutation,
  useDeleteMerchantCategoryMappingMutation,
} from '@app/api/smsImportApi';
import type { Category, MerchantCategoryMapping } from '@core/database/types';

const nameColorSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  description: z.string().optional(),
  color: z.string().optional(),
  icon: z.string().optional(),
  isActive: z.boolean(),
});
type NameColorForm = z.infer<typeof nameColorSchema>;

const categorySchema = z.object({
  name: z.string().min(1, 'Name is required'),
  parentId: z.number().optional().nullable(),
  categoryType: z.enum(['income', 'expense', 'transfer', 'both']),
  color: z.string().optional(),
  icon: z.string().optional(),
  isActive: z.boolean(),
});
type CategoryForm = z.infer<typeof categorySchema>;

interface GenericRow {
  id?: number;
  name: string;
  color?: string;
  isActive?: boolean;
  description?: string;
}

function GenericAdmin<T extends GenericRow>({
  title,
  items,
  onCreate,
  onUpdate,
  onDelete,
  withColor = false,
}: {
  title: string;
  items: T[];
  onCreate: (data: NameColorForm) => Promise<void>;
  onUpdate: (id: number, data: NameColorForm) => Promise<void>;
  onDelete: (id: number) => Promise<void>;
  withColor?: boolean;
}) {
  const { enqueueSnackbar } = useSnackbar();
  const [formOpen, setFormOpen] = useState(false);
  const [editItem, setEditItem] = useState<T | undefined>();
  const [deleteId, setDeleteId] = useState<number | null>(null);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'inactive'>('all');

  const filteredItems = items.filter((item) => {
    const matchesSearch = item.name.toLowerCase().includes(search.toLowerCase());
    const matchesStatus =
      statusFilter === 'all' ||
      (statusFilter === 'active' ? item.isActive !== false : item.isActive === false);
    return matchesSearch && matchesStatus;
  });

  const {
    control,
    handleSubmit,
    reset,
    setValue,
    watch,
    formState: { errors },
  } = useForm<NameColorForm>({
    resolver: zodResolver(nameColorSchema),
    defaultValues: { isActive: true, color: '#2563EB' },
  });

  const color = watch('color');

  const openForm = (item?: T) => {
    setEditItem(item);
    reset(
      item
        ? {
            name: item.name,
            color: item.color || '#2563EB',
            isActive: item.isActive ?? true,
            description: item.description,
          }
        : { isActive: true, color: '#2563EB' },
    );
    setFormOpen(true);
  };

  const onSubmit = async (data: NameColorForm) => {
    try {
      if (editItem?.id) {
        await onUpdate(editItem.id, data);
        enqueueSnackbar(`${title} updated`, { variant: 'success' });
      } else {
        await onCreate(data);
        enqueueSnackbar(`${title} created`, { variant: 'success' });
      }
      setFormOpen(false);
    } catch {
      enqueueSnackbar('Failed to save', { variant: 'error' });
    }
  };

  const handleDelete = async () => {
    if (!deleteId) return;
    try {
      await onDelete(deleteId);
      enqueueSnackbar(`${title} deleted`, { variant: 'success' });
    } catch {
      enqueueSnackbar('Cannot delete — item may be in use', { variant: 'warning' });
    }
    setDeleteId(null);
  };

  return (
    <Box>
      <Box display="flex" gap={1} alignItems="center" mb={1.5} flexWrap="wrap">
        <TextField
          size="small"
          placeholder={`Search ${title.toLowerCase()}s...`}
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          sx={{ flex: 1, minWidth: 160 }}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <SearchIcon fontSize="small" />
              </InputAdornment>
            ),
          }}
        />
        <ToggleButtonGroup
          size="small"
          value={statusFilter}
          exclusive
          onChange={(_, v) => {
            if (v) setStatusFilter(v);
          }}
        >
          <ToggleButton value="all" sx={{ px: 1.5, fontSize: '0.7rem' }}>
            All
          </ToggleButton>
          <ToggleButton value="active" sx={{ px: 1.5, fontSize: '0.7rem' }}>
            Active
          </ToggleButton>
          <ToggleButton value="inactive" sx={{ px: 1.5, fontSize: '0.7rem' }}>
            Inactive
          </ToggleButton>
        </ToggleButtonGroup>
        <Button size="small" variant="contained" startIcon={<AddIcon />} onClick={() => openForm()}>
          Add {title}
        </Button>
      </Box>
      {filteredItems.length === 0 && (
        <Typography variant="body2" color="text.secondary" sx={{ py: 2, textAlign: 'center' }}>
          No {title.toLowerCase()}s found
        </Typography>
      )}

      <TableContainer>
        <Table size="small">
          <TableHead>
            <TableRow>
              <TableCell>Name</TableCell>
              {withColor && <TableCell>Color</TableCell>}
              <TableCell>Status</TableCell>
              <TableCell align="right">Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {filteredItems.map((item) => (
              <TableRow key={item.id} hover>
                <TableCell>
                  <Box display="flex" alignItems="center" gap={1}>
                    {withColor && (
                      <Box
                        sx={{
                          width: 12,
                          height: 12,
                          borderRadius: '50%',
                          bgcolor: item.color || '#9E9E9E',
                          flexShrink: 0,
                        }}
                      />
                    )}
                    <Typography variant="body2" fontWeight={500}>
                      {item.name}
                    </Typography>
                    {item.description && (
                      <Typography variant="caption" color="text.secondary">
                        — {item.description}
                      </Typography>
                    )}
                  </Box>
                </TableCell>
                {withColor && (
                  <TableCell>
                    <Chip
                      label={item.color || '#9E9E9E'}
                      size="small"
                      sx={{ height: 18, fontSize: '0.65rem' }}
                    />
                  </TableCell>
                )}
                <TableCell>
                  <Chip
                    label={item.isActive !== false ? 'Active' : 'Inactive'}
                    size="small"
                    color={item.isActive !== false ? 'success' : 'default'}
                    sx={{ height: 18, fontSize: '0.65rem' }}
                  />
                </TableCell>
                <TableCell align="right">
                  <IconButton size="small" onClick={() => openForm(item)}>
                    <EditIcon fontSize="small" />
                  </IconButton>
                  <IconButton size="small" color="error" onClick={() => setDeleteId(item.id!)}>
                    <DeleteIcon fontSize="small" />
                  </IconButton>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>

      <Dialog open={formOpen} onClose={() => setFormOpen(false)} maxWidth="xs" fullWidth>
        <DialogTitle fontWeight={700}>{editItem ? `Edit ${title}` : `New ${title}`}</DialogTitle>
        <form onSubmit={handleSubmit(onSubmit)}>
          <DialogContent>
            <Box display="flex" flexDirection="column" gap={2}>
              <Controller
                name="name"
                control={control}
                render={({ field }) => (
                  <TextField
                    {...field}
                    fullWidth
                    label="Name *"
                    error={!!errors.name}
                    helperText={errors.name?.message}
                  />
                )}
              />
              <Controller
                name="description"
                control={control}
                render={({ field }) => (
                  <TextField {...field} fullWidth label="Description" value={field.value || ''} />
                )}
              />
              {withColor && (
                <Box>
                  <Typography variant="caption" color="text.secondary" mb={0.5} display="block">
                    Color
                  </Typography>
                  <ColorPicker value={color || '#2563EB'} onChange={(v) => setValue('color', v)} />
                </Box>
              )}
              <Controller
                name="isActive"
                control={control}
                render={({ field }) => (
                  <Box display="flex" alignItems="center" justifyContent="space-between">
                    <Typography variant="body2">Active</Typography>
                    <Switch
                      checked={!!field.value}
                      onChange={(e) => field.onChange(e.target.checked)}
                    />
                  </Box>
                )}
              />
            </Box>
          </DialogContent>
          <DialogActions sx={{ px: 3, pb: 2 }}>
            <Button onClick={() => setFormOpen(false)}>Cancel</Button>
            <Button type="submit" variant="contained">
              {editItem ? 'Update' : 'Create'}
            </Button>
          </DialogActions>
        </form>
      </Dialog>

      <ConfirmDialog
        open={deleteId !== null}
        title={`Delete ${title}`}
        message={`Delete this ${title.toLowerCase()}? This cannot be undone.`}
        onConfirm={handleDelete}
        onCancel={() => setDeleteId(null)}
      />
    </Box>
  );
}

function CategoriesAdmin() {
  const { enqueueSnackbar } = useSnackbar();
  const { data: categories = [] } = useGetAllCategoriesQuery();
  const [create] = useCreateCategoryMutation();
  const [update] = useUpdateCategoryMutation();
  const [deleteCat] = useDeleteCategoryMutation();

  const parentCategories = categories.filter((c) => !c.parentId);
  const [formOpen, setFormOpen] = useState(false);
  const [editCat, setEditCat] = useState<Category | undefined>();
  const [deleteId, setDeleteId] = useState<number | null>(null);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'inactive'>('all');
  const [typeFilter, setTypeFilter] = useState<'all' | 'expense' | 'income' | 'both' | 'transfer'>(
    'all',
  );

  const filteredCategories = categories.filter((cat) => {
    const matchesSearch = cat.name.toLowerCase().includes(search.toLowerCase());
    const matchesStatus =
      statusFilter === 'all' ||
      (statusFilter === 'active' ? cat.isActive !== false : cat.isActive === false);
    const matchesType = typeFilter === 'all' || cat.categoryType === typeFilter;
    return matchesSearch && matchesStatus && matchesType;
  });

  const {
    control,
    handleSubmit,
    reset,
    setValue,
    watch,
    formState: { errors },
  } = useForm<CategoryForm>({
    resolver: zodResolver(categorySchema),
    defaultValues: { categoryType: 'expense' as const, isActive: true, color: '#2563EB' },
  });
  const color = watch('color');

  const openForm = (c?: Category) => {
    setEditCat(c);
    reset(
      c
        ? {
            name: c.name,
            parentId: c.parentId,
            categoryType: c.categoryType,
            color: c.color || '#2563EB',
            icon: c.icon,
            isActive: c.isActive,
          }
        : { categoryType: 'expense' as const, isActive: true, color: '#2563EB' },
    );
    setFormOpen(true);
  };

  const onSubmit = async (data: CategoryForm) => {
    try {
      if (editCat?.id) {
        await update({
          id: editCat.id,
          data: { ...data, parentId: data.parentId ?? undefined },
        }).unwrap();
        enqueueSnackbar('Category updated', { variant: 'success' });
      } else {
        await create({ ...data, parentId: data.parentId ?? undefined } as Omit<
          Category,
          'id' | 'createdAt' | 'updatedAt'
        >).unwrap();
        enqueueSnackbar('Category created', { variant: 'success' });
      }
      setFormOpen(false);
    } catch {
      enqueueSnackbar('Failed to save', { variant: 'error' });
    }
  };

  return (
    <Box>
      <Box display="flex" gap={1} alignItems="center" mb={1} flexWrap="wrap">
        <TextField
          size="small"
          placeholder="Search categories..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          sx={{ flex: 1, minWidth: 160 }}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <SearchIcon fontSize="small" />
              </InputAdornment>
            ),
          }}
        />
        <TextField
          select
          size="small"
          value={typeFilter}
          onChange={(e) => setTypeFilter(e.target.value as typeof typeFilter)}
          sx={{ minWidth: 110 }}
          label="Type"
        >
          <MenuItem value="all">All Types</MenuItem>
          <MenuItem value="expense">Expense</MenuItem>
          <MenuItem value="income">Income</MenuItem>
          <MenuItem value="both">Both</MenuItem>
          <MenuItem value="transfer">Transfer</MenuItem>
        </TextField>
        <ToggleButtonGroup
          size="small"
          value={statusFilter}
          exclusive
          onChange={(_, v) => {
            if (v) setStatusFilter(v);
          }}
        >
          <ToggleButton value="all" sx={{ px: 1.5, fontSize: '0.7rem' }}>
            All
          </ToggleButton>
          <ToggleButton value="active" sx={{ px: 1.5, fontSize: '0.7rem' }}>
            Active
          </ToggleButton>
          <ToggleButton value="inactive" sx={{ px: 1.5, fontSize: '0.7rem' }}>
            Inactive
          </ToggleButton>
        </ToggleButtonGroup>
        <Button size="small" variant="contained" startIcon={<AddIcon />} onClick={() => openForm()}>
          Add Category
        </Button>
      </Box>
      {search || statusFilter !== 'all' || typeFilter !== 'all' ? (
        <Typography variant="caption" color="text.secondary" display="block" mb={1}>
          Showing {filteredCategories.length} of {categories.length} categories
        </Typography>
      ) : null}
      <TableContainer>
        <Table size="small">
          <TableHead>
            <TableRow>
              <TableCell>Name</TableCell>
              <TableCell>Type</TableCell>
              <TableCell>Parent</TableCell>
              <TableCell>Status</TableCell>
              <TableCell align="right">Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {filteredCategories.map((cat) => (
              <TableRow key={cat.id} hover>
                <TableCell>
                  <Box display="flex" alignItems="center" gap={1}>
                    <Box
                      sx={{
                        width: 10,
                        height: 10,
                        borderRadius: '50%',
                        bgcolor: cat.color || '#9E9E9E',
                      }}
                    />
                    <Typography variant="body2" fontWeight={500} ml={cat.parentId ? 2 : 0}>
                      {cat.parentId ? '↳ ' : ''}
                      {cat.name}
                    </Typography>
                  </Box>
                </TableCell>
                <TableCell>
                  <Chip
                    label={cat.categoryType}
                    size="small"
                    sx={{ height: 18, fontSize: '0.65rem' }}
                  />
                </TableCell>
                <TableCell>
                  <Typography variant="caption" color="text.secondary">
                    {cat.parentId
                      ? categories.find((c) => c.id === cat.parentId)?.name || '—'
                      : '—'}
                  </Typography>
                </TableCell>
                <TableCell>
                  <Chip
                    label={cat.isActive ? 'Active' : 'Inactive'}
                    size="small"
                    color={cat.isActive ? 'success' : 'default'}
                    sx={{ height: 18, fontSize: '0.65rem' }}
                  />
                </TableCell>
                <TableCell align="right">
                  <IconButton size="small" onClick={() => openForm(cat)}>
                    <EditIcon fontSize="small" />
                  </IconButton>
                  <IconButton size="small" color="error" onClick={() => setDeleteId(cat.id!)}>
                    <DeleteIcon fontSize="small" />
                  </IconButton>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>

      <Dialog open={formOpen} onClose={() => setFormOpen(false)} maxWidth="xs" fullWidth>
        <DialogTitle fontWeight={700}>{editCat ? 'Edit Category' : 'New Category'}</DialogTitle>
        <form onSubmit={handleSubmit(onSubmit)}>
          <DialogContent>
            <Box display="flex" flexDirection="column" gap={2}>
              <Controller
                name="name"
                control={control}
                render={({ field }) => (
                  <TextField
                    {...field}
                    fullWidth
                    label="Name *"
                    error={!!errors.name}
                    helperText={errors.name?.message}
                  />
                )}
              />
              <Controller
                name="categoryType"
                control={control}
                render={({ field }) => (
                  <TextField {...field} select fullWidth label="Type">
                    <MenuItem value="income">Income</MenuItem>
                    <MenuItem value="expense">Expense</MenuItem>
                    <MenuItem value="transfer">Transfer</MenuItem>
                    <MenuItem value="both">Both</MenuItem>
                  </TextField>
                )}
              />
              <Controller
                name="parentId"
                control={control}
                render={({ field }) => (
                  <TextField
                    {...field}
                    select
                    fullWidth
                    label="Parent Category (optional)"
                    value={field.value || ''}
                    onChange={(e) => field.onChange(e.target.value ? Number(e.target.value) : null)}
                  >
                    <MenuItem value="">
                      <em>None (Top Level)</em>
                    </MenuItem>
                    {parentCategories.map((c) => (
                      <MenuItem key={c.id} value={c.id!}>
                        {c.name}
                      </MenuItem>
                    ))}
                  </TextField>
                )}
              />
              <Box>
                <Typography variant="caption" color="text.secondary" mb={0.5} display="block">
                  Color
                </Typography>
                <ColorPicker value={color || '#2563EB'} onChange={(v) => setValue('color', v)} />
              </Box>
              <Controller
                name="isActive"
                control={control}
                render={({ field }) => (
                  <Box display="flex" alignItems="center" justifyContent="space-between">
                    <Typography variant="body2">Active</Typography>
                    <Switch
                      checked={!!field.value}
                      onChange={(e) => field.onChange(e.target.checked)}
                    />
                  </Box>
                )}
              />
            </Box>
          </DialogContent>
          <DialogActions sx={{ px: 3, pb: 2 }}>
            <Button onClick={() => setFormOpen(false)}>Cancel</Button>
            <Button type="submit" variant="contained">
              {editCat ? 'Update' : 'Create'}
            </Button>
          </DialogActions>
        </form>
      </Dialog>

      <ConfirmDialog
        open={deleteId !== null}
        title="Delete Category"
        message="Delete this category? Transactions using it will lose category association."
        onConfirm={async () => {
          await deleteCat(deleteId!);
          enqueueSnackbar('Category deleted', { variant: 'success' });
          setDeleteId(null);
        }}
        onCancel={() => setDeleteId(null)}
      />
    </Box>
  );
}

const mappingSchema = z.object({
  merchantPattern: z.string().min(1, 'Pattern is required').max(100),
  categoryId: z.number().positive('Category is required'),
  isActive: z.boolean(),
});
type MappingForm = z.infer<typeof mappingSchema>;

function MerchantMappingsAdmin() {
  const { enqueueSnackbar } = useSnackbar();
  const { data: mappings = [] } = useGetMerchantCategoryMappingsQuery();
  const { data: categories = [] } = useGetAllCategoriesQuery();
  const [create] = useCreateMerchantCategoryMappingMutation();
  const [update] = useUpdateMerchantCategoryMappingMutation();
  const [deleteMapping] = useDeleteMerchantCategoryMappingMutation();

  const [formOpen, setFormOpen] = useState(false);
  const [editItem, setEditItem] = useState<MerchantCategoryMapping | undefined>();
  const [deleteId, setDeleteId] = useState<number | null>(null);

  const categoryMap = new Map(categories.map((c) => [c.id!, c]));

  const {
    control,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<MappingForm>({
    resolver: zodResolver(mappingSchema),
    defaultValues: { isActive: true },
  });

  const openForm = (item?: MerchantCategoryMapping) => {
    setEditItem(item);
    reset(
      item
        ? {
            merchantPattern: item.merchantPattern,
            categoryId: item.categoryId,
            isActive: item.isActive,
          }
        : { isActive: true },
    );
    setFormOpen(true);
  };

  const onSubmit = async (data: MappingForm) => {
    try {
      if (editItem?.id) {
        await update({ id: editItem.id, data }).unwrap();
        enqueueSnackbar('Mapping updated', { variant: 'success' });
      } else {
        await create(data).unwrap();
        enqueueSnackbar('Mapping created', { variant: 'success' });
      }
      setFormOpen(false);
    } catch {
      enqueueSnackbar('Failed to save', { variant: 'error' });
    }
  };

  return (
    <Box>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={1.5}>
        <Typography variant="body2" color="text.secondary">
          Merchant text detected in an SMS is matched against these patterns (case-insensitive) to
          suggest a category during import review. Built-in defaults (Amazon, Swiggy, Uber, etc.)
          apply automatically when no explicit mapping is found below.
        </Typography>
        <Button
          size="small"
          variant="contained"
          startIcon={<AddIcon />}
          onClick={() => openForm()}
          sx={{ flexShrink: 0, ml: 2 }}
        >
          Add Mapping
        </Button>
      </Box>

      {mappings.length === 0 && (
        <Typography variant="body2" color="text.secondary" sx={{ py: 2, textAlign: 'center' }}>
          No custom merchant mappings yet
        </Typography>
      )}

      <TableContainer>
        <Table size="small">
          <TableHead>
            <TableRow>
              <TableCell>Merchant Pattern</TableCell>
              <TableCell>Category</TableCell>
              <TableCell>Status</TableCell>
              <TableCell align="right">Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {mappings.map((m) => (
              <TableRow key={m.id} hover>
                <TableCell>
                  <Typography variant="body2" fontWeight={500}>
                    {m.merchantPattern}
                  </Typography>
                </TableCell>
                <TableCell>
                  <Typography variant="caption" color="text.secondary">
                    {categoryMap.get(m.categoryId)?.name || '—'}
                  </Typography>
                </TableCell>
                <TableCell>
                  <Chip
                    label={m.isActive !== false ? 'Active' : 'Inactive'}
                    size="small"
                    color={m.isActive !== false ? 'success' : 'default'}
                    sx={{ height: 18, fontSize: '0.65rem' }}
                  />
                </TableCell>
                <TableCell align="right">
                  <IconButton size="small" onClick={() => openForm(m)}>
                    <EditIcon fontSize="small" />
                  </IconButton>
                  <IconButton size="small" color="error" onClick={() => setDeleteId(m.id!)}>
                    <DeleteIcon fontSize="small" />
                  </IconButton>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>

      <Dialog open={formOpen} onClose={() => setFormOpen(false)} maxWidth="xs" fullWidth>
        <DialogTitle fontWeight={700}>{editItem ? 'Edit Mapping' : 'New Mapping'}</DialogTitle>
        <form onSubmit={handleSubmit(onSubmit)}>
          <DialogContent>
            <Box display="flex" flexDirection="column" gap={2}>
              <Controller
                name="merchantPattern"
                control={control}
                render={({ field }) => (
                  <TextField
                    {...field}
                    fullWidth
                    label="Merchant Pattern *"
                    placeholder="e.g. bigbasket"
                    error={!!errors.merchantPattern}
                    helperText={errors.merchantPattern?.message}
                  />
                )}
              />
              <Controller
                name="categoryId"
                control={control}
                render={({ field }) => (
                  <TextField
                    {...field}
                    select
                    fullWidth
                    label="Category *"
                    error={!!errors.categoryId}
                    helperText={errors.categoryId?.message}
                    value={field.value || ''}
                    onChange={(e) => field.onChange(Number(e.target.value))}
                  >
                    {categories
                      .filter((c) => !c.parentId)
                      .map((c) => (
                        <MenuItem key={c.id} value={c.id!}>
                          {c.name}
                        </MenuItem>
                      ))}
                  </TextField>
                )}
              />
              <Controller
                name="isActive"
                control={control}
                render={({ field }) => (
                  <Box display="flex" alignItems="center" justifyContent="space-between">
                    <Typography variant="body2">Active</Typography>
                    <Switch
                      checked={!!field.value}
                      onChange={(e) => field.onChange(e.target.checked)}
                    />
                  </Box>
                )}
              />
            </Box>
          </DialogContent>
          <DialogActions sx={{ px: 3, pb: 2 }}>
            <Button onClick={() => setFormOpen(false)}>Cancel</Button>
            <Button type="submit" variant="contained">
              {editItem ? 'Update' : 'Create'}
            </Button>
          </DialogActions>
        </form>
      </Dialog>

      <ConfirmDialog
        open={deleteId !== null}
        title="Delete Mapping"
        message="Delete this merchant category mapping?"
        onConfirm={async () => {
          await deleteMapping(deleteId!).unwrap();
          enqueueSnackbar('Mapping deleted', { variant: 'success' });
          setDeleteId(null);
        }}
        onCancel={() => setDeleteId(null)}
      />
    </Box>
  );
}

const TABS = [
  'Categories',
  'Account Types',
  'Transaction Types',
  'Goal Types',
  'Loan Types',
  'Asset Types',
  'Tags',
  'Merchant Mappings',
];

export function AdministrationPage() {
  const [tab, setTab] = useState(0);

  const { data: accountTypes = [] } = useGetAllAccountTypesQuery();
  const [createAT] = useCreateAccountTypeMutation();
  const [updateAT] = useUpdateAccountTypeMutation();
  const [deleteAT] = useDeleteAccountTypeMutation();

  const { data: txTypes = [] } = useGetAllTransactionTypesQuery();
  const [createTT] = useCreateTransactionTypeMutation();
  const [updateTT] = useUpdateTransactionTypeMutation();

  const { data: goalTypes = [] } = useGetGoalTypesQuery();
  const [createGT] = useCreateGoalTypeMutation();
  const [updateGT] = useUpdateGoalTypeMutation();
  const [deleteGT] = useDeleteGoalTypeMutation();

  const { data: loanTypes = [] } = useGetLoanTypesQuery();
  const [createLT] = useCreateLoanTypeMutation();
  const [updateLT] = useUpdateLoanTypeMutation();
  const [deleteLT] = useDeleteLoanTypeMutation();

  const { data: assetTypes = [] } = useGetAssetTypesQuery();
  const [createAsT] = useCreateAssetTypeMutation();
  const [updateAsT] = useUpdateAssetTypeMutation();
  const [deleteAsT] = useDeleteAssetTypeMutation();

  const { data: tags = [] } = useGetTagsQuery();
  const [createTag] = useCreateTagMutation();
  const [updateTag] = useUpdateTagMutation();
  const [deleteTag] = useDeleteTagMutation();

  return (
    <Box>
      <PageHeader
        title="Administration"
        icon={<AdminPanelSettingsIcon sx={{ fontSize: 28 }} />}
        subtitle="Master data management — configure all entities"
      />

      <Card>
        <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
          <Tabs
            value={tab}
            onChange={(_, v) => setTab(v)}
            variant="scrollable"
            scrollButtons="auto"
          >
            {TABS.map((t) => (
              <Tab key={t} label={t} />
            ))}
          </Tabs>
        </Box>
        <CardContent>
          {tab === 0 && <CategoriesAdmin />}

          {tab === 1 && (
            <GenericAdmin
              title="Account Type"
              items={accountTypes}
              onCreate={async (data) => {
                await createAT(data as never).unwrap();
              }}
              onUpdate={async (id, data) => {
                await updateAT({ id, data: data as never }).unwrap();
              }}
              onDelete={async (id) => {
                await deleteAT(id).unwrap();
              }}
            />
          )}

          {tab === 2 && (
            <GenericAdmin
              title="Transaction Type"
              items={txTypes}
              onCreate={async (data) => {
                await createTT(data as never).unwrap();
              }}
              onUpdate={async (id, data) => {
                await updateTT({ id, data: data as never }).unwrap();
              }}
              onDelete={async () => {
                /* soft delete via update */
              }}
            />
          )}

          {tab === 3 && (
            <GenericAdmin
              title="Goal Type"
              items={goalTypes}
              onCreate={async (data) => {
                await createGT(data as never).unwrap();
              }}
              onUpdate={async (id, data) => {
                await updateGT({ id, data: data as never }).unwrap();
              }}
              onDelete={async (id) => {
                await deleteGT(id).unwrap();
              }}
            />
          )}

          {tab === 4 && (
            <GenericAdmin
              title="Loan Type"
              items={loanTypes}
              onCreate={async (data) => {
                await createLT(data as never).unwrap();
              }}
              onUpdate={async (id, data) => {
                await updateLT({ id, data: data as never }).unwrap();
              }}
              onDelete={async (id) => {
                await deleteLT(id).unwrap();
              }}
            />
          )}

          {tab === 5 && (
            <GenericAdmin
              title="Asset Type"
              items={assetTypes}
              onCreate={async (data) => {
                await createAsT(data as never).unwrap();
              }}
              onUpdate={async (id, data) => {
                await updateAsT({ id, data: data as never }).unwrap();
              }}
              onDelete={async (id) => {
                await deleteAsT(id).unwrap();
              }}
            />
          )}

          {tab === 6 && (
            <GenericAdmin
              title="Tag"
              items={tags}
              withColor
              onCreate={async (data) => {
                await createTag(data as never).unwrap();
              }}
              onUpdate={async (id, data) => {
                await updateTag({ id, data: data as never }).unwrap();
              }}
              onDelete={async (id) => {
                await deleteTag(id).unwrap();
              }}
            />
          )}

          {tab === 7 && <MerchantMappingsAdmin />}
        </CardContent>
      </Card>
    </Box>
  );
}
