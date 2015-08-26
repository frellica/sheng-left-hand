var amazonEmail = '',
    creditCard = '',
    securityCode = '';
var uploadImageUrl = 'http://buyers.youdao.com/order/uploadImage';
var opened = false;
var companyDict = {
    '佐川急便': 'SGH',
    'Yamato': 'Yamato',
    'Japan Post': 'JPPOST',
    'エコ配': 'OTHER',
    'ヤマト運輸': 'Yamato',
    '佐川急便(e飛伝PRO)': 'SGH',
    '日本郵便': 'JPPOST',
    'メール便': 'SGH',
    'UPS': 'UPS'
};
var addressDict = {
    '埼玉県': 'Saitama-ken'
};
var orderTemplate = '<a href="#" class="button tiny js-add-order"'
    + ' data-id="#orderId#">填写#orderId#</a>';

var inputTemplate = '<div class="row collapse"><div class="small-10 columns"><input type="text" '
    + 'msg="商家订单号" placeholder="商家订单ID" class="order-id-input"></div><div class="small-2 columns">'
    + '<a href="#" class="button postfix js-refresh-order-id">get</a></div></div>';

var refreshOrder = function () {
    chrome.storage.local.get(['orderId'], function(data) {
        if (typeof data['orderId'] === 'string') {
            // 兼容未升级老数据
            data['orderId'] = [data['orderId']];
        }
        if (data['orderId'] && data['orderId'].length === 1 && $('.order-id-input:focus').length === 0) {
            nowOrderId = data['orderId'][0];
            $('.order-id-input').val(data['orderId'][0]);
        } else if (data['orderId']) {
            var optionsHtml = '';
            for (var i = 0; i < data['orderId'].length; i++) {
                optionsHtml += orderTemplate.replace(/#orderId#/g, data['orderId'][i]);
            }
            $('#additionalOrder > div.large-10').html(optionsHtml);
        }
    });
    return false;
};
var dataURItoBlob = function (dataURI) {
    // convert base64/URLEncoded data component to raw binary data held in a string
    var byteString;
    if (dataURI.split(',')[0].indexOf('base64') >= 0)
        byteString = atob(dataURI.split(',')[1]);
    else
        byteString = unescape(dataURI.split(',')[1]);
    
    // separate out the mime component
    var mimeString = dataURI.split(',')[0].split(':')[1].split(';')[0];
    
    // write the bytes of the string to a typed array
    var ia = new Uint8Array(byteString.length);
    for (var i = 0; i < byteString.length; i++) {
        ia[i] = byteString.charCodeAt(i);
    }
    return new Blob([ia], {type: mimeString});
}
var getCookie = function (key) {
    return (result = new RegExp('(?:^|; )' + encodeURIComponent(key) + '=([^;]*)').exec(document.cookie)) ? decodeURIComponent(result[1]) : null
};

var uploadImage = function (image) {
    var blob = dataURItoBlob(image);
    var formData = new FormData();
    formData.append('Filename', 'temp.png');
    formData.append('Filedata', blob);
    var xhr = new XMLHttpRequest();
    xhr.open('POST', uploadImageUrl);
    xhr.onload = function () {
        if (xhr.status === 200) {
            var data = JSON.parse(xhr.responseText);
            if (!data.success) {
                console.log('上传失败，', data);
            } else {
                console.log(data);
                $('#order-capture-input').val(data.id);
                $('#upload-btn').addClass('title-update-btn success')
                    .removeClass('title-upload-btn').html('上传成功');
                chrome.runtime.sendMessage({
                    action: 'uploadImageDone',
                });
            }
            console.log('done');
        } else {
            console.log('upload error');
        }
    }
    xhr.send(formData);
};

var processHuihui = function (amazonEmail) {
    var nowOrderId = '';
    if ($('#additionalOrder').length === 0) {
        $('.table-content.merchant-form').append('<div class="row" id="additionalOrder">'
            + '<div class="large-2 columns">备选商家订单id</div><div class="large-10 columns"></div></div>');
        $('.table-content.merchant-form > .row > .columns').eq(1).html(inputTemplate);
        $(document).on('click', '.js-add-order', function () {
            $('.order-id-input').val($(this).data('id'));
            return false;
        });
        $(document).on('click', '.js-refresh-order-id', refreshOrder);
        $('.button.tiny.merchant-form-add').on('click', function () {
            $('.table-content.merchant-form > .row > .columns').eq(2).children().val(amazonEmail);
        });
    }

    var name = $('#firstname').val() + ' ' + $('#lastname').val();
    var originPrice = '';
    var rawPrice = $('#panel1 div.large-12').eq(-1).html();
    if (rawPrice.indexOf('JPY') > -1) {
        originPrice = parseInt(rawPrice.replace('订单总金额：JPY', ''), 10);
    } else {
        originPrice = parseFloat(rawPrice.replace('订单总金额：$', ''), 10);
    }
    chrome.storage.local.set({
        huihuiOrderId: $('.page-content > .row.panel > .column.center').eq(0).html().replace('订单号：', ''),
        name: name,
        originPrice: parseInt(originPrice, 10),
        address1: $('#address1').val(),
        address2: $('#address2').val(),
        state: $('#state').val(),
        city: $('#city').val(),
        zip1: $('#zip').val().split('-')[0],
        zip2: $('#zip').val().split('-')[1],
        tel: $('#tel').val()
    }, function() {
        console.log('name saved as ' + name);
    });
    $('.table-content.merchant-form > .row .row .large-4.columns input').val(originPrice);
    
    var nowPackId = '';
    var timer = setInterval(function () {
        chrome.storage.local.get(['packId', 'company'], function(data) {
            if (data['packId'] && data['packId'] !== nowPackId) {
                nowPackId = data['packId'];
                $('#shipping-form-tracking-id').val(data['packId']);
                if (companyDict[data['company']]) {
                    $('#shipping-company-select').val(companyDict[data['company']]);
                } else {
                    $('#shipping-company-select').val('OTHER');
                }
            }
        });
    }, 1000);
    $('.table-content.merchant-form > .row > .columns').eq(2).children().val(amazonEmail);
};

var fillAddress = function () {
    chrome.storage.local.get(['name', 'address1', 'address2', 'state', 'zip1', 'zip2', 'tel'], function (data) {
        $('#enterAddressFullName').val(data['name']);
        $('#enterAddressPostalCode1').val(data['zip1']);
        $('#enterAddressPostalCode2').val(data['zip2']);
        if ($('[value=Hokkaido]').length > 0) {
            $('#enterAddressStateOrRegion').val(addressDict[data['state']]);
        } else {
            $('#enterAddressStateOrRegion').val(data['state']);
        }
        $('#enterAddressAddressLine1').val(data['address1']);
        $('#enterAddressAddressLine2').val(data['address2']);
        $('#enterAddressPhoneNumber').val(data['tel']);
    });
};

var fill6pmAddress = function () {
    chrome.storage.local.get(['name', 'address1', 'address2', 'state', 'zip1', 'tel', 'city'], function (data) {
        $('#AddressForm_NAME').val(data['name']);
        $('#AddressForm_ZIP_CODE').val(data['zip1']);
        $('#AddressForm_STATE_OR_REGION').val(data['state']);
        $('#AddressForm_ADDRESS_LINE_1').val(data['address1']);
        $('#AddressForm_ADDRESS_LINE_2').val(data['address2']);
        $('#AddressForm_CITY').val(data['city']);
        $('#AddressForm_PHONE_NUMBER').val(data['tel']);
    });
    $('input[name=isAlsoBillingAddress]').attr('checked', false);
};

var fillCreditCard = function (creditCard, securityCode) {
    var delay = setTimeout(function () {
        if (!$('#pm_300').is(':checked')) {
            $('#pm_0').trigger('click');
            $('#addCreditCardNumber').val(creditCard);
            $('#confirm-card').trigger('click');
            var timerFill = setInterval(function () {
                if ($('#spinner-anchor').css('display') === 'none') {
                    $('.card-pcard-field.a-input-text-wrapper > input').val(securityCode);
                    clearInterval(timerFill);
                }
            }, 500);
        }
    }, 3000);
};
var fillHuihui = function () {
    var delay = setTimeout(function () {
        var orderIdList = []
        $('#orders-list .shipment > b').each(function (index) {
            orderIdList.push($('#orders-list .shipment > b').eq(index).html());
        });
        chrome.storage.local.set({
            orderId: orderIdList
        }, function() {
            console.log('order id saved as ' + orderIdList);
            chrome.runtime.sendMessage({
                action: 'refreshOrderId',
            });
        });
    }, 800);
};

var fillHuihuiFrom6pm = function () {
    var delay = setTimeout(function () {
        var orderIdList = []
        $('#orders-list .shipment > b').each(function (index) {
            orderIdList.push($('.thank-you-order-id.a-text-bold').text());
        });
        chrome.storage.local.set({
            orderId: orderIdList
        }, function() {
            console.log('order id saved as ' + orderIdList);
            chrome.runtime.sendMessage({
                action: 'refreshOrderId',
            });
        });
    }, 800);
};

var getPrice = function () {
    chrome.storage.local.get(['originPrice', 'huihuiOrderId'], function(data) {
        var timerCapture = setInterval(function () {
            if ($('#spinner-anchor').css('display') === 'none') {
                chrome.runtime.sendMessage({
                    action: 'capture',
                    huihuiOrderId: data['huihuiOrderId']
                });
                clearInterval(timerCapture);
            }
        }, 500);
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
var fill6pmPackId = function () {
    var delay = setTimeout(function () {
        var packId = $('li.ccInfo p').eq(1).text();
        var company = $('li.ccInfo p').eq(0).text();
        console.log(company);
        chrome.storage.local.set({
            packId: packId,
            company: company
        }, function() {
            console.log('packId saved as ' + packId);
        });
        var orderId = window.location.href.split('/')[4];
        var url = 'http://buyers.youdao.com/order/myorders?showOrderId=&merchantOrderId='
            + orderId + '&trackingNo=&merchantAccount=&globalOrderStatus=&buyerOrderStatus='
            + '&domain=&startTime=&endTime=&page=1';
        if (!opened) {
            opened = true;
            window.open(url);
        }
    }, 800);
};
var refillAddress = function () {
    if ($('.displayAddressLI.displayAddressFullName').length > 0) {
        chrome.storage.local.set({
            name: $('.displayAddressLI.displayAddressFullName').eq(0).html()
        });
    }
    chrome.storage.local.get(['name', 'address1', 'address2', 'state', 'zip1', 'zip2', 'tel'], function (data) {
        $('#enterAddressFullName').val(data['name']);
        $('#enterAddressPostalCode1').val(data['zip1']);
        $('#enterAddressPostalCode2').val(data['zip2']);
        if ($('[value=Hokkaido]').length > 0) {
            $('#enterAddressStateOrRegion').val(addressDict[data['state']]);
        } else {
            $('#enterAddressStateOrRegion').val(data['state']);
        }
        $('#enterAddressAddressLine1').val(data['address1']);
        $('#enterAddressAddressLine2').val(data['address2']);
        $('#enterAddressPhoneNumber').val(data['tel']);
    });
};
var newFillPackId = function () {
    var company,
        packId;
    var delay = setTimeout(function () {
        var packData = $('.a-row.a-spacing-top-mini.a-size-small.a-color-tertiary.ship-track-grid-subtext').text();
        if (!packData) {
            packData = $('.a-row.a-spacing-top-small.a-size-small.a-color-tertiary').text();
        }
        if (packData.indexOf('配送業者') > -1) {
            company = packData.split('、')[0].split('：')[1];
            packId = packData.split('、')[1].split('：')[1];
        } else {
            company = packData.split(', ')[0].split(': ')[1];
            packId = packData.split(', ')[1].split(': ')[1];
        }
        console.log(company);
        chrome.storage.local.set({
            packId: packId,
            company: company
        }, function() {
            console.log('packId saved as ' + packId);
        });
        var orderId = window.location.href.split('orderId=')[1].split('&')[0];
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
        } else if (window.location.href.indexOf('https://secure-www.6pm.com/checkout/address') > -1) {
            fill6pmAddress();
        } else if (window.location.href.indexOf('https://www.amazon.co.jp/gp/buy/payselect/handlers/display.html') > -1) {
            fillCreditCard(creditCard, securityCode);
        } else if (window.location.href.indexOf('https://www.amazon.co.jp/gp/buy/thankyou/handlers/display.html') > -1) {
            fillHuihui();
        } else if (window.location.href.indexOf('https://secure-www.6pm.com/checkout/thankyou') > -1) {
            fillHuihuiFrom6pm();
        } else if (window.location.href.indexOf('https://www.amazon.co.jp/gp/buy/spc/handlers/display.htm') > -1) {
            getPrice();
        } else if (window.location.href.indexOf('https://www.amazon.co.jp/gp/css/shiptrack/view.html') > -1) {
            fillPackId();
        } else if (window.location.href.indexOf('https://secure-www.6pm.com/shipments/') > -1) {
            fill6pmPackId();
        } else if (window.location.href.indexOf('https://www.amazon.co.jp/gp/css/order/edit.html') > -1) {
            refillAddress();
        } else if (window.location.href.indexOf('https://www.amazon.co.jp/gp/your-account/ship-track') > -1) {
            newFillPackId();
        }
        if (window.location.href.indexOf('https://www.amazon.co.jp/gp/buy/thankyou/handlers/display.html') > -1) {
            setTimeout(function() {
                chrome.storage.local.get(['amazonEmail', 'creditCard', 'securityCode'], update);
            }, 2000);
        } else if (window.location.href.indexOf('https://www.amazon.co.jp/gp/buy/') > -1
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
    } else if (request.action === 'refreshOrderIdFromBackground') {
        refreshOrder();
    } else if (request.action === 'captureDone') {
        $('.a-row.a-size-large.a-text-bold.a-spacing-mini').append('<span class="farmer notice">截图上传完毕</span>');
    } else if (request.action === 'uploadImage') {
        uploadImage(request.image);
    }
});
chrome.storage.local.get(['amazonEmail', 'creditCard', 'securityCode'], update);
chrome.storage.onChanged.addListener(function(changes, namespace) {
    chrome.storage.local.get(['amazonEmail', 'creditCard', 'securityCode'], update);
});
