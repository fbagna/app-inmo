global class AppPostInstallHandler implements InstallHandler {
    
    global void onInstall(InstallContext context) {
        // Run the script ONLY on fresh installs (previousVersion == null)
        if (context.previousVersion() == null) {
            
            // Check if locations already exist to avoid duplicates
            Integer locationCount = [SELECT COUNT() FROM Location__c LIMIT 1];
            
            if (locationCount == 0) {
                // Trigger the batch with a chunk size of 50 to safely respect mapping limits
                LocationImportBatch batchJob = new LocationImportBatch();
                Database.executeBatch(batchJob, 50);
            }
        }
    }
}