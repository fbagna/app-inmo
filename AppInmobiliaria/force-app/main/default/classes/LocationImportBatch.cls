public class LocationImportBatch implements Database.Batchable<String>, Database.Stateful {
    
    private List<String> csvRows;
    private Map<String, Id> parentIdMap;
    
    public LocationImportBatch() {
        this.parentIdMap = new Map<String, Id>();
        this.csvRows = new List<String>();
        
        // 1. Load the Static Resource safely
        StaticResource sr = [SELECT Body FROM StaticResource WHERE Name = 'SpainLocations' LIMIT 1];
        String csvBody = sr.Body.toString();
        
        // 2. Split into rows
        this.csvRows = csvBody.split('\n');
        
        // Remove header row safely
        if(!this.csvRows.isEmpty()){
            this.csvRows.remove(0);
        }
    }

    public Iterable<String> start(Database.BatchableContext bc) {
        return this.csvRows;
    }

    public void execute(Database.BatchableContext bc, List<String> scope) {
        List<String> countryRows = new List<String>();
        List<String> stateRows = new List<String>();
        List<String> cityRows = new List<String>();
        
        // PHASE 1: Separate rows by hierarchy level within this chunk
        for (String row : scope) {
            if (String.isBlank(row)) continue;
            List<String> columns = safeSplit(row);
            if (columns.size() >= 2) {
                String level = columns[1];
                if (level == 'Country') {
                    countryRows.add(row);
                } else if (level == 'State') {
                    stateRows.add(row);
                } else if (level == 'City') {
                    cityRows.add(row);
                }
            }
        }
        
        // PHASE 2: Process Countries
        if (!countryRows.isEmpty()) {
            List<Location__c> countriesToInsert = new List<Location__c>();
            for (String row : countryRows) {
                List<String> columns = safeSplit(row);
                countriesToInsert.add(new Location__c(Name = columns[0], Level__c = columns[1], Active__c = true));
            }
            Database.insert(countriesToInsert, false);
            for (Location__c loc : countriesToInsert) {
                if (loc.Id != null) this.parentIdMap.put(loc.Name, loc.Id);
            }
        }
        
        // PHASE 3: Process States (Provinces)
        if (!stateRows.isEmpty()) {
            Set<String> missingParents = new Set<String>();
            for (String row : stateRows) {
                List<String> columns = safeSplit(row);
                String pName = columns.size() >= 3 ? columns[2] : '';
                if (String.isNotBlank(pName) && !this.parentIdMap.containsKey(pName)) {
                    missingParents.add(pName);
                }
            }
            if (!missingParents.isEmpty()) {
                for (Location__c p : [SELECT Id, Name FROM Location__c WHERE Name IN :missingParents AND Level__c = 'Country']) {
                    this.parentIdMap.put(p.Name, p.Id);
                }
            }
            
            List<Location__c> statesToInsert = new List<Location__c>();
            for (String row : stateRows) {
                List<String> columns = safeSplit(row);
                Location__c newLoc = new Location__c(Name = columns[0], Level__c = columns[1], Active__c = true);
                String pName = columns.size() >= 3 ? columns[2] : '';
                if (String.isNotBlank(pName) && this.parentIdMap.containsKey(pName)) {
                    newLoc.Parent_Location__c = this.parentIdMap.get(pName);
                }
                statesToInsert.add(newLoc);
            }
            Database.insert(statesToInsert, false);
            for (Location__c loc : statesToInsert) {
                if (loc.Id != null) this.parentIdMap.put(loc.Name, loc.Id);
            }
        }
        
        // PHASE 4: Process Cities (Municipalities)
        if (!cityRows.isEmpty()) {
            Set<String> missingParents = new Set<String>();
            for (String row : cityRows) {
                List<String> columns = safeSplit(row);
                String pName = columns.size() >= 3 ? columns[2] : '';
                if (String.isNotBlank(pName) && !this.parentIdMap.containsKey(pName)) {
                    missingParents.add(pName);
                }
            }
            if (!missingParents.isEmpty()) {
                for (Location__c p : [SELECT Id, Name FROM Location__c WHERE Name IN :missingParents AND Level__c = 'State']) {
                    this.parentIdMap.put(p.Name, p.Id);
                }
            }
            
            List<Location__c> citiesToInsert = new List<Location__c>();
            for (String row : cityRows) {
                List<String> columns = safeSplit(row);
                Location__c newLoc = new Location__c(Name = columns[0], Level__c = columns[1], Active__c = true);
                String pName = columns.size() >= 3 ? columns[2] : '';
                if (String.isNotBlank(pName) && this.parentIdMap.containsKey(pName)) {
                    newLoc.Parent_Location__c = this.parentIdMap.get(pName);
                }
                citiesToInsert.add(newLoc);
            }
            Database.insert(citiesToInsert, false);
            for (Location__c loc : citiesToInsert) {
                if (loc.Id != null) this.parentIdMap.put(loc.Name, loc.Id);
            }
        }
    }

    public void finish(Database.BatchableContext bc) {
        System.debug('Location bulk tiered import completed successfully.');
    }

    /**
     * Helper Method: Smart CSV splitter that ignores commas inside quotation marks
     */
    private List<String> safeSplit(String csvRow) {
        List<String> res = new List<String>();
        Boolean inQuotes = false;
        String currentToken = '';
        
        for (Integer i = 0; i < csvRow.length(); i++) {
            String c = csvRow.substring(i, i+1);
            if (c == '"') {
                inQuotes = !inQuotes;
            } else if (c == ',' && !inQuotes) {
                res.add(currentToken.trim());
                currentToken = '';
            } else {
                currentToken += c;
            }
        }
        res.add(currentToken.trim());
        return res;
    }
}