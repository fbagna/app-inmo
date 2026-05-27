import { LightningElement } from 'lwc';
import { NavigationMixin } from 'lightning/navigation';

export default class PanelInmobiliario extends NavigationMixin(LightningElement) {

    navNuevoEdificio() { this.navigateToNewRecord('gbcinmo__Edificio__c'); }
    navNuevoInmueble() { this.navigateToNewRecord('gbcinmo__Inmueble__c'); }
    navNuevoEncargo() { this.navigateToNewRecord('Opportunity'); } // Objeto estándar, va sin prefijo
    navNuevoDemanda() { this.navigateToNewRecord('gbcinmo__Demanda__c'); }

    navigateToNewRecord(objectApiName) {
        this[NavigationMixin.Navigate]({
            type: 'standard__objectPage',
            attributes: {
                objectApiName: objectApiName,
                actionName: 'new'
            }
        });
    }
}