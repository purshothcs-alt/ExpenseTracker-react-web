import { Card, CardContent, Typography, Box, LinearProgress, Chip } from '@mui/material';
import { useGetBudgetsQuery } from '@app/api/budgetsApi';
import { useAppSettings } from '@core/hooks/useAppSettings';

export function BudgetStatusWidget() {
  const { data: budgets = [], isLoading } = useGetBudgetsQuery();
  const { formatCurrency } = useAppSettings();

  const getColor = (pct: number, threshold: number) => {
    if (pct >= 100) return 'error';
    if (pct >= threshold) return 'warning';
    return 'success';
  };

  return (
    <Card sx={{ height: '100%' }}>
      <CardContent>
        <Typography variant="subtitle1" fontWeight={600} mb={2}>
          Budget Status
        </Typography>
        {isLoading ? (
          <Typography color="text.secondary" variant="body2">
            Loading...
          </Typography>
        ) : budgets.length === 0 ? (
          <Typography color="text.secondary" variant="body2">
            No active budgets
          </Typography>
        ) : (
          budgets.slice(0, 6).map((b) => {
            const pct = b.utilizationPct || 0;
            const color = getColor(pct, b.alertThreshold);
            const muiColor =
              color === 'error' ? '#DC2626' : color === 'warning' ? '#D97706' : '#059669';
            return (
              <Box key={b.id} mb={1.5}>
                <Box display="flex" justifyContent="space-between" alignItems="center" mb={0.5}>
                  <Box display="flex" alignItems="center" gap={1}>
                    <Typography variant="body2" fontWeight={500}>
                      {b.name}
                    </Typography>
                    {pct >= 100 && (
                      <Chip
                        label="Over Budget"
                        size="small"
                        color="error"
                        sx={{ height: 18, fontSize: '0.6rem' }}
                      />
                    )}
                    {pct >= b.alertThreshold && pct < 100 && (
                      <Chip
                        label="Near Limit"
                        size="small"
                        color="warning"
                        sx={{ height: 18, fontSize: '0.6rem' }}
                      />
                    )}
                  </Box>
                  <Typography variant="caption" fontWeight={600} color={`${muiColor}`}>
                    {pct.toFixed(0)}%
                  </Typography>
                </Box>
                <LinearProgress
                  variant="determinate"
                  value={Math.min(pct, 100)}
                  sx={{
                    height: 6,
                    borderRadius: 3,
                    bgcolor: `${muiColor}20`,
                    '& .MuiLinearProgress-bar': { bgcolor: muiColor, borderRadius: 3 },
                  }}
                />
                <Box display="flex" justifyContent="space-between" mt={0.25}>
                  <Typography variant="caption" color="text.secondary">
                    {formatCurrency(b.spent || 0)} spent
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    {formatCurrency(b.amount)} budget
                  </Typography>
                </Box>
              </Box>
            );
          })
        )}
      </CardContent>
    </Card>
  );
}
