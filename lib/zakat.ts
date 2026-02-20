/**
 * Zakat calculation logic.
 * Nisab and 2.5% rate per Islamic rules; see plan and references.
 */

export const NISAB_GOLD_GRAMS = 87.48;
export const NISAB_SILVER_GRAMS = 612.36;

export type NisabBasis = "gold" | "silver";

export interface ZakatInputs {
  /** Cash, savings, current accounts */
  cash: number;
  /** Gold (ornamental or bullion) — value in currency */
  goldValue: number;
  /** Silver (ornamental or bullion) — value in currency */
  silverValue: number;
  /** Shares/investments at market value */
  investments: number;
  /** Rental or investment property (not primary residence) */
  property: number;
  /** Business stock and assets */
  business: number;
  /** Money owed to you (receivables) */
  receivables: number;
  /** Other zakatable assets */
  other: number;
  /** Borrowed money, goods bought on credit */
  debts: number;
  /** Taxes, rent, utility bills due immediately */
  taxesRentBills: number;
  /** Wages due to employees */
  wagesDue: number;
}

export interface ZakatResult {
  /** Total of all zakatable assets */
  totalAssets: number;
  /** Nisab threshold in currency */
  nisab: number;
  /** Total assets minus debts */
  netWealth: number;
  /** Whether net wealth meets or exceeds nisab */
  isLiable: boolean;
  /** 2.5% of net wealth if liable, else 0 */
  zakatDue: number;
}

/**
 * Returns nisab threshold in the same unit as pricePerGram (e.g. USD).
 */
export function getNisabInCurrency(
  pricePerGram: number,
  basis: NisabBasis,
): number {
  const grams = basis === "gold" ? NISAB_GOLD_GRAMS : NISAB_SILVER_GRAMS;
  return pricePerGram * grams;
}

/**
 * Sums zakatable assets from inputs (excludes debts).
 */
function totalAssets(inputs: ZakatInputs): number {
  return (
    (Number(inputs.cash) || 0) +
    (Number(inputs.goldValue) || 0) +
    (Number(inputs.silverValue) || 0) +
    (Number(inputs.investments) || 0) +
    (Number(inputs.property) || 0) +
    (Number(inputs.business) || 0) +
    (Number(inputs.receivables) || 0) +
    (Number(inputs.other) || 0)
  );
}

/**
 * Calculates zakat: net wealth, nisab, liability, and 2.5% due.
 */
export function calculateZakat(
  inputs: ZakatInputs,
  nisab: number,
): ZakatResult {
  const total = totalAssets(inputs);
  const totalDebts =
    (Number(inputs.debts) || 0) +
    (Number(inputs.taxesRentBills) || 0) +
    (Number(inputs.wagesDue) || 0);
  const netWealth = Math.max(0, total - totalDebts);
  const isLiable = nisab > 0 && netWealth >= nisab;
  const zakatDue = isLiable ? netWealth * 0.025 : 0;

  return {
    totalAssets: total,
    nisab,
    netWealth,
    isLiable,
    zakatDue,
  };
}
