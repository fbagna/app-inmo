public with sharing class PropertyDashboardController {
    
    /**
     * Fetches the most recent Property records to display on the dashboard list view.
     * @return List of gbcinmo__Property__c records.
     */
    @AuraEnabled(cacheable=true)
    public static List<gbcinmo__Property__c> getRecentProperties() {
        return [
            SELECT Id, 
                   Name, 
                   gbcinmo__Street__c,
                   gbcinmo__City__c,
                   gbcinmo__State_Province__c
            FROM gbcinmo__Property__c 
            WITH USER_MODE
            ORDER BY CreatedDate DESC
            LIMIT 50
        ];
    }

    /**
     * Fetches all child Property Unit records belonging to a specific parent Property container.
     * @param propertyId The ID of the parent Property object record.
     * @return List of matching gbcinmo__Property_Unit__c records ordered alphabetically.
     */
    @AuraEnabled(cacheable=true)
    public static List<gbcinmo__Property_Unit__c> getRelatedUnits(Id propertyId) {
        return [
            SELECT Id, 
                   Name, 
                   gbcinmo__Floor__c, 
                   gbcinmo__Door__c, 
                   gbcinmo__Square_Meters__c, 
                   gbcinmo__Occupancy_Status__c,
                   CreatedDate
            FROM gbcinmo__Property_Unit__c 
            WHERE gbcinmo__Property__c = :propertyId
            WITH USER_MODE
            ORDER BY Name ASC
            LIMIT 100
        ];
    }
}