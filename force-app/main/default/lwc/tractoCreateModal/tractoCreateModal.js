import { LightningElement, track } from 'lwc';
import createTracto from '@salesforce/apex/TractoCreateController.createTracto';
import { ShowToastEvent } from 'lightning/platformShowToastEvent';

export default class TractoCreateModal extends LightningElement {
    @track isLoading = false;

    // Objeto reactivo con los valores por defecto del objeto
    @track tracto = {
        Name: '',
        Modelo__c: '',
        Year_Modelo__c: new Date().getFullYear(),
        Precio_Venta__c: null,
        Estado_de_la_Unidad__c: 'Disponible',
        NumeroVIN__c: '',
        Kilometraje__c: null,
        Marca_de_Motor__c: 'PACCAR',
        Modelo_del_Motor__c: 'MX-13',
        Caballos_de_fuerza_HP__c: 455,
        Transmision__c: 'Eaton Fuller 18 Vel',
        Camarote__c: '76 in High Roof Sleeper',
        Capacidad_de_Suspension__c: '46,000 lbs Neumática',
        Capacidad_Ejes_Delanteros__c: '13,200 lbs',
        Capacidad_Ejes_Traseros__c: '46,000 lbs Tandem',
        Paso_de_Diferenciales__c: '3.55',
        Ubicacion_GPS__Latitude__s: 19.432608,
        Ubicacion_GPS__Longitude__s: -99.133209,
        Velocidad_KmH__c: 0,
        Nombre_Contacto__c: '',
        Numero_del_Contacto__c: '',
        Correo_Contacto__c: '',
        Observaciones_Generales__c: ''
    };

    get estadoOptions() {
        return [
            { label: 'Disponible', value: 'Disponible' },
            { label: 'En Mantenimiento', value: 'En Mantenimiento' },
            { label: 'Vendido', value: 'Vendido' }
        ];
    }

    closeModal() {
        this.dispatchEvent(new CustomEvent('close'));
    }

    /**
     * Mapea dinámicamente los campos editados en la interfaz al objeto tracto
     */
    handleInputChange(event) {
        const field = event.target.dataset.field;
        if (field) {
            this.tracto[field] = event.target.value;
        }
    }

    /**
     * Valida que todos los campos requeridos estén llenos
     */
    validateFields() {
        const allValid = [
            ...this.template.querySelectorAll('lightning-input, lightning-combobox, lightning-textarea')
        ].reduce((validSoFar, inputCmp) => {
            inputCmp.reportValidity();
            return validSoFar && inputCmp.checkValidity();
        }, true);

        return allValid;
    }

    /**
     * Llama al método Apex createTracto enviando el objeto completo
     */
    async handleSave() {
        if (!this.validateFields()) {
            this.showToast('Atención', 'Por favor complete todos los campos obligatorios.', 'warning');
            return;
        }

        this.isLoading = true;

        try {
            // Llamada al método Apex
            const newRecordId = await createTracto({ tractoObj: this.tracto });

            // Notifica al componente padre (tracksTemplate) para recargar datos
            this.dispatchEvent(new CustomEvent('createdsuccess', {
                detail: { id: newRecordId }
            }));

        } catch (error) {
            const errorMsg = error.body ? error.body.message : JSON.stringify(error);
            this.showToast('Error al registrar', errorMsg, 'error');
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