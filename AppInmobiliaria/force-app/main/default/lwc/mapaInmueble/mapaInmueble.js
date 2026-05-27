import { LightningElement, api, wire } from 'lwc';
import { getRecord, getFieldValue } from 'lightning/uiRecordApi';

// Quitamos el prefijo gbcinmo__ porque Salesforce lo autocompleta por detrás
import NAME_FIELD from '@salesforce/schema/Inmueble__c.Name';
import DIRECCION_FIELD from '@salesforce/schema/Inmueble__c.Direccion_Matchmaking__c';
import PROVINCIA_FIELD from '@salesforce/schema/Inmueble__c.Provincia_Matchmaking__c';

export default class MapaInmueble extends LightningElement {
    @api recordId;
    mapMarkers;

    @wire(getRecord, { 
        recordId: '$recordId', 
        fields: [NAME_FIELD, DIRECCION_FIELD, PROVINCIA_FIELD] 
    })
    wiredRecord({ error, data }) {
        if (data) {
            const calle = getFieldValue(data, DIRECCION_FIELD);
            const provincia = getFieldValue(data, PROVINCIA_FIELD);
            const nombre = getFieldValue(data, NAME_FIELD);

            if (calle) {
                this.mapMarkers = [
                    {
                        location: {
                            Street: calle,
                            State: provincia,
                            Country: 'España'
                        },
                        title: nombre,
                        description: `Dirección: ${calle}, ${provincia || ''}`,
                        icon: 'standard:location'
                    }
                ];
            }
        } else if (error) {
            console.error('Error cargando el mapa: ', error);
        }
    }
}