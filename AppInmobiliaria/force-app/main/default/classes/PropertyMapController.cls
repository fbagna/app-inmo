public with sharing class PropertyMapController {

    @AuraEnabled(cacheable=true)
    public static List<Opportunity> getAvailableProperties() {
        // Queries active listings and traverses to the Property (Building) to get the address
        return [
            SELECT Id, Name, 
                   gbcinmo__Property_Unit__r.gbcinmo__Property__r.gbcinmo__Street__c,
                   gbcinmo__Property_Unit__r.gbcinmo__Property__r.gbcinmo__State_Province__c
            FROM Opportunity
            WHERE IsClosed = false
              AND gbcinmo__Property_Unit__r.gbcinmo__Property__r.gbcinmo__Street__c != null
            LIMIT 50
        ];
    }
}