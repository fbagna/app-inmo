import { LightningElement, api, wire, track } from 'lwc';
import { ShowToastEvent } from 'lightning/platformShowToastEvent';
import { refreshApex } from '@salesforce/apex';
import getListingDetails from '@salesforce/apex/PropertyMatchmakingController.getListingDetails';
import getCompatibleRequests from '@salesforce/apex/PropertyMatchmakingController.getCompatibleRequests';
import getPreviousMatches from '@salesforce/apex/PropertyMatchmakingController.getPreviousMatches';
import createMatches from '@salesforce/apex/PropertyMatchmakingController.createMatches';

const COLUMNS = [
    { label: 'Ref', fieldName: 'RequestUrl', type: 'url', typeAttributes: { label: { fieldName: 'Name' }, target: '_blank' } },
    { label: 'Client', fieldName: 'Client_Name__c', type: 'text' },
    { label: 'Max Budget', fieldName: 'Max_Budget__c', type: 'currency' },
    { label: 'Bedrooms', fieldName: 'Min_Bedrooms__c', type: 'number' },
    { label: 'Sq Meters', fieldName: 'Min_Square_Meters__c', type: 'number' },
    { label: 'City', fieldName: 'Desired_City__c', type: 'text' }
];

const COLUMNS_MATCHES = [
    { label: 'Match Ref', fieldName: 'MatchUrl', type: 'url', typeAttributes: { label: { fieldName: 'MatchRef' }, target: '_blank' } },
    { label: 'Status', fieldName: 'Status', type: 'text' },
    { label: 'Client Ref', fieldName: 'RequestUrl', type: 'url', typeAttributes: { label: { fieldName: 'RequestRef' }, target: '_blank' } },
    { label: 'Client', fieldName: 'ClientName', type: 'text' },
    { label: 'Budget', fieldName: 'Budget', type: 'currency' }
];

export default class PropertyMatchmakingEngine extends LightningElement {
    @api recordId;
    @track requests = [];
    @track matches = [];
    columns = COLUMNS;
    columnsMatches = COLUMNS_MATCHES;
    selectedRows = [];
    isLoading = true;
    
    wiredRequestsResult;
    wiredMatchesResult;

    @track filterOperation = null;
    @track filterBudget = null;
    @track filterBedrooms = null;
    @track filterBathrooms = null;
    @track filterSquareMeters = null;
    @track filterProvince = null;
    @track filterElevator = false;

    get operationOptions() {
        return [
            { label: 'Any', value: '' }, 
            { label: 'Compra', value: 'Compra' }, 
            { label: 'Alquiler', value: 'Alquiler' }, 
            { label: 'Traspaso', value: 'Traspaso' }
        ];
    }

    get provinceOptions() {
        return [
            { label: 'All', value: '' },
            { label: 'A Coruña', value: 'A Coruña' }, { label: 'Álava', value: 'Álava' }, { label: 'Albacete', value: 'Albacete' },
            { label: 'Alicante', value: 'Alicante' }, { label: 'Almería', value: 'Almería' }, { label: 'Asturias', value: 'Asturias' },
            { label: 'Ávila', value: 'Ávila' }, { label: 'Badajoz', value: 'Badajoz' }, { label: 'Baleares', value: 'Baleares' },
            { label: 'Barcelona', value: 'Barcelona' }, { label: 'Burgos', value: 'Burgos' }, { label: 'Cáceres', value: 'Cáceres' },
            { label: 'Cádiz', value: 'Cádiz' }, { label: 'Cantabria', value: 'Cantabria' }, { label: 'Castellón', value: 'Castellón' },
            { label: 'Ceuta', value: 'Ceuta' }, { label: 'Ciudad Real', value: 'Ciudad Real' }, { label: 'Córdoba', value: 'Córdoba' },
            { label: 'Cuenca', value: 'Cuenca' }, { label: 'Girona', value: 'Girona' }, { label: 'Granada', value: 'Granada' },
            { label: 'Guadalajara', value: 'Guadalajara' }, { label: 'Gipuzkoa', value: 'Gipuzkoa' }, { label: 'Huelva', value: 'Huelva' },
            { label: 'Huesca', value: 'Huesca' }, { label: 'Jaén', value: 'Jaén' }, { label: 'La Rioja', value: 'La Rioja' },
            { label: 'León', value: 'León' }, { label: 'Lleida', value: 'Lleida' }, { label: 'Lugo', value: 'Lugo' },
            { label: 'Madrid', value: 'Madrid' }, { label: 'Málaga', value: 'Málaga' }, { label: 'Melilla', value: 'Melilla' },
            { label: 'Murcia', value: 'Murcia' }, { label: 'Navarra', value: 'Navarra' }, { label: 'Ourense', value: 'Ourense' },
            { label: 'Palencia', value: 'Palencia' }, { label: 'Pontevedra', value: 'Pontevedra' }, { label: 'Salamanca', value: 'Salamanca' },
            { label: 'Santa Cruz de Tenerife', value: 'Santa Cruz de Tenerife' }, { label: 'Segovia', value: 'Segovia' }, { label: 'Sevilla', value: 'Sevilla' },
            { label: 'Soria', value: 'Soria' }, { label: 'Tarragona', value: 'Tarragona' }, { label: 'Teruel', value: 'Teruel' },
            { label: 'Toledo', value: 'Toledo' }, { label: 'Valencia', value: 'Valencia' }, { label: 'Valladolid', value: 'Valladolid' },
            { label: 'Vizcaya', value: 'Vizcaya' }, { label: 'Zamora', value: 'Zamora' }, { label: 'Zaragoza', value: 'Zaragoza' }
        ];
    }

    @api
    get contextRecordId() {
        return this.recordId;
    }

    @wire(getListingDetails, { listingId: '$recordId' })
    wiredListing({ error, data }) {
        if (data) {
            let normData = {};
            for (let key in data) { normData[key.replace('gbcinmo__', '')] = data[key]; }
            this.filterOperation = normData.Operation_Type__c === 'Venta' ? 'Compra' : normData.Operation_Type__c;
            this.filterBudget = normData.Asking_Price__c ? parseFloat(normData.Asking_Price__c) : null;
            
            // Navegación profunda al Inmueble y al Edificio
            if (data.gbcinmo__Property_Unit__r) {
                let unit = data.gbcinmo__Property_Unit__r;
                this.filterBedrooms = unit.gbcinmo__Bedrooms__c ? parseInt(unit.gbcinmo__Bedrooms__c, 10) : null;
                this.filterBathrooms = unit.gbcinmo__Bathrooms__c ? parseInt(unit.gbcinmo__Bathrooms__c, 10) : null;
                this.filterSquareMeters = unit.gbcinmo__Square_Meters__c ? parseInt(unit.gbcinmo__Square_Meters__c, 10) : null;
                
                if(unit.gbcinmo__Property__r) {
                    this.filterElevator = unit.gbcinmo__Property__r.gbcinmo__Has_Elevator__c || false;
                    this.filterProvince = unit.gbcinmo__Property__r.gbcinmo__State_Province__c || null;
                }
            }
        }
    }

    @wire(getCompatibleRequests, { 
        listingId: '$recordId', operationType: '$filterOperation', maxBudget: '$filterBudget', 
        minBedrooms: '$filterBedrooms', stateProvince: '$filterProvince',
        minBathrooms: '$filterBathrooms', hasElevator: '$filterElevator', minSquareMeters: '$filterSquareMeters'
    })
    wiredRequests(result) {
        this.wiredRequestsResult = result;
        if (result.data) {
            this.requests = result.data.map(row => {
                let newRow = {};
                for (let key in row) { newRow[key.replace('gbcinmo__', '')] = row[key]; }
                newRow.RequestUrl = `/${newRow.Id}`; 
                return newRow;
            });
            this.isLoading = false;
        } else if (result.error) {
            this.isLoading = false;
        }
    }

    @wire(getPreviousMatches, { listingId: '$recordId' })
    wiredMatches(result) {
        this.wiredMatchesResult = result;
        if (result.data) {
            this.matches = result.data.map(row => {
                const reqInfo = row.gbcinmo__Property_Request__r || {};
                const reqId = row.gbcinmo__Property_Request__c;
                return {
                    Id: row.Id, MatchUrl: `/${row.Id}`, MatchRef: row.Name,
                    Status: row.gbcinmo__Match_Status__c,
                    RequestUrl: `/${reqId}`, RequestRef: reqInfo.Name,
                    ClientName: reqInfo.gbcinmo__Client_Name__c,
                    Budget: reqInfo.gbcinmo__Max_Budget__c
                };
            });
        }
    }

    handleFilterChange(event) {
        this.isLoading = true;
        const fieldName = event.target.name;
        if (fieldName === 'filterElevator') {
            this.filterElevator = event.target.checked;
        } else {
            const val = event.target.value;
            if (fieldName === 'filterOperation') this.filterOperation = val || null;
            if (fieldName === 'filterBudget') this.filterBudget = val ? parseFloat(val) : null;
            if (fieldName === 'filterBedrooms') this.filterBedrooms = val ? parseInt(val, 10) : null;
            if (fieldName === 'filterBathrooms') this.filterBathrooms = val ? parseInt(val, 10) : null;
            if (fieldName === 'filterSquareMeters') this.filterSquareMeters = val ? parseInt(val, 10) : null;
            if (fieldName === 'filterProvince') this.filterProvince = val || null;
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