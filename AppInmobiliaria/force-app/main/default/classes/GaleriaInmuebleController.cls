public with sharing class GaleriaInmuebleController {
    
    @AuraEnabled(cacheable=true)
    public static List<Map<String, String>> getFotosInmueble(Id recordId) {
        List<Map<String, String>> fotos = new List<Map<String, String>>();

        // Buscamos los archivos adjuntos al registro que sean imágenes
        List<ContentDocumentLink> links = [
            SELECT ContentDocumentId, ContentDocument.Title, ContentDocument.LatestPublishedVersionId
            FROM ContentDocumentLink
            WHERE LinkedEntityId = :recordId
            AND ContentDocument.FileType IN ('JPG', 'PNG', 'JPEG')
            WITH SECURITY_ENFORCED
        ];

        for (ContentDocumentLink link : links) {
            Map<String, String> foto = new Map<String, String>();
            foto.put('id', link.ContentDocumentId);
            foto.put('titulo', link.ContentDocument.Title);
            // Generamos la URL estándar de Salesforce para previsualizar imágenes
            foto.put('url', '/sfc/servlet.shepherd/version/download/' + link.ContentDocument.LatestPublishedVersionId);
            fotos.add(foto);
        }

        return fotos;
    }
}