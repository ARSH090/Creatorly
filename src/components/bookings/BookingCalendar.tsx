'use client';

import { useState } from 'react';
import { Calendar, Clock, ChevronLeft, ChevronRight } from 'lucide-react';

interface BookingCalendarProps {
  creator: {
    _id: string;
    displayName: string;
    avatar?: string;
  };
  services: Array<{
    _id: string;
    name: string;
    description?: string;
    duration: number;
    price: number;
    currency: string;
  }>;
}

export default function BookingCalendar({ creator, services }: BookingCalendarProps) {
  const [selectedService, setSelectedService] = useState<string | null>(null);
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [currentMonth, setCurrentMonth] = useState(new Date());

  const service = services.find(s => s._id === selectedService);

  const daysInMonth = new Date(
    currentMonth.getFullYear(),
    currentMonth.getMonth() + 1,
    0
  ).getDate();

  const firstDayOfMonth = new Date(
    currentMonth.getFullYear(),
    currentMonth.getMonth(),
    1
  ).getDay();

  const prevMonth = () => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1, 1));
  };

  const nextMonth = () => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 1));
  };

  const selectDate = (day: number) => {
    setSelectedDate(new Date(currentMonth.getFullYear(), currentMonth.getMonth(), day));
  };

  if (services.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-zinc-500">No booking services available.</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
      {/* Service Selection */}
      <div className="lg:col-span-1 space-y-4">
        <h2 className="text-lg font-semibold mb-4">Select a Service</h2>
        {services.map((s) => (
          <button
            key={s._id}
            onClick={() => setSelectedService(s._id)}
            className={`w-full text-left p-4 rounded-2xl border transition-all ${
              selectedService === s._id
                ? 'border-indigo-500 bg-indigo-500/10'
                : 'border-white/5 bg-zinc-900/50 hover:border-white/10'
            }`}
          >
            <div className="flex justify-between items-start mb-2">
              <h3 className="font-semibold">{s.name}</h3>
              <span className="text-indigo-400 font-bold">
                {s.currency === 'INR' ? '₹' : '$'}{s.price}
              </span>
            </div>
            {s.description && (
              <p className="text-sm text-zinc-400 mb-2">{s.description}</p>
            )}
            <div className="flex items-center gap-1 text-sm text-zinc-500">
              <Clock size={14} />
              <span>{s.duration} minutes</span>
            </div>
          </button>
        ))}
      </div>

      {/* Calendar */}
      <div className="lg:col-span-2">
        {selectedService ? (
          <div className="bg-zinc-900/50 border border-white/5 rounded-2xl p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-lg font-semibold flex items-center gap-2">
                <Calendar size={20} />
                Select a Date
              </h2>
              <div className="flex items-center gap-2">
                <button
                  onClick={prevMonth}
                  className="p-2 hover:bg-white/5 rounded-lg transition-colors"
                >
                  <ChevronLeft size={20} />
                </button>
                <span className="font-medium">
                  {currentMonth.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
                </span>
                <button
                  onClick={nextMonth}
                  className="p-2 hover:bg-white/5 rounded-lg transition-colors"
                >
                  <ChevronRight size={20} />
                </button>
              </div>
            </div>

            {/* Calendar Grid */}
            <div className="grid grid-cols-7 gap-2 mb-2">
              {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day) => (
                <div key={day} className="text-center text-sm text-zinc-500 py-2">
                  {day}
                </div>
              ))}
            </div>
            <div className="grid grid-cols-7 gap-2">
              {Array.from({ length: firstDayOfMonth }).map((_, i) => (
                <div key={`empty-${i}`} />
              ))}
              {Array.from({ length: daysInMonth }).map((_, i) => {
                const day = i + 1;
                const isSelected = selectedDate?.getDate() === day &&
                  selectedDate?.getMonth() === currentMonth.getMonth();
                const isToday = new Date().getDate() === day &&
                  new Date().getMonth() === currentMonth.getMonth();

                return (
                  <button
                    key={day}
                    onClick={() => selectDate(day)}
                    className={`aspect-square rounded-lg flex items-center justify-center transition-all ${
                      isSelected
                        ? 'bg-indigo-500 text-white'
                        : isToday
                        ? 'bg-white/10 text-white'
                        : 'hover:bg-white/5 text-zinc-300'
                    }`}
                  >
                    {day}
                  </button>
                );
              })}
            </div>

            {selectedDate && (
              <div className="mt-6 pt-6 border-t border-white/5">
                <p className="text-sm text-zinc-400 mb-4">
                  Selected: {selectedDate.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
                </p>
                <button className="w-full py-3 bg-white text-black rounded-xl font-semibold hover:bg-zinc-100 transition-colors">
                  Continue Booking
                </button>
              </div>
            )}
          </div>
        ) : (
          <div className="bg-zinc-900/50 border border-white/5 rounded-2xl p-12 text-center">
            <Calendar size={48} className="mx-auto mb-4 text-zinc-600" />
            <p className="text-zinc-500">Select a service to view available dates</p>
          </div>
        )}
      </div>
    </div>
  );
}
