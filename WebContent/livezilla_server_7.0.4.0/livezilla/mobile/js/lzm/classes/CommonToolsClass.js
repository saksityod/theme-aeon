/****************************************************************************************
 * LiveZilla CommonToolsClass.js
 *
 * Copyright 2017 LiveZilla GmbH
 * All rights reserved.
 * LiveZilla is a registered trademark.
 *
 ***************************************************************************************/

function CommonToolsClass() {
    this.ticketSalutations = {};
    this.permissions = [];
}

CommonToolsClass.prototype.pad = function (number, length, paddingSymbol, paddingSide) {
    if (typeof paddingSymbol == 'undefined' || paddingSymbol == '') {
        paddingSymbol = '0';
    } else if (paddingSymbol == '&nbsp;') {
        paddingSymbol = '°'
    }
    if (typeof paddingSide == 'undefined' || paddingSide == '')
        paddingSide = 'l';
    var str = String(number);
    while (str.length < length) {
        if (paddingSide == 'l')
            str = paddingSymbol + str;
        else
            str = str + paddingSymbol;
    }
    str=str.replace(/°/g,"&nbsp;");
    return str;
};

CommonToolsClass.prototype.clone = function (originalObject) {
    try
    {
        if(!d(originalObject))
            return null;
        var origJsonString = JSON.stringify(originalObject);
        var copyJsonString = origJsonString;
        var copyObject = JSON.parse(copyJsonString);
        return copyObject;
    }
    catch(ex)
    {

    }
    return originalObject;
};

CommonToolsClass.prototype.parseUrl = function (url) {
    var a = document.createElement('a');
    a.href = url;
    return a;
};

CommonToolsClass.prototype.getUrlParts = function (thisUrl, urlOffset) {
    thisUrl = (typeof thisUrl != 'undefined') ? thisUrl : document.URL;
    urlOffset = (typeof urlOffset != 'undefined') ? urlOffset : 'undefined';

    if (thisUrl.indexOf('#') != -1)
    {
        thisUrl = document.URL.split('#')[0];
    }

    var thisUrlParts = thisUrl.split('://');
    var thisProtocol = thisUrlParts[0] + '://';

    thisUrlParts = thisUrlParts[1].split('/');
    var thisUrlRest = '', thisMobileDir = '';
    if (urlOffset == 'undefined') {
        urlOffset = 1;
        if (thisUrlParts[thisUrlParts.length - 1].indexOf('html') != -1 || thisUrlParts[thisUrlParts.length - 1].indexOf('php') != -1 || thisUrlParts[thisUrlParts.length - 1] == '') {
            urlOffset = 2;
        }
    }
    for (var i = 1; i < (thisUrlParts.length - urlOffset); i++) {
        thisUrlRest += '/' + thisUrlParts[i];
    }
    thisMobileDir = thisUrlParts[thisUrlParts.length - urlOffset];

    var thisUrlBase = '';
    var thisPort = '';
    if (thisUrlParts[0].indexOf(':') == -1) {
        thisUrlBase = thisUrlParts[0];
        if (thisProtocol == 'https://') {
            thisPort = '443';
        } else {
            thisPort = '80';
        }
    } else {
        thisUrlParts = thisUrlParts[0].split(':');
        thisUrlBase = thisUrlParts[0];
        thisPort = thisUrlParts[1];
    }
    return {protocol:thisProtocol, urlBase:thisUrlBase, urlRest:thisUrlRest, port:thisPort, mobileDir: thisMobileDir};
};

CommonToolsClass.prototype.createDefaultProfile = function (runningFromApp, chosenProfile) {
    var that = this;
    if (runningFromApp == false && (chosenProfile == -1 || chosenProfile == null)) {
        this.storageData = [];
        var indexes = lzm_commonStorage.loadValue('indexes');
        var indexList = [];
        if (indexes != null && indexes != '') {
            indexList = indexes.split(',');
        }
        if ($.inArray('0', indexList) == -1) {
            var thisUrlParts = that.getUrlParts();
            var dataSet = {};
            dataSet.index = 0;
            dataSet.server_profile = 'Default profile';
            dataSet.server_protocol = thisUrlParts.protocol;
            dataSet.server_url = thisUrlParts.urlBase + thisUrlParts.urlRest;
            dataSet.mobile_dir = thisUrlParts.mobileDir;
            dataSet.server_port = thisUrlParts.port;
            dataSet.login_name = '';
            dataSet.login_passwd = '';
            dataSet.ldap_login = false;
            dataSet.auto_login = 0;
            if (indexes != null && indexes != '') {
                lzm_commonStorage.saveValue('indexes', '0,' + indexes);
            } else {
                lzm_commonStorage.saveValue('indexes', '0');
            }
            lzm_commonStorage.saveProfile(dataSet);
        }
    }
};

CommonToolsClass.prototype.getHumanDate = function(dateObject, returnType, language) {
    var year = (dateObject instanceof Array) ? dateObject[0] : dateObject.getFullYear();
    var month = (dateObject instanceof Array) ? this.pad(dateObject[1], 2) : this.pad((dateObject.getMonth() + 1), 2);
    var day = (dateObject instanceof Array) ? this.pad(dateObject[2], 2) : this.pad(dateObject.getDate(), 2);
    var hours =  (dateObject instanceof Array) ? this.pad(dateObject[3], 2) : this.pad(dateObject.getHours(), 2);
    var minutes = (dateObject instanceof Array) ? this.pad(dateObject[4], 2) : this.pad(dateObject.getMinutes(), 2);
    var seconds = (dateObject instanceof Array) ? this.pad(dateObject[5], 2) : this.pad(dateObject.getSeconds(), 2);
    var monthNames = [t('January'), t('February'), t('March'), t('April'), t('May'), t('June'), t('July'), t('August'), t('September'), t('October'), t('November'), t('December')];
    var dateYear = monthNames[parseInt(month) - 1] + ' ' + year;
    var date = t('<!--year-->-<!--month-->-<!--day-->',[['<!--year-->', year], ['<!--month-->', month], ['<!--day-->', day]]);
    var longDate = t('<!--month_name--> <!--day-->, <!--year-->',[['<!--month_name-->', monthNames[parseInt(month) -1]], ['<!--day-->', day], ['<!--year-->', year]]);

    var returnValue = '';
    switch (returnType) {
        case 'time':
            returnValue = hours + ':' + minutes + ':' + seconds;
            break;
        case 'shorttime':
            returnValue = hours + ':' + minutes;
            break;
        case 'date':
            returnValue = date;
            break;
        case 'longdate':
            returnValue = longDate;
            break;
        case 'dateyear':
            returnValue = dateYear;
            break;
        case 'iso':
            returnValue = year + '-' + month + '-' + day;
            break;
        default:
            returnValue = date + ' ' + hours + ':' + minutes + ':' + seconds;
    }
    return returnValue;
};

CommonToolsClass.prototype.getHumanTimeSpan = function(seconds) {
    var humanTimeSpan = 0;
    if (!isNaN(seconds) && seconds > 0) {
        var days = Math.floor(seconds / (3600 * 24));
        var remainingSeconds = seconds % (3600 * 24);
        var hours = this.pad(Math.floor(remainingSeconds / 3600), 2, '0', 'l');
        remainingSeconds = remainingSeconds % 3600;
        var minutes = this.pad(Math.floor(remainingSeconds / 60), 2, '0', 'l');
        seconds = this.pad(remainingSeconds % 60, 2, '0', 'l');
        humanTimeSpan = (days > 0) ? days + ' ' : '';
        humanTimeSpan += hours + ':' + minutes + ':' + seconds;
    }
    return humanTimeSpan;
};

CommonToolsClass.prototype.htmlEntities = function(str) {
    var escapedString = String(str).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
    return escapedString;
};

CommonToolsClass.prototype.checkTicketReadStatus = function(ticketId, statusArray, tickets) {
    tickets = (typeof tickets != 'undefined') ? tickets : [];
    var thisTicket = {id: ''};
    var ticketIsInArray = -1;
    for (var i=0; i<tickets.length; i++) {
        if (tickets[i].id == ticketId) {
            thisTicket = tickets[i];
        }
    }
    for (var j=0; j<statusArray.length; j++) {
        if (statusArray[j].id == ticketId) {
            ticketIsInArray = j;
        }
    }
    if (ticketIsInArray != -1 && thisTicket.id != '' && thisTicket.u > statusArray[ticketIsInArray].timestamp) {
        ticketIsInArray = -1
    }

    return ticketIsInArray;
};

CommonToolsClass.prototype.removeTicketFromReadStatusArray = function(ticketId, statusArray, doNotLog) {
    doNotLog = (typeof doNotLog != 'undefined') ? doNotLog : false;
    var tmpArray = [];
    for (var i=0; i<statusArray.length; i++) {
        if (statusArray[i].id != ticketId && statusArray[i].id != '') {
            tmpArray.push(statusArray[i]);
        }
    }
    return tmpArray;
};

CommonToolsClass.prototype.addTicketToReadStatusArray = function (ticket, statusArray, myTickets) {
    var ticketId = (typeof ticket == 'object') ? ticket.id : ticket;
    var ticketU = (typeof ticket == 'object') ? parseInt(ticket.u) : 0;
    var tmpArray = this.clone(statusArray);
    var timestamp = Math.max(lzm_chatTimeStamp.getServerTimeString(null, true), ticketU);
    if (this.checkTicketReadStatus(ticketId, tmpArray, myTickets) == -1 && ticketId != '')
    {
        tmpArray.push({id: ticketId, timestamp: timestamp});
    }
    return tmpArray;
};

CommonToolsClass.prototype.getTicketSalutationFields = function(ticket, messageNo) {
    var initialSalutations = {};
    var savedSalutations = lzm_commonStorage.loadValue('ticket_salutations_' + DataEngine.myId);
    if (savedSalutations == null || savedSalutations == '') {
        initialSalutations[DataEngine.userLanguage] = {
            'first name': [0],
            'last name': [0],
            'salutation': [0, [[t('Hi'), 1]]],
            'title': [-1, []],
            'introduction phrase': [0, [[t('Thanks for getting in touch with us.'), 1]]],
            'closing phrase': [0, [[t('If you have any questions, do not hesitate to contact us.'),1]]],
            'punctuation mark': [0, [[',', 1]]]
        };
    }
    if (savedSalutations == null || savedSalutations == '')
    {
        this.ticketSalutations = this.clone(initialSalutations);
    }
    else
    {
        this.ticketSalutations = JSON.parse(savedSalutations);
    }

    return this.createOrderedSalutationObject(ticket, messageNo);
};

CommonToolsClass.prototype.saveTicketSalutations = function (salutationFields, language) {
    var fieldNames = ['salutation', 'title', 'introduction phrase', 'closing phrase', 'punctuation mark'], i;
    if (typeof this.ticketSalutations[language] != 'undefined') {
        if (salutationFields['first name'][0]) {
            try {
                this.ticketSalutations[language]['first name'][0] += 1;
            } catch(e) {deblog(e);}
        } else {
            try {
                this.ticketSalutations[language]['first name'][0] -= 1;
            } catch(e) {deblog(e);}
        }
        if (salutationFields['last name'][0]) {
            try {
                this.ticketSalutations[language]['last name'][0] += 1;
            } catch(e) {deblog(e);}
        } else {
            try {
                this.ticketSalutations[language]['last name'][0] -= 1;
            } catch(e) {deblog(e);}
        }
        for (i=0; i<fieldNames.length; i++)
        {
            var text =  salutationFields[fieldNames[i]][1].replace(/ *$/, '').replace(/^ */, '');
            if (text != '' || fieldNames[i] == 'punctuation mark') {
                var salutationTextPosition = this.salutationTextExists(fieldNames[i], text, language);
                if (salutationTextPosition == -1) {
                    if (salutationFields[fieldNames[i]][0]) {
                        this.ticketSalutations[language][fieldNames[i]][1].push([text, 1]);
                        try {
                            this.ticketSalutations[language][fieldNames[i]][0] += 1;
                        } catch(e) {}
                    } else {
                        try {
                            this.ticketSalutations[language][fieldNames[i]][0] -= 1;
                        } catch(e) {}
                    }
                } else {
                    if (salutationFields[fieldNames[i]][0]) {
                        try {
                            this.ticketSalutations[language][fieldNames[i]][1][salutationTextPosition][1] += 1;
                        } catch(e) {}
                        try {
                            this.ticketSalutations[language][fieldNames[i]][0] += 1;
                        } catch(e) {}
                    } else {
                        try {
                            this.ticketSalutations[language][fieldNames[i]][0] -= 1;
                        } catch(e) {}
                    }
                }
            } else {
                try {
                    this.ticketSalutations[language][fieldNames[i]][0] -= 1;
                } catch(e) {}
            }
        }
    }
    else
    {
        this.ticketSalutations[language] = {};
        if (salutationFields['first name'][0])
        {
            this.ticketSalutations[language]['first name'] = [0];
        }
        else
        {
            this.ticketSalutations[language]['first name'] = [-1];
        }
        if (salutationFields['last name'][0])
        {
            this.ticketSalutations[language]['last name'] = [0];
        }
        else
        {
            this.ticketSalutations[language]['last name'] = [-1];
        }
        for (i=0; i<fieldNames.length; i++) {
            if (salutationFields[fieldNames[i]][1].replace(/ *$/, '').replace(/^ */, '') != '' || fieldNames[i] == 'punctuation mark') {
                if (salutationFields[fieldNames[i]][0]) {
                    this.ticketSalutations[language][fieldNames[i]] = [0, [[salutationFields[fieldNames[i]][1], 1]]];
                } else {
                    this.ticketSalutations[language][fieldNames[i]] = [-1, []];
                }
            } else {
                this.ticketSalutations[language][fieldNames[i]] = [-1, []];
            }
        }
    }

    for (i=0; i<fieldNames.length; i++)
    {
        try
        {
            this.ticketSalutations[language][fieldNames[i]][1].sort(this.salutationSortFunction);
        }
        catch(e)
        {
            deblog(e);
        }
    }
    lzm_commonStorage.saveValue('ticket_salutations_' + DataEngine.myId, JSON.stringify(this.ticketSalutations));
};

CommonToolsClass.prototype.deleteTicketSalutation = function(salutationField, salutationString) {
    var savedSalutations = lzm_commonStorage.loadValue('ticket_salutations_' + DataEngine.myId);
    if (savedSalutations != null && savedSalutations != '') {
        savedSalutations = JSON.parse(savedSalutations);
        var salutationSelectIds = {
            'tr-greet': 'salutation',
            'tr-title': 'title',
            'tr-intro': 'introduction phrase',
            'tr-close': 'closing phrase'
        };
        if (typeof salutationSelectIds[salutationField] != 'undefined') {
            $('.' + salutationField + '-selectoption').each(function() {
                if($(this).html().replace(/<span class="lzm-delete-menu-item".*?span>/, '') == salutationString)
                    $(this).remove();
            });
            for (var language in savedSalutations) {
                if (savedSalutations.hasOwnProperty(language)) {
                    for (var field in savedSalutations[language]) {
                        if (savedSalutations[language].hasOwnProperty(field)) {
                            if (field == salutationSelectIds[salutationField] && savedSalutations[language][field].length == 2 &&
                                savedSalutations[language][field][1].length > 0) {
                                var tmpArray = [];
                                for (var i=0; i<savedSalutations[language][field][1].length; i++) {
                                    if (savedSalutations[language][field][1][i][0] != salutationString) {
                                        tmpArray.push(savedSalutations[language][field][1][i]);
                                    }
                                }
                                this.ticketSalutations[language][field][1] = tmpArray;
                                savedSalutations[language][field][1] = tmpArray;
                            }
                        }
                    }
                }
            }
            lzm_commonStorage.saveValue('ticket_salutations_' + DataEngine.myId, JSON.stringify(savedSalutations));
        }
    }
};

CommonToolsClass.prototype.createOrderedSalutationObject = function(ticket, messageNo) {
    var remainingSalutationFields = {'salutation': [], 'title': [], 'introduction phrase': [], 'closing phrase': [], 'punctuation mark': []};
    var fieldNames = Object.keys(remainingSalutationFields);
    var salutationFields = {}, i, j, savedResult, thisLang, salutationCounter = {};
    messageNo = (typeof messageNo == 'undefined' || isNaN(messageNo) || messageNo < 0) ? 0 : messageNo;
    var nameArray = ticket.messages[messageNo].fn.split(' '), firstName = nameArray[0].replace(/^ +/, '').replace(/ +$/, '');
    nameArray.splice(0,1);
    var lastName = nameArray.join(' ').replace(/^ +/, '').replace(/ +$/, '');
    if (ticket.messages[messageNo].fn.indexOf(',') != -1)
    {
        nameArray = ticket.messages[messageNo].fn.split(',');
        lastName = nameArray[0].replace(/^ +/, '').replace(/ +$/, '');
        nameArray.splice(0,1);
        firstName = nameArray.join(',').replace(/^ +/, '').replace(/ +$/, '');
    }
    var myTicketSalutations = this.clone(this.ticketSalutations);
    salutationFields['punctuation mark'] = [true, [[',',0]]];
    if (typeof myTicketSalutations[ticket.l.toLowerCase()] != 'undefined')
    {
        salutationFields['first name'] = [(myTicketSalutations[ticket.l.toLowerCase()]['first name'][0] >= 0), firstName];
        salutationFields['last name'] = [(myTicketSalutations[ticket.l.toLowerCase()]['last name'][0] >= 0), lastName];
        for (i=0; i<fieldNames.length; i++) {
            savedResult = myTicketSalutations[ticket.l.toLowerCase()][fieldNames[i]];
            try {savedResult[1].sort(this.salutationSortFunction);} catch(e) {}
            salutationFields[fieldNames[i]] = (savedResult[1].length > 0) ? [(savedResult[0] >= 0)] : [false];
            salutationFields[fieldNames[i]][1] = (savedResult[1].length > 0) ? savedResult[1] : [['',0]];
            salutationCounter[fieldNames[i]] = salutationFields[fieldNames[i]][1].length;
        }
    }
    else
    {
        salutationFields['first name'] = [true, firstName];
        salutationFields['last name'] = [true, lastName];
        for (i=0; i<fieldNames.length; i++) {
            salutationFields[fieldNames[i]] = ($.inArray(fieldNames[i], ['salutation', 'introduction phrase', 'closing phrase', 'punctuation mark']) != -1) ? [true] : [false];
            salutationFields[fieldNames[i]][1] = [];
            salutationCounter[fieldNames[i]] = 0;
        }
    }
    for (thisLang in myTicketSalutations) {
        if (myTicketSalutations.hasOwnProperty(thisLang) && thisLang != ticket.l.toLowerCase()) {
            remainingSalutationFields = this.addSalutationValue(thisLang, fieldNames, remainingSalutationFields, salutationFields);
        }
    }
    var newSalutationFields = JSON.parse(JSON.stringify(salutationFields));
    for (i=0; i<fieldNames.length; i++) {
        try{remainingSalutationFields[fieldNames[i]].sort(this.salutationSortFunction);} catch(e) {}
        var maxAdd = Math.min(remainingSalutationFields[fieldNames[i]].length, 15 - salutationCounter[fieldNames[i]]);
        for (j=0; j<maxAdd; j++) {
            newSalutationFields[fieldNames[i]][1].push(remainingSalutationFields[fieldNames[i]][j]);
        }
        if (newSalutationFields[fieldNames[i]][1].length == 0) {
            newSalutationFields[fieldNames[i]][1] = [['', 0]];
        }
    }
    return newSalutationFields;
};

CommonToolsClass.prototype.addSalutationValue = function(language, fieldNames, remainingSalutationFields, existingSalutationFields) {
    for (var i=0; i<fieldNames.length; i++) {
        var savedResult = this.ticketSalutations[language][fieldNames[i]];
        for (var j=0; j<savedResult[1].length; j++) {
            var valueAlreadyPresent = false;
            var k = 0;
            for (k=0; k<existingSalutationFields[fieldNames[i]][1].length; k++) {
                try {
                    if (savedResult[1][j][0] == existingSalutationFields[fieldNames[i]][1][k][0]) {
                        valueAlreadyPresent = true;
                    }
                } catch(e) {}
            }
            if (!valueAlreadyPresent) {
                for (k=0; k<remainingSalutationFields[fieldNames[i]].length; k++) {
                    try {
                        if (savedResult[1][j][0] == remainingSalutationFields[fieldNames[i]][k][0]) {
                            valueAlreadyPresent = true;
                            remainingSalutationFields[fieldNames[i]][k][1] += savedResult[1][j][1];
                        }
                    } catch(e) {}
                }
            }
            if (!valueAlreadyPresent) {
                remainingSalutationFields[fieldNames[i]].push(savedResult[1][j]);
            }
        }
    }
    return remainingSalutationFields;
};

CommonToolsClass.prototype.salutationTextExists = function(fieldName, text, language) {
    var salutationTextPosition = -1;
    for (var i=0; i<this.ticketSalutations[language][fieldName][1].length; i++) {
        if (this.ticketSalutations[language][fieldName][1][i][0] == text) {
            salutationTextPosition = i;
            break;
        }
    }

    return salutationTextPosition;
};

CommonToolsClass.prototype.salutationSortFunction = function(a, b) {
    return (b[1] - a[1]);
};

CommonToolsClass.prototype.checkEmailReadStatus = function(emailId) {
    var emailIsRead = -1;
    for (var i=0; i<lzm_chatDisplay.emailReadArray.length; i++) {
        if (lzm_chatDisplay.emailReadArray[i].id == emailId) {
            emailIsRead = i;
        }
    }
    return emailIsRead;
};

CommonToolsClass.prototype.clearEmailReadStatusArray = function() {
    var tmpArray = [];
    for (var i=0; i<lzm_chatDisplay.emailReadArray.length; i++) {
        if (lzm_chatTimeStamp.getServerTimeString(null, true) - lzm_chatDisplay.emailReadArray[i].c <= 1209600) {
            tmpArray.push(lzm_chatDisplay.emailReadArray[i]);
        }
    }
    lzm_chatDisplay.emailReadArray = tmpArray;
};

CommonToolsClass.prototype.checkEmailTicketCreation = function(emailId) {
    var emailTicketCreated = -1;
    for (var i=0; i<lzm_chatDisplay.ticketsFromEmails.length; i++) {
        if (lzm_chatDisplay.ticketsFromEmails[i]['email-id'] == emailId) {
            emailTicketCreated = i;
        }
    }
    return emailTicketCreated;
};

CommonToolsClass.prototype.removeEmailFromTicketCreation = function(emailId) {
    var tmpArray = [];
    for (var i=0; i<lzm_chatDisplay.ticketsFromEmails.length; i++) {
        if (lzm_chatDisplay.ticketsFromEmails[i]['email-id'] != emailId) {
            tmpArray.push(lzm_chatDisplay.ticketsFromEmails[i]);
        }
    }
    lzm_chatDisplay.ticketsFromEmails = tmpArray;
};

CommonToolsClass.prototype.removeEmailFromDeleted = function(emailId) {
    var tmpArray = [];
    for (var i=0; i<lzm_chatDisplay.emailDeletedArray.length; i++) {
        if (lzm_chatDisplay.emailDeletedArray[i] != emailId) {
            tmpArray.push(lzm_chatDisplay.emailDeletedArray[i]);
        }
    }
    lzm_chatDisplay.emailDeletedArray = tmpArray;
};

CommonToolsClass.prototype.checkEmailIsLockedBy = function(emailId, operatorId) {
    for (var i=0; i<DataEngine.emails.length; i++) {
        if((DataEngine.emails[i].id == emailId || emailId == '') &&
            DataEngine.emails[i].ei == operatorId) {
            return true;
        }
    }
    return false;
};

CommonToolsClass.prototype.sortEmails = function(a, b) {
    if (a.c > b.c)
        return 1;
    else if (a.c < b.c)
        return -1;
    else
        return 0;
};

CommonToolsClass.prototype.phpUnserialize = function(serializedString) {
    var unserializedObject = null;
    if (serializedString == 'a:0:{}')
    {
        unserializedObject = [];
    }
    else
    {
        var tmpArray = serializedString.split(':'), unserializedObject = null, prefixLength = 0;
        if (tmpArray[0] == 'i')
        {
            unserializedObject = parseInt(tmpArray[1]);
        }
        else if (tmpArray[0] == 'b')
        {
            unserializedObject = (tmpArray[1] == 0) ? false : true;
        }
        else if (tmpArray[0] == 's')
        {
            var stringLength = tmpArray[1];
            prefixLength = 4 + stringLength.length;
            unserializedObject = lz_global_base64_url_decode(serializedString.substr(prefixLength, stringLength));
        }
        else if(tmpArray[0] == 'a')
        {
            var arrayLength = tmpArray[1];
            prefixLength = 4 + arrayLength.length;
            var tmpObject = serializedString.substr(prefixLength, serializedString.length - prefixLength - 2).split(';');
            unserializedObject = {};
            var unserializedArray = [], arrayCounter = 0, isArray = true;
            for (var i=0; i<tmpObject.length; i+=2) {
                unserializedObject[this.phpUnserialize(tmpObject[i])] = this.phpUnserialize(tmpObject[i + 1]);
                if (typeof this.phpUnserialize(tmpObject[i]) == 'number' && this.phpUnserialize(tmpObject[i]) == arrayCounter) {
                    unserializedArray.push(this.phpUnserialize(tmpObject[i + 1]));
                    arrayCounter++;
                }
                else
                {
                    isArray = false;
                }
            }
            unserializedObject = (isArray) ? unserializedArray : unserializedObject;
        }
    }
    return unserializedObject;
};

CommonToolsClass.prototype.replacePlaceholders = function(myString, replacements) {
    for (var i=0; i<replacements.length; i++) {
        var regExp = new RegExp(replacements[i].pl, 'g');
        myString = myString.replace(regExp, replacements[i].rep);
    }
    return myString;
};

CommonToolsClass.prototype.replaceLinksInChatView = function(htmlText) {

    var regExpMatch = htmlText.match(/<a.*?href=".*?".*?>.*?<\/a>/gi); // [^#]
    if (regExpMatch != null)
    {
        for (var i=0; i<regExpMatch.length; i++)
        {
            var thisHtml = regExpMatch[i];
            if (thisHtml.match(/lz_chat_file/i) != null)
            {
                thisHtml = thisHtml.replace(/<[a].*?href="(.*?)".*?>(.*?)<\/[a]>/gi, '<a data-role="none" class="lz_chat_file_no_icon" href="#" data-url="$1" onclick="downloadFile(\'$1\');">$2</a>');
            }
            else if (thisHtml.match(/handleUploadRequest/i) != null) {
                // Do not replace this
            }
            else if (thisHtml.match(/<a.*?href=".*?".+?data\-url=".*?".+?>.*?<\/a>/i) != null && thisHtml.match("data\-url") != null)
            {
                thisHtml = thisHtml.replace(/<a(.*?)href="(.*?)".*?data\-url="(.*?)"(.+?)>(.*?)<\/a>/gi, '<a$1href="#" data-url="$3" onclick="openLink(\'$3\', event);"$4>$5</a>');
            }
            else if (thisHtml.match(/<a.*?href=".*?".+?data\-url=".*?">.*?<\/a>/i) != null && thisHtml.match("data\-url") != null) {
                thisHtml = thisHtml.replace(/<a(.*?)href="(.*?)".*?data\-url="(.*?)">(.*?)<\/a>/gi, '<a$1href="#" data-url="$3" onclick="openLink(\'$3\', event);">$4</a>');
            }
            else if (thisHtml.match(/<a.*?href=".*?".+?>.*?<\/a>/i) != null) {
                thisHtml = thisHtml.replace(/<a(.*?)href="(.*?)"(.+?)>(.*?)<\/a>/gi, '<a$1href="#" data-url="$2" onclick="openLink(\'$2\', event);"$3>$4</a>');
            }
            else {
                thisHtml = thisHtml.replace(/<a(.*?)href="(.*?)">(.*?)<\/a>/gi, '<a$1href="#" data-url="$2" onclick="openLink(\'$2\', event);">$3</a>');
            }
            var thisRegExp = new RegExp(RegExp.escape(regExpMatch[i]), 'gi');
            htmlText = htmlText.replace(thisRegExp, thisHtml);
            htmlText = htmlText.replace(/target=".*?"/, '');
        }
    }
    return htmlText;
};

CommonToolsClass.prototype.addLinksToChatInput = function(myText) {

    myText = myText.replace(/&nbsp;/g,' ');
    var i, j, replacement, replaceLink;
    var webSites = myText.match(/(www\.|(http|https):\/\/)[.a-z0-9-]+\.[a-z0-9\/_:@=.+!?,##%&~-]*[^.|'|# |\(|?|,| |>|<|;|\)]/gi);

    var existingLinks = myText.match(/<a.*?href.*?>.*?<\/a>/gi);
    var existingSource = myText.match(/<.*?src.*?>/gi);

    if (typeof webSites != 'undefined' && webSites != null)
    {
        for (i=0; i<webSites.length; i++)
        {
            replaceLink = true;
            if (typeof existingLinks != 'undefined' && existingLinks != null)
            {
                for (j=0;j<existingLinks.length; j++)
                {
                    if (existingLinks[j].indexOf(webSites[i])) {
                        replaceLink = false;
                    }
                }
            }
            if (typeof existingSource != 'undefined' && existingSource != null)
            {
                for (j=0;j<existingSource.length; j++)
                {
                    if (existingSource[j].indexOf(webSites[i])) {
                        replaceLink = false;
                    }
                }
            }

            if (replaceLink)
            {
                if (webSites[i].toLowerCase().indexOf('http') != 0)
                    replacement = '<a target="_blank" class="lz_chat_link" href="http://' + webSites[i] + '" data-url="http://' + webSites[i] + '">' + lzm_commonTools.SubStr(webSites[i],120,true) + '</a>';
                else
                    replacement = '<a target="_blank" class="lz_chat_link" href="' + webSites[i] + '" data-url="' + webSites[i] + '">' + lzm_commonTools.SubStr(webSites[i],120,true) + '</a>';

                myText = myText.replace(webSites[i], replacement);
            }
        }
    }

    var mailAddresses = myText.match(/[\w\.-]{1,}@[\w\.-]{2,}\.\w{2,3}/gi);
    if (typeof mailAddresses != 'undefined' && mailAddresses != null) {
        for (i=0; i<mailAddresses.length; i++) {
            replaceLink = true;
            if (typeof existingLinks != 'undefined' && existingLinks != null)
            {
                for (j=0;j<existingLinks.length; j++) {
                    if (existingLinks[j].indexOf(mailAddresses[i]))
                    {
                        replaceLink = false;
                    }
                }
            }
            if (replaceLink)
            {
                replacement = '<a target="_blank" class="lz_chat_mail" href="mailto:' + mailAddresses[i] + '" data-url="mailto:' + mailAddresses[i] + '">' + mailAddresses[i] + '</a>';
                myText = myText.replace(mailAddresses[i], replacement);
            }
        }
    }
    if (myText.match(/<a.*?href=".*?".+?data\-url=".*?".+?>.*?<\/a>/i) != null)
    {
        myText = myText.replace(/<a(.*?)href="(.*?)".*?data\-url="(.*?)"(.+?)>(.*?)<\/a>/gi, '<a target="_blank"$1href="$3" data-url="$3"$4>$5</a>');
    }
    else if (myText.match(/<a.*?href=".*?".+?data\-url=".*?">.*?<\/a>/i) != null)
    {
        myText = myText.replace(/<a(.*?)href="(.*?)".*?data\-url="(.*?)">(.*?)<\/a>/gi, '<a target="_blank"$1href="$3" data-url="$3">$4</a>');
    }
    myText = myText.replace(/<a(.*?)href="(.*?)">(.*?)<\/a>/gi, '<a target="_blank"$1href="$2">$3</a>');
    myText = myText.replace(/<a(.*?)href="(.*?)"(.+?)>(.*?)<\/a>/gi, '<a target="_blank"$1href="$2"$3>$4</a>');
    myText = myText.replace(/(target="_blank" )+/gi, 'target="_blank" ');

    return myText;
};

CommonToolsClass.prototype.escapeHtml = function(myText, escapeHtmlLineBreaks) {

    if(typeof myText == 'undefined')
        return '';

    escapeHtmlLineBreaks = (typeof escapeHtmlLineBreaks != 'undefined') ? escapeHtmlLineBreaks : false;

    // Replace surrounding font tags as the Windows client sends those
    myText = myText.replace(/^<font.*?>/g,'').replace(/<\/font>$/,'');

    // Replace & by &amp; inside html entities
    myText = myText.replace(/&(([#a-z0-9]*;)+?)/gi, '&amp;$1');

    // replace < and > by their html entities
    myText = myText.replace(/</g,'&lt;').replace(/>/g,'&gt;');

    // replace line endings by their html equivalents
    myText = myText.replace(/\n/g, '').replace(/\r/, '');

    if(!escapeHtmlLineBreaks) {
        myText = myText.replace(/&lt;br \/&gt;/g, '<br />');
        myText = myText.replace(/&lt;br&gt;/g, '<br />');
    }

    myText = myText.replace(/"/g, '&quot;');

    return myText;
};

CommonToolsClass.prototype.replaceChatPlaceholders = function(_systemId, resourceText) {

    try
    {
        var that = this, i;
        var visitorObj = VisitorManager.GetVisitor(_systemId);
        var visitorBrowser = VisitorManager.GetLastActiveVisitorBrowser(_systemId);
        var chatObj = DataEngine.ChatManager.GetChat(_systemId,'SystemId');
        var groupId = (chatObj != null && d(chatObj.dcg) && chatObj.dcg != '') ? chatObj.dcg : '';
        var visitorName = (visitorObj != null) ? VisitorManager.GetVisitorName(visitorObj) : '';
        var visitorNameArray = (visitorName.indexOf(',') == -1) ? visitorName.split(' ') : visitorName.split(',');
        var firstNameEntry = visitorNameArray.splice(0,1)[0].replace(/^ +/, '').replace(' +$', '');
        var visitorFirstName = (visitorName.indexOf(',') == -1) ? firstNameEntry : visitorNameArray.join(' ').replace(/^ +/, '').replace(' +$', '');
        var visitorLastName = (visitorName.indexOf(',') != -1) ? firstNameEntry : visitorNameArray.join(' ').replace(/^ +/, '').replace(' +$', '');
        var question = (chatObj != null && d(chatObj.s) && chatObj.s != '') ? chatObj.s : '';
        var visitorIp = (visitorObj != null && d(visitorObj.ip)) ? visitorObj.ip : '';
        var websiteNames = (visitorObj != null) ? VisitorManager.GetWebsiteNames(visitorObj) : '';
        var visitorEmail = DataEngine.inputList.getInputValueFromVisitor(112,visitorObj);
        var visitorPhone = DataEngine.inputList.getInputValueFromVisitor(116,visitorObj);
        var chatId = (chatObj != null && d(chatObj.i)) ? chatObj.i : '';
        var pageTitle = (visitorBrowser != null && d(visitorBrowser.h2) && visitorBrowser.h2.length > 0) ? visitorBrowser.h2[visitorBrowser.h2.length - 1].title : '';
        var url = (visitorBrowser != null && d(visitorBrowser.h2) && visitorBrowser.h2.length > 0) ? visitorBrowser.h2[visitorBrowser.h2.length - 1].url : '';
        var searchString = '';
        var now = lzm_chatTimeStamp.getLocalTimeObject();
        var time = that.getHumanDate(now, 'shorttime', lzm_chatDisplay.userLanguage);
        var date = that.getHumanDate(now, 'date', lzm_chatDisplay.userLanguage);
        var domain = '';

        var replacementArray = [
            {p: '%operator_name%', r: lzm_chatDisplay.myName},
            {p: '%id%', r: lzm_chatDisplay.myLoginId},
            {p: '%operator_email%', r: lzm_chatDisplay.myEmail},
            {p: '%group_id%', r: groupId},
            {p: '%external_name%', r: visitorName},
            {p: '%external_firstname%', r: visitorFirstName},
            {p: '%external_lastname%', r: visitorLastName},
            {p: '%question%', r: question},
            {p: '%external_ip%', r: visitorIp},
            {p: '%external_email%', r: visitorEmail},
            {p: '%external_phone%', r: visitorPhone},
            {p: '%chat_id%', r: chatId},
            {p: '%page_title%', r: pageTitle},
            {p: '%url%', r: url},
            {p: '%domain%', r: domain},
            {p: '%searchstring%', r: searchString},
            {p: '%localtime%', r: time},
            {p: '%website_name%', r: websiteNames},
            {p: '%localdate%', r: date}
        ];

        var customInputs = DataEngine.inputList.getCustomInputList();
        for (i=0; i<customInputs.length; i++)
        {
            var myCustomValue = '';

            if ((customInputs[i].type == 'Text' || customInputs[i].type == 'TextArea') && customInputs[i].active == 1) {
                if (visitorObj != null && typeof visitorObj.d['f' + customInputs[i].id]  != 'undefined') {
                    myCustomValue = visitorObj.d['f' + customInputs[i].id];
                }
            } else if (customInputs[i].type == 'CheckBox' && customInputs[i].active == 1) {
                if (visitorObj != null && typeof visitorObj.d[customInputs[i].id]  != 'undefined') {
                    myCustomValue = (visitorObj.d[customInputs[i].id] == 1) ? t('Yes') : t('No');
                }
            } else if (customInputs[i].type == 'ComboBox' && customInputs[i].active == 1)
            {
                if (visitorObj != null && typeof visitorObj.d[customInputs[i].id]  != 'undefined') {
                    var selectedValue = parseInt(visitorObj.d[customInputs[i].id]);
                    myCustomValue = (!isNaN(selectedValue)) ? customInputs[i].value[selectedValue] : '';
                }
            } else if (customInputs[i].type == 'File' && customInputs[i].active == 1) {
                myCustomValue = '';
            }
            replacementArray.push({p: '%custom' + customInputs[i].id + '%', r: myCustomValue});
        }


        // fill up missing keys
        for(var key in ChatEditorClass.PlaceholdersList)
        {
            if(!lzm_commonTools.GetElementByProperty(replacementArray,'p',ChatEditorClass.PlaceholdersList[key].p).length)
                replacementArray.push({p:ChatEditorClass.PlaceholdersList[key].p,r:''});
        }

        for (i=0; i<replacementArray.length; i++)
        {
            var regExp = new RegExp(replacementArray[i].p, 'g');
            resourceText = resourceText.replace(regExp, replacementArray[i].r);
        }
    }
    catch(ex)
    {
        deblog(ex);
    }

    return resourceText
};

CommonToolsClass.prototype.printContent = function(myType, myObject) {
    var that = this, myContent = '';

    var GetTicketPrintHTML = function(_ticket){
        var message = _ticket.messages[0];
        var msgDate = lzm_chatTimeStamp.getLocalTimeObject(message.ct * 1000, true);
        var msgDateHuman = that.getHumanDate(msgDate, 'full', lzm_chatDisplay.userLanguage);

        var myGroupName = (typeof _ticket.editor != 'undefined' && !_ticket.editor) ? _ticket.editor.g : _ticket.gr;
        var myGroup = DataEngine.groups.getGroup(myGroupName);
        myGroupName = (myGroup != null && d(myGroup.name)) ? myGroup.name : myGroupName;

        var tiHTML = '<br />' +
            '<table>' +
            '<tr><th style="text-align: left;min-width:110px;">' + tidc('ticket_id') + '</th><td>' + _ticket.id + '</td></tr>' +
            '<tr><th style="text-align: left;">' + tidc('group') + '</th><td>' + myGroupName + '</td></tr>' +
            '<tr><th style="text-align: left;">' + tidc('date') + '</th><td>' + msgDateHuman + '</td></tr>' +
            '<tr><th style="text-align: left;">' + tidc('subject') + '</th><td>' + that.escapeHtml(message.s) + '</td></tr>' +
            '<tr><th style="text-align: left;">' + tidc('name') + '</th><td>' + that.escapeHtml(message.fn) + '</td></tr>' +
            '<tr><th style="text-align: left;">' + tidc('email') + '</th><td>' + that.escapeHtml(message.em) + '</td></tr>' +
            '<tr><th style="text-align: left;">' + tidc('company') + '</th><td>' + that.escapeHtml(message.co) + '</td></tr>';

        for (var i=0; i<DataEngine.inputList.idList.length; i++)
        {
            var myCustomInput = DataEngine.inputList.getCustomInput(DataEngine.inputList.idList[i]);
            if (myCustomInput.active == 1)
            {
                var val = lzm_commonTools.GetElementByProperty(message.customInput,'id',myCustomInput.name);
                if(val.length)
                    tiHTML += '<tr><th style="text-align: left;">' + myCustomInput.name + ':</th><td>' + val[0].text + '</td></tr>';
            }
        }

        tiHTML += '</table>';
        return tiHTML;

    };
    var GetMessagePrintHTML = function(_ticket,_messageNo){
        var message = _ticket.messages[_messageNo];

        var myOperator = DataEngine.operators.getOperator(message.sid);
        var myOperatorName = (myOperator != null) ? myOperator.name : message.sid;

        var msgDate = lzm_chatTimeStamp.getLocalTimeObject(message.ct * 1000, true);
        var msgDateHuman = that.getHumanDate(msgDate, 'full', lzm_chatDisplay.userLanguage);

        var tmpFrom1 = (message.fn != '') ? that.escapeHtml(message.fn) : '';
        var tmpFrom2 = (message.fn != '' && message.em != '') ? ' &lt;' + that.escapeHtml(message.em) + '&gt;' : (message.fn == '' && message.em != '') ? that.escapeHtml(message.em) : '';
        var msgFrom = (message.t == 4 || message.t == 3) ? tmpFrom1 + tmpFrom2 : (message.t == 1) ? myOperatorName : '';

        var msgText = that.escapeHtml(message.mt.replace(/\r\n/g, '<br />').replace(/\n/g, '<br />').replace(/\r/g, '<br />'));

        var mHTML = '<script type="text/javascript">var printNow = function() {window.print();};</script>';

        mHTML += '<br><br>---------------------------------------- ' + t('Message <!--msg_no-->/<!--total_msgs-->',[['<!--msg_no-->', parseInt(_messageNo) + 1], ['<!--total_msgs-->', _ticket.messages.length]]) + ' ----------------------------------------<br />';
        mHTML += '<table>';

        if (message.t != 2)
        {
            mHTML += '<tr><th style="text-align: left;">' + t('From:') + '</th><td>' + msgFrom + '</td></tr>';
        }
        mHTML += '<tr><th style="text-align: left;min-width:110px;">' + tidc('date') + '</th><td>' + msgDateHuman + '</td></tr>';
        mHTML += '<tr><td colspan="2">&nbsp;</td></tr>' +
            '<tr><td colspan="2">' + msgText + '</td></tr>' +
            '</table><br><br>';
        return mHTML;
    };

    switch(myType)
    {
        case 'ticket':
            myContent = GetTicketPrintHTML(myObject.ticket);
            for(var key in myObject.ticket.messages)
                myContent += GetMessagePrintHTML(myObject.ticket,key);
            break;
        case 'message':
            myContent = GetTicketPrintHTML(myObject.ticket);
            myContent += GetMessagePrintHTML(myObject.ticket,myObject.msgNo);
            break;
        case 'chat':
            var myChat = that.clone(myObject.chat);
            var chatDate = lzm_chatTimeStamp.getLocalTimeObject(myChat.ts * 1000, true);
            var chatDateHuman = that.getHumanDate(chatDate, 'full', lzm_chatDisplay.userLanguage);
            var chatDuration = that.getHumanTimeSpan(parseInt(myChat.te) - parseInt(myChat.ts));
            var waitingTime = (myChat.t == 1) ? that.getHumanTimeSpan(parseInt(myChat.wt)) : '-';
            var language = (myChat.il != '') ? myChat.il : '-';
            var langName = this.GetLanguageName(language);
            var ipAddress = (myChat.ip != '') ? myChat.ip : '-';
            var host = (myChat.ho != '') ? myChat.ho : '-';
            var phone = (myChat.cp != '') ? that.escapeHtml(myChat.cp) : '-';
            var opId, cpId, qId, name, operatorName, groupName;
            if (myChat.t == 0) {
                var opList = myChat.iid.split('-');
                var myPosition = $.inArray(lzm_chatDisplay.myId, opList);
                if (myPosition != -1) {
                    opId = opList[myPosition];
                    cpId = opList[1 - myPosition];
                } else {
                    opId = opList[0];
                    cpId = opList[1];
                }
                qId = myChat.iid;
            } else {
                opId = myChat.iid;
                cpId = (myChat.eid != '') ? myChat.eid : myChat.gid;
                qId = cpId;
            }
            try {
                name = (myChat.t == 0) ? DataEngine.operators.getOperator(cpId).name : (myChat.t == 1) ?
                    that.escapeHtml(myChat.en) : (myChat.gid == 'everyoneintern') ? tid('all_operators') : capitalize(myChat.gid);
            } catch (e) {name = '';}
            try {
                var operator = DataEngine.operators.getOperator(opId);
                operatorName = (operator != null) ? operator.name : '-';
            } catch (e) {operatorName = '';}
            try {
                groupName = (myChat.gid != '') ? (myChat.gid != 'everyoneintern') ? DataEngine.groups.getGroup(myChat.gid).name : tid('all_operators') : '-';
            } catch (e) {groupName = '';}
            var email = (myChat.em != '') ? that.escapeHtml(myChat.em) : '-';
            var company = (myChat.co != '') ? that.escapeHtml(myChat.co) : '-';
            var area = (myChat.ac != '') ? myChat.ac : '-';
            var pageUrl = (typeof myChat.u != 'undefined' && myChat.u != '') ? myChat.u : '-';
            var result = (myChat.t == 1) ? (myChat.sr == 0) ? t('Missed') : (myChat.sr == 1) ? t('Accepted') : t('Declined') : '-';
            var endedBy = (myChat.t == 1) ? (myChat.er == 0) ? t('User') : tid('operator') : '-';
            var question = (typeof myChat.q != 'undefined' && myChat.q != '') ? that.escapeHtml(myChat.q) : '-';
            myContent = '<script type="text/javascript">var printNow = function() {window.print();};</script>' +
                '<table>' +
                '<tr><th style="text-align: left;">' + tidc('date') + '</th><td>' + chatDateHuman + '</td></tr>' +
                '<tr><th style="text-align: left;">' + tidc('chat_id') + '</th><td>' + myChat.cid + '</td></tr>' +
                '<tr><th style="text-align: left;">' + t('Name:') + '</th><td>' + name + '</td></tr>' +
                '<tr><th style="text-align: left;">' + t('Operator:') + '</th><td>' + operatorName + '</td></tr>' +
                '<tr><th style="text-align: left;">' + t('Group:') + '</th><td>' + groupName + '</td></tr>' +
                '<tr><th style="text-align: left;">' + t('Email:') + '</th><td>' + email + '</td></tr>' +
                '<tr><th style="text-align: left;">' + t('Phone:') + '</th><td>' + phone + '</td></tr>' +
                '<tr><th style="text-align: left;">' + t('Company:') + '</th><td>' + company + '</td></tr>' +
                '<tr><th style="text-align: left;">' + tidc('language') + '</th><td>' + langName + '</td></tr>' +
                '<tr><th style="text-align: left;">' + t('IP:') + '</th><td>' + ipAddress + '</td></tr>' +
                '<tr><th style="text-align: left;">' + t('Host:') + '</th><td>' + host + '</td></tr>' +
                '<tr><th style="text-align: left;">' + t('Duration:') + '</th><td>' + chatDuration + '</td></tr>' +
                '<tr><th style="text-align: left;">' + tidc('website_name') + '</th><td>' + area + '</td></tr>' +
                '<tr><th style="text-align: left;">' + t('Waiting Time:') + '</th><td>' + waitingTime + '</td></tr>' +
                '<tr><th style="text-align: left;">' + t('Result:') + '</th><td>' + result + '</td></tr>' +
                '<tr><th style="text-align: left;">' + t('Ended By:') + '</th><td>' + endedBy + '</td></tr>';
            myContent += '<tr><th style="text-align: left;">' + t('Url:') + '</th><td>' + pageUrl + '</td></tr>' +
                '<tr><th style="text-align: left;">' + t('Question:') + '</th><td>' + question + '</td></tr>' +
                '<tr><td colspan="2">&nbsp;</td></tr>' +
                '<tr><td colspan="2">' + that.escapeHtml(myChat.cplain.replace(/\r\n/g, '<br />').replace(/\n/g, '<br />')
                .replace(/\r/g, '<br />')) + '</td></tr>' +
                '</table>';
            break;
    }
    if (myContent != '')
    {
        if(IFManager.IsDesktopApp() && IFManager.DeviceInterface.hasModule('lz-print-content'))
            IFManager.IFPrintContent(myContent);
        else
        {
            printWindow = window.open('', 'print-window');
            printWindow.document.write(myContent);
            printWindow.printNow();
            printWindow.close();
        }
    }
};

CommonToolsClass.prototype.GetLanguageName = function(_iso){
    return (d(lzm_chatDisplay.availableLanguages[_iso.toLowerCase()])) ? lzm_chatDisplay.availableLanguages[_iso.toLowerCase()] : (d(lzm_chatDisplay.availableLanguages[_iso.toLowerCase().split('-')[0]])) ? lzm_chatDisplay.availableLanguages[_iso.toLowerCase().split('-')[0]] : _iso;
};

CommonToolsClass.prototype.phpSerialize = function(myObject, doEncode) {
    var that = this;
    doEncode = (typeof doEncode != 'undefined') ? doEncode : false;
    var counter = 0, myEncKey, myEncValue, myKey, myValue;
    var objectLength = (myObject instanceof Array) ? myObject.length : Object.keys(myObject).length;
    var serialized = '';
    if (typeof myObject == 'object' && myObject instanceof Array) {
        serialized += 'a:' + objectLength.toString() + ':{';
        for (var i=0; i<objectLength; i++) {
            if (doEncode && (typeof myObject[i] == 'string' || typeof myObject[i] == 'number')) {
                myValue = lz_global_base64_encode(myObject[i].toString().replace('"', '\\"'));
                serialized += 'i:' + counter + ';s:' + myValue.length + ':"' + myValue + '";';
            } else if (typeof myObject[i] == 'string' || typeof myObject[i] == 'number') {
                if (isNaN(myObject[i])) {
                    myValue = myObject[i].replace('"', '\\"');
                    serialized += 'i:' + counter + ';s:' + myValue.length + ':"' + myValue + '";';
                } else {
                    serialized += 'i:' + counter + ';i:' + myObject[i] + ';';
                }
            } else if (typeof myObject[i] == 'boolean') {
                myValue = (myObject[i]) ? 1 : 0;
                serialized += 'i:' + counter + ';b:' + myValue + ';';
            } else if (myObject[i] == null || typeof myObject[i] == 'undefined') {
                serialized += 'i:' + counter + ';N;';
            } else {
                myValue = that.phpSerialize(myObject[i], doEncode);
                serialized += 'i:' + counter + ';' + myValue;
            }
            counter++;
        }
        serialized += '}';
    } else if (typeof myObject == 'object' && myObject != null) {
        serialized += 'a:' + objectLength.toString() + ':{';
        for (var key in myObject) {
            if (myObject.hasOwnProperty(key)) {
                myKey = key.toString().replace('"', '\\"');
                if (doEncode && (typeof myObject[key] == 'string' || typeof myObject[key] == 'number')) {
                    myValue = lz_global_base64_encode(myObject[key].toString().replace('"', '\\"'));
                    serialized += 's:' + myKey.length + ':"' + myKey + '";s:' + myValue.length + ':"' + myValue + '";'
                } else if (typeof myObject[key] == 'string' || typeof myObject[key] == 'number') {
                    if (isNaN(myObject[key])) {
                        myValue = myObject[key].replace('"', '\\"');
                        if (isNaN(key)) {
                            serialized += 's:' + myKey.length + ':"' + myKey + '";s:' + myValue.length + ':"' + myValue + '";'
                        } else {
                            serialized += 'i:' + myKey + ';s:' + myValue.length + ':"' + myValue + '";'
                        }
                    } else {
                        if (isNaN(key)) {
                            serialized += 's:' + myKey.length + ':"' + myKey + '";i:' + myObject[key] + ';';
                        } else {
                            serialized += 'i:' + myKey + ';i:' + myObject[key] + ';';
                        }
                    }
                } else if (typeof myObject[key] == 'boolean') {
                    myValue = (myObject[key]) ? 1 : 0;
                    serialized += 's:' + myKey.length + ':"' + myKey + '";b:' + myValue + ';';
                } else if (myObject[key] == null || typeof myObject[key] == 'undefined') {
                    serialized += 's:' + myKey.length + ':"' + myKey + '";N;';
                } else {
                    myValue = that.phpSerialize(myObject[key], doEncode);
                    serialized += 's:' + myKey.length + ':"' + myKey + '";' + myValue;
                }
            }
        }
        serialized += '}';
    }
    return serialized;
};

CommonToolsClass.prototype.isHEXColor = function(color){
    return /(^#[0-9A-F]{6}$)|(^#[0-9A-F]{3}$)/i.test(color);
};

CommonToolsClass.prototype.isImageFile = function(filename) {
    var imgFileExts = ['png','jpeg','jpg','bmp','gif'];
    var isImg = false;
    for (var i=0;i<imgFileExts.length;i++){
        var key = imgFileExts[i];
        if(filename.toLowerCase().indexOf(key, filename.length - key.length) !== -1)
            isImg=true;
    }
    return isImg;
};

CommonToolsClass.prototype.guid = function() {
    return CryptoJS.MD5(Math.floor((1 + Math.random()) * 0x10000).toString()).toString();
};

CommonToolsClass.prototype.rand = function(min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
}

CommonToolsClass.prototype.getTicketSubShortId = function(_id,_parent){
    return md5(_id + "0" + _parent).substring(0, 5);
};

CommonToolsClass.prototype.startsWith = function(string,startswith) {
    return string.substring( 0, startswith.length ) === startswith;
};

CommonToolsClass.prototype.endsWith = function(string,endswith) {
    return string.substring( string.length - endswith.length, string.length ) === endswith;
};

CommonToolsClass.prototype.GetPositionIndex = function(pos){
    pos = pos.replace('left','0');
    pos = pos.replace('center','1');
    pos = pos.replace('right','2');
    pos = pos.replace('top','0');
    pos = pos.replace('middle','1');
    pos = pos.replace('bottom','2');
    return pos.replace(' ','').split("").reverse().join("");
};

CommonToolsClass.prototype.GetIndexPosition = function(pos){
    if(pos=='00')return 'left top';
    if(pos=='01')return 'left middle';
    if(pos=='02')return 'left bottom';
    if(pos=='10')return 'center top';
    if(pos=='11')return 'center middle';
    if(pos=='12')return 'center bottom';
    if(pos=='20')return 'right top';
    if(pos=='21')return 'right middle';
    if(pos=='22')return 'right bottom';
    return 'center middle';
};

CommonToolsClass.prototype.GetElementByProperty = function(ar,prop,value){
    if(!d(ar))
        return [];
    return $.grep(ar, function(item){
        return item[prop] == value;
    });
};

CommonToolsClass.prototype.RemoveElementByProperty = function(ar,prop,value){
    for(var i=ar.length-1; i>=0; i--)
        if(ar[i][prop] === value)ar.splice(i,1);
};

CommonToolsClass.prototype.SortByProperty = function(_ar,_property,_asc){
    var k,sorterList = [],resList=[];
    _asc = (d(_asc)) ? _asc : false;
    for(k in _ar)
        sorterList.push(_ar[k][_property]);
    sorterList.sort();

    if(_asc)
        sorterList.reverse();

    for(k in sorterList)
        resList.push(lzm_commonTools.GetElementByProperty(_ar,_property,sorterList[k])[0]);

    return resList;
};

CommonToolsClass.prototype.ApplyFromXML = function(object,attributes,node){
    for (var attrIndex = 0; attrIndex < attributes.length; attrIndex++)
        object[attributes[attrIndex].name] = lz_global_base64_url_decode(attributes[attrIndex].value);
    if(d(node))
        object.Value = lz_global_base64_url_decode(node.text());
};

CommonToolsClass.prototype.SubStr = function(str,length,dots){
    if(!d(str))
        return '';
    if(str.length<length)
        return str;
    else
        return str.substr(0,length) + (dots ? '...':'');
};

CommonToolsClass.prototype.RemoveFromArray = function(ar,value){
    if($.inArray(value,ar) != -1)
        ar.splice($.inArray(value, ar), 1);
}

CommonToolsClass.prototype.IsWildcardMatch = function(_template,_comparer,_useWildcard){

    if(!d(_useWildcard))
        _useWildcard = true;

    var spacer;
    if(_template=="*")
        return true;

    if(_useWildcard)
    {
        spacer = this.guid();
        _template = _template.toLowerCase().replace(/\?/g,spacer);
        _comparer = _comparer.toLowerCase().replace(/\?/g,spacer);
    }
    else
        spacer = "";

    _template = _template.replace(/\*/g,"(.*)");

    var textx = spacer+_comparer+spacer;
    var reg = "("+spacer+_template+spacer+")";
    var thisRegex = new RegExp(reg);
    return thisRegex.test(textx);
};

CommonToolsClass.prototype.RandomInt = function(min, max) {
    return Math.floor(Math.random() * (max - min + 1) + min);
};

if (!String.prototype.startsWith) {
    String.prototype.startsWith = function(searchString, position){
        position = position || 0;
        return this.substr(position, searchString.length) === searchString;
    };
}

if (!String.prototype.endsWith) {
    String.prototype.endsWith = function(searchString, position) {
        var subjectString = this.toString();
        if (typeof position !== 'number' || !isFinite(position) || Math.floor(position) !== position || position > subjectString.length) {
            position = subjectString.length;
        }
        position -= searchString.length;
        var lastIndex = subjectString.lastIndexOf(searchString, position);
        return lastIndex !== -1 && lastIndex === position;
    };
}



