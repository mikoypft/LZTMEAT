import { Bell, Users, X } from "lucide-react";

interface Props {
  onGoToUsers: () => void;
  onDismiss: () => void;
}

export function ShiftReminderModal({ onGoToUsers, onDismiss }: Props) {
  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full overflow-hidden">
        {/* Header */}
        <div className="bg-primary px-6 pt-6 pb-5 relative">
          <button
            onClick={onDismiss}
            className="absolute top-4 right-4 p-1.5 rounded-full hover:bg-primary-foreground/20 transition-colors text-primary-foreground"
            aria-label="Dismiss"
          >
            <X className="w-4 h-4" />
          </button>
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-primary-foreground/20 rounded-full flex items-center justify-center">
              <Bell className="w-6 h-6 text-primary-foreground" />
            </div>
            <div>
              <p className="text-primary-foreground/70 text-xs font-medium uppercase tracking-wide">
                Daily Reminder
              </p>
              <h2 className="text-primary-foreground text-xl font-bold leading-tight">
                Update AM/PM Shifts
              </h2>
            </div>
          </div>
        </div>

        {/* Body */}
        <div className="px-6 py-5">
          <p className="text-gray-700 text-sm leading-relaxed">
            Don't forget to set today's{" "}
            <span className="font-semibold text-gray-900">AM/PM shift assignments</span>{" "}
            for your staff. Head over to the{" "}
            <span className="font-semibold text-gray-900">Users page</span> to
            keep schedules up to date.
          </p>

          <div className="mt-4 p-3 bg-amber-50 border border-amber-200 rounded-lg flex items-start gap-2">
            <div className="w-4 h-4 mt-0.5 rounded-full bg-amber-400 flex-shrink-0" />
            <p className="text-amber-800 text-xs leading-relaxed">
              This reminder will appear once per day until dismissed.
            </p>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 pb-6 flex flex-col sm:flex-row gap-3">
          <button
            onClick={onGoToUsers}
            className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors font-medium text-sm"
          >
            <Users className="w-4 h-4" />
            Go to Users Page
          </button>
          <button
            onClick={onDismiss}
            className="flex-1 px-4 py-2.5 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors font-medium text-sm"
          >
            Dismiss for Today
          </button>
        </div>
      </div>
    </div>
  );
}
