import { Chip } from '@mui/material';
import CheckCircleOutlineIcon from '@mui/icons-material/CheckCircleOutline';
import CancelOutlinedIcon from '@mui/icons-material/CancelOutlined';

interface Props {
  isActive: boolean;
  activeLabel?: string;
  inactiveLabel?: string;
  size?: 'small' | 'medium';
}

export function StatusChip({
  isActive,
  activeLabel = 'Active',
  inactiveLabel = 'Inactive',
  size = 'small',
}: Props) {
  return (
    <Chip
      size={size}
      icon={isActive ? <CheckCircleOutlineIcon /> : <CancelOutlinedIcon />}
      label={isActive ? activeLabel : inactiveLabel}
      color={isActive ? 'success' : 'default'}
      variant="outlined"
      sx={{ fontWeight: 500 }}
    />
  );
}
