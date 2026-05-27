public with sharing class MapaGlobalController {
    @AuraEnabled(cacheable=true)
    public static List<Map<String, String>> getInmueblesConDireccion() {
        List<Map<String, String>> resultados = new List<Map<String, String>>();
        
        for (gbcinmo__Inmueble__c inm : [SELECT Id, Name, gbcinmo__Direccion_Matchmaking__c, gbcinmo__Provincia_Matchmaking__c 
                                FROM gbcinmo__Inmueble__c 
                                WHERE gbcinmo__Direccion_Matchmaking__c != null 
                                WITH SECURITY_ENFORCED 
                                LIMIT 50]) {
                                    
            Map<String, String> mapa = new Map<String, String>();
            mapa.put('Id', inm.Id);
            mapa.put('Name', inm.Name);
            mapa.put('Calle', inm.gbcinmo__Direccion_Matchmaking__c);
            mapa.put('Provincia', inm.gbcinmo__Provincia_Matchmaking__c);
            resultados.add(mapa);
        }
        return resultados;
    }
}