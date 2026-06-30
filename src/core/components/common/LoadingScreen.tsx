import { Box, CircularProgress, Typography } from '@mui/material';

interface Props {
  message?: string;
  fullScreen?: boolean;
}

export function LoadingScreen({ message = 'Loading...', fullScreen = false }: Props) {
  return (
    <Box
      display="flex"
      flexDirection="column"
      alignItems="center"
      justifyContent="center"
      gap={2}
      sx={
        fullScreen
          ? { position: 'fixed', inset: 0, bgcolor: 'background.default', zIndex: 9999 }
          : { minHeight: 200, width: '100%' }
      }
    >
      <CircularProgress size={48} thickness={3} />
      <Typography variant="body2" color="text.secondary">
        {message}
      </Typography>
    </Box>
  );
}
