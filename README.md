# YLIKA — Business Operating System

YLIKA es un **Business Operating System** centrado en **Expedientes de Negocio**, no en módulos ERP clásicos.

## Paradigma

```
Workspace → Prospectos → Clientes → Operaciones → Insights
```

Toda operación vive dentro de un `EXPEDIENTE_NEGOCIO` (ej. `EXP-000452`).

La vista clave de un expediente combina:

- **Timeline** (izquierda) — historia viva del negocio
- **Business Graph** (centro) — nodos navegables
- **AI Insights** (derecha) — riesgos y recomendaciones

## Stack

| Capa | Tecnología |
|------|------------|
| Frontend | Next.js 15, React 19, TypeScript, Tailwind, shadcn/ui, Framer Motion |
| Backend | NestJS |
| Base de datos | PostgreSQL + pgvector (Supabase) |
| IA | OpenAI / Claude / Gemini (stubs listos) |

## Estructura

```
apps/web          → Frontend YLIKA
apps/api          → API NestJS
packages/shared   → Tipos de dominio compartidos
supabase/migrations → Schema PostgreSQL completo
```

## Arranque rápido

```bash
pnpm install
pnpm dev:web    # http://localhost:3000
pnpm dev:api    # http://localhost:3001/api
```

O en paralelo:

```bash
pnpm dev
```

## Navegación

| Ruta | Descripción |
|------|-------------|
| `/workspace` | Home del sistema |
| `/prospectos` | Embudo comercial |
| `/clientes` | Relaciones y expedientes |
| `/operaciones` | Portafolio de expedientes (tarjetas vivas) |
| `/operaciones/EXP-000875` | Workspace: Timeline + Graph + AI |
| `/insights` | Señales IA del portafolio |

**Command Palette:** `⌘K` / `Ctrl+K`

**Ingestar IA:** botón en el header — demo con `cotizacion_cemex.pdf`

## Modelo de datos

Jerarquía fundamental:

```
EMPRESA_GRUPO → EMPRESA → PROSPECTOS / CLIENTES / EXPEDIENTES_NEGOCIO
```

Dentro de cada expediente: venta directa, proyecto, compras, tesorería, participantes, rentabilidad y auditoría.

El schema completo está en:

`supabase/migrations/20260314000000_ylika_schema.sql`

## API

| Método | Endpoint | Descripción |
|--------|----------|-------------|
| GET | `/api/health` | Health check |
| GET | `/api/expedientes` | Portafolio |
| GET | `/api/expedientes/:codigo` | Expediente completo |
| GET | `/api/expedientes/:codigo/timeline` | Timeline |
| GET | `/api/expedientes/:codigo/graph` | Business Graph |
| GET | `/api/expedientes/:codigo/insights` | AI Insights |
| GET | `/api/prospectos` | Prospectos |
| GET | `/api/clientes` | Clientes |
| POST | `/api/ai/ingest` | Clasificación documental (stub) |

## Próximos pasos

1. Conectar Supabase (MCP auth + `vercel env pull` / keys en `.env.local`)
2. Aplicar migración SQL y sembrar datos
3. Cablear proveedores IA reales en `AiService`
4. Sustituir seed del frontend por fetch a la API

## Diseño

Inspiración: Linear, Notion, Raycast, Stripe, Arc, Vercel, VisionOS.

Marca: **YLIKA** (teal + naranja). Evita navegación tipo Ventas / Compras / Facturación / Tesorería.
