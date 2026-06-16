import LightningDatatable from 'lightning/datatable';
import richTextTemplate from './richTextTemplate.html';

export default class CustomDatatable extends LightningDatatable {
    static customTypes = {
        richText: {
            template: richTextTemplate,
            standardCellLayout: true
        }
    };
}