import React, { useEffect, useState, useMemo, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import {
  Plus,
  Minus,
  Trash2,
  ArrowLeft,
  Truck,
  Package,
  CreditCard,
  FileText,
  AlertCircle,
  CheckCircle2,
  Calendar,
  RotateCcw,
  Sparkles,
  UserPlus,
  PackagePlus,
  X,
} from "lucide-react";
import { toast } from "sonner";
import { useBusinessStore } from "../../store/businessStore";
import { useTranslation } from "../../i18n/useTranslation";
import { useFormat } from "../../i18n/useFormat";
import { paymentMethodLabel } from "../../i18n/labels";
import { supplierService, type ISupplier } from "../../services/supplier.service";
import { productService, type IProduct } from "../../services/product.service";
import { purchaseService } from "../../services/purchase.service";
import { NativeInput } from "../../components/ui/Input";
import { NativeSelectDrawer, type SelectOption } from "../../components/ui/NativeSelectDrawer";
import { NativeCard } from "../../components/ui/Card";
import { Button } from "../../components/ui/Button";
import { Badge } from "../../components/ui/Badge";
import { SegmentedControl } from "../../components/ui/SegmentedControl";
import { haptic } from "../../native/bridge";
import SupplierModal from "../../components/shared/SupplierModal";
import ProductModal from "../../components/shared/ProductModal";

interface Row {
  productId: string;
  quantity: string;
  unitPrice: string;
}

const emptyRow: Row = { productId: "", quantity: "1", unitPrice: "" };

const getDraftKey = (bizId: string) => `hisabboi_purchase_draft_${bizId}`;

const NewPurchasePage = () => {
  const navigate = useNavigate();
  const { activeBusiness } = useBusinessStore();
  const { t } = useTranslation();
  const { money, num, date: fmtDate } = useFormat();

  const paymentMethods = useMemo(() => {
    return activeBusiness?.paymentMethods?.length
      ? activeBusiness.paymentMethods
      : ["cash", "bank"];
  }, [activeBusiness?.paymentMethods]);

  const todayStr = useMemo(() => new Date().toISOString().split("T")[0], []);

  // Form states
  const [suppliers, setSuppliers] = useState<ISupplier[]>([]);
  const [products, setProducts] = useState<IProduct[]>([]);
  const [supplierId, setSupplierId] = useState("");
  const [purchaseDate, setPurchaseDate] = useState(todayStr);
  const [rows, setRows] = useState<Row[]>([{ ...emptyRow }]);
  const [discount, setDiscount] = useState("0");
  const [paidAmount, setPaidAmount] = useState("");
  const [paidTouched, setPaidTouched] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState(paymentMethods[0] ?? "cash");
  const [note, setNote] = useState("");
  const [submitting, setSubmitting] = useState(false);

  // Quick modals
  const [showSupplierModal, setShowSupplierModal] = useState(false);
  const [showProductModal, setShowProductModal] = useState(false);
  const [targetRowForNewProduct, setTargetRowForNewProduct] = useState<number | null>(null);

  // Load suppliers and products
  useEffect(() => {
    if (!activeBusiness) return;
    supplierService
      .getAll(activeBusiness._id)
      .then(setSuppliers)
      .catch(() => toast.error(t("purchase.loadSuppliersFailed")));
    productService
      .getAll(activeBusiness._id)
      .then(setProducts)
      .catch(() => toast.error(t("sale.loadProductsFailed")));
  }, [activeBusiness?._id, t]);

  // Restore draft from sessionStorage if available
  useEffect(() => {
    if (!activeBusiness) return;
    try {
      const saved = sessionStorage.getItem(getDraftKey(activeBusiness._id));
      if (saved) {
        const draft = JSON.parse(saved);
        if (draft.rows && draft.rows.length > 0) setRows(draft.rows);
        if (draft.supplierId) setSupplierId(draft.supplierId);
        if (draft.discount) setDiscount(draft.discount);
        if (draft.paidAmount) setPaidAmount(draft.paidAmount);
        if (draft.paidTouched !== undefined) setPaidTouched(draft.paidTouched);
        if (draft.paymentMethod) setPaymentMethod(draft.paymentMethod);
        if (draft.note) setNote(draft.note);
        if (draft.purchaseDate) setPurchaseDate(draft.purchaseDate);
      }
    } catch {
      // Ignore parse errors
    }
  }, [activeBusiness?._id]);

  // Save draft to sessionStorage
  useEffect(() => {
    if (!activeBusiness) return;
    const hasItems = rows.some((r) => r.productId);
    const hasData = hasItems || supplierId || note || discount !== "0";

    if (hasData) {
      sessionStorage.setItem(
        getDraftKey(activeBusiness._id),
        JSON.stringify({
          supplierId,
          rows,
          discount,
          paidAmount,
          paidTouched,
          paymentMethod,
          note,
          purchaseDate,
        })
      );
    } else {
      sessionStorage.removeItem(getDraftKey(activeBusiness._id));
    }
  }, [
    activeBusiness?._id,
    supplierId,
    rows,
    discount,
    paidAmount,
    paidTouched,
    paymentMethod,
    note,
    purchaseDate,
  ]);

  const productMap = useMemo(() => new Map(products.map((p) => [p._id, p])), [products]);
  const supplierMap = useMemo(() => new Map(suppliers.map((s) => [s._id, s])), [suppliers]);
  const selectedSupplier = supplierId ? supplierMap.get(supplierId) : null;

  const updateRow = useCallback((index: number, patch: Partial<Row>) => {
    setRows((prev) => prev.map((r, i) => (i === index ? { ...r, ...patch } : r)));
  }, []);

  const handleProductSelect = useCallback((index: number, productId: string) => {
    const product = productMap.get(productId);
    updateRow(index, {
      productId,
      unitPrice: product?.purchasePrice ? String(product.purchasePrice) : "",
    });
  }, [productMap, updateRow]);

  const addRow = () => {
    haptic("light");
    setRows((prev) => [...prev, { ...emptyRow }]);
  };

  const removeRow = (index: number) => {
    haptic("warning");
    if (rows.length === 1) {
      setRows([{ ...emptyRow }]);
    } else {
      setRows((prev) => prev.filter((_, i) => i !== index));
    }
  };

  // Step quantity with haptic feedback
  const handleQuantityStep = (index: number, delta: number) => {
    haptic("light");
    const current = Math.max(1, (parseFloat(rows[index].quantity) || 1) + delta);
    updateRow(index, { quantity: String(current) });
  };

  const handleResetForm = () => {
    haptic("warning");
    if (window.confirm("Are you sure you want to clear this purchase form?")) {
      setSupplierId("");
      setRows([{ ...emptyRow }]);
      setDiscount("0");
      setPaidAmount("");
      setPaidTouched(false);
      setNote("");
      setPurchaseDate(todayStr);
      if (activeBusiness) {
        sessionStorage.removeItem(getDraftKey(activeBusiness._id));
      }
      toast.info("Form reset");
    }
  };

  // Calculations
  const lineTotals = rows.map((r) => {
    const qty = Number(r.quantity) || 0;
    const price = Number(r.unitPrice) || 0;
    return qty * price;
  });
  const subtotal = lineTotals.reduce((a, b) => a + b, 0);
  const total = Math.max(0, subtotal - (Number(discount) || 0));
  const effectivePaid = paidTouched ? Number(paidAmount) || 0 : total;
  const due = Math.max(0, total - effectivePaid);
  const validItemsCount = rows.filter((r) => r.productId && Number(r.quantity) > 0).length;

  // Preset settlement handlers
  const handlePresetPaidFull = () => {
    haptic("selection");
    setPaidTouched(true);
    setPaidAmount(String(total));
  };

  const handlePresetAllDue = () => {
    haptic("selection");
    setPaidTouched(true);
    setPaidAmount("0");
  };

  const handlePresetHalfPaid = () => {
    haptic("selection");
    setPaidTouched(true);
    setPaidAmount(String(Math.round((total / 2) * 100) / 100));
  };

  const handleSupplierCreated = (newSupplier: ISupplier) => {
    setSuppliers((prev) => [newSupplier, ...prev]);
    setSupplierId(newSupplier._id);
    setShowSupplierModal(false);
    toast.success(t("supplier.created"));
  };

  const handleProductCreated = (newProduct: IProduct) => {
    setProducts((prev) => [newProduct, ...prev]);
    setShowProductModal(false);
    toast.success(t("product.created"));

    if (targetRowForNewProduct !== null && targetRowForNewProduct < rows.length) {
      updateRow(targetRowForNewProduct, {
        productId: newProduct._id,
        unitPrice: newProduct.purchasePrice ? String(newProduct.purchasePrice) : "",
      });
    } else {
      // Add as new row if no target row
      setRows((prev) => [
        ...prev,
        {
          productId: newProduct._id,
          quantity: "1",
          unitPrice: newProduct.purchasePrice ? String(newProduct.purchasePrice) : "",
        },
      ]);
    }
    setTargetRowForNewProduct(null);
  };

  const handleSubmit = async () => {
    if (!activeBusiness) return;
    const items = rows
      .filter((r) => r.productId && Number(r.quantity) > 0)
      .map((r) => ({
        product: r.productId,
        quantity: Number(r.quantity),
        unitPrice: r.unitPrice ? Number(r.unitPrice) : undefined,
      }));

    if (items.length === 0) {
      haptic("error");
      toast.error(t("purchase.needProduct"));
      return;
    }
    if (due > 0 && !supplierId) {
      haptic("error");
      toast.error(t("purchase.needSupplierForDue"));
      return;
    }

    setSubmitting(true);
    try {
      const purchase = await purchaseService.create({
        businessId: activeBusiness._id,
        supplierId: supplierId || undefined,
        items,
        discount: Number(discount) || 0,
        paidAmount: effectivePaid,
        paymentMethod,
        date: purchaseDate ? new Date(purchaseDate).toISOString() : undefined,
        note: note || undefined,
      });

      // Clear draft on successful save
      sessionStorage.removeItem(getDraftKey(activeBusiness._id));

      haptic("success");
      toast.success(t("purchase.recorded", { reference: purchase.referenceNumber }));
      navigate("/purchases");
    } catch (err: unknown) {
      haptic("error");
      const msg =
        (err as { response?: { data?: { message?: string } } })?.response?.data?.message ??
        t("purchase.recordFailed");
      toast.error(msg);
    } finally {
      setSubmitting(false);
    }
  };

  // Select Options
  const supplierOptions: SelectOption<string>[] = useMemo(() => [
    {
      value: "",
      label: t("purchase.noSupplier"),
      description: t("purchase.supplierOptional"),
    },
    ...suppliers.map((s) => ({
      value: s._id,
      label: s.name,
      description: s.phone ? t("sale.customerOption", { name: s.name, phone: s.phone }) : undefined,
      badge: s.totalPayable > 0 ? `Payable: ${money(s.totalPayable)}` : undefined,
    })),
  ], [suppliers, t, money]);

  const productOptions: SelectOption<string>[] = useMemo(() => [
    { value: "", label: t("common.selectProduct") },
    ...products.map((p) => {
      const isLowStock = p.stock <= (p.minStock ?? 0);
      const skuText = p.sku ? `SKU: ${p.sku}` : "";
      const stockText = t("purchase.productOption", {
        name: p.name,
        stock: num(p.stock),
        unit: p.unit ?? "",
      });
      return {
        value: p._id,
        label: p.name,
        description: skuText ? `${stockText} · ${skuText}` : stockText,
        badge: isLowStock ? "Low Stock" : undefined,
      };
    }),
  ], [products, t, num]);

  // Payment method options
  const paymentSegmentOptions = useMemo(() => {
    return paymentMethods.map((m) => ({
      value: m,
      label: paymentMethodLabel(t, m),
    }));
  }, [paymentMethods, t]);

  const paymentSelectOptions: SelectOption<string>[] = useMemo(() => {
    return paymentMethods.map((m) => ({
      value: m,
      label: paymentMethodLabel(t, m),
    }));
  }, [paymentMethods, t]);

  return (
    <div className="min-h-screen pb-36 bg-[var(--bg)] text-neutral-900 dark:text-neutral-100">
      <div className="px-4 py-4 lg:px-8 lg:py-6 max-w-3xl mx-auto space-y-4">
        {/* Top App Bar */}
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => {
                haptic("light");
                navigate("/purchases");
              }}
              aria-label={t("purchase.backToPurchases")}
              className="w-11 h-11 flex items-center justify-center rounded-2xl bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 shadow-xs active:scale-95 transition-transform"
            >
              <ArrowLeft className="w-5 h-5 text-neutral-600 dark:text-neutral-300" />
            </button>
            <div>
              <h1 className="text-xl sm:text-2xl font-bold tracking-tight">
                {t("purchase.new")}
              </h1>
            </div>
          </div>

          {(rows.some((r) => r.productId) || supplierId || note) && (
            <button
              type="button"
              onClick={handleResetForm}
              className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold text-neutral-500 dark:text-neutral-400 bg-neutral-100 dark:bg-neutral-800 hover:text-red-500 dark:hover:text-red-400 active:scale-95 transition-all"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Reset</span>
            </button>
          )}
        </div>

        {/* 1. Supplier & Date Section */}
        <NativeCard variant="elevated" className="space-y-3.5 p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
                <Truck className="w-4 h-4" />
              </div>
              <span className="text-[14px] font-semibold">
                {t("purchase.supplierOptional")}
              </span>
            </div>

            <button
              type="button"
              onClick={() => {
                haptic("light");
                setShowSupplierModal(true);
              }}
              className="inline-flex items-center gap-1 text-xs font-semibold text-emerald-600 dark:text-emerald-400 hover:text-emerald-700 active:scale-95 transition-all py-1 px-2 rounded-lg bg-emerald-50 dark:bg-emerald-950/40"
            >
              <UserPlus className="w-3.5 h-3.5" />
              <span>{t("supplier.add")}</span>
            </button>
          </div>

          <NativeSelectDrawer
            sheetTitle={t("purchase.supplierOptional")}
            sheetSubtitle={t("common.searchByNameOrPhone")}
            placeholder={t("purchase.noSupplier")}
            options={supplierOptions}
            value={supplierId}
            onChange={(val) => setSupplierId(val)}
            searchable
            searchPlaceholder="Search supplier name or phone..."
          />

          {/* Supplier details chip if selected */}
          {selectedSupplier && (
            <div className="flex items-center justify-between p-2.5 rounded-xl bg-neutral-50 dark:bg-neutral-800/60 border border-neutral-200/70 dark:border-neutral-700/60 text-xs">
              <div>
                <span className="font-semibold text-neutral-800 dark:text-neutral-200">
                  {selectedSupplier.name}
                </span>
                {selectedSupplier.phone && (
                  <span className="text-neutral-500 dark:text-neutral-400 ml-2">
                    {selectedSupplier.phone}
                  </span>
                )}
              </div>
              {selectedSupplier.totalPayable > 0 && (
                <span className="font-mono text-red-600 dark:text-red-400 font-semibold">
                  Due: {money(selectedSupplier.totalPayable)}
                </span>
              )}
            </div>
          )}

          {/* Purchase Date Field */}
          <div className="pt-1">
            <NativeInput
              label={t("common.date")}
              type="date"
              value={purchaseDate}
              onChange={(e) => setPurchaseDate(e.target.value)}
              leadingIcon={<Calendar className="w-4 h-4 text-neutral-400" />}
            />
          </div>
        </NativeCard>

        {/* 2. Product Line Items */}
        <div className="space-y-3">
          <div className="flex items-center justify-between px-1">
            <div className="flex items-center gap-2">
              <h2 className="text-[15px] font-semibold flex items-center gap-2">
                <span>{t("common.products")}</span>
                <Badge variant="brand" size="sm">
                  {rows.length}
                </Badge>
              </h2>
              {subtotal > 0 && (
                <span className="text-xs font-mono font-medium text-neutral-500 dark:text-neutral-400">
                  ({money(subtotal)})
                </span>
              )}
            </div>

            <button
              type="button"
              onClick={() => {
                haptic("light");
                setTargetRowForNewProduct(rows.length);
                setShowProductModal(true);
              }}
              className="inline-flex items-center gap-1 text-xs font-semibold text-emerald-600 dark:text-emerald-400 hover:text-emerald-700 active:scale-95 transition-all py-1 px-2 rounded-lg bg-emerald-50 dark:bg-emerald-950/40"
            >
              <PackagePlus className="w-3.5 h-3.5" />
              <span>{t("product.add")}</span>
            </button>
          </div>

          {rows.map((row, i) => {
            const selectedProduct = productMap.get(row.productId);
            const lineTotal = lineTotals[i] || 0;

            return (
              <NativeCard
                key={i}
                variant="elevated"
                className="space-y-3 p-4 border-l-4 border-l-emerald-500"
              >
                {/* Header: Item # + Product Drawer + Delete */}
                <div className="flex items-center gap-2 justify-between">
                  <div className="flex items-center gap-2 flex-1 min-w-0">
                    <span className="w-6 h-6 rounded-full bg-emerald-100 dark:bg-emerald-950/70 text-emerald-700 dark:text-emerald-300 text-[11px] font-bold flex items-center justify-center shrink-0">
                      #{i + 1}
                    </span>
                    <div className="flex-1 min-w-0">
                      <NativeSelectDrawer
                        placeholder={t("common.selectProduct")}
                        sheetTitle={t("common.selectProduct")}
                        sheetSubtitle="Search by product name, SKU or barcode"
                        leadingIcon={<Package className="w-4 h-4 text-neutral-400" />}
                        options={productOptions}
                        value={row.productId}
                        onChange={(val) => handleProductSelect(i, val)}
                        searchable
                        searchPlaceholder="Type product name or SKU..."
                      />
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => removeRow(i)}
                    aria-label="Remove item"
                    className="w-11 h-11 flex items-center justify-center rounded-xl bg-red-50 hover:bg-red-100 dark:bg-red-950/40 text-red-500 active:scale-95 transition-all shrink-0 ml-1"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>

                {/* Stock info preview if product selected */}
                {selectedProduct && (
                  <div className="text-[12px] bg-neutral-50 dark:bg-neutral-800/70 py-1.5 px-3 rounded-lg flex items-center justify-between text-neutral-500 dark:text-neutral-400">
                    <span>
                      Stock:{" "}
                      <strong className="text-neutral-800 dark:text-neutral-200">
                        {num(selectedProduct.stock)} {selectedProduct.unit ?? ""}
                      </strong>
                    </span>
                    {selectedProduct.purchasePrice !== undefined && selectedProduct.purchasePrice > 0 && (
                      <span>
                        Cost:{" "}
                        <strong className="text-neutral-800 dark:text-neutral-200 font-mono">
                          {money(selectedProduct.purchasePrice)}
                        </strong>
                      </span>
                    )}
                  </div>
                )}

                {/* Card Body: Quantity Stepper + Unit Price + Line Total */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-1">
                  {/* Quantity Stepper */}
                  <div>
                    <label className="text-[12px] font-medium text-neutral-600 dark:text-neutral-400 block mb-1">
                      {t("common.qtyShort")}
                    </label>
                    <div className="flex items-center">
                      <button
                        type="button"
                        onClick={() => handleQuantityStep(i, -1)}
                        disabled={Number(row.quantity) <= 1}
                        aria-label="Decrease quantity"
                        className="w-11 h-[48px] flex items-center justify-center rounded-l-xl bg-neutral-100 dark:bg-neutral-800 text-neutral-700 dark:text-neutral-200 active:bg-neutral-200 dark:active:bg-neutral-700 disabled:opacity-40 transition-colors border-y border-l border-neutral-200 dark:border-neutral-700 shrink-0"
                      >
                        <Minus className="w-4 h-4" />
                      </button>
                      <input
                        type="text"
                        inputMode="decimal"
                        value={row.quantity}
                        onChange={(e) => updateRow(i, { quantity: e.target.value })}
                        aria-label="Quantity"
                        className="flex-1 min-w-0 h-[48px] text-center font-mono font-bold bg-white dark:bg-neutral-900 border-y border-neutral-200 dark:border-neutral-700 text-neutral-900 dark:text-neutral-100 focus:outline-none focus:ring-1 focus:ring-emerald-500 text-base"
                      />
                      <button
                        type="button"
                        onClick={() => handleQuantityStep(i, 1)}
                        aria-label="Increase quantity"
                        className="w-11 h-[48px] flex items-center justify-center rounded-r-xl bg-neutral-100 dark:bg-neutral-800 text-neutral-700 dark:text-neutral-200 active:bg-neutral-200 dark:active:bg-neutral-700 transition-colors border-y border-r border-neutral-200 dark:border-neutral-700 shrink-0"
                      >
                        <Plus className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  {/* Unit Price */}
                  <div>
                    <NativeInput
                      label={t("common.priceShort")}
                      type="text"
                      inputMode="decimal"
                      enterKeyHint="next"
                      placeholder="0.00"
                      value={row.unitPrice}
                      onChange={(e) => updateRow(i, { unitPrice: e.target.value })}
                    />
                  </div>

                  {/* Line Total */}
                  <div className="flex flex-col justify-end">
                    <span className="text-[12px] font-medium text-neutral-500 dark:text-neutral-400 mb-1">
                      {t("common.total")}
                    </span>
                    <div className="h-[48px] px-3.5 rounded-xl bg-neutral-100/90 dark:bg-neutral-800/90 border border-neutral-200/60 dark:border-neutral-700/60 flex items-center justify-end font-mono font-bold text-neutral-900 dark:text-neutral-100 text-sm">
                      {money(lineTotal)}
                    </div>
                  </div>
                </div>
              </NativeCard>
            );
          })}

          {/* Add Another Product Button */}
          <Button
            type="button"
            variant="outline"
            size="md"
            block
            onClick={addRow}
            className="h-[48px] gap-2 border-dashed border-2 border-emerald-500/40 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-50/50 dark:hover:bg-emerald-950/20 active:scale-[0.985]"
          >
            <Plus size={18} /> {t("common.addProduct")}
          </Button>
        </div>

        {/* 3. Payment Details & Settlement Presets */}
        <NativeCard variant="elevated" className="space-y-4 p-4">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
              <CreditCard className="w-4 h-4" />
            </div>
            <h3 className="text-[15px] font-semibold text-neutral-900 dark:text-neutral-100">
              {t("paymentMethod.label")} & Settlement
            </h3>
          </div>

          {/* Payment Method Selector */}
          <div>
            <label className="text-[13px] font-medium text-neutral-700 dark:text-neutral-300 block mb-1.5">
              {t("paymentMethod.label")}
            </label>
            {paymentMethods.length <= 4 ? (
              <SegmentedControl
                options={paymentSegmentOptions}
                value={paymentMethod}
                onChange={(val) => setPaymentMethod(val)}
              />
            ) : (
              <NativeSelectDrawer
                sheetTitle={t("paymentMethod.label")}
                options={paymentSelectOptions}
                value={paymentMethod}
                onChange={(val) => setPaymentMethod(val)}
              />
            )}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <NativeInput
              label={t("common.discount")}
              type="text"
              inputMode="decimal"
              value={discount}
              onChange={(e) => setDiscount(e.target.value)}
              placeholder="0.00"
            />

            {/* Quick Settlement Preset Buttons */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-[13px] font-medium text-neutral-700 dark:text-neutral-300">
                  Quick Presets
                </span>
              </div>
              <div className="grid grid-cols-3 gap-1.5 h-[48px] items-center">
                <button
                  type="button"
                  onClick={handlePresetPaidFull}
                  className="h-[44px] rounded-xl text-xs font-semibold bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800 active:scale-95 transition-transform flex items-center justify-center text-center px-1"
                >
                  ⚡ Full Paid
                </button>
                <button
                  type="button"
                  onClick={handlePresetAllDue}
                  className="h-[44px] rounded-xl text-xs font-semibold bg-red-50 text-red-700 dark:bg-red-950/60 dark:text-red-300 border border-red-300 dark:border-red-800 active:scale-95 transition-transform flex items-center justify-center text-center px-1"
                >
                  📝 Full Due
                </button>
                <button
                  type="button"
                  onClick={handlePresetHalfPaid}
                  className="h-[44px] rounded-xl text-xs font-semibold bg-neutral-100 text-neutral-700 dark:bg-neutral-800 dark:text-neutral-200 border border-neutral-300 dark:border-neutral-700 active:scale-95 transition-transform flex items-center justify-center text-center px-1"
                >
                  50%
                </button>
              </div>
            </div>
          </div>

          {/* Paid Amount */}
          <NativeInput
            label={t("common.paidAmount")}
            type="text"
            inputMode="decimal"
            placeholder={total.toFixed(2)}
            value={paidTouched ? paidAmount : total.toFixed(2)}
            onChange={(e) => {
              setPaidTouched(true);
              setPaidAmount(e.target.value);
            }}
            helperText={
              due > 0
                ? `${t("purchase.payable")}: ${money(due)}`
                : "Full payment received"
            }
          />

          {/* Alert if due > 0 and no supplier selected */}
          {due > 0 && !supplierId && (
            <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-700 dark:text-amber-400 text-xs flex items-start gap-2.5">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <div className="flex-1">
                <span className="font-semibold block">Supplier required for due purchase</span>
                <span>Please select or add a supplier above to track this payable balance.</span>
              </div>
            </div>
          )}

          {/* Optional Note */}
          <div className="flex flex-col gap-1.5 pt-1">
            <label className="text-[13px] font-medium text-neutral-700 dark:text-neutral-300 flex items-center gap-1.5">
              <FileText className="w-3.5 h-3.5 text-neutral-400" />
              <span>{t("common.noteOptional")}</span>
            </label>
            <textarea
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder={t("common.noteOptional")}
              rows={2}
              className="w-full rounded-xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 px-3.5 py-2.5 text-[16px] text-neutral-900 dark:text-neutral-100 placeholder:text-neutral-400 focus:outline-none focus:ring-3 focus:ring-emerald-500/15 focus:border-emerald-500 transition-all"
            />
          </div>
        </NativeCard>

        {/* 4. Financial Bill Summary Card */}
        <NativeCard variant="elevated" className="space-y-2.5 bg-neutral-50/80 dark:bg-neutral-900/80 p-4">
          <div className="flex justify-between items-center text-xs text-neutral-500 dark:text-neutral-400">
            <span>{t("common.subtotal")}</span>
            <span className="font-mono text-neutral-800 dark:text-neutral-200">
              {money(subtotal)}
            </span>
          </div>

          {Number(discount) > 0 && (
            <div className="flex justify-between items-center text-xs text-neutral-500 dark:text-neutral-400">
              <span>{t("common.discount")}</span>
              <span className="font-mono text-emerald-600 dark:text-emerald-400">
                - {money(Number(discount) || 0)}
              </span>
            </div>
          )}

          <div className="flex justify-between items-baseline pt-2 border-t border-neutral-200 dark:border-neutral-800">
            <span className="text-[15px] font-semibold text-neutral-900 dark:text-neutral-100">
              {t("common.total")}
            </span>
            <span className="text-xl font-bold font-mono tracking-tight text-neutral-900 dark:text-neutral-100">
              {money(total)}
            </span>
          </div>

          <div className="flex justify-between items-center text-xs">
            <span className="text-neutral-500 dark:text-neutral-400">{t("common.paid")}</span>
            <span className="font-mono font-medium text-emerald-600 dark:text-emerald-400">
              {money(effectivePaid)}
            </span>
          </div>

          {due > 0 ? (
            <div className="flex justify-between items-center p-2.5 rounded-xl bg-red-500/10 border border-red-500/20 text-red-600 dark:text-red-400 text-xs font-semibold">
              <span className="flex items-center gap-1.5">
                <AlertCircle className="w-3.5 h-3.5" />
                {t("purchase.payable")} (Due)
              </span>
              <span className="font-mono text-sm">{money(due)}</span>
            </div>
          ) : (
            <div className="flex items-center gap-1.5 text-xs text-emerald-600 dark:text-emerald-400 font-medium px-1">
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>Paid in full</span>
            </div>
          )}
        </NativeCard>
      </div>

      {/* 5. Sticky Bottom Action Dock (Native Mobile Bar) */}
      <div className="fixed bottom-0 left-0 right-0 z-40 bg-white/95 dark:bg-neutral-900/95 backdrop-blur-md border-t border-neutral-200 dark:border-neutral-800 px-4 py-3 pb-[calc(0.75rem+env(safe-area-inset-bottom))] shadow-lg">
        <div className="max-w-3xl mx-auto flex items-center justify-between gap-3">
          <div className="min-w-0">
            <div className="text-xs text-neutral-500 dark:text-neutral-400 font-medium truncate">
              {validItemsCount} {t("common.products")} •{" "}
              {due > 0 ? (
                <span className="text-red-600 dark:text-red-400 font-semibold font-mono">
                  Due: {money(due)}
                </span>
              ) : (
                <span className="text-emerald-600 dark:text-emerald-400 font-semibold">
                  Paid
                </span>
              )}
            </div>
            <div className="text-lg sm:text-xl font-bold font-mono text-neutral-900 dark:text-neutral-100 tracking-tight">
              {money(total)}
            </div>
          </div>

          <Button
            variant="primary"
            size="lg"
            loading={submitting}
            disabled={validItemsCount === 0}
            onClick={handleSubmit}
            className="h-[50px] px-6 text-base font-semibold shadow-md shadow-emerald-500/20 active:scale-95 shrink-0"
          >
            {t("purchase.record")}
          </Button>
        </div>
      </div>

      {/* Quick Supplier Modal */}
      {showSupplierModal && (
        <SupplierModal
          open={showSupplierModal}
          onClose={() => setShowSupplierModal(false)}
          onSuccess={handleSupplierCreated}
        />
      )}

      {/* Quick Product Modal */}
      {showProductModal && (
        <ProductModal
          open={showProductModal}
          onClose={() => {
            setShowProductModal(false);
            setTargetRowForNewProduct(null);
          }}
          onSuccess={handleProductCreated}
        />
      )}
    </div>
  );
};

export default NewPurchasePage;
