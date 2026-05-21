public with sharing class MatchmakingController {

    // ============================================================================
    // MÉTODOS DESDE EL ENCARGO HACIA LAS DEMANDAS (MATCHMAKING ENGINE)
    // ============================================================================

    @AuraEnabled(cacheable=true)
    public static Opportunity getDatosEncargo(Id encargoId) {
        return [SELECT Id, Tipo_Operacion__c, Precio_Salida__c, 
                       Inmueble_Asociado__r.Habitaciones__c, 
                       Inmueble_Asociado__r.Provincia__c,
                       Inmueble_Asociado__r.Banos__c,
                       Inmueble_Asociado__r.Tiene_Ascensor__c,
                       Inmueble_Asociado__r.Metros_Cuadrados__c
                FROM Opportunity 
                WHERE Id = :encargoId LIMIT 1];
    }

    @AuraEnabled(cacheable=true)
    public static List<Demanda__c> getDemandasCompatibles(Id encargoId, String operacion, Decimal presupuesto, Decimal habitaciones, String provincia, Decimal banos, Boolean ascensor, Decimal metros) {
        List<Cruce__c> crucesPrevios = [SELECT Demanda__c FROM Cruce__c WHERE Encargo__c = :encargoId];
        Set<Id> demandasYaCruzadas = new Set<Id>();
        for (Cruce__c cruce : crucesPrevios) { demandasYaCruzadas.add(cruce.Demanda__c); }

        String query = 'SELECT Id, Name, Nombre_del_Interesado__c, Presupuesto_Maximo__c, Habitaciones_Minimas__c, Poblacion_Deseada__c, Metros_Minimos__c ' +
                       'FROM Demanda__c ' +
                       'WHERE Estado__c = \'Activa\' ' +
                       'AND Id NOT IN :demandasYaCruzadas ';
        
        if (String.isNotBlank(operacion)) query += ' AND Tipo_Operacion_Buscada__c = :operacion ';
        if (presupuesto != null) query += ' AND Presupuesto_Maximo__c >= :presupuesto ';
        if (habitaciones != null) query += ' AND Habitaciones_Minimas__c <= :habitaciones ';
        if (banos != null) query += ' AND Banos_Minimos__c <= :banos ';
        if (metros != null) query += ' AND Metros_Minimos__c <= :metros '; 
        if (ascensor != null && ascensor) query += ' AND Imprescindible_Ascensor__c = true ';
        if (String.isNotBlank(provincia)) query += ' AND Provincia_Deseada__c = :provincia ';
        
        query += ' ORDER BY Presupuesto_Maximo__c DESC';
        return Database.query(query);
    }

    @AuraEnabled(cacheable=true)
    public static List<Cruce__c> getCrucesPrevios(Id encargoId) {
        return [SELECT Id, Name, Estado_Propuesta__c, Demanda__c,
                       Demanda__r.Name, 
                       Demanda__r.Nombre_del_Interesado__c, 
                       Demanda__r.Presupuesto_Maximo__c 
                FROM Cruce__c 
                WHERE Encargo__c = :encargoId 
                ORDER BY CreatedDate DESC];
    }

    @AuraEnabled
    public static void crearPropuestas(Id encargoId, List<Id> demandaIds) {
        List<Cruce__c> nuevosCruces = new List<Cruce__c>();
        for (Id demandaId : demandaIds) {
            Cruce__c nuevoCruce = new Cruce__c();
            nuevoCruce.Encargo__c = encargoId;
            nuevoCruce.Demanda__c = demandaId;
            nuevoCruce.Estado_Propuesta__c = 'Nueva Sugerencia';
            nuevosCruces.add(nuevoCruce);
        }
        if (!nuevosCruces.isEmpty()) insert nuevosCruces;
    }

    // ============================================================================
    // MÉTODOS DESDE LA DEMANDA HACIA LOS ENCARGOS (MATCHMAKING DEMANDA)
    // ============================================================================

    @AuraEnabled(cacheable=true)
    public static Demanda__c getDatosDemanda(Id demandaId) {
        return [SELECT Id, Tipo_Operacion_Buscada__c, Presupuesto_Maximo__c, Habitaciones_Minimas__c, 
                       Banos_Minimos__c, Imprescindible_Ascensor__c, Provincia_Deseada__c, Metros_Minimos__c 
                FROM Demanda__c 
                WHERE Id = :demandaId LIMIT 1];
    }

    @AuraEnabled(cacheable=true)
    public static List<Opportunity> getEncargosCompatibles(Id demandaId, String operacion, Decimal presupuesto, Decimal habitaciones, Decimal banos, Boolean ascensor, String provincia, Decimal metros) {
        List<Cruce__c> crucesPrevios = [SELECT Encargo__c FROM Cruce__c WHERE Demanda__c = :demandaId];
        Set<Id> encargosYaCruzados = new Set<Id>();
        for (Cruce__c cruce : crucesPrevios) { encargosYaCruzados.add(cruce.Encargo__c); }

        String query = 'SELECT Id, Name, Tipo_Operacion__c, Precio_Salida__c, ' +
                       'Inmueble_Asociado__c, Inmueble_Asociado__r.Name, Inmueble_Asociado__r.Habitaciones__c, ' +
                       'Inmueble_Asociado__r.Banos__c, Inmueble_Asociado__r.Provincia__c, Inmueble_Asociado__r.Metros_Cuadrados__c ' +
                       'FROM Opportunity ' +
                       'WHERE IsClosed = false ' +
                       'AND Id NOT IN :encargosYaCruzados ';
        
        if (String.isNotBlank(operacion)) {
            String opInversa = operacion == 'Compra' ? 'Venta' : operacion;
            query += ' AND Tipo_Operacion__c = :opInversa ';
        }
        if (presupuesto != null && presupuesto > 0) query += ' AND Precio_Salida__c <= :presupuesto ';
        if (habitaciones != null && habitaciones > 0) query += ' AND Inmueble_Asociado__r.Habitaciones__c >= :habitaciones ';
        if (banos != null && banos > 0) query += ' AND Inmueble_Asociado__r.Banos__c >= :banos ';
        if (metros != null && metros > 0) query += ' AND Inmueble_Asociado__r.Metros_Cuadrados__c >= :metros '; 
        if (ascensor != null && ascensor) query += ' AND Inmueble_Asociado__r.Tiene_Ascensor__c = true ';
        if (String.isNotBlank(provincia)) query += ' AND Inmueble_Asociado__r.Provincia__c = :provincia ';
        
        query += ' ORDER BY Precio_Salida__c ASC';
        return Database.query(query);
    }

    @AuraEnabled(cacheable=true)
    public static List<Cruce__c> getCrucesPreviosDemanda(Id demandaId) {
        return [SELECT Id, Name, Estado_Propuesta__c, Encargo__c,
                       Encargo__r.Name, 
                       Encargo__r.Precio_Salida__c
                FROM Cruce__c 
                WHERE Demanda__c = :demandaId 
                ORDER BY CreatedDate DESC];
    }

    @AuraEnabled
    public static void crearPropuestasInversas(Id demandaId, List<Id> encargoIds) {
        List<Cruce__c> nuevosCruces = new List<Cruce__c>();
        for (Id encargoId : encargoIds) {
            Cruce__c nuevoCruce = new Cruce__c();
            nuevoCruce.Demanda__c = demandaId;
            nuevoCruce.Encargo__c = encargoId;
            nuevoCruce.Estado_Propuesta__c = 'Nueva Sugerencia';
            nuevosCruces.add(nuevoCruce);
        }
        if (!nuevosCruces.isEmpty()) insert nuevosCruces;
    }
}