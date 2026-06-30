import dayjs from 'dayjs';

export function formatDate(date: string | Date | null | undefined, format = 'DD/MM/YYYY'): string {
  if (!date) return '-';
  return dayjs(date).format(format);
}

export function formatDateTime(
  date: string | Date | null | undefined,
  dateFormat = 'DD/MM/YYYY',
  timeFormat = 'HH:mm',
): string {
  if (!date) return '-';
  return dayjs(date).format(`${dateFormat} ${timeFormat}`);
}

export function getMonthRange(offset = 0): { startDate: string; endDate: string } {
  const d = dayjs().subtract(offset, 'month');
  return {
    startDate: d.startOf('month').format('YYYY-MM-DD'),
    endDate: d.endOf('month').format('YYYY-MM-DD'),
  };
}

export function getCurrentMonthRange(): { startDate: string; endDate: string } {
  return getMonthRange(0);
}

export function getYearRange(offset = 0): { startDate: string; endDate: string } {
  const d = dayjs().subtract(offset, 'year');
  return {
    startDate: d.startOf('year').format('YYYY-MM-DD'),
    endDate: d.endOf('year').format('YYYY-MM-DD'),
  };
}

export function daysUntil(date: string): number {
  return dayjs(date).diff(dayjs(), 'day');
}

export function monthsBetween(start: string, end: string): number {
  return dayjs(end).diff(dayjs(start), 'month');
}

export function isOverdue(date: string): boolean {
  return dayjs(date).isBefore(dayjs(), 'day');
}

export function toApiDate(date: Date | null | undefined): string {
  if (!date) return '';
  return dayjs(date).format('YYYY-MM-DD');
}
