import { Box, Popover, TextField } from '@mui/material';
import { useState } from 'react';

const PRESET_COLORS = [
  '#F44336',
  '#E91E63',
  '#9C27B0',
  '#673AB7',
  '#3F51B5',
  '#2196F3',
  '#03A9F4',
  '#00BCD4',
  '#009688',
  '#4CAF50',
  '#8BC34A',
  '#CDDC39',
  '#FFEB3B',
  '#FFC107',
  '#FF9800',
  '#FF5722',
  '#795548',
  '#9E9E9E',
  '#607D8B',
  '#000000',
];

interface Props {
  value: string;
  onChange: (color: string) => void;
  label?: string;
}

export function ColorPicker({ value, onChange, label }: Props) {
  const [anchorEl, setAnchorEl] = useState<HTMLElement | null>(null);

  return (
    <Box>
      {label && (
        <Box
          component="label"
          sx={{ fontSize: '0.75rem', color: 'text.secondary', display: 'block', mb: 0.5 }}
        >
          {label}
        </Box>
      )}
      <Box
        sx={{
          width: 36,
          height: 36,
          borderRadius: 1.5,
          cursor: 'pointer',
          bgcolor: value,
          border: '2px solid',
          borderColor: 'divider',
          transition: 'transform 0.1s',
          '&:hover': { transform: 'scale(1.1)' },
        }}
        onClick={(e) => setAnchorEl(e.currentTarget)}
      />
      <Popover open={Boolean(anchorEl)} anchorEl={anchorEl} onClose={() => setAnchorEl(null)}>
        <Box p={2}>
          <Box display="flex" flexWrap="wrap" gap={0.5} maxWidth={180} mb={1.5}>
            {PRESET_COLORS.map((c) => (
              <Box
                key={c}
                sx={{
                  width: 24,
                  height: 24,
                  borderRadius: 0.75,
                  cursor: 'pointer',
                  bgcolor: c,
                  border: value === c ? '2px solid #000' : '1px solid transparent',
                  '&:hover': { opacity: 0.8 },
                }}
                onClick={() => {
                  onChange(c);
                  setAnchorEl(null);
                }}
              />
            ))}
          </Box>
          <TextField
            size="small"
            label="Custom hex"
            value={value}
            onChange={(e) => onChange(e.target.value)}
            inputProps={{ maxLength: 7 }}
          />
        </Box>
      </Popover>
    </Box>
  );
}
