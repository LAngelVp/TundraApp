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
     * - Formato de Moneda ($2,450,000)
     * - Badges dinámicos de estado por color
     */
    get formattedTracts() {
        if (!this.hasTracts) return [];

        const currencyFormatter = new Intl.NumberFormat('es-MX', {
            style: 'currency',
            currency: 'MXN',
            maximumFractionDigits: 0
        });

        return this.allTractsChild.map(item => {
            const tracto = item.tracto || {};
            const estado = tracto.Estado_de_la_Unidad__c || 'Desconocido';

            // Determinar la clase CSS del badge según el estado
            let statusClass = 'badge-status ';
            if (estado.toLowerCase().includes('disponible')) {
                statusClass += 'disponible';
            } else if (estado.toLowerCase().includes('mantenimiento')) {
                statusClass += 'mantenimiento';
            } else {
                statusClass += 'vendido';
            }

            return {
                id: tracto.Id,
                name: tracto.Name || 'Sin Nombre',
                modelo: tracto.Modelo__c || 'N/A',
                year: tracto.Year_Modelo__c || 'N/A',
                vin: tracto.NumeroVIN__c || 'Sin VIN',
                estado: estado,
                statusClass: statusClass,
                formattedPrice: tracto.Precio_Venta__c ? currencyFormatter.format(tracto.Precio_Venta__c) : 'N/A',
                rawObject: item
            };
        });
    }

    /**
     * Emite el evento con el objeto original seleccionado para abrir el modal
     */
    handleOpenDetails(event) {
        const tractoId = event.currentTarget.dataset.id;
        const selectedItem = this.allTractsChild.find(item => item.tracto.Id === tractoId);

        if (selectedItem) {
            this.dispatchEvent(new CustomEvent('viewdetails', {
                detail: selectedItem,
                bubbles: true,
                composed: true
            }));
        }
    }
}