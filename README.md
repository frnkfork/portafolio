# 🎙️ EasyMenu Voice-Admin
### La revolución de la gestión gastronómica manos libres.

**EasyMenu Voice-Admin** es una plataforma SaaS diseñada para digitalizar la operativa de restaurantes modernos. Combina la potencia de **Supabase Realtime**, comandos de voz con IA y una interfaz premium para ofrecer una experiencia de gestión fluida tanto para el personal del restaurante como para los comensales.

---

## 💡 Solución a Problemas Reales

En el caos de una cocina o barra, la eficiencia y la higiene son críticas.
- **Gestión Manos Libres**: Cambia precios, agota productos o consulta pedidos usando comandos de voz mientras sigues cocinando.
- **Sincronización Total**: Cualquier cambio en el Dashboard (stock, precios, disponibilidad) se refleja instantáneamente en el móvil del cliente mediante WebSockets.
- **Cero Latencia de Pedidos**: Recibe comandas con alertas sonoras y visuales al instante, sin refrescar la página.

---

## ✨ Características Principales

### 🎤 Administración por Voz (NLP)
Controla tu negocio con lenguaje natural. El sistema procesa órdenes complejas y da feedback auditivo.
- *"Aplica un descuento del 15% a todas las Bebidas"*
- *"Se terminó el Lomo Saltado"* (Lo marca como agotado y aplica efecto visual en la carta)
- *"Aumenta el precio del Ceviche a 42 soles"*

### 📑 Sistema de Gestión de Pedidos (Live)
Un panel táctico para el control de comandas:
- **Flujo de Cocina**: Estados dinámicos (Pendiente ⮕ Preparando ⮕ Entregado).
- **Auto-Limpieza**: Los pedidos entregados se eliminan de la base de datos tras 30 segundos para mantener la agilidad del sistema.
- **Notificaciones 360°**: Alertas por voz, efectos de sonido y avisos visuales (Toasts).

### 🤳 Smart QR & Vista Cliente
- **Acceso Directo**: El sistema genera un código QR que detecta automáticamente si debe mostrar la carta digital (`view=customer`).
- **Universalidad**: Compatible con despliegues en local y producción (Vercel) mediante la variable `VITE_PUBLIC_URL`.
- **Detección de Mesas**: Reconocimiento automático del número de mesa mediante URL (`?mesa=X`).

### 🎨 Branding & UX Premium
- **Iconografía B&W**: Favicon minimalista personalizado (Olla con vapor).
- **Live Mirroring**: Drawer lateral que simula un iPhone real en tiempo real dentro del Dashboard.
- **Smart Placeholders**: Sistema inteligente que garantiza que ningún plato se vea sin imagen, usando placeholders gastronómicos de alta calidad.

---

## 🛠️ Stack Tecnológico

- **Frontend**: React 19 + TypeScript.
- **Estilos**: Tailwind CSS 4 para una UI ultra-moderna.
- **Backend & Realtime**: Supabase (PostgreSQL + Realtime).
- **Animaciones**: Framer Motion.
- **Voz**: Web Speech API (Synthesis & Recognition).
- **Iconos**: Lucide React.

---

## 🚀 Instalación y Configuración

1. **Clonar el repositorio**
   ```bash
   git clone [url-del-repo]
   cd easy-menu-saas
   ```

2. **Instalar dependencias**
   ```bash
   npm install
   ```

3. **Variables de Entorno (`.env.local`)**
   Crea el archivo en la raíz con tus credenciales de Supabase:
   ```env
   VITE_SUPABASE_URL=tu_url_de_supabase
   VITE_SUPABASE_ANON_KEY=tu_clave_anon
   
   # Opcional: Para que el QR apunte siempre a producción aunque estés en local
   VITE_PUBLIC_URL=https://tu-proyecto.vercel.app
   ```

4. **Correr el proyecto**
   ```bash
   npm run dev
   ```

---

## 📦 Despliegue en Vercel

1. Sube tu código a GitHub.
2. Conecta el repo en Vercel.
3. Configura las **Environment Variables** (`VITE_SUPABASE_URL`, etc.) en el panel de Vercel.
4. El despliegue será automático en cada `push`.

---

## 📱 Guía para Pruebas en Móvil
Si quieres probar el QR desde tu celular mientras programas en local:
1. Conecta PC y Celular a la misma red Wi-Fi.
2. Entra al Dashboard usando tu **IP Local** (ej: `http://192.168.1.XX:5173`).
3. Abre el QR y escanéalo. ¡La carta aparecerá en tu móvil al instante!

---

Desarrollado con ❤️ para la nueva era de la gastronomía digital. 🍽️✨
