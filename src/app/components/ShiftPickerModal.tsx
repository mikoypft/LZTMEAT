import { useState } from "react";
import { Sun, Moon, Loader2 } from "lucide-react";

interface Props {
  userName: string;
  onPick: (shift: "AM" | "PM") => Promise<void>;
}

export function ShiftPickerModal({ userName, onPick }: Props) {
  const [saving, setSaving] = useState(false);
  const [selected, setSelected] = useState<"AM" | "PM" | null>(null);

  const handlePick = async (shift: "AM" | "PM") => {
    setSelected(shift);
    setSaving(true);
    try {
      await onPick(shift);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-sm w-full overflow-hidden">
        {/* Header */}
        <div className="bg-primary px-6 pt-6 pb-5">
          <p className="text-primary-foreground/70 text-xs font-medium uppercase tracking-wide mb-1">
            Good day, {userName.split(" ")[0]}!
          </p>
          <h2 className="text-primary-foreground text-xl font-bold leading-tight">
            Select Your Shift
          </h2>
          <p className="text-primary-foreground/80 text-sm mt-1">
            Choose your shift for today before continuing.
          </p>
        </div>

        {/* Shift buttons */}
        <div className="px-6 py-6 grid grid-cols-2 gap-4">
          <button
            onClick={() => handlePick("AM")}
            disabled={saving}
            className={`flex flex-col items-center gap-3 py-6 rounded-xl border-2 transition-all ${
              selected === "AM"
                ? "border-amber-400 bg-amber-50"
                : "border-gray-200 hover:border-amber-300 hover:bg-amber-50/50"
            } disabled:opacity-60 disabled:cursor-not-allowed`}
          >
            {saving && selected === "AM" ? (
              <Loader2 className="w-8 h-8 text-amber-500 animate-spin" />
            ) : (
              <Sun className="w-8 h-8 text-amber-500" />
            )}
            <div>
              <div className="text-base font-bold text-gray-900">AM</div>
              <div className="text-xs text-gray-500">Morning shift</div>
            </div>
          </button>

          <button
            onClick={() => handlePick("PM")}
            disabled={saving}
            className={`flex flex-col items-center gap-3 py-6 rounded-xl border-2 transition-all ${
              selected === "PM"
                ? "border-indigo-400 bg-indigo-50"
                : "border-gray-200 hover:border-indigo-300 hover:bg-indigo-50/50"
            } disabled:opacity-60 disabled:cursor-not-allowed`}
          >
            {saving && selected === "PM" ? (
              <Loader2 className="w-8 h-8 text-indigo-500 animate-spin" />
            ) : (
              <Moon className="w-8 h-8 text-indigo-500" />
            )}
            <div>
              <div className="text-base font-bold text-gray-900">PM</div>
              <div className="text-xs text-gray-500">Afternoon shift</div>
            </div>
          </button>
        </div>

        <p className="text-center text-xs text-gray-400 pb-5">
          This selection will be recorded for today's logs.
        </p>
      </div>
    </div>
  );
}
