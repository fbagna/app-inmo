/**
 * @description Operational intelligence engine feeding the dynamic Alert Desks counters.
 * Refactored to enforce unified AppExchange compliance utilizing USER_MODE security execution.
 * All logging references, comments, and variables are fully standardized in English.
 * @author Gemini Collaborator
 * @date 2026
 */
public with sharing class PropertyAlertsController {

    /* ========================================================================= */
    /* --- LISTING ALERTS DESK (OPPORTUNITY / OFFER) -------------------------- */
    /* ========================================================================= */

    /**
     * @description Pulls active listings that currently contain zero matching demand links in the database.
     * @return List of matching active open Opportunity records.
     */
    @AuraEnabled(cacheable=true)
    public static List<Opportunity> getListingsWithoutMatches() {
        return [
            SELECT Id, Name, StageName 
            FROM Opportunity 
            WHERE IsClosed = false 
              AND Id NOT IN (SELECT gbcinmo__Opportunity__c FROM gbcinmo__Property_Match__c) 
            WITH USER_MODE 
            ORDER BY CreatedDate DESC 
            LIMIT 15
        ];
    }

    /**
     * @description Pulls active listings containing unprocessed candidate suggestions waiting for advisor validation.
     * @return List of active open Opportunity records with pending matching conditions.
     */
    @AuraEnabled(cacheable=true)
    public static List<Opportunity> getListingsWithPendingMatches() {
        return [
            SELECT Id, Name, StageName 
            FROM Opportunity 
            WHERE IsClosed = false 
              AND gbcinmo__Pending_Matches__c > 0 
            WITH USER_MODE 
            ORDER BY CreatedDate DESC 
            LIMIT 15
        ];
    }

    /* ========================================================================= */
    /* --- PROPERTY REQUEST ALERTS DESK (DEMANDS) ------------------------------ */
    /* ========================================================================= */

    /**
     * @description Pulls high-priority active customer demands unable to locate matching assets in inventory.
     * @return List of active gbcinmo__Property_Request__c records.
     */
    @AuraEnabled(cacheable=true)
    public static List<gbcinmo__Property_Request__c> getRequestsWithoutMatches() {
        return [
            SELECT Id, Name, gbcinmo__Client_Contact__c, gbcinmo__Client_Name__c, gbcinmo__Desired_Operation_Type__c 
            FROM gbcinmo__Property_Request__c 
            WHERE gbcinmo__Status__c = 'Active' 
              AND Id NOT IN (SELECT gbcinmo__Property_Request__c FROM gbcinmo__Property_Match__c) 
            WITH USER_MODE 
            ORDER BY CreatedDate DESC 
            LIMIT 15
        ];
    }

    /**
     * @description Pulls active demands with newly calculated matching configurations awaiting approval.
     * @return List of matching active gbcinmo__Property_Request__c records.
     */
    @AuraEnabled(cacheable=true)
    public static List<gbcinmo__Property_Request__c> getRequestsWithPendingMatches() {
        return [
            SELECT Id, Name, gbcinmo__Client_Contact__c, gbcinmo__Client_Name__c, gbcinmo__Desired_Operation_Type__c 
            FROM gbcinmo__Property_Request__c 
            WHERE gbcinmo__Status__c = 'Active' 
              AND Id IN (SELECT gbcinmo__Property_Request__c FROM gbcinmo__Property_Match__c WHERE gbcinmo__Match_Status__c = 'New Suggestion') 
            WITH USER_MODE 
            ORDER BY CreatedDate DESC 
            LIMIT 15
        ];
    }

    /* ========================================================================= */
    /* --- LISTING LEAD ALERTS DESK (MARKET PROSPECTS) -------------------------- */
    /* ========================================================================= */

    /**
     * @description Tracks market acquisition leads whose configured follow-up agenda threshold is overdue.
     * @return List of delayed gbcinmo__Listing_Lead__c records.
     */
    @AuraEnabled(cacheable=true)
    public static List<gbcinmo__Listing_Lead__c> getOverdueLeads() {
        return [
            SELECT Id, Name, gbcinmo__Status__c, gbcinmo__Follow_Up_Date__c, gbcinmo__Lead_Source__c 
            FROM gbcinmo__Listing_Lead__c 
            WHERE gbcinmo__Status__c NOT IN ('Discarded', 'Converted') 
              AND gbcinmo__Follow_Up_Date__c < TODAY 
            WITH USER_MODE 
            ORDER BY gbcinmo__Follow_Up_Date__c ASC 
            LIMIT 15
        ];
    }

    /**
     * @description Monitors freshly captured leads or items with pending prospective tasks in scope.
     * @return List of available gbcinmo__Listing_Lead__c entries.
     */
    @AuraEnabled(cacheable=true)
    public static List<gbcinmo__Listing_Lead__c> getNewLeads() {
        return [
            SELECT Id, Name, gbcinmo__Status__c, gbcinmo__Follow_Up_Date__c, gbcinmo__Lead_Source__c 
            FROM gbcinmo__Listing_Lead__c 
            WHERE gbcinmo__Status__c NOT IN ('Discarded', 'Converted') 
              AND (gbcinmo__Follow_Up_Date__c >= TODAY OR gbcinmo__Follow_Up_Date__c = NULL) 
            WITH USER_MODE 
            ORDER BY CreatedDate DESC 
            LIMIT 15
        ];
    }
}