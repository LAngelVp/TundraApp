import { LightningElement, wire, track } from 'lwc';
import getTractos from '@salesforce/apex/TractosController.getTractos';
import { refreshApex } from '@salesforce/apex';
import { ShowToastEvent } from 'lightning/platformShowToastEvent';

export default class TracksTemplate extends LightningElement {
    allTracks = [];
    renderizarHijos = false;
    @track displayedTracks = [];
    @track isModalOpen = false;
    @track isCreateModalOpen = false;
    @track tractoSeleccionado;

    wiredResult;

    /**
     * Consulta el Apex Controller para obtener todos los tractocamiones registrados
     */
    @wire(getTractos, { busqueda: '' })
    wiredResultado(result) {
        this.wiredResult = result;
        const { error, data } = result;
        if (data) {
            this.allTracks = data;
            this.displayedTracks = [...data];
            this.renderizarHijos = true;
        } else if (error) {
            const errorMsg = error.body ? error.body.message : JSON.stringify(error);
            this.mensaje('Error al cargar', `No se encontraron unidades: ${errorMsg}`, 'error');
        }
    }

    /**
     * Modal de Detalle
     */
    handleShowModal(event) {
        this.tractoSeleccionado = event.detail;
        this.isModalOpen = true;
    }

    handleCloseModal() {
        this.isModalOpen = false;
    }

    /**
     * Modal de Creación
     */
    handleOpenCreateModal() {
        this.isCreateModalOpen = true;
    }

    handleCloseCreateModal() {
        this.isCreateModalOpen = false;
    }

    /**
     * Recarga automática del mapa y lista al guardar un nuevo tractocamión
     */
    async handleTractoCreated() {
        this.isCreateModalOpen = false;
        this.mensaje('¡Unidad Registrada!', 'El nuevo tractocamión ha sido agregado exitosamente a la flota.', 'success');
        await refreshApex(this.wiredResult);
    }

    /**
     * Recibe la lista filtrada enviada por el componente c-filters-tracts
     */
    handleFilteredData(event) {
        const filteredData = event.detail.data || [];
        this.displayedTracks = [...filteredData];

        if (filteredData.length === 0) {
            this.mensaje('Sin resultados', 'No se encontraron tractocamiones con los criterios seleccionados', 'warning');
        } else {
            this.mensaje('Búsqueda actualizada', `Se encontraron ${filteredData.length} unidades`, 'success');
        }
    }

    /**
     * Helper centralizado para notificaciones Toast
     */
    mensaje(titulo, mensaje, variante) {
        const evento = new ShowToastEvent({
            title: titulo,
            message: mensaje,
            variant: variante,
        });
        this.dispatchEvent(evento);
    }
}