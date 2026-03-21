# Inkforge ✒️

Plataforma de escritura literaria para autores hispanohablantes. Crea y gestiona novelas, cuentos, poesía y colecciones con un editor profesional.

## Stack

- **Frontend:** React 19 + TypeScript + Vite
- **Estilos:** TailwindCSS (paleta ink/parchment/copper)
- **Editor:** TipTap
- **Estado:** Zustand (optimistic updates)
- **Backend:** Supabase (Auth + PostgreSQL + RLS)
- **Router:** React Router v7

## Funcionalidades

- 📚 Gestión de proyectos (novela, cuento, poesía, colección)
- ✍️ Editor TipTap con toolbar completa
- 📑 Capítulos con drag & drop para reordenar
- 🔖 Front/Back Matter (dedicatoria, copyright, sobre el autor, etc.)
- ⚙️ Ajustes del libro (trim size, tipografía, márgenes)
- 🎯 Modo foco — escritura en pantalla completa
- 🔐 Autenticación con Supabase (email/contraseña)
- 💾 Persistencia real con optimistic updates

## Desarrollo local

```bash
# Instalar dependencias
npm install

# Variables de entorno
cp .env.example .env
# Completar VITE_SUPABASE_URL y VITE_SUPABASE_ANON_KEY

# Correr en desarrollo
npm run dev
```

## Variables de entorno

```env
VITE_SUPABASE_URL=https://tu-proyecto.supabase.co
VITE_SUPABASE_ANON_KEY=tu-anon-key
```
