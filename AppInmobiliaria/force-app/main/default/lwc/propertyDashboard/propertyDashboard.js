import { LightningElement, wire, track } from 'lwc';
import { NavigationMixin } from 'lightning/navigation';
import { refreshApex } from '@salesforce/apex'; 
import { ShowToastEvent } from 'lightning/platformShowToastEvent';
import { createRecord, getRecord } from 'lightning/uiRecordApi'; 
import NewPropertyModal from 'c/newPropertyCreator';

/* ========================================================================= */
/* --- APPEXCHANGE ABSOLUTE STRING ROUTING FIELDS MATRIX (BYPASSES LWC1504)  */
/* ========================================================================= */
const WORKSPACE_FIELDS = [
    'gbcinmo__Property__c.gbcinmo__Country__c',
    'gbcinmo__Property__c.gbcinmo__State_Province__c',
    'gbcinmo__Property__c.gbcinmo__City__c',
    'gbcinmo__Property__c.gbcinmo__Neighborhood__c'
];

/* ========================================================================= */
/* --- APPEXCHANGE COMPLIANT CUSTOM LABELS IMPORTS (ZERO HARDCODE) -------- */
/* ========================================================================= */
import labelWorkspaceTitle from '@salesforce/label/c.Workspace_Title';
import labelBtnBackToDashboard from '@salesforce/label/c.Btn_Back_To_Dashboard';
import labelSectionDossierDetails from '@salesforce/label/c.Section_Dossier_Details';
import labelSectionPropInfo from '@salesforce/label/c.Section_Prop_Info';
import labelSectionLocationInfo from '@salesforce/label/c.Section_Location_Info';
import labelSectionFeatures from '@salesforce/label/c.Section_Features';
import labelSectionComments from '@salesforce/label/c.Section_Comments';
import labelSectionSystemInfo from '@salesforce/label/c.Section_System_Info';
import labelFieldPropName from '@salesforce/label/c.Field_Prop_Name';
import labelFieldDoorman from '@salesforce/label/c.Field_Doorman';
import labelFieldHasElevator from '@salesforce/label/c.Field_Has_Elevator';
import labelFieldAddress from '@salesforce/label/c.Field_Address';
import labelFieldZipCode from '@salesforce/label/c.Field_Zip_Code';
import labelFieldCountry from '@salesforce/label/c.Field_Country';
import labelFieldStateProvince from '@salesforce/label/c.Field_State_Province';
import labelFieldCity from '@salesforce/label/c.Field_City';
import labelFieldNeighborhood from '@salesforce/label/c.Field_Neighborhood';
import labelFieldCreatedBy from '@salesforce/label/c.Field_Created_By';
import labelFieldPropRef from '@salesforce/label/c.Field_Prop_Ref';
import labelFieldModifiedBy from '@salesforce/label/c.Field_Modified_By';
import labelFieldOwner from '@salesforce/label/c.Field_Owner';
import labelCatalogTitle from '@salesforce/label/c.Catalog_Title';
import labelEmptyUnitsTitle from '@salesforce/label/c.Empty_Units_Title';
import labelEmptyUnitsDesc from '@salesforce/label/c.Empty_Units_Desc';
import labelTabOperations from '@salesforce/label/c.Tab_Operations';
import labelTabPortfolio from '@salesforce/label/c.Tab_Portfolio';
import labelTabMap from '@salesforce/label/c.Tab_Map';
import labelBtnNewProperty from '@salesforce/label/c.Btn_New_Property';
import labelBtnNewUnit from '@salesforce/label/c.Btn_New_Unit';
import labelBtnNewListing from '@salesforce/label/c.Btn_New_Listing';
import labelBtnNewRequest from '@salesforce/label/c.Btn_New_Request';
import labelBtnNewLead from '@salesforce/label/c.Btn_New_Lead';
import labelAlertsHeader from '@salesforce/label/c.Alerts_Header';
import labelDeskListings from '@salesforce/label/c.Desk_Listings';
import labelDeskRequests from '@salesforce/label/c.Desk_Requests';
import labelDeskLeads from '@salesforce/label/c.Desk_Leads';
import labelAlertNoMatches from '@salesforce/label/c.Alert_No_Matches';
import labelAlertPendingMatches from '@salesforce/label/c.Alert_Pending_Matches';
import labelAlertOverdue from '@salesforce/label/c.Alert_Overdue';
import labelAlertNewLeads from '@salesforce/label/c.Alert_New_Leads';
import labelMsgShowing from '@salesforce/label/c.Msg_Showing';
import labelColView from '@salesforce/label/c.Col_View';
import labelColOpenWorkspace from '@salesforce/label/c.Col_Open_Workspace';
import labelPortfolioSubtitle from '@salesforce/label/c.Portfolio_Subtitle';

import labelBtnEdit from '@salesforce/label/c.Btn_Edit';
import labelBtnCancel from '@salesforce/label/c.PropertyBtnCancel';
import labelBtnSave from '@salesforce/label/c.PropertyBtnSave';
import labelToastSuccessTitle from '@salesforce/label/c.PropertyToastSuccessTitle';
import labelToastUpdateSuccessMsg from '@salesforce/label/c.PropertyToastUpdateSuccessMsg';
import labelToastAttention from '@salesforce/label/c.PropertyToastAttention';
import labelToastAttentionMsg from '@salesforce/label/c.PropertyToastAttentionMsg';
import labelToastBackgroundError from '@salesforce/label/c.PropertyToastBackgroundError';
import labelFirstNameLabel from '@salesforce/label/c.PropertyFirstNameLabel';
import labelLastNameLabel from '@salesforce/label/c.PropertyLastNameLabel';
import labelCancelLink from '@salesforce/label/c.PropertyCancelLink';
import labelQuickAddLink from '@salesforce/label/c.PropertyQuickAddLink';
import labelQuickAddHeader from '@salesforce/label/c.PropertyQuickAddHeader';
import labelToggleLocationModify from '@salesforce/label/c.Workspace_Toggle_Location_Modify';

/* ========================================================================= */
/* --- SECURE APEX METHODS REFERENCES (WITH USER_MODE BOUNDARIES) --------- */
/* ========================================================================= */
import getRecentProperties from '@salesforce/apex/PropertyDashboardController.getRecentProperties';
import getRelatedUnits from '@salesforce/apex/PropertyDashboardController.getRelatedUnits';
import getListingsWithoutMatches from '@salesforce/apex/PropertyAlertsController.getListingsWithoutMatches';
import getListingsWithPendingMatches from '@salesforce/apex/PropertyAlertsController.getListingsWithPendingMatches';
import getRequestsWithoutMatches from '@salesforce/apex/PropertyAlertsController.getRequestsWithoutMatches';
import getRequestsWithPendingMatches from '@salesforce/apex/PropertyAlertsController.getRequestsWithPendingMatches';
import getOverdueLeads from '@salesforce/apex/PropertyAlertsController.getOverdueLeads';
import getNewLeads from '@salesforce/apex/PropertyAlertsController.getNewLeads';

export default class PropertyDashboard extends NavigationMixin(LightningElement) {

    @track selectedPropertyId = '';
    @track activeMenuOption = 'properties_opt'; 
    @track activeTabName = 'operations_tab'; 
    @track propertiesInventoryData = [];
    @track relatedUnitsData = [];
    @track sortedByField = 'Name';
    @track sortedDirection = 'asc';
    
    @track isEditMode = false;
    @track isWorkspaceFieldsLoaded = false;
    @track isQuickAddDoormanWorkspace = false;
    @track showLocationPicker = false;
    
    // Master structure keeping database baseline memory states safely stored
    @track rawLocationRecord = { country: '', state: '', city: '', neighborhood: '' };

    // Individual reactive elements mapped directly to html tags parameters
    @track workspaceCountry = '';
    @track workspaceState = '';
    @track workspaceCity = '';
    @track workspaceNeighborhood = '';
    
    wiredPropertiesResult;
    wiredWorkspaceRecordResult; 

    labels = {
        workspaceTitle: labelWorkspaceTitle,
        backToDashboard: labelBtnBackToDashboard,
        dossierDetails: labelSectionDossierDetails,
        propInfo: labelSectionPropInfo,
        locationInfo: labelSectionLocationInfo,
        featuresTitle: labelSectionFeatures,
        comments: labelSectionComments,
        systemInfo: labelSectionSystemInfo,
        propertyName: labelFieldPropName,
        doorman: labelFieldDoorman,
        hasElevator: labelFieldHasElevator,
        address: labelFieldAddress,
        zipCode: labelFieldZipCode,
        country: labelFieldCountry,
        stateProvince: labelFieldStateProvince,
        city: labelFieldCity,
        neighborhood: labelFieldNeighborhood,
        createdBy: labelFieldCreatedBy,
        propertyRef: labelFieldPropRef,
        modifiedBy: labelFieldModifiedBy,
        owner: labelFieldOwner,
        catalogTitle: labelCatalogTitle,
        emptyUnitsTitle: labelEmptyUnitsTitle,
        emptyUnitsDesc: labelEmptyUnitsDesc,
        tabOperations: labelTabOperations,
        tabPortfolio: labelTabPortfolio,
        tabMap: labelTabMap,
        newProperty: labelBtnNewProperty,
        newUnit: labelBtnNewUnit,
        newListing: labelBtnNewListing,
        newRequest: labelBtnNewRequest,
        newLead: labelBtnNewLead,
        alertsHeader: labelAlertsHeader,
        deskListings: labelDeskListings,
        deskRequests: labelDeskRequests,
        deskLeads: labelDeskLeads,
        noMatches: labelAlertNoMatches,
        pendingMatches: labelAlertPendingMatches,
        overdueFollowups: labelAlertOverdue,
        newLeadsCheck: labelAlertNewLeads,
        showing: labelMsgShowing,
        portfolioSubtitle: labelPortfolioSubtitle,
        btnEdit: labelBtnEdit,
        btnCancel: labelBtnCancel,
        btnSave: labelBtnSave,
        successTitle: labelToastSuccessTitle,
        updateSuccessMsg: labelToastUpdateSuccessMsg,
        attentionTitle: labelToastAttention,
        attentionMsg: labelToastAttentionMsg,
        backgroundError: labelToastBackgroundError,
        firstNameLabel: labelFirstNameLabel,
        lastNameLabel: labelLastNameLabel,
        cancelLink: labelCancelLink,
        quickAddLink: labelQuickAddLink,
        quickAddHeader: labelQuickAddHeader,
        toggleLocationModify: labelToggleLocationModify
    };

    get unitColumns() {
        return [
            { label: 'Unit / Code', fieldName: 'Name', type: 'text', initialWidth: 150 },
            { label: 'Floor', fieldName: 'gbcinmo__Floor__c', type: 'text', initialWidth: 100 },
            { label: 'Door', fieldName: 'gbcinmo__Door__c', type: 'text', initialWidth: 100 },
            { label: 'Square Meters (m²)', fieldName: 'gbcinmo__Square_Meters__c', type: 'number', initialWidth: 140 },
            { label: 'Occupancy Status', fieldName: 'gbcinmo__Occupancy_Status__c', type: 'text', initialWidth: 160 }
        ];
    }

    get propertyInventoryColumns() {
        return [
            { label: this.labels.propertyName, fieldName: 'Name', type: 'text', initialWidth: 180, sortable: true },
            { label: this.labels.propertyRef, fieldName: 'gbcinmo__Property_Reference__c', type: 'text', initialWidth: 150, sortable: true },
            { label: this.labels.address, fieldName: 'gbcinmo__Street__c', type: 'text', initialWidth: 220, sortable: true },
            { label: this.labels.stateProvince, fieldName: 'gbcinmo__State_Province__c', type: 'text', initialWidth: 140, sortable: true },
            { label: this.labels.city, fieldName: 'gbcinmo__City__c', type: 'text', initialWidth: 130, sortable: true },
            { label: this.labels.neighborhood, fieldName: 'gbcinmo__Neighborhood__c', type: 'text', initialWidth: 140, sortable: true },
            { type: 'button', typeAttributes: { label: labelColOpenWorkspace, name: 'open_workspace', variant: 'brand' }, initialWidth: 160 }
        ];
    }

    get columnsListings() {
        return [
            { label: 'Listing', fieldName: 'recordUrl', type: 'url', typeAttributes: { label: { fieldName: 'Name' }, target: '_blank' } },
            { label: 'Stage', fieldName: 'StageName', type: 'text' },
            { type: 'button', typeAttributes: { label: labelColView, name: 'view_record', variant: 'base' } }
        ];
    }

    get columnsRequests() {
        return [
            { label: 'Request', fieldName: 'recordUrl', type: 'url', typeAttributes: { label: { fieldName: 'Name' }, target: '_blank' } },
            { label: 'Client', fieldName: 'flatClient', type: 'text' },
            { label: 'Operation', fieldName: 'flatOperation', type: 'text' },
            { type: 'button', typeAttributes: { label: labelColView, name: 'view_record', variant: 'base' } }
        ];
    }

    get columnsLeads() {
        return [
            { label: 'Lead', fieldName: 'recordUrl', type: 'url', typeAttributes: { label: { fieldName: 'Name' }, target: '_blank' } },
            { label: 'Status', fieldName: 'flatStatus', type: 'text' },
            { label: 'Source', fieldName: 'flatSource', type: 'text' },
            { label: 'Follow Up', fieldName: 'flatDate', type: 'date-local', typeAttributes: { month: '2-digit', day: '2-digit', year: 'numeric' } },
            { type: 'button', typeAttributes: { label: labelColView, name: 'view_record', variant: 'base' } }
        ];
    }

    get isViewProperties() { return this.activeMenuOption === 'properties_opt'; }

    handleMenuSelect(event) {
        this.activeMenuOption = event.detail.name;
    }

    handleTabActivated(event) {
        this.activeTabName = event.target.value;
    }

    @wire(getRecentProperties)
    wiredProperties(result) {
        this.wiredPropertiesResult = result; 
        if (result.data) { this.propertiesInventoryData = result.data; } 
        else if (result.error) { this.propertiesInventoryData = []; }
    }

    @wire(getRelatedUnits, { propertyId: '$selectedPropertyId' })
    wiredUnits({ error, data }) {
        if (data) { this.relatedUnitsData = data; } 
        else if (error) { this.relatedUnitsData = []; }
    }

    get hasUnits() {
        return this.relatedUnitsData && this.relatedUnitsData.length > 0;
    }

    @wire(getRecord, { recordId: '$selectedPropertyId', fields: WORKSPACE_FIELDS })
    wiredWorkspaceRecord(result) {
        this.wiredWorkspaceRecordResult = result;
        if (result.data) {
            const fields = result.data.fields;
            this.rawLocationRecord = {
                country: fields.gbcinmo__Country__c?.value || '',
                state: fields.gbcinmo__State_Province__c?.value || '',
                city: fields.gbcinmo__City__c?.value || '',
                neighborhood: fields.gbcinmo__Neighborhood__c?.value || ''
            };
        }
    }

    handlePropertiesSort(event) {
        this.sortedByField = event.detail.fieldName;
        this.sortedDirection = event.detail.sortDirection;
        this.executePropertiesSort(this.sortedByField, this.sortedDirection);
    }

    executePropertiesSort(fieldName, direction) {
        let clonedData = JSON.parse(JSON.stringify(this.propertiesInventoryData));
        let keySelector = (record) => record[fieldName];
        let reverseMultiplier = direction === 'asc' ? 1 : -1;

        clonedData.sort((alpha, beta) => {
            let valAlpha = keySelector(alpha) ? keySelector(alpha).toString().toLowerCase() : '';
            let valBeta = keySelector(beta) ? keySelector(beta).toString().toLowerCase() : '';
            return reverseMultiplier * ((valAlpha > valBeta) - (valBeta > valAlpha));
        });
        this.propertiesInventoryData = clonedData;
    }

    handlePropertyInventoryAction(event) {
        if (event.detail.action.name === 'open_workspace') {
            this.selectedPropertyId = event.detail.row.Id; 
            this.isEditMode = false;
            this.isWorkspaceFieldsLoaded = false;
        }
    }

    async navNewProperty() { 
        const resultRecordId = await NewPropertyModal.open({ size: 'medium' });
        if (resultRecordId) { 
            await refreshApex(this.wiredPropertiesResult);
            this.selectedPropertyId = resultRecordId; 
            this.isEditMode = false;
            this.isWorkspaceFieldsLoaded = false;
        }
    }

    handleBackToDashboard() {
        this.selectedPropertyId = ''; 
        this.relatedUnitsData = [];
        this.isEditMode = false;
        this.isWorkspaceFieldsLoaded = false;
    }

    handleEnableEdit() {
        this.isQuickAddDoormanWorkspace = false;
        this.showLocationPicker = false; 
        this.isEditMode = true;
    }

    handleCancelEdit() {
        this.isEditMode = false;
    }

    /**
     * @description Dynamic checkbox toggle listener. Forces parent string variables synchronization
     * immediately to feed incoming properties maps right as the fresh child instance mounts.
     */
    handleToggleLocationPicker(event) {
        this.showLocationPicker = event.target.checked;
        if (this.showLocationPicker) {
            this.isWorkspaceFieldsLoaded = false;
            
            // Sync values to tracking state holders sychronously
            this.workspaceCountry = this.rawLocationRecord.country;
            this.workspaceState = this.rawLocationRecord.state;
            this.workspaceCity = this.rawLocationRecord.city;
            this.workspaceNeighborhood = this.rawLocationRecord.neighborhood;
            
            this.isWorkspaceFieldsLoaded = true;
        }
    }

    toggleDoormanModeWorkspace(event) {
        event.preventDefault();
        this.isQuickAddDoormanWorkspace = !this.isQuickAddDoormanWorkspace;
    }

    handleLocationChangeWorkspace(event) {
        this.workspaceCountry = event.detail.country;
        this.workspaceState = event.detail.state;
        this.workspaceCity = event.detail.city;
        this.workspaceNeighborhood = event.detail.neighborhood;
    }

    async handleUpdateSubmit(event) {
        event.preventDefault();
        const fields = event.detail.fields;

        if (this.showLocationPicker) {
            const locationCmp = this.template.querySelector('.workspace-location-selector');
            const isLocationValid = locationCmp ? locationCmp.validate() : true;

            if (!isLocationValid) {
                this.dispatchEvent(new ShowToastEvent({ title: this.labels.attentionTitle, message: this.labels.attentionMsg, variant: 'warning' }));
                return;
            }
        }

        if (this.isQuickAddDoormanWorkspace) {
            const lastNameCmp = this.template.querySelector('[data-id="doormanLastWorkspace"]');
            if (lastNameCmp) {
                lastNameCmp.reportValidity();
                if (!lastNameCmp.checkValidity()) return;
            }
        }

        try {
            if (this.isQuickAddDoormanWorkspace) {
                const firstName = this.template.querySelector('[data-id="doormanFirstWorkspace"]').value;
                const lastName = this.template.querySelector('[data-id="doormanLastWorkspace"]').value;

                const contactFields = { 'FirstName': firstName, 'LastName': lastName };
                const contactRecordInput = { apiName: 'Contact', fields: contactFields };
                
                const newContact = await createRecord(contactRecordInput);
                fields['gbcinmo__Doorman__c'] = newContact.id;
            }

            if (this.showLocationPicker) {
                fields['gbcinmo__Country__c'] = this.workspaceCountry;
                fields['gbcinmo__State_Province__c'] = this.workspaceState;
                fields['gbcinmo__City__c'] = this.workspaceCity;
                fields['gbcinmo__Neighborhood__c'] = this.workspaceNeighborhood;
            } else {
                fields['gbcinmo__Country__c'] = this.rawLocationRecord.country;
                fields['gbcinmo__State_Province__c'] = this.rawLocationRecord.state;
                fields['gbcinmo__City__c'] = this.rawLocationRecord.city;
                fields['gbcinmo__Neighborhood__c'] = this.rawLocationRecord.neighborhood;
            }

            this.template.querySelector('.workspace-edit-form').submit(fields);
        } catch (error) {
            console.error('Workspace Update Exception Error:', error);
            this.dispatchEvent(new ShowToastEvent({ title: 'Error', message: this.labels.backgroundError, variant: 'error' }));
        }
    }

    async handleUpdateSuccess() {
        this.dispatchEvent(new ShowToastEvent({ title: this.labels.successTitle, message: this.labels.updateSuccessMsg, variant: 'success' }));
        this.isEditMode = false;
        await refreshApex(this.wiredWorkspaceRecordResult); 
        await refreshApex(this.wiredPropertiesResult);
    }

    navNewUnit() { this.navigateToNewRecord('gbcinmo__Property_Unit__c'); }
    navNewListing() { this.navigateToNewRecord('Opportunity'); } 
    navNewRequest() { this.navigateToNewRecord('gbcinmo__Property_Request__c'); }
    navNewLead() { this.navigateToNewRecord('gbcinmo__Listing_Lead__c'); }

    navigateToNewRecord(objectApiName) {
        this[NavigationMixin.Navigate]({ type: 'standard__objectPage', attributes: { objectApiName: objectApiName, actionName: 'new' } });
    }

    @track listingsNoMatches = []; countListingsNoMatches = 0;
    @track listingsPending = []; countListingsPending = 0;
    @track requestsNoMatches = []; countRequestsNoMatches = 0;
    @track requestsPending = []; countRequestsPending = 0;
    @track leadsOverdue = []; countLeadsOverdue = 0;
    @track leadsNew = []; countLeadsNew = 0;

    @track currentTableData = [];
    @track activeTableType = '';
    @track currentColumns = []; 
    @track activeObject = ''; 
    @track tableTitle = '';
    @track showListingsTable = false;
    @track showRequestsTable = false;
    @track showLeadsTable = false;

    @wire(getListingsWithoutMatches) wiredListingsNoMatches({ data }) { if(data) { this.listingsNoMatches = data.map(r => ({ ...r, recordUrl: `/lightning/r/Opportunity/${r.Id}/view` })); this.countListingsNoMatches = data.length; } }
    @wire(getListingsWithPendingMatches) wiredListingsPending({ data }) { if(data) { this.listingsPending = data.map(r => ({ ...r, recordUrl: `/lightning/r/Opportunity/${r.Id}/view` })); this.countListingsPending = data.length; } }
    @wire(getRequestsWithoutMatches) wiredRequestsNoMatches({ data }) { if(data) { this.requestsNoMatches = data.map(r => this.formatRequest(r)); this.countRequestsNoMatches = data.length; } }
    @wire(getRequestsWithPendingMatches) wiredWorkspaceRecordResult({ data }) { if(data) { this.requestsPending = data.map(r => this.formatRequest(r)); this.countRequestsPending = data.length; } }
    @wire(getOverdueLeads) wiredLeadsOverdue({ data }) { if(data) { this.leadsOverdue = data.map(r => this.formatLead(r)); this.countLeadsOverdue = data.length; } }
    @wire(getNewLeads) wiredLeadsNew({ data }) { if(data) { this.leadsNew = data.map(r => this.formatLead(r)); this.countLeadsNew = data.length; } }

    formatRequest(record) {
        let clientName = record.gbcinmo__Client_Contact__r ? record.gbcinmo__Client_Contact__r.Name : (record.gbcinmo__Client_Name__c || '');
        return { ...record, recordUrl: `/lightning/r/gbcinmo__Property_Request__c/${record.Id}/view`, flatClient: clientName, flatOperation: record.gbcinmo__Desired_Operation_Type__c };
    }

    formatLead(record) {
        return { ...record, recordUrl: `/lightning/r/gbcinmo__Listing_Lead__c/${record.Id}/view`, flatStatus: record.gbcinmo__Status__c, flatSource: record.gbcinmo__Lead_Source__c, flatDate: record.gbcinmo__Follow_Up_Date__c };
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

    toggleListingsNoMatches() { this.toggleTable(this.listingsNoMatches, 'LIST_NO_MATCHES', this.columnsListings, 'Opportunity', `${this.labels.deskListings} ${this.labels.noMatches}`); }
    toggleListingsPending() { this.toggleTable(this.listingsPending, 'LIST_PENDING', this.columnsListings, 'Opportunity', `${this.labels.deskListings} ${this.labels.pendingMatches}`); }
    toggleRequestsNoMatches() { this.toggleTable(this.requestsNoMatches, 'REQ_NO_MATCHES', this.columnsRequests, 'gbcinmo__Property_Request__c', `${this.labels.deskRequests} ${this.labels.noMatches}`); }
    toggleRequestsPending() { this.toggleTable(this.requestsPending, 'REQ_PENDING', this.columnsRequests, 'gbcinmo__Property_Request__c', `${this.labels.deskRequests} ${this.labels.pendingMatches}`); }
    toggleLeadsOverdue() { this.toggleTable(this.leadsOverdue, 'LEAD_OVERDUE', this.columnsLeads, 'gbcinmo__Listing_Lead__c', this.labels.overdueFollowups); }
    toggleLeadsNew() { this.toggleTable(this.leadsNew, 'LEAD_NEW', this.columnsLeads, 'gbcinmo__Listing_Lead__c', this.labels.newLeadsCheck); }

    handleRowAction(event) {
        this[NavigationMixin.Navigate]({ type: 'standard__recordPage', attributes: { recordId: event.detail.row.Id, objectApiName: this.activeObject, actionName: 'view' } });
    }
}