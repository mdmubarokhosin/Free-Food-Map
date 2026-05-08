'use client';

import { useState, useEffect, useMemo } from 'react';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Calendar } from '@/components/ui/calendar';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import EventCard, { Event, EventType, EVENT_TYPE_LABELS, EVENT_TYPE_COLORS } from '@/components/app/EventCard';
import Navbar from '@/components/app/Navbar';
import Footer from '@/components/app/Footer';
import { cn } from '@/lib/utils';
import { getEvents } from '@/lib/services';

// Bengali number converter
function toBengaliNumber(num: number | string): string {
  const bengaliDigits = ['০', '১', '২', '৩', '৪', '৫', '৬', '৭', '৮', '৯'];
  return String(num).replace(/[0-9]/g, (d) => bengaliDigits[parseInt(d)]);
}

// Bengali month names
const BENGALI_MONTHS = [
  'জানুয়ারি', 'ফেব্রুয়ারি', 'মার্চ', 'এপ্রিল', 'মে', 'জুন',
  'জুলাই', 'আগস্ট', 'সেপ্টেম্বর', 'অক্টোবর', 'নভেম্বর', 'ডিসেম্বর'
];

const BENGALI_DAYS = ['রবি', 'সোম', 'মঙ্গল', 'বুধ', 'বৃহঃ', 'শুক্র', 'শনি'];

export default function EventsPage() {
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState<'calendar' | 'list'>('list');
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(new Date());
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [filterType, setFilterType] = useState<string>('all');
  const [filterCity, setFilterCity] = useState<string>('all');
  const [showUpcomingOnly, setShowUpcomingOnly] = useState(true);

  // Fetch events
  useEffect(() => {
    const fetchEvents = async () => {
      try {
        setLoading(true);
        const data = await getEvents({
          type: filterType,
          city: filterCity,
          upcoming: showUpcomingOnly,
        });
        
        if (data.success) {
          setEvents(data.events || []);
        }
      } catch (error) {
        console.error('Error fetching events:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchEvents();
  }, [filterType, filterCity, showUpcomingOnly]);

  // Get unique cities from events
  const cities = useMemo(() => {
    const uniqueCities = [...new Set(events.map((e) => e.city))];
    return uniqueCities.sort();
  }, [events]);

  // Get events for selected date (use local timezone, not UTC)
  const selectedDateEvents = useMemo(() => {
    if (!selectedDate) return [];
    const y = selectedDate.getFullYear();
    const m = String(selectedDate.getMonth() + 1).padStart(2, '0');
    const d = String(selectedDate.getDate()).padStart(2, '0');
    const dateStr = `${y}-${m}-${d}`;
    return events.filter((e) => e.date === dateStr);
  }, [events, selectedDate]);

  // Get events with dates for calendar markers
  const eventDates = useMemo(() => {
    return events.map((e) => new Date(e.date));
  }, [events]);

  // Get events grouped by date for list view
  const eventsByDate = useMemo(() => {
    const grouped: Record<string, Event[]> = {};
    events.forEach((event) => {
      if (!grouped[event.date]) {
        grouped[event.date] = [];
      }
      grouped[event.date].push(event);
    });
    return grouped;
  }, [events]);

  // Sorted dates
  const sortedDates = useMemo(() => {
    return Object.keys(eventsByDate).sort((a, b) => 
      new Date(a).getTime() - new Date(b).getTime()
    );
  }, [eventsByDate]);

  // Format date for display
  const formatDateHeader = (dateStr: string) => {
    const date = new Date(dateStr);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const eventDate = new Date(dateStr);
    eventDate.setHours(0, 0, 0, 0);
    
    const diff = eventDate.getTime() - today.getTime();
    const daysDiff = Math.ceil(diff / (1000 * 60 * 60 * 24));
    
    const dayName = ['রবিবার', 'সোমবার', 'মঙ্গলবার', 'বুধবার', 'বৃহস্পতিবার', 'শুক্রবার', 'শনিবার'][date.getDay()];
    
    let relativeDay = '';
    if (daysDiff === 0) relativeDay = '(আজ)';
    else if (daysDiff === 1) relativeDay = '(আগামীকাল)';
    else if (daysDiff > 1 && daysDiff <= 7) relativeDay = `(${toBengaliNumber(daysDiff)} দিন পর)`;
    
    return `${dayName}, ${toBengaliNumber(date.getDate())} ${BENGALI_MONTHS[date.getMonth()]} ${toBengaliNumber(date.getFullYear())} ${relativeDay}`;
  };

  // Navigate months
  const goToPreviousMonth = () => {
    setCurrentMonth((prev) => new Date(prev.getFullYear(), prev.getMonth() - 1, 1));
  };

  const goToNextMonth = () => {
    setCurrentMonth((prev) => new Date(prev.getFullYear(), prev.getMonth() + 1, 1));
  };

  // Helper to format date as YYYY-MM-DD in local timezone
  const toLocalDateString = (date: Date): string => {
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, '0');
    const d = String(date.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
  };

  // Check if date has events
  const hasEventsOnDate = (date: Date) => {
    const dateStr = toLocalDateString(date);
    return events.some((e) => e.date === dateStr);
  };

  // Get events count for date
  const getEventsCountForDate = (date: Date) => {
    const dateStr = toLocalDateString(date);
    return events.filter((e) => e.date === dateStr).length;
  };

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-b from-green-50 to-white dark:from-gray-900 dark:to-gray-800">
      <Navbar onAddSpot={() => {}} compact />

      <main className="flex-1 container mx-auto px-3 sm:px-4 py-6 max-w-6xl">
        {/* Header */}
        <div className="mb-6">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-green-100 dark:bg-green-900/30 rounded-xl">
              <i className="bi bi-calendar3 text-2xl text-green-600 dark:text-green-400"></i>
            </div>
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold text-foreground">
                ইভেন্ট ক্যালেন্ডার
              </h1>
              <p className="text-sm text-muted-foreground">
                বিশেষ খাবার বিতরণ ও সেবামূলক কর্মসূচি
              </p>
            </div>
          </div>
        </div>

        {/* Filters */}
        <Card className="mb-6 border-green-100 dark:border-green-800">
          <CardContent className="p-4">
            <div className="flex flex-col sm:flex-row sm:flex-wrap items-stretch sm:items-center gap-2 sm:gap-3">
              {/* View Toggle */}
              <Tabs value={view} onValueChange={(v) => setView(v as 'calendar' | 'list')} className="w-full sm:w-auto">
                <TabsList className="bg-gray-100 dark:bg-gray-800 h-9 w-full sm:w-auto">
                  <TabsTrigger value="list" className="text-xs px-3 h-7 flex-1 sm:flex-none data-[state=active]:bg-white dark:data-[state=active]:bg-gray-700">
                    <i className="bi bi-list-ul text-sm mr-1"></i>
                    তালিকা
                  </TabsTrigger>
                  <TabsTrigger value="calendar" className="text-xs px-3 h-7 flex-1 sm:flex-none data-[state=active]:bg-white dark:data-[state=active]:bg-gray-700">
                    <i className="bi bi-calendar text-sm mr-1"></i>
                    ক্যালেন্ডার
                  </TabsTrigger>
                </TabsList>
              </Tabs>

              <div className="h-6 w-px bg-gray-200 dark:bg-gray-700 hidden sm:block" />

              {/* Type Filter */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" size="sm" className="h-9 text-xs gap-1.5 w-full sm:w-auto">
                    <i className="bi bi-funnel text-sm"></i>
                    ধরন: {filterType === 'all' ? 'সব' : EVENT_TYPE_LABELS[filterType as EventType]}
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="start" className="w-56">
                  <DropdownMenuLabel>ইভেন্টের ধরন</DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <div className="p-1">
                    <Button
                      variant={filterType === 'all' ? 'secondary' : 'ghost'}
                      size="sm"
                      className="w-full justify-start text-xs h-8"
                      onClick={() => setFilterType('all')}
                    >
                      সব ধরনের ইভেন্ট
                    </Button>
                    {Object.entries(EVENT_TYPE_LABELS).map(([type, label]) => (
                      <Button
                        key={type}
                        variant={filterType === type ? 'secondary' : 'ghost'}
                        size="sm"
                        className="w-full justify-start text-xs h-8 gap-2"
                        onClick={() => setFilterType(type)}
                      >
                        <div className={cn(
                          'w-2 h-2 rounded-full',
                          EVENT_TYPE_COLORS[type as EventType].bg.replace('bg-', 'bg-')
                        )} />
                        {label}
                      </Button>
                    ))}
                  </div>
                </DropdownMenuContent>
              </DropdownMenu>

              {/* City Filter */}
              <Select value={filterCity} onValueChange={setFilterCity}>
                <SelectTrigger className="w-full sm:w-[140px] h-9 text-xs">
                  <SelectValue placeholder="শহর" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">সব শহর</SelectItem>
                  {cities.map((city) => (
                    <SelectItem key={city} value={city}>
                      {city}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              {/* Upcoming Toggle */}
              <Button
                variant={showUpcomingOnly ? 'default' : 'outline'}
                size="sm"
                className={cn(
                  'h-9 text-xs w-full sm:w-auto',
                  showUpcomingOnly && 'bg-green-600 hover:bg-green-700'
                )}
                onClick={() => setShowUpcomingOnly(!showUpcomingOnly)}
              >
                আসন্ন ইভেন্ট
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Content */}
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <i className="bi bi-arrow-repeat text-3xl animate-spin text-green-600"></i>
            <span className="ml-2 text-muted-foreground">লোড হচ্ছে...</span>
          </div>
        ) : events.length === 0 ? (
          <Card className="border-dashed">
            <CardContent className="py-12 text-center">
              <i className="bi bi-calendar3 text-5xl mx-auto text-muted-foreground mb-4"></i>
              <h3 className="text-lg font-medium mb-2">কোনো ইভেন্ট পাওয়া যায়নি</h3>
              <p className="text-sm text-muted-foreground">
                ফিল্টার পরিবর্তন করে আবার চেষ্টা করুন
              </p>
            </CardContent>
          </Card>
        ) : view === 'calendar' ? (
          /* Calendar View */
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Calendar */}
            <Card className="lg:col-span-2 border-green-100 dark:border-green-800">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg">
                    {toBengaliNumber(currentMonth.getFullYear())} সালের {BENGALI_MONTHS[currentMonth.getMonth()]}
                  </CardTitle>
                  <div className="flex items-center gap-1">
                    <Button variant="ghost" size="icon" className="h-8 w-8" onClick={goToPreviousMonth}>
                      <i className="bi bi-chevron-left text-base"></i>
                    </Button>
                    <Button variant="ghost" size="icon" className="h-8 w-8" onClick={goToNextMonth}>
                      <i className="bi bi-chevron-right text-base"></i>
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <Calendar
                  mode="single"
                  selected={selectedDate}
                  onSelect={setSelectedDate}
                  month={currentMonth}
                  onMonthChange={setCurrentMonth}
                  className="rounded-md border-0 w-full"
                  formatters={{
                    formatWeekdayName: (date) => BENGALI_DAYS[date.getDay()],
                    formatCaption: (date) => `${BENGALI_MONTHS[date.getMonth()]} ${toBengaliNumber(date.getFullYear())}`,
                  }}
                  modifiers={{
                    hasEvent: eventDates,
                  }}
                  modifiersStyles={{
                    hasEvent: {
                      backgroundColor: 'rgb(22 163 74 / 0.1)',
                      borderRadius: '8px',
                    },
                  }}
                />
              </CardContent>
            </Card>

            {/* Selected Date Events */}
            <Card className="border-green-100 dark:border-green-800">
              <CardHeader className="pb-3">
                <CardTitle className="text-base">
                  {selectedDate ? formatDateHeader(toLocalDateString(selectedDate)) : 'তারিখ নির্বাচন করুন'}
                </CardTitle>
              </CardHeader>
              <CardContent>
                {selectedDateEvents.length === 0 ? (
                  <div className="text-center py-6 text-muted-foreground text-sm">
                    এই দিনে কোনো ইভেন্ট নেই
                  </div>
                ) : (
                  <div className="space-y-3 max-h-[500px] overflow-y-auto pr-1 custom-scrollbar">
                    {selectedDateEvents.map((event) => (
                      <EventCard key={event.id} event={event} />
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        ) : (
          /* List View */
          <div className="space-y-6">
            {sortedDates.map((date) => (
              <div key={date}>
                {/* Date Header */}
                <div className="flex items-center gap-3 mb-3 sticky top-0 bg-gradient-to-b from-green-50 via-green-50 to-transparent dark:from-gray-900 dark:via-gray-900 dark:to-transparent z-10 py-2">
                  <div className="flex items-center justify-center w-12 h-12 rounded-xl bg-gradient-to-br from-green-500 to-emerald-600 text-white font-bold shadow-lg">
                    {toBengaliNumber(new Date(date).getDate())}
                  </div>
                  <div>
                    <h3 className="font-semibold text-foreground">
                      {formatDateHeader(date)}
                    </h3>
                    <p className="text-xs text-muted-foreground">
                      {toBengaliNumber(eventsByDate[date].length)}টি ইভেন্ট
                    </p>
                  </div>
                </div>

                {/* Events Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 pl-0 sm:pl-16">
                  {eventsByDate[date].map((event) => (
                    <EventCard key={event.id} event={event} />
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Event Type Legend */}
        <Card className="mt-8 border-green-100 dark:border-green-800">
          <CardContent className="p-4">
            <h4 className="text-sm font-medium mb-3">ইভেন্টের ধরন</h4>
            <div className="flex flex-wrap gap-3">
              {Object.entries(EVENT_TYPE_LABELS).map(([type, label]) => (
                <Badge
                  key={type}
                  variant="outline"
                  className={cn(
                    'px-3 py-1.5 text-xs font-medium',
                    EVENT_TYPE_COLORS[type as EventType].bg,
                    EVENT_TYPE_COLORS[type as EventType].text,
                    EVENT_TYPE_COLORS[type as EventType].border
                  )}
                >
                  {label}
                </Badge>
              ))}
            </div>
          </CardContent>
        </Card>
      </main>

      <Footer standard />

      {/* Custom Scrollbar Styles */}
      <style jsx global>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 6px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: transparent;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: #d1d5db;
          border-radius: 3px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: #9ca3af;
        }
        .dark .custom-scrollbar::-webkit-scrollbar-thumb {
          background: #4b5563;
        }
        .dark .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: #6b7280;
        }
      `}</style>
    </div>
  );
}
