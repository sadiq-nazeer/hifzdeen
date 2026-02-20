"use client";

import { Calculator, HandCoins } from "lucide-react";
import { useMemo, useState, type ChangeEvent } from "react";
import { Card } from "@/components/ui/Card";
import {
  calculateZakat,
  getNisabInCurrency,
  type NisabBasis,
  type ZakatInputs,
} from "@/lib/zakat";

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
};

function parseNum(value: string): number {
  const n = Number(value);
  return Number.isFinite(n) && n >= 0 ? n : 0;
}

export function ZakatCalculator() {
  const [basis, setBasis] = useState<NisabBasis>("silver");
  const [goldPricePerGram, setGoldPricePerGram] = useState<string>("");
  const [silverPricePerGram, setSilverPricePerGram] = useState<string>("");
  const [inputs, setInputs] = useState<ZakatInputs>(defaultInputs);

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

  const nisab = useMemo(() => {
    const price =
      basis === "gold"
        ? parseNum(goldPricePerGram)
        : parseNum(silverPricePerGram);
    return getNisabInCurrency(price, basis);
  }, [basis, goldPricePerGram, silverPricePerGram]);

  const result = useMemo(
    () => calculateZakat(inputs, nisab),
    [inputs, nisab],
  );

  const formatMoney = (x: number) =>
    Number.isFinite(x) ? x.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : "0.00";

  return (
    <div className="grid gap-8 lg:grid-cols-[1fr_380px]">
      {/* Form */}
      <section
        className="overflow-hidden rounded-3xl border border-white/5 bg-surface-raised/60 shadow-xl shadow-brand/5"
        aria-labelledby="zakat-form-heading"
      >
        <div className="border-b border-white/5 bg-surface-muted/30 px-6 py-5">
          <div className="flex items-center gap-4">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-brand/15 text-brand">
              <Calculator className="h-6 w-6" aria-hidden />
            </div>
            <div>
              <h2
                id="zakat-form-heading"
                className="text-lg font-semibold text-foreground"
              >
                Your wealth & nisab
              </h2>
              <p className="mt-0.5 text-sm text-foreground-muted">
                Enter amounts in your local currency. Leave blank for 0.
              </p>
            </div>
          </div>
        </div>

        <div className="space-y-6 p-6">
          {/* Nisab */}
          <div>
            <h3 className="mb-3 text-xs font-semibold uppercase tracking-wider text-foreground-muted">
              Nisab threshold
            </h3>
            <p className="mb-3 text-sm text-foreground-muted">
              Choose gold or silver and enter current price per gram to set the
              minimum wealth threshold.
            </p>
            <div className="flex flex-wrap gap-4">
              <label className="flex cursor-pointer items-center gap-2">
                <input
                  type="radio"
                  name="nisab-basis"
                  checked={basis === "silver"}
                  onChange={() => setBasis("silver")}
                  className="h-4 w-4 border-white/20 text-brand focus:ring-brand/30"
                />
                <span className="text-sm font-medium text-foreground">
                  Silver (612.36 g)
                </span>
              </label>
              <label className="flex cursor-pointer items-center gap-2">
                <input
                  type="radio"
                  name="nisab-basis"
                  checked={basis === "gold"}
                  onChange={() => setBasis("gold")}
                  className="h-4 w-4 border-white/20 text-brand focus:ring-brand/30"
                />
                <span className="text-sm font-medium text-foreground">
                  Gold (87.48 g)
                </span>
              </label>
            </div>
            <div className="mt-3 grid gap-3 sm:grid-cols-2">
              <label className="flex flex-col gap-1.5">
                <span className="text-sm font-medium text-foreground-muted">
                  Gold price per gram
                </span>
                <input
                  type="number"
                  min={0}
                  step="any"
                  className={inputClasses}
                  value={goldPricePerGram}
                  onChange={(e) => setGoldPricePerGram(e.target.value)}
                  placeholder="0"
                  aria-label="Gold price per gram in your currency"
                />
              </label>
              <label className="flex flex-col gap-1.5">
                <span className="text-sm font-medium text-foreground-muted">
                  Silver price per gram
                </span>
                <input
                  type="number"
                  min={0}
                  step="any"
                  className={inputClasses}
                  value={silverPricePerGram}
                  onChange={(e) => setSilverPricePerGram(e.target.value)}
                  placeholder="0"
                  aria-label="Silver price per gram in your currency"
                />
              </label>
            </div>
          </div>

          {/* Assets */}
          <div>
            <h3 className="mb-3 text-xs font-semibold uppercase tracking-wider text-foreground-muted">
              Zakatable assets
            </h3>
            <div className="grid gap-3 sm:grid-cols-2">
              <label className="flex flex-col gap-1.5">
                <span className="text-sm font-medium text-foreground-muted">
                  Cash & savings
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
                  Gold (value)
                </span>
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
              </label>
              <label className="flex flex-col gap-1.5">
                <span className="text-sm font-medium text-foreground-muted">
                  Silver (value)
                </span>
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
              </label>
              <label className="flex flex-col gap-1.5">
                <span className="text-sm font-medium text-foreground-muted">
                  Shares & investments
                </span>
                <input
                  type="number"
                  min={0}
                  step="any"
                  className={inputClasses}
                  value={inputs.investments || 0}
                  onChange={updateInput("investments")}
                  placeholder="0"
                  aria-label="Shares and investments at market value"
                />
              </label>
              <label className="flex flex-col gap-1.5">
                <span className="text-sm font-medium text-foreground-muted">
                  Rental / investment property
                </span>
                <input
                  type="number"
                  min={0}
                  step="any"
                  className={inputClasses}
                  value={inputs.property || 0}
                  onChange={updateInput("property")}
                  placeholder="0"
                  aria-label="Rental or investment property value"
                />
              </label>
              <label className="flex flex-col gap-1.5">
                <span className="text-sm font-medium text-foreground-muted">
                  Business assets
                </span>
                <input
                  type="number"
                  min={0}
                  step="any"
                  className={inputClasses}
                  value={inputs.business || 0}
                  onChange={updateInput("business")}
                  placeholder="0"
                  aria-label="Business stock and assets"
                />
              </label>
              <label className="flex flex-col gap-1.5">
                <span className="text-sm font-medium text-foreground-muted">
                  Money owed to you
                </span>
                <input
                  type="number"
                  min={0}
                  step="any"
                  className={inputClasses}
                  value={inputs.receivables || 0}
                  onChange={updateInput("receivables")}
                  placeholder="0"
                  aria-label="Receivables"
                />
              </label>
              <label className="flex flex-col gap-1.5">
                <span className="text-sm font-medium text-foreground-muted">
                  Other
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

          {/* Liabilities */}
          <div>
            <h3 className="mb-3 text-xs font-semibold uppercase tracking-wider text-foreground-muted">
              Liabilities
            </h3>
            <label className="flex flex-col gap-1.5">
              <span className="text-sm font-medium text-foreground-muted">
                Debts due immediately
              </span>
              <input
                type="number"
                min={0}
                step="any"
                className={inputClasses}
                value={inputs.debts || 0}
                onChange={updateInput("debts")}
                placeholder="0"
                aria-label="Debts due immediately"
              />
            </label>
          </div>
        </div>
      </section>

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
                      {formatMoney(inputs.debts)}
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
          </div>
        </Card>
      </aside>
    </div>
  );
}
