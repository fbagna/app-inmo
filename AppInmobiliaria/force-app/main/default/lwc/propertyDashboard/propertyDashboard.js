import { LightningElement, wire } from 'lwc';
import { NavigationMixin } from 'lightning/navigation';
import getListingsWithoutMatches from '@salesforce/apex/PropertyAlertsController.getListingsWithoutMatches';
import getListingsWithPendingMatches from '@salesforce/apex/PropertyAlertsController.getListingsWithPendingMatches';
import getRequestsWithoutMatches from '@salesforce/apex/PropertyAlertsController.getRequestsWithoutMatches';
import getRequestsWithPendingMatches from '@salesforce/apex/PropertyAlertsController.getRequestsWithPendingMatches';
import getOverdueLeads from '@salesforce/apex/PropertyAlertsController.getOverdueLeads';
import getNewLeads from '@salesforce/apex/PropertyAlertsController.getNewLeads';

const COLUMNS_LISTINGS = [
    { label: 'Listing', fieldName: 'recordUrl', type: 'url', typeAttributes: { label: { fieldName: 'Name' }, target: '_blank' } },
    { label: 'Stage', fieldName: 'StageName', type: 'text' },
    { type: 'button', typeAttributes: { label: 'View', name: 'view_record', variant: 'base' } }
];

const COLUMNS_REQUESTS = [
    { label: 'Request', fieldName: 'recordUrl', type: 'url', typeAttributes: { label: { fieldName: 'Name' }, target: '_blank' } },
    { label: 'Client', fieldName: 'flatClient', type: 'text' },
    { label: 'Operation', fieldName: 'flatOperation', type: 'text' },
    { type: 'button', typeAttributes: { label: 'View', name: 'view_record', variant: 'base' } }
];

const COLUMNS_LEADS = [
    { label: 'Lead', fieldName: 'recordUrl', type: 'url', typeAttributes: { label: { fieldName: 'Name' }, target: '_blank' } },
    { label: 'Status', fieldName: 'flatStatus', type: 'text' },
    { label: 'Source', fieldName: 'flatSource', type: 'text' },
    { label: 'Follow Up', fieldName: 'flatDate', type: 'date-local', typeAttributes: { month: '2-digit', day: '2-digit', year: 'numeric' } },
    { type: 'button', typeAttributes: { label: 'View', name: 'view_record', variant: 'base' } }
];

export default class PropertyDashboard extends NavigationMixin(LightningElement) {

    // --- QUICK ACTION NAVIGATION ---
    navNewProperty() { this.navigateToNewRecord('gbcinmo__Property__c'); }
    navNewUnit() { this.navigateToNewRecord('gbcinmo__Property_Unit__c'); }
    navNewListing() { this.navigateToNewRecord('Opportunity'); } 
    navNewRequest() { this.navigateToNewRecord('gbcinmo__Property_Request__c'); }
    navNewLead() { this.navigateToNewRecord('gbcinmo__Listing_Lead__c'); }

    navigateToNewRecord(objectApiName) {
        this[NavigationMixin.Navigate]({ type: 'standard__objectPage', attributes: { objectApiName: objectApiName, actionName: 'new' } });
    }

    // --- ALERT VARIABLES ---
    listingsNoMatches = []; countListingsNoMatches = 0;
    listingsPending = []; countListingsPending = 0;
    requestsNoMatches = []; countRequestsNoMatches = 0;
    requestsPending = []; countRequestsPending = 0;
    leadsOverdue = []; countLeadsOverdue = 0;
    leadsNew = []; countLeadsNew = 0;

    // --- SHARED TABLE VARIABLES ---
    currentTableData = [];
    activeTableType = '';
    currentColumns = COLUMNS_LISTINGS; 
    activeObject = ''; 
    tableTitle = '';
    showListingsTable = false;
    showRequestsTable = false;
    showLeadsTable = false;

    // --- WIRES ---
    @wire(getListingsWithoutMatches) wiredListingsNoMatches({ data }) { if(data) { this.listingsNoMatches = data.map(r => ({ ...r, recordUrl: `/lightning/r/Opportunity/${r.Id}/view` })); this.countListingsNoMatches = data.length; } }
    @wire(getListingsWithPendingMatches) wiredListingsPending({ data }) { if(data) { this.listingsPending = data.map(r => ({ ...r, recordUrl: `/lightning/r/Opportunity/${r.Id}/view` })); this.countListingsPending = data.length; } }
    @wire(getRequestsWithoutMatches) wiredRequestsNoMatches({ data }) { if(data) { this.requestsNoMatches = data.map(r => this.formatRequest(r)); this.countRequestsNoMatches = data.length; } }
    @wire(getRequestsWithPendingMatches) wiredRequestsPending({ data }) { if(data) { this.requestsPending = data.map(r => this.formatRequest(r)); this.countRequestsPending = data.length; } }
    @wire(getOverdueLeads) wiredLeadsOverdue({ data }) { if(data) { this.leadsOverdue = data.map(r => this.formatLead(r)); this.countLeadsOverdue = data.length; } }
    @wire(getNewLeads) wiredLeadsNew({ data }) { if(data) { this.leadsNew = data.map(r => this.formatLead(r)); this.countLeadsNew = data.length; } }

    // --- FORMATTERS ---
    formatRequest(record) {
        let clientName = record.gbcinmo__Client_Contact__r ? record.gbcinmo__Client_Contact__r.Name : (record.gbcinmo__Client_Name__c || '');
        return { ...record, recordUrl: `/lightning/r/gbcinmo__Property_Request__c/${record.Id}/view`, flatClient: clientName, flatOperation: record.gbcinmo__Desired_Operation_Type__c };
    }

    formatLead(record) {
        return {
            ...record,
            recordUrl: `/lightning/r/gbcinmo__Listing_Lead__c/${record.Id}/view`,
            flatStatus: record.gbcinmo__Status__c,
            flatSource: record.gbcinmo__Lead_Source__c,
            flatDate: record.gbcinmo__Follow_Up_Date__c
        };
    }

    // --- BUTTON ACTIONS ---
    toggleTable(data, type, columns, object, title) {
        if (this.activeTableType === type) {
            this.showListingsTable = false; this.showRequestsTable = false; this.showLeadsTable = false; this.activeTableType = ''; return;
        } 
        this.currentColumns = columns; this.currentTableData = data; this.activeTableType = type; this.activeObject = object; this.tableTitle = title;

        this.showListingsTable = type.startsWith('LIST_');
        this.showRequestsTable = type.startsWith('REQ_');
        this.showLeadsTable = type.startsWith('LEAD_');
    }

    toggleListingsNoMatches() { this.toggleTable(this.listingsNoMatches, 'LIST_NO_MATCHES', COLUMNS_LISTINGS, 'Opportunity', 'Listings with 0 matches'); }
    toggleListingsPending() { this.toggleTable(this.listingsPending, 'LIST_PENDING', COLUMNS_LISTINGS, 'Opportunity', 'Listings with pending matches'); }
    toggleRequestsNoMatches() { this.toggleTable(this.requestsNoMatches, 'REQ_NO_MATCHES', COLUMNS_REQUESTS, 'gbcinmo__Property_Request__c', 'Requests with 0 matches'); }
    toggleRequestsPending() { this.toggleTable(this.requestsPending, 'REQ_PENDING', COLUMNS_REQUESTS, 'gbcinmo__Property_Request__c', 'Requests with pending matches'); }
    toggleLeadsOverdue() { this.toggleTable(this.leadsOverdue, 'LEAD_OVERDUE', COLUMNS_LEADS, 'gbcinmo__Listing_Lead__c', 'Overdue Follow-ups'); }
    toggleLeadsNew() { this.toggleTable(this.leadsNew, 'LEAD_NEW', COLUMNS_LEADS, 'gbcinmo__Listing_Lead__c', 'New Leads to check'); }

    handleRowAction(event) {
        this[NavigationMixin.Navigate]({ type: 'standard__recordPage', attributes: { recordId: event.detail.row.Id, objectApiName: this.activeObject, actionName: 'view' } });
    }
}