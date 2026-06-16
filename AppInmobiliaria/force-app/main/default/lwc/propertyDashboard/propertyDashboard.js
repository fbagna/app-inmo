import { LightningElement, wire, track } from 'lwc';
import { NavigationMixin } from 'lightning/navigation';
import { refreshApex } from '@salesforce/apex'; 
import { ShowToastEvent } from 'lightning/platformShowToastEvent';
import { createRecord, getRecord, deleteRecord } from 'lightning/uiRecordApi'; 
import LightningConfirm from 'lightning/confirm'; 
import NewPropertyModal from 'c/newPropertyCreator';
import NewUnitModal from 'c/newUnitCreator'; 

/* ========================================================================= */
/* --- SECURE APEX METHODS REFERENCES (WITH USER_MODE BOUNDARIES) --------- */
/* ========================================================================= */
import getRecentProperties from '@salesforce/apex/PropertyDashboardController.getRecentProperties';
import getRelatedUnits from '@salesforce/apex/PropertyDashboardController.getRelatedUnits';
import getAllPropertyUnits from '@salesforce/apex/PropertyDashboardController.getAllPropertyUnits'; 
import getUnitOpportunities from '@salesforce/apex/PropertyDashboardController.getUnitOpportunities';
import getUnitListingLeads from '@salesforce/apex/PropertyDashboardController.getUnitListingLeads';
import getListingsWithoutMatches from '@salesforce/apex/PropertyAlertsController.getListingsWithoutMatches';
import getListingsWithPendingMatches from '@salesforce/apex/PropertyAlertsController.getListingsWithPendingMatches';
import getRequestsWithoutMatches from '@salesforce/apex/PropertyAlertsController.getRequestsWithoutMatches';
import getRequestsWithPendingMatches from '@salesforce/apex/PropertyAlertsController.getRequestsWithPendingMatches';
import getOverdueLeads from '@salesforce/apex/PropertyAlertsController.getOverdueLeads';
import getNewLeads from '@salesforce/apex/PropertyAlertsController.getNewLeads';

/* ========================================================================= */
/* --- APPEXCHANGE ABSOLUTE STRING ROUTING FIELDS MATRIX (BYPASSES LWC1504)  */
/* ========================================================================= */
const WORKSPACE_FIELDS = [
    'gbcinmo__Property__c.gbcinmo__Country__c',
    'gbcinmo__Property__c.gbcinmo__State_Province__c',
    'gbcinmo__Property__c.gbcinmo__City__c',
    'gbcinmo__Property__c.gbcinmo__Neighborhood__c'
];

const UNIT_FIELDS_EXVENT = [
    'gbcinmo__Property_Unit__c.gbcinmo__Property__c',
    'gbcinmo__Property_Unit__c.gbcinmo__Property__r.Name'
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
import tabOperations from '@salesforce/label/c.Tab_Operations';
import tabPortfolio from '@salesforce/label/c.Tab_Portfolio';
import tabMap from '@salesforce/label/c.Tab_Map';
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

import labelBtnDeleteUnit from '@salesforce/label/c.Btn_Delete_Unit';
import labelDeleteConfirmTitle from '@salesforce/label/c.Delete_Confirm_Title';
import labelDeleteConfirmMessage from '@salesforce/label/c.Delete_Confirm_Message';
import labelDeleteSuccessMessage from '@salesforce/label/c.Delete_Success_Message';
import labelDeleteErrorMessage from '@salesforce/label/c.Delete_Error_Message';

import labelBtnDeleteProperty from '@salesforce/label/c.Btn_Delete_Property';
import labelPropertyDeleteConfirmTitle from '@salesforce/label/c.Property_Delete_Confirm_Title';
import labelPropertyDeleteConfirmMessage from '@salesforce/label/c.Property_Delete_Confirm_Message';
import labelPropertyDeleteSuccessMessage from '@salesforce/label/c.Property_Delete_Success_Message';
import labelPropertyDeleteErrorMessage from '@salesforce/label/c.Property_Delete_Error_Message';

import labelTabRelatedWorkspace from '@salesforce/label/c.Tab_Related_Workspace';
import labelTabPhotoGalleryWorkspace from '@salesforce/label/c.Tab_Photo_Gallery_Workspace';
import labelTabMapWorkspace from '@salesforce/label/c.Tab_Map_Workspace';
import labelHeaderWorkspaceOpportunities from '@salesforce/label/c.Header_Workspace_Opportunities';
import labelHeaderWorkspaceLeads from '@salesforce/label/c.Header_Workspace_Leads';

export default class PropertyDashboard extends NavigationMixin(LightningElement) {

    @track selectedPropertyId = '';
    @track selectedUnitId = ''; 
    @track parentPropertyId = '';
    @track parentPropertyName = '';
    
    @track showFlowModal = false;
    @track activeMenuOption = 'properties_opt'; 
    @track activeTabName = 'operations_tab'; 
    @track propertiesInventoryData = [];
    @track allUnitsPortfolioData = []; 
    
    @track relatedUnitsData = [];
    @track processedRelatedUnits = [];
    @track relatedSortedBy = 'Name';
    @track relatedSortedDirection = 'asc';

    @track unitOpportunitiesData = [];
    @track unitListingLeadsData = [];
    @track countUnitOpportunities = 0;
    @track countUnitListingLeads = 0;

    @track opportunitiesSortedBy = 'Name';
    @track opportunitiesSortedDirection = 'asc';
    @track leadsSortedBy = 'Name';
    @track leadsSortedDirection = 'asc';

    @track sortedByField = 'Name';
    @track sortedDirection = 'asc';
    
    @track isEditMode = false;
    @track isUnitEditMode = false; 
    @track isQuickAddOwnerWorkspace = false;
    @track isWorkspaceFieldsLoaded = false;
    @track isQuickAddDoormanWorkspace = false;
    @track showLocationPicker = false;
    
    @track rawLocationRecord = { country: '', state: '', city: '', neighborhood: '' };

    @track workspaceCountry = '';
    @track workspaceState = '';
    @track workspaceCity = '';
    @track workspaceNeighborhood = '';
    
    wiredPropertiesResult;
    wiredUnitsPortfolioResult; 
    wiredWorkspaceRecordResult; 
    wiredRelatedUnitsResult;
    wiredUnitOpportunitiesResult;
    wiredUnitListingLeadsResult;

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
        tabOperations: tabOperations,
        tabPortfolio: tabPortfolio,
        tabMap: tabMap,
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
        toggleLocationModify: labelToggleLocationModify,
        btnDeleteUnit: labelBtnDeleteUnit,
        deleteConfirmTitle: labelDeleteConfirmTitle,
        deleteConfirmMessage: labelDeleteConfirmMessage,
        deleteSuccessMessage: labelDeleteSuccessMessage,
        deleteErrorMessage: labelDeleteErrorMessage,
        btnDeleteProperty: labelBtnDeleteProperty,
        propertyDeleteConfirmTitle: labelPropertyDeleteConfirmTitle,
        propertyDeleteConfirmMessage: labelPropertyDeleteConfirmMessage,
        propertyDeleteSuccessMessage: labelPropertyDeleteSuccessMessage,
        propertyDeleteErrorMessage: labelPropertyDeleteErrorMessage,
        tabRelatedWorkspace: labelTabRelatedWorkspace,
        tabPhotoGalleryWorkspace: labelTabPhotoGalleryWorkspace,
        tabMapWorkspace: labelTabMapWorkspace,
        headerWorkspaceOpportunities: labelHeaderWorkspaceOpportunities,
        headerWorkspaceLeads: labelHeaderWorkspaceLeads
    };

    get unitColumns() {
        return [
            { 
                label: 'Unit Name', 
                fieldName: 'Name',
                type: 'button', 
                sortable: true, 
                initialWidth: 170,
                typeAttributes: { 
                    label: { fieldName: 'Name' }, 
                    name: 'open_unit_workspace', 
                    variant: 'base' 
                } 
            },
            { label: 'Thumbnail', fieldName: 'gbcinmo__Thumbnail__c', type: 'richText', sortable: false, initialWidth: 110 },
            { label: 'Reference', fieldName: 'gbcinmo__Unit_Reference__c', type: 'text', sortable: true, initialWidth: 130 },
            { label: 'Property Type', fieldName: 'gbcinmo__Property_Type__c', type: 'text', sortable: true, initialWidth: 140 },
            { label: 'State', fieldName: 'gbcinmo__State_Province__c', type: 'text', sortable: true, initialWidth: 110 },
            { label: 'City', fieldName: 'parentCity', type: 'text', sortable: true, initialWidth: 110 },
            { label: 'Neighborhood', fieldName: 'parentNeighborhood', type: 'text', sortable: true, initialWidth: 130 }
        ];
    }

    get globalUnitsColumns() {
        return [
            { 
                label: 'Unit Name', 
                fieldName: 'Name',
                type: 'button', 
                sortable: true, 
                initialWidth: 170,
                typeAttributes: { 
                    label: { fieldName: 'Name' }, 
                    name: 'open_unit_global', 
                    variant: 'base' 
                } 
            },
            { label: 'Thumbnail', fieldName: 'gbcinmo__Thumbnail__c', type: 'richText', sortable: false, initialWidth: 110 },
            { label: 'Reference', fieldName: 'gbcinmo__Unit_Reference__c', type: 'text', sortable: true, initialWidth: 130 },
            { 
                label: 'Property', 
                fieldName: 'propertyUrl', 
                type: 'url', 
                sortable: true, 
                typeAttributes: { label: { fieldName: 'parentBuildingName' }, target: '_self' },
                initialWidth: 160 
            },
            { label: 'Property Type', fieldName: 'gbcinmo__Property_Type__c', type: 'text', sortable: true, initialWidth: 140 },
            { label: 'State', fieldName: 'gbcinmo__State_Province__c', type: 'text', sortable: true, initialWidth: 110 },
            { label: 'City', fieldName: 'parentCity', type: 'text', sortable: true, initialWidth: 110 },
            { label: 'Neighborhood', fieldName: 'parentNeighborhood', type: 'text', sortable: true, initialWidth: 130 }
        ];
    }

    get propertyInventoryColumns() {
        return [
            { 
                label: this.labels.propertyName, 
                fieldName: 'Name', 
                type: 'button', 
                sortable: true, 
                initialWidth: 190,
                typeAttributes: { 
                    label: { fieldName: 'Name' }, 
                    name: 'open_workspace', 
                    variant: 'base' 
                } 
            },
            { label: this.labels.propertyRef, fieldName: 'gbcinmo__Property_Reference__c', type: 'text', initialWidth: 150, sortable: true },
            { label: this.labels.address, fieldName: 'gbcinmo__Street__c', type: 'text', initialWidth: 220, sortable: true },
            { label: this.labels.stateProvince, fieldName: 'gbcinmo__State_Province__c', type: 'text', initialWidth: 140, sortable: true },
            { label: this.labels.city, fieldName: 'gbcinmo__City__c', type: 'text', initialWidth: 130, sortable: true },
            { label: this.labels.neighborhood, fieldName: 'gbcinmo__Neighborhood__c', type: 'text', initialWidth: 140, sortable: true },
            { label: 'Zip Code', fieldName: 'gbcinmo__Zip_Code__c', type: 'text', initialWidth: 110, sortable: true }
        ];
    }

    /**
     * @description RECONFIGURED IN-WORKSPACE OPPORTUNITIES GRID SCHEMA
     * REFACTORED: Linked fieldName mapping pointer to look up over 'gbcinmo__Agency_Fee_Percentage__c' natively.
     */
    get workspaceOpportunityColumns() {
        return [
            { 
                label: 'Name', 
                fieldName: 'recordUrl', 
                type: 'url', 
                sortable: true,
                typeAttributes: { label: { fieldName: 'Name' }, target: '_blank' },
                initialWidth: 150 
            },
            { label: 'Stage', fieldName: 'StageName', type: 'text', sortable: true, initialWidth: 100 },
            { label: 'Operation Type', fieldName: 'gbcinmo__Operation_Type__c', type: 'text', sortable: true, initialWidth: 130 },
            { label: 'Amount', fieldName: 'Amount', type: 'currency', sortable: true, initialWidth: 110 },
            { label: 'Agency Fee (%)', fieldName: 'gbcinmo__Agency_Fee_Percentage__c', type: 'number', sortable: true, initialWidth: 130 },
            { label: 'Agency Profit', fieldName: 'gbcinmo__Agency_Profit__c', type: 'currency', sortable: true, initialWidth: 120 },
            { label: 'Listing Expiration Date', fieldName: 'gbcinmo__Listing_Expiration_Date__c', type: 'date-local', sortable: true, initialWidth: 170 }
        ];
    }

    get workspaceListingLeadColumns() {
        return [
            { 
                label: 'Lead Ref', 
                fieldName: 'recordUrl', 
                type: 'url', 
                sortable: true,
                typeAttributes: { label: { fieldName: 'Name' }, target: '_blank' },
                initialWidth: 110 
            },
            { label: 'Status', fieldName: 'gbcinmo__Status__c', type: 'text', sortable: true, initialWidth: 110 },
            { label: 'Lead Source', fieldName: 'gbcinmo__Lead_Source__c', type: 'text', sortable: true, initialWidth: 120 },
            { label: 'Follow Up', fieldName: 'gbcinmo__Follow_Up_Date__c', type: 'date-local', sortable: true, initialWidth: 110 },
            { label: 'Description', fieldName: 'gbcinmo__Description__c', type: 'text', sortable: true, initialWidth: 180 }
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

    get isPropertiesSegmentActive() { return this.activeMenuOption === 'properties_opt'; }
    get isUnitsSegmentActive() { return this.activeMenuOption === 'units_opt'; }

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
    wiredUnits(result) {
        this.wiredRelatedUnitsResult = result;
        if (result.data) {
            this.relatedUnitsData = result.data;
            this.processedRelatedUnits = result.data.map(unit => ({
                ...unit,
                parentCity: unit.gbcinmo__Property__r ? unit.gbcinmo__Property__r.gbcinmo__City__c : '',
                parentNeighborhood: unit.gbcinmo__Property__r ? unit.gbcinmo__Property__r.gbcinmo__Neighborhood__c : ''
            }));
        } else if (result.error) {
            this.relatedUnitsData = [];
            this.processedRelatedUnits = [];
        }
    }

    @wire(getAllPropertyUnits)
    wiredAllUnitsPortfolio(result) {
        this.wiredUnitsPortfolioResult = result;
        if (result.data) {
            this.allUnitsPortfolioData = result.data.map(unit => ({
                ...unit,
                parentBuildingName: unit.gbcinmo__Property__r ? unit.gbcinmo__Property__r.Name : '',
                propertyUrl: unit.gbcinmo__Property__c ? `/lightning/r/gbcinmo__Property__c/${unit.gbcinmo__Property__c}/view` : '',
                ownerName: unit.gbcinmo__Owner_Contact__r ? unit.gbcinmo__Owner_Contact__r.Name : '',
                ownerUrl: unit.gbcinmo__Owner_Contact__c ? `/lightning/r/Account/${unit.gbcinmo__Owner_Contact__c}/view` : '',
                parentCity: unit.gbcinmo__Property__r ? unit.gbcinmo__Property__r.gbcinmo__City__c : '',
                parentNeighborhood: unit.gbcinmo__Property__r ? unit.gbcinmo__Property__r.gbcinmo__Neighborhood__c : ''
            }));
        } else if (result.error) {
            this.allUnitsPortfolioData = [];
        }
    }

    @wire(getUnitOpportunities, { unitId: '$selectedUnitId' })
    wiredUnitOpportunities(result) {
        this.wiredUnitOpportunitiesResult = result;
        if (result.data) {
            this.unitOpportunitiesData = result.data.map(record => ({
                ...record,
                recordUrl: `/lightning/r/Opportunity/${record.Id}/view`
            }));
            this.countUnitOpportunities = result.data.length;
        } else if (result.error) {
            this.unitOpportunitiesData = []; this.countUnitOpportunities = 0;
        }
    }

    @wire(getUnitListingLeads, { unitId: '$selectedUnitId' })
    wiredUnitListingLeads(result) {
        this.wiredUnitListingLeadsResult = result;
        if (result.data) {
            this.unitListingLeadsData = result.data.map(record => ({
                ...record,
                recordUrl: `/lightning/r/gbcinmo__Listing_Lead__c/${record.Id}/view`
            }));
            this.countUnitListingLeads = result.data.length;
        } else if (result.error) {
            this.unitListingLeadsData = []; this.countUnitListingLeads = 0;
        }
    }

    @wire(getRecord, { recordId: '$selectedUnitId', fields: UNIT_FIELDS_EXVENT })
    wiredUnitRecordDetails({ error, data }) {
        if (data) {
            this.parentPropertyId = data.fields.gbcinmo__Property__c?.value || '';
            this.parentPropertyName = data.fields.gbcinmo__Property__r?.value?.fields?.Name?.value || '';
        } else if (error) {
            this.parentPropertyId = ''; this.parentPropertyName = '';
        }
    }

    get hasUnits() {
        return this.processedRelatedUnits && this.processedRelatedUnits.length > 0;
    }

    @wire(getRecord, { recordId: '$selectedPropertyId', fields: WORKSPACE_FIELDS })
    wiredWorkspaceRecord(result) {
        this.wiredWorkspaceRecordResult = result;
        if (result.data) {
            const fields = result.data.fields;
            this.rawLocationRecord = {
                country: fields.gbcinmo__Country__c?.value || 'España', 
                state: fields.gbcinmo__State_Province__c?.value || '',
                city: fields.gbcinmo__City__c?.value || '',
                neighborhood: fields.gbcinmo__Neighborhood__c?.value || ''
            };
        }
    }

    handleInventorySort(event) {
        this.sortedByField = event.detail.fieldName;
        this.sortedDirection = event.detail.sortDirection;

        let targetDataArray = this.isPropertiesSegmentActive ? 'propertiesInventoryData' : 'allUnitsPortfolioData';
        let clonedData = JSON.parse(JSON.stringify(this[targetDataArray]));
        
        let keySelector = (record) => {
            if (this.sortedByField === 'propertyUrl') return record.parentBuildingName;
            if (this.sortedByField === 'ownerUrl') return record.ownerName;
            return record[this.sortedByField];
        };
        
        let reverseMultiplier = this.sortedDirection === 'asc' ? 1 : -1;

        clonedData.sort((alpha, beta) => {
            let valAlpha = keySelector(alpha) ? keySelector(alpha).toString().toLowerCase() : '';
            let valBeta = keySelector(beta) ? keySelector(beta).toString().toLowerCase() : '';
            return reverseMultiplier * ((valAlpha > valBeta) - (valBeta > valAlpha));
        });
        this[targetDataArray] = clonedData;
    }

    handleRelatedUnitsSort(event) {
        this.relatedSortedBy = event.detail.fieldName;
        this.relatedSortedDirection = event.detail.sortDirection;
        let clonedData = JSON.parse(JSON.stringify(this.processedRelatedUnits));
        let keySelector = (record) => record[this.relatedSortedBy];
        let reverseMultiplier = this.relatedSortedDirection === 'asc' ? 1 : -1;
        
        clonedData.sort((alpha, beta) => {
            let valAlpha = keySelector(alpha) ? keySelector(alpha).toString().toLowerCase() : '';
            let valBeta = keySelector(beta) ? keySelector(beta).toString().toLowerCase() : '';
            return reverseMultiplier * ((valAlpha > valBeta) - (valBeta > valAlpha));
        });
        this.processedRelatedUnits = clonedData;
    }

    handleOpportunitiesSort(event) {
        this.opportunitiesSortedBy = event.detail.fieldName;
        this.opportunitiesSortedDirection = event.detail.sortDirection;
        let clonedData = JSON.parse(JSON.stringify(this.unitOpportunitiesData));
        
        let keySelector = (record) => {
            if (this.opportunitiesSortedBy === 'recordUrl') return record.Name;
            return record[this.opportunitiesSortedBy];
        };
        let reverseMultiplier = this.opportunitiesSortedDirection === 'asc' ? 1 : -1;
        
        clonedData.sort((alpha, beta) => {
            let valAlpha = keySelector(alpha) ? keySelector(alpha).toString().toLowerCase() : '';
            let valBeta = keySelector(beta) ? keySelector(beta).toString().toLowerCase() : '';
            return reverseMultiplier * ((valAlpha > valBeta) - (valBeta > valAlpha));
        });
        this.unitOpportunitiesData = clonedData;
    }

    handleListingLeadsSort(event) {
        this.leadsSortedBy = event.detail.fieldName;
        this.leadsSortedDirection = event.detail.sortDirection;
        let clonedData = JSON.parse(JSON.stringify(this.unitListingLeadsData));
        
        let keySelector = (record) => {
            if (this.leadsSortedBy === 'recordUrl') return record.Name;
            return record[this.leadsSortedBy];
        };
        let reverseMultiplier = this.leadsSortedDirection === 'asc' ? 1 : -1;
        
        clonedData.sort((alpha, beta) => {
            let valAlpha = keySelector(alpha) ? keySelector(alpha).toString().toLowerCase() : '';
            let valBeta = keySelector(beta) ? keySelector(beta).toString().toLowerCase() : '';
            return reverseMultiplier * ((valAlpha > valBeta) - (valBeta > valAlpha));
        });
        this.unitListingLeadsData = clonedData;
    }

    handlePropertyInventoryAction(event) {
        if (event.detail.action.name === 'open_workspace') {
            this.selectedPropertyId = event.detail.row.Id; 
            this.selectedUnitId = '';
            this.isEditMode = false;
        }
    }

    handleUnitCatalogAction(event) {
        if (event.detail.action.name === 'open_unit_workspace') {
            this.selectedUnitId = event.detail.row.Id;
            this.isUnitEditMode = false;
        }
    }

    handleGlobalUnitAction(event) {
        if (event.detail.action.name === 'open_unit_global') {
            const chosenRow = event.detail.row;
            this.selectedUnitId = chosenRow.Id;
            this.selectedPropertyId = chosenRow.gbcinmo__Property__c || ''; 
            this.isUnitEditMode = false;
        }
    }

    handleNavigateToParentPropertyWorkspace(event) {
        event.preventDefault();
        if (this.parentPropertyId) {
            this.selectedPropertyId = this.parentPropertyId;
            this.selectedUnitId = ''; 
            this.isEditMode = false;
        }
    }

    async navNewProperty() { 
        const resultRecordId = await NewPropertyModal.open({ size: 'medium' });
        if (resultRecordId) { 
            await refreshApex(this.wiredPropertiesResult);
            this.selectedPropertyId = resultRecordId; 
            this.selectedUnitId = '';
            this.isEditMode = false;
        }
    }

    handleBackToDashboard() {
        this.selectedPropertyId = ''; 
        this.selectedUnitId = '';
        this.relatedUnitsData = [];
        this.processedRelatedUnits = [];
        this.isEditMode = false;
        this.isUnitEditMode = false;
        this.isWorkspaceFieldsLoaded = false;
    }

    handleBackToPropertyWorkspace() {
        this.selectedUnitId = '';
        this.isUnitEditMode = false;
    }

    async handleDeleteProperty() {
        const confirmed = await LightningConfirm.open({
            message: this.labels.propertyDeleteConfirmMessage,
            variant: 'headerless',
            label: this.labels.propertyDeleteConfirmTitle,
            theme: 'destructive'
        });
        
        if (confirmed) {
            try {
                await deleteRecord(this.selectedPropertyId);
                this.dispatchEvent(new ShowToastEvent({
                    title: 'Success',
                    message: this.labels.propertyDeleteSuccessMessage,
                    variant: 'success'
                }));
                this.selectedPropertyId = '';
                this.selectedUnitId = '';
                this.isEditMode = false;
                await refreshApex(this.wiredPropertiesResult);
                await refreshApex(this.wiredUnitsPortfolioResult);
            } catch (error) {
                console.error('Operational Delete Property Exception Failed:', error);
                this.dispatchEvent(new ShowToastEvent({
                    title: 'Error',
                    message: this.labels.propertyDeleteErrorMessage,
                    variant: 'error'
                }));
            }
        }
    }

    async handleDeleteUnit() {
        const confirmed = await LightningConfirm.open({
            message: this.labels.deleteConfirmMessage,
            variant: 'headerless',
            label: this.labels.deleteConfirmTitle,
            theme: 'destructive'
        });
        
        if (confirmed) {
            try {
                await deleteRecord(this.selectedUnitId);
                this.dispatchEvent(new ShowToastEvent({
                    title: 'Success',
                    message: this.labels.deleteSuccessMessage,
                    variant: 'success'
                }));
                this.selectedUnitId = '';
                this.isUnitEditMode = false;
                
                await refreshApex(this.wiredUnitsPortfolioResult);
                await refreshApex(this.wiredPropertiesResult);
                if (this.selectedPropertyId) {
                    await refreshApex(this.wiredRelatedUnitsResult);
                }
            } catch (error) {
                console.error('Operational Delete Unit Exception Failed:', error);
                this.dispatchEvent(new ShowToastEvent({
                    title: 'Error',
                    message: this.labels.deleteErrorMessage,
                    variant: 'error'
                }));
            }
        }
    }

    handleManageCover() {
        this.showFlowModal = true;
    }

    handleCloseFlowModal() {
        this.showFlowModal = false;
    }

    get flowInputVariables() {
        return [
            {
                name: 'recordId',
                type: 'String',
                value: this.selectedUnitId
            }
        ];
    }

    async handleFlowStatusChange(event) {
        if (event.detail.status === 'FINISHED' || event.detail.status === 'FINISHED_SCREEN') {
            this.showFlowModal = false;
            this.dispatchEvent(new ShowToastEvent({ title: 'Success', message: 'Cover photo updated successfully.', variant: 'success' }));
            
            await refreshApex(this.wiredUnitsPortfolioResult);
            await refreshApex(this.wiredPropertiesResult);
            if (this.selectedPropertyId) {
                await refreshApex(this.wiredRelatedUnitsResult);
            }
            
            const activeForm = this.template.querySelector('lightning-record-view-form');
            if (activeForm) {
                const savedId = this.selectedUnitId;
                this.selectedUnitId = '';
                setTimeout(() => { this.selectedUnitId = savedId; }, 50);
            }
        }
    }

    toggleQuickAddOwnerWorkspace(event) {
        event.preventDefault();
        this.isQuickAddOwnerWorkspace = !this.isQuickAddOwnerWorkspace;
    }

    handleToggleLocationModify(event) {
        this.showLocationPicker = event.target.checked;
        if (this.showLocationPicker) {
            this.isWorkspaceFieldsLoaded = false;
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

            this.workspaceEditFormSubmit(fields);
        } catch (error) {
            console.error('Workspace Update Exception Error:', error);
            this.dispatchEvent(new ShowToastEvent({ title: 'Error', message: this.labels.backgroundError, variant: 'error' }));
        }
    }

    workspaceEditFormSubmit(fields) {
        const editForm = this.template.querySelector('.workspace-edit-form');
        if (editForm) { editForm.submit(fields); }
    }

    async handleUnitWorkspaceSubmit(event) {
        event.preventDefault();
        const fields = event.detail.fields;

        if (this.isQuickAddOwnerWorkspace) {
            const ownerInput = this.template.querySelector('[data-id="quickOwnerWorkspaceField"]');
            if (ownerInput) {
                ownerInput.reportValidity();
                if (!ownerInput.checkValidity()) return;
            }
            try {
                const recordInput = { apiName: 'Account', fields: { 'Name': ownerInput.value } };
                const newOwnerAccount = await createRecord(recordInput);
                fields['gbcinmo__Owner_Contact__c'] = newOwnerAccount.id;
            } catch (error) {
                console.error('Workspace background owner generation failed:', JSON.stringify(error));
                return;
            }
        }
        const unitForm = this.template.querySelector('.unit-workspace-edit-form');
        if (unitForm) { unitForm.submit(fields); }
    }

    async handleUpdateSuccess() {
        this.dispatchEvent(new ShowToastEvent({ title: this.labels.successTitle, message: this.labels.updateSuccessMsg, variant: 'success' }));
        this.isEditMode = false;
        await refreshApex(this.wiredWorkspaceRecordResult); 
        await refreshApex(this.wiredPropertiesResult);
    }

    async handleUnitUpdateSuccess() {
        this.dispatchEvent(new ShowToastEvent({ title: this.labels.successTitle, message: 'Property Unit updated successfully.', variant: 'success' }));
        this.isUnitEditMode = false;
        this.isQuickAddOwnerWorkspace = false;
        await refreshApex(this.wiredUnitsPortfolioResult);
        await refreshApex(this.wiredPropertiesResult);
        if (this.selectedPropertyId) {
            await refreshApex(this.wiredRelatedUnitsResult);
        }
    }

    async navNewUnit() { 
        const resultRecordId = await NewUnitModal.open({ 
            size: 'medium',
            propertyId: this.selectedPropertyId
        });
        if (resultRecordId) {
            await refreshApex(this.wiredPropertiesResult);
            await refreshApex(this.wiredUnitsPortfolioResult);
            this.selectedUnitId = resultRecordId;
            this.isUnitEditMode = false;
        }
    }

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
    @wire(getRequestsWithPendingMatches) wiredRequestsPendingMatches({ data }) { if(data) { this.requestsPending = data.map(r => this.formatRequest(r)); this.countRequestsPending = data.length; } }
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

    handleRowAction(event) {
        this[NavigationMixin.Navigate]({ type: 'standard__recordPage', attributes: { recordId: event.detail.row.Id, objectApiName: this.activeObject, actionName: 'view' } });
    }
}