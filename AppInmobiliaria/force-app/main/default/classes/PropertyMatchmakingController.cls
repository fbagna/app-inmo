public with sharing class PropertyMatchmakingController {

    @AuraEnabled(cacheable=true)
    public static Opportunity getListingDetails(Id listingId) {
        return [SELECT Id, gbcinmo__Operation_Type__c, gbcinmo__Asking_Price__c, 
                       gbcinmo__Property_Unit__r.gbcinmo__Bedrooms__c, 
                       gbcinmo__Property_Unit__r.gbcinmo__Property__r.gbcinmo__State_Province__c,
                       gbcinmo__Property_Unit__r.gbcinmo__Bathrooms__c,
                       gbcinmo__Property_Unit__r.gbcinmo__Property__r.gbcinmo__Has_Elevator__c,
                       gbcinmo__Property_Unit__r.gbcinmo__Square_Meters__c
                FROM Opportunity 
                WHERE Id = :listingId 
                WITH SECURITY_ENFORCED 
                LIMIT 1];
    }

    @AuraEnabled(cacheable=true)
    public static List<gbcinmo__Property_Request__c> getCompatibleRequests(
        Id listingId, String operationType, Decimal maxBudget, Decimal minBedrooms, 
        String stateProvince, Decimal minBathrooms, Boolean hasElevator, Decimal minSquareMeters
    ) {
        List<gbcinmo__Property_Match__c> previousMatches = [
            SELECT gbcinmo__Property_Request__c 
            FROM gbcinmo__Property_Match__c 
            WHERE gbcinmo__Opportunity__c = :listingId
        ];
        Set<Id> matchedRequestIds = new Set<Id>();
        for (gbcinmo__Property_Match__c match : previousMatches) { 
            matchedRequestIds.add(match.gbcinmo__Property_Request__c); 
        }

        String query = 'SELECT Id, Name, gbcinmo__Client_Name__c, gbcinmo__Max_Budget__c, ' +
                       'gbcinmo__Min_Bedrooms__c, gbcinmo__Desired_City__c, gbcinmo__Min_Square_Meters__c ' +
                       'FROM gbcinmo__Property_Request__c ' +
                       'WHERE gbcinmo__Status__c = \'Activa\' ' + 
                       'AND Id NOT IN :matchedRequestIds ';
        
        if (String.isNotBlank(operationType)) {
            String inverseOperation = (operationType == 'Venta') ? 'Compra' : operationType;
            query += ' AND gbcinmo__Desired_Operation_Type__c = :inverseOperation ';
        }

        if (maxBudget != null) query += ' AND gbcinmo__Max_Budget__c >= :maxBudget ';
        if (minBedrooms != null) query += ' AND gbcinmo__Min_Bedrooms__c <= :minBedrooms ';
        if (minBathrooms != null) query += ' AND gbcinmo__Min_Bathrooms__c <= :minBathrooms ';
        if (minSquareMeters != null) query += ' AND gbcinmo__Min_Square_Meters__c <= :minSquareMeters '; 
        if (String.isNotBlank(stateProvince)) query += ' AND gbcinmo__Desired_State_Province__c = :stateProvince ';
        
        if (hasElevator != null && hasElevator == false) {
            query += ' AND gbcinmo__Elevator_Required__c = false ';
        }
        
        query += ' ORDER BY gbcinmo__Max_Budget__c DESC';
        return Database.query(query);
    }

    @AuraEnabled(cacheable=true)
    public static List<gbcinmo__Property_Match__c> getPreviousMatches(Id listingId) {
        return [SELECT Id, Name, gbcinmo__Match_Status__c, gbcinmo__Property_Request__c,
                       gbcinmo__Property_Request__r.Name, 
                       gbcinmo__Property_Request__r.gbcinmo__Client_Name__c, 
                       gbcinmo__Property_Request__r.gbcinmo__Max_Budget__c 
                FROM gbcinmo__Property_Match__c 
                WHERE gbcinmo__Opportunity__c = :listingId 
                WITH SECURITY_ENFORCED
                ORDER BY CreatedDate DESC];
    }

    @AuraEnabled
    public static void createMatches(Id listingId, List<Id> requestIds) {
        List<gbcinmo__Property_Match__c> newMatches = new List<gbcinmo__Property_Match__c>();
        for (Id requestId : requestIds) {
            gbcinmo__Property_Match__c newMatch = new gbcinmo__Property_Match__c();
            newMatch.gbcinmo__Opportunity__c = listingId;
            newMatch.gbcinmo__Property_Request__c = requestId;
            newMatch.gbcinmo__Match_Status__c = 'Nueva Sugerencia'; 
            newMatches.add(newMatch);
        }
        if (!newMatches.isEmpty()) {
            insert Security.stripInaccessible(AccessType.CREATABLE, newMatches).getRecords();
        }
    }

    @AuraEnabled(cacheable=true)
    public static gbcinmo__Property_Request__c getRequestDetails(Id requestId) {
        return [SELECT Id, gbcinmo__Desired_Operation_Type__c, gbcinmo__Max_Budget__c, gbcinmo__Min_Bedrooms__c, 
                       gbcinmo__Min_Bathrooms__c, gbcinmo__Elevator_Required__c, gbcinmo__Desired_State_Province__c, gbcinmo__Min_Square_Meters__c 
                FROM gbcinmo__Property_Request__c 
                WHERE Id = :requestId 
                WITH SECURITY_ENFORCED
                LIMIT 1];
    }

    @AuraEnabled(cacheable=true)
    public static List<Opportunity> getCompatibleListings(
        Id requestId, String operationType, Decimal maxBudget, Decimal minBedrooms, 
        Decimal minBathrooms, Boolean requiresElevator, String stateProvince, Decimal minSquareMeters
    ) {
        List<gbcinmo__Property_Match__c> previousMatches = [
            SELECT gbcinmo__Opportunity__c 
            FROM gbcinmo__Property_Match__c 
            WHERE gbcinmo__Property_Request__c = :requestId
        ];
        Set<Id> matchedListingIds = new Set<Id>();
        for (gbcinmo__Property_Match__c match : previousMatches) { 
            matchedListingIds.add(match.gbcinmo__Opportunity__c); 
        }

        // We added Minimum Accepted Price and Bathrooms to the query
        String query = 'SELECT Id, Name, gbcinmo__Operation_Type__c, gbcinmo__Asking_Price__c, gbcinmo__Minimum_Accepted_Price__c, ' +
                       'gbcinmo__Property_Unit__r.gbcinmo__Bedrooms__c, ' +
                       'gbcinmo__Property_Unit__r.gbcinmo__Bathrooms__c, ' +
                       'gbcinmo__Property_Unit__r.gbcinmo__Square_Meters__c, ' +
                       'gbcinmo__Property_Unit__r.gbcinmo__Property__r.gbcinmo__State_Province__c ' +
                       'FROM Opportunity ' +
                       'WHERE IsClosed = false ' +
                       'AND Id NOT IN :matchedListingIds ';
        
        if (String.isNotBlank(operationType)) {
            String inverseOperation = (operationType == 'Compra') ? 'Venta' : operationType;
            query += ' AND gbcinmo__Operation_Type__c = :inverseOperation ';
        }
        if (maxBudget != null && maxBudget > 0) query += ' AND gbcinmo__Asking_Price__c <= :maxBudget ';
        if (minBedrooms != null && minBedrooms > 0) query += ' AND gbcinmo__Property_Unit__r.gbcinmo__Bedrooms__c >= :minBedrooms ';
        if (minBathrooms != null && minBathrooms > 0) query += ' AND gbcinmo__Property_Unit__r.gbcinmo__Bathrooms__c >= :minBathrooms ';
        if (minSquareMeters != null && minSquareMeters > 0) query += ' AND gbcinmo__Property_Unit__r.gbcinmo__Square_Meters__c >= :minSquareMeters '; 
        if (requiresElevator != null && requiresElevator) query += ' AND gbcinmo__Property_Unit__r.gbcinmo__Property__r.gbcinmo__Has_Elevator__c = true ';
        if (String.isNotBlank(stateProvince)) query += ' AND gbcinmo__Property_Unit__r.gbcinmo__Property__r.gbcinmo__State_Province__c = :stateProvince ';
        
        query += ' ORDER BY gbcinmo__Asking_Price__c ASC';
        return Database.query(query);
    }

    @AuraEnabled(cacheable=true)
    public static List<gbcinmo__Property_Match__c> getPreviousMatchesForRequest(Id requestId) {
        return [SELECT Id, Name, gbcinmo__Match_Status__c, gbcinmo__Opportunity__c,
                       gbcinmo__Opportunity__r.Name, 
                       gbcinmo__Opportunity__r.gbcinmo__Asking_Price__c
                FROM gbcinmo__Property_Match__c 
                WHERE gbcinmo__Property_Request__c = :requestId 
                WITH SECURITY_ENFORCED
                ORDER BY CreatedDate DESC];
    }

    @AuraEnabled
    public static void createMatchesForRequest(Id requestId, List<Id> listingIds) {
        List<gbcinmo__Property_Match__c> newMatches = new List<gbcinmo__Property_Match__c>();
        for (Id listingId : listingIds) {
            gbcinmo__Property_Match__c newMatch = new gbcinmo__Property_Match__c();
            newMatch.gbcinmo__Property_Request__c = requestId;
            newMatch.gbcinmo__Opportunity__c = listingId;
            newMatch.gbcinmo__Match_Status__c = 'Nueva Sugerencia'; 
            newMatches.add(newMatch);
        }
        if (!newMatches.isEmpty()) {
            insert Security.stripInaccessible(AccessType.CREATABLE, newMatches).getRecords();
        }
    }
}