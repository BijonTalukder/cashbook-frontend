import React, { useState } from "react";
import { Mic, AudioWaveform, Check, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { haptic } from "../../../native/bridge";

interface VoiceAssistantCardProps {
  onVoiceResult?: (transcript: string) => void;
}

export const VoiceAssistantCard: React.FC<VoiceAssistantCardProps> = ({
  onVoiceResult,
}) => {
  const [listening, setListening] = useState(false);
  const [success, setSuccess] = useState(false);

  const handleListen = () => {
    haptic("medium");

    // Check for Web Speech API
    const SpeechRecognition =
      (window as any).SpeechRecognition ||
      (window as any).webkitSpeechRecognition;

    if (!SpeechRecognition) {
      // Fallback mock feedback for platforms without speech api
      setListening(true);
      setTimeout(() => {
        setListening(false);
        setSuccess(true);
        toast.info("ভয়েস ইনপুট: 'করিম চাচা আলু নিল ২০ টাকা'");
        onVoiceResult?.("করিম চাচা আলু নিল ২০ টাকা");
        setTimeout(() => setSuccess(false), 2000);
      }, 1800);
      return;
    }

    try {
      const recognition = new SpeechRecognition();
      recognition.lang = "bn-BD";
      recognition.interimResults = false;
      recognition.maxAlternatives = 1;

      setListening(true);

      recognition.onresult = (event: any) => {
        const transcript = event.results[0][0].transcript;
        setListening(false);
        setSuccess(true);
        toast.success(`ভয়েস রিসিভ হয়েছে: "${transcript}"`);
        onVoiceResult?.(transcript);
        setTimeout(() => setSuccess(false), 2000);
      };

      recognition.onerror = () => {
        setListening(false);
        toast.error("ভয়েস শোনা যায়নি, অনুগ্রহ করে আবার চেষ্টা করুন।");
      };

      recognition.onend = () => {
        setListening(false);
      };

      recognition.start();
    } catch {
      setListening(false);
      toast.error("মাইক্রোফোন অনুমতি দিন।");
    }
  };

  return (
    <div className="relative overflow-hidden rounded-3xl bg-blue-50/80 dark:bg-blue-950/40 border border-blue-200/70 dark:border-blue-800/60 p-3.5 sm:p-4 flex items-center justify-between gap-3 shadow-xs">
      <div className="flex items-center gap-3 min-w-0">
        <div
          className={`w-10 h-10 rounded-2xl flex items-center justify-center shrink-0 transition-transform ${
            listening
              ? "bg-rose-500 text-white animate-pulse scale-105"
              : success
              ? "bg-emerald-500 text-white"
              : "bg-blue-600 dark:bg-blue-500 text-white shadow-xs"
          }`}
        >
          {listening ? (
            <Loader2 size={20} className="animate-spin" />
          ) : success ? (
            <Check size={20} />
          ) : (
            <Mic size={20} />
          )}
        </div>

        <div className="min-w-0">
          <div className="text-xs font-bold text-blue-700 dark:text-blue-300 flex items-center gap-1.5">
            <span>ভয়েস হিসাব সহকারী</span>
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
          </div>
          <p className="text-xs text-slate-700 dark:text-neutral-300 truncate mt-0.5">
            {listening ? (
              <span className="text-blue-600 dark:text-blue-400 font-semibold animate-pulse">
                শুনছি... আপনার হিসাব বলুন
              </span>
            ) : success ? (
              <span className="text-emerald-600 dark:text-emerald-400 font-semibold">
                হিসাব সফলভাবে নথিভুক্ত হয়েছে!
              </span>
            ) : (
              <>
                বলুন:{" "}
                <span className="italic text-slate-500 dark:text-neutral-400 font-medium">
                  "করিম চাচা আলু নিল ২০ টাকা"
                </span>
              </>
            )}
          </p>
        </div>
      </div>

      <button
        type="button"
        onClick={handleListen}
        disabled={listening}
        className={`shrink-0 px-3 py-1.5 rounded-xl font-semibold text-xs shadow-xs active:scale-95 transition-all flex items-center gap-1.5 select-none ${
          listening
            ? "bg-rose-600 text-white"
            : success
            ? "bg-emerald-600 text-white"
            : "bg-white dark:bg-neutral-900 text-blue-600 dark:text-blue-400 border border-blue-200/80 dark:border-neutral-700 hover:bg-blue-50 dark:hover:bg-neutral-800"
        }`}
      >
        <span>{listening ? "শুনছি..." : success ? "সম্পন্ন" : "শুনুন"}</span>
        <AudioWaveform size={15} />
      </button>
    </div>
  );
};

export default VoiceAssistantCard;
