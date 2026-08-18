import { useState } from "react";
import { useMarina } from "../../store/marina-store";
import type { BankAccount, Product } from "../../types/domain";

const BANKS: BankAccount[] = ["Marina", "Holding"];

export function ProductsTab() {
  const { state, upsertProduct } = useMarina();
  const [name, setName] = useState("");
  const [unitPrice, setUnitPrice] = useState("0");
  const [bankAccount, setBankAccount] = useState<BankAccount>("Holding");

  function patchProduct(product: Product, partial: Partial<Product>) {
    upsertProduct({ ...product, ...partial });
  }

  function onAdd() {
    if (!name.trim()) return;
    upsertProduct({
      id: `prod-${crypto.randomUUID()}`,
      name: name.trim(),
      unitType: "UNIT",
      unitPrice: Number(unitPrice) || 0,
      bankAccount,
      active: true,
    });
    setName("");
    setUnitPrice("0");
    setBankAccount("Holding");
  }

  return (
    <div className="space-y-6" data-settings-tab="products">
      <div className="overflow-x-auto">
        <table className="min-w-full text-left text-sm">
          <thead>
            <tr className="border-b border-border text-xs font-medium uppercase tracking-wide text-muted-foreground">
              <th className="px-2 py-2 font-medium">Name</th>
              <th className="px-2 py-2 font-medium">Price</th>
              <th className="px-2 py-2 font-medium">Bank account</th>
            </tr>
          </thead>
          <tbody>
            {state.products.map((product) => (
              <tr key={product.id} className="border-b border-border hover:bg-muted/50" data-product-row={product.id}>
                <td className="px-2 py-2">
                  <input
                    value={product.name}
                    onChange={(event) => patchProduct(product, { name: event.target.value })}
                    className="w-full rounded-md border border-border px-2 py-1 text-sm"
                  />
                </td>
                <td className="px-2 py-2">
                  <input
                    type="number"
                    min={0}
                    step="0.01"
                    value={product.unitPrice}
                    onChange={(event) =>
                      patchProduct(product, { unitPrice: Number(event.target.value) || 0 })
                    }
                    className="w-28 rounded-md border border-border px-2 py-1 text-sm"
                  />
                </td>
                <td className="px-2 py-2">
                  <select
                    value={product.bankAccount}
                    onChange={(event) =>
                      patchProduct(product, { bankAccount: event.target.value as BankAccount })
                    }
                    className="rounded-md border border-border bg-white px-2 py-1 text-sm"
                  >
                    {BANKS.map((bank) => (
                      <option key={bank} value={bank}>
                        {bank}
                      </option>
                    ))}
                  </select>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <form
        className="grid max-w-xl gap-3 rounded-md border border-border p-3 sm:grid-cols-[1fr_6rem_8rem_auto]"
        onSubmit={(event) => {
          event.preventDefault();
          onAdd();
        }}
      >
        <label className="block space-y-1">
          <span className="text-xs font-medium text-muted-foreground">Name</span>
          <input
            value={name}
            onChange={(event) => setName(event.target.value)}
            data-product-name
            className="w-full rounded-md border border-border px-2 py-1.5 text-sm"
          />
        </label>
        <label className="block space-y-1">
          <span className="text-xs font-medium text-muted-foreground">Price</span>
          <input
            type="number"
            min={0}
            step="0.01"
            value={unitPrice}
            onChange={(event) => setUnitPrice(event.target.value)}
            className="w-full rounded-md border border-border px-2 py-1.5 text-sm"
          />
        </label>
        <label className="block space-y-1">
          <span className="text-xs font-medium text-muted-foreground">Bank</span>
          <select
            value={bankAccount}
            onChange={(event) => setBankAccount(event.target.value as BankAccount)}
            className="w-full rounded-md border border-border bg-white px-2 py-1.5 text-sm"
          >
            {BANKS.map((bank) => (
              <option key={bank} value={bank}>
                {bank}
              </option>
            ))}
          </select>
        </label>
        <div className="flex items-end">
          <button
            type="submit"
            data-product-save
            className="w-full rounded-md bg-primary px-3 py-1.5 text-sm font-medium text-white hover:bg-primary-hover"
          >
            Add
          </button>
        </div>
      </form>
    </div>
  );
}
