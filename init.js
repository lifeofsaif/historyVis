chrome.tabs.query({'url': chrome.extension.getURL('app/index.html')},function(tabs){
    
    if(tabs.length == 0 ){
        chrome.tabs.create({'url': chrome.extension.getURL('app/index.html')});
    }
    
})

