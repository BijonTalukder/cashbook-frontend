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
  bg: "#0a0f1e",
  card: "rgba(255,255,255,0.03)",
  border: "rgba(255,255,255,0.08)",
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
            ? "rgba(255,255,255,0.06)"
            : "rgba(255,255,255,0.03)",
          border: `1px solid ${open ? "rgba(255,255,255,0.12)" : C.border}`,
        }}
      >
        <div
          className="w-5 h-5 rounded-md flex items-center justify-center flex-shrink-0"
          style={{ background: `${accent}20`, color: accent }}
        >
          <Icon size={11} />
        </div>
        <span
          className="text-sm font-medium max-w-[130px] truncate hidden sm:block"
          style={{ color: "#e2e8f0" }}
        >
          {activeBusiness?.name ?? "Select business"}
        </span>
        <ChevronDown
          size={13}
          style={{
            color: "#64748b",
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
            background: "#0d1424",
            border: `1px solid rgba(255,255,255,0.1)`,
            boxShadow: "0 20px 60px rgba(0,0,0,0.6)",
          }}
        >
          {/* Header */}
          <div
            className="px-4 py-3"
            style={{ borderBottom: `1px solid rgba(255,255,255,0.06)` }}
          >
            <p
              className="text-xs uppercase tracking-wider"
              style={{ color: "#334155" }}
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
                    borderColor: "rgba(255,255,255,0.1)",
                    borderTopColor: "#10b981",
                  }}
                />
              </div>
            ) : memberships.length === 0 ? (
              <p
                className="text-center text-xs py-5"
                style={{ color: "#475569" }}
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
                          "rgba(255,255,255,0.04)";
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
                          color: isActive ? "#fff" : "#cbd5e1",
                          fontWeight: isActive ? 500 : 400,
                        }}
                      >
                        {business.name}
                      </p>
                      <p
                        className="text-[10px] capitalize"
                        style={{ color: "#475569" }}
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
          <div style={{ borderTop: `1px solid rgba(255,255,255,0.06)` }}>
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
