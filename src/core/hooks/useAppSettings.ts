import { useAppSelector } from '@app/hooks';
import { formatCurrency as _formatCurrency } from '@core/utils/currency';
import { formatDate as _formatDate } from '@core/utils/date';

export function useAppSettings() {
  const settings = useAppSelector(s => s.settings.settings);

  const formatCurrency = (amount: number, showCents = true) =>
    _formatCurrency(amount, settings, showCents);

  const formatDate = (date: string | Date | null | undefined) =>
    _formatDate(date, settings.dateFormat);

  return { settings, formatCurrency, formatDate };
}
