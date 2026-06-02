import { LightningElement, api, wire } from 'lwc';
import { getRecord, getFieldValue } from 'lightning/uiRecordApi';

// Import fields without the namespace prefix (LWC compiler requirement)
import STREET_FIELD from '@salesforce/schema/Property_Unit__c.Property__r.Street__c';
import STATE_FIELD from '@salesforce/schema/Property_Unit__c.Property__r.State_Province__c';
import ZIP_FIELD from '@salesforce/schema/Property_Unit__c.Property__r.Zip_Code__c';

const fields = [STREET_FIELD, STATE_FIELD, ZIP_FIELD];

export default class PropertyUnitMap extends LightningElement {
    @api recordId;
    mapMarkers;

    @wire(getRecord, { recordId: '$recordId', fields })
    wiredRecord({ error, data }) {
        if (data) {
            const street = getFieldValue(data, STREET_FIELD) || '';
            const state = getFieldValue(data, STATE_FIELD) || '';
            const zip = getFieldValue(data, ZIP_FIELD) || '';

            if (street || state || zip) {
                this.mapMarkers = [{
                    location: {
                        Street: street,
                        State: state,
                        PostalCode: zip,
                        Country: 'Spain'
                    },
                    title: 'Property Location',
                    icon: 'custom:custom85'
                }];
            }
        } else if (error) {
            console.error('Error loading property map:', error);
        }
    }
}