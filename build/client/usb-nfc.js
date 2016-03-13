var __usbnfc_extensionId = "dbhhnddeknflaicmjppmfkidhohhefei";
function UsbNFC() {
  this.get_config = function(fCallback) {
    chrome.runtime.sendMessage(__usbnfc_extensionId, {action:"get config"}, function(resp) {
      console.log("Got the USB-NFC configuration settings.");
      if (fCallback) {
        fCallback(resp);
      }
    });
  };
  this.initalize_reader = function(fCallback) {
    console.log("Searching for the NFC reader ...");
    chrome.runtime.sendMessage(__usbnfc_extensionId, {action:"find reader"}, function(resp) {
      console.log("Got a response from the USB-NFC plugin for the 'find reader' action.");
      if (fCallback) {
        fCallback(resp);
      }
    });
  };
  this.scan_for_tag = function(fCallback) {
    console.log("Waiting for NFC tag to be scanned ...");
    chrome.runtime.sendMessage(__usbnfc_extensionId, {action:"wait for tag id"}, function(resp) {
      if (resp.found) {
        console.log("Aquired a NFC tag having ID " + resp.tag.id);
      } else {
        console.log("NFC tag not found");
      }
      if (fCallback) {
        fCallback(resp);
      }
    });
  };
  this.stop_waiting_for_tag = function() {
    chrome.runtime.sendMessage(__usbnfc_extensionId, {action:"stop waiting for tag id"}, function() {
    });
  };
  this.is_waiting_for_tag = function(fCallback) {
    chrome.runtime.sendMessage(__usbnfc_extensionId, {action:"is waiting for tag id"}, function(resp) {
      if (fCallback) {
        fCallback(resp);
      }
    });
  };
}
UsbNFC.prototype.readTag = function(fCallback) {
  if (!!window.chrome == false) {
    alert("The usb-nfc script only works with chrome! Aborting ...");
  } else {
    if (typeof chrome.runtime === "undefined") {
      alert("This version of chrome is not suitable for communicating with the usb-nfc library. Aborting ...");
    } else {
      if (window.jQuery == "undefined" || window.BootstrapDialog == "undefined") {
        alert("You need to have jQuery and BootstrapDialog loaded to be able to use the usb-nfc module!");
      } else {
        var nfc = this;
        nfc.get_config(function(config) {
          if (typeof config === "undefined") {
            var pluginNotAvailableDialog = new BootstrapDialog({type:BootstrapDialog.TYPE_DANGER, title:"NFC Plugin not found!", message:"Please make sure you have the NFC plugin installed and enabled before trying again.", buttons:[{label:"Ok", action:function(dlg) {
              dlg.close();
            }}]});
            pluginNotAvailableDialog.realize();
            pluginNotAvailableDialog.open();
            return;
          }
          var lookingForReaderDialog = new BootstrapDialog({type:BootstrapDialog.TYPE_INFO, title:"Please wait ...", message:"Locking to the NFC reader."});
          lookingForReaderDialog.realize();
          lookingForReaderDialog.open();
          nfc.initalize_reader(function(readerResp) {
            lookingForReaderDialog.close();
            if (readerResp.found) {
              var tagSearchDialog = new BootstrapDialog({type:BootstrapDialog.TYPE_PRIMARY, title:"Waiting for the NFC tag ...", message:function(dlg) {
                var timeBar = $('<div class="progress-bar bar" role="progressbar" aria-valuenow="0" aria-valuemin="0" aria-valuemax="100">');
                var progress = setInterval(function() {
                  if (timeBar.width() == 500) {
                    clearInterval(progress);
                    timeBar.find(".progress").removeClass("active");
                    dlg.close();
                    timeBar.width(0);
                  } else {
                    timeBar.width(timeBar.width() + 500 / config.read_tag_id.attempts);
                  }
                }, config.read_tag_id.timeout);
                timeBar.height(20);
                timeBar.text("Please swipe your tag now.");
                return timeBar;
              }, buttons:[{id:"cancel-tag-add", label:"Cancel", action:function(dlg) {
                dlg.close();
              }}]});
              tagSearchDialog.onHide(function() {
                nfc.is_waiting_for_tag(function(isTagWaitingInProgress) {
                  if (isTagWaitingInProgress) {
                    nfc.stop_waiting_for_tag();
                  }
                });
              });
              tagSearchDialog.realize();
              tagSearchDialog.open();
              nfc.scan_for_tag(function(tagResp) {
                tagSearchDialog.close();
                if (tagResp.found) {
                  if (fCallback) {
                    fCallback(tagResp.tag);
                  }
                } else {
                  BootstrapDialog.show({type:BootstrapDialog.TYPE_WARNING, title:"No NFC tag found!", message:"I could not find any NFC tag. Please try again ...", buttons:[{label:"Ok", action:function(dlg) {
                    dlg.close();
                  }}]});
                }
              });
            } else {
              BootstrapDialog.show({type:BootstrapDialog.TYPE_DANGER, title:"Could not connect to the reader!", message:"Please make sure that the USB reader is attached to the computer and try again ...", buttons:[{label:"Ok", action:function(dlg) {
                dlg.close();
              }}]});
            }
          });
        });
      }
    }
  }
};
