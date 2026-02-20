"use client";

import { Calculator, ExternalLink, HandCoins, Loader2 } from "lucide-react";
import { useEffect, useMemo, useState, type ChangeEvent } from "react";
import { SearchableSelect } from "@/components/SearchableSelect";
import { Card } from "@/components/ui/Card";
import {
  calculateZakat,
  getNisabInCurrency,
  type NisabBasis,
  type ZakatInputs,
} from "@/lib/zakat";
import {
  convertGoldPriceToCurrency,
  convertSilverPriceToCurrency,
  fetchExchangeRate,
  fetchGoldPrice,
  type CurrencyCode,
} from "@/lib/zakat-api";

const inputClasses =
  "rounded-2xl border border-white/10 bg-surface-muted/80 px-4 py-3 text-base text-foreground outline-none transition-[border-color,box-shadow] focus:border-brand focus:ring-2 focus:ring-brand/20 w-full min-w-0";

const defaultInputs: ZakatInputs = {
  cash: 0,
  goldValue: 0,
  silverValue: 0,
  investments: 0,
  property: 0,
  business: 0,
  receivables: 0,
  other: 0,
  debts: 0,
  taxesRentBills: 0,
  wagesDue: 0,
};

const CURRENCIES: Array<{ value: CurrencyCode; label: string; subtitle?: string }> = [
  { value: "LKR", label: "Sri Lankan Rupee (LKR)" },
  { value: "USD", label: "US Dollar (USD)" },
  { value: "GBP", label: "British Pound (GBP)" },
  { value: "EUR", label: "Euro (EUR)" },
  { value: "AED", label: "UAE Dirham (AED)" },
  { value: "SAR", label: "Saudi Riyal (SAR)" },
  { value: "PKR", label: "Pakistani Rupee (PKR)" },
  { value: "INR", label: "Indian Rupee (INR)" },
  { value: "MYR", label: "Malaysian Ringgit (MYR)" },
  { value: "IDR", label: "Indonesian Rupiah (IDR)" },
  { value: "BHD", label: "Bahraini Dinar (BHD)" },
  { value: "QAR", label: "Qatari Riyal (QAR)" },
  { value: "KWD", label: "Kuwaiti Dinar (KWD)" },
  { value: "OMR", label: "Omani Rial (OMR)" },
  { value: "JPY", label: "Japanese Yen (JPY)" },
  { value: "CAD", label: "Canadian Dollar (CAD)" },
  { value: "AUD", label: "Australian Dollar (AUD)" },
  { value: "NZD", label: "New Zealand Dollar (NZD)" },
  { value: "ZAR", label: "South African Rand (ZAR)" },
  { value: "TRY", label: "Turkish Lira (TRY)" },
];

function parseNum(value: string): number {
  const n = Number(value);
  return Number.isFinite(n) && n >= 0 ? n : 0;
}

export function ZakatCalculator() {
  const [currency, setCurrency] = useState<CurrencyCode>("LKR");
  const [basis, setBasis] = useState<NisabBasis>("silver");
  const [isManualMode, setIsManualMode] = useState(false);
  const [goldPricePerGram, setGoldPricePerGram] = useState<string>("");
  const [silverPricePerGram, setSilverPricePerGram] = useState<string>("");
  const [inputs, setInputs] = useState<ZakatInputs>(defaultInputs);
  const [isLoadingPrices, setIsLoadingPrices] = useState(false);
  const [priceError, setPriceError] = useState<string | null>(null);
  const [goldInputMode, setGoldInputMode] = useState<"grams" | "value">("value");
  const [silverInputMode, setSilverInputMode] = useState<"grams" | "value">("value");
  const [goldGrams, setGoldGrams] = useState<string>("");
  const [silverGrams, setSilverGrams] = useState<string>("");

  const updateInput = (key: keyof ZakatInputs) => (
    e: ChangeEvent<HTMLInputElement>,
  ) => {
    const raw = e.target.value;
    if (raw === "" || raw === undefined) {
      setInputs((prev) => ({ ...prev, [key]: 0 }));
      return;
    }
    const n = Number(raw);
    setInputs((prev) => ({
      ...prev,
      [key]: Number.isFinite(n) && n >= 0 ? n : prev[key],
    }));
  };


  // Calculate nisab for both gold and silver
  const goldNisab = useMemo(() => {
    const price = parseNum(goldPricePerGram);
    return getNisabInCurrency(price, "gold");
  }, [goldPricePerGram]);

  const silverNisab = useMemo(() => {
    const price = parseNum(silverPricePerGram);
    return getNisabInCurrency(price, "silver");
  }, [silverPricePerGram]);

  const nisab = useMemo(() => {
    return basis === "gold" ? goldNisab : silverNisab;
  }, [basis, goldNisab, silverNisab]);

  // Calculate gold/silver values from grams if in grams mode
  useEffect(() => {
    if (goldInputMode === "grams") {
      const grams = parseNum(goldGrams);
      const pricePerGram = parseNum(goldPricePerGram);
      if (grams > 0 && pricePerGram > 0) {
        const calculatedValue = grams * pricePerGram;
        setInputs((prev) => ({ ...prev, goldValue: calculatedValue }));
      } else {
        setInputs((prev) => ({ ...prev, goldValue: 0 }));
      }
    }
  }, [goldGrams, goldPricePerGram, goldInputMode]);

  useEffect(() => {
    if (silverInputMode === "grams") {
      const grams = parseNum(silverGrams);
      const pricePerGram = parseNum(silverPricePerGram);
      if (grams > 0 && pricePerGram > 0) {
        const calculatedValue = grams * pricePerGram;
        setInputs((prev) => ({ ...prev, silverValue: calculatedValue }));
      } else {
        setInputs((prev) => ({ ...prev, silverValue: 0 }));
      }
    }
  }, [silverGrams, silverPricePerGram, silverInputMode]);

  // When switching to grams mode, calculate grams from value if price is available
  useEffect(() => {
    if (goldInputMode === "grams") {
      const gramsNum = parseNum(goldGrams);
      if (gramsNum === 0 && inputs.goldValue > 0) {
        const pricePerGram = parseNum(goldPricePerGram);
        if (pricePerGram > 0) {
          const calculatedGrams = inputs.goldValue / pricePerGram;
          setGoldGrams(calculatedGrams.toFixed(2));
        }
      }
    }
  }, [goldInputMode, inputs.goldValue, goldPricePerGram, goldGrams]);

  useEffect(() => {
    if (silverInputMode === "grams") {
      const gramsNum = parseNum(silverGrams);
      if (gramsNum === 0 && inputs.silverValue > 0) {
        const pricePerGram = parseNum(silverPricePerGram);
        if (pricePerGram > 0) {
          const calculatedGrams = inputs.silverValue / pricePerGram;
          setSilverGrams(calculatedGrams.toFixed(2));
        }
      }
    }
  }, [silverInputMode, inputs.silverValue, silverPricePerGram, silverGrams]);

  const result = useMemo(
    () => calculateZakat(inputs, nisab),
    [inputs, nisab],
  );

  // Fetch gold and silver prices when currency changes (only in auto mode)
  useEffect(() => {
    if (isManualMode) return;

    let cancelled = false;

    async function fetchPrices() {
      setIsLoadingPrices(true);
      setPriceError(null);

      try {
        // Fetch gold price and exchange rate in parallel
        const [goldPriceUSD, exchangeRate] = await Promise.all([
          fetchGoldPrice(),
          fetchExchangeRate(currency),
        ]);

        if (cancelled) return;

        if (goldPriceUSD && exchangeRate) {
          const goldPriceInCurrency = convertGoldPriceToCurrency(
            goldPriceUSD,
            exchangeRate,
          );
          setGoldPricePerGram(goldPriceInCurrency.toFixed(2));

          // Calculate silver price from gold price (using gold/silver ratio of 75)
          const silverPriceUSD = goldPriceUSD / 75;
          const silverPriceInCurrency = convertSilverPriceToCurrency(
            silverPriceUSD,
            exchangeRate,
          );
          setSilverPricePerGram(silverPriceInCurrency.toFixed(2));
        } else {
          setPriceError("Unable to fetch gold price. Please enter manually.");
        }
      } catch (error) {
        if (!cancelled) {
          setPriceError("Failed to fetch prices. Please enter manually.");
          console.error("Error fetching prices:", error);
        }
      } finally {
        if (!cancelled) {
          setIsLoadingPrices(false);
        }
      }
    }

    fetchPrices();

    return () => {
      cancelled = true;
    };
  }, [currency, isManualMode]);

  const formatMoney = (x: number) => {
    if (!Number.isFinite(x)) return "0.00";
    const formatted = x.toLocaleString(undefined, {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });
    return `${formatted} ${currency}`;
  };

  return (
    <div className="grid gap-8 lg:grid-cols-[1fr_380px]">
      {/* Forms */}
      <div className="space-y-6">
        {/* Nisab Threshold Section */}
        <section
          className="overflow-hidden rounded-3xl border border-white/5 bg-surface-raised/60 shadow-xl shadow-brand/5"
          aria-labelledby="nisab-heading"
        >
          <div className="border-b border-white/5 bg-surface-muted/30 px-6 py-5">
            <div className="flex items-center gap-4">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-brand/15 text-brand">
                <Calculator className="h-6 w-6" aria-hidden />
              </div>
              <div>
                <h2
                  id="nisab-heading"
                  className="text-lg font-semibold text-foreground"
                >
                  Nisab Threshold
                </h2>
                <p className="mt-0.5 text-sm text-foreground-muted">
                  Set the minimum wealth threshold using gold or silver prices
                </p>
              </div>
            </div>
          </div>

          <div className="p-6">
            <div className="mb-6">
              <label className="mb-2 block text-sm font-medium text-foreground-muted">
                Currency
              </label>
              <SearchableSelect
                id="currency-select"
                options={CURRENCIES}
                value={currency}
                onChange={(value) => setCurrency(value as CurrencyCode)}
                placeholder="Select currency"
                searchable
                searchPlaceholder="Search currency..."
              />
            </div>

            {/* Current Nisab Threshold Display */}
            {(goldNisab > 0 || silverNisab > 0) && (
              <div className="mb-6 rounded-2xl border border-brand/20 bg-gradient-to-br from-brand/10 via-brand/5 to-transparent p-5">
                <div className="mb-3 flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <div className="h-1.5 w-1.5 rounded-full bg-brand animate-pulse" />
                    <h3 className="text-sm font-semibold uppercase tracking-wider text-foreground">
                      Current Nisab Threshold (Today&apos;s Price)
                    </h3>
                  </div>
                  <a
                    href="https://goldprice.org/live-gold-price.html"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-1.5 text-xs text-brand hover:text-brand-accent hover:underline"
                  >
                    <span>View live prices</span>
                    <ExternalLink className="h-3 w-3" />
                  </a>
                </div>
                <div className="grid gap-3 sm:grid-cols-2">
                  <div
                    className={`rounded-xl border p-4 transition-all ${
                      basis === "gold"
                        ? "border-brand/50 bg-brand/10 shadow-lg shadow-brand/10"
                        : "border-foreground/10 bg-surface-muted/50"
                    }`}
                  >
                    <div className="mb-1 text-xs font-medium uppercase tracking-wider text-foreground-muted">
                      Using Gold (87.48 g)
                    </div>
                    <div className="text-2xl font-bold tabular-nums text-foreground">
                      {formatMoney(goldNisab)}
                    </div>
                    {goldNisab > 0 && (
                      <div className="mt-1 text-xs text-foreground-muted">
                        {formatMoney(parseNum(goldPricePerGram))} per gram
                      </div>
                    )}
                  </div>
                  <div
                    className={`rounded-xl border p-4 transition-all ${
                      basis === "silver"
                        ? "border-brand/50 bg-brand/10 shadow-lg shadow-brand/10"
                        : "border-foreground/10 bg-surface-muted/50"
                    }`}
                  >
                    <div className="mb-1 text-xs font-medium uppercase tracking-wider text-foreground-muted">
                      Using Silver (612.36 g)
                    </div>
                    <div className="text-2xl font-bold tabular-nums text-foreground">
                      {formatMoney(silverNisab)}
                    </div>
                    {silverNisab > 0 && (
                      <div className="mt-1 text-xs text-foreground-muted">
                        {formatMoney(parseNum(silverPricePerGram))} per gram
                      </div>
                    )}
                  </div>
                </div>
                <p className="mt-3 text-xs text-foreground-muted">
                  Select gold or silver below to use as your calculation basis.
                  The nisab threshold determines if you are liable for zakat.
                </p>
              </div>
            )}

            <div className="mb-4 flex items-center justify-between gap-4">
              <p className="text-sm text-foreground-muted">
                {isManualMode
                  ? "Enter prices manually per ounce or per gram. Visit the link above for current live prices."
                  : "Prices are automatically fetched when you select a currency. You can also enter prices manually."}
              </p>
              <button
                type="button"
                onClick={() => setIsManualMode(!isManualMode)}
                className="shrink-0 rounded-lg border border-foreground/20 bg-surface-muted/50 px-3 py-1.5 text-xs font-medium text-foreground transition-colors hover:border-brand/40 hover:bg-brand/10"
              >
                {isManualMode ? "Auto-fetch" : "Manual entry"}
              </button>
            </div>
            {!isManualMode && isLoadingPrices && (
              <div className="mb-4 flex items-center gap-2 rounded-lg bg-brand/10 px-3 py-2 text-sm text-foreground-muted">
                <Loader2 className="h-4 w-4 animate-spin text-brand" />
                <span>Fetching current prices...</span>
              </div>
            )}
            {!isManualMode && priceError && (
              <div className="mb-4 rounded-lg border border-amber-500/30 bg-amber-500/10 px-3 py-2 text-sm text-amber-600 dark:text-amber-400">
                {priceError}
              </div>
            )}
            <div className="mb-4">
              <h3 className="mb-3 text-xs font-semibold uppercase tracking-wider text-foreground-muted">
                Calculation Basis
              </h3>
              <div className="grid gap-3 sm:grid-cols-2">
                <button
                  type="button"
                  onClick={() => setBasis("gold")}
                  className={`group flex items-center gap-3 rounded-xl border p-4 text-left transition-all ${
                    basis === "gold"
                      ? "border-brand/50 bg-brand/10 shadow-md shadow-brand/5"
                      : "border-foreground/10 bg-surface-muted/50 hover:border-brand/30 hover:bg-brand/5"
                  }`}
                >
                  <div
                    className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-full border-2 transition-colors ${
                      basis === "gold"
                        ? "border-brand bg-brand"
                        : "border-foreground/30 group-hover:border-brand/50"
                    }`}
                  >
                    {basis === "gold" && (
                      <div className="h-2 w-2 rounded-full bg-background" />
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="text-sm font-semibold text-foreground">
                      Gold
                    </div>
                    <div className="text-xs text-foreground-muted">
                      87.48 grams
                    </div>
                  </div>
                </button>
                <button
                  type="button"
                  onClick={() => setBasis("silver")}
                  className={`group flex items-center gap-3 rounded-xl border p-4 text-left transition-all ${
                    basis === "silver"
                      ? "border-brand/50 bg-brand/10 shadow-md shadow-brand/5"
                      : "border-foreground/10 bg-surface-muted/50 hover:border-brand/30 hover:bg-brand/5"
                  }`}
                >
                  <div
                    className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-full border-2 transition-colors ${
                      basis === "silver"
                        ? "border-brand bg-brand"
                        : "border-foreground/30 group-hover:border-brand/50"
                    }`}
                  >
                    {basis === "silver" && (
                      <div className="h-2 w-2 rounded-full bg-background" />
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="text-sm font-semibold text-foreground">
                      Silver
                    </div>
                    <div className="text-xs text-foreground-muted">
                      612.36 grams
                    </div>
                  </div>
                </button>
              </div>
            </div>
            {isManualMode ? (
              <div className="space-y-4">
                <div className="rounded-lg border border-brand/20 bg-brand/5 p-3">
                  <p className="mb-0 text-xs text-foreground-muted">
                    Enter current gold and silver prices per gram. Visit{" "}
                    <a
                      href="https://goldprice.org/live-gold-price.html"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 text-brand hover:text-brand-accent hover:underline"
                    >
                      goldprice.org
                      <ExternalLink className="h-3 w-3" />
                    </a>{" "}
                    to view live prices. If prices are shown per ounce, divide by 31.1034768 to get per gram.
                  </p>
                </div>
                <div className="grid gap-3 sm:grid-cols-2">
                  <label className="flex flex-col gap-1.5">
                    <span className="text-sm font-medium text-foreground-muted">
                      Gold price per gram ({currency})
                    </span>
                    <div className="relative">
                      <input
                        type="number"
                        min={0}
                        step="any"
                        className={inputClasses}
                        value={goldPricePerGram}
                        onChange={(e) => setGoldPricePerGram(e.target.value)}
                        placeholder="0"
                        aria-label={`Gold price per gram in ${currency}`}
                      />
                      {goldPricePerGram && parseNum(goldPricePerGram) > 0 && (
                        <div className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-foreground-muted">
                          ✓
                        </div>
                      )}
                    </div>
                  </label>
                  <label className="flex flex-col gap-1.5">
                    <span className="text-sm font-medium text-foreground-muted">
                      Silver price per gram ({currency})
                    </span>
                    <div className="relative">
                      <input
                        type="number"
                        min={0}
                        step="any"
                        className={inputClasses}
                        value={silverPricePerGram}
                        onChange={(e) => setSilverPricePerGram(e.target.value)}
                        placeholder="0"
                        aria-label={`Silver price per gram in ${currency}`}
                      />
                      {silverPricePerGram && parseNum(silverPricePerGram) > 0 && (
                        <div className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-foreground-muted">
                          ✓
                        </div>
                      )}
                    </div>
                    <p className="text-xs text-foreground-muted">
                      Calculated using gold/silver ratio: 75:1
                    </p>
                  </label>
                </div>
              </div>
            ) : (
              <div className="grid gap-3 sm:grid-cols-2">
                <label className="flex flex-col gap-1.5">
                  <span className="text-sm font-medium text-foreground-muted">
                    Gold price per gram ({currency})
                  </span>
                  <div className="relative">
                    <input
                      type="number"
                      min={0}
                      step="any"
                      className={inputClasses}
                      value={goldPricePerGram}
                      onChange={(e) => setGoldPricePerGram(e.target.value)}
                      placeholder="0"
                      aria-label={`Gold price per gram in ${currency}`}
                      disabled={isLoadingPrices}
                    />
                    {goldPricePerGram && parseNum(goldPricePerGram) > 0 && (
                      <div className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-foreground-muted">
                        ✓
                      </div>
                    )}
                  </div>
                </label>
                <label className="flex flex-col gap-1.5">
                  <span className="text-sm font-medium text-foreground-muted">
                    Silver price per gram ({currency})
                  </span>
                  <div className="relative">
                    <input
                      type="number"
                      min={0}
                      step="any"
                      className={inputClasses}
                      value={silverPricePerGram}
                      onChange={(e) => setSilverPricePerGram(e.target.value)}
                      placeholder="0"
                      aria-label={`Silver price per gram in ${currency}`}
                      disabled={isLoadingPrices}
                    />
                    {silverPricePerGram && parseNum(silverPricePerGram) > 0 && (
                      <div className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-foreground-muted">
                        ✓
                      </div>
                    )}
                  </div>
                  <p className="text-xs text-foreground-muted">
                    Calculated using gold/silver ratio: 75:1
                  </p>
                </label>
              </div>
            )}
          </div>
        </section>

        {/* Zakatable Assets Section */}
        <section
          className="overflow-hidden rounded-3xl border border-white/5 bg-surface-raised/60 shadow-xl shadow-brand/5"
          aria-labelledby="assets-heading"
        >
          <div className="border-b border-white/5 bg-surface-muted/30 px-6 py-5">
            <div className="flex items-center gap-4">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-brand/15 text-brand">
                <HandCoins className="h-6 w-6" aria-hidden />
              </div>
              <div>
                <h2
                  id="assets-heading"
                  className="text-lg font-semibold text-foreground"
                >
                  Your Wealth & Assets
                </h2>
                <p className="mt-0.5 text-sm text-foreground-muted">
                  Enter amounts in {currency}. Leave blank for 0.
                </p>
              </div>
            </div>
          </div>

          <div className="space-y-8 p-6">
            {/* Enter Your Wealth Details Section */}
            <div className="space-y-4">
              <h3 className="text-sm font-semibold uppercase tracking-wider text-foreground">
                Enter Your Wealth Details
              </h3>
              <div className="grid gap-4 sm:grid-cols-2">
                {/* Gold Input */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between gap-2">
                    <label className="text-sm font-medium text-foreground-muted">
                      Value of gold
                    </label>
                    <div className="flex items-center gap-1 rounded-lg border border-white/10 bg-surface-muted/50 p-0.5">
                      <button
                        type="button"
                        onClick={() => setGoldInputMode("grams")}
                        className={`rounded-md px-2 py-1 text-xs font-medium transition-colors ${
                          goldInputMode === "grams"
                            ? "bg-brand text-white"
                            : "text-foreground-muted hover:text-foreground"
                        }`}
                      >
                        Grams
                      </button>
                      <button
                        type="button"
                        onClick={() => setGoldInputMode("value")}
                        className={`rounded-md px-2 py-1 text-xs font-medium transition-colors ${
                          goldInputMode === "value"
                            ? "bg-brand text-white"
                            : "text-foreground-muted hover:text-foreground"
                        }`}
                      >
                        Value
                      </button>
                    </div>
                  </div>
                  {goldInputMode === "grams" ? (
                    <div className="space-y-1.5">
                      <input
                        type="number"
                        min={0}
                        step="any"
                        className={inputClasses}
                        value={goldGrams}
                        onChange={(e) => setGoldGrams(e.target.value)}
                        placeholder="0"
                        aria-label="Gold in grams"
                      />
                      {goldGrams && parseNum(goldGrams) > 0 && goldPricePerGram && parseNum(goldPricePerGram) > 0 && (
                        <p className="text-xs text-foreground-muted">
                          ≈ {formatMoney(parseNum(goldGrams) * parseNum(goldPricePerGram))}
                        </p>
                      )}
                      {(!goldPricePerGram || parseNum(goldPricePerGram) === 0) && (
                        <p className="text-xs text-amber-500 dark:text-amber-400">
                          Enter gold price per gram above to calculate value
                        </p>
                      )}
                    </div>
                  ) : (
                    <input
                      type="number"
                      min={0}
                      step="any"
                      className={inputClasses}
                      value={inputs.goldValue || 0}
                      onChange={updateInput("goldValue")}
                      placeholder="0"
                      aria-label="Gold value"
                    />
                  )}
                </div>

                {/* Silver Input */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between gap-2">
                    <label className="text-sm font-medium text-foreground-muted">
                      Value of silver
                    </label>
                    <div className="flex items-center gap-1 rounded-lg border border-white/10 bg-surface-muted/50 p-0.5">
                      <button
                        type="button"
                        onClick={() => setSilverInputMode("grams")}
                        className={`rounded-md px-2 py-1 text-xs font-medium transition-colors ${
                          silverInputMode === "grams"
                            ? "bg-brand text-white"
                            : "text-foreground-muted hover:text-foreground"
                        }`}
                      >
                        Grams
                      </button>
                      <button
                        type="button"
                        onClick={() => setSilverInputMode("value")}
                        className={`rounded-md px-2 py-1 text-xs font-medium transition-colors ${
                          silverInputMode === "value"
                            ? "bg-brand text-white"
                            : "text-foreground-muted hover:text-foreground"
                        }`}
                      >
                        Value
                      </button>
                    </div>
                  </div>
                  {silverInputMode === "grams" ? (
                    <div className="space-y-1.5">
                      <input
                        type="number"
                        min={0}
                        step="any"
                        className={inputClasses}
                        value={silverGrams}
                        onChange={(e) => setSilverGrams(e.target.value)}
                        placeholder="0"
                        aria-label="Silver in grams"
                      />
                      {silverGrams && parseNum(silverGrams) > 0 && silverPricePerGram && parseNum(silverPricePerGram) > 0 && (
                        <p className="text-xs text-foreground-muted">
                          ≈ {formatMoney(parseNum(silverGrams) * parseNum(silverPricePerGram))}
                        </p>
                      )}
                      {(!silverPricePerGram || parseNum(silverPricePerGram) === 0) && (
                        <p className="text-xs text-amber-500 dark:text-amber-400">
                          Enter silver price per gram above to calculate value
                        </p>
                      )}
                    </div>
                  ) : (
                    <input
                      type="number"
                      min={0}
                      step="any"
                      className={inputClasses}
                      value={inputs.silverValue || 0}
                      onChange={updateInput("silverValue")}
                      placeholder="0"
                      aria-label="Silver value"
                    />
                  )}
                </div>
              </div>
            </div>

            {/* Assets Section */}
            <div className="space-y-4 rounded-2xl border border-white/10 bg-surface-muted/30 p-5">
              <h3 className="text-sm font-semibold uppercase tracking-wider text-foreground">
                Assets
              </h3>
              <div className="grid gap-3 sm:grid-cols-2">
                <label className="flex flex-col gap-1.5">
                  <span className="text-sm font-medium text-foreground-muted">
                    Cash & Bank Balance ({currency})
                  </span>
                  <input
                    type="number"
                    min={0}
                    step="any"
                    className={inputClasses}
                    value={inputs.cash || 0}
                    onChange={updateInput("cash")}
                    placeholder="0"
                    aria-label="Cash and savings"
                  />
                </label>
                <label className="flex flex-col gap-1.5">
                  <span className="text-sm font-medium text-foreground-muted">
                    Deposited for some future purpose, e.g. Hajj
                  </span>
                  <input
                    type="number"
                    min={0}
                    step="any"
                    className={inputClasses}
                    value={inputs.property || 0}
                    onChange={updateInput("property")}
                    placeholder="0"
                    aria-label="Deposited for future purpose"
                  />
                </label>
                <label className="flex flex-col gap-1.5">
                  <span className="text-sm font-medium text-foreground-muted">
                    Given out in loans
                  </span>
                  <input
                    type="number"
                    min={0}
                    step="any"
                    className={inputClasses}
                    value={inputs.receivables || 0}
                    onChange={updateInput("receivables")}
                    placeholder="0"
                    aria-label="Given out in loans"
                  />
                </label>
                <label className="flex flex-col gap-1.5">
                  <span className="text-sm font-medium text-foreground-muted">
                    Business investments, shares, saving
                  </span>
                  <input
                    type="number"
                    min={0}
                    step="any"
                    className={inputClasses}
                    value={inputs.investments || 0}
                    onChange={updateInput("investments")}
                    placeholder="0"
                    aria-label="Business investments, shares, saving"
                  />
                </label>
                <label className="flex flex-col gap-1.5">
                  <span className="text-sm font-medium text-foreground-muted">
                    Value of stock
                  </span>
                  <input
                    type="number"
                    min={0}
                    step="any"
                    className={inputClasses}
                    value={inputs.business || 0}
                    onChange={updateInput("business")}
                    placeholder="0"
                    aria-label="Value of stock"
                  />
                </label>
                <label className="flex flex-col gap-1.5">
                  <span className="text-sm font-medium text-foreground-muted">
                    Other assets
                  </span>
                  <input
                    type="number"
                    min={0}
                    step="any"
                    className={inputClasses}
                    value={inputs.other || 0}
                    onChange={updateInput("other")}
                    placeholder="0"
                    aria-label="Other zakatable assets"
                  />
                </label>
              </div>
            </div>

            {/* Debts Section - Different color scheme */}
            <div className="space-y-4 rounded-2xl border border-red-500/20 bg-red-500/5 p-5">
              <h3 className="text-sm font-semibold uppercase tracking-wider text-red-400 dark:text-red-300">
                Debts
              </h3>
              <div className="grid gap-3 sm:grid-cols-2">
                <label className="flex flex-col gap-1.5">
                  <span className="text-sm font-medium text-foreground-muted">
                    Borrowed money, goods bought on credit
                  </span>
                  <input
                    type="number"
                    min={0}
                    step="any"
                    className="rounded-2xl border border-red-500/20 bg-surface-muted/80 px-4 py-3 text-base text-foreground outline-none transition-[border-color,box-shadow] focus:border-red-500/50 focus:ring-2 focus:ring-red-500/20 w-full min-w-0"
                    value={inputs.debts || 0}
                    onChange={updateInput("debts")}
                    placeholder="0"
                    aria-label="Borrowed money, goods bought on credit"
                  />
                </label>
                <label className="flex flex-col gap-1.5">
                  <span className="text-sm font-medium text-foreground-muted">
                    Taxes, rent, utility bills due immediately
                  </span>
                  <input
                    type="number"
                    min={0}
                    step="any"
                    className="rounded-2xl border border-red-500/20 bg-surface-muted/80 px-4 py-3 text-base text-foreground outline-none transition-[border-color,box-shadow] focus:border-red-500/50 focus:ring-2 focus:ring-red-500/20 w-full min-w-0"
                    value={inputs.taxesRentBills || 0}
                    onChange={updateInput("taxesRentBills")}
                    placeholder="0"
                    aria-label="Taxes, rent, utility bills due immediately"
                  />
                </label>
                <label className="flex flex-col gap-1.5">
                  <span className="text-sm font-medium text-foreground-muted">
                    Wages due to employees
                  </span>
                  <input
                    type="number"
                    min={0}
                    step="any"
                    className="rounded-2xl border border-red-500/20 bg-surface-muted/80 px-4 py-3 text-base text-foreground outline-none transition-[border-color,box-shadow] focus:border-red-500/50 focus:ring-2 focus:ring-red-500/20 w-full min-w-0"
                    value={inputs.wagesDue || 0}
                    onChange={updateInput("wagesDue")}
                    placeholder="0"
                    aria-label="Wages due to employees"
                  />
                </label>
              </div>
            </div>
          </div>
        </section>
      </div>

      {/* Result panel */}
      <aside
        className="lg:sticky lg:top-24 lg:self-start"
        aria-labelledby="zakat-result-heading"
      >
        <Card variant="highlight" className="p-6">
          <div className="flex items-center gap-3 border-b border-foreground/10 pb-4">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-brand/15 text-brand">
              <HandCoins className="h-5 w-5" aria-hidden />
            </div>
            <h2
              id="zakat-result-heading"
              className="text-lg font-semibold text-foreground"
            >
              Your zakat
            </h2>
          </div>

          <div className="mt-4 space-y-4" id="zakat-result" role="region">
            {nisab <= 0 ? (
              <p className="text-sm text-foreground-muted">
                Enter gold or silver price per gram above to see the nisab
                threshold and whether you are liable.
              </p>
            ) : (
              <>
                <div className="grid gap-2 text-sm">
                  <div className="flex justify-between gap-2">
                    <span className="text-foreground-muted">Nisab</span>
                    <span className="tabular-nums font-medium text-foreground">
                      {formatMoney(result.nisab)}
                    </span>
                  </div>
                  <div className="flex justify-between gap-2">
                    <span className="text-foreground-muted">Total assets</span>
                    <span className="tabular-nums font-medium text-foreground">
                      {formatMoney(result.totalAssets)}
                    </span>
                  </div>
                  <div className="flex justify-between gap-2">
                    <span className="text-foreground-muted">Debts</span>
                    <span className="tabular-nums font-medium text-foreground">
                      {formatMoney(
                        (inputs.debts || 0) +
                          (inputs.taxesRentBills || 0) +
                          (inputs.wagesDue || 0),
                      )}
                    </span>
                  </div>
                  <div className="flex justify-between gap-2 border-t border-foreground/10 pt-2">
                    <span className="text-foreground-muted">Net wealth</span>
                    <span className="tabular-nums font-medium text-foreground">
                      {formatMoney(result.netWealth)}
                    </span>
                  </div>
                </div>

                <div
                  className={`rounded-xl border px-4 py-3 ${
                    result.isLiable
                      ? "border-brand/40 bg-brand/10"
                      : "border-foreground/10 bg-surface-muted/50"
                  }`}
                >
                  <p className="text-sm font-medium text-foreground">
                    {result.isLiable
                      ? "You are liable for zakat"
                      : "You are not liable for zakat"}
                  </p>
                  <p className="mt-0.5 text-xs text-foreground-muted">
                    {result.isLiable
                      ? "Net wealth meets or exceeds the nisab threshold."
                      : "Net wealth is below the nisab threshold."}
                  </p>
                </div>

                {result.isLiable && (
                  <div className="rounded-xl border-2 border-brand/50 bg-brand/10 px-4 py-4 text-center">
                    <p className="text-xs font-medium uppercase tracking-wider text-foreground-muted">
                      Zakat due (2.5%)
                    </p>
                    <p className="mt-1 text-2xl font-bold tabular-nums text-brand">
                      {formatMoney(result.zakatDue)}
                    </p>
                  </div>
                )}
              </>
            )}

            <p
              className="border-t border-foreground/10 pt-4 text-xs text-foreground-muted"
              aria-describedby="zakat-result"
            >
              This is a guide only. For specific cases (e.g. business, shares),
              consult a qualified scholar.
            </p>
            <p className="pt-2 text-xs text-foreground-muted/60">
              Exchange rates by{" "}
              <a
                href="https://www.exchangerate-api.com"
                target="_blank"
                rel="noopener noreferrer"
                className="underline-offset-2 hover:text-foreground-muted hover:underline"
              >
                Exchange Rate API
              </a>
            </p>
          </div>
        </Card>
      </aside>
    </div>
  );
}
