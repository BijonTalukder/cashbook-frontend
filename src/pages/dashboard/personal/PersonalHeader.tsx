import React from "react";
import { Store, RefreshCw } from "lucide-react";
import type { IBusiness } from "../../../services/business.service";
import { useAuthStore } from "../../../store/authStore";
import { useTranslation } from "../../../i18n/useTranslation";
import { haptic } from "../../../native/bridge";

interface PersonalHeaderProps {
  business: IBusiness;
  onRefresh?: () => void;
}

export const PersonalHeader: React.FC<PersonalHeaderProps> = ({
  business,
  onRefresh,
}) => {
  const { user } = useAuthStore();
  const { t } = useTranslation();

  return (
    <div className="flex items-center justify-between p-2 rounded-2xl bg-white/70 dark:bg-neutral-900/70 border border-slate-200/60 dark:border-neutral-800/60 backdrop-blur-sm shadow-xs">
      <div className="flex items-center gap-2.5 min-w-0">
        <div className="relative shrink-0">
          {user?.avatar ? (
            <img
              src={user.avatar}
              alt={`${user.firstName} ${user.lastName}`}
              className="w-10 h-10 rounded-full object-cover ring-2 ring-slate-200 dark:ring-neutral-700"
            />
          ) : (
            <div className="w-10 h-10 rounded-full bg-blue-100 dark:bg-blue-950/80 text-blue-600 dark:text-blue-300 font-bold flex items-center justify-center text-sm ring-2 ring-slate-200 dark:ring-neutral-700">
              {user?.firstName?.[0] || "U"}
            </div>
          )}
          <span className="absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full bg-emerald-500 shadow-[0_0_0_2px_#ffffff] dark:shadow-[0_0_0_2px_#171717]" />
        </div>

        <div className="flex flex-col min-w-0">
          <div className="flex items-center gap-1.5">
            <span className="font-bold text-[14px] text-slate-900 dark:text-neutral-100 truncate">
              {user?.firstName} {user?.lastName}
            </span>
            <span className="text-[11px] px-1.5 py-0.5 rounded-full bg-blue-100 dark:bg-blue-950/70 text-blue-700 dark:text-blue-300 font-semibold shrink-0">
              {t("businessType.personal")}
            </span>
          </div>
          <p className="text-xs text-slate-500 dark:text-neutral-400 font-medium mt-0.5 truncate">
            {t("personalDashboard.summaryTitle") || "ব্যক্তিগত আয়-ব্যয় হিসাব"}
          </p>
        </div>
      </div>

      <button
        type="button"
        onClick={() => {
          haptic("light");
          onRefresh?.();
        }}
        aria-label="Refresh data"
        className="w-9 h-9 flex items-center justify-center rounded-xl bg-slate-100 dark:bg-neutral-800 text-slate-600 dark:text-neutral-300 hover:text-slate-900 dark:hover:text-white transition-all active:scale-95 shrink-0"
      >
        <RefreshCw size={15} />
      </button>
    </div>
  );
};

export default PersonalHeader;
