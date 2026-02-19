# 🎙️ EasyMenu Voice-Admin
### La revolución de la gestión gastronómica manos libres.

**EasyMenu Voice-Admin** es una solución SaaS diseñada para digitalizar la operativa de restaurantes modernos. Permite a los dueños y staff de cocina gestionar su carta, inventario y pedidos en tiempo real utilizando la potencia de la inteligencia artificial y comandos de voz, eliminando la fricción de las pantallas táctiles durante las horas punta.

---

## 💡 Solución a Problemas Reales

En un entorno de cocina o barra, la velocidad lo es todo. Tocar una tablet con manos ocupadas o húmedas es ineficiente y poco higiénico.
- **Sin Manos**: Cambia precios o agota platos gritando un comando mientras sigues preparando pedidos.
- **Sincronización Total**: Lo que cambias en el dashboard se refleja al instante en el celular del cliente.
- **Gestión de Estrés**: Recibe notificaciones auditivas de nuevos pedidos sin mirar la pantalla.

---

## 🛠️ Tecnologías de Vanguardia

- **Frontend**: [React.js](https://reactjs.org/) con **TypeScript** para un código robusto.
- **Estilos**: [Tailwind CSS](https://tailwindcss.com/) para una interfaz premium y ultra-responsiva.
- **Animaciones**: [Framer Motion](https://www.framer.com/motion/) para una experiencia de usuario fluida (iPhone Live Drawer).
- **Inteligencia de Voz**: [Web Speech API](https://developer.mozilla.org/en-US/docs/Web/API/Web_Speech_API) para reconocimiento de lenguaje natural y síntesis de voz.
- **Backend & Tiempo Real**: [Supabase](https://supabase.com/) (PostgreSQL + Realtime) para la persistencia de datos y sincronización instantánea entre dispositivos.
- **Iconografía**: [Lucide React](https://lucide.dev/) para un diseño limpio y moderno.

---

## ✨ Características Principales

### 🎤 Administración por Voz (NLP)
Controla tu restaurante con lenguaje natural. El sistema entiende contextos y ejecuta acciones inmediatas.
*Ejemplos de comandos:*
```text
"Sube el precio del Lomo Saltado a 45 soles"
"Marca la Causa Limeña como agotada"
"Descuento del 10 por ciento en todos los Postres"
"Restablecer menú original"
```

### 📱 Live Preview (Mirroring)
Visualiza exactamente lo que ve tu cliente. El panel lateral simula una experiencia de iPhone real que se actualiza mediante **Supabase Realtime**, permitiendo validar cambios de stock o precios al segundo.

### 📦 Gestión de Inventario Inteligente
Toggles de disponibilidad de alta velocidad. Cuando marcas un producto como agotado en el **Modo Stock**, este se difumina automáticamente con un efecto "Grayscale" elegante en la carta del cliente, evitando pedidos de platos sin stock.

### 📑 Dashboard de Pedidos en Vivo
Un centro de control táctico para gestionar el flujo de cocina:
- **Estados Dinámicos**: Control total sobre el ciclo de vida del pedido (Pendiente ⮕ Preparando ⮕ Entregado).
- **Auto-Limpieza Inteligente**: Los pedidos entregados se eliminan automáticamente de la base de datos tras 30 segundos, manteniendo el sistema ligero y enfocado.
- **Alertas Multi-Sensoriales**: Notificaciones por voz (Speech Synthesis), sonidos (SFX) y visuales (Toasts) para que nada pase desapercibido.

### 🖼️ Robusto Sistema de Imágenes
- **Smart Fallback**: Si una imagen de plato falla o no se proporciona, el sistema utiliza un placeholder gastronómico profesional, garantizando que la carta siempre luzca premium.
- **Optimización Visiva**: Efectos de escala y escala de grises automática para platos agotados.

### 📍 Gestión de Mesas
- **Detección por URL**: Reconocimiento automático del número de mesa mediante parámetros `?mesa=X`.
- **Identificación Manual**: Sistema de solicitud de mesa inteligente para clientes que ingresan directamente, asegurando que cada comanda tenga un destino claro.

---

## 🚀 Instalación y Despliegue

Sigue estos pasos para tener tu Dashboard funcionando en menos de 2 minutos:

1. **Clonar el proyecto**
   ```bash
   git clone [tu-repositorio-url]
   cd project2
   ```

2. **Instalar dependencias**
   ```bash
   npm install
   ```

3. **Configurar variables de entorno**
   Crea un archivo `.env.local` con tus credenciales de Supabase:
   ```env
   VITE_SUPABASE_URL=tu_url_de_supabase
   VITE_SUPABASE_ANON_KEY=tu_clave_anon_de_supabase
   ```

4. **Iniciar en modo desarrollo**
   ```bash
   npm run dev
   ```

---

## 🧪 Comandos de Voz Admitidos

| Acción | Ejemplo de Comando |
| :--- | :--- |
| **Actualizar Precio** | *"Poner el Ceviche a 35 soles"* |
| **Marcar Agotado** | *"Se terminó el Arroz con Pollo"* |
| **Marcar Disponible** | *"Activa el Pisco Sour"* |
| **Descuentos Globales** | *"Aplica descuento del 20% a Bebidas"* |
| **Mantenimiento** | *"Limpiar carta"* o *"Restablecer platos"* |

---

## 📱 Pruebas en Móvil (Red Local)

Para probar la carta digital en tu celular mientras desarrollas:
1. Asegúrate de que tu PC y tu celular estén en la **misma red Wi-Fi**.
2. Corre el proyecto usando `npm run dev`. Vite ahora está configurado con `--host`.
3. En tu PC, no uses `localhost`. Usa tu **IP Local** (ej: `http://192.168.18.4:5173`).
4. Abre el QR y escanéalo. ¡Ahora el celular podrá conectarse correctamente!

---

Desarrollado con ❤️ para la industria gastronómica. 🍽️
