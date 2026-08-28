import type { MarinaState } from "../types/domain";

export function actionCounts(state: MarinaState) {
  const pendingChanges = state.changeRequests.filter((item) => item.status === "pending").length;
  const pendingApprovals = state.reservations.filter((item) => item.status === "to_be_approved").length;
  const outstandingInvoices = state.customers.filter((item) => item.accountOverdue).length;
  const draftInvoices = state.invoices.length;
  return {
    pendingChanges,
    pendingApprovals,
    outstandingInvoices,
    draftInvoices,
    total: pendingChanges + pendingApprovals + outstandingInvoices + draftInvoices,
  };
}
