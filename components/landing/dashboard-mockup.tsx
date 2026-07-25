import { BarChart3, BookOpen, Check, Flame, Headphones, Play } from "lucide-react"

const lessons = [
  { title: "Listening lab", meta: "Unidade 04 · 18 min", progress: "75%", icon: Headphones, tone: "text-sky-300 bg-sky-300/10" },
  { title: "Business writing", meta: "Unidade 02 · 24 min", progress: "40%", icon: BookOpen, tone: "text-violet-300 bg-violet-300/10" },
  { title: "Conversation practice", meta: "Unidade 01 · 12 min", progress: "100%", icon: Check, tone: "text-emerald-300 bg-emerald-300/10", done: true },
]

export function DashboardMockup() {
  return (
    <div className="relative mx-auto w-full max-w-[590px] lg:mx-0 lg:justify-self-end" aria-label="Prévia do painel de estudos">
      <div className="absolute -inset-5 rounded-[2.5rem] bg-linear-to-br from-violet-400/25 via-sky-300/10 to-transparent blur-3xl" aria-hidden="true" />
      <div className="relative overflow-hidden rounded-[1.5rem] border border-white/15 bg-[#12131a]/90 shadow-[0_30px_100px_rgba(0,0,0,.45)] backdrop-blur-2xl ge-float sm:rounded-[2rem]">
        <div className="flex items-center gap-2 border-b border-white/10 bg-white/[0.04] px-5 py-4 sm:px-6">
          <span className="size-2.5 rounded-full bg-[#ff5f57] shadow-[0_0_8px_#ff5f57]" />
          <span className="size-2.5 rounded-full bg-[#febc2e] shadow-[0_0_8px_#febc2e]" />
          <span className="size-2.5 rounded-full bg-[#28c840] shadow-[0_0_8px_#28c840]" />
          <span className="ml-3 text-[10px] font-medium tracking-wide text-white/30">globalenglish.app / overview</span>
        </div>
        <div className="grid gap-8 p-5 sm:p-8 md:grid-cols-[1fr_150px] md:gap-7">
          <div>
            <div className="flex items-start justify-between">
              <div>
                <p className="text-[10px] font-medium uppercase tracking-[0.18em] text-white/35">Visão geral</p>
                <h2 className="mt-2 text-xl font-semibold tracking-[-0.04em] text-white sm:text-2xl">Olá, estudante <span aria-hidden="true">✦</span></h2>
              </div>
              <div className="flex size-9 items-center justify-center rounded-full border border-white/10 bg-linear-to-br from-violet-300 to-sky-300 text-xs font-bold text-[#12131a]">GE</div>
            </div>
            <div className="mt-7 rounded-2xl border border-white/10 bg-white/[0.045] p-4 sm:p-5">
              <div className="flex items-center justify-between">
                <div><p className="text-[10px] text-white/40">Trilha atual</p><p className="mt-1 text-sm font-semibold text-white">English in context</p></div>
                <span className="rounded-full bg-emerald-300/10 px-2 py-1 text-[10px] font-medium text-emerald-300">Em andamento</span>
              </div>
              <div className="mt-5 flex items-end justify-between"><p className="text-2xl font-semibold tracking-tight text-white">68%</p><p className="text-[10px] text-white/35">progresso da trilha</p></div>
              <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-white/10"><div className="ge-progress h-full w-[68%] rounded-full bg-linear-to-r from-violet-300 to-sky-300" /></div>
            </div>
            <div className="mt-7 flex items-center justify-between"><p className="text-xs font-semibold text-white/80">Continue de onde parou</p><span className="text-[10px] text-white/35">Ver tudo <span aria-hidden="true">→</span></span></div>
            <div className="mt-3 space-y-2">
              {lessons.map((lesson) => {
                const Icon = lesson.icon
                return <div className="flex items-center gap-3 rounded-xl border border-white/8 bg-white/[0.025] p-3" key={lesson.title}>
                  <div className={`flex size-8 shrink-0 items-center justify-center rounded-lg ${lesson.tone}`}><Icon className="size-4" /></div>
                  <div className="min-w-0 flex-1"><p className="truncate text-[11px] font-medium text-white/80">{lesson.title}</p><p className="mt-0.5 truncate text-[9px] text-white/35">{lesson.meta}</p></div>
                  <span className={`text-[10px] font-semibold ${lesson.done ? "text-emerald-300" : "text-white/45"}`}>{lesson.progress}</span>
                </div>
              })}
            </div>
          </div>
          <aside className="grid grid-cols-2 gap-2 md:block md:space-y-2" aria-label="Resumo de atividade">
            <div className="rounded-2xl border border-white/10 bg-violet-300/[0.08] p-4"><Flame className="size-4 text-violet-200" /><p className="mt-5 text-xl font-semibold text-white">04</p><p className="mt-1 text-[10px] text-white/40">dias de ritmo</p></div>
            <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-4"><BarChart3 className="size-4 text-sky-200" /><p className="mt-5 text-xl font-semibold text-white">12</p><p className="mt-1 text-[10px] text-white/40">atividades feitas</p></div>
            <button className="ge-shimmer col-span-2 flex items-center justify-center gap-2 rounded-2xl border border-white/10 bg-white/[0.08] p-3 text-[10px] font-semibold text-white transition-colors hover:bg-white/[0.13] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-300 md:mt-2 md:w-full" type="button" aria-label="Continuar próxima atividade"><Play className="size-3 fill-current" /> Continuar</button>
          </aside>
        </div>
      </div>
    </div>
  )
}
