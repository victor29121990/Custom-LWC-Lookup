public with sharing class CustomLookupController {

    @AuraEnabled(Cacheable=true)
    public static String search(String query, String objectName){
        ReturnWrapper wrap = new ReturnWrapper();
        try {
            wrap.returnValue = new Map<string, Object>();
            //query = String.escapeSingleQuotes(query);
            
            //Search.SearchResults searchResults = Search.find('FIND \'test\' IN ALL FIELDS RETURNING KnowledgeArticleVersion(id, title WHERE PublishStatus = \'Online\' AND Language = \'en_US\') WITH SNIPPET (target_length=120)');
            Search.SearchResults searchResults = Search.find(query);
            
            List<Search.SearchResult> recordList = searchResults.get(objectName);
            List<SObject> results = new List<SObject>();
            for (Search.SearchResult searchResult : recordList) { 
                results.add(searchResult.getSObject()); 
            } 
            wrap.isSuccess = true;
            wrap.successMsg = 'recordsloaded';
            wrap.returnValue.put('searchResults', results);
        } catch (Exception e) {
            wrap.errorMsgs = new List<String>{e.getMessage()};
            wrap.isSuccess = false;
        }
        return JSON.serialize(wrap);
    }

    @AuraEnabled(Cacheable=true)
    public static String fetch(String query, String objectName){
    ReturnWrapper wrap = new ReturnWrapper();
        try {
            wrap.returnValue = new Map<string, Object>();
            List<SObject> results = new List<SObject>();
            for (SObject record : Database.query(query)) { 
                results.add(record); 
            } 
            wrap.isSuccess = true;
            wrap.successMsg = 'recordsloaded';
            wrap.returnValue.put('searchResults', results);
        } catch (Exception e) {
            wrap.errorMsgs = new List<String>{e.getMessage()};
            wrap.isSuccess = false;
        }
        return JSON.serialize(wrap);
    }

    public class ReturnWrapper
    {
        @AuraEnabled public Boolean isSuccess;
        @AuraEnabled public String successMsg;
        
        @AuraEnabled public Map<string, Object> returnValue; 
        @AuraEnabled public List<String> errorMsgs;
    }
}
