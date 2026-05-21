import { LightningElement, api, wire, track } from 'lwc';
import { ShowToastEvent } from 'lightning/platformShowToastEvent';
import { refreshApex } from '@salesforce/apex';
import getDatosEncargo from '@salesforce/apex/MatchmakingController.getDatosEncargo';
import getDemandasCompatibles from '@salesforce/apex/MatchmakingController.getDemandasCompatibles';
import getCrucesPrevios from '@salesforce/apex/MatchmakingController.getCrucesPrevios';
import crearPropuestas from '@salesforce/apex/MatchmakingController.crearPropuestas';

const COLUMNS = [
    { label: 'Ref', fieldName: 'DemandaUrl', type: 'url', typeAttributes: { label: { fieldName: 'Name' }, target: '_blank' } },
    { label: 'Interesado', fieldName: 'Nombre_del_Interesado__c', type: 'text' },
    { label: 'Presupuesto Máx', fieldName: 'Presupuesto_Maximo__c', type: 'currency' },
    { label: 'Habitaciones', fieldName: 'Habitaciones_Minimas__c', type: 'number' },
    { label: 'Población', fieldName: 'Poblacion_Deseada__c', type: 'text' }
];

const COLUMNS_CRUCES = [
    { label: 'Ref Cruce', fieldName: 'CruceUrl', type: 'url', typeAttributes: { label: { fieldName: 'RefCruce' }, target: '_blank' } },
    { label: 'Estado', fieldName: 'Estado', type: 'text' },
    { label: 'Ref Cliente', fieldName: 'DemandaUrl', type: 'url', typeAttributes: { label: { fieldName: 'RefDemanda' }, target: '_blank' } },
    { label: 'Interesado', fieldName: 'Interesado', type: 'text' },
    { label: 'Presupuesto', fieldName: 'Presupuesto', type: 'currency' }
];

export default class MatchmakingEngine extends LightningElement {
    @api recordId;
    
    @track demandas = [];
    @track cruces = [];
    columns = COLUMNS;
    columnsCruces = COLUMNS_CRUCES;
    selectedRows = [];
    isLoading = true;
    
    wiredDemandasResult;
    wiredCrucesResult;

    @track filtroOperacion = null;
    @track filtroPresupuesto = null;
    @track filtroHabitaciones = null;
    @track filtroBanos = null;
    @track filtroProvincia = null;
    @track filtroAscensor = false;

    get opcionesOperacion() {
        return [{ label: 'Cualquiera', value: '' }, { label: 'Compra', value: 'Compra' }, { label: 'Alquiler', value: 'Alquiler' }, { label: 'Traspaso', value: 'Traspaso' }];
    }

    get opcionesProvincia() {
        return [{ label: 'Todas', value: '' }, { label: 'Madrid', value: 'Madrid' }, { label: 'Barcelona', value: 'Barcelona' }]; // Simplificado en JS, tú mantén tu lista completa
    }

    @wire(getDatosEncargo, { encargoId: '$recordId' })
    wiredEncargo({ error, data }) {
        if (data) {
            let normData = {};
            for (let key in data) { normData[key.replace('gbcinmo__', '')] = data[key]; }
            
            this.filtroOperacion = normData.Tipo_Operacion__c === 'Venta' ? 'Compra' : normData.Tipo_Operacion__c;
            this.filtroPresupuesto = normData.Precio_Salida__c ? parseFloat(normData.Precio_Salida__c) : null;
            
            if (normData.Inmueble_Asociado__r) {
                let normInmueble = {};
                for (let key in normData.Inmueble_Asociado__r) { normInmueble[key.replace('gbcinmo__', '')] = normData.Inmueble_Asociado__r[key]; }
                
                this.filtroHabitaciones = normInmueble.Habitaciones__c ? parseInt(normInmueble.Habitaciones__c, 10) : null;
                this.filtroBanos = normInmueble.Banos__c ? parseInt(normInmueble.Banos__c, 10) : null;
                this.filtroAscensor = normInmueble.Tiene_Ascensor__c || false;
                this.filtroProvincia = normInmueble.Provincia__c || null;
            }
        }
    }

    @wire(getDemandasCompatibles, { 
        encargoId: '$recordId', operacion: '$filtroOperacion', presupuesto: '$filtroPresupuesto', 
        habitaciones: '$filtroHabitaciones', provincia: '$filtroProvincia',
        banos: '$filtroBanos', ascensor: '$filtroAscensor'
    })
    wiredDemandas(result) {
        this.wiredDemandasResult = result;
        if (result.data) {
            this.demandas = result.data.map(row => {
                let newRow = {};
                for (let key in row) { newRow[key.replace('gbcinmo__', '')] = row[key]; }
                newRow.DemandaUrl = `/${newRow.Id}`; 
                return newRow;
            });
            this.isLoading = false;
        } else if (result.error) {
            this.isLoading = false;
        }
    }

    @wire(getCrucesPrevios, { encargoId: '$recordId' })
    wiredCruces(result) {
        this.wiredCrucesResult = result;
        if (result.data) {
            this.cruces = result.data.map(row => {
                const demandaInfo = row.gbcinmo__Demanda__r || row.Demanda__r || {};
                const demandaId = row.gbcinmo__Demanda__c || row.Demanda__c;
                return {
                    Id: row.Id,
                    CruceUrl: `/${row.Id}`,
                    RefCruce: row.Name,
                    Estado: row.gbcinmo__Estado_Propuesta__c || row.Estado_Propuesta__c,
                    DemandaUrl: `/${demandaId}`,
                    RefDemanda: demandaInfo.Name,
                    Interesado: demandaInfo.gbcinmo__Nombre_del_Interesado__c || demandaInfo.Nombre_del_Interesado__c,
                    Presupuesto: demandaInfo.gbcinmo__Presupuesto_Maximo__c || demandaInfo.Presupuesto_Maximo__c
                };
            });
        }
    }

    handleFilterChange(event) {
        this.isLoading = true;
        const fieldName = event.target.name;
        
        if (fieldName === 'filtroAscensor') {
            this.filtroAscensor = event.target.checked;
        } else {
            const val = event.target.value;
            if (fieldName === 'filtroOperacion') this.filtroOperacion = val || null;
            if (fieldName === 'filtroPresupuesto') this.filtroPresupuesto = val ? parseFloat(val) : null;
            if (fieldName === 'filtroHabitaciones') this.filtroHabitaciones = val ? parseInt(val, 10) : null;
            if (fieldName === 'filtroBanos') this.filtroBanos = val ? parseInt(val, 10) : null;
            if (fieldName === 'filtroProvincia') this.filtroProvincia = val || null;
        }
    }

    get hasData() { return this.demandas && this.demandas.length > 0; }
    get hasCruces() { return this.cruces && this.cruces.length > 0; }
    get isButtonDisabled() { return this.selectedRows.length === 0; }

    handleRowSelection(event) {
        this.selectedRows = event.detail.selectedRows.map(row => row.Id);
    }

    handleProponer() {
        this.isLoading = true;
        crearPropuestas({ encargoId: this.recordId, demandaIds: this.selectedRows })
            .then(() => {
                this.showToast('¡Éxito!', 'Propuestas creadas correctamente.', 'success');
                refreshApex(this.wiredCrucesResult);
                return refreshApex(this.wiredDemandasResult); 
            })
            .catch(error => {
                this.showToast('Error', 'No se pudieron crear las propuestas.', 'error');
            })
            .finally(() => {
                this.isLoading = false;
                this.selectedRows = []; 
            });
    }

    showToast(title, message, variant) {
        this.dispatchEvent(new ShowToastEvent({ title, message, variant }));
    }
}