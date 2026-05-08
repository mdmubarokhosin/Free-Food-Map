import { database } from './firebase';
import { ref, get, set, push, update, remove, onValue, increment } from 'firebase/database';
import type {
  Spot, SpotType, Review, FoodEvent, EventData, Donation, DonationData,
  DonationStats, Report, ReportData, TeamMember, TeamMemberData,
  SiteSettings, AppNotification, AppStats
} from '@/types';

// ============================================
// Helper: Parse spot from Firebase snapshot
// ============================================
function parseSpotData(key: string, spot: Record<string, unknown>): Spot {
  const votes = spot.votes as Record<string, unknown> | undefined;
  const positiveVotes = typeof votes?.true === 'number' ? votes.true : 0;
  const negativeVotes = typeof votes?.false === 'number' ? votes.false : 0;

  return {
    id: key,
    name: (spot.name as string) || '',
    type: (spot.type as SpotType) || 'other',
    address: (spot.address as string) || '',
    area: (spot.area as string) || '',
    city: (spot.city as string) || '',
    country: (spot.country as string) || 'বাংলাদেশ',
    lat: (spot.lat as number) || 0,
    lng: (spot.lng as number) || 0,
    openDays: Array.isArray(spot.openDays) ? spot.openDays : [],
    openTime: (spot.openTime as string) || '00:00',
    closeTime: (spot.closeTime as string) || '23:59',
    notes: (spot.notes as string) || null,
    verified: (spot.verified as boolean) || false,
    active: (spot.active as boolean) !== false,
    createdAt: (spot.createdAt as number) || Date.now(),
    lastUpdated: (spot.lastUpdated as number) || Date.now(),
    startDate: (spot.startDate as string) || null,
    endDate: (spot.endDate as string) || null,
    autoDelete: (spot.autoDelete as boolean) || false,
    rating: typeof spot.rating === 'number' ? spot.rating : undefined,
    totalRatings: typeof spot.totalRatings === 'number' ? spot.totalRatings : undefined,
    viewCount: typeof spot.viewCount === 'number' ? spot.viewCount : 0,
    directionCount: typeof spot.directionCount === 'number' ? spot.directionCount : 0,
    positiveVotes,
    negativeVotes,
  };
}

// ============================================
// SPOTS — CRUD + Subscribe
// ============================================
export async function fetchSpots(): Promise<Spot[]> {
  try {
    const spotsRef = ref(database, 'spots');
    const snapshot = await get(spotsRef);
    if (!snapshot.exists()) return [];
    const data = snapshot.val();
    const spots: Spot[] = Object.entries(data).map(([key, value]) =>
      parseSpotData(key, value as Record<string, unknown>)
    );
    return spots.sort((a, b) => b.createdAt - a.createdAt);
  } catch (error) {
    console.error('Error fetching spots:', error);
    return [];
  }
}

export async function fetchSpot(id: string): Promise<Spot | null> {
  try {
    const spotRef = ref(database, `spots/${id}`);
    const snapshot = await get(spotRef);
    if (!snapshot.exists()) return null;
    return parseSpotData(id, snapshot.val() as Record<string, unknown>);
  } catch (error) {
    console.error('Error fetching spot:', error);
    return null;
  }
}

export async function createSpot(spotData: {
  name: string; type: SpotType; address: string; area: string;
  city: string; country: string; lat: number; lng: number;
  openDays: string[]; openTime: string; closeTime: string;
  notes?: string; startDate?: string | null; endDate?: string | null; autoDelete?: boolean;
}): Promise<string> {
  const spotsRef = ref(database, 'spots');
  const newSpotRef = push(spotsRef);
  const now = Date.now();
  await set(newSpotRef, {
    ...spotData,
    verified: false,
    active: true,
    createdAt: now,
    lastUpdated: now,
    votes: { true: 0, false: 0 },
    viewCount: 0,
    directionCount: 0,
  });
  return newSpotRef.key || '';
}

export async function updateSpot(id: string, data: Partial<Spot>): Promise<void> {
  const spotRef = ref(database, `spots/${id}`);
  await update(spotRef, { ...data, lastUpdated: Date.now() });
}

export async function deleteSpot(id: string): Promise<void> {
  const spotRef = ref(database, `spots/${id}`);
  await remove(spotRef);
  // Also delete related reviews
  const reviewsRef = ref(database, `reviews/${id}`);
  await remove(reviewsRef);
}

export async function voteSpot(spotId: string, voteType: 'true' | 'false'): Promise<{ positiveVotes: number; negativeVotes: number }> {
  const voteRef = ref(database, `spots/${spotId}/votes/${voteType}`);
  const snapshot = await get(voteRef);
  const currentCount = (snapshot.val() as number) || 0;
  await set(voteRef, currentCount + 1);

  const [trueSnapshot, falseSnapshot] = await Promise.all([
    get(ref(database, `spots/${spotId}/votes/true`)),
    get(ref(database, `spots/${spotId}/votes/false`)),
  ]);
  const trueCount = (trueSnapshot.val() as number) || 0;
  const falseCount = (falseSnapshot.val() as number) || 0;

  if (trueCount >= 3) {
    await update(ref(database, `spots/${spotId}`), { verified: true, lastUpdated: Date.now() });
  }
  return { positiveVotes: trueCount, negativeVotes: falseCount };
}

export function subscribeToSpots(callback: (spots: Spot[]) => void): () => void {
  const spotsRef = ref(database, 'spots');
  const unsubscribe = onValue(spotsRef, (snapshot) => {
    if (!snapshot.exists()) { callback([]); return; }
    const data = snapshot.val();
    const spots: Spot[] = Object.entries(data).map(([key, value]) =>
      parseSpotData(key, value as Record<string, unknown>)
    );
    spots.sort((a, b) => b.createdAt - a.createdAt);
    callback(spots);
  });
  return () => unsubscribe();
}

// ============================================
// REVIEWS
// ============================================
export async function fetchReviews(spotId: string): Promise<Review[]> {
  try {
    const reviewsRef = ref(database, `reviews/${spotId}`);
    const snapshot = await get(reviewsRef);
    if (!snapshot.exists()) return [];
    const data = snapshot.val();
    return Object.entries(data).map(([key, value]) => ({
      id: key,
      ...(value as Omit<Review, 'id'>),
    })).sort((a, b) => b.createdAt - a.createdAt);
  } catch (error) {
    console.error('Error fetching reviews:', error);
    return [];
  }
}

export async function addReview(spotId: string, review: { userName: string; rating: number; comment: string }): Promise<string> {
  const reviewsRef = ref(database, `reviews/${spotId}`);
  const newReviewRef = push(reviewsRef);
  await set(newReviewRef, {
    ...review,
    spotId,
    createdAt: Date.now(),
  });

  // Update spot rating average
  const allReviews = await fetchReviews(spotId);
  const avgRating = allReviews.reduce((sum, r) => sum + r.rating, 0) / allReviews.length;
  await update(ref(database, `spots/${spotId}`), {
    rating: Math.round(avgRating * 10) / 10,
    totalRatings: allReviews.length,
    lastUpdated: Date.now(),
  });

  return newReviewRef.key || '';
}

export async function deleteReview(spotId: string, reviewId: string): Promise<void> {
  await remove(ref(database, `reviews/${spotId}/${reviewId}`));
  // Recalculate average
  const remaining = await fetchReviews(spotId);
  if (remaining.length > 0) {
    const avg = remaining.reduce((s, r) => s + r.rating, 0) / remaining.length;
    await update(ref(database, `spots/${spotId}`), {
      rating: Math.round(avg * 10) / 10,
      totalRatings: remaining.length,
    });
  } else {
    await update(ref(database, `spots/${spotId}`), { rating: 0, totalRatings: 0 });
  }
}

// ============================================
// EVENTS
// ============================================
export async function fetchEvents(): Promise<FoodEvent[]> {
  try {
    const eventsRef = ref(database, 'events');
    const snapshot = await get(eventsRef);
    if (!snapshot.exists()) return [];
    const data = snapshot.val();
    return Object.entries(data).map(([key, value]) => ({
      id: key,
      ...(value as Omit<FoodEvent, 'id'>),
    })).sort((a, b) => b.createdAt - a.createdAt);
  } catch (error) {
    console.error('Error fetching events:', error);
    return [];
  }
}

export async function fetchEvent(id: string): Promise<FoodEvent | null> {
  try {
    const eventRef = ref(database, `events/${id}`);
    const snapshot = await get(eventRef);
    if (!snapshot.exists()) return null;
    return { id, ...(snapshot.val() as Omit<FoodEvent, 'id'>) };
  } catch (error) { return null; }
}

export async function createEvent(eventData: Omit<FoodEvent, 'id' | 'createdAt' | 'updatedAt'>): Promise<string> {
  const eventsRef = ref(database, 'events');
  const newRef = push(eventsRef);
  const now = Date.now();
  await set(newRef, { ...eventData, createdAt: now, updatedAt: now });
  return newRef.key || '';
}

export async function updateEvent(id: string, data: Partial<FoodEvent>): Promise<void> {
  await update(ref(database, `events/${id}`), { ...data, updatedAt: Date.now() });
}

export async function deleteEvent(id: string): Promise<void> {
  await remove(ref(database, `events/${id}`));
}

// ============================================
// DONATIONS
// ============================================
export async function fetchDonations(): Promise<Donation[]> {
  try {
    const donationsRef = ref(database, 'donations');
    const snapshot = await get(donationsRef);
    if (!snapshot.exists()) return [];
    const data = snapshot.val();
    return Object.entries(data).map(([key, value]) => ({
      id: key,
      ...(value as Omit<Donation, 'id'>),
    })).sort((a, b) => b.createdAt - a.createdAt);
  } catch (error) {
    console.error('Error fetching donations:', error);
    return [];
  }
}

export async function addDonation(donationData: DonationData): Promise<string> {
  const donationsRef = ref(database, 'donations');
  const newRef = push(donationsRef);
  await set(newRef, { ...donationData, createdAt: Date.now() });
  return newRef.key || '';
}

export async function updateDonation(id: string, data: Partial<Donation>): Promise<void> {
  await update(ref(database, `donations/${id}`), data);
}

export async function deleteDonation(id: string): Promise<void> {
  await remove(ref(database, `donations/${id}`));
}

export async function fetchDonationStats(): Promise<DonationStats> {
  try {
    const donations = await fetchDonations();
    const confirmed = donations.filter(d => d.status === 'confirmed');
    return {
      total: confirmed.reduce((s, d) => s + d.amount, 0),
      donors: confirmed.length,
      sponsoredSpots: new Set(confirmed.filter(d => d.spotId).map(d => d.spotId)).size,
    };
  } catch {
    return { total: 0, donors: 0, sponsoredSpots: 0 };
  }
}

// ============================================
// REPORTS
// ============================================
export async function fetchReports(): Promise<Report[]> {
  try {
    const reportsRef = ref(database, 'reports');
    const snapshot = await get(reportsRef);
    if (!snapshot.exists()) return [];
    const data = snapshot.val();
    return Object.entries(data).map(([key, value]) => ({
      id: key,
      ...(value as Omit<Report, 'id'>),
    })).sort((a, b) => b.createdAt - a.createdAt);
  } catch (error) {
    console.error('Error fetching reports:', error);
    return [];
  }
}

export async function submitReport(reportData: ReportData): Promise<string> {
  const reportsRef = ref(database, 'reports');
  const newRef = push(reportsRef);
  const now = Date.now();
  await set(newRef, { ...reportData, status: 'pending', createdAt: now, updatedAt: now });
  return newRef.key || '';
}

export async function updateReport(id: string, data: Partial<Report>): Promise<void> {
  await update(ref(database, `reports/${id}`), { ...data, updatedAt: Date.now() });
}

export async function deleteReport(id: string): Promise<void> {
  await remove(ref(database, `reports/${id}`));
}

// ============================================
// TEAM MEMBERS
// ============================================
export async function fetchTeamMembers(): Promise<TeamMember[]> {
  try {
    const teamRef = ref(database, 'team');
    const snapshot = await get(teamRef);
    if (!snapshot.exists()) return [];
    const data = snapshot.val();
    return Object.entries(data).map(([key, value]) => ({
      id: key,
      ...(value as Omit<TeamMember, 'id'>),
    })).sort((a, b) => a.order - b.order);
  } catch (error) {
    console.error('Error fetching team:', error);
    return [];
  }
}

export async function addTeamMember(memberData: TeamMemberData): Promise<string> {
  const teamRef = ref(database, 'team');
  const newRef = push(teamRef);
  await set(newRef, { ...memberData, createdAt: Date.now() });
  return newRef.key || '';
}

export async function updateTeamMember(id: string, data: Partial<TeamMember>): Promise<void> {
  await update(ref(database, `team/${id}`), data);
}

export async function deleteTeamMember(id: string): Promise<void> {
  await remove(ref(database, `team/${id}`));
}

// ============================================
// SITE SETTINGS
// ============================================
const DEFAULT_SETTINGS: SiteSettings = {
  siteName: 'ফ্রি ফুড ম্যাপ',
  siteDescription: 'বিনামূল্যে খাবার বিতরণের স্থানগুলো খুঁজুন',
  contactEmail: 'info@freefoodmap.com',
  contactPhone: '+8801XXXXXXXXX',
  facebookUrl: 'https://facebook.com/freefoodmap',
  twitterUrl: 'https://twitter.com/freefoodmap',
  donationEnabled: true,
  donationMessage: 'আমাদের সাথে যুক্ত হয়ে দরিদ্রদের খাবার দিন',
  maintenanceMode: false,
  maintenanceMessage: 'রক্ষণাবেক্ষণের কাজ চলছে...',
  mapCenterLat: 23.7596,
  mapCenterLng: 90.379,
  mapZoom: 11,
  defaultCity: 'ঢাকা',
};

export async function fetchSiteSettings(): Promise<SiteSettings> {
  try {
    const settingsRef = ref(database, 'settings/site');
    const snapshot = await get(settingsRef);
    if (!snapshot.exists()) return DEFAULT_SETTINGS;
    return { ...DEFAULT_SETTINGS, ...(snapshot.val() as Partial<SiteSettings>) };
  } catch (error) {
    console.error('Error fetching settings:', error);
    return DEFAULT_SETTINGS;
  }
}

export async function updateSiteSettings(data: Partial<SiteSettings>): Promise<void> {
  await update(ref(database, 'settings/site'), data);
}

// ============================================
// NOTIFICATIONS
// ============================================
export async function fetchNotifications(): Promise<AppNotification[]> {
  try {
    const notifsRef = ref(database, 'notifications');
    const snapshot = await get(notifsRef);
    if (!snapshot.exists()) return [];
    const data = snapshot.val();
    return Object.entries(data).map(([key, value]) => ({
      id: key,
      ...(value as Omit<AppNotification, 'id'>),
    })).sort((a, b) => b.createdAt - a.createdAt);
  } catch {
    return [];
  }
}

export async function createNotification(notification: Omit<AppNotification, 'id' | 'createdAt'>): Promise<string> {
  const notifsRef = ref(database, 'notifications');
  const newRef = push(notifsRef);
  await set(newRef, { ...notification, createdAt: Date.now() });
  return newRef.key || '';
}

export async function deleteNotification(id: string): Promise<void> {
  await remove(ref(database, `notifications/${id}`));
}

// ============================================
// ANALYTICS
// ============================================
export async function incrementViewCount(spotId: string): Promise<void> {
  try {
    const viewRef = ref(database, `spots/${spotId}/viewCount`);
    await set(viewRef, increment(1));
  } catch {}
}

export async function incrementDirectionCount(spotId: string): Promise<void> {
  try {
    const dirRef = ref(database, `spots/${spotId}/directionCount`);
    await set(dirRef, increment(1));
  } catch {}
}

export async function fetchStats(): Promise<AppStats> {
  try {
    const spots = await fetchSpots();
    const totalViews = spots.reduce((s, sp) => s + (sp.viewCount || 0), 0);
    const totalReviews = spots.reduce((s, sp) => s + (sp.totalRatings || 0), 0);
    return {
      totalSpots: spots.length,
      verifiedSpots: spots.filter(s => s.verified).length,
      activeSpots: spots.filter(s => s.active).length,
      totalViews,
      totalReviews,
    };
  } catch {
    return { totalSpots: 0, verifiedSpots: 0, activeSpots: 0, totalViews: 0, totalReviews: 0 };
  }
}

// ============================================
// ADMIN AUTH
// ============================================
export function verifyAdminPassword(password: string): boolean {
  return password === 'admin123';
}

// ============================================
// BULK OPERATIONS
// ============================================
export async function bulkImportSpots(spots: Omit<Spot, 'id'>[]): Promise<number> {
  let imported = 0;
  const spotsRef = ref(database, 'spots');
  for (const spot of spots) {
    const newRef = push(spotsRef);
    await set(newRef, { ...spot, createdAt: Date.now(), lastUpdated: Date.now(), votes: { true: 0, false: 0 }, viewCount: 0, directionCount: 0 });
    imported++;
  }
  return imported;
}

export function exportSpotsToCSV(spots: Spot[]): string {
  const headers = ['id', 'name', 'type', 'address', 'area', 'city', 'lat', 'lng', 'verified', 'active', 'positiveVotes', 'negativeVotes', 'createdAt'];
  const rows = spots.map(s => [s.id, s.name, s.type, s.address, s.area, s.city, s.lat, s.lng, s.verified, s.active, s.positiveVotes, s.negativeVotes, new Date(s.createdAt).toISOString()]);
  return [headers.join(','), ...rows.map(r => r.map(v => `"${v}"`).join(','))].join('\n');
}
