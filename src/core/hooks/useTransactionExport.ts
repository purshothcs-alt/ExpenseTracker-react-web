import { useGetAllTransactionTypesQuery } from '@app/api/transactionsApi';
import { useGetAllAccountsQuery } from '@app/api/accountsApi';
import { useGetAllCategoriesQuery, useGetAllTagsQuery } from '@app/api/categoriesApi';
import { useGetAllProjectsQuery } from '@app/api/projectsApi';
import { useAppSettings } from '@core/hooks/useAppSettings';
import { exportToCSV, exportToExcel, exportToPDF, type ExportColumn } from '@core/utils/export';
import type { ExportFormat } from '@core/components/common/ExportButtons';
import type { TransactionListItem } from '@core/database/types';

/** Exports a list of transactions with names resolved for type, account, category, tags etc. */
export function useTransactionExport() {
  const { formatCurrency, formatDate } = useAppSettings();
  const { data: txTypes = [] } = useGetAllTransactionTypesQuery();
  const { data: accounts = [] } = useGetAllAccountsQuery();
  const { data: categories = [] } = useGetAllCategoriesQuery();
  const { data: tags = [] } = useGetAllTagsQuery();
  const { data: projects = [] } = useGetAllProjectsQuery();

  return (
    format: ExportFormat,
    rows: TransactionListItem[],
    { title, filename }: { title: string; filename: string },
  ) => {
    const name = <T extends { id?: number; name: string }>(list: T[], id: unknown) =>
      list.find((x) => x.id === id)?.name || '';
    const isPdf = format === 'pdf';

    const columns: ExportColumn<TransactionListItem>[] = [
      {
        header: 'Date',
        key: 'transactionDate',
        format: (v) => (isPdf ? formatDate(v as string) : String(v)),
      },
      { header: 'Type', key: 'transactionTypeId', format: (v) => name(txTypes, v) },
      { header: 'Account', key: 'accountId', format: (v) => name(accounts, v) },
      { header: 'Category', key: 'categoryId', format: (v) => name(categories, v) },
      { header: 'Sub Category', key: 'subCategoryId', format: (v) => name(categories, v) },
      { header: 'Payee', key: 'vendor' },
      {
        header: 'Tags',
        key: 'tagIds',
        format: (v) =>
          ((v as number[] | undefined) || [])
            .map((id) => name(tags, id))
            .filter(Boolean)
            .join(', '),
      },
      // PDF pages are narrow, so the project column is left to the spreadsheet formats
      ...(isPdf
        ? []
        : [
            {
              header: 'Project',
              key: 'projectId',
              format: (v: unknown) => name(projects, v),
            } as ExportColumn<TransactionListItem>,
          ]),
      { header: 'Notes', key: 'notes' },
      {
        header: 'Amount',
        key: 'amount',
        format: (v) => (isPdf ? formatCurrency(v as number) : String(v)),
      },
    ];

    if (format === 'pdf') return exportToPDF(title, columns, rows, filename);
    if (format === 'excel') return exportToExcel('Transactions', columns, rows, filename);
    return exportToCSV(columns, rows, filename);
  };
}
