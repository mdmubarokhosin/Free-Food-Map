'use client';

interface FooterProps {
  /** When true, renders a standard page footer (used on non-map pages) */
  standard?: boolean;
}

export default function Footer({ standard = false }: FooterProps) {
  if (standard) {
    return (
      <footer className="border-t border-stone-200/60 dark:border-stone-700/40 bg-[#FAFAF9]/60 dark:bg-[#111111]/60">
        <div className="container mx-auto px-3 sm:px-4 py-6">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <div className="h-7 w-7 rounded-lg bg-gradient-to-br from-teal-600 to-emerald-600 flex items-center justify-center shadow-sm">
                <i className="bi bi-cup-hot text-white text-[10px]"></i>
              </div>
              <span className="text-sm font-bold text-[#1C1917] dark:text-stone-200">ফ্রি ফুড ম্যাপ</span>
            </div>
            <nav className="flex flex-wrap items-center justify-center gap-3 sm:gap-4">
              <a href="/status" className="text-xs text-[#78716C] hover:text-teal-600 transition-colors duration-200 flex items-center gap-1">
                <i className="bi bi-info-circle text-xs"></i>
                স্ট্যাটাস
              </a>
              <a href="/events" className="text-xs text-[#78716C] hover:text-teal-600 transition-colors duration-200 flex items-center gap-1">
                <i className="bi bi-calendar3 text-xs"></i>
                ইভেন্ট
              </a>
              <a href="/donate" className="text-xs text-[#78716C] hover:text-orange-500 transition-colors duration-200 flex items-center gap-1">
                <i className="bi bi-heart text-xs"></i>
                দান করুন
              </a>
              <a href="/dev-info#about" className="text-xs text-[#78716C] hover:text-teal-600 transition-colors duration-200 flex items-center gap-1">
                <i className="bi bi-question-circle text-xs"></i>
                আমাদের সম্পর্কে
              </a>
              <a href="/admin" className="text-xs text-[#78716C] hover:text-stone-600 transition-colors duration-200 flex items-center gap-1">
                <i className="bi bi-gear text-xs"></i>
                এডমিন
              </a>
            </nav>
            <p className="text-xs text-[#78716C]">
              © {new Date().getFullYear()} ফ্রি ফুড ম্যাপ
            </p>
          </div>
        </div>
      </footer>
    );
  }

  return (
    <footer className="absolute z-[1001] bottom-[220px] left-3 sm:left-[15px] hidden sm:block">
      <div className="card-glass rounded-xl px-3 py-2 shadow-lg flex items-center gap-2 text-[#78716C] dark:text-stone-400">
        <a
          href="/status"
          className="flex items-center gap-1 text-[11px] text-[#78716C] dark:text-stone-400 hover:text-teal-600 transition-colors duration-200"
        >
          <div className="w-1.5 h-1.5 rounded-full bg-teal-500 animate-pulse" />
          <span>স্ট্যাটাস</span>
        </a>
        <div className="w-px h-3 bg-stone-300 dark:bg-stone-600" />
        <a
          href="/donate"
          className="flex items-center gap-1 text-[11px] text-[#78716C] dark:text-stone-400 hover:text-teal-600 transition-colors duration-200"
        >
          <i className="bi bi-heart-fill text-xs"></i>
          <span>দান করুন</span>
        </a>
        <div className="w-px h-3 bg-stone-300 dark:bg-stone-600" />
        <a
          href="/dev-info#about"
          className="flex items-center gap-1 text-[11px] text-[#78716C] dark:text-stone-400 hover:text-teal-600 transition-colors duration-200"
        >
          <i className="bi bi-info-circle text-xs"></i>
          <span>আমাদের সম্পর্কে</span>
        </a>
        <div className="w-px h-3 bg-stone-300 dark:bg-stone-600" />
        <a
          href="/dev-info#how-it-works"
          className="flex items-center gap-1 text-[11px] text-[#78716C] dark:text-stone-400 hover:text-teal-600 transition-colors duration-200"
        >
          <i className="bi bi-question-circle text-xs"></i>
          <span>কিভাবে কাজ করে</span>
        </a>
        <div className="w-px h-3 bg-stone-300 dark:bg-stone-600" />
        <a
          href="/dev-info#contact"
          className="flex items-center gap-1 text-[11px] text-[#78716C] dark:text-stone-400 hover:text-teal-600 transition-colors duration-200"
        >
          <i className="bi bi-envelope text-xs"></i>
          <span>যোগাযোগ</span>
        </a>
        <div className="w-px h-3 bg-stone-300 dark:bg-stone-600" />
        <a
          href="/admin"
          className="flex items-center gap-1 text-[11px] text-[#78716C] dark:text-stone-400 hover:text-teal-600 transition-colors duration-200"
        >
          <i className="bi bi-gear-fill text-xs"></i>
          <span>এডমিন</span>
        </a>
      </div>
    </footer>
  );
}
