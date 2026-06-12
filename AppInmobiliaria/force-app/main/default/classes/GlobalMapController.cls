/**
 * @description Secure database catalog parsing property units locations into lightweight data structures.
 * Refactored to transition from legacy security enforcement into standard USER_MODE boundaries.
 * @author Gemini Collaborator
 * @date 2026
 */
public with sharing class GlobalMapController {
    
    /**
     * @description Queries units data and returns serialized map coordinates attributes.
     * @return List of key-value maps representing geographic locations elements.
     */
    @AuraEnabled(cacheable=true)
    public static List<Map<String, String>> getPropertiesWithAddress() {
        List<Map<String, String>> results = new List<Map<String, String>>();
        
        for (gbcinmo__Property_Unit__c unit : [
            SELECT Id, Name, 
                   gbcinmo__Property__r.gbcinmo__Street__c, 
                   gbcinmo__Property__r.gbcinmo__State_Province__c
            FROM gbcinmo__Property_Unit__c 
            WHERE gbcinmo__Property__r.gbcinmo__Street__c != null 
            WITH USER_MODE 
            LIMIT 50
        ]) {
            Map<String, String> mapData = new Map<String, String>();
            mapData.put('Id', unit.Id);
            mapData.put('Name', unit.Name);
            mapData.put('Street', unit.gbcinmo__Property__r.gbcinmo__Street__c);
            mapData.put('StateProvince', unit.gbcinmo__Property__r.gbcinmo__State_Province__c);
            
            results.add(mapData);
        }
        
        return results;
    }
}