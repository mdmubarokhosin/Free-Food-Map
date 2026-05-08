'use client';

interface FooterProps {
  /** When true, renders a standard page footer (used on non-map pages) */
  standard?: boolean;
}

export default function Footer({ standard = false }: FooterProps) {
  if (standard) {
    return (
      <footer className="border-t border-gray-200 dark:border-gray-800 bg-white/50 dark:bg-gray-900/50">
        <div className="container mx-auto px-3 sm:px-4 py-6">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <div className="h-7 w-7 rounded-lg bg-gradient-to-br from-orange-400 to-amber-600 flex items-center justify-center">
                <span className="text-sm">🍽️</span>
              </div>
              <span className="text-sm font-bold text-foreground">ফ্রি ফুড ম্যাপ</span>
            </div>
            <nav className="flex flex-wrap items-center justify-center gap-3 sm:gap-4">
              <a href="/status" className="text-xs text-muted-foreground hover:text-emerald-600 transition-colors flex items-center gap-1">
                <i className="bi bi-info-circle text-xs"></i>
                স্ট্যাটাস
              </a>
              <a href="/events" className="text-xs text-muted-foreground hover:text-emerald-600 transition-colors flex items-center gap-1">
                <i className="bi bi-calendar3 text-xs"></i>
                ইভেন্ট
              </a>
              <a href="/donate" className="text-xs text-muted-foreground hover:text-emerald-600 transition-colors flex items-center gap-1">
                <i className="bi bi-heart text-xs"></i>
                দান করুন
              </a>
              <a href="/dev-info" className="text-xs text-muted-foreground hover:text-emerald-600 transition-colors flex items-center gap-1">
                <i className="bi bi-question-circle text-xs"></i>
                আমাদের সম্পর্কে
              </a>
              <a href="/admin" className="text-xs text-muted-foreground hover:text-emerald-600 transition-colors flex items-center gap-1">
                <i className="bi bi-gear text-xs"></i>
                এডমিন
              </a>
            </nav>
            <p className="text-xs text-muted-foreground">
              © {new Date().getFullYear()} ফ্রি ফুড ম্যাপ
            </p>
          </div>
        </div>
      </footer>
    );
  }

  return (
    <footer className="absolute z-[1001] bottom-[220px] left-3 sm:left-[15px] hidden sm:block">
      <div className="glass rounded-xl px-3 py-2 shadow-lg flex items-center gap-2 text-[#9CA3AF] backdrop-blur-md bg-white/30 border border-white/20">
        <a
          href="/status"
          className="flex items-center gap-1 text-[11px] text-[#9CA3AF] hover:text-teal-600 transition-colors"
        >
          <div className="w-1.5 h-1.5 rounded-full bg-teal-500 animate-pulse" />
          <span>স্ট্যাটাস</span>
        </a>
        <div className="w-px h-3 bg-[#374151]" />
        <a
          href="/donate"
          className="flex items-center gap-1 text-[11px] text-[#9CA3AF] hover:text-teal-600 transition-colors"
        >
          <i className="bi bi-heart-fill text-xs"></i>
          <span>দান করুন</span>
        </a>
        <div className="w-px h-3 bg-[#374151]" />
        <a
          href="/dev-info"
          className="flex items-center gap-1 text-[11px] text-[#9CA3AF] hover:text-teal-600 transition-colors"
        >
          <i className="bi bi-info-circle text-xs"></i>
          <span>আমাদের সম্পর্কে</span>
        </a>
        <div className="w-px h-3 bg-[#374151]" />
        <a
          href="/dev-info"
          className="flex items-center gap-1 text-[11px] text-[#9CA3AF] hover:text-teal-600 transition-colors"
        >
          <i className="bi bi-question-circle text-xs"></i>
          <span>কিভাবে কাজ করে</span>
        </a>
        <div className="w-px h-3 bg-[#374151]" />
        <a
          href="/dev-info"
          className="flex items-center gap-1 text-[11px] text-[#9CA3AF] hover:text-teal-600 transition-colors"
        >
          <i className="bi bi-envelope text-xs"></i>
          <span>যোগাযোগ</span>
        </a>
        <div className="w-px h-3 bg-[#374151]" />
        <a
          href="/admin"
          className="flex items-center gap-1 text-[11px] text-[#9CA3AF] hover:text-teal-600 transition-colors"
        >
          <i className="bi bi-gear-fill text-xs"></i>
          <span>এডমিন</span>
        </a>
      </div>
    </footer>
  );
}
