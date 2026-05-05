# PLAN-plataforma-quiropractico

## 0. Socratic Gate (Preguntas Estratégicas y de Clarificación)
> [!IMPORTANT]
> Antes de proceder con la implementación, necesitamos definir algunos detalles clave para la arquitectura y las reglas de negocio. Por favor, revisa y responde estas preguntas:

1. **Gestión de Citas y Notificaciones:** ¿Cómo se manejarán las notificaciones para las citas (email, SMS, WhatsApp)? ¿Habrá integración con algún calendario externo (Google Calendar, Outlook)?
**Respuestas:**
Notificaciones: WhatsApp + email para recordatorios de citas. 
Sin Google Calendar por ahora, puede agregarse después.

2. **Sistema de Roles y Autenticación:** Además de administrador y paciente, ¿habrá roles intermedios como recepcionista o múltiples quiroprácticos (staff)? ¿Usaremos JWT simple o integraciones como OAuth2?
**Respuestas:**
Roles: Solo un usuario (el quiropráctico). Los pacientes NO 
tienen login. El quiropráctico agenda todo desde el dashboard.

3. **Manejo de Historial Clínico (Tratamientos):** ¿Existen requisitos de cumplimiento normativo (como HIPAA o equivalentes locales para privacidad de datos médicos)? ¿Se requiere subir archivos/imágenes médicas (radiografías) en el módulo de tratamientos?
**Respuestas:**
Historial clínico: Sin imágenes. Funciona como bitácora: 
terapias, ejercicios, patologías y medicamentos asignados.

4. **Sitio Público:** ¿El sitio público tendrá un flujo para que los pacientes reserven directamente sus citas o será puramente informativo y de contacto? ¿El frontend de la app pública estará integrado en el mismo proyecto React del dashboard o serán dos aplicaciones separadas (ej. Next.js para el sitio público por SEO)?
**Respuestas:**
Sitio público: El paciente no agenda desde la web, lo hace 
el quiropráctico desde el dashboard (puede agregarse después).
SEO es importante. El sitio tendrá un botón de login que 
lleva al dashboard del quiropráctico.

## 1. Visión General del Proyecto
Plataforma web integral para una clínica quiropráctica, con arquitectura desacoplada.
- **Backend:** Django REST Framework + MySQL
- **Frontend:** React
- **Módulos Principales:** Pacientes, Citas, Tratamientos, Inventario, Dashboard Administrativo, Sitio Público.

## 2. Arquitectura de Alto Nivel
- **Base de Datos:** MySQL estructurada de forma relacional.
- **Backend (API):** Aplicación monolítica en Django exponiendo endpoints RESTful. Autenticación basada en JWT.
- **Frontend (Admin/Dashboard):** React (SPA) interactuando con la API protegida.
- **Frontend (Sitio Público):** React (SPA o Next.js dependiente de los requerimientos de SEO) para consumo de API pública.

## 3. Desglose de Tareas (Task Breakdown)

### Fase 1: Configuración Inicial e Infraestructura
- [ ] Inicializar repositorio de Backend (Django) y configurar base de datos MySQL.
- [ ] Configurar Django REST Framework, JWT Auth y CORS.
- [ ] Inicializar repositorios/proyectos Frontend (React para Dashboard y Sitio Público).
- [ ] Configurar librerías base de UI (Tailwind CSS, Componentes) y ruteo.

### Fase 2: Backend - Modelado y API Core
- [ ] Módulo Autenticación y Usuarios (Roles: Admin, Staff, Paciente).
- [ ] Módulo Pacientes (Perfil, historial básico).
- [ ] Módulo Citas (Calendario, estados de cita).
- [ ] Módulo Tratamientos (Historial clínico, diagnósticos).
- [ ] Módulo Inventario (Productos, stock).

### Fase 3: Frontend - Dashboard Administrativo
- [ ] Implementar login y gestión de sesión (JWT).
- [ ] Layout principal y navegación del Dashboard.
- [ ] Pantalla de Gestión de Pacientes (CRUD).
- [ ] Pantalla de Calendario y Citas (Vista de agenda).
- [ ] Pantalla de Tratamientos (Registro de consultas).
- [ ] Pantalla de Inventario.

### Fase 4: Frontend - Sitio Público
- [ ] Landing page informativa (Servicios, Nosotros, Contacto).
- [ ] Integración de formulario de contacto / solicitud de cita.

### Fase 5: Integración y Pruebas
- [ ] Conexión completa Frontend-Backend.
- [ ] Pruebas unitarias de endpoints críticos en Django.
- [ ] Pruebas de integración en React.

## 4. Asignación de Agentes Recomendada
- `backend-specialist`: Modelado de MySQL, configuración de Django REST, endpoints y seguridad JWT.
- `frontend-specialist`: Desarrollo de componentes React, integración de API, diseño UI/UX del Dashboard y Sitio Público.
- `database-architect`: Optimización del esquema relacional MySQL para el historial clínico y citas concurrentes.

## 5. Criterios de Verificación (Checklist)
- [ ] Los usuarios pueden autenticarse según su rol.
- [ ] El CRUD de pacientes funciona correctamente en BDD y UI.
- [ ] Se pueden crear, editar y cancelar citas sin solapamientos inválidos.
- [ ] El inventario se actualiza y muestra advertencias de bajo stock.
- [ ] El sitio público carga correctamente y se comunica con la API.
