# CONTEXT.md — Doctor Espalda
> Archivo de contexto persistente. Leer SIEMPRE al inicio de cada sesión antes de cualquier implementación.

---

## Descripción del Proyecto

Plataforma web para profesionalizar la presencia digital de un quiropráctico. Combina un sitio público informativo con un sistema de gestión clínica privado.

**Dos módulos principales:**
- **Sitio público (landing):** Presentación de servicios, contenido educativo sobre patologías, experiencia visual moderna. Optimizado para SEO.
- **Dashboard administrativo:** Gestión clínica completa (pacientes, citas, tratamientos, inventario, métricas). Solo accesible por el quiropráctico autenticado.

---

## Decisiones de Negocio Confirmadas

- **Un solo usuario del sistema:** El quiropráctico es el único que inicia sesión y gestiona todo.
- **Pacientes sin login:** Los pacientes son registros en la base de datos, no usuarios del sistema.
- **Agendamiento interno:** El quiropráctico agenda las citas desde el dashboard (el paciente no agenda desde la web — puede agregarse después).
- **Notificaciones:** WhatsApp + email para recordatorios de citas a pacientes.
- **Google Calendar:** No requerido ahora, puede integrarse en el futuro.
- **Historial clínico:** Funciona como bitácora — terapias, ejercicios, patologías, medicamentos asignados. Sin imágenes médicas.
- **SEO:** Importante para el sitio público → razón por la que se usa Next.js en el frontend público.
- **Login:** El sitio público tiene un botón de inicio de sesión que valida las credenciales del quiropráctico y redirige al dashboard admin.

---

## Stack Tecnológico

| Capa | Tecnología | Razón |
|---|---|---|
| Backend | Django + Django REST Framework | API REST robusta y escalable |
| Base de datos | MySQL / MariaDB | Relacional, adecuada para datos clínicos |
| Frontend público | Next.js (SSR/SSG) | SEO — Google indexa el HTML generado en servidor |
| Frontend admin | React SPA + TypeScript | Dashboard interactivo, no requiere SEO |
| Autenticación | JWT (djangorestframework-simplejwt) | Sin sesiones Django, stateless |
| Estilos | Tailwind CSS | En ambos frontends |
| Estado global (admin) | Zustand | Manejo de sesión y estado del dashboard |
| Fetching | axios con interceptors | Manejo automático de JWT en headers |
| Notificaciones | WhatsApp API (Twilio/Meta) + Email (SMTP/SendGrid) | Recordatorios de citas |

---

## Estructura de Carpetas del Proyecto

```
Doctor_espalda/
├── .agents/
│   ├── agents/              ← Agentes especializados
│   ├── global_workflows/    ← Slash commands
│   ├── rules/               ← GEMINI.md (reglas globales)
│   ├── scripts/             ← checklist.py, verify_all.py
│   ├── skills/              ← Módulos de conocimiento
│   └── CONTEXT.md           ← Este archivo
├── app_build/
│   ├── backend/             ← Django + DRF (API REST)
│   ├── frontend-public/     ← Next.js (sitio público + SEO)
│   └── frontend-admin/      ← React SPA (dashboard del quiropráctico)
└── production_artifacts/    ← Builds y configs de producción
```

> **Regla:** Todo el código generado va en `app_build/`. Los builds finales y Dockerfiles de producción van en `production_artifacts/`.

---

## Arquitectura del Backend (Django + DRF)

### Apps Django

| App | Responsabilidad |
|---|---|
| `accounts` | Autenticación JWT del quiropráctico |
| `patients` | Registro, perfil y bitácora clínica de pacientes |
| `appointments` | Agendamiento, disponibilidad y estados de citas |
| `treatments` | Terapias, ejercicios, patologías y medicamentos por sesión |
| `inventory` | Control de medicamentos, stock y alertas de reposición |
| `dashboard` | Endpoints de métricas y estadísticas |
| `notifications` | Envío de recordatorios por WhatsApp y email |
| `public_content` | Contenido del sitio público (servicios, patologías) |

### Convenciones Django

- Usar **ViewSets + Routers** para todos los endpoints CRUD.
- **Serializers** separados por operación cuando sea necesario (ej: `PatientListSerializer` vs `PatientDetailSerializer`).
- **Permisos:** `IsAuthenticated` para todo el dashboard. `AllowAny` solo para endpoints públicos.
- **Autenticación:** JWT — `djangorestframework-simplejwt`.
- Separar `settings/` en `base.py`, `development.py`, `production.py`.
- Variables sensibles siempre en `.env` — nunca hardcodeadas.
- Lógica de negocio en `services.py` por app, nunca en las views.
- Migraciones con nombres descriptivos.

### Estructura de carpetas Django

```
backend/
├── config/
│   ├── settings/
│   │   ├── base.py
│   │   ├── development.py
│   │   └── production.py
│   ├── urls.py
│   └── wsgi.py
├── apps/
│   ├── accounts/
│   ├── patients/
│   ├── appointments/
│   ├── treatments/
│   ├── inventory/
│   ├── dashboard/
│   ├── notifications/
│   └── public_content/
├── manage.py
└── requirements.txt
```

---

## Arquitectura del Frontend Público (Next.js)

### Propósito
Sitio informativo optimizado para SEO. No requiere autenticación. Incluye el botón de login que redirige al dashboard admin.

### Páginas

| Ruta | Descripción |
|---|---|
| `/` | Landing page — presentación del quiropráctico |
| `/servicios` | Catálogo de servicios y tratamientos |
| `/patologias` | Contenido educativo sobre patologías de columna |
| `/contacto` | Formulario de contacto |
| `/login` | Login del quiropráctico → redirige al dashboard admin |

### Convenciones Next.js

- Usar **App Router** (Next.js 14+).
- Páginas informativas con **SSG** (Static Site Generation) para máximo SEO.
- Componentes del servidor por defecto; `'use client'` solo cuando sea necesario.
- Metadata dinámica por página para SEO (`generateMetadata`).
- Tailwind CSS para estilos.
- TypeScript en todo el proyecto.

### Estructura de carpetas Next.js

```
frontend-public/
├── app/
│   ├── layout.tsx
│   ├── page.tsx              ← Landing
│   ├── servicios/page.tsx
│   ├── patologias/page.tsx
│   ├── contacto/page.tsx
│   └── login/page.tsx        ← Login del quiropráctico
├── components/
├── lib/                      ← Llamadas a la API pública de DRF
├── public/
├── next.config.ts
└── package.json
```

---

## Arquitectura del Frontend Admin (React SPA)

### Propósito
Dashboard privado del quiropráctico. Requiere JWT válido para acceder. No necesita SEO.

### Vistas principales

| Ruta | Descripción |
|---|---|
| `/` | Redirect a `/dashboard` si autenticado |
| `/dashboard` | Métricas generales, resumen del día |
| `/pacientes` | Lista, búsqueda y registro de pacientes |
| `/pacientes/:id` | Perfil del paciente + bitácora clínica |
| `/citas` | Agenda, calendario, gestión de citas |
| `/tratamientos` | Registro de terapias y seguimiento |
| `/inventario` | Control de medicamentos y stock |

### Convenciones React

- **Componentes funcionales** siempre, nunca class components.
- **Estado global:** Zustand para sesión JWT y estado compartido.
- **Fetching:** axios con interceptors — el token JWT se adjunta automáticamente a cada request.
- **Rutas protegidas:** Wrapper `<ProtectedRoute>` que verifica JWT antes de renderizar cualquier vista del dashboard.
- **Estilos:** Tailwind CSS.
- **Rutas:** React Router v6.
- Separar `components/` (reutilizables) y `pages/` (vistas completas).
- TypeScript en todo el proyecto.

### Estructura de carpetas React Admin

```
frontend-admin/
├── src/
│   ├── api/              ← Llamadas a la DRF API (axios)
│   ├── components/       ← Componentes reutilizables
│   ├── pages/
│   │   ├── Dashboard.tsx
│   │   ├── Pacientes.tsx
│   │   ├── PacienteDetalle.tsx
│   │   ├── Citas.tsx
│   │   ├── Tratamientos.tsx
│   │   └── Inventario.tsx
│   ├── hooks/            ← Custom hooks
│   ├── store/            ← Zustand (sesión, estado global)
│   ├── types/            ← Interfaces TypeScript
│   ├── utils/
│   └── router/           ← React Router + ProtectedRoute
├── public/
└── package.json
```

---

## Módulos del Sistema — Detalle Funcional

### Accounts (Autenticación)
- Un solo usuario: el quiropráctico
- Login con email + contraseña → devuelve JWT access + refresh token
- El sitio público expone `/api/auth/login/` con AllowAny
- Todos los demás endpoints del dashboard requieren `IsAuthenticated`

### Gestión de Pacientes
- Registro con datos personales y de contacto (nombre, teléfono, email, fecha de nacimiento)
- Bitácora clínica individual: cada entrada registra fecha, tipo de terapia, ejercicios asignados, patologías observadas, medicamentos
- Búsqueda y filtrado por nombre, fecha, patología

### Sistema de Citas
- El quiropráctico agenda la cita desde el dashboard: paciente, fecha, hora y tipo de consulta
- Estados: `pendiente` → `confirmada` → `completada` | `cancelada`
- Al crear/modificar una cita → trigger al módulo de notificaciones (WhatsApp + email al paciente)
- Vista de agenda semanal/mensual

### Notificaciones
- Al confirmar una cita: enviar recordatorio al paciente por WhatsApp y email
- Recordatorio automático 24h antes de la cita
- Integración: Twilio (WhatsApp) + SMTP o SendGrid (email)
- Los envíos se registran en base de datos para trazabilidad

### Tratamientos (Bitácora Clínica)
- Cada sesión genera una entrada: fecha, terapias aplicadas, ejercicios indicados, patologías, medicamentos asignados
- Vinculada al paciente y a la cita correspondiente
- Historial cronológico consultable por paciente

### Inventario
- Catálogo de medicamentos con nombre, descripción, stock actual y stock mínimo
- Alerta cuando el stock cae por debajo del mínimo
- Registro de uso: cada medicamento asignado en tratamiento descuenta del inventario automáticamente

### Dashboard Administrativo
- Métricas: total de pacientes, citas del día, citas de la semana, stock crítico
- Gráficas: pacientes registrados por mes, citas por semana
- Tablas interactivas con filtros

### Sitio Público
- Landing page profesional del quiropráctico
- Catálogo de servicios con descripciones
- Sección educativa sobre patologías comunes de columna
- Formulario de contacto
- Botón de login visible → `/login` → autentica y redirige al frontend-admin

---

## Prioridades de Desarrollo

1. **Backend: accounts + JWT** — Base de todo el sistema privado
2. **Backend: patients + appointments** — Core del negocio
3. **Backend: treatments + inventory + notifications** — Segunda capa funcional
4. **Backend: dashboard metrics + public_content** — Endpoints finales
5. **Frontend Admin: auth + layout + pacientes** — Primera pantalla funcional
6. **Frontend Admin: citas + tratamientos + inventario** — Módulos clínicos
7. **Frontend Admin: dashboard con métricas** — Capa de visualización
8. **Frontend Público: Next.js** — Sitio informativo + SEO
9. **Integración completa + tests** — Conexión end-to-end
10. **Deploy** — Production artifacts

---

## Lo que NUNCA hacer en este proyecto

- No hardcodear credenciales, tokens, API keys ni URLs
- No mezclar lógica de negocio en las views de Django — usar `services.py`
- No usar class components en React ni en Next.js
- No omitir tipado TypeScript en ningún componente o llamada a la API
- No hacer fetch directo desde componentes — siempre a través de `src/api/`
- No exponer endpoints del dashboard sin `IsAuthenticated`
- No guardar el JWT en localStorage — usar httpOnly cookies o memory store con refresh token