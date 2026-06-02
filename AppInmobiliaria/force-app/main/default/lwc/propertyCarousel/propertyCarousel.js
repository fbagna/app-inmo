import { LightningElement, api, wire, track } from 'lwc';
import getPropertyPhotos from '@salesforce/apex/PropertyGalleryController.getPropertyPhotos';

// Importamos las etiquetas personalizadas
import Carousel_Title from '@salesforce/label/c.Carousel_Title';
import Carousel_No_Photos from '@salesforce/label/c.Carousel_No_Photos';

export default class PropertyCarousel extends LightningElement {
    @api recordId;
    @track photos = [];

    // Exponemos las etiquetas al HTML
    label = {
        Carousel_Title,
        Carousel_No_Photos
    };

    @wire(getPropertyPhotos, { recordId: '$recordId' })
    wiredPhotos({ error, data }) {
        if (data) {
            this.photos = data;
        } else if (error) {
            console.error('Error loading photos:', error);
        }
    }

    get hasPhotos() {
        return this.photos && this.photos.length > 0;
    }
}