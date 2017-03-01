document.querySelector('#passwdtype').addEventListener('change', function() {
    chrome.extension.getBackgroundPage().store_update({defaulttype: this.value});
});
document.querySelector('#passwdtimeout').addEventListener('change', function() {
    let v = parseInt(this.value);
    chrome.extension.getBackgroundPage().store_update({passwdtimeout: v});
});

window.addEventListener('load', function() {
    chrome.extension.getBackgroundPage().store_get(['defaulttype','passwdtimeout'])
    .then(data => {
        document.querySelector('#passwdtype').value = data.defaulttype;
        document.querySelector('#passwdtimeout').value = data.passwdtimeout;
    });
});
