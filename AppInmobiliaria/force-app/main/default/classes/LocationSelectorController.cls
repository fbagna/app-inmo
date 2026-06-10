public with sharing class LocationSelectorController {
    
    /**
     * Retrieves active locations based on their hierarchy level and parent location.
     * @param level The hierarchy level (Country, State, City, Neighborhood)
     * @param parentId The Id of the parent Location__c (null for Countries)
     * @return List of matching Location__c records
     */
    @AuraEnabled(cacheable=true)
    public static List<Location__c> getLocations(String level, Id parentId) {
        String query = 'SELECT Id, Name, Level__c, Parent_Location__c ' +
                       'FROM Location__c ' +
                       'WHERE Active__c = true AND Level__c = :level ';
        
        /* If a parent is expected but not provided, return empty to prevent massive queries */
        if (String.isNotBlank(parentId)) {
            query += ' AND Parent_Location__c = :parentId ';
        } else if (level != 'Country') {
            return new List<Location__c>(); 
        }
        
        query += ' ORDER BY Name ASC LIMIT 2000';
        return Database.query(query);
    }
}