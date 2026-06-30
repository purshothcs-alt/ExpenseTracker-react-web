import { z } from 'zod';

export const transactionSchema = z.object({
  transactionDate: z.string().min(1, 'Date is required'),
  accountId: z.number({ required_error: 'Account is required' }).positive('Account is required'),
  transactionTypeId: z
    .number({ required_error: 'Transaction type is required' })
    .positive('Transaction type is required'),
  toAccountId: z.number().optional().nullable(),
  categoryId: z.number().optional().nullable(),
  subCategoryId: z.number().optional().nullable(),
  amount: z
    .number({ required_error: 'Amount is required' })
    .positive('Amount must be greater than 0'),
  notes: z.string().max(500).optional(),
  vendor: z.string().max(200).optional(),
  referenceNumber: z.string().max(100).optional(),
  attachmentPath: z.string().optional(),
  isRecurring: z.boolean(),
  projectId: z.number().optional().nullable(),
  tagIds: z.array(z.number()).optional(),
});

export type TransactionFormData = z.infer<typeof transactionSchema>;
