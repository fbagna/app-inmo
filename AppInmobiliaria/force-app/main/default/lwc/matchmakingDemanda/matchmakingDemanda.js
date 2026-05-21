import { LightningElement, api, wire, track } from 'lwc';
import { ShowToastEvent } from 'lightning/platformShowToastEvent';
import { refreshApex } from '@salesforce/apex';
import getDatosDemanda from '@salesforce/apex/MatchmakingController.getDatosDemanda';
import getEncargosCompatibles from '@salesforce/apex/MatchmakingController.getEncargosCompatibles';
import getCrucesPreviosDemanda from '@salesforce/apex/MatchmakingController.getCrucesPreviosDemanda';
import crearPropuestasInversas from '@salesforce/apex/MatchmakingController.crearPropuestasInversas';

const COLUMNS = [
    { label: 'Ref Encargo', fieldName: 'EncargoUrl', type: 'url', typeAttributes: { label: { fieldName: 'Name' }, target: '_blank' } },
    { label: 'Precio', fieldName: 'Precio_Salida__c', type: 'currency' },
    { label: 'Habitaciones', fieldName: 'Habitaciones__c', type: 'number' },
    { label: 'Metros2', fieldName: 'Metros_Cuadrados__c', type: 'number' },
    { label: 'Provincia', fieldName: 'Provincia__c', type: 'text' }
];

const COLUMNS_CRUCES = [
    { label: 'Ref Cruce', fieldName: 'CruceUrl', type: 'url', typeAttributes: { label: { fieldName: 'RefCruce' }, target: '_blank' } },
    { label: 'Estado', fieldName: 'Estado', type: 'text' },
    { label: 'Encargo Sugerido', fieldName: 'EncargoUrl', type: 'url', typeAttributes: { label: { fieldName: 'RefEncargo' }, target: '_blank' } },
    { label: 'Precio', fieldName: 'Precio', type: 'currency' }
];

export default class MatchmakingDemanda extends LightningElement {
    @api recordId;
    @track encargos = [];
    @track cruces = [];
    columns = COLUMNS;
    columnsCruces = COLUMNS_CRUCES;
    selectedRows = [];
    isLoading = true;
    
    wiredEncargosResult;
    wiredCrucesResult;

    @track filtroOperacion = null;
    @track filtroPresupuesto = null;
    @track filtroHabitaciones = null;
    @track filtroBanos = null;
    @track filtroMetros = null;
    @track filtroProvincia = null;
    @track filtroAscensor = false;

    get opcionesOperacion() { return [{ label: 'Cualquiera', value: '' }, { label: 'Compra', value: 'Compra' }, { label: 'Alquiler', value: 'Alquiler' }, { label: 'Traspaso', value: 'Traspaso' }]; }
    
    get opcionesProvincia() {
        return [
            { label: 'Todas', value: '' },
            { label: 'A Coruña', value: 'A Coruña' },
            { label: 'Álava', value: 'Álava' },
            { label: 'Albacete', value: 'Albacete' },
            { label: 'Alicante', value: 'Alicante' },
            { label: 'Almería', value: 'Almería' },
            { label: 'Asturias', value: 'Asturias' },
            { label: 'Ávila', value: 'Ávila' },
            { label: 'Badajoz', value: 'Badajoz' },
            { label: 'Baleares', value: 'Baleares' },
            { label: 'Barcelona', value: 'Barcelona' },
            { label: 'Burgos', value: 'Burgos' },
            { label: 'Cáceres', value: 'Cáceres' },
            { label: 'Cádiz', value: 'Cádiz' },
            { label: 'Cantabria', value: 'Cantabria' },
            { label: 'Castellón', value: 'Castellón' },
            { label: 'Ceuta', value: 'Ceuta' },
            { label: 'Ciudad Real', value: 'Ciudad Real' },
            { label: 'Córdoba', value: 'Córdoba' },
            { label: 'Cuenca', value: 'Cuenca' },
            { label: 'Girona', value: 'Girona' },
            { label: 'Granada', value: 'Granada' },
            { label: 'Guadalajara', value: 'Guadalajara' },
            { label: 'Gipuzkoa', value: 'Gipuzkoa' },
            { label: 'Huelva', value: 'Huelva' },
            { label: 'Huesca', value: 'Huesca' },
            { label: 'Jaén', value: 'Jaén' },
            { label: 'La Rioja', value: 'La Rioja' },
            { label: 'León', value: 'León' },
            { label: 'Lleida', value: 'Lleida' },
            { label: 'Lugo', value: 'Lugo' },
            { label: 'Madrid', value: 'Madrid' },
            { label: 'Málaga', value: 'Málaga' },
            { label: 'Melilla', value: 'Melilla' },
            { label: 'Murcia', value: 'Murcia' },
            { label: 'Navarra', value: 'Navarra' },
            { label: 'Ourense', value: 'Ourense' },
            { label: 'Palencia', value: 'Palencia' },
            { label: 'Pontevedra', value: 'Pontevedra' },
            { label: 'Salamanca', value: 'Salamanca' },
            { label: 'Santa Cruz de Tenerife', value: 'Santa Cruz de Tenerife' },
            { label: 'Segovia', value: 'Segovia' },
            { label: 'Sevilla', value: 'Sevilla' },
            { label: 'Soria', value: 'Soria' },
            { label: 'Tarragona', value: 'Tarragona' },
            { label: 'Teruel', value: 'Teruel' },
            { label: 'Toledo', value: 'Toledo' },
            { label: 'Valencia', value: 'Valencia' },
            { label: 'Valladolid', value: 'Valladolid' },
            { label: 'Vizcaya', value: 'Vizcaya' },
            { label: 'Zamora', value: 'Zamora' },
            { label: 'Zaragoza', value: 'Zaragoza' }
        ];
    }

    @wire(getDatosDemanda, { demandaId: '$recordId' })
    wiredDemanda({ error, data }) {
        if (data) {
            let n = {};
            for (let k in data) { n[k.replace('gbcinmo__', '')] = data[k]; }
            this.filtroOperacion = n.Tipo_Operacion_Buscada__c || null;
            this.filtroPresupuesto = n.Presupuesto_Maximo__c ? parseFloat(n.Presupuesto_Maximo__c) : null;
            this.filtroHabitaciones = n.Habitaciones_Minimas__c ? parseInt(n.Habitaciones_Minimas__c, 10) : null;
            this.filtroBanos = n.Banos_Minimos__c ? parseInt(n.Banos_Minimos__c, 10) : null;
            this.filtroMetros = n.Metros_Minimos__c ? parseInt(n.Metros_Minimos__c, 10) : null;
            this.filtroAscensor = n.Imprescindible_Ascensor__c || false;
            this.filtroProvincia = n.Provincia_Deseada__c || null;
        }
    }

    @wire(getEncargosCompatibles, { 
        demandaId: '$recordId', operacion: '$filtroOperacion', presupuesto: '$filtroPresupuesto', 
        habitaciones: '$filtroHabitaciones', banos: '$filtroBanos', ascensor: '$filtroAscensor', 
        provincia: '$filtroProvincia', metros: '$filtroMetros'
    })
    wiredEncargos(result) {
        this.wiredEncargosResult = result;
        if (result.data) {
            this.encargos = result.data.map(row => {
                let n = {};
                for (let k in row) { n[k.replace('gbcinmo__', '')] = row[k]; }
                n.EncargoUrl = `/${n.Id}`;
                const inm = n.gbcinmo__Inmueble_Asociado__r || n.Inmueble_Asociado__r || {};
                n.Habitaciones__c = inm.gbcinmo__Habitaciones__c || inm.Habitaciones__c;
                n.Metros_Cuadrados__c = inm.gbcinmo__Metros_Cuadrados__c || inm.Metros_Cuadrados__c;
                n.Provincia__c = inm.gbcinmo__Provincia__c || inm.Provincia__c;
                return n;
            });
            this.isLoading = false;
        } else if (result.error) { this.isLoading = false; }
    }

    @wire(getCrucesPreviosDemanda, { demandaId: '$recordId' })
    wiredCruces(result) {
        this.wiredCrucesResult = result;
        if (result.data) {
            this.cruces = result.data.map(row => {
                const enc = row.gbcinmo__Encargo__r || row.Encargo__r || {};
                const encId = row.gbcinmo__Encargo__c || row.Encargo__c;
                return {
                    Id: row.Id, CruceUrl: `/${row.Id}`, RefCruce: row.Name,
                    Estado: row.gbcinmo__Estado_Propuesta__c || row.Estado_Propuesta__c,
                    EncargoUrl: `/${encId}`, RefEncargo: enc.Name,
                    Precio: enc.gbcinmo__Precio_Salida__c || enc.Precio_Salida__c
                };
            });
        }
    }

    handleFilterChange(event) {
        this.isLoading = true;
        const name = event.target.name;
        if (name === 'filtroAscensor') { this.filtroAscensor = event.target.checked; } 
        else {
            const val = event.target.value;
            if (name === 'filtroOperacion') this.filtroOperacion = val || null;
            if (name === 'filtroPresupuesto') this.filtroPresupuesto = val ? parseFloat(val) : null;
            if (name === 'filtroHabitaciones') this.filtroHabitaciones = val ? parseInt(val, 10) : null;
            if (name === 'filtroBanos') this.filtroBanos = val ? parseInt(val, 10) : null;
            if (name === 'filtroMetros') this.filtroMetros = val ? parseInt(val, 10) : null;
            if (name === 'filtroProvincia') this.filtroProvincia = val || null;
        }
    }

    get hasData() { return this.encargos && this.encargos.length > 0; }
    get hasCruces() { return this.cruces && this.cruces.length > 0; }
    get isButtonDisabled() { return this.selectedRows.length === 0; }
    handleRowSelection(event) { this.selectedRows = event.detail.selectedRows.map(row => row.Id); }

    handleProponer() {
        this.isLoading = true;
        crearPropuestasInversas({ demandaId: this.recordId, encargoIds: this.selectedRows })
            .then(() => {
                this.dispatchEvent(new ShowToastEvent({ title: '¡Éxito!', message: 'Inmuebles propuestos al cliente.', variant: 'success' }));
                refreshApex(this.wiredCrucesResult);
                return refreshApex(this.wiredEncargosResult); 
            })
            .catch(error => { this.dispatchEvent(new ShowToastEvent({ title: 'Error', message: 'No se pudo guardar.', variant: 'error' })); })
            .finally(() => { this.isLoading = false; this.selectedRows = []; });
    }
}