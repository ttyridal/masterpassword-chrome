# masterpassword-chrome
Master Password implemented as a Chrome extension

This is a chrome extension implementing the masterpassword algorithm invented by Maarten Billemont. You can visit his website at [masterpasswordapp.com](http://masterpasswordapp.com). This plugin uses tmthrgd's [mpw library](https://github.com/tmthrgd/mpw-js), a javascript implementation of Maarten's algorithm.

**Please note that this plugin is not affiliated with Maarten or tmthrgd**

The site settings will sync between your chrome installations if you have chrome sync enabled. (also in incognito)

# Installation
Chrome prefers extensions to be installed from the chrome web store. While this extension is not available there (pending) It has to be installed manually
* Download the crx file from the releases page and save it somewhere convenient
* Open the chrome exensions setting [chrome://extensions/](chrome://extensions/) and drag the file over it

# Incognito mode
Exensions are by default prevented from running in incognito mode. You can allow the masterpassword exension in by visiting the [chrome://extensions/](chrome://extensions/) exension settings and check the box.

Please note that the extension stores the user name and any site settings you do, also in incognito mode

# Changing the site name
Many sites (like google) have localized url's (google.de, google.co.uk etc). It is recommended that you use the global (ie google.com) as the site name in such cases.

When you first open masterpassword on a localized domain, that domain will be suggested in masterpassword. You can change this. It will be remembered for your next visit.

If you have several accounts at a domain, it is suggested to prefix the site name with something like "username@" (ie myself@google.com). The site name in masterpassword will change to a dropdown if you have multiple variants.








based on tmthrgd's [mpw library](https://github.com/tmthrgd/mpw-js)

## About Master Password
The Master Password algorithm was made up by Maarten Billemont and is documented on his website http://www.masterpasswordapp.com. This is an unofficial implementation of his algorithm. I am in no way affiliated with aforementioned website. 
