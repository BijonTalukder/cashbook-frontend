import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { toast } from "sonner";
import { saleService, type ISale } from "../../services/sale.service";
import { useTranslation } from "../../i18n/useTranslation";
import InvoiceView, { type InvoiceDoc } from "../../components/shared/InvoiceView";

const SaleInvoicePage = () => {
  const { id } = useParams<{ id: string }>();
  const { t } = useTranslation();

  const [sale, setSale] = useState<ISale | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!id) return;
    saleService.getOne(id)
      .then(setSale)
      .catch(() => toast.error(t("invoice.loadFailed")))
      .finally(() => setLoading(false));
  }, [id, t]);

  const doc: InvoiceDoc | null = sale ? { kind: "sale", ...sale } : null;

  return <InvoiceView doc={doc} loading={loading} backTo={sale ? `/sales/${sale._id}` : "/sales"} />;
};

export default SaleInvoicePage;
