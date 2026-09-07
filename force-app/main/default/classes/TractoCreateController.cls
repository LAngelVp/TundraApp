public with sharing class TractoCreateController {

    /**
     * Inserta un nuevo registro de Tracto__c recibiendo los datos mapeados desde el LWC
     * @param tractoObj Objeto Tracto__c con todos sus campos poblados
     * @return Id del registro recién insertado
     */
    @AuraEnabled
    public static Id createTracto(Tracto__c tractoObj) {
        try {
            // 1. Verificación de permisos FLS / CRUD
            if (!Schema.sObjectType.Tracto__c.isCreateable()) {
                throw new AuraHandledException('No tienes permisos suficientes para crear tractocamiones.');
            }

            // 2. Lógica de Negocio / Validaciones Personalizadas (VIN Único)
            if (tractoObj != null && String.isNotBlank(tractoObj.NumeroVIN__c)) {
                List<Tracto__c> existentes = [
                    SELECT Id
                    FROM Tracto__c
                    WHERE NumeroVIN__c = :tractoObj.NumeroVIN__c
                    WITH USER_MODE
                    LIMIT 1
                ];

                // Corrección del typo: existentes
                if (!existentes.isEmpty()) {
                    throw new AuraHandledException('El Número VIN registrado ya existe en el sistema.');
                }
            }

            // 3. Asignación por defecto si no viene fecha de telemetría
            if (tractoObj.Ultima_Actualizacion_GPS__c == null) {
                tractoObj.Ultima_Actualizacion_GPS__c = System.now();
            }

            // 4. Inserción segura respetando el modo de usuario
            insert as user tractoObj;

            return tractoObj.Id;

        } catch (DmlException e) {
            System.debug('Error DML al crear Tracto: ' + e.getMessage());
            throw new AuraHandledException('Error en la base de datos: ' + e.getDmlMessage(0));
        } catch (Exception e) {
            System.debug('Error General al crear Tracto: ' + e.getMessage());
            throw new AuraHandledException(e.getMessage());
        }
    }
}