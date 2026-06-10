import { LightningElement, wire, track } from 'lwc';
import { NavigationMixin } from 'lightning/navigation';
import NewPropertyModal from 'c/newPropertyCreator';

/* Alert Data Controllers Apex Wire Methods References */
import getListingsWithoutMatches from '@salesforce/apex/PropertyAlertsController.getListingsWithoutMatches';
import getListingsWithPendingMatches from '@salesforce/apex/PropertyAlertsController.getListingsWithPendingMatches';
import getRequestsWithoutMatches from '@salesforce/apex/PropertyAlertsController.getRequestsWithoutMatches';
import getRequestsWithPendingMatches from '@salesforce/apex/PropertyAlertsController.getRequestsWithPendingMatches';
import getOverdueLeads from '@salesforce/apex/PropertyAlertsController.getOverdueLeads';
import getNewLeads from '@salesforce/apex/PropertyAlertsController.getNewLeads';

/* Custom Workspace Related List and Inventory Apex Methods References From New Class */
import getRelatedUnits from '@salesforce/apex/PropertyDashboardController.getRelatedUnits';
import getRecentProperties from '@salesforce/apex/PropertyDashboardController.getRecentProperties';

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

/* Definition of columns for the child Units Related List table inside workspace screen */
const COLUMNS_UNITS = [
    { label: 'Unit / Code', fieldName: 'Name', type: 'text', initialWidth: 150 },
    { label: 'Floor', fieldName: 'gbcinmo__Floor__c', type: 'text', initialWidth: 100 },
    { label: 'Door', fieldName: 'gbcinmo__Door__c', type: 'text', initialWidth: 100 },
    { label: 'Square Meters (m²)', fieldName: 'gbcinmo__Square_Meters__c', type: 'number', initialWidth: 140 },
    { label: 'Occupancy Status', fieldName: 'gbcinmo__Occupancy_Status__c', type: 'text', initialWidth: 160 }
];

/* Definition of columns for the Main Properties Portfolio Inventory Tab list matching exact database names */
const COLUMNS_PROPERTY_INVENTORY = [
    { label: 'Building Name', fieldName: 'Name', type: 'text', initialWidth: 200 },
    { label: 'Street Address', fieldName: 'gbcinmo__Street__c', type: 'text', initialWidth: 240 },
    { label: 'City', fieldName: 'gbcinmo__City__c', type: 'text', initialWidth: 130 },
    { label: 'Province', fieldName: 'gbcinmo__State_Province__c', type: 'text', initialWidth: 130 },
    { type: 'button', typeAttributes: { label: 'Open Workspace', name: 'open_workspace', variant: 'brand' } }
];

export default class PropertyDashboard extends NavigationMixin(LightningElement) {

    @track selectedPropertyId = '';
    @track relatedUnitsData = [];
    @track propertiesInventoryData = [];
    
    unitColumns = COLUMNS_UNITS;
    propertyInventoryColumns = COLUMNS_PROPERTY_INVENTORY;

    // --- PROPERTY PORTFOLIO INVENTORY WIRE ---
    @wire(getRecentProperties)
    wiredProperties({ error, data }) {
        if (data) {
            this.propertiesInventoryData = data;
        } else if (error) {
            console.error('Error fetching recent properties portfolio inventory data lists:', error);
            this.propertiesInventoryData = [];
        }
    }

    // --- RELATED LISTS WIRE ENGINE ---
    @wire(getRelatedUnits, { propertyId: '$selectedPropertyId' })
    wiredUnits({ error, data }) {
        if (data) {
            this.relatedUnitsData = data;
        } else if (error) {
            console.error('Error loading related property units lists data:', error);
            this.relatedUnitsData = [];
        }
    }

    get hasUnits() {
        return this.relatedUnitsData && this.relatedUnitsData.length > 0;
    }

    handlePropertyInventoryAction(event) {
        const actionName = event.detail.action.name;
        const rowId = event.detail.row.Id;
        
        if (actionName === 'open_workspace') {
            this.selectedPropertyId = rowId; 
        }
    }

    async navNewProperty() { 
        const resultRecordId = await NewPropertyModal.open({
            size: 'medium'
        });
        
        if (resultRecordId) {
            this.selectedPropertyId = resultRecordId;
        }
    }

    handleBackToDashboard() {
        this.selectedPropertyId = ''; 
        this.relatedUnitsData = [];
    }

    navNewUnit() { this.navigateToNewRecord('gbcinmo__Property_Unit__c'); }
    navNewListing() { this.navigateToNewRecord('Opportunity'); } 
    navNewRequest() { this.navigateToNewRecord('gbcinmo__Property_Request__c'); }
    navNewLead() { this.navigateToNewRecord('gbcinmo__Listing_Lead__c'); }

    navigateToNewRecord(objectApiName) {
        this[NavigationMixin.Navigate]({ type: 'standard__objectPage', attributes: { objectApiName: objectApiName, actionName: 'new' } });
    }

    // --- ALERT VARIABLES ---
    @track listingsNoMatches = []; countListingsNoMatches = 0;
    @track listingsPending = []; countListingsPending = 0;
    @track requestsNoMatches = []; countRequestsNoMatches = 0;
    @track requestsPending = []; countRequestsPending = 0;
    @track leadsOverdue = []; countLeadsOverdue = 0;
    @track leadsNew = []; countLeadsNew = 0;

    // --- SHARED TABLE VARIABLES ---
    @track currentTableData = [];
    @track activeTableType = '';
    @track currentColumns = COLUMNS_LISTINGS; 
    @track activeObject = ''; 
    @track tableTitle = '';
    @track showListingsTable = false;
    @track showRequestsTable = false;
    @track showLeadsTable = false;

    // --- ALERT DATA WIRES ---
    @wire(getListingsWithoutMatches) wiredListingsNoMatches({ data }) { if(data) { this.listingsNoMatches = data.map(r => ({ ...r, recordUrl: `/lightning/r/Opportunity/${r.Id}/view` })); this.countListingsNoMatches = data.length; } }
    @wire(getListingsWithPendingMatches) wiredListingsPending({ data }) { if(data) { this.listingsPending = data.map(r => ({ ...r, recordUrl: `/lightning/r/Opportunity/${r.Id}/view` })); this.countListingsPending = data.length; } }
    @wire(getRequestsWithoutMatches) wiredRequestsNoMatches({ data }) { if(data) { this.requestsNoMatches = data.map(r => this.formatRequest(r)); this.countRequestsNoMatches = data.length; } }
    @wire(getRequestsWithPendingMatches) wiredRequestsPending({ data }) { if(data) { this.requestsPending = data.map(r => this.formatRequest(r)); this.countRequestsPending = data.length; } }
    @wire(getOverdueLeads) wiredLeadsOverdue({ data }) { if(data) { this.leadsOverdue = data.map(r => this.formatLead(r)); this.countLeadsOverdue = data.length; } }
    @wire(getNewLeads) wiredLeadsNew({ data }) { if(data) { this.leadsNew = data.map(r => this.formatLead(r)); this.countLeadsNew = data.length; } }

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