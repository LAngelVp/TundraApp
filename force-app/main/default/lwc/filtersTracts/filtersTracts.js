import { LightningElement, api, track } from 'lwc';

export default class FiltersTracts extends LightningElement {
    @api tracks = [];
    @track isModalOpen = false;

    @track filtros = {
        marca: '',
        modelo: '',
        anio: '',
        estado: '',
        precioMin: '',
        precioMax: '',
        marcaMotor: '',
        modeloMotor: '',
        transmision: '',
        ejes: 0
    };

    /**
     * Calcula dinámicamente cuántos filtros están activos para mostrar el badge
     */
    get activeFiltersCount() {
        let count = 0;
        if (this.filtros.marca) count++;
        if (this.filtros.modelo) count++;
        if (this.filtros.anio) count++;
        if (this.filtros.estado) count++;
        if (this.filtros.precioMin && Number(this.filtros.precioMin) > 0) count++;
        if (this.filtros.precioMax && Number(this.filtros.precioMax) > 0) count++;
        if (this.filtros.marcaMotor) count++;
        if (this.filtros.modeloMotor) count++;
        if (this.filtros.transmision) count++;
        return count;
    }

    handleFilterChange(event) {
        const field = event.target.name;
        const value = event.target.type === 'checkbox' ? event.target.checked : event.target.value;
        this.filtros[field] = value;
    }

    handleReset() {
        this.filtros = {
            marca: '',
            modelo: '',
            anio: '',
            estado: '',
            precioMin: '',
            precioMax: '',
            marcaMotor: '',
            modeloMotor: '',
            transmision: '',
            ejes: 0
        };
        this.dispatchEvent(new CustomEvent('filterapplied', {
            detail: { data: this.tracks }
        }));
    }

    aplicarFiltros() {
        const resultados = this.tracks.filter(item => {
            const t = item.tracto || item;

            // 1. Marca, Modelo, Año, Estado y Transmisión
            const matchMarca = !this.filtros.marca || (t.Name === this.filtros.marca);
            const matchModelo = !this.filtros.modelo || (t.Modelo__c === this.filtros.modelo);
            const matchAnio = !this.filtros.anio || (t.Year_Modelo__c == this.filtros.anio);
            const matchEstado = !this.filtros.estado || (t.Estado_de_la_Unidad__c === this.filtros.estado);
            const matchTransmision = !this.filtros.transmision || (t.Transmision__c === this.filtros.transmision);

            // 2. Búsqueda por Texto en Motor
            const matchMotorM = !this.filtros.marcaMotor ||
                (t.Marca_de_Motor__c && t.Marca_de_Motor__c.toLowerCase().includes(this.filtros.marcaMotor.toLowerCase()));

            const matchMotorMod = !this.filtros.modeloMotor ||
                (t.Modelo_del_Motor__c && t.Modelo_del_Motor__c.toLowerCase().includes(this.filtros.modeloMotor.toLowerCase()));

            // 3. Rango de Precios
            const precioVenta = parseFloat(t.Precio_Venta__c) || 0;
            const matchPrecioMin = !this.filtros.precioMin || precioVenta >= parseFloat(this.filtros.precioMin);
            const matchPrecioMax = !this.filtros.precioMax || precioVenta <= parseFloat(this.filtros.precioMax);

            return matchMarca &&
                   matchModelo &&
                   matchAnio &&
                   matchEstado &&
                   matchTransmision &&
                   matchMotorM &&
                   matchMotorMod &&
                   matchPrecioMin &&
                   matchPrecioMax;
        });

        this.dispatchEvent(new CustomEvent('filterapplied', {
            detail: { data: resultados }
        }));

        this.closeModal();
    }

    get isModelDisabled() {
        return !this.filtros.marca;
    }

    get brandOptions() {
        if (!this.tracks) return [];
        const marcas = [...new Set(this.tracks.map(item => (item.tracto?.Name || item.Name)))];
        return marcas.filter(m => m).map(m => ({ label: m, value: m }));
    }

    get modelOptions() {
        if (!this.filtros.marca || !this.tracks) return [];
        const modelos = this.tracks
            .filter(item => (item.tracto?.Name || item.Name) === this.filtros.marca)
            .map(item => (item.tracto?.Modelo__c || item.Modelo__c));
        return [...new Set(modelos)].filter(m => m).map(m => ({ label: m, value: m }));
    }

    get transmissionOptions() {
        if (!this.tracks) return [];
        const transmisiones = [...new Set(this.tracks.map(item => item.tracto?.Transmision__c || item.Transmision__c))];
        return transmisiones.filter(t => t).map(t => ({ label: t, value: t }));
    }

    get statusOptions() {
        if (!this.tracks) return [];
        const estados = [...new Set(this.tracks.map(item => item.tracto?.Estado_de_la_Unidad__c || item.Estado_de_la_Unidad__c))];
        return estados.filter(est => est).map(est => ({ label: est, value: est }));
    }

    openModal() { this.isModalOpen = true; }
    closeModal() { this.isModalOpen = false; }
}