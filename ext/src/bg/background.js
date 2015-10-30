/* Copyright Torbjorn Tyridal 2015

    This file is part of Masterpassword for Chrome (herby known as "the software").

    The software is free software: you can redistribute it and/or modify
    it under the terms of the GNU General Public License as published by
    the Free Software Foundation, either version 3 of the License, or
    (at your option) any later version.

    The software is distributed in the hope that it will be useful,
    but WITHOUT ANY WARRANTY; without even the implied warranty of
    MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
    GNU General Public License for more details.

    You should have received a copy of the GNU General Public License
    along with the software.  If not, see <http://www.gnu.org/licenses/>.
*/

var session_store = {
    'username':null,
    'masterkey':null,
    'defaulttype':'l',
    'max_alg_version': 3,
    'sites':{}
}
console.log('background loaded');
chrome.storage.sync.get(['username', 'defaulttype', 'sites'], function(itms) {
    if (itms.username!=undefined)
        session_store.username = itms.username;
    if (itms.sites!=undefined)
        session_store.sites = itms.sites;
    if (itms.defaulttype!=undefined)
        session_store.defaulttype = itms.defaulttype;
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
