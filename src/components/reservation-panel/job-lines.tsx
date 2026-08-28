import { Plus } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import type { Job, Product } from "../../types/domain";
import { Button } from "../ui/button";

interface JobLinesProps {
  title: string;
  kind: "hours" | "materials";
  lines: Job["hours"];
  products: Product[];
  catalog: Product[];
  hidePrices: boolean;
  onAdd: (productId: string, qty: number) => void;
}

function catalogForKind(catalog: Product[], kind: "hours" | "materials"): Product[] {
  const matched = catalog.filter((product) =>
    kind === "hours" ? product.unitType === "HOUR" : product.unitType === "UNIT" || product.unitType === "LITER"
  );
  if (matched.length > 0) return matched;
  return catalog.filter((product) => product.unitType !== "DAY");
}

export function JobLines({ title, kind, lines, products, catalog, hidePrices, onAdd }: JobLinesProps) {
  const options = useMemo(() => catalogForKind(catalog, kind), [catalog, kind]);
  const [productId, setProductId] = useState(options[0]?.id ?? "");
  const [qty, setQty] = useState("1");

  useEffect(() => {
    if (!options.some((product) => product.id === productId)) {
      setProductId(options[0]?.id ?? "");
    }
  }, [options, productId]);

  return (
    <div>
      <p className="text-xs font-medium text-neutral-500">{title}</p>
      {lines.length === 0 ? <p className="mt-1 text-sm text-neutral-500">None yet</p> : null}
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
      {options.length === 0 ? (
        <p className="mt-2 text-xs text-neutral-500">No products for this job type.</p>
      ) : (
        <div className="mt-2 flex items-center gap-2">
          <select
            value={productId}
            onChange={(event) => setProductId(event.target.value)}
            aria-label={`${title} product`}
            className="h-9 min-w-0 flex-1 rounded-md border border-neutral-200 bg-white px-2 text-sm"
          >
            {options.map((product) => (
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
            aria-label={`${title} quantity`}
            className="h-9 w-17 shrink-0 rounded-md border border-neutral-200 px-2 text-sm"
          />
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="h-9 shrink-0 px-3"
            onClick={() => {
              const amount = Number(qty);
              if (!productId || !Number.isFinite(amount) || amount <= 0) return;
              onAdd(productId, amount);
            }}
          >
            <Plus className="h-3.5 w-3.5" />
            Add
          </Button>
        </div>
      )}
    </div>
  );
}
