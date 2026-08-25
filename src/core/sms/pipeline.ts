/**
 * SMS Transaction Import Pipeline
 * -------------------------------------------------------------------------
 * SMS text
 *   -> Transaction SMS Detector   (detector.ts)
 *   -> Bank/UPI Parser            (parsers/registry.ts)
 *   -> Transaction Normalizer     (normalizer.ts)
 *   -> Duplicate Detection        (dedup.ts)
 *   -> Account / Category Match   (accountMatcher.ts, categoryMatcher.ts)
 *   -> PendingSmsTransaction row  (review queue)
 *   -> [optional] auto-approve -> existing transactionRepository.create()
 *
 * This is the single entry point every SMS source (Web Share Target today,
 * a native Android listener later) should call — no source-specific logic
 * lives here, so adding a new ingestion source never touches parsing,
 * dedup, or matching.
 */
import db from '@core/database/db';
import { pendingSmsTransactionRepository } from '@core/database/repositories';
import { detectTransactionSms } from './detector';
import { parseWithRegistry } from './parsers/registry';
import { normalizeSmsTransaction } from './normalizer';
import { computeSourceHash, findDuplicate } from './dedup';
import { matchAccountByLast4 } from './accountMatcher';
import { suggestCategoryForMerchant } from './categoryMatcher';
import { computeConfidenceScore, AUTO_APPROVE_THRESHOLD } from './confidence';
import type { Transaction } from '@core/database/types';

export type ImportSmsResultStatus =
  | 'import-disabled'
  | 'ignored-not-financial'
  | 'unparseable'
  | 'duplicate'
  | 'created-pending'
  | 'auto-approved';

export interface ImportSmsResult {
  status: ImportSmsResultStatus;
  /** Detector reason (e.g. "otp-message") when status is ignored-not-financial. */
  reason?: string;
  pendingId?: number;
  transactionId?: number;
}

export interface ImportSmsSettings {
  smsImportEnabled: boolean;
  smsAutoApproveEnabled: boolean;
}

/**
 * Runs one SMS through the full pipeline. Nothing is persisted for
 * non-transactional or unparseable messages — only SMS that clearly look
 * like a bank/UPI transaction ever reach the database, and even then only
 * the minimum fields needed for review are stored (never used for logging).
 */
export async function importSmsText(
  sender: string,
  body: string,
  timestamp: Date | string,
  settings: ImportSmsSettings,
): Promise<ImportSmsResult> {
  if (!settings.smsImportEnabled) {
    return { status: 'import-disabled' };
  }

  const detection = detectTransactionSms(sender, body);
  if (!detection.isTransactional) {
    return { status: 'ignored-not-financial', reason: detection.reason };
  }

  const parsed = parseWithRegistry(sender, body);
  if (!parsed) {
    return { status: 'unparseable' };
  }

  const normalized = normalizeSmsTransaction(parsed, { sender, timestamp });

  const sourceHash = computeSourceHash({
    referenceId: normalized.referenceId,
    upiId: normalized.upiId,
    smsSender: normalized.smsSender,
    amount: normalized.amount,
    direction: normalized.direction,
    accountLast4: normalized.accountLast4,
    smsTimestamp: normalized.smsTimestamp,
  });

  const duplicate = await findDuplicate(sourceHash);
  if (duplicate) {
    return { status: 'duplicate', pendingId: duplicate.id };
  }

  const matchedAccount = await matchAccountByLast4(normalized.accountLast4);
  const suggestedCategoryId = await suggestCategoryForMerchant(normalized.merchant);

  const confidenceScore = computeConfidenceScore({
    baseConfidence: normalized.baseConfidence,
    hasReferenceId: !!normalized.referenceId,
    accountMatched: !!matchedAccount,
    hasMerchant: !!normalized.merchant,
    categoryMatched: !!suggestedCategoryId,
  });

  const pendingId = await pendingSmsTransactionRepository.create({
    sourceHash,
    smsSender: normalized.smsSender,
    smsTimestamp: normalized.smsTimestamp,
    bankKey: normalized.bankKey,
    direction: normalized.direction,
    amount: normalized.amount,
    accountLast4: normalized.accountLast4,
    matchedAccountId: matchedAccount?.id,
    merchant: normalized.merchant,
    upiId: normalized.upiId,
    referenceId: normalized.referenceId,
    suggestedCategoryId,
    confidenceScore,
    status: 'pending',
    rawText: body,
    parseNotes: matchedAccount ? undefined : 'Account not matched',
  });

  const autoApproveResult = settings.smsAutoApproveEnabled
    ? await tryAutoApprove(
        pendingId,
        normalized,
        matchedAccount?.id,
        suggestedCategoryId,
        confidenceScore,
      )
    : undefined;

  if (autoApproveResult) {
    return { status: 'auto-approved', pendingId, transactionId: autoApproveResult };
  }

  return { status: 'created-pending', pendingId };
}

/**
 * Auto-approval only fires when EVERY guard passes: confidence at/above
 * threshold, the account was matched (never guess an account), and exactly
 * one active transaction type matches the SMS direction (never guess
 * between e.g. two different "Expense" subtypes). Anything short of that
 * leaves the record in the review queue.
 */
async function tryAutoApprove(
  pendingId: number,
  normalized: {
    direction: 'debit' | 'credit';
    amount: number;
    merchant?: string;
    referenceId?: string;
    bankKey: string;
    smsTimestamp: string;
  },
  matchedAccountId: number | undefined,
  suggestedCategoryId: number | undefined,
  confidenceScore: number,
): Promise<number | undefined> {
  if (confidenceScore < AUTO_APPROVE_THRESHOLD || !matchedAccountId) return undefined;

  const candidateTypes = await db.transactionTypes
    .filter((t) => t.isActive !== false && t.direction === normalized.direction)
    .toArray();
  if (candidateTypes.length !== 1) return undefined;

  const transactionData: Omit<Transaction, 'id' | 'createdAt' | 'updatedAt'> = {
    transactionDate: normalized.smsTimestamp.split('T')[0],
    accountId: matchedAccountId,
    transactionTypeId: candidateTypes[0].id!,
    categoryId: suggestedCategoryId,
    amount: normalized.amount,
    notes: `Auto-imported from SMS (${normalized.bankKey})`,
    vendor: normalized.merchant,
    referenceNumber: normalized.referenceId,
    isRecurring: false,
  };

  return pendingSmsTransactionRepository.approve(pendingId, transactionData);
}
