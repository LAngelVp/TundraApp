import { LightningElement, api } from 'lwc';

export default class ProductoTract extends LightningElement {
    @api allTractsChild = [];

    /**
     * Valida si existen tractocamiones para renderizar la lista o el empty state
     */
    get hasTracts() {
        return Array.isArray(this.allTractsChild) && this.allTractsChild.length > 0;
    }

    /**
     * Total de unidades cargadas
     */
    get totalUnits() {
        return this.allTractsChild ? this.allTractsChild.length : 0;
    }

    /**
     * Label dinámico (singular / plural)
     */
    get unitsLabel() {
        return this.totalUnits === 1 ? 'Unidad' : 'Unidades';
    }

    /**
     * Mapea y prepara la información para la interfaz gráfica:
     * - Extrae los campos soportando objeto plano o anidado en item.tracto
     * - Formato de Moneda ($2,450,000 MXN)
     * - Badges dinámicos de estado (Verde = Disponible, Ámbar = En Negociación, Rojo = Vendido/Mantenimiento)
     */
    get formattedTracts() {
        if (!this.hasTracts) return [];

        const currencyFormatter = new Intl.NumberFormat('es-MX', {
            style: 'currency',
            currency: 'MXN',
            maximumFractionDigits: 0
        });

        return this.allTractsChild.map(item => {
            const t = item.tracto || item;
            const estado = t.Estado_de_la_Unidad__c || 'Disponible';

            // Determinar la clase CSS del badge según el estado operativo
            const estadoLower = estado.toLowerCase();
            let statusClass = 'badge-status ';

            if (estadoLower.includes('disponible')) {
                statusClass += 'disponible';
            } else if (estadoLower.includes('negociación') || estadoLower.includes('negociacion') || estadoLower.includes('mantenimiento') || estadoLower.includes('reservado')) {
                statusClass += 'mantenimiento';
            } else {
                statusClass += 'vendido';
            }

            return {
                id: t.Id,
                name: t.Name || 'Sin Nombre',
                modelo: t.Modelo__c || 'N/A',
                year: t.Year_Modelo__c || 'N/A',
                vin: t.NumeroVIN__c || 'Sin VIN',
                estado: estado,
                statusClass: statusClass,
                formattedPrice: t.Precio_Venta__c ? currencyFormatter.format(t.Precio_Venta__c) : 'N/A',
                rawObject: item
            };
        });
    }

    /**
     * Emite el evento con el objeto seleccionado para abrir el modal de detalles
     */
    handleOpenDetails(event) {
        const tractoId = event.currentTarget.dataset.id;
        const selectedItem = this.allTractsChild.find(item => {
            const t = item.tracto || item;
            return t.Id === tractoId;
        });

        if (selectedItem) {
            this.dispatchEvent(new CustomEvent('viewdetails', {
                detail: selectedItem,
                bubbles: true,
                composed: true
            }));
        }
    }
}