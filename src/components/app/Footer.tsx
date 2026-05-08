'use client';



export default function Footer() {
  return (
    <footer className="absolute z-[1001] bottom-[220px] left-3 sm:left-[15px] hidden sm:block">
      <div className="glass rounded-xl px-3 py-2 shadow-lg flex items-center gap-2 text-stone-400 backdrop-blur-md bg-white/30 border border-white/20">
        <a
          href="/status"
          className="flex items-center gap-1 text-[11px] text-stone-400 hover:text-emerald-600 transition-colors"
        >
          <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
          <span>স্ট্যাটাস</span>
        </a>
        <div className="w-px h-3 bg-stone-200" />
        <a
          href="/donate"
          className="flex items-center gap-1 text-[11px] text-stone-400 hover:text-orange-500 transition-colors"
        >
          <i className="bi bi-heart-fill text-xs"></i>
          <span>দান করুন</span>
        </a>
        <div className="w-px h-3 bg-stone-200" />
        <a
          href="/dev-info"
          className="flex items-center gap-1 text-[11px] text-stone-400 hover:text-emerald-600 transition-colors"
        >
          <i className="bi bi-info-circle text-xs"></i>
          <span>আমাদের সম্পর্কে</span>
        </a>
      </div>
    </footer>
  );
}
