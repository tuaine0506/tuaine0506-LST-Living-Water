
import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { Calendar, User, Clock, Plus, Trash2, Repeat, AlertCircle } from 'lucide-react';
import { GroupName } from '../types';
import { GROUP_NAMES } from '../constants';

const SchedulePage: React.FC = () => {
  const { schedule, volunteers, availability, isAdmin, addVolunteer, deleteVolunteer, addAvailability, deleteAvailability } = useApp();
  const [activeTab, setActiveTab] = useState<'schedule' | 'volunteers'>('schedule');
  
  // Form states
  const [newVolunteer, setNewVolunteer] = useState({ name: '', email: '', phone: '', group: GroupName.GroupA });
  const [newAvailability, setNewAvailability] = useState({
    volunteerId: '',
    dayOfWeek: 0,
    startTime: '09:00',
    endTime: '12:00',
    isRecurring: true,
    specificDate: ''
  });

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

  const getDayName = (dayIndex: number) => {
    const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    return days[dayIndex];
  };

  const handleAddVolunteer = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newVolunteer.name || !newVolunteer.email) return;
    await addVolunteer(newVolunteer);
    setNewVolunteer({ name: '', email: '', phone: '', group: GroupName.GroupA });
  };

  const handleAddAvailability = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newAvailability.volunteerId) return;
    await addAvailability(newAvailability);
    setNewAvailability({
      volunteerId: '',
      dayOfWeek: 0,
      startTime: '09:00',
      endTime: '12:00',
      isRecurring: true,
      specificDate: ''
    });
  };

  return (
    <div className="space-y-8">
      <div className="text-center">
        <h1 className="text-3xl md:text-4xl font-bold text-brand-green font-serif">Volunteer & Schedule</h1>
        <p className="text-brand-brown mt-2">Manage our fellowship groups and volunteer availability.</p>
      </div>

      <div className="flex justify-center">
        <div className="inline-flex bg-gray-100 p-1 rounded-xl shadow-inner">
          <button
            onClick={() => setActiveTab('schedule')}
            className={`px-6 py-2 rounded-lg font-bold text-sm transition-all ${activeTab === 'schedule' ? 'bg-white text-brand-green shadow-sm' : 'text-gray-500 hover:text-brand-green'}`}
          >
            Fulfillment Schedule
          </button>
          <button
            onClick={() => setActiveTab('volunteers')}
            className={`px-6 py-2 rounded-lg font-bold text-sm transition-all ${activeTab === 'volunteers' ? 'bg-white text-brand-green shadow-sm' : 'text-gray-500 hover:text-brand-green'}`}
          >
            Volunteer Portal
          </button>
        </div>
      </div>

      {activeTab === 'schedule' ? (
        <div className="bg-white p-6 rounded-2xl shadow-lg border border-brand-light-green/50">
          <div className="flex items-center gap-3 mb-6">
              <Calendar className="h-8 w-8 text-brand-orange"/>
              <h2 className="text-2xl font-bold text-brand-green font-serif">Upcoming Sundays</h2>
          </div>
          <div className="space-y-4">
            {schedule.map((event) => {
              const date = new Date(event.date);
              const dayOfWeek = date.getDay();
              const dateStr = date.toISOString().split('T')[0];
              
              const availableVolunteers = availability.filter(a => {
                if (a.isRecurring) {
                  return a.dayOfWeek === dayOfWeek;
                }
                return a.specificDate === dateStr;
              }).map(a => volunteers.find(v => v.id === a.volunteerId)).filter(Boolean);

              return (
                <div key={event.date} className="flex flex-col p-4 bg-gray-50 rounded-lg border border-gray-200 hover:bg-brand-cream transition-colors duration-200">
                  <div className="flex items-center">
                    <div className="flex flex-col items-center justify-center bg-brand-orange text-white rounded-lg p-3 w-20 h-20 mr-4 shadow">
                        <span className="text-3xl font-bold">{formatDay(event.date)}</span>
                        <span className="text-sm font-semibold uppercase">{formatMonth(event.date)}</span>
                    </div>
                    <div className="flex-grow">
                        <p className="font-bold text-lg text-brand-green">{event.group}</p>
                        <p className="text-sm text-gray-600">{formatDate(event.date)}</p>
                    </div>
                  </div>
                  {availableVolunteers.length > 0 && (
                    <div className="mt-3 pt-3 border-t border-gray-200">
                      <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-2">Available Volunteers</p>
                      <div className="flex flex-wrap gap-2">
                        {availableVolunteers.map((v, i) => (
                          <span key={i} className="text-xs bg-white border border-brand-light-green/30 text-brand-brown px-2 py-1 rounded-md font-medium">
                            {v?.name}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Volunteer Registration / List */}
          <div className="lg:col-span-1 space-y-6">
            <div className="bg-white p-6 rounded-2xl shadow-lg border border-brand-light-green/50">
              <h3 className="text-xl font-bold text-brand-green font-serif mb-4 flex items-center gap-2">
                <User className="text-brand-orange" size={20} />
                Register Volunteer
              </h3>
              <form onSubmit={handleAddVolunteer} className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest mb-1">Name</label>
                  <input
                    type="text"
                    value={newVolunteer.name}
                    onChange={e => setNewVolunteer({...newVolunteer, name: e.target.value})}
                    className="w-full p-2 border border-gray-300 rounded-lg bg-white"
                    placeholder="Full Name"
                    required
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest mb-1">Email</label>
                  <input
                    type="email"
                    value={newVolunteer.email}
                    onChange={e => setNewVolunteer({...newVolunteer, email: e.target.value})}
                    className="w-full p-2 border border-gray-300 rounded-lg bg-white"
                    placeholder="email@example.com"
                    required
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest mb-1">Group</label>
                  <select
                    value={newVolunteer.group}
                    onChange={e => setNewVolunteer({...newVolunteer, group: e.target.value as GroupName})}
                    className="w-full p-2 border border-gray-300 rounded-lg bg-white"
                  >
                    {GROUP_NAMES.map(group => (
                      <option key={group} value={group}>{group}</option>
                    ))}
                  </select>
                </div>
                <button type="submit" className="w-full bg-brand-green text-white font-bold py-2 rounded-lg hover:bg-opacity-90 transition-all flex items-center justify-center gap-2">
                  <Plus size={18} /> Add Volunteer
                </button>
              </form>
            </div>

            {isAdmin && (
              <div className="bg-white p-6 rounded-2xl shadow-lg border border-brand-light-green/50 max-h-[400px] overflow-y-auto">
                <h3 className="text-xl font-bold text-brand-green font-serif mb-4">Volunteer List</h3>
                <div className="space-y-3">
                  {volunteers.map(v => (
                    <div key={v.id} className="p-3 bg-gray-50 rounded-lg border border-gray-100 flex justify-between items-center group">
                      <div>
                        <p className="font-bold text-brand-brown text-sm">{v.name}</p>
                        <p className="text-[10px] text-gray-500">{v.group}</p>
                      </div>
                      <button onClick={() => deleteVolunteer(v.id)} className="text-red-400 opacity-0 group-hover:opacity-100 hover:text-red-600 transition-all">
                        <Trash2 size={16} />
                      </button>
                    </div>
                  ))}
                  {volunteers.length === 0 && <p className="text-sm text-gray-400 italic">No volunteers registered yet.</p>}
                </div>
              </div>
            )}
          </div>

          {/* Availability Management */}
          <div className="lg:col-span-2 space-y-6">
            <div className="bg-white p-6 rounded-2xl shadow-lg border border-brand-light-green/50">
              <h3 className="text-xl font-bold text-brand-green font-serif mb-4 flex items-center gap-2">
                <Clock className="text-brand-orange" size={20} />
                Mark Availability
              </h3>
              <form onSubmit={handleAddAvailability} className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="md:col-span-2">
                  <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest mb-1">Select Volunteer</label>
                  <select
                    value={newAvailability.volunteerId}
                    onChange={e => setNewAvailability({...newAvailability, volunteerId: e.target.value})}
                    className="w-full p-2 border border-gray-300 rounded-lg bg-white"
                    required
                  >
                    <option value="">Choose a volunteer...</option>
                    {volunteers.map(v => (
                      <option key={v.id} value={v.id}>{v.name} ({v.group})</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest mb-1">Type</label>
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => setNewAvailability({...newAvailability, isRecurring: true})}
                      className={`flex-1 py-2 rounded-lg font-bold text-xs border transition-all ${newAvailability.isRecurring ? 'bg-brand-orange border-brand-orange text-white' : 'bg-white border-gray-200 text-gray-500'}`}
                    >
                      Recurring
                    </button>
                    <button
                      type="button"
                      onClick={() => setNewAvailability({...newAvailability, isRecurring: false})}
                      className={`flex-1 py-2 rounded-lg font-bold text-xs border transition-all ${!newAvailability.isRecurring ? 'bg-brand-orange border-brand-orange text-white' : 'bg-white border-gray-200 text-gray-500'}`}
                    >
                      One-time
                    </button>
                  </div>
                </div>
                {newAvailability.isRecurring ? (
                  <div>
                    <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest mb-1">Day of Week</label>
                    <select
                      value={newAvailability.dayOfWeek}
                      onChange={e => setNewAvailability({...newAvailability, dayOfWeek: parseInt(e.target.value)})}
                      className="w-full p-2 border border-gray-300 rounded-lg bg-white"
                    >
                      {[0,1,2,3,4,5,6].map(d => (
                        <option key={d} value={d}>{getDayName(d)}</option>
                      ))}
                    </select>
                  </div>
                ) : (
                  <div>
                    <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest mb-1">Specific Date</label>
                    <input
                      type="date"
                      value={newAvailability.specificDate}
                      onChange={e => setNewAvailability({...newAvailability, specificDate: e.target.value})}
                      className="w-full p-2 border border-gray-300 rounded-lg bg-white"
                      required={!newAvailability.isRecurring}
                    />
                  </div>
                )}
                <div>
                  <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest mb-1">Start Time</label>
                  <input
                    type="time"
                    value={newAvailability.startTime}
                    onChange={e => setNewAvailability({...newAvailability, startTime: e.target.value})}
                    className="w-full p-2 border border-gray-300 rounded-lg bg-white"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest mb-1">End Time</label>
                  <input
                    type="time"
                    value={newAvailability.endTime}
                    onChange={e => setNewAvailability({...newAvailability, endTime: e.target.value})}
                    className="w-full p-2 border border-gray-300 rounded-lg bg-white"
                  />
                </div>
                <div className="md:col-span-2">
                  <button type="submit" className="w-full bg-brand-orange text-white font-bold py-2 rounded-lg hover:bg-opacity-90 transition-all flex items-center justify-center gap-2">
                    <Plus size={18} /> Save Availability
                  </button>
                </div>
              </form>
            </div>

            <div className="bg-white p-6 rounded-2xl shadow-lg border border-brand-light-green/50">
              <h3 className="text-xl font-bold text-brand-green font-serif mb-4">Current Availability</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {availability.map(avail => {
                  const volunteer = volunteers.find(v => v.id === avail.volunteerId);
                  if (!volunteer) return null;
                  return (
                    <div key={avail.id} className="p-4 bg-gray-50 rounded-xl border border-gray-100 flex justify-between items-start group">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <p className="font-bold text-brand-brown">{volunteer.name}</p>
                          {avail.isRecurring ? (
                            <span className="text-[8px] bg-blue-100 text-blue-600 px-1.5 py-0.5 rounded-full font-bold uppercase flex items-center gap-1">
                              <Repeat size={8} /> Recurring
                            </span>
                          ) : (
                            <span className="text-[8px] bg-purple-100 text-purple-600 px-1.5 py-0.5 rounded-full font-bold uppercase">One-time</span>
                          )}
                        </div>
                        <p className="text-xs text-gray-600 flex items-center gap-1">
                          <Calendar size={12} className="text-brand-orange" />
                          {avail.isRecurring ? getDayName(avail.dayOfWeek!) : avail.specificDate}
                        </p>
                        <p className="text-xs text-gray-600 flex items-center gap-1">
                          <Clock size={12} className="text-brand-orange" />
                          {avail.startTime} - {avail.endTime}
                        </p>
                      </div>
                      <button onClick={() => deleteAvailability(avail.id)} className="text-red-400 opacity-0 group-hover:opacity-100 hover:text-red-600 transition-all">
                        <Trash2 size={16} />
                      </button>
                    </div>
                  );
                })}
                {availability.length === 0 && (
                  <div className="md:col-span-2 text-center py-8 bg-gray-50 rounded-xl border border-dashed">
                    <AlertCircle className="mx-auto h-8 w-8 text-gray-300 mb-2" />
                    <p className="text-gray-400 italic">No availability marked yet.</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SchedulePage;

