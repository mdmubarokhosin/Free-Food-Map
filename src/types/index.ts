// ============================================
// Free Food Map — Complete Type Definitions
// ============================================

// --- Spot Types ---
export type SpotType = 'daily_meal' | 'weekly_meal' | 'grocery' | 'soup_kitchen' | 'other';

export interface Spot {
  id: string;
  name: string;
  type: SpotType;
  address: string;
  area: string;
  city: string;
  country: string;
  lat: number;
  lng: number;
  openDays: string[];
  openTime: string;
  closeTime: string;
  notes: string | null;
  image?: string | null;
  verified: boolean;
  active: boolean;
  createdAt: number;
  lastUpdated: number;
  startDate?: string | null;
  endDate?: string | null;
  autoDelete: boolean;
  rating?: number;
  totalRatings?: number;
  viewCount?: number;
  directionCount?: number;
  positiveVotes: number;
  negativeVotes: number;
}

// --- Reviews ---
export interface Review {
  id: string;
  spotId: string;
  userName: string;
  rating: number;
  comment: string;
  createdAt: number;
}

// --- Events ---
export interface FoodEvent {
  id: string;
  title: string;
  description: string;
  date: string;
  endDate?: string | null;
  time: string;
  location: string;
  address: string;
  lat: number;
  lng: number;
  organizer: string;
  contactPhone?: string;
  foodType: string;
  estimatedPeople?: number;
  status: 'upcoming' | 'ongoing' | 'completed' | 'cancelled';
  image?: string;
  createdAt: number;
  updatedAt: number;
}

export type EventData = Omit<FoodEvent, 'id' | 'createdAt' | 'updatedAt'>;

// --- Donations ---
export interface Donation {
  id: string;
  donorName: string;
  donorPhone?: string;
  amount: number;
  currency: string;
  method: string;
  spotId?: string;
  spotName?: string;
  message?: string;
  status: 'pending' | 'confirmed' | 'processing';
  transactionId?: string;
  createdAt: number;
}

export type DonationData = Omit<Donation, 'id' | 'createdAt'>;

export interface DonationStats {
  total: number;
  donors: number;
  sponsoredSpots: number;
}

// --- Reports ---
export interface Report {
  id: string;
  spotId: string;
  spotName: string;
  type: string;
  description: string;
  reporterName?: string;
  reporterContact?: string;
  status: 'pending' | 'reviewing' | 'resolved' | 'dismissed';
  adminNotes?: string;
  createdAt: number;
  updatedAt: number;
}

export type ReportData = Omit<Report, 'id' | 'status' | 'adminNotes' | 'createdAt' | 'updatedAt'>;

// --- Team Members ---
export interface TeamMember {
  id: string;
  name: string;
  role: string;
  bio?: string;
  avatar?: string;
  phone?: string;
  email?: string;
  social?: {
    facebook?: string;
    twitter?: string;
    github?: string;
    linkedin?: string;
  };
  order: number;
  active: boolean;
  createdAt: number;
}

export type TeamMemberData = Omit<TeamMember, 'id' | 'createdAt'>;

// --- Site Settings ---
export interface SiteSettings {
  siteName: string;
  siteDescription: string;
  contactEmail: string;
  contactPhone: string;
  facebookUrl: string;
  twitterUrl: string;
  donationEnabled: boolean;
  donationMessage: string;
  maintenanceMode: boolean;
  maintenanceMessage: string;
  mapCenterLat: number;
  mapCenterLng: number;
  mapZoom: number;
  defaultCity: string;
}

// --- Notifications ---
export interface AppNotification {
  id: string;
  title: string;
  message: string;
  type: 'info' | 'warning' | 'success' | 'urgent';
  active: boolean;
  createdAt: number;
  expiresAt?: number;
}

// --- Analytics ---
export interface AppStats {
  totalSpots: number;
  verifiedSpots: number;
  activeSpots: number;
  totalViews: number;
  totalReviews: number;
}

// --- Nearby Places ---
export interface NearbyPlace {
  name: string;
  address: string;
  lat: number;
  lng: number;
  distance: number;
  types?: string[];
}

export interface UserLocation {
  lat: number;
  lng: number;
  accuracy: number;
}

// --- Status Monitoring Types ---
export interface ServiceStatus {
  name: string;
  status: 'operational' | 'degraded' | 'down';
  responseTime: number;
  lastCheck: string;
  uptime: number;
}

export interface StatusCheck {
  id: string;
  timestamp: string;
  responseTime: number;
  status: 'ok' | 'error' | 'timeout';
  statusCode?: number;
}

export interface UptimeData {
  date: string;
  uptime: number;
  totalChecks: number;
  successfulChecks: number;
}

export interface ResponseTimeData {
  timestamp: string;
  responseTime: number;
}

export interface Incident {
  id: string;
  title: string;
  status: 'investigating' | 'identified' | 'monitoring' | 'resolved';
  createdAt: string;
  resolvedAt?: string;
  description: string;
  updates: IncidentUpdate[];
}

export interface IncidentUpdate {
  timestamp: string;
  message: string;
  status: string;
}

export interface SSLCertificate {
  valid: boolean;
  hostname: string;
  issuer: string;
  protocol: string;
  validFrom: string;
  validTo: string;
  lastChecked: string;
}

export interface ComprehensiveStatus {
  systemStatus: 'operational' | 'degraded' | 'partial_outage' | 'major_outage';
  lastCheck: string;
  uptime: number;
  avgResponseTime: number;
  totalChecks: number;
  services: ServiceStatus[];
  uptimeHistory: UptimeData[];
  responseTimeHistory: ResponseTimeData[];
  recentChecks: StatusCheck[];
  incidents: Incident[];
  ssl: SSLCertificate;
  appStats: {
    totalSpots: number;
    verifiedSpots: number;
    activeSpots: number;
    newSpots: number;
    totalViews: number;
    totalReviews: number;
  };
}

export interface SystemStatus {
  totalSpots: number;
  verifiedSpots: number;
  activeSpots: number;
  newSpots: number;
  lastUpdated: string | null;
  systemStatus: string;
  totalViews?: number;
  totalReviews?: number;
  expiredSpots?: number;
}

// --- Category Config ---
export const SPOT_TYPE_CONFIG: Record<SpotType, { label: string; labelEn: string; emoji: string; color: string }> = {
  daily_meal: { label: 'দৈনিক খাবার', labelEn: 'Daily Meal', emoji: '🍛', color: '#e74c3c' },
  weekly_meal: { label: 'সাপ্তাহিক খাবার', labelEn: 'Weekly Meal', emoji: '🍚', color: '#27ae60' },
  grocery: { label: 'গ্রোসারি সহায়তা', labelEn: 'Grocery', emoji: '🥬', color: '#f39c12' },
  soup_kitchen: { label: 'স্যুপ কিচেন', labelEn: 'Soup Kitchen', emoji: '🍽️', color: '#f1c40f' },
  other: { label: 'অন্যান্য', labelEn: 'Other', emoji: '🍲', color: '#34495e' },
};

export const SPOT_TYPE_LABELS: Record<SpotType, string> = {
  daily_meal: 'দৈনিক খাবার',
  weekly_meal: 'সাপ্তাহিক খাবার',
  grocery: 'গ্রোসারি সহায়তা',
  soup_kitchen: 'স্যুপ কিচেন',
  other: 'অন্যান্য',
};

export const SPOT_EMOJIS: Record<SpotType, string> = {
  daily_meal: '🍛',
  weekly_meal: '🍚',
  grocery: '🥬',
  soup_kitchen: '🍽️',
  other: '🍲',
};

export const SPOT_COLORS: Record<SpotType, string> = {
  daily_meal: '#e74c3c',
  weekly_meal: '#27ae60',
  grocery: '#f39c12',
  soup_kitchen: '#f1c40f',
  other: '#34495e',
};

export const DAY_LABELS: Record<string, string> = {
  sunday: 'রবিবার',
  monday: 'সোমবার',
  tuesday: 'মঙ্গলবার',
  wednesday: 'বুধবার',
  thursday: 'বৃহস্পতিবার',
  friday: 'শুক্রবার',
  saturday: 'শনিবার',
};

export const DAY_SHORT_LABELS: Record<string, string> = {
  sunday: 'রবি',
  monday: 'সোম',
  tuesday: 'মঙ্গল',
  wednesday: 'বুধ',
  thursday: 'বৃহঃ',
  friday: 'শুক্র',
  saturday: 'শনি',
};

export const DAY_ORDER = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
