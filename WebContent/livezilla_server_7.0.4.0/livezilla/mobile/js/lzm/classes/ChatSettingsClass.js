/****************************************************************************************
 * LiveZilla ChatSettingsClass.js
 *
 * Copyright 2016 LiveZilla GmbH
 * All rights reserved.
 * LiveZilla is a registered trademark.
 *
 ***************************************************************************************/
function ChatSettingsClass() {
    this.userManagementDialogTitle = '';
    this.userManagementAction = 'list';
    this.tableSettingsLoaded = false;
    this.tableSelectedRow = {visitor:0, archive:0, ticket:0, allchats:0};
    this.tableIds = ['visitor', 'archive', 'ticket', 'allchats'];
    this.tableIndexCounter=0;
    this.mainTableColumns = null;
}

ChatSettingsClass.prototype.manageUsersettings = function() {

    this.tableSettingsLoaded = false;
    this.loadData();
    this.createUsersettingsManagement();
    var viewId = '', viewArray = [], that = this;
    $('.show-view-div').each(function() {
        viewArray.push($(this).data('view-id'));
    });
    viewId = $('.show-view-div:first').data('view-id');
    $('.show-view-div').click(function() {
        $('.show-view-div').removeClass('selected-panel-settings-line');
        $(this).addClass('selected-panel-settings-line');
        viewId = $(this).data('view-id');
        that.togglePositionChangeButtons(viewId, 'show-view');
    });
    $('.settings-placeholder-tab').click(function() {
        UIRenderer.resizeOptions();
    });
    $('.position-change-buttons-up.position-show-view').click(function() {
        var myIndex = $.inArray(viewId, viewArray);
        if (myIndex != 0) {
            var replaceId = viewArray[myIndex - 1];
            for (var i=0; i<viewArray.length; i++)
                viewArray[i] = (i == myIndex) ? replaceId : (i == myIndex - 1) ? viewId : viewArray[i];
            that.orderViewPanel(viewArray, viewId);
        }
    });
    $('.position-change-buttons-down.position-show-view').click(function() {
        var myIndex = $.inArray(viewId, viewArray);
        if (myIndex != viewArray.length - 1) {
            var replaceId = viewArray[myIndex + 1];
            for (var i=0; i<viewArray.length; i++) {
                viewArray[i] = (i == myIndex) ? replaceId : (i == myIndex + 1) ? viewId : viewArray[i];
            }
            that.orderViewPanel(viewArray, viewId);
        }
    });
};

ChatSettingsClass.prototype.loadData = function(){
    this.mainTableColumns = lzm_commonTools.clone(LocalConfiguration.TableColumns);
};

ChatSettingsClass.prototype.changeTableRow = function(tableId,tableIndex,rowId,type){
    var i= 0, that = this;
    that.updateCustomTableSettings(tableId);
    if(type=='visible')
    {
        for (i=0; i<this.mainTableColumns[tableId].length; i++)
            if(this.mainTableColumns[tableId][i].cid==rowId)
                this.mainTableColumns[tableId][i].display=$('#show-'+tableId+'-'+rowId).prop('checked') ? 1 : 0;
    }
    else
    {
        function getArrayPos(rowId){
            for (i=0; i<that.mainTableColumns[tableId].length; i++)
                if(that.mainTableColumns[tableId][i].cid==rowId)
                    return i;
        }
        function arrayMove(fromIndex, toIndex) {
            var element = that.mainTableColumns[tableId][fromIndex];
            that.mainTableColumns[tableId].splice(fromIndex, 1);
            that.mainTableColumns[tableId].splice(toIndex, 0, element);
        }

        if(rowId.indexOf('custom')===0)
        {

        }
        else
            for (i=0; i<this.mainTableColumns[tableId].length; i++) {
                if(this.mainTableColumns[tableId][i].cid==rowId)
                {
                    var newIndex = getArrayPos(rowId);
                    var oldIndex = newIndex;
                    if(type=='first')
                        newIndex=0;
                    else if(type=='last')
                        newIndex=this.mainTableColumns[tableId].length-1;
                    else if(type=='up' && newIndex>0)
                        newIndex--;
                    else if(type=='down' && newIndex<(this.mainTableColumns[tableId].length-1))
                        newIndex++;
                    arrayMove(oldIndex,newIndex);
                    this.tableSelectedRow[tableId]=newIndex;
                    break;
                }
            }

        var div = $('#table-settings-placeholder-content-' + tableIndex.toString());

        div.html(this.createTableSettings(tableId));

        div = $('#settings-placeholder-content-3');
        if(type=='last')
            div.scrollTop(div.prop("scrollHeight"));
        else if(type=='first')
            div.scrollTop(0);
        this.applyTableEvents();
    }
};

ChatSettingsClass.prototype.applyTableEvents = function(){
    var that = this;
    $('.table-div').click(function() {
        if($(this).hasClass('selected-panel-settings-line'))
            return;
        var viewtable = $(this).data('view-id').split('-')[0];
        that.tableSelectedRow[viewtable] = $(this).data('row-index');
        that.updateCustomTableSettings(viewtable);
        for(var key in that.tableIds)
            $('#table-settings-placeholder-content-'+ key.toString()).html(that.createTableSettings(that.tableIds[key]));
        that.applyTableEvents();
    });
};

ChatSettingsClass.prototype.updateCustomTableSettings = function(tableId){

};

ChatSettingsClass.prototype.createUsersettingsManagement = function(){

    var that = this;

    lzm_chatDisplay.showUsersettingsHtml = false;
    lzm_chatDisplay.showMinifiedDialogsHtml = false;
    $('#usersettings-menu').css({'display': 'none'});
    $('#minified-dialogs-menu').css('display', 'none');

    var headerString = tid('client_configuration');
    var bodyString = '<div id="settings-container"><div id="settings-placeholder"></div></div>';
    var settingsTabList = this.createSettingsHtml();
    var footerString = lzm_inputControls.createButton('save-usersettings', '', '', t('Ok'), '', 'lr',{'margin-left': '4px'},'',30,'d')  +
        lzm_inputControls.createButton('cancel-usersettings', '', '', t('Cancel'), '', 'lr',{'margin-left': '6px'},'',30,'d');

    var dialogData = {};
    if (lzm_chatDisplay.selected_view == 'mychats' && ChatManager.ActiveChat != '') {
        var thisChatPartner = lzm_displayHelper.getChatPartner(ChatManager.ActiveChat);
        dialogData = {'chat-partner': ChatManager.ActiveChat, 'chat-partner-name': thisChatPartner['name'],'chat-partner-userid': thisChatPartner['userid']};
    }
    dialogData['no-selected-view'] = true;

    lzm_commonDialog.CreateDialogWindow(headerString, bodyString, footerString, 'cogs', 'user-settings-dialog', 'user-settings-dialog', 'cancel-usersettings', true, dialogData);
    lzm_displayHelper.createTabControl('settings-placeholder', settingsTabList);

    UIRenderer.resizeOptions();

    $('#background-mode').change(function() {
        if ($('#background-mode').attr('checked') == 'checked') {
            $('#save-connections-div').removeClass('ui-disabled');
        } else {
            $('#save-connections-div').addClass('ui-disabled');
            if ($('#save-connections').attr('checked') == 'checked') {
                $('#save-connections').click();
            }
        }
    });
    $('#save-usersettings').click(function () {

        if(!d($('#show-avatars').prop('checked')))
        {
            deblog("CAN'T READ CONFIG");
            return;
        }

        saveUserSettings(that.tableSettingsLoaded);
        $('#cancel-usersettings').click();
    });
    $('#cancel-usersettings').click(function() {
        TaskBarManager.RemoveWindowByDialogId('user-settings-dialog');
    });
    $('.settings-placeholder-tab').click(function(){
        if($(this).attr('id')=='settings-placeholder-tab-3' && !that.tableSettingsLoaded)
        {
            lzm_displayHelper.createTabControl('table-settings-placeholder', that.createTableSettings());
            that.applyTableEvents();
            that.tableSettingsLoaded = true;
        }
    });
};

ChatSettingsClass.prototype.createSettingsHtml = function(){
    var i;
    var backgroundModeChecked = (lzm_chatDisplay.backgroundModeChecked != 0) ? ' checked="checked"' : '';
    var ticketReadStatusChecked = (lzm_chatDisplay.ticketReadStatusChecked != 0);
    var saveConnectionsChecked = (lzm_chatDisplay.saveConnections != 0 && lzm_chatDisplay.backgroundModeChecked != 0) ? ' checked="checked"' : '';
    var saveConnectionsDisabled = (lzm_chatDisplay.backgroundModeChecked != 1) ? ' class="ui-disabled"' : '';
    var vibrateNotificationsChecked = (lzm_chatDisplay.vibrateNotifications == 1) ? ' checked="checked"' : '';
    var showChatVisitorInfoChecked = lzm_commonStorage.loadValue('show_chat_visitor_info_' + DataEngine.myId,1)==1;
    var showMissedChatsChecked = lzm_commonStorage.loadValue('show_missed_chats_' + DataEngine.myId,1)!=0;
    var autoAcceptDisabledClass = (lzm_commonPermissions.checkUserPermissions(lzm_chatDisplay.myId, 'chats', 'can_auto_accept', {}) && !lzm_commonPermissions.checkUserPermissions(lzm_chatDisplay.myId, 'chats', 'must_auto_accept', {})) ? '' : ' ui-disabled';
    var autoAcceptChat = ((lzm_commonPermissions.checkUserPermissions(lzm_chatDisplay.myId, 'chats', 'can_auto_accept', {}) && LocalConfiguration.ChatAutoAccept) || lzm_commonPermissions.checkUserPermissions(lzm_chatDisplay.myId, 'chats', 'must_auto_accept', {}));
    var qrdAutoSearchChecked = (lzm_chatDisplay.qrdAutoSearch != 0);

    var notificationSettings = '<fieldset id="notification-settings" class="lzm-fieldset" data-role="none"><legend>' + t('Sounds') + '</legend>';
    if (!IFManager.IsAppFrame || (IFManager.AppOS != IFManager.OS_IOS && IFManager.AppOS != IFManager.OS_WINDOWSPHONE)) {
        notificationSettings += '<label for="volume-slider">' + tidc('volume') + '</label>' + '<select id="volume-slider" name="volume-slider" class="lzm-select" data-role="none">';
        var volumeStep = 10;
        for (i=0; i<=100; i +=volumeStep)
        {
            var selectedString = (i <= LocalConfiguration.SoundVolume && i + volumeStep > LocalConfiguration.SoundVolume) ? ' selected="selected"' : '';
            notificationSettings += '<option value="' + i + '"' + selectedString + '>' + i + ' %</option>';
        }
        notificationSettings += '</select>';
    }

    notificationSettings +=
        '<div class="top-space-half">' + lzm_inputControls.createCheckbox('sound-new-message',t('New Message'),LocalConfiguration.PlayChatMessageSound,'') + '</div>' +
        '<div class="top-space-half">' + lzm_inputControls.createCheckbox('sound-new-chat',t('New external Chat'),LocalConfiguration.PlayChatSound,'') + '</div>' +
        '<div class="top-space-half left-space-child">' + lzm_inputControls.createCheckbox('sound-repeat-new-chat',tid('repeat_new_chat'),LocalConfiguration.RepeatChatSound,'') + '</div>' +
        '<div class="top-space-half">' + lzm_inputControls.createCheckbox('sound-chat-queue',tid('play_queue_sound'),LocalConfiguration.PlayQueueSound,'') + '</div>' +
        '<div class="top-space-half left-space-child">' + lzm_inputControls.createCheckbox('sound-repeat-queue',tid('repeat_new_chat'),LocalConfiguration.RepeatQueueSound,'') + '</div>' +
        '<div class="top-space-half">' + lzm_inputControls.createCheckbox('sound-new-ticket',tid('new_ticket'),LocalConfiguration.PlayTicketSound,'') + '</div>' +
        '<div class="top-space-half">' + lzm_inputControls.createCheckbox('sound-new-visitor',tid('new_visitor'),LocalConfiguration.PlayVisitorSound,'') + '</div>';

    if (IFManager.IsAppFrame && (IFManager.AppOS != IFManager.OS_IOS) && !IFManager.IsDesktopApp())
    {
        notificationSettings += '<div style="padding: 5px 0;">' +
            '<input class="checkbox-custom" type="checkbox" value="1" data-role="none" id="vibrate-notifications"' + vibrateNotificationsChecked + ' />' +
            '<label class="checkbox-custom-label" for="vibrate-notifications">' + t('Vibrate on Notifications') + '</label></div>';
    }
    notificationSettings += '</fieldset><input type="hidden" value="0" id="away-after-time" />';
    notificationSettings += '<fieldset id="message-center-settings" class="lzm-fieldset" data-role="none"><legend>' + tid('notification_window') + '</legend>';
    notificationSettings += '<div>' + lzm_inputControls.createCheckbox('notification-window-chat',tid('chats'),LocalConfiguration.NotificationChats,'') + '</div>';
    notificationSettings += '<div class="top-space-half">' + lzm_inputControls.createCheckbox('notification-window-tickets',tid('tickets'),LocalConfiguration.NotificationTickets,'') + '</div>';
    notificationSettings += '<div class="top-space-half">' + lzm_inputControls.createCheckbox('notification-window-emails',tid('emails'),LocalConfiguration.NotificationEmails,'') + '</div>';
    notificationSettings += '<div class="top-space-half">' + lzm_inputControls.createCheckbox('notification-window-operators',tid('operators'),LocalConfiguration.NotificationOperators,'') + '</div>';
    notificationSettings += '<div class="top-space-half">' + lzm_inputControls.createCheckbox('notification-window-feedbacks',tid('feedbacks'),LocalConfiguration.NotificationFeedbacks,'') + '</div>';
    notificationSettings += '<div class="top-space-half">' + lzm_inputControls.createCheckbox('notification-window-visitors',tid('visitors'),LocalConfiguration.NotificationVisitors,'') + '</div>';

    notificationSettings += '</fieldset>';

    var generalSettings = '<fieldset id="chat-settings"  class="lzm-fieldset" data-role="none"><legend>' + tid('general') + '</legend>';
    generalSettings += '<div class="top-space-half">' + lzm_inputControls.createCheckbox('check-for-updates',tid('check_updates'),LocalConfiguration.CheckUpdates,'') + '</div>';
    generalSettings += '</fieldset>';

    generalSettings += '<fieldset id="chat-settings"  class="lzm-fieldset" data-role="none"><legend>' + tid('chats') + '</legend>';
    generalSettings += '<div class="top-space-half' + autoAcceptDisabledClass + '">' + lzm_inputControls.createCheckbox('auto-accept',t('Automatically accept chats'),autoAcceptChat,'') + '</div>';
    generalSettings += '<div class="top-space-half">' + lzm_inputControls.createCheckbox('qrd-auto-search',t('Search in resources, while typing chat messages'),qrdAutoSearchChecked,'') + '</div>';
    generalSettings += '<div class="top-space-half">' + lzm_inputControls.createCheckbox('show-avatars',tid('show_avatars'),LocalConfiguration.UIShowAvatars,'') + '</div>';
    generalSettings += '<div class="top-space-half">' + lzm_inputControls.createCheckbox('show-chat-visitor-info',tid('show_chat_visitor_info'),showChatVisitorInfoChecked,'') + '</div>';
    generalSettings += '<div class="top-space-half">' + lzm_inputControls.createCheckbox('show-missed-chats',tid('missed_chats'),showMissedChatsChecked,'') + '</div>';
    generalSettings += '</fieldset>';
    generalSettings += '<fieldset id="ticket-settings" class="lzm-fieldset top-space" data-role="none"><legend>' + tid('tickets') + '</legend>';
    generalSettings += '<div class="top-space-half">' + lzm_inputControls.createCheckbox('tickets-read',t('Other operator\'s tickets won\'t switch to unread'),ticketReadStatusChecked,'') + '</div>';
    generalSettings += '</fieldset>';

    if(IFManager.IsDesktopApp() && d(IFManager.DeviceInterface.hasModule) && IFManager.DeviceInterface.hasModule('lz-idle-time')){
        generalSettings += '<fieldset id="notification-settings" class="lzm-fieldset" data-role="none"><legend>' + tid('idletime') + '</legend>';
        generalSettings += '<table style="width:auto;"><tr><td>';
        generalSettings += '<div>' + lzm_inputControls.createCheckbox('idle-time-active',tid('idletime_settings_first'),LocalConfiguration.IdleTimeActive,'') + '</div>';
        generalSettings += '</td><td>';
        generalSettings += lzm_inputControls.createSelect('idle-time-target', '', '', '', '', null, '', [{text:tid('away'),value:3},{text:tid('busy'),value:1},{text:tid('logout'),value:2}], LocalConfiguration.IdleTimeTarget, '', '', '')
        generalSettings += '</td><td>';
        generalSettings += '<label style="padding-top:9px; for="idle-time">' + tid('idletime_settings_middle') + '</label>';
        generalSettings += '</td><td>';
        generalSettings += '<input id="idle-time" type="number" name="idle-time" value="' + LocalConfiguration.IdleTime / 60 + '" min="1" max="1000">';
        generalSettings += '</td><td>';
        generalSettings += '<label style="padding-top:9px;">' + tid('idletime_settings_end') + '</label>';
        generalSettings += '</td></tr></table>';
        generalSettings += '</fieldset>';
    }

    if (IFManager.IsAppFrame && IFManager.AppOS != IFManager.OS_IOS)
    {
        generalSettings += '<fieldset id="background-settings" class="lzm-fieldset" data-role="none" style="margin-top: 5px;"><legend>App</legend>';

        if (IFManager.AppOS == IFManager.OS_ANDROID)
        {
            generalSettings += '<div><input class="checkbox-custom" type="checkbox" value="1" data-role="none" id="background-mode"' + backgroundModeChecked + ' /><label class="checkbox-custom-label" for="background-mode">' + t('Keep active in background mode') + '</label></div>';
            generalSettings += '<div id="save-connections-div"' + saveConnectionsDisabled + '><input class="checkbox-custom" type="checkbox" value="1" data-role="none" id="save-connections"' + saveConnectionsChecked + ' /><label class="checkbox-custom-label" for="save-connections">' + t('Save connections / battery') + '</label></div>';
        }
        //LATER:0 add linux and mac support @autostart
        if (IFManager.AppOS == IFManager.OS_WINDOWS)
        {
            generalSettings += '<div>' + lzm_inputControls.createCheckbox('app-auto-start',tid('app_auto_start'),IFManager.IsAutoStart,'') + '</div>';
        }
        if(IFManager.IsDesktopApp()){
            generalSettings += '<br><div class="top-space-double">' + lzm_inputControls.createButton('app-console','','IFManager.IFToggleDevTools()','Developer Tools','<i class="fa fa-code"></i>','',{padding:'6px 10px'},'',30,'e') + '</div>';
        }
        generalSettings += '</fieldset>';
    }

    var viewSelectSettings = '<fieldset id="view-select-settings" class="lzm-fieldset" data-role="none">' + this.createViewSelectSettings(lzm_chatDisplay.viewSelectArray, lzm_chatDisplay.showViewSelectPanel) + '</fieldset>';
    var tableSettings = '<div id="table-settings-placeholder"></div>';

    var aboutSettings = '<fieldset id="about-settings" class="lzm-fieldset" data-role="none">' +
        '<legend>' + t('About LiveZilla') + '</legend>' +
        '<div style="padding: 5px 0px;">' + t('LiveZilla Server Version: <!--lz_server_version-->',
        [['<!--lz_server_version-->', lzm_commonConfig.lz_version]]) + '</div>';

    if (lzm_commonConfig.lz_app_version != ''){
        aboutSettings += '<div style="padding: 5px 0px;">' + t('LiveZilla App Version: <!--lz_app_version-->',[['<!--lz_app_version-->', lzm_commonConfig.lz_app_version]]) + '</div>';
    }
    if(IFManager.IsDesktopApp() && typeof(window.top.AppFrame) != 'undefined'){
        aboutSettings += '<div style="padding: 5px 0px;">' + t('LiveZilla App Version: <!--lz_app_version-->',[['<!--lz_app_version-->', window.top.AppFrame.AppVersion]]) + '</div>';
    }

    var liveZillaWebsite = t('LiveZilla Website'), kolobokWebsite = t('Kolobok Emoticons');
    aboutSettings += '<div style="padding: 15px 0px 5px 0px;">' + t('Copyright <!--copyright--> LiveZilla GmbH, 2017. All Rights reserved.',
        [['<!--copyright-->', '&#169;']]) + '<br />' +
        '<div style="padding: 5px 0;">' + t('Homepage / Updates: <!--link-->', [['<!--link-->', '<a href="#" onclick="openLink(\'https://www.livezilla.net/\');">' + liveZillaWebsite + '</a>']]) + '</div>' +
        '<div style="padding: 5px 0;">' + t('This product or document is protected by copyright and distributed under licenses restricting its use, copying, distribution and decompilation.') + '</div>' +
        '<div style="padding: 5px 0;">' + t('No part of this product may be reproduced in any form by any means without prior written authorization of LiveZilla and its licensors, if any.') + '</div>' +
        '<div style="padding: 5px 0;">' + t('LiveZilla uses <!--kolobok_link--> - Copyright <!--copyright--> Aiwan.',
            [['<!--kolobok_link-->', '<a href="#" onclick="openLink(\'http://www.en.kolobok.us/\');">' + kolobokWebsite + '</a>'], ['<!--copyright-->', '&#169;']]) + '</div>' +
        '</div>';
    aboutSettings += '</fieldset>';

    var tos = '<iframe id="tos" src="./../license_' + (DataEngine.userLanguage.toLowerCase().indexOf('de')===0?'de':'en') + '.html"></iframe>';

    var settingsTabList = [{name: t('General'), content: generalSettings},
        {name: t('Notifications'), content: notificationSettings},
        {name: t('Panel'), content: viewSelectSettings},
        {name: t('Tables'), content: tableSettings},
        {name: t('About LiveZilla'), content: aboutSettings},
        {name: tid('tos'), content: tos}
    ];

    return settingsTabList;
};

ChatSettingsClass.prototype.createTableSettings = function(rtableId){
    var tabList = [];
    var columnIsChecked, cssClasses='';

    for(var key in this.tableIds)
    {
        this.tableIndexCounter = 0;
        var tableId = this.tableIds[key];
        var tableSettingsHtml = '<div style="margin-top: 5px;" class="lzm-fieldset" id="'+tableId+'-table-columns" data-role="none">';

        for (var i=0; i<this.mainTableColumns[tableId].length; i++) {
            columnIsChecked = (this.mainTableColumns[tableId][i].display == 1) ? ' checked="checked"' : '';
            cssClasses = tableId+'-table-div table-div';
            if (this.tableIndexCounter == this.tableSelectedRow[tableId])
                cssClasses += ' selected-panel-settings-line';

            if(LocalConfiguration.IsCustom(this.mainTableColumns[tableId][i].cid))
            {
                var customInput = DataEngine.inputList.getCustomInput(DataEngine.inputList.idList[this.mainTableColumns[tableId][i].cid.replace('c','')]);
                if(customInput != null && customInput.active == '0')
                    cssClasses += ' ui-disabled';
            }
            tableSettingsHtml += this.getPositionChangeButtonLine(this.tableIndexCounter,'table-cell',tableId,this.mainTableColumns[tableId][i].cid,t(this.mainTableColumns[tableId][i].title),cssClasses,'',columnIsChecked,(this.tableIndexCounter == this.tableSelectedRow[tableId]) ? 'block' : 'none','changeTableRow(event,\''+tableId+'\','+key+',\''+this.mainTableColumns[tableId][i].cid+'\',\'<!--command-->\')');
            this.tableIndexCounter++;
        }

        tableSettingsHtml += '</div>';

        if(d(rtableId) && tableId ==rtableId)
            return tableSettingsHtml;

        tabList.push({name: tid(tableId+'_table'), content: tableSettingsHtml});

    }
    return tabList;
};

ChatSettingsClass.prototype.createViewSelectSettings = function(viewSelectArray, showViewSelectPanel) {
    var viewSelectSettings = '<legend>' + t('Panel') + '</legend>';
    for (var i=0; i<viewSelectArray.length; i++) {
        var thisViewId = viewSelectArray[i].id;
        var thisViewName = t(viewSelectArray[i].name);
        var showThisViewChecked = (showViewSelectPanel[thisViewId] != 0) ? ' checked="checked"' : '';
        var cssClasses = 'show-view-div';
        var disabledClass = '';
        if (i == 1)
            cssClasses += ' selected-panel-settings-line';
        if (true /*DataEngine.crc3 != null && DataEngine.crc3[1] == '-2'*/ && thisViewId == 'home')
        {
            cssClasses += ' ui-disabled';
            showThisViewChecked = ' checked="checked"';
        }
        viewSelectSettings += this.getPositionChangeButtonLine(i, 'show-view', '', thisViewId, thisViewName, cssClasses, disabledClass, showThisViewChecked, (i == 0) ? 'block' : 'none','');
    }
    return viewSelectSettings;
};

ChatSettingsClass.prototype.getPositionChangeButtonLine = function(rowIndex, type, tableName, viewId, viewName, classes, disabledClass, isChecked, displayMode, event){
    var dviewId = (tableName != '') ? tableName+'-'+viewId : viewId;
    var html = '<div style="padding: 3px 0 5px 0;" data-row-index="' + rowIndex.toString() + '" data-view-id="' + dviewId + '" class="' + classes + '" id="show-view-div-' + viewId + '">' +
        '<span class="view-select-settings-checkbox"><input type="checkbox" value="1" onchange="'+event.replace('<!--command-->','visible')+'" data-role="none" class="checkbox-custom' + disabledClass + '" id="show-' + dviewId + '"' + isChecked + ' />' +
        '<label class="checkbox-custom-label" for="show-' + dviewId + '"></label></span>' +
        '<span>' + viewName + '</span>' +
        '<span class="position-change-buttons '+type+'" id="position-change-buttons-' + dviewId + '" style="float:right;margin:5px;display: ' + displayMode + '">';

    html+= lzm_inputControls.createButton(tableName+viewId+'-'+type+'-up', 'position-change-buttons-up position-'+type, event.replace('<!--command-->','up'), '', '<i class="fa fa-chevron-up"></i>', 'lr', {'margin-left': '0'})
    + lzm_inputControls.createButton(tableName+viewId+'-'+type+'-down', 'position-change-buttons-down position-'+type, event.replace('<!--command-->','down'), '', '<i class="fa fa-chevron-down"></i>', 'lr', {'margin-left': '4px'});

    return html + '</span></div>';
};

ChatSettingsClass.prototype.orderViewPanel = function(viewArray, selectedViewId) {
    var that = this, viewSelectArray = [], viewSelectObject = {}, i = 0;
    var showViewSelectPanel = {};
    for (i=0; i<lzm_chatDisplay.viewSelectArray.length; i++) {
        viewSelectObject[lzm_chatDisplay.viewSelectArray[i].id] = lzm_chatDisplay.viewSelectArray[i].name;
        showViewSelectPanel[lzm_chatDisplay.viewSelectArray[i].id] =
            ($('#show-' + lzm_chatDisplay.viewSelectArray[i].id).prop('checked')) ? 1 : 0;
    }
    for (i=0; i<viewArray.length; i++)
        viewSelectArray.push({id: viewArray[i], name : viewSelectObject[viewArray[i]]});

    var settingsHtml = that.createViewSelectSettings(viewSelectArray, showViewSelectPanel);
    $('#view-select-settings').html(settingsHtml).trigger('create');

    var viewId = '';
    $('.show-view-div').click(function() {
        $('.show-view-div').removeClass('selected-panel-settings-line');
        $(this).addClass('selected-panel-settings-line');
        viewId = $(this).data('view-id');
        that.togglePositionChangeButtons(viewId, 'show-view');
    });
    $('.position-change-buttons-up.position-show-view').click(function() {
        var myIndex = $.inArray(viewId, viewArray);
        if (myIndex != 0) {
            var replaceId = viewArray[myIndex - 1];
            for (var i=0; i<viewArray.length; i++)
                viewArray[i] = (i == myIndex) ? replaceId : (i == myIndex - 1) ? viewId : viewArray[i];
            that.orderViewPanel(viewArray, viewId);
        }
    });
    $('.position-change-buttons-down.position-show-view').click(function() {
        var myIndex = $.inArray(viewId, viewArray);
        if (myIndex != viewArray.length - 1) {
            var replaceId = viewArray[myIndex + 1];
            for (var i=0; i<viewArray.length; i++) {
                viewArray[i] = (i == myIndex) ? replaceId : (i == myIndex + 1) ? viewId : viewArray[i];
            }
            that.orderViewPanel(viewArray, viewId);
        }
    });
    $('#show-view-div-' + selectedViewId).click();
};

ChatSettingsClass.prototype.togglePositionChangeButtons = function(viewId, type, tableId) {
    tableId = (d(tableId) ?  '-'+tableId : '');
    $('.position-change-buttons'+tableId+'.'+type).css({'display': 'none'});
    $('#position-change-buttons-' + viewId).css({'display': 'block'});
};

ChatSettingsClass.prototype.GetUserManagementTitle = function(){
    return '<span id="user-management-title">' + t('User Management (<!--user_count--> Users / <!--group_count--> Groups)',[['<!--user_count-->', DataEngine.operators.getOperatorCount()], ['<!--group_count-->', DataEngine.groups.getGroupCount()]]) + '</span>';
};

ChatSettingsClass.prototype.createUserManagement = function() {

    var that = this;
    lzm_chatDisplay.showUsersettingsHtml = false;
    lzm_chatDisplay.showMinifiedDialogsHtml = false;

    $('#usersettings-menu').css({'display': 'none'});
    $('#minified-dialogs-menu').css('display', 'none');

    var headerString = this.GetUserManagementTitle();
    var footerString = '<span style="float:left">';

    //var disabledClass = ((tab == 'user' && that.selectedUser != '') || (tab == 'group' && that.selectedGroup != '')) ? '' : 'ui-disabled';
    footerString += lzm_inputControls.createButton('umg-new-btn', 'um-list-button', '', tid('new'), '<i class="fa fa-plus"></i>', 'lr', {'margin-left': '4px'}, t('Create new operator'),30, 'd');
    footerString += lzm_inputControls.createButton('umg-edit-btn', 'um-list-button', '', tid('edit'), '<i class="fa fa-edit"></i>', 'lr', {'margin-left': '4px'}, t('Edit the selected operator'), 30,'d');
    footerString += lzm_inputControls.createButton('umg-rm-btn', 'um-list-button', '', t('Remove'), '<i class="fa fa-remove"></i>', 'lr', {'margin-left': '4px'}, t('Remove the selected operator'), 30,'d');
    footerString += '</span>';
    footerString += lzm_inputControls.createButton('save-usermanagement', '', '', tid('save'), '', 'lr', {'margin-left': '4px', visibility: 'hidden'},'',30,'d');
    footerString += lzm_inputControls.createButton('cancel-usermanagement', '', '', tid('close'), '', 'lr', {'margin-left': '6px'},'',30,'d');

    var acid = md5(Math.random().toString()).substr(0, 5);
    var bodyString = '<iframe id="user-management-iframe" onload="$(\'#usermanagement-loading\').remove();" src="admin.php?acid=' + acid + '&type=user_management&lang=' + lz_global_base64_url_encode(lzm_t.language) + '"></iframe>';

    bodyString += '<div id="usermanagement-loading"><div class="lz_anim_loading"></div></div>';
    $('#usermanagement-loading').css({position: 'absolute', left: 0, top: 0, bottom:0,right:0,'background-color': '#ffffff', 'background-position': 'center', 'z-index': 1000});

    var dialogData = {ratio : this.DialogBorderRatioFull};
    if (lzm_chatDisplay.selected_view == 'mychats' && ChatManager.ActiveChat != '')
    {
        var thisChatPartner = lzm_displayHelper.getChatPartner(ChatManager.ActiveChat);
        dialogData = {ratio : this.DialogBorderRatioFull, 'chat-partner': ChatManager.ActiveChat, 'chat-partner-name': thisChatPartner['name'],'chat-partner-userid': thisChatPartner['userid']};
    }
    dialogData['no-selected-view'] = true;

    lzm_commonDialog.CreateDialogWindow(headerString, bodyString, footerString, 'user', 'user-management-dialog','user-management-dialog','cancel-usermanagement',true,dialogData);

    TaskBarManager.GetActiveWindow().StaticWindowType = true;

    UIRenderer.resizeUserManagement();

    $('#cancel-usermanagement').click(function(){
        if (that.userManagementAction == 'list'){
            TaskBarManager.RemoveActiveWindow();
        }
        else if ($.inArray(that.userManagementAction,['signature','text','title','smc','oh']) != -1)
        {
            document.getElementById('user-management-iframe').contentWindow.removeTextEmailsPlaceholderMenu();
            document.getElementById('user-management-iframe').contentWindow.removeSignaturePlaceholderMenu();
            closeOperatorSignatureTextInput();
        }
        else
        {
            closeOperatorGroupConfiguration();
        }
    });
    $('#save-usermanagement').click(function(){
        var handleUserOrGroupSave = false;
        if (that.userManagementAction == 'signature')
        {
            document.getElementById('user-management-iframe').contentWindow.lzm_userManagement.saveSignature();
        }
        else if (that.userManagementAction == 'text')
        {
            document.getElementById('user-management-iframe').contentWindow.lzm_userManagement.saveText();
        }
        else if (that.userManagementAction == 'smc')
        {
            document.getElementById('user-management-iframe').contentWindow.lzm_userManagement.saveSocialMediaChannel();
        }
        else
        {
            handleUserOrGroupSave = true;
            document.getElementById('user-management-iframe').contentWindow.lzm_userManagement.saveUserOrGroup();

            /*
             var win = TaskBarManager.GetActiveWindow();
             win.Minimize();
             win.Maximize();
             */
        }
        if (!handleUserOrGroupSave) {
            $('#cancel-usermanagement').click();
        }
    });

    $('#umg-new-btn').click(function(){
        document.getElementById('user-management-iframe').contentWindow.showCreateButtonMenu();
    });
    $('#umg-edit-btn').click(function(){
        document.getElementById('user-management-iframe').contentWindow.editListObject(null);
    });
    $('#umg-rm-btn').click(function(){
        document.getElementById('user-management-iframe').contentWindow.removeListObject(null);
    });
};

ChatSettingsClass.__CheckForUpdates = function(){

    if(LocalConfiguration.CheckUpdates)
    {
        var lvers = lzm_commonConfig.lz_version.replace(/\./g,'');
        var uurl = 'https://www.livezilla.net/updates/?lupv=2&version=' + lvers;

        $.ajax({
            type: "GET",
            url: uurl,
            timeout: 15000,
            dataType: 'text'
        }).done(function(data)
        {
            var xmlDoc = $.parseXML(data);
            var shown = false
            $(xmlDoc).find('product').each(function()
            {
                var versint = $(this).attr('version').replace(/\./g,'');

                if(!shown && versint > lvers && versint > LocalConfiguration.IgnoreUpdate)
                {
                    shown = true;
                    var notes = lz_global_base64_decode($(this).attr('notes'));
                    notes = notes.replace(/\* /g,'\r\n');
                    var security = $(this).attr('critical')=='1' ? '<span class="text-xl text-red">' + tid('yes') + '</span>' : '';
                    var updateHTML = '<div style="width:500px;" class="lzm-fieldset"><div class="text-xxl bottom-space">'+tid('update_avail')+'</div><hr>';

                    updateHTML += '<div class="top-space bottom-space">' + '<span>Version:</span>&nbsp;<span class="text-xl text-blue">' + $(this).attr('version') + '</span>&nbsp;&nbsp;';

                    if(security.length)
                        updateHTML += '&nbsp;&nbsp;' + '<span>'+tidc('security')+'</span>&nbsp;'+security;

                    updateHTML += '</div>';
                    updateHTML += lzm_inputControls.createArea('up-notes',notes,'','','height:200px');
                    updateHTML += '<br><br><br>';
                    updateHTML += lzm_inputControls.createButton('up-dl','','window.open(\'https://www.livezilla.net/downloads/en/\');lzm_commonDialog.removeAlertDialog();', 'Download', '', '', {'padding': '6px 15px', 'margin-right':'6px'}, '', 30, 'd');
                    updateHTML += lzm_inputControls.createButton('up-ignore','','ChatSettingsClass.__IgnoreUpdate(\''+versint+'\');', tid('ignore'), '', '', {'padding': '6px 15px', 'margin-right':'6px'}, '', 30, 'd');

                    updateHTML += '</div>';

                    lzm_commonDialog.createAlertDialog(updateHTML, [{id: 'close', name: tid('close')}],true,true,false);

                    $('#alert-btn-close').click(function() {
                        lzm_commonDialog.removeAlertDialog();
                    });
                }
            });
        }).fail(function(jqXHR, textStatus, errorThrown){});
    }
};

ChatSettingsClass.__IgnoreUpdate = function(_version){
    LocalConfiguration.IgnoreUpdate = _version;
    LocalConfiguration.Save();
    lzm_commonDialog.removeAlertDialog();
};

function LocalConfiguration() {}

LocalConfiguration.Key = '';
LocalConfiguration.UIShowAvatars = true;
LocalConfiguration.ChatAutoAccept = false;
LocalConfiguration.LastFeedback = '';
LocalConfiguration.NotificationFeedbacks = true;
LocalConfiguration.NotificationTickets = true;
LocalConfiguration.NotificationChats = true;
LocalConfiguration.NotificationOperators = true;
LocalConfiguration.NotificationEmails = true;
LocalConfiguration.NotificationVisitors = false;
LocalConfiguration.ShowViewSelectPanel = [];
LocalConfiguration.ViewSelectArray = [];
LocalConfiguration.PlayChatSound = true;
LocalConfiguration.PlayVisitorSound = false;
LocalConfiguration.PlayTicketSound = false;
LocalConfiguration.PlayChatMessageSound = true;
LocalConfiguration.RingRequired = false;
LocalConfiguration.RepeatChatSound = true;
LocalConfiguration.PlayQueueSound = true;
LocalConfiguration.RepeatQueueSound = true;
LocalConfiguration.TableColumns = {visitor: [], visitor_custom: [], ticket: [], ticket_custom: [], archive: [], archive_custom: [], allchats: [], allchats_custom: []};
LocalConfiguration.VisitorFilterCountry = 0;
LocalConfiguration.VisitorsMapVisible = true;
LocalConfiguration.VisitorsTreeviewVisible = true;
LocalConfiguration.VisitorsCountryFilterVisible = false;
LocalConfiguration.TicketSearchSettings = '1111111111111';
LocalConfiguration.TicketTreeCategory = 'tnFilterStatusActive';
LocalConfiguration.TicketTreeCategoryParent = '';
LocalConfiguration.TicketTreeCategorySubStatus = '';
LocalConfiguration.UserLanguages = ['en_US','de_DE'];
LocalConfiguration.ActiveLanguage = 'en_US';
LocalConfiguration.ExcludedWords = [];
LocalConfiguration.CheckUpdates = true;
LocalConfiguration.IgnoreUpdate = 6200;
LocalConfiguration.IdleTimeTarget = 3;
LocalConfiguration.IdleTimeActive = false;
LocalConfiguration.IdleTime = 300;
LocalConfiguration.CollapsedGroups = [];
LocalConfiguration.EmailList = [];
LocalConfiguration.SoundVolume = 100;

LocalConfiguration.Load = function() {
    LocalConfiguration.UIShowAvatars = LocalConfiguration.LoadValue('show_avatars_',1)!=0;
    LocalConfiguration.ChatAutoAccept = LocalConfiguration.LoadValue('auto_accept_chat_',0)!=0;
    LocalConfiguration.LastFeedback = LocalConfiguration.LoadValue('last_fb_','');
    LocalConfiguration.TicketSearchSettings = LocalConfiguration.LoadValue('ticket_ss','1111111111111');
    LocalConfiguration.ShowViewSelectPanel = LocalConfiguration.LoadValue('main_panel_',[]);
    LocalConfiguration.ViewSelectArray = LocalConfiguration.LoadValue('main_panel_array_',[]);
    LocalConfiguration.PlayChatSound = LocalConfiguration.LoadValue('play_chat_sound_',1)!=0;
    LocalConfiguration.PlayVisitorSound = LocalConfiguration.LoadValue('play_vis_sound_',0)!=0;
    LocalConfiguration.PlayTicketSound = LocalConfiguration.LoadValue('play_ticket_sound_',0)!=0;
    LocalConfiguration.PlayChatMessageSound = LocalConfiguration.LoadValue('play_msg_sound_',1)!=0;
    LocalConfiguration.RepeatChatSound = LocalConfiguration.LoadValue('repeat_chat_sound_',1)!=0;
    LocalConfiguration.PlayQueueSound = LocalConfiguration.LoadValue('play_queue_sound_',1)!=0;
    LocalConfiguration.RepeatQueueSound = LocalConfiguration.LoadValue('repeat_queue_sound_',1)!=0;
    LocalConfiguration.NotificationFeedbacks = LocalConfiguration.LoadValue('not_feedbacks_',1)!=0;
    LocalConfiguration.NotificationTickets = LocalConfiguration.LoadValue('not_tickets_',1)!=0;
    LocalConfiguration.NotificationChats = LocalConfiguration.LoadValue('not_chats_',1)!=0;
    LocalConfiguration.NotificationOperators = LocalConfiguration.LoadValue('not_operators_',1)!=0;
    LocalConfiguration.NotificationEmails = LocalConfiguration.LoadValue('not_emails_',1)!=0;
    LocalConfiguration.NotificationVisitors = LocalConfiguration.LoadValue('not_visitors_',0)!=0;
    LocalConfiguration.VisitorFilterCountry = LocalConfiguration.LoadValue('vf_ctr_','');
    LocalConfiguration.VisitorsMapVisible = LocalConfiguration.LoadValue('show_map_',1)!=0;
    LocalConfiguration.VisitorsTreeviewVisible = LocalConfiguration.LoadValue('show_treeview_',1)!=0;
    LocalConfiguration.VisitorsCountryFilterVisible = LocalConfiguration.LoadValue('show_countries_',0)!=0;
	LocalConfiguration.UserLanguages = LocalConfiguration.LoadValue('usr_languages_','').split(',')[0] == '' ? [] : LocalConfiguration.LoadValue('usr_languages_','').split(',');
    LocalConfiguration.ActiveLanguage = LocalConfiguration.LoadValue('usr_activelanguage_','');
    LocalConfiguration.ExcludedWords = LocalConfiguration.LoadValue('usr_excluded_words_','').split(',')[0] == '' ? [] : LocalConfiguration.LoadValue('usr_excluded_words_','').split(',');
    LocalConfiguration.CollapsedGroups = LocalConfiguration.LoadValue('gr_collapsed_','').split(',')[0] == '' ? [] : LocalConfiguration.LoadValue('gr_collapsed_','').split(',');
    LocalConfiguration.CheckUpdates = LocalConfiguration.LoadValue('chk_upd_',1)!=0;
    LocalConfiguration.IgnoreUpdate = LocalConfiguration.LoadValue('ign_upd_',6200);
    LocalConfiguration.IdleTime = LocalConfiguration.LoadValue('idle_time_', 300);
    LocalConfiguration.IdleTimeTarget = LocalConfiguration.LoadValue('idle_time_target_', 3);
    LocalConfiguration.IdleTimeActive = LocalConfiguration.LoadValue('idle_time_active_', 0)!=0;
    LocalConfiguration.EmailList = LocalConfiguration.LoadValue('eml_list_', '');
    LocalConfiguration.SoundVolume = LocalConfiguration.LoadValue('svol_', 100);
    LocalConfiguration.TicketTreeCategory = LocalConfiguration.LoadValue('stc_', 'tnFilterStatusActive');
    LocalConfiguration.TicketTreeCategoryParent = LocalConfiguration.LoadValue('stcp_', '');
    LocalConfiguration.TicketTreeCategorySubStatus = LocalConfiguration.LoadValue('stcss_', '');
    LocalConfiguration.ParseObjects();
};

LocalConfiguration.Save = function() {

    LocalConfiguration.SaveValue('show_avatars_',LocalConfiguration.UIShowAvatars ? 1 : 0);
    LocalConfiguration.SaveValue('auto_accept_chat_', LocalConfiguration.ChatAutoAccept ? 1 : 0);
    LocalConfiguration.SaveValue('play_chat_sound_', LocalConfiguration.PlayChatSound ? 1 : 0);
    LocalConfiguration.SaveValue('play_vis_sound_', LocalConfiguration.PlayVisitorSound ? 1 : 0);
    LocalConfiguration.SaveValue('play_ticket_sound_', LocalConfiguration.PlayTicketSound ? 1 : 0);
    LocalConfiguration.SaveValue('play_msg_sound_', LocalConfiguration.PlayChatMessageSound ? 1 : 0);
    LocalConfiguration.SaveValue('repeat_chat_sound_', LocalConfiguration.RepeatChatSound ? 1 : 0);
    LocalConfiguration.SaveValue('play_queue_sound_', LocalConfiguration.PlayQueueSound ? 1 : 0);
    LocalConfiguration.SaveValue('repeat_queue_sound_', LocalConfiguration.RepeatQueueSound ? 1 : 0);
    LocalConfiguration.SaveValue('last_fb_', LocalConfiguration.LastFeedback);
    LocalConfiguration.SaveValue('ticket_ss', LocalConfiguration.TicketSearchSettings);
    LocalConfiguration.SaveValue('main_panel_', JSON.stringify(LocalConfiguration.ShowViewSelectPanel));
    LocalConfiguration.SaveValue('main_panel_array_', JSON.stringify(LocalConfiguration.ViewSelectArray));
    LocalConfiguration.SaveValue('not_feedbacks_', LocalConfiguration.NotificationFeedbacks ? 1 : 0);
    LocalConfiguration.SaveValue('not_tickets_', LocalConfiguration.NotificationTickets ? 1 : 0);
    LocalConfiguration.SaveValue('not_chats_', LocalConfiguration.NotificationChats ? 1 : 0);
    LocalConfiguration.SaveValue('not_operators_', LocalConfiguration.NotificationOperators ? 1 : 0);
    LocalConfiguration.SaveValue('not_emails_', LocalConfiguration.NotificationEmails ? 1 : 0);
    LocalConfiguration.SaveValue('not_visitors_', LocalConfiguration.NotificationVisitors ? 1 : 0);
    LocalConfiguration.SaveValue('vf_ctr_', LocalConfiguration.VisitorFilterCountry);
    LocalConfiguration.SaveValue('show_map_', LocalConfiguration.VisitorsMapVisible ? 1 : 0);
    LocalConfiguration.SaveValue('show_treeview_', LocalConfiguration.VisitorsTreeviewVisible ? 1 : 0);
    LocalConfiguration.SaveValue('show_countries_', LocalConfiguration.VisitorsCountryFilterVisible ? 1 : 0);
    LocalConfiguration.SaveValue('usr_languages_', LocalConfiguration.UserLanguages);
    LocalConfiguration.SaveValue('usr_activelanguage_', LocalConfiguration.ActiveLanguage);
    LocalConfiguration.SaveValue('usr_excluded_words_', LocalConfiguration.ExcludedWords);
    LocalConfiguration.SaveValue('gr_collapsed_', LocalConfiguration.CollapsedGroups);
    LocalConfiguration.SaveValue('chk_upd_', LocalConfiguration.CheckUpdates ? 1 : 0);
    LocalConfiguration.SaveValue('ign_upd_', LocalConfiguration.IgnoreUpdate);
    LocalConfiguration.SaveValue('idle_time_', LocalConfiguration.IdleTime);
    LocalConfiguration.SaveValue('idle_time_target_', LocalConfiguration.IdleTimeTarget);
    LocalConfiguration.SaveValue('idle_time_active_', LocalConfiguration.IdleTimeActive ? 1 : 0);
    LocalConfiguration.SaveValue('eml_list_', JSON.stringify(LocalConfiguration.EmailList));
    LocalConfiguration.SaveValue('svol_', LocalConfiguration.SoundVolume);
    LocalConfiguration.SaveValue('stc_', LocalConfiguration.TicketTreeCategory);
    LocalConfiguration.SaveValue('stcp_', LocalConfiguration.TicketTreeCategoryParent);
    LocalConfiguration.SaveValue('stcss_', LocalConfiguration.TicketTreeCategorySubStatus);
};

LocalConfiguration.ParseObjects = function() {

    try
    {
        if(typeof LocalConfiguration.ViewSelectArray == 'string')
            LocalConfiguration.ViewSelectArray = JSON.parse(LocalConfiguration.ViewSelectArray);
    }
    catch(ex)
    {
        LocalConfiguration.ViewSelectArray = [];
    }
    try
    {
        if(typeof LocalConfiguration.ShowViewSelectPanel == 'string')
            LocalConfiguration.ShowViewSelectPanel = JSON.parse(LocalConfiguration.ShowViewSelectPanel);
    }
    catch(ex)
    {
        LocalConfiguration.ShowViewSelectPanel = [];
    }
    try
    {
        if(typeof LocalConfiguration.EmailList == 'string' && LocalConfiguration.EmailList.length)
            LocalConfiguration.EmailList = JSON.parse(LocalConfiguration.EmailList);
        else
            LocalConfiguration.EmailList = [];
    }
    catch(ex)
    {
        LocalConfiguration.EmailList = [];
    }
};

LocalConfiguration.SaveValue = function(_key,_value) {
    lzm_commonStorage.saveValue(_key + LocalConfiguration.Key,_value);
};

LocalConfiguration.LoadValue = function(_key,_fallBack) {
    return lzm_commonStorage.loadValue(_key + LocalConfiguration.Key,_fallBack);
};

LocalConfiguration.IsCustom = function(_cid) {
    return _cid.length==2 && _cid.indexOf('c')==0;
};

LocalConfiguration.AddCustomBlock = function(_array) {
    _array.push({cid: 'c0', title: 'Custom 1', display: 0});
    _array.push({cid: 'c1', title: 'Custom 2', display: 0});
    _array.push({cid: 'c2', title: 'Custom 3', display: 0});
    _array.push({cid: 'c3', title: 'Custom 4', display: 0});
    _array.push({cid: 'c4', title: 'Custom 5', display: 0});
    _array.push({cid: 'c5', title: 'Custom 6', display: 0});
    _array.push({cid: 'c6', title: 'Custom 7', display: 0});
    _array.push({cid: 'c7', title: 'Custom 8', display: 0});
    _array.push({cid: 'c8', title: 'Custom 9', display: 0});
    _array.push({cid: 'c9', title: 'Custom 10', display: 0});
};

LocalConfiguration.CreateTableArray = function(table, type, columnArray) {
    var key,i = 0, newColumnArray = [];
    columnArray = (typeof columnArray != 'undefined') ? columnArray : [];
    if (type == 'general')
    {
        if (table == 'ticket' && columnArray instanceof Array) {
            if (columnArray instanceof Array && columnArray.length == 0)
            {
                newColumnArray = [
                    {cid: 'last_update', title: 'Last Update', display: 1, sort_key:'update', cell_id: 'ticket-sort-update', cell_class: 'ticket-list-sort-column', cell_style: 'cursor: pointer;', cell_onclick: 'sortTicketsBy(\'update\');'},
                    {cid: 'date', title: 'Date', display: 1, cell_id: 'ticket-sort-date', sort_key:'date', cell_class: 'ticket-list-sort-column', cell_style: 'cursor: pointer;', cell_onclick: 'sortTicketsBy(\'date\');'},
                    {cid: 'waiting_time', title: 'Waiting Time', display: 1, sort_invert:true, sort_key:'wait', cell_id: 'ticket-sort-wait', cell_class: 'ticket-list-sort-column', cell_style: 'cursor: pointer;', cell_onclick: 'sortTicketsBy(\'wait\');'},
                    {cid: 'ticket_id', title: 'Ticket ID', display: 1, sort_key:'id', cell_id: 'ticket-sort-id', cell_class: 'ticket-list-sort-column', cell_style: 'cursor: pointer;', cell_onclick: 'sortTicketsBy(\'id\');'},
                    {cid: 'name', title: 'Name', display: 1},
                    {cid: 'group', title: 'Group', display: 1},
                    {cid: 'operator', title: 'Operator', display: 1},
                    {cid: 'status', title: 'Status', display: 1, sort_key:'status', cell_id: 'ticket-sort-status', cell_class: 'ticket-list-sort-column', cell_style: 'cursor: pointer;', cell_onclick: 'sortTicketsBy(\'status\');'},
                    {cid: 'sub_status', title: 'Sub Status', display: 0, sort_key:'sub_status', cell_id: 'ticket-sort-sub-status', cell_class: 'ticket-list-sort-column', cell_style: 'cursor: pointer;', cell_onclick: 'sortTicketsBy(\'sub_status\');'},
                    {cid: 'channel_type', title: 'Channel', display: 1, sort_key:'channel_type',cell_id: 'ticket-sort-channel-type', cell_class: 'ticket-list-sort-column', cell_style: 'cursor: pointer;', cell_onclick: 'sortTicketsBy(\'channel_type\');'},
                    {cid: 'sub_channel', title: 'Sub Channel', display: 0, sort_key:'sub_channel', cell_id: 'ticket-sort-sub-channel', cell_class: 'ticket-list-sort-column', cell_style: 'cursor: pointer;', cell_onclick: 'sortTicketsBy(\'sub_channel\');'},
                    {cid: 'priority', title: 'Priority', display: 1, sort_key:'priority', cell_id: 'ticket-sort-priority', cell_class: 'ticket-list-sort-column', cell_style: 'cursor: pointer;', cell_onclick: 'sortTicketsBy(\'priority\');'},
                    {cid: 'subject', title: 'Subject', display: 1},
                    {cid: 'messages', title: 'Messages', display: 1},
                    {cid: 'email', title: 'Email', display: 0},
                    {cid: 'company', title: 'Company', display: 0},
                    {cid: 'phone', title: 'Phone', display: 0},
                    {cid: 'hash', title: 'Hash', display: 1},
                    {cid: 'callback', title: 'Callback', display: 0},
                    {cid: 'ip_address', title: 'IP address', display: 0},
                    {cid: 'language', title: 'Language', display: 1}
                ];
                LocalConfiguration.AddCustomBlock(newColumnArray);
            }
        }
        else if (table == 'visitor' && columnArray instanceof Array)
        {
            if (columnArray instanceof Array && columnArray.length == 0)
            {
                newColumnArray = [
                    {cid: 'online', title: 'Online', display: 1},
                    {cid: 'last_active', title: 'Last Activity', display: 1},
                    {cid: 'name', title: 'Name', display: 1},
                    {cid: 'country', title: 'Country', display: 1},
                    {cid: 'language', title: 'Language', display: 1},
                    {cid: 'region', title: 'Region', display: 1},
                    {cid: 'city', title: 'City', display: 1},
                    {cid: 'website_name', title: 'Website Name', display: 1},
                    {cid: 'page', title: 'Page', display: 1},
                    {cid: 'page_title', title: 'Page Title', display: 1},
                    {cid: 'page_count', title: 'Page Count', display: 1},
                    {cid: 'search_string', title: 'Search string', display: 0},
                    {cid: 'referrer', title: 'Referrer', display: 1},
                    {cid: 'host', title: 'Host', display: 1},
                    {cid: 'ip', title: 'IP address', display: 1},
                    {cid: 'email', title: 'Email', display: 1},
                    {cid: 'company', title: 'Company', display: 1},
                    {cid: 'browser', title: 'Browser', display: 1},
                    {cid: 'resolution', title: 'Resolution', display: 1},
                    {cid: 'os', title: 'Operating system', display: 1},
                    {cid: 'last_visit', title: 'Last Visit', display: 1},
                    {cid: 'visit_count', title: 'Visits', display: 1},
                    {cid: 'isp', title: 'ISP', display: 1}];
                LocalConfiguration.AddCustomBlock(newColumnArray);
            }
        }
        else if (table == 'archive' && columnArray instanceof Array)
        {
            if (columnArray instanceof Array && columnArray.length == 0)
            {
                newColumnArray = [
                    {index: 0, cid: 'date', title: 'Date', display: 1},
                    {index: 1, cid: 'chat_id', title: 'Chat ID', display: 1},
                    {index: 2, cid: 'name', title: 'Name', display: 1},
                    {index: 3, cid: 'operator', title: 'Operator', display: 1},
                    {index: 4, cid: 'group', title: 'Group', display: 1},
                    {index: 5, cid: 'email', title: 'Email', display: 1},
                    {index: 6, cid: 'company', title: 'Company', display: 1},
                    {index: 7, cid: 'question', title: 'Question', display: 1},
                    {index: 8, cid: 'language', title: 'Language', display: 1},
                    {index: 9, cid: 'country', title: 'Country', display: 1},
                    {index: 10, cid: 'ip', title: 'IP', display: 1},
                    {index: 11, cid: 'host', title: 'Host', display: 1},
                    {index: 12, cid: 'duration', title: 'Duration', display: 1},
                    {index: 13, cid: 'website_name', title: 'Website Name', display: 1},
                    {index: 14, cid: 'page_url', title: 'Url', display: 1},
                    {index: 15, cid: 'waiting_time', title: 'Waiting Time', display: 1},
                    {index: 16, cid: 'result', title: 'Result', display: 1},
                    {index: 17, cid: 'ended_by', title: 'Ended By', display: 1},
                    {index: 18, cid: 'callback', title: 'Callback', display: 1},
                    {index: 19, cid: 'phone', title: 'Phone', display: 1}];
                LocalConfiguration.AddCustomBlock(newColumnArray);
            }
        }
        else if (table == 'allchats' && columnArray instanceof Array)
        {
            if (columnArray instanceof Array && columnArray.length == 0) {
                newColumnArray = [
                    {cid: 'waiting_time', title: 'Waiting Time', display: 1},
                    {cid: 'status', title: 'Status', display: 1},
                    {cid: 'chat_id', title: 'Chat ID', display: 1, sort: 1, cell_style:'width:75px;padding-right:20px;'},
                    {cid: 'start_time', title: 'Start Time', display: 1, cell_style:'width:75px;'},
                    {cid: 'duration', title: 'Duration', display: 1, cell_style:'width:75px;'},
                    {cid: 'question', title: 'Question', display: 1, cell_style:'min-width:300px;white-space:normal;word-wrap:normal;', contenttitle: true},
                    {cid: 'operators', title: 'Operator', display: 1},
                    {cid: 'ip', title: 'IP', display: 1},
                    {cid: 'group', title: 'Group', display: 1},
                    {cid: 'name', title: 'Name', display: 1},
                    {cid: 'email', title: 'Email', display: 1},
                    {cid: 'company', title: 'Company', display: 1},
                    {cid: 'website_name', title: 'Website Name', display: 1},
                    {cid: 'priority', title: 'Priority', display: 1}

                    ];
                LocalConfiguration.AddCustomBlock(newColumnArray);
            }
        }
        else
        {
            newColumnArray = (type == 'general') ? LocalConfiguration.TableColumns[table] : LocalConfiguration.TableColumns[table + '_custom'];
            var configColumnArray = [];
            if(Object.keys(columnArray).length == newColumnArray.length)
            {
                for (key in columnArray)
                    for (i=0; i<newColumnArray.length; i++)
                        if(key == newColumnArray[i].cid)
                        {
                            newColumnArray[i].display = columnArray[key];
                            configColumnArray.push(newColumnArray[i]);
                        }

                newColumnArray = configColumnArray;
            }

        }
        LocalConfiguration.TableColumns[table] = newColumnArray;
    }
    else
    {
        if (!(columnArray instanceof Array)) {
            for (key in columnArray) {
                if (columnArray.hasOwnProperty(key)) {
                    newColumnArray.push({cid: key, display: columnArray[key]});
                }
            }
        }
    }
};

LocalConfiguration.ConfigureCustomFields = function(_isLocalConfiguration) {
    for (var tableid in LocalConfiguration.TableColumns)
    {
        for (var key in LocalConfiguration.TableColumns[tableid])
        {
            var cid = LocalConfiguration.TableColumns[tableid][key].cid;
            if(LocalConfiguration.IsCustom(cid))
            {
                var obj = DataEngine.inputList.objects[cid.replace('c','')];
                if(obj.active=='0')
                    LocalConfiguration.TableColumns[tableid][key].display = 0;
                else if(!_isLocalConfiguration && LocalConfiguration.TableColumns[tableid][key].display == 0)
                    LocalConfiguration.TableColumns[tableid][key].display = 1;

                if(obj.name != '')
                    LocalConfiguration.TableColumns[tableid][key].title = obj.name;
                else
                    LocalConfiguration.TableColumns[tableid][key].title = tid('custom_field') + ' ' + cid.replace('c','');
            }
        }
    }
};

LocalConfiguration.__OpenTableSettings = function(_tableName){
    manageUsersettings(event);
    $('#settings-placeholder-tab-3').click();
    if(_tableName=='tickets')
        $('#table-settings-placeholder-tab-2').click();
    else if(_tableName=='archive')
        $('#table-settings-placeholder-tab-1').click();
    else if(_tableName=='chats')
        $('#table-settings-placeholder-tab-3').click();
};
