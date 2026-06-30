import {
  Card,
  CardContent,
  Typography,
  Box,
  LinearProgress,
  Avatar,
  Skeleton,
} from '@mui/material';
import { useGetCategoryTotalsQuery } from '@app/api/transactionsApi';
import { useGetAllCategoriesQuery } from '@app/api/categoriesApi';
import { useAppSettings } from '@core/hooks/useAppSettings';
import { getCurrentMonthRange } from '@core/utils/date';

const { startDate, endDate } = getCurrentMonthRange();

export function TopCategoriesWidget({ limit = 6 }: { limit?: number }) {
  const { data: totals = [], isLoading: loadingTotals } = useGetCategoryTotalsQuery({
    startDate,
    endDate,
  });
  const { data: categories = [] } = useGetAllCategoriesQuery();
  const { formatCurrency } = useAppSettings();

  const catMap = new Map(categories.map((c) => [c.id!, c]));
  const topItems = totals.slice(0, limit);
  const maxAmount = topItems[0]?.total || 1;

  return (
    <Card sx={{ height: '100%' }}>
      <CardContent>
        <Typography variant="subtitle1" fontWeight={600} mb={2}>
          Top Spending Categories
        </Typography>
        {loadingTotals ? (
          Array.from({ length: 5 }).map((_, i) => (
            <Box key={i} mb={1.5}>
              <Skeleton variant="rounded" height={40} />
            </Box>
          ))
        ) : topItems.length === 0 ? (
          <Typography color="text.secondary" variant="body2">
            No expense data this month
          </Typography>
        ) : (
          topItems.map((item) => {
            const cat = catMap.get(item.categoryId);
            if (!cat) return null;
            const pct = (item.total / maxAmount) * 100;
            return (
              <Box key={item.categoryId} mb={1.5}>
                <Box display="flex" alignItems="center" justifyContent="space-between" mb={0.5}>
                  <Box display="flex" alignItems="center" gap={1}>
                    <Avatar sx={{ width: 24, height: 24, bgcolor: cat.color, fontSize: 12 }}>
                      {cat.name[0]}
                    </Avatar>
                    <Typography variant="body2" fontWeight={500}>
                      {cat.name}
                    </Typography>
                  </Box>
                  <Typography variant="body2" fontWeight={600} color="text.primary">
                    {formatCurrency(item.total)}
                  </Typography>
                </Box>
                <LinearProgress
                  variant="determinate"
                  value={pct}
                  sx={{
                    height: 6,
                    borderRadius: 3,
                    bgcolor: `${cat.color}20`,
                    '& .MuiLinearProgress-bar': { bgcolor: cat.color, borderRadius: 3 },
                  }}
                />
              </Box>
            );
          })
        )}
      </CardContent>
    </Card>
  );
}
