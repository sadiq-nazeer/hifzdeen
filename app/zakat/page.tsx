"use client";

import { Calculator, ChevronDown, Info } from "lucide-react";
import { useState } from "react";
import { Section } from "@/components/ui/Section";
import { Card } from "@/components/ui/Card";
import { ZakatCalculator } from "@/components/zakat/ZakatCalculator";

export default function ZakatPage() {
  const [guideOpen, setGuideOpen] = useState(false);

  return (
    <main className="mx-auto flex w-full max-w-6xl flex-col gap-10 px-6 pb-16 pt-4 lg:px-12">
      <Section
        title="Zakat Calculator"
        subtitle="Calculate your zakat based on nisab (gold or silver) and your zakatable wealth. This is a guide only—for specific cases, consult a qualified scholar."
      >
        <div className="space-y-6">
          {/* Guide Section */}
          <div className="overflow-hidden rounded-2xl border border-foreground/10 border-l-4 border-l-brand bg-surface-muted/50 shadow-sm">
            <button
              type="button"
              onClick={() => setGuideOpen((open) => !open)}
              className="flex w-full items-center gap-3 px-4 py-3.5 text-left transition-colors hover:bg-brand/5 focus:outline-none focus:ring-2 focus:ring-brand/30 focus:ring-inset"
              aria-expanded={guideOpen}
              aria-controls="zakat-guide-content"
              id="zakat-guide-toggle"
            >
              <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-brand/15 text-brand">
                <Info className="h-4 w-4" aria-hidden />
              </span>
              <span className="min-w-0 flex-1">
                <span className="text-sm font-semibold text-foreground">
                  Understanding Zakat Calculation ✨
                </span>
              </span>
              <ChevronDown
                className={`h-5 w-5 shrink-0 text-foreground-muted transition-transform duration-200 ${guideOpen ? "rotate-180" : ""}`}
                aria-hidden
              />
            </button>
            <div
              id="zakat-guide-content"
              role="region"
              aria-labelledby="zakat-guide-toggle"
              className="grid transition-[grid-template-rows] duration-200 ease-out"
              style={{ gridTemplateRows: guideOpen ? "1fr" : "0fr" }}
            >
              <div className="min-h-0 overflow-hidden">
                <div className="border-t border-foreground/10 px-4 pb-4 pt-3">
                  <div className="space-y-4 text-sm text-foreground-muted">
                    <div>
                      <h3 className="mb-2 font-semibold text-foreground">
                        What is Zakat?
                      </h3>
                      <p className="mb-2">
                        Zakat is one of the five pillars of Islam—a mandatory charitable contribution
                        for Muslims who meet the wealth threshold (nisab). It purifies your wealth
                        and helps those in need.
                      </p>
                    </div>

                    <div>
                      <h3 className="mb-2 font-semibold text-foreground">
                        How to Calculate Zakat:
                      </h3>
                      <ul className="list-none space-y-2.5">
                        <li className="flex gap-2">
                          <span
                            className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-brand"
                            aria-hidden
                          />
                          <span>
                            <strong className="text-foreground">Step 1: Set Nisab</strong> — Choose
                            gold or silver and enter the current price per gram. Nisab is the minimum
                            wealth threshold (87.48g gold or 612.36g silver).
                          </span>
                        </li>
                        <li className="flex gap-2">
                          <span
                            className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-brand"
                            aria-hidden
                          />
                          <span>
                            <strong className="text-foreground">Step 2: Add Your Assets</strong> —
                            Enter all zakatable wealth: cash, savings, gold/silver value, investments
                            (at market value), rental property, business assets, money owed to you,
                            and other assets.
                          </span>
                        </li>
                        <li className="flex gap-2">
                          <span
                            className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-brand"
                            aria-hidden
                          />
                          <span>
                            <strong className="text-foreground">Step 3: Subtract Debts</strong> —
                            Enter any debts due immediately. These are subtracted from your total
                            assets.
                          </span>
                        </li>
                        <li className="flex gap-2">
                          <span
                            className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-brand"
                            aria-hidden
                          />
                          <span>
                            <strong className="text-foreground">Step 4: Check Liability</strong> —
                            If your net wealth (assets minus debts) meets or exceeds nisab, you are
                            liable for zakat.
                          </span>
                        </li>
                        <li className="flex gap-2">
                          <span
                            className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-brand"
                            aria-hidden
                          />
                          <span>
                            <strong className="text-foreground">Step 5: Calculate Zakat</strong> —
                            Zakat is 2.5% (1/40) of your net wealth. The calculator shows this
                            automatically.
                          </span>
                        </li>
                      </ul>
                    </div>

                    <div>
                      <h3 className="mb-2 font-semibold text-foreground">
                        Important Notes:
                      </h3>
                      <ul className="list-none space-y-2.5">
                        <li className="flex gap-2">
                          <span
                            className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-brand"
                            aria-hidden
                          />
                          <span>
                            <strong className="text-foreground">Primary residence is excluded</strong>{" "}
                            — Your home where you live does not count toward zakatable wealth.
                          </span>
                        </li>
                        <li className="flex gap-2">
                          <span
                            className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-brand"
                            aria-hidden
                          />
                          <span>
                            <strong className="text-foreground">Rental property counts</strong> —
                            Property used to generate income (rental or investment) is included.
                          </span>
                        </li>
                        <li className="flex gap-2">
                          <span
                            className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-brand"
                            aria-hidden
                          />
                          <span>
                            <strong className="text-foreground">Shares & investments</strong> — Use
                            current market value. For long-term holdings, some scholars recommend
                            calculating based on company's liquid assets or using a 25% approach.
                          </span>
                        </li>
                        <li className="flex gap-2">
                          <span
                            className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-brand"
                            aria-hidden
                          />
                          <span>
                            <strong className="text-foreground">Consult a scholar</strong> — This
                            calculator is a guide. For complex cases (business, shares, property),
                            consult a qualified Islamic scholar.
                          </span>
                        </li>
                      </ul>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Calculator Component */}
          <ZakatCalculator />
        </div>
      </Section>
    </main>
  );
}
