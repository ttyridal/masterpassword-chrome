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
/* global console, chrome */
/* jshint esversion: 6 */

(function(){
"use strict";

var port;
function port_default_error(p)  { port = undefined; }
function pwvault_gateway(msg) {
    console.log("pwvault_gw:",msg.type);
    // Keeping the port open "forever".. seems to be a bug in firefox
    // not noting that the native-app is gone and it will spinn forever.
    // Like this, we'll at least not trigger that until firefox closes.

    if (!port) {
        port = chrome.runtime.connectNative('no.ttyridal.pwvault_gateway');
        port.onDisconnect.addListener(port_default_error);
    }

    return new Promise((resolv, fail) => {
        let error;
        let success = r => {
            port.onMessage.removeListener(error);
            port.onDisconnect.removeListener(success);
            resolv(r);
        };
        error = p => {
            p = p.error;
            if (!p) p = "disconnect";
            port = undefined;
            fail(p);
        };

        port.onMessage.addListener(success);
        port.onDisconnect.addListener(error);
        try {
            port.postMessage(msg);
        } catch (err) {
            port.onMessage.removeListener(error);
            port.onDisconnect.removeListener(success);
            fail(err);
        }
    });
}

var settings = {
    'defaulttype': 'l',
    'passwdtimeout': -1,
    'pass_store': false,
    'pass_to_clipboard': true,
    'max_alg_version': 3
};

var _masterkey;
const pw_retention_timer = 'pw_retention_timer';
chrome.alarms.onAlarm.addListener(a => {
    if (a.name === pw_retention_timer) {
        _masterkey = undefined;
    }
});

function temp_store_masterkey(k) {
    if (!settings.passwdtimeout) return;
    if (settings.passwdtimeout > 0) {
        chrome.alarms.create(pw_retention_timer, {delayInMinutes: settings.passwdtimeout});
    }
    _masterkey = k;
}


function store_update(d) {
    let syncset = {};

    if (d.passwdtimeout !== undefined) {
        settings.passwdtimeout = d.passwdtimeout;
        if (d.passwdtimeout === 0)
            _masterkey = undefined;
        else if (d.passwdtimeout === -1)
            chrome.alarms.clear(pw_retention_timer);
    }
    if (d.pass_store !== undefined) {
        settings.pass_store = !(d.pass_store === false || d.pass_store === 'n')
    }

    Object.keys(d).forEach(k => {
        switch (k) {
            case 'force_update':
            case 'passwdtimeout':
                break;
            case 'defaulttype':
            case 'pass_to_clipboard':
                syncset[k] = d[k];
                break;
            case 'username':
            case 'key_id':
            case 'sites':
                if (!chrome.extension.inIncognitoContext)
                    syncset[k] = d[k];
                break;
            case 'masterkey':
                if (settings.pass_store) {
                    if (d.key_id || d.force_update)
                        Promise.resolve(pwvault_gateway({'type':'pwset','name':'default', 'value': d[k]}))
                        .catch(e => { console.error(e); });
                } else
                    temp_store_masterkey(d[k]);
                break;
            default:
                console.info("Trying to store unknown key",k);
                break;
        }
    });
    chrome.storage.sync.set(syncset);
}

function promised_storage_get(sync, keys) {
    return new Promise((resolve, fail) => {
        if (sync)
            chrome.storage.sync.get(keys, itms => {
                if (itms === undefined) resolve({});
                else resolve(itms);
            });
        else
            chrome.storage.local.get(keys, itms => {
                if (itms === undefined) resolve({});
                else resolve(itms);
            });
    });
}

function store_get(keys) {
    const setting_keys = ['defaulttype', 'passwdtimeout', 'pass_to_clipboard', 'max_alg_version', 'pass_store'];
    let k2 = []; k2.push.apply(k2, keys); k2.push.apply(k2, setting_keys);
    k2 = [...new Set(k2)];
    let p1 = promised_storage_get(true, k2);
    return Promise.all([p1])
    .then(v => {
        let [webext] = v;
        webext['pass_store'] = (webext['pass_store'] === 'y' || webext['pass_store'] === true);
        for (let k of setting_keys)
            settings[k] = webext[k] !== undefined ? webext[k] : settings[k];
        if (settings.passwdtimeout === 0) // clear now in case it's recently changed
            _masterkey = undefined;

        let r = {};
        for (let k of keys) {
            switch (k) {
                //preferences
                case 'defaulttype':
                case 'passwdtimeout':
                case 'pass_store':
                case 'pass_to_clipboard':
                case 'max_alg_version':
                    r[k] = settings[k];
                    break;

                case 'masterkey':
                case 'username':
                case 'key_id':
                case 'sites':
                    r[k] = webext[k] === undefined ? {} : webext[k];
                    break;
                default:
                    throw new Error("unknown key requested: "+k);
            }
        }
        return r;
    })
    .then(r => {
        if (settings.pass_store !== 'n' && keys.indexOf('masterkey') !== -1) {
            return Promise.all([r,
                pwvault_gateway({'type':'pwget', 'name':'default'})
                .catch(err => {
                    console.error("pwvault_gateway failed " + err);
                    return {success:false, reason:err};
                })
            ]);
        } else
            return [r, {success: true, value: _masterkey}];
    })
    .then(comb => {
        let [r, mk] = comb;
        if (mk && mk.success) r.masterkey = mk.value;
        else r.pwgw_failure = mk.reason;
        return r;
    });
}

window.store_update = store_update;
window.store_get = store_get;

Promise.all([new Promise((r,f) => {chrome.management.getSelf(res=>{r(res);})}), promised_storage_get(false, ['releasenote_version'])])
.then(c => {
    if (c[0].version !== c[1].releasenote_version) {
        chrome.tabs.create({
            url: "/src/options/releasenote.html"
          });
        chrome.storage.local.set({releasenote_version: c[0].version});
    }
})
.catch(e => {
    console.info(e);
});

// console.log("background.js loaded");
}());
