import React from 'react';
import { Order } from '../types';
import { format } from 'date-fns';
import { RefreshCw, CheckCircle2 } from 'lucide-react';

interface RecurringScheduleVisualProps {
  order: Order;
  onToggle?: (order: Order, weekIndex: number) => void;
  disabled?: boolean;
}

export const RecurringScheduleVisual: React.FC<RecurringScheduleVisualProps> = ({ 
  order, 
  onToggle, 
  disabled = false 
}) => {
  return (
    <div className="bg-teal-50/50 p-4 rounded-2xl border border-teal-100 space-y-3 mt-4">
      <div className="flex justify-between items-center">
        <h4 className="text-xs font-bold text-teal-800 uppercase tracking-widest flex items-center gap-2">
          <RefreshCw size={14} className="animate-spin-slow" />
          Recurring Schedule
        </h4>
        <span className="text-[10px] font-bold bg-teal-100 text-teal-700 px-2.5 py-1 rounded-full border border-teal-200">
          {order.recurringWeeksFulfilled || 0} of 4 Weeks Completed
        </span>
      </div>
      
      <div className="grid grid-cols-4 gap-2">
        {[0, 1, 2, 3].map((weekIdx) => {
          const isCompleted = (order.recurringWeeksFulfilled || 0) > weekIdx;
          const isNext = (order.recurringWeeksFulfilled || 0) === weekIdx;
          const date = order.recurringDates?.[weekIdx];
          const formattedDate = date ? format(new Date(date + 'T12:00:00'), 'MMM dd') : '---';

          if (onToggle) {
            return (
              <button
                key={weekIdx}
                onClick={() => !disabled && onToggle(order, weekIdx)}
                disabled={disabled || (!isCompleted && !isNext)}
                className={`relative py-2 rounded-lg text-[10px] font-bold border transition-all flex flex-col items-center justify-center gap-1 ${
                  isCompleted 
                    ? 'bg-teal-500 text-white border-teal-600 shadow-inner' 
                    : isNext && !disabled
                      ? 'bg-white text-teal-600 border-teal-300 hover:border-teal-400 hover:bg-teal-50 shadow-sm'
                      : 'bg-gray-100 text-gray-400 border-gray-200 cursor-not-allowed'
                }`}
              >
                {isCompleted && (
                  <div className="absolute -top-1 -right-1 bg-white text-teal-500 rounded-full shadow-sm">
                    <CheckCircle2 size={10} />
                  </div>
                )}
                <span className="uppercase tracking-tighter text-[8px] opacity-70">Week {weekIdx + 1}</span>
                <span className="font-mono">{formattedDate}</span>
              </button>
            );
          }

          return (
            <div 
              key={weekIdx}
              className={`flex flex-col items-center justify-center p-2 rounded-xl border transition-all ${
                isCompleted 
                  ? 'bg-teal-500 border-teal-600 text-white shadow-sm' 
                  : 'bg-white border-teal-100 text-teal-800'
              }`}
            >
              <span className="text-[8px] uppercase font-bold opacity-70">Week {weekIdx + 1}</span>
              <span className="text-[10px] font-mono font-bold">{formattedDate}</span>
              {isCompleted && <CheckCircle2 size={10} className="mt-1" />}
            </div>
          );
        })}
      </div>
      <p className="text-[10px] text-teal-700/70 italic text-center">
        {order.isFulfilled 
          ? "This recurring subscription has been fully completed." 
          : `Next scheduled pickup/delivery: ${order.recurringDates?.[order.recurringWeeksFulfilled || 0] ? format(new Date(order.recurringDates[order.recurringWeeksFulfilled || 0] + 'T12:00:00'), 'EEEE, MMMM do') : 'TBD'}`
        }
      </p>
    </div>
  );
};
