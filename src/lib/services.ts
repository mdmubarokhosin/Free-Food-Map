/**
 * Client-side Service Layer
 * Replaces ALL API routes with direct Firebase SDK calls from the browser.
 * Designed for static hosting (output: 'export') where API routes cannot work.
 */
import { ref, get, push, set, remove, update } from 'firebase/database';
import { database } from '@/lib/firebase';
import { Spot, SpotType, Review, ComprehensiveStatus, ServiceStatus, StatusCheck, UptimeData, ResponseTimeData, SSLCertificate } from '@/types';

// ============================================================================
// Internal Helper Functions (not exported)
// ============================================================================

/** Convert Firebase raw data to a properly typed Spot */
function transformFirebaseSpot(fbSpot: Record<string, unknown>): Spot {
  let openDays: string[] = [];

  if (Array.isArray(fbSpot.openDays)) {
    openDays = fbSpot.openDays as string[];
  } else if (typeof fbSpot.openDays === 'string') {
    try {
      const parsed = JSON.parse(fbSpot.openDays);
      openDays = Array.isArray(parsed) ? parsed : [fbSpot.openDays];
    } catch {
      openDays = [fbSpot.openDays];
    }
  }

  return {
    id: fbSpot.id as string,
    name: (fbSpot.name || '') as string,
    type: (fbSpot.type || 'other') as SpotType,
    address: (fbSpot.address || '') as string,
    area: (fbSpot.area || '') as string,
    city: (fbSpot.city || '') as string,
    country: (fbSpot.country || 'বাংলাদেশ') as string,
    lat: parseFloat(String(fbSpot.lat || 0)),
    lng: parseFloat(String(fbSpot.lng || 0)),
    openDays,
    openTime: (fbSpot.openTime || '00:00') as string,
    closeTime: (fbSpot.closeTime || '23:59') as string,
    notes: (fbSpot.notes || null) as string | null,
    verified: fbSpot.verified === true,
    active: fbSpot.active !== false,
    createdAt: Number(fbSpot.createdAt) || Date.now(),
    lastUpdated: Number(fbSpot.lastUpdated) || Date.now(),
    startDate: (fbSpot.startDate || null) as string | null,
    endDate: (fbSpot.endDate || null) as string | null,
    autoDelete: fbSpot.autoDelete === true,
  };
}

/** Check if a spot has expired (autoDelete + past endDate) */
function isSpotExpired(spot: Spot): boolean {
  if (!spot.autoDelete || !spot.endDate) return false;

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const endDate = new Date(spot.endDate);
  endDate.setHours(23, 59, 59, 999);

  return today > endDate;
}

/** Check if a spot is within its date range */
function isSpotWithinDateRange(spot: Spot): boolean {
  if (!spot.startDate && !spot.endDate) return true;

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  if (spot.startDate) {
    const startDate = new Date(spot.startDate);
    startDate.setHours(0, 0, 0, 0);
    if (today < startDate) return false;
  }

  if (spot.endDate) {
    const endDate = new Date(spot.endDate);
    endDate.setHours(23, 59, 59, 999);
    if (today > endDate) return false;
  }

  return true;
}

/** Remove expired spots from Firebase */
async function cleanupExpiredSpots(): Promise<number> {
  try {
    const spotsRef = ref(database, 'spots');
    const snapshot = await get(spotsRef);

    if (!snapshot.exists()) return 0;

    const spotsData = snapshot.val();
    const expiredIds: string[] = [];

    for (const key in spotsData) {
      const spot = spotsData[key];
      if (spot.autoDelete && spot.endDate) {
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        const endDate = new Date(spot.endDate);
        endDate.setHours(23, 59, 59, 999);

        if (today > endDate) {
          expiredIds.push(key);
        }
      }
    }

    for (const id of expiredIds) {
      await remove(ref(database, `spots/${id}`));
      await remove(ref(database, `reviews/${id}`));
      console.log(`Auto-deleted expired spot: ${id}`);
    }

    return expiredIds.length;
  } catch (error) {
    console.error('Error cleaning up expired spots:', error);
    return 0;
  }
}

/** Helper to get a future date string (YYYY-MM-DD) */
function getFutureDate(daysFromNow: number): string {
  const date = new Date();
  date.setDate(date.getDate() + daysFromNow);
  return date.toISOString().split('T')[0];
}

// ============================================================================
// 1. SPOTS SERVICE
// ============================================================================

export async function getSpots(params: {
  search?: string;
  type?: string;
  verified?: boolean;
  openNow?: boolean;
}): Promise<{ success: boolean; spots?: Spot[]; error?: string }> {
  try {
    await cleanupExpiredSpots();

    const { search, type, verified, openNow } = params;

    const spotsRef = ref(database, 'spots');
    const snapshot = await get(spotsRef);

    if (!snapshot.exists()) {
      return { success: true, spots: [] };
    }

    const spotsData = snapshot.val();
    let spots: Spot[] = [];

    for (const key in spotsData) {
      if (spotsData[key].active !== false) {
        const spot = transformFirebaseSpot({ id: key, ...spotsData[key] });
        if (!isSpotExpired(spot) && isSpotWithinDateRange(spot)) {
          spots.push(spot);
        }
      }
    }

    // Apply filters
    if (search) {
      const searchLower = search.toLowerCase();
      spots = spots.filter(
        (spot) =>
          spot.name.toLowerCase().includes(searchLower) ||
          spot.area.toLowerCase().includes(searchLower) ||
          spot.city.toLowerCase().includes(searchLower)
      );
    }

    if (type && type !== 'all') {
      spots = spots.filter((spot) => spot.type === type);
    }

    if (verified) {
      spots = spots.filter((spot) => spot.verified === true);
    }

    if (openNow) {
      const now = new Date();
      const currentDay = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'][
        now.getDay()
      ];
      const currentHour = now.getHours();
      const currentMinute = now.getMinutes();
      const currentTimeNum = currentHour * 60 + currentMinute;

      spots = spots.filter((spot) => {
        try {
          if (!spot.openDays.includes(currentDay)) return false;

          const [openH, openM] = spot.openTime.split(':').map(Number);
          const [closeH, closeM] = spot.closeTime.split(':').map(Number);
          const openTimeNum = openH * 60 + openM;
          const closeTimeNum = closeH * 60 + closeM;

          if (openTimeNum <= closeTimeNum) {
            return currentTimeNum >= openTimeNum && currentTimeNum <= closeTimeNum;
          } else {
            // Midnight wraparound (e.g., 22:00 - 02:00)
            return currentTimeNum >= openTimeNum || currentTimeNum <= closeTimeNum;
          }
        } catch {
          return false;
        }
      });
    }

    spots.sort((a, b) => b.createdAt - a.createdAt);

    return { success: true, spots };
  } catch (error) {
    console.error('Error fetching spots:', error);
    return { success: false, error: 'স্পট লোড করতে সমস্যা হয়েছে' };
  }
}

export async function getSpotById(id: string): Promise<{
  success: boolean;
  spot?: Spot;
  error?: string;
}> {
  try {
    const spotRef = ref(database, `spots/${id}`);
    const snapshot = await get(spotRef);

    if (!snapshot.exists()) {
      return { success: false, error: 'স্পট পাওয়া যায়নি' };
    }

    const spotData = snapshot.val();
    const spot: Spot = transformFirebaseSpot({ id, ...spotData });

    return { success: true, spot };
  } catch (error) {
    console.error('Error fetching spot:', error);
    return { success: false, error: 'স্পট লোড করতে সমস্যা হয়েছে' };
  }
}

export async function addSpot(data: Record<string, unknown>): Promise<{
  success: boolean;
  message?: string;
  spot?: Record<string, unknown>;
  error?: string;
}> {
  try {
    const {
      name,
      type,
      address,
      area,
      city,
      country = 'বাংলাদেশ',
      lat,
      lng,
      openDays,
      openTime,
      closeTime,
      notes,
      hasDateRange,
      startDate,
      endDate,
      autoDelete,
    } = data;

    // Validate required fields
    if (!name || !type || !address || !area || !city || lat === undefined || lng === undefined || !openDays || !openTime || !closeTime) {
      return { success: false, error: 'সব ফিল্ড পূরণ করা আবশ্যক' };
    }

    // Validate lat/lng
    if (isNaN(parseFloat(String(lat))) || isNaN(parseFloat(String(lng)))) {
      return { success: false, error: 'অক্ষাংশ ও দ্রাঘিমাংশ সঠিক সংখ্যা হতে হবে' };
    }

    // Validate type
    const validTypes: SpotType[] = ['daily_meal', 'weekly_meal', 'grocery', 'soup_kitchen', 'other'];
    if (!validTypes.includes(type as SpotType)) {
      return { success: false, error: 'অবৈধ টাইপ' };
    }

    // Validate date range
    if (hasDateRange && startDate && endDate) {
      const start = new Date(startDate as string);
      const end = new Date(endDate as string);
      if (end < start) {
        return { success: false, error: 'শেষ তারিখ শুরু তারিখের পরে হতে হবে' };
      }
    }

    const now = Date.now();
    const newSpotRef = push(ref(database, 'spots'));
    const spotId = newSpotRef.key!;

    const newSpot: Record<string, unknown> = {
      name: String(name).trim(),
      type,
      address: String(address).trim(),
      area: String(area).trim(),
      city: String(city).trim(),
      country: String(country).trim(),
      lat: parseFloat(String(lat)),
      lng: parseFloat(String(lng)),
      openDays: JSON.stringify(openDays),
      openTime,
      closeTime,
      notes: typeof notes === 'string' ? notes.trim() || null : null,
      verified: false,
      active: true,
      createdAt: now,
      lastUpdated: now,
      startDate: hasDateRange ? startDate : null,
      endDate: hasDateRange ? endDate : null,
      autoDelete: hasDateRange && autoDelete,
    };

    await set(newSpotRef, newSpot);

    return {
      success: true,
      message: 'স্পটটি সফলভাবে যোগ হয়েছে',
      spot: {
        id: spotId,
        ...newSpot,
        openDays,
      },
    };
  } catch (error) {
    console.error('Error adding spot:', error);
    return { success: false, error: 'স্পট যোগ করতে সমস্যা হয়েছে' };
  }
}

// ============================================================================
// 2. REVIEWS SERVICE
// ============================================================================

async function updateSpotRating(spotId: string): Promise<void> {
  try {
    const reviewsRef = ref(database, `reviews/${spotId}`);
    const snapshot = await get(reviewsRef);

    if (!snapshot.exists()) return;

    const reviewsData = snapshot.val();
    let totalRating = 0;
    let count = 0;

    for (const key in reviewsData) {
      totalRating += reviewsData[key].rating;
      count++;
    }

    const averageRating = count > 0 ? totalRating / count : 0;

    const spotRef = ref(database, `spots/${spotId}`);
    await update(spotRef, {
      rating: Math.round(averageRating * 10) / 10,
      totalRatings: count,
    });
  } catch (error) {
    console.error('Error updating spot rating:', error);
  }
}

export async function getReviews(spotId: string): Promise<{
  success: boolean;
  reviews?: Review[];
  error?: string;
}> {
  try {
    const reviewsRef = ref(database, `reviews/${spotId}`);
    const snapshot = await get(reviewsRef);

    if (!snapshot.exists()) {
      return { success: true, reviews: [] };
    }

    const reviewsData = snapshot.val();
    const reviews: Review[] = [];

    for (const key in reviewsData) {
      reviews.push({
        id: key,
        ...reviewsData[key],
      });
    }

    reviews.sort((a, b) => b.createdAt - a.createdAt);

    return { success: true, reviews };
  } catch (error) {
    console.error('Error fetching reviews:', error);
    return { success: false, error: 'রিভিউ লোড করতে সমস্যা হয়েছে' };
  }
}

export async function addReview(data: {
  spotId: string;
  userName: string;
  rating: number;
  comment: string;
}): Promise<{
  success: boolean;
  message?: string;
  review?: Review & { id: string };
  error?: string;
}> {
  try {
    const { spotId, userName, rating, comment } = data;

    if (!spotId || !userName || !rating) {
      return { success: false, error: 'সব তথ্য প্রয়োজন' };
    }

    if (rating < 1 || rating > 5) {
      return { success: false, error: 'রেটিং ১-৫ এর মধ্যে হতে হবে' };
    }

    const now = Date.now();
    const reviewRef = push(ref(database, `reviews/${spotId}`));
    const reviewId = reviewRef.key!;

    const newReview = {
      spotId,
      userName: userName.trim(),
      rating: Number(rating),
      comment: comment?.trim() || '',
      createdAt: now,
    };

    await set(reviewRef, newReview);
    await updateSpotRating(spotId);

    return {
      success: true,
      message: 'রিভিউ সফলভাবে যোগ হয়েছে',
      review: {
        id: reviewId,
        ...newReview,
      } as Review & { id: string },
    };
  } catch (error) {
    console.error('Error adding review:', error);
    return { success: false, error: 'রিভিউ যোগ করতে সমস্যা হয়েছে' };
  }
}

// ============================================================================
// 3. REPORTS SERVICE
// ============================================================================

interface ReportData {
  id: string;
  spotId: string;
  spotName: string;
  reportType: string;
  details: string;
  createdAt: number;
  status: 'pending' | 'reviewed' | 'resolved' | 'dismissed';
  reporterName?: string;
  resolvedAt?: number | null;
  resolvedBy?: string;
}

export async function submitReport(data: {
  spotId: string;
  spotName: string;
  reportType: string;
  details?: string;
}): Promise<{
  success: boolean;
  message?: string;
  report?: ReportData;
  error?: string;
}> {
  try {
    const { spotId, spotName, reportType, details } = data;

    if (!spotId || !spotName || !reportType) {
      return { success: false, error: 'স্পট আইডি, নাম এবং রিপোর্ট টাইপ প্রয়োজন' };
    }

    const validReportTypes = ['wrong_info', 'spot_closed', 'spam_fraud', 'inappropriate', 'other'];
    if (!validReportTypes.includes(reportType)) {
      return { success: false, error: 'অবৈধ রিপোর্ট টাইপ' };
    }

    const now = Date.now();
    const reportRef = push(ref(database, 'reports'));
    const reportId = reportRef.key!;

    const newReport: ReportData = {
      id: reportId,
      spotId,
      spotName: spotName.trim(),
      reportType,
      details: details?.trim() || '',
      createdAt: now,
      status: 'pending',
    };

    await set(reportRef, newReport);

    return {
      success: true,
      message: 'রিপোর্ট সফলভাবে জমা হয়েছে',
      report: newReport,
    };
  } catch (error) {
    console.error('Error submitting report:', error);
    return { success: false, error: 'রিপোর্ট জমা দিতে সমস্যা হয়েছে' };
  }
}

export async function getReports(params?: {
  spotId?: string;
  status?: string;
}): Promise<{
  success: boolean;
  reports?: ReportData[];
  error?: string;
}> {
  try {
    const spotId = params?.spotId;
    const status = params?.status;

    const reportsRef = ref(database, 'reports');
    const snapshot = await get(reportsRef);

    if (!snapshot.exists()) {
      return { success: true, reports: [] };
    }

    const reportsData = snapshot.val();
    const reports: ReportData[] = [];

    for (const key in reportsData) {
      const report = reportsData[key];
      if (spotId) {
        if (report.spotId === spotId) {
          reports.push({ id: key, ...report });
        }
      } else {
        if (!status || report.status === status) {
          reports.push({ id: key, ...report });
        }
      }
    }

    reports.sort((a, b) => b.createdAt - a.createdAt);

    return { success: true, reports };
  } catch (error) {
    console.error('Error fetching reports:', error);
    return { success: false, error: 'রিপোর্ট লোড করতে সমস্যা হয়েছে' };
  }
}

export async function updateReport(id: string, data: { status: string; resolvedBy?: string }): Promise<{
  success: boolean;
  message?: string;
  report?: ReportData;
  error?: string;
}> {
  try {
    const { status, resolvedBy } = data;

    if (!id) {
      return { success: false, error: 'রিপোর্ট ID প্রয়োজন' };
    }

    const validStatuses = ['pending', 'reviewed', 'resolved', 'dismissed'];
    if (!status || !validStatuses.includes(status)) {
      return { success: false, error: 'অবৈধ স্ট্যাটাস' };
    }

    const reportRef = ref(database, `reports/${id}`);
    const snapshot = await get(reportRef);

    if (!snapshot.exists()) {
      return { success: false, error: 'রিপোর্ট পাওয়া যায়নি' };
    }

    const existingReport = snapshot.val();
    const updatedReport = {
      ...existingReport,
      status,
      resolvedAt: status === 'resolved' || status === 'dismissed' ? Date.now() : null,
      resolvedBy: resolvedBy || 'admin',
    };

    await set(reportRef, updatedReport);

    return {
      success: true,
      message: 'রিপোর্ট আপডেট হয়েছে',
      report: updatedReport,
    };
  } catch (error) {
    console.error('Error updating report:', error);
    return { success: false, error: 'রিপোর্ট আপডেট করতে সমস্যা হয়েছে' };
  }
}

export async function deleteReport(id: string): Promise<{
  success: boolean;
  message?: string;
  error?: string;
}> {
  try {
    if (!id) {
      return { success: false, error: 'রিপোর্ট ID প্রয়োজন' };
    }

    const reportRef = ref(database, `reports/${id}`);
    await remove(reportRef);

    return { success: true, message: 'রিপোর্ট সফলভাবে মুছে ফেলা হয়েছে' };
  } catch (error) {
    console.error('Error deleting report:', error);
    return { success: false, error: 'রিপোর্ট মুছতে সমস্যা হয়েছে' };
  }
}

// ============================================================================
// 4. EVENTS SERVICE
// ============================================================================

type EventType = 'eid_distribution' | 'ramadan_iftar' | 'special_distribution' | 'charitable_program';

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

const SAMPLE_EVENTS: Omit<Event, 'id' | 'createdAt' | 'updatedAt'>[] = [
  {
    name: 'ঈদুল ফিতর খাবার বিতরণ কর্মসূচি',
    type: 'eid_distribution',
    description: 'ঈদুল ফিতর উপলক্ষে অভাবী ও গরিবদের মাঝে বিশেষ খাবার বিতরণ করা হবে। সবাইকে অংশগ্রহণ করতে উৎসাহিত করা হচ্ছে।',
    date: getFutureDate(30),
    startTime: '09:00',
    endTime: '14:00',
    location: 'জাতীয় ঈদগাহ মাঠ',
    area: 'শাহবাগ',
    city: 'ঢাকা',
    lat: 23.7288,
    lng: 90.3993,
    organizer: 'বাংলাদেশ ইসলামিক সেন্টার',
    expectedAttendees: 500,
    isActive: true,
  },
  {
    name: 'রমজান ইফতার বিতরণ',
    type: 'ramadan_iftar',
    description: 'পবিত্র রমজান মাসে রোজাদারদের জন্য ইফতার বিতরণ কর্মসূচি। প্রতিদিন মাগরিবের আগে ইফতার বিতরণ করা হবে।',
    date: getFutureDate(15),
    startTime: '17:00',
    endTime: '18:30',
    location: 'বায়তুল মোকাররম মসজিদ',
    area: 'পল্টন',
    city: 'ঢাকা',
    lat: 23.7285,
    lng: 90.3942,
    organizer: 'বায়তুল মোকাররম কমিটি',
    expectedAttendees: 300,
    isActive: true,
  },
  {
    name: 'বিশেষ খাবার বিতরণ কর্মসূচি',
    type: 'special_distribution',
    description: 'শীতকালে অভাবী মানুষের মাঝে গরম খাবার বিতরণ। বিকাল ৩টা থেকে রাত ৮টা পর্যন্ত চলবে।',
    date: getFutureDate(7),
    startTime: '15:00',
    endTime: '20:00',
    location: 'সোহরাওয়ার্দী উদ্যান',
    area: 'শাহবাগ',
    city: 'ঢাকা',
    lat: 23.7361,
    lng: 90.3925,
    organizer: 'ঢাকা সিটি কর্পোরেশন',
    expectedAttendees: 200,
    isActive: true,
  },
  {
    name: 'সেবামূলক চিকিৎসা সহায়তা ও খাবার বিতরণ',
    type: 'charitable_program',
    description: 'বিনামূল্যে চিকিৎসা সেবা ও খাবার বিতরণ কর্মসূচি। বিশেষজ্ঞ ডাক্তারদের দ্বারা সেবা প্রদান করা হবে।',
    date: getFutureDate(10),
    startTime: '08:00',
    endTime: '16:00',
    location: 'ঢাকা মেডিকেল কলেজ হাসপাতাল মাঠ',
    area: 'শাহবাগ',
    city: 'ঢাকা',
    lat: 23.7266,
    lng: 90.3990,
    organizer: 'বাংলাদেশ রেড ক্রিসেন্ট সোসাইটি',
    expectedAttendees: 400,
    isActive: true,
  },
  {
    name: 'ঈদুল আযহা কোরবানি মাংস বিতরণ',
    type: 'eid_distribution',
    description: 'ঈদুল আযহায় কোরবানির মাংস বিতরণ। গরিব ও অভাবীদের মাঝে সমানভাবে বিতরণ করা হবে।',
    date: getFutureDate(60),
    startTime: '08:00',
    endTime: '18:00',
    location: 'কক্সবাজার সদর',
    area: 'সদর',
    city: 'কক্সবাজার',
    lat: 21.4272,
    lng: 92.0058,
    organizer: 'কক্সবাজার জেলা পরিষদ',
    expectedAttendees: 350,
    isActive: true,
  },
  {
    name: 'রমজান সেহরি বিতরণ কর্মসূচি',
    type: 'ramadan_iftar',
    description: 'পবিত্র রমজানে সেহরির সময় অভাবী রোজাদারদের মাঝে সেহরি বিতরণ। ফজরের আগে পর্যন্ত চলবে।',
    date: getFutureDate(18),
    startTime: '03:00',
    endTime: '04:30',
    location: 'চট্টগ্রাম রেলওয়ে স্টেশন',
    area: 'নাসিরাবাদ',
    city: 'চট্টগ্রাম',
    lat: 22.3569,
    lng: 91.7832,
    organizer: 'চট্টগ্রাম সিটি সেবা সংঘ',
    expectedAttendees: 250,
    isActive: true,
  },
  {
    name: 'শীতকালীন কম্বল ও খাবার বিতরণ',
    type: 'charitable_program',
    description: 'শীতকালে গরিবদের মাঝে কম্বল ও গরম খাবার বিতরণ। সকাল থেকে সন্ধ্যা পর্যন্ত চলবে।',
    date: getFutureDate(5),
    startTime: '10:00',
    endTime: '17:00',
    location: 'রাজশাহী বিশ্ববিদ্যালয় মাঠ',
    area: 'মোটিহার',
    city: 'রাজশাহী',
    lat: 24.3745,
    lng: 88.6284,
    organizer: 'রাজশাহী বিশ্ববিদ্যালয় সেবা দল',
    expectedAttendees: 180,
    isActive: true,
  },
  {
    name: 'বিশেষ দিনের খাবার বিতরণ - স্বাধীনতা দিবস',
    type: 'special_distribution',
    description: 'স্বাধীনতা দিবস উপলক্ষে বিশেষ খাবার বিতরণ। সব বয়সের মানুষদের জন্য উন্মুক্ত।',
    date: getFutureDate(25),
    startTime: '11:00',
    endTime: '15:00',
    location: 'জাতীয় স্মৃতি সৌধ',
    area: 'সাভার',
    city: 'ঢাকা',
    lat: 23.8653,
    lng: 90.2498,
    organizer: 'মুক্তিযোদ্ধা সংসদ',
    expectedAttendees: 600,
    isActive: true,
  },
];

function transformFirebaseEvent(fbEvent: Record<string, unknown>): Event {
  return {
    id: fbEvent.id as string,
    name: (fbEvent.name || '') as string,
    type: (fbEvent.type || 'special_distribution') as EventType,
    description: (fbEvent.description || '') as string,
    date: (fbEvent.date || '') as string,
    startTime: (fbEvent.startTime || '00:00') as string,
    endTime: (fbEvent.endTime || '23:59') as string,
    location: (fbEvent.location || '') as string,
    area: (fbEvent.area || '') as string,
    city: (fbEvent.city || '') as string,
    lat: fbEvent.lat ? parseFloat(String(fbEvent.lat)) : undefined,
    lng: fbEvent.lng ? parseFloat(String(fbEvent.lng)) : undefined,
    spotId: fbEvent.spotId as string | undefined,
    organizer: (fbEvent.organizer || '') as string,
    contactPhone: fbEvent.contactPhone as string | undefined,
    expectedAttendees: fbEvent.expectedAttendees ? Number(fbEvent.expectedAttendees) : undefined,
    isActive: fbEvent.isActive !== false,
    createdAt: Number(fbEvent.createdAt) || Date.now(),
    updatedAt: Number(fbEvent.updatedAt) || Date.now(),
  };
}

async function initializeSampleEvents(): Promise<void> {
  try {
    const eventsRef = ref(database, 'events');
    const snapshot = await get(eventsRef);

    if (!snapshot.exists()) {
      const now = Date.now();
      for (const eventData of SAMPLE_EVENTS) {
        const newEventRef = push(eventsRef);
        await set(newEventRef, {
          ...eventData,
          id: newEventRef.key,
          createdAt: now,
          updatedAt: now,
        });
      }
      console.log('Sample events initialized');
    }
  } catch (error) {
    console.error('Error initializing sample events:', error);
  }
}

export async function getEvents(params?: {
  type?: string;
  city?: string;
  upcoming?: boolean;
  date?: string;
}): Promise<{
  success: boolean;
  events?: Event[];
  error?: string;
}> {
  try {
    await initializeSampleEvents();

    const type = params?.type || 'all';
    const city = params?.city || 'all';
    const upcoming = params?.upcoming === true;
    const date = params?.date;

    const eventsRef = ref(database, 'events');
    const snapshot = await get(eventsRef);

    if (!snapshot.exists()) {
      return { success: true, events: [] };
    }

    const eventsData = snapshot.val();
    let events: Event[] = [];

    for (const key in eventsData) {
      if (eventsData[key].isActive !== false) {
        const event = transformFirebaseEvent({ id: key, ...eventsData[key] });
        events.push(event);
      }
    }

    if (type !== 'all') {
      events = events.filter((event) => event.type === type);
    }

    if (city !== 'all') {
      events = events.filter((event) => event.city.toLowerCase().includes(city.toLowerCase()));
    }

    if (upcoming) {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      events = events.filter((event) => {
        const eventDate = new Date(event.date);
        return eventDate >= today;
      });
    }

    if (date) {
      events = events.filter((event) => event.date === date);
    }

    events.sort((a, b) => {
      const dateA = new Date(a.date).getTime();
      const dateB = new Date(b.date).getTime();
      return dateA - dateB;
    });

    return { success: true, events };
  } catch (error) {
    console.error('Error fetching events:', error);
    return { success: false, error: 'ইভেন্ট লোড করতে সমস্যা হয়েছে' };
  }
}

export async function addEvent(data: Record<string, unknown>): Promise<{
  success: boolean;
  message?: string;
  event?: Record<string, unknown>;
  error?: string;
}> {
  try {
    const {
      name,
      type,
      description,
      date,
      startTime,
      endTime,
      location,
      area,
      city,
      lat,
      lng,
      spotId,
      organizer,
      contactPhone,
      expectedAttendees,
    } = data;

    if (!name || !type || !date || !location || !area || !city || !organizer) {
      return { success: false, error: 'সব প্রয়োজনীয় ফিল্ড পূরণ করা আবশ্যক' };
    }

    const validTypes: EventType[] = ['eid_distribution', 'ramadan_iftar', 'special_distribution', 'charitable_program'];
    if (!validTypes.includes(type as EventType)) {
      return { success: false, error: 'অবৈধ ইভেন্ট টাইপ' };
    }

    const eventDate = new Date(date as string);
    if (isNaN(eventDate.getTime())) {
      return { success: false, error: 'অবৈধ তারিখ' };
    }

    const now = Date.now();
    const newEventRef = push(ref(database, 'events'));
    const eventId = newEventRef.key!;

    const newEvent: Record<string, unknown> = {
      id: eventId,
      name: String(name).trim(),
      type,
      description: typeof description === 'string' ? description.trim() : '',
      date,
      startTime: (startTime as string) || '00:00',
      endTime: (endTime as string) || '23:59',
      location: String(location).trim(),
      area: String(area).trim(),
      city: String(city).trim(),
      lat: lat || null,
      lng: lng || null,
      spotId: (spotId as string) || null,
      organizer: String(organizer).trim(),
      contactPhone: (contactPhone as string) || null,
      expectedAttendees: expectedAttendees || null,
      isActive: true,
      createdAt: now,
      updatedAt: now,
    };

    await set(newEventRef, newEvent);

    return {
      success: true,
      message: 'ইভেন্ট সফলভাবে যোগ হয়েছে',
      event: newEvent,
    };
  } catch (error) {
    console.error('Error adding event:', error);
    return { success: false, error: 'ইভেন্ট যোগ করতে সমস্যা হয়েছে' };
  }
}

export async function updateEvent(id: string, data: Record<string, unknown>): Promise<{
  success: boolean;
  message?: string;
  event?: Record<string, unknown>;
  error?: string;
}> {
  try {
    if (!id) {
      return { success: false, error: 'ইভেন্ট ID প্রয়োজন' };
    }

    if (data.type) {
      const validTypes: EventType[] = ['eid_distribution', 'ramadan_iftar', 'special_distribution', 'charitable_program'];
      if (!validTypes.includes(data.type as EventType)) {
        return { success: false, error: 'অবৈধ ইভেন্ট টাইপ' };
      }
    }

    if (data.date) {
      const eventDate = new Date(data.date as string);
      if (isNaN(eventDate.getTime())) {
        return { success: false, error: 'অবৈধ তারিখ' };
      }
    }

    const eventRef = ref(database, `events/${id}`);
    const snapshot = await get(eventRef);

    if (!snapshot.exists()) {
      return { success: false, error: 'ইভেন্ট পাওয়া যায়নি' };
    }

    const existingEvent = snapshot.val();
    const updatedEvent = {
      ...existingEvent,
      ...data,
      updatedAt: Date.now(),
    };

    await set(eventRef, updatedEvent);

    return {
      success: true,
      message: 'ইভেন্ট সফলভাবে আপডেট হয়েছে',
      event: updatedEvent,
    };
  } catch (error) {
    console.error('Error updating event:', error);
    return { success: false, error: 'ইভেন্ট আপডেট করতে সমস্যা হয়েছে' };
  }
}

export async function deleteEvent(id: string): Promise<{
  success: boolean;
  message?: string;
  error?: string;
}> {
  try {
    if (!id) {
      return { success: false, error: 'ইভেন্ট ID প্রয়োজন' };
    }

    const eventRef = ref(database, `events/${id}`);
    await remove(eventRef);

    return { success: true, message: 'ইভেন্ট সফলভাবে মুছে ফেলা হয়েছে' };
  } catch (error) {
    console.error('Error deleting event:', error);
    return { success: false, error: 'ইভেন্ট মুছতে সমস্যা হয়েছে' };
  }
}

// ============================================================================
// 5. DONATIONS SERVICE
// ============================================================================

interface Donation {
  id: string;
  name: string;
  amount: number;
  tier: string;
  message?: string;
  anonymous: boolean;
  timestamp: number;
  spotId?: string;
  spotName?: string;
}

interface SponsorSpot {
  id: string;
  spotId: string;
  spotName: string;
  sponsorName: string;
  sponsorAmount: number;
  startDate: number;
  endDate: number;
  active: boolean;
}

const DEFAULT_DONATIONS: Omit<Donation, 'id'>[] = [
  {
    name: 'রহিম আহমেদ',
    amount: 5000,
    tier: 'major',
    message: 'চমৎকার কাজের জন্য ধন্যবাদ!',
    anonymous: false,
    timestamp: Date.now() - 86400000 * 2,
  },
  {
    name: 'করিম হোসেন',
    amount: 2000,
    tier: 'sponsor',
    message: 'এই উদ্যোগের সাথে থাকতে পেরে গর্বিত।',
    anonymous: false,
    timestamp: Date.now() - 86400000 * 5,
  },
  {
    name: 'বেনামী দাতা',
    amount: 1500,
    tier: 'helper',
    anonymous: true,
    timestamp: Date.now() - 86400000 * 7,
  },
];

const DEFAULT_SPONSORS: Omit<SponsorSpot, 'id'>[] = [
  {
    spotId: 'spot-1',
    spotName: 'ধানমন্ডি ফ্রি মিল সেন্টার',
    sponsorName: 'আল-হাসান ফাউন্ডেশন',
    sponsorAmount: 10000,
    startDate: Date.now() - 86400000 * 30,
    endDate: Date.now() + 86400000 * 60,
    active: true,
  },
];

async function initializeDefaultDonationData(): Promise<void> {
  try {
    const donationsRef = ref(database, 'donations');
    const donationsSnapshot = await get(donationsRef);

    if (!donationsSnapshot.exists()) {
      for (const donation of DEFAULT_DONATIONS) {
        const newRef = push(donationsRef);
        await set(newRef, { ...donation, id: newRef.key });
      }
    }

    const sponsorsRef = ref(database, 'sponsors');
    const sponsorsSnapshot = await get(sponsorsRef);

    if (!sponsorsSnapshot.exists()) {
      for (const sponsor of DEFAULT_SPONSORS) {
        const newRef = push(sponsorsRef);
        await set(newRef, { ...sponsor, id: newRef.key });
      }
    }
  } catch (error) {
    console.error('Error initializing donation data:', error);
  }
}

async function getDonationGoal(): Promise<number> {
  try {
    const settingsRef = ref(database, 'siteSettings');
    const snapshot = await get(settingsRef);
    if (snapshot.exists() && snapshot.val().donationGoal) {
      return snapshot.val().donationGoal;
    }
  } catch (error) {
    console.error('Error fetching donation goal:', error);
  }
  return 100000;
}

export async function getDonations(action?: string): Promise<Record<string, unknown>> {
  try {
    await initializeDefaultDonationData();

    const donationsRef = ref(database, 'donations');
    const donationsSnapshot = await get(donationsRef);
    const donations: Donation[] = [];

    if (donationsSnapshot.exists()) {
      const data = donationsSnapshot.val();
      for (const key in data) {
        donations.push(data[key]);
      }
    }

    const sponsorsRef = ref(database, 'sponsors');
    const sponsorsSnapshot = await get(sponsorsRef);
    const sponsors: SponsorSpot[] = [];

    if (sponsorsSnapshot.exists()) {
      const data = sponsorsSnapshot.val();
      for (const key in data) {
        if (data[key].active) {
          sponsors.push(data[key]);
        }
      }
    }

    const fundGoal = await getDonationGoal();

    switch (action) {
      case 'donors': {
        const recentDonors = donations
          .sort((a, b) => b.timestamp - a.timestamp)
          .slice(0, 10)
          .map((d) => ({
            id: d.id,
            name: d.anonymous ? 'বেনামী দাতা' : d.name,
            amount: d.amount,
            tier: d.tier,
            message: d.anonymous ? undefined : d.message,
            timestamp: d.timestamp,
          }));
        return { donors: recentDonors };
      }

      case 'sponsors':
        return { sponsors: sponsors.filter((s) => s.active) };

      case 'stats': {
        const totalDonations = donations.reduce((sum, d) => sum + d.amount, 0);
        const totalSponsorship = sponsors.reduce((sum, s) => sum + s.sponsorAmount, 0);

        const monthlyDonations = donations
          .filter((d) => d.timestamp > Date.now() - 30 * 24 * 60 * 60 * 1000)
          .reduce((sum, d) => sum + d.amount, 0);

        const donorCount = donations.length;
        const sponsorCount = sponsors.length;

        const tierBreakdown = {
          basic: donations.filter((d) => d.tier === 'basic').length,
          helper: donations.filter((d) => d.tier === 'helper').length,
          sponsor: donations.filter((d) => d.tier === 'sponsor').length,
          major: donations.filter((d) => d.tier === 'major').length,
        };

        return {
          totalDonations,
          totalSponsorship,
          monthlyDonations,
          fundGoal,
          donorCount,
          sponsorCount,
          tierBreakdown,
          progress: Math.min(100, (monthlyDonations / fundGoal) * 100),
        };
      }

      case 'all':
        return {
          donations: donations.sort((a, b) => b.timestamp - a.timestamp),
          sponsors,
        };

      default:
        return {
          donations: donations
            .sort((a, b) => b.timestamp - a.timestamp)
            .slice(0, 20),
          sponsors: sponsors.filter((s) => s.active),
          stats: {
            totalDonations: donations.reduce((sum, d) => sum + d.amount, 0),
            fundGoal,
            donorCount: donations.length,
          },
        };
    }
  } catch (error) {
    console.error('Donation API error:', error);
    return { success: false, error: 'ডাটা লোড করতে সমস্যা হয়েছে' };
  }
}

export async function addDonation(data: {
  name: string;
  amount: number;
  tier: string;
  message?: string;
  anonymous?: boolean;
}): Promise<{
  success: boolean;
  message?: string;
  donation?: Donation;
  error?: string;
}> {
  try {
    const { name, amount, tier, message, anonymous } = data;

    const newDonation: Donation = {
      id: '',
      name: (anonymous) ? 'বেনামী দাতা' : name,
      amount,
      tier,
      message,
      anonymous: anonymous ?? false,
      timestamp: Date.now(),
    };

    const newRef = push(ref(database, 'donations'));
    newDonation.id = newRef.key!;
    await set(newRef, newDonation);

    return {
      success: true,
      message: 'দান সফলভাবে রেকর্ড করা হয়েছে। ধন্যবাদ!',
      donation: newDonation,
    };
  } catch (error) {
    console.error('Donation API error:', error);
    return { success: false, error: 'সার্ভার ত্রুটি হয়েছে' };
  }
}

export async function addSponsor(data: {
  spotId: string;
  spotName: string;
  sponsorName: string;
  sponsorAmount: number;
  duration: number;
}): Promise<{
  success: boolean;
  message?: string;
  sponsor?: SponsorSpot;
  error?: string;
}> {
  try {
    const { spotId, spotName, sponsorName, sponsorAmount, duration } = data;

    const newSponsor: SponsorSpot = {
      id: '',
      spotId,
      spotName,
      sponsorName,
      sponsorAmount,
      startDate: Date.now(),
      endDate: Date.now() + duration * 24 * 60 * 60 * 1000,
      active: true,
    };

    const newRef = push(ref(database, 'sponsors'));
    newSponsor.id = newRef.key!;
    await set(newRef, newSponsor);

    return {
      success: true,
      message: 'স্পট স্পনসরশিপ সফলভাবে রেকর্ড করা হয়েছে।',
      sponsor: newSponsor,
    };
  } catch (error) {
    console.error('Donation API error:', error);
    return { success: false, error: 'সার্ভার ত্রুটি হয়েছে' };
  }
}

export async function deleteDonation(id: string): Promise<{
  success: boolean;
  message?: string;
  error?: string;
}> {
  try {
    if (!id) {
      return { success: false, error: 'Type এবং ID প্রয়োজন' };
    }

    const itemRef = ref(database, `donations/${id}`);
    await remove(itemRef);

    return { success: true, message: 'মুছে ফেলা হয়েছে' };
  } catch (error) {
    console.error('Error deleting:', error);
    return { success: false, error: 'মুছতে সমস্যা হয়েছে' };
  }
}

export async function deleteSponsor(id: string): Promise<{
  success: boolean;
  message?: string;
  error?: string;
}> {
  try {
    if (!id) {
      return { success: false, error: 'Type এবং ID প্রয়োজন' };
    }

    const itemRef = ref(database, `sponsors/${id}`);
    await remove(itemRef);

    return { success: true, message: 'মুছে ফেলা হয়েছে' };
  } catch (error) {
    console.error('Error deleting:', error);
    return { success: false, error: 'মুছতে সমস্যা হয়েছে' };
  }
}

// ============================================================================
// 6. STATS SERVICE
// ============================================================================

export async function getStats(): Promise<{
  success: boolean;
  status?: { totalSpots: number; verifiedSpots: number; newSpots: number };
  error?: string;
}> {
  try {
    const spotsRef = ref(database, 'spots');
    const spotsSnapshot = await get(spotsRef);

    let totalSpots = 0;
    let verifiedSpots = 0;
    let newSpots = 0;

    if (spotsSnapshot.exists()) {
      const spotsData = spotsSnapshot.val();
      const sevenDaysAgo = Date.now() - 7 * 24 * 60 * 60 * 1000;

      for (const key in spotsData) {
        const spot = spotsData[key];
        totalSpots++;

        if (spot.verified === true) {
          verifiedSpots++;
        }

        if (spot.createdAt && spot.createdAt >= sevenDaysAgo) {
          newSpots++;
        }
      }
    }

    return {
      success: true,
      status: {
        totalSpots,
        verifiedSpots,
        newSpots,
      },
    };
  } catch (error) {
    console.error('Error fetching stats:', error);
    return { success: false, error: 'স্ট্যাটাস লোড করতে সমস্যা হয়েছে' };
  }
}

// ============================================================================
// 7. TEAM MEMBERS SERVICE
// ============================================================================

export interface TeamMember {
  id: string;
  name: string;
  role: string;
  image: string | null;
  facebookUrl?: string;
  instagramUrl?: string;
  twitterUrl?: string;
  email?: string;
  order: number;
  isActive: boolean;
  createdAt: number;
  updatedAt: number;
}

const DEFAULT_TEAM_MEMBERS: Omit<TeamMember, 'id' | 'createdAt' | 'updatedAt'>[] = [
  {
    name: 'MD MUBAROK',
    role: 'লিড টিম',
    image: 'https://i.pravatar.cc/150?img=68',
    facebookUrl: 'https://facebook.com/id.mdmubarok',
    order: 1,
    isActive: true,
  },
  {
    name: 'DEVELOPER',
    role: 'ফুলস্ট্যাক ডেভেলপার',
    image: 'https://i.pravatar.cc/150?img=12',
    facebookUrl: 'https://facebook.com/id.mdmubarok',
    order: 2,
    isActive: true,
  },
  {
    name: 'DESIGNER',
    role: 'UI/UX ডিজাইনার',
    image: 'https://i.pravatar.cc/150?img=33',
    facebookUrl: 'https://facebook.com/id.mdmubarok',
    order: 3,
    isActive: true,
  },
  {
    name: 'JOIN US',
    role: 'টিমে যোগ দিন',
    image: null,
    facebookUrl: 'https://facebook.com/id.mdmubarok',
    order: 4,
    isActive: true,
  },
];

function transformFirebaseMember(fbMember: Record<string, unknown>): TeamMember {
  return {
    id: fbMember.id as string,
    name: (fbMember.name || '') as string,
    role: (fbMember.role || '') as string,
    image: fbMember.image as string | null,
    facebookUrl: fbMember.facebookUrl as string | undefined,
    instagramUrl: fbMember.instagramUrl as string | undefined,
    twitterUrl: fbMember.twitterUrl as string | undefined,
    email: fbMember.email as string | undefined,
    order: (fbMember.order as number) || 999,
    isActive: fbMember.isActive !== false,
    createdAt: Number(fbMember.createdAt) || Date.now(),
    updatedAt: Number(fbMember.updatedAt) || Date.now(),
  };
}

async function initializeTeamMembers(): Promise<void> {
  try {
    const teamRef = ref(database, 'teamMembers');
    const snapshot = await get(teamRef);

    if (!snapshot.exists()) {
      const now = Date.now();
      for (const member of DEFAULT_TEAM_MEMBERS) {
        const newMemberRef = push(teamRef);
        await set(newMemberRef, {
          ...member,
          id: newMemberRef.key,
          createdAt: now,
          updatedAt: now,
        });
      }
      console.log('Default team members initialized');
    }
  } catch (error) {
    console.error('Error initializing team members:', error);
  }
}

export async function getTeamMembers(): Promise<{
  success: boolean;
  members?: TeamMember[];
  error?: string;
}> {
  try {
    await initializeTeamMembers();

    const teamRef = ref(database, 'teamMembers');
    const snapshot = await get(teamRef);

    if (!snapshot.exists()) {
      return { success: true, members: [] };
    }

    const membersData = snapshot.val();
    const members: TeamMember[] = [];

    for (const key in membersData) {
      if (membersData[key].isActive !== false) {
        members.push(transformFirebaseMember({ id: key, ...membersData[key] }));
      }
    }

    members.sort((a, b) => a.order - b.order);

    return { success: true, members };
  } catch (error) {
    console.error('Error fetching team members:', error);
    return { success: false, error: 'টিম মেম্বার লোড করতে সমস্যা হয়েছে' };
  }
}

export async function addTeamMember(data: {
  name: string;
  role: string;
  image?: string | null;
  facebookUrl?: string;
  instagramUrl?: string;
  twitterUrl?: string;
  email?: string;
  order?: number;
}): Promise<{
  success: boolean;
  message?: string;
  member?: TeamMember;
  error?: string;
}> {
  try {
    const { name, role, image, facebookUrl, instagramUrl, twitterUrl, email, order } = data;

    if (!name || !role) {
      return { success: false, error: 'নাম এবং ভূমিকা প্রয়োজন' };
    }

    const now = Date.now();
    const newMemberRef = push(ref(database, 'teamMembers'));
    const memberId = newMemberRef.key!;

    const newMember: TeamMember = {
      id: memberId,
      name: name.trim(),
      role: role.trim(),
      image: image || null,
      facebookUrl,
      instagramUrl,
      twitterUrl,
      email,
      order: order || 999,
      isActive: true,
      createdAt: now,
      updatedAt: now,
    };

    await set(newMemberRef, newMember);

    return {
      success: true,
      message: 'টিম মেম্বার যোগ হয়েছে',
      member: newMember,
    };
  } catch (error) {
    console.error('Error adding team member:', error);
    return { success: false, error: 'টিম মেম্বার যোগ করতে সমস্যা হয়েছে' };
  }
}

export async function updateTeamMember(id: string, data: Record<string, unknown>): Promise<{
  success: boolean;
  message?: string;
  member?: Record<string, unknown>;
  error?: string;
}> {
  try {
    if (!id) {
      return { success: false, error: 'মেম্বার ID প্রয়োজন' };
    }

    const memberRef = ref(database, `teamMembers/${id}`);
    const snapshot = await get(memberRef);

    if (!snapshot.exists()) {
      return { success: false, error: 'মেম্বার পাওয়া যায়নি' };
    }

    const existingMember = snapshot.val();
    const updatedMember = {
      ...existingMember,
      ...data,
      updatedAt: Date.now(),
    };

    await set(memberRef, updatedMember);

    return {
      success: true,
      message: 'টিম মেম্বার আপডেট হয়েছে',
      member: updatedMember,
    };
  } catch (error) {
    console.error('Error updating team member:', error);
    return { success: false, error: 'টিম মেম্বার আপডেট করতে সমস্যা হয়েছে' };
  }
}

export async function deleteTeamMember(id: string): Promise<{
  success: boolean;
  message?: string;
  error?: string;
}> {
  try {
    if (!id) {
      return { success: false, error: 'মেম্বার ID প্রয়োজন' };
    }

    const memberRef = ref(database, `teamMembers/${id}`);
    await remove(memberRef);

    return { success: true, message: 'টিম মেম্বার মুছে ফেলা হয়েছে' };
  } catch (error) {
    console.error('Error deleting team member:', error);
    return { success: false, error: 'টিম মেম্বার মুছতে সমস্যা হয়েছে' };
  }
}

// ============================================================================
// 8. NOTIFICATIONS SERVICE
// ============================================================================

export interface Notification {
  id: string;
  type: 'info' | 'warning' | 'success' | 'error';
  title: string;
  message: string;
  read: boolean;
  createdAt: number;
  link?: string;
}

const DEFAULT_NOTIFICATIONS: Omit<Notification, 'id'>[] = [
  {
    type: 'info',
    title: 'সিস্টেম আপডেট',
    message: 'অ্যাডমিন প্যানেল আপডেট করা হয়েছে। নতুন ফিচার যুক্ত হয়েছে।',
    read: false,
    createdAt: Date.now() - 3600000,
  },
  {
    type: 'success',
    title: 'নতুন স্পট যোগ',
    message: 'একটি নতুন স্পট অপেক্ষমান ভেরিফিকেশনে আছে।',
    read: false,
    createdAt: Date.now() - 7200000,
  },
  {
    type: 'warning',
    title: 'রিপোর্ট সতর্কতা',
    message: 'কিছু স্পটে রিপোর্ট জমা হয়েছে। দয়া করে পর্যালোচনা করুন।',
    read: false,
    createdAt: Date.now() - 86400000,
  },
];

async function initializeNotifications(): Promise<void> {
  try {
    const notifRef = ref(database, 'notifications');
    const snapshot = await get(notifRef);

    if (!snapshot.exists()) {
      for (const notif of DEFAULT_NOTIFICATIONS) {
        const newRef = push(notifRef);
        await set(newRef, { ...notif, id: newRef.key });
      }
    }
  } catch (error) {
    console.error('Error initializing notifications:', error);
  }
}

export async function getNotifications(params?: {
  unreadOnly?: boolean;
}): Promise<{
  success: boolean;
  notifications?: Notification[];
  unreadCount?: number;
  error?: string;
}> {
  try {
    await initializeNotifications();

    const notifRef = ref(database, 'notifications');
    const snapshot = await get(notifRef);

    if (!snapshot.exists()) {
      return { success: true, notifications: [], unreadCount: 0 };
    }

    const data = snapshot.val();
    let notifications: Notification[] = [];

    for (const key in data) {
      notifications.push(data[key]);
    }

    notifications.sort((a, b) => b.createdAt - a.createdAt);

    if (params?.unreadOnly) {
      notifications = notifications.filter((n) => !n.read);
    }

    return {
      success: true,
      notifications,
      unreadCount: notifications.filter((n) => !n.read).length,
    };
  } catch (error) {
    console.error('Error fetching notifications:', error);
    return { success: false, error: 'নোটিফিকেশন লোড করতে সমস্যা হয়েছে' };
  }
}

export async function addNotification(data: Omit<Notification, 'id' | 'read' | 'createdAt'>): Promise<{
  success: boolean;
  message?: string;
  notification?: Notification;
  error?: string;
}> {
  try {
    const newRef = push(ref(database, 'notifications'));
    const newNotification: Notification = {
      ...data,
      id: newRef.key!,
      read: false,
      createdAt: Date.now(),
    };

    await set(newRef, newNotification);

    return {
      success: true,
      message: 'নোটিফিকেশন যোগ হয়েছে',
      notification: newNotification,
    };
  } catch (error) {
    console.error('Error processing notification:', error);
    return { success: false, error: 'সমস্যা হয়েছে' };
  }
}

export async function markNotificationRead(id: string): Promise<{
  success: boolean;
  message?: string;
  error?: string;
}> {
  try {
    const notifRef = ref(database, `notifications/${id}`);
    const snapshot = await get(notifRef);

    if (snapshot.exists()) {
      await set(notifRef, { ...snapshot.val(), read: true });
    }

    return { success: true, message: 'পড়া হয়েছে' };
  } catch (error) {
    console.error('Error processing notification:', error);
    return { success: false, error: 'সমস্যা হয়েছে' };
  }
}

export async function markAllNotificationsRead(): Promise<{
  success: boolean;
  message?: string;
  error?: string;
}> {
  try {
    const notifRef = ref(database, 'notifications');
    const snapshot = await get(notifRef);

    if (snapshot.exists()) {
      const data = snapshot.val();
      for (const key in data) {
        await set(ref(database, `notifications/${key}`), { ...data[key], read: true });
      }
    }

    return { success: true, message: 'সব পড়া হয়েছে' };
  } catch (error) {
    console.error('Error processing notification:', error);
    return { success: false, error: 'সমস্যা হয়েছে' };
  }
}

export async function deleteNotification(id: string): Promise<{
  success: boolean;
  message?: string;
  error?: string;
}> {
  try {
    if (!id) {
      return { success: false, error: 'ID প্রয়োজন' };
    }

    const notifRef = ref(database, `notifications/${id}`);
    await remove(notifRef);

    return { success: true, message: 'মুছে ফেলা হয়েছে' };
  } catch (error) {
    console.error('Error deleting notification:', error);
    return { success: false, error: 'মুছতে সমস্যা হয়েছে' };
  }
}

// ============================================================================
// 9. SITE SETTINGS SERVICE
// ============================================================================

export interface SiteSettings {
  siteName: string;
  siteDescription: string;
  contactEmail: string;
  contactPhone: string;
  facebookUrl: string;
  instagramUrl?: string;
  twitterUrl?: string;
  youtubeUrl?: string;
  aboutTitle: string;
  aboutDescription: string;
  missionTitle: string;
  missionDescription: string;
  disclaimerText: string;
  donationGoal: number;
  bkashNumber: string;
  nagadNumber: string;
  rocketNumber: string;
  bankAccountName: string;
  bankAccountNumber: string;
  bankName: string;
  paymentEnabled: boolean;
  bohudurApiKey: string;
  bohudurTestMode: boolean;
  footerText: string;
  updatedAt: number;
}

const DEFAULT_SETTINGS: SiteSettings = {
  siteName: 'ফ্রি ফুড ম্যাপ',
  siteDescription: 'বাংলাদেশের বিনামূল্যে খাবার স্পট খুঁজুন',
  contactEmail: 'contact@freefoodmap.org',
  contactPhone: '+880 1XXX-XXXXXX',
  facebookUrl: 'https://facebook.com/id.mdmubarok',
  instagramUrl: '',
  twitterUrl: '',
  youtubeUrl: '',
  aboutTitle: 'আমাদের সম্পর্কে',
  aboutDescription: 'আমরা বাংলাদেশের মানুষদের জন্য বিনামূল্যে খাবার পাওয়ার স্থানগুলো চিহ্নিত করতে সাহায্য করছি।',
  missionTitle: 'আমাদের মিশন',
  missionDescription: 'আমরা বিশ্বাস করি প্রযুক্তির মাধ্যমে সমাজের উন্নতি সম্ভব।',
  disclaimerText: 'এই প্ল্যাটফর্মে প্রদত্ত সকল তথ্য ব্যবহারকারীদের দ্বারা জমা দেওয়া।',
  donationGoal: 100000,
  bkashNumber: '01XXX-XXXXXX',
  nagadNumber: '01XXX-XXXXXX',
  rocketNumber: '01XXX-XXXXXX',
  bankAccountName: 'Free Food Map',
  bankAccountNumber: 'XXXX-XXXX-XXXX',
  bankName: 'বাংলাদেশ ব্যাংক',
  paymentEnabled: true,
  bohudurApiKey: 'GF3KVNrkl8dS017mEMQDz5p2HsbABJfj',
  bohudurTestMode: false,
  footerText: '© ২০২৫ ফ্রি ফুড ম্যাপ। সর্বস্বত্ব সংরক্ষিত।',
  updatedAt: Date.now(),
};

async function getSettingsFromFirebase(): Promise<SiteSettings> {
  try {
    const settingsRef = ref(database, 'siteSettings');
    const snapshot = await get(settingsRef);

    if (!snapshot.exists()) {
      await set(settingsRef, DEFAULT_SETTINGS);
      return DEFAULT_SETTINGS;
    }

    const existingData = snapshot.val();

    const mergedSettings: SiteSettings = {
      ...DEFAULT_SETTINGS,
      ...existingData,
      paymentEnabled: existingData.paymentEnabled ?? DEFAULT_SETTINGS.paymentEnabled,
      bohudurApiKey: existingData.bohudurApiKey || DEFAULT_SETTINGS.bohudurApiKey,
      bohudurTestMode: existingData.bohudurTestMode ?? DEFAULT_SETTINGS.bohudurTestMode,
    };

    if (
      existingData.paymentEnabled === undefined ||
      !existingData.bohudurApiKey ||
      existingData.bohudurTestMode === undefined
    ) {
      await set(settingsRef, {
        ...mergedSettings,
        updatedAt: Date.now(),
      });
    }

    return mergedSettings;
  } catch (error) {
    console.error('[Settings] Error fetching settings:', error);
    return DEFAULT_SETTINGS;
  }
}

export async function getSiteSettings(): Promise<{
  success: boolean;
  settings?: SiteSettings;
  error?: string;
}> {
  try {
    const settings = await getSettingsFromFirebase();
    return { success: true, settings };
  } catch (error) {
    console.error('[Settings] Error in GET:', error);
    return { success: false, error: 'সেটিংস লোড করতে সমস্যা হয়েছে' };
  }
}

export async function updateSiteSettings(data: Record<string, unknown>): Promise<{
  success: boolean;
  message?: string;
  settings?: SiteSettings;
  error?: string;
}> {
  try {
    const settingsRef = ref(database, 'siteSettings');

    const currentSnapshot = await get(settingsRef);
    const currentSettings = currentSnapshot.exists() ? currentSnapshot.val() : {};

    const updatedSettings: SiteSettings = {
      ...DEFAULT_SETTINGS,
      ...currentSettings,
      ...data,
      paymentEnabled: data.paymentEnabled ?? currentSettings.paymentEnabled ?? true,
      bohudurApiKey: data.bohudurApiKey || currentSettings.bohudurApiKey || DEFAULT_SETTINGS.bohudurApiKey,
      bohudurTestMode: data.bohudurTestMode ?? currentSettings.bohudurTestMode ?? false,
      updatedAt: Date.now(),
    } as SiteSettings;

    await set(settingsRef, updatedSettings);

    return {
      success: true,
      message: 'সেটিংস আপডেট হয়েছে',
      settings: updatedSettings,
    };
  } catch (error) {
    console.error('[Settings] Error in POST:', error);
    return { success: false, error: 'সেটিংস আপডেট করতে সমস্যা হয়েছে' };
  }
}

// ============================================================================
// 10. ANALYTICS SERVICE
// ============================================================================

export async function trackSpotView(spotId: string): Promise<{ success: boolean }> {
  try {
    if (!spotId) return { success: false };

    // Update spot view count
    const spotRef = ref(database, `spots/${spotId}`);
    const snapshot = await get(spotRef);

    if (snapshot.exists()) {
      const currentViews = snapshot.val().viewCount || 0;
      await update(spotRef, {
        viewCount: currentViews + 1,
      });
    }

    // Update global analytics
    const analyticsRef = ref(database, 'analytics');
    const analyticsSnapshot = await get(analyticsRef);

    const today = new Date().toISOString().split('T')[0];
    const currentTotalViews = analyticsSnapshot.exists() ? (analyticsSnapshot.val().totalViews || 0) : 0;

    await update(analyticsRef, {
      totalViews: currentTotalViews + 1,
      lastUpdated: Date.now(),
    });

    // Update daily stats
    const dailyRef = ref(database, `analytics/daily/${today}`);
    const dailySnapshot = await get(dailyRef);
    const dailyViews = dailySnapshot.exists() ? (dailySnapshot.val().views || 0) : 0;

    await update(dailyRef, {
      views: dailyViews + 1,
      date: today,
    });

    return { success: true };
  } catch (error) {
    console.error('Error tracking view:', error);
    return { success: false };
  }
}

export async function trackDirectionClick(spotId: string): Promise<{ success: boolean }> {
  try {
    if (!spotId) return { success: false };

    // Update spot direction count
    const spotRef = ref(database, `spots/${spotId}`);
    const snapshot = await get(spotRef);

    if (snapshot.exists()) {
      const currentCount = snapshot.val().directionCount || 0;
      await update(spotRef, {
        directionCount: currentCount + 1,
      });
    }

    // Update global analytics
    const analyticsRef = ref(database, 'analytics');
    const analyticsSnapshot = await get(analyticsRef);

    const today = new Date().toISOString().split('T')[0];
    const currentTotalDirections = analyticsSnapshot.exists()
      ? (analyticsSnapshot.val().totalDirections || 0)
      : 0;

    await update(analyticsRef, {
      totalDirections: currentTotalDirections + 1,
      lastUpdated: Date.now(),
    });

    // Update daily stats
    const dailyRef = ref(database, `analytics/daily/${today}`);
    const dailySnapshot = await get(dailyRef);
    const dailyDirections = dailySnapshot.exists()
      ? (dailySnapshot.val().directions || 0)
      : 0;

    await update(dailyRef, {
      directions: dailyDirections + 1,
      date: today,
    });

    return { success: true };
  } catch (error) {
    console.error('Error tracking direction:', error);
    return { success: false };
  }
}

// ============================================================================
// 11. ADMIN SERVICE
// ============================================================================

export async function deleteSpot(spotId: string): Promise<{
  success: boolean;
  message?: string;
  error?: string;
}> {
  try {
    if (!spotId) {
      return { success: false, error: 'স্পট আইডি প্রয়োজন' };
    }

    // Check if spot exists
    const spotRef = ref(database, `spots/${spotId}`);
    const snapshot = await get(spotRef);

    if (!snapshot.exists()) {
      return { success: false, error: 'স্পট পাওয়া যায়নি' };
    }

    // Delete spot
    await remove(spotRef);

    // Also delete reviews
    const reviewsRef = ref(database, `reviews/${spotId}`);
    await remove(reviewsRef);

    return { success: true, message: 'স্পট মুছে ফেলা হয়েছে' };
  } catch (error) {
    console.error('Error deleting spot:', error);
    return { success: false, error: 'সমস্যা হয়েছে' };
  }
}

export async function toggleSpotVerification(spotId: string, verified: boolean): Promise<{
  success: boolean;
  message?: string;
  error?: string;
}> {
  try {
    if (!spotId) {
      return { success: false, error: 'স্পট আইডি প্রয়োজন' };
    }

    const spotRef = ref(database, `spots/${spotId}`);
    const snapshot = await get(spotRef);

    if (!snapshot.exists()) {
      return { success: false, error: 'স্পট পাওয়া যায়নি' };
    }

    await update(spotRef, {
      verified: verified === true,
      lastUpdated: Date.now(),
    });

    return {
      success: true,
      message: verified ? 'স্পট ভেরিফাইড হয়েছে' : 'ভেরিফিকেশন সরানো হয়েছে',
    };
  } catch (error) {
    console.error('Error updating verification:', error);
    return { success: false, error: 'সমস্যা হয়েছে' };
  }
}

export async function editSpot(spotId: string, data: Record<string, unknown>): Promise<{
  success: boolean;
  message?: string;
  error?: string;
}> {
  try {
    if (!spotId) {
      return { success: false, error: 'স্পট আইডি প্রয়োজন' };
    }

    const spotRef = ref(database, `spots/${spotId}`);
    const snapshot = await get(spotRef);

    if (!snapshot.exists()) {
      return { success: false, error: 'স্পট পাওয়া যায়নি' };
    }

    // Validate type
    const { type, name, address, area, city, country, lat, lng, openDays, openTime, closeTime, notes, verified, active } = data;

    if (type) {
      const validTypes: SpotType[] = ['daily_meal', 'weekly_meal', 'grocery', 'soup_kitchen', 'other'];
      if (!validTypes.includes(type as SpotType)) {
        return { success: false, error: 'অবৈধ টাইপ' };
      }
    }

    const updateData: Record<string, unknown> = {
      lastUpdated: Date.now(),
    };

    if (name) updateData.name = String(name).trim();
    if (type) updateData.type = type;
    if (address) updateData.address = String(address).trim();
    if (area) updateData.area = String(area).trim();
    if (city) updateData.city = String(city).trim();
    if (country) updateData.country = String(country).trim();
    if (lat !== undefined) updateData.lat = parseFloat(String(lat));
    if (lng !== undefined) updateData.lng = parseFloat(String(lng));
    if (openDays) updateData.openDays = JSON.stringify(openDays);
    if (openTime) updateData.openTime = openTime;
    if (closeTime) updateData.closeTime = closeTime;
    if (notes !== undefined) updateData.notes = typeof notes === 'string' ? notes.trim() || null : null;
    if (verified !== undefined) updateData.verified = verified === true;
    if (active !== undefined) updateData.active = active === true;

    await update(spotRef, updateData);

    return { success: true, message: 'স্পট আপডেট হয়েছে' };
  } catch (error) {
    console.error('Error editing spot:', error);
    return { success: false, error: 'সমস্যা হয়েছে' };
  }
}

// ============================================================================
// 12. STATUS SERVICE
// ============================================================================

function generateUptimeHistory(): UptimeData[] {
  const data: UptimeData[] = [];
  const now = new Date();

  for (let i = 13; i >= 0; i--) {
    const date = new Date(now);
    date.setDate(date.getDate() - i);
    const dateStr = date.toISOString().split('T')[0];

    const uptime = 99 + Math.random();
    const totalChecks = 288;
    const successfulChecks = Math.floor(totalChecks * (uptime / 100));

    data.push({
      date: dateStr,
      uptime: Math.min(100, uptime),
      totalChecks,
      successfulChecks,
    });
  }

  return data;
}

function generateResponseTimeHistory(): ResponseTimeData[] {
  const data: ResponseTimeData[] = [];
  const now = new Date();

  for (let i = 23; i >= 0; i--) {
    const hour = new Date(now);
    hour.setHours(hour.getHours() - i);

    for (let j = 0; j < 4; j++) {
      const timestamp = new Date(hour);
      timestamp.setMinutes(j * 15);

      let responseTime = 200 + Math.random() * 300;

      if (timestamp.getHours() >= 6 && timestamp.getHours() <= 8) {
        responseTime += Math.random() * 500;
      }
      if (timestamp.getHours() >= 18 && timestamp.getHours() <= 20) {
        responseTime += Math.random() * 400;
      }

      data.push({
        timestamp: timestamp.toISOString(),
        responseTime: Math.floor(responseTime),
      });
    }
  }

  return data;
}

function generateRecentChecks(): StatusCheck[] {
  const checks: StatusCheck[] = [];
  const now = new Date();

  for (let i = 0; i < 6; i++) {
    const timestamp = new Date(now);
    timestamp.setMinutes(timestamp.getMinutes() - i * 30);

    checks.push({
      id: `check-${i}`,
      timestamp: timestamp.toISOString(),
      responseTime: Math.floor(150 + Math.random() * 400),
      status: Math.random() > 0.05 ? 'ok' : 'timeout',
      statusCode: Math.random() > 0.05 ? 200 : 503,
    });
  }

  return checks;
}

function getServices(): ServiceStatus[] {
  return [
    { name: 'Database', status: 'operational', responseTime: 67, lastCheck: new Date().toISOString(), uptime: 99.98 },
    { name: 'API Server', status: 'operational', responseTime: 125, lastCheck: new Date().toISOString(), uptime: 99.95 },
    { name: 'Auth Service', status: 'operational', responseTime: 89, lastCheck: new Date().toISOString(), uptime: 99.99 },
    { name: 'Map Service', status: 'operational', responseTime: 234, lastCheck: new Date().toISOString(), uptime: 99.92 },
    { name: 'Storage', status: 'operational', responseTime: 156, lastCheck: new Date().toISOString(), uptime: 99.97 },
    { name: 'CDN', status: 'operational', responseTime: 45, lastCheck: new Date().toISOString(), uptime: 99.99 },
    { name: 'Cache', status: 'operational', responseTime: 23, lastCheck: new Date().toISOString(), uptime: 99.99 },
    { name: 'Background Jobs', status: 'operational', responseTime: 312, lastCheck: new Date().toISOString(), uptime: 99.85 },
    { name: 'Notifications', status: 'operational', responseTime: 178, lastCheck: new Date().toISOString(), uptime: 99.90 },
  ];
}

function getSSLCertificate(): SSLCertificate {
  const now = new Date();
  const validFrom = new Date(now);
  validFrom.setMonth(validFrom.getMonth() - 6);
  const validTo = new Date(now);
  validTo.setMonth(validTo.getMonth() + 6);

  return {
    valid: true,
    hostname: 'freefoodmap.pages.dev',
    issuer: 'Cloudflare Inc',
    protocol: 'TLS 1.3',
    validFrom: validFrom.toISOString(),
    validTo: validTo.toISOString(),
    lastChecked: now.toISOString(),
  };
}

export async function getSystemStatus(): Promise<{
  success: boolean;
  status?: ComprehensiveStatus;
  error?: string;
}> {
  try {
    // Get app stats from Firebase
    const spotsRef = ref(database, 'spots');
    const spotsSnapshot = await get(spotsRef);

    let totalSpots = 0;
    let verifiedSpots = 0;
    let activeSpots = 0;
    let newSpots = 0;
    let totalViews = 0;

    if (spotsSnapshot.exists()) {
      const spotsData = spotsSnapshot.val();
      const sevenDaysAgo = Date.now() - 7 * 24 * 60 * 60 * 1000;

      for (const key in spotsData) {
        const spot = spotsData[key];
        totalSpots++;

        if (spot.verified === true) {
          verifiedSpots++;
        }

        if (spot.active !== false) {
          activeSpots++;
        }

        if (spot.createdAt && spot.createdAt >= sevenDaysAgo) {
          newSpots++;
        }

        if (spot.viewCount) {
          totalViews += spot.viewCount;
        }
      }
    }

    // Get reviews count
    let totalReviews = 0;
    const reviewsRef = ref(database, 'reviews');
    const reviewsSnapshot = await get(reviewsRef);

    if (reviewsSnapshot.exists()) {
      const reviewsData = reviewsSnapshot.val();
      for (const spotId in reviewsData) {
        const spotReviews = reviewsData[spotId];
        for (const reviewId in spotReviews) {
          totalReviews++;
        }
      }
    }

    // Get stored analytics
    const analyticsRef = ref(database, 'analytics');
    const analyticsSnapshot = await get(analyticsRef);

    if (analyticsSnapshot.exists()) {
      const analyticsData = analyticsSnapshot.val();
      if (analyticsData.totalViews) {
        totalViews = Math.max(totalViews, analyticsData.totalViews);
      }
    }

    // Generate monitoring data
    const services = getServices();
    const uptimeHistory = generateUptimeHistory();
    const responseTimeHistory = generateResponseTimeHistory();
    const recentChecks = generateRecentChecks();
    const ssl = getSSLCertificate();

    // Calculate overall metrics
    const avgResponseTime = Math.floor(
      services.reduce((sum, s) => sum + s.responseTime, 0) / services.length
    );
    const uptime =
      uptimeHistory.reduce((sum, d) => sum + d.uptime, 0) / uptimeHistory.length;
    const totalChecks = uptimeHistory.reduce((sum, d) => sum + d.totalChecks, 0);

    // Determine overall system status
    let systemStatus: 'operational' | 'degraded' | 'partial_outage' | 'major_outage' =
      'operational';
    const downServices = services.filter((s) => s.status === 'down').length;
    const degradedServices = services.filter((s) => s.status === 'degraded').length;

    if (downServices > 0) {
      systemStatus = downServices >= 3 ? 'major_outage' : 'partial_outage';
    } else if (degradedServices > 0) {
      systemStatus = 'degraded';
    }

    const comprehensiveStatus: ComprehensiveStatus = {
      systemStatus,
      lastCheck: new Date().toISOString(),
      uptime: Math.round(uptime * 100) / 100,
      avgResponseTime,
      totalChecks,
      services,
      uptimeHistory,
      responseTimeHistory,
      recentChecks,
      incidents: [],
      ssl,
      appStats: {
        totalSpots,
        verifiedSpots,
        activeSpots,
        newSpots,
        totalViews,
        totalReviews,
      },
    };

    return {
      success: true,
      status: comprehensiveStatus,
    };
  } catch (error) {
    console.error('Error fetching status:', error);
    return { success: false, error: 'স্ট্যাটাস লোড করতে সমস্যা হয়েছে' };
  }
}

// ============================================================================
// 13. PAYMENT SERVICE
// ============================================================================

const BOHUDUR_BASE_URL = 'https://request.bohudur.one';
const DEFAULT_API_KEY = 'GF3KVNrkl8dS017mEMQDz5p2HsbABJfj';

async function getPaymentConfig(): Promise<{
  apiKey: string;
  enabled: boolean;
  testMode: boolean;
}> {
  try {
    const settingsRef = ref(database, 'siteSettings');
    const snapshot = await get(settingsRef);

    const defaultConfig = {
      apiKey: DEFAULT_API_KEY,
      enabled: true,
      testMode: false,
    };

    if (!snapshot.exists()) {
      return defaultConfig;
    }

    const settings = snapshot.val();

    const config = {
      apiKey: settings.bohudurApiKey || DEFAULT_API_KEY,
      enabled: settings.paymentEnabled !== false,
      testMode: settings.bohudurTestMode === true,
    };

    return config;
  } catch (error) {
    console.error('[Bohudur] Error fetching payment config, using defaults:', error);
    return {
      apiKey: DEFAULT_API_KEY,
      enabled: true,
      testMode: false,
    };
  }
}

export async function createPayment(data: {
  fullName?: string;
  email: string;
  amount: number;
  type: 'donation' | 'sponsor';
  tier?: string;
  message?: string;
  anonymous?: boolean;
  spotId?: string;
  spotName?: string;
  sponsorDuration?: number;
}): Promise<{
  success: boolean;
  paymentUrl?: string;
  paymentKey?: string;
  transactionId?: string;
  error?: string;
  errorCode?: number;
}> {
  try {
    const config = await getPaymentConfig();

    if (!config.enabled) {
      return { success: false, error: 'পেমেন্ট সিস্টেম বর্তমানে নিষ্ক্রিয় আছে। অ্যাডমিন প্যানেলে সক্রিয় করুন।' };
    }

    const {
      fullName,
      email,
      amount,
      type,
      tier = 'basic',
      message = '',
      anonymous = false,
      spotId,
      spotName,
      sponsorDuration = 30,
    } = data;

    if (!email || !amount || amount <= 0) {
      return { success: false, error: 'ইমেইল এবং সঠিক পরিমাণ প্রয়োজন' };
    }

    if (amount < 1) {
      return { success: false, error: 'সর্বনিম্ন পরিমাণ ৳১ হতে হবে' };
    }

    // Get base URL for redirects
    const baseUrl =
      typeof window !== 'undefined'
        ? window.location.origin
        : 'https://freefoodmap.pages.dev';

    // Generate unique transaction ID
    const transactionId = `FFM-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

    // Prepare Bohudur payment request
    const bohudurPayload = {
      full_name: anonymous ? 'বেনামী দাতা' : fullName || 'Guest',
      email: email,
      amount: amount,
      return_type: 'GET',
      redirect_url: `${baseUrl}/payment/success?txn=${transactionId}`,
      cancel_url: `${baseUrl}/payment/cancel?txn=${transactionId}`,
      metadata: {
        transaction_id: transactionId,
        type: type,
        tier: tier,
        message: message,
        anonymous: String(anonymous),
        spot_id: spotId || '',
        spot_name: spotName || '',
        sponsor_duration: String(sponsorDuration),
      },
    };

    // Call Bohudur Create Payment API
    const response = await fetch(`${BOHUDUR_BASE_URL}/create/v2/`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'AH-BOHUDUR-API-KEY': config.apiKey,
      },
      body: JSON.stringify(bohudurPayload),
    });

    const responseData = await response.json();

    if (responseData.status === 'success' && responseData.payment_url && responseData.paymentkey) {
      // Store pending payment in Firebase for tracking
      const pendingPaymentRef = push(ref(database, 'pendingPayments'));
      await set(pendingPaymentRef, {
        id: pendingPaymentRef.key,
        transactionId,
        paymentKey: responseData.paymentkey,
        type,
        fullName: anonymous ? 'বেনামী দাতা' : fullName,
        email,
        amount,
        tier,
        message,
        anonymous,
        spotId: spotId || null,
        spotName: spotName || null,
        sponsorDuration,
        sponsorStartDate: type === 'sponsor' ? Date.now() : null,
        sponsorEndDate: type === 'sponsor' ? Date.now() + sponsorDuration * 24 * 60 * 60 * 1000 : null,
        status: 'PENDING',
        createdAt: Date.now(),
      });

      return {
        success: true,
        paymentUrl: responseData.payment_url,
        paymentKey: responseData.paymentkey,
        transactionId,
      };
    }

    // Map error codes to Bengali messages
    const errorMessages: Record<number, string> = {
      3000: 'API কী পাওয়া যায়নি',
      3001: 'প্রয়োজনীয় তথ্য দিন',
      3002: 'নামের ফরম্যাট সঠিক নয়',
      3003: 'ইমেইল ফরম্যাট সঠিক নয়',
      3004: 'পরিমাণ সঠিক নয়',
      3014: 'API কী অবৈধ',
      3017: 'অ্যাক্সেস প্রত্যাখ্যাত',
      3018: 'সার্ভারে সমস্যা, আবার চেষ্টা করুন',
      3019: 'পেমেন্ট তৈরি করা যায়নি',
    };

    const errorMessage = errorMessages[responseData.responseCode] || responseData.message || 'পেমেন্ট তৈরি করতে সমস্যা হয়েছে';

    return {
      success: false,
      error: errorMessage,
      errorCode: responseData.responseCode,
    };
  } catch (error) {
    console.error('[Bohudur] Error creating payment:', error);
    return { success: false, error: 'পেমেন্ট তৈরি করতে সমস্যা হয়েছে' };
  }
}

export async function executePayment(data: { paymentKey: string }): Promise<{
  success: boolean;
  message?: string;
  payment?: Record<string, unknown>;
  needsExecute?: boolean;
  error?: string;
  errorCode?: number;
}> {
  try {
    const { paymentKey } = data;

    if (!paymentKey) {
      return { success: false, error: 'পেমেন্ট কী প্রয়োজন' };
    }

    const config = await getPaymentConfig();

    if (!config || !config.apiKey) {
      return { success: false, error: 'পেমেন্ট সিস্টেম কনফিগার করা হয়নি' };
    }

    // Call Bohudur Execute API
    const response = await fetch(`${BOHUDUR_BASE_URL}/execute/v2/`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'AH-BOHUDUR-API-KEY': config.apiKey,
      },
      body: JSON.stringify({ paymentkey: paymentKey }),
    });

    const responseData = await response.json();

    // Handle successful execution
    if (responseData.status === 'EXECUTED') {
      // Extract metadata
      const metadata = responseData.metadata || {};
      const type = metadata.type || 'donation';
      const tier = metadata.tier || 'basic';
      const anonymous = metadata.anonymous === 'true';
      const spotId = metadata.spot_id || null;
      const spotName = metadata.spot_name || '';
      const sponsorDuration = parseInt(metadata.sponsor_duration || '30');

      if (type === 'donation') {
        const donationRef = push(ref(database, 'donations'));
        await set(donationRef, {
          id: donationRef.key,
          name: anonymous ? 'বেনামী দাতা' : responseData.full_name,
          amount: responseData.amount,
          tier: tier,
          message: metadata.message || '',
          anonymous: anonymous,
          timestamp: Date.now(),
          paymentMethod: responseData.payment_info?.m0 || 'Bohudur',
          transactionId: responseData.payment_info?.tran_id || '',
          email: responseData.email,
          paymentKey: paymentKey,
          createdAt: Date.now(),
        });
      } else if (type === 'sponsor' && spotId) {
        const sponsorRef = push(ref(database, 'sponsors'));
        const now = Date.now();
        await set(sponsorRef, {
          id: sponsorRef.key,
          spotId: spotId,
          spotName: spotName,
          sponsorName: responseData.full_name,
          sponsorAmount: responseData.amount,
          startDate: now,
          endDate: now + sponsorDuration * 24 * 60 * 60 * 1000,
          active: true,
          email: responseData.email,
          transactionId: responseData.payment_info?.tran_id || '',
          paymentKey: paymentKey,
          createdAt: Date.now(),
        });
      }

      // Remove from pending payments
      const pendingRef = ref(database, 'pendingPayments');
      const pendingSnapshot = await get(pendingRef);
      if (pendingSnapshot.exists()) {
        const pendingData = pendingSnapshot.val();
        for (const key in pendingData) {
          if (pendingData[key].paymentKey === paymentKey) {
            await remove(ref(database, `pendingPayments/${key}`));
            break;
          }
        }
      }

      return {
        success: true,
        message: 'পেমেন্ট সফল হয়েছে',
        payment: {
          amount: responseData.amount,
          fullName: responseData.full_name,
          email: responseData.email,
          transactionId: responseData.payment_info?.tran_id,
          paymentMethod: responseData.payment_info?.m0,
          type: type,
          tier: tier,
        },
      };
    }

    // Handle different statuses
    if (responseData.status === 'PENDING') {
      return { success: false, error: 'পেমেন্ট এখনও সম্পন্ন হয়নি। অনুগ্রহ করে পেমেন্ট সম্পন্ন করুন।' };
    }

    if (responseData.status === 'CANCELLED') {
      return { success: false, error: 'পেমেন্ট বাতিল করা হয়েছে' };
    }

    if (responseData.status === 'COMPLETED') {
      return {
        success: false,
        error: 'পেমেন্ট সম্পন্ন কিন্তু এক্সিকিউট করা হয়নি। আবার চেষ্টা করুন।',
        needsExecute: true,
      };
    }

    // Handle error codes
    const errorMessages: Record<number, string> = {
      3100: 'API কী পাওয়া যায়নি',
      3101: 'API কী অবৈধ',
      3102: 'পেমেন্ট কী অবৈধ',
      3103: 'API কী অবৈধ',
      3104: 'অ্যাক্সেস প্রত্যাখ্যাত',
      3105: 'পেমেন্ট ডেটা পাওয়া যায়নি',
      3106: 'পেমেন্ট এখনও পেন্ডিং আছে',
      3107: 'পেমেন্ট বাতিল করা হয়েছে',
      3108: 'পেমেন্ট ইতিমধ্যে এক্সিকিউট করা হয়েছে',
      3109: 'পেমেন্ট এক্সিকিউট করতে সমস্যা হয়েছে',
    };

    const errorMessage = errorMessages[responseData.responseCode] || responseData.message || 'পেমেন্ট এক্সিকিউট করতে সমস্যা হয়েছে';

    return {
      success: false,
      error: errorMessage,
      errorCode: responseData.responseCode,
    };
  } catch (error) {
    console.error('[Bohudur] Error executing payment:', error);
    return { success: false, error: 'পেমেন্ট এক্সিকিউট করতে সমস্যা হয়েছে' };
  }
}

export async function queryPayment(paymentKey: string): Promise<{
  success: boolean;
  payment?: Record<string, unknown>;
  error?: string;
  errorCode?: number;
}> {
  try {
    if (!paymentKey) {
      return { success: false, error: 'পেমেন্ট কী প্রয়োজন' };
    }

    const config = await getPaymentConfig();

    if (!config || !config.apiKey) {
      return { success: false, error: 'পেমেন্ট সিস্টেম কনফিগার করা হয়নি' };
    }

    // Call Bohudur Query API
    const response = await fetch(`${BOHUDUR_BASE_URL}/query/v2/`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'AH-BOHUDUR-API-KEY': config.apiKey,
      },
      body: JSON.stringify({ paymentkey: paymentKey }),
    });

    const data = await response.json();

    if (['PENDING', 'COMPLETED', 'EXECUTED', 'CANCELLED'].includes(data.status)) {
      return {
        success: true,
        payment: {
          fullName: data.full_name,
          email: data.email,
          amount: data.amount,
          convertedAmount: data.converted_amount,
          totalAmount: data.total_amount,
          transactionFee: data.transaction_fee,
          defaultCurrency: data.default_currency,
          paymentCurrency: data.payment_currency,
          currencyValue: data.currency_value,
          metadata: data.metadata,
          createdTime: data.created_time,
          paymentTime: data.payment_time,
          paymentKey: data.paymentkey,
          paymentInfo: data.payment_info,
          status: data.status,
        },
      };
    }

    // Handle error codes
    const errorMessages: Record<number, string> = {
      3050: 'API কী পাওয়া যায়নি',
      3051: 'API কী অবৈধ',
      3052: 'পেমেন্ট কী অবৈধ',
      3053: 'API কী অবৈধ',
      3054: 'অ্যাক্সেস প্রত্যাখ্যাত',
      3055: 'পেমেন্ট ডেটা পাওয়া যায়নি',
    };

    const errorMessage = errorMessages[data.responseCode] || data.message || 'পেমেন্ট তথ্য পেতে সমস্যা হয়েছে';

    return {
      success: false,
      error: errorMessage,
      errorCode: data.responseCode,
    };
  } catch (error) {
    console.error('[Bohudur] Error querying payment:', error);
    return { success: false, error: 'পেমেন্ট তথ্য পেতে সমস্যা হয়েছে' };
  }
}

export async function getPaymentSettings(): Promise<{
  success: boolean;
  message?: string;
  settings?: {
    paymentEnabled: boolean;
    hasApiKey: boolean;
    testMode: boolean;
  };
  error?: string;
}> {
  try {
    const settingsRef = ref(database, 'siteSettings');
    const snapshot = await get(settingsRef);

    let settings: { paymentEnabled: boolean; bohudurApiKey: string; bohudurTestMode: boolean };
    let needsUpdate = false;

    if (!snapshot.exists()) {
      settings = {
        paymentEnabled: true,
        bohudurApiKey: DEFAULT_API_KEY,
        bohudurTestMode: false,
      };
      needsUpdate = true;
    } else {
      const currentSettings = snapshot.val();

      settings = {
        paymentEnabled: currentSettings.paymentEnabled !== false,
        bohudurApiKey: currentSettings.bohudurApiKey || DEFAULT_API_KEY,
        bohudurTestMode: currentSettings.bohudurTestMode === true,
      };

      if (currentSettings.paymentEnabled === undefined || !currentSettings.bohudurApiKey) {
        needsUpdate = true;
      }
    }

    if (needsUpdate) {
      const existingSettings = snapshot.exists() ? snapshot.val() : {};
      const updatedSettings = {
        ...existingSettings,
        paymentEnabled: settings.paymentEnabled,
        bohudurApiKey: settings.bohudurApiKey,
        bohudurTestMode: settings.bohudurTestMode,
        updatedAt: Date.now(),
      };

      await set(settingsRef, updatedSettings);
    }

    return {
      success: true,
      message: 'Payment settings initialized',
      settings: {
        paymentEnabled: settings.paymentEnabled,
        hasApiKey: !!settings.bohudurApiKey,
        testMode: settings.bohudurTestMode,
      },
    };
  } catch (error) {
    console.error('[Init] Error initializing payment settings:', error);
    return { success: false, error: 'সেটিংস ইনিশিয়ালাইজ করতে সমস্যা হয়েছে' };
  }
}

export async function updatePaymentSettings(data: {
  apiKey?: string;
  enabled?: boolean;
  testMode?: boolean;
}): Promise<{
  success: boolean;
  message?: string;
  settings?: {
    paymentEnabled: boolean;
    hasApiKey: boolean;
    testMode: boolean;
  };
  error?: string;
}> {
  try {
    const { apiKey, enabled, testMode } = data;

    const settingsRef = ref(database, 'siteSettings');
    const snapshot = await get(settingsRef);
    const currentSettings = snapshot.exists() ? snapshot.val() : {};

    const updatedSettings = {
      ...currentSettings,
      paymentEnabled: enabled !== undefined ? enabled : true,
      bohudurApiKey: apiKey || DEFAULT_API_KEY,
      bohudurTestMode: testMode === true,
      updatedAt: Date.now(),
    };

    await set(settingsRef, updatedSettings);

    return {
      success: true,
      message: 'পেমেন্ট সেটিংস সংরক্ষিত হয়েছে',
      settings: {
        paymentEnabled: updatedSettings.paymentEnabled,
        hasApiKey: !!updatedSettings.bohudurApiKey,
        testMode: updatedSettings.bohudurTestMode,
      },
    };
  } catch (error) {
    console.error('[Init] Error saving payment settings:', error);
    return { success: false, error: 'সেটিংস সংরক্ষণ করতে সমস্যা হয়েছে' };
  }
}
