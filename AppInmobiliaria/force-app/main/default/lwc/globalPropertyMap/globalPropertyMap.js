import { LightningElement, wire } from 'lwc';
import getAvailableProperties from '@salesforce/apex/PropertyMapController.getAvailableProperties';

/* Import Custom Labels for full localization support */
import cardTitleLbl from '@salesforce/label/c.Map_Card_Title';
import searchingTextLbl from '@salesforce/label/c.Map_Searching_Text';
import labelPrefixLbl from '@salesforce/label/c.Map_Label_Prefix';

export default class GlobalPropertyMap extends LightningElement {
    mapMarkers;

    /* Bind imported labels locally */
    labels = {
        cardTitle: cardTitleLbl,
        searchingText: searchingTextLbl,
        labelPrefix: labelPrefixLbl
    };

    @wire(getAvailableProperties)
    wiredProperties({ error, data }) {
        if (data && data.length > 0) {
            this.mapMarkers = data.map(listing => {
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
                    description: `${this.labels.labelPrefix}: ${street}, ${state}`,
                    icon: 'custom:custom85'
                };
            });
        } else if (error) {
            console.error('Error loading global map:', error);
        }
    }
}