/****************************************************************************************
 * LiveZilla ChatTicketClass.js
 *
 * Copyright 2017 LiveZilla GmbH
 * All rights reserved.
 * LiveZilla is a registered trademark.
 *
 ***************************************************************************************/

function ChatTicketClass() {
    this.notifyNewTicket = false;
    this.setNotifyNewTicket = false;
    this.updatedTicket = null;
    this.selectedEmailNo = 0;
    this.CategorySelect = false;
    this.LastActivity = 0;
    this.SearchSettingChangeTimer = null;
    this.logCategories = ['ChangeStatus','ChangeLanguage','ChangeEditor','ChangeGroup','LinkTicket','LinkChat','CreateTicket','DeleteTicket','MoveIntoNewTicket','ForwardMessage','ChangeFullname','ChangeEmail','ChangeCompany','ChangePhone','ChangeSubject','ChangeText','ChangeCustom1','ChangeCustom2','ChangeCustom3','ChangeCustom4','ChangeCustom5','ChangeCustom6','ChangeCustom7','ChangeCustom8','ChangeCustom9','ChangeCustom10','ChangeSubStatus','ChangeSubChannel','ChangePriority','ChangeChannel'];
}

ChatTicketClass.m_TicketChannels = [];
ChatTicketClass.m_BlockReplyDrop = false;
ChatTicketClass.EmailCount = 0;
ChatTicketClass.IsUnreadTicket = false;
ChatTicketClass.SearchQuery = '';
ChatTicketClass.LoadingTimer = null;
ChatTicketClass.TreeSwitchWidth = 650;
ChatTicketClass.PreviewSwitchWidth = 900;
ChatTicketClass.EmailListUpdate = false;
ChatTicketClass.DisplayType = 'TEXT';
ChatTicketClass.DisplayInsecure = false;
ChatTicketClass.SelectedTicketId = '';
ChatTicketClass.SelectedMessageNo = 0;

ChatTicketClass.prototype.createTicketList = function(tickets, ticketGlobalValues, page, sort, sortDir, query, filter, inDialog, elementId) {
    var that = this;
    lzm_chatDisplay.ticketListTickets = tickets;

    var ticketList = that.createTicketListHtml(tickets, ticketGlobalValues, page, sort, sortDir, query, filter, elementId);

    var ticketListHtml = ticketList[0];
    var numberOfPages = ticketList[1];
    var activeLines = ticketList[2];

    $('#ticket-list').html(ticketListHtml).trigger('create');

    if(this.isFullscreenMode())
        selectTicket(lzm_chatDisplay.selectedTicketRow, true, inDialog, elementId);

    if (page == 1)
    {
        $('#ticket-page-all-backward').addClass('ui-disabled');
        $('#ticket-page-one-backward').addClass('ui-disabled');
    }
    if (page == numberOfPages)
    {
        $('#ticket-page-one-forward').addClass('ui-disabled');
        $('#ticket-page-all-forward').addClass('ui-disabled');
    }

    var scols = lzm_displayHelper.getSortableRows('ticket');
    for(var key in scols)
        if(sort != scols[key])
            $('#ticket-sort-' + scols[key].replace(/_/g,'-')+elementId).addClass('inactive-sort-column');

    UIRenderer.resizeTicketList();
    lzm_chatDisplay.styleTicketClearBtn();

    $('#search-ticket').keyup(function(e) {
        lzm_chatDisplay.searchButtonUp('ticket', tickets, e);
    });
    $('#ticket-create-new').click(function() {
        if (lzm_commonPermissions.checkUserPermissions('', 'tickets', 'create_tickets', {}))
            ChatTicketClass.__ShowTicket('', false);
        else
            showNoPermissionMessage();

    });
    $('#ticket-show-emails').click(function() {
        if(ChatTicketClass.EmailCount==0)
            return;
        if (lzm_commonPermissions.checkUserPermissions('', 'tickets', 'review_emails', {}))
            toggleEmailList();
        else
            showNoPermissionMessage();
    });
    $('#ticket-reload-emails').click(function() {
        $('#ticket-reload-emails').addClass('ui-disabled');
        setTimeout(function(){
            $('#ticket-reload-emails').removeClass('ui-disabled');
        },10000);
        CommunicationEngine.pollServerSpecial({}, 'reload_emails');
    });
    $('#search-ticket-reset').click(function() {
        if($('#search-ticket').val()!='')
        {
            $('#search-ticket').val('');
            $('#search-ticket').keyup();
        }
        that.UpdateSearchSettings(false);
    });
    $('#search-ticket').keydown(function() {
        lzm_chatDisplay.searchButtonChange('ticket');
    });
    $('#search-ticket').keydown();
    $('#search-ticket').focus(function(){
        that.UpdateSearchSettings(true);
    });
    $('#search-ticket').blur(function(){
        that.UpdateSearchSettings(true);
    });
    $('#ticket-list').click(function(){
        that.LastActivity = lz_global_timestamp();
    });

    $('.ticket_col_header').unbind("contextmenu");
    $('.ticket_col_header').contextmenu(function(){
        var cm = {id: 'ticket_header_cm',entries: [{label: tid('settings'),onClick : 'LocalConfiguration.__OpenTableSettings(\'tickets\')'}]};
        ContextMenuClass.BuildMenu(event,cm);
        return false;
    });
    $('#ticket-list-search-settings').click(function(e){
        e.stopPropagation();
    });

    if (isNaN(numberOfPages))
        switchTicketListPresentation(DataEngine.ticketFetchTime, 0);

    that.UpdateSearchSettings(ChatTicketClass.SearchQuery.length > 0);

    if(page > 1 && activeLines == 0)
        pageTicketList(1);
};

ChatTicketClass.prototype.UpdateSearchSettings = function(_show){

    if(lzm_chatDisplay.selected_view != 'tickets')
        return;

    if($('#search-ticket').val().length>0 || $('#search-ticket').is(":focus"))
        _show = true;

    if(lzm_chatDisplay.windowWidth <= ChatTicketClass.TreeSwitchWidth && !this.CategorySelect)
        _show = false;

    $('#ticket-list-search-settings').css({display:(!_show) ? 'none':'block'});

    var that=this,sshtml='';
    sshtml += lzm_inputControls.createCheckbox('ticket-ss-hash', tid('hash'),LocalConfiguration.TicketSearchSettings.split('')[2]=='1','ticket-ss-check');
    sshtml += lzm_inputControls.createCheckbox('ticket-ss-name', tid('fullname'),LocalConfiguration.TicketSearchSettings.split('')[3]=='1','ticket-ss-check');
    sshtml += lzm_inputControls.createCheckbox('ticket-ss-sid', tid('visitor_id'),LocalConfiguration.TicketSearchSettings.split('')[4]=='1','ticket-ss-check');
    sshtml += lzm_inputControls.createCheckbox('ticket-ss-tid', tid('ticket_id'),LocalConfiguration.TicketSearchSettings.split('')[5]=='1','ticket-ss-check');
    sshtml += lzm_inputControls.createCheckbox('ticket-ss-cf', tid('custom_field'),LocalConfiguration.TicketSearchSettings.split('')[6]=='1','ticket-ss-check');
    sshtml += lzm_inputControls.createCheckbox('ticket-ss-text', tid('text'),LocalConfiguration.TicketSearchSettings.split('')[7]=='1','ticket-ss-check');
    sshtml += lzm_inputControls.createCheckbox('ticket-ss-email', tid('email'),LocalConfiguration.TicketSearchSettings.split('')[8]=='1','ticket-ss-check');
    sshtml += lzm_inputControls.createCheckbox('ticket-ss-company', tid('company'),LocalConfiguration.TicketSearchSettings.split('')[9]=='1','ticket-ss-check');
    sshtml += lzm_inputControls.createCheckbox('ticket-ss-phone', tid('phone'),LocalConfiguration.TicketSearchSettings.split('')[10]=='1','ticket-ss-check');
    sshtml += lzm_inputControls.createCheckbox('ticket-ss-subject', tid('subject'),LocalConfiguration.TicketSearchSettings.split('')[11]=='1','ticket-ss-check');
	sshtml += lzm_inputControls.createCheckbox('ticket-ss-operator', tid('operator'),LocalConfiguration.TicketSearchSettings.split('')[12]=='1','ticket-ss-check');

    $('#ticket-list-search-settings').html(sshtml);
    $('.ticket-ss-check').change(function(){
        LocalConfiguration.TicketSearchSettings = '11';
        LocalConfiguration.TicketSearchSettings += $('#ticket-ss-hash').prop('checked') ? '1' : '0';
        LocalConfiguration.TicketSearchSettings += $('#ticket-ss-name').prop('checked') ? '1' : '0';
        LocalConfiguration.TicketSearchSettings += $('#ticket-ss-sid').prop('checked') ? '1' : '0';
        LocalConfiguration.TicketSearchSettings += $('#ticket-ss-tid').prop('checked') ? '1' : '0';
        LocalConfiguration.TicketSearchSettings += $('#ticket-ss-cf').prop('checked') ? '1' : '0';
        LocalConfiguration.TicketSearchSettings += $('#ticket-ss-text').prop('checked') ? '1' : '0';
        LocalConfiguration.TicketSearchSettings += $('#ticket-ss-email').prop('checked') ? '1' : '0';
        LocalConfiguration.TicketSearchSettings += $('#ticket-ss-company').prop('checked') ? '1' : '0';
        LocalConfiguration.TicketSearchSettings += $('#ticket-ss-phone').prop('checked') ? '1' : '0';
        LocalConfiguration.TicketSearchSettings += $('#ticket-ss-subject').prop('checked') ? '1' : '0';
		LocalConfiguration.TicketSearchSettings += $('#ticket-ss-operator').prop('checked') ? '1' : '0';
        LocalConfiguration.Save();

        if($('#search-ticket').val()!='')
        {
            if(that.SearchSettingChangeTimer != null)
                clearInterval(that.SearchSettingChangeTimer);

            that.SearchSettingChangeTimer = setTimeout(function(){
                lzm_chatDisplay.searchButtonUp('ticket');
                that.SearchSettingChangeTimer = null;
            },1000);
        }

    });
};

ChatTicketClass.prototype.GetTicketById = function(_id,returnEmpty){
    returnEmpty = (d(returnEmpty)) ? returnEmpty : false;
    var i, x;

    for (i=0; i<lzm_chatDisplay.ticketListTickets.length; i++)
        if (lzm_chatDisplay.ticketListTickets[i].id == _id)
            return lzm_chatDisplay.ticketListTickets[i];
    for (i in lzm_chatDisplay.ticketControlTickets)
        for (x=0; x<lzm_chatDisplay.ticketControlTickets[i].length; x++)
            if (lzm_chatDisplay.ticketControlTickets[i][x].id == _id)
                return lzm_chatDisplay.ticketControlTickets[i][x];

    for(i in VisitorManager.Visitors)
    {
        if(d(VisitorManager.Visitors[i].ArchivedTickets) && VisitorManager.Visitors[i].ArchivedTickets.length)
            for(x in VisitorManager.Visitors[i].ArchivedTickets)
                if(VisitorManager.Visitors[i].ArchivedTickets[x].id == _id)
                    return VisitorManager.Visitors[i].ArchivedTickets[x];
    }

    if(TaskBarManager.GetWindow(_id) != null)
        return TaskBarManager.GetWindow(_id).Tag;

    if(returnEmpty)
        return {};

    return null;
};

ChatTicketClass.prototype.updateTicketList = function(tickets, ticketGlobalValues, page, sort, sortDir, query, filter, forceRecreate, pollObject) {

    ChatTicketClass.SearchQuery = query;

    var selectedTicketExistsInList = false, that = this;
    for (var i=0; i<tickets.length; i++)
        if (tickets[i].id == lzm_chatDisplay.selectedTicketRow || lzm_chatDisplay.selectedTicketRow == '')
            selectedTicketExistsInList = true;

    if (!selectedTicketExistsInList)
        try
        {
            lzm_chatDisplay.selectedTicketRow = (tickets.length > lzm_chatDisplay.selectedTicketRowNo) ?
                tickets[lzm_chatDisplay.selectedTicketRowNo].id : tickets[tickets.length - 1].id;
        }
        catch(ex)
        {

        }

    pollObject = (typeof pollObject != 'undefined') ? pollObject : null;
    forceRecreate = (typeof forceRecreate != 'undefined') ? forceRecreate : false;
    forceRecreate = (forceRecreate || lzm_chatDisplay.ticketGlobalValues.updating != ticketGlobalValues.updating);

    var ticketDutHasChanged = (lzm_chatDisplay.ticketGlobalValues['dut'] != ticketGlobalValues['dut']);
    var customDemandToken = (pollObject != null && pollObject.p_cdt != 0) ? pollObject.p_cdt : false;
    var notificationPushText = '';

    if(customDemandToken && customDemandToken != 'linker')
        lzm_chatDisplay.ticketControlTickets[customDemandToken] = lzm_commonTools.clone(tickets);

    if (!isNaN(parseInt(ticketGlobalValues.elmc)) && (!isNaN(parseInt(lzm_chatDisplay.ticketGlobalValues.elmc)) && parseInt(ticketGlobalValues.elmc) > parseInt(lzm_chatDisplay.ticketGlobalValues.elmc)))
    {
        DataEngine.ticketLatestReceivedId = ticketGlobalValues.tlmid;
        if(lzm_chatDisplay.selected_view!='tickets')
            this.notifyNewTicket = true;

        if(this.LastActivity < (lz_global_timestamp()-15))
        {
            notificationPushText = (ticketGlobalValues.elmn != '') ? tid('notification_new_message',[['<!--sender-->', ticketGlobalValues.elmn], ['<!--text-->', ticketGlobalValues.elmt]]) : t('New Message');
            NotificationManager.NotifyEmail(ticketGlobalValues.elmt,ticketGlobalValues.elmn,notificationPushText);
        }
    }

    if (!isNaN(parseInt(ticketGlobalValues.t)) && (!isNaN(parseInt(lzm_chatDisplay.ticketGlobalValues.t)) && parseInt(lzm_chatDisplay.ticketGlobalValues.t) != -1 && parseInt(ticketGlobalValues.t) > parseInt(lzm_chatDisplay.ticketGlobalValues.t)))
    {
        DataEngine.ticketLatestReceivedId = ticketGlobalValues.tlmid;
        if(lzm_chatDisplay.selected_view!='tickets')
            this.notifyNewTicket = true;
        else if(TaskBarManager.GetActiveWindow() === null)
            DataEngine.userHasSeenCurrentTickets();

        if(this.LastActivity < (lz_global_timestamp()-15))
        {
            notificationPushText = (ticketGlobalValues.tlmn != '') ? tid('notification_new_message',[['<!--sender-->', ticketGlobalValues.tlmn], ['<!--text-->', ticketGlobalValues.tlmt]]) : t('New Message');
            NotificationManager.NotifyTicket(ticketGlobalValues.tlmt,ticketGlobalValues.elmn,notificationPushText);
        }
    }

    try
    {
        lzm_chatDisplay.ticketGlobalValues = lzm_chatDisplay.lzm_commonTools.clone(ticketGlobalValues);
        var selectedTicket = {id: ''};
        for (var j=0; j<tickets.length; j++)
        {
            var ticketEditor = (typeof tickets[j].editor != 'undefined' && tickets[j].editor != false) ? tickets[j].editor.ed : '';
            if (lzm_commonTools.checkTicketReadStatus(tickets[j].id, lzm_chatDisplay.ticketReadArray, tickets) == -1 &&
                (!lzm_chatDisplay.ticketReadStatusChecked || ticketEditor == lzm_chatDisplay.myId || ticketEditor == '')) {
                lzm_chatDisplay.ticketReadArray = lzm_commonTools.removeTicketFromReadStatusArray(tickets[j].id, lzm_chatDisplay.ticketReadArray, true);
            }
            if (lzm_chatDisplay.ticketReadStatusChecked && ticketEditor != lzm_chatDisplay.myId && ticketEditor != '' && tickets[j].u > lzm_chatDisplay.ticketGlobalValues.mr) {
                lzm_chatDisplay.ticketReadArray = lzm_commonTools.addTicketToReadStatusArray(tickets[j].id, lzm_chatDisplay.ticketReadArray, tickets);
            }
            if (tickets[j].id == lzm_chatDisplay.selectedTicketRow)
            {
                for (var k=0; k<lzm_chatDisplay.ticketListTickets.length; k++)
                {
                    if (tickets[j].id == lzm_chatDisplay.ticketListTickets[k].id && tickets[j].md5 != lzm_chatDisplay.ticketListTickets[k].md5)
                    {
                        selectedTicket = tickets[j];
                    }
                }
            }
        }

        if(!customDemandToken)
            lzm_chatDisplay.ticketListTickets  = tickets;

        var numberOfUnreadTickets = lzm_chatDisplay.ticketGlobalValues.r - lzm_chatDisplay.ticketReadArray.length + lzm_chatDisplay.ticketUnreadArray.length;
        numberOfUnreadTickets = (typeof numberOfUnreadTickets == 'number' && numberOfUnreadTickets >= 0) ? numberOfUnreadTickets : 0;

        if (!customDemandToken && lzm_chatDisplay.ticketGlobalValues.u != numberOfUnreadTickets)
            lzm_chatDisplay.ticketGlobalValues.u = numberOfUnreadTickets;

        ChatTicketClass.EmailCount = lzm_chatDisplay.ticketGlobalValues['e'];

        $('#ticket-show-emails').children('span').html(t('Emails <!--number_of_emails-->',[['<!--number_of_emails-->', '(' + ChatTicketClass.EmailCount + ')']]));

        if (ChatTicketClass.EmailCount > 0)
        {
            $('#ticket-show-emails').addClass('lzm-button-b-active');
            $('#ticket-reload-emails').addClass('lzm-button-b-active');
        }
        else
        {
            $('#ticket-show-emails').removeClass('lzm-button-b-active');
            $('#ticket-reload-emails').removeClass('lzm-button-b-active');
        }

        if (!customDemandToken)
        {
            if (lzm_chatDisplay.selected_view == 'tickets')
                if (ticketDutHasChanged || forceRecreate)
                    that.createTicketList(lzm_chatDisplay.ticketListTickets, ticketGlobalValues, page, sort, sortDir, query, filter, false, '');

            if (numberOfUnreadTickets == 0 && lzm_chatDisplay.numberOfUnreadTickets != 0 && lzm_chatDisplay.ticketReadArray.length > 0)
                setAllTicketsRead();

            lzm_chatDisplay.numberOfUnreadTickets = numberOfUnreadTickets;

            if ($('#reply-placeholder').length > 0) {
                that.showOtherOpEditWarning(selectedTicket);
            }

            if(($('#ticket-message-placeholder').length == 1) && ($('#ticket-history-div').length == 1) && selectedTicket.id != '')
            {
                that.updateTicketDetails(selectedTicket);
            }
        }
        else if(customDemandToken && customDemandToken != 'linker')
        {
            if ($('#visitor-info-d-'+customDemandToken+'-placeholder').length > 0) {
                var numberOfTickets = tickets.length;
                $('#matching-tickets-d-'+customDemandToken+'-table').html(that.CreateMatchingTicketsTableContent(tickets, 'd-'+customDemandToken));
                $('#visitor-info-d-'+customDemandToken+'-placeholder-tab-6').html(t('Tickets (<!--number_of_tickets-->)', [['<!--number_of_tickets-->', numberOfTickets]]));
                if(numberOfTickets>0){
                    $('#visitor-info-d-'+customDemandToken+'-placeholder-tab-6').removeClass('ui-disabled');
                    $('#visitor-info-d-'+customDemandToken+'-placeholder-tab-6').addClass('lzm-tabs-message');
                }
                selectTicket('',true,true,'d-'+customDemandToken);
            }
            if ($('#visitor-info-e-'+customDemandToken+'-placeholder').length > 0) {
                var numberOfTickets = tickets.length;
                $('#matching-tickets-e-'+customDemandToken+'-table').html(that.CreateMatchingTicketsTableContent(tickets, 'e-'+customDemandToken));
                $('#visitor-info-e-'+customDemandToken+'-placeholder-tab-6').html(t('Tickets (<!--number_of_tickets-->)', [['<!--number_of_tickets-->', numberOfTickets]]));
                if(numberOfTickets>0){
                    $('#visitor-info-e-'+customDemandToken+'-placeholder-tab-6').removeClass('ui-disabled');
                    $('#visitor-info-e-'+customDemandToken+'-placeholder-tab-6').addClass('lzm-tabs-message');
                }
                selectTicket('',true,true,'e-'+customDemandToken);
            }
        }

        if (customDemandToken && customDemandToken != 'linker' && $('#ticket-linker-first').length > 0) {

            var position = $('#ticket-linker-first').data('search').split('~')[0];
            var linkerType = $('#ticket-linker-first').data('search').split('~')[1];
            var inputChangeId = $('#ticket-linker-first').data('input');
            if (linkerType == 'ticket')
            {
                that.fillLinkData(position, $('#' + inputChangeId).val(), false, true);
            }
        }
    }
    catch(e) {deblog(e);}

    that.UpdateSearchSettings(ChatTicketClass.SearchQuery.length > 0);

    lzm_chatDisplay.UpdateViewSelectPanel();
};

ChatTicketClass.prototype.showOtherOpEditWarning = function(selectedTicket) {
    if (selectedTicket.id != '') {

        if (typeof selectedTicket.editor != 'undefined' && typeof selectedTicket.editor.ed != 'undefined' && selectedTicket.editor.ed != lzm_chatDisplay.myId)
        {
            var otherOp = DataEngine.operators.getOperator(selectedTicket.editor.ed);
            if(otherOp == null)
                return;

            var opName = (otherOp != null) ? otherOp.name : t('another operator');
            var warningMsg = tid('ticket_processed_other_op', [['<!--op_name-->', opName]]);
            lzm_commonDialog.createAlertDialog(warningMsg, [{id: 'ok', name: t('Ok')}]);
            $('#alert-btn-ok').click(function() {
                lzm_commonDialog.removeAlertDialog();
            });
        }
    }
};

ChatTicketClass.prototype.createTicketListHtml = function(tickets, ticketGlobalValues, page, sort, sortDir, query, filter, elementId) {

    var fullScreenMode = this.isFullscreenMode(), that = this, i;
    var totalTickets = ticketGlobalValues.t;
    var unreadTickets = Math.max(0, ticketGlobalValues.r - lzm_chatDisplay.ticketReadArray.length + lzm_chatDisplay.ticketUnreadArray.length);
    lzm_chatDisplay.ticketGlobalValues.u = unreadTickets;

    var filteredTickets = ticketGlobalValues.q;
    ChatTicketClass.EmailCount = ticketGlobalValues.e;

    var ticketListInfo1 = t('<!--total_tickets--> total entries, <!--unread_tickets--> new entries, <!--filtered_tickets--> matching filter', [['<!--total_tickets-->', totalTickets], ['<!--unread_tickets-->', unreadTickets], ['<!--filtered_tickets-->', filteredTickets]]);
    var ticketListInfo2 = t('<!--total_tickets--> total entries, <!--unread_tickets--> new entries', [['<!--total_tickets-->', totalTickets], ['<!--unread_tickets-->', unreadTickets]]);
    var ticketListHtml = '<div id="ticket-list-headline2" class="lzm-dialog-headline2">';

    ticketListHtml += '<span class="left-button-list">'
        + lzm_inputControls.createButton('ticket-tree', '', 'handleTicketTree();','', '<i class="fa fa-list-ul"></i>', 'lr',{'margin-left': '4px','margin-right': '0px'}, '', -1,'e')
        + lzm_inputControls.createButton('ticket-filter', '', 'setTicketFilter();','', '<i class="fa fa-filter"></i>', 'lr',{'margin-left': '4px','margin-right': '0px'}, '', -1,'e')
        + '</span>';

    if (lzm_chatDisplay.windowWidth > ChatTicketClass.TreeSwitchWidth)
    {
        var ticketListInfo = (CommunicationEngine.ticketFilterStatus.length == 4 && CommunicationEngine.ticketQuery == '') ? ticketListInfo2 : ticketListInfo1;
        ticketListHtml += '<span class="lzm-dialog-hl2-info">' + ticketListInfo + '</span>';
    }

    ticketListHtml += '</div>';


    var ticketListBodyCss = ((IFManager.IsAppFrame || IFManager.IsMobileOS) || lzm_chatDisplay.windowWidth <= 1000) ? ' style="overflow: auto;"' : '';
    ticketListHtml += '<div id="ticket-list-body" class="lzm-dialog-body" onclick="removeTicketContextMenu();"' + ticketListBodyCss + '>';
    ticketListHtml += this.GetTicketTreeViewHTML(ticketGlobalValues);
    ticketListHtml += '<div id="ticket-list-left" class="ticket-list">';
    ticketListHtml += '<table class="visible-list-table alternating-rows-table lzm-unselectable"><thead><tr onclick="removeTicketContextMenu();">';

    if(fullScreenMode)
    {
        ticketListHtml += '<th>&nbsp;</th><th>&nbsp;</th><th>&nbsp;</th>';
        for (i=0; i<LocalConfiguration.TableColumns.ticket.length; i++)
        {
            var thisTicketColumn = LocalConfiguration.TableColumns.ticket[i];
            if (thisTicketColumn.display == 1)
            {
                var cellId = (typeof thisTicketColumn.cell_id != 'undefined') ? ' id="' + thisTicketColumn.cell_id + elementId + '"' : '';
                var cellClass = (typeof thisTicketColumn.cell_class != 'undefined') ? ' ' + thisTicketColumn.cell_class : '';
                var cellStyle = (typeof thisTicketColumn.cell_style != 'undefined') ? ' style="position: relative; white-space: nowrap; ' + thisTicketColumn.cell_style + '"' : ' style="position: relative; white-space: nowrap;"';
                var cellOnclick = (typeof thisTicketColumn.cell_onclick != 'undefined') ? ' onclick="' + thisTicketColumn.cell_onclick + '"' : '';
                var arrowType = (d(thisTicketColumn.sort_invert)) ? ((sortDir!='ASC')?'up':'down') : ((sortDir=='ASC')?'up':'down');
                var cellIcon = (d(thisTicketColumn.cell_class) && thisTicketColumn.cell_class == 'ticket-list-sort-column') ? '<span style="position: absolute; right: 4px;"><i class="fa fa-caret-'+arrowType+'"></i></span>' : '';
                var cellRightPadding = (typeof thisTicketColumn.cell_class != 'undefined' && thisTicketColumn.cell_class == 'ticket-list-sort-column') ? ' style="padding-right: 25px;"' : '';
                ticketListHtml += '<th' + cellId + cellStyle + cellOnclick + ' class="ticket_col_header'+cellClass+'"><span' + cellRightPadding + '>' + t(thisTicketColumn.title) + '</span>' + cellIcon + '</th>';
            }
        }
    }

    ticketListHtml += '</tr></thead><tbody>';
    var lineCounter = 0;
    var numberOfTickets = (typeof ticketGlobalValues.q != 'undefined') ? ticketGlobalValues.q : ticketGlobalValues.t;
    var numberOfPages = Math.max(1, Math.ceil(numberOfTickets / ticketGlobalValues.p));
    if (ticketGlobalValues.updating)
        ticketListHtml += '<tr><td colspan="15" style="font-weight: bold; font-size: 16px; text-align: center; padding: 20px;">' + t('The ticket database is updating.') +'</td></tr>';
    else if (!isNaN(numberOfPages))
        for (i=0; i<tickets.length; i++)
            if (tickets[i].del == 0)
            {
                ticketListHtml += that.createTicketListLine(tickets[i], lineCounter, false, elementId, fullScreenMode);
                lineCounter++;
            }

    ticketListHtml += '</tbody></table></div>';
    ticketListHtml += '<div id="ticket-list-right" class="ticket-list"></div>';
    ticketListHtml += '<div id="ticket-list-actions" class="ticket-list"><span style="float:left;">';
    ticketListHtml += lzm_inputControls.createButton('ticket-action-comment', 'ui-disabled ticket-action', 'ChatTicketClass.AddComment();', tid('comment'), '', 'r',{'margin-left':'8px'},'',-1,'e');
    ticketListHtml += '</span><span style="float:right;">';
    ticketListHtml += lzm_inputControls.createButton('ticket-action-translate', 'ui-disabled ticket-action', 'showTicketMsgTranslator();', tid('translate'), '', 'r',{'margin-right':'8px'},'',-1,'e');
    ticketListHtml += '</span></div>';
    ticketListHtml += '</div><div id="ticket-list-footline" class="lzm-dialog-footline">';

    if (!isNaN(numberOfPages)) {
        ticketListHtml += lzm_inputControls.createButton('ticket-page-all-backward', 'ticket-list-page-button', 'pageTicketList(1);', '', '<i class="fa fa-fast-backward"></i>', 'l',
            {'border-right-width': '1px'}) +
            lzm_inputControls.createButton('ticket-page-one-backward', 'ticket-list-page-button', 'pageTicketList(' + (page - 1) + ');', '', '<i class="fa fa-backward"></i>', 'r',
                {'border-left-width': '1px'}) +
            '<span style="padding: 0 15px;">' + t('Page <!--this_page--> of <!--total_pages-->',[['<!--this_page-->', page], ['<!--total_pages-->', numberOfPages]]) + '</span>' +
            lzm_inputControls.createButton('ticket-page-one-forward', 'ticket-list-page-button', 'pageTicketList(' + (page + 1) + ');', '', '<i class="fa fa-forward"></i>', 'l',{'border-right-width': '1px'}) +
            lzm_inputControls.createButton('ticket-page-all-forward', 'ticket-list-page-button', 'pageTicketList(' + numberOfPages + ');', '', '<i class="fa fa-fast-forward"></i>', 'r',{'border-left-width': '1px'});
    }
    ticketListHtml += '</div><div id="ticket-list-search-settings"></div>';
    return [ticketListHtml, numberOfPages, lineCounter];
};

ChatTicketClass.prototype.GetTicketTreeViewHTML = function(_amounts){

    function getSelClass(_id){
        return (_id == LocalConfiguration.TicketTreeCategory || LocalConfiguration.TicketTreeCategory == null && _id == 'tnFilterStatusActive') ? ' class="selected-treeview-div"' : '';
    }
    function getSubStatuses(_parentNumber, _parentId){
        var key,elemHtml ="";
        if(d(DataEngine.global_configuration.database))
            for(key in DataEngine.global_configuration.database['tsd'])
            {
                var elem = DataEngine.global_configuration.database['tsd'][key];
                {
                    var oncevs = ' onclick="ChatTicketClass.HandleTicketTreeClickEvent(this.id,\''+_parentId+'\',\''+elem.name+'\');"';
                    if(_parentNumber == elem.parent && elem.type == 0)
                        elemHtml += '<div id="'+elem.sid+'" style="padding-left:'+paddings[3]+';"'+getSelClass(elem.sid)+oncevs+'><i class="fa fa-caret-right icon-light"></i>'+elem.name+' ('+_amounts['ttsd' + elem.sid]+')</div>';
                }
            }
        return elemHtml;
    }

    var paddings =['5px','20px','35px','50px'],cactive = parseInt(_amounts['ttst0'])+parseInt(_amounts['ttst1']);
    var oncev = ' onclick="ChatTicketClass.HandleTicketTreeClickEvent(this.id,null);"';

    var treeHtml = '<div id="ticket-list-tree" class="ticket-list">';
    treeHtml += '<div id="ticket-search-panel" class="ticket-add-panel"><i class="fa fa-search icon-light icon-xxl"></i>&nbsp;' + lzm_inputControls.createInput('search-ticket','', ChatTicketClass.SearchQuery, '', '', 'text', '') + '&nbsp;<i id="search-ticket-reset" style="margin: 0 3px" class="fa fa-close icon-xxl lzm-clickable"></i></div>';
    treeHtml += '<div id="ttv_tn_all" style="padding-left:'+paddings[0]+';"'+getSelClass('ttv_tn_all')+oncev+'><i class="fa fa-caret-down icon-light"></i>'+tid('all_tickets')+' ('+_amounts['ta']+')</div>';
    treeHtml += '<div id="tnFilterStatusActive" style="padding-left:'+paddings[1]+';"'+getSelClass('tnFilterStatusActive')+oncev+'><i class="fa fa-caret-down icon-light"></i><b>'+tid('active')+' ('+cactive+')</b></div>';
    treeHtml += '<div id="tnFilterStatusOpen" style="padding-left:'+paddings[2]+';"'+getSelClass('tnFilterStatusOpen')+oncev+'><i class="fa fa-question-circle" style="color: #5197ff;"></i>'+tid('ticket_status_0')+' ('+_amounts['ttst0']+')</div>';
    treeHtml += getSubStatuses('0','tnFilterStatusOpen');
    treeHtml += '<div id="tnFilterStatusInProgress" style="padding-left:'+paddings[2]+';"'+getSelClass('tnFilterStatusInProgress')+oncev+'><i class="fa fa-gear" style="color: #808080;"></i>'+tid('ticket_status_1')+' ('+_amounts['ttst1']+')</div>';
    treeHtml += getSubStatuses('1','tnFilterStatusInProgress');
    treeHtml += '<div id="tnFilterStatusClosed" style="padding-left:'+paddings[2]+';"'+getSelClass('tnFilterStatusClosed')+oncev+'><i class="fa fa-check-circle icon-green"></i>'+tid('ticket_status_2')+' ('+_amounts['ttst2']+')</div>';
    treeHtml += getSubStatuses('2','tnFilterStatusClosed');
    treeHtml += '<div id="tnFilterStatusDeleted" style="padding-left:'+paddings[2]+';"'+getSelClass('tnFilterStatusDeleted')+oncev+'><i class="fa fa-remove icon-red"></i>'+tid('ticket_status_3')+' ('+_amounts['ttst3']+')</div>';
    treeHtml += getSubStatuses('3','tnFilterStatusDeleted');
    treeHtml += '<div style="padding-left:'+paddings[0]+';cursor:default;"><i class="fa fa-caret-down icon-light"></i>'+tid('my_tickets')+'</div>';
    treeHtml += '<div id="tnFilterMyTickets" style="padding-left:'+paddings[1]+';"'+getSelClass('tnFilterMyTickets')+oncev+'><i class="fa fa-caret-right icon-light"></i>'+tid('my_active_tickets')+' ('+_amounts['ttm']+')</div>';
    treeHtml += '<div id="tnFilterMyGroupsTickets" style="padding-left:'+paddings[1]+';"'+getSelClass('tnFilterMyGroupsTickets')+oncev+'><i class="fa fa-caret-right icon-light"></i>'+tid('my_groups_active_tickets')+' ('+_amounts['ttmg']+')</div>';
    treeHtml += '<div id="tnFilterWatchList" style="padding-left:'+paddings[1]+';"'+getSelClass('tnFilterWatchList')+oncev+'><i class="fa fa-binoculars"></i>'+tid('watch_list')+' ('+DataEngine.ticketWatchList.length+')</div>';
    treeHtml += '<div class="ticket-button-panel ticket-add-panel">';

    if(LocalConfiguration.TicketTreeCategory == 'tnFilterStatusActive' && ChatTicketClass.__ProcessNext(true) > 0)
    {
        treeHtml += lzm_inputControls.createButton('process-next-btn', 'lzm-button-b-active', 'ChatTicketClass.__ProcessNext(false);', tid('next_ticket'), '<i class="fa fa-play-circle"></i>', 'force-text',{'width':'195px','margin-bottom':0},'',30,'b');
        treeHtml += '<br>';
    }

    var emailDisabledClass = (ChatTicketClass.EmailCount > 0) ? 'lzm-button-b-active' : '';
    treeHtml += lzm_inputControls.createButton('ticket-show-emails', emailDisabledClass, '', t('Emails <!--number_of_emails-->',[['<!--number_of_emails-->', '(' + ChatTicketClass.EmailCount + ')']]), '<i class="fa fa-envelope-o"></i>', 'force-text',{'width':'161px','border-radius':'0'}, '', 30,'b');
    treeHtml += lzm_inputControls.createButton('ticket-reload-emails', emailDisabledClass, '', '&nbsp;', '<i class="fa fa-refresh"></i>', 'force-text',{'width':'15px','padding-left':'12px','border-radius':'0','margin-left':'-1px'}, '', 30,'b');
    treeHtml += '<br>';
    treeHtml += lzm_inputControls.createButton('ticket-create-new', '', '', t('Create Ticket'), '<i class="fa fa-plus"></i>', 'force-text', {'width':'195px','margin-top':0}, '', 30, 'b') + '</span>';

    return treeHtml + '</div></div>';
};

ChatTicketClass.prototype.createTicketListLine = function(ticket, lineCounter, inDialog, elementId, fullScreenMode) {
    var that = this, userStyle,i;
    ticket.messages.sort(that.ticketMessageSortfunction);
    userStyle = ' style="cursor: pointer;"';

    var ticketDateObject = lzm_chatTimeStamp.getLocalTimeObject(ticket.messages[0].ct * 1000, true);
    var ticketDateHuman = lzm_commonTools.getHumanDate(ticketDateObject, '', lzm_chatDisplay.userLanguage);
    var ticketLastUpdatedHuman = '-';
    if (ticket.u != 0) {
        var ticketLastUpdatedObject = lzm_chatTimeStamp.getLocalTimeObject(ticket.u * 1000, true);
        ticketLastUpdatedHuman = lzm_commonTools.getHumanDate(ticketLastUpdatedObject, '', lzm_chatDisplay.userLanguage);
    }
    var waitingTime = lzm_chatTimeStamp.getServerTimeString(null, true) - ticket.w;
    var waitingTimeHuman = '-';

    if (waitingTime < 0)waitingTimeHuman = '-';
    else if (waitingTime > 0 && waitingTime <= 3600)waitingTimeHuman = t('<!--time_amount--> minutes', [['<!--time_amount-->', Math.max(1, Math.floor(waitingTime / 60))]]);
    else if (waitingTime > 3600 && waitingTime <= 86400)waitingTimeHuman = t('<!--time_amount--> hours', [['<!--time_amount-->', Math.floor(waitingTime / 3600)]]);
    else if (waitingTime > 86400)waitingTimeHuman = t('<!--time_amount--> days', [['<!--time_amount-->', Math.floor(waitingTime / 86400)]]);

    var operator = '';
    var groupId = (typeof ticket.editor != 'undefined' && ticket.editor != false) ? ticket.editor.g : ticket.gr;

    if (typeof ticket.editor != 'undefined' && ticket.editor != false)
        operator = (DataEngine.operators.getOperator(ticket.editor.ed) != null) ? DataEngine.operators.getOperator(ticket.editor.ed).name : '';

    var callBack = (ticket.messages[0].cmb == 1) ? t('Yes') : t('No');
    var ticketReadFontWeight = ' font-weight: bold;';
    var ticketReadImage = '<i class="fa fa-envelope"></i>';

    if ((ticket.u <= lzm_chatDisplay.ticketGlobalValues.mr && lzm_commonTools.checkTicketReadStatus(ticket.id, lzm_chatDisplay.ticketUnreadArray) == -1) || lzm_commonTools.checkTicketReadStatus(ticket.id, lzm_chatDisplay.ticketReadArray, lzm_chatDisplay.ticketListTickets) != -1)
    {
        ticketReadImage = '<i class="fa fa-envelope-o"></i>';
        ticketReadFontWeight = '';
    }

    if (ticket.t == 6)
        ticketReadImage = '<i class="fa fa-facebook"></i>';
    else if (ticket.t == 7)
        ticketReadImage = '<i class="fa fa-twitter"></i>';

    var ticketStatusImage = '<i class="fa fa-question-circle" style="color: #5197ff;"></i>';
    var statusText = tid('ticket_status_0'), subStatusText = '';
    if (typeof ticket.editor != 'undefined' && ticket.editor != false) {
        subStatusText = ticket.editor.ss;
        if (ticket.editor.st == 1)
        {
            ticketStatusImage = '<i class="fa fa-gear" style="color: #808080;"></i>';
            statusText = tid('ticket_status_1');
        }
        else if (ticket.editor.st == 2){
            ticketStatusImage = '<i class="fa fa-check-circle icon-green"></i>';
            statusText = tid('ticket_status_2');
        }
        else if (ticket.editor.st == 3){
            ticketStatusImage = '<i class="fa fa-remove icon-red"></i>';
            statusText = tid('ticket_status_3');
        }

    }
    var onclickAction = '', ondblclickAction = '', oncontextmenuAction = '';
    if (!fullScreenMode)
        onclickAction = ' onclick="selectTicket(\'' + ticket.id + '\');setTimeout(function(){ChatTicketClass.__ShowTicket(\'' + ticket.id + '\', false, \'\', \'\', \'' + dialogId + '\');},100);"';
    else
    {
        var dialogId = (!inDialog || !$('#visitor-information').length) ? '' : $('#visitor-information').data('dialog-id');
        if(IFManager.IsMobileOS)
        {
            onclickAction = ' onclick="selectTicket(\'' + ticket.id + '\', false, ' + inDialog + ', \''+elementId+'\',this,event);openTicketContextMenu(event, \'' + ticket.id + '\', ' + inDialog + ', \''+elementId+'\',this); return false;"';
        }
        else
        {
            onclickAction = ' onclick="selectTicket(\'' + ticket.id + '\', false, ' + inDialog + ', \''+elementId+'\',this,event);"';
            oncontextmenuAction = ' oncontextmenu="openTicketContextMenu(event, \'' + ticket.id + '\', ' + inDialog + ', \''+elementId+'\',this); return false;"';
            ondblclickAction = ' ondblclick="ChatTicketClass.__ShowTicket(\'' + ticket.id + '\', false, \'\', \'\', \'' + dialogId + '\');"';
        }
    }

    var dueTimeFull = DataEngine.getConfigValue('gl_tidt',false)*3600;
    var dueTimeHalf = DataEngine.getConfigValue('gl_tidt',false)*2700;

    function getPriorityClass(_p){
        return['','','',' text-orange text-bold',' text-red text-bold'][_p];
    }
    function getWaitingTimeClass(_wt) {
        if(_wt > -1 &&_wt > dueTimeFull)
            return ' bg-red';
        else if(_wt > -1 &&_wt > dueTimeHalf)
            return ' bg-orange';
        return'';
    }
    function getWaitingTimeTextClass(_wt) {
        if(_wt > -1 &&_wt > dueTimeFull)
            return ' text-red text-bold';
        else if(_wt > -1 &&_wt > dueTimeHalf)
            return ' text-orange text-bold';
        return'';
    }

    var thisTicketSubject = (ticket.messages[0].s.length < 80) ? ticket.messages[0].s : ticket.messages[0].s.substr(0, 77) + '...';
    var columnContents = [{cid: 'last_update', contents: ticketLastUpdatedHuman},
        {cid: 'date', contents: ticketDateHuman},
        {cid: 'waiting_time', class: ' text-center' + getWaitingTimeTextClass(waitingTime), contents: waitingTimeHuman},
        {cid: 'ticket_id', class: ' text-center', contents: ticket.id},
        {cid: 'subject', contents: lzm_commonTools.htmlEntities(thisTicketSubject)},
        {cid: 'operator', contents: operator},
        {cid: 'name', contents: lzm_commonTools.htmlEntities(ticket.messages[0].fn)},
        {cid: 'email', contents: lzm_commonTools.htmlEntities(ticket.messages[0].em)},
        {cid: 'company', contents: lzm_commonTools.htmlEntities(ticket.messages[0].co)},
        {cid: 'group', contents: groupId}, {cid: 'phone', contents: lzm_commonTools.htmlEntities(ticket.messages[0].p)},
        {cid: 'hash', contents: ticket.h}, {cid: 'callback', contents: callBack},
        {cid: 'status', contents: statusText},
        {cid: 'sub_status', contents: subStatusText},
        {cid: 'channel_type', contents: ChatTicketClass.m_TicketChannels[ticket.t].title},
        {cid: 'sub_channel', contents: ticket.s},
        {cid: 'messages', class: ' text-center', contents: ticket.messages.length},
        {cid: 'ip_address', contents: ticket.messages[0].ip},
        {cid: 'language', contents: lzm_commonTools.GetLanguageName(ticket.l)},
        {cid: 'priority', class: ' text-center' + getPriorityClass(ticket.p), contents: tid('priority_' + ticket.p.toString())}

    ];

    LocalConfiguration.AddCustomBlock(columnContents);

    var tblCellStyle = ' style="' + ticketReadFontWeight + '"';
    var ticketLineId = (!inDialog) ? 'ticket-list-row-' + ticket.id : 'matching-ticket-list-'+elementId+'-row-' + ticket.id;
    var addClass = '';
    var lineHtml = '<tr data-line-number="' + lineCounter + '" class="ticket-list-row ticket-list-row-' + lineCounter + ' lzm-unselectable' +
        '" id="' + ticketLineId + '"' + userStyle + onclickAction + ondblclickAction + oncontextmenuAction + '>' +
        '<td' + tblCellStyle.replace(/"$/,'text-align: center;"') + ' class="icon-column" nowrap>' + ticketStatusImage + '</td>' +
        '<td' + tblCellStyle.replace(/"$/,'text-align: center;"') + ' class="icon-column" nowrap>' + ticketReadImage + '</td>' +
        '<td' + tblCellStyle.replace(/"$/,'text-align: center;"') + ' class="icon-column" nowrap>' + this.getDirectionImage(true,ticket.messages[ticket.messages.length-1],'') + '</td>';

    var searchFor = $('#search-ticket').val();

    if(fullScreenMode)
    {
        for (i=0; i<LocalConfiguration.TableColumns.ticket.length; i++)
            for (var j=0; j<columnContents.length; j++)
                if (LocalConfiguration.TableColumns.ticket[i].cid == columnContents[j].cid && LocalConfiguration.TableColumns.ticket[i].display == 1)
                {
                    addClass = (lzm_displayHelper.matchSearch(searchFor,columnContents[j].contents)) ? 'search-match' : '';

                    if(d(columnContents[j].class))
                        addClass += columnContents[j].class;

                    addClass += getWaitingTimeClass(waitingTime);
                    columnContents[j].contents = (columnContents[j].contents != '') ? columnContents[j].contents : '-';

                    if(LocalConfiguration.IsCustom(columnContents[j].cid))
                    {
                        var cindex = parseInt(columnContents[j].cid.replace('c',''));
                        var myCustomInput = DataEngine.inputList.getCustomInput(DataEngine.inputList.idList[cindex]);
                        var inputText = '';
                        var customValue = lzm_commonTools.GetElementByProperty(ticket.messages[0].customInput,'id',myCustomInput.name);
                        if(customValue.length)
                        {
                            inputText = (myCustomInput.type != 'CheckBox') ? lzm_commonTools.htmlEntities(customValue[0].text) : (customValue[0].text == 1) ? t('Yes') : t('No');
                            inputText = (inputText != '') ? inputText : '-';
                            addClass = (lzm_displayHelper.matchSearch(searchFor,inputText)) ? 'search-match' : getWaitingTimeClass(waitingTime);
                        }
                        else
                            inputText = '-';


                        lineHtml += '<td class="' + lz_global_trim(addClass) + '">' + inputText + '</td>';
                    }
                    else
                        lineHtml += '<td' + tblCellStyle + ' class="' + lz_global_trim(addClass) + '">' + columnContents[j].contents + '</td>';

                }

    }
    else
    {
        var svContent = '<div><b>' + lzm_commonTools.htmlEntities(ticket.messages[0].fn) + '</b></div>';
        svContent += '<div>' + lzm_commonTools.htmlEntities(ticket.messages[0].s) + '</div>';
        svContent += '<div class="lzm-info-text">' + lzm_commonTools.htmlEntities(lzm_commonTools.SubStr(ticket.messages[ticket.messages.length-1].mt,100,true)) + '</div>';
        svContent = svContent.replace(/\n/g, " ").replace(/\r/g, " ").replace(/<br>/g, " ");
        lineHtml += '<td' + tblCellStyle + ' class="' + lz_global_trim(addClass) + ' ticket-simple-cell">' + svContent + '</td>';
    }

    return lineHtml + '</tr>';
};

ChatTicketClass.prototype.createMatchingTickets = function(_ticketList,elementId) {
    elementId = (typeof elementId != 'undefined') ? elementId : '';
    return '<div id="matching-tickets-'+elementId+'-inner"><table id="matching-tickets-'+elementId+'-table" class="visible-list-table alternating-rows-table lzm-unselectable" style="width: 100%;margin-top:1px;">' + this.CreateMatchingTicketsTableContent(_ticketList,elementId) + '</table></div>';
};

ChatTicketClass.prototype.CreateMatchingTicketsTableContent = function(tickets, elementId) {
    var that = this, lineCounter = 0, i;
    var tableHtml = '<thead><tr onclick="removeTicketContextMenu();">' +
        '<th style="width: 18px;">&nbsp;</th>' +
        '<th>&nbsp;</th>' +
        '<th style="width: 18px;">&nbsp;</th>';
    for (i=0; i<LocalConfiguration.TableColumns.ticket.length; i++)
    {
        var thisTicketColumn = LocalConfiguration.TableColumns.ticket[i];
        if (thisTicketColumn.display == 1) {
            var inactiveColumnClass = '';
            if (typeof thisTicketColumn.cell_id != 'undefined') {
                inactiveColumnClass = ((CommunicationEngine.ticketSort == 'update' && thisTicketColumn.cell_id == 'ticket-sort-update') ||
                    (CommunicationEngine.ticketSort == 'wait' && thisTicketColumn.cell_id == 'ticket-sort-wait') ||
                    (CommunicationEngine.ticketSort == '' && thisTicketColumn.cell_id == 'ticket-sort-date')) ? '' : ' inactive-sort-column';
            }
            var cellId = (typeof thisTicketColumn.cell_id != 'undefined') ? ' id="' + thisTicketColumn.cell_id + elementId + '"' : '';
            var cellClass = (typeof thisTicketColumn.cell_class != 'undefined') ? ' class="' + thisTicketColumn.cell_class + inactiveColumnClass + '"' : '';
            var cellStyle = (typeof thisTicketColumn.cell_style != 'undefined') ? ' style="position: relative; white-space: nowrap; ' + thisTicketColumn.cell_style + '"' : ' style="position: relative; white-space: nowrap;"';
            var cellOnclick = (typeof thisTicketColumn.cell_onclick != 'undefined') ? ' onclick="' + thisTicketColumn.cell_onclick + '"' : '';
            var cellIcon = (typeof thisTicketColumn.cell_class != 'undefined' && thisTicketColumn.cell_class == 'ticket-list-sort-column') ? '<span style="position: absolute; right: 4px;"><i class="fa fa-caret-down"></i></span>' : '';
            var cellRightPadding = (typeof thisTicketColumn.cell_class != 'undefined' && thisTicketColumn.cell_class == 'ticket-list-sort-column') ? ' style="padding-right: 25px;"' : '';
            tableHtml += '<th' + cellId + cellClass + cellStyle + cellOnclick + '><span' + cellRightPadding + '>' + t(thisTicketColumn.title) + '</span>' + cellIcon + '</th>';
        }
    }
    tableHtml += '</tr></thead><tbody>';
    for (i=0; i<tickets.length; i++)
        if (tickets[i].del == 0)
        {
            tableHtml += that.createTicketListLine(tickets[i], lineCounter, true, elementId,this.isFullscreenMode());
            lineCounter++;
        }

    tableHtml += '</tbody>';
    return tableHtml;
};

ChatTicketClass.prototype.setTicketDetailEvents = function(_showComments,_showMessages,_showLogs){
    $('#ticket-history-show-comments').change(function(){
        if($('#ticket-history-show-comments').prop('checked'))
            $('.message-comment-line').css('display','');
        else
            $('.message-comment-line').css('display','none');
    });
    $('#ticket-history-show-logs').change(function(){
        if($('#ticket-history-show-logs').prop('checked'))
            $('.message-log-line').css('display','');
        else
            $('.message-log-line').css('display','none');
    });
    $('#ticket-history-show-messages').change(function(){
        if($('#ticket-history-show-messages').prop('checked'))
        {
            $('.message-line').css('display','');
            $('#ticket-history-show-comments').parent().removeClass('ui-disabled');
        }
        else
        {
            $('.message-line').css('display','none');
            $('#ticket-history-show-comments').prop('checked',false);
            $('#ticket-history-show-comments').parent().addClass('ui-disabled');
        }
        $('#ticket-history-show-comments').change();
        $('#ticket-history-show-logs').change();
    });

    if(d(_showComments)){
        $('#ticket-history-show-comments').prop('checked',_showComments);
        $('#ticket-history-show-messages').prop('checked',_showMessages);
        $('#ticket-history-show-logs').prop('checked',_showLogs);
    }
    $('#ticket-history-show-comments').change();
    $('#ticket-history-show-logs').change();
    $('#ticket-history-show-messages').change();
};

ChatTicketClass.prototype.updateTicketDetails = function(_selectedTicket) {
    var showMessages = $('#ticket-history-show-messages').prop('checked');
    var showLogs = $('#ticket-history-show-logs').prop('checked');
    var showComments = $('#ticket-history-show-comments').prop('checked');

    var selectedMessage = $('#ticket-history-table').data('selected-message'), that = this;
    var selectedGroup = DataEngine.groups.getGroup($('#ticket-details-group').val());
    var ticketId = _selectedTicket.id + ' [' + _selectedTicket.h + ']';
    var messageNo = $('#ticket-history-table').data('selected-message');
    var message = _selectedTicket.messages[messageNo];

    var ticketDetails = that.createTicketDetails(ticketId, _selectedTicket, message, {id: 0}, {cid: 0}, ' class="ui-disabled"', false, selectedGroup);
    var messageListHtml = that.CreateTicketHistoryTable(_selectedTicket, {id: ''}, selectedMessage, false, {cid: ''});

    $('#ticket-message-list').html('' + messageListHtml).trigger('create');
    $('#ticket-ticket-details').html('' + ticketDetails.html).trigger('create');

    $('#message-line-' + _selectedTicket.id + '_' + selectedMessage).addClass('selected-table-line');
    $('.comment-line-' + _selectedTicket.id  + '_' + selectedMessage).addClass('selected-table-line');

    var edit = $('#message-details-inner').data('edit');
    var messageHtml = (edit) ? '<textarea id="change-message-text">' + message.mt + '</textarea>' : '' + lzm_commonTools.htmlEntities(message.mt).replace(/\n/g, '<br />');

    this.UpdateMessageHeader(_selectedTicket.id,message);

    $('#ticket-message-text').html(messageHtml);

    $('#message-details-inner').data('message', message);
    $('#message-details-inner').data('email', {id: ''});
    $('#message-details-inner').data('is-new', false);
    $('#message-details-inner').data('chat', {cid: ''});
    $('#message-details-inner').data('edit', edit);

    that.createTicketDetailsChangeHandler(_selectedTicket);
    that.setTicketDetailEvents(showComments,showMessages,showLogs);

    if(TaskBarManager.GetWindow(_selectedTicket.Id) != null)
        TaskBarManager.GetWindow(_selectedTicket.Id).Tag = lzm_commonTools.clone(_selectedTicket);

    UIRenderer.resizeTicketDetails();
};

ChatTicketClass.prototype.UpdateMessageHeader = function(_ticketId,_selectedMessage){
    var detailsHtml = '';
    if(_selectedMessage != null)
    {
        var fullscreenmode = lzm_chatDisplay.ticketDisplay.isFullscreenMode();

        if(fullscreenmode)
            detailsHtml += ChatTicketClass.GetHTMLSwitch(fullscreenmode,_selectedMessage);

        var operator = DataEngine.operators.getOperator(_selectedMessage.sid);
        if (operator != null)
        {
            if(fullscreenmode)
                detailsHtml += '<div><span>' + tidc('name') + '</span><span>' + operator.name + '</span></div>';
            detailsHtml += '<div><span>' + tidc('sent_to') + '</span><span>' + lzm_commonTools.htmlEntities(_selectedMessage.em) + '</span></div>';
        }
        else
        {
            if(fullscreenmode && _selectedMessage.fn != '')
                detailsHtml += '<div><span>' + tidc('name') + '</span><span>' + lzm_commonTools.htmlEntities(_selectedMessage.fn) + '</span></div>';
            if(_selectedMessage.em!='')
                detailsHtml += '<div><span>' + tidc('email') + '</span><span>' + lzm_commonTools.htmlEntities(_selectedMessage.em) + '</span></div>';
        }

        if(fullscreenmode)
            if(_selectedMessage.s.length)
                detailsHtml += '<div><span>' + tidc('subject') + '</span><span>' + lzm_commonTools.htmlEntities(_selectedMessage.s) + '</span></div>';
    }
    $('#ticket-message-details').html(detailsHtml);
};

ChatTicketClass.prototype.GetTicketWindowTitle = function(_isNew,_ticket,_chat){
    var title = tid('ticket');
    if (!_isNew && _ticket != null && d(_ticket.messages) && _ticket.messages.length)
    {
        if (_ticket.messages[0].fn != '')
            title = lzm_commonTools.htmlEntities(lzm_commonTools.SubStr(_ticket.messages[0].fn,30,true));
         else
            title = _ticket.id;
    }
    else
    {
        title = tid('create_ticket');
        if(_chat != null && d(_chat) && d(_chat.en) && _chat.en.length)
            title += ' (' + lzm_commonTools.htmlEntities(lzm_commonTools.SubStr(_chat.en,30,true)) + ')';
        else if(_chat != null && d(_chat.Visitor) && _chat.Visitor != null)
            title += ' (' + DataEngine.inputList.getInputValueFromVisitor(111,_chat.Visitor,30) + ')';
    }
    return title;
};

ChatTicketClass.prototype.ShowTicket = function(_ticket, isNew, email, _chat){

    ChatTicketClass.DisplayInsecure = false;
    ChatTicketClass.DisplayType = 'TEXT';

    var that = this, saveClicked = false;
    isNew = (typeof isNew != 'undefined') ? isNew : false;

    lzm_chatDisplay.ticket = _ticket;

    if(!isNew)
    {
        if(TaskBarManager.GetWindow(_ticket.id + '_preview') != null)
        {
            TaskBarManager.GetWindow(_ticket.id + '_preview').Maximize();
            return '';
        }
        else if(TaskBarManager.GetWindow(_ticket.id + '_reply') != null)
        {
            TaskBarManager.GetWindow(_ticket.id + '_reply').Maximize();
            return '';
        }
        else if(TaskBarManager.GetWindow(_ticket.id) != null)
        {
            TaskBarManager.GetWindow(_ticket.id).Maximize();
            return '';
        }
    }

    var parentWindow = TaskBarManager.GetActiveWindow();
    var i,disabledString = (isNew && email.id == '' && _chat.cid == '') ? '' : ' class="ui-disabled"';
    var bodyString = '',fullScreenMode = this.isFullscreenMode();
    var selectedGroup = DataEngine.groups.getGroupList()[0];
    var headerString = this.GetTicketWindowTitle(isNew,_ticket,_chat);
    var disabledButtonClass = (isNew) ? ' ui-disabled' : '';
    var footerString = '<span style="float: left;">';

    if(!isNew && (_ticket.messages[0].cmb == '1' || _ticket.type == '2'))
        footerString += lzm_inputControls.createButton('call-ticket-details', 'ticket-buttons' + disabledButtonClass, '', tid('phone_call'), '<i class="fa fa-phone"></i>', 'lr', {'margin-left': '4px'}, '', 20, 'e');

    if(fullScreenMode)
        footerString += lzm_inputControls.createButton('reply-ticket-details', 'ticket-buttons' + disabledButtonClass, '', tid('ticket_reply'), '<i class="fa fa-mail-reply"></i>', 'lr', {'margin-left': '4px', padding:'4px 15px'}, '', 20, 'e');

    footerString += lzm_inputControls.createButton('ticket-actions', 'ticket-buttons' + disabledButtonClass, '', t('Actions'), '<i class="fa fa-wrench"></i>', 'lr', {'margin-left': (fullScreenMode) ? '-1px' : '4px'}, '', 20, 'e') + '</span>' +
    lzm_inputControls.createButton('save-ticket-details', 'ticket-buttons','', t('Ok'), '', 'lr',{'margin-left': '4px'}, '', 5, 'd') +

    lzm_inputControls.createButton('cancel-ticket-details', 'ticket-buttons','', t('Cancel'), '', 'lr',{'margin-left': '4px'}, '', 8, 'd');

    footerString += lzm_inputControls.createButton('apply-ticket-details', 'ticket-buttons' + disabledButtonClass,'', t('Apply'), '', 'lr', {'margin-left': '4px'}, '', 8, 'd');

    var lastMessage = (typeof _ticket.messages != 'undefined') ? _ticket.messages.length - 1 : -1;

    var historyTableHtml = '<div id="ticket-message-list">' + that.CreateTicketHistoryTable(_ticket, email, lastMessage, isNew, _chat) + '</div>';
    var ticketDetailsPH = '<div id="ticket-details-div" class="ticket-panel" onclick="removeTicketMessageContextMenu();"><div id="ticket-details-placeholder"></div></div>';
    var ticketHistoryPH = '<div id="ticket-history-div" class="ticket-panel" onclick="removeTicketMessageContextMenu();"><div id="ticket-history-table-placeholder"></div></div>';
    var ticketMessagePH = '<div id="ticket-message-div" onclick="removeTicketMessageContextMenu();"><div id="ticket-message-placeholder"></div>';

    if(!isNew && !fullScreenMode)
    {
        ticketMessagePH += '<div id="ticket-message-footer">';
        ticketMessagePH += lzm_inputControls.createButton('reply-ticket-details', 'ticket-buttons' + disabledButtonClass, '', tid('ticket_reply'), '<i class="fa fa-mail-reply"></i>', 'force-text', {'margin-left': '4px'}, '', 20, 'e');
        ticketMessagePH += ChatTicketClass.GetHTMLSwitch(fullScreenMode);
        ticketMessagePH += '</div>';
    }

    ticketMessagePH += '</div>';

    bodyString += ticketDetailsPH;

    if(fullScreenMode || !isNew)
        bodyString += ticketMessagePH;

    if(fullScreenMode && !isNew)
    {
        bodyString += ticketHistoryPH;
    }

    var ticketId = (!isNew && typeof _ticket.id != 'undefined') ? _ticket.id + ' [' + _ticket.h + ']' : '';
    var myDetails = that.createTicketDetails(ticketId, _ticket, myMessage, email, _chat, disabledString, isNew, selectedGroup);
    var myMessage = (isNew) ? {} : _ticket.messages[lastMessage];
    var messageDetailsHtml = '';
    var ticketDetailsHtml = '<div id="ticket-ticket-details">' + myDetails.html + '</div>';

    selectedGroup = myDetails.group;

    var menuEntry = (!isNew) ? t('Ticket (<!--ticket_id-->, <!--name-->)',[['<!--ticket_id-->', _ticket.id],['<!--name-->', _ticket.messages[0].fn]]) : (email.id == '') ? t('New Ticket') : t('New Ticket (<!--name-->)', [['<!--name-->', email.n]]);
    var attachmentsHtml = '<div id="ticket-attachment-list">' + that.createTicketAttachmentTable(_ticket, email, lastMessage, isNew, 'ticket-message-placeholder-tab-1') + '</div>';
    var reminderHtml = this.getReminderHtml(_ticket);

    var messageHtml = (isNew) ? '' : '<div id="ticket-message-details" class="lzm-dialog-headline5"></div>';
    messageHtml += '<div id="ticket-message-text">';

    if (d(_ticket.messages))
        messageHtml += lzm_commonTools.htmlEntities(_ticket.messages[lastMessage].mt).replace(/\n/g, '<br />');

    if (isNew)
    {
        var newTicketText = '';
        if(email.id != '')
            newTicketText = email.text;

        if(_chat.cid != '')
        {
            if(d(_chat.Messages) && _chat.Messages.length)
            {
                for(var key in _chat.Messages)
                {
                    if(!d(_chat.Messages[key].info_header) && _chat.Messages[key].sen != '0000000')
                        newTicketText += _chat.Messages[key].text + "\r\n";
                }
            }
            if(!newTicketText.length)
            {
                if(d(_chat.s))
                    newTicketText = _chat.s;
            }
        }

        newTicketText = newTicketText.replace(/(\r\n|\r|\n){2,}/g, '$1\n');
        messageHtml += '<textarea id="ticket-new-input" class="ticket-reply-text">' + newTicketText + '</textarea>';
    }

    messageHtml += '</div>';



    var dialogData = {'ticket-id': _ticket.id, 'email-id': email.id, menu: menuEntry};
    var dialogId = '';

    if (email.id == '' && _chat.cid == '')
    {
        dialogId = (isNew) ? lzm_commonTools.guid() : _ticket.id;
        dialogId = lzm_commonDialog.CreateDialogWindow(headerString, bodyString, footerString, 'envelope', 'ticket-details', dialogId, 'cancel-ticket-details', true, dialogData);
        $('#ticket-details-body').data('dialog-id', dialogId);
    }
    else if (email.id == '' && _chat.cid != '')
    {
        dialogId = lzm_commonDialog.CreateDialogWindow(headerString, bodyString, footerString, 'envelope', 'ticket-details', md5(_chat.cid), 'cancel-ticket-details', true, dialogData);
        $('#ticket-details-body').data('dialog-id', dialogId);
    }
    else
    {
        TaskBarManager.GetWindow('email-list').ShowInTaskBar = false;
        TaskBarManager.GetWindow('email-list').Minimize();
        dialogId = lzm_commonDialog.CreateDialogWindow(headerString, bodyString, footerString, 'envelope', 'ticket-details', md5(email.id), 'cancel-ticket-details', true, dialogData);
    }

    TaskBarManager.GetWindow(dialogId).Tag = lzm_commonTools.clone(_ticket);

    var ticketMessageTabArray = [{name: tid('details'), content: messageHtml},{name: tid('attachments'), content: attachmentsHtml},{name: tid('reminder'), content: reminderHtml}];
    var ticketDetailsTabArray;
    if(fullScreenMode)
    {
        ticketDetailsTabArray = [{name: tid('ticket_details'), content: messageDetailsHtml + ticketDetailsHtml}];

        lzm_displayHelper.createTabControl('ticket-details-placeholder', ticketDetailsTabArray, 0);
        lzm_displayHelper.createTabControl('ticket-message-placeholder', ticketMessageTabArray, 0);

        if (!isNew)
        {
            var ticketHistoryTabArray = [{name: tid('history'), content: historyTableHtml}];
            lzm_displayHelper.createTabControl('ticket-history-table-placeholder', ticketHistoryTabArray, 0);
        }

        $('#ticket-message-div').addClass('ticket-panel');
        $('#ticket-details-div').addClass('ticket-side-panel');
        $('#ticket-history-div').addClass('ticket-side-panel');
    }
    else
    {
        if (!isNew)
        {
            ticketDetailsTabArray = [
                {name: tid('history'), content: historyTableHtml},
                {name: tid('ticket_details'), content: messageDetailsHtml + ticketDetailsHtml}
            ];
            $('#ticket-message-div').css('display','none');
        }
        else
        {
            ticketDetailsTabArray = [
               {name: tid('ticket_details'), content: messageDetailsHtml + ticketDetailsHtml},
               {name: tid('message'), content: ticketMessagePH}
            ];

        }

        lzm_displayHelper.createTabControl('ticket-details-placeholder', ticketDetailsTabArray, 0);
        lzm_displayHelper.createTabControl('ticket-message-placeholder', ticketMessageTabArray, 0);


    }


    if(!isNew && fullScreenMode)
        $('#message-line-' + _ticket.id + '_' + (lastMessage)).click();

    $('.ui-collapsible-content').css({'overflow-x': 'auto'});
    that.createTicketDetailsChangeHandler(_ticket);

    $('#message-details-inner').data('message', myMessage);
    $('#message-details-inner').data('email', email);
    $('#message-details-inner').data('is-new', isNew);
    $('#message-details-inner').data('chat', _chat);

    $('#rem-active').change(function() {
        if(!$('#rem-active').prop('checked'))
            $('#rem-settings').addClass('ui-disabled');
        else
            $('#rem-settings').removeClass('ui-disabled');
    });
    $('#rem-active').change();

    this.ActivateAttachmentButtons(_ticket, dialogId, menuEntry);

    $('#remove-attachment').click(function() {
        var resources = $('#ticket-message-placeholder-content-1').data('selected-resources');
        resources = (typeof resources != 'undefined') ? resources : [];
        var tmpResources = [];
        for (var i=0; i<resources.length; i++) {
            if (i != $('#attachment-table').data('selected-attachment')) {
                tmpResources.push(resources[i]);
            }
        }
        $('#ticket-message-placeholder-content-1').data('selected-resources', tmpResources);
        that.updateAttachmentList();
        $('#attachment-table').data('selected-attachment', -1);
        $('#remove-attachment').addClass('ui-disabled');
    });
    $('#ticket-actions').click(function(e) {
        e.stopPropagation();
        if (lzm_chatDisplay.showTicketMessageContextMenu)
        {
            removeTicketMessageContextMenu();
        }
        else
        {
            openTicketMessageContextMenu(e, _ticket.id, '', true);
        }
    });
    $('#call-ticket-details').click(function() {
        var openTicket = lzm_commonTools.clone(_ticket);
        showPhoneCallDialog(openTicket.id, '0', 'ticket');
    });
    $('#reply-ticket-details').click(function() {

        try
        {
            var opName = t('another operator'), confirmText = '';
            var openTicket = lzm_commonTools.clone(_ticket);

            for (var i=0; i<lzm_chatDisplay.ticketListTickets.length; i++)
                if (lzm_chatDisplay.ticketListTickets[i].id == _ticket.id)
                    openTicket = lzm_commonTools.clone(lzm_chatDisplay.ticketListTickets[i]);

            if (d(openTicket.editor) && openTicket.editor != false)
            {
                var eop = DataEngine.operators.getOperator(openTicket.editor.ed);
                if(eop != null)
                {
                    opName = eop.name;
                    confirmText = t('This ticket is already processed by <!--op_name-->. Do you really want to take it over?', [['<!--op_name-->', opName]]);
                }
            }

            if($.inArray(openTicket.gr,DataEngine.operators.getOperator(lzm_chatDisplay.myId).groups)==-1)
            {
                lzm_commonDialog.createAlertDialog(tid('not_member_of').replace('<!--obj-->',openTicket.gr), [{id: 'ok', name: t('Ok')}]);
                $('#alert-btn-ok').click(function() {
                    lzm_commonDialog.removeAlertDialog();
                });
                return;
            }

            var handleTicketTakeOver = function(){
                if (!d(openTicket.editor) || !openTicket.editor || openTicket.editor.ed == '' || openTicket.editor.ed != lzm_chatDisplay.myId || openTicket.editor.st != 1)
                {
                    var myGroup = (d(openTicket.editor) && openTicket.editor != false) ? openTicket.editor.g : openTicket.gr;
                    initSaveTicketDetails(openTicket, openTicket.t, 1, myGroup, lzm_chatDisplay.myId, openTicket.l);
                    uploadSaveTicketDetails();
                    if (!d(openTicket.editor) || openTicket.editor == false)
                    {
                        var now = lzm_chatTimeStamp.getServerTimeString(null, true);
                        openTicket.editor = {id: openTicket.id, u: now, w: now, st: 0, ti: now, g: myGroup};
                    }
                    openTicket.editor.ed = lzm_chatDisplay.myId;
                }

                if(that.updatedTicket != null && that.updatedTicket.id == _ticket.id)
                    openTicket.l = that.updatedTicket.l;

                that.showMessageReply(openTicket, $('#ticket-history-table').data('selected-message'), selectedGroup, menuEntry);

            };
            if (!d(openTicket.editor) || !openTicket.editor || openTicket.editor.ed == '' || openTicket.editor.ed == lzm_chatDisplay.myId)
            {
                handleTicketTakeOver();
            }
            else
            {
                lzm_commonDialog.createAlertDialog(confirmText, [{id: 'ok', name: t('Ok')}, {id: 'cancel', name: t('Cancel')}]);
                $('#alert-btn-ok').click(function() {
                    if (that.checkTicketTakeOverReply()) {
                        handleTicketTakeOver();
                        lzm_commonDialog.removeAlertDialog();
                    }
                });
                $('#alert-btn-cancel').click(function() {
                    lzm_commonDialog.removeAlertDialog();
                });
            }
        }
        catch(ex)
        {
            deblog(ex);
        }
    });
    $('#apply-ticket-details').click(function() {
        that.SaveTicket(_ticket, isNew, email, _chat);
    });
    $('#save-ticket-details').click(function() {
        saveClicked = true;
        that.SaveTicket(_ticket, isNew, email, _chat);
        $('#cancel-ticket-details').click();
    });
    $('#cancel-ticket-details').click(function() {

        if(TaskBarManager.WindowExists(_ticket.id + '_reply',false))
        {
            $('#reply-ticket-details').click();
            return;
        }

        if (email.id != '')
        {
            TaskBarManager.RemoveWindowByDialogId(md5(email.id));
            TaskBarManager.GetWindow('email-list').ShowInTaskBar = true;
            TaskBarManager.GetWindow('email-list').Maximize();

            if (!saveClicked)
            {
                setTimeout(function() {
                    $('#reset-emails').click();
                }, 50);
            }
            scrollToEmail(that.selectedEmailNo);
        }
        else if (_chat.cid != '')
        {
            TaskBarManager.RemoveActiveWindow();
            if(parentWindow != null)
                parentWindow.Maximize();
        }
        else
        {
            TaskBarManager.RemoveActiveWindow();
            if(parentWindow != null)
                parentWindow.Maximize();
        }
        lzm_chatDisplay.ticketOpenMessages = [];
    });
    $('.ticket-message-placeholder-tab').click(function(){
        UIRenderer.resizeTicketDetails();
    });

    that.setTicketDetailEvents();
    UIRenderer.resizeTicketDetails();

    if(!fullScreenMode)
    {

    }
    else if(isNew)
    {
        $('#ticket-new-input').focus();
    }

    return dialogId;
};

ChatTicketClass.prototype.ActivateAttachmentButtons = function(_ticket, _dialogId, _menuEntry){
    if(IFManager.IsDesktopApp() && d(IFManager.DeviceInterface.hasModule) && IFManager.DeviceInterface.hasModule('lz-screenshot-widget'))
        $('#ticket-reply-add-attachment-context-menu-button').click(function(event){
            var cm = {
                id: 'ticket-reply-add-attachment-context-menu',
                onClickFunction: ticketReplyAddAttachmentContextMenu,
                entries: [
                    {
                        label: tid('file'),
                        value: {myDialogId: _dialogId, ticket:{id:_ticket.id}, menuEntry:_menuEntry}
                    },
                    {
                        label: tid('screenshot'),
                        value: {tab:'ticket-reply', id:{myDialogId: _dialogId, ticket:{id:_ticket.id}, menuEntry:_menuEntry}}
                    }
                ]
            };
            ContextMenuClass.BuildMenu(event, cm);
            event.stopPropagation();
        });
    else
        $('#add-attachment').click(function(){
            ticketReplyAddAttachmentContextMenu({myDialogId: _dialogId, ticket:{id:_ticket.id}, menuEntry:_menuEntry});
        });

    $('#add-attachment-from-qrd').click(function() {

        var winObj = TaskBarManager.GetActiveWindow();
        winObj.ShowInTaskBar = false;
        winObj.Minimize();
        var fileResources = DataEngine.cannedResources.getResourceList('ti', {ty: '0,3,4'});
        lzm_chatDisplay.resourcesDisplay.createQrdTreeDialog(fileResources, 'ATTACHMENT~' + _dialogId, _menuEntry, winObj);
    });
};

ChatTicketClass.prototype.SaveTicket = function(_ticket, isNew, email, chat){
    var that=this,myCustomInput,myStatus = $('#ticket-details-status').val();
    if (!that.checkTicketDetailsChangePermission(_ticket, {status: myStatus}))
        showNoPermissionMessage();
    else
    {
        for (var i=0; i<DataEngine.tickets.length; i++)
            if (DataEngine.tickets[i].id == _ticket.id)
                _ticket = lzm_commonTools.clone(DataEngine.tickets[i]);

        var rem_time = 0, rem_status = 2;

        if($('#rem-active').prop('checked'))
        {
            try
            {
                rem_status = $("#ticket-reminder input[type='radio']:checked").val();
                var remDate = new Date($('#rem-date-year').val(),parseInt($('#rem-date-month').val())-1,$('#rem-date-day').val(),$('#rem-date-hour').val(),$('#rem-date-minute').val(),0,0);
                rem_time = parseInt((remDate.getTime()/1000) + parseInt(lzm_chatTimeStamp.timeDifference));

                if(isNaN(rem_time))
                    rem_time = 0;
            }
            catch(ex) {rem_time = 0;}
        }

        if(d(_ticket.id) && $('#ticket-details-priority').prop('selectedIndex').toString() != _ticket.p)
            setTicketPriority(_ticket.id,$('#ticket-details-priority').prop('selectedIndex').toString());

        var attachments, comments, customFields = {};
        if (email.id == '' && chat.cid == '')
        {
            var mc = '';
            if (d(_ticket.LocalEdited))
            {
                var changedMessage = _ticket.messages[0];

                mc = {
                    tid: _ticket.id,
                    mid: _ticket.id,
                    n: changedMessage.fn,
                    e: changedMessage.em,
                    c: changedMessage.co,
                    p: changedMessage.p,
                    s: changedMessage.s,
                    t: changedMessage.mt,
                    custom:[]
                };

                for (i=0; i<DataEngine.inputList.idList.length; i++)
                {
                    myCustomInput = DataEngine.inputList.getCustomInput(DataEngine.inputList.idList[i]);
                    if (myCustomInput.active == 1)
                    {
                        var val = lzm_commonTools.GetElementByProperty(changedMessage.customInput,'id',myCustomInput.name);
                        if(val.length)
                            mc.custom.push({id: DataEngine.inputList.idList[i], value:val[0].text});
                    }
                }
            }
            attachments = $('#ticket-message-placeholder-content-1').data('selected-resources');
            attachments = (typeof attachments != 'undefined') ? attachments : [];
            customFields = that.readCustomFields();

            initSaveTicketDetails(_ticket, $('#ticket-details-channel').val(), $('#ticket-details-status').val(),
                $('#ticket-details-group').val(), $('#ticket-details-editor').val(), $('#ticket-details-language').val(),
                $('#ticket-new-name').val(), $('#ticket-new-email').val(), $('#ticket-new-company').val(), $('#ticket-new-phone').val(),
                $('#ticket-new-input').val(), attachments, comments, customFields,$('#ticket-details-sub-status').val(),$('#ticket-details-sub-channel').val(), {cid: ''}, mc,$('#ticket-new-subject').val(),rem_time,rem_status, $('#ticket-details-priority').val());
            uploadSaveTicketDetails(isNew ? 'new-ticket' : 'save-details',{cid: ''});
        }
        else if (email.id == '' && chat.cid != '')
        {
            attachments = $('#ticket-message-placeholder-content-1').data('selected-resources');
            attachments = (typeof attachments != 'undefined') ? attachments : [];
            customFields = that.readCustomFields();

            initSaveTicketDetails(_ticket,
                $('#ticket-details-channel').val(),
                $('#ticket-details-status').val(),
                $('#ticket-details-group').val(),
                $('#ticket-details-editor').val(),
                $('#ticket-details-language').val(),
                $('#ticket-new-name').val(),
                $('#ticket-new-email').val(),
                $('#ticket-new-company').val(),
                $('#ticket-new-phone').val(),
                $('#ticket-new-input').val(),
                attachments,
                comments,
                customFields,
                $('#ticket-details-sub-status').val(),
                $('#ticket-details-sub-channel').val(), chat,'',
                $('#ticket-new-subject').val(),rem_time,rem_status, $('#ticket-details-priority').val());
            uploadSaveTicketDetails(isNew ? 'new-ticket' : 'save-details',chat);
        }
        else
        {
            customFields = that.readCustomFields();

            lzm_chatDisplay.ticketsFromEmails.push({'email-id': email.id, ticket: _ticket, channel: $('#ticket-details-channel').val(), status: $('#ticket-details-status').val(),
                group: $('#ticket-details-group').val(), editor: $('#ticket-details-editor').val(), language: $('#ticket-details-language').val(),
                name: $('#ticket-new-name').val(), email: $('#ticket-new-email').val(), company: $('#ticket-new-company').val(), phone: $('#ticket-new-phone').val(),
                message: $('#ticket-new-input').val(), subject: $('#ticket-new-subject').val(), attachment: email.attachment, comment: comments, custom: customFields});

            setTimeout(function(){
                var selLine = false;
                $('.email-list-line').each(function(i, obj) {

                    if(selLine==null)
                        return;

                    if($(obj).hasClass('selected-table-line')){
                        selLine = true;
                    }
                    else if(selLine==true)
                    {
                        selLine = null;
                        $(obj).click();
                        return;
                    }
                });
            },200);
        }

    }
};

ChatTicketClass.prototype.readCustomFields = function(){
    var customFields = {},myCustomInput  = null;
    for (var i=0; i<DataEngine.inputList.idList.length; i++) {
        myCustomInput = DataEngine.inputList.getCustomInput(DataEngine.inputList.idList[i]);
        if (myCustomInput.active == 1 && parseInt(myCustomInput.id) < 111)
            customFields[myCustomInput.id] = DataEngine.inputList.getControlValue(myCustomInput,'ticket-new-cf' + myCustomInput.id);
    }
    return customFields;
};

ChatTicketClass.prototype.getReminderHtml = function(ticket){

    var status = '1';
    var span =  lzm_commonStorage.loadValue('ticket_reminder_span_' + DataEngine.myId);
    if(span == null)
        span = 604800;

    var suggDate = lz_global_timestamp()+span;
    var date = new Date(suggDate*1000);

    if(typeof ticket.AutoStatusUpdateTime != 'undefined' && ticket.AutoStatusUpdateTime > lz_global_timestamp()){
        date = new Date(ticket.AutoStatusUpdateTime*1000);
        status = ticket.AutoStatusUpdateStatus;
    }

    return '<div id="ticket-reminder" class="left-space">' +
        '<div class="top-space">'+lzm_inputControls.createCheckbox('rem-active',tidc('reminder_active'),typeof ticket.AutoStatusUpdateTime != 'undefined')+'</div>'+
        '<div class="left-space" id="rem-settings">' +
        '<div class="top-space-half">'+lzm_inputControls.createRadio('rem-status_0','','rem-status',tid('ticket_status_0'),status=='0','0')+'</div>'+
        '<div>'+lzm_inputControls.createRadio('rem-status_1','','rem-status',tid('ticket_status_1'),status=='1','1')+'</div>'+
        '<div>'+lzm_inputControls.createRadio('rem-status_2','','rem-status',tid('ticket_status_2'),status=='2','2')+'</div>'+
        '<div>'+lzm_inputControls.createRadio('rem-status_3','','rem-status',tid('ticket_status_3'),status=='3','3')+'</div>'+
        '<table class="top-space" style="max-width:300px;"><tr>' +
        '<td>' + lzm_inputControls.createInput('rem-date-day','',date.getDate(),tidc('day'),'','number','')+
        '</td><td>' + lzm_inputControls.createInput('rem-date-month','',date.getMonth()+1,tidc('month'),'','number','')+
        '</td><td>' + lzm_inputControls.createInput('rem-date-year','',date.getFullYear(),tidc('year'),'','number','')+
        '</td><td style="padding-left:5px;">' +lzm_inputControls.createInput('rem-date-hour','',date.getHours(),tidc('hour'),'','number','')+
        '</td><td>' + lzm_inputControls.createInput('rem-date-minute','',date.getMinutes(),tidc('minute'),'','number','')+
        '</td></tr></table><br>' +
        '</div></div>';
};

ChatTicketClass.prototype.isFullscreenMode = function(){
    return (!IFManager.IsMobileOS && lzm_chatDisplay.windowHeight > 450 && lzm_chatDisplay.windowWidth > 900);
};

ChatTicketClass.prototype.updateAttachmentList = function() {
    var tableString = '';
    var resources1 = $('#reply-placeholder-content-1').data('selected-resources');
    var resources2 = $('#ticket-message-placeholder-content-1').data('selected-resources');
    var resources = (typeof resources1 != 'undefined') ? resources1 : (typeof resources2 != 'undefined') ? resources2 : [];

    for (var i=0; i<resources.length; i++) {
        myDownloadLink = getQrdDownloadUrl({rid: resources[i].rid, ti: resources[i].ti});
        var fileTypeIcon = lzm_chatDisplay.resourcesDisplay.getFileTypeIcon(resources[i].ti);
        tableString += '<tr id="attachment-line-' + i + '" class="attachment-line" style="cursor:pointer;"' +
            ' onclick="ChatTicketClass.HandleTicketAttachmentClick(' + i + ');">' +
            '<td class="icon-column">' + fileTypeIcon + '</td><td style="text-decoration: underline; white-space: nowrap; cursor: pointer;"><a href="#" class="lz_chat_link_no_icon" onclick="downloadFile(\'' + myDownloadLink + '\')">' +
            lzm_commonTools.htmlEntities(resources[i].ti) + '</a></td><td></td></tr>';
    }
    $('#attachment-table').children('tbody').html(tableString);
};

ChatTicketClass.prototype.createTicketDetails = function(ticketId, ticket, _message, email, chat, disabledString, isNew, selectedGroup) {

    var i,selectedLanguage = '', availableLanguages = [], disabledClass;

    // MESSAGE DETAILS

    chat = (typeof chat != 'undefined') ? chat : {cid: ''};

    var editCustom,myCustomInput,myInputText,myInputField,j;
    var detailsHtml = '<table id="ticket-details-inner" class="visible-list-table alternating-rows-table">';
    if (isNew)
    {
        detailsHtml += '<tr><th>' + tidc('ticket_id') + '</th><td id="ticket-details-id" colspan="4">' + tid('new') + '</td></tr>';
        var newTicketName = '',newTicketEmail = '',newTicketCompany = '',newTicketPhone = '';

        if(email.id != '')
        {
            newTicketName = email.n;
            newTicketEmail = email.e;
            newTicketCompany = '';
            newTicketPhone = '';
        }
        else if(chat.cid != '' && chat.Visitor)
        {
            newTicketName = DataEngine.inputList.getInputValueFromVisitor(111,chat.Visitor,64,true);//VisitorManager.GetVisitorName(chat.Visitor);
            newTicketEmail = DataEngine.inputList.getInputValueFromVisitor(112,chat.Visitor);
            newTicketCompany = DataEngine.inputList.getInputValueFromVisitor(113,chat.Visitor);
            newTicketPhone = DataEngine.inputList.getInputValueFromVisitor(116,chat.Visitor);
        }
        else if(d(chat.en))
        {
            newTicketName = chat.en;
            newTicketEmail = chat.em;
            newTicketCompany = chat.co;
            newTicketPhone = chat.cp;
        }

        detailsHtml += '<tr><th>' + tidc('name') + '</th><td class="sub" colspan="4"><input type="text" id="ticket-new-name" value="' + lzm_commonTools.htmlEntities(newTicketName) + '" /></td></tr>';
        detailsHtml += '<tr><th>' + tidc('email') + '</th><td class="sub" colspan="4"><input type="text" id="ticket-new-email" value="' + lzm_commonTools.htmlEntities(newTicketEmail) + '" /></td></tr>';
        detailsHtml += '<tr><th>' + t('Company:') + '</th><td class="sub" colspan="4"><input type="text" id="ticket-new-company" value="' + lzm_commonTools.htmlEntities(newTicketCompany) + '" /></td></tr>';
        detailsHtml += '<tr><th>' + t('Phone:') + '</th><td class="sub" colspan="4"><input type="text" id="ticket-new-phone" value="' + lzm_commonTools.htmlEntities(newTicketPhone) + '" /></td></tr>';

        var newTicketSubject = '';

        if(typeof email != 'undefined' && typeof email.s != 'undefined' && email.s != '')
            newTicketSubject = email.s;

        if(d(chat) && d(chat.s))
        {
            if(chat.s != '')
                newTicketSubject = lzm_commonTools.SubStr(chat.s,32,true);
            else if(d(chat.Messages) && chat.Messages.length > 1)
                newTicketSubject = lzm_commonTools.SubStr(chat.Messages[1].text,32,true);
        }

        detailsHtml += '<tr><th>' + tidc('subject') + '</th><td class="sub" colspan="4"><input type="text" id="ticket-new-subject" value="' + lzm_commonTools.htmlEntities(newTicketSubject) + '" /></td></tr>';

        for (i=0; i<DataEngine.inputList.idList.length; i++)
        {
            myCustomInput = DataEngine.inputList.getCustomInput(DataEngine.inputList.idList[i]);
            var selectedValue = '';

            if(email.id != '')
            {
                selectedValue = '';
            }
            else if(chat.cid != '' && chat.Visitor)
            {
                selectedValue = DataEngine.inputList.getInputValueFromVisitor(DataEngine.inputList.idList[i],chat.Visitor);
            }
            else if(d(chat.cc) && d(chat.cc[i]))
            {
                selectedValue = chat.cc[i].text;
            }

            if (myCustomInput.type == 'ComboBox')
            {
                myInputField = '<select class="lzm-select" id="ticket-new-cf' + myCustomInput.id + '">';
                for (j=0; j<myCustomInput.value.length; j++)
                {
                    var selectedString = (selectedValue == myCustomInput.value[j]) ? ' selected="selected"' : '';
                    myInputField += '<option value="' + j + '"' + selectedString + '>' + myCustomInput.value[j] + '</option>';
                }
                myInputField +='</select>';
            }
            else if (myCustomInput.type == 'CheckBox')
            {
                var checkedString = (selectedValue.toString() == '1' || selectedValue == tid('yes')) ? ' checked="checked"' : '';
                myInputText = myCustomInput.value;
                myInputField = '<input type="checkbox" class="checkbox-custom" id="ticket-new-cf' + myCustomInput.id + '" style="min-width: 0px; width: auto;" value="' + myInputText + '"' + checkedString + ' /><label for="ticket-new-cf' + myCustomInput.id + '" class="checkbox-custom-label"></label>';
            }
            else
            {
                myInputText = lzm_commonTools.htmlEntities(selectedValue);
                myInputField = '<input type="text" id="ticket-new-cf' + myCustomInput.id + '" value="' + myInputText + '" />';
            }

            if (myCustomInput.active == 1 && parseInt(myCustomInput.id) < 111)
                detailsHtml += '<tr><th>' + myCustomInput.name + ':</th><td class="sub" colspan="4">' + myInputField + '</td></tr>';
        }
    }
    if(d(ticket.messages) && ticket.messages.length)
    {
        detailsHtml += '<tr><th>' + tidc('ticket_id') + '</th><td id="ticket-details-id" colspan="4">' + ticketId + '</td></tr>';

        var rootMessage = ticket.messages[0];

        detailsHtml += '<tr><th>' + tidc('name') + '</th><td id="saved-message-name" colspan="3">' + lzm_commonTools.htmlEntities(rootMessage.fn) + '</td><td class="edit"><i class="fa icon-blue fa-pencil lzm-clickable2" onclick="ChatTicketClass.EditTicketField(\''+ticket.id+'\',111);"></i></td></tr>';
        detailsHtml += '<tr><th>' + tidc('email') + '</th><td id="saved-message-email" colspan="3">' + lzm_commonTools.htmlEntities(rootMessage.em) + '</td><td class="edit"><i class="fa icon-blue  fa-pencil lzm-clickable2" onclick="ChatTicketClass.EditTicketField(\''+ticket.id+'\',112);"></i></td></tr>';
        detailsHtml += '<tr><th>' + tidc('company') + '</th><td id="saved-message-company" colspan="3">' + lzm_commonTools.htmlEntities(rootMessage.co) + '</td><td class="edit"><i class="fa icon-blue fa-pencil lzm-clickable2" onclick="ChatTicketClass.EditTicketField(\''+ticket.id+'\',113);"></i></td></tr>';
        detailsHtml += '<tr><th>' + tidc('phone') + '</th><td id="saved-message-phone" colspan="3"><a href="#" onclick="showPhoneCallDialog(\'' + ticket.id + '\', 0, \'ticket\');">' + lzm_commonTools.htmlEntities(rootMessage.p) + '</a></td><td class="edit"><i class="fa icon-blue fa-pencil lzm-clickable2" onclick="ChatTicketClass.EditTicketField(\''+ticket.id+'\',116);"></i></td></tr>';

        var subject = (rootMessage.t == 0 && rootMessage.s != '') ? '<a onclick="openLink(\'' + rootMessage.s + '\');" href="#" class="lz_chat_link_no_icon">' + rootMessage.s + '</a>' : lzm_commonTools.htmlEntities(rootMessage.s);
        var subjectLabel = (rootMessage.t == 0 && rootMessage.s != '') ? t('Url:') : tidc('subject');

        detailsHtml += '<tr><th colspan="5" class="vspace"></th></tr>';
        detailsHtml += '<tr><th>' + subjectLabel + '</th><td id="saved-message-subject" colspan="3">' + subject + '</td><td class="edit"><i class="fa icon-blue fa-pencil lzm-clickable2" onclick="ChatTicketClass.EditTicketField(\''+ticket.id+'\',\'subject\');"></i></td></tr>';


        var customhtml = '';
        for (i=0; i<DataEngine.inputList.idList.length; i++)
        {
            myCustomInput = DataEngine.inputList.getCustomInput(DataEngine.inputList.idList[i]);
            myInputText = '';

            if (myCustomInput.active == 1 && rootMessage.customInput.length > 0 && $.inArray(rootMessage.t, ['0', '2', '4']) != -1)
            {
                for (j=0; j<rootMessage.customInput.length; j++)
                {
                    if (rootMessage.customInput[j].id == myCustomInput.name)
                    {
                        myInputText = DataEngine.inputList.getReadableValue(myCustomInput,rootMessage.customInput[j].text,rootMessage.attachment);
                    }
                }
                if (myCustomInput.active == 1 && parseInt(myCustomInput.id) < 111)
                {
                    editCustom = '<i class="fa icon-blue fa-pencil lzm-clickable2" onclick="ChatTicketClass.EditTicketField(\''+ticket.id+'\','+myCustomInput.id+');"></i>';
                    if(myCustomInput.type == 'File')
                        editCustom = '';

                    customhtml += '<tr><th>' + myCustomInput.name + ':</th><td colspan="3">' + myInputText + '</td><td class="edit">'+editCustom+'</td></tr>';
                }
            }
            else if (myCustomInput.active == 1 && rootMessage.customInput.length == 0 && $.inArray(rootMessage.t, ['0', '2', '4']) != -1)
            {
                if (myCustomInput.active == 1 && parseInt(myCustomInput.id) < 111)
                {
                    editCustom = '<i class="fa icon-blue fa-pencil lzm-clickable2" onclick="ChatTicketClass.EditTicketField(\''+ticket.id+'\','+myCustomInput.id+');"></i>';
                    if(myCustomInput.type == 'File')
                        editCustom = '';

                    customhtml += '<tr><th>' + myCustomInput.name + ':</th><td colspan="3">-</td><td class="edit">'+editCustom+'</td></tr>';
                }
            }
        }

        if(customhtml.length)
        {
            detailsHtml += '<tr><th colspan="5" class="vspace"></th></tr>';
            detailsHtml += customhtml;
        }

        if(rootMessage.cmb=='1')
            detailsHtml += lzm_inputControls.createInfoField('fa fa-phone icon-large icon-blue',tid('phone_outbound'),'');
    }

    detailsHtml += '<tr><th colspan="5" class="vspace"></th></tr>';

    // CHANNEL
    detailsHtml += '<tr><th>' + tidc('channel') + '</th><td colspan="2"><select id="ticket-details-channel" class="lzm-select"' + disabledString + '>';

    for (var aChannel=0; aChannel<ChatTicketClass.m_TicketChannels.length; aChannel++)
    {
        var channel = ChatTicketClass.m_TicketChannels[aChannel];
        selectedString = (channel.index == ticket.t || (email.id != '' && channel.key == 'email')) ? ' selected="selected"' : (chat.cid != '' && channel.index == 4) ? ' selected="selected"' : '';

        if (!isNew || channel.index < 6)
            detailsHtml += '<option' + selectedString + ' value="' + channel.index + '">' + channel.title + '</option>';
    }

    //SUBCHANNEL
    detailsHtml += '</select></td>';
    detailsHtml += '<td colspan="2" class="sub"><select id="ticket-details-sub-channel" class="lzm-select"></select>';

    // STATUS
    detailsHtml += '</td></tr><tr><th>' + tid('ticket_status') + '</th>';
    disabledClass = (lzm_commonPermissions.checkUserPermissions('', 'tickets', 'change_ticket_status', {})) ? '' : ' class="ui-disabled"';
    detailsHtml += '<td colspan="2"><select id="ticket-details-status" class="lzm-select"' + disabledClass + '>';

    var states = [tid('ticket_status_0'), tid('ticket_status_1'), tid('ticket_status_2'), tid('ticket_status_3')];

    for (var aState=0; aState<states.length; aState++)
    {
        selectedString = (typeof ticket.editor != 'undefined' && ticket.editor != false && aState == ticket.editor.st) ? ' selected="selected"' : '';
        detailsHtml += '<option' + selectedString + ' value="' + aState + '">' + states[aState] + '</option>';
    }

    // SUBSTATUS
    detailsHtml += '</select></td><td colspan="2" class="sub"><select id="ticket-details-sub-status" class="lzm-select"' + disabledClass + '>';

    // GROUP
    detailsHtml += '</select></td></tr><tr><th>' + tidc('group') + '</th>';
    disabledClass = (lzm_commonPermissions.checkUserPermissions('', 'tickets', 'assign_groups', {})) ? '' : ' class="ui-disabled"';
    detailsHtml += '<td colspan="4" class="sub"><select id="ticket-details-group" class="lzm-select"' + disabledClass + '>';

    var preSelectedGroup = '';
    if (email.id != '')
        preSelectedGroup = email.g;
    else if (chat.cid != '')
        preSelectedGroup = chat.dcg;
    else
        preSelectedGroup = (isNew) ? lzm_chatDisplay.myGroups[0] : '';

    if(this.updatedTicket!=null && this.updatedTicket.id == ticket.id){
        ticket.l = this.updatedTicket.l;
        ticket.gr = this.updatedTicket.gr;
    }

    var groups = DataEngine.groups.getGroupList(), langName = '';
    for (i=0; i<groups.length; i++)
    {
        selectedString = '';
        if (typeof ticket.editor != 'undefined' && ticket.editor != false)
        {
            if (groups[i].id == ticket.editor.g) {
                selectedString = ' selected="selected"';
                selectedGroup = groups[i];
                selectedLanguage = groups[i].pm[0].lang;
            }
        }
        else
        {
            if (typeof ticket.gr != 'undefined' && groups[i].id == ticket.gr)
            {
                selectedString = ' selected="selected"';
                selectedGroup = groups[i];
                selectedLanguage = groups[i].pm[0].lang;
            }
            else if (groups[i].id == preSelectedGroup)
            {
                selectedString = ' selected="selected"';
                selectedGroup = groups[i];
                selectedLanguage = groups[i].pm[0].lang;
            }
        }
        detailsHtml += '<option value="' + groups[i].id + '"' + selectedString + '>' + groups[i].id + '</option>';
    }


    // EDITOR
    detailsHtml += '</select></td></tr><tr><th>' + t('Editor:') + '</th>';
    disabledClass = (lzm_commonPermissions.checkUserPermissions('', 'tickets', 'assign_operators', {})) ? '' : ' class="ui-disabled"';
    detailsHtml += '<td colspan="4" class="sub"><select id="ticket-details-editor" class="lzm-select"' + disabledClass + '><option value="-1">' + tid('none') + '</option>';

    if(selectedGroup != null)
    {
        var operators = DataEngine.operators.getOperatorList('name', selectedGroup.id);
        for (i=0; i<operators.length; i++) {
            if (operators[i].isbot != 1)
            {
                selectedString = (typeof ticket.editor != 'undefined' && ticket.editor != false && ticket.editor.ed == operators[i].id) ? ' selected="selected"' : '';
                detailsHtml += '<option' + selectedString + ' value="' + operators[i].id + '">' + operators[i].name + '</option>';
            }
        }
    }

    // LANGUAGE
    detailsHtml += '</select></td></tr><tr><th>' + tidc('language') + '</th><td colspan="4" class="sub"><select id="ticket-details-language" class="lzm-select">';

    for (i=0; i<selectedGroup.pm.length; i++)
    {
        availableLanguages.push(selectedGroup.pm[i].lang);
        selectedString = '';

        if((typeof ticket.l != 'undefined' && selectedGroup.pm[i].lang.toLowerCase() == ticket.l.toLowerCase()) || (email.id != '' && selectedGroup.pm[i].def == '1'))
        {
            selectedString = ' selected="selected"';
            selectedLanguage = selectedGroup.pm[i].lang;
        }

        if(selectedLanguage == '' && selectedGroup.pm[i].lang.toLowerCase() == DataEngine.defaultLanguage.toLowerCase())
        {
            selectedString = ' selected="selected"';
            selectedLanguage = selectedGroup.pm[i].lang;
        }

        langName = lzm_chatDisplay.getLanguageDisplayName(selectedGroup.pm[i].lang);
        detailsHtml += '<option value="' + selectedGroup.pm[i].lang + '"' + selectedString + '>' + langName + '</option>';
    }
    if (typeof ticket.l != 'undefined' && $.inArray(ticket.l, availableLanguages) == -1)
    {
        langName = lzm_commonTools.GetLanguageName(ticket.l);
        detailsHtml += '<option value="' + ticket.l + '" selected="selected">' + langName + '</option>';
        selectedLanguage = ticket.l;
    }
    detailsHtml += '</select></td></tr>';

    //PRIORITY
    detailsHtml += '<tr><th>' + tidc('priority') + '</th><td colspan="4" class="sub"><select id="ticket-details-priority" class="lzm-select">';

    for(i=0;i<5;i++){
        selectedString = (i==ticket.p || (isNew && i==2)) ? ' selected="selected"' : '';
        detailsHtml += '<option value="'+ i.toString()+'"'+selectedString+'>'+tid('priority_'+ i.toString())+'</option>';
    }
    detailsHtml += '</select></td></tr>';
    detailsHtml += '<tr><th></th><td colspan="4" style="height:auto;background:#fff;"></td></tr></table>';
    return {html: detailsHtml, language: selectedLanguage, group: selectedGroup}
};

ChatTicketClass.prototype.createTicketAttachmentTable = function(ticket, email, messageNumber, isNew, tabName) {
    var acount = 0, j, downloadUrl;
    var attachmentsHtml = "", previewHtml = '';

    if(isNew && email.id == '')
    {
        var disabledClass = (ticket.t == 6 || ticket.t == 7) ? 'ui-disabled' : '';
        attachmentsHtml += '<div class="lzm-dialog-headline3"><span style="float:right;">';

        if(IFManager.IsDesktopApp() && d(IFManager.DeviceInterface.hasModule) && IFManager.DeviceInterface.hasModule('lz-screenshot-widget'))
            attachmentsHtml += lzm_inputControls.createButton('ticket-reply-add-attachment-context-menu-button', '', '', t('Add'), '<i class="fa fa-plus"></i>', 'lr',  {'margin-right':'-1px'}, t('Add'), 30, 'e');
        else
            attachmentsHtml += lzm_inputControls.createButton('add-attachment', disabledClass, '', t('Add'), '<i class="fa fa-upload"></i>', 'lr',  {'margin-right':'-1px'}, t('Add Attachment'), -1, 'e');

        attachmentsHtml += lzm_inputControls.createButton('add-attachment-from-qrd', disabledClass, '', t('Add from resource'), '<i class="fa fa-database"></i>', 'lr', {'margin-right':'4px'}, t('Add Attachment from Resource'), 30, 'e');
        attachmentsHtml += lzm_inputControls.createButton('remove-attachment', 'ui-disabled', '', t('Remove'), '<i class="fa fa-remove"></i>', 'lr',  {'margin-right':'4px'}, t('Remove Attachment'), 30, 'e');

        attachmentsHtml += '</span></div>';
    }

    attachmentsHtml += '<table id="attachment-table" class="visible-list-table alternating-rows-table lzm-unselectable"><thead><tr><th style=\'width: 18px !important;\'></th><th>' + t('File name') + '</th><th style="width:30px;"></th></tr></thead><tbody>';

    if (ticket != null && d(ticket.messages) && typeof ticket.messages[messageNumber] != 'undefined' && typeof ticket.messages[messageNumber].attachment != 'undefined') {
        for (j=0; j<ticket.messages[messageNumber].attachment.length; j++) {
            acount++;
            downloadUrl = getQrdDownloadUrl({
                ti: lzm_commonTools.htmlEntities(ticket.messages[messageNumber].attachment[j].n),
                rid: ticket.messages[messageNumber].attachment[j].id
            });

            var event = 'ChatTicketClass.HandleTicketAttachmentClick(' + j + ');';
            if(lzm_commonTools.isImageFile(ticket.messages[messageNumber].attachment[j].n))
                event+='ChatTicketClass.PreviewTicketAttachment(\''+downloadUrl+'\');';
            else
                event+='ChatTicketClass.PreviewTicketAttachment(null);';
            attachmentsHtml += '<tr id="attachment-line-' + j + '" class="attachment-line lzm-unselectable" style="cursor:pointer;" onclick="'+event+'">';

            var fileTypeIcon = lzm_chatDisplay.resourcesDisplay.getFileTypeIcon(ticket.messages[messageNumber].attachment[j].n);
            attachmentsHtml += '<td class="icon-column" style="text-align: center;">' + fileTypeIcon + '</td><td' +
                ' style="text-decoration: underline; white-space: nowrap; cursor: pointer;" onclick="">' +
                lzm_commonTools.htmlEntities(ticket.messages[messageNumber].attachment[j].n) +
                '</td><td>' +
                lzm_inputControls.createButton(messageNumber+"-"+j+"dnl",'','downloadFile(\'' + downloadUrl + '\')', '', '<i class="fa fa-cloud-download nic"></i>', 'lr', {float:'right','margin-right':'4px'}, t('Download')) +
                '</td></tr>';
        }

        if(this.isFullscreenMode() && ticket.messages[messageNumber].attachment.length>0)
        {
            previewHtml = '<div class="lzm-dialog-headline5"></div>';
            previewHtml +='<div id="att-img-preview-field"></div>';
        }
    }
    if (email.id != '') {
        for (var l=0; l<email.attachment.length; l++) {
            downloadUrl = getQrdDownloadUrl({
                ti: lzm_commonTools.htmlEntities(email.attachment[l].n),
                rid: email.attachment[l].id
            });
            attachmentsHtml += '<tr class="lzm-unselectable">' +
                '<td class="icon-column" style="">' + lzm_chatDisplay.resourcesDisplay.getFileTypeIcon(email.attachment[l].n) + '</td><td>' +
                lzm_commonTools.htmlEntities(email.attachment[l].n) +
                '</td><td>' +
                lzm_inputControls.createButton(email.attachment[l].id+"-"+l+"dnl",'','downloadFile(\'' + downloadUrl + '\')', '', '<i class="fa fa-cloud-download nic"></i>', 'lr', {float:'right','margin-right':'4px'}, t('Download')) +
                '</td></tr>';
        }
    }
    attachmentsHtml += '</tbody></table>' + previewHtml;
    if(typeof tabName != 'undefined'){
        acount = (acount > 0) ? ' (' + acount + ')' : '';
        $('#'+tabName).html(tid('attachments')+acount);
    }
    return attachmentsHtml;
};

var ticketReplyAddAttachmentContextMenu = function(_data){
    if(_data.tab)
    {
        IFManager.IFScreenCast(_data.tab, _data.id);
    }
    else
    {
        ticketReplyAddAttachmentFile(_data);
    }
};

var ticketReplyAddAttachmentFile = function(_data){

    if ((!IFManager.IsAppFrame && !IFManager.IsMobileOS) || IFManager.IsDesktopApp())
    {
        if(_data.screenshot)
        {
            UserActions.addQrd(3,'', true, _data.data.myDialogId, null, _data.data.menuEntry);
        }
        else
        {
            var winObj = TaskBarManager.GetActiveWindow();
            winObj.ShowInTaskBar = false;
            winObj.Minimize();
            UserActions.addQrd(3,'', true, _data.myDialogId, null, _data.menuEntry, winObj);
        }
    }
    else
    {
        showNotMobileMessage();
    }
};

ChatTicketClass.prototype.showMessageReply = function(ticket, messageNo, selectedGroup, menuEntry) {

    menuEntry = (typeof menuEntry != 'undefined') ? menuEntry : '';
    var that = this;
    var i, j = 0, signatureText = '', answerInline = false, mySig = {};

    messageNo = (messageNo == -1) ? ticket.messages.length -1 : messageNo;
    var messageNoSal = 0;
    var myself = DataEngine.operators.getOperator(lzm_chatDisplay.myId);
    var signatures = [];
    var groups = DataEngine.groups.getGroupList();
    var rDiaId = ticket.id + '_reply';

    if(TaskBarManager.WindowExists(rDiaId,false))
    {
        TaskBarManager.GetWindow(ticket.id).Minimize();
        TaskBarManager.GetWindow(ticket.id).ShowInTaskBar = false;
        TaskBarManager.GetWindow(rDiaId).Maximize();
        $('#ticket-reply-input').focus();
        return;
    }

    for (i=0; i<myself.sig.length; i++) {
        mySig = myself.sig[i];
        mySig.priority = 4;
        if (myself.sig[i].d == 1) {
            mySig.priority = 5;
        }
        signatures.push(mySig);
    }

    for (i=0; i<groups.length; i++) {
        if ($.inArray(groups[i].id, myself.groups) != -1) {
            for (j=0; j<groups[i].sig.length; j++) {
                mySig =  groups[i].sig[j];
                mySig.priority = 0;
                if (groups[i].sig[j].d == 1 && groups[i].sig[j].g != selectedGroup.id) {
                    mySig.priority = 1;
                } else if (groups[i].sig[j].d != 1 && groups[i].sig[j].g == selectedGroup.id) {
                    mySig.priority = 2;
                } else if (groups[i].sig[j].d == 1 && groups[i].sig[j].g == selectedGroup.id) {
                    mySig.priority = 3;
                }
                signatures.push(mySig);
            }
        }
    }
    signatures.sort(function(a, b) {
        return (a.d < b.d);
    });

    var salutationFields = lzm_commonTools.getTicketSalutationFields(ticket, messageNoSal);
    var checkedString = (ticket.t != 6 && ticket.t != 7) ? ' checked="checked"' : '';
    var disabledString2 = (ticket.t == 6 || ticket.t == 7) ? ' ui-disabled' : '';
    var disabledString;

    var salBreaker = ($('#ticket-details-body').width() < 800) ? "" : "";
    var replyString = '<table id="ticket-reply" class="tight">' +
        '<tr><td><fieldset class="lzm-fieldset"><legend>' + t('Salutation') + '</legend>' +
        '<div id="tr-enable-salutation-fields" style="padding-bottom: 8px;">' +
        '<input type="checkbox" id="enable-tr-salutation" class="checkbox-custom"' + checkedString + ' />' +
        '<label for="enable-tr-salutation" class="checkbox-custom-label">' + t('Use salutation') + '</label></div>' +
        '<div class="tr-salutation-fields' + disabledString2 + '">';
    checkedString = (salutationFields['salutation'][0]) ? ' checked="checked"' : '';
    disabledString = (salutationFields['salutation'][0]) ? '' : ' class="ui-disabled"';

    replyString += '<span><span id="tr-greet-placeholder"' + disabledString + '></span><input type="checkbox" id="use-tr-greet" class="checkbox-custom"' + checkedString + ' /><label for="use-tr-greet" class="checkbox-custom-label"></label><span> ';
    checkedString = (salutationFields['title'][0]) ? ' checked="checked"' : '';
    disabledString = (salutationFields['title'][0]) ? '' : ' class="ui-disabled"';

    replyString += '<span><span id="tr-title-placeholder"' + disabledString + '></span><input type="checkbox" id="use-tr-title" class="checkbox-custom"' + checkedString + ' /><label for="use-tr-title" class="checkbox-custom-label"></label></span> ';
    replyString += salBreaker;
    checkedString = (salutationFields['first name'][0]) ? ' checked="checked"' : '';
    disabledString = (salutationFields['first name'][0]) ? '' : ' class="ui-disabled"';

    replyString += '<span><span class="lzm-input lzm-input-medium"><input type="text" id="tr-firstname"' + disabledString + ' placeholder="' + t('First Name') + '" value="' + capitalize(salutationFields['first name'][1]) + '" /></span>';
    replyString += '<input type="checkbox" id="use-tr-firstname" class="checkbox-custom"' + checkedString + ' /><label for="use-tr-firstname" class="checkbox-custom-label"></label></span> ';
    replyString += salBreaker;

    if(this.isFullscreenMode())
        replyString += '<span><i style="font-size:20px;vertical-align:middle;padding:0 5px 2px 0;cursor:pointer;" onclick="switchTicketNames();" class="fa fa-arrows-h"></i></span>';

    checkedString = (salutationFields['last name'][0]) ? ' checked="checked"' : '';
    disabledString = (salutationFields['last name'][0]) ? '' : ' class="ui-disabled"';
    replyString += '<span class="lzm-input lzm-input-medium"><input type="text" id="tr-lastname"' + disabledString + ' placeholder="' + t('Last Name') + '" value="' + capitalize(salutationFields['last name'][1]) + '" /></span>';

    replyString += '<input type="checkbox" id="use-tr-lastname" class="checkbox-custom"' + checkedString + ' /><label for="use-tr-lastname" class="checkbox-custom-label"></label>';
    replyString += salBreaker;
    replyString += '<input type="text" id="tr-punctuationmark" style="width: 20px; margin: 2px;" value="' + salutationFields['punctuation mark'][1][0][0] + '" />' +
        '</div></fieldset></td></tr>' +
        '<tr><td><fieldset class="lzm-fieldset"><legend>' + t('Introduction Phrase') + '</legend>' +
        '<div class="tr-salutation-fields' + disabledString2 + '">';

    checkedString = (salutationFields['introduction phrase'][0]) ? ' checked="checked"' : '';
    disabledString = (salutationFields['introduction phrase'][0]) ? '' : ' class="ui-disabled"';

    replyString += '<span id="tr-intro-placeholder"' + disabledString + '></span>' +
        '<input type="checkbox" id="use-tr-intro" class="checkbox-custom"' + checkedString + ' /><label for="use-tr-intro" class="checkbox-custom-label"></label>' +
        '</div></fieldset></td></tr><tr><td><fieldset class="lzm-fieldset"><legend>' + t('Mail Text') + '</legend><div id="message-reply-container" style="margin:0;width:100%;">' +
        '<div id="ticket-reply-input-buttons" class="bottom-space" style="padding:5px 0;">' +
        lzm_inputControls.createButton('ticket-reply-input-load', '', '', t('Load'), '<i class="fa fa-folder-open-o"></i>', 'lr', {'margin-left': '0px'},'',-1,'e') +
        lzm_inputControls.createButton('ticket-reply-input-save', 'ui-disabled', '', t('Save'), '<i class="fa fa-save"></i>', 'lr',  {'margin-left': '-1px'},'',-1,'e') +
        lzm_inputControls.createButton('ticket-reply-input-saveas', '', '', t('Save As ...'), '<i class="fa fa-plus"></i>', 'lr', {'margin-left': '-1px'},'',-1,'e') +
        lzm_inputControls.createButton('ticket-reply-input-clear', '', '', t('Clear'), '<i class="fa fa-remove"></i>', 'lr',{'margin-left': '-1px'},'',-1,'e') +
        lzm_inputControls.createButton('ticket-reply-reply-inline', '', '', t('Reply Inline'), '<i class="fa fa-terminal"></i>', 'lr',{'margin-left': '-1px'},'',-1,'e') +
        lzm_inputControls.createButton('ticket-reply-show-question', '', '', t('Show Question'), '<i class="fa fa-question"></i>', 'lr',{'margin-left': '-1px'},'',-1,'e') +
        '</div><div id="ticket-reply-inline-show-div" style="text-align: right; width:100%;">' +
        '</div>' +
        '<table class="tight"><tr><td style="padding-right:5px;"><textarea id="ticket-reply-input" class="ticket-reply-text" style="width:100%;"></textarea></td>' +
        '<td><textarea id="ticket-reply-last-question" class="ticket-reply-text" style="display:none;" readonly></textarea></td></tr></table>'+
        '<input type="hidden" id="ticket-reply-input-resource" value="" />';

    replyString += '<div id="ticket-reply-counter" class="text-gray"></div><br>';
    replyString += '</fieldset></td></tr><tr><td><fieldset class="lzm-fieldset"><legend>' + t('Closing Phrase') + '</legend>';
    replyString += '<div class="tr-salutation-fields' + disabledString2 + '">';

    checkedString = (salutationFields['closing phrase'][0]) ? ' checked="checked"' : '';
    disabledString = (salutationFields['closing phrase'][0]) ? '' : ' class="ui-disabled"';
    replyString += '<span id="tr-close-placeholder"' + disabledString + '></span>' +
        '<input type="checkbox" id="use-tr-close" class="checkbox-custom"' + checkedString + ' />' +
        '<label for="use-tr-close" class="checkbox-custom-label"></label>' +
        '</fieldset></td></tr>';
    replyString += '<tr><td><fieldset class="lzm-fieldset"><legend>' + t('Signature') + '</legend><div id="message-signature-container" class="' + disabledString2 + '" style="margin: 0px; width:100%;">' +
        '<select id="ticket-reply-signature" class="lzm-select" style="margin-bottom: 5px;">';
    var chosenPriority = -1;

    for (i=0; i<signatures.length; i++)
    {
        var defaultString = (signatures[i].d == 1) ? t('(Default)') : '';
        var nameString = signatures[i].n + ' ' + defaultString;
        var selectedString = '';
        if (signatures[i].priority > chosenPriority)
        {
            selectedString = ' selected="selected"';
            signatureText = signatures[i].text;
            chosenPriority = signatures[i].priority;
        }
        replyString += '<option value="' + signatures[i].text + '"' + selectedString + '>' + nameString + '</option>';
    }
    replyString += '</select><br />';
    disabledString = (lzm_commonPermissions.checkUserPermissions('', 'tickets', 'change_signature', {})) ? '' : ' ui-disabled"';
    replyString += '<textarea id="ticket-reply-signature-text" class="ticket-reply-text' + disabledString + '">' + signatureText + '</textarea>';
    replyString += '</div></fieldset></td></tr></table>';

    var attachmentsHtml = '<div id="message-attachment-list">' + that.createTicketAttachmentTable(ticket, {id: ''}, -1, true) + '</div>';
    var bodyString = '<div id="reply-placeholder"></div>';

    var footerString = '<span style="float:right;">' + lzm_inputControls.createButton('ticket-reply-preview', '', '', t('Preview'), '', 'lr', {'margin-left': '6px', 'margin-top': '-2px'}, '', 20, 'd') + lzm_inputControls.createButton('ticket-reply-cancel', '', 'ChatTicketClass.CancelTicketReply(\'' + ticket.id + '\',\'' + ticket.id + '_reply\');', t('Cancel'), '', 'lr',{'margin-left': '4px', 'margin-top': '-2px'}, '', 20, 'd')+
    '</span><span style="float:left;">' + lzm_inputControls.createButton('ticket-reply-pause', '', 'pauseTicketReply(\'' + ticket.id + '\',\'ticket-details\', \'' + lzm_chatDisplay.ticketDialogId[ticket.id] + '\');', tid('ticket'), '<i class="fa fa-backward"></i>', 'lr',{'margin-left': '4px', 'margin-top': '-2px'}, '', 20, 'e')+'</span>';

    var winObj = TaskBarManager.GetWindow(ticket.id);
    winObj.ShowInTaskBar = false;
    var myDialogId = lzm_commonDialog.CreateDialogWindow(this.GetTicketWindowTitle(false,ticket), bodyString, footerString, 'pencil', rDiaId, rDiaId, 'ticket-reply-cancel', true, {'ticket-id': ticket.id, menu: menuEntry}, true, winObj.TaskBarIndex);

    lzm_displayHelper.createTabControl('reply-placeholder', [{name: t('Composer'), content: replyString},{name: t('Attachments'), content: attachmentsHtml}], 0);

    $('#message-comment-text').css({'min-height': ($('#ticket-details-body').height() - 62) + 'px'});
    $('#message-attachment-list').css({'min-height': ($('#ticket-details-body').height() - 62) + 'px'});

    lzm_inputControls.createInputMenu('tr-greet-placeholder', 'tr-greet', 'lzm-combobox-small', 0, t('Salutation'), salutationFields['salutation'][1][0][0],salutationFields['salutation'][1], 'reply-placeholder-content-0', 0);
    lzm_inputControls.createInputMenu('tr-title-placeholder', 'tr-title', 'lzm-combobox-small', 0, t('Title'), salutationFields['title'][1][0][0],salutationFields['title'][1], 'reply-placeholder-content-0', -2);
    lzm_inputControls.createInputMenu('tr-intro-placeholder', 'tr-intro', '', lzm_chatDisplay.FullscreenDialogWindowWidth - 125, t('Introduction Phrase'), salutationFields['introduction phrase'][1][0][0], salutationFields['introduction phrase'][1], 'reply-placeholder-content-0', 2);
    lzm_inputControls.createInputMenu('tr-close-placeholder', 'tr-close', '', lzm_chatDisplay.FullscreenDialogWindowWidth - 125, t('Closing Phrase'), salutationFields['closing phrase'][1][0][0], salutationFields['closing phrase'][1], 'reply-placeholder-content-0', 2);

    var trFields = ['greet', 'title', 'firstname', 'lastname', 'punctuationmark', 'intro', 'close'];
    for (i=0; i<trFields.length; i++)
        $('#use-tr-' + trFields[i]).change(function() {
            var inputId = $(this).attr('id').replace(/use-/,'');
            if ($('#use-' + inputId).attr('checked') == 'checked') {
                $('#' + inputId + '-placeholder').removeClass('ui-disabled');
                $('#' + inputId).removeClass('ui-disabled');
            } else {
                $('#' + inputId + '-placeholder').addClass('ui-disabled');
                $('#' + inputId).addClass('ui-disabled');
            }
        });

    $('#enable-tr-salutation').click(function() {
        if ($('#enable-tr-salutation').prop('checked')) {
            $('.tr-salutation-fields').removeClass('ui-disabled');
        } else {
            $('.tr-salutation-fields').addClass('ui-disabled');
        }
    });
    $('#reply-placeholder-tab-2').click(function() {
        UIRenderer.resizeTicketReply();
    });

    this.ActivateAttachmentButtons(ticket, myDialogId, menuEntry);

    $('#remove-attachment').click(function() {
        var resources = $('#reply-placeholder-content-1').data('selected-resources');
        resources = (typeof resources != 'undefined') ? resources : [];
        var tmpResources = [];
        for (var i=0; i<resources.length; i++) {
            if (i != $('#attachment-table').data('selected-attachment')) {
                tmpResources.push(resources[i]);
            }
        }
        $('#reply-placeholder-content-1').data('selected-resources', tmpResources);
        that.updateAttachmentList();
        $('#attachment-table').data('selected-attachment', -1);
        $('#remove-attachment').addClass('ui-disabled');
    });
    $('#ticket-reply-input').keyup(function(){
        $('#ticket-reply-input').change();});
    $('#ticket-reply-input').change(function(){
        $('#ticket-reply-counter').html($('#ticket-reply-input').val().length);
    });
    $('#ticket-reply-input').change();
    $('#ticket-reply-input-load').click(function(){
        var winObj = TaskBarManager.GetWindow(ticket.id + '_reply');
        winObj.ShowInTaskBar = false;
        winObj.Minimize();
        lzm_chatDisplay.resourcesDisplay.createQrdTreeDialog(null, 'TICKET LOAD' + '~' + ticket.id, menuEntry, winObj);
    });
    $('#ticket-reply-input-save').click(function() {
        if ($('#ticket-reply-input-resource').val() != '') {
            var resourceText = $('#ticket-reply-input').val();
            var resourceId = $('#ticket-reply-input-resource').val();
            saveQrdFromTicket(resourceId, resourceText);
        }
    });
    $('#ticket-reply-input-saveas').click(function() {
        if ((IFManager.IsAppFrame || IFManager.IsMobileOS) && !IFManager.IsDesktopApp())
        {
            showNotMobileMessage();
        }
        else
        {
            lzm_chatDisplay.ticketResourceText[ticket.id] = $('#ticket-reply-input').val().replace(/\n/g, '<br />');

            var winObj = TaskBarManager.GetActiveWindow();
            winObj.ShowInTaskBar = false;
            winObj.Minimize();
            var textResources = DataEngine.cannedResources.getResourceList('ti', {ty: '0,1'});
            lzm_chatDisplay.resourcesDisplay.createQrdTreeDialog(textResources, 'TICKET SAVE' + '~' + ticket.id, menuEntry,winObj);
        }
    });
    $('#ticket-reply-input-clear').click(function() {
        $('#ticket-reply-input').val('');
        $('#ticket-reply-reply-inline').removeClass('ui-disabled');
        answerInline = false;
    });
    $('#ticket-reply-show-question').click(function() {
        var show = $('#ticket-reply-last-question').css('display') == 'none';
        if (show) {
            var lastMessageText = (ticket.messages[messageNo].mt);
            $('#ticket-reply-last-question').text(lastMessageText).css({display: 'block'});
            $('#ticket-reply-show-question').html(((lzm_chatDisplay.windowWidth<500) ? '<i class="fa fa-question"></i>': t('Hide Question')));
        } else {
            $('#ticket-reply-input').parent().css({display: 'block'});
            $('#ticket-reply-last-question').text('').css({display: 'none'});
            $('#ticket-reply-show-question').html(((lzm_chatDisplay.windowWidth<500) ? '<i class="fa fa-question"></i>': t('Show Question')));
        }
        lzm_commonStorage.saveValue('ticket_reply_show_question_' + DataEngine.myId, (show)?1:0);
        $('#ticket-reply-input').focus();
    });
    $('#ticket-reply-reply-inline').click(function() {
        var lastMessageText = ticket.messages[messageNo].mt.replace(/\r\n/g, '\n').replace(/\r/g, '\n')
            .replace(/\n +/g,'\n').replace(/\n+/g,'\n');
        lastMessageText = '> ' + lastMessageText.replace(/\n/g, '\n> ').replace(/\n/g, '\r\n');
        $('#ticket-reply-reply-inline').addClass('ui-disabled');
        insertAtCursor('ticket-reply-input', lastMessageText);
        $('#ticket-reply-input').change();
        answerInline = true;
    });
    $('#ticket-reply-signature').change(function() {
        $('#ticket-reply-signature-text').val($('#ticket-reply-signature').val());
    });
    $('#ticket-reply-preview').click(function() {
        var salutationValues = {
            'enable-salutation': $('#enable-tr-salutation').prop('checked'),
            'salutation': [$('#use-tr-greet').attr('checked') == 'checked', $.trim($('#tr-greet').val())],
            'title': [$('#use-tr-title').attr('checked') == 'checked', $.trim($('#tr-title').val())],
            'introduction phrase': [$('#use-tr-intro').attr('checked') == 'checked', $('#tr-intro').val()],
            'closing phrase': [$('#use-tr-close').attr('checked') == 'checked', $('#tr-close').val()],
            'first name': [$('#use-tr-firstname').attr('checked') == 'checked', $.trim($('#tr-firstname').val())],
            'last name': [$('#use-tr-lastname').attr('checked') == 'checked', $.trim($('#tr-lastname').val())],
            'punctuation mark': [true, $('#tr-punctuationmark').val()]
        };
        var replyText = $('#ticket-reply-input').val();
        var commentText = "";
        var signatureText =  $('#ticket-reply-signature-text').val();
        var thisMessageNo = (!answerInline || true) ? messageNo : -1;
        var resources = $('#reply-placeholder-content-1').data('selected-resources');
        resources = (typeof resources != 'undefined') ? resources : [];
        that.ShowMessageReplyPreview(ticket, thisMessageNo, replyText, signatureText, commentText, resources,salutationValues, selectedGroup, menuEntry, answerInline);
    });
    $('#use-tr-intro').change(function() {
        $('#tr-intro-select').css('display','none');
    });
    $('#use-tr-close').change(function() {
        $('#tr-close-select').css('display','none');
    });

    $('#reply-placeholder').on({
        dragstart: function(){
            ChatTicketClass.m_BlockReplyDrop = true;
        },
        dragenter: function() {
            if(!ChatTicketClass.m_BlockReplyDrop)
            {
                $('#reply-placeholder-tab-1').click();
                if(IFManager.IsDesktopApp() && d(IFManager.DeviceInterface.hasModule) && IFManager.DeviceInterface.hasModule('lz-screenshot-widget')){
                    ticketReplyAddAttachmentContextMenu({myDialogId: myDialogId, ticket:{id:ticket.id}, menuEntry:menuEntry});
                }else {
                    $('#add-attachment').click();
                }
            }
        },
        dragend: function(){
            ChatTicketClass.m_BlockReplyDrop = false;
        }
    });

    if(lzm_commonStorage.loadValue('ticket_reply_show_question_' + DataEngine.myId)==1)
        $('#ticket-reply-show-question').click();

    UIRenderer.resizeTicketReply();
};

ChatTicketClass.prototype.createWatchListTable = function(){
    var wlHtml = '<table id="watch-list-table" class="visible-list-table alternating-rows-table lzm-unselectable"><thead><tr><th>' + tid('operator') + '</th></tr></thead><tbody>';
    var operators = DataEngine.operators.getOperatorList('name', '', true);
    for (i=0; i<operators.length; i++)
        if (operators[i].isbot != 1)
            wlHtml += '<tr><td>' + lzm_inputControls.createCheckbox('wlcb'+operators[i].id,operators[i].name,false,'') + '</td></tr>';
    return wlHtml + '</tbody></table>';
};

ChatTicketClass.prototype.ShowMessageReplyPreview = function(ticket, messageNo, message, signature, comment, attachments, salutation, group, menuEntry) {
    menuEntry = (typeof menuEntry != 'undefined') ? menuEntry : '';

    var replacementArray,messageId = md5(Math.random().toString());
    var email = '', bcc = '', cc='',i, subjObject = {}, defLanguage = 'EN';

    var groupName = (typeof group.humanReadableDescription[ticket.l.toLowerCase()] != 'undefined') ?
        group.humanReadableDescription[ticket.l.toLowerCase()] :
        (typeof group.humanReadableDescription[DataEngine.defaultLanguage] != 'undefined') ?
            group.humanReadableDescription[DataEngine.defaultLanguage] : group.id;

    for (i=0; i<group.pm.length; i++)
    {
        subjObject[group.pm[i].lang] = (group.pm[i].str != '') ? group.pm[i].str : group.pm[i].st;
        if (group.pm[i].def == 1)
            defLanguage = group.pm[i].lang;
    }

    var previousMessageSubject = '';

    if(d(ticket.messages) && ticket.messages.length && ticket.messages[messageNo].s.length)
        previousMessageSubject = ticket.messages[messageNo].s;
    else if(d(ticket.messages) && ticket.messages.length && ticket.messages[0].s.length)
        previousMessageSubject = ticket.messages[0].s;

    previousMessageSubject = lz_global_trim(previousMessageSubject.replace('RE:',''));

    var subject = '';

    if(d(ticket.l) && d(subjObject[ticket.l]))
        subject = subjObject[ticket.l];
    else if(d(subjObject[defLanguage]))
        subject = subjObject[defLanguage];
    else
        subject = previousMessageSubject;

    var subjectHash = '[' + ticket.h + ']';

    if(subject.indexOf('%ticket_hash%') == -1 && subject.indexOf(subjectHash) == -1)
        subject = subjectHash + ' ' + subject;

    replacementArray = [
        {pl: '%ticket_hash%', rep: subjectHash}, {pl: '%website_name%', rep: DataEngine.siteName},
        {pl: '%subject%', rep: previousMessageSubject},{pl: '%ticket_id%', rep: ticket.id},
        {pl: '%operator_name%', rep: lzm_chatDisplay.myName},
        {pl: '%operator_id%', rep: lzm_chatDisplay.myLoginId}, {pl: '%operator_email%', rep: lzm_chatDisplay.myEmail},
        {pl: '%external_name%', rep: ''}, {pl: '%external_email%', rep: ''}, {pl: '%external_company%', rep: ''},
        {pl: '%external_phone%', rep: ''}, {pl: '%external_ip%', rep: ''}, {pl: '%page_title%', rep: ''}, {pl: '%url%', rep: ''},
        {pl: '%searchstring%', rep: ''}, {pl: '%localtime%', rep: ''},  {pl: '%domain%', rep: ''}, {pl: '%localdate%', rep: ''}, {pl: '%mailtext%', rep: ''},
        {pl: '%group_id%', rep: groupName}];

    subject = lzm_commonTools.replacePlaceholders('Re: ' + subject, replacementArray);
    subject = subject.replace(/[ -]+$/, '');

    var previousMessageId = (messageNo >= 0) ? ticket.messages[messageNo].id : ticket.messages[0].id;
    var trFields = ['salutation', 'title', 'first name', 'last name', 'punctuation mark', 'introduction phrase'];
    var replyText = '';
    if (salutation['enable-salutation'])
    {
        for (i=0; i<trFields.length; i++)
        {
            if(salutation[trFields[i]][0])
            {
                var lineBreak = ' ';
                if ((trFields[i] == 'punctuation mark') ||
                    trFields[i] == 'introduction phrase' ||
                    (trFields[i] == 'last name' && !salutation['punctuation mark'][0])) {
                    lineBreak = '\n\n';
                }
                else if ((trFields[i] == 'first name' && salutation['first name'][1] == '') ||
                    (trFields[i] == 'first name' && !salutation['last name'][0]) ||
                    (trFields[i] == 'first name' && salutation['last name'][1] == '') ||
                    trFields[i] == 'last name' ||
                    (trFields[i] == 'salutation' && (!salutation['title'][0] || salutation['title'][1] == '') &&
                        (!salutation['first name'][0] || salutation['first name'][1] == '') &&
                        (!salutation['last name'][0] || salutation['last name'][1] == ''))) {
                    lineBreak = '';
                }
                replyText += salutation[trFields[i]][1] + lineBreak;
            }
        }
    }

    replyText = replyText.replace(/ ,\r\n/, ',\r\n');
    replyText += message + '\r\n\r\n';

    if (salutation['enable-salutation'] && salutation['closing phrase'][0])
        replyText += salutation['closing phrase'][1];

    replacementArray = [{pl: '%operator_name%', rep: lzm_chatDisplay.myName}, {pl: '%operator_id%', rep: lzm_chatDisplay.myLoginId},{pl: '%operator_email%', rep: lzm_chatDisplay.myEmail}, {pl: '%group_id%', rep: groupName}];
    signature = lzm_commonTools.replacePlaceholders(signature, replacementArray);
    signature = signature.replace(/\r\n/g, '\n').replace(/\r/g, '\n').replace(/ +\n/, '\n').replace(/^\n+/, '');
    var completeMessage = replyText.replace(/^(\r\n)*/, '').replace(/(\r\n)*$/, '');

    if (ticket.t != 6 && ticket.t != 7)
        completeMessage += (true || signature.indexOf('--') == 0) ? '\r\n\r\n\r\n' + signature : '\r\n\r\n\r\n--\r\n\r\n' + signature;

    for (i=0; i<ticket.messages.length; i++)
    {
        if (ticket.messages[i].em != '' && (i==messageNo || (d(ticket.messages[messageNo]) && ticket.messages[messageNo].t == '1')))
        {
            var emArray = ticket.messages[i].em.split(',');
            email = emArray.splice(0,1);
            bcc = emArray.join(',').replace(/^ +/, '').replace(/ +$/, '');
        }
    }

    var disabledClass = (ticket.t == 6 || ticket.t == 7) ? ' class="ui-disabled"' : '';
    var previewHtml = '<div id="ticket-reply-cell" class="lzm-fieldset">' +
        '<table class="tight">' +
        '<tr><td><label for="ticket-reply-receiver">' + t('Receiver:') + '</label></td><td><input type="text" id="ticket-reply-receiver" value="' + email + '"' + disabledClass + ' /></td></tr>' +
        '<tr><td><label for="ticket-reply-bcc">CC:</label></td><td><input type="text" id="ticket-reply-cc" value="' + cc + '" /></td></tr>' +
        '<tr><td><label for="ticket-reply-bcc">BCC:</label></td><td><input type="text" id="ticket-reply-bcc" value="' + bcc + '" /></td></tr>';

    if (ticket.t != 6 && ticket.t != 7)
        previewHtml += '<tr><td><label for="ticket-reply-subject">' + tidc('subject') + '</label></td><td><input type="text" id="ticket-reply-subject" value="' + subject + '" /></td></tr>';
    else
        previewHtml += '<tr><td><input type="hidden" id="ticket-reply-subject" value="' + subject + '" /></td><td></td></tr>';

    previewHtml += '</table>';
    previewHtml += '<textarea id="ticket-reply-text" class="ticket-reply-text" style="width:100%;" readonly>' + lzm_commonTools.htmlEntities(completeMessage) + '</textarea>';
    previewHtml += '<div class="top-space-half">' + lzm_inputControls.createCheckbox('ticket-preview-status-close',tid('auto_close_ticket'),DataEngine.getConfigValue('gl_ctor',false)=='1','','') + '</div>';
    previewHtml += '<div class="top-space"><label>'+tidc('comment')+'</label><textarea id="new-message-comment" style="height:100%;width:100%">' + comment + '</textarea></div>';


    if (attachments.length > 0)
    {
        previewHtml += '<label class="top-space" for="ticket-reply-files">' + t('Files:') + '</label>' +
            '<div id="ticket-reply-files" class="ticket-reply-text input-like">';
        for (var m=0; m<attachments.length; m++)
        {
            var downloadUrl = getQrdDownloadUrl(attachments[m]);
            previewHtml += '<span style="margin-right: 10px;">' +
                '<a href="#" onclick="downloadFile(\'' + downloadUrl + '\');" class="lz_chat_file">' + attachments[m].ti + '</a>' +
                '</span>&#8203;'
        }
        previewHtml += '</div>';
    }
    previewHtml += '</div>';

    var watchListHtml = this.createWatchListTable();
    var footerString = lzm_inputControls.createButton('ticket-reply-send', '', '', t('Save and send message'), '<i class="fa fa-envelope-o"></i>', 'force-text',{'margin': '-5px 7px'},'',30,'d');
    footerString += lzm_inputControls.createButton('ticket-preview-cancel', '', '', tid('cancel'), '', 'lr',{'margin': '0px'},'',30,'d');

    var bodyString = '<div id="preview-placeholder"></div>';
    var winReplyObj = TaskBarManager.GetWindow(ticket.id + '_reply');
    winReplyObj.Minimize();
    winReplyObj.ShowInTaskBar = false;

    lzm_commonDialog.CreateDialogWindow(this.GetTicketWindowTitle(false,ticket), bodyString, footerString, 'search', ticket.id + '_preview', ticket.id + '_preview', 'ticket-preview-cancel', true, {'ticket-id': ticket.id, menu: menuEntry}, true, winReplyObj.TaskBarIndex);

    lzm_displayHelper.createTabControl('preview-placeholder', [{name: t('Preview'), content: previewHtml},{name: tid('watch_list'), content: watchListHtml}], 0);

    $('.preview-placeholder-content').css({height: ($('#' + ticket.id + '_preview-body').height() - 28) + 'px'});
    $('#ticket-preview-cancel').click(function() {
        TaskBarManager.RemoveWindowByDialogId(ticket.id + '_preview');
        TaskBarManager.GetWindow(ticket.id + '_reply').Maximize();
    });
    $('#ticket-reply-send').click(function() {

        var replyReceiver = $('#ticket-reply-receiver').val();
        var messageIncludingReceiver = replyReceiver + ' ' + completeMessage;
        var messageLength = messageIncludingReceiver.replace(/\r\n/g, '\n').length, errorMessage = '';
        if (ticket.t != 7 || messageLength < 140)
        {
            if (replyReceiver != '')
            {
                if (salutation['enable-salutation'])
                {
                    delete salutation['enable-salutation'];
                    lzm_commonTools.saveTicketSalutations(salutation, ticket.l.toLowerCase());
                }
                var messageSubject = $('#ticket-reply-subject').val();

                var addToWL = [];
                $('#watch-list-table input').each(function() {
                    if($(this).attr('checked')=='checked')
                        addToWL.push($(this).attr('id').substr(4,$(this).attr('id').length-4));
                });

                ChatTicketClass.SendTicketMessage(ticket, replyReceiver, $('#ticket-reply-cc').val(), $('#ticket-reply-bcc').val(), messageSubject, completeMessage, $('#new-message-comment').val(), attachments, messageId, previousMessageId, addToWL, $('#ticket-preview-status-close').attr('checked')?'1':'0');

                TaskBarManager.RemoveWindowByDialogId(ticket.id);
                TaskBarManager.RemoveWindowByDialogId(ticket.id + '_reply');
                TaskBarManager.RemoveWindowByDialogId(ticket.id + '_preview');

                delete TaskBarManager.WindowsHidden[lzm_chatDisplay.ticketDialogId[ticket.id] + '_reply'];
                delete TaskBarManager.WindowsHidden[lzm_chatDisplay.ticketDialogId[ticket.id]];

                var tmpStoredDialogIds = [];
                for (var j=0; j<lzm_chatDisplay.StoredDialogIds.length; j++)
                {
                    if (lzm_chatDisplay.ticketDialogId[ticket.id] != lzm_chatDisplay.StoredDialogIds[j] &&
                        lzm_chatDisplay.ticketDialogId[ticket.id] + '_reply' != lzm_chatDisplay.StoredDialogIds[j]) {
                        tmpStoredDialogIds.push(lzm_chatDisplay.StoredDialogIds[j])
                    }
                }
                lzm_chatDisplay.StoredDialogIds = tmpStoredDialogIds;
            }
            else
            {
                errorMessage = t('Please enter a valid email address.');
                lzm_commonDialog.createAlertDialog(errorMessage, [{id: 'ok', name: t('Ok')}]);
                $('#alert-btn-ok').click(function() {
                    lzm_commonDialog.removeAlertDialog();
                });
            }
        }
        else
        {
            errorMessage = t('A twitter message may only be 140 characters long. Your message is <!--message_length--> characters long.',[['<!--message_length-->', messageLength]]);
            lzm_commonDialog.createAlertDialog(errorMessage, [{id: 'ok', name: t('Ok')}]);
            $('#alert-btn-ok').click(function() {
                lzm_commonDialog.removeAlertDialog();
                $('#ticket-reply-cancel').click();
            });
        }
    });
    UIRenderer.resizeTicketReply();
};

ChatTicketClass.prototype.showMessageForward = function(message, ticketId, ticketSender, group) {

    var menuEntry = t('Ticket (<!--ticket_id-->, <!--name-->)',[['<!--ticket_id-->', ticketId],['<!--name-->', ticketSender]]);
    var headerString = tid('forward') + ' (' + ticketId + ')';
    var footerString = lzm_inputControls.createButton('send-forward-message', '','', t('Ok'), '', 'lr',{'margin-left': '6px'},'',30,'d') +
        lzm_inputControls.createButton('cancel-forward-message', '','', t('Cancel'), '', 'lr',{'margin-left': '6px'},'',30,'d');
    var bodyString = '<div id="message-forward-placeholder"></div>';
    var messageTime = lzm_chatTimeStamp.getLocalTimeObject(message.ct * 1000, true);
    var timeHuman = lzm_commonTools.getHumanDate(messageTime, 'all', lzm_chatDisplay.userLanguage);
    var myGroup = DataEngine.groups.getGroup(group), sender = '', receiver = '';

    if ($.inArray(parseInt(message.t), [0, 3, 4]) != -1)
    {
        sender = lzm_commonTools.htmlEntities(message.em);
        receiver = (myGroup != null) ? myGroup.email : group;
    }
    else if (message.t == 1)
    {
        sender = (myGroup != null) ? myGroup.email : group;
        receiver = lzm_commonTools.htmlEntities(message.em);
    }

    var emailText = t('-------- Original Message --------') +
        '\n' + t('Subject: <!--subject-->', [['<!--subject-->', lzm_commonTools.htmlEntities(message.s)]]) +
        '\n' + t('Date: <!--date-->', [['<!--date-->', timeHuman]]);

    if ($.inArray(parseInt(message.t), [0, 1, 3, 4]) != -1)
    {
        emailText += '\n' + t('From: <!--sender_email-->', [['<!--sender_email-->', sender]]) +
            '\n' + t('To: <!--receiver-->', [['<!--receiver-->', receiver]]);
    }

    emailText += '\n\n\n' + lzm_commonTools.htmlEntities(message.mt);


    var emailHtml = '<div id="message-forward" class="lzm-fieldset"><div class="top-space"><label for="tr-forward-email-addresses">' + tidc('email_addresses') + '</label><div id="tr-forward-email-addresses"></div>' +
        '<div class="top-space"><label for="forward-subject">' + tidc('subject') + '</label>' +
        '<input type="text" id="forward-subject" value="' + lzm_commonTools.htmlEntities(message.s) + '"/></div>' +
        '<div class="top-space"><label for="forward-text">' + t('Email Body:') + '</label>' +
        '<textarea id="forward-text">' + emailText + '</textarea></div>';

    if (message.attachment.length > 0)
    {
        emailHtml += '<br /><label for="ticket-reply-files">' + t('Files:') + '</label>' +
            '<div id="forward-files" class="ticket-reply-text input-like">';
        for (var m=0; m<message.attachment.length; m++) {
            var attachment = {ti: message.attachment[m].n, rid: message.attachment[m].id};
            var downloadUrl = getQrdDownloadUrl(attachment);
            emailHtml += '<span style="margin-right: 10px;">' +
                '<a href="#" onclick="downloadFile(\'' + downloadUrl + '\');" class="lz_chat_file">' + attachment.ti + '</a>' +
                '</span>&#8203;'
        }
        emailHtml += '</div>';
    }
    emailHtml += '</div>';

    var dialogData = {'ticket-id': ticketId, menu: menuEntry};
    var ticketDialogId = lzm_chatDisplay.ticketDialogId[ticketId];

    var winObj = TaskBarManager.GetWindow(ticketDialogId);

    if(winObj==null)
        return;

    winObj.ShowInTaskBar = false;
    winObj.Minimize();

    lzm_commonDialog.CreateDialogWindow(headerString, bodyString, footerString, 'share', ticketId + '_forward',ticketId + '_forward','cancel-forward-message',true,dialogData,true,winObj.TaskBarIndex);
    lzm_displayHelper.createTabControl('message-forward-placeholder', [{name: t('Email'), content: emailHtml}]);
    lzm_inputControls.createInputMenu('tr-forward-email-addresses', 'forward-email-addresses', '', lzm_chatDisplay.FullscreenDialogWindowWidth-78, '', lzm_commonTools.htmlEntities(message.em), LocalConfiguration.EmailList, 'message-forward', 2);

    UIRenderer.resizeMessageForwardDialog();

    $('#cancel-forward-message').click(function() {
        TaskBarManager.RemoveWindowByDialogId(ticketId + '_forward');
        winObj.ShowInTaskBar = true;
        winObj.Maximize();
    });
    $('#send-forward-message').click(function() {
        ChatTicketClass.SendForwardedMessage(message, $('#forward-text').val(), $('#forward-email-addresses').val(), $('#forward-subject').val(), ticketId, group);
        $('#cancel-forward-message').click();
    });
};

ChatTicketClass.prototype.AddMessageComment = function(ticketId, message) {

    var that = this;
    var commentControl = '<div class="top-space" style="height:100px">';
    commentControl += lzm_inputControls.createArea('new-comment-field', '', '', tid('comment') + ':','width:300px;height:75px;');
    commentControl += '</div><div class="top-space" style="display:none;height:100px">';
    commentControl += lzm_inputControls.createInput('new-comment-file','',tid('file'),tidc('file'),'','file','');

    commentControl += '</div><div class="top-space">';
    commentControl += lzm_inputControls.createButton('add-comment-text', '', 'ChatTicketClass.SwitchCommentType(\'TEXT\');', tid('text'), '', '', {'padding':'4px 10px'}, '', 20, 'e');
    commentControl += lzm_inputControls.createButton('add-comment-file', '', 'ChatTicketClass.SwitchCommentType(\'FILE\');', tid('file'), '', '', {'margin': '0 4px 0 -1px', 'padding':'4px 10px'}, '', 20, 'e');
    commentControl += '</div>';

    lzm_commonDialog.createAlertDialog(commentControl, [{id: 'ok', name: tid('ok')},{id: 'cancel', name: tid('cancel')}],false,true,false);
    $('#new-comment-field').select();
    $('#alert-btn-ok').click(function() {

        $('#alert-btn-ok').addClass('ui-disabled');
        if($('#add-comment-file').hasClass('lzm-button-e-pushed'))
        {
            var file = $('#new-comment-file')[0].files[0];
            CommunicationEngine.uploadFile(file, 'user_file', 102, 0, null, null, null, {uploadFileId:lzm_commonTools.guid(),uploadFileName:lz_global_base64_encode(file.name)});
        }
        else
        {
            var commentText = $('#new-comment-field').val();
            if (typeof ticketId != 'undefined' && typeof message.id != 'undefined')
            {
                UserActions.saveTicketComment(ticketId, message.id, commentText);
            }
            else
            {
                var comments = $('#ticket-message-placeholder-content-2').data('comments');
                comments = (typeof comments != 'undefined') ? comments : [];
                comments.push({text: commentText, timestamp: lzm_chatTimeStamp.getServerTimeString(null, false, 1)});
                $('#ticket-message-placeholder-content-2').data('comments', comments);
                that.updateCommentList();
            }
            lzm_commonDialog.removeAlertDialog();
        }
    });
    $('#alert-btn-cancel').click(function() {
        lzm_commonDialog.removeAlertDialog();
    });
    ChatTicketClass.SwitchCommentType('TEXT');
};

ChatTicketClass.prototype.CreateTicketHistoryTable = function(ticket, email, messageNumber, isNew, chat) {
    var that = this;
    var messageTableHtml = '<table id="ticket-history-table" class="visible-list-table alternating-rows-table lzm-unselectable" data-selected-message="' + messageNumber + '">';
    if (!isNew)
        messageTableHtml += that.CreateTicketMessageList(ticket);
    else if (chat.cid != '')
        messageTableHtml += that.CreateTicketMessageList({id: ''});

    messageTableHtml += '</table>';
    return messageTableHtml;
};

ChatTicketClass.prototype.getDirectionImage = function(directionOnly,message,style){
    var directionImage = '';
    if(!directionOnly)
    {
        if (message.t == 1)
            directionImage = '<i '+style+' class="fa fa-arrow-circle-left icon-green"></i>';
        else if (message.t == 2)
            directionImage = '';
        else if (message.t == 3)
            directionImage = '<i '+style+' class="fa fa-arrow-circle-right icon-blue"></i>';
        else
            directionImage = '<i '+style+' class="fa fa-home icon-blue"></i>';
    }
    else
    {
        if (message.t == 1)
            directionImage = '<i '+style+' class="fa fa-arrow-circle-left icon-light"></i>';
        else
            directionImage = '<i '+style+' class="fa fa-arrow-circle-right icon-orange"></i>';
    }

    return directionImage;
};

ChatTicketClass.prototype.CreateTicketMessageList = function (ticket) {

    var that = this, operator, key;
    var fullScreenMode = this.isFullscreenMode();
    var messageListHtml = '<thead><tr id="ticket-history-header-line">';

    if(fullScreenMode)
    {
        messageListHtml += '<th colspan="5">'+lzm_inputControls.createCheckbox('ticket-history-show-messages',tid('messages'),true,'','display:inline;');
        messageListHtml += lzm_inputControls.createCheckbox('ticket-history-show-comments',tid('comments'),true,'','display:inline;padding-left:5px;');
        messageListHtml += lzm_inputControls.createCheckbox('ticket-history-show-logs','Logs',false,'','display:inline;padding-left:5px;')+'</th>';
    }
    messageListHtml += '</tr></thead><tbody>';

    if(d(ticket.messages) && ticket.messages.length)
    {
        ticket.messages.sort(that.ticketMessageSortfunction);
        var logsProcessed = ticket.logs.length-1;
        for (var i=ticket.messages.length - 1; i>=0; i--) {

            var linecol = (i%2!=0) ? '#fff' : '#f6f6f6';
            operator = DataEngine.operators.getOperator(ticket.messages[i].sid);
            var messageTimeObject = lzm_chatTimeStamp.getLocalTimeObject(ticket.messages[i].ct * 1000, true);
            var messageTimeHuman = lzm_commonTools.getHumanDate(messageTimeObject, '', lzm_chatDisplay.userLanguage);
            var customerName = '';

            if (ticket.messages[i].fn != '')
                customerName += lzm_commonTools.htmlEntities(ticket.messages[i].fn);
            else if (ticket.messages[i].em != '')
                customerName += lzm_commonTools.htmlEntities(ticket.messages[i].em);

            var sender = (ticket.messages[i].t == 1 && operator != null) ? operator.name : customerName;
            sender = lzm_commonTools.SubStr(sender,24,true);

            var messageTypeImage = '<i class="fa fa-envelope"></i>';
            var directionStyle = 'style="margin:0 2px;font-size:16px;"';
            var directionImage = this.getDirectionImage(false,ticket.messages[i],directionStyle);

            if (ticket.messages[i].t == 1)
            {
                if (ticket.t == 6)
                    messageTypeImage = '<i '+directionStyle+' class="fa fa-facebook icon-blue"></i>';
                else if (ticket.t == 7)
                    messageTypeImage = '<i '+directionStyle+' class="fa fa-twitter icon-blue"></i>';
                else
                    messageTypeImage = '<i '+directionStyle+' class="fa fa-envelope"></i>';
            }
            else if (ticket.messages[i].t == 2)
            {
                messageTypeImage = '<i '+directionStyle+' class="fa fa-comment icon-light"></i>';
            }
            else if (ticket.messages[i].t == 3)
            {
                if (ticket.t == 6)
                    messageTypeImage = '<i '+directionStyle+' class="fa fa-facebook icon-blue"></i>';
                else if (ticket.t == 7)
                    messageTypeImage = '<i '+directionStyle+' class="fa fa-twitter icon-blue"></i>';
                else
                    messageTypeImage = '<i '+directionStyle+' class="fa fa-envelope"></i>';
            }
            else if (ticket.messages[i].t == 4)
                messageTypeImage = '<i '+directionStyle+' class="fa fa-envelope"></i>';

            var onclickAction = '', oncontextMenu = '', ondblclickAction = '';

            if((!IFManager.IsAppFrame && !IFManager.IsMobileOS) || IFManager.IsDesktopApp())
            {
                oncontextMenu = ' oncontextmenu="openTicketMessageContextMenu(event, \'' + ticket.id + '\', \'' + i + '\', false);"';
                ondblclickAction = '';
            }

            var attachmentImage = (ticket.messages[i].attachment.length > 0) ? '<i class="fa fa-paperclip"></i>' : '';
            var nextTicket = ((i-1) > 0) ? ticket.messages[i-1] : null;

            if(!fullScreenMode)
            {
                onclickAction = ' onclick="selectTicketMessage(\'' + ticket.id + '\', \'' + i + '\');setTimeout(function(){ChatTicketClass.HandleTicketMessageClick(\'' + ticket.id + '\', \'' + i + '\');},100);"';
                messageListHtml += '<tr class="message-line lzm-unselectable" id="message-line-' + ticket.id + '_' + i + '" style="cursor: pointer;"' + onclickAction + oncontextMenu + ondblclickAction + '>';

                messageListHtml += '<td class="icon-column" style="width:30px">' + directionImage + '<br>';
                messageListHtml += '' + messageTypeImage + '</td>';

                var svContent = '<div>' + lzm_commonTools.htmlEntities(ticket.messages[i].fn) + '</div>';
                svContent += '<div>' + lzm_commonTools.htmlEntities(ticket.messages[i].s) + '</div>';
                svContent += '<div class="lzm-info-text">' + lzm_commonTools.htmlEntities(lzm_commonTools.SubStr(ticket.messages[i].mt,200,true)) + '</div>';
                svContent = svContent.replace(/\n/g, " ").replace(/\r/g, " ").replace(/<br>/g, " ");
                messageListHtml += '<td class="ticket-simple-cell">' + svContent + '</td></tr>';
            }
            else
            {
                onclickAction = ' onclick="ChatTicketClass.HandleTicketMessageClick(\'' + ticket.id + '\', \'' + i + '\');"';
                for(key=logsProcessed;key >=0;key--)
                {
                    var log = ticket.logs[key];
                    if(log.ti > ticket.messages[i].ct || nextTicket == null){
                        messageListHtml += this.createTicketMessageAddLine('log',key,i,ticket,log,'#f6f6f6');
                        logsProcessed = key-1;
                    }
                }

                var avfield = (ticket.messages[i].t != 1 || ticket.messages[i].sid=='') ? lzm_inputControls.createAvatarField('avatar-box-medium',ticket.messages[i].fn,'') : lzm_inputControls.createAvatarField('avatar-box-medium','',ticket.messages[i].sid);
                messageListHtml += '<tr class="message-line message-line-fs lzm-unselectable" id="message-line-' + ticket.id + '_' + i + '"' +
                    onclickAction + oncontextMenu + ondblclickAction + '>' +
                    '<td style="background:'+linecol+';">' + avfield +
                    '</td><td colspan="3" style="background:'+linecol+';">' +
                    '<div>' + messageTimeHuman + '</div><b>' + sender + '</b>' +
                    '</td><td style="background:'+linecol+';text-align:right;">' + directionImage +''+ messageTypeImage +''+ attachmentImage +'&nbsp;</td></tr>';

                if(ticket.messages[i].comment.length>0)
                {
                    for(key in ticket.messages[i].comment)
                        messageListHtml += this.createTicketMessageAddLine('comment',key,i,ticket,ticket.messages[i].comment[key],linecol,onclickAction,oncontextMenu);
                    messageListHtml += this.createTicketMessageAddLine('spacer',key,i,ticket,ticket.messages[i].comment[key],linecol);
                }
            }
            messageListHtml += '';
        }
    }
    messageListHtml += '</tbody>';
    return messageListHtml;
};

ChatTicketClass.prototype.createTicketMessageAddLine = function(type,key,mkey,ticket,object,linecol,onclickAction,oncontextAction) {
    var lineHtml = '';
    if(type=="comment")
    {
        var messageTimeObject = lzm_chatTimeStamp.getLocalTimeObject(object.t * 1000, true);
        var messageTimeHuman = lzm_commonTools.getHumanDate(messageTimeObject, '', lzm_chatDisplay.userLanguage);

        var coperator = DataEngine.operators.getOperator(object.o);
        var ctext = lzm_commonTools.htmlEntities(object.text);

        lineHtml += '<tr class="message-line message-comment-line comment-line-' + ticket.id + '_' + mkey + ' lzm-unselectable" id="message-line-comment-' + ticket.id + '_' + key + '" '+onclickAction+oncontextAction+'>' +
            '<td style="background:'+linecol+';"></td>'+
            '<td style="background:'+linecol+';padding:2px !important;" colspan="4">' +
            '<table class="comment-box" style="background:#fff !important;border: 1px solid '+coperator.c+'"><tr><td style="background:#fff !important;color:#666 !important;">' + lzm_inputControls.createAvatarField('avatar-box-small','',coperator.id) + '</td>'+
            '<td style="background:#fff !important;color:#666 !important;"><div class="text-s" style="color:#777 !important;padding-bottom:3px;">'+messageTimeHuman+'</div><span style="background:#fff !important;color:#666 !important;">' + lzm_commonTools.htmlEntities(coperator.name) + ': </span>' + ChatTicketClass.GetCommentText(object) + '</td></tr></table>' +
            '</td></tr>';
    }
    else if(type=="log")
    {
        var messageTimeObject = lzm_chatTimeStamp.getLocalTimeObject(object.ti * 1000, true);
        var messageTimeHuman = lzm_commonTools.getHumanDate(messageTimeObject, '', lzm_chatDisplay.userLanguage);
        var loperator = DataEngine.operators.getOperator(object.o);
        var oname = (loperator != null) ? loperator.name : '';
        var toIcon = (object.v != '' && object.vn != '') ? '&nbsp;&nbsp;<i class="fa fa-caret-right icon-small"></i>&nbsp;&nbsp;': '';
        lineHtml += '<tr class="message-line message-log-line lzm-unselectable" id="message-line-log-' + ticket.id + '_' + key + '">' +
            '<td style="background:'+linecol+';border-top:1px solid #fff;border-bottom:1px solid #fff;" colspan="5">' +
            '<div style="padding:5px 10px;margin:0;">'+
            '<span class="text-gray" style="white-space:normal;">' + messageTimeHuman + ' (' + lzm_commonTools.htmlEntities(oname)  + ')<br>' + lzm_commonTools.htmlEntities(object.a) + ' (' + lzm_commonTools.htmlEntities(object.v) + ''+toIcon+'' +lzm_commonTools.htmlEntities(object.vn)+')</span>' +
            '</div></td></tr>';
    }
    else if(type=="spacer")
        lineHtml += '<tr class="message-line message-comment-line comment-line-' + ticket.id + '_' + mkey + '"><td colspan="5" style="background:'+linecol+'"></td></tr>';
    return lineHtml;
};

ChatTicketClass.prototype.showTicketLinker = function(firstObject, secondObject, firstType, secondType, inChatDialog, elementId) {
    var that = this;
    var headerString = t('Link with...');
    var footerString =
        lzm_inputControls.createButton('link-ticket-link', 'ui-disabled', '', t('Link'), '', 'lr',{'margin-left': '6px', 'margin-top': '-4px'},'',30,'d') +
        lzm_inputControls.createButton('link-ticket-cancel', '', '', t('Cancel'), '', 'lr',{'margin-left': '6px', 'margin-top': '-4px'},'',30,'d');

    var linkWithLabel = (secondType == 'ticket') ? tidc('ticket_id') : tidc('chat_id');
    var firstObjectId = (firstType == 'ticket' && firstObject != null) ? firstObject.id : '';
    var secondObjectId = (secondType == 'ticket' && secondObject != null) ? secondObject.id : (secondType == 'chat' && secondObject != null) ? secondObject.cid : '';
    var firstDivVisible = (firstObject != null) ? 'visible' : 'hidden';
    var secondDivVisible = (secondObject != null) ? 'visible' : 'hidden';
    var firstInputDisabled = (firstObject != null) ? ' ui-disabled' : '';
    var secondInputDisabled = (secondObject != null) ? ' ui-disabled' : '';
    var fsSearchData = (firstType == 'ticket' && firstObject != null) ? (secondType == 'ticket') ? ' data-search="second~ticket"' : ' data-search="second~chat"' :' data-search="first~ticket"';
    var inputChangeId = (firstObject == null) ? 'first-link-object-id' : (secondObject == null) ? 'second-link-object-id' : '';
    var bodyString = '<div' + fsSearchData + ' data-input="' + inputChangeId + '" class="lzm-fieldset" id="ticket-linker-first" style="height:auto;">' +
        '<label for="first-link-object-id">' + tidc('ticket_id') + '</label>' +
        '<input type="text" class="lzm-text-input' + firstInputDisabled + '" id="first-link-object-id" value="' + firstObjectId + '" />' +
        '<div id="first-link-div" style="visibility: ' + firstDivVisible + '">';

    if (firstType == 'ticket' && firstObject != null)
        bodyString += that.fillLinkData('first', firstObjectId, true);

    bodyString += '</div></div><div class="lzm-fieldset" id="ticket-linker-second" style="margin-top: 10px;height:auto;">' +
    '<label for="second-link-object-id">' + linkWithLabel + '</label>' +
    '<input type="text" class="lzm-text-input' + secondInputDisabled + '" id="second-link-object-id" value="' + secondObjectId + '" />' +
    '<div id="second-link-div" style="visibility: ' + secondDivVisible + '">';

    if (secondType == 'chat' && secondType != null)
        bodyString += lzm_chatDisplay.archiveDisplay.fillLinkData(secondObjectId, true);

    bodyString += '</div></div>';

    var dialogId, menuEntry, dialogData, chatsDialogId, chatsWindowId, chatsDialogData;
    if (firstType == 'ticket' && firstObject != null)
    {
        // link ticket (given) with chat or ticket

        dialogId = (typeof lzm_chatDisplay.ticketDialogId[firstObject.id] != 'undefined') ? lzm_chatDisplay.ticketDialogId[firstObject.id] : md5(Math.random().toString());
        var ticketSender = (firstObject.messages[0].fn.length > 20) ? lzm_commonTools.escapeHtml(firstObject.messages[0].fn).substr(0, 17) + '...' : lzm_commonTools.escapeHtml(firstObject.messages[0].fn);
        menuEntry = t('Ticket (<!--ticket_id-->, <!--name-->)',[['<!--ticket_id-->', firstObject.id],['<!--name-->', ticketSender]]);
        dialogData = {'ticket-id': firstObject.id, menu: menuEntry};

        var winObj = TaskBarManager.GetActiveWindow();
        winObj.ShowInTaskBar = false;
        winObj.Minimize();

        lzm_commonDialog.CreateDialogWindow(headerString, bodyString, footerString, 'link', dialogId + '_linker', dialogId + '_linker', 'link-ticket-cancel', false, dialogData, true, winObj.TaskBarIndex);
    }
    else if (secondType == 'chat' && secondObject != null && !inChatDialog)
    {
        // chat with ticket
        lzm_commonDialog.CreateDialogWindow(headerString, bodyString, footerString, 'link', 'link-chat-ticket', 'link-chat-ticket', 'link-ticket-cancel', false, {cid: secondObject.cid, menu: t('Link with Ticket')});
    }
    else if (secondType == 'chat' && secondObject != null)
    {

    }
    UIRenderer.resizeTicketLinker();

    var ticketPollData = null, chatPollData = null, lastTyping = 0, lastSeachId = '', customFilter;
    var handleSearch = function(isSame) {
        if ($('#' + inputChangeId).val() != '' && firstObject == null) {
            if ($('#' + inputChangeId).val().length >= 5 && !isSame) {
                CommunicationEngine.stopPolling();

                customFilter = {};
                customFilter.ticketSort = '';
                customFilter.ticketPage = 1;
                customFilter.ticketQuery = $('#' + inputChangeId).val();
                customFilter.ticketFilterStatus = '0123';
                customFilter.ticketFilterChannel = '01234567';
                customFilter.ticketLimit = 6;
                customFilter.customDemandToken = 'linker';
                CommunicationEngine.customFilters.push(customFilter);
                CommunicationEngine.startPolling();
            }
            $('#link-ticket-link').removeClass('ui-disabled');
            that.fillLinkData('first', $('#' + inputChangeId).val());
        } else if ($('#' + inputChangeId).val() != '') {
            $('#link-ticket-link').removeClass('ui-disabled');
            if (secondType == 'ticket') {
                if ($('#' + inputChangeId).val().length >= 5 && !isSame) {
                    CommunicationEngine.stopPolling();

                    customFilter = {};
                    customFilter.ticketSort = '';
                    customFilter.ticketPage = 1;
                    customFilter.ticketQuery = $('#' + inputChangeId).val();
                    customFilter.ticketFilterStatus = '0123';
                    customFilter.ticketFilterChannel = '01234567';
                    customFilter.ticketLimit = 7;
                    customFilter.customDemandToken = 'linker';
                    CommunicationEngine.customFilters.push(customFilter);
                    CommunicationEngine.startPolling();
                }
                that.fillLinkData('second', $('#' + inputChangeId).val());
            } else {
                if (chatPollData == null) {
                    chatPollData = {p: CommunicationEngine.chatArchivePage, q: CommunicationEngine.chatArchiveQuery, f: CommunicationEngine.chatArchiveFilter,
                        l: CommunicationEngine.chatArchiveLimit, g: CommunicationEngine.chatArchiveFilterGroup, e: CommunicationEngine.chatArchiveFilterExternal,
                        i: CommunicationEngine.chatArchiveFilterInternal};
                    $('#ticket-linker-first').data('chat-poll-data', chatPollData);
                }
                if ($('#' + inputChangeId).val().length >= 5 && !isSame) {
                    CommunicationEngine.stopPolling();

                    customFilter = {};
                    customFilter.chatArchivePage = 1;
                    customFilter.chatArchiveQuery = $('#' + inputChangeId).val();
                    customFilter.chatArchiveFilter = '012';
                    customFilter.chatArchiveLimit = 10;
                    customFilter.chatArchiveFilterGroup = '';
                    customFilter.chatArchiveFilterExternal = '';
                    customFilter.chatArchiveFilterInternal = '';
                    customFilter.customDemandToken = 'linker';
                    CommunicationEngine.customFilters.push(customFilter);
                    CommunicationEngine.startPolling();
                }
                lzm_chatDisplay.archiveDisplay.fillLinkData($('#' + inputChangeId).val());
            }
        } else {
            $('#link-ticket-link').addClass('ui-disabled');
            var position = (firstObject == null) ? 'first' : 'second';
            $('#' + position + '-link-div').css({'visibility': 'hidden'});
            ticketPollData = null;
            chatPollData = null;
        }
    };
    if (inputChangeId != '') {
        $('#' + inputChangeId).keyup(function() {
            lastTyping = lzm_chatTimeStamp.getServerTimeString(null, false, 1);
            setTimeout(function() {
                var now = lzm_chatTimeStamp.getServerTimeString(null, false, 1);
                if (lastTyping != 0 && now - lastTyping > 570) {
                    handleSearch(lastSeachId == $('#' + inputChangeId).val());
                    lastSeachId = $('#' + inputChangeId).val();
                }
            }, 600);
        });
    }

    $('#link-ticket-link').click(function()
    {
        linkTicket(firstType + '~' + secondType, $('#first-link-object-id').val(), $('#second-link-object-id').val());
        $('#link-ticket-cancel').click();
    });
    $('#link-ticket-cancel').click(function()
    {
        if (firstType == 'ticket' && firstObject != null)
        {
            TaskBarManager.RemoveWindowByDialogId(dialogId + '_linker');
            var winObj = TaskBarManager.GetWindow(dialogId);
            winObj.Maximize();
        }
        else if (secondType == 'chat' && secondObject != null && inChatDialog)
        {

        }
        else
        {
            TaskBarManager.RemoveWindowByDialogId('link-chat-ticket');
        }
    });
};

ChatTicketClass.prototype.fillLinkData = function(position, ticketId, onlyReturnHtml, doNotClear) {
    onlyReturnHtml = (typeof onlyReturnHtml != 'undefined') ? onlyReturnHtml : false;
    doNotClear = (typeof doNotClear != 'undefined') ? doNotClear : false;
    doNotClear = doNotClear && $('#first-link-div').css('visibility') == 'visible';
    var myTicket = null, tableString = '';
    for (var i=0; i<lzm_chatDisplay.ticketListTickets.length; i++) {
        if (lzm_chatDisplay.ticketListTickets[i].id == ticketId) {
            myTicket = lzm_commonTools.clone(lzm_chatDisplay.ticketListTickets[i]);
        }
    }

    if (myTicket != null) {
        var ticketCreationDate = lzm_chatTimeStamp.getLocalTimeObject(myTicket.messages[0].ct * 1000, true);
        var ticketCreationDateHuman = lzm_commonTools.getHumanDate(ticketCreationDate, 'full', lzm_chatDisplay.userLanguage);
        tableString = '<table>' +

            '<tr><th rowspan="6"><i class="fa fa-envelope icon-green icon-xl"></i></th><th>' + t('Name:') + '</th><td>' + lzm_commonTools.escapeHtml(myTicket.messages[0].fn) + '</td></tr>' +
            '<tr><th>' + t('Email:') + '</th><td>' + lzm_commonTools.escapeHtml(myTicket.messages[0].em) + '</td></tr>' +
            '<tr><th>' + t('Company:') + '</th><td>' + lzm_commonTools.escapeHtml(myTicket.messages[0].co) + '</td></tr>' +
            '<tr><th>' + t('Phone:') + '</th><td>' + lzm_commonTools.escapeHtml(myTicket.messages[0].p) + '</td></tr>' +
            '<tr><th>' + tidc('date') + '</th><td>' + ticketCreationDateHuman + '</td></tr>' +
            '<tr><th>' + tidc('visitor_id') + '</th><td>' + myTicket.messages[0].ui + '</td></tr>' +
            '</table>';
        if (!onlyReturnHtml)
            $('#' + position + '-link-div').css({'visibility': 'visible'});
    } else {
        if (!onlyReturnHtml && !doNotClear)
            $('#' + position + '-link-div').css({'visibility': 'hidden'});
    }

    if (!onlyReturnHtml && !(doNotClear && tableString==''))
        $('#' + position + '-link-div').html(tableString);

    return tableString;
};

ChatTicketClass.prototype.showEmailList = function() {

    if(TaskBarManager.WindowExists('email-list') && !TaskBarManager.GetWindow('email-list').ShowInTaskBar)
        return;

    lzm_chatDisplay.emailDeletedArray = [];
    lzm_chatDisplay.ticketsFromEmails = [];
    lzm_commonTools.clearEmailReadStatusArray();

    var headerString = t('Emails');
    var footerString = lzm_inputControls.createButton('save-email-list', '','', t('Ok'), '', 'lr',    {'margin-left': '6px'}, '' ,30, 'd') +
        lzm_inputControls.createButton('cancel-email-list', '','', t('Cancel'), '', 'lr', {'margin-left': '6px'}, '' ,30, 'd') +
        '<span style="float:left;">' +
        lzm_inputControls.createButton('delete-email', '','', t('Delete (Del)'), '<i class="fa fa-remove"></i>', 'lr', {'margin-left': '6px', 'margin-top': '-4px'} , '' ,30, 'e') +
        lzm_inputControls.createButton('create-ticket-from-email', '','', t('Create Ticket'), '<i class="fa fa-plus"></i>', 'lr', {'margin-left': '-1px', 'margin-top': '-4px'}, '' ,30, 'e') +
        lzm_inputControls.createButton('reset-emails', 'ui-disabled','', tid('reset'), '<i class="fa fa-undo"></i>', 'lr', {'margin-left': '-1px', 'margin-top': '-4px'}, '' ,30, 'e')+
        '</span>';

    var bodyString = '<div id="open-emails"><div id="email-list-frame"><div id="email-list-loading"><div class="lz_anim_loading"></div></div></div></div>';
    bodyString += '<div id="email-details"><div id="email-placeholder" data-selected-email="0"></div></div>';

    var dialogId = lzm_commonDialog.CreateDialogWindow(headerString, bodyString, footerString, 'envelope', 'email-list', 'email-list','cancel-email-list');
    var emailContentHtml = '<div id="email-content"></div>';
    var emailHtmlHtml = '<div id="email-html"></div>';
    var emailAttachmentHtml = '<div id="email-attachment-list"></div>';

    lzm_displayHelper.createTabControl('email-placeholder', [{name: t('Text'), content: emailContentHtml},{name: t('Html'), content: emailHtmlHtml}, {name: t('Attachments'), content: emailAttachmentHtml}]);

    var myHeight = $('#email-list-body').height() + 10;
    var listHeight = Math.floor(Math.max(myHeight / 2, 175) - 45);
    var contentHeight = (myHeight - listHeight) - 83;

    $('#email-list-frame').css({height: listHeight + 'px'});

    $('.email-placeholder-content').css({height: contentHeight + 'px'});
    $('#email-list-loading').css({'z-index': 1000000, background: '#fff',left:0, right:0, top:0, bottom:'1px', position: 'absolute' });

    var emailDetailsHeight = $('.email-placeholder-content').height();
    $('#email-attachment-list').css({'min-height': (emailDetailsHeight - 22) + 'px'});
    $('.email-placeholder-tab').click(function(){
        UIRenderer.resizeEmailDetails();
    });
    $('#cancel-email-list').click(function(){
        lzm_chatDisplay.emailDeletedArray = [];
        lzm_chatDisplay.ticketsFromEmails = [];
        toggleEmailList();
        TaskBarManager.RemoveActiveWindow();
    });
    $('#save-email-list').click(function(){
        saveEmailListChanges('', false);
        $('#cancel-email-list').click();
    });
    $('#delete-email').click(function(){
        if (lzm_commonPermissions.checkUserPermissions('', 'tickets', 'delete_emails', {})) {
            deleteEmail();
        } else {
            showNoPermissionMessage();
        }
    });
    $('#create-ticket-from-email').click(function() {
        if (lzm_commonPermissions.checkUserPermissions('', 'tickets', 'create_tickets', {}))
        {
            var emailId = $('#email-placeholder').data('selected-email-id');
            var emailNo = $('#email-placeholder').data('selected-email');
            $('#reset-emails').removeClass('ui-disabled');
            $('#delete-email').addClass('ui-disabled');
            $('#create-ticket-from-email').addClass('ui-disabled');
            $('#email-list-line-' + emailNo).children('td:first').html('<i class="fa fa-plus" style="color: #00bb00;"></i>');
            saveEmailListChanges(emailId, true);
            ChatTicketClass.__ShowTicket('', false, emailId, '', dialogId);
            $('#email-list-body').data('selected-email', emailNo);
            $('#email-list-body').data('selected-email-id', emailId);
        }
        else
            showNoPermissionMessage();
    });
    $('#reset-emails').click(function(){
        $('.selected-table-line').each(function(i, obj) {
            if($(obj).hasClass('email-list-line')){
                var emailId = $(obj).attr('data-id'); //$('#email-placeholder').data('selected-email-id');
                var emailNo = $(obj).attr('data-line-number'); //$('#email-placeholder').data('selected-email');
                lzm_commonTools.removeEmailFromDeleted(emailId);
                lzm_commonTools.removeEmailFromTicketCreation(emailId);
                $('#email-list-line-' + emailNo).children('td:first').html('<i class="fa fa-envelope-o"></i>');
                $('#reset-emails').addClass('ui-disabled');
                $('#delete-email').removeClass('ui-disabled');
                $('#create-ticket-from-email').removeClass('ui-disabled');
                if (lzm_commonTools.checkEmailIsLockedBy(emailId, lzm_chatDisplay.myId)) {
                    saveEmailListChanges(emailId, false);
                }
            }
        });
    });
};

ChatTicketClass.prototype.updateEmailList = function() {

    ChatTicketClass.EmailListUpdate = false;
    var that = this, emails = DataEngine.emails, i;
    var selectedLine = $('#email-placeholder').data('selected-email');
    selectedLine = (typeof selectedLine != 'undefined') ? selectedLine : $('#email-list-body').data('selected-email');

    if(emails.length > selectedLine)
    {
        $('#email-placeholder').data('selected-email-id', emails[selectedLine].id);
        if (lzm_commonTools.checkEmailReadStatus($('#email-placeholder').data('selected-email-id')) == -1 && lzm_chatTimeStamp.getServerTimeString(null, true) - emails[selectedLine].c <= 1209600)
            lzm_chatDisplay.emailReadArray.push({id: emails[selectedLine].id, c: emails[selectedLine].c});
    }
    else
    {
        $('#email-placeholder').data('selected-email-id', 0);
        $('#cancel-email-list').click();
        return;
    }

    var emailListHtml = '<div id="incoming-email-list">' +
        '<table id="incoming-email-table" class="visible-list-table alternating-rows-table lzm-unselectable"><thead><tr>' +
        '<th style="width: 18px !important;"></th>' +
        '<th style="width: 18px !important;"></th>' +
        '<th>' + t('Date') + '</th>' +
        '<th>' + tid('subject') + '</th>' +
        '<th>' + t('Email') + '</th>' +
        '<th>' + t('Name') + '</th>' +
        '<th>' + t('Group') + '</th>' +
        '<th>' + t('Sent to') + '</th>' +
        '</tr></thead><tbody>';

    for (i=0; i<emails.length; i++)
    {
        var group = DataEngine.groups.getGroup(emails[i].g);
        emailListHtml += that.createEmailListLine(emails[i], i, group);
    }
    emailListHtml += '</tbody>';

    if (DataEngine.emailCount > CommunicationEngine.emailAmount)
    {
        emailListHtml += '<tfoot><tr>' +
            '<td colspan="8" id="emails-load-more"><span>' + t('Load more emails') + '</span></td></tr></tfoot>';
    }
    emailListHtml += '</table></div>';

    var emailText = lzm_commonTools.htmlEntities(emails[selectedLine].text).replace(/\r\n/g, '<br>').replace(/\r/g, '<br>').replace(/\n/g, '<br>');
    var contentHtml = this.createEmailPreview(emailText,emails[selectedLine]);
    var emailHTML = ChatTicketClass.GetSecureMailFrame('EMAIL',true,emails[selectedLine].id);

    var attachmentHtml = that.createTicketAttachmentTable({}, emails[selectedLine], -1, false);
    $('#email-content').html(contentHtml);
    $('#email-html').html(ChatTicketClass.GetSecureMailFrame('EMAIL',true,emails[selectedLine].id));
    $('#email-attachment-list').html(attachmentHtml);
    $('#email-list-loading').remove();
    $('#email-list-frame').html(emailListHtml);

    var emailListHeight = $('#email-list').height();
    $('#incoming-email-list').css({'min-height': (emailListHeight - 22) + 'px'});

    if (emails[selectedLine].ei != '' && emails[selectedLine].ei != lzm_chatDisplay.myId)
    {
        $('#reset-emails').addClass('ui-disabled');
        $('#delete-email').addClass('ui-disabled');
        $('#create-ticket-from-email').addClass('ui-disabled');
    }
    else if (emails[selectedLine].ei != '' && emails[selectedLine].ei == lzm_chatDisplay.myId)
    {
        $('#reset-emails').removeClass('ui-disabled');
    }

    $('.email-list-line').click(function(e) {

        var oldSelectedLine = selectedLine,i;
        var newSelectedLine = $(this).data('line-number');
        var isMultiLine = (e.shiftKey || e.ctrlKey);
        var isShiftSelect = (e.shiftKey);
        var emailId = emails[selectedLine].id;

        if(!isMultiLine)
            $('.email-list-line').removeClass('selected-table-line');

        if (emails[oldSelectedLine].ei != '') {
            if (lzm_commonTools.checkEmailTicketCreation(emailId) == -1 && $.inArray(emailId, lzm_chatDisplay.emailDeletedArray) == -1)
                $('#email-list-line-' + oldSelectedLine).children('td:first').html('<i class="fa fa-lock icon-orange"></i>');
            $('#email-list-line-' + oldSelectedLine).addClass('locked-email-line');
        }

        if(isShiftSelect && Math.abs($(this).data('line-number')-oldSelectedLine) > 1)
        {
            if(newSelectedLine>selectedLine)
                for(i=selectedLine;i<newSelectedLine;i++)
                    $('#email-list-line-' + i).addClass('selected-table-line');
            else if(newSelectedLine<selectedLine)
                for(i=selectedLine;i>newSelectedLine;i--)
                    $('#email-list-line-' + i).addClass('selected-table-line');
        }

        selectedLine = newSelectedLine;
        that.selectedEmailNo = newSelectedLine;
        emailId = emails[selectedLine].id;
        $('#email-list-line-' + selectedLine).removeClass('locked-email-line');
        $('#email-list-line-' + selectedLine).addClass('selected-table-line');
        $('#email-placeholder').data('selected-email', selectedLine);
        $('#email-placeholder').data('selected-email-id', emailId);

        var emailText = lzm_commonTools.htmlEntities(emails[selectedLine].text).replace(/\r\n/g, '<br>').replace(/\r/g, '<br>').replace(/\n/g, '<br>');
        var contentHtml = that.createEmailPreview(emailText,emails[selectedLine]);
        var emailHTML = ChatTicketClass.GetSecureMailFrame('EMAIL',true,emails[selectedLine].id);
        var attachmentHtml = that.createTicketAttachmentTable({}, emails[selectedLine], -1, false);

        $('#email-content').html(contentHtml);
        $('#email-html').html(emailHTML);
        $('#email-attachment-list').html(attachmentHtml);

        if (lzm_commonTools.checkEmailReadStatus(emails[selectedLine].id) == -1 &&
            lzm_chatTimeStamp.getServerTimeString(null, true) - emails[selectedLine].c <= 1209600) {
            lzm_chatDisplay.emailReadArray.push({id: emails[selectedLine].id, c: emails[selectedLine].c});
            if (emails[selectedLine].ei != '') {
                if (lzm_commonTools.checkEmailTicketCreation(emailId) == -1 && $.inArray(emailId, lzm_chatDisplay.emailDeletedArray) == -1) {
                    $('#email-list-line-' + selectedLine).children('td:first').html('<i class="fa fa-lock icon-orange"></i>');
                }
            } else {
                $('#email-list-line-' + selectedLine).children('td:first').html('<i class="fa fa-envelope-o"></i>');
            }
            $('#email-list-line-' + selectedLine).children('td').css('font-weight', 'normal');
        }

        if (emails[selectedLine].ei != '' && emails[selectedLine].ei != lzm_chatDisplay.myId) {
            $('#reset-emails').addClass('ui-disabled');
            $('#delete-email').addClass('ui-disabled');
            $('#create-ticket-from-email').addClass('ui-disabled');
        } else {
            if (lzm_commonTools.checkEmailTicketCreation(emailId) != -1 || $.inArray(emailId, lzm_chatDisplay.emailDeletedArray) != -1) {
                $('#reset-emails').removeClass('ui-disabled');
                $('#delete-email').addClass('ui-disabled');
                $('#create-ticket-from-email').addClass('ui-disabled');
            } else if (emails[selectedLine].ei != '' && emails[selectedLine].ei == lzm_chatDisplay.myId) {
                $('#reset-emails').removeClass('ui-disabled');
                $('#delete-email').removeClass('ui-disabled');
                $('#create-ticket-from-email').removeClass('ui-disabled');
            } else {
                $('#reset-emails').addClass('ui-disabled');
                $('#delete-email').removeClass('ui-disabled');
                $('#create-ticket-from-email').removeClass('ui-disabled');
            }
        }
        UIRenderer.resizeEmailDetails();
    });
    $('#emails-load-more').click(function(){
        CommunicationEngine.emailAmount += 20;
        CommunicationEngine.emailUpdateTimestamp = 0;
        CommunicationEngine.removePropertyFromDataObject('p_de_a');
        CommunicationEngine.addPropertyToDataObject('p_de_a', CommunicationEngine.emailAmount);
        $('#incoming-email-table').children('tfoot').remove();
        CommunicationEngine.InstantPoll();
    });

    UIRenderer.resizeEmailDetails();
};

ChatTicketClass.prototype.createEmailPreview = function(emailText,email) {
    var html = '<div class="lzm-dialog-headline3">' +
        '<div id="email-sender-name"><b>' + t("Name") + "</b>: " + lzm_commonTools.htmlEntities(email.n) + '</div>' +
        '<div id="email-subject"><b>' + t("Subject") + "</b>: " + lzm_commonTools.htmlEntities(email.s) + '</div>' +
        '</div>' +
        '<div id="email-text" style="overflow-y:auto;padding:10px;">' + emailText + '</div>';
    return html;
};

ChatTicketClass.prototype.createEmailListLine = function(email, lineNumber, group) {
    var selectedClass = (lineNumber == $('#email-placeholder').data('selected-email')) ? ' selected-table-line' : '';
    var attachmentIcon = (email.attachment.length > 0) ? '<i class="fa fa-paperclip"></i>' : '';
    var statusIcon = '<i class="fa fa-envelope"></i>';
    var fontWeight = 'bold';

    if ($.inArray(email.id, lzm_chatDisplay.emailDeletedArray) != -1)
    {
        statusIcon = '<i class="fa fa-remove icon-red"></i>';
        fontWeight = 'normal';
    }
    else if (lzm_commonTools.checkEmailTicketCreation(email.id) != -1)
    {
        statusIcon = '<i class="fa fa-plus icon-green"></i>';
        fontWeight = 'normal';
    }
    else if (email.ei != '')
    {
        statusIcon = '<i class="fa fa-lock icon-orange"></i>';
        fontWeight = 'normal';
        if (lineNumber != $('#email-placeholder').data('selected-email')) {
            selectedClass = ' locked-email-line';
        }
    }
    else if (lzm_chatTimeStamp.getServerTimeString(null, true) - email.c > 1209600 || lzm_commonTools.checkEmailReadStatus(email.id) != -1)
    {
        statusIcon = '<i class="fa fa-envelope-o"></i>';
        fontWeight = 'normal';
    }

    var gid = (group != null) ? group.id : '?';

    var emailTime = lzm_chatTimeStamp.getLocalTimeObject(email.c * 1000, true);
    var emailHtml = '<tr class="email-list-line lzm-unselectable' + selectedClass + '" id="email-list-line-' + lineNumber + '" data-id="'+email.id+'" data-line-number="' + lineNumber + '"' +
        ' data-locked-by="' + email.ei + '" style="cursor:pointer;">' +
        '<td class="icon-column" style="font-weight: ' + fontWeight + '; text-align:center;padding:0 10px;">' + statusIcon + '</td>' +
        '<td class="icon-column" style="font-weight: ' + fontWeight + '; text-align:center;padding:0 6px;">' + attachmentIcon + '</td>' +
        '<td style="font-weight: ' + fontWeight + '; white-space: nowrap;">' + lzm_commonTools.getHumanDate(emailTime, '', lzm_chatDisplay.userLanguage) + '</td>' +
        '<td style="font-weight: ' + fontWeight + '; white-space: nowrap;">' + lzm_commonTools.htmlEntities(lzm_commonTools.SubStr(email.s,30,true)) + '</td>' +
        '<td style="font-weight: ' + fontWeight + '; white-space: nowrap;">' + lzm_commonTools.htmlEntities(email.e) + '</td>' +
        '<td style="font-weight: ' + fontWeight + '; white-space: nowrap;">' + lzm_commonTools.htmlEntities(lzm_commonTools.SubStr(email.n,30,true)) + '</td>' +
        '<td style="font-weight: ' + fontWeight + '; white-space: nowrap;">' + gid + '</td>' +
        '<td style="font-weight: ' + fontWeight + '; white-space: nowrap;">' + email.r + '</td>' +
        '</tr>';
    return emailHtml;
};

ChatTicketClass.prototype.checkTicketTakeOverReply = function() {
    var rtValue = lzm_commonPermissions.checkUserPermissions('', 'tickets', 'assign_operators', {});
    if (!rtValue) {
        showNoPermissionMessage();
    }
    return rtValue;
};

ChatTicketClass.prototype.ticketMessageSortfunction = function(a,b) {
    var rtValue = (parseInt(a.ct) < parseInt(b.ct)) ? -1 : (parseInt(a.ct) > parseInt(b.ct)) ? 1 : 0;
    return rtValue;
};

ChatTicketClass.prototype.checkTicketDetailsChangePermission = function (ticket, changedValues) {
    var rtValue = true;
    if (typeof ticket.editor != 'undefined' && ticket.editor != false && ticket.editor.st != changedValues.status) {
        if ((!lzm_commonPermissions.checkUserPermissions('', 'tickets', 'status_open', {}) && changedValues.status == 0) ||
            (!lzm_commonPermissions.checkUserPermissions('', 'tickets', 'status_progress', {}) && changedValues.status == 1) ||
            (!lzm_commonPermissions.checkUserPermissions('', 'tickets', 'status_closed', {}) && changedValues.status == 2) ||
            (!lzm_commonPermissions.checkUserPermissions('', 'tickets', 'status_deleted', {}) && changedValues.status == 3)) {
            rtValue = false;
        }
    } else if ((typeof ticket.editor == 'undefined' || ticket.editor == false) && changedValues.status != 0) {
        if ((!lzm_commonPermissions.checkUserPermissions('', 'tickets', 'status_progress', {}) && changedValues.status == 1) ||
            (!lzm_commonPermissions.checkUserPermissions('', 'tickets', 'status_closed', {}) && changedValues.status == 2) ||
            (!lzm_commonPermissions.checkUserPermissions('', 'tickets', 'status_deleted', {}) && changedValues.status == 3)) {
            rtValue = false;
        }
    }
    return rtValue;
};

ChatTicketClass.prototype.createTicketDetailsChangeHandler = function(selectedTicket) {
    var that = this;
    var selected = '', statusSelect = $('#ticket-details-status'), subStatusSelect = $('#ticket-details-sub-status'),channelSelect = $('#ticket-details-channel'), subChannelSelect = $('#ticket-details-sub-channel');

    statusSelect.change(function() {
        subStatusSelect.find('option').remove();
        subStatusSelect.append('<option value="">-</option>');
        var myStatus = statusSelect.val();
        for(key in DataEngine.global_configuration.database['tsd'])
        {
            var elem = DataEngine.global_configuration.database['tsd'][key];
            if(elem.type == 0 && elem.parent == myStatus){
                selected = (selectedTicket.editor && selectedTicket.editor.ss == elem.name) ? ' selected' : '';
                subStatusSelect.append('<option value="'+elem.name+'"'+selected+'>'+elem.name+'</option>');
            }
        }
        if($('#ticket-details-sub-status option').size()==0)
        {
            subStatusSelect.append('<option>-</option>');
            subStatusSelect.addClass('ui-disabled');
        }
        else
            subStatusSelect.removeClass('ui-disabled');
    });
    statusSelect.change();
    channelSelect.change(function() {
        subChannelSelect.find('option').remove();
        subChannelSelect.append('<option value="">-</option>');
        var myChannel = channelSelect.val();
        for(key in DataEngine.global_configuration.database['tsd'])
        {
            var elem = DataEngine.global_configuration.database['tsd'][key];
            if(elem.type == 1 && elem.parent == myChannel){
                selected = (selectedTicket.s == elem.name) ? ' selected' : '';
                subChannelSelect.append('<option value="'+elem.name+'"'+selected+'>'+elem.name+'</option>');
            }
        }
        if($('#ticket-details-sub-channel option').size()==0)
        {
            subChannelSelect.append('<option>-</option>');
            subChannelSelect.addClass('ui-disabled');
        }
        else
            subChannelSelect.removeClass('ui-disabled');
    });
    channelSelect.change();

    $('#ticket-details-group').change(function() {
        var i, selectedString;
        var selectedGroupId = $('#ticket-details-group').val();
        var selectedOperator = $('#ticket-details-editor').val();

        var operators = DataEngine.operators.getOperatorList('name', selectedGroupId);
        var editorSelectString = '<option value="-1">' + tid('none') + '</option>';
        for (i=0; i<operators.length; i++) {
            if (operators[i].isbot != 1)
            {
                selectedString = (operators[i].id == selectedOperator) ? ' selected="selected"' : '';
                editorSelectString += '<option value="' + operators[i].id + '"' + selectedString + '>' + operators[i].name + '</option>';
            }
        }
        var selectedLanguage = $('#ticket-details-language').val();

        var availableLanguages = [];
        var group = DataEngine.groups.getGroup(selectedGroupId);
        for (i=0; i<group.pm.length; i++) {
            availableLanguages.push(group.pm[i].lang);
        }
        if ( typeof selectedTicket.l != 'undefined' && $.inArray(selectedTicket.l, availableLanguages) == -1) {
            availableLanguages.push(selectedTicket.l);
        }
        if ($.inArray(selectedLanguage, availableLanguages) == -1) {
            availableLanguages.push(selectedLanguage);
        }
        var langSelectString = '';
        for (i=0; i<availableLanguages.length; i++) {
            selectedString = (availableLanguages[i] == selectedLanguage) ? ' selected="selected"' : '';
            langSelectString += '<option value="' + availableLanguages[i] + '"' + selectedString + '>' + lzm_chatDisplay.getLanguageDisplayName(availableLanguages[i]) + '</option>';
        }
        $('#ticket-details-editor').html(editorSelectString).trigger('create');
        $('#ticket-details-language').html(langSelectString).trigger('create');
        that.saveUpdatedTicket(selectedTicket,null,selectedGroupId);

    });
    $('#ticket-details-language').change(function() {
        that.saveUpdatedTicket(selectedTicket,$('#ticket-details-language').val(),null);
    });
};

ChatTicketClass.prototype.saveUpdatedTicket = function(ticket,lang,group) {
    if(!(this.updatedTicket!=null && this.updatedTicket.id == ticket.id))
        this.updatedTicket = lzm_commonTools.clone(ticket);
    if(lang != null)
        this.updatedTicket.l = lang;
    if(group != null)
        this.updatedTicket.gr = group;
};

ChatTicketClass.prototype.createTicketListContextMenu = function(myObject, place, widthOffset) {
    var contextMenuHtml = '',disabledClass,elem,key;
    var dialogId = (place == 'ticket-list') ? '' : $('#visitor-information').data('dialog-id');
    contextMenuHtml += '<div onclick="ChatTicketClass.__ShowTicket(\'' + myObject.id + '\', true, \'\', \'\', \'' + dialogId + '\');"><span id="show-ticket-details" class="cm-line cm-click">' + t('Open Ticket') + '</span></div><hr />';
    if($.inArray(myObject.id,DataEngine.ticketWatchList) == -1)
        contextMenuHtml += '<div onclick="addTicketToWatchList(\'' + myObject.id + '\',\'' + DataEngine.myId + '\');"><span id="add-ticket-to-wl" class="cm-line cm-click">' + tid('add_to_watch_list') + '</span></div>';
    else
        contextMenuHtml += '<div onclick="removeTicketFromWatchList(\'' + myObject.id + '\');"><span id="add-ticket-to-wl" class="cm-line cm-click">' + tid('remove_from_watch_list') + '</span></div>';
    contextMenuHtml += '<div onclick="showSubMenu(\'' + place + '\', \'add_to_watch_list\', \'' + myObject.id + '\', %CONTEXTX%, %CONTEXTY%, %MYWIDTH%+'+widthOffset+', %MYHEIGHT%)"><span id="show-group-submenu" class="cm-line cm-click">' + tid('add_to_watch_list_of') + '</span><i class="fa fa-caret-right lzm-ctxt-right-fa"></i></div><hr />';
    contextMenuHtml += '<div onclick="showSubMenu(\'' + place + '\', \'ticket_priority\', \'' + myObject.id + '\', %CONTEXTX%, %CONTEXTY%, %MYWIDTH%+'+widthOffset+', %MYHEIGHT%)"><span id="show-group-submenu" class="cm-line cm-click">' + tid('priority') + '</span><i class="fa fa-caret-right lzm-ctxt-right-fa"></i></div>';
    contextMenuHtml += '<div onclick="showSubMenu(\'' + place + '\', \'ticket_status\', \'' + myObject.id + '\', %CONTEXTX%, %CONTEXTY%, %MYWIDTH%+'+widthOffset+', %MYHEIGHT%)"><span id="show-group-submenu" class="cm-line cm-click">' + tid('status') + '</span><i class="fa fa-caret-right lzm-ctxt-right-fa"></i></div>';
    disabledClass = ' class="ui-disabled"';
    var tstatus = myObject.editor ? myObject.editor.st : 0;
    for(key in DataEngine.global_configuration.database['tsd'])
    {
        elem = DataEngine.global_configuration.database['tsd'][key];
        if(elem.type == 0 && elem.parent == tstatus)
            disabledClass = '';
    }
    contextMenuHtml += '<div onclick="showSubMenu(\'' + place + '\', \'ticket_sub_status\', \'' + myObject.id + '\', %CONTEXTX%, %CONTEXTY%, %MYWIDTH%+'+widthOffset+', %MYHEIGHT%)"'+disabledClass+'><span id="show-group-submenu" class="cm-line cm-click">' + tid('sub_status') + '</span><i class="fa fa-caret-right lzm-ctxt-right-fa"></i></div>';
    contextMenuHtml += '<div onclick="showSubMenu(\'' + place + '\', \'ticket_channel\', \'' + myObject.id + '\', %CONTEXTX%, %CONTEXTY%, %MYWIDTH%+'+widthOffset+', %MYHEIGHT%)"><span id="show-group-submenu" class="cm-line cm-click">' + tid('channel') + '</span><i class="fa fa-caret-right lzm-ctxt-right-fa"></i></div>';
    disabledClass = ' class="ui-disabled"';

    var tchannel = myObject.t;
    for(key in DataEngine.global_configuration.database['tsd'])
    {
        elem = DataEngine.global_configuration.database['tsd'][key];
        if(elem.type == 1 && elem.parent == tchannel)
            disabledClass = '';
    }

    contextMenuHtml += '<div onclick="showSubMenu(\'' + place + '\', \'ticket_sub_channel\', \'' + myObject.id + '\', %CONTEXTX%, %CONTEXTY%, %MYWIDTH%+'+widthOffset+', %MYHEIGHT%)"'+disabledClass+'><span id="show-group-submenu" class="cm-line cm-click">' + tid('sub_channel') + '</span><i class="fa fa-caret-right lzm-ctxt-right-fa"></i></div>';
    contextMenuHtml += '<div onclick="showSubMenu(\'' + place + '\', \'operator\', \'' + myObject.id + '\', %CONTEXTX%, %CONTEXTY%, %MYWIDTH%+'+widthOffset+', %MYHEIGHT%)"><span id="show-operator-submenu" class="cm-line cm-click">' + tid('operator') + '</span><i class="fa fa-caret-right lzm-ctxt-right-fa"></i></div>';
    contextMenuHtml += '<div onclick="showSubMenu(\'' + place + '\', \'group\', \'' + myObject.id + '\', %CONTEXTX%, %CONTEXTY%, %MYWIDTH%+'+widthOffset+', %MYHEIGHT%)"><span id="show-group-submenu" class="cm-line cm-click">' + t('Group') + '</span><i class="fa fa-caret-right lzm-ctxt-right-fa"></i></div><hr>';

    disabledClass = ($('tr.ticket-list-row.selected-table-line').length>=2) ? '' : ' class="ui-disabled"';

    contextMenuHtml += '<div onclick="mergeTickets();" ' + disabledClass + '><span class="cm-line cm-click">' + tid('merge') + '</span></div><hr />';
    contextMenuHtml += '<div onclick="showFilterCreation(\'email\',\'\',\'\',\'\',false,\'' + myObject.id + '\');"><span class="cm-line cm-click">' + tid('new_email_filter') + '</span></div><hr />';
    contextMenuHtml += '<div onclick="changeTicketStatus(4,null,null,null,false);"><span class="cm-line cm-click">' + tid('remove') + '</span></div><hr />';
    disabledClass = ((myObject.u <= lzm_chatDisplay.ticketGlobalValues.mr && lzm_commonTools.checkTicketReadStatus(myObject.id, lzm_chatDisplay.ticketUnreadArray) == -1) || (myObject.u > lzm_chatDisplay.ticketGlobalValues.mr && lzm_commonTools.checkTicketReadStatus(myObject.id, lzm_chatDisplay.ticketReadArray, lzm_chatDisplay.ticketListTickets) != -1)) ? ' class="ui-disabled"' : '';
    contextMenuHtml += '<div onclick="changeTicketReadStatus(\'' + myObject.id + '\', \'read\');" ' + disabledClass + '><span id="set-ticket-read" class="cm-line cm-click">' + t('Mark as read') + '</span></div>';
    if (place == 'ticket-list')
        contextMenuHtml += '<div onclick="setAllTicketsRead();"><span id="set-all-tickets-read" class="cm-line cm-click">' + t('Mark all as read') + '</span></div>';
    return contextMenuHtml
};

ChatTicketClass.prototype.createTicketDetailsContextMenu = function(myObject) {
    var contextMenuHtml = '', disabledClass;
    contextMenuHtml += '<div onclick="removeTicketMessageContextMenu(); $(\'#reply-ticket-details\').click();">' +
        '<i class="fa fa-reply"></i>' +
        '<span id="reply-this-message" class="cm-line cm-line-icon-left cm-click">' +
        t('Reply') + '</span></div>';

    contextMenuHtml += '<div onclick="showMessageForward(\'' + myObject.ti.id + '\', \'' + myObject.msg + '\');">' +
        '<i class="fa fa-share"></i>' +
        '<span id="forward-this-message" class="cm-line cm-line-icon-left cm-click">' +
        t('Forward') + '</span></div>';

    disabledClass = (myObject.ti.messages[myObject.msg].t != 1) ? ' class="ui-disabled"' : '';

    contextMenuHtml += '<div' + disabledClass + ' onclick="ChatTicketClass.SendForwardedMessage({id : \'\'}, \'\', \'\', \'\', \'' + myObject.ti.id + '\', \'\', \'' + myObject.msg + '\')">' +
        '<span id="resend-this-message" class="cm-line cm-click">' + t('Resend message') + '</span></div>';

    contextMenuHtml += '<div onclick="ChatTicketClass.PrintTicket(\'' + myObject.ti.id + '\');"><span id="print-ticket" class="cm-line cm-click">' + tid('print') + '</span></div>';
    contextMenuHtml += '<div onclick="showPhoneCallDialog(\'' + myObject.ti.id + '\', \'' + myObject.msg + '\', \'ticket\');"><span id="call-this-message-sender" class="cm-line cm-click">' + t('Phone Call') + '</span></div><hr />';
    contextMenuHtml += '<div onclick="showTicketLinker(\'' + myObject.ti.id + '\', \'\', \'ticket\', \'chat\')">' +
        '<span id="link-ticket-chat" class="cm-line cm-click">' +
        t('Link this Ticket with Chat') + '</span></div>';
    contextMenuHtml += '<div onclick="showTicketLinker(\'' + myObject.ti.id + '\', \'\', \'ticket\', \'ticket\')"><span id="link-ticket-chat" class="cm-line cm-click">' +
        tid('link_ticket_with_ticket') + '</span></div>';

    disabledClass = (myObject.msg == 0) ? ' class="ui-disabled"' : '';
    contextMenuHtml += '<div' + disabledClass + ' onclick="ChatTicketClass.MoveMessageToNewTicket(\'' + myObject.ti.id + '\', \'' + myObject.msg + '\')">' +
        '<span id="copy-msg-to-new" class="cm-line cm-click">' +
        t('Copy message into new Ticket') + '</span></div>';
    disabledClass = (DataEngine.otrs == '' || DataEngine.otrs == null) ? ' class="ui-disabled"' : '';
    contextMenuHtml += '<div' + disabledClass + ' onclick="showTicketMsgTranslator(\'' + myObject.ti.id + '\', \'' + myObject.msg + '\')">' +
        '<span id="translate-ticket-msg" class="cm-line cm-click">' +
        t('Translate') + '</span></div><hr />';

    contextMenuHtml += '<div onclick="ChatTicketClass.AddComment(\'' + myObject.ti.id + '\', \'\')"><span class="cm-line cm-click">' + tid('add_comment') + '</span></div><hr />';

    disabledClass = ($('#message-details-inner').data('edit')) ? ' class="ui-disabled"' : '';
    contextMenuHtml += '<div' + disabledClass + ' onclick="removeTicketMessageContextMenu();">' +
        '<span id="edit-msg" class="cm-line cm-click">' +
        t('Edit Message') + '</span></div>';
    return contextMenuHtml;
};

ChatTicketClass.prototype.subDefinitionIsValid = function(type,parent,sub) {
    for(var key in DataEngine.global_configuration.database['tsd'])
    {
        var tsd = DataEngine.global_configuration.database['tsd'][key];
        if(tsd.type == type && tsd.parent==parent && tsd.name == sub)
            return true;
    }
    return false;
};

ChatTicketClass.prototype.setTicketFilter = function() {

    var allGroupsChecked = true, noGroupsChecked = true, tsd = null, i, key = '', check = false, checked = false, fgroups = '', fchannels = '', fsubchannels = '', filterHTML = '<div><fieldset class="lzm-fieldset"><legend>'+tid('groups')+'</legend>';
    var groups = DataEngine.groups.getGroupList('id',true,false);
    for (i=0; i<groups.length; i++)
    {
        check = (CommunicationEngine.ticketFilterGroups != null) ? CommunicationEngine.ticketFilterGroups.indexOf('\'' + groups[i].id + '\'')!==-1 : true;
        filterHTML += lzm_inputControls.createCheckbox('stf-g-' + md5(groups[i].id), groups[i].id,check);
    }

    filterHTML += '</fieldset><br>';
    filterHTML += '<fieldset class="lzm-fieldset"><legend>'+tid('channels')+'</legend>';

    for (var aChannel=0; aChannel<ChatTicketClass.m_TicketChannels.length; aChannel++) {
        var sc = ChatTicketClass.m_TicketChannels[aChannel];
        check = (CommunicationEngine.ticketFilterChannel != null) ? CommunicationEngine.ticketFilterChannel.toString().indexOf(aChannel.toString())!==-1 : true;
        filterHTML += lzm_inputControls.createCheckbox('stf-c-' + aChannel, sc.key,check, false, 'stf-channel');
        for(key in DataEngine.global_configuration.database['tsd'])
        {
            tsd = DataEngine.global_configuration.database['tsd'][key];
            if(tsd.type == 1 && tsd.parent == sc.index){
                check = (CommunicationEngine.ticketFilterSubChannels != null) ? CommunicationEngine.ticketFilterSubChannels.indexOf(lz_global_base64_encode(tsd.parent + tsd.name))!==-1 : true;
                filterHTML += '<div class="left-space-child">' + lzm_inputControls.createCheckbox('stf-sc-' + md5(tsd.sid+tsd.parent+tsd.type.toString()), tsd.name,check,false,'stf-c-' + aChannel)+'</div>';
            }
        }
    }
    filterHTML += '</fieldset><br></div>';

    var headerString = tid('filters');
    var footerString = lzm_inputControls.createButton('stf-ok-btn', '', '', tid('ok'), '', 'force-text',{'margin-left': '4px','padding': '3px 10px'},'',30,'d');
    footerString += lzm_inputControls.createButton('stf-cancel-btn', '', '', tid('cancel'), '', 'force-text',{'margin-left': '4px','padding': '3px 10px'},'',30,'d');
    var bodyString = filterHTML;
    lzm_commonDialog.CreateDialogWindow(headerString, bodyString, footerString, 'filter', 'set_ticket_filter','set_ticket_filter_dialog','stf-cancel-btn',false);

    $('.stf-channel').change(function(){
        if($(this).prop('checked'))
            $('.'+$(this).attr('id')).removeClass('ui-disabled');
        else
            $('.'+$(this).attr('id')).addClass('ui-disabled');
    });
    $('.stf-channel').change();
    $('#stf-cancel-btn').click(function() {
        TaskBarManager.RemoveActiveWindow();
    });
    $('#stf-ok-btn').click(function() {

        for (i=0; i<groups.length; i++)
        {
            checked = $('#' + 'stf-g-' + md5(groups[i].id)).prop('checked');
            if(checked)
            {
                noGroupsChecked = false;
                if (fgroups=='')
                    fgroups = "'" + groups[i].id + "'";
                else
                    fgroups += "," + "'" + groups[i].id + "'";
            }
            else
                allGroupsChecked = false;
        }

        CommunicationEngine.ticketFilterGroups = (allGroupsChecked || noGroupsChecked) ? null : fgroups;

        if(!allGroupsChecked)
            lzm_commonStorage.saveValue('ticket_filter_groups_' + DataEngine.myId,lz_global_base64_encode(fgroups));
        else
            lzm_commonStorage.deleteKeyValuePair('ticket_filter_groups_' + DataEngine.myId);

        var noChannelsChecked = true, noSubChannelsChecked = true;
        var allChannelsChecked = true, allSubChannelsChecked = true;
        for (var aChannel=0; aChannel<ChatTicketClass.m_TicketChannels.length; aChannel++) {
            var sc = ChatTicketClass.m_TicketChannels[aChannel];

            checked = $('#' + 'stf-c-' + aChannel).prop('checked');

            if(!checked)
                allChannelsChecked = false;
            else
                noChannelsChecked = false;

            fchannels += (checked) ? sc.index.toString() : '';

            for(key in DataEngine.global_configuration.database['tsd'])
            {
                tsd = DataEngine.global_configuration.database['tsd'][key];
                if(tsd.type == 1 && tsd.parent == sc.index)
                {
                    checked = $('#' + 'stf-sc-' + md5(tsd.sid+tsd.parent+tsd.type.toString())).prop('checked');
                    if(!checked)
                        allSubChannelsChecked = false;
                    else
                    {
                        noSubChannelsChecked = false;
                        if (fsubchannels=='')
                            fsubchannels = lz_global_base64_encode(tsd.parent + tsd.name);
                        else
                            fsubchannels += "," + lz_global_base64_encode(tsd.parent + tsd.name);
                    }
                }
            }
        }

        CommunicationEngine.ticketFilterChannel = (allChannelsChecked || noChannelsChecked) ? '01234567' : fchannels;
        CommunicationEngine.ticketFilterSubChannels = (allSubChannelsChecked) ? null : fsubchannels;

        if(!allChannelsChecked)
            lzm_commonStorage.saveValue('ticket_filter_channel_' + DataEngine.myId,fchannels);
        else
            lzm_commonStorage.deleteKeyValuePair('ticket_filter_channel_' + DataEngine.myId);

        if(!allSubChannelsChecked)
            lzm_commonStorage.saveValue('ticket_filter_sub_channels_' + DataEngine.myId,fsubchannels);
        else
            lzm_commonStorage.deleteKeyValuePair('ticket_filter_sub_channels_' + DataEngine.myId);

        toggleTicketFilter();
        TaskBarManager.RemoveActiveWindow();
    });
};

ChatTicketClass.prototype.IsLatestTicketUnseen = function () {
    return (DataEngine.ticketLatestReceivedId > DataEngine.ticketLatestSeenId);
};

ChatTicketClass.__ProcessNext = function(_getCount) {

    var isEditorId,ticket,key,candidates = [],candidates_final=[],priot=false,tlist = {};
    tlist['cat_prio_my_prio'] = [];
    tlist['cat_prio_open_prio'] = [];
    tlist['cat_prio_my'] = [];
    tlist['cat_prio_open'] = [];
    for(key in lzm_chatDisplay.ticketListTickets)
    {
        ticket = lzm_chatDisplay.ticketListTickets[key];
        isEditorId = ticket.editor && ticket.editor.ed != '';

        // my with prio
        if(ticket.editor && ticket.editor.st < 2 && ticket.editor.ed == DataEngine.myId && ticket.p > 2)
        {
            priot = true;
            tlist['cat_prio_my_prio'].push(ticket);
        }
        // open tickets with prio
        else if(!isEditorId && ticket.p > 2)
        {
            priot = true;
            tlist['cat_prio_open_prio'].push(ticket);
        }
        // my open tickets
        else if(ticket.editor && ticket.editor.st < 2 && ticket.editor.ed == DataEngine.myId)
        {
            tlist['cat_prio_my'].push(ticket);
        }
        // open tickets
        else if(!isEditorId)
        {
            tlist['cat_prio_open'].push(ticket);
        }
    }

    if(tlist['cat_prio_my_prio'].length)
        candidates = tlist['cat_prio_my_prio'];
    else if(tlist['cat_prio_open_prio'].length)
        candidates = tlist['cat_prio_open_prio'];
    else if(tlist['cat_prio_my'].length)
        candidates = tlist['cat_prio_my'];
    else if(tlist['cat_prio_open'].length)
        candidates = tlist['cat_prio_open'];
    else
    {
        return 0;
    }

    if(priot)
    {
        candidates = lzm_commonTools.SortByProperty(candidates,'p',true);
        var hp = -1;
        for(key in candidates)
        {
            if(candidates[key].p > hp)
            {
                candidates_final.push(candidates[key]);
                hp = candidates[key].p;
            }
            else
                break;
        }
    }
    else
        candidates_final = candidates;

    if(_getCount)
        return candidates_final.length;

    candidates_final = lzm_commonTools.SortByProperty(candidates_final,'w',false);
    selectTicket(candidates_final[0].id);
    ChatTicketClass.__ShowTicket();
    return true;
};

ChatTicketClass.__ShowTicket = function(ticketId, fromContext, emailId, chatId, dialogId) {

    removeArchiveListContextMenu();
    var email = {id: ''}, chat = {cid: ''}, i;

    ticketId = (typeof ticketId != 'undefined') ? ticketId : lzm_chatDisplay.selectedTicketRow;
    fromContext = (typeof fromContext != 'undefined') ? fromContext : false;
    emailId = (typeof emailId != 'undefined') ? emailId : '';
    chatId = (typeof chatId != 'undefined') ? chatId : '';
    dialogId = (typeof dialogId != 'undefined') ? dialogId : '';

    if (typeof emailId != 'undefined' && emailId != '')
    {
        for (i=0; i<DataEngine.emails.length; i++)
        {
            if (DataEngine.emails[i].id == emailId)
            {
                email = DataEngine.emails[i];
                email['dialog-id'] = dialogId
            }
        }
    }

    if (typeof chatId != 'undefined' && chatId != '')
    {
        var chatobj = DataEngine.ChatManager.GetChat(chatId,'i');
        if(chatobj!=null)
        {
            chat = lzm_commonTools.clone(chatobj);
            chat.cid = chatId;
            chat['dialog-id'] = dialogId;
        }
        else
        {
            for (i=0; i<DataEngine.chatArchive.chats.length; i++) {
                if (DataEngine.chatArchive.chats[i].cid == chatId)
                {
                    chat = DataEngine.chatArchive.chats[i];
                    chat['dialog-id'] = dialogId;
                }
            }
        }
    }
    if (ticketId != '')
    {
        selectTicket(ticketId);
        changeTicketReadStatus(ticketId, 'read', false, true);
    }
    if (!fromContext && lzm_chatDisplay.showTicketContextMenu)
        removeTicketContextMenu();
    else
    {
        removeTicketContextMenu();
        var isNew = (ticketId == '');

        lzm_chatDisplay.ticketDialogId[ticketId] = lzm_chatDisplay.ticketDisplay.ShowTicket(lzm_chatDisplay.ticketDisplay.GetTicketById(ticketId,true), isNew, email, chat, dialogId);
    }
};

ChatTicketClass.HandleTicketMessageClick = function(ticketId, messageNumber, _keepUI) {
    removeTicketMessageContextMenu();
    var ticket = lzm_chatDisplay.ticketDisplay.GetTicketById(ticketId);
    if(ticket != null)
    {
        var isChange = ChatTicketClass.SelectedMessageNo != messageNumber;
        var fullscreenmode = lzm_chatDisplay.ticketDisplay.isFullscreenMode();
        selectTicketMessage(ticketId, messageNumber);
        var attachmentsHtml = lzm_chatDisplay.ticketDisplay.createTicketAttachmentTable(ticket, {id:''}, messageNumber, false,'ticket-message-placeholder-tab-1');
        var messageHtml='',commentsHtml = '';

        if(isChange)
            ChatTicketClass.DisplayType = 'TEXT';

        if(ChatTicketClass.DisplayType == 'TEXT')
            messageHtml = lzm_commonTools.htmlEntities(ticket.messages[messageNumber].mt).replace(/\n/g, '<br />');
        else
            messageHtml += ChatTicketClass.GetSecureMailFrame('MESSAGE',!ChatTicketClass.DisplayInsecure,ticket.messages[messageNumber].ci);

        $('#ticket-message-text').html(messageHtml);
        $('#ticket-attachment-list').html(attachmentsHtml);
        $('#ticket-comment-list').html(commentsHtml);

        lzm_chatDisplay.ticketDisplay.UpdateMessageHeader(ticket.id,ticket.messages[messageNumber]);

        $('#message-details-inner').data('message', ticket.messages[messageNumber]);
        $('#message-details-inner').data('email', {id: ''});
        $('#message-details-inner').data('is-new', false);
        $('#message-details-inner').data('chat', {cid: ''});

        ChatTicketClass.SelectedTicketId = ticketId;
        ChatTicketClass.SelectedMessageNo = messageNumber;

        if(!fullscreenmode && !d(_keepUI))
        {
            $('#'+ticketId+'-body').append($('#ticket-message-div'));
            $('#embedded-message-details').remove();

            if(isChange || $('#ticket-message-div').css('display')!='block')
            {
                $('<tr id="embedded-message-details"><td colspan="2"></td></tr>').insertAfter('#message-line-'+ticketId+'_'+messageNumber);
                $('#embedded-message-details td').append($('#ticket-message-div'));
                $('#ticket-message-div').css('display','block');
                ChatTicketClass.SwitchDisplayType();
            }
            else
                $('#ticket-message-div').css('display','none');

            var c = $('#ticket-message-list').scrollTop();
            $('#ticket-message-list').animate({
                scrollTop: ($('#message-line-'+ticketId+'_'+messageNumber).offset().top+c)
            },500);
        }
        else if(fullscreenmode)
        {
            ChatTicketClass.SwitchDisplayType();
            $('#ticket-message-placeholder-tab-0').click();
        }
    }
    UIRenderer.resizeTicketDetails();
};

ChatTicketClass.EditTicketField = function(_ticketId, _fieldId) {

    if(lzm_commonPermissions.permissions.tickets_edit_messages==0)
    {
        showNoPermissionMessage();
        return;
    }

    var myCustomInput = null, value = null;
    var ticket = lzm_chatDisplay.ticketDisplay.GetTicketById(_ticketId);
    if(ticket != null)
    {
        var rootMessage = ticket.messages[0];
        var editHTML = '';

        if(_fieldId == 'subject')
        {
            editHTML += lzm_inputControls.createInput('edit-ticket-field-data','', rootMessage.s, tidc('subject'), '', 'text', '');
        }
        else if(_fieldId == '111')
        {
            editHTML += lzm_inputControls.createInput('edit-ticket-field-data','', rootMessage.fn, tidc('name'), '', 'text', '');
        }
        else if(_fieldId == '112')
        {
            editHTML += lzm_inputControls.createInput('edit-ticket-field-data','', rootMessage.em, tidc('email'), '', 'text', '');
        }
        else if(_fieldId == '113')
        {
            editHTML += lzm_inputControls.createInput('edit-ticket-field-data','', rootMessage.co, tidc('company'), '', 'text', '');
        }
        else if(_fieldId == '116')
        {
            editHTML += lzm_inputControls.createInput('edit-ticket-field-data','', rootMessage.p, tidc('phone'), '', 'text', '');
        }
        else
        {
            myCustomInput = DataEngine.inputList.getCustomInput(DataEngine.inputList.idList[_fieldId]);
            if(myCustomInput != null)
            {
                value = lzm_commonTools.GetElementByProperty(rootMessage.customInput,'id',myCustomInput.name);

                if(!value.length)
                {
                    value = {id:myCustomInput.name,text:''};
                    rootMessage.customInput.push(value);
                }
                else
                    value = value[0];
                editHTML = DataEngine.inputList.getControlHTML(myCustomInput,'edit-ticket-field-data','',value.text);
            }
        }

        lzm_commonDialog.createAlertDialog(editHTML, [{id: 'ok', name: t('Ok')}, {id: 'cancel', name: t('Cancel')}]);

        $('#edit-ticket-field-data').focus();
        $('#edit-ticket-field-data').select();

        $('#alert-btn-ok').click(function() {

            if(_fieldId == 'subject')
                rootMessage.s = $('#edit-ticket-field-data').val();
            else if(parseInt(_fieldId)== 111)
                rootMessage.fn = $('#edit-ticket-field-data').val();
            else if(parseInt(_fieldId)== 112)
                rootMessage.em = $('#edit-ticket-field-data').val();
            else if(parseInt(_fieldId)== 113)
                rootMessage.co = $('#edit-ticket-field-data').val();
            else if(parseInt(_fieldId)== 116)
                rootMessage.p = $('#edit-ticket-field-data').val();
            else if(myCustomInput != null)
            {
                value.text = DataEngine.inputList.getControlValue(myCustomInput,'edit-ticket-field-data');
            }

            ticket.LocalEdited = true;

            lzm_chatDisplay.ticketDisplay.updateTicketDetails(ticket);

            $('#alert-btn-cancel').click();

        });
        $('#alert-btn-cancel').click(function() {
            lzm_commonDialog.removeAlertDialog();
        });
    }
};

ChatTicketClass.HandleTicketAttachmentClick = function (attachmentNo) {
    $('.attachment-line').removeClass('selected-table-line');
    $('#attachment-line-' + attachmentNo).addClass('selected-table-line');
    $('#attachment-table').data('selected-attachment', attachmentNo);
    $('#message-attachment-table').data('selected-attachment', attachmentNo);
    $('#remove-attachment').removeClass('ui-disabled');
};

ChatTicketClass.PreviewTicketAttachment = function(url) {
    if(!lzm_chatDisplay.ticketDisplay.isFullscreenMode())
        return;
    if(url!=null)
        $('#att-img-preview-field').html('</span><img src="'+url+'">');
    else
        $('#att-img-preview-field').html('');
    UIRenderer.resizeTicketDetails();
};

ChatTicketClass.SwitchDisplayType = function(_newType){
    if(d(_newType))
        ChatTicketClass.DisplayType = _newType;
    $('#mes-display-html').removeClass('lzm-button-e-pushed');
    $('#mes-display-text').removeClass('lzm-button-e-pushed');
    $('#mes-display-' + ChatTicketClass.DisplayType.toLowerCase()).addClass('lzm-button-e-pushed');
    if(d(_newType))
        ChatTicketClass.HandleTicketMessageClick(ChatTicketClass.SelectedTicketId,ChatTicketClass.SelectedMessageNo,true);
};

ChatTicketClass.SwitchSecureContent = function(_context,_displayInsecure){
    if(_context == 'MESSAGE')
    {
        ChatTicketClass.DisplayInsecure = _displayInsecure;
        if(d(_displayInsecure))
            ChatTicketClass.HandleTicketMessageClick(ChatTicketClass.SelectedTicketId,ChatTicketClass.SelectedMessageNo,true);
    }
    else if(_context == 'EMAIL')
    {
        try
        {
            $('#email-html').html(ChatTicketClass.GetSecureMailFrame('EMAIL',false,DataEngine.emails[lzm_chatDisplay.ticketDisplay.selectedEmailNo].id));
            UIRenderer.resizeEmailDetails();
        }
        catch (ex)
        {
            console.logit(DataEngine.emails);
            console.logit(lzm_chatDisplay.ticketDisplay.selectedEmailNo);
        }
    }
};

ChatTicketClass.GetHTMLSwitch = function(_fullscreenmode,_selectedMessage){
    var dis = '',sHtml = '<div style="float:right;margin-top:2px;"><div>';
    if(d(_selectedMessage))
    {
        if(!(d(_selectedMessage.ci) && _selectedMessage.ci != '' && (_selectedMessage.t == '3'||_selectedMessage.t == '4')))
        {
            dis = 'ui-disabled';
            if(ChatTicketClass.DisplayType == 'HTML')
                ChatTicketClass.DisplayType = 'TEXT';
        }
    }
    sHtml += lzm_inputControls.createButton('mes-display-text', 'lzm-button-e-pushed', 'ChatTicketClass.SwitchDisplayType(\'TEXT\');', 'Text', '', '', {'margin-left': '4px', 'padding':(!_fullscreenmode) ? '4px 10px' : ''}, '', 20, 'e');
    sHtml += lzm_inputControls.createButton('mes-display-html', dis, 'ChatTicketClass.SwitchDisplayType(\'HTML\');', 'HTML', '', '', {'margin': '0 4px 0 -1px', 'padding':(!_fullscreenmode) ? '4px 10px' : ''}, '', 20, 'e');
    sHtml += '</div></div>';
    return sHtml;
};

ChatTicketClass.GetSecureMailFrame = function(_context,_askForSecure,_channelId){
    var framehtml = '';
    if(_askForSecure)
        framehtml = '<div id="ticket-message-insecure" class="lzm-clickable2" onclick="ChatTicketClass.SwitchSecureContent(\''+_context+'\',true);"><i class="fa fa-warning icon-orange"></i>&nbsp;&nbsp;'+tid('show_insecure')+'</div>';
    framehtml += '<iframe id="ticket-message-iframe" src="'+CommunicationEngine.chosenProfile.server_protocol + CommunicationEngine.chosenProfile.server_url + '/email.php?id='+lz_global_base64_url_encode(_channelId) + ((!_askForSecure) ? '&no_sec=1' : '')+'"></iframe>';
    return framehtml;
};

ChatTicketClass.MoveMessageToNewTicket = function(ticketId, messageNo) {
    removeTicketMessageContextMenu();
    var message = {};
    var ticket = lzm_chatDisplay.ticketDisplay.GetTicketById(ticketId);
    if (ticket != null)
        message = ticket.messages[messageNo];
    ticket = {mid: message.id, id: ticketId};
    CommunicationEngine.pollServerTicket([ticket], [], 'move-message');
};

ChatTicketClass.SendForwardedMessage = function(message, text, emailAddresses, emailSubject, ticketId, group, messageNo) {
    removeTicketMessageContextMenu();

    var exEmail = lzm_commonTools.GetElementByProperty(LocalConfiguration.EmailList,0,emailAddresses);

    var m = md5(emailAddresses).substr(0,5);
    if(!exEmail.length)
        LocalConfiguration.EmailList.push([emailAddresses,1,'1_'+m]);
    else
    {
        exEmail[0][1]++;
        exEmail[0][2] = exEmail[0][1] + '_' + m;
    }

    LocalConfiguration.EmailList = lzm_commonTools.SortByProperty(LocalConfiguration.EmailList,2,true);
    LocalConfiguration.Save();

    if (message.id == '')
    {
        var ticket = lzm_chatDisplay.ticketDisplay.GetTicketById(ticketId);
        if (ticket != null)
        {
            message = ticket.messages[messageNo];
            text = message.mt;
            emailAddresses = message.em;
            emailSubject = (typeof message.s != 'undefined') ? message.s : '';
            group = (typeof ticket.editor != 'undefined' && ticket.editor != false) ?
                ticket.editor.g : ticket.gr;
        }
    }
    ticket = {mid: message.id, gr: group, em: emailAddresses, su: emailSubject, text: text, id: ticketId};
    CommunicationEngine.pollServerTicket([ticket], [], 'forward-to');
};

ChatTicketClass.PrintTicket = function(ticketId){
    removeTicketMessageContextMenu();
    var myTicket = lzm_chatDisplay.ticketDisplay.GetTicketById(ticketId);
    if (myTicket != null)
    {
        lzm_commonTools.printContent('ticket', {ticket: myTicket});
    }
};

ChatTicketClass.PrintTicketMessage = function(ticketId, msgNo){
    removeTicketMessageContextMenu();
    var myTicket = lzm_chatDisplay.ticketDisplay.GetTicketById(ticketId);
    if (myTicket != null && myTicket.messages.length > msgNo)
    {
        lzm_commonTools.printContent('message', {ticket: myTicket, msgNo: msgNo});
    }
};

ChatTicketClass.CancelTicketReply = function(ticketId) {
    var doCancel = function()
    {
        TaskBarManager.RemoveActiveWindow();
        TaskBarManager.GetWindow(ticketId).Maximize();
    };
    var cancel = false;
    if($('#ticket-reply-input').val().length)
    {
        lzm_commonDialog.createAlertDialog(tid('close_confirm'), [{id: 'ok', name: t('Ok')}, {id: 'cancel', name: t('Cancel')}]);
        $('#alert-btn-ok').click(function()
        {
            $('#alert-btn-cancel').click();
            doCancel();
        });
        $('#alert-btn-cancel').click(function()
        {
            lzm_commonDialog.removeAlertDialog();
        });
    }
    else
        doCancel();
};

ChatTicketClass.AddComment = function(ticketId, menuEntry) {

    removeTicketMessageContextMenu();
    ticketId = (typeof ticketId != 'undefined') ? ticketId : lzm_chatDisplay.selectedTicketRow;

    var messageNo = -1;
    if($('#ticket-history-table').length)
        messageNo = $('#ticket-history-table').data('selected-message');

    var ticket = {}, message = {};
    for (var i=0; i<lzm_chatDisplay.ticketListTickets.length; i++)
    {
        if (lzm_chatDisplay.ticketListTickets[i].id == ticketId)
        {
            ticket = lzm_chatDisplay.ticketListTickets[i];

            if(messageNo==-1)
                messageNo = ticket.messages.length-1;

            message = ticket.messages[messageNo];
        }
    }
    lzm_chatDisplay.ticketDisplay.AddMessageComment(ticket.id, message, menuEntry);
};

ChatTicketClass.SwitchCommentType = function(_type){
    if(_type=='FILE')
    {
        $('#add-comment-file').addClass('lzm-button-e-pushed');
        $('#add-comment-text').removeClass('lzm-button-e-pushed');
        $('#new-comment-field').parent().css('display','none');
        $('#new-comment-file').parent().parent().parent().css('display','block');
    }
    else
    {
        $('#add-comment-text').addClass('lzm-button-e-pushed');
        $('#add-comment-file').removeClass('lzm-button-e-pushed');
        $('#new-comment-field').parent().css('display','block');
        $('#new-comment-file').parent().parent().parent().css('display','none');
    }
};

ChatTicketClass.SetFileToComment = function(_file){
    $('#add-comment-file').removeClass('lzm-button-e-pushed');
    $('#new-comment-field').val('[__[cfile:'+_file.uploadFileId+','+_file.uploadFileName+']__]');
    $('#alert-btn-ok').click();
};

ChatTicketClass.GetCommentText = function(_comment){
    var ctext = lzm_commonTools.htmlEntities(_comment.text);
    if(ctext.indexOf('[__[cfile:')==0)
    {
        ctext = ctext.replace('[__[cfile:','').replace(']__]','');
        ctext = ctext.split(',');
        var fid = ctext[0];
        var fname = lz_global_base64_decode(ctext[1]);
        ctext = '<a target="_blank" style=" background:#fff !important;color:#5197ff !important;" href="' + KnowledgebaseUI.GetFileURL({rid:fid,ti:fname}) + '">' + lzm_commonTools.htmlEntities(fname) + '</a>';
    }
    return ctext;
};

ChatTicketClass.HandleTicketTreeClickEvent = function(_id,_parent,_subStatus,_initPoll){

    _initPoll = (d(_initPoll)) ? _initPoll : true;
    _parent = (d(_parent)) ? _parent : null;
    _subStatus = (d(_subStatus)) ? _subStatus : null;

    $('#ticket-list-tree div').removeClass('selected-treeview-div');
    $('#'+_id).addClass('selected-treeview-div');

    LocalConfiguration.TicketTreeCategoryParent = (_parent != null) ? _parent : '';
    LocalConfiguration.TicketTreeCategorySubStatus = (_subStatus != null) ? _subStatus : '';
    LocalConfiguration.TicketTreeCategory = _id;
    LocalConfiguration.Save();

    if(lzm_chatDisplay.ticketDisplay.CategorySelect)
    {
        lzm_chatDisplay.ticketDisplay.CategorySelect = false;
        UIRenderer.resizeTicketList();
    }

    var value = "";
    value += ((_id == "tnFilterStatusActive" || _id == "tnFilterStatusOpen" || LocalConfiguration.TicketTreeCategoryParent == "tnFilterStatusOpen") ? '1' : '0');
    value += ((_id == "tnFilterStatusActive" || _id == "tnFilterStatusInProgress" || LocalConfiguration.TicketTreeCategoryParent == "tnFilterStatusInProgress")? '1' : '0');
    value += ((_id == "tnFilterStatusClosed" || LocalConfiguration.TicketTreeCategoryParent == "tnFilterStatusClosed")? '1' : '0');
    value += ((_id == "tnFilterStatusDeleted" || LocalConfiguration.TicketTreeCategoryParent == "tnFilterStatusDeleted")? '1' : '0');
    value += ((_id == "tnFilterMyTickets" || LocalConfiguration.TicketTreeCategoryParent == "tnFilterMyTickets")? '1' : '0');
    value += ((_id == "tnFilterMyGroupsTickets" || LocalConfiguration.TicketTreeCategoryParent == "tnFilterMyGroupsTickets")? '1' : '0');

    if(_subStatus != null)
        CommunicationEngine.ticketFilterSubStatus = _subStatus;
    else
        CommunicationEngine.ticketFilterSubStatus = null;

    CommunicationEngine.ticketFilterPersonal = value.substr(4, 1) == "1";
    CommunicationEngine.ticketFilterGroup = value.substr(5, 1) == "1";
    CommunicationEngine.ticketFilterWatchList = (_id == 'tnFilterWatchList');

    var f = "";
    f += value.substr(0, 1) == "1" || CommunicationEngine.ticketFilterPersonal || CommunicationEngine.ticketFilterGroup ? "0" : "";
    f += value.substr(1, 1) == "1" || CommunicationEngine.ticketFilterPersonal || CommunicationEngine.ticketFilterGroup ? "1" : "";
    f += value.substr(2, 1) == "1" ? "2" : "";
    f += value.substr(3, 1) == "1" ? "3" : "";

    CommunicationEngine.ticketFilterStatus = f;

    if(_initPoll)
        toggleTicketFilter();
};

ChatTicketClass.SendTicketMessage = function(ticket, receiver, cc, bcc, subject, message, comment, attachments, messageId, previousMessageId, addToWL, _ctor) {
    var ticketFetchTime = DataEngine.ticketFetchTime;
    DataEngine.expectTicketChanges = true;
    UserActions.sendTicketReply(ticket, receiver, cc, bcc, subject, message, comment, attachments, messageId, previousMessageId, addToWL, _ctor);
    switchTicketListPresentation(ticketFetchTime, 0, ticket.id);
};


