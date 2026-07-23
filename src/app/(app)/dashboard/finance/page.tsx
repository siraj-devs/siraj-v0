import { getTransactions } from "@/app/actions/transactions";
import { FinanceTracker } from "@/components/finance-tracker";
import {
  canManageMembers,
  getMemberForSession,
} from "@/lib/members";
import { getSession } from "@/lib/session";
import { redirect } from "next/navigation";

export default async function FinancePage() {
  const session = await getSession();
  if (!session) redirect("/login");

  const current = await getMemberForSession(session);
  const canManage = canManageMembers(current?.role);
  const transactions = await getTransactions();

  return (
    <div className="py-6 md:py-10">
      <FinanceTracker
        initialTransactions={transactions}
        canManage={canManage}
      />
    </div>
  );
}
