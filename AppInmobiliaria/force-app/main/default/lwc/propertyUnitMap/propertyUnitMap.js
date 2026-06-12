import { LightningElement, api, wire } from 'lwc';
import { getRecord, getFieldValue } from 'lightning/uiRecordApi';

/* * AppExchange Gold Rule: Do not include the namespace prefix inside schema imports. 
 * The LWC compiler automatically injects the active package namespace prefix during packaging/runtime.
 */
import STREET_FIELD from '@salesforce/schema/Property_Unit__c.Property__r.Street__c';
import STATE_FIELD from '@salesforce/schema/Property_Unit__c.Property__r.State_Province__c';
import ZIP_FIELD from '@salesforce/schema/Property_Unit__c.Property__r.Zip_Code__c';
import CITY_FIELD from '@salesforce/schema/Property_Unit__c.Property__r.City__c';

/* Import existing localized Custom Labels for Zero-Hardcode compliance */
import labelLocationPrefix from '@salesforce/label/c.Map_Label_Prefix';
import labelSearchingText from '@salesforce/label/c.Map_Searching_Text';

const fields = [STREET_FIELD, STATE_FIELD, ZIP_FIELD, CITY_FIELD];

export default class PropertyUnitMap extends LightningElement {
    @api recordId; // Automatically captures the active Property Unit Record Id
    mapMarkers;

    /* Bind imported labels locally for HTML template access */
    labels = {
        cardTitle: labelLocationPrefix,
        searchingText: labelSearchingText
    };

    @wire(getRecord, { recordId: '$recordId', fields })
    wiredRecord({ error, data }) {
        if (data) {
            // Extract values traversing securely from the child Unit to the parent Building fields tokens
            const street = getFieldValue(data, STREET_FIELD) || '';
            const state = getFieldValue(data, STATE_FIELD) || '';
            const zip = getFieldValue(data, ZIP_FIELD) || '';
            const city = getFieldValue(data, CITY_FIELD) || '';

            if (street || state || zip || city) {
                this.mapMarkers = [{
                    location: {
                        Street: street,
                        State: state,
                        PostalCode: zip,
                        City: city,
                        Country: 'España' // Preserves Google Maps API geocoding precision for the Spanish market
                    },
                    title: street ? street : this.labels.cardTitle,
                    icon: 'custom:custom24' // Standard building icon reference
                }];
            } else {
                this.mapMarkers = null;
            }
        } else if (error) {
            console.error('Error executing background cross-object location tracking query:', error);
            this.mapMarkers = null;
        }
    }
}