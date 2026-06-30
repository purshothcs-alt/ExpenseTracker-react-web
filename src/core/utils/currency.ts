import type { AppSettings } from '@core/database/types';

export function formatCurrency(
  amount: number,
  settings: Pick<
    AppSettings,
    'currencySymbol' | 'decimalSeparator' | 'thousandSeparator' | 'showCents'
  >,
  showCents = true,
): string {
  const {
    currencySymbol = '₹',
    decimalSeparator = '.',
    thousandSeparator = ',',
    showCents: showCentsSetting,
  } = settings;
  const displayCents = showCents && showCentsSetting !== false;
  const abs = Math.abs(amount);
  const [intPart, decPart] = abs.toFixed(displayCents ? 2 : 0).split('.');
  const formatted = intPart.replace(/\B(?=(\d{3})+(?!\d))/g, thousandSeparator);
  const decimal = displayCents && decPart ? `${decimalSeparator}${decPart}` : '';
  const sign = amount < 0 ? '-' : '';
  return `${sign}${currencySymbol}${formatted}${decimal}`;
}

export function parseCurrency(
  value: string,
  settings?: Pick<AppSettings, 'currencySymbol' | 'thousandSeparator' | 'decimalSeparator'>,
): number {
  if (!settings) return parseFloat(value.replace(/[^0-9.-]/g, '')) || 0;
  const clean = value
    .replace(settings.currencySymbol, '')
    .replace(new RegExp(`\\${settings.thousandSeparator}`, 'g'), '')
    .replace(settings.decimalSeparator, '.');
  return parseFloat(clean) || 0;
}

export function formatCompact(amount: number, symbol = '₹'): string {
  if (Math.abs(amount) >= 10000000) return `${symbol}${(amount / 10000000).toFixed(1)}Cr`;
  if (Math.abs(amount) >= 100000) return `${symbol}${(amount / 100000).toFixed(1)}L`;
  if (Math.abs(amount) >= 1000) return `${symbol}${(amount / 1000).toFixed(1)}K`;
  return `${symbol}${amount.toFixed(0)}`;
}

export function percentage(value: number, total: number): number {
  if (total === 0) return 0;
  return Math.round((value / total) * 100 * 10) / 10;
}
