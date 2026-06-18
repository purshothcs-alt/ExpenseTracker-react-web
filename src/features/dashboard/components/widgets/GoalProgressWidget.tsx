import { Card, CardContent, Typography, Box, LinearProgress, Avatar } from '@mui/material';
import FlagIcon from '@mui/icons-material/Flag';
import { useGetGoalsQuery } from '@app/api/goalsApi';
import { useAppSettings } from '@core/hooks/useAppSettings';
import { daysUntil } from '@core/utils/date';

export function GoalProgressWidget() {
  const { data: goals = [], isLoading } = useGetGoalsQuery();
  const { formatCurrency } = useAppSettings();

  return (
    <Card sx={{ height: '100%' }}>
      <CardContent>
        <Typography variant="subtitle1" fontWeight={600} mb={2}>Goal Progress</Typography>
        {isLoading ? (
          <Typography color="text.secondary" variant="body2">Loading...</Typography>
        ) : goals.length === 0 ? (
          <Typography color="text.secondary" variant="body2">No active goals</Typography>
        ) : (
          goals.slice(0, 5).map(goal => {
            const pct = goal.targetAmount > 0 ? (goal.currentAmount / goal.targetAmount) * 100 : 0;
            const days = daysUntil(goal.targetDate);
            const color = pct >= 100 ? '#059669' : days < 30 ? '#DC2626' : '#2563EB';
            return (
              <Box key={goal.id} mb={2}>
                <Box display="flex" alignItems="center" gap={1} mb={0.5}>
                  <Avatar sx={{ width: 24, height: 24, bgcolor: `${color}20`, color }}>
                    <FlagIcon sx={{ fontSize: 14 }} />
                  </Avatar>
                  <Box flex={1}>
                    <Box display="flex" justifyContent="space-between">
                      <Typography variant="body2" fontWeight={600}>{goal.goalName}</Typography>
                      <Typography variant="caption" fontWeight={700} color={color}>{pct.toFixed(0)}%</Typography>
                    </Box>
                  </Box>
                </Box>
                <LinearProgress
                  variant="determinate"
                  value={Math.min(pct, 100)}
                  sx={{
                    height: 5, borderRadius: 3,
                    bgcolor: `${color}20`,
                    '& .MuiLinearProgress-bar': { bgcolor: color, borderRadius: 3 },
                  }}
                />
                <Box display="flex" justifyContent="space-between" mt={0.25}>
                  <Typography variant="caption" color="text.secondary">
                    {formatCurrency(goal.currentAmount)} / {formatCurrency(goal.targetAmount)}
                  </Typography>
                  <Typography variant="caption" color={days < 0 ? 'error.main' : 'text.secondary'}>
                    {days < 0 ? 'Overdue' : days === 0 ? 'Today' : `${days}d left`}
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
