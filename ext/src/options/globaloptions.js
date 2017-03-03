document.querySelector('#passwdtype').addEventListener('change', function() {
    chrome.extension.getBackgroundPage().store_update({defaulttype: this.value});
});
document.querySelector('#passwdtimeout').addEventListener('change', function() {
    let v = parseInt(this.value);
    chrome.extension.getBackgroundPage().store_update({passwdtimeout: v});
});
document.querySelector('#pass_to_clipboard').addEventListener('change', function() {
    chrome.extension.getBackgroundPage().store_update({pass_to_clipboard: this.checked});
});

window.addEventListener('load', function() {
    chrome.extension.getBackgroundPage().store_get(
        ['defaulttype','passwdtimeout', 'pass_to_clipboard'])
    .then(data => {
        document.querySelector('#passwdtype').value = data.defaulttype;
        document.querySelector('#passwdtimeout').value = data.passwdtimeout;
        document.querySelector('#pass_to_clipboard').checked = data.pass_to_clipboard;
    });
});
