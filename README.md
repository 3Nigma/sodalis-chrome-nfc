# Sodalis Chrome NFC Library

What if I told you that you can make a *webpage* read a [NFC](https://en.wikipedia.org/wiki/Near_field_communication) tag?

That you can have your client load a site with the following piece of JS code delivering what it (semantically) promises? :
``` javascript
  var usbNfcLink = new UsbNFC();

  usbNfcLink.readTag(function (tagResp) {
    // USB reader found a tag
    // Do something with its ID (tagResp.id)
  });  
```

And that you would have something like this on your website:

<img src="https://raw.github.com/3Nigma/sodalis-chrome-nfc/master/img/sodalis-nfc-noh-capture.gif"/>

This is actually an, NFC based, office working-hours tracking system.

Now, I have to admit that there is a list of prerequisites to have before making this possible:

* an external USB reader (see 'Supported NFC Readers' further down)
* a chrome extension (yes, this means that, for now at least, only Chrome users can make this happen) 
* a client-side JS libray

Having these available, *you can* make your page NFC aware all through the confort of our beloved JavaScript logic.

Now that I've cought your attention, lets see how we can accomplish this.

## Working Description ##

At the core of my solution you'll find Chrome's [USB system service](https://developer.chrome.com/apps/app_usb) that Google made available for their platform apps. A while back, the guys at Google [showed how a Chrome app can read a NFC tag](https://github.com/GoogleChrome/chrome-nfc) through one of these external USB-NFC devices.  

Having a Chrome app communicate with a USB peripheral was a cool thing by itself, but the immediate question that popped into my mind was: What if we can leverage the availability of this feature to ordinary pages? Wouldn't that be *more* awsome? 

The [crome-nfc code](https://github.com/GoogleChrome/chrome-nfc) was a good place to start, but since Chrome Apps have their own isolated container where they run their code, the challenge came down to finding a way to bridge an app's restricted environment with a client webpage. It turned out that you can accomplish this if you use [their messaging system](https://developer.chrome.com/extensions/messaging#external-webpage). In other words, you can comunicate between a web page and a chrome app. For security/privacy considerations though, this data link is subjected to some conditions which we'll discuss a little bit later.

Having this sorted, it was only a matter of making the infrastructure + code to allow it to happen.

## How to use? ##

Ok, enough chit-chat. Lets get down to some using. First download the repository. Having it downloaded, you will find that it has a simple structure:

```
  src            : holds the sources
    * -- app     : chrome app related
    * -- client  : website related
  build          : holds the outputed, condensed artifacts
    * -- app     : chrome app related
    * -- client  : website related
```

Unless you are not interested in participating to the coding effort (by the way, did I mention that I'm looking forward for your pull requests?) then you should only be interested in the ```build``` part.

### Adding the chrome extension ###

First, you will need to edit the ```build/app/manifest.js```. Open it and search for this region:

```
"externally_connectable": {
  "matches": ["*://*.sodalis.it/*", "*://sodalis.it/*", "*://*.rrsolutions.ro/*"]
}
```

To be able to have a data communication channel opened between your site and the chrome extension, you would have to inform chrome that you trust the requests that come from your domain. To do this, simply redefine the ```matches``` array. So, for example, if your domain is ```google.com``` and you would like the chrome extension to communicate with this domain (and all its subdomains), your ```externally_connectable``` value would look something like:

```
"externally_connectable": {
  "matches": ["*://*.google.com/*", "*://google.com/*"]
}
```

Please keep in mind that you have to have a second-level domain name specified. Matches having the form ```*.com``` are not allowed (pitty!). It is for this reason that we cannot have it hosted on their App store. Otherwise we could have included a long list of all the most commonly used, first-level domain filters.

Having this done, we are ready to add the extension to Chrome.

Navigate to ```chrome://extensions``` and enable ```Developer mode```.

<img src="https://raw.github.com/3Nigma/sodalis-chrome-nfc/master/img/chrome_extensions_dev_mode.png"/>

Then click the ```Load unpacked extension...``` button. Navigate to where you have extracted the git repository and select the ```build/app``` folder.

<img src="https://raw.github.com/3Nigma/sodalis-chrome-nfc/master/img/chrome_extensions_ld_unpacked_extension.png"/>

You should see the ```Sodalis USB-NFC``` extension listed:

<img src="https://raw.github.com/3Nigma/sodalis-chrome-nfc/master/img/chrome_extensions_extension_added.png"/>

Now would be the time to plugin your external reader and check to see if the chrome extension is capable of comunicating with it. You do this by clicking the extension's ```Launch``` link which will popup [chrome-nfc](https://github.com/GoogleChrome/chrome-nfc)'s original *API Sample* window. If you're running on Linux, then you can click the ```Search for readers``` button and you would probably have your reader immediatelly listed:

<img src="https://raw.github.com/3Nigma/sodalis-chrome-nfc/master/img/chrome_extensions_reader_found.png"/>

Windows users will have to put a little bit more effort into this (thank you, Micro$oft). Here is the list of steps required to make the plugin work on Windows (taken from the [chrome-nfc](https://github.com/GoogleChrome/chrome-nfc) repo):

*  Plug in your reader
*  Download and open the [Zadig](http://zadig.akeo.ie/) application
*  Use _Zadig_ to replace the reader's driver with the generic *libusbK*
*  After this has finished, unplug + replug the reader
*  Make sure that ```chrome://inspect```'s **Discover USB devices** option is not selected
*  Start Chrome with *administrative* rights and you are set to go

I've noticed that the last step is not required for me, but I've included it for completion.

Once this is up and running, we can shift our attention now to the client webpage.

### Working with the client library ###

You will find the library in ```build/client/usb-nfc.js```. There isn't too much to say about it except for the fact that it requires both [jQuery](https://jquery.com/) [2.x should be fine] and nakupanda's beautifully crafted [bootstrap3-dialog](https://github.com/nakupanda/bootstrap3-dialog).

A minimum DOM environment might look similar to this:

``` html
<html>
  <head>
    <link rel="stylesheet" type="text/css" href="css/bootstrap.min.css">
    <link rel="stylesheet" type="text/css" href="css/bootstrap-dialog.min.css">

    <script src="js/jquery-2.1.3.min.js"></script>
    <script src="js/bootstrap.min.js"></script>
    <script src="js/bootstrap-dialog/bootstrap-dialog.min.js"></script>
    <script src="<?= base_url('application/assets/js/usb-nfc.js') ?>"></script>
  </head>
  <body>
   <!-- ... -->
  </body>
</html>
```

To read tags, you would have to create an ```UsbNFC``` object within your JavaScript logic and invoke its ```readTag``` function passing a callback for the response. It's as simple as that. No options, no settings, no code dependencies (although future might change this). It just works!

``` javascript
var usbNfcLink = new UsbNFC();

usbNfcLink.readTag(function (tagResp) {
  // USB reader found a tag
  // Do something with its ID (tagResp.id)
}); 
```

For now, the ```tagResp``` object only has one property:

* ```id``` - a hexadecimal string representing the ID of the aquired tag

## Supported NFC Readers ##

*  [ACR122U](http://www.acs.com.hk/en/products/3/acr122u-usb-nfc-reader)
*  [SCL3711](http://www.identive-group.com/products-and-solutions/identification-products/mobility-solutions/mobile-readers/scl3711-contactless-usb-smart-card-reader)

Apart from these, work is underway to have ACS's ACR1252 also compatible. Though I don't have an exact date when that might happen.

## Compiling the library

Compiling scripts requires [Python 3.0](http://www.python.org/download/releases/3.0/) and will use online [Closure Compiler](https://developers.google.com/closure/). Just run

    python3 compile-app.py
    python3 compile-client.py

and, hopefully, 2 things will happen : 

* the chrome core library will be written to `build/app/chrome-nfc.js` _while_
* the JS client library will be written to `build/client/usb-nfc.js`.

## TODOs ##

* Add option to go quiet with the logs
* Add option to bypass the jQuery/BootstrapDialog dependencies if required
* Deliver more data in the ```tagResp``` object