'use client';

import { useState, useEffect } from 'react';

import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { cn } from '@/lib/utils';
import Link from 'next/link';

// Bengali number converter
function toBengaliNumber(num: number | string): string {
  const bengaliDigits = ['০', '১', '২', '৩', '৪', '৫', '৬', '৭', '৮', '৯'];
  return String(num).replace(/[0-9]/g, (d) => bengaliDigits[parseInt(d)]);
}

export type EventType = 'eid_distribution' | 'ramadan_iftar' | 'special_distribution' | 'charitable_program';

export interface Event {
  id: string;
  name: string;
  type: EventType;
  description: string;
  date: string;
  startTime: string;
  endTime: string;
  location: string;
  area: string;
  city: string;
  lat?: number;
  lng?: number;
  spotId?: string;
  organizer: string;
  contactPhone?: string;
  expectedAttendees?: number;
  isActive: boolean;
  createdAt: number;
  updatedAt: number;
}

export const EVENT_TYPE_LABELS: Record<EventType, string> = {
  eid_distribution: 'ঈদ বিতরণ',
  ramadan_iftar: 'রমজান ইফতার',
  special_distribution: 'বিশেষ খাবার বিতরণ',
  charitable_program: 'সেবামূলক কার্যক্রম',
};

export const EVENT_TYPE_COLORS: Record<EventType, { bg: string; text: string; border: string }> = {
  eid_distribution: {
    bg: 'bg-green-100 dark:bg-green-900/30',
    text: 'text-green-700 dark:text-green-300',
    border: 'border-green-200 dark:border-green-800',
  },
  ramadan_iftar: {
    bg: 'bg-amber-100 dark:bg-amber-900/30',
    text: 'text-amber-700 dark:text-amber-300',
    border: 'border-amber-200 dark:border-amber-800',
  },
  special_distribution: {
    bg: 'bg-purple-100 dark:bg-purple-900/30',
    text: 'text-purple-700 dark:text-purple-300',
    border: 'border-purple-200 dark:border-purple-800',
  },
  charitable_program: {
    bg: 'bg-blue-100 dark:bg-blue-900/30',
    text: 'text-blue-700 dark:text-blue-300',
    border: 'border-blue-200 dark:border-blue-800',
  },
};

// Format time in Bengali
function formatTime(time: string): string {
  const [hours, minutes] = time.split(':').map(Number);
  const period = hours >= 12 ? 'অপরাহ্ন' : 'পূর্বাহ্ন';
  const displayHours = hours > 12 ? hours - 12 : hours === 0 ? 12 : hours;
  return `${toBengaliNumber(displayHours)}:${toBengaliNumber(minutes.toString().padStart(2, '0'))} ${period}`;
}

// Format date in Bengali
function formatDateBn(dateStr: string): string {
  const date = new Date(dateStr);
  const days = ['রবিবার', 'সোমবার', 'মঙ্গলবার', 'বুধবার', 'বৃহস্পতিবার', 'শুক্রবার', 'শনিবার'];
  const months = ['জানুয়ারি', 'ফেব্রুয়ারি', 'মার্চ', 'এপ্রিল', 'মে', 'জুন', 'জুলাই', 'আগস্ট', 'সেপ্টেম্বর', 'অক্টোবর', 'নভেম্বর', 'ডিসেম্বর'];
  
  return `${days[date.getDay()]}, ${toBengaliNumber(date.getDate())} ${months[date.getMonth()]} ${toBengaliNumber(date.getFullYear())}`;
}

// Check if event is upcoming
function isUpcoming(date: string): boolean {
  const eventDate = new Date(date);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return eventDate >= today;
}

// Get days until event
function getDaysUntil(date: string): number {
  const eventDate = new Date(date);
  eventDate.setHours(0, 0, 0, 0);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const diff = eventDate.getTime() - today.getTime();
  return Math.ceil(diff / (1000 * 60 * 60 * 24));
}

const EVENT_FAVORITES_KEY = 'free-food-map-event-favorites';

function getEventFavorites(): string[] {
  if (typeof window === 'undefined') return [];
  try {
    const stored = localStorage.getItem(EVENT_FAVORITES_KEY);
    return stored ? JSON.parse(stored) : [];
  } catch {
    return [];
  }
}

interface EventCardProps {
  event: Event;
  className?: string;
}

export default function EventCard({ event, className }: EventCardProps) {
  const [favorites, setFavorites] = useState<string[]>([]);
  const [copied, setCopied] = useState(false);
  const [qrDialogOpen, setQrDialogOpen] = useState(false);

  // Load favorites on mount
  useEffect(() => {
    setFavorites(getEventFavorites());
  }, []);

  const isFavorite = favorites.includes(event.id);
  const upcoming = isUpcoming(event.date);
  const daysUntil = getDaysUntil(event.date);
  const typeColors = EVENT_TYPE_COLORS[event.type];

  const toggleFavorite = () => {
    const current = getEventFavorites();
    let updated: string[];
    if (current.includes(event.id)) {
      updated = current.filter((id) => id !== event.id);
    } else {
      updated = [...current, event.id];
    }
    localStorage.setItem(EVENT_FAVORITES_KEY, JSON.stringify(updated));
    setFavorites(updated);
  };

  const getEventUrl = (): string => {
    if (typeof window !== 'undefined') {
      return `${window.location.origin}/events#${event.id}`;
    }
    return `/events#${event.id}`;
  };

  const getShareText = (): string => {
    return `🎉 ইভেন্ট: ${event.name}
📅 তারিখ: ${formatDateBn(event.date)}
⏰ সময়: ${formatTime(event.startTime)} - ${formatTime(event.endTime)}
📍 স্থান: ${event.location}, ${event.area}, ${event.city}
🔗 ${getEventUrl()}`;
  };

  const shareWhatsApp = () => {
    window.open(`https://wa.me/?text=${encodeURIComponent(getShareText())}`, '_blank');
  };

  const shareFacebook = () => {
    window.open(
      `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(getEventUrl())}`,
      '_blank',
      'width=600,height=400'
    );
  };

  const copyLink = async () => {
    try {
      await navigator.clipboard.writeText(getEventUrl());
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      const textArea = document.createElement('textarea');
      textArea.value = getEventUrl();
      document.body.appendChild(textArea);
      textArea.select();
      document.execCommand('copy');
      document.body.removeChild(textArea);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <>
      <Card
        id={event.id}
        className={cn(
          'transition-all duration-300 hover:shadow-lg rounded-xl border',
          upcoming
            ? 'border-green-100 dark:border-green-700 bg-white dark:bg-gray-800'
            : 'border-gray-100 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50 opacity-75',
          className
        )}
      >
        <CardContent className="p-4">
          {/* Header: Type Badge + Status */}
          <div className="flex items-start justify-between gap-2 mb-3">
            <Badge
              variant="outline"
              className={cn(
                'px-2.5 py-1 text-xs font-medium',
                typeColors.bg,
                typeColors.text,
                typeColors.border
              )}
            >
              {EVENT_TYPE_LABELS[event.type]}
            </Badge>
            <div className="flex items-center gap-1">
              {upcoming && daysUntil <= 7 && (
                <Badge
                  variant="secondary"
                  className={cn(
                    'text-[10px] px-2',
                    daysUntil === 0
                      ? 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300'
                      : 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-300'
                  )}
                >
                  {daysUntil === 0 ? 'আজ' : `${toBengaliNumber(daysUntil)} দিন বাকি`}
                </Badge>
              )}
              {!upcoming && (
                <Badge variant="secondary" className="text-[10px] px-2 bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-400">
                  সম্পন্ন
                </Badge>
              )}
            </div>
          </div>

          {/* Event Name */}
          <h3 className="font-bold text-base sm:text-lg text-foreground mb-2 line-clamp-2">
            {event.name}
          </h3>

          {/* Description */}
          <p className="text-xs sm:text-sm text-muted-foreground mb-3 line-clamp-2">
            {event.description}
          </p>

          {/* Event Details */}
          <div className="space-y-2 mb-3">
            {/* Date */}
            <div className="flex items-center gap-2 text-sm">
              <i className="bi bi-calendar3 text-green-600 dark:text-green-400 text-sm shrink-0"></i>
              <span className="text-foreground font-medium">{formatDateBn(event.date)}</span>
            </div>

            {/* Time */}
            <div className="flex items-center gap-2 text-sm">
              <i className="bi bi-clock text-blue-600 dark:text-blue-400 text-sm shrink-0"></i>
              <span className="text-muted-foreground">
                {formatTime(event.startTime)} - {formatTime(event.endTime)}
              </span>
            </div>

            {/* Location */}
            <div className="flex items-center gap-2 text-sm">
              <i className="bi bi-geo-alt text-red-600 dark:text-red-400 text-sm shrink-0"></i>
              <span className="text-muted-foreground truncate">
                {event.location}, {event.area}, {event.city}
              </span>
            </div>

            {/* Expected Attendees */}
            {event.expectedAttendees && (
              <div className="flex items-center gap-2 text-sm">
                <i className="bi bi-people text-purple-600 dark:text-purple-400 text-sm shrink-0"></i>
                <span className="text-muted-foreground">
                  প্রত্যাশিত অংশগ্রহণকারী: {toBengaliNumber(event.expectedAttendees)} জন
                </span>
              </div>
            )}

            {/* Organizer */}
            <div className="flex items-center gap-2 text-sm">
              <div className="h-4 w-4 shrink-0 rounded-full bg-gradient-to-r from-green-500 to-emerald-500 flex items-center justify-center">
                <span className="text-[8px] text-white font-bold">অ</span>
              </div>
              <span className="text-muted-foreground">
                আয়োজক: <span className="font-medium text-foreground">{event.organizer}</span>
              </span>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-2 pt-2 border-t border-gray-100 dark:border-gray-700">
            {/* Favorite Button */}
            <Button
              variant="ghost"
              size="sm"
              className={cn(
                'h-8 w-8 p-0',
                isFavorite ? 'text-red-500 hover:text-red-600' : 'text-gray-400 hover:text-red-500'
              )}
              onClick={toggleFavorite}
            >
              <i className={`bi ${isFavorite ? 'bi-heart-fill' : 'bi-heart'} text-sm`}></i>
            </Button>

            {/* Share Button */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="sm" className="h-8 w-8 p-0 text-gray-400 hover:text-foreground">
                  <i className="bi bi-share text-sm"></i>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="start" className="w-48">
                <DropdownMenuLabel className="text-center text-xs text-muted-foreground">
                  শেয়ার করুন
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={shareWhatsApp} className="cursor-pointer text-sm">
                  হোয়াটসঅ্যাপ
                </DropdownMenuItem>
                <DropdownMenuItem onClick={shareFacebook} className="cursor-pointer text-sm">
                  ফেসবুক
                </DropdownMenuItem>
                <DropdownMenuItem onClick={copyLink} className="cursor-pointer text-sm">
                  {copied ? 'কপি হয়েছে!' : 'লিংক কপি করুন'}
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setQrDialogOpen(true)} className="cursor-pointer text-sm">
                  কিউআর কোড
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>

            {/* Link to Spot (if related) */}
            {event.spotId && (
              <Link href={`/spot?id=${event.spotId}`}>
                <Button variant="outline" size="sm" className="ml-auto h-8 text-xs gap-1">
                  <i className="bi bi-box-arrow-up-right text-xs"></i>
                  স্পট দেখুন
                </Button>
              </Link>
            )}

            {/* Get Directions */}
            {event.lat && event.lng && (
              <Button
                variant="outline"
                size="sm"
                className={cn('h-8 text-xs', event.spotId ? '' : 'ml-auto')}
                onClick={() => {
                  window.open(
                    `https://www.google.com/maps/dir/?api=1&destination=${event.lat},${event.lng}`,
                    '_blank'
                  );
                }}
              >
                <i className="bi bi-geo-alt text-xs mr-1"></i>
                ডিরেকশন
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      {/* QR Code Dialog */}
      <Dialog open={qrDialogOpen} onOpenChange={setQrDialogOpen}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle className="text-center">কিউআর কোড</DialogTitle>
            <DialogDescription className="text-center">স্ক্যান করে ইভেন্ট দেখুন</DialogDescription>
          </DialogHeader>
          <div className="flex flex-col items-center gap-4 py-4">
            <div className="w-48 h-48 bg-gray-100 dark:bg-gray-800 rounded-xl flex items-center justify-center">
              <div className="text-center text-muted-foreground">
                <div className="text-4xl mb-2">📱</div>
                <p className="text-xs">কিউআর কোড</p>
              </div>
            </div>
            <p className="font-medium text-center">{event.name}</p>
            <Button variant="outline" className="w-full" onClick={copyLink}>
              {copied ? 'কপি হয়েছে!' : 'লিংক কপি করুন'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
