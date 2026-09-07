// 1. Limpiar registros anteriores
List<Tracto__c> registrosPrevios = [SELECT Id FROM Tracto__c LIMIT 10000];
if (!registrosPrevios.isEmpty()) {
    delete registrosPrevios;
    DataBase.emptyRecycleBin(registrosPrevios);
}

// 2. Obtener o crear una Cuenta para asignar al campo Lookup Empresa__c
Id empresaId = null;
List<Account> cuentas = [SELECT Id FROM Account LIMIT 1];
if (!cuentas.isEmpty()) {
    empresaId = cuentas[0].Id;
} else {
    Account acc = new Account(Name = 'Kenworth DAF del Este');
    insert acc;
    empresaId = acc.Id;
}

// 3. Generar 200 registros completos
List<Tracto__c> listaTractos = new List<Tracto__c>();

String[] ciudades = new String[]{'CDMX Central', 'MTY Patio Norte', 'GDL Base West', 'QRO Logística', 'PUE Bodega', 'VER Puerto', 'SLP Distribución', 'LEO Módulo', 'TOL Patio 2', 'CUL Express'};
Decimal[] latitudes = new Decimal[]{19.432608, 25.686614, 20.659698, 20.588056, 19.041297, 19.173773, 22.156469, 21.122013, 19.282601, 24.809312};
Decimal[] longitudes = new Decimal[]{-99.133209, -100.316113, -103.349609, -100.389889, -98.206200, -96.134224, -100.985540, -101.682346, -99.655665, -107.394132};
String[] camarotes = new String[]{'76 in High Roof Sleeper', '52 in Mid Roof Sleeper', 'Day Cab (Sin Camarote)', '40 in Flat Top Sleeper'};

for (Integer i = 1; i <= 200; i++) {
    Integer idx = Math.mod(i - 1, 10);
    Tracto__c t = new Tracto__c();

    // Campos de Identificación y Modelo
    t.Name = 'KW T680 ' + (2018 + Math.mod(i, 6)) + ' - ' + ciudades[idx] + ' #' + i;
    t.Modelo__c = (Math.mod(i, 3) == 0) ? 'T880' : ((Math.mod(i, 3) == 1) ? 'T680' : 'XF');
    t.Year_Modelo__c = 2018 + Math.mod(i, 6);
    t.Precio_Venta__c = 1500000 + (i * 10000);
    t.Estado_de_la_Unidad__c = (Math.mod(i, 5) == 0) ? 'En Mantenimiento' : ((Math.mod(i, 8) == 0) ? 'Vendido' : 'Disponible');
    t.NumeroVIN__c = '3AKJHGLD' + Math.mod(i, 9) + 'MS' + (100000 + i);

    // Asignación correcta del ID para el campo Lookup
    t.Empresa__c = empresaId;

    // Motor y Transmisión
    t.Marca_de_Motor__c = (Math.mod(i, 2) == 0) ? 'PACCAR' : 'Cummins';
    t.Modelo_del_Motor__c = (Math.mod(i, 2) == 0) ? 'MX-13' : 'X15 Performance';
    t.Caballos_de_fuerza_HP__c = 455 + (Math.mod(i, 5) * 25);
    t.Kilometraje__c = 40000 + (i * 2500);
    t.Transmision__c = (Math.mod(i, 2) == 0) ? 'Eaton Fuller 18 Vel' : 'TraXon 12 Vel Automatizada';

    // Configuración Pesada y Ejes
    t.Camarote__c = camarotes[Math.mod(i, camarotes.size())];
    t.Capacidad_de_Suspension__c = '46,000 lbs Neumática';
    t.Capacidad_Ejes_Delanteros__c = '13,200 lbs';
    t.Capacidad_Ejes_Traseros__c = '46,000 lbs Tandem';
    t.Paso_de_Diferenciales__c = '3.55';

    // Geolocalización y Telemetría GPS
    t.Ubicacion_GPS__Latitude__s = latitudes[idx] + (Math.mod(i, 15) * 0.005);
    t.Ubicacion_GPS__Longitude__s = longitudes[idx] + (Math.mod(i, 15) * 0.005);
    t.Ultima_Actualizacion_GPS__c = System.now().addMinutes(-1 * Math.mod(i, 120));
    t.Velocidad_KmH__c = (t.Estado_de_la_Unidad__c == 'Disponible') ? (50 + Math.mod(i, 40)) : 0;

    // Contacto Comercial y Notas
    t.Nombre_Contacto__c = 'Contacto Pruebas #' + (idx + 1);
    t.Numero_del_Contacto__c = '55512345' + String.valueOf(idx + 10);
    t.Correo_Contacto__c = 'contacto' + i + '@trucklocator.mx';
    t.Observaciones_Generales__c = 'Unidad #' + i + ' inspeccionada con mantenimiento preventivo al día y excelente estado físico.';

    listaTractos.add(t);
}

insert listaTractos;
System.debug('¡Éxito! Se insertaron ' + listaTractos.size() + ' tractocamiones con todos sus campos poblados.');