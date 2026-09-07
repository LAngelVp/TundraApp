import { LightningElement, api, track } from 'lwc';
import generarOportunidadVenta from '@salesforce/apex/TractosController.generarOportunidadVenta';
import { ShowToastEvent } from 'lightning/platformShowToastEvent';

export default class TractoDetailModal extends LightningElement {
    @api selectedTracto;
    @track isLoading = false;

    closeModal() {
        this.dispatchEvent(new CustomEvent('close'));
    }

    get tractoObj() {
        if (!this.selectedTracto) return {};
        return this.selectedTracto.tracto || this.selectedTracto;
    }

    // Datos Básicos
    get unitName() { return this.tractoObj.Name || 'Tractocamión Desconocido'; }
    get unitVin() { return this.tractoObj.NumeroVIN__c || 'Sin VIN'; }
    get unitYear() { return this.tractoObj.Year_Modelo__c || 'N/A'; }
    get unitModel() { return this.tractoObj.Modelo__c || 'N/A'; }
    get unitStatus() { return this.tractoObj.Estado_de_la_Unidad__c || 'Disponible'; }

    get isAvailable() {
        return (this.unitStatus || '').toLowerCase() === 'disponible';
    }

    get statusClass() {
        const estado = (this.unitStatus || '').toLowerCase();
        let baseClass = 'badge-status ';
        if (estado.includes('disponible')) return baseClass + 'disponible';
        if (estado.includes('negociación') || estado.includes('negociacion') || estado.includes('reservado')) return baseClass + 'mantenimiento';
        return baseClass + 'vendido';
    }

    get formattedPrice() {
        const precio = this.tractoObj.Precio_Venta__c;
        if (precio === undefined || precio === null) return 'N/A';
        return new Intl.NumberFormat('es-MX', {
            style: 'currency',
            currency: 'MXN',
            maximumFractionDigits: 0
        }).format(precio);
    }

    get estimatedMonthlyLease() {
        const precio = this.tractoObj.Precio_Venta__c;
        if (!precio) return null;
        const mensualidad = (precio * 1.25) / 36;
        return new Intl.NumberFormat('es-MX', {
            style: 'currency',
            currency: 'MXN',
            maximumFractionDigits: 0
        }).format(mensualidad);
    }

    get unitKilometers() {
        const km = this.tractoObj.Kilometraje__c;
        return km ? `${Number(km).toLocaleString('es-MX')} km` : 'N/A';
    }

    // Empresa Vendedora (Relationship Lookup)
    get companyName() {
        if (this.tractoObj.Empresa__r && this.tractoObj.Empresa__r.Name) {
            return this.tractoObj.Empresa__r.Name;
        }
        return 'Sin Empresa Asignada';
    }

    get currentSpeed() {
        const vel = this.tractoObj.Velocidad_KmH__c;
        if (vel === undefined || vel === null) return '0 km/h';
        return `${vel} km/h`;
    }

    get lastGpsUpdate() {
        const fecha = this.tractoObj.Ultima_Actualizacion_GPS__c;
        if (!fecha) return 'Reciente';
        const dateObj = new Date(fecha);
        return dateObj.toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit' });
    }

    // Especificaciones
    get unitEngineBrand() { return this.tractoObj.Marca_de_Motor__c || 'N/A'; }
    get unitEngineModel() { return this.tractoObj.Modelo_del_Motor__c || 'N/A'; }
    get unitHp() { return this.tractoObj.Caballos_de_fuerza_HP__c || 'N/A'; }
    get unitTransmission() { return this.tractoObj.Transmision__c || 'N/A'; }
    get unitSleeper() { return this.tractoObj.Camarote__c || 'N/A'; }
    get unitSuspension() { return this.tractoObj.Capacidad_de_Suspension__c || 'N/A'; }
    get unitFrontAxle() { return this.tractoObj.Capacidad_Ejes_Delanteros__c || 'N/A'; }
    get unitRearAxle() { return this.tractoObj.Capacidad_Ejes_Traseros__c || 'N/A'; }
    get unitDifferential() { return this.tractoObj.Paso_de_Diferenciales__c || 'N/A'; }

    // Contacto
    get contactName() { return this.tractoObj.Nombre_Contacto__c || 'Asesor Comercial'; }
    get contactPhone() { return this.tractoObj.Numero_del_Contacto__c || null; }
    get phoneCallUrl() { return this.contactPhone ? `tel:${this.contactPhone}` : '#'; }
    get contactEmail() { return this.tractoObj.Correo_Contacto__c || null; }
    get emailMailtoUrl() {
        return this.contactEmail
            ? `mailto:${this.contactEmail}?subject=Solicitud de Cotización - ${encodeURIComponent(this.unitName)}`
            : '#';
    }

    // Coordenadas GPS
    get latitude() {
        const t = this.tractoObj;
        return t.Ubicacion_GPS__Latitude__s !== undefined ? t.Ubicacion_GPS__Latitude__s : t.Coordenada_Latitud__c;
    }

    get longitude() {
        const t = this.tractoObj;
        return t.Ubicacion_GPS__Longitude__s !== undefined ? t.Ubicacion_GPS__Longitude__s : t.Coordenada_Longitud__c;
    }

    get hasCoordinates() {
        return this.latitude !== null && this.latitude !== undefined &&
               this.longitude !== null && this.longitude !== undefined;
    }

    get googleMapsUrl() {
        return `https://www.google.com/maps?q=${this.latitude},${this.longitude}`;
    }

    get unitNotes() { return this.tractoObj.Observaciones_Generales__c || null; }

    // Procesamiento de Imágenes Rich Text
    get processedImages() {
        const richText = this.tractoObj.Imagen__c;
        if (!richText) return { first: null, remaining: [] };
        const imgRegex = /<img [^>]*>/g;
        const images = richText.match(imgRegex) || [];
        return {
            first: images.length > 0 ? images[0] : null,
            remaining: images.length > 1 ? images.slice(1) : []
        };
    }

    get firstImage() { return this.processedImages.first; }
    get remainingImages() { return this.processedImages.remaining; }
    get hasRemainingImages() { return this.remainingImages.length > 0; }

    /**
     * Inicia la venta en Salesforce creando la Oportunidad y reservando la unidad a 'En Negociación'
     */
    async handleStartSaleProcess() {
        this.isLoading = true;
        try {
            const oppId = await generarOportunidadVenta({
                tractoId: this.tractoObj.Id,
                cuentaId: this.tractoObj.Empresa__c,
                nombreCliente: this.contactName
            });

            this.showToast('Oportunidad Creada', 'Se ha iniciado la negociación. La unidad ahora está en estado "En Negociación".', 'success');

            // Notificamos al componente padre para recargar datos y actualizar mapa/lista
            this.dispatchEvent(new CustomEvent('salestarted', {
                detail: { opportunityId: oppId, tractoId: this.tractoObj.Id }
            }));

            this.closeModal();

        } catch (error) {
            const errorMsg = error.body ? error.body.message : JSON.stringify(error);
            this.showToast('Error Comercial', errorMsg, 'error');
        } finally {
            this.isLoading = false;
        }
    }

    showToast(title, message, variant) {
        this.dispatchEvent(new ShowToastEvent({
            title: title,
            message: message,
            variant: variant
        }));
    }
}