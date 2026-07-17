import { getTransactions } from "@/app/actions/transactions";
import { FinanceTracker } from "@/components/finance-tracker";

export default async function FinancePage() {
  const transactions = await getTransactions();

  return (
    <div className="py-6 md:py-10">
      <FinanceTracker initialTransactions={transactions} />
    </div>
  );
}
