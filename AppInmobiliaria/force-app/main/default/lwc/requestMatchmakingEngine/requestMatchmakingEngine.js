import { LightningElement, api, wire, track } from 'lwc';
import { ShowToastEvent } from 'lightning/platformShowToastEvent';
import { refreshApex } from '@salesforce/apex';
import getRequestDetails from '@salesforce/apex/PropertyMatchmakingController.getRequestDetails';
import getCompatibleListings from '@salesforce/apex/PropertyMatchmakingController.getCompatibleListings';
import getPreviousMatchesForRequest from '@salesforce/apex/PropertyMatchmakingController.getPreviousMatchesForRequest';
import createMatchesForRequest from '@salesforce/apex/PropertyMatchmakingController.createMatchesForRequest';

// Added Min Price and Bathrooms to the columns
const COLUMNS = [
    { label: 'Listing Ref', fieldName: 'ListingUrl', type: 'url', typeAttributes: { label: { fieldName: 'Name' }, target: '_blank' } },
    { label: 'Price', fieldName: 'Asking_Price__c', type: 'currency' },
    { label: 'Min Price', fieldName: 'Minimum_Accepted_Price__c', type: 'currency' },
    { label: 'Bedrooms', fieldName: 'Bedrooms__c', type: 'number' },
    { label: 'Bathrooms', fieldName: 'Bathrooms__c', type: 'number' },
    { label: 'Sq Meters', fieldName: 'Square_Meters__c', type: 'number' },
    { label: 'Province', fieldName: 'State_Province__c', type: 'text' }
];

const COLUMNS_MATCHES = [
    { label: 'Match Ref', fieldName: 'MatchUrl', type: 'url', typeAttributes: { label: { fieldName: 'MatchRef' }, target: '_blank' } },
    { label: 'Status', fieldName: 'Status', type: 'text' },
    { label: 'Suggested Listing', fieldName: 'ListingUrl', type: 'url', typeAttributes: { label: { fieldName: 'ListingRef' }, target: '_blank' } },
    { label: 'Price', fieldName: 'Price', type: 'currency' }
];

export default class RequestMatchmakingEngine extends LightningElement {
    @api recordId;
    @track listings = [];
    @track matches = [];
    columns = COLUMNS;
    columnsMatches = COLUMNS_MATCHES;
    selectedRows = [];
    isLoading = true;
    
    wiredListingsResult;
    wiredMatchesResult;

    @track filterOperation = null;
    @track filterBudget = null;
    @track filterBedrooms = null;
    @track filterBathrooms = null;
    @track filterSquareMeters = null;
    @track filterProvince = null;
    @track filterElevator = false;

    get operationOptions() { return [{ label: 'Any', value: '' }, { label: 'Compra', value: 'Compra' }, { label: 'Alquiler', value: 'Alquiler' }, { label: 'Traspaso', value: 'Traspaso' }]; }
    
    get provinceOptions() {
        return [
            { label: 'All', value: '' },
            { label: 'A Coruña', value: 'A Coruña' }, { label: 'Álava', value: 'Álava' }, { label: 'Albacete', value: 'Albacete' },
            { label: 'Alicante', value: 'Alicante' }, { label: 'Almería', value: 'Almería' }, { label: 'Asturias', value: 'Asturias' },
            { label: 'Madrid', value: 'Madrid' }, { label: 'Barcelona', value: 'Barcelona' }, { label: 'Valencia', value: 'Valencia' }
        ];
    }

    @wire(getRequestDetails, { requestId: '$recordId' })
    wiredRequest({ error, data }) {
        if (data) {
            let n = {};
            for (let k in data) { n[k.replace('gbcinmo__', '')] = data[k]; }
            this.filterOperation = n.Desired_Operation_Type__c || null;
            this.filterBudget = n.Max_Budget__c ? parseFloat(n.Max_Budget__c) : null;
            this.filterBedrooms = n.Min_Bedrooms__c ? parseInt(n.Min_Bedrooms__c, 10) : null;
            this.filterBathrooms = n.Min_Bathrooms__c ? parseInt(n.Min_Bathrooms__c, 10) : null;
            this.filterSquareMeters = n.Min_Square_Meters__c ? parseInt(n.Min_Square_Meters__c, 10) : null;
            this.filterElevator = n.Elevator_Required__c || false;
            this.filterProvince = n.Desired_State_Province__c || null;
        }
    }

    @wire(getCompatibleListings, { 
        requestId: '$recordId', operationType: '$filterOperation', maxBudget: '$filterBudget', 
        minBedrooms: '$filterBedrooms', minBathrooms: '$filterBathrooms', requiresElevator: '$filterElevator', 
        stateProvince: '$filterProvince', minSquareMeters: '$filterSquareMeters'
    })
    wiredListings(result) {
        this.wiredListingsResult = result;
        if (result.data) {
            this.listings = result.data.map(row => {
                let n = {};
                for (let k in row) { n[k.replace('gbcinmo__', '')] = row[k]; }
                n.ListingUrl = `/${n.Id}`;
                
                // Mapeo seguro contra el namespace en objetos anidados
                const unit = row.gbcinmo__Property_Unit__r || row.Property_Unit__r || {};
                const property = unit.gbcinmo__Property__r || unit.Property__r || {};
                
                n.Bedrooms__c = unit.gbcinmo__Bedrooms__c || unit.Bedrooms__c;
                n.Bathrooms__c = unit.gbcinmo__Bathrooms__c || unit.Bathrooms__c;
                n.Square_Meters__c = unit.gbcinmo__Square_Meters__c || unit.Square_Meters__c;
                n.State_Province__c = property.gbcinmo__State_Province__c || property.State_Province__c;
                
                return n;
            });
            this.isLoading = false;
        } else if (result.error) { this.isLoading = false; }
    }

    @wire(getPreviousMatchesForRequest, { requestId: '$recordId' })
    wiredMatches(result) {
        this.wiredMatchesResult = result;
        if (result.data) {
            this.matches = result.data.map(row => {
                const opp = row.gbcinmo__Opportunity__r || {};
                const oppId = row.gbcinmo__Opportunity__c;
                return {
                    Id: row.Id, MatchUrl: `/${row.Id}`, MatchRef: row.Name,
                    Status: row.gbcinmo__Match_Status__c,
                    ListingUrl: `/${oppId}`, ListingRef: opp.Name,
                    Price: opp.gbcinmo__Asking_Price__c
                };
            });
        }
    }

    handleFilterChange(event) {
        this.isLoading = true;
        const name = event.target.name;
        if (name === 'filterElevator') { this.filterElevator = event.target.checked; } 
        else {
            const val = event.target.value;
            if (name === 'filterOperation') this.filterOperation = val || null;
            if (name === 'filterBudget') this.filterBudget = val ? parseFloat(val) : null;
            if (name === 'filterBedrooms') this.filterBedrooms = val ? parseInt(val, 10) : null;
            if (name === 'filterBathrooms') this.filterBathrooms = val ? parseInt(val, 10) : null;
            if (name === 'filterSquareMeters') this.filterSquareMeters = val ? parseInt(val, 10) : null;
            if (name === 'filterProvince') this.filterProvince = val || null;
        }
    }

    get hasData() { return this.listings && this.listings.length > 0; }
    get hasMatches() { return this.matches && this.matches.length > 0; }
    get isButtonDisabled() { return this.selectedRows.length === 0; }
    
    handleRowSelection(event) { this.selectedRows = event.detail.selectedRows.map(row => row.Id); }

    handlePropose() {
        this.isLoading = true;
        createMatchesForRequest({ requestId: this.recordId, listingIds: this.selectedRows })
            .then(() => {
                this.dispatchEvent(new ShowToastEvent({ title: 'Success!', message: 'Listings proposed to client.', variant: 'success' }));
                refreshApex(this.wiredMatchesResult);
                return refreshApex(this.wiredListingsResult); 
            })
            .catch(error => { this.dispatchEvent(new ShowToastEvent({ title: 'Error', message: 'Could not save proposals.', variant: 'error' })); })
            .finally(() => { this.isLoading = false; this.selectedRows = []; });
    }
}