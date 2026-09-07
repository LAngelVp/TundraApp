# 🏔️ TundraApp | Salesforce Lightning Application

**TundraApp** es una solución empresarial nativa desarrollada sobre **Salesforce Lightning Platform** para la gestión comercial, administración de inventarios y venta de unidades (tractocamiones, vehículos de carga, automóviles y flotas). 

El sistema consolida el proceso de ventas mediante un catálogo dinámico y una interfaz visual de densidad en mapa que permite analizar la distribución del inventario activo y gestionar el ciclo comercial de cada unidad desde una única plataforma.

---

## 🌟 Características Principales

* 📦 **Catálogo de Unidades:** Registro centralizado de inventario con especificaciones técnicas, precios, estado de disponibilidad y galería multimedia.
* 🗺️ **Visualizador de Inventario (Mapa de Densidad):** Interfaz interactiva desarrollada en **Lightning Web Components (LWC)** para explorar la concentración y distribución visual de las unidades registradas.
* 💼 **Gestión del Ciclo de Ventas:** Flujo comercial integrado con el estándar de Salesforce (Cuentas, Contactos, Oportunidades y Cotizaciones).
* ⚙️ **Procesos de Aprobación Automatizados:** Reglas de aprobación para descuentos, margen de ganancia y liberación de unidades.
* 📊 **Paneles de Analítica & Reportes:** Dashboards nativos para medir la rotación de stock, valor del inventario y efectividad del equipo de ventas.

---

## 🏗️ Arquitectura de la Solución

### Objeto Personalizado Principal: `Unidad__c`

| Campo | Tipo de Dato | Descripción |
| :--- | :--- | :--- |
| `Name` | Auto-Number / Text | Identificador único de la unidad (ej. `UND-00102`). |
| `Tipo_Vehiculo__c` | Picklist | Carga Pesada, Tractocamión, Comercial, Ligero. |
| `Estado__c` | Picklist | Disponible, Reservado, Vendido, En Mantenimiento. |
| `Precio_Venta__c` | Currency | Precio de lista comercial. |
| `Ano_Modelo__c` | Number | Año de fabricación del vehículo. |
| `Ubicacion_Latitud__c` | Geolocation (Latitude) | Coordenada latitud para renderizado en mapa. |
| `Ubicacion_Longitud__c` | Geolocation (Longitude) | Coordenada longitud para renderizado en mapa. |

---

## 🛠️ Tecnologías y Herramientas

* **Plataforma:** Salesforce Lightning Experience
* **Frontend:** Lightning Web Components (LWC), SLDS (Salesforce Lightning Design System)
* **Backend:** Apex (Controllers, Triggers, Handlers, Selector Layer)
* **DevOps & Herramientas:** Salesforce CLI (`sf`), Visual Studio Code, Git

---

## 🚀 Guía de Instalación y Despliegue

### Requisitos Previos

1. Tener instalado [Node.js](https://nodejs.org/) y [Salesforce CLI](https://developer.salesforce.com/tools/salesforcecli).
2. Tener una organización de Salesforce (Developer Edition o Scratch Org).
3. Clonar este repositorio localmente:

```bash
git clone [https://github.com/tu-usuario/TundraApp.git](https://github.com/tu-usuario/TundraApp.git)
cd TundraApp
