var device = null;
var deviceSearchTimeoutMs = 5000;

var nfcTagReadAttempts = 10;
var nfcTagReadTimeoutPerAttemptMs = 1000;

var isWaitingForTag = false;

chrome.app.runtime.onLaunched.addListener(function() {
  chrome.app.window.create('app.html', {
    'id': 'appWindow',
    'bounds': { 'width': 1024, 'height': 768 }});
});

chrome.runtime.onMessageExternal.addListener(
  function(request, sender, sendResponse) {
    if (request.action == "get config") {
      sendResponse({
        search_for_device : {
          timeout: deviceSearchTimeoutMs
        },
        read_tag_id : {
          attempts: nfcTagReadAttempts,
          timeout: nfcTagReadTimeoutPerAttemptMs
        }
      });
    } else if (request.action == "find reader") {
      handleDeviceTimeout(enumerateDevices, [sendResponse], deviceSearchTimeoutMs);
    } else if (request.action == "wait for tag id") {
      if (isWaitingForTag == false) {
        isWaitingForTag = true;
        looper = function(tryAttemptsCount) {
          handleDeviceTimeout(readTagId, [function(opResult) {
            if (isWaitingForTag) {
              if (opResult.found == false && tryAttemptsCount != 0) {
                looper(tryAttemptsCount - 1);
              } else {
                sendResponse(opResult);
                isWaitingForTag = false;
              }
            }
          }], nfcTagReadTimeoutPerAttemptMs);
        };

        looper(nfcTagReadAttempts);
      }
    } else if (request.action == "stop waiting for tag id") {
      isWaitingForTag = false;
      sendResponse();
    } else if (request.action == "is waiting for tag id") {
      sendResponse(isWaitingForTag);
    }

    // Handle the response in an async manner
    return true;
  }
);

function handleDeviceTimeout(func, args, timeoutInMs) {
  var hasTags = false;
  setTimeout(function() {
    if (!hasTags) {
      // Timeout! No tag detected
      args[0]({found:false});
    }
  }, timeoutInMs);
  var args = args || [];
  args = args.concat([function() { hasTags = true; }]);
  func.apply(this, args);
}

function readTagId(rCb, callback) {
  chrome.nfc.read_tag_id(device, {}, function(type, tid) {
    rCb({
      found: true,
      tag: {
        id: tid
      }
    });
    callback();
  });
}

function enumerateDevices(rCb, callback) {
  chrome.nfc.findDevices(function(devices) {
    device = devices[0];
    rCb({found:true});
    callback();
  });
}