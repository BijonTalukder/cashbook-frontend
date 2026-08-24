// Add this widget to DashboardPage when activeBusiness.type === 'mass'
// Import: import MealDashboardWidget from './MealDashboardWidget';
// Usage: {activeBusiness?.type === 'mass' && <MealDashboardWidget businessId={activeBusiness._id} />}

import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { UtensilsCrossed, ChevronRight, Loader2 } from "lucide-react";
import mealService from "../../services/meal.service";
import { useTranslation } from "../../i18n/useTranslation";
import { useFormat } from "../../i18n/useFormat";

interface Props {
  businessId: string;
}

const MealDashboardWidget = ({ businessId }: Props) => {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const { num, monthName } = useFormat();
  const [data, setData] = useState<{ total: number; days: number } | null>(
    null,
  );
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        const res = await mealService.getSummary(businessId);
        setData(res);
      } catch {
        /* ignore */
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [businessId]);

  const month = monthName(new Date().getMonth(), "long");

  return (
    <button
      onClick={() => navigate("/meals")}
      className="w-full text-left rounded-2xl p-5 transition-all active:scale-[0.98] group"
      style={{
        background: "rgba(139,92,246,0.05)",
        border: "1px solid rgba(139,92,246,0.2)",
      }}
      onMouseEnter={(e) => {
        (e.currentTarget as HTMLElement).style.background =
          "rgba(139,92,246,0.08)";
      }}
      onMouseLeave={(e) => {
        (e.currentTarget as HTMLElement).style.background =
          "rgba(139,92,246,0.05)";
      }}
    >
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2.5">
          <div
            className="w-9 h-9 rounded-xl flex items-center justify-center"
            style={{ background: "rgba(139,92,246,0.15)", color: "#8b5cf6" }}
          >
            <UtensilsCrossed size={16} />
          </div>
          <div>
            <p
              className="text-sm font-semibold"
              style={{ color: "var(--text-primary)" }}
            >
              {t("mealWidget.title")}
            </p>
            <p className="text-xs" style={{ color: "var(--text-faint)" }}>
              {t("mealWidget.monthLabel", { month })}
            </p>
          </div>
        </div>
        <ChevronRight
          size={15}
          style={{ color: "#8b5cf6" }}
          className="group-hover:translate-x-0.5 transition-transform"
        />
      </div>

      {loading ? (
        <div className="flex items-center gap-2">
          <Loader2
            size={14}
            className="animate-spin"
            style={{ color: "#8b5cf6" }}
          />
          <span className="text-xs" style={{ color: "var(--text-faint)" }}>
            {t("common.loading")}
          </span>
        </div>
      ) : (
        <div className="flex items-end gap-6">
          <div>
            <p
              className="text-3xl font-bold leading-none"
              style={{
                color: "#8b5cf6",
                fontFamily: "'DM Serif Display', serif",
              }}
            >
              {num(data?.total ?? 0)}
            </p>
            <p className="text-xs mt-1" style={{ color: "var(--text-faint)" }}>
              {t("mealWidget.totalMeals")}
            </p>
          </div>
          <div className="mb-1">
            <p
              className="text-lg font-bold leading-none"
              style={{ color: "var(--text-primary)" }}
            >
              {num(data?.days ?? 0)}
            </p>
            <p className="text-xs mt-0.5" style={{ color: "var(--text-faint)" }}>
              {t("mealWidget.days")}
            </p>
          </div>
          <div className="mb-1 ml-auto">
            <div
              className="text-[10px] px-2 py-1 rounded-lg font-medium"
              style={{ background: "rgba(139,92,246,0.1)", color: "#8b5cf6" }}
            >
              {t("mealWidget.details")}
            </div>
          </div>
        </div>
      )}
    </button>
  );
};

export default MealDashboardWidget;
