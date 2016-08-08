document.querySelector('#passwdtype').addEventListener('change', function() {
    chrome.extension.getBackgroundPage().store_update({defaulttype: this.value});
});
document.querySelector('#passwdtimeout').addEventListener('change', function() {
    let v = parseInt(this.value);
    chrome.extension.getBackgroundPage().store_update({passwdtimeout: v});
});

window.addEventListener('load', function() {
    var ss = chrome.extension.getBackgroundPage().session_store;
    document.querySelector('#passwdtype').value = ss.defaulttype;
    document.querySelector('#passwdtimeout').value = ss.passwdtimeout;
});
