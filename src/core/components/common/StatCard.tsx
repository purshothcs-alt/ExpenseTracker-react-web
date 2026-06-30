import { Card, CardContent, Box, Typography, Skeleton } from '@mui/material';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import TrendingDownIcon from '@mui/icons-material/TrendingDown';
import type { ReactNode } from 'react';

interface Props {
  title: string;
  value: string | number;
  subtitle?: string;
  icon?: ReactNode;
  color?: string;
  trend?: number;
  loading?: boolean;
}

export function StatCard({
  title,
  value,
  subtitle,
  icon,
  color = '#2563EB',
  trend,
  loading,
}: Props) {
  return (
    <Card
      sx={{
        height: '100%',
        animation: 'stat-card-enter 0.4s ease-out',
        transition: 'transform 0.2s ease, box-shadow 0.2s ease',
        '&:hover': { transform: 'translateY(-3px)', boxShadow: 4 },
        '@keyframes stat-card-enter': {
          from: { opacity: 0, transform: 'translateY(10px)' },
          to: { opacity: 1, transform: 'translateY(0)' },
        },
      }}
    >
      <CardContent sx={{ p: 2.5 }}>
        <Box display="flex" alignItems="flex-start" justifyContent="space-between">
          <Box flex={1}>
            <Typography
              variant="caption"
              color="text.secondary"
              fontWeight={600}
              textTransform="uppercase"
              letterSpacing={0.5}
            >
              {title}
            </Typography>
            {loading ? (
              <Skeleton variant="text" width={120} height={44} />
            ) : (
              <Typography variant="h4" fontWeight={700} color="text.primary" mt={0.5}>
                {value}
              </Typography>
            )}
            {subtitle && (
              <Typography variant="caption" color="text.secondary" mt={0.5} display="block">
                {subtitle}
              </Typography>
            )}
            {trend !== undefined && !loading && (
              <Box display="flex" alignItems="center" gap={0.5} mt={0.5}>
                {trend >= 0 ? (
                  <TrendingUpIcon sx={{ fontSize: 16, color: 'success.main' }} />
                ) : (
                  <TrendingDownIcon sx={{ fontSize: 16, color: 'error.main' }} />
                )}
                <Typography
                  variant="caption"
                  color={trend >= 0 ? 'success.main' : 'error.main'}
                  fontWeight={600}
                >
                  {Math.abs(trend).toFixed(1)}% vs last month
                </Typography>
              </Box>
            )}
          </Box>
          {icon && (
            <Box
              sx={{
                width: 48,
                height: 48,
                borderRadius: 2,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                bgcolor: `${color}18`,
                color,
                '& svg': { fontSize: 24 },
                flexShrink: 0,
              }}
            >
              {icon}
            </Box>
          )}
        </Box>
      </CardContent>
    </Card>
  );
}
