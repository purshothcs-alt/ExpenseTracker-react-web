import {
  Box, Button, Grid, Card, CardContent, Typography,
  Dialog, DialogTitle, DialogContent, DialogActions,
  TextField, MenuItem, Chip, IconButton, Tooltip, Avatar, InputAdornment,
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import DiamondIcon from '@mui/icons-material/Diamond';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import TrendingDownIcon from '@mui/icons-material/TrendingDown';
import UpdateIcon from '@mui/icons-material/Update';
import { useState } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { PageHeader } from '@core/components/common/PageHeader';
import { EmptyState } from '@core/components/common/EmptyState';
import { ConfirmDialog } from '@core/components/common/ConfirmDialog';
import { StatCard } from '@core/components/common/StatCard';
import {
  useGetAssetsQuery, useGetAssetTypesQuery,
  useCreateAssetMutation, useUpdateAssetMutation, useDeleteAssetMutation, useAddAssetValuationMutation,
} from '@app/api/assetsApi';
import { useAppSettings } from '@core/hooks/useAppSettings';
import { useSnackbar } from 'notistack';
import type { Asset } from '@core/database/types';

const schema = z.object({
  name: z.string().min(1, 'Name is required'),
  assetTypeId: z.number().positive('Asset type is required'),
  purchaseValue: z.number().min(0),
  currentValue: z.number().min(0),
  purchaseDate: z.string().optional(),
  description: z.string().optional(),
  quantity: z.number().optional(),
  unit: z.string().optional(),
  isActive: z.boolean(),
});
type FormData = z.infer<typeof schema>;

export function AssetsPage() {
  const { formatCurrency, formatDate } = useAppSettings();
  const { enqueueSnackbar } = useSnackbar();
  const { data: assets = [], isLoading } = useGetAssetsQuery();
  const { data: assetTypes = [] } = useGetAssetTypesQuery();
  const [create, { isLoading: creating }] = useCreateAssetMutation();
  const [update, { isLoading: updating }] = useUpdateAssetMutation();
  const [deleteAsset, { isLoading: deleting }] = useDeleteAssetMutation();
  const [addValuation] = useAddAssetValuationMutation();

  const [formOpen, setFormOpen] = useState(false);
  const [editAsset, setEditAsset] = useState<Asset | undefined>();
  const [deleteId, setDeleteId] = useState<number | null>(null);
  const [valuationAsset, setValuationAsset] = useState<Asset | undefined>();
  const [newValue, setNewValue] = useState('');

  const { control, handleSubmit, reset, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: { purchaseValue: 0, currentValue: 0, isActive: true },
  });

  const openForm = (a?: Asset) => {
    setEditAsset(a);
    reset(a ?? { purchaseValue: 0, currentValue: 0, isActive: true });
    setFormOpen(true);
  };

  const onSubmit = async (data: FormData) => {
    try {
      if (editAsset?.id) { await update({ id: editAsset.id, data }).unwrap(); enqueueSnackbar('Asset updated', { variant: 'success' }); }
      else { await create(data as Omit<Asset, 'id' | 'createdAt' | 'updatedAt'>).unwrap(); enqueueSnackbar('Asset created', { variant: 'success' }); }
      setFormOpen(false);
    } catch { enqueueSnackbar('Failed to save', { variant: 'error' }); }
  };

  const handleValuation = async () => {
    if (!valuationAsset || !newValue) return;
    const value = parseFloat(newValue);
    await addValuation({ assetId: valuationAsset.id!, value, valuationDate: new Date().toISOString().split('T')[0] }).unwrap();
    enqueueSnackbar('Valuation updated', { variant: 'success' });
    setValuationAsset(undefined);
    setNewValue('');
  };

  const totalCurrentValue = assets.reduce((s, a) => s + a.currentValue, 0);
  const totalPurchaseValue = assets.reduce((s, a) => s + a.purchaseValue, 0);
  const totalGain = totalCurrentValue - totalPurchaseValue;

  return (
    <Box>
      <PageHeader
        title="Assets"
        icon={<DiamondIcon sx={{ fontSize: 28 }} />}
        subtitle={`${assets.length} assets • Total: ${formatCurrency(totalCurrentValue)}`}
        actions={<Button variant="contained" startIcon={<AddIcon />} onClick={() => openForm()}>Add Asset</Button>}
      />

      <Grid container spacing={2} mb={3}>
        <Grid size={{ xs: 12, sm: 4 }}><StatCard title="Total Asset Value" value={formatCurrency(totalCurrentValue)} icon={<DiamondIcon />} color="#7C3AED" loading={isLoading} /></Grid>
        <Grid size={{ xs: 12, sm: 4 }}><StatCard title="Total Cost" value={formatCurrency(totalPurchaseValue)} icon={<TrendingDownIcon />} color="#D97706" loading={isLoading} /></Grid>
        <Grid size={{ xs: 12, sm: 4 }}><StatCard title="Total Gain/Loss" value={formatCurrency(totalGain)} icon={totalGain >= 0 ? <TrendingUpIcon /> : <TrendingDownIcon />} color={totalGain >= 0 ? '#059669' : '#DC2626'} loading={isLoading} /></Grid>
      </Grid>

      {!isLoading && assets.length === 0 ? (
        <EmptyState title="No assets yet" description="Track your assets and their valuations." action={{ label: 'Add Asset', onClick: () => openForm() }} />
      ) : (
        <Grid container spacing={2}>
          {assets.map(asset => {
            const assetType = assetTypes.find(t => t.id === asset.assetTypeId);
            const gain = asset.currentValue - asset.purchaseValue;
            const gainPct = asset.purchaseValue > 0 ? (gain / asset.purchaseValue) * 100 : 0;
            const isGain = gain >= 0;
            return (
              <Grid key={asset.id} size={{ xs: 12, sm: 6, md: 4 }}>
                <Card>
                  <CardContent>
                    <Box display="flex" justifyContent="space-between" alignItems="flex-start">
                      <Box display="flex" alignItems="center" gap={1.5}>
                        <Avatar sx={{ bgcolor: `${assetType?.color || '#9E9E9E'}20`, color: assetType?.color || '#9E9E9E', width: 40, height: 40 }}>
                          {asset.name[0]}
                        </Avatar>
                        <Box>
                          <Typography variant="subtitle1" fontWeight={700}>{asset.name}</Typography>
                          {assetType && <Chip label={assetType.name} size="small" sx={{ height: 18, fontSize: '0.65rem' }} />}
                        </Box>
                      </Box>
                      <Box>
                        <Tooltip title="Update Valuation">
                          <IconButton size="small" color="primary" onClick={() => { setValuationAsset(asset); setNewValue(String(asset.currentValue)); }}>
                            <UpdateIcon fontSize="small" />
                          </IconButton>
                        </Tooltip>
                        <IconButton size="small" onClick={() => openForm(asset)}><EditIcon fontSize="small" /></IconButton>
                        <IconButton size="small" color="error" onClick={() => setDeleteId(asset.id!)}><DeleteIcon fontSize="small" /></IconButton>
                      </Box>
                    </Box>

                    <Box mt={2}>
                      <Typography variant="h5" fontWeight={800}>{formatCurrency(asset.currentValue)}</Typography>
                      <Box display="flex" alignItems="center" gap={1} mt={0.5}>
                        {isGain ? <TrendingUpIcon sx={{ fontSize: 16, color: 'success.main' }} /> : <TrendingDownIcon sx={{ fontSize: 16, color: 'error.main' }} />}
                        <Typography variant="caption" color={isGain ? 'success.main' : 'error.main'} fontWeight={600}>
                          {isGain ? '+' : ''}{formatCurrency(gain)} ({gainPct.toFixed(1)}%)
                        </Typography>
                      </Box>
                      <Typography variant="caption" color="text.secondary">Cost: {formatCurrency(asset.purchaseValue)}</Typography>
                    </Box>

                    {asset.purchaseDate && (
                      <Typography variant="caption" color="text.secondary" mt={1} display="block">
                        Purchased: {formatDate(asset.purchaseDate)}
                        {asset.quantity && ` • ${asset.quantity} ${asset.unit || 'units'}`}
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
        <DialogTitle fontWeight={700}>{editAsset ? 'Edit Asset' : 'New Asset'}</DialogTitle>
        <form onSubmit={handleSubmit(onSubmit)}>
          <DialogContent>
            <Grid container spacing={2}>
              <Grid size={12}><Controller name="name" control={control} render={({ field }) => (<TextField {...field} fullWidth label="Asset Name *" error={!!errors.name} helperText={errors.name?.message} />)} /></Grid>
              <Grid size={12}><Controller name="assetTypeId" control={control} render={({ field }) => (<TextField {...field} select fullWidth label="Asset Type *" error={!!errors.assetTypeId} value={field.value || ''} onChange={e => field.onChange(Number(e.target.value))}>{assetTypes.map(t => <MenuItem key={t.id} value={t.id!}>{t.name}</MenuItem>)}</TextField>)} /></Grid>
              <Grid size={6}><Controller name="purchaseValue" control={control} render={({ field }) => (<TextField {...field} type="number" fullWidth label="Purchase Value" InputProps={{ startAdornment: <InputAdornment position="start">₹</InputAdornment> }} value={field.value || 0} onChange={e => field.onChange(parseFloat(e.target.value) || 0)} />)} /></Grid>
              <Grid size={6}><Controller name="currentValue" control={control} render={({ field }) => (<TextField {...field} type="number" fullWidth label="Current Value" InputProps={{ startAdornment: <InputAdornment position="start">₹</InputAdornment> }} value={field.value || 0} onChange={e => field.onChange(parseFloat(e.target.value) || 0)} />)} /></Grid>
              <Grid size={6}><Controller name="purchaseDate" control={control} render={({ field }) => (<TextField {...field} type="date" fullWidth label="Purchase Date" InputLabelProps={{ shrink: true }} value={field.value || ''} />)} /></Grid>
              <Grid size={3}><Controller name="quantity" control={control} render={({ field }) => (<TextField {...field} type="number" fullWidth label="Quantity" value={field.value || ''} onChange={e => field.onChange(parseFloat(e.target.value) || undefined)} />)} /></Grid>
              <Grid size={3}><Controller name="unit" control={control} render={({ field }) => (<TextField {...field} fullWidth label="Unit" value={field.value || ''} />)} /></Grid>
              <Grid size={12}><Controller name="description" control={control} render={({ field }) => (<TextField {...field} fullWidth label="Description" multiline rows={2} value={field.value || ''} />)} /></Grid>
            </Grid>
          </DialogContent>
          <DialogActions sx={{ px: 3, pb: 2 }}>
            <Button onClick={() => setFormOpen(false)}>Cancel</Button>
            <Button type="submit" variant="contained" disabled={creating || updating}>{creating || updating ? 'Saving...' : editAsset ? 'Update' : 'Create'}</Button>
          </DialogActions>
        </form>
      </Dialog>

      <Dialog open={!!valuationAsset} onClose={() => setValuationAsset(undefined)} maxWidth="xs" fullWidth>
        <DialogTitle>Update Valuation</DialogTitle>
        <DialogContent>
          <Typography variant="body2" color="text.secondary" mb={2}>{valuationAsset?.name}</Typography>
          <TextField fullWidth label="Current Market Value" type="number" InputProps={{ startAdornment: <InputAdornment position="start">₹</InputAdornment> }} value={newValue} onChange={e => setNewValue(e.target.value)} autoFocus />
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={() => setValuationAsset(undefined)}>Cancel</Button>
          <Button variant="contained" onClick={handleValuation}>Update</Button>
        </DialogActions>
      </Dialog>

      <ConfirmDialog open={deleteId !== null} title="Delete Asset" message="Delete this asset and all valuation history?" onConfirm={async () => { await deleteAsset(deleteId!); enqueueSnackbar('Asset deleted', { variant: 'success' }); setDeleteId(null); }} onCancel={() => setDeleteId(null)} loading={deleting} />
    </Box>
  );
}
