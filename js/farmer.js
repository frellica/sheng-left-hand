var nowUrl = window.location.href;
console.log(nowUrl);
var amazonEmail = '',
    creditCard = '',
    securityCode = '';
var opened = false;
var companyDict = {
    '佐川急便': 'SGH',
    'Yamato': 'Yamato',
    'Japan Post': 'JPPOST'
};



var processHuihui = function (amazonEmail) {
    var name = $('#firstname').val() + ' ' + $('#lastname').val();
    originPrice = parseInt($('#panel1 div.large-12').eq(5).html().replace('订单总金额：JPY', ''), 10);
    chrome.storage.local.set({
        huihuiOrderId: $('.page-content > .row.panel > .column.center').eq(0).html().replace('订单号：', ''),
        name: name,
        originPrice: parseInt(originPrice, 10),
        address1: $('#address1').val(),
        address2: $('#address2').val(),
        state: $('#state').val(),
        zip1: $('#zip').val().split('-')[0],
        zip2: $('#zip').val().split('-')[1],
        tel: $('#tel').val()
    }, function() {
        console.log('name saved as ' + name);
    });
    $('.table-content.merchant-form > .row .row .large-4.columns input').val(originPrice);
    var timer = setInterval(function () {
        chrome.storage.local.get(['orderId', 'realPrice', 'packId', 'company'], function(data) {
            if (data['orderId']) {
                $('.table-content.merchant-form > .row > .columns').eq(1).children().val(data['orderId']);
            }
            if (data['packId']) {
                $('#shipping-form-tracking-id').val(data['packId']);
                if (companyDict[data['company']]) {
                    $('#shipping-company-select').val(companyDict[data['company']]);
                } else {
                    $('#shipping-company-select').val('Yamato');
                }
            }
        });
    }, 1000);
    $('.table-content.merchant-form > .row > .columns').eq(2).children().val(amazonEmail);
    $('#order-capture-input').val(141852);
};

var fillAddress = function () {
    chrome.storage.local.get(['name', 'address1', 'address2', 'state', 'zip1', 'zip2', 'tel'], function (data) {
        $('#enterAddressFullName').val(data['name']);
        $('#enterAddressPostalCode1').val(data['zip1']);
        $('#enterAddressPostalCode2').val(data['zip2']);
        $('#enterAddressStateOrRegion').val(data['state']);
        $('#enterAddressAddressLine1').val(data['address1']);
        $('#enterAddressAddressLine2').val(data['address2']);
        $('#enterAddressPhoneNumber').val(data['tel']);
    });
};

var fillCreditCard = function (creditCard, securityCode) {
    var delay = setTimeout(function () {
        $('#pm_0').trigger('click');
        $('#addCreditCardNumber').val(creditCard);
        $('#confirm-card').trigger('click');
        var timerFill = setInterval(function () {
            if ($('#spinner-anchor').css('display') === 'none') {
                $('.card-pcard-field.a-input-text-wrapper > input').val(securityCode);
                clearInterval(timerFill)
            }
        }, 500);
    }, 3000);
};
var fillHuihui = function () {
    chrome.runtime.sendMessage({
                action: 'save',
                creditCard: $('#creditCard').val(),
                securityCode: $('#securityCode').val(),
                amazonEmail: $('#amazonEmail').val()
            });
    var delay = setTimeout(function () {
        var orderId = $('#orders-list .shipment > b').html();
        chrome.storage.local.set({
            orderId: orderId
        }, function() {
            console.log('order id saved as ' + orderId);
        });
    }, 800);
}
var getPrice = function () {
    chrome.storage.local.get(['originPrice', 'huihuiOrderId'], function(data) {
        chrome.runtime.sendMessage({
            action: 'capture',
            huihuiOrderId: data['huihuiOrderId']
        });
        var originPrice = data['originPrice'];
        var nowPrice = parseInt($('.a-size-medium.a-color-price.aok-align-bottom.aok-nowrap'
            + '.grand-total-price.a-text-right > strong').html().replace('￥ ', '').replace(',', ''), 10);
        console.log('originPrice: ' + originPrice);
        console.log('nowPrice: ' + nowPrice);
        if ((originPrice > 5000 && nowPrice - originPrice > 240) || (originPrice < 5000 && nowPrice - originPrice > 120)) {
            $('.a-size-medium.a-color-price.aok-align-bottom.aok-nowrap'
            + '.grand-total-price.a-text-right > strong').css('color', '#fff').parent().css('background', '#f00');
        }
    });
};
var fillPackId = function () {
    var delay = setTimeout(function () {
        var packId = $('#mainContent > .a-row > .a-fixed-right-flipped-grid'
            + ' > .a-fixed-right-grid-inner > .a-fixed-right-grid-col.a-col-right'
            + ' > .a-box-group > div').eq(2).children().children('span').eq(3).html();
        var company = $('#mainContent > .a-row > .a-fixed-right-flipped-grid'
            + ' > .a-fixed-right-grid-inner > .a-fixed-right-grid-col.a-col-right'
            + ' > .a-box-group > div').eq(2).children().children('span').eq(1).html();
        console.log(company);
        chrome.storage.local.set({
            packId: packId,
            company: company
        }, function() {
            console.log('packId saved as ' + packId);
        });
        var orderId = $('#mainContent > .a-row > .a-fixed-right-flipped-grid'
            + ' > .a-fixed-right-grid-inner > .a-fixed-right-grid-col.a-col-right'
            + ' > .a-box-group > div').eq(3).children().children('span').eq(1).html();
        var url = 'http://buyers.youdao.com/order/myorders?showOrderId=&merchantOrderId='
            + orderId + '&trackingNo=&merchantAccount=&globalOrderStatus=&buyerOrderStatus='
            + '&domain=&startTime=&endTime=&page=1';
        if (!opened) {
            opened = true;
            window.open(url);
        }
    }, 800);
};
var update = function (data) {
    amazonEmail = data.amazonEmail;
    creditCard = data.creditCard;
    securityCode = data.securityCode;
    var delayUpdate = setTimeout(function () {
        if (window.location.href.indexOf('http://buyers.youdao.com/order?id=') > -1) {
            processHuihui(amazonEmail);
        } else if (window.location.href.indexOf('https://www.amazon.co.jp/gp/buy/addressselect/handlers/display.htm') > -1) {
            fillAddress();
        } else if (window.location.href.indexOf('https://www.amazon.co.jp/gp/buy/payselect/handlers/display.html') > -1) {
            fillCreditCard(creditCard, securityCode);
        } else if (window.location.href.indexOf('https://www.amazon.co.jp/gp/buy/thankyou/handlers/display.html') > -1) {
            fillHuihui();
        } else if (window.location.href.indexOf('https://www.amazon.co.jp/gp/buy/spc/handlers/display.htm') > -1) {
            getPrice();
        } else if (window.location.href.indexOf('https://www.amazon.co.jp/gp/css/shiptrack/view.html') > -1) {
            fillPackId();
        }
        if (window.location.href.indexOf('https://www.amazon.co.jp/gp/buy/') > -1
            && window.location.href.indexOf('https://www.amazon.co.jp/gp/buy/spc/handlers/display.html') === -1) {
            setTimeout(function() {
                chrome.storage.local.get(['amazonEmail', 'creditCard', 'securityCode'], update);
            }, 1000);
        }
    }, 500);
};
chrome.runtime.onMessage.addListener(function (request, sender, sendResponse){
    console.log(request);
    if(request.action === 'save'){
        chrome.storage.local.set({
            amazonEmail: request.amazonEmail,
            creditCard: request.creditCard,
            securityCode: request.securityCode
        }, function () {
            console.log('saved', request);
        })
    }
});
chrome.storage.local.get(['amazonEmail', 'creditCard', 'securityCode'], update);
chrome.storage.onChanged.addListener(function(changes, namespace) {
    chrome.storage.local.get(['amazonEmail', 'creditCard', 'securityCode'], update);
});
