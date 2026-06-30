import { useState } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  Box,
} from '@mui/material';
import { useCreateCategoryMutation } from '@app/api/categoriesApi';
import { ColorPicker } from '@core/components/common/ColorPicker';
import { useSnackbar } from 'notistack';
import type { Category, CategoryType } from '@core/database/types';

interface Props {
  open: boolean;
  onClose: () => void;
  categoryType: CategoryType;
  onCreated: (id: number) => void;
}

export function QuickAddCategoryDialog({ open, onClose, categoryType, onCreated }: Props) {
  const [name, setName] = useState('');
  const [color, setColor] = useState('#2563EB');
  const [createCategory, { isLoading }] = useCreateCategoryMutation();
  const { enqueueSnackbar } = useSnackbar();

  const handleClose = () => {
    setName('');
    setColor('#2563EB');
    onClose();
  };

  const handleCreate = async () => {
    if (!name.trim()) return;
    try {
      const id = await createCategory({
        name: name.trim(),
        color,
        categoryType,
        isActive: true,
      } as Omit<Category, 'id' | 'createdAt' | 'updatedAt'>).unwrap();
      enqueueSnackbar('Category created', { variant: 'success' });
      onCreated(id);
      handleClose();
    } catch {
      enqueueSnackbar('Failed to create category', { variant: 'error' });
    }
  };

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="xs" fullWidth>
      <DialogTitle fontWeight={700}>Add New Category</DialogTitle>
      <DialogContent>
        <Box display="flex" gap={2} alignItems="flex-start" mt={1}>
          <ColorPicker value={color} onChange={setColor} />
          <TextField
            autoFocus
            fullWidth
            label="Category Name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault();
                void handleCreate();
              }
            }}
          />
        </Box>
      </DialogContent>
      <DialogActions sx={{ px: 3, pb: 2 }}>
        <Button onClick={handleClose}>Cancel</Button>
        <Button variant="contained" onClick={handleCreate} disabled={!name.trim() || isLoading}>
          {isLoading ? 'Creating...' : 'Create'}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
