import { track } from 'lwc';
import LightningModal from 'lightning/modal';
import { createRecord } from 'lightning/uiRecordApi';
import { ShowToastEvent } from 'lightning/platformShowToastEvent';

/* ========================================================================= */
/* --- CUSTOM LABELS METADATA DICTIONARY LINKAGE (ZERO HARDCODE) ---------- */
/* ========================================================================= */
import modalTitleLbl from '@salesforce/label/c.PropertyModalTitle';
import addressFieldLbl from '@salesforce/label/c.PropertyAddressLabel';
import sectionSpecsLbl from '@salesforce/label/c.PropertySectionSpecs';
import quickAddLinkLbl from '@salesforce/label/c.PropertyQuickAddLink';
import quickAddHeaderLbl from '@salesforce/label/c.PropertyQuickAddHeader';
import firstNameLbl from '@salesforce/label/c.PropertyFirstNameLabel';
import lastNameLbl from '@salesforce/label/c.PropertyLastNameLabel';
import cancelLinkLbl from '@salesforce/label/c.PropertyCancelLink';
import btnCancelLbl from '@salesforce/label/c.PropertyBtnCancel';
import btnSaveLbl from '@salesforce/label/c.PropertyBtnSave';
import toastAttentionTitle from '@salesforce/label/c.PropertyToastAttention';
import toastAttentionMsg from '@salesforce/label/c.PropertyToastAttentionMsg';
import toastBackgroundError from '@salesforce/label/c.PropertyToastBackgroundError';
import toastSuccessTitle from '@salesforce/label/c.PropertyToastSuccessTitle';
import toastSuccessMsg from '@salesforce/label/c.PropertyToastSuccessMsg';

export default class NewPropertyCreator extends LightningModal {
    
    /* Bind imported unifed platform references local schema access tokens */
    labels = {
        modalTitle: modalTitleLbl,
        addressLabel: addressFieldLbl,
        sectionSpecs: sectionSpecsLbl,
        quickAddLink: quickAddLinkLbl,
        quickAddHeader: quickAddHeaderLbl,
        firstNameLabel: firstNameLbl,
        lastNameLabel: lastNameLbl,
        cancelLink: cancelLinkLbl,
        btnCancel: btnCancelLbl,
        btnSave: btnSaveLbl,
        attentionTitle: toastAttentionTitle,
        attentionMsg: toastAttentionMsg,
        backgroundError: toastBackgroundError,
        successTitle: toastSuccessTitle,
        successMsg: toastSuccessMsg
    };

    @track locationData = { country: '', state: '', city: '', neighborhood: '' };
    @track isFormReady = false;
    @track isQuickAddDoorman = false;

    handleFormLoaded() {
        this.isFormReady = true;
    }

    get computedGridClass() {
        return this.isFormReady 
            ? 'slds-grid slds-wrap slds-gutters slds-p-around_small' 
            : 'slds-grid slds-wrap slds-gutters slds-p-around_small slds-hide';
    }

    /* Intercepts cascading events emitted from the local sub-component map boundaries */
    handleLocationChange(event) {
        this.locationData.country = event.detail.country;
        this.locationData.state = event.detail.state;
        this.locationData.city = event.detail.city;
        this.locationData.neighborhood = event.detail.neighborhood;
    }

    toggleDoormanMode(event) {
        event.preventDefault();
        this.isQuickAddDoorman = !this.isQuickAddDoorman;
    }

    /**
     * @description Orchestrates form validation layers and submits packaged metadata matrices.
     */
    async handleSubmit(event) {
        event.preventDefault(); 
        
        const fields = event.detail.fields;

        // Perform internal location selections tracking validation lookups
        const locationCmp = this.template.querySelector('c-location-selector');
        const isLocationValid = locationCmp ? locationCmp.validate() : true;

        if (!isLocationValid) {
            this.showToast(this.labels.attentionTitle, this.labels.attentionMsg, 'warning');
            return;
        }

        // Validate programmatic rapid contact onboarding elements rules
        if (this.isQuickAddDoorman) {
            const lastNameCmp = this.template.querySelector('[data-id="doormanLast"]');
            if (lastNameCmp) {
                lastNameCmp.reportValidity();
                if (!lastNameCmp.checkValidity()) return;
            }
        }

        this.isFormReady = false; 

        try {
            // Process transactional rapid programmatic doorman contact payload creation
            if (this.isQuickAddDoorman) {
                const firstName = this.template.querySelector('[data-id="doormanFirst"]').value;
                const lastName = this.template.querySelector('[data-id="doormanLast"]').value;

                const contactFields = { 'FirstName': firstName, 'LastName': lastName };
                const contactRecordInput = { apiName: 'Contact', fields: contactFields };
                
                const newContact = await createRecord(contactRecordInput);
                fields['gbcinmo__Doorman__c'] = newContact.id; 
            }

            // Map safe location payload strings mapping variables back into the operational transaction form fields array
            fields['gbcinmo__Country__c'] = this.locationData.country;
            fields['gbcinmo__State_Province__c'] = this.locationData.state; // Corrected to match custom picklist API schema tokens
            fields['gbcinmo__City__c'] = this.locationData.city;
            fields['gbcinmo__Neighborhood__c'] = this.locationData.neighborhood;

            // Submit verified context blocks parameters down to standard system platform data pipelines
            this.template.querySelector('lightning-record-edit-form').submit(fields);
        } catch (error) {
            console.error('Programmatic DML Chain Exception Error:', error);
            this.showToast('Error', this.labels.backgroundError, 'error');
            this.isFormReady = true;
        }
    }

    handleSuccess(event) {
        this.showToast(this.labels.successTitle, this.labels.successMsg, 'success');
        this.close(event.detail.id); // Returns the newly created property ID back to the main dashboard sub-system listener loops
    }

    handleError(event) {
        console.error('Form execution DML Exception tracker:', event.detail.detail);
        this.showToast('Database Error', event.detail.message, 'error');
        this.isFormReady = true;
    }

    handleCancel() {
        this.close(null);
    }

    showToast(title, message, variant) {
        this.dispatchEvent(new ShowToastEvent({ title, message, variant }));
    }
}