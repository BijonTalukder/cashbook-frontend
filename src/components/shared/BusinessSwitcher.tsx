import { useEffect, useRef, useState } from "react";
import { Building2, Home, User, Check, ChevronDown, Plus } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { useAuthStore } from "../../store/authStore";
import { useBusinessStore } from "../../store/businessStore";
import {
  businessService,
  type IBusinessMembership,
  type IBusiness,
  type BusinessType,
} from "../../services/business.service";

const TYPE_ICON: Record<BusinessType, any> = {
  personal: User,
  company: Building2,
  mass: Home,
};

const TYPE_COLOR: Record<BusinessType, string> = {
  personal: "#10b981",
  company: "#3b82f6",
  mass: "#8b5cf6",
};

const C = {
  bg: "var(--bg)",
  card: "var(--surface-1)",
  border: "var(--border)",
};

interface BusinessSwitcherProps {
  onSelect?: (b: IBusiness) => void;
}

const BusinessSwitcher = ({ onSelect }: BusinessSwitcherProps) => {
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const { activeBusiness, setActiveBusiness } = useBusinessStore();

  const [open, setOpen] = useState(false);
  const [memberships, setMemberships] = useState<IBusinessMembership[]>([]);
  const [loading, setLoading] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  // Close on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node))
        setOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  // Load businesses on open
  useEffect(() => {
    if (!open || memberships.length > 0) return;
    setLoading(true);
    businessService
      .getMyBusinesses()
      .then(setMemberships)
      .catch(() => toast.error("Failed to load businesses"))
      .finally(() => setLoading(false));
  }, [open]);

  const handleSelect = (b: IBusiness) => {
    setActiveBusiness(b);
    setOpen(false);
    onSelect?.(b);
    toast.success(`Switched to ${b.name}`);
  };

  const accent = activeBusiness ? TYPE_COLOR[activeBusiness.type] : "#10b981";
  const Icon = activeBusiness ? TYPE_ICON[activeBusiness.type] : Building2;

  return (
    <div ref={ref} style={{ position: "relative" }}>
      {/* Trigger */}
      <button
        onClick={() => setOpen((p) => !p)}
        className="flex items-center gap-2 px-2.5 py-1.5 rounded-xl transition-all active:scale-95"
        style={{
          background: open
            ? "var(--surface-4)"
            : "var(--surface-1)",
          border: `1px solid ${open ? "var(--border-strong)" : C.border}`,
        }}
      >
        <div
          className="w-5 h-5 rounded-md flex items-center justify-center flex-shrink-0"
          style={{ background: `${accent}20`, color: accent }}
        >
          <Icon size={11} />
        </div>
        <span
          className="text-sm font-medium max-w-[110px] sm:max-w-[150px] truncate block"
          style={{ color: "var(--text-primary)" }}
        >
          {activeBusiness?.name ?? "Select business"}
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

      {/* Dropdown */}
      {open && (
        <div
          className="absolute left-0 top-full mt-2 w-64 rounded-2xl overflow-hidden z-[100]"
          style={{
            background: "var(--bg-elevated)",
            border: `1px solid var(--border-strong)`,
            boxShadow: "var(--shadow-elevated)",
          }}
        >
          {/* Header */}
          <div
            className="px-4 py-3"
            style={{ borderBottom: `1px solid var(--border-light)` }}
          >
            <p
              className="text-xs uppercase tracking-wider"
              style={{ color: "var(--text-faint)" }}
            >
              Switch Business
            </p>
          </div>

          {/* List */}
          <div className="py-1.5 max-h-64 overflow-y-auto">
            {loading ? (
              <div className="flex items-center justify-center py-6">
                <div
                  className="w-4 h-4 border-2 border-t-emerald-400 rounded-full animate-spin"
                  style={{
                    borderColor: "var(--border-strong)",
                    borderTopColor: "#10b981",
                  }}
                />
              </div>
            ) : memberships.length === 0 ? (
              <p
                className="text-center text-xs py-5"
                style={{ color: "var(--text-faint)" }}
              >
                No businesses found
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
                    className="w-full flex items-center gap-3 px-4 py-2.5 transition-all text-left"
                    style={{
                      background: isActive ? `${color}0d` : "transparent",
                    }}
                    onMouseEnter={(e) => {
                      if (!isActive)
                        (e.currentTarget as HTMLElement).style.background =
                          "var(--surface-2)";
                    }}
                    onMouseLeave={(e) => {
                      if (!isActive)
                        (e.currentTarget as HTMLElement).style.background =
                          "transparent";
                    }}
                  >
                    <div
                      className="w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0"
                      style={{ background: `${color}18`, color }}
                    >
                      <BIcon size={13} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p
                        className="text-sm truncate"
                        style={{
                          color: isActive
                            ? "var(--text-primary)"
                            : "var(--text-secondary)",
                          fontWeight: isActive ? 500 : 400,
                        }}
                      >
                        {business.name}
                      </p>
                      <p
                        className="text-[10px] capitalize"
                        style={{ color: "var(--text-faint)" }}
                      >
                        {business.type} · {role}
                      </p>
                    </div>
                    {isActive && (
                      <Check size={13} style={{ color, flexShrink: 0 }} />
                    )}
                  </button>
                );
              })
            )}
          </div>

          {/* Footer */}
          <div style={{ borderTop: `1px solid var(--border-light)` }}>
            <button
              onClick={() => {
                setOpen(false);
                navigate("/business/new");
              }}
              className="w-full flex items-center gap-2.5 px-4 py-3 transition-all"
              style={{ color: "#10b981" }}
              onMouseEnter={(e) => {
                (e.currentTarget as HTMLElement).style.background =
                  "rgba(16,185,129,0.06)";
              }}
              onMouseLeave={(e) => {
                (e.currentTarget as HTMLElement).style.background =
                  "transparent";
              }}
            >
              <Plus size={14} />
              <span className="text-sm font-medium">New Business</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default BusinessSwitcher;
