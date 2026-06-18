import { Box, Typography, Breadcrumbs, Link } from '@mui/material';
import NavigateNextIcon from '@mui/icons-material/NavigateNext';
import type { ReactNode } from 'react';

interface Breadcrumb {
  label: string;
  href?: string;
}

interface Props {
  title: string;
  subtitle?: string;
  breadcrumbs?: Breadcrumb[];
  actions?: ReactNode;
  icon?: ReactNode;
}

export function PageHeader({ title, subtitle, breadcrumbs, actions, icon }: Props) {
  return (
    <Box mb={3}>
      {breadcrumbs && breadcrumbs.length > 0 && (
        <Breadcrumbs separator={<NavigateNextIcon fontSize="small" />} sx={{ mb: 1 }}>
          {breadcrumbs.map((b, i) =>
            b.href ? (
              <Link key={i} href={b.href} underline="hover" color="text.secondary" variant="caption">
                {b.label}
              </Link>
            ) : (
              <Typography key={i} variant="caption" color="text.primary" fontWeight={500}>
                {b.label}
              </Typography>
            ),
          )}
        </Breadcrumbs>
      )}
      <Box display="flex" alignItems="center" justifyContent="space-between" flexWrap="wrap" gap={2}>
        <Box display="flex" alignItems="center" gap={1.5}>
          {icon && <Box sx={{ color: 'primary.main', display: 'flex' }}>{icon}</Box>}
          <Box>
            <Typography variant="h4" fontWeight={700} lineHeight={1.2}>{title}</Typography>
            {subtitle && (
              <Typography variant="body2" color="text.secondary" mt={0.25}>{subtitle}</Typography>
            )}
          </Box>
        </Box>
        {actions && <Box display="flex" gap={1} flexWrap="wrap">{actions}</Box>}
      </Box>
    </Box>
  );
}
