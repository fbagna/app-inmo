import { LightningElement, api, wire, track } from 'lwc';
import { ShowToastEvent } from 'lightning/platformShowToastEvent';
import { refreshApex } from '@salesforce/apex';
import getRequestDetails from '@salesforce/apex/PropertyMatchmakingController.getRequestDetails';
import getCompatibleListings from '@salesforce/apex/PropertyMatchmakingController.getCompatibleListings';
import getPreviousMatchesForRequest from '@salesforce/apex/PropertyMatchmakingController.getPreviousMatchesForRequest';
import createMatchesForRequest from '@salesforce/apex/PropertyMatchmakingController.createMatchesForRequest';

import getProvinces from '@salesforce/apex/PropertyMatchmakingController.getProvinces';
import getCities from '@salesforce/apex/PropertyMatchmakingController.getCities';
import getNeighborhoods from '@salesforce/apex/PropertyMatchmakingController.getNeighborhoods';
import getLocationDictionary from '@salesforce/apex/PropertyMatchmakingController.getLocationDictionary';

export default class RequestMatchmakingEngine extends LightningElement {
    @api recordId;
    @track listings = [];
    @track matches = [];
    
    columns = [
        { label: 'Property', fieldName: 'ListingUrl', type: 'url', typeAttributes: { label: { fieldName: 'Listing_Reference__c' }, target: '_blank' } },
        { label: 'Price', fieldName: 'Asking_Price__c', type: 'currency' },
        { label: 'Min Price', fieldName: 'Minimum_Accepted_Price__c', type: 'currency' },
        { label: 'City', fieldName: 'City', type: 'text' }, 
        { label: 'Neighborhood', fieldName: 'Neighborhood', type: 'text' },
        { label: 'Sq Meters', fieldName: 'SquareMeters', type: 'number' },
        { label: 'Bedrooms', fieldName: 'Bedrooms', type: 'number' },
        { label: 'Bathrooms', fieldName: 'Bathrooms', type: 'number' } 
    ];
    
    columnsMatches = [
        { label: 'Match Ref', fieldName: 'MatchUrl', type: 'url', typeAttributes: { label: { fieldName: 'MatchRef' }, target: '_blank' } },
        { label: 'Status', fieldName: 'Status', type: 'text' },
        { label: 'Suggested Listing', fieldName: 'ListingUrl', type: 'url', typeAttributes: { label: { fieldName: 'ListingRef' }, target: '_blank' } },
        { label: 'Price', fieldName: 'Price', type: 'currency' }
    ];

    selectedRows = [];
    isLoading = true;
    
    wiredListingsResult;
    wiredMatchesResult;
    rawListingsData = null;
    locationDict = {};

    @track filterOperation = null;
    @track filterMinBudget = null;
    @track filterBudget = null;
    @track filterBedrooms = null;
    @track filterBathrooms = null;
    @track filterSquareMeters = null;
    @track filterProvince = null;
    @track filterElevator = false;
    @track filterDesiredCities = null;
    @track filterDesiredNeighborhoods = null;

    @track clientOriginalCities = null;
    @track clientOriginalNeighborhoods = null;

    @track rawProvinces = [];
    @track rawCities = [];
    @track rawNeighborhoods = [];

    @wire(getLocationDictionary)
    wiredLocDict({ data, error }) {
        if (data) {
            this.locationDict = data;
            this.processListings();
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

    @wire(getNeighborhoods, { cityValue: '$filterDesiredCities' })
    wiredNeighborhoods({ data, error }) {
        if (data) this.rawNeighborhoods = data;
        else this.rawNeighborhoods = [];
        if (error) console.error('Error loading neighborhoods:', error);
    }

    get operationOptions() { 
        return [
            { label: 'Any', value: '' }, 
            { label: 'Purchase', value: 'Purchase' }, 
            { label: 'Rent', value: 'Rent' }, 
            { label: 'Transfer', value: 'Transfer' }
        ]; 
    }
    
    get provinceOptions() {
        return [{ label: 'All', value: '' }, ...(this.rawProvinces || [])];
    }

    get cityOptions() {
        let options = [{ label: 'All', value: '' }];
        if (this.clientOriginalCities && typeof this.clientOriginalCities === 'string' && this.clientOriginalCities.includes(';')) {
            options.push({ label: 'Client\'s Request (Multiple)', value: this.clientOriginalCities });
        }
        options = [...options, ...(this.rawCities || [])];
        if (this.filterProvince) {
            options.push({ label: 'Other / Not Listed', value: 'Other' });
        }
        return options;
    }

    get isNeighborhoodDisabled() {
        return !this.filterDesiredCities || 
               (typeof this.filterDesiredCities === 'string' && this.filterDesiredCities.includes(';')) || 
               !this.rawNeighborhoods || 
               this.rawNeighborhoods.length === 0;
    }

    get neighborhoodOptions() {
        let options = [{ label: 'All / Not Applicable', value: '' }];
        if (this.clientOriginalNeighborhoods && typeof this.clientOriginalNeighborhoods === 'string' && this.clientOriginalNeighborhoods.includes(';')) {
            options.push({ label: 'Client\'s Request (Multiple)', value: this.clientOriginalNeighborhoods });
        }
        return [...options, ...(this.rawNeighborhoods || [])];
    }

    @wire(getRequestDetails, { requestId: '$recordId' })
    wiredRequest({ error, data }) {
        if (data) {
            try {
                let n = {};
                for (let k in data) { n[k.replace('gbcinmo__', '')] = data[k]; }
                this.filterOperation = n.Desired_Operation_Type__c || null;
                this.filterMinBudget = n.Min_Budget__c ? parseFloat(n.Min_Budget__c) : null;
                this.filterBudget = n.Max_Budget__c ? parseFloat(n.Max_Budget__c) : null;
                this.filterBedrooms = n.Min_Bedrooms__c ? parseInt(n.Min_Bedrooms__c, 10) : null;
                this.filterBathrooms = n.Min_Bathrooms__c ? parseInt(n.Min_Bathrooms__c, 10) : null;
                this.filterSquareMeters = n.Min_Square_Meters__c ? parseInt(n.Min_Square_Meters__c, 10) : null;
                this.filterElevator = n.Elevator_Required__c || false;
                this.filterProvince = n.Desired_State_Province__c || null;
                
                this.clientOriginalCities = n.Desired_City__c || null;
                this.clientOriginalNeighborhoods = n.Desired_Neighborhood__c || null;
                
                this.filterDesiredCities = this.clientOriginalCities;
                this.filterDesiredNeighborhoods = this.clientOriginalNeighborhoods;
            } catch (e) {
                console.error('Error parsing Request details:', e);
            }
        }
    }

    @wire(getCompatibleListings, { 
        requestId: '$recordId', operationType: '$filterOperation', minBudget: '$filterMinBudget', maxBudget: '$filterBudget', 
        minBedrooms: '$filterBedrooms', minBathrooms: '$filterBathrooms', requiresElevator: '$filterElevator', 
        stateProvince: '$filterProvince', desiredCities: '$filterDesiredCities', desiredNeighborhoods: '$filterDesiredNeighborhoods', 
        minSquareMeters: '$filterSquareMeters'
    })
    wiredListings(result) {
        this.wiredListingsResult = result;
        if (result.data) {
            this.rawListingsData = result.data;
            this.processListings();
        } else if (result.error) { 
            console.error('Apex error in getCompatibleListings:', result.error);
            this.isLoading = false; 
        }
    }

    processListings() {
        if (!this.rawListingsData) return;
        
        try {
            this.listings = this.rawListingsData.map(row => {
                let n = {};
                for (let k in row) { n[k.replace('gbcinmo__', '')] = row[k]; }
                n.ListingUrl = `/${n.Id}`;
                
                const unit = row.gbcinmo__Property_Unit__r || row.Property_Unit__r || {};
                const property = unit.gbcinmo__Property__r || unit.Property__r || {};
                
                n.Bedrooms = unit.gbcinmo__Bedrooms__c || unit.Bedrooms__c;
                n.Bathrooms = unit.gbcinmo__Bathrooms__c || unit.Bathrooms__c;
                n.SquareMeters = unit.gbcinmo__Square_Meters__c || unit.Square_Meters__c;
                
                n.Listing_Reference__c = row.gbcinmo__Listing_Reference__c || row.Listing_Reference__c || n.Name;

                let rawCity = property.gbcinmo__City__c || property.City__c;
                let rawNeigh = property.gbcinmo__Neighborhood__c || property.Neighborhood__c;

                n.City = rawCity ? (this.locationDict[rawCity] || rawCity) : '';
                n.Neighborhood = rawNeigh ? (this.locationDict[rawNeigh] || rawNeigh) : '';
                
                return n;
            });
        } catch (e) {
            console.error('Error mapping and translating listings:', e);
        } finally {
            this.isLoading = false;
        }
    }

    @wire(getPreviousMatchesForRequest, { requestId: '$recordId' })
    wiredMatches(result) {
        this.wiredMatchesResult = result;
        if (result.data) {
            this.matches = result.data.map(row => {
                const opp = row.gbcinmo__Opportunity__r || {};
                const oppId = row.gbcinmo__Opportunity__c;
                
                const listingRefName = opp.gbcinmo__Listing_Reference__c || opp.Listing_Reference__c || opp.Name;
                
                return {
                    Id: row.Id, MatchUrl: `/${row.Id}`, MatchRef: row.Name,
                    Status: row.gbcinmo__Match_Status__c,
                    ListingUrl: `/${oppId}`, ListingRef: listingRefName,
                    Price: opp.gbcinmo__Asking_Price__c
                };
            });
        } else if (result.error) {
            console.error('Apex error in getPreviousMatchesForRequest:', result.error);
        }
    }

    handleFilterChange(event) {
        try {
            const name = event.target.name;
            const isCheckbox = event.target.type === 'checkbox';
            let val = isCheckbox ? event.target.checked : event.target.value;
            if (!isCheckbox && val === '') val = null;

            if (name === 'filterMinBudget' || name === 'filterBudget') val = val ? parseFloat(val) : null;
            if (name === 'filterBedrooms' || name === 'filterBathrooms' || name === 'filterSquareMeters') val = val ? parseInt(val, 10) : null;

            let hasChanged = false;

            if (name === 'filterOperation' && this.filterOperation !== val) { this.filterOperation = val; hasChanged = true; }
            if (name === 'filterMinBudget' && this.filterMinBudget !== val) { this.filterMinBudget = val; hasChanged = true; }
            if (name === 'filterBudget' && this.filterBudget !== val) { this.filterBudget = val; hasChanged = true; }
            if (name === 'filterBedrooms' && this.filterBedrooms !== val) { this.filterBedrooms = val; hasChanged = true; }
            if (name === 'filterBathrooms' && this.filterBathrooms !== val) { this.filterBathrooms = val; hasChanged = true; }
            if (name === 'filterSquareMeters' && this.filterSquareMeters !== val) { this.filterSquareMeters = val; hasChanged = true; }
            
            if (name === 'filterProvince' && this.filterProvince !== val) {
                this.filterProvince = val;
                this.filterDesiredCities = null;
                this.filterDesiredNeighborhoods = null;
                hasChanged = true;
            }
            if (name === 'filterDesiredCities' && this.filterDesiredCities !== val) {
                this.filterDesiredCities = val;
                this.filterDesiredNeighborhoods = null;
                hasChanged = true;
            }
            if (name === 'filterDesiredNeighborhoods' && this.filterDesiredNeighborhoods !== val) {
                this.filterDesiredNeighborhoods = val;
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

    get hasData() { return this.listings && this.listings.length > 0; }
    get hasMatches() { return this.matches && this.matches.length > 0; }
    get isButtonDisabled() { return this.selectedRows.length === 0; }
    
    handleRowSelection(event) { 
        this.selectedRows = event.detail.selectedRows.map(row => row.Id); 
    }

    handlePropose() {
        this.isLoading = true;
        createMatchesForRequest({ requestId: this.recordId, listingIds: this.selectedRows })
            .then(() => {
                this.dispatchEvent(new ShowToastEvent({ title: 'Success!', message: 'Listings proposed to client.', variant: 'success' }));
                refreshApex(this.wiredMatchesResult);
                return refreshApex(this.wiredListingsResult); 
            })
            .catch(error => { 
                this.dispatchEvent(new ShowToastEvent({ title: 'Error', message: 'Could not save proposals.', variant: 'error' })); 
            })
            .finally(() => { 
                this.isLoading = false; 
                this.selectedRows = []; 
            });
    }
}