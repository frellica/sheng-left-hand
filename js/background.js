/* 
* @Author: frellica
* @Date:   2015-06-15 20:31:56
* @Last Modified by:   frellica
* @Last Modified time: 2015-06-24 02:42:23
*/

'use strict';

var handleCapture = function (stream) {
    debugger 
}
var captureCurrentTab = function () {
    console.log('reqeusted current tab');
    chrome.tabs.query({active : true}, function(tab) {
        console.log('got current tab');

        chrome.tabCapture.capture({
            audio : false,
            video : true,
            videoConstraints: {
                mandatory: {
                    width: { min: 640 },
                    height: { min: 480 }
                }
            }
        }, handleCapture);
  });
} 
chrome.runtime.onMessage.addListener(function (request, sender, sendResponse){
    console.log(request);
    if(request.action === 'capture'){
        // var desktopMediaRequestId = chrome.desktopCapture.chooseDesktopMedia(['screen'], sender.tab, function(streamId) {
        //     navigator.webkitGetUserMedia({
        //         audio: false,
        //         video: {
        //             mandatory: {
        //                 chromeMediaSourceId: streamId,
        //                 maxWidth: window.screen.width,
        //                 maxHeight: window.screen.height
        //             }
        //         }
        //     }, function(screenStream) {
        //         video = document.createElement("video");
        //         video.src = URL.createObjectURL(screenStream);
        //         debugger
        //         window.setTimeout(function() {
        //             cs = document.createElement("canvas");
        //             cs.width = video.videoWidth;
        //             cs.height = video.videoHeight;
        //             cs.getContext("2d").drawImage(video, 0, 0, cs.width, cs.height);
        //             screenStream.stop();
        //             image = document.createElement("img");
        //             image.src = cs.toDataURL();
        //         }, 500);
        //     }, function(err) {
        //         console.log('getUserMedia failed!: ' + err);
        //     });
        // });
        // chrome.tabCapture.capture({
        //     audio : false,
        //     video : true,
        //     videoConstraints: {
        //         mandatory: {
        //             width: { min: 640 },
        //             height: { min: 480 }
        //         }
        //     }
        // }, handleCapture);
    } else if (request.action === 'refreshOrderId') {
            chrome.tabs.query({
            currentWindow: true,
            url: 'http://*/*'
        }, function (tabs) {
            console.log('tabs');
            for (var i = 0; i < tabs.length; i++) {
                chrome.tabs.sendMessage(tabs[i].id, {
                    action: 'refreshOrderIdFromBackground',
                });
            };
        });
    }
});