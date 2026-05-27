import { LightningElement, wire } from 'lwc';
import getInmueblesConDireccion from '@salesforce/apex/MapaGlobalController.getInmueblesConDireccion';

export default class MapaGlobal extends LightningElement {
    mapMarkers;

    @wire(getInmueblesConDireccion)
    wiredInmuebles({ error, data }) {
        if (data && data.length > 0) {
            // Transformamos los datos de Apex al formato que pide Google Maps
            this.mapMarkers = data.map(inmueble => {
                return {
                    location: {
                        Street: inmueble.Calle,
                        State: inmueble.Provincia,
                        Country: 'España'
                    },
                    title: inmueble.Name,
                    value: inmueble.Id,
                    description: `📍 Dirección: ${inmueble.Calle}, ${inmueble.Provincia}`,
                    icon: 'custom:custom85' // Icono de edificio rojo
                };
            });
        } else if (error) {
            console.error('Error cargando el mapa global:', error);
        }
    }
}