import { useState } from 'react';
import { Plus, Save, Trash2 } from 'lucide-react';
import { calculateItemAmount } from '../utils/calculations';

const inputClass = 'block min-w-0 w-full max-w-full rounded-2xl border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-700 shadow-sm outline-none transition focus:border-brand-500 focus:ring-2 focus:ring-brand-100';

const ItemTable = ({
  items,
  products,
  productsLoading,
  productsError,
  savingProductId,
  register,
  onAddItem,
  onRemoveItem,
  onSelectProduct,
  onSaveProduct,
}) => {
  const [openProductId, setOpenProductId] = useState('');

  return (
  <section className="rounded-[28px] border border-slate-200/80 bg-white p-5 shadow-soft sm:p-7">
    <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
      <div>
        <h2 className="text-lg font-semibold text-slate-900">Items</h2>
        <p className="text-sm text-slate-500">Tap the product field to browse saved products, or type to filter. Totals update automatically.</p>
      </div>
      <button
        type="button"
        onClick={onAddItem}
        className="inline-flex items-center gap-2 rounded-2xl bg-brand-600 px-4 py-2.5 text-sm font-semibold text-white shadow-soft transition hover:bg-brand-700"
      >
        <Plus size={16} />
        Add Item
      </button>
    </div>
    {productsError ? <p role="alert" className="mb-4 text-sm text-rose-700">{productsError} You can still enter products manually.</p> : null}

    <div className="relative min-w-0 overflow-visible">
      <table className="item-entry-table min-w-0 w-full border-separate border-spacing-y-3 xl:min-w-[1120px]">
        <thead>
          <tr className="text-left text-sm font-semibold text-slate-600">
            <th className="px-2 py-2">Product</th>
            <th className="px-2 py-2">Description</th>
            <th className="px-2 py-2">Qty</th>
            <th className="px-2 py-2">Unit</th>
            <th className="px-2 py-2">Rate</th>
            <th className="px-2 py-2">Discount %</th>
            <th className="px-2 py-2">GST %</th>
            <th className="px-2 py-2">Amount</th>
            <th className="px-2 py-2" />
          </tr>
        </thead>
        <tbody>
          {items.map((item, index) => {
            const amount = calculateItemAmount(item);
            const itemNameField = register(`items.${index}.itemName`);
            const productSearch = item.itemName?.trim().toLowerCase() || '';
            const matchingProducts = products.filter((product) =>
              [product.name, product.sku, product.hsn_code]
                .filter(Boolean)
                .some((value) => String(value).toLowerCase().includes(productSearch)),
            );
            const listId = `quotation-products-${item.id}`;
            return (
              <tr key={item.id} className="item-entry-row rounded-2xl bg-slate-50/70">
                <td data-label="Product" className="rounded-l-2xl px-2 py-3 align-top">
                  <div className="relative">
                    <input
                      className={inputClass}
                      placeholder={productsLoading ? 'Loading products...' : 'Search or enter product'}
                      autoComplete="off"
                      role="combobox"
                      aria-autocomplete="list"
                      aria-expanded={openProductId === item.id && products.length > 0}
                      aria-controls={listId}
                      {...itemNameField}
                      onFocus={() => setOpenProductId(item.id)}
                      onBlur={() => window.setTimeout(() => {
                        setOpenProductId((current) => current === item.id ? '' : current);
                      }, 150)}
                      onChange={(event) => {
                        itemNameField.onChange(event);
                        onSelectProduct(index, null);
                        setOpenProductId(item.id);
                      }}
                    />
                    {openProductId === item.id && products.length > 0 ? (
                      <div
                        id={listId}
                        role="listbox"
                        aria-label="Saved products"
                        className="absolute inset-x-0 top-full z-30 mt-1 max-h-60 overflow-y-auto rounded-xl border border-slate-200 bg-white p-1 shadow-xl"
                      >
                        {matchingProducts.length ? matchingProducts.map((product) => (
                          <button
                            key={product.id}
                            type="button"
                            role="option"
                            aria-selected={item.catalogProductId === product.id}
                            onMouseDown={(event) => event.preventDefault()}
                            onClick={() => {
                              onSelectProduct(index, product);
                              setOpenProductId('');
                            }}
                            className="flex w-full items-center justify-between gap-3 rounded-lg px-3 py-2.5 text-left transition hover:bg-slate-50 focus:bg-slate-50 focus:outline-none"
                          >
                            <span className="min-w-0">
                              <span className="block truncate text-sm font-medium text-slate-800">{product.name}</span>
                              {product.sku ? <span className="mt-0.5 block truncate text-xs text-slate-500">SKU: {product.sku}</span> : null}
                            </span>
                            <span className="shrink-0 text-xs font-semibold text-slate-600">
                              INR {Number(product.price || 0).toFixed(2)}{product.unit ? ` / ${product.unit}` : ''}
                            </span>
                          </button>
                        )) : (
                          <p className="px-3 py-3 text-sm text-slate-500">No matching products. Continue entering details manually.</p>
                        )}
                      </div>
                    ) : null}
                  </div>
                  <div className="mt-2 grid grid-cols-2 gap-2">
                    <input className={inputClass} placeholder="SKU / product code" aria-label={`SKU for item ${index + 1}`} {...register(`items.${index}.sku`)} />
                    <input className={inputClass} placeholder="HSN/SAC" aria-label={`HSN/SAC for item ${index + 1}`} {...register(`items.${index}.hsnCode`)} />
                  </div>
                  {!item.catalogProductId && item.itemName?.trim() ? (
                    <button
                      type="button"
                      onClick={() => onSaveProduct(index, item)}
                      disabled={savingProductId === item.id || Number(item.rate) <= 0}
                      className="mt-2 inline-flex items-center gap-1 text-xs font-semibold text-brand-700 hover:text-brand-900 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      <Save size={13} />
                      {savingProductId === item.id ? 'Saving product…' : 'Save to product catalog'}
                    </button>
                  ) : null}
                </td>
                <td data-label="Description" className="px-2 py-3 align-top">
                  <input className={inputClass} {...register(`items.${index}.description`)} />
                </td>
                <td data-label="Quantity" className="px-2 py-3 align-top">
                  <input type="number" min="1" className={inputClass} {...register(`items.${index}.quantity`, { valueAsNumber: true, min: 1 })} />
                </td>
                <td data-label="Unit" className="px-2 py-3 align-top">
                  <input className={inputClass} {...register(`items.${index}.unit`)} />
                </td>
                <td data-label="Rate" className="px-2 py-3 align-top">
                  <input type="number" min="0" step="0.01" className={inputClass} {...register(`items.${index}.rate`, { valueAsNumber: true, min: 0 })} />
                </td>
                <td data-label="Discount %" className="px-2 py-3 align-top">
                  <input type="number" min="0" max="100" step="0.01" className={inputClass} {...register(`items.${index}.discount`, { valueAsNumber: true, min: 0, max: 100 })} />
                </td>
                <td data-label="GST %" className="px-2 py-3 align-top">
                  <input type="number" min="0" max="100" step="0.01" className={inputClass} {...register(`items.${index}.gst`, { valueAsNumber: true, min: 0, max: 100 })} />
                </td>
                <td data-label="Amount" className="px-2 py-3 align-top">
                  <div className="rounded-2xl border border-slate-200 bg-white px-3 py-2.5 text-sm font-semibold text-slate-700">
                    ₹{amount.toFixed(2)}
                  </div>
                </td>
                <td data-label="Actions" className="rounded-r-2xl px-2 py-3 align-top">
                  <button
                    type="button"
                    onClick={() => onRemoveItem(index)}
                    aria-label={`Remove item ${index + 1}`}
                    className="rounded-2xl border border-rose-200 bg-rose-50 p-2.5 text-rose-600 transition hover:bg-rose-100"
                  >
                    <Trash2 size={16} />
                  </button>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  </section>
  );
};

export default ItemTable;
