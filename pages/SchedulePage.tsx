
import React from 'react';
import { useApp } from '../context/AppContext';
import { Calendar } from 'lucide-react';

const SchedulePage: React.FC = () => {
  const { schedule } = useApp();

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  const formatDay = (dateString: string) => {
    return new Date(dateString).getDate();
  };
  
  const formatMonth = (dateString: string) => {
      const date = new Date(dateString);
      return date.toLocaleDateString('en-US', { month: 'short' });
  };


  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl md:text-4xl font-bold text-brand-green font-serif text-center">Fulfillment Schedule</h1>
        <p className="text-center text-brand-brown mt-2">Upcoming Sunday schedule for our volunteer groups.</p>
      </div>

      <div className="bg-white p-6 rounded-2xl shadow-lg border border-brand-light-green/50">
        <div className="flex items-center gap-3 mb-6">
            <Calendar className="h-8 w-8 text-brand-orange"/>
            <h2 className="text-2xl font-bold text-brand-green font-serif">Upcoming Sundays</h2>
        </div>
        <div className="space-y-4">
          {schedule.map((event) => (
            <div key={event.date} className="flex items-center p-4 bg-gray-50 rounded-lg border border-gray-200 hover:bg-brand-cream transition-colors duration-200">
                <div className="flex flex-col items-center justify-center bg-brand-orange text-white rounded-lg p-3 w-20 h-20 mr-4 shadow">
                    <span className="text-3xl font-bold">{formatDay(event.date)}</span>
                    <span className="text-sm font-semibold uppercase">{formatMonth(event.date)}</span>
                </div>
                <div className="flex-grow">
                    <p className="font-bold text-lg text-brand-green">{event.group}</p>
                    <p className="text-sm text-gray-600">{formatDate(event.date)}</p>
                </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default SchedulePage;
