import { LightningElement, api, wire, track } from 'lwc';
import getFotosInmueble from '@salesforce/apex/GaleriaInmuebleController.getFotosInmueble';

// Importamos las etiquetas (la "c." es el namespace genérico por defecto de las custom labels)
import Carousel_Title from '@salesforce/label/c.Carousel_Title';
import Carousel_No_Photos from '@salesforce/label/c.Carousel_No_Photos';

export default class CarruselInmueble extends LightningElement {
    @api recordId;
    @track fotos = [];

    // Exponemos las etiquetas al HTML
    label = {
        Carousel_Title,
        Carousel_No_Photos
    };

    @wire(getFotosInmueble, { recordId: '$recordId' })
    wiredFotos({ error, data }) {
        if (data) {
            this.fotos = data;
        } else if (error) {
            console.error('Error cargando las fotos:', error);
        }
    }

    get tieneFotos() {
        return this.fotos && this.fotos.length > 0;
    }
}