/**
 * API functions for fetching gold prices and exchange rates for zakat calculator.
 */

const GOLD_API_URL = "https://freegoldapi.com/data/latest.json";
const EXCHANGE_API_URL = "https://open.er-api.com/v6/latest/USD";

export type CurrencyCode =
  | "LKR"
  | "USD"
  | "GBP"
  | "EUR"
  | "AED"
  | "SAR"
  | "PKR"
  | "INR"
  | "MYR"
  | "IDR"
  | "BHD"
  | "QAR"
  | "KWD"
  | "OMR"
  | "JPY"
  | "CAD"
  | "AUD"
  | "NZD"
  | "ZAR"
  | "TRY";

export interface GoldPriceEntry {
  date: string;
  price: number;
  source: string;
}

export type GoldPriceData = GoldPriceEntry[];

export interface ExchangeRates {
  result: string;
  rates: Record<string, number>;
  base_code: string;
  time_last_update_utc: string;
}

/**
 * Fetches current gold price per troy ounce in USD.
 * The API returns an array of historical data, so we extract the latest entry.
 * Returns null if fetch fails.
 */
export async function fetchGoldPrice(): Promise<number | null> {
  try {
    const response = await fetch(GOLD_API_URL, {
      next: { revalidate: 3600 }, // Cache for 1 hour
    });

    if (!response.ok) {
      return null;
    }

    const data = (await response.json()) as GoldPriceData;
    
    // API returns an array of historical data, get the latest (last) entry
    if (!Array.isArray(data) || data.length === 0) {
      return null;
    }

    // Get the last entry which should be the most recent price
    const latestEntry = data[data.length - 1];
    return latestEntry?.price || null;
  } catch (error) {
    console.error("Failed to fetch gold price:", error);
    return null;
  }
}

/**
 * Fetches exchange rates from USD to target currency using ExchangeRate-API.
 * Returns null if fetch fails.
 * Uses open access endpoint: https://open.er-api.com/v6/latest/USD
 */
export async function fetchExchangeRate(
  targetCurrency: CurrencyCode,
): Promise<number | null> {
  if (targetCurrency === "USD") {
    return 1;
  }

  try {
    const response = await fetch(EXCHANGE_API_URL, {
      next: { revalidate: 3600 }, // Cache for 1 hour
    });

    if (!response.ok) {
      return null;
    }

    const data = (await response.json()) as ExchangeRates;
    
    if (data.result !== "success" || !data.rates) {
      return null;
    }

    return data.rates[targetCurrency] || null;
  } catch (error) {
    console.error("Failed to fetch exchange rate:", error);
    return null;
  }
}

/**
 * Converts gold price from USD per troy ounce to target currency per gram.
 * 1 troy ounce = 31.1034768 grams
 */
export function convertGoldPriceToCurrency(
  goldPricePerOunceUSD: number,
  exchangeRate: number,
): number {
  const gramsPerOunce = 31.1034768;
  return (goldPricePerOunceUSD * exchangeRate) / gramsPerOunce;
}

/**
 * Converts silver price from USD per troy ounce to target currency per gram.
 * Uses the same conversion logic as gold.
 */
export function convertSilverPriceToCurrency(
  silverPricePerOunceUSD: number,
  exchangeRate: number,
): number {
  return convertGoldPriceToCurrency(silverPricePerOunceUSD, exchangeRate);
}

/**
 * Calculates silver price from gold price using gold/silver ratio of 75.
 * Gold/Silver ratio is typically around 70-80, using 75 as default.
 * Returns price per troy ounce in USD, or null if gold price is unavailable.
 */
export async function fetchSilverPrice(): Promise<number | null> {
  const goldPrice = await fetchGoldPrice();
  if (!goldPrice) {
    return null;
  }
  // Using gold/silver ratio of 75
  return goldPrice / 75;
}
