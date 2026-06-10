import { LightningElement, track, wire, api } from 'lwc';
import getLocations from '@salesforce/apex/LocationSelectorController.getLocations';

/* Custom Labels */
import TITLE from '@salesforce/label/c.LocationSearchTitle';
import COUNTRY_LBL from '@salesforce/label/c.CountryLabel';
import COUNTRY_PH from '@salesforce/label/c.CountryPlaceholder';
import STATE_LBL from '@salesforce/label/c.StateLabel';
import STATE_PH from '@salesforce/label/c.StatePlaceholder';
import CITY_LBL from '@salesforce/label/c.CityLabel';
import CITY_PH from '@salesforce/label/c.CityPlaceholder';
import NEIGHBORHOOD_LBL from '@salesforce/label/c.NeighborhoodLabel';
import NEIGHBORHOOD_PH from '@salesforce/label/c.NeighborhoodPlaceholder';
import LOADING from '@salesforce/label/c.LoadingText';

export default class LocationSelector extends LightningElement {
    
    /* Expose labels to the template */
    labels = {
        title: TITLE,
        country: COUNTRY_LBL, countryPlaceholder: COUNTRY_PH,
        state: STATE_LBL, statePlaceholder: STATE_PH,
        city: CITY_LBL, cityPlaceholder: CITY_PH,
        neighborhood: NEIGHBORHOOD_LBL, neighborhoodPlaceholder: NEIGHBORHOOD_PH,
        loading: LOADING
    };

    /* Variables for IDs */
    @track selectedCountryId = '';
    @track selectedStateId = '';
    @track selectedCityId = '';
    @track selectedNeighborhoodId = '';

    /* Variables for text names (to be saved in the target objects) */
    @api selectedCountryName = '';
    @api selectedStateName = '';
    @api selectedCityName = '';
    @api selectedNeighborhoodName = '';

    /* Option lists for Comboboxes */
    @track countryOptions = [];
    @track stateOptions = [];
    @track cityOptions = [];
    @track neighborhoodOptions = [];

    /* Loading states */
    @track isLoadingCountries = true;
    @track isFetchingData = false;

    /* Fetch initial Root Level (Countries) and set default country */
    @wire(getLocations, { level: 'Country', parentId: null })
    wiredCountries({ error, data }) {
        this.isLoadingCountries = false;
        if (data) {
            this.countryOptions = data.map(loc => ({ label: loc.Name, value: loc.Id }));
            
            // AUTOMATIC PRE-SELECTION: Search for 'España' to set it as default
            const defaultCountry = data.find(loc => loc.Name === 'España');
            if (defaultCountry) {
                this.selectedCountryId = defaultCountry.Id;
                this.selectedCountryName = defaultCountry.Name;
                
                // Immediately pre-fetch its States/Provinces in background
                this.fetchChildren('State', this.selectedCountryId, 'stateOptions');
                this.dispatchSelection();
            }
        } else if (error) {
            console.error('Error fetching countries:', error);
        }
    }

    /* Handlers */
    handleCountryChange(event) {
        this.selectedCountryId = event.detail.value;
        this.selectedCountryName = event.target.options.find(opt => opt.value === this.selectedCountryId).label;
        
        this.selectedStateId = ''; this.selectedStateName = '';
        this.selectedCityId = '';  this.selectedCityName = '';
        this.selectedNeighborhoodId = ''; this.selectedNeighborhoodName = '';
        
        this.stateOptions = [];
        this.cityOptions = [];
        this.neighborhoodOptions = [];
        
        this.fetchChildren('State', this.selectedCountryId, 'stateOptions');
        this.dispatchSelection();
    }

    handleStateChange(event) {
        this.selectedStateId = event.detail.value;
        this.selectedStateName = event.target.options.find(opt => opt.value === this.selectedStateId).label;
        
        this.selectedCityId = ''; this.selectedCityName = '';
        this.selectedNeighborhoodId = ''; this.selectedNeighborhoodName = '';
        
        this.cityOptions = [];
        this.neighborhoodOptions = [];
        
        this.fetchChildren('City', this.selectedStateId, 'cityOptions');
        this.dispatchSelection();
    }

    handleCityChange(event) {
        this.selectedCityId = event.detail.value;
        this.selectedCityName = event.target.options.find(opt => opt.value === this.selectedCityId).label;
        
        this.selectedNeighborhoodId = ''; this.selectedNeighborhoodName = '';
        this.neighborhoodOptions = [];
        
        this.fetchChildren('Neighborhood', this.selectedCityId, 'neighborhoodOptions');
        this.dispatchSelection();
    }

    handleNeighborhoodChange(event) {
        this.selectedNeighborhoodId = event.detail.value;
        this.selectedNeighborhoodName = event.target.options.find(opt => opt.value === this.selectedNeighborhoodId).label;
        this.dispatchSelection();
    }

    /* Helper: Imperative Apex Call for dynamic children fetching */
    fetchChildren(targetLevel, parentRecordId, targetList) {
        if (!parentRecordId) return;
        
        this.isFetchingData = true;
        getLocations({ level: targetLevel, parentId: parentRecordId })
            .then(result => {
                this[targetList] = result.map(loc => ({ label: loc.Name, value: loc.Id }));
            })
            .catch(error => {
                console.error(`Error fetching ${targetLevel}:`, error);
            })
            .finally(() => {
                this.isFetchingData = false;
            });
    }

    /* Dispatch custom event to notify parent forms of the selection */
    dispatchSelection() {
        const selectionEvent = new CustomEvent('locationchange', {
            detail: {
                country: this.selectedCountryName,
                state: this.selectedStateName,
                city: this.selectedCityName,
                neighborhood: this.selectedNeighborhoodName
            }
        });
        this.dispatchEvent(selectionEvent);
    }

    /* Computed properties for disabled states */
    get isStateDisabled() { return !this.selectedCountryId || this.stateOptions.length === 0; }
    get isCityDisabled() { return !this.selectedStateId || this.cityOptions.length === 0; }
    get isNeighborhoodDisabled() { return !this.selectedCityId || this.neighborhoodOptions.length === 0; }

    /* Expose programmatic validation check to the parent modal container */
    @api
    validate() {
        const allValid = [...this.template.querySelectorAll('lightning-combobox')]
            .reduce((validSoFar, combobox) => {
                combobox.reportValidity();
                return validSoFar && combobox.checkValidity();
            }, true);
        return allValid;
    }
}