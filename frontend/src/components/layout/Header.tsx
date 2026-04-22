export default function Header() {
  return (
    <header className="h-24 m-4 ml-8 glass-panel flex items-center justify-between px-8 z-10 sticky top-4 animate-in slide-in-from-top duration-500">
      <div className="flex items-center gap-6">
        <div className="h-12 w-12 rounded-2xl bg-gradient-to-tr from-emerald-500 to-teal-500 flex items-center justify-center shadow-[0_0_20px_rgba(99,102,241,0.5)]">
           <span className="text-white font-black text-xl">M</span>
        </div>
        <div>
          <h2 className="text-2xl font-black tracking-tight text-white drop-shadow-md">
            Module Overview
          </h2>
        </div>
      </div>

      <div className="flex items-center gap-8">
        <span className="px-4 py-2 bg-gradient-to-r from-emerald-500/20 to-teal-500/20 text-emerald-300 rounded-xl text-xs font-black border border-emerald-400/30 uppercase tracking-widest shadow-[0_0_15px_rgba(59,130,246,0.2)]">
          Progress 1 Mode
        </span>
        
        <div className="flex flex-col items-end">
          <span className="text-[10px] font-black text-teal-300/60 uppercase tracking-widest">Target Met</span>
          <span className="text-sm font-black text-emerald-400 drop-shadow-[0_0_8px_rgba(52,211,153,0.5)]">35% Functional</span>
        </div>
        
        <button className="h-12 w-12 rounded-2xl bg-white/5 border border-white/20 hover:bg-white/10 text-white flex items-center justify-center text-sm font-black shadow-lg transition-all hover:scale-105 active:scale-95 hover:shadow-[0_0_20px_rgba(255,255,255,0.1)]">
          VS
        </button>
      </div>
    </header>
  );
}
