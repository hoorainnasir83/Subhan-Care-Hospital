import React from 'react';
import { 
  Users, UserCog, CalendarDays, FileBarChart, Pill, Search, Bell,
  ClipboardList, Package, FileText
} from 'lucide-react';

const PRESETS = {
  patients:      { icon: Users, title: 'No Patients Found', description: 'There are no patients registered yet. Start by adding your first patient.' },
  doctors:       { icon: UserCog, title: 'No Doctors Found', description: 'No doctors have been added to the system. Add a doctor to get started.' },
  appointments:  { icon: CalendarDays, title: 'No Appointments', description: 'There are no appointments scheduled. Book a new appointment to begin.' },
  reports:       { icon: FileBarChart, title: 'No Reports Available', description: 'No report data is available for the selected filters. Try adjusting your search criteria.' },
  medicines:     { icon: Pill, title: 'No Medicines Found', description: 'The pharmacy inventory is empty. Add medicines to the inventory.' },
  search:        { icon: Search, title: 'No Results Found', description: 'We couldn\'t find anything matching your search. Try different keywords or filters.' },
  notifications: { icon: Bell, title: 'No Notifications', description: 'You\'re all caught up! No new notifications at this time.' },
  prescriptions: { icon: ClipboardList, title: 'No Prescriptions', description: 'There are no prescriptions yet. Create a prescription for a patient.' },
  inventory:     { icon: Package, title: 'Inventory Empty', description: 'No items in inventory. Start by adding stock items.' },
  invoices:      { icon: FileText, title: 'No Invoices', description: 'No billing records found. Create an invoice to get started.' },
};

/**
 * Reusable Empty State component.
 *
 * @param {string}    preset        - Preset key (patients, doctors, appointments, etc.)
 * @param {string}    [title]       - Override title
 * @param {string}    [description] - Override description
 * @param {ReactNode} [icon]        - Override icon component
 * @param {string}    [actionLabel] - Button label (optional)
 * @param {function}  [onAction]    - Button click handler (optional)
 */
const EmptyState = ({ preset, title, description, icon: IconOverride, actionLabel, onAction }) => {
  const config = PRESETS[preset] || {};
  const Icon = IconOverride || config.icon || Search;
  const displayTitle = title || config.title || 'No Data';
  const displayDesc = description || config.description || 'No records to display.';

  return (
    <div className="flex flex-col items-center justify-center py-16 px-6 text-center">
      <div className="h-16 w-16 rounded-2xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center mb-5 shadow-sm">
        <Icon className="h-8 w-8 text-slate-400 dark:text-slate-500" strokeWidth={1.5} />
      </div>

      <h3 className="text-lg font-bold font-outfit text-slate-700 dark:text-slate-200 mb-2">
        {displayTitle}
      </h3>

      <p className="text-sm text-slate-500 dark:text-slate-400 max-w-sm mb-6 leading-relaxed">
        {displayDesc}
      </p>

      {actionLabel && onAction && (
        <button
          onClick={onAction}
          className="inline-flex items-center gap-2 px-5 py-2.5 bg-brand-600 hover:bg-brand-700 text-white text-sm font-semibold rounded-xl transition-colors shadow-sm shadow-brand-500/20"
        >
          {actionLabel}
        </button>
      )}
    </div>
  );
};

export default EmptyState;
