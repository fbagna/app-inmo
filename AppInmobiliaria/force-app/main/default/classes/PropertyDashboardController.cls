public with sharing class PropertyDashboardController {
    
    /**
     * @description Fetches the recent property buildings records to populate the main inventory.
     * Enforces strict AppExchange sharing rules and secure user mode data visibility.
     */
    @AuraEnabled(cacheable=true)
    public static List<gbcinmo__Property__c> getRecentProperties() {
        return [
            SELECT Id, Name, gbcinmo__Street__c, gbcinmo__State_Province__c, 
                   gbcinmo__City__c, gbcinmo__Neighborhood__c, gbcinmo__Property_Reference__c, gbcinmo__Zip_Code__c
            FROM gbcinmo__Property__c
            WITH USER_MODE
            ORDER BY CreatedDate DESC
            LIMIT 100
        ];
    }

    /**
     * @description Fetches the filtered sub-units catalog belonging strictly to a parent building.
     */
    @AuraEnabled(cacheable=true)
    public static List<gbcinmo__Property_Unit__c> getRelatedUnits(Id propertyId) {
        if (propertyId == null) {
            return new List<gbcinmo__Property_Unit__c>();
        }
        return [
            SELECT Id, Name, gbcinmo__Floor__c, gbcinmo__Door__c, 
                   gbcinmo__Square_Meters__c, gbcinmo__Occupancy_Status__c,
                   gbcinmo__Property__c, gbcinmo__Property__r.Name,
                   gbcinmo__Property__r.gbcinmo__City__c, gbcinmo__Property__r.gbcinmo__Neighborhood__c,
                   gbcinmo__Unit_Reference__c, gbcinmo__Owner_Contact__c, gbcinmo__Owner_Contact__r.Name,
                   gbcinmo__Property_Type__c, gbcinmo__State_Province__c, gbcinmo__Thumbnail__c
            FROM gbcinmo__Property_Unit__c
            WHERE gbcinmo__Property__c = :propertyId
            WITH USER_MODE
            ORDER BY Name ASC
        ];
    }

    /**
     * @description METHOD: Fetches the entire unlinked property units data schema catalog.
     * Maps relationship parent names references dynamically to support custom portfolio views.
     */
    @AuraEnabled(cacheable=true)
    public static List<gbcinmo__Property_Unit__c> getAllPropertyUnits() {
        return [
            SELECT Id, Name, gbcinmo__Floor__c, gbcinmo__Door__c, 
                   gbcinmo__Square_Meters__c, gbcinmo__Occupancy_Status__c, 
                   gbcinmo__Property__c, gbcinmo__Property__r.Name,
                   gbcinmo__Property__r.gbcinmo__City__c, gbcinmo__Property__r.gbcinmo__Neighborhood__c,
                   gbcinmo__Unit_Reference__c, gbcinmo__Owner_Contact__c, gbcinmo__Owner_Contact__r.Name,
                   gbcinmo__Property_Type__c, gbcinmo__State_Province__c, gbcinmo__Thumbnail__c
            FROM gbcinmo__Property_Unit__c
            WITH USER_MODE
            ORDER BY Name ASC
            LIMIT 1000
        ];
    }

    /**
     * @description Retrieves Opportunities (Listings) associated with a specific Property Unit.
     * REFACTORED: Fixed API Token name to look up over 'gbcinmo__Agency_Fee_Percentage__c' natively.
     */
    @AuraEnabled(cacheable=true)
    public static List<Opportunity> getUnitOpportunities(Id unitId) {
        if (unitId == null) {
            return new List<Opportunity>();
        }
        return [
            SELECT Id, Name, StageName, gbcinmo__Operation_Type__c, Amount, 
                   gbcinmo__Agency_Fee_Percentage__c, gbcinmo__Agency_Profit__c, gbcinmo__Listing_Expiration_Date__c
            FROM Opportunity
            WHERE gbcinmo__Property_Unit__c = :unitId
            WITH USER_MODE
            ORDER BY CreatedDate DESC
        ];
    }

    /**
     * @description Retrieves Listing Leads attached to a specific Property Unit.
     * Fixed filtering token to query securely over the actual 'gbcinmo__Target_Property_Unit__c' Master-Detail relationship field.
     */
    @AuraEnabled(cacheable=true)
    public static List<gbcinmo__Listing_Lead__c> getUnitListingLeads(Id unitId) {
        if (unitId == null) {
            return new List<gbcinmo__Listing_Lead__c>();
        }
        return [
            SELECT Id, Name, gbcinmo__Status__c, gbcinmo__Lead_Source__c, 
                   gbcinmo__Follow_Up_Date__c, gbcinmo__Description__c
            FROM gbcinmo__Listing_Lead__c
            WHERE gbcinmo__Target_Property_Unit__c = :unitId
            WITH USER_MODE
            ORDER BY CreatedDate DESC
        ];
    }
}