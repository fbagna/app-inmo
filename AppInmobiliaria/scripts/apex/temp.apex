/* 1. Create Country */
Location__c country = new Location__c(
    Name = 'España', 
    Level__c = 'Country', 
    Active__c = true
);
insert country;

/* 2. Create State/Province */
Location__c state = new Location__c(
    Name = 'Madrid', 
    Level__c = 'State', 
    Parent_Location__c = country.Id, 
    Active__c = true
);
insert state;

/* 3. Create City/Municipality */
Location__c city = new Location__c(
    Name = 'Madrid', 
    Level__c = 'City', 
    Parent_Location__c = state.Id, 
    Active__c = true
);
insert city;

/* 4. Create Neighborhoods */
List<Location__c> neighborhoods = new List<Location__c>();
neighborhoods.add(new Location__c(
    Name = 'Hortaleza', 
    Level__c = 'Neighborhood', 
    Parent_Location__c = city.Id, 
    Active__c = true
));
neighborhoods.add(new Location__c(
    Name = 'Centro', 
    Level__c = 'Neighborhood', 
    Parent_Location__c = city.Id, 
    Active__c = true
));
insert neighborhoods;