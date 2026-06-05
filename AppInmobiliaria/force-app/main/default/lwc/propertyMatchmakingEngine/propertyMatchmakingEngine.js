import { LightningElement, api, wire, track } from 'lwc';
import { ShowToastEvent } from 'lightning/platformShowToastEvent';
import { refreshApex } from '@salesforce/apex';
import getListingDetails from '@salesforce/apex/PropertyMatchmakingController.getListingDetails';
import getCompatibleRequests from '@salesforce/apex/PropertyMatchmakingController.getCompatibleRequests';
import getPreviousMatches from '@salesforce/apex/PropertyMatchmakingController.getPreviousMatches';
import createMatches from '@salesforce/apex/PropertyMatchmakingController.createMatches';

import getProvinces from '@salesforce/apex/PropertyMatchmakingController.getProvinces';
import getCities from '@salesforce/apex/PropertyMatchmakingController.getCities';
import getNeighborhoods from '@salesforce/apex/PropertyMatchmakingController.getNeighborhoods';
import getLocationDictionary from '@salesforce/apex/PropertyMatchmakingController.getLocationDictionary';

export default class PropertyMatchmakingEngine extends LightningElement {
    @api recordId;
    @track requests = [];
    @track matches = [];
    
    columns = [
        { label: 'Request', fieldName: 'RequestUrl', type: 'url', typeAttributes: { label: { fieldName: 'Request_Reference__c' }, target: '_blank' } },
        { label: 'Min Budget', fieldName: 'Min_Budget__c', type: 'currency' },
        { label: 'Max Budget', fieldName: 'Max_Budget__c', type: 'currency' },
        { label: 'City', fieldName: 'Desired_City__c', type: 'text' },
        { label: 'Neighborhood', fieldName: 'Desired_Neighborhood__c', type: 'text' },
        { label: 'Sq Meters', fieldName: 'Min_Square_Meters__c', type: 'number' },
        { label: 'Bedrooms', fieldName: 'Min_Bedrooms__c', type: 'number' },
        { label: 'Bathrooms', fieldName: 'Min_Bathrooms__c', type: 'number' }
    ];
    
    columnsMatches = [
        { label: 'Match Ref', fieldName: 'MatchUrl', type: 'url', typeAttributes: { label: { fieldName: 'MatchRef' }, target: '_blank' } },
        { label: 'Status', fieldName: 'Status', type: 'text' },
        { label: 'Client Ref', fieldName: 'RequestUrl', type: 'url', typeAttributes: { label: { fieldName: 'RequestRef' }, target: '_blank' } },
        { label: 'Client', fieldName: 'ClientName', type: 'text' },
        { label: 'Budget', fieldName: 'Budget', type: 'currency' }
    ];

    selectedRows = [];
    isLoading = true;
    
    wiredRequestsResult;
    wiredMatchesResult;
    rawRequestsData = null;
    locationDict = {};

    @track filterOperation = null;
    @track filterMinBudget = null;
    @track filterMaxBudget = null;
    @track filterBedrooms = null;
    @track filterBathrooms = null;
    @track filterSquareMeters = null;
    @track filterProvince = null;
    @track filterCity = null;
    @track filterNeighborhood = null;
    @track filterElevator = false;

    @track rawProvinces = [];
    @track rawCities = [];
    @track rawNeighborhoods = [];

    @wire(getLocationDictionary)
    wiredLocDict({ data, error }) {
        if (data) {
            this.locationDict = data;
            this.processRequests();
        }
        if (error) console.error('Error loading dictionary:', error);
    }

    @wire(getProvinces)
    wiredProvinces({ data, error }) {
        if (data) this.rawProvinces = data;
        if (error) console.error('Error loading provinces:', error);
    }

    @wire(getCities, { provinceValue: '$filterProvince' })
    wiredCities({ data, error }) {
        if (data) this.rawCities = data;
        else this.rawCities = [];
        if (error) console.error('Error loading cities:', error);
    }

    @wire(getNeighborhoods, { cityValue: '$filterCity' })
    wiredNeighborhoods({ data, error }) {
        if (data) this.rawNeighborhoods = data;
        else this.rawNeighborhoods = [];
        if (error) console.error('Error loading neighborhoods:', error);
    }

    get operationOptions() {
        return [
            { label: 'Any', value: '' }, 
            { label: 'Sale', value: 'Sale' }, 
            { label: 'Rent', value: 'Rent' }, 
            { label: 'Transfer', value: 'Transfer' }
        ];
    }

    get provinceOptions() {
        return [{ label: 'All', value: '' }, ...(this.rawProvinces || [])];
    }

    get cityOptions() {
        let options = [{ label: 'All', value: '' }, ...(this.rawCities || [])];
        if (this.filterProvince) {
            options.push({ label: 'Other / Not Listed', value: 'Other' });
        }
        return options;
    }

    get isNeighborhoodDisabled() {
        return !this.filterCity || !this.rawNeighborhoods || this.rawNeighborhoods.length === 0;
    }

    get neighborhoodOptions() {
        return [{ label: 'All / Not Applicable', value: '' }, ...(this.rawNeighborhoods || [])];
    }

    @wire(getListingDetails, { listingId: '$recordId' })
    wiredListing({ error, data }) {
        if (data) {
            try {
                let n = {};
                for (let key in data) { n[key.replace('gbcinmo__', '')] = data[key]; }
                this.filterOperation = n.Operation_Type__c || null;
                
                if (n.Minimum_Accepted_Price__c) {
                    this.filterMinBudget = parseFloat(n.Minimum_Accepted_Price__c);
                } else if (n.Asking_Price__c) {
                    this.filterMinBudget = parseFloat(n.Asking_Price__c);
                } else {
                    this.filterMinBudget = null;
                }
                
                this.filterMaxBudget = n.Asking_Price__c ? parseFloat(n.Asking_Price__c) : null;
                
                if (data.gbcinmo__Property_Unit__r) {
                    let unit = data.gbcinmo__Property_Unit__r;
                    this.filterBedrooms = unit.gbcinmo__Bedrooms__c || null;
                    this.filterBathrooms = unit.gbcinmo__Bathrooms__c || null;
                    this.filterSquareMeters = unit.gbcinmo__Square_Meters__c || null;
                    
                    if(unit.gbcinmo__Property__r) {
                        this.filterElevator = unit.gbcinmo__Property__r.gbcinmo__Has_Elevator__c || false;
                        this.filterProvince = unit.gbcinmo__Property__r.gbcinmo__State_Province__c || null;
                        this.filterCity = unit.gbcinmo__Property__r.gbcinmo__City__c || null;
                        this.filterNeighborhood = unit.gbcinmo__Property__r.gbcinmo__Neighborhood__c || null;
                    }
                }
            } catch (e) {
                console.error('Error parsing Listing details:', e);
            }
        }
    }

    @wire(getCompatibleRequests, { 
        listingId: '$recordId', operationType: '$filterOperation', minBudget: '$filterMinBudget', maxBudget: '$filterMaxBudget',
        minBedrooms: '$filterBedrooms', stateProvince: '$filterProvince', city: '$filterCity', 
        neighborhood: '$filterNeighborhood', minBathrooms: '$filterBathrooms', 
        hasElevator: '$filterElevator', minSquareMeters: '$filterSquareMeters'
    })
    wiredRequests(result) {
        this.wiredRequestsResult = result;
        if (result.data) {
            this.rawRequestsData = result.data;
            this.processRequests(); 
        } else if (result.error) {
            console.error('Apex error in getCompatibleRequests:', result.error);
            this.isLoading = false;
        }
    }

    processRequests() {
        if (!this.rawRequestsData) return;
        
        try {
            this.requests = this.rawRequestsData.map(row => {
                let newRow = {};
                for (let key in row) { newRow[key.replace('gbcinmo__', '')] = row[key]; }
                newRow.RequestUrl = `/${newRow.Id}`; 

                newRow.Request_Reference__c = row.gbcinmo__Request_Reference__c || row.Request_Reference__c || newRow.Name;

                if (newRow.Desired_City__c) {
                    newRow.Desired_City__c = newRow.Desired_City__c.split(';')
                        .map(val => this.locationDict[val] || val)
                        .join(', ');
                }

                if (newRow.Desired_Neighborhood__c) {
                    newRow.Desired_Neighborhood__c = newRow.Desired_Neighborhood__c.split(';')
                        .map(val => this.locationDict[val] || val)
                        .join(', ');
                }

                return newRow;
            });
        } catch (e) {
            console.error('Error mapping and translating requests:', e);
        } finally {
            this.isLoading = false;
        }
    }

    @wire(getPreviousMatches, { listingId: '$recordId' })
    wiredMatches(result) {
        this.wiredMatchesResult = result;
        if (result.data) {
            this.matches = result.data.map(row => {
                const reqInfo = row.gbcinmo__Property_Request__r || {};
                const requestRefName = reqInfo.gbcinmo__Request_Reference__c || reqInfo.Request_Reference__c || reqInfo.Name;
                
                return {
                    Id: row.Id, MatchUrl: `/${row.Id}`, MatchRef: row.Name,
                    Status: row.gbcinmo__Match_Status__c,
                    RequestUrl: `/${row.gbcinmo__Property_Request__c}`, RequestRef: requestRefName,
                    ClientName: reqInfo.gbcinmo__Client_Name__c,
                    Budget: reqInfo.gbcinmo__Max_Budget__c
                };
            });
        } else if (result.error) {
            console.error('Apex error in getPreviousMatches:', result.error);
        }
    }

    handleFilterChange(event) {
        try {
            const name = event.target.name;
            const isCheckbox = event.target.type === 'checkbox';
            let val = isCheckbox ? event.target.checked : event.target.value;
            if (!isCheckbox && val === '') val = null;

            if (name === 'filterMinBudget' || name === 'filterMaxBudget') val = val ? parseFloat(val) : null;
            if (name === 'filterBedrooms' || name === 'filterBathrooms' || name === 'filterSquareMeters') val = val ? parseInt(val, 10) : null;

            let hasChanged = false;

            if (name === 'filterOperation' && this.filterOperation !== val) { this.filterOperation = val; hasChanged = true; }
            if (name === 'filterMinBudget' && this.filterMinBudget !== val) { this.filterMinBudget = val; hasChanged = true; }
            if (name === 'filterMaxBudget' && this.filterMaxBudget !== val) { this.filterMaxBudget = val; hasChanged = true; }
            if (name === 'filterBedrooms' && this.filterBedrooms !== val) { this.filterBedrooms = val; hasChanged = true; }
            if (name === 'filterBathrooms' && this.filterBathrooms !== val) { this.filterBathrooms = val; hasChanged = true; }
            if (name === 'filterSquareMeters' && this.filterSquareMeters !== val) { this.filterSquareMeters = val; hasChanged = true; }
            
            if (name === 'filterProvince' && this.filterProvince !== val) {
                this.filterProvince = val;
                this.filterCity = null;
                this.filterNeighborhood = null;
                hasChanged = true;
            }
            if (name === 'filterCity' && this.filterCity !== val) {
                this.filterCity = val;
                this.filterNeighborhood = null;
                hasChanged = true;
            }
            if (name === 'filterNeighborhood' && this.filterNeighborhood !== val) {
                this.filterNeighborhood = val;
                hasChanged = true;
            }
            if (name === 'filterElevator' && this.filterElevator !== val) {
                this.filterElevator = val;
                hasChanged = true;
            }

            if (hasChanged) {
                this.isLoading = true;
            }
            
        } catch(e) {
            console.error('Error in handleFilterChange:', e);
            this.isLoading = false; 
        }
    }

    get hasData() { return this.requests && this.requests.length > 0; }
    get hasMatches() { return this.matches && this.matches.length > 0; }
    get isButtonDisabled() { return this.selectedRows.length === 0; }
    
    handleRowSelection(event) { 
        this.selectedRows = event.detail.selectedRows.map(row => row.Id); 
    }

    handlePropose() {
        this.isLoading = true;
        createMatches({ listingId: this.recordId, requestIds: this.selectedRows })
            .then(() => {
                this.dispatchEvent(new ShowToastEvent({ title: 'Success!', message: 'Proposals created successfully.', variant: 'success' }));
                refreshApex(this.wiredMatchesResult);
                return refreshApex(this.wiredRequestsResult); 
            })
            .catch(error => { 
                this.dispatchEvent(new ShowToastEvent({ title: 'Error', message: 'Failed to create proposals.', variant: 'error' })); 
            })
            .finally(() => { 
                this.isLoading = false; 
                this.selectedRows = []; 
            });
    }
}