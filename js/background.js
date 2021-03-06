/* 
* @Author: frellica
* @Date:   2015-06-15 20:31:56
* @Last Modified by:   frellica
* @Last Modified time: 2016-02-12 22:16:46
*/

'use strict';

var captureCurrentTabAndSave = function (huihuiOrderId) {
    chrome.tabs.captureVisibleTab(null, {
        format: 'png',
        quality: 100
    }, function (capturedImage) {
        chrome.tabs.query({
            currentWindow: true,
            url: 'http://buyers.youdao.com/*'
        }, function (tabs) {
            for (var i = 0; i < tabs.length; i++) {
                chrome.tabs.sendMessage(tabs[i].id, {
                    action: 'uploadImage',
                    image: capturedImage
                });
            };
        });
        console.log(capturedImage)
    });
};
chrome.runtime.onMessage.addListener(function (request, sender, sendResponse){
    console.log(request);
    if(request.action === 'capture'){
        captureCurrentTabAndSave(request.huihuiOrderId);
    } else if (request.action === 'refreshOrderId') {
        chrome.tabs.query({
            currentWindow: true,
            url: 'http://buyers.youdao.com/*'
        }, function (tabs) {
            console.log('tabs');
            for (var i = 0; i < tabs.length; i++) {
                chrome.tabs.sendMessage(tabs[i].id, {
                    action: 'refreshOrderIdFromBackground',
                });
            };
        });
    } else if (request.action === 'uploadImageDone') {
        chrome.tabs.query({
            currentWindow: true,
            url: 'https://www.amazon.co.jp/gp/buy/spc/handlers/display.html?hasWorkingJavascript=1'
        }, function (tabs) {
            console.log('tabs');
            for (var i = 0; i < tabs.length; i++) {
                chrome.tabs.sendMessage(tabs[i].id, {
                    action: 'captureDone',
                });
            };
        });
        chrome.tabs.query({
            currentWindow: true,
            url: 'https://www.amazon.com/gp/css/summary/edit.html'
        }, function (tabs) {
            console.log('tabs');
            for (var i = 0; i < tabs.length; i++) {
                chrome.tabs.sendMessage(tabs[i].id, {
                    action: 'captureDone',
                });
            };
        });
        chrome.tabs.query({
            currentWindow: true,
            url: 'https://secure-www.6pm.com/orders/*'
        }, function (tabs) {
            console.log('tabs');
            for (var i = 0; i < tabs.length; i++) {
                chrome.tabs.sendMessage(tabs[i].id, {
                    action: 'captureDone',
                });
            };
        });
        chrome.tabs.query({
            currentWindow: true,
            url: 'https://www.amazon.com/gp/your-account/order-details/*'
        }, function (tabs) {
            console.log('tabs');
            for (var i = 0; i < tabs.length; i++) {
                chrome.tabs.sendMessage(tabs[i].id, {
                    action: 'captureDone',
                });
            };
        });
        chrome.tabs.query({
            currentWindow: true,
            url: 'https://www.amazon.co.jp/gp/your-account/order-details/*'
        }, function (tabs) {
            console.log('tabs');
            for (var i = 0; i < tabs.length; i++) {
                chrome.tabs.sendMessage(tabs[i].id, {
                    action: 'captureDone',
                });
            };
        });
    }
});