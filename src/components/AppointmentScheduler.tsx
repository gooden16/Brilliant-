import { useState } from 'react';
import { DayPicker } from 'react-day-picker';
import { format } from 'date-fns';
import { ArrowLeft } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { logger } from '../lib/logger';
import { useSupabase } from '../contexts/SupabaseContext';
import AppointmentConfirmation from './AppointmentConfirmation';
import 'react-day-picker/dist/style.css';

interface AppointmentSchedulerProps {
  onBack?: () => void;
}
export default function AppointmentScheduler({ onBack }: AppointmentSchedulerProps) {
  const [selectedDate, setSelectedDate] = useState<Date>();
  const [selectedTime, setSelectedTime] = useState('');
  const [showConfirmation, setShowConfirmation] = useState(false);
  const { session } = useSupabase();

  const availableTimes = [
    '10:00 AM', '11:00 AM', '12:00 PM', '1:00 PM', '2:00 PM', '4:00 PM'
  ];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedDate || !selectedTime || !session?.user) return;

    logger.info('Attempting to schedule appointment', {
      date: format(selectedDate, 'yyyy-MM-dd'),
      time: selectedTime,
      userId: session.user.id
    });

    try {
      const { error } = await supabase
        .from('appointments')
        .insert([
          {
            client_name: session.user.email?.split('@')[0] || 'Unknown',
            client_email: session.user.email,
            date: format(selectedDate, 'yyyy-MM-dd'),
            time: selectedTime,
            user_id: session.user.id
          }
        ]);

      if (error) {
        logger.error('Failed to schedule appointment', { error });
        throw error;
      }

      logger.info('Appointment scheduled successfully', {
        date: format(selectedDate, 'yyyy-MM-dd'),
        time: selectedTime
      });
      
      setShowConfirmation(true);
    } catch (error) {
      alert('Failed to schedule appointment. Please try again.');
    }
  };

  if (showConfirmation && selectedDate) {
    return (
      <AppointmentConfirmation
        date={selectedDate}
        time={selectedTime}
        onBack={() => setShowConfirmation(false)}
      />
    );
  }

  return (
    <div className="w-full">
      <div className="flex items-center gap-4 mb-8">
        {onBack && (
          <button
            onClick={onBack}
            className="p-2 hover:bg-white/10 rounded-full transition-colors"
          >
            <ArrowLeft className="w-6 h-6" />
          </button>
        )}
        <h2 className="text-2xl font-playfair">Schedule Appointment</h2>
      </div>

      <form onSubmit={handleSubmit} className="grid grid-cols-2 gap-8">
        <div className="bg-navy/50 rounded-xl p-6 backdrop-blur-sm">
          <h3 className="font-playfair text-xl mb-4">Select Date</h3>
          <DayPicker
            className="!font-montserrat bg-transparent flex justify-center"
            mode="single"
            fromDate={new Date()}
            selected={selectedDate}
            onSelect={setSelectedDate}
            classNames={{
              head_cell: "text-cream/60 font-normal text-sm",
              cell: "text-center p-0",
              day: "inline-flex h-10 w-10 text-sm items-center justify-center rounded-lg hover:bg-white/10 transition-colors focus:outline-none",
              selected: "bg-dusty-pink text-navy hover:bg-dusty-pink/90",
              today: "text-dusty-pink font-medium",
              nav: "space-x-1 flex items-center",
              nav_button: "p-1 hover:bg-white/10 rounded-lg transition-colors",
              nav_button_previous: "absolute left-1",
              nav_button_next: "absolute right-1",
              caption: "relative flex justify-center items-center h-10",
              root: "flex justify-center w-full"
            }}
            modifiers={{
              disabled: { before: new Date() }
            }}
          />
        </div>

        <div className="bg-navy/50 rounded-xl p-6 backdrop-blur-sm">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-playfair text-xl">Available Times</h3>
            <button type="button" className="text-sm text-cream/60 hover:text-cream">
              See All
            </button>
          </div>
          
          <div className="grid grid-cols-2 gap-3">
            {availableTimes.map((time) => (
              <button
                key={time}
                type="button"
                onClick={() => setSelectedTime(time)}
                className={`p-4 rounded-xl text-left transition-colors ${
                  selectedTime === time
                    ? 'bg-gold text-navy font-medium'
                    : 'bg-white/5 hover:bg-white/10'
                }`}
              >
                <div className="text-sm mb-1">{time.split(' ')[1]}</div>
                <div className="font-medium">{time}</div>
              </button>
            ))}
          </div>

          <button
            type="submit"
            disabled={!selectedDate || !selectedTime}
            className="w-full mt-8 bg-light-blue text-navy font-medium py-4 px-6 rounded-xl hover:bg-opacity-90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Confirm Appointment
          </button>
        </div>
      </form>
    </div>
  );
}