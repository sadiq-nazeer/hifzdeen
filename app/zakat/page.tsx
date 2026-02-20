import { Section } from "@/components/ui/Section";
import { ZakatCalculator } from "@/components/zakat/ZakatCalculator";

export default function ZakatPage() {
  return (
    <main className="mx-auto flex w-full max-w-6xl flex-col gap-10 px-6 pb-16 pt-6 lg:px-12">
      <Section
        title="Zakat Calculator"
        subtitle="Calculate your zakat based on nisab (gold or silver) and your zakatable wealth. This is a guide only—for specific cases, consult a qualified scholar."
      >
        <ZakatCalculator />
      </Section>
    </main>
  );
}
