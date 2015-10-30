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

(function () {

function parse_uri(sourceUri){
    // stolen with pride: http://blog.stevenlevithan.com/archives/parseuri-split-url
    var uriPartNames = ["source","protocol","authority","domain","port","path","directoryPath","fileName","query","anchor"],
    uriParts = new RegExp("^(?:([^:/?#.]+):)?(?://)?(([^:/?#]*)(?::(\\d*))?)((/(?:[^?#](?![^?#/]*\\.[^?#/.]+(?:[\\?#]|$)))*/?)?([^?#/]*))?(?:\\?([^#]*))?(?:#(.*))?").exec(sourceUri),
    uri = {};
    for(var i = 0; i < 10; i++)
        uri[uriPartNames[i]] = (uriParts[i] ? uriParts[i] : "");
    if(uri.directoryPath.length > 0)
        uri.directoryPath = uri.directoryPath.replace(/\/?$/, "/");
    return uri;
}

function get_active_tab_url() {
    var ret = new Promise(function(resolve, fail){
        chrome.tabs.query({active:true,windowType:"normal",currentWindow:true}, function(tabres){
        if (tabres.length != 1) {
            $('#usermessage').html("Error: bug in tab selector");
            console.log(tabres);
            throw new Error("plugin bug");
        } else
            resolve(tabres[0].url);
        });
    });
    return ret;
}

function copy_to_clipboard(mimetype, data) {
    document.oncopy = function(event) {
        event.clipboardData.setData(mimetype, data);
        event.preventDefault();
    };
    document.execCommand("Copy", false, null);
    document.oncopy=null;
}
function update_page_password_input(pass) {
    chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {
      chrome.tabs.sendMessage(tabs[0].id, {sender: "no.tyridal.masterpassword", password:pass}, function(response) {
       // response should contain pasted:true on success. don't care currently
    });
    });
}

var mpw_session=null;
var session_store={};

function recalculate() {
    $('#thepassword').html('(calculating..)');
    $('#usermessage').html("Please wait...");
    if ($('#sitename').val() == null || $('#sitename').val() == "") {
        $('#usermessage').html("need sitename");
        return;
    }
    var key_id_mismatch = false;

    if (!mpw_session) {
        mpw_session = mpw( session_store.username, session_store.masterkey, session_store.max_alg_version );

        $('#verify_pass_fld').html("Verify: " + mpw_session.sitepassword(".", 0, "nx"));
        var key_id = mpw_session.key_id();
        if (session_store.key_id && key_id !== session_store.key_id) {
            warn_keyid_not_matching();
            key_id_mismatch = true;
            chrome.extension.getBackgroundPage().store_update({username: session_store.username, masterkey: session_store.masterkey});
        }
        else {
            session_store.key_id = key_id;
            chrome.extension.getBackgroundPage().store_update({username: session_store.username, masterkey: session_store.masterkey, key_id: key_id});
        }
    }

    console.log("calc password " +
            $('#sitename').val() +
            " . " +
            parseInt($('#passwdgeneration').val()) +
            " . " +
            $('#passwdtype').val());

    var i,
        s = "",
        $t = $('#thepassword'),
        pass = mpw_session.sitepassword(
                $('#sitename').val(),
                parseInt($('#passwdgeneration').val(), 10),
                $('#passwdtype').val());

        for (i = 0; i < pass.length; i++)
            s += "&middot;";


        if ($t.attr('data-visible') == 'true')
            $t.html('<span>' + pass + '</span>');
        else
            $t.html('<a href="" id="showpass">' + s + '</a>');
        $t.attr('data-pass', pass);

        copy_to_clipboard("text/plain", pass);
        update_page_password_input(pass);
        if (!key_id_mismatch)
            $('#usermessage').html("Password for " + $('#sitename').val() + " copied to clipboard");
}

function update_with_settings_for(domain) {
    var first = true;

    if (session_store['sites'] === undefined) return;
    if (session_store.sites[domain] === undefined) return;

    $('#storedids').empty();
    $.each(session_store.sites[domain], function(key, val) {
        $('#storedids').append('<option>' + key);
        if (first) {
            $('#sitename').val(key);
            $('#passwdgeneration').val(val.generation);
            $('#passwdtype').val(val.type);
            if (val.username)
                $('#loginname').val(val.username);
            else
                $('#loginname').val("");
            first = false;
        } else
            $('#storedids_dropdown').show();
    });
}

function popup(session_store_) {
    var recalc = false;

    session_store = session_store_;
    if (session_store.username == null || session_store.masterkey == null) {
        $('#main').hide();
        $('#sessionsetup').show();
        mpw_session = undefined;
        if (!session_store.username)
            window.setTimeout(
                    function(){$('#username').focus();},
                    0.1);
        else {
            $('#username').val(session_store.username);
            window.setTimeout(
                    function(){$('#masterkey').focus();},
                    0.1);
        }
    } else {
        recalc = true;
        $('#main').show();
    }

    $('#passwdtype').val(session_store.defaulttype);

    get_active_tab_url()
    .then(function(url){
        var domain = parse_uri(url).domain.split("."),
            significant_parts = 2;
        if (domain.length > 2 && domain[domain.length-2].toLowerCase() === "co")
            significant_parts = 3;
        while(domain.length > 1 && domain.length > significant_parts)
            domain.shift();
        domain = domain.join(".");
        $('.domain').attr('value', domain);
        update_with_settings_for(domain);
        if(recalc) {
            recalculate();
        }
    })
    .catch(function(x) { //jshint ignore:line
        console.error('get_active_tab_url failed',x);
    });
}
window.addEventListener('load', function () {
    popup(chrome.extension.getBackgroundPage().session_store);

},false);

$('#sessionsetup > form').on('submit', function(){
    if ($('#username').val().length < 2) {
        $('#usermessage').html('<span style="color:red">Please enter a name (>2 chars)</span>');
        $('#username').focus();
        return false;
    }
    if ($('#masterkey').val().length < 2) {
        $('#usermessage').html('<span style="color:red">Please enter a master key (>2 chars)</span>');
        $('#masterkey').focus();
        return false;
    }
    session_store.username=$('#username').val();
    session_store.masterkey=$('#masterkey').val();
    $('#masterkey').val('');

    $('#sessionsetup').hide();
    $('#main').show();
    recalculate();
    return false;
});

$('#mainPopup').on('click','.btnlogout',function(){
    session_store.masterkey = null;
    chrome.extension.getBackgroundPage().store_update({masterkey: null});
    popup(session_store);
    $('#usermessage').html("session destroyed");
});

$('#generatepassword').on('click', function(){});

$('#siteconfig_show').on('click', function(){
    $('#siteconfig').show();
    $(this).hide();
    return false;
});

$('#thepassword').on('click', '#showpass', function(e){
    var $t = $(this.parentNode);
    $t.html( $t.attr('data-pass') );
    $t.attr('data-visible', "true") ;
    return false;
});

$('#storedids_dropdown').on('click', function(e){
    var sids = $('#storedids');

    if (sids.is(":visible"))
        sids.hide();
    else {
        sids.show();
        sids.focus();
    }
});

$('#storedids').on('change', function(){
    var site = $(this).val(),
        domain = $('#domain').val(),
        val = session_store.sites[domain][site];

    $('#sitename').val(site);
    $('#passwdgeneration').val(val.generation);
    $('#passwdtype').val(val.type);
    if (val.username)
        $('#loginname').val(val.username);
    else
        $('#loginname').val("");

    $(this).toggle();
    recalculate();
});

function save_site_changes_and_recalc(){
    var domain = $('#domain').val();

    if (session_store['sites'] === undefined)
        session_store.sites = {};
    if (session_store.sites[domain] === undefined)
        session_store.sites[domain] = {};

    session_store.sites[domain][$('#sitename').val()] = {
        generation:$('#passwdgeneration').val(),
        type:$('#passwdtype').val(),
        username:$('#loginname').val()
    };
    chrome.extension.getBackgroundPage().store_update({sites: session_store.sites});
    if (Object.keys(session_store.sites[domain]).length>1)
        $('#storedids_dropdown').show();
    recalculate();
}

function warn_keyid_not_matching()
{
    console.debug("keyids did not match!");
    $('#usermessage').html("<span style='color:red'>Master password possible mismatch!</span> <button id='change_keyid_ok' title='set as new'>OK</button>");
}

$('#siteconfig').on('change', 'select,input', save_site_changes_and_recalc);
$('#sitename').on('change', save_site_changes_and_recalc);
$('#loginname').on('change', save_site_changes_and_recalc);


$('#mainPopup').on('click','.btnconfig',function(){
    chrome.tabs.create({'url': 'src/options/index.html'}, function(tab) { });
});

$('#mainPopup').on('click','#change_keyid_ok',function(){
    chrome.extension.getBackgroundPage().store_update({
        username: session_store.username,
        masterkey: session_store.masterkey,
        key_id: mpw_session.key_id(),
        force_update: true
    });
    $('#usermessage').html("Password for " + $('#sitename').val() + " copied to clipboard");
});

}());
