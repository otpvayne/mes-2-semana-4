# Mis Finanzas — Vanilla JS

Aplicación sencilla para **control de ingresos y gastos** hecha con HTML, CSS y JavaScript puro. Guarda datos en `localStorage`, muestra balance, totales y un historial editable, con **modo oscuro** y validaciones básicas.

> 📚 **Documentación completa** (guía técnica, validaciones, UX, escalabilidad, etc.):
> [Ver documentación detallada](https://umbedu-my.sharepoint.com/:w:/g/personal/diegomedina_am_academia_umb_edu_co/EQasd12mVjZNsN2b5J3gnMABT_oHcG6Zi7iuAu-XmlbKpQ?e=EU8EIY)

---

## ✨ Características
- Agregar ingresos (+) y gastos (−) con fecha.
- Cálculo automático de **balance**, **ingresos** y **gastos**.
- Historial ordenado por fecha, con opción de **eliminar**.
- **Persistencia local** (LocalStorage).
- **Validaciones**: descripción, decimales, fecha no futura.
- **Modo oscuro** con persistencia; feedback visual (*toasts* y *loading*).
- **Responsive** (móvil y escritorio).

---

## 🛠 Tecnologías
- HTML5, CSS3 (mobile-first, dark mode).
- JavaScript (ES6+), DOM API.
- `Intl.NumberFormat` para moneda y fechas.
- SVG inline para íconos (sin dependencias).

---

## 🚀 Uso rápido
1. Clona el repo y entra a la carpeta:
   ```bash
   git clone https://github.com/tu-usuario/mis-finanzas.git
   cd mis-finanzas
