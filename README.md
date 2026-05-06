# 🦴 Doctor Espalda — Plataforma de Gestión Clínica

Plataforma web integral para la administración de una clínica quiropráctica. Incluye un panel administrativo privado para gestionar pacientes, citas, tratamientos e inventario, y un sitio web público orientado a la captación de nuevos pacientes.

---

## 📂 Estructura del Proyecto

```
Doctor_espalda/
├── app_build/
│   ├── backend/            # API REST — Django + DRF + MySQL
│   ├── frontend-admin/     # Panel administrativo — React + Vite + TypeScript
│   └── frontend-public/    # Sitio público — Next.js 14 + App Router
├── docs/                   # Documentación del proyecto
├── .gitignore
└── README.md
```

---

## 🛠️ Stack Tecnológico

| Capa            | Tecnología                                                    |
| --------------- | ------------------------------------------------------------- |
| **Backend**     | Django 6, Django REST Framework, SimpleJWT, MySQL              |
| **Admin**       | React 18, Vite, TypeScript, Tailwind CSS, Zustand, Axios      |
| **Público**     | Next.js 14 (App Router), TypeScript, Tailwind CSS              |
| **Base de Datos** | MySQL 8 (InnoDB)                                             |
| **Autenticación** | JWT (access + refresh tokens almacenados en memoria)         |

---

## 🗄️ Modelo de Datos

```
administrador ─── gestiona todo el sistema
pacientes ─────── pueden tener múltiples citas y seguimientos
agendamientos ─── citas vinculadas a un paciente (validación de solapamientos)
tratamientos ──── catálogo de servicios ofrecidos
medicamentos ──── inventario con control de stock automático
seguimiento ───── bitácora inmutable: paciente + tratamiento + medicamento (opcional)
```
