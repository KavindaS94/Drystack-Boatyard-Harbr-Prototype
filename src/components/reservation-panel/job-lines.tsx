import { useState } from "react";
import type { Job, Product } from "../../types/domain";

interface JobLinesProps {
  title: string;
  lines: Job["hours"];
  products: Product[];
  catalog: Product[];
  hidePrices: boolean;
  onAdd: (productId: string, qty: number) => void;
}

export function JobLines({ title, lines, products, catalog, hidePrices, onAdd }: JobLinesProps) {
  const [productId, setProductId] = useState(catalog[0]?.id ?? "");
  const [qty, setQty] = useState("1");

  return (
    <div>
      <p className="text-xs font-medium text-neutral-500">{title}</p>
      {lines.length === 0 ? <p className="mt-1 text-sm text-neutral-500">None</p> : null}
      <ul className="mt-1 space-y-1">
        {lines.map((line) => {
          const product = products.find((item) => item.id === line.productId);
          const name = product?.name ?? line.productId;
          return (
            <li key={line.id} className="text-sm text-neutral-800">
              {hidePrices
                ? `${name} × ${line.qty}`
                : `${name} × ${line.qty} · $${product?.unitPrice ?? 0} · ${product?.bankAccount ?? ""}`}
            </li>
          );
        })}
      </ul>
      <div className="mt-2 flex gap-2">
        <select
          value={productId}
          onChange={(event) => setProductId(event.target.value)}
          className="min-w-0 flex-1 rounded-md border border-neutral-200 bg-white px-2 py-1.5 text-sm"
        >
          {catalog.map((product) => (
            <option key={product.id} value={product.id}>
              {product.name}
            </option>
          ))}
        </select>
        <input
          type="number"
          min="0.25"
          step="0.25"
          value={qty}
          onChange={(event) => setQty(event.target.value)}
          className="w-16 rounded-md border border-neutral-200 px-2 py-1.5 text-sm"
        />
        <button
          type="button"
          onClick={() => {
            const amount = Number(qty);
            if (!productId || !Number.isFinite(amount) || amount <= 0) return;
            onAdd(productId, amount);
          }}
          className="rounded-md border border-neutral-200 px-2 py-1.5 text-xs font-medium text-neutral-800"
        >
          Add
        </button>
      </div>
    </div>
  );
}
