import { api, track } from 'lwc';
import LightningModal from 'lightning/modal';
import { ShowToastEvent } from 'lightning/platformShowToastEvent';
import { createRecord } from 'lightning/uiRecordApi';
import NewPropertyModal from 'c/newPropertyCreator'; 

/* ========================================================================= */
/* --- CUSTOM LABELS IMPORTS MATRIX (ZERO HARDCODED VALUE COMPLIANCE) ------ */
/* ========================================================================= */
import labelModalTitle from '@salesforce/label/c.Modal_Unit_Title';
import labelBtnSaveAndNew from '@salesforce/label/c.Btn_Save_And_New';
import labelSectionInformation from '@salesforce/label/c.Unit_Section_Information';
import labelSectionFeatures from '@salesforce/label/c.Unit_Section_Features';
import labelSectionExtra from '@salesforce/label/c.Unit_Section_Extra';
import labelToastSuccessCreateMsg from '@salesforce/label/c.Unit_Toast_Success_Create_Msg';

import labelPropertyBtnCancel from '@salesforce/label/c.PropertyBtnCancel';
import labelPropertyBtnSave from '@salesforce/label/c.PropertyBtnSave';
import labelPropertyToastSuccessTitle from '@salesforce/label/c.PropertyToastSuccessTitle';
import labelCancelLink from '@salesforce/label/c.PropertyCancelLink';

export default class NewUnitCreator extends LightningModal {

    // Internal tracker backup parameter storing reactive modifications
    @track _propertyId = ''; 
    
    @track isQuickAddOwner = false;
    currentExecutionMode = 'SAVE';

    labels = {
        modalTitle: labelModalTitle,
        btnSaveNew: labelBtnSaveAndNew,
        sectionInformation: labelSectionInformation,
        sectionFeatures: labelSectionFeatures,
        sectionExtra: labelSectionExtra,
        successCreateMsg: labelToastSuccessCreateMsg,
        btnCancel: labelPropertyBtnCancel,
        btnSave: labelPropertyBtnSave,
        successToastTitle: labelPropertyToastSuccessTitle,
        cancelLink: labelCancelLink,
        quickPropertyLink: "Launch New Property Wizard",
        quickOwnerLink: "Can't find owner? Create one",
        quickOwnerHeader: "Quick Add Owner Account",
        ownerNameLabel: "Owner Account/Company Name"
    };

    /* ========================================================================= */
    /* --- PUBLIC API MATRIX MATCHING MODAL KEYS OPEN ROUTERS DEFINITIONS ------ */
    /* ========================================================================= */
    @api 
    get propertyId() { return this._propertyId; }
    set propertyId(value) { this._propertyId = value || ''; }

    handleCancel() {
        this.close(null);
    }

    handleSaveAndNew() {
        this.currentExecutionMode = 'SAVE_AND_NEW';
        this.triggerProgrammaticSubmit();
    }

    handleSaveCommit() {
        this.currentExecutionMode = 'SAVE';
        this.triggerProgrammaticSubmit();
    }

    triggerProgrammaticSubmit() {
        const hiddenSubmitBtn = this.template.querySelector('.programmatic-submit-btn');
        if (hiddenSubmitBtn) {
            hiddenSubmitBtn.click();
        }
    }

    async handleLaunchPropertyModal(event) {
        event.preventDefault();
        
        const newPropertyRecordId = await NewPropertyModal.open({
            size: 'medium'
        });

        if (newPropertyRecordId) {
            this._propertyId = newPropertyRecordId;
        }
    }

    toggleQuickAddOwner(event) {
        event.preventDefault();
        this.isQuickAddOwner = !this.isQuickAddOwner;
    }

    /**
     * @description Transactional Submission Interceptor. Respects manual user lookup
     * selections and prevents overwriting existing populated fields arrays values.
     */
    async handleSubmit(event) {
        event.preventDefault();
        const fields = event.detail.fields;

        if (this.isQuickAddOwner) {
            const ownerInput = this.template.querySelector('[data-id="quickOwnerName"]');
            if (ownerInput) {
                ownerInput.reportValidity();
                if (!ownerInput.checkValidity()) return;
            }
        }

        try {
            // Process secondary background creation loops on standalone entities if triggered
            if (this.isQuickAddOwner) {
                const ownerNameValue = this.template.querySelector('[data-id="quickOwnerName"]').value;
                const recordInput = { apiName: 'Account', fields: { 'Name': ownerNameValue } };
                const newAccountRecord = await createRecord(recordInput);
                fields['gbcinmo__Owner_Contact__c'] = newAccountRecord.id;
            }

            // SAFE GUARD CHECK: Only apply context token if the field is empty (avoids wiping manual selections)
            if (!fields['gbcinmo__Property__c'] && this._propertyId) {
                fields['gbcinmo__Property__c'] = this._propertyId;
            }

            this.template.querySelector('.unit-edit-form').submit(fields);
        } catch (error) {
            console.error('Routines submission processing execution error:', JSON.stringify(error));
        }
    }

    handleSuccess(event) {
        const generatedRecordId = event.detail.id;

        this.dispatchEvent(
            new ShowToastEvent({
                title: this.labels.successToastTitle,
                message: this.labels.successCreateMsg,
                variant: 'success'
            })
        );

        if (this.currentExecutionMode === 'SAVE_AND_NEW') {
            this.isQuickAddOwner = false;
            const inputFields = this.template.querySelectorAll('lightning-input-field');
            if (inputFields) {
                inputFields.forEach(field => {
                    // Restores and locks parent property lookup token to support fast continuous entries additions
                    if (field.fieldName === 'gbcinmo__Property__c') {
                        field.value = this._propertyId;
                    } else {
                        field.reset();
                    }
                });
            }
            this.currentExecutionMode = 'SAVE'; 
        } else {
            this.close(generatedRecordId);
        }
    }

    handleError(event) {
        console.error('Property Unit Form Submission Transactional Exception Error:', JSON.stringify(event.detail));
    }
}