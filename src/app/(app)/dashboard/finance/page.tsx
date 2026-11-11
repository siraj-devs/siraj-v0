import { getTransactions } from "@/app/actions/transactions";
import { FinanceTracker } from "@/components/finance-tracker";
import { gateDashboardPage } from "@/lib/dashboard-gate";

export default async function FinancePage() {
  const { canEdit } = await gateDashboardPage("/dashboard/finance");
  const transactions = await getTransactions();

  return (
    <div className="py-6 md:py-10">
      <FinanceTracker
        initialTransactions={transactions}
        canManage={canEdit}
      />
    </div>
  );
}
