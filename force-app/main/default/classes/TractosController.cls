public with sharing class TractosController {

    /**
     * Obtiene la lista completa de tractocamiones con sus relaciones y datos de telemetría
     * @param busqueda Término de búsqueda opcional por nombre o modelo
     * @return Lista de registros Tracto__c
     */
    @AuraEnabled(cacheable=true)
    public static List<Tracto__c> getTractos(String busqueda) {
        try {
            String query = 'SELECT Id, Name, Modelo__c, Year_Modelo__c, Precio_Venta__c, Estado_de_la_Unidad__c, ' +
                           'NumeroVIN__c, Kilometraje__c, Marca_de_Motor__c, Modelo_del_Motor__c, Caballos_de_fuerza_HP__c, ' +
                           'Transmision__c, Camarote__c, Capacidad_de_Suspension__c, Capacidad_Ejes_Delanteros__c, ' +
                           'Capacidad_Ejes_Traseros__c, Paso_de_Diferenciales__c, Ubicacion_GPS__Latitude__s, ' +
                           'Ubicacion_GPS__Longitude__s, Velocidad_KmH__c, Ultima_Actualizacion_GPS__c, ' +
                           'Nombre_Contacto__c, Numero_del_Contacto__c, Correo_Contacto__c, Imagen__c, Observaciones_Generales__c, ' +
                           'Empresa__c, Empresa__r.Name ' +
                           'FROM Tracto__c ';

            if (String.isNotBlank(busqueda)) {
                String key = '%' + String.escapeSingleQuotes(busqueda) + '%';
                query += 'WHERE Name LIKE :key OR Modelo__c LIKE :key OR NumeroVIN__c LIKE :key ';
            }

            query += 'WITH USER_MODE ORDER BY CreatedDate DESC LIMIT 200';

            return Database.query(query);

        } catch (Exception e) {
            System.debug('Error en getTractos: ' + e.getMessage());
            throw new AuraHandledException('Error al recuperar inventario de flota: ' + e.getMessage());
        }
    }

    /**
     * Genera una Oportunidad vinculada al tractocamión e inicia la reserva comercial
     * @param tractoId Id del Tracto__c a negociar
     * @param cuentaId Id de la Account (Cliente Comprador)
     * @param nombreCliente Nombre del cliente para nombrar la Oportunidad
     * @return Id de la Oportunidad creada
     */
    @AuraEnabled
    public static Id generarOportunidadVenta(Id tractoId, Id cuentaId, String nombreCliente) {
        try {
            // 1. Consultar datos financieros y de origen del tracto
            Tracto__c tracto = [
                SELECT Id, Name, Precio_Venta__c, Empresa__c, Estado_de_la_Unidad__c
                FROM Tracto__c
                WHERE Id = :tractoId
                WITH USER_MODE
                LIMIT 1
            ];

            if (tracto.Estado_de_la_Unidad__c == 'Vendido') {
                throw new AuraHandledException('La unidad seleccionada ya se encuentra vendida.');
            }

            // 2. Instanciar la Oportunidad
            Opportunity opp = new Opportunity();
            opp.Name = 'Venta: ' + tracto.Name + ' - ' + (String.isNotBlank(nombreCliente) ? nombreCliente : 'Prospecto');
            opp.StageName = 'Prospecting';
            opp.CloseDate = Date.today().addDays(30);
            opp.Amount = tracto.Precio_Venta__c;
            opp.AccountId = cuentaId != null ? cuentaId : tracto.Empresa__c;

            // Asumiendo el campo Lookup Tracto__c en Opportunity
            opp.put('Tracto__c', tracto.Id);

            insert as user opp;

            // 3. Cambiar el estado del tractocamión a 'En Negociación' (Reserva Ámbar 🟡)
            tracto.Estado_de_la_Unidad__c = 'En Negociación';
            update as user tracto;

            return opp.Id;

        } catch (DmlException e) {
            System.debug('Error DML al generar Oportunidad: ' + e.getMessage());
            throw new AuraHandledException('Error comercial: ' + e.getDmlMessage(0));
        } catch (Exception e) {
            System.debug('Error al generar Oportunidad: ' + e.getMessage());
            throw new AuraHandledException(e.getMessage());
        }
    }
}