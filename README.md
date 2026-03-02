# Client Global English Website

Aplicação web para gestão acadêmica e operação de uma escola/plataforma de inglês, com foco em:

- autenticação e controle de acesso por papéis;
- gestão de cursos, trilhas, materiais e atividades;
- experiência de dashboard para alunos e administradores;
- backend integrado ao ecossistema Firebase.

## Objetivo do projeto

Este projeto centraliza fluxos de ensino e administração em uma única aplicação, permitindo:

- organização de conteúdos e trilhas de aprendizado;
- acompanhamento de atividades no ambiente do aluno;
- operações administrativas com rotas e APIs dedicadas.

## Stack e tecnologias

### Frontend

- **Next.js 16** (App Router)
- **React 19**
- **TypeScript 5**
- **Tailwind CSS 4**
- **Radix UI + componentes utilitários internos (`components/ui`)**

### Backend e serviços

- **Firebase Authentication** (login e gestão de sessão)
- **Cloud Firestore** (persistência de dados)
- **Firebase Admin SDK** (operações privilegiadas no servidor)
- **Cloudinary** (upload e gerenciamento de mídia)

### Qualidade e testes

- **ESLint 9** + **eslint-config-next**
- **Vitest 4** + **Testing Library** + **jsdom**

## Arquitetura e organização

O projeto está estruturado para separar responsabilidades por contexto:

- `app/`: páginas, layouts e rotas API (padrão App Router).
- `components/`: componentes compartilhados e biblioteca de UI.
- `modules/`: organização por domínio funcional (`courses`, `tracks`, `materials`, `activities`, `users`), incluindo UI, API client e modelos.
- `lib/`: integrações e utilitários transversais (Firebase, Cloudinary, autenticação, helpers).
- `hooks/`: hooks reutilizáveis.
- `tests/`: cobertura de testes unitários e de comportamento.

Essa organização reduz acoplamento entre áreas de negócio e facilita evolução incremental de cada módulo.

## Como o sistema funciona

Em alto nível, o fluxo principal é:

1. O usuário autentica via Firebase Auth.
2. A aplicação resolve permissões/papel de acesso (admin/aluno) com base em regras do backend.
3. As páginas de dashboard consomem dados dos módulos de domínio.
4. Operações administrativas usam rotas em `app/api/admin/*` com validações server-side.
5. Uploads e ativos de mídia passam pela integração com Cloudinary quando aplicável.

## Pré-requisitos

- Node.js (LTS recomendado)
- npm
- Projeto Firebase configurado (Auth + Firestore)
- Credenciais de serviço para recursos administrativos (quando necessário)

## Configuração de ambiente

O projeto utiliza variáveis de ambiente para conectar Firebase/Cloudinary e definir comportamento de autenticação.

Como você já possui `.env.local`, mantenha nele as variáveis abaixo (ajustadas para seu ambiente):

### Variáveis públicas (cliente)

- `NEXT_PUBLIC_FIREBASE_API_KEY`
- `NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN`
- `NEXT_PUBLIC_FIREBASE_PROJECT_ID`
- `NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET`
- `NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID`
- `NEXT_PUBLIC_FIREBASE_APP_ID`
- `NEXT_PUBLIC_SIGNUP_ENABLED`

### Variáveis privadas (servidor)

- `ADMIN_EMAILS`
- `FIREBASE_PROJECT_ID`
- `FIREBASE_CLIENT_EMAIL`
- `FIREBASE_PRIVATE_KEY` (com quebras de linha escapadas como `\n`)

### Cloudinary

- `CLOUDINARY_CLOUD_NAME`
- `CLOUDINARY_API_KEY`
- `CLOUDINARY_API_SECRET`

Referência de exemplo: `.env.local.example`.

## Instalação e execução

Instale as dependências:

`npm install`

Rode o ambiente de desenvolvimento:

`npm run dev`

Aplicação disponível em:

`http://localhost:3000`

## Scripts disponíveis

- `npm run dev`: inicia o servidor de desenvolvimento.
- `npm run build`: gera build de produção.
- `npm run start`: inicia a aplicação em modo produção.
- `npm run lint`: executa análise estática com ESLint.
- `npm run type`: valida tipagem TypeScript (`tsc --noEmit`).
- `npm run test`: executa testes com Vitest.
- `npm run test:watch`: executa testes em modo observação.
- `npm run test:coverage`: gera relatório de cobertura.

## Estrutura funcional (resumo)

- `app/dashboard/*`: áreas principais de uso (aluno e administração).
- `app/api/admin/*`: endpoints para operações administrativas.
- `modules/courses|tracks|materials|activities|users`: domínios de negócio.
- `lib/firebase/*`: configuração cliente/servidor e ações de autenticação.

## Boas práticas adotadas

- Tipagem forte com TypeScript em toda a base.
- Separação por domínio para escalabilidade de código.
- Rotas administrativas isoladas no servidor.
- Testes automatizados para regressão funcional.
- Configuração explícita de ambiente para segurança e previsibilidade.

## Observações operacionais

- Não versionar segredos reais (`.env.local` deve permanecer fora do Git).
- Validar regras do Firestore antes de publicar alterações.
- Revisar permissões de admin (`ADMIN_EMAILS`) em ambiente de produção.

## Licença

Defina aqui a licença oficial do projeto (ex.: MIT, proprietária, uso interno).
