"use client"

import * as React from "react"
import {
    LifeBuoy,
    MessageCircle,
    Mail,
    FileText,
    ChevronRight,
    Search,
    BookOpen,
    Zap,
    Globe,
    Settings,
    AlertCircle
} from "lucide-react"

import { DashboardHeader } from "@/components/dashboard-header"
import { DashboardSectionHeader } from "@/components/dashboard-section-header"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import {
    Accordion,
    AccordionContent,
    AccordionItem,
    AccordionTrigger
} from "@/components/ui/accordion"

const FAQS = [
    {
        question: "Como acesso meus certificados?",
        answer: "Seus certificados ficam disponíveis na página de cada curso concluído. Você também pode encontrá-los na aba 'Meus Diplomas' em breve.",
        category: "Cursos"
    },
    {
        question: "Posso acessar a plataforma de vários dispositivos?",
        answer: "Sim, a Global English é responsiva e pode ser acessada de computadores, tablets e smartphones simultaneamente.",
        category: "Acesso"
    },
    {
        question: "Como altero minha senha?",
        answer: "Você pode alterar sua senha na página de Configurações, na seção de Segurança.",
        category: "Conta"
    },
    {
        question: "Quais são os requisitos técnicos?",
        answer: "Recomendamos o uso de navegadores modernos (Chrome, Firefox ou Safari) e uma conexão de internet estável.",
        category: "Técnico"
    }
]

const QUICK_LINKS = [
    { title: "Manuais", desc: "Guias passo a passo", icon: BookOpen },
    { title: "Status", desc: "Sistema online", icon: Zap },
    { title: "Comunidade", desc: "Fórum de alunos", icon: Globe },
    { title: "Ajustes", desc: "Preferências", icon: Settings },
]

export default function Page() {
    const [searchQuery, setSearchQuery] = React.useState("")

    const filteredFaqs = React.useMemo(() => {
        return FAQS.filter(faq =>
            faq.question.toLowerCase().includes(searchQuery.toLowerCase()) ||
            faq.answer.toLowerCase().includes(searchQuery.toLowerCase())
        )
    }, [searchQuery])

    return (
        <div className="flex-1">
            <DashboardHeader
                title="Central de Ajuda"
                description="Encontre respostas rápidas ou entre em contato com nosso time."
            />

            <div className="flex flex-col gap-8 p-6">
                {/* Search Hero */}
                <div className="relative overflow-hidden rounded-2xl bg-primary/5 border border-dashed border-primary/20 p-8 sm:p-12 text-center">
                    <div className="absolute top-0 right-0 p-4 opacity-5">
                        <LifeBuoy className="size-48 text-primary" />
                    </div>

                    <div className="relative z-10 space-y-4 max-w-xl mx-auto">
                        <h2 className="text-3xl font-bold tracking-tight">Como podemos ajudar?</h2>
                        <div className="relative group">
                            <Search className="absolute left-4 top-1/2 -translate-y-1/2 size-5 text-muted-foreground transition-colors group-focus-within:text-primary" />
                            <Input
                                placeholder="Pesquisar por dúvidas, recursos ou tutoriais..."
                                className="h-14 pl-12 pr-4 bg-background/60 backdrop-blur-md border-primary/20 text-lg rounded-2xl shadow-xl transition-all focus:ring-primary/20"
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                            />
                        </div>
                        <p className="text-xs text-muted-foreground">
                            Ex: &quot;como resetar senha&quot;, &quot;acessar certificados&quot;, &quot;materiais extras&quot;
                        </p>
                    </div>
                </div>

                {/* Support Options */}
                <div className="grid gap-6 md:grid-cols-2">
                    <Card className="bg-card/40 backdrop-blur-sm border-primary/5 group transition-all hover:border-primary/20">
                        <CardContent className="p-6 flex items-start gap-4">
                            <div className="p-3 rounded-2xl bg-primary/10 text-primary transition-transform group-hover:scale-110">
                                <MessageCircle className="size-6" />
                            </div>
                            <div className="space-y-1">
                                <h3 className="font-semibold">Suporte via Chat</h3>
                                <p className="text-xs text-muted-foreground leading-relaxed">
                                    Fale com um atendente em tempo real para dúvidas urgentes.
                                </p>
                                <div className="pt-2">
                                    <Button size="sm" variant="link" className="p-0 h-auto text-primary">
                                        Iniciar conversa <ChevronRight className="size-3 ml-1" />
                                    </Button>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    <Card className="bg-card/40 backdrop-blur-sm border-primary/5 group transition-all hover:border-primary/20">
                        <CardContent className="p-6 flex items-start gap-4">
                            <div className="p-3 rounded-2xl bg-primary/10 text-primary transition-transform group-hover:scale-110">
                                <Mail className="size-6" />
                            </div>
                            <div className="space-y-1">
                                <h3 className="font-semibold">Abertura de Ticket</h3>
                                <p className="text-xs text-muted-foreground leading-relaxed">
                                    Envie solicitações detalhadas de suporte ou reporte bugs.
                                </p>
                                <div className="pt-2">
                                    <Button size="sm" variant="link" className="p-0 h-auto text-primary">
                                        Enviar email <ChevronRight className="size-3 ml-1" />
                                    </Button>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </div>

                {/* FAQ Section */}
                <div className="space-y-6">
                    <DashboardSectionHeader
                        title="Perguntas Frequentes"
                        description="As dúvidas mais comuns resolvidas na hora."
                        icon={FileText}
                    />

                    <Card className="bg-card/40 backdrop-blur-sm border-primary/5 overflow-hidden">
                        <CardContent className="p-0">
                            {filteredFaqs.length > 0 ? (
                                <Accordion type="single" collapsible className="w-full">
                                    {filteredFaqs.map((faq, index) => (
                                        <AccordionItem
                                            key={index}
                                            value={`item-${index}`}
                                            className="border-primary/5 px-6 last:border-0"
                                        >
                                            <AccordionTrigger className="hover:no-underline py-4 text-sm font-medium">
                                                <div className="flex items-center gap-3 text-left">
                                                    <span className="text-[10px] font-bold uppercase tracking-widest text-primary px-2 py-0.5 bg-primary/10 rounded">
                                                        {faq.category}
                                                    </span>
                                                    {faq.question}
                                                </div>
                                            </AccordionTrigger>
                                            <AccordionContent className="pb-4 text-sm text-muted-foreground leading-relaxed">
                                                {faq.answer}
                                            </AccordionContent>
                                        </AccordionItem>
                                    ))}
                                </Accordion>
                            ) : (
                                <div className="p-12 text-center space-y-3">
                                    <AlertCircle className="size-8 mx-auto text-muted-foreground opacity-50" />
                                    <p className="text-sm text-muted-foreground">Nenhuma resposta encontrada para sua pesquisa.</p>
                                    <Button variant="outline" size="sm" onClick={() => setSearchQuery("")}>Limpar busca</Button>
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </div>

                {/* Quick Links */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                    {QUICK_LINKS.map((link) => (
                        <Card key={link.title} className="bg-card/40 backdrop-blur-sm border-primary/5 hover:bg-primary/5 transition-all text-center group cursor-pointer">
                            <CardContent className="p-6 space-y-2">
                                <link.icon className="size-6 mx-auto text-muted-foreground group-hover:text-primary transition-colors" />
                                <h4 className="text-sm font-semibold">{link.title}</h4>
                                <p className="text-[10px] text-muted-foreground">{link.desc}</p>
                            </CardContent>
                        </Card>
                    ))}
                </div>
            </div>
        </div>
    )
}
