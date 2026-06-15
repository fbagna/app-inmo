public with sharing class PropertyDashboardController {
    
    /**
     * @description Fetches the recent property buildings records to populate the main inventory.
     * Enforces strict AppExchange sharing rules and secure user mode data visibility.
     */
    @AuraEnabled(cacheable=true)
    public static List<gbcinmo__Property__c> getRecentProperties() {
        return [
            SELECT Id, Name, gbcinmo__Street__c, gbcinmo__State_Province__c, 
                   gbcinmo__City__c, gbcinmo__Neighborhood__c, gbcinmo__Property_Reference__c
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
                   gbcinmo__Square_Meters__c, gbcinmo__Occupancy_Status__c
            FROM gbcinmo__Property_Unit__c
            WHERE gbcinmo__Property__c = :propertyId
            WITH USER_MODE
            ORDER BY Name ASC
        ];
    }

    /**
     * @description NEW METHOD: Fetches the entire unlinked property units data schema catalog.
     * Maps relationship parent names references dynamically to support custom portfolio views.
     */
    @AuraEnabled(cacheable=true)
    public static List<gbcinmo__Property_Unit__c> getAllPropertyUnits() {
        return [
            SELECT Id, Name, gbcinmo__Floor__c, gbcinmo__Door__c, 
                   gbcinmo__Square_Meters__c, gbcinmo__Occupancy_Status__c, 
                   gbcinmo__Property__c, gbcinmo__Property__r.Name
            FROM gbcinmo__Property_Unit__c
            WITH USER_MODE
            ORDER BY Name ASC
            LIMIT 1000
        ];
    }
}