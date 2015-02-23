chrome.runtime.onMessage.addListener(function(msg, sender, sendResponse) {
    if (msg.sender && msg.sender == "no.tyridal.masterpassword" && msg.password &&
        document.activeElement && 
        document.activeElement.tagName &&
        document.activeElement.tagName == "INPUT" &&
        document.activeElement.type == "password") {
        document.activeElement.value = msg.password;
        sendResponse({sender:"no.tyridal.masterpassword", pasted:true});
    } 
});

