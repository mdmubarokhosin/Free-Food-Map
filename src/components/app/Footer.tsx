'use client';

interface FooterProps {
  /** When true, renders a standard page footer (used on non-map pages) */
  standard?: boolean;
}

export default function Footer({ standard = false }: FooterProps) {
  if (standard) {
    return (
      <footer className="border-t border-[#EAE2D7] bg-[rgb(250,248,245)]/60">
        <div className="container mx-auto px-3 sm:px-4 py-6">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <div className="h-7 w-7 rounded-lg bg-white border border-[#107539] flex items-center justify-center shadow-sm">
                <div className="w-5 h-5 rounded gradient-primary-green flex items-center justify-center">
                  <i className="bi bi-cup-hot text-white text-[8px]"></i>
                </div>
              </div>
              <span className="text-sm font-bold text-[#0B411F]">ফ্রি ফুড ম্যাপ</span>
            </div>
            <nav className="flex flex-wrap items-center justify-center gap-3 sm:gap-4">
              <a href="/status" className="text-[10px] font-black uppercase tracking-wide text-emerald-800 hover:underline transition-colors duration-200">
                স্ট্যাটাস
              </a>
              <span className="text-emerald-600">·</span>
              <a href="/events" className="text-[10px] font-black uppercase tracking-wide text-emerald-800 hover:underline transition-colors duration-200">
                ইভেন্ট
              </a>
              <span className="text-emerald-600">·</span>
              <a href="/donate" className="text-[10px] font-black uppercase tracking-wide text-emerald-800 hover:underline transition-colors duration-200">
                দান করুন
              </a>
              <span className="text-emerald-600">·</span>
              <a href="/dev-info#about" className="text-[10px] font-black uppercase tracking-wide text-emerald-800 hover:underline transition-colors duration-200">
                আমাদের সম্পর্কে
              </a>
              <span className="text-emerald-600">·</span>
              <a href="/admin" className="text-[10px] font-black uppercase tracking-wide text-emerald-800 hover:underline transition-colors duration-200">
                এডমিন
              </a>
            </nav>
            <p className="text-[10px] font-bold text-[#14522B]">
              © {new Date().getFullYear()} ফ্রি ফুড ম্যাপ
            </p>
          </div>
        </div>
      </footer>
    );
  }

  // Map mode: no separate footer, homepage has its own footer
  return null;
}
