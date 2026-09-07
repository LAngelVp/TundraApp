import { LightningElement, api } from 'lwc';
import { loadStyle, loadScript } from 'lightning/platformResourceLoader';
import LEAFLET_RESOURCE from '@salesforce/resourceUrl/leaflet';

export default class MapaLeaflet extends LightningElement {
    _tracksForMap = [];
    map;
    markerLayer;
    isMapInitialized = false;

    @api
    get tracksForMap() {
        return this._tracksForMap;
    }
    set tracksForMap(value) {
        this._tracksForMap = value || [];
        if (this.isMapInitialized) {
            this.refreshMarkers();
        }
    }

    renderedCallback() {
        if (this.isMapInitialized) return;
        this.initMap();
    }

    async initMap() {
        try {
            await Promise.all([
                loadStyle(this, LEAFLET_RESOURCE + '/dist/leaflet.css'),
                loadScript(this, LEAFLET_RESOURCE + '/dist/leaflet.js')
            ]);
            this.createMap();
        } catch (error) {
            console.error('Error cargando recursos de Leaflet:', error);
        }
    }

    createMap() {
        const mapContainer = this.template.querySelector('.map-container');
        if (mapContainer) {
            this.map = L.map(mapContainer, {
                maxBounds: [
                    [10.397963, -125.154309],
                    [40.046243, -83.929856]
                ],
                maxBoundsViscosity: 1.0
            }).setView([23.6345, -102.5528], 5);

            L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
                maxZoom: 19,
                minZoom: 5,
                attribution: '© OpenStreetMap'
            }).addTo(this.map);

            if (this.map.attributionControl) {
                this.map.attributionControl.setPrefix('TruckLocator 360 | Kenworth DAF');
            }

            this.markerLayer = L.layerGroup().addTo(this.map);
            this.isMapInitialized = true;
            this.refreshMarkers();

            setTimeout(() => {
                if (this.map) {
                    this.map.invalidateSize();
                }
            }, 300);
        }
    }

    refreshMarkers() {
        if (!this.map || !this.markerLayer) return;
        this.markerLayer.clearLayers();

        this._tracksForMap.forEach((punto) => {
            const tracto = punto.tracto || punto;

            // Soporte dinámico para las API names de Geolocalización (Ubicacion_GPS__Latitude__s) o legacy (Coordenada_Latitud__c)
            const lat = parseFloat(tracto.Ubicacion_GPS__Latitude__s ?? tracto.Coordenada_Latitud__c);
            const lng = parseFloat(tracto.Ubicacion_GPS__Longitude__s ?? tracto.Coordenada_Longitud__c);

            if (!isNaN(lat) && !isNaN(lng)) {
                const estado = tracto.Estado_de_la_Unidad__c || 'Disponible';
                const markerColor = this.getMarkerColor(estado);

                // Marcadores dinámicos tipo CircleMarker con resplandor
                const marker = L.circleMarker([lat, lng], {
                    color: '#FFFFFF',
                    fillColor: markerColor,
                    fillOpacity: 0.9,
                    radius: 9,
                    weight: 2
                }).bindPopup(this.getPopupContent(tracto, lat, lng));

                this.markerLayer.addLayer(marker);
            }
        });

        this.ajustarVistaMapa();
    }

    /**
     * Define el color del punto según el estado de la unidad (Paleta Industrial)
     */
    getMarkerColor(estado) {
        const e = (estado || '').toLowerCase();
        if (e.includes('disponible')) return '#10B981'; // Emerald Green
        if (e.includes('mantenimiento')) return '#F59E0B'; // Amber
        if (e.includes('vendido')) return '#EF4444'; // Red
        return '#134074'; // Navy Blue por defecto
    }

    /**
     * Genera el Popup estilizado con la paleta de colores corporativa
     */
    getPopupContent(tracto, lat, lng) {
        const precio = tracto.Precio_Venta__c
            ? new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN', maximumFractionDigits: 0 }).format(tracto.Precio_Venta__c)
            : 'N/A';

        return `
            <div style="font-family: -apple-system, sans-serif; min-width: 180px;">
                <div style="background: #0B2545; color: white; padding: 8px 12px; border-radius: 6px 6px 0 0; margin: -14px -20px 10px -20px;">
                    <strong style="font-size: 13px; display: block;">📍 ${tracto.Name}</strong>
                    <span style="font-size: 10px; color: #94A3B8;">VIN: ${tracto.NumeroVIN__c || 'N/A'}</span>
                </div>
                <div style="font-size: 12px; color: #1E293B; line-height: 1.5;">
                    <div><strong>Modelo:</strong> ${tracto.Modelo__c || 'N/A'} (${tracto.Year_Modelo__c || 'N/A'})</div>
                    <div><strong>Estado:</strong> <span style="font-weight: bold; color: ${this.getMarkerColor(tracto.Estado_de_la_Unidad__c)};">${tracto.Estado_de_la_Unidad__c || 'Disponible'}</span></div>
                    <div><strong>Precio:</strong> <span style="color: #0B2545; font-weight: bold;">${precio}</span></div>
                    <div style="font-size: 10px; color: #64748B; margin-top: 6px; padding-top: 4px; border-top: 1px dashed #E2E8F0;">
                        Coord: ${lat.toFixed(4)}, ${lng.toFixed(4)}
                    </div>
                </div>
            </div>
        `;
    }

    ajustarVistaMapa() {
        const markers = this.markerLayer.getLayers();
        if (markers.length > 0) {
            const group = new L.featureGroup(markers);
            this.map.fitBounds(group.getBounds(), { padding: [40, 40] });
        }
    }
}