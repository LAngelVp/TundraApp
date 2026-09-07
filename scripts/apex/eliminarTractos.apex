// Consulta y elimina todos los registros del objeto Tracto__c
List<Tracto__c> listaAEliminar = [SELECT Id FROM Tracto__c LIMIT 10000];

if (!listaAEliminar.isEmpty()) {
    delete listaAEliminar;
    // Opcional: vaciar papelera de reciclaje para liberar espacio al instante
    DataBase.emptyRecycleBin(listaAEliminar);
    System.debug('¡Éxito! Se eliminaron ' + listaAEliminar.size() + ' registros de Tracto__c.');
} else {
    System.debug('No hay registros de Tracto__c para eliminar.');
}