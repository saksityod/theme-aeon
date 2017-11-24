/****************************************************************************************
 * LiveZilla CommonDialogClass.js
 *
 * Copyright 2013 LiveZilla GmbH
 * All rights reserved.
 * LiveZilla is a registered trademark.
 *
 ***************************************************************************************/

function CommonDialogClass() {
    this.alertDialogWidth = 0;
    this.alertDialogHeight = 0;
}

CommonDialogClass.IsAlert = false;

CommonDialogClass.prototype.createAlertDialog = function(errorMessage, buttons, wide, dim, shadow) {

    if(CommonDialogClass.IsAlert)
        return;

    var wwidth = 0;
    if(typeof lzm_chatDisplay !== 'undefined')
    {
        lzm_chatDisplay.ChatsUI.BlockEditor();
        wwidth = lzm_chatDisplay.windowWidth;
    }
    else
        wwidth = $(window).width();

    dim = (typeof dim != 'undefined' && dim == false) ? '' : ' lzm-alert-dialog-container-dim';
    shadow = (typeof shadow != 'undefined' && shadow == true) ? ' lzm-alert-dialog-shadow' : '';

    wide = (typeof wide != 'undefined') ? true : false;

    try {
        lzm_displayHelper.unblockUi();
    } catch (ex) {}

    var addDefaultHandler = false;
    if(buttons==null){
        buttons = [{id: 'ok', name: t('Ok')}];
        addDefaultHandler = true;
    }
    var doInitEditorOnClose = '0';
    var dialogHtml = '<div class="lzm-alert-dialog-container'+dim+'" id="lzm-alert-dialog-container">';
    var dialogInnerHtml = '<div class="lzm-alert-dialog'+shadow+'" id="lzm-alert-dialog" data-do-init-editor-on-close="' + doInitEditorOnClose + '"><div style="margin: 12px;">' + errorMessage + '</div><div style="margin: 32px 8px 12px 8px; text-align: right;">';

    for (var i=0; i<buttons.length; i++)
    {
        dialogInnerHtml += '<span class="alert-button" id="alert-btn-' + buttons[i].id + '" data-id="' + buttons[i].id + '">' + buttons[i].name + '</span>';
    }
    dialogInnerHtml += '</div></div>';
    dialogHtml += dialogInnerHtml + '</div>';
    $('body').append('<div id="dialog-test-size-div" style="position: absolute; left: -2000px; top: -2000px; width: 1800px; height: 1800px;"></div>').trigger('create');
    $('#dialog-test-size-div').html(dialogInnerHtml.replace(/id="lzm-alert/, 'id="test-lzm-alert').replace(/id="alert-btn-/, 'id="test-alert-btn-')).trigger('create');

    if(wide)
        this.alertDialogWidth = Math.min(Math.round(wwidth * 0.9), $('#test-lzm-alert-dialog').width());
    else
        this.alertDialogWidth = Math.min(Math.round(wwidth * 0.9), 300);

    $('#test-lzm-alert-dialog').css({width: this.alertDialogWidth+'px'});
    this.alertDialogHeight = $('#test-lzm-alert-dialog').height();

    $('#dialog-test-size-div').remove();

    $('body').append(dialogHtml).trigger('create');

    CommonDialogClass.IsAlert = true;

    this.resizeAlertDialog();

    if(addDefaultHandler)
        $('#alert-btn-ok').click(function() {
            lzm_commonDialog.removeAlertDialog();
        });

};

CommonDialogClass.prototype.removeAlertDialog = function() {

    CommonDialogClass.IsAlert = false;
    $('#lzm-alert-dialog-container').remove();
    if(typeof lzm_chatDisplay !== 'undefined')
        lzm_chatDisplay.ChatsUI.UnblockEditor();
};

CommonDialogClass.prototype.changePassword = function(caller, password, callback, _force) {
    var that = this;
    password = (d(password) && password != null) ? password : '';
    callback = (d(callback)) ? callback : null;
    _force = (d(_force)) ? _force : false;

    if(typeof lzm_chatDisplay !== 'undefined')
        lzm_chatDisplay.showUsersettingsHtml = false;

    $('#usersettings-menu').css({'display': 'none'});
    var headerString = tid('change_password');
    var footerString = lzm_inputControls.createButton('change-password-ok', 'ui-disabled', '', t('Ok'), '', 'lr',{'margin-left': '6px', 'padding-left': '12px', 'padding-right': '12px', 'cursor': 'pointer'},'',30,'d');

    if(!_force)
        footerString += lzm_inputControls.createButton('change-password-cancel', '', '', t('Cancel'), '', 'lr',{'margin-left': '6px', 'padding-left': '12px', 'padding-right': '12px', 'cursor': 'pointer'},'',30,'d');

    var bodyString = this.createPasswordChangeHtml(_force);
    var dialogData = {};
    var showMinimizeIcon = (caller != 'index' && !_force);

    that.CreateDialogWindow(headerString, bodyString, footerString,'key', 'change-password','change_password', 'change-password-cancel' ,false, dialogData);
    that.resizePasswordChange();

    if(!showMinimizeIcon)
    {
        $('#close-dialog').addClass('ui-disabled');
        $('#minimize-dialog').addClass('ui-disabled');
        $('#change_password-container').attr('onclick','');
    }

    $('#new-password').keyup(function() {
        that.checkPasswordStrength($(this).val());
        if ($(this).val().length > 0) {
            $('#change-password-ok').removeClass('ui-disabled');
        } else {
            $('#change-password-ok').addClass('ui-disabled');
        }
    });
    var validatePasswordInput = function(cp, np, rp) {
        if (typeof CommunicationEngine != 'undefined' && sha256(md5(cp)) != CommunicationEngine.chosenProfile.login_passwd) {
            return 1;
        } else if (typeof CommunicationEngine == 'undefined' && cp != password) {
            return 1;
        } else if (np == cp) {
            return 2;
        } else if (np != rp) {
            return 3;
        } else {
            return 0;
        }
    };
    $('#change-password-ok').click(function() {
        var pwVal = validatePasswordInput($('#previous-password').val(), $('#new-password').val(), $('#confirm-password').val());
        if (pwVal == 0)
        {
            if (caller != 'index')
            {
                savePasswordChange($('#new-password').val());
            }
            else
            {
                newPassword = $('#new-password').val();
                if (callback != null) {
                    eval(callback);  // Fixme: Fix callback function call, when needed
                }
            }
            TaskBarManager.RemoveActiveWindow();
        }
        else
        {
            var alertMessage = '';
            if (pwVal == 1)
                alertMessage = t('Old password is not correct.');
            else if (pwVal == 2)
                alertMessage = t('New password must be different from old password.');
            else if (pwVal == 3)
                alertMessage = t('New password does not match with password repetition.');

            that.createAlertDialog(alertMessage, [{id: 'ok', name: t('Ok')}]);
            $('#alert-btn-ok').click(function() {
                that.removeAlertDialog();
            });
        }
    });
    $('#change-password-cancel').click(function() {
        TaskBarManager.RemoveActiveWindow();
    });
};

CommonDialogClass.prototype.createPasswordChangeHtml = function(_force) {
    var myHtml = '<div id="change-password-inner" class="lzm-fieldset" data-role="none"><br><div>';

    if(_force)
        myHtml += tid('force_change_pw') + ' ';

    myHtml += tid('change_pw_explanation') + '</div>' +
        '<div class="top-space-double"><label for="previous-password">' + t('Current password:') + '</label>' +
        '<input type="password" id="previous-password" class="lzm-text-input" data-role="none" /></div>' +
        '<div class="top-space"><label for="new-password">' + tidc('new_password') + '</label>' +
        '<input type="password" id="new-password" class="lzm-text-input" data-role="none" /></div>' +
        '<div class="top-space"><label for="confirm-password">' + tidc('new_password_repetition') + '</label>' +
        '<input type="password" id="confirm-password" class="lzm-text-input" data-role="none" /></div>' +
        '<div><table class="top-space-double"><tr>' +
        '<td><div id="password-strength-0" class="password-strength">&nbsp;</div></td>' +
        '<td><div id="password-strength-1" class="password-strength">&nbsp;</div></td>' +
        '<td><div id="password-strength-2" class="password-strength">&nbsp;</div></td>' +
        '<td><div id="password-strength-3" class="password-strength">&nbsp;</div></td>' +
        '</tr></table></div>' +
        '</div>';

    return myHtml;
};

CommonDialogClass.prototype.checkPasswordStrength = function(password) {
    var cat = [
        password.match(/[a-z]/),
        password.match(/[A-Z]/),
        password.match(/[0-9]/),
        password.match(/[^a-z^A-Z^0-9]/)
    ];
    var noc = 0, pl = password.length;
    for (var i=0; i<cat.length; i++) {
        noc += (cat[i] != null) ? 1 : 0;
    }
    $('.password-strength').css({'background-color': '#f1f1f1'});
    if ((noc == 1 && pl < 10) || (noc != 1 && pl < 6)) {
        $('#password-strength-0').css({'background-color': '#d40000'});
    } else if ((noc == 1 && pl >= 10) || (noc == 2 && pl >= 6 && pl < 10)) {
        $('#password-strength-0').css({'background-color': '#d40000'});
        $('#password-strength-1').css({'background-color': '#d40000'});
    } else if ((noc == 2 && pl >= 10) || (noc >= 3 && pl >= 6 && pl < 10)) {
        $('#password-strength-0').css({'background-color': '#ff7800'});
        $('#password-strength-1').css({'background-color': '#ff7800'});
        $('#password-strength-2').css({'background-color': '#ff7800'});
    } else {
        $('#password-strength-0').css({'background-color': '#74b924'});
        $('#password-strength-1').css({'background-color': '#74b924'});
        $('#password-strength-2').css({'background-color': '#74b924'});
        $('#password-strength-3').css({'background-color': '#74b924'});
    }
};

CommonDialogClass.prototype.resizeAlertDialog = function() {
    if ($('#lzm-alert-dialog-container').length > 0)
    {
        var dialogLeft = Math.round(0.5 * ($(window).width() - this.alertDialogWidth));
        var dialogTop = Math.round(0.5 * ($(window).height() - this.alertDialogHeight));
        var myContainerCss = {width: $(window).width()+'px', height: $(window).height()+'px'};
        var myCss = {left: dialogLeft+'px', top: dialogTop+'px', width: this.alertDialogWidth+'px', height: this.alertDialogHeight+'px'};
        $('#lzm-alert-dialog-container').css(myContainerCss);
        $('#lzm-alert-dialog').css(myCss);
    }
};

CommonDialogClass.prototype.resizePasswordChange = function() {

};

CommonDialogClass.prototype.CreateDialogWindow = function(headerString,
                                                          bodyString,
                                                          footerString,
                                                          _icon,
                                                          _typeId,
                                                          _dialogId,
                                                             /*OLD defaultCss,*/
                                                             /*OLD desktopBrowserCss,*/
                                                             /*OLD mobileBrowserCss,*/
                                                             /*OLD appCss,*/
                                                             /*OLD position,*/

                                                             /*NEW*/ _closeButtonId,

                                                          _fullscreen,
                                                          _data,
                                                          _showInTaskBar,
                                                          _taskBarIndex,
                                                          _minimized,
                                                          _tag

                                                             /*OLD showMinimizeIcon,*/

                                                          ) {

    _dialogId = (typeof _dialogId != 'undefined') ? _dialogId : '';
    _data = (typeof _data != 'undefined') ? _data : {};
    _fullscreen = (typeof _fullscreen != 'undefined') ? _fullscreen : true;
    _showInTaskBar = (typeof _showInTaskBar != 'undefined') ? _showInTaskBar : true;
    _taskBarIndex = (d(_taskBarIndex) && _taskBarIndex != null) ? _taskBarIndex : 11111;
    _minimized = (d(_minimized)) ? _minimized : false;
    _tag = (d(_tag)) ? _tag : '';

    if(TaskBarManager.WindowExists(_dialogId,true))
    {
        return '';
    }

    if(typeof lzm_chatDisplay !== 'undefined')
        lzm_chatDisplay.ChatsUI.BlockEditor();

    try
    {
        lzm_chatDisplay.dialogData = (typeof _data != 'undefined') ? _data : {ratio : this.DialogBorderRatioFull};
    }
    catch(ex)
    {

    }

    var winObj = TaskBarManager.AddWindow(_typeId, _dialogId, _fullscreen, _closeButtonId, headerString, _icon, _showInTaskBar, _taskBarIndex, _minimized, _tag);
    winObj.Footer = footerString;
    winObj.Header = headerString;
    winObj.Body = bodyString;

    if(!_minimized)
    {
        this.CreateDialogWindowHTML(winObj);
    }

    return _dialogId;
};

CommonDialogClass.prototype.CreateDialogWindowHTML = function (_winObj){

    var _fullscreen = _winObj.Fullscreen;
    var _dialogId = _winObj.DialogId;
    var _closeButtonId = _winObj.CloseButtonId;
    var classnameExtension = (_fullscreen) ? '-fullscreen' : '';
    var showMinimizeIcon = true;
    var position = 'absolute';
    var htmlContents = '<div id="' + _dialogId + '-container" class="dialog-window-container cm-click"><div id="' + _dialogId + '" onclick="lzm_chatDisplay.RemoveAllContextMenus();event.stopPropagation();" class="dialog-window' + classnameExtension + '"><div id="' + _dialogId + '-headline" class="dialog-window-headline' + classnameExtension + '">' + _winObj.Header;

    htmlContents += '<span id="minimize-dialog" onclick="TaskBarManager.Minimize(\'' + _dialogId + '\')"><i class="fa fa-minus-square"></i></span>';

    htmlContents += '<span id="close-dialog" onclick="TaskBarManager.Close(\'' + _dialogId + '\')"><i class="fa fa-times-circle"></i></span>';

    htmlContents += '</div><div id="' + _dialogId + '-body" class="dialog-window-body' + classnameExtension + '">' + _winObj.Body + '</div>';

    if(_winObj.Footer != null)
        htmlContents += '<div id="' + _dialogId + '-footline" class="dialog-window-footline' + classnameExtension + '">' + _winObj.Footer + '</div>';

    htmlContents += '</div></div>';

    var chatPage = $('#chat_page');
    if (chatPage.length == 0)
        chatPage = $('#login_page');

    chatPage.append(htmlContents).trigger('create');

    $('#close-dialog').click(function(){
        $('#'+ _closeButtonId).click();
    });

    try
    {
        lzm_chatDisplay.dialogWindowCss.position = position;
        $('#' + _dialogId + '-container').css(lzm_chatDisplay.dialogWindowContainerCss);
        if (_fullscreen)
        {
            $('#' + _dialogId).css(lzm_chatDisplay.FullscreenDialogWindowCss);
            $('#' + _dialogId + '-headline').css(lzm_chatDisplay.FullscreenDialogWindowHeadlineCss);
            $('#' + _dialogId + '-body').css(lzm_chatDisplay.FullscreenDialogWindowBodyCss);
            $('#' + _dialogId + '-footline').css(lzm_chatDisplay.FullscreenDialogWindowFootlineCss);
        }
        else
        {
            $('#' + _dialogId).css(lzm_chatDisplay.dialogWindowCss);
            $('#' + _dialogId + '-headline').css(lzm_chatDisplay.dialogWindowHeadlineCss);
            $('#' + _dialogId + '-body').css(lzm_chatDisplay.dialogWindowBodyCss);
            $('#' + _dialogId + '-footline').css(lzm_chatDisplay.dialogWindowFootlineCss);
        }
    }
    catch (ex)
    {
        lzm_commonDisplay.dialogWindowCss.position = position;
        $('#' + _dialogId + '-container').css(lzm_commonDisplay.dialogWindowContainerCss);
        if (_fullscreen)
        {
            $('#' + _dialogId).css(lzm_commonDisplay.FullscreenDialogWindowCss);
            $('#' + _dialogId + '-headline').css(lzm_commonDisplay.FullscreenDialogWindowHeadlineCss);
            $('#' + _dialogId + '-body').css(lzm_commonDisplay.FullscreenDialogWindowBodyCss);
            $('#' + _dialogId + '-footline').css(lzm_commonDisplay.FullscreenDialogWindowFootlineCss);
        }
        else
        {
            $('#' + _dialogId).css(lzm_commonDisplay.dialogWindowCss);
            $('#' + _dialogId + '-headline').css(lzm_commonDisplay.dialogWindowHeadlineCss);
            $('#' + _dialogId + '-body').css(lzm_commonDisplay.dialogWindowBodyCss);
            $('#' + _dialogId + '-footline').css(lzm_commonDisplay.dialogWindowFootlineCss);
        }
    }

    lzm_chatDisplay.RenderWindowLayout(true, true);

    if(showMinimizeIcon)
        $('#' + _dialogId + '-container').attr('onclick','TaskBarManager.Minimize(\'' + _dialogId + '\')');

    _winObj.HTMLCreated = true;
    _winObj.Footer = null;
    _winObj.Header = null;
    _winObj.Body = null;
};

CommonDialogClass.prototype.getMyObjectName = function() {
    for (var name in window)
    {
        if (window[name] == this)
        {
            return name;
        }
    }
    return '';
};
