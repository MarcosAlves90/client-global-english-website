# Client Global English Website

Aplicação web para operação acadêmica de uma escola/plataforma de inglês. O sistema oferece autenticação, dashboards para alunos e administradores, gestão de cursos, trilhas, materiais, atividades e anexos.

## Stack

- Next.js 16 App Router, React 19 e TypeScript 5
- Tailwind CSS 4, Radix UI e componentes internos em `components/ui`
- Firebase Authentication, Cloud Firestore e Firebase Admin SDK
- Cloudinary para imagens e anexos
- ESLint, Vitest, Testing Library e jsdom

## Estrutura

- `app/`: páginas, layouts e rotas API.
- `components/`: componentes compartilhados e UI.
- `modules/`: domínios de cursos, trilhas, materiais, atividades e usuários.
- `lib/`: Firebase, Cloudinary, autenticação, contratos e utilitários.
- `tests/`: testes unitários e de comportamento.
- `scripts/`: migração Cloudinary e smoke tests E2E.

## Setup local

Requisitos: Node.js 20 e npm. Configure Firebase Authentication/Firestore, Firebase Admin e Cloudinary antes de iniciar:

```bash
cp .env.local.example .env.local
npm ci
npm run dev
```

A aplicação fica disponível em `http://localhost:3000`. Consulte [docs/SETUP.md](docs/SETUP.md) para os grupos de variáveis e a migração de URLs do Cloudinary.

Nunca versione `.env`, `.env.local`, chaves de service account ou segredos do Cloudinary.

## Comandos

| Comando | Finalidade |
| --- | --- |
| `npm run dev` | Servidor de desenvolvimento |
| `npm run build` | Build de produção |
| `npm run start` | Servir o build de produção |
| `npm run lint` | ESLint |
| `npm run type` | TypeScript sem emissão |
| `npm run test` | Testes unitários/componentes |
| `npm run test:coverage` | Testes com cobertura V8 |
| `npm run verify` | Lint, typecheck, testes e build |
| `npm run ci` | Verificações anteriores e os dois smoke tests E2E |
| `npm run migrate:cloudinary-cloud-name -- --dry-run` | Simular migração Cloudinary |
| `npm run migrate:cloudinary-cloud-name` | Aplicar migração Cloudinary |

Os smoke tests E2E exigem `.env.local` válido e fazem operações temporárias no Firebase/Cloudinary configurado. Leia [docs/TESTING.md](docs/TESTING.md) antes de executá-los.

## Fluxo do sistema

1. O usuário autentica com Firebase Auth.
2. O backend resolve a role a partir do documento do usuário e de `ADMIN_EMAILS`.
3. Dashboards consomem os módulos de domínio.
4. Rotas em `app/api/admin/*` exigem token Firebase e role `admin`.
5. Imagens e anexos usam Cloudinary quando aplicável.

Consulte [docs/API.md](docs/API.md) para rotas administrativas e contratos de entrada/saída.

## CI e release

O workflow em `.github/workflows/ci.yml` executa `npm ci`, `npm run lint` e `npm run test`. O gate local mais completo é `npm run verify`; `npm run ci` inclui os smoke tests e requer acesso aos serviços configurados.

O repositório não define provedor de deploy, promoção, rollback ou health check. Consulte [docs/DEPLOYMENT.md](docs/DEPLOYMENT.md) para os requisitos de runtime e limites operacionais documentados.

## Documentação

- [Setup local](docs/SETUP.md)
- [Testes](docs/TESTING.md)
- [API administrativa](docs/API.md)
- [Build e deployment](docs/DEPLOYMENT.md)
- [Changelog](CHANGELOG.md)

## Licença

Nenhum arquivo de licença ou campo `license` está declarado no repositório atualmente.
