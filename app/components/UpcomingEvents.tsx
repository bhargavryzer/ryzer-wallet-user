import React from 'react';
import { Calendar } from "@/components/ui/calendar";
import { ChevronLeft, ChevronRight } from "lucide-react";

interface Event {
  id: string;
  title: string;
  date: string;
  type: 'meeting' | 'distribution';
  description?: string;
}

const UpcomingEvents: React.FC = () => {
  const events: Event[] = [
    {
      id: '1',
      title: 'Annual Investor Meeting',
      date: 'April 2025',
      type: 'meeting',
    },
    {
      id: '2',
      title: 'Q3 Dividend Distribution',
      date: 'April 2025',
      type: 'distribution',
    },
  ];

  return (
    <div className="bg-white rounded-lg p-4">
      <h2 className="text-xl font-semibold mb-4">Upcoming Events</h2>
      
      {/* Events List */}
      <div className="space-y-4 mb-4">
        {events.map((event) => (
          <div key={event.id} className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="flex flex-col">
                <h3 className="font-medium text-gray-900">{event.title}</h3>
                <div className="flex items-center text-sm text-gray-500">
                  <span>{event.type === 'meeting' ? 'Meeting' : 'Distribution'}</span>
                  <span className="mx-1">•</span>
                  <span>{event.date}</span>
                </div>
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <ChevronLeft className="h-4 w-4 text-gray-400" />
              <ChevronRight className="h-4 w-4 text-gray-400" />
            </div>
          </div>
        ))}
      </div>

      {/* Calendar */}
      <div className="border-t pt-4">
        <Calendar
          mode="single"
          className="rounded-md border"
        />
      </div>

      <button 
        className="mt-4 w-full text-center text-sm text-blue-600 hover:text-blue-700 font-medium"
      >
        View All Activities
      </button>
    </div>
  );
};

export default UpcomingEvents; 