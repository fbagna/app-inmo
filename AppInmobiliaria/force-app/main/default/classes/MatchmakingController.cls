public with sharing class MatchmakingController {

    // Método 1: Lee los datos originales del Encargo (Ahora incluye Baños y Ascensor)
    @AuraEnabled(cacheable=true)
    public static Opportunity getDatosEncargo(Id encargoId) {
        return [SELECT Id, Tipo_Operacion__c, Precio_Salida__c, 
                       Inmueble_Asociado__r.Habitaciones__c, 
                       Inmueble_Asociado__r.Provincia__c,
                       Inmueble_Asociado__r.Banos__c,
                       Inmueble_Asociado__r.Tiene_Ascensor__c
                FROM Opportunity 
                WHERE Id = :encargoId LIMIT 1];
    }

    // Método 2: Busca las demandas (SOQL Dinámico con nuevos filtros de Baños y Ascensor)
    @AuraEnabled(cacheable=true)
    public static List<Demanda__c> getDemandasCompatibles(Id encargoId, String operacion, Decimal presupuesto, Decimal habitaciones, String provincia, Decimal banos, Boolean ascensor) {
        
        List<Cruce__c> crucesPrevios = [SELECT Demanda__c FROM Cruce__c WHERE Encargo__c = :encargoId];
        Set<Id> demandasYaCruzadas = new Set<Id>();
        for (Cruce__c cruce : crucesPrevios) {
            demandasYaCruzadas.add(cruce.Demanda__c);
        }

        String query = 'SELECT Id, Name, Nombre_del_Interesado__c, Presupuesto_Maximo__c, Habitaciones_Minimas__c, Poblacion_Deseada__c ' +
                       'FROM Demanda__c ' +
                       'WHERE Estado__c = \'Activa\' ' +
                       'AND Id NOT IN :demandasYaCruzadas ';
        
        if (String.isNotBlank(operacion)) {
            query += ' AND Tipo_Operacion_Buscada__c = :operacion ';
        }
        if (presupuesto != null) {
            query += ' AND Presupuesto_Maximo__c >= :presupuesto ';
        }
        if (habitaciones != null) {
            query += ' AND Habitaciones_Minimas__c <= :habitaciones ';
        }
        if (banos != null) {
            query += ' AND Banos_Minimos__c <= :banos ';
        }
        if (ascensor != null && ascensor) {
            // Si en el filtro marcamos ascensor, solo buscamos demandas que exijan ascensor
            query += ' AND Imprescindible_Ascensor__c = true ';
        }
        if (String.isNotBlank(provincia)) {
            query += ' AND Provincia_Deseada__c = :provincia ';
        }
        
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
     
   
        if (!nuevosCruces.isEmpty()) {
            insert nuevosCruces;
        }
    }
}