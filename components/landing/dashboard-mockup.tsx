import React from "react"
import { Users, BookOpen, CheckCircle2 } from "lucide-react"

// Extracted static array to prevent recreation on re-renders
const dashboardItems = [
    { title: "Conversação avançada", progress: "85%", days: "Hoje", icon: Users },
    { title: "Business writing", progress: "40%", days: "Em 2 dias", icon: BookOpen },
    { title: "Listening lab", progress: "100%", days: "Concluído", icon: CheckCircle2, done: true }
]

export function DashboardMockup() {
    return (
        <div className="relative mx-auto w-full max-w-[420px] sm:max-w-[500px] lg:max-w-none perspective-[1000px]">
            <div className="absolute -inset-1 rounded-[2rem] bg-linear-to-tr from-primary/30 to-accent/30 blur-2xl opacity-50"></div>
            <div className="relative rounded-[2rem] border bg-background/60 backdrop-blur-xl p-6 shadow-2xl ring-1 ring-border/50 transition-transform duration-500 md:p-8 md:hover:rotate-y-[-5deg] md:hover:rotate-x-[5deg]">
                <div className="space-y-5 md:space-y-6">
                    <div className="flex items-center justify-between text-xs sm:text-sm">
                        <div className="flex items-center gap-2 text-foreground font-medium">
                            <div className="size-2 rounded-full bg-green-500 animate-pulse"></div>
                            Visão Semanal
                        </div>
                        <span className="text-muted-foreground text-[10px] bg-muted px-2 py-1 rounded-md sm:text-xs">Hoje</span>
                    </div>

                    <div className="space-y-3 md:space-y-4">
                        {dashboardItems.map((item, i) => (
                            <div
                                key={i}
                                className={`group flex items-center gap-3 rounded-2xl border bg-card/50 p-3 transition-all hover:bg-card hover:shadow-md hover:-translate-y-0.5 md:gap-4 md:p-4 ${item.done ? 'border-green-500/20 bg-green-500/5' : ''}`}
                            >
                                <div className={`flex size-9 shrink-0 items-center justify-center rounded-full md:size-10 ${item.done ? 'bg-green-500 text-white' : 'bg-primary/10 text-primary'}`}>
                                    <item.icon className="size-4 md:size-5" />
                                </div>
                                <div className="flex-1 min-w-0">
                                    <p className="text-xs font-semibold text-foreground truncate sm:text-sm">
                                        {item.title}
                                    </p>
                                    <p className="text-[10px] text-muted-foreground sm:text-xs">
                                        {item.days}
                                    </p>
                                </div>
                                <span className={`shrink-0 rounded-full px-2 py-1 text-[10px] font-medium sm:px-3 sm:text-xs ${item.done ? 'bg-green-500/20 text-green-700 dark:text-green-400' : 'bg-muted text-foreground'}`}>
                                    {item.progress}
                                </span>
                            </div>
                        ))}
                    </div>

                    <div className="h-2 w-full bg-muted rounded-full overflow-hidden">
                        <div className="h-full bg-linear-to-r from-primary to-accent w-[75%] rounded-full"></div>
                    </div>
                </div>
            </div>
        </div>
    )
}
