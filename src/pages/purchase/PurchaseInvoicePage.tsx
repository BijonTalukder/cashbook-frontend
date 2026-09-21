import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { toast } from "sonner";
import { purchaseService, type IPurchase } from "../../services/purchase.service";
import { useTranslation } from "../../i18n/useTranslation";
import InvoiceView, { type InvoiceDoc } from "../../components/shared/InvoiceView";

const PurchaseInvoicePage = () => {
  const { id } = useParams<{ id: string }>();
  const { t } = useTranslation();

  const [purchase, setPurchase] = useState<IPurchase | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!id) return;
    purchaseService.getOne(id)
      .then(setPurchase)
      .catch(() => toast.error(t("invoice.loadFailed")))
      .finally(() => setLoading(false));
  }, [id, t]);

  const doc: InvoiceDoc | null = purchase ? { kind: "purchase", ...purchase } : null;

  return <InvoiceView doc={doc} loading={loading} backTo={purchase ? `/purchases/${purchase._id}` : "/purchases"} />;
};

export default PurchaseInvoicePage;
