import { LightningElement, wire } from 'lwc';
import getAvailableProperties from '@salesforce/apex/PropertyMapController.getAvailableProperties';

export default class GlobalPropertyMap extends LightningElement {
    mapMarkers;

    @wire(getAvailableProperties)
    wiredProperties({ error, data }) {
        if (data && data.length > 0) {
            // Transform Apex data to Google Maps required format
            this.mapMarkers = data.map(listing => {
                // Navigate relationships safely
                const unit = listing.gbcinmo__Property_Unit__r || {};
                const property = unit.gbcinmo__Property__r || {};
                const street = property.gbcinmo__Street__c || '';
                const state = property.gbcinmo__State_Province__c || '';

                return {
                    location: {
                        Street: street,
                        State: state,
                        Country: 'España'
                    },
                    title: listing.Name,
                    value: listing.Id,
                    description: `Location: ${street}, ${state}`,
                    icon: 'custom:custom85' // Red building icon
                };
            });
        } else if (error) {
            console.error('Error loading global map:', error);
        }
    }
}