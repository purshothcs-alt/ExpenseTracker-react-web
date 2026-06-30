import { Component } from 'react';
import type { ReactNode, ErrorInfo } from 'react';
import { Box, Button, Typography, Paper } from '@mui/material';
import ErrorOutlineIcon from '@mui/icons-material/ErrorOutline';
import RefreshIcon from '@mui/icons-material/Refresh';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error?: Error;
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, info: ErrorInfo): void {
    console.error('ErrorBoundary caught:', error, info);
  }

  handleReset = () => {
    this.setState({ hasError: false, error: undefined });
  };

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) return this.props.fallback;
      return (
        <Box display="flex" alignItems="center" justifyContent="center" minHeight={300} p={3}>
          <Paper sx={{ p: 4, textAlign: 'center', maxWidth: 480 }}>
            <ErrorOutlineIcon sx={{ fontSize: 64, color: 'error.main', mb: 2 }} />
            <Typography variant="h5" fontWeight={700} gutterBottom>
              Something went wrong
            </Typography>
            <Typography variant="body2" color="text.secondary" mb={3}>
              {this.state.error?.message || 'An unexpected error occurred. Please try refreshing.'}
            </Typography>
            <Button variant="contained" startIcon={<RefreshIcon />} onClick={this.handleReset}>
              Try Again
            </Button>
          </Paper>
        </Box>
      );
    }
    return this.props.children;
  }
}
