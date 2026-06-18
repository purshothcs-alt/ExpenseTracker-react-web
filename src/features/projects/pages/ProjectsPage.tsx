import {
  Box, Button, Grid, Card, CardContent, Typography,
  Dialog, DialogTitle, DialogContent, DialogActions,
  TextField, MenuItem, Chip, IconButton, LinearProgress, Tabs, Tab, Avatar, InputAdornment,
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import ConstructionIcon from '@mui/icons-material/Construction';
import { useState } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { PageHeader } from '@core/components/common/PageHeader';
import { EmptyState } from '@core/components/common/EmptyState';
import { ConfirmDialog } from '@core/components/common/ConfirmDialog';
import {
  useGetProjectsQuery, useCreateProjectMutation, useUpdateProjectMutation, useDeleteProjectMutation,
  useGetProjectExpensesQuery, useAddProjectExpenseMutation, useDeleteProjectExpenseMutation,
} from '@app/api/projectsApi';
import { useGetAllCategoriesQuery } from '@app/api/categoriesApi';
import { useAppSettings } from '@core/hooks/useAppSettings';
import { useSnackbar } from 'notistack';
import type { Project, ProjectExpense, ProjectStatus } from '@core/database/types';

const PROJECT_STATUSES: ProjectStatus[] = ['planning', 'active', 'on-hold', 'completed', 'cancelled'];
const STATUS_COLORS: Record<ProjectStatus, string> = {
  planning: '#2196F3', active: '#4CAF50', 'on-hold': '#FF9800', completed: '#9C27B0', cancelled: '#9E9E9E',
};

const projectSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  description: z.string().optional(),
  totalBudget: z.number().min(0),
  startDate: z.string().optional(),
  endDate: z.string().optional(),
  status: z.enum(['planning', 'active', 'on-hold', 'completed', 'cancelled']),
  categoryId: z.number().optional().nullable(),
  isActive: z.boolean(),
});
type ProjectForm = z.infer<typeof projectSchema>;

const expenseSchema = z.object({
  description: z.string().min(1),
  amount: z.number().positive(),
  expenseDate: z.string().min(1),
  categoryId: z.number().optional().nullable(),
  vendor: z.string().optional(),
  notes: z.string().optional(),
});
type ExpenseForm = z.infer<typeof expenseSchema>;

function ProjectExpensesPanel({ projectId }: { projectId: number }) {
  const { data: expenses = [] } = useGetProjectExpensesQuery(projectId);
  const { data: categories = [] } = useGetAllCategoriesQuery();
  const [addExpense] = useAddProjectExpenseMutation();
  const [deleteExpense] = useDeleteProjectExpenseMutation();
  const { formatCurrency, formatDate } = useAppSettings();
  const { enqueueSnackbar } = useSnackbar();
  const [open, setOpen] = useState(false);
  const catMap = new Map(categories.map(c => [c.id!, c]));

  const { control, handleSubmit, reset } = useForm<ExpenseForm>({
    resolver: zodResolver(expenseSchema),
    defaultValues: { expenseDate: new Date().toISOString().split('T')[0] },
  });

  const onSubmit = async (data: ExpenseForm) => {
    const { categoryId, ...rest } = data;
    await addExpense({ projectId, ...rest, categoryId: categoryId ?? undefined } as Omit<ProjectExpense, 'id' | 'createdAt' | 'updatedAt'>).unwrap();
    enqueueSnackbar('Expense added', { variant: 'success' });
    setOpen(false);
    reset();
  };

  return (
    <Box>
      <Box display="flex" justifyContent="flex-end" mb={1}>
        <Button size="small" startIcon={<AddIcon />} variant="outlined" onClick={() => setOpen(true)}>Add Expense</Button>
      </Box>
      {expenses.length === 0 ? (
        <Typography color="text.secondary" variant="body2">No expenses recorded</Typography>
      ) : (
        expenses.map(e => (
          <Box key={e.id} display="flex" justifyContent="space-between" alignItems="center" py={0.5} borderBottom="1px solid" borderColor="divider">
            <Box>
              <Typography variant="body2" fontWeight={500}>{e.description}</Typography>
              <Typography variant="caption" color="text.secondary">
                {formatDate(e.expenseDate)} {e.categoryId ? ` • ${catMap.get(e.categoryId)?.name}` : ''} {e.vendor ? ` • ${e.vendor}` : ''}
              </Typography>
            </Box>
            <Box display="flex" alignItems="center" gap={1}>
              <Typography variant="body2" fontWeight={700}>{formatCurrency(e.amount)}</Typography>
              <IconButton size="small" color="error" onClick={() => deleteExpense(e.id!)}><DeleteIcon fontSize="small" /></IconButton>
            </Box>
          </Box>
        ))
      )}

      <Dialog open={open} onClose={() => setOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Add Expense</DialogTitle>
        <form onSubmit={handleSubmit(onSubmit)}>
          <DialogContent>
            <Grid container spacing={2}>
              <Grid size={12}><Controller name="description" control={control} render={({ field }) => (<TextField {...field} fullWidth label="Description *" />)} /></Grid>
              <Grid size={6}><Controller name="amount" control={control} render={({ field }) => (<TextField {...field} type="number" fullWidth label="Amount *" InputProps={{ startAdornment: <InputAdornment position="start">₹</InputAdornment> }} value={field.value || ''} onChange={e => field.onChange(parseFloat(e.target.value) || 0)} />)} /></Grid>
              <Grid size={6}><Controller name="expenseDate" control={control} render={({ field }) => (<TextField {...field} type="date" fullWidth label="Date" InputLabelProps={{ shrink: true }} />)} /></Grid>
              <Grid size={6}><Controller name="categoryId" control={control} render={({ field }) => (<TextField {...field} select fullWidth label="Category" value={field.value || ''} onChange={e => field.onChange(e.target.value ? Number(e.target.value) : null)}><MenuItem value=""><em>None</em></MenuItem>{categories.filter(c => !c.parentId).map(c => <MenuItem key={c.id} value={c.id!}>{c.name}</MenuItem>)}</TextField>)} /></Grid>
              <Grid size={6}><Controller name="vendor" control={control} render={({ field }) => (<TextField {...field} fullWidth label="Vendor" value={field.value || ''} />)} /></Grid>
            </Grid>
          </DialogContent>
          <DialogActions sx={{ px: 3, pb: 2 }}>
            <Button onClick={() => setOpen(false)}>Cancel</Button>
            <Button type="submit" variant="contained">Add</Button>
          </DialogActions>
        </form>
      </Dialog>
    </Box>
  );
}

export function ProjectsPage() {
  const { formatCurrency, formatDate } = useAppSettings();
  const { enqueueSnackbar } = useSnackbar();
  const { data: projects = [], isLoading } = useGetProjectsQuery();
  const { data: categories = [] } = useGetAllCategoriesQuery();
  const [create, { isLoading: creating }] = useCreateProjectMutation();
  const [update, { isLoading: updating }] = useUpdateProjectMutation();
  const [deleteProject, { isLoading: deleting }] = useDeleteProjectMutation();

  const [formOpen, setFormOpen] = useState(false);
  const [editProject, setEditProject] = useState<Project | undefined>();
  const [deleteId, setDeleteId] = useState<number | null>(null);
  const [selectedProjectId, setSelectedProjectId] = useState<number | null>(null);
  const [tab, setTab] = useState<Record<number, number>>({});

  const { control, handleSubmit, reset, formState: { errors } } = useForm<ProjectForm>({
    resolver: zodResolver(projectSchema),
    defaultValues: { totalBudget: 0, status: 'planning', isActive: true },
  });

  const openForm = (p?: Project) => {
    setEditProject(p);
    reset(p ?? { totalBudget: 0, status: 'planning', isActive: true });
    setFormOpen(true);
  };

  const onSubmit = async (data: ProjectForm) => {
    const { categoryId, ...rest } = data;
    const projectData = { ...rest, categoryId: categoryId ?? undefined } as Omit<Project, 'id' | 'createdAt' | 'updatedAt'>;
    try {
      if (editProject?.id) { await update({ id: editProject.id, data: projectData }).unwrap(); enqueueSnackbar('Project updated', { variant: 'success' }); }
      else { await create(projectData).unwrap(); enqueueSnackbar('Project created', { variant: 'success' }); }
      setFormOpen(false);
    } catch { enqueueSnackbar('Failed to save', { variant: 'error' }); }
  };

  return (
    <Box>
      <PageHeader
        title="Projects"
        icon={<ConstructionIcon sx={{ fontSize: 28 }} />}
        subtitle={`${projects.length} projects`}
        actions={<Button variant="contained" startIcon={<AddIcon />} onClick={() => openForm()}>New Project</Button>}
      />

      {!isLoading && projects.length === 0 ? (
        <EmptyState title="No projects yet" description="Track construction, renovation, and other project expenses." action={{ label: 'New Project', onClick: () => openForm() }} />
      ) : (
        <Grid container spacing={2}>
          {projects.map(project => {
            const pct = project.budgetUtilizationPct || 0;
            const statusColor = STATUS_COLORS[project.status as ProjectStatus] || '#9E9E9E';
            const isExpanded = selectedProjectId === project.id;

            return (
              <Grid key={project.id} size={{ xs: 12, md: isExpanded ? 12 : 6, lg: isExpanded ? 12 : 4 }}>
                <Card>
                  <CardContent>
                    <Box display="flex" justifyContent="space-between" alignItems="flex-start">
                      <Box display="flex" alignItems="center" gap={1.5}>
                        <Avatar sx={{ bgcolor: `${statusColor}20`, color: statusColor, width: 40, height: 40 }}>
                          <ConstructionIcon />
                        </Avatar>
                        <Box>
                          <Typography variant="subtitle1" fontWeight={700}>{project.name}</Typography>
                          <Chip label={project.status.replace('-', ' ')} size="small" sx={{ height: 18, fontSize: '0.65rem', bgcolor: `${statusColor}20`, color: statusColor }} />
                        </Box>
                      </Box>
                      <Box>
                        <IconButton size="small" onClick={() => setSelectedProjectId(isExpanded ? null : project.id!)}><ConstructionIcon fontSize="small" /></IconButton>
                        <IconButton size="small" onClick={() => openForm(project)}><EditIcon fontSize="small" /></IconButton>
                        <IconButton size="small" color="error" onClick={() => setDeleteId(project.id!)}><DeleteIcon fontSize="small" /></IconButton>
                      </Box>
                    </Box>

                    <Box mt={2}>
                      <Box display="flex" justifyContent="space-between">
                        <Typography variant="caption" color="text.secondary">Spent</Typography>
                        <Typography variant="caption" fontWeight={700}>{formatCurrency(project.totalSpent || 0)} / {formatCurrency(project.totalBudget)}</Typography>
                      </Box>
                      <LinearProgress
                        variant="determinate"
                        value={Math.min(pct, 100)}
                        sx={{ height: 6, borderRadius: 3, mt: 0.5, bgcolor: '#E0E0E0', '& .MuiLinearProgress-bar': { bgcolor: pct > 100 ? '#DC2626' : statusColor } }}
                      />
                      <Box display="flex" justifyContent="space-between" mt={0.25}>
                        <Typography variant="caption" color={project.budgetVariance! < 0 ? 'error.main' : 'success.main'} fontWeight={600}>
                          {project.budgetVariance! >= 0 ? 'Under by: ' : 'Over by: '}{formatCurrency(Math.abs(project.budgetVariance || 0))}
                        </Typography>
                        <Typography variant="caption" fontWeight={600}>{pct.toFixed(0)}%</Typography>
                      </Box>
                    </Box>

                    {project.startDate && (
                      <Typography variant="caption" color="text.secondary" mt={1} display="block">
                        {formatDate(project.startDate)}{project.endDate ? ` → ${formatDate(project.endDate)}` : ''}
                      </Typography>
                    )}

                    {isExpanded && (
                      <Box mt={2} pt={2} borderTop="1px solid" borderColor="divider">
                        <Tabs value={tab[project.id!] || 0} onChange={(_, v) => setTab(prev => ({ ...prev, [project.id!]: v }))} variant="fullWidth">
                          <Tab label="Expenses" />
                        </Tabs>
                        <Box mt={1}>
                          <ProjectExpensesPanel projectId={project.id!} />
                        </Box>
                      </Box>
                    )}
                  </CardContent>
                </Card>
              </Grid>
            );
          })}
        </Grid>
      )}

      <Dialog open={formOpen} onClose={() => setFormOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle fontWeight={700}>{editProject ? 'Edit Project' : 'New Project'}</DialogTitle>
        <form onSubmit={handleSubmit(onSubmit)}>
          <DialogContent>
            <Grid container spacing={2}>
              <Grid size={12}><Controller name="name" control={control} render={({ field }) => (<TextField {...field} fullWidth label="Project Name *" error={!!errors.name} helperText={errors.name?.message} />)} /></Grid>
              <Grid size={12}><Controller name="description" control={control} render={({ field }) => (<TextField {...field} fullWidth label="Description" multiline rows={2} value={field.value || ''} />)} /></Grid>
              <Grid size={6}><Controller name="totalBudget" control={control} render={({ field }) => (<TextField {...field} type="number" fullWidth label="Total Budget" InputProps={{ startAdornment: <InputAdornment position="start">₹</InputAdornment> }} value={field.value || 0} onChange={e => field.onChange(parseFloat(e.target.value) || 0)} />)} /></Grid>
              <Grid size={6}><Controller name="status" control={control} render={({ field }) => (<TextField {...field} select fullWidth label="Status">{PROJECT_STATUSES.map(s => <MenuItem key={s} value={s}>{s.charAt(0).toUpperCase() + s.slice(1).replace('-', ' ')}</MenuItem>)}</TextField>)} /></Grid>
              <Grid size={6}><Controller name="startDate" control={control} render={({ field }) => (<TextField {...field} type="date" fullWidth label="Start Date" InputLabelProps={{ shrink: true }} value={field.value || ''} />)} /></Grid>
              <Grid size={6}><Controller name="endDate" control={control} render={({ field }) => (<TextField {...field} type="date" fullWidth label="End Date" InputLabelProps={{ shrink: true }} value={field.value || ''} />)} /></Grid>
              <Grid size={12}><Controller name="categoryId" control={control} render={({ field }) => (<TextField {...field} select fullWidth label="Category" value={field.value || ''} onChange={e => field.onChange(e.target.value ? Number(e.target.value) : null)}><MenuItem value=""><em>None</em></MenuItem>{categories.filter(c => !c.parentId).map(c => <MenuItem key={c.id} value={c.id!}>{c.name}</MenuItem>)}</TextField>)} /></Grid>
            </Grid>
          </DialogContent>
          <DialogActions sx={{ px: 3, pb: 2 }}>
            <Button onClick={() => setFormOpen(false)}>Cancel</Button>
            <Button type="submit" variant="contained" disabled={creating || updating}>{creating || updating ? 'Saving...' : editProject ? 'Update' : 'Create'}</Button>
          </DialogActions>
        </form>
      </Dialog>

      <ConfirmDialog open={deleteId !== null} title="Delete Project" message="This will also delete all project expenses. Proceed?" onConfirm={async () => { await deleteProject(deleteId!); enqueueSnackbar('Project deleted', { variant: 'success' }); setDeleteId(null); }} onCancel={() => setDeleteId(null)} loading={deleting} />
    </Box>
  );
}
