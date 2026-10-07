import React from "react";
import { PlusCircle, HandCoins } from "lucide-react";
import { haptic } from "../../../native/bridge";

interface BusinessFloatingDockProps {
  onNewSale: () => void;
  onReceiveBaki: () => void;
}

export const BusinessFloatingDock: React.FC<BusinessFloatingDockProps> = ({
  onNewSale,
  onReceiveBaki,
}) => {
  return (
    <div className="fixed bottom-[calc(var(--bottomnav-h,56px)+var(--safe-bottom,0px)+8px)] sm:bottom-4 left-0 right-0 z-40 px-4 pointer-events-none">
      <div className="max-w-md mx-auto grid grid-cols-2 gap-2.5 bg-white/95 dark:bg-neutral-900/95 backdrop-blur-xl border border-slate-200/80 dark:border-neutral-800 p-2 rounded-2xl shadow-xl pointer-events-auto">
        {/* + নতুন বিক্রি (POS) */}
        <button
          type="button"
          onClick={() => {
            haptic("medium");
            onNewSale();
          }}
          className="w-full h-12 rounded-xl bg-emerald-600 hover:bg-emerald-700 active:scale-[0.97] transition-all flex items-center justify-center gap-2 text-white font-bold text-xs sm:text-sm shadow-md shadow-emerald-600/20 select-none"
        >
          <PlusCircle size={18} />
          <span>+ নতুন বিক্রি (POS)</span>
        </button>

        {/* বাকি আদায় (+) */}
        <button
          type="button"
          onClick={() => {
            haptic("medium");
            onReceiveBaki();
          }}
          className="w-full h-12 rounded-xl bg-slate-900 hover:bg-black dark:bg-neutral-800 dark:hover:bg-neutral-700 active:scale-[0.97] transition-all flex items-center justify-center gap-2 text-white font-bold text-xs sm:text-sm shadow-md select-none"
        >
          <HandCoins size={18} />
          <span>বাকি আদায় (+)</span>
        </button>
      </div>
    </div>
  );
};

export default BusinessFloatingDock;
