public with sharing class GlobalMapController {
    
    @AuraEnabled(cacheable=true)
    public static List<Map<String, String>> getPropertiesWithAddress() {
        List<Map<String, String>> results = new List<Map<String, String>>();
        
        // Query the Unit and traverse to the Building (Property) to retrieve the actual address
        for (gbcinmo__Property_Unit__c unit : [
            SELECT Id, Name, 
                   gbcinmo__Property__r.gbcinmo__Street__c, 
                   gbcinmo__Property__r.gbcinmo__State_Province__c
                   /* , gbcinmo__Property__r.gbcinmo__City__c */
            FROM gbcinmo__Property_Unit__c 
            WHERE gbcinmo__Property__r.gbcinmo__Street__c != null 
            WITH SECURITY_ENFORCED 
            LIMIT 50
        ]) {
            Map<String, String> mapData = new Map<String, String>();
            mapData.put('Id', unit.Id);
            mapData.put('Name', unit.Name);
            mapData.put('Street', unit.gbcinmo__Property__r.gbcinmo__Street__c);
            mapData.put('StateProvince', unit.gbcinmo__Property__r.gbcinmo__State_Province__c);
            /* mapData.put('City', unit.gbcinmo__Property__r.gbcinmo__City__c); // Commented out for field deletion */
            
            results.add(mapData);
        }
        
        return results;
    }
}