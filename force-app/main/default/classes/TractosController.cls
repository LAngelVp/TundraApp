public with sharing class TractosController {

    @AuraEnabled(cacheable=true)
    public static List<TractoWrapper> getTractos(String busqueda) {
        try {
            List<Tracto__c> tractos;

            if (String.isBlank(busqueda)) {
                tractos = [
                    SELECT Id, Name, Year_Modelo__c, Caballos_de_fuerza_HP__c, Camarote__c,
                    Capacidad_Ejes_Delanteros__c, Capacidad_Ejes_Traseros__c,
                    Correo_Contacto__c, Capacidad_de_Suspension__c,
                    Estado_de_la_Unidad__c, Imagen__c, Kilometraje__c, Marca_de_Motor__c,
                    Modelo__c, Modelo_del_Motor__c, Nombre_Contacto__c, Numero_del_Contacto__c,
                    NumeroVIN__c, Observaciones_Generales__c, Paso_de_Diferenciales__c,
                    Precio_Venta__c, Transmision__c,
                    Ubicacion_GPS__Latitude__s, Ubicacion_GPS__Longitude__s
                    FROM Tracto__c
                    ORDER BY CreatedDate DESC
                ];
            } else {
                String searchPattern = '%' + busqueda + '%';
                tractos = [
                    SELECT Id, Name, Year_Modelo__c, Caballos_de_fuerza_HP__c, Camarote__c,
                    Capacidad_Ejes_Delanteros__c, Capacidad_Ejes_Traseros__c,
                    Correo_Contacto__c, Capacidad_de_Suspension__c,
                    Estado_de_la_Unidad__c, Imagen__c, Kilometraje__c, Marca_de_Motor__c,
                    Modelo__c, Modelo_del_Motor__c, Nombre_Contacto__c, Numero_del_Contacto__c,
                    NumeroVIN__c, Observaciones_Generales__c, Paso_de_Diferenciales__c,
                    Precio_Venta__c, Transmision__c,
                    Ubicacion_GPS__Latitude__s, Ubicacion_GPS__Longitude__s
                    FROM Tracto__c
                    WHERE Name LIKE :searchPattern
                    ORDER BY Name
                ];
            }

            List<TractoWrapper> wrappers = new List<TractoWrapper>();

            for (Tracto__c t : tractos) {
                TractoWrapper tw = new TractoWrapper();
                tw.tracto = t;
                wrappers.add(tw);
            }

            return wrappers;

        } catch (Exception e) {
            System.debug('Error: ' + e.getMessage());
            throw new AuraHandledException(e.getMessage());
        }
    }

    public class TractoWrapper {
        @AuraEnabled public Tracto__c tracto { get; set; }
    }
}