// Internationalization system for Free Food Map
// Supports Bengali (bn) and English (en)

export type Language = 'bn' | 'en';

export const LANGUAGES: Record<Language, { name: string; nativeName: string; flag: string }> = {
  bn: {
    name: 'Bengali',
    nativeName: 'বাংলা',
    flag: '🇧🇩',
  },
  en: {
    name: 'English',
    nativeName: 'English',
    flag: '🇬🇧',
  },
};

// Translation keys and values
export type TranslationKey = 
  // Navigation
  | 'home'
  | 'status'
  | 'info'
  | 'addSpot'
  | 'map'
  | 'filter'
  | 'search'
  // Status badges
  | 'open'
  | 'closed'
  | 'verified'
  | 'new'
  // Actions
  | 'share'
  | 'report'
  | 'favorite'
  | 'unfavorite'
  | 'directions'
  | 'cancel'
  | 'submit'
  | 'save'
  | 'delete'
  | 'edit'
  | 'close'
  | 'loading'
  // App name and taglines
  | 'appName'
  | 'appTagline'
  | 'appFooter'
  | 'allAreWelcome'
  // Home page
  | 'goToHomePage'
  | 'systemStatus'
  | 'viewSystemStatus'
  | 'developerInfo'
  | 'aboutUs'
  | 'theme'
  | 'lightDarkMode'
  // Filter bar
  | 'searchByNameOrArea'
  | 'all'
  | 'verifiedOnly'
  | 'openNow'
  // Spot types
  | 'dailyMeal'
  | 'weeklyMeal'
  | 'groceryAssistance'
  | 'soupKitchen'
  | 'other'
  // Days
  | 'sunday'
  | 'monday'
  | 'tuesday'
  | 'wednesday'
  | 'thursday'
  | 'friday'
  | 'saturday'
  // Add Spot Modal
  | 'addNewSpot'
  | 'yourLocation'
  | 'getLocation'
  | 'accuracy'
  | 'searchingNearbyPlaces'
  | 'nearbyPlaces'
  | 'useCustomLocation'
  | 'ifNotInList'
  | 'timeLimit'
  | 'optional'
  | 'temporarySpotInfo'
  | 'thisIsTemporarySpot'
  | 'startDate'
  | 'endDate'
  | 'autoDeleteAfterEnd'
  | 'willBeAutoDeleted'
  | 'placeName'
  | 'type'
  | 'selectType'
  | 'address'
  | 'fullAddress'
  | 'area'
  | 'areaName'
  | 'city'
  | 'cityName'
  | 'country'
  | 'countryName'
  | 'latitudeLongitude'
  | 'latitude'
  | 'longitude'
  | 'viewOnGoogleMaps'
  | 'openDays'
  | 'openTime'
  | 'closeTime'
  | 'additionalNotes'
  | 'anyAdditionalInfo'
  // Spot Card
  | 'update'
  | 'daysRemaining'
  | 'endsToday'
  | 'until'
  // Report Modal
  | 'reportProblem'
  | 'reportForSpot'
  | 'reportType'
  | 'wrongInfo'
  | 'spotClosed'
  | 'spamFraud'
  | 'inappropriateContent'
  | 'other'
  | 'otherReport'
  | 'detailedDescription'
  | 'describeProblem'
  | 'yourInfoWillHelp'
  | 'selectReportType'
  | 'pleaseSelectReportType'
  | 'reportSuccessful'
  | 'reportReceived'
  | 'reportFailed'
  | 'tryAgain'
  // Messages
  | 'spotAddedSuccess'
  | 'spotAddFailed'
  | 'errorOccurred'
  | 'success'
  | 'error'
  | 'bothDatesRequired'
  | 'endDateAfterStartDate'
  // Time ago
  | 'justNow'
  | 'minutesAgo'
  | 'hoursAgo'
  | 'daysAgo'
  | 'minute'
  | 'hour'
  | 'day'
  // Period
  | 'am'
  | 'pm'
  // Meters/KM
  | 'meters'
  | 'km'
  // Reviews
  | 'reviews'
  | 'addReview'
  | 'rating'
  | 'yourName'
  | 'yourComment'
  | 'noReviewsYet'
  | 'beFirstToReview'
  // Admin
  | 'adminPanel'
  | 'totalSpots'
  | 'activeSpots'
  | 'expiredSpots'
  | 'pendingVerification'
  | 'totalViews'
  | 'totalReviewsReport'
  | 'language'
  | 'switchLanguage';

export type Translations = Record<TranslationKey, string>;

const translations: Record<Language, Translations> = {
  bn: {
    // Navigation
    home: 'হোম',
    status: 'স্ট্যাটাস',
    info: 'তথ্য',
    addSpot: 'স্পট যোগ করুন',
    map: 'ম্যাপ',
    filter: 'ফিল্টার',
    search: 'খুঁজুন',
    // Status badges
    open: 'খোলা',
    closed: 'বন্ধ',
    verified: 'ভেরিফাইড',
    new: 'নতুন',
    // Actions
    share: 'শেয়ার',
    report: 'রিপোর্ট',
    favorite: 'পছন্দ',
    unfavorite: 'পছন্দ সরান',
    directions: 'ডিরেকশন',
    cancel: 'বাতিল',
    submit: 'জমা দিন',
    save: 'সংরক্ষণ',
    delete: 'মুছুন',
    edit: 'সম্পাদনা',
    close: 'বন্ধ',
    loading: 'লোড হচ্ছে...',
    // App name and taglines
    appName: 'ফ্রি ফুড ম্যাপ',
    appTagline: 'সবার জন্য উন্মুক্ত',
    appFooter: 'সবাই মিলে খাদ্য নিরাপত্তা নিশ্চিত করি',
    allAreWelcome: 'সবার জন্য উন্মুক্ত',
    // Home page
    goToHomePage: 'মূল পৃষ্ঠায় যান',
    systemStatus: 'সিস্টেম স্ট্যাটাস',
    viewSystemStatus: 'সিস্টেমের অবস্থা দেখুন',
    developerInfo: 'ডেভেলপার তথ্য',
    aboutUs: 'আমাদের সম্পর্কে জানুন',
    theme: 'থিম',
    lightDarkMode: 'লাইট/ডার্ক মোড',
    // Filter bar
    searchByNameOrArea: 'নাম বা এলাকা খুঁজুন...',
    all: 'সব',
    verifiedOnly: 'ভেরিফাইড',
    openNow: 'এখন খোলা',
    // Spot types
    dailyMeal: 'দৈনিক খাবার',
    weeklyMeal: 'সাপ্তাহিক খাবার',
    groceryAssistance: 'গ্রোসারি সহায়তা',
    soupKitchen: 'স্যুপ কিচেন',
    other: 'অন্যান্য',
    // Days
    sunday: 'রবিবার',
    monday: 'সোমবার',
    tuesday: 'মঙ্গলবার',
    wednesday: 'বুধবার',
    thursday: 'বৃহস্পতিবার',
    friday: 'শুক্রবার',
    saturday: 'শনিবার',
    // Add Spot Modal
    addNewSpot: 'নতুন স্পট যোগ করুন',
    yourLocation: 'আপনার লোকেশন',
    getLocation: 'লোকেশন নিন',
    accuracy: 'নির্ভুলতা',
    searchingNearbyPlaces: 'কাছাকাছি স্থান খুঁজছে...',
    nearbyPlaces: 'কাছাকাছি স্থান (সিলেক্ট করুন):',
    useCustomLocation: 'কাস্টম লোকেশন ব্যবহার করুন',
    ifNotInList: 'যদি স্থান তালিকায় না থাকে',
    timeLimit: 'সময়ের সীমা',
    optional: 'ঐচ্ছিক',
    temporarySpotInfo: 'যদি খাবার বিতরণ নির্দিষ্ট সময়ের জন্য হয় (যেমন ঈদ, রমজান, বিশেষ ক্যাম্পেইন) তাহলে তারিখ দিন।',
    thisIsTemporarySpot: 'এটি একটি অস্থায়ী স্পট',
    startDate: 'শুরুর তারিখ',
    endDate: 'শেষের তারিখ',
    autoDeleteAfterEnd: 'শেষ তারিখের পর স্পটটি অটোমেটিক মুছে ফেলুন',
    willBeAutoDeleted: 'তারিখের পর এই স্পটটি স্বয়ংক্রিয়ভাবে মুছে যাবে।',
    placeName: 'জায়গার নাম',
    type: 'টাইপ',
    selectType: 'টাইপ নির্বাচন করুন',
    address: 'ঠিকানা',
    fullAddress: 'সম্পূর্ণ ঠিকানা',
    area: 'এলাকা',
    areaName: 'এলাকার নাম',
    city: 'শহর',
    cityName: 'শহরের নাম',
    country: 'দেশ',
    countryName: 'দেশের নাম',
    latitudeLongitude: 'অক্ষাংশ ও দ্রাঘিমাংশ',
    latitude: 'অক্ষাংশ',
    longitude: 'দ্রাঘিমাংশ',
    viewOnGoogleMaps: 'Google Maps এ দেখুন',
    openDays: 'খোলা দিন',
    openTime: 'খোলার সময়',
    closeTime: 'বন্ধের সময়',
    additionalNotes: 'অতিরিক্ত নোট',
    anyAdditionalInfo: 'যেকোনো অতিরিক্ত তথ্য...',
    // Spot Card
    update: 'আপডেট',
    daysRemaining: 'দিন বাকি',
    endsToday: 'আজ শেষ',
    until: 'পর্যন্ত',
    // Report Modal
    reportProblem: 'সমস্যা রিপোর্ট করুন',
    reportForSpot: 'স্পটটির জন্য সমস্যা রিপোর্ট করুন',
    reportType: 'রিপোর্টের ধরন',
    wrongInfo: 'ভুল তথ্য',
    spotClosed: 'স্পট বন্ধ হয়ে গেছে',
    spamFraud: 'স্প্যাম/প্রতারণা',
    inappropriateContent: 'অশ্লীল বিষয়বস্তু',
    otherReport: 'অন্যান্য',
    detailedDescription: 'বিস্তারিত বর্ণনা',
    describeProblem: 'সমস্যার বিস্তারিত লিখুন (ঐচ্ছিক)...',
    yourInfoWillHelp: 'আপনার প্রদত্ত তথ্য আমাদের এই সমস্যা তদন্তে সাহায্য করবে',
    selectReportType: 'রিপোর্ট টাইপ নির্বাচন করুন',
    pleaseSelectReportType: 'অনুগ্রহ করে একটি রিপোর্ট টাইপ নির্বাচন করুন',
    reportSuccessful: 'রিপোর্ট সফল হয়েছে',
    reportReceived: 'আপনার রিপোর্ট আমাদের কাছে পৌঁছে গেছে। ধন্যবাদ!',
    reportFailed: 'রিপোর্ট করতে সমস্যা হয়েছে',
    tryAgain: 'আবার চেষ্টা করুন',
    // Messages
    spotAddedSuccess: 'স্পট সফলভাবে যোগ হয়েছে',
    spotAddFailed: 'স্পট যোগ করতে সমস্যা হয়েছে',
    errorOccurred: 'সমস্যা হয়েছে',
    success: 'সফল',
    error: 'সমস্যা',
    bothDatesRequired: 'শুরু এবং শেষ তারিখ দুটোই দিতে হবে',
    endDateAfterStartDate: 'শেষ তারিখ শুরু তারিখের পরে হতে হবে',
    // Time ago
    justNow: 'এইমাত্র',
    minutesAgo: 'মিনিট আগে',
    hoursAgo: 'ঘণ্টা আগে',
    daysAgo: 'দিন আগে',
    minute: 'মিনিট',
    hour: 'ঘণ্টা',
    day: 'দিন',
    // Period
    am: 'পূর্বাহ্ন',
    pm: 'অপরাহ্ন',
    // Meters/KM
    meters: 'মিটার',
    km: 'কিমি',
    // Reviews
    reviews: 'রিভিউ',
    addReview: 'রিভিউ যোগ করুন',
    rating: 'রেটিং',
    yourName: 'আপনার নাম',
    yourComment: 'আপনার মন্তব্য',
    noReviewsYet: 'কোনো রিভিউ নেই',
    beFirstToReview: 'প্রথম রিভিউ দিন',
    // Admin
    adminPanel: 'অ্যাডমিন প্যানেল',
    totalSpots: 'মোট স্পট',
    activeSpots: 'সক্রিয় স্পট',
    expiredSpots: 'মেয়াদোত্তীর্ণ স্পট',
    pendingVerification: 'অপেক্ষমান ভেরিফিকেশন',
    totalViews: 'মোট ভিউ',
    totalReviewsReport: 'মোট রিভিউ',
    // Language
    language: 'ভাষা',
    switchLanguage: 'ভাষা পরিবর্তন',
  },
  en: {
    // Navigation
    home: 'Home',
    status: 'Status',
    info: 'Info',
    addSpot: 'Add Spot',
    map: 'Map',
    filter: 'Filter',
    search: 'Search',
    // Status badges
    open: 'Open',
    closed: 'Closed',
    verified: 'Verified',
    new: 'New',
    // Actions
    share: 'Share',
    report: 'Report',
    favorite: 'Favorite',
    unfavorite: 'Unfavorite',
    directions: 'Directions',
    cancel: 'Cancel',
    submit: 'Submit',
    save: 'Save',
    delete: 'Delete',
    edit: 'Edit',
    close: 'Close',
    loading: 'Loading...',
    // App name and taglines
    appName: 'Free Food Map',
    appTagline: 'Open for everyone',
    appFooter: 'Together we ensure food security',
    allAreWelcome: 'Open for everyone',
    // Home page
    goToHomePage: 'Go to home page',
    systemStatus: 'System Status',
    viewSystemStatus: 'View system status',
    developerInfo: 'Developer Info',
    aboutUs: 'Learn about us',
    theme: 'Theme',
    lightDarkMode: 'Light/Dark mode',
    // Filter bar
    searchByNameOrArea: 'Search by name or area...',
    all: 'All',
    verifiedOnly: 'Verified',
    openNow: 'Open Now',
    // Spot types
    dailyMeal: 'Daily Meal',
    weeklyMeal: 'Weekly Meal',
    groceryAssistance: 'Grocery Assistance',
    soupKitchen: 'Soup Kitchen',
    other: 'Other',
    // Days
    sunday: 'Sunday',
    monday: 'Monday',
    tuesday: 'Tuesday',
    wednesday: 'Wednesday',
    thursday: 'Thursday',
    friday: 'Friday',
    saturday: 'Saturday',
    // Add Spot Modal
    addNewSpot: 'Add New Spot',
    yourLocation: 'Your Location',
    getLocation: 'Get Location',
    accuracy: 'Accuracy',
    searchingNearbyPlaces: 'Searching nearby places...',
    nearbyPlaces: 'Nearby places (select one):',
    useCustomLocation: 'Use custom location',
    ifNotInList: 'if not in the list',
    timeLimit: 'Time Limit',
    optional: 'Optional',
    temporarySpotInfo: 'If food distribution is for a specific period (e.g., Eid, Ramadan, special campaign), provide the dates.',
    thisIsTemporarySpot: 'This is a temporary spot',
    startDate: 'Start Date',
    endDate: 'End Date',
    autoDeleteAfterEnd: 'Auto-delete spot after end date',
    willBeAutoDeleted: 'This spot will be automatically deleted after the end date.',
    placeName: 'Place Name',
    type: 'Type',
    selectType: 'Select type',
    address: 'Address',
    fullAddress: 'Full address',
    area: 'Area',
    areaName: 'Area name',
    city: 'City',
    cityName: 'City name',
    country: 'Country',
    countryName: 'Country name',
    latitudeLongitude: 'Latitude & Longitude',
    latitude: 'Latitude',
    longitude: 'Longitude',
    viewOnGoogleMaps: 'View on Google Maps',
    openDays: 'Open Days',
    openTime: 'Open Time',
    closeTime: 'Close Time',
    additionalNotes: 'Additional Notes',
    anyAdditionalInfo: 'Any additional information...',
    // Spot Card
    update: 'Update',
    daysRemaining: 'days remaining',
    endsToday: 'Ends today',
    until: 'until',
    // Report Modal
    reportProblem: 'Report Problem',
    reportForSpot: 'Report problem for spot',
    reportType: 'Report Type',
    wrongInfo: 'Wrong Information',
    spotClosed: 'Spot has closed',
    spamFraud: 'Spam/Fraud',
    inappropriateContent: 'Inappropriate Content',
    otherReport: 'Other',
    detailedDescription: 'Detailed Description',
    describeProblem: 'Describe the problem (optional)...',
    yourInfoWillHelp: 'Your information will help us investigate this issue',
    selectReportType: 'Select report type',
    pleaseSelectReportType: 'Please select a report type',
    reportSuccessful: 'Report Successful',
    reportReceived: 'Your report has been received. Thank you!',
    reportFailed: 'Failed to report',
    tryAgain: 'Please try again',
    // Messages
    spotAddedSuccess: 'Spot added successfully',
    spotAddFailed: 'Failed to add spot',
    errorOccurred: 'An error occurred',
    success: 'Success',
    error: 'Error',
    bothDatesRequired: 'Both start and end dates are required',
    endDateAfterStartDate: 'End date must be after start date',
    // Time ago
    justNow: 'Just now',
    minutesAgo: 'minutes ago',
    hoursAgo: 'hours ago',
    daysAgo: 'days ago',
    minute: 'minute',
    hour: 'hour',
    day: 'day',
    // Period
    am: 'AM',
    pm: 'PM',
    // Meters/KM
    meters: 'm',
    km: 'km',
    // Reviews
    reviews: 'Reviews',
    addReview: 'Add Review',
    rating: 'Rating',
    yourName: 'Your Name',
    yourComment: 'Your Comment',
    noReviewsYet: 'No reviews yet',
    beFirstToReview: 'Be the first to review',
    // Admin
    adminPanel: 'Admin Panel',
    totalSpots: 'Total Spots',
    activeSpots: 'Active Spots',
    expiredSpots: 'Expired Spots',
    pendingVerification: 'Pending Verification',
    totalViews: 'Total Views',
    totalReviewsReport: 'Total Reviews',
    // Language
    language: 'Language',
    switchLanguage: 'Switch Language',
  },
};

// Spot type translations
export const SPOT_TYPE_TRANSLATIONS: Record<Language, Record<string, string>> = {
  bn: {
    daily_meal: 'দৈনিক খাবার',
    weekly_meal: 'সাপ্তাহিক খাবার',
    grocery: 'গ্রোসারি সহায়তা',
    soup_kitchen: 'স্যুপ কিচেন',
    other: 'অন্যান্য',
  },
  en: {
    daily_meal: 'Daily Meal',
    weekly_meal: 'Weekly Meal',
    grocery: 'Grocery Assistance',
    soup_kitchen: 'Soup Kitchen',
    other: 'Other',
  },
};

// Day translations
export const DAY_TRANSLATIONS: Record<Language, Record<string, string>> = {
  bn: {
    sunday: 'রবিবার',
    monday: 'সোমবার',
    tuesday: 'মঙ্গলবার',
    wednesday: 'বুধবার',
    thursday: 'বৃহস্পতিবার',
    friday: 'শুক্রবার',
    saturday: 'শনিবার',
  },
  en: {
    sunday: 'Sunday',
    monday: 'Monday',
    tuesday: 'Tuesday',
    wednesday: 'Wednesday',
    thursday: 'Thursday',
    friday: 'Friday',
    saturday: 'Saturday',
  },
};

// Short day translations
export const DAY_SHORT_TRANSLATIONS: Record<Language, Record<string, string>> = {
  bn: {
    sunday: 'রবি',
    monday: 'সোম',
    tuesday: 'মঙ্গল',
    wednesday: 'বুধ',
    thursday: 'বৃহঃ',
    friday: 'শুক্র',
    saturday: 'শনি',
  },
  en: {
    sunday: 'Sun',
    monday: 'Mon',
    tuesday: 'Tue',
    wednesday: 'Wed',
    thursday: 'Thu',
    friday: 'Fri',
    saturday: 'Sat',
  },
};

// Report type translations
export const REPORT_TYPE_TRANSLATIONS: Record<Language, Record<string, string>> = {
  bn: {
    wrong_info: 'ভুল তথ্য',
    spot_closed: 'স্পট বন্ধ হয়ে গেছে',
    spam_fraud: 'স্প্যাম/প্রতারণা',
    inappropriate: 'অশ্লীল বিষয়বস্তু',
    other: 'অন্যান্য',
  },
  en: {
    wrong_info: 'Wrong Information',
    spot_closed: 'Spot has closed',
    spam_fraud: 'Spam/Fraud',
    inappropriate: 'Inappropriate Content',
    other: 'Other',
  },
};

// Get translation function
export function getTranslation(lang: Language, key: TranslationKey): string {
  return translations[lang][key] || translations.en[key] || key;
}

// Get all translations for a language
export function getTranslations(lang: Language): Translations {
  return translations[lang];
}

// Bengali number converter
export function toBengaliNumber(num: number | string, lang: Language = 'bn'): string {
  if (lang === 'en') return String(num);
  const bengaliDigits = ['০', '১', '২', '৩', '৪', '৫', '৬', '৭', '৮', '৯'];
  return String(num).replace(/[0-9]/g, (d) => bengaliDigits[parseInt(d)]);
}

// Local storage key for language preference
export const LANGUAGE_STORAGE_KEY = 'free-food-map-language';

// Get stored language or default
export function getStoredLanguage(): Language {
  if (typeof window === 'undefined') return 'bn';
  const stored = localStorage.getItem(LANGUAGE_STORAGE_KEY);
  if (stored === 'bn' || stored === 'en') return stored;
  return 'bn'; // Default to Bengali
}

// Set stored language
export function setStoredLanguage(lang: Language): void {
  if (typeof window === 'undefined') return;
  localStorage.setItem(LANGUAGE_STORAGE_KEY, lang);
}
