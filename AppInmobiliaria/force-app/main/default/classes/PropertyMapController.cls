/**
 * @description Secure map controller pulling active listings locations for the global map component.
 * Refactored to enforce strict AppExchange compliance using USER_MODE execution.
 * @author Gemini Collaborator
 * @date 2026
 */
public with sharing class PropertyMapController {

    /**
     * @description Queries active listings and traverses relationships to get verified addresses.
     * @return List of open Opportunity records with spanning location fields.
     */
    @AuraEnabled(cacheable=true)
    public static List<Opportunity> getAvailableProperties() {
        return [
            SELECT Id, Name, 
                   gbcinmo__Property_Unit__r.gbcinmo__Property__r.gbcinmo__Street__c,
                   gbcinmo__Property_Unit__r.gbcinmo__Property__r.gbcinmo__State_Province__c
            FROM Opportunity
            WHERE IsClosed = false
              AND gbcinmo__Property_Unit__r.gbcinmo__Property__r.gbcinmo__Street__c != null
            WITH USER_MODE
            LIMIT 50
        ];
    }
}