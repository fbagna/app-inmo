import { LightningElement, wire } from 'lwc';
import { NavigationMixin } from 'lightning/navigation';
import getEncargosSinCruces from '@salesforce/apex/AlertasInmobiliariasController.getEncargosSinCruces';
import getEncargosCrucesPendientes from '@salesforce/apex/AlertasInmobiliariasController.getEncargosCrucesPendientes';
import getDemandasSinCruces from '@salesforce/apex/AlertasInmobiliariasController.getDemandasSinCruces';
import getDemandasCrucesPendientes from '@salesforce/apex/AlertasInmobiliariasController.getDemandasCrucesPendientes';
import getNoticiasVencidas from '@salesforce/apex/AlertasInmobiliariasController.getNoticiasVencidas';
import getNoticiasNuevas from '@salesforce/apex/AlertasInmobiliariasController.getNoticiasNuevas';

const COLUMNAS_ENCARGOS = [
    { label: 'Encargo', fieldName: 'urlRegistro', type: 'url', typeAttributes: { label: { fieldName: 'Name' }, target: '_blank' } },
    { label: 'Fase', fieldName: 'StageName', type: 'text' },
    { type: 'button', typeAttributes: { label: 'Ver', name: 'ver_registro', variant: 'base' } }
];

const COLUMNAS_DEMANDAS = [
    { label: 'Demanda', fieldName: 'urlRegistro', type: 'url', typeAttributes: { label: { fieldName: 'Name' }, target: '_blank' } },
    { label: 'Interesado', fieldName: 'interesadoAplanado', type: 'text' },
    { label: 'Operación', fieldName: 'operacionAplanada', type: 'text' },
    { type: 'button', typeAttributes: { label: 'Ver', name: 'ver_registro', variant: 'base' } }
];

const COLUMNAS_NOTICIAS = [
    { label: 'Noticia', fieldName: 'urlRegistro', type: 'url', typeAttributes: { label: { fieldName: 'Name' }, target: '_blank' } },
    { label: 'Estado', fieldName: 'estadoLimpio', type: 'text' },
    { label: 'Origen', fieldName: 'origenLimpio', type: 'text' },
    { label: 'Seguimiento', fieldName: 'fechaLimpia', type: 'date-local', typeAttributes: { month: '2-digit', day: '2-digit', year: 'numeric' } },
    { type: 'button', typeAttributes: { label: 'Ver', name: 'ver_registro', variant: 'base' } }
];

export default class PanelInmobiliario extends NavigationMixin(LightningElement) {

    // --- LÓGICA DE BOTONES DE CREACIÓN ---
    navNuevoEdificio() { this.navigateToNewRecord('gbcinmo__Edificio__c'); }
    navNuevoInmueble() { this.navigateToNewRecord('gbcinmo__Inmueble__c'); }
    navNuevoEncargo() { this.navigateToNewRecord('Opportunity'); } 
    navNuevoDemanda() { this.navigateToNewRecord('gbcinmo__Demanda__c'); }
    navNuevaNoticia() { this.navigateToNewRecord('gbcinmo__Noticia__c'); }

    navigateToNewRecord(objectApiName) {
        this[NavigationMixin.Navigate]({ type: 'standard__objectPage', attributes: { objectApiName: objectApiName, actionName: 'new' } });
    }

    // --- VARIABLES DE ALERTAS ---
    encargosSinCruces = []; contadorSinCruces = 0;
    encargosPendientes = []; contadorPendientes = 0;
    demandasSinCruces = []; contadorDemandasSinCruces = 0;
    demandasPendientes = []; contadorDemandasPendientes = 0;
    noticiasVencidas = []; contadorNoticiasVencidas = 0;
    noticiasNuevas = []; contadorNoticiasNuevas = 0;

    // --- VARIABLES DE LA TABLA COMPARTIDA ---
    datosTablaActual = [];
    tipoTablaActiva = '';
    columnasActuales = COLUMNAS_ENCARGOS; 
    objetoActivo = ''; 
    tituloTabla = '';
    mostrarTablaEncargos = false;
    mostrarTablaDemandas = false;
    mostrarTablaNoticias = false;

    // --- WIRES ---
    @wire(getEncargosSinCruces) wiredSinCruces({ data }) { if(data) { this.encargosSinCruces = data.map(r => ({ ...r, urlRegistro: `/lightning/r/Opportunity/${r.Id}/view` })); this.contadorSinCruces = data.length; } }
    @wire(getEncargosCrucesPendientes) wiredPendientes({ data }) { if(data) { this.encargosPendientes = data.map(r => ({ ...r, urlRegistro: `/lightning/r/Opportunity/${r.Id}/view` })); this.contadorPendientes = data.length; } }
    @wire(getDemandasSinCruces) wiredDemandasSinCruces({ data }) { if(data) { this.demandasSinCruces = data.map(r => this.formatearDemanda(r)); this.contadorDemandasSinCruces = data.length; } }
    @wire(getDemandasCrucesPendientes) wiredDemandasPendientes({ data }) { if(data) { this.demandasPendientes = data.map(r => this.formatearDemanda(r)); this.contadorDemandasPendientes = data.length; } }
    
    // Wires de Noticias (Aplanamos los datos por si hay namespaces)
    @wire(getNoticiasVencidas) wiredNoticiasVencidas({ data }) { if(data) { this.noticiasVencidas = data.map(r => this.formatearNoticia(r)); this.contadorNoticiasVencidas = data.length; } }
    @wire(getNoticiasNuevas) wiredNoticiasNuevas({ data }) { if(data) { this.noticiasNuevas = data.map(r => this.formatearNoticia(r)); this.contadorNoticiasNuevas = data.length; } }

    // --- FUNCIONES SALVAVIDAS (FORMATEO) ---
    formatearDemanda(record) {
        let nombreCliente = record.gbcinmo__Cliente_Interesado__r ? record.gbcinmo__Cliente_Interesado__r.Name : (record.Cliente_Interesado__r ? record.Cliente_Interesado__r.Name : '');
        return { ...record, urlRegistro: `/lightning/r/Demanda__c/${record.Id}/view`, interesadoAplanado: nombreCliente, operacionAplanada: record.gbcinmo__Tipo_Operacion_Buscada__c || record.Tipo_Operacion_Buscada__c };
    }

    formatearNoticia(record) {
        return {
            ...record,
            urlRegistro: `/lightning/r/gbcinmo__Noticia__c/${record.Id}/view`,
            estadoLimpio: record.gbcinmo__Estado__c || record.Estado__c,
            // AQUÍ ESTABA EL ERROR: Actualizado a Origen__c y Fecha_Seguimiento__c
            origenLimpio: record.gbcinmo__Origen__c || record.Origen__c,
            fechaLimpia: record.gbcinmo__Fecha_Seguimiento__c || record.Fecha_Seguimiento__c
        };
    }

    // --- ACCIONES DE BOTONES ---
    toggleTabla(datos, tipo, columnas, objeto, titulo) {
        if (this.tipoTablaActiva === tipo) {
            this.mostrarTablaEncargos = false; this.mostrarTablaDemandas = false; this.mostrarTablaNoticias = false; this.tipoTablaActiva = ''; return;
        } 
        this.columnasActuales = columnas; this.datosTablaActual = datos; this.tipoTablaActiva = tipo; this.objetoActivo = objeto; this.tituloTabla = titulo;

        this.mostrarTablaEncargos = tipo.startsWith('ENC_');
        this.mostrarTablaDemandas = tipo.startsWith('DEM_');
        this.mostrarTablaNoticias = tipo.startsWith('NOT_');
    }

    toggleTablaEncargosSinCruces() { this.toggleTabla(this.encargosSinCruces, 'ENC_SIN_CRUCES', COLUMNAS_ENCARGOS, 'Opportunity', 'Encargos sin buscar cruces'); }
    toggleTablaEncargosPendientes() { this.toggleTabla(this.encargosPendientes, 'ENC_PENDIENTES', COLUMNAS_ENCARGOS, 'Opportunity', 'Encargos con cruces sin revisar'); }
    toggleTablaDemandasSinCruces() { this.toggleTabla(this.demandasSinCruces, 'DEM_SIN_CRUCES', COLUMNAS_DEMANDAS, 'Demanda__c', 'Demandas sin buscar cruces'); }
    toggleTablaDemandasPendientes() { this.toggleTabla(this.demandasPendientes, 'DEM_PENDIENTES', COLUMNAS_DEMANDAS, 'Demanda__c', 'Demandas con cruces sin revisar'); }
    toggleTablaNoticiasVencidas() { this.toggleTabla(this.noticiasVencidas, 'NOT_VENCIDAS', COLUMNAS_NOTICIAS, 'gbcinmo__Noticia__c', 'Seguimientos Vencidos'); }
    toggleTablaNoticiasNuevas() { this.toggleTabla(this.noticiasNuevas, 'NOT_NUEVAS', COLUMNAS_NOTICIAS, 'gbcinmo__Noticia__c', 'Nuevos rumores por investigar'); }

    handleRowAction(event) {
        this[NavigationMixin.Navigate]({ type: 'standard__recordPage', attributes: { recordId: event.detail.row.Id, objectApiName: this.objetoActivo, actionName: 'view' } });
    }
}