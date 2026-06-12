/**
 * @description Secure media asset pipeline leveraging existing gallery framework.
 * Refactored to enforce strict AppExchange USER_MODE execution context filters.
 * All logs, structures, and variables are maintained in English.
 * @author Gemini Collaborator
 * @date 2026
 */
public with sharing class PropertyGalleryController {
    
    /**
     * @description Fetches latest uploaded image files linked to the active record workspace.
     * @param recordId The target Property or Property Unit record identifier.
     * @return List of structured map rows containing document assets links.
     */
    @AuraEnabled(cacheable=true)
    public static List<Map<String, String>> getPropertyPhotos(Id recordId) {
        List<Map<String, String>> photos = new List<Map<String, String>>();

        // Single secure relationship query traversing junction links into target documents parameters
        List<ContentDocumentLink> links = [
            SELECT ContentDocumentId, ContentDocument.Title, ContentDocument.LatestPublishedVersionId
            FROM ContentDocumentLink
            WHERE LinkedEntityId = :recordId
              AND ContentDocument.FileType IN ('JPG', 'PNG', 'JPEG', 'WEBP', 'GIF')
            WITH USER_MODE
        ];

        for (ContentDocumentLink link : links) {
            Map<String, String> photo = new Map<String, String>();
            photo.put('id', link.ContentDocumentId);
            photo.put('title', link.ContentDocument.Title);
            
            // Generate standard platform static routes using the latest published version binary ID token
            photo.put('url', '/sfc/servlet.shepherd/version/download/' + link.ContentDocument.LatestPublishedVersionId);
            
            photos.add(photo);
        }

        return photos;
    }
}