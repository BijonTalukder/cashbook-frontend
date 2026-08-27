import { useEffect, useRef, useState } from "react";
import { Building2, Home, User, Store, Check, ChevronDown, Plus } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { useBusinessStore } from "../../store/businessStore";
import {
  businessService,
  type IBusinessMembership,
  type IBusiness,
  type BusinessType,
} from "../../services/business.service";
import { useTranslation } from "../../i18n/useTranslation";
import { enumLabel } from "../../i18n/labels";
import { useMediaQuery } from "../../native/hooks";
import { haptic } from "../../native/bridge";
import Sheet from "../ui/Sheet";

const TYPE_ICON: Record<BusinessType, typeof Building2> = {
  personal: User,
  company: Building2,
  mass: Home,
  business: Store,
};

const TYPE_COLOR: Record<BusinessType, string> = {
  personal: "#10b981",
  company: "#3b82f6",
  mass: "#8b5cf6",
  business: "#f59e0b",
};

interface BusinessSwitcherProps {
  onSelect?: (b: IBusiness) => void;
  /**
   * `chip` is the bordered control used in the desktop sidebar.
   * `appbar` renders the active business as the app-bar *title* — borderless,
   * left-aligned, with a chevron — which is how a native Android app presents
   * a switchable scope, and it opens a bottom sheet rather than a dropdown.
   */
  variant?: "chip" | "appbar";
}

const BusinessSwitcher = ({ onSelect, variant = "chip" }: BusinessSwitcherProps) => {
  const navigate = useNavigate();
  const { activeBusiness, setActiveBusiness } = useBusinessStore();
  const { t } = useTranslation();
  const isDesktop = useMediaQuery("(min-width: 1024px)");

  const [open, setOpen] = useState(false);
  const [memberships, setMemberships] = useState<IBusinessMembership[]>([]);
  const [loading, setLoading] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  // A floating dropdown needs outside-click dismissal; the sheet handles its own.
  const asSheet = variant === "appbar" || !isDesktop;

  useEffect(() => {
    if (asSheet) return;
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [asSheet]);

  useEffect(() => {
    if (!open || memberships.length > 0) return;
    setLoading(true);
    businessService
      .getMyBusinesses()
      .then(setMemberships)
      .catch(() => toast.error(t("business.loadFailed")))
      .finally(() => setLoading(false));
  }, [open, memberships.length, t]);

  const handleSelect = (b: IBusiness) => {
    haptic("selection");
    setActiveBusiness(b);
    setOpen(false);
    onSelect?.(b);
    toast.success(t("business.switched", { name: b.name }));
  };

  const accent = activeBusiness ? TYPE_COLOR[activeBusiness.type] : "#10b981";
  const Icon = activeBusiness ? TYPE_ICON[activeBusiness.type] : Building2;

  /* ── The list, shared by the sheet and the dropdown ───── */
  const list = (
    <>
      {loading ? (
        <div className="py-2">
          {[0, 1, 2].map((i) => (
            <div key={i} className="flex items-center gap-3 px-4 py-2.5">
              <div className="skeleton w-9 h-9 rounded-xl flex-shrink-0" />
              <div className="flex-1 space-y-2">
                <div className="skeleton h-3.5 rounded-md" style={{ width: "55%" }} />
                <div className="skeleton h-2.5 rounded-md" style={{ width: "32%" }} />
              </div>
            </div>
          ))}
        </div>
      ) : memberships.length === 0 ? (
        <p className="text-center text-xs py-6" style={{ color: "var(--text-faint)" }}>
          {t("business.none")}
        </p>
      ) : (
        memberships.map(({ business, role }) => {
          const isActive = activeBusiness?._id === business._id;
          const BIcon = TYPE_ICON[business.type];
          const color = TYPE_COLOR[business.type];
          return (
            <button
              key={business._id}
              onClick={() => handleSelect(business)}
              className="row-press w-full flex items-center gap-3 px-4 py-3 text-left"
              style={{ background: isActive ? `${color}0d` : "transparent" }}
            >
              <div
                className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0"
                style={{ background: `${color}18`, color }}
              >
                <BIcon size={15} />
              </div>
              <div className="flex-1 min-w-0">
                <p
                  className="text-sm truncate"
                  style={{
                    color: isActive ? "var(--text-primary)" : "var(--text-secondary)",
                    fontWeight: isActive ? 600 : 400,
                  }}
                >
                  {business.name}
                </p>
                <p className="text-[11px] truncate" style={{ color: "var(--text-faint)" }}>
                  {t("business.typeAndRole", {
                    type: enumLabel(t, "businessType", business.type),
                    role: enumLabel(t, "role", role),
                  })}
                </p>
              </div>
              {isActive && <Check size={15} style={{ color, flexShrink: 0 }} />}
            </button>
          );
        })
      )}
    </>
  );

  const addButton = (
    <button
      onClick={() => {
        setOpen(false);
        navigate("/business/new");
      }}
      className="row-press w-full flex items-center gap-2.5 px-4 py-3.5"
      style={{ color: "#10b981" }}
    >
      <Plus size={16} />
      <span className="text-sm font-medium">{t("business.new")}</span>
    </button>
  );

  /* ── App-bar title trigger ───────────────────────────── */
  if (variant === "appbar") {
    return (
      <>
        <button
          onClick={() => { haptic("light"); setOpen(true); }}
          className="flex items-center gap-1.5 min-w-0 max-w-full h-10 px-1.5 -ml-1.5 rounded-xl press"
          aria-haspopup="dialog"
          aria-expanded={open}
        >
          <div
            className="w-6 h-6 rounded-lg flex items-center justify-center flex-shrink-0"
            style={{ background: `${accent}20`, color: accent }}
          >
            <Icon size={13} />
          </div>
          <span
            className="text-[17px] font-semibold truncate"
            style={{ color: "var(--text-primary)", letterSpacing: "-0.01em" }}
          >
            {activeBusiness?.name ?? t("business.switcherPlaceholder")}
          </span>
          <ChevronDown size={16} className="flex-shrink-0" style={{ color: "var(--text-muted)" }} />
        </button>

        <Sheet
          open={open}
          onClose={() => setOpen(false)}
          title={t("business.switchBusiness")}
          size="sm"
          bare
          footer={<div className="-mx-5 -mb-1">{addButton}</div>}
        >
          <div className="py-1">{list}</div>
        </Sheet>
      </>
    );
  }

  /* ── Sidebar chip trigger ────────────────────────────── */
  return (
    <div ref={ref} style={{ position: "relative" }}>
      <button
        onClick={() => setOpen((p) => !p)}
        className="w-full flex items-center gap-2 px-2.5 h-10 rounded-xl press"
        style={{
          background: open ? "var(--surface-4)" : "var(--surface-1)",
          border: `1px solid ${open ? "var(--border-strong)" : "var(--border)"}`,
        }}
      >
        <div
          className="w-5 h-5 rounded-md flex items-center justify-center flex-shrink-0"
          style={{ background: `${accent}20`, color: accent }}
        >
          <Icon size={11} />
        </div>
        <span
          className="text-sm font-medium truncate block flex-1 text-left"
          style={{ color: "var(--text-primary)" }}
        >
          {activeBusiness?.name ?? t("business.switcherPlaceholder")}
        </span>
        <ChevronDown
          size={13}
          style={{
            color: "var(--text-muted)",
            transform: open ? "rotate(180deg)" : "rotate(0)",
            transition: "transform 0.2s",
          }}
        />
      </button>

      {open && !asSheet && (
        <div
          className="absolute left-0 top-full mt-2 w-64 rounded-2xl overflow-hidden z-[100]"
          style={{
            background: "var(--bg-elevated)",
            border: "1px solid var(--border-strong)",
            boxShadow: "var(--shadow-elevated)",
          }}
        >
          <div className="px-4 py-3" style={{ borderBottom: "1px solid var(--border-light)" }}>
            <p className="text-xs uppercase tracking-wider" style={{ color: "var(--text-faint)" }}>
              {t("business.switchBusiness")}
            </p>
          </div>
          <div className="py-1.5 max-h-64 overflow-y-auto">{list}</div>
          <div style={{ borderTop: "1px solid var(--border-light)" }}>{addButton}</div>
        </div>
      )}

      {open && asSheet && (
        <Sheet
          open={open}
          onClose={() => setOpen(false)}
          title={t("business.switchBusiness")}
          size="sm"
          bare
          footer={<div className="-mx-5 -mb-1">{addButton}</div>}
        >
          <div className="py-1">{list}</div>
        </Sheet>
      )}
    </div>
  );
};

export default BusinessSwitcher;
