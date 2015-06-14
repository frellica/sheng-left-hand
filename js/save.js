/* 
* @Author: frellica
* @Date:   2015-06-13 04:20:50
* @Last Modified by:   frellica
* @Last Modified time: 2015-06-13 13:43:28
*/

'use strict';
setTimeout(function () {
$('#save').on('click', function () {
    chrome.tabs.query({
        currentWindow: true,
        url: 'http://*/*'
    }, function (tabs) {
        console.log('tabs');
        for (var i = 0; i < tabs.length; i++) {
            chrome.tabs.sendMessage(tabs[i].id, {
                action: 'save',
                creditCard: $('#creditCard').val(),
                securityCode: $('#securityCode').val(),
                amazonEmail: $('#amazonEmail').val()
            });
        };
    });
});
}, 500);