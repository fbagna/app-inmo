public with sharing class PropertyAlertsController {

    // ==========================================
    // LISTING ALERTS (OPPORTUNITY)
    // ==========================================

    @AuraEnabled(cacheable=true)
    public static List<Opportunity> getListingsWithoutMatches() {
        return [SELECT Id, Name, StageName 
                FROM Opportunity 
                WHERE IsClosed = false 
                AND Id NOT IN (SELECT gbcinmo__Opportunity__c FROM gbcinmo__Property_Match__c) 
                WITH SECURITY_ENFORCED 
                ORDER BY CreatedDate DESC 
                LIMIT 15];
    }

    @AuraEnabled(cacheable=true)
    public static List<Opportunity> getListingsWithPendingMatches() {
        return [SELECT Id, Name, StageName 
                FROM Opportunity 
                WHERE IsClosed = false 
                AND gbcinmo__Pending_Matches__c > 0 
                WITH SECURITY_ENFORCED 
                ORDER BY CreatedDate DESC 
                LIMIT 15];
    }

    // ==========================================
    // PROPERTY REQUEST ALERTS (DEMANDAS)
    // ==========================================

    @AuraEnabled(cacheable=true)
    public static List<gbcinmo__Property_Request__c> getRequestsWithoutMatches() {
        return [SELECT Id, Name, 
                       gbcinmo__Client_Contact__c, gbcinmo__Client_Name__c, 
                       gbcinmo__Desired_Operation_Type__c 
                FROM gbcinmo__Property_Request__c 
                WHERE gbcinmo__Status__c = 'Activa' // Adjust if picklist value changed
                AND Id NOT IN (SELECT gbcinmo__Property_Request__c FROM gbcinmo__Property_Match__c) 
                WITH SECURITY_ENFORCED 
                ORDER BY CreatedDate DESC 
                LIMIT 15];
    }

    @AuraEnabled(cacheable=true)
    public static List<gbcinmo__Property_Request__c> getRequestsWithPendingMatches() {
        return [SELECT Id, Name, 
                       gbcinmo__Client_Contact__c, gbcinmo__Client_Name__c, 
                       gbcinmo__Desired_Operation_Type__c 
                FROM gbcinmo__Property_Request__c 
                WHERE gbcinmo__Status__c = 'Activa' // Adjust if picklist value changed
                AND Id IN (SELECT gbcinmo__Property_Request__c FROM gbcinmo__Property_Match__c WHERE gbcinmo__Match_Status__c = 'Nueva Sugerencia') 
                WITH SECURITY_ENFORCED 
                ORDER BY CreatedDate DESC 
                LIMIT 15];
    }

    // ==========================================
    // LISTING LEAD ALERTS (NOTICIAS)
    // ==========================================

    @AuraEnabled(cacheable=true)
    public static List<gbcinmo__Listing_Lead__c> getOverdueLeads() {
        return [SELECT Id, Name, gbcinmo__Status__c, gbcinmo__Follow_Up_Date__c, gbcinmo__Lead_Source__c 
                FROM gbcinmo__Listing_Lead__c 
                WHERE gbcinmo__Status__c NOT IN ('Descartado', 'Convertido a Encargo') // Adjust if picklist values changed
                AND gbcinmo__Follow_Up_Date__c < TODAY 
                WITH SECURITY_ENFORCED 
                ORDER BY gbcinmo__Follow_Up_Date__c ASC 
                LIMIT 15];
    }

    @AuraEnabled(cacheable=true)
    public static List<gbcinmo__Listing_Lead__c> getNewLeads() {
        return [SELECT Id, Name, gbcinmo__Status__c, gbcinmo__Follow_Up_Date__c, gbcinmo__Lead_Source__c 
                FROM gbcinmo__Listing_Lead__c 
                WHERE gbcinmo__Status__c NOT IN ('Descartado', 'Convertido a Encargo') // Adjust if picklist values changed
                AND (gbcinmo__Follow_Up_Date__c >= TODAY OR gbcinmo__Follow_Up_Date__c = NULL)
                WITH SECURITY_ENFORCED 
                ORDER BY CreatedDate DESC 
                LIMIT 15];
    }
}