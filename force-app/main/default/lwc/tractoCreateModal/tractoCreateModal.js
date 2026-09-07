import { LightningElement, track } from 'lwc';
import { NavigationMixin } from 'lightning/navigation';
import createTracto from '@salesforce/apex/TractoCreateController.createTracto';
import { ShowToastEvent } from 'lightning/platformShowToastEvent';

export default class TractoCreateModal extends NavigationMixin(LightningElement) {
    @track isLoading = false;

    // Objeto reactivo con los valores por defecto
    @track tracto = {
        Empresa__c: null, // Id de la Account (Empresa Vendedora)
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
        Imagen__c: '',
        Observaciones_Generales__c: ''
    };

    get estadoOptions() {
        return [
            { label: 'Disponible', value: 'Disponible' },
            { label: 'En Mantenimiento', value: 'En Mantenimiento' },
            { label: 'En Negociación', value: 'En Negociación' },
            { label: 'Vendido', value: 'Vendido' }
        ];
    }

    closeModal() {
        this.dispatchEvent(new CustomEvent('close'));
    }

    /**
     * Captura el Id de la Account seleccionada en el Lookup de Empresa__c
     */
    handleEmpresaChange(event) {
        const selectedValue = event.detail.value;
        this.tracto.Empresa__c = Array.isArray(selectedValue) ? selectedValue[0] : selectedValue;
    }

    /**
     * Abre la ventana emergente estándar de Salesforce para crear una nueva Cuenta (Empresa)
     */
    handleCreateNewAccount() {
        this[NavigationMixin.Navigate]({
            type: 'standard__objectPage',
            attributes: {
                objectApiName: 'Account',
                actionName: 'new'
            }
        });
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
     * Valida que todos los campos requeridos estén completos
     */
    validateFields() {
        if (!this.tracto.Empresa__c) {
            this.showToast('Atención', 'Debe seleccionar o crear la Empresa Vendedora propietaria de la unidad.', 'warning');
            return false;
        }

        const inputs = [
            ...this.template.querySelectorAll('lightning-input, lightning-combobox, lightning-textarea')
        ];

        return inputs.reduce((validSoFar, inputCmp) => {
            inputCmp.reportValidity();
            return validSoFar && inputCmp.checkValidity();
        }, true);
    }

    /**
     * Llama al método Apex createTracto enviando el objeto completo
     */
    async handleSave() {
        if (!this.validateFields()) {
            return;
        }

        this.isLoading = true;

        try {
            const newRecordId = await createTracto({ tractoObj: this.tracto });

            this.showToast('¡Éxito!', 'Tractocamión registrado correctamente.', 'success');

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