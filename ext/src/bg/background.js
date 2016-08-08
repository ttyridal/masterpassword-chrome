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
    'passwdtimeout': -1,
    'key_id': undefined,
    'sites':{}
}

var passwdtimer;

chrome.storage.sync.get(['username', 'defaulttype', 'sites', 'key_id', 'passwdtimeout'], function(itms) {
    if (itms.username!=undefined)
        session_store.username = itms.username;
    if (itms.sites!=undefined)
        session_store.sites = itms.sites;
    if (itms.defaulttype!=undefined)
        session_store.defaulttype = itms.defaulttype;
    if (itms.passwdtimeout!=undefined)
        session_store.passwdtimeout = itms.passwdtimeout;
    if (itms.key_id!=undefined)
        session_store.key_id = itms.key_id;
});


function store_update(d) {
    let syncset = {};

    Object.keys(d).forEach(function(k){
        switch(k) {
            case 'passwdtimeout':
                if (passwdtimer !== undefined) {
                    window.clearTimeout(passwdtimer);
                    passwdtimer = undefined;
                }
            case 'defaulttype':
                syncset[k] = session_store[k] = d[k];
                break;

            case 'username':
            case 'key_id':
            case 'sites':
                if (!chrome.extension.inIncognitoContext)
                    syncset[k] = session_store[k] = d[k];
                break;
            case 'masterkey':
                if (!chrome.extension.inIncognitoContext)
                    session_store[k] = d[k];
                break;
            default:
                break;
        }
    });
    chrome.storage.sync.set(syncset);

    if (session_store.passwdtimeout === 0)
        session_store.masterkey = null;
    else if (session_store.passwdtimeout > 0) {
        if (passwdtimer !== undefined)
            window.clearTimeout(passwdtimer);
        window.passwdtimer = window.setTimeout(function(){
            console.log("auto-logout");
            session_store.masterkey = null;
        }, session_store.passwdtimeout * 1000 * 60);
    }
}
