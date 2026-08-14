import type { BankAccount, DraftInvoice, Product, Reservation } from "../types/domain";

export function draftFromJob(
  reservation: Reservation,
  products: Product[],
  includeHardstandFee: boolean
): DraftInvoice["lines"] {
  void includeHardstandFee;
  const job = reservation.job;
  if (!job) return [];
  const lines = [...job.hours, ...job.materials].map((line) => {
    const product = products.find((p) => p.id === line.productId);
    if (!product) throw new Error(`Unknown product ${line.productId}`);
    return {
      productId: product.id,
      qty: line.qty,
      unitPrice: product.unitPrice,
      bankAccount: product.bankAccount,
    };
  });
  return lines;
}

export function invoiceBankBanner(lines: DraftInvoice["lines"]): BankAccount | "Mixed" {
  const banks = new Set(lines.map((l) => l.bankAccount));
  if (banks.size === 1) return [...banks][0];
  return "Mixed";
}
