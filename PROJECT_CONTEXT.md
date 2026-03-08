# Proyecto: PureCart - Documentación y Contexto para IA

Este documento sirve como la **fuente de verdad principal y un contexto exhaustivo** del proyecto **PureCart**. Su objetivo es proporcionar a los agentes de Inteligencia Artificial (y a cualquier desarrollador humano) una comprensión profunda de la arquitectura, reglas de negocio, tecnologías, convenciones de código y la hoja de ruta futura de la aplicación.

**Los agentes de IA DEBEN leer, comprender y seguir estrictamente las pautas establecidas en este documento antes de realizar cualquier cambio, refactorización o adición al código.**

---

## 1. Visión General del Proyecto

**PureCart** es una plataforma de comercio electrónico (E-commerce) moderna, rápida y escalable. 
Actualmente, este repositorio contiene el **Frontend** de la aplicación, el cual actúa como el cliente de la plataforma. Este cliente consumirá una **API Backend** RESTful externa (basada en FastAPI y conectada a Supabase).

El objetivo principal del frontend es ofrecer una experiencia de usuario (UX) excepcional y un diseño de interfaz (UI) premium, atractivo, rápido y altamente interactivo.

---

## 2. Pila Tecnológica (Tech Stack)

El proyecto utiliza tecnologías de vanguardia. Es crucial respetar las versiones y los paradigmas que estas herramientas proveen.

### 2.1. Núcleo (Core)
- **Framework:** Next.js (App Router). *Importante: Se utiliza el nuevo paradigma de App Router (`app/`), Server Components nativos y Server Actions. Las carpetas `pages/` están obsoletas.*
- **Librería UI:** React 19 (y React DOM 19). Se aprovechan los hooks y características más recientes.
- **Lenguaje:** TypeScript. Estrictamente tipado. Evitar el uso de `any`; siempre definir interfaces o types para props, estados y respuestas de API.

### 2.2. Interfaz de Usuario (UI) y Estilos
- **Estilos Principales:** Tailwind CSS v4 (utilizado a través de `@tailwindcss/postcss`). Se debe enfocar en usar las clases de utilidad para Layout, Espaciado y Tipografía de manera consistente.
- **Componentes Base:** Shadcn UI. Se utilizan componentes primitivos accesibles basados en Radix UI (`radix-ui`), combinados con clases de Tailwind.
- **Utilidades UI:** `class-variance-authority` (cva), `clsx` y `tailwind-merge` para el manejo dinámico, seguro y eficiente de clases CSS en componentes reutilizables sin crear conflictos.
- **Temas (Dark/Light):** `next-themes` controla la adaptación a modo oscuro y claro de todo el sistema.
- **Iconografía:** `lucide-react`.

### 2.3. Estado y Datos
- **Gestión de Estado Global:** Zustand (`zustand`). Se utiliza para estados complejos del cliente, como el manejo del **Carrito de Compras (Cart)**, el estado del **Checkout** y la preferencia temporal de temas, permitiendo un manejo sin tanto "boilerplate" como Redux.

### 2.4. Experiencia y Animaciones
- **Notificaciones (Toasts):** Sonner (`sonner`). Se emplea para dar retroalimentación inmediata sobre acciones, peticiones a la API o errores (ej. "Producto agregado al carrito", "Error iniciando sesión").
- **Animaciones Complejas:** GSAP (`gsap`) para microinteracciones fluidas, animaciones de transiciones de página complejas y efectos scroll que añaden una sensación premium.
- **Animaciones UI por CSS:** `tw-animate-css` como extensión de Tailwind para animaciones declarativas rápidas de entrada/salida de componentes.

---

## 3. Arquitectura y Convenciones del Código

Es imprescindible mantener un nivel alto de orden en la estructura y en las intenciones del código.

### 3.1. Estructura de Carpetas
- `/frontend/app/` -> Contiene el App Router de Next.js. Aquí se definen las rutas (ej. `(auth)/signin`, `(auth)/signup`, `checkout/`, `products/`). Los `page.tsx` y `layout.tsx` idealmente deben ser **Server Components** por defecto, delegando el estado interactivo a componentes secundarios que declaren `"use client"`.
- `/frontend/components/ui/` -> Componentes de interfaz atómicos generados (ej. Buttons, Inputs, Cards, Dialogs usando Shadcn UI). **No se debe colocar lógica de negocio aquí.**
- `/frontend/components/` -> Componentes específicos de dominio o compartidos, como `Header`, `Footer`, `ProductCard`, `CartDrawer`. 
- `/frontend/lib/` -> Funciones de utilidad auxiliares (`utils.ts` que exporta el `cn` helper para clases de Tailwind, funciones de formateo de moneda, etc.).
- `/frontend/store/` -> Stores de Zustand (ej. `useCartStore.ts`, `useAuthStore.ts`).
- `/frontend/public/` -> Contenido estático web (imágenes, fuentes locales, logos).

### 3.2. Convenciones de la API Backend

El frontend se comunicará con un **Backend de FastAPI**. Para garantizar consistencia, los agentes de IA deben asumir que el backend sigue este estándar global en sus respuestas JSON:

```json
{
  "ok": true, // o false si hay un error
  "data": { ... }, // objeto o array con la respuesta real de la entidad
  "messages": "Operación exitosa" // String con información humana o código de error
}
```

**Regla API para Agentes:** Al generar fetches o Server Actions que extraigan datos del backend, debes tipar la respuesta para encajar en la estructura `{ ok: boolean, data: T, messages: string }` y utilizar `Sonner` para notificar errores (`toast.error(response.messages)`) u operaciones exitosas basado en el valor de `ok`.

---

## 4. Evolución de la Plataforma (Roadmap Futuro)

Como desarrollador/IA, debes construir cada componente y estructura con la escalabilidad en mente para soportar las siguientes características **críticas** planeadas a futuro. Todo el código debe escribirse pensando en no tener que ser reescrito cuando lleguen estas integraciones:

### 4.1. Autenticación y Cuentas (Integración OAuth Próxima)
Actualmente, podemos tener un flujo de registro por correo/contraseña simple (ej. `signin/page.tsx`, `signup/page.tsx`). Sin embargo, el futuro requerirá la integración de **Social Logins a través de Google y Facebook**.

* **Expectativa Arquitectónica:** 
  - Las pantallas de autenticación deben construirse de forma modular. Separa los campos del formulario (`<CredentialsForm />`) de los botones sociales (`<SocialAuthButtons />`).
  - Preparar el contexto / estado de usuario (Zustand) para recibir tokens y avatares (imágenes de perfil) de proveedores externos (Google/FB).
  - Asegurar la compatibilidad con proveedores de estado de sesión.

### 4.2. Pasarela de Pagos (Stripe Próximamente)
La monetización de PureCart y las transacciones de los usuarios se completarán en el futuro a través de **Stripe**. 

* **Expectativa Arquitectónica:**
  - El **Carrito de Compras (Zustand Store)** no debe corromperse y debe mantener una estricta correspondencia de precios, descuentos y IDs de producto estandarizados. 
  - La pantalla o el flujo de **Checkout** debe separarse en componentes limpios ("Envío", "Resumen de Orden", "Método de Pago"). 
  - El "Método de Pago" debe abstraerse, ya que en el futuro un componente que envuelva `Stripe Elements` (`<Elements stripe={...}>`) va a inyectarse en ese lugar de la interfaz.

### 4.3. Implementaciones de Roles (Backoffice)
El backend soportará roles dinámicos (Admin, Cliente, Moderador) (Implementado previamente por el equipo backend).
* **Expectativa Arquitectónica:**
  - El frontend, especialmente al recuperar la sesión del usuario, debe almacenar y validar fácilmente el `role` del usuario y proteger las rutas (`/admin/...` o `/dashboard/...`) si se desarrollan en el futuro dentro de este mismo repositorio mediante Middleware de Next.js (`middleware.ts`).

---

## 5. Directrices Finales de Implementación para IA

1. **Prioridad Visual (Premium & WoW effect):** PureCart no es un MVP simple. Es imperativo utilizar Tailwind para crear interfaces **profesionales**. Usa bordes sutiles o difuminados (glassmorphism/blur), colores ricos coordinados y fondos oscuros elegantes (`dark:bg-slate-950`). Las interacciones deben ser dinámicas: usa hover (`hover:`), transiciones (`transition-all`) y microanimaciones siempre que tenga sentido (usando `tw-animate-css` o `GSAP`).
2. **Usa Shadcn UI:** Cuando debas crear un Modal, Dropdown, Accordion, etc. No lo construyas desde cero a menos que sea necesario. Simula o asume que los componentes primitivos de `@radix-ui/react-*` están instalados como base de Shadcn, e impleméntalos con los estilos integrados que combinan clases de Tailwind con `clsx` y `tailwind-merge`.
3. **No Mutees Directamente el Estado:** Usa siempre Zustand estandarizado en el directorio `store/`.
4. **Manejo de Errores Silencioso pero Visible:** Cualquier Catch de una petición, o lógica rota, debe capturarse e informarse al usuario de una manera amigable usando `toast.error()` (Sonner libreria importada) en lugar de un tosco y viejo `alert()` o hacer petar el sitio.

**Al interactuar con las carpetas y archivos, toma en consideración todo este contexto. Este documento representa el North Star (Estrella Polar) del proyecto de frontend PureCart.**
