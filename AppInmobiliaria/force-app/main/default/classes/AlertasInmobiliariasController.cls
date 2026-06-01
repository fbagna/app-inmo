public with sharing class AlertasInmobiliariasController {

    // 1. Alerta Roja: Encargos que no tienen NINGÚN cruce generado
    @AuraEnabled(cacheable=true)
    public static List<Opportunity> getEncargosSinCruces() {
        return [SELECT Id, Name, StageName 
                FROM Opportunity 
                WHERE IsClosed = false 
                // OJO: Cambia "gbcinmo__Encargo__c" por el nombre real de tu campo de búsqueda en el objeto Cruce
                AND Id NOT IN (SELECT gbcinmo__Encargo__c FROM gbcinmo__Cruce__c) 
                WITH SECURITY_ENFORCED 
                ORDER BY CreatedDate DESC 
                LIMIT 15];
    }

    // 2. Alerta Amarilla: Encargos con cruces generados, pero pendientes de revisar
    @AuraEnabled(cacheable=true)
    public static List<Opportunity> getEncargosCrucesPendientes() {
        return [SELECT Id, Name, StageName 
                FROM Opportunity 
                WHERE IsClosed = false 
                AND gbcinmo__Cruces_Pendientes__c > 0 
                WITH SECURITY_ENFORCED 
                ORDER BY CreatedDate DESC 
                LIMIT 15];
    }

    // ==========================================
    // ALERTAS DE DEMANDAS
    // ==========================================

    @AuraEnabled(cacheable=true)
    public static List<Demanda__c> getDemandasSinCruces() {
        return [SELECT Id, Name, 
                       gbcinmo__Cliente_Interesado__c, gbcinmo__Cliente_Interesado__r.Name, 
                       gbcinmo__Tipo_Operacion_Buscada__c 
                FROM Demanda__c 
                WHERE gbcinmo__Estado__c = 'Activa' 
                AND Id NOT IN (SELECT Demanda__c FROM Cruce__c) 
                WITH SECURITY_ENFORCED 
                ORDER BY CreatedDate DESC 
                LIMIT 15];
    }

    @AuraEnabled(cacheable=true)
    public static List<Demanda__c> getDemandasCrucesPendientes() {
        return [SELECT Id, Name, 
                       gbcinmo__Cliente_Interesado__c, gbcinmo__Cliente_Interesado__r.Name, 
                       gbcinmo__Tipo_Operacion_Buscada__c 
                FROM Demanda__c 
                WHERE gbcinmo__Estado__c = 'Activa' 
                AND Id IN (SELECT Demanda__c FROM Cruce__c WHERE Estado_Propuesta__c = 'Nueva Sugerencia') 
                WITH SECURITY_ENFORCED 
                ORDER BY CreatedDate DESC 
                LIMIT 15];
    }

    // ==========================================
    // ALERTAS DE NOTICIAS
    // ==========================================

    @AuraEnabled(cacheable=true)
    public static List<Noticia__c> getNoticiasVencidas() {
        // Usando tus API names correctos: Origen__c y Fecha_Seguimiento__c
        return [SELECT Id, Name, gbcinmo__Estado__c, gbcinmo__Fecha_Seguimiento__c, gbcinmo__Origen__c 
                FROM Noticia__c 
                WHERE gbcinmo__Estado__c NOT IN ('Descartado', 'Convertido a Encargo') 
                AND gbcinmo__Fecha_Seguimiento__c < TODAY 
                WITH SECURITY_ENFORCED 
                ORDER BY gbcinmo__Fecha_Seguimiento__c ASC 
                LIMIT 15];
    }

    @AuraEnabled(cacheable=true)
    public static List<Noticia__c> getNoticiasNuevas() {
        return [SELECT Id, Name, gbcinmo__Estado__c, gbcinmo__Fecha_Seguimiento__c, gbcinmo__Origen__c 
                FROM Noticia__c 
                WHERE gbcinmo__Estado__c NOT IN ('Descartado', 'Convertido a Encargo')
                // EXCLUSIÓN: Si está vencida, ya sale en el otro botón. 
                // Aquí solo mostramos las que son >= HOY o las que no tienen fecha.
                AND (gbcinmo__Fecha_Seguimiento__c >= TODAY OR gbcinmo__Fecha_Seguimiento__c = NULL)
                WITH SECURITY_ENFORCED 
                ORDER BY CreatedDate DESC 
                LIMIT 15];
    }
}