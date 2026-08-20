import { useParams } from "react-router-dom";
import { invoiceBannerText } from "../lib/invoice";
import { useMarina } from "../store/marina-store";

function formatMoney(amount: number): string {
  return `$${amount.toFixed(2)}`;
}

export function DraftInvoiceScreen() {
  const { id } = useParams<{ id: string }>();
  const { state } = useMarina();
  const cannotView = state.role === "yard";
  const invoice = cannotView ? undefined : state.invoices.find((item) => item.id === id);

  if (cannotView) {
    return (
      <div className="space-y-2 p-4 sm:p-6">
        <h1 className="text-2xl font-semibold text-neutral-900">Draft invoice</h1>
        <p className="text-sm text-neutral-700">You cannot view invoices</p>
      </div>
    );
  }

  if (!invoice) {
    return (
      <div className="space-y-2 p-4 sm:p-6">
        <h1 className="text-2xl font-semibold text-neutral-900">Draft invoice</h1>
        <p className="text-sm text-neutral-500">Invoice not found</p>
      </div>
    );
  }

  const customer = state.customers.find((item) => item.id === invoice.customerId);
  const reservation = state.reservations.find((item) => item.id === invoice.reservationId);
  const vessel = reservation
    ? state.vessels.find((item) => item.id === reservation.vesselId)
    : undefined;
  const banner = invoiceBannerText(invoice.lines);
  const isMixed = banner === "Mixed banks — review lines";
  const total = invoice.lines.reduce((sum, line) => sum + line.qty * line.unitPrice, 0);

  return (
    <div className="space-y-4 p-4 sm:p-6">
      <div>
        <h1 className="text-2xl font-semibold text-neutral-900">Draft invoice</h1>
        <p className="mt-1 text-sm text-neutral-600">
          {customer?.name ?? "Unknown customer"}
          {vessel ? ` · ${vessel.name}` : ""}
        </p>
      </div>

      <div
        className={
          isMixed
            ? "rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-sm font-medium text-amber-900"
            : "rounded-lg border border-[hsl(252,75%,80%)] bg-[hsl(252,75%,99%)] px-3 py-2 text-sm font-medium text-[hsl(252,75%,40%)]"
        }
      >
        {banner}
      </div>

      <div className="overflow-x-auto rounded-lg border border-neutral-200 bg-white">
        <table className="w-full text-left text-sm">
          <thead className="border-b border-neutral-200 bg-neutral-50 text-xs font-medium uppercase tracking-wide text-neutral-500">
            <tr>
              <th className="px-3 py-2">Product</th>
              <th className="px-3 py-2">Qty</th>
              <th className="px-3 py-2">Unit price</th>
              <th className="px-3 py-2">Line total</th>
              <th className="px-3 py-2">Bank</th>
            </tr>
          </thead>
          <tbody>
            {invoice.lines.map((line, index) => {
              const product = state.products.find((item) => item.id === line.productId);
              return (
                <tr key={`${line.productId}-${index}`} className="border-b border-neutral-100 last:border-0">
                  <td className="px-3 py-2 text-neutral-900">{product?.name ?? line.productId}</td>
                  <td className="px-3 py-2 text-neutral-800">{line.qty}</td>
                  <td className="px-3 py-2 text-neutral-800">{formatMoney(line.unitPrice)}</td>
                  <td className="px-3 py-2 text-neutral-800">{formatMoney(line.qty * line.unitPrice)}</td>
                  <td className="px-3 py-2 text-neutral-800">{line.bankAccount}</td>
                </tr>
              );
            })}
          </tbody>
          <tfoot>
            <tr className="border-t border-neutral-200 bg-neutral-50">
              <td className="px-3 py-2 text-sm font-medium text-neutral-900" colSpan={3}>
                Total
              </td>
              <td className="px-3 py-2 text-sm font-medium text-neutral-900">{formatMoney(total)}</td>
              <td />
            </tr>
          </tfoot>
        </table>
      </div>
    </div>
  );
}
