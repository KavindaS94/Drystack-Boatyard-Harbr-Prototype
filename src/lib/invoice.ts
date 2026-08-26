import type { BankAccount, DraftInvoice, LaunchTask, Product, Reservation, TaskType } from "../types/domain";

const WET_RENT_PRODUCT_ID = "prod-wet-night";
const DOCKYARD_FEE_PRODUCT_ID = "prod-dockyard-fee";

export function nightsBetween(startDate: string, endDate: string): number {
  const [startYear, startMonth, startDay] = startDate.split("-").map(Number);
  const [endYear, endMonth, endDay] = endDate.split("-").map(Number);
  return Math.round(
    (Date.UTC(endYear, endMonth - 1, endDay) - Date.UTC(startYear, startMonth - 1, startDay)) /
      86_400_000
  );
}

function toInvoiceLine(product: Product, qty: number): DraftInvoice["lines"][number] {
  return {
    productId: product.id,
    qty,
    unitPrice: product.unitPrice,
    bankAccount: product.bankAccount,
  };
}

function isWetRent(product: Product): boolean {
  return product.id === WET_RENT_PRODUCT_ID || product.name === "Berth night";
}

function isDockyardFee(product: Product): boolean {
  return product.id === DOCKYARD_FEE_PRODUCT_ID || product.name === "Dockyard fee";
}

export function draftFromJob(
  reservation: Reservation,
  products: Product[],
  includeDockyardFee: boolean
): DraftInvoice["lines"] {
  const job = reservation.job;
  if (!job) return [];

  const lines: DraftInvoice["lines"] = [];
  for (const line of [...job.hours, ...job.materials]) {
    const product = products.find((item) => item.id === line.productId);
    if (!product) throw new Error(`Unknown product ${line.productId}`);
    if (isWetRent(product)) continue;
    lines.push(toInvoiceLine(product, line.qty));
  }

  if (includeDockyardFee) {
    const fee = products.find((item) => isDockyardFee(item));
    const alreadyHasFee = fee ? lines.some((line) => line.productId === fee.id) : false;
    if (fee && !alreadyHasFee) {
      const nights = nightsBetween(reservation.startDate, reservation.endDate);
      if (nights > 0) lines.push(toInvoiceLine(fee, nights));
    }
  }

  return lines;
}

export function draftFromLaunchTasks(
  tasks: LaunchTask[],
  taskTypes: TaskType[],
  products: Product[]
): DraftInvoice["lines"] {
  const grouped = new Map<string, { product: Product; qty: number }>();
  for (const task of tasks) {
    const taskType = taskTypes.find((item) => item.id === task.taskTypeId);
    const productId = taskType?.productId;
    if (!productId) continue;
    const product = products.find((item) => item.id === productId);
    if (!product) continue;
    const current = grouped.get(product.id);
    if (current) current.qty += 1;
    else grouped.set(product.id, { product, qty: 1 });
  }
  return [...grouped.values()].map(({ product, qty }) => toInvoiceLine(product, qty));
}

export function invoiceBankBanner(lines: DraftInvoice["lines"]): BankAccount | "Mixed" {
  const banks = new Set(lines.map((l) => l.bankAccount));
  if (banks.size === 1) return [...banks][0];
  return "Mixed";
}

export function invoiceBannerText(lines: DraftInvoice["lines"]): string {
  const banner = invoiceBankBanner(lines);
  if (banner === "Holding") return "This invoice → Holding";
  if (banner === "Marina") return "This invoice → Marina";
  return "Mixed banks — review lines";
}
