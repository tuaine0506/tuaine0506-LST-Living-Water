import React, { useState } from 'react';
import { Plus } from 'lucide-react';

interface MiniCalendarProps {
  selectedDate: string;
  onSelect: (date: string) => void;
  weekLabel: string;
  allowAnyDay?: boolean;
}

export const MiniCalendar: React.FC<MiniCalendarProps> = ({ selectedDate, onSelect, weekLabel, allowAnyDay = false }) => {
  const [currentMonth, setCurrentMonth] = useState(new Date(selectedDate + 'T12:00:00'));
  
  const daysInMonth = (year: number, month: number) => new Date(year, month + 1, 0).getDate();
  const firstDayOfMonth = (year: number, month: number) => new Date(year, month, 1).getDay();
  
  const year = currentMonth.getFullYear();
  const month = currentMonth.getMonth();
  const days = daysInMonth(year, month);
  const firstDay = firstDayOfMonth(year, month);
  
  const calendarDays = [];
  for (let i = 0; i < firstDay; i++) calendarDays.push(null);
  for (let i = 1; i <= days; i++) calendarDays.push(new Date(year, month, i));
  
  return (
    <div className="bg-white p-3 rounded-xl border border-brand-green/20 shadow-sm">
      <div className="flex items-center justify-between mb-2">
        <span className="text-[10px] font-black text-brand-green uppercase tracking-tighter bg-brand-green/10 px-2 py-0.5 rounded">{weekLabel}</span>
        <div className="flex items-center gap-1">
           <button type="button" onClick={() => setCurrentMonth(new Date(year, month - 1, 1))} className="p-1 hover:bg-gray-100 rounded text-gray-400">
             <Plus size={10} className="rotate-45" />
           </button>
           <span className="text-[9px] font-bold text-brand-brown">{currentMonth.toLocaleString('default', { month: 'short', year: 'numeric' })}</span>
           <button type="button" onClick={() => setCurrentMonth(new Date(year, month + 1, 1))} className="p-1 hover:bg-gray-100 rounded text-gray-400">
             <Plus size={10} />
           </button>
        </div>
      </div>
      <div className="grid grid-cols-7 gap-0.5 text-center">
        {['S','M','T','W','T','F','S'].map((d, i) => <div key={`${d}-${i}`} className="text-[8px] font-bold text-gray-300 py-1">{d}</div>)}
        {calendarDays.map((date, i) => {
          if (!date) return <div key={i} />;
          const isSunday = date.getDay() === 0;
          const dateStr = date.toISOString().split('T')[0];
          const isSelected = dateStr === selectedDate;
          const isPast = date < new Date(new Date().setHours(0,0,0,0));
          const isDisabled = !allowAnyDay && !isSunday;
          
          return (
            <button
              key={i}
              type="button"
              disabled={isDisabled || isPast}
              onClick={() => onSelect(dateStr)}
              className={`text-[10px] h-6 w-6 flex items-center justify-center rounded-full transition-all mx-auto ${
                isSelected ? 'bg-brand-orange text-white font-bold shadow-sm' : 
                isDisabled ? 'text-gray-200 cursor-not-allowed' :
                isPast ? 'text-gray-200 cursor-not-allowed' :
                isSunday ? 'hover:bg-brand-green/10 text-brand-green font-bold' : 
                'hover:bg-gray-100 text-brand-brown'
              }`}
            >
              {date.getDate()}
            </button>
          );
        })}
      </div>
      <p className="text-[9px] text-center mt-2 font-bold text-brand-brown">
        {new Date(selectedDate + 'T12:00:00').toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}
      </p>
    </div>
  );
};
