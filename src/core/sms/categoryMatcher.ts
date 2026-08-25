import db from '@core/database/db';
import type { Category } from '@core/database/types';

/**
 * Built-in merchant keyword -> existing category NAME defaults. These are
 * only suggestions of last resort: a user-defined row in the
 * `merchantCategoryMappings` table (editable from Administration) always
 * takes priority. Category names are matched case-insensitively against
 * whatever categories actually exist in this installation — nothing here
 * creates a category, per the "reuse the existing category system"
 * requirement.
 */
const DEFAULT_MERCHANT_KEYWORDS: Array<{ pattern: RegExp; categoryName: string }> = [
  { pattern: /amazon/i, categoryName: 'Shopping' },
  { pattern: /flipkart/i, categoryName: 'Shopping' },
  { pattern: /myntra/i, categoryName: 'Shopping' },
  { pattern: /swiggy/i, categoryName: 'Food' },
  { pattern: /zomato/i, categoryName: 'Food' },
  { pattern: /uber/i, categoryName: 'Transport' },
  { pattern: /\bola\b/i, categoryName: 'Transport' },
  { pattern: /rapido/i, categoryName: 'Transport' },
  { pattern: /irctc/i, categoryName: 'Transport' },
  { pattern: /electricity|eb\s*bill|discom/i, categoryName: 'Utilities' },
  { pattern: /airtel|jio|vodafone|vi\b|bsnl/i, categoryName: 'Utilities' },
  { pattern: /netflix|hotstar|prime\s*video|spotify/i, categoryName: 'Entertainment' },
  { pattern: /pharmacy|apollo|medplus|1mg/i, categoryName: 'Health' },
  { pattern: /petrol|fuel|hpcl|bpcl|indian\s*oil/i, categoryName: 'Transport' },
];

async function findCategoryByName(name: string): Promise<Category | undefined> {
  const categories = await db.categories.filter((c) => c.isActive !== false).toArray();
  return categories.find((c) => c.name.toLowerCase() === name.toLowerCase());
}

/**
 * Suggests an existing category id for a parsed merchant string. Priority:
 * 1. user-configured merchantCategoryMappings row (substring match)
 * 2. built-in keyword defaults, resolved against this installation's categories
 * Returns undefined (leave uncategorized) if nothing matches — the reviewer
 * picks a category manually rather than guessing wrong.
 */
export async function suggestCategoryForMerchant(
  merchant: string | undefined,
): Promise<number | undefined> {
  if (!merchant) return undefined;
  const merchantLower = merchant.toLowerCase();

  const userMappings = await db.merchantCategoryMappings
    .filter((m) => m.isActive !== false)
    .toArray();
  const userMatch = userMappings.find((m) =>
    merchantLower.includes(m.merchantPattern.toLowerCase()),
  );
  if (userMatch) return userMatch.categoryId;

  const defaultMatch = DEFAULT_MERCHANT_KEYWORDS.find((k) => k.pattern.test(merchant));
  if (!defaultMatch) return undefined;

  const category = await findCategoryByName(defaultMatch.categoryName);
  return category?.id;
}
