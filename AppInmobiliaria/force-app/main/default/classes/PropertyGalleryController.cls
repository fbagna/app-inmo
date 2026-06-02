public with sharing class PropertyGalleryController {
    
    @AuraEnabled(cacheable=true)
    public static List<Map<String, String>> getPropertyPhotos(Id recordId) {
        List<Map<String, String>> photos = new List<Map<String, String>>();

        // Fetch image attachments related to the record
        List<ContentDocumentLink> links = [
            SELECT ContentDocumentId, ContentDocument.Title, ContentDocument.LatestPublishedVersionId
            FROM ContentDocumentLink
            WHERE LinkedEntityId = :recordId
            AND ContentDocument.FileType IN ('JPG', 'PNG', 'JPEG')
            WITH SECURITY_ENFORCED
        ];

        for (ContentDocumentLink link : links) {
            Map<String, String> photo = new Map<String, String>();
            photo.put('id', link.ContentDocumentId);
            photo.put('title', link.ContentDocument.Title);
            
            // Generate the standard Salesforce URL to preview images
            photo.put('url', '/sfc/servlet.shepherd/version/download/' + link.ContentDocument.LatestPublishedVersionId);
            
            photos.add(photo);
        }

        return photos;
    }
}