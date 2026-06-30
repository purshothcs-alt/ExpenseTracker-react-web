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
  LinearProgress,
  Chip,
  IconButton,
  Tooltip,
  InputAdornment,
  Avatar,
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import FlagIcon from '@mui/icons-material/Flag';
import AddCircleOutlineIcon from '@mui/icons-material/AddCircleOutline';
import { useState } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { PageHeader } from '@core/components/common/PageHeader';
import { EmptyState } from '@core/components/common/EmptyState';
import { ConfirmDialog } from '@core/components/common/ConfirmDialog';
import {
  useGetGoalsQuery,
  useGetGoalTypesQuery,
  useCreateGoalMutation,
  useUpdateGoalMutation,
  useDeleteGoalMutation,
  useAddGoalContributionMutation,
} from '@app/api/goalsApi';
import { useAppSettings } from '@core/hooks/useAppSettings';
import { useSnackbar } from 'notistack';
import { daysUntil } from '@core/utils/date';
import type { Goal } from '@core/database/types';

const schema = z.object({
  goalName: z.string().min(1, 'Name is required'),
  goalTypeId: z.number().positive('Goal type is required'),
  targetAmount: z.number().positive('Target must be greater than 0'),
  currentAmount: z.number().min(0),
  targetDate: z.string().min(1, 'Target date is required'),
  description: z.string().optional(),
  isActive: z.boolean(),
});
type FormData = z.infer<typeof schema>;

export function GoalsPage() {
  const { formatCurrency, formatDate } = useAppSettings();
  const { enqueueSnackbar } = useSnackbar();
  const { data: goals = [], isLoading } = useGetGoalsQuery();
  const { data: goalTypes = [] } = useGetGoalTypesQuery();
  const [create, { isLoading: creating }] = useCreateGoalMutation();
  const [update, { isLoading: updating }] = useUpdateGoalMutation();
  const [deleteGoal, { isLoading: deleting }] = useDeleteGoalMutation();
  const [addContribution] = useAddGoalContributionMutation();

  const [formOpen, setFormOpen] = useState(false);
  const [editGoal, setEditGoal] = useState<Goal | undefined>();
  const [deleteId, setDeleteId] = useState<number | null>(null);
  const [contributionGoal, setContributionGoal] = useState<Goal | undefined>();
  const [contributionAmount, setContributionAmount] = useState('');

  const {
    control,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: { currentAmount: 0, isActive: true },
  });

  const openForm = (g?: Goal) => {
    setEditGoal(g);
    reset(g ?? { currentAmount: 0, isActive: true });
    setFormOpen(true);
  };

  const onSubmit = async (data: FormData) => {
    try {
      if (editGoal?.id) {
        await update({ id: editGoal.id, data }).unwrap();
        enqueueSnackbar('Goal updated', { variant: 'success' });
      } else {
        await create(data as Omit<Goal, 'id' | 'createdAt' | 'updatedAt'>).unwrap();
        enqueueSnackbar('Goal created', { variant: 'success' });
      }
      setFormOpen(false);
    } catch {
      enqueueSnackbar('Failed to save', { variant: 'error' });
    }
  };

  const handleContribute = async () => {
    if (!contributionGoal || !contributionAmount) return;
    const amount = parseFloat(contributionAmount);
    if (isNaN(amount) || amount <= 0) return;
    await addContribution({
      goalId: contributionGoal.id!,
      amount,
      contributionDate: new Date().toISOString().split('T')[0],
    }).unwrap();
    enqueueSnackbar(`${formatCurrency(amount)} added to ${contributionGoal.goalName}`, {
      variant: 'success',
    });
    setContributionGoal(undefined);
    setContributionAmount('');
  };

  return (
    <Box>
      <PageHeader
        title="Goals"
        icon={<FlagIcon sx={{ fontSize: 28 }} />}
        subtitle={`${goals.length} financial goals`}
        actions={
          <Button variant="contained" startIcon={<AddIcon />} onClick={() => openForm()}>
            Add Goal
          </Button>
        }
      />

      {!isLoading && goals.length === 0 ? (
        <EmptyState
          title="No goals yet"
          description="Set financial goals and track your progress."
          action={{ label: 'Add Goal', onClick: () => openForm() }}
        />
      ) : (
        <Grid container spacing={2}>
          {goals.map((goal) => {
            const pct =
              goal.targetAmount > 0
                ? Math.min((goal.currentAmount / goal.targetAmount) * 100, 100)
                : 0;
            const days = daysUntil(goal.targetDate);
            const isCompleted = pct >= 100;
            const isOverdue = !isCompleted && days < 0;
            const goalType = goal.goalType;
            const color = isCompleted
              ? '#059669'
              : isOverdue
                ? '#DC2626'
                : goalType?.color || '#2563EB';

            return (
              <Grid key={goal.id} size={{ xs: 12, sm: 6, md: 4 }}>
                <Card sx={{ height: '100%' }}>
                  <CardContent>
                    <Box display="flex" justifyContent="space-between" alignItems="flex-start">
                      <Box display="flex" alignItems="center" gap={1.5}>
                        <Avatar sx={{ bgcolor: `${color}20`, color, width: 40, height: 40 }}>
                          <FlagIcon />
                        </Avatar>
                        <Box>
                          <Typography variant="subtitle1" fontWeight={700}>
                            {goal.goalName}
                          </Typography>
                          {goalType && (
                            <Chip
                              label={goalType.name}
                              size="small"
                              sx={{ height: 18, fontSize: '0.65rem' }}
                            />
                          )}
                        </Box>
                      </Box>
                      <Box>
                        <Tooltip title="Add Contribution">
                          <IconButton
                            size="small"
                            color="primary"
                            onClick={() => {
                              setContributionGoal(goal);
                              setContributionAmount('');
                            }}
                          >
                            <AddCircleOutlineIcon fontSize="small" />
                          </IconButton>
                        </Tooltip>
                        <IconButton size="small" onClick={() => openForm(goal)}>
                          <EditIcon fontSize="small" />
                        </IconButton>
                        <IconButton
                          size="small"
                          color="error"
                          onClick={() => setDeleteId(goal.id!)}
                        >
                          <DeleteIcon fontSize="small" />
                        </IconButton>
                      </Box>
                    </Box>

                    <Box mt={2}>
                      <Box display="flex" justifyContent="space-between" mb={0.5}>
                        <Typography variant="h6" fontWeight={800} color={color}>
                          {pct.toFixed(0)}%
                        </Typography>
                        {isCompleted && <Chip label="Completed!" color="success" size="small" />}
                        {isOverdue && <Chip label="Overdue" color="error" size="small" />}
                      </Box>
                      <LinearProgress
                        variant="determinate"
                        value={pct}
                        sx={{
                          height: 8,
                          borderRadius: 4,
                          bgcolor: `${color}20`,
                          '& .MuiLinearProgress-bar': { bgcolor: color, borderRadius: 4 },
                        }}
                      />
                      <Box display="flex" justifyContent="space-between" mt={0.75}>
                        <Typography variant="caption" color="text.secondary">
                          {formatCurrency(goal.currentAmount)} saved
                        </Typography>
                        <Typography variant="caption" fontWeight={600}>
                          {formatCurrency(goal.targetAmount)} target
                        </Typography>
                      </Box>
                    </Box>

                    <Box mt={1.5} display="flex" justifyContent="space-between">
                      <Typography variant="caption" color="text.secondary">
                        Target: {formatDate(goal.targetDate)}
                      </Typography>
                      <Typography
                        variant="caption"
                        color={isOverdue ? 'error.main' : 'text.secondary'}
                      >
                        {days < 0
                          ? `${Math.abs(days)}d overdue`
                          : days === 0
                            ? 'Today!'
                            : `${days}d left`}
                      </Typography>
                    </Box>
                  </CardContent>
                </Card>
              </Grid>
            );
          })}
        </Grid>
      )}

      <Dialog open={formOpen} onClose={() => setFormOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle fontWeight={700}>{editGoal ? 'Edit Goal' : 'New Goal'}</DialogTitle>
        <form onSubmit={handleSubmit(onSubmit)}>
          <DialogContent>
            <Grid container spacing={2}>
              <Grid size={12}>
                <Controller
                  name="goalName"
                  control={control}
                  render={({ field }) => (
                    <TextField
                      {...field}
                      fullWidth
                      label="Goal Name *"
                      error={!!errors.goalName}
                      helperText={errors.goalName?.message}
                    />
                  )}
                />
              </Grid>
              <Grid size={12}>
                <Controller
                  name="goalTypeId"
                  control={control}
                  render={({ field }) => (
                    <TextField
                      {...field}
                      select
                      fullWidth
                      label="Goal Type *"
                      error={!!errors.goalTypeId}
                      helperText={errors.goalTypeId?.message}
                      value={field.value || ''}
                      onChange={(e) => field.onChange(Number(e.target.value))}
                    >
                      {goalTypes.map((t) => (
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
                  name="targetAmount"
                  control={control}
                  render={({ field }) => (
                    <TextField
                      {...field}
                      type="number"
                      fullWidth
                      label="Target Amount *"
                      InputProps={{
                        startAdornment: <InputAdornment position="start">₹</InputAdornment>,
                      }}
                      error={!!errors.targetAmount}
                      helperText={errors.targetAmount?.message}
                      value={field.value || ''}
                      onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                    />
                  )}
                />
              </Grid>
              <Grid size={6}>
                <Controller
                  name="currentAmount"
                  control={control}
                  render={({ field }) => (
                    <TextField
                      {...field}
                      type="number"
                      fullWidth
                      label="Current Amount"
                      InputProps={{
                        startAdornment: <InputAdornment position="start">₹</InputAdornment>,
                      }}
                      value={field.value || 0}
                      onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                    />
                  )}
                />
              </Grid>
              <Grid size={12}>
                <Controller
                  name="targetDate"
                  control={control}
                  render={({ field }) => (
                    <TextField
                      {...field}
                      type="date"
                      fullWidth
                      label="Target Date *"
                      InputLabelProps={{ shrink: true }}
                      error={!!errors.targetDate}
                      helperText={errors.targetDate?.message}
                    />
                  )}
                />
              </Grid>
              <Grid size={12}>
                <Controller
                  name="description"
                  control={control}
                  render={({ field }) => (
                    <TextField
                      {...field}
                      fullWidth
                      label="Description"
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
              {creating || updating ? 'Saving...' : editGoal ? 'Update' : 'Create'}
            </Button>
          </DialogActions>
        </form>
      </Dialog>

      <Dialog
        open={!!contributionGoal}
        onClose={() => setContributionGoal(undefined)}
        maxWidth="xs"
        fullWidth
      >
        <DialogTitle>Add Contribution</DialogTitle>
        <DialogContent>
          <Typography variant="body2" color="text.secondary" mb={2}>
            Add savings to: <strong>{contributionGoal?.goalName}</strong>
          </Typography>
          <TextField
            fullWidth
            label="Amount"
            type="number"
            InputProps={{ startAdornment: <InputAdornment position="start">₹</InputAdornment> }}
            value={contributionAmount}
            onChange={(e) => setContributionAmount(e.target.value)}
            autoFocus
          />
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={() => setContributionGoal(undefined)}>Cancel</Button>
          <Button variant="contained" onClick={handleContribute} disabled={!contributionAmount}>
            Add
          </Button>
        </DialogActions>
      </Dialog>

      <ConfirmDialog
        open={deleteId !== null}
        title="Delete Goal"
        message="Are you sure?"
        onConfirm={async () => {
          await deleteGoal(deleteId!);
          enqueueSnackbar('Goal deleted', { variant: 'success' });
          setDeleteId(null);
        }}
        onCancel={() => setDeleteId(null)}
        loading={deleting}
      />
    </Box>
  );
}
