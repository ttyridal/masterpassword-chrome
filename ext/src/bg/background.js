var session_store = {
    'username':null,
    'masterkey':null,
    'defaulttype':'l',
    'sites':{}
}
console.log('background loaded');
chrome.storage.sync.get(['username','sites'], function(itms) {
    if (itms.username!=undefined)
        session_store.username = itms.username;
    if (itms.sites!=undefined)
        session_store.sites = itms.sites;
});


function store_update(d) {
    if (chrome.extension.inIncognitoContext) {
        console.log("won't store anything in incognito mode");
        return;
    }
    var k;
    for (k in d)
        session_store[k] = d[k];
    chrome.storage.sync.set({
        'username':session_store.username,
        'sites':session_store.sites
    });
}



//example of using a message handler from the inject scripts
chrome.extension.onMessage.addListener(
  function(request, sender, sendResponse) {
  	chrome.pageAction.show(sender.tab.id);
    sendResponse();
  });
