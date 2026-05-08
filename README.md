# 🍽️ ফ্রি ফুড ম্যাপ (Free Food Map)

> বাংলাদেশে বিনামূল্যে খাবারের স্পট খুঁজুন ও যোগ করুন

![Next.js](https://img.shields.io/badge/Next.js-16-black?style=flat-square&logo=next.js)
![TypeScript](https://img.shields.io/badge/TypeScript-5-blue?style=flat-square&logo=typescript)
![Tailwind CSS](https://img.shields.io/badge/Tailwind-4-38B2AC?style=flat-square&logo=tailwind-css)
![Firebase](https://img.shields.io/badge/Firebase-Realtime_DB-FFCA28?style=flat-square&logo=firebase)

## ✨ ফিচার

- 🔍 **স্পট খুঁজুন** - আপনার এলাকায় বিনামূল্যে খাবারের স্পট খুঁজুন
- 📍 **লাইভ লোকেশন** - আপনার অবস্থান থেকে নিকটতম স্পট দেখুন
- ➕ **স্পট যোগ করুন** - নতুন খাবারের স্পট যোগ করুন
- ✅ **ভেরিফিকেশন** - যাচাইকৃত স্পট চিহ্নিত করা
- 📱 **মোবাইল রেসপন্সিভ** - সম্পূর্ণ মোবাইল বান্ধব ডিজাইন
- 🗺️ **ইন্টারঅ্যাক্টিভ ম্যাপ** - Leaflet ম্যাপ সহ স্পট লোকেশন
- 🇧🇩 **সম্পূর্ণ বাংলায়** - সবকিছু বাংলায়

## 🚀 কুইক স্টার্ট

### ১. রিপোজিটরি ক্লোন করুন

```bash
git clone https://github.com/yourusername/free-food-map.git
cd free-food-map
```

### ২. ডিপেন্ডেন্সি ইনস্টল করুন

```bash
npm install
# অথবা
bun install
```

### ৩. এনভায়রনমেন্ট ভেরিয়েবল সেট করুন

```bash
cp .env.example .env
```

`.env` ফাইলে আপনার Firebase কনফিগারেশন দিন:

```env
NEXT_PUBLIC_FIREBASE_API_KEY=your_api_key
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
NEXT_PUBLIC_FIREBASE_DATABASE_URL=https://your_project.firebaseio.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your_project_id
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your_project.appspot.com
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
NEXT_PUBLIC_FIREBASE_APP_ID=your_app_id

ADMIN_SECRET=your_secure_admin_secret
```

### ৪. ডেভেলপমেন্ট সার্ভার চালু করুন

```bash
npm run dev
```

ব্রাউজারে যান: [http://localhost:3000](http://localhost:3000)

## 📦 বিল্ড করুন

```bash
npm run build
npm run start
```

## ☁️ Cloudflare Pages ডিপ্লয়

### GitHub এ পুশ করুন

```bash
git add .
git commit -m "Initial commit"
git push origin main
```

### Cloudflare Pages সেটআপ

1. [Cloudflare Dashboard](https://dash.cloudflare.com) এ যান
2. **Pages** > **Create a project** > **Connect to Git**
3. আপনার GitHub রিপোজিটরি সিলেক্ট করুন
4. বিল্ড সেটিংস:
   - **Build command**: `npm run build`
   - **Build output directory**: `.next`
5. এনভায়রনমেন্ট ভেরিয়েবল যোগ করুন
6. **Save and Deploy** ক্লিক করুন

## 🔐 Admin Panel

Admin প্যানেল অ্যাক্সেস করতে:

1. `/admin` URL এ যান
2. আপনার `ADMIN_SECRET` দিয়ে লগইন করুন

⚠️ নিরাপত্তার জন্য Admin URL শুধুমাত্র সরাসরি URL দিয়ে অ্যাক্সেস করা যাবে।

## 🛠️ টেকনোলজি স্ট্যাক

- **Framework**: Next.js 16 (App Router)
- **Language**: TypeScript 5
- **Styling**: Tailwind CSS 4 + shadcn/ui
- **Database**: Firebase Realtime Database
- **Map**: Leaflet + React-Leaflet
- **Icons**: Lucide React
- **Animations**: Framer Motion
- **Charts**: Recharts

## 📁 প্রজেক্ট স্ট্রাকচার

```
free-food-map/
├── src/
│   ├── app/                 # Next.js App Router
│   │   ├── page.tsx        # হোম পেজ
│   │   ├── admin/          # অ্যাডমিন প্যানেল
│   │   ├── status/         # সিস্টেম স্ট্যাটাস
│   │   ├── dev-info/       # ডেভেলপার তথ্য
│   │   └── api/            # API রুট
│   ├── components/
│   │   ├── ui/             # shadcn/ui কম্পোনেন্ট
│   │   └── app/            # অ্যাপ কম্পোনেন্ট
│   ├── lib/                # ইউটিলিটি ফাংশন
│   ├── hooks/              # কাস্টম হুক
│   └── types/              # TypeScript টাইপ
├── public/                 # স্ট্যাটিক ফাইল
└── ...config files
```

## 🤝 কন্ট্রিবিউশন

1. Fork করুন
2. Feature branch তৈরি করুন (`git checkout -b feature/amazing-feature`)
3. Commit করুন (`git commit -m 'Add amazing feature'`)
4. Push করুন (`git push origin feature/amazing-feature`)
5. Pull Request খুলুন

## 📄 লাইসেন্স

MIT License - বিস্তারিত জানতে [LICENSE](LICENSE) দেখুন।

## ❤️ সাপোর্ট

কোনো সমস্যা হলে [Issues](https://github.com/yourusername/free-food-map/issues) এ জানান।

---

সবাই মিলে খাদ্য নিরাপত্তা নিশ্চিত করি 🇧🇩
