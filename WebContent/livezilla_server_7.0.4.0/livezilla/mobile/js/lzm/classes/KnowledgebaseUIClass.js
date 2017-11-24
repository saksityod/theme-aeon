/****************************************************************************************
 * LiveZilla KnowledgebaseUI.js
 *
 * Copyright 2017 LiveZilla GmbH
 * All rights reserved.
 * LiveZilla is a registered trademark.
 *
 ***************************************************************************************/

function KnowledgebaseUI() {
    this.SelectedResourceTab = 0;
    this.openedResourcesFolder = ['1'];
    this.KBSearchCategories = ['ti', 't', 'text'];
    this.qrdChatPartner = '';
    this.qrdTreeDialog = {};
    this.resources = [];
    this.qrdSearchResults = [];

    this.CacheResourceList = null;
    this.CachePreparedResources = null;
    this.CacheRecentlyResources = null;
    this.ShowPreview = true;
    this.CacheUIValid = false;
    this.CacheDataValid = false;
}

KnowledgebaseUI.PreviewResourceId = null;
KnowledgebaseUI.CopyResource = null;
KnowledgebaseUI.CutResource = null;
KnowledgebaseUI.FileToUpload = null;
KnowledgebaseUI.TextEditor = null;
KnowledgebaseUI.QuickSearchReady = false;
KnowledgebaseUI.ShortCutResources = [];
KnowledgebaseUI.DraftResources = [];
KnowledgebaseUI.IsSyncing = false;
KnowledgebaseUI.IsLoading = false;

KnowledgebaseUI.prototype.setLoading = function(loading){
    if(!loading){
        if($('#qrd-tree-loading') != null)
            $('#qrd-tree-loading').remove();
    }
    else{
        var loadingHtml = '<div id="qrd-tree-loading"><div class="lz_anim_loading"></div></div>';
        $('#qrd-tree').append(loadingHtml).trigger('create');
        $('#qrd-tree-loading').css({position: 'absolute',left:0,top:0,bottom:0,right:0,'background-color': '#ffffff','z-index': 1000, opacity: 0.85});
    }

    var sd = $('.selected-resource-div');
    if(sd.length)
        KnowledgebaseUI.HandleResourceClickEvents(lzm_chatDisplay.selectedResource,true);
};

KnowledgebaseUI.prototype.createQrdTree = function(caller, chatPartner){
    var i,that = this;
    var chatPartnerName = lzm_displayHelper.getChatPartner(chatPartner)['name'];
    //this.InDialog = false;
    if(this.CacheUIValid){

        $('#kb-button-line').html(this.createButtonLine(caller, chatPartner, chatPartnerName));
        this.setLoading(false);
        return;
    }

    this.cacheResources();
    that.qrdChatPartner = chatPartner;

    $('#qrd-tree-body').data('chat-partner', chatPartner);
    $('#qrd-tree-body').data('in-dialog', false);

    var resources = that.CachePreparedResources[0];
    that.resources = resources;
    var allResources = that.CachePreparedResources[1];
    var topLayerResource = that.CachePreparedResources[2];
    var thisQrdTree = $('#qrd-tree');
    var treeString = that.createQrdTreeTopLevel(topLayerResource, chatPartner, false);
    var searchString = that.createQrdSearch(chatPartner, false);

    if(that.CacheRecentlyResources == null)
        that.CacheRecentlyResources = that.createQrdRecently(chatPartner, false);

    var qrdTreeHtml = '<div id="qrd-tree-headline" class="lzm-dialog-headline"></div>' +
        '<div id="qrd-tree-body" class="lzm-dialog-body" onclick="removeKBContextMenu();">' +
            '<div id="qrd-tree-placeholder"></div></div>' +
        '<div id="qrd-tree-headline" class="lzm-dialog-headline2">' +
        '<span class="lzm-dialog-hl2-info" id="qrd-info"></span><span id="kb-button-line" style="padding-top:4px;float:right;">' + this.createButtonLine(caller, chatPartner, chatPartnerName) + '</span></div>';

    thisQrdTree.html(qrdTreeHtml).trigger('create');

    lzm_displayHelper.createTabControl('qrd-tree-placeholder',
        [
            {name: t('All Resources'), content: treeString},
            {name: tid('search'), content: searchString},
        ],
        that.SelectedResourceTab);

    that.fillQrdTree(resources, chatPartner, false);

    for (i=0; i<allResources.length; i++) {
        if ($('#folder-' + allResources[i].rid).html() == "")
        {
            $('#resource-' + allResources[i].rid + '-open-mark').css({background: 'none'})
        }
    }

    this.updateKBInfo(that.CachePreparedResources[1].length);
    UIRenderer.resizeResources();

    for (i=0; i<that.openedResourcesFolder.length; i++)
        KnowledgebaseUI.HandleResourceClickEvents(that.openedResourcesFolder[i], true);

    $('#search-qrd').keyup(function(e) {
        lzm_chatDisplay.searchButtonUp('qrd', allResources, e, false);
    });
    $('#search-resource').keyup(function(e) {
        lzm_chatDisplay.searchButtonUp('qrd-list', allResources, e, false);
    });
    $('.qrd-search-by').change(function() {
        setTimeout('lzm_chatDisplay.resourcesDisplay.fillQrdSearchList("'+that.qrdChatPartner+'", false);',10);
    });
    $('#search-resource-icon').click(function() {
        $('#search-resource').val('');
        $('#search-resource').keyup();
    });
    $('.qrd-tree-placeholder-tab').click(function() {

        var oldSelectedTabNo = that.SelectedResourceTab;
        that.SelectedResourceTab = parseInt($(this).data('tab-no'));
        $('#kb-button-line').html(that.createButtonLine(caller, chatPartner, chatPartnerName));
        if (oldSelectedTabNo != that.SelectedResourceTab) {
            var newSelectedResource = lzm_chatDisplay.tabSelectedResources[that.SelectedResourceTab];
            lzm_chatDisplay.tabSelectedResources[oldSelectedTabNo] = lzm_chatDisplay.selectedResource;
            KnowledgebaseUI.HandleResourceClickEvents(newSelectedResource, true);
        }
        if (that.SelectedResourceTab != 0)
            $('#add-qrd').addClass('ui-disabled');


        UIRenderer.resizeResources();
    });
    this.CacheUIValid = true;
    this.setLoading(false);
};

KnowledgebaseUI.prototype.createButtonLine = function(caller){

    var html = '',sendButton=null,toChat='';
    var chatObj = DataEngine.ChatManager.GetChat();
    var isChatPartner = (chatObj != null && ((chatObj.GetStatus() != Chat.Closed && chatObj.GetMember(DataEngine.myId) != null) || chatObj.Type != Chat.Visitor));

    if(isChatPartner)
    {
        sendButton = lzm_inputControls.createButton('send-qrd-preview', 'lzm-button-b-active ui-disabled qrd-change-buttons', 'sendQrdPreview(\'\', \'' + chatObj.SystemId + '\');',t('To <!--chat-partner-->',[['<!--chat-partner-->',chatObj.GetName()]]), '', 'lr',{'margin-left': '2px'}, '', 30, '');
        toChat = chatObj.SystemId;
    }
    if (caller == 'view-select-panel')
    {
        if(sendButton!=null)
            html += sendButton;

        html += lzm_inputControls.createButton('add-qrd', 'ui-disabled qrd-change-buttons', 'KnowledgebaseUI.ShowKBAddMenu(event);', tid('resource_add'), '<i class="fa fa-plus"></i>', 'lr', {'margin-right': '4px'},'',-1,'e');
        html += lzm_inputControls.createButton('edit-qrd', 'ui-disabled qrd-change-buttons', 'editQrd();', tid('resource_edit2'), '<i class="fa fa-edit"></i>', 'lr', {'margin-left': '0'},'',-1,'e');
        html += lzm_inputControls.createButton('show-qrd-settings', 'ui-disabled qrd-change-buttons', 'KnowledgebaseUI.InitKBEntrySettings(null,\'\', \'qrd-tree\');', tid('settings'), '<i class="fa fa-gears"></i>', 'lr', {'margin-left': '-1px'},'',-1,'e');
        html += lzm_inputControls.createButton('delete-qrd', 'ui-disabled qrd-change-buttons', 'deleteQrd();', tid('resource_remove'), '<i class="fa fa-remove"></i>', 'lr', {'margin-left': '-1px','margin-right': '4px'},'',-1,'e');

        if(this.SelectedResourceTab==0)
            html += lzm_inputControls.createButton('sync-kb', '', 'KnowledgebaseUI.Synchronize();', tid('synchronize'), '<i class="fa fa-refresh"></i>', 'lr', {'margin-right': '4px'},'',-1,'e');
    }
    else
    {
        if(sendButton!=null)
            html += sendButton;

        html += lzm_inputControls.createButton('cancel-qrd', '', 'cancelQrd(\'\',\''+toChat+'\');', tid('cancel'), '', 'lr', {'margin-left': '5px'},'',30,'d');
    }
    return html;
};

KnowledgebaseUI.prototype.updateKBInfo = function(count){
    if(KnowledgebaseUI.IsLoading)
        $('#qrd-info').html('<b>'+tid('loading')+' ...</b>');
    else if(count>1)
        $('#qrd-info').html(tid('total_entries',[['<!--total-->',count]]));
    else
        $('#qrd-info').html('');
    if(lzm_chatDisplay.windowWidth<500)
        $('#qrd-info').css({display:'none'});
};

KnowledgebaseUI.prototype.invalidateCache = function(){
    this.CacheResourceList = null;
    this.CachePreparedResources = null;
    this.CacheRecentlyResources = null;

    this.CacheUIValid = false;
    this.CacheDataValid = false;
};

KnowledgebaseUI.prototype.cacheResources = function(){
    if(this.CacheResourceList == null)
        this.CacheResourceList = DataEngine.cannedResources.getResourceList();
    if(this.CachePreparedResources == null)
        this.CachePreparedResources = this.prepareResources(this.CacheResourceList);
    this.CacheDataValid = true;
};

KnowledgebaseUI.prototype.createQrdTreeDialog = function(resources, _context, menuEntry, _ticketWindow) {

    this.CacheUIValid = false;
    var i,that = this;

    //this.InDialog = true;
    that.qrdChatPartner = _context;

    var saveResourceSelector = (_context.indexOf('TICKET SAVE') != -1);
    var loadResourceSelector = (_context.indexOf('TICKET LOAD') != -1);
    var hostElementId = _context.split('~')[1];
    var preparedResources = null, allResources= null, topLayerResource = null;

    if(resources == null)
    {
        if(!this.CacheDataValid)
        {
            this.cacheResources();
        }
        resources = that.CachePreparedResources[0];
        that.resources = resources;
        allResources = that.CachePreparedResources[1];
        topLayerResource = that.CachePreparedResources[2];
    }
    else
    {
        preparedResources = that.prepareResources(resources);
        resources = preparedResources[0];
        that.resources = resources;
        allResources = preparedResources[1];
        topLayerResource = preparedResources[2];
    }

    menuEntry = (typeof menuEntry != 'undefined') ? menuEntry : '';

    $('#qrd-tree-body').data('chat-partner', _context);
    $('#qrd-tree-body').data('in-dialog', true);

    var chatObj,closeToTicket = '',closeToChat='',storedDialogImage = '';
    if (_context.indexOf('TICKET LOAD') == -1 && _context.indexOf('TICKET SAVE') == -1 && _context.indexOf('ATTACHMENT') == -1)
    {
        chatObj = DataEngine.ChatManager.GetChat();
        closeToChat = chatObj.SystemId;
    }
    else
    {
        closeToTicket = hostElementId;
        storedDialogImage = '<i class="fa fa-envelope"></i>';
    }

    var sbTitle = (!saveResourceSelector) ? t('Save Resource'): tid('select_folder');
    var footerString = '';

    if (typeof _context != 'undefined' && _context != '')
    {
        if (_context.indexOf('TICKET LOAD') == -1 && _context.indexOf('TICKET SAVE') == -1 && _context.indexOf('ATTACHMENT') == -1)
            footerString += lzm_inputControls.createButton('d-send-qrd-preview', 'ui-disabled qrd-change-buttons', 'sendQrdPreview(\'\', \'' + _context + '\');',t('To <!--chat-partner-->',[['<!--chat-partner-->',chatObj.GetName()]]), '', 'lr',{'margin-left': '5px', 'margin-top': '-5px'},'',30,'d');
        else if (_context.indexOf('TICKET SAVE') == -1 && _context.indexOf('ATTACHMENT') == -1)
            footerString +=  lzm_inputControls.createButton('insert-qrd-preview', 'ui-disabled qrd-change-buttons', 'insertQrdIntoTicket(\'' + closeToTicket + '\');',t('Insert Resource'), '', 'lr', {'margin-left': '5px', 'margin-top': '-5px'},'',30,'d');
        else if (_context.indexOf('ATTACHMENT') == -1)
            footerString +=  lzm_inputControls.createButton('add-or-edit-qrd', 'ui-disabled qrd-change-buttons', 'addOrEditResourceFromTicket(\'' + closeToTicket + '\');',sbTitle, '', 'lr', {'margin-left': '5px', 'margin-top': '-5px'},'',30,'d');
        else
            footerString +=  lzm_inputControls.createButton('add-qrd-attachment', 'ui-disabled qrd-change-buttons', 'addQrdAttachment(\'' + closeToTicket + '\');',t('Attach Resource'), '', 'lr',{'margin-left': '5px', 'margin-top': '-5px'},'',30,'d');
    }

    footerString +=  lzm_inputControls.createButton('cancel-qrd', '', 'cancelQrd(\'' + closeToTicket + '\',\'' + closeToChat + '\');', t('Cancel'), '', 'lr', {'margin-left': '5px'},'',30,'d');

    var treeString = that.createQrdTreeTopLevel(topLayerResource, _context, true);
    var searchString = (!saveResourceSelector) ? that.createQrdSearch(_context, true) : '';

    var dialogData = {'exceptional-img': storedDialogImage};

    if (_context.indexOf('TICKET LOAD') == -1 && _context.indexOf('TICKET SAVE') == -1 && _context.indexOf('ATTACHMENT') == -1)
        dialogData = {'chat-partner': chatObj.SystemId, 'chat-partner-name': chatObj.GetName(), 'chat-partner-userid': chatObj.v};

    if (_context.indexOf('ATTACHMENT') != -1 || _context.indexOf('TICKET LOAD') != -1 || _context.indexOf('TICKET SAVE') != -1)
        dialogData.menu = menuEntry

    var headerString = (saveResourceSelector) ? tid('select_folder') : tid('knowledgebase');
    var bodyString = '<div id="qrd-tree-dialog-placeholder"></div>';

    var taskBarIndex = (_ticketWindow != null) ? _ticketWindow.TaskBarIndex : null;
    var dialogId = lzm_commonDialog.CreateDialogWindow(headerString, bodyString, footerString, 'database','qrd-tree-dialog-'+md5(hostElementId),'qrd-tree-dialog-'+md5(hostElementId),'cancel-qrd',true, dialogData, true, taskBarIndex);
    var tabList = [];

    tabList.push({name: t('All Resources'), content: treeString});
    if(!saveResourceSelector)
    {
        tabList.push({name: t('Quick Search'), content: searchString});
    }
    else
        tabList[0].name = tidc('select_folder','...');

    var selectedTab = that.SelectedResourceTab;

    if(saveResourceSelector)
        selectedTab = 0;
    else if(loadResourceSelector)
        selectedTab = 1;

    lzm_displayHelper.createTabControl('qrd-tree-dialog-placeholder', tabList, selectedTab);

    $('.qrd-tree-dialog-placeholder-content').css({height: ($('#qrd-tree-dialog-'+md5(hostElementId)+'-body').height() - 28) + 'px'});
    var resultListHeight = $('#qrd-tree-dialog-body').height() - $('#d-search-input').height() - 89;
    $('#d-search-results').css({'min-height': resultListHeight + 'px'});
    $('#all-resources-dialog').css({'min-height': ($('#qrd-tree-dialog-body').height() - 62) + 'px'});

    that.fillQrdTree(resources, _context, true);

    for (i=0; i<allResources.length; i++)
        if ($('#d-folder-' + allResources[i].rid).html() == "")
            $('#d-resource-' + allResources[i].rid + '-open-mark').css({background: 'none'})

    for (i=0; i<that.openedResourcesFolder.length; i++)
        KnowledgebaseUI.HandleResourceClickEvents(that.openedResourcesFolder[i], true);

    $('#d-search-resource').keyup(function(e) {
        lzm_chatDisplay.searchButtonUp('qrd-list', allResources, e, true);
    });
    $('.qrd-d-search-by').change(function() {
        setTimeout('lzm_chatDisplay.resourcesDisplay.fillQrdSearchList("'+that.qrdChatPartner+'", true);',10);
    });
    $('#d-search-resource-icon').click(function() {
        $('#d-search-resource').val('');
        $('#d-search-resource').keyup();
    });
    $('.qrd-tree-dialog-placeholder-tab').click(function() {
        var oldSelectedTabNo = that.SelectedResourceTab;
        UIRenderer.resizeResources();
        that.SelectedResourceTab = parseInt($(this).data('tab-no'));
        if (oldSelectedTabNo != that.SelectedResourceTab) {
            var newSelectedResource = lzm_chatDisplay.tabSelectedResources[that.SelectedResourceTab];
            lzm_chatDisplay.tabSelectedResources[oldSelectedTabNo] = lzm_chatDisplay.selectedResource;
            KnowledgebaseUI.HandleResourceClickEvents(newSelectedResource, true);
        }
    });

    if(selectedTab==1)
        $('#d-search-resource').focus();
    UIRenderer.resizeResources();
    return dialogId;
};

KnowledgebaseUI.prototype.fillQrdTree = function(resources, chatPartner, inDialog) {
    var tmpResources, alreadyUsedIds, counter = 0, rank = 1, i, that = this;
    var sid = (inDialog) ? 'd-' : '';
    while (resources.length > 0 && counter < 10000)
    {
        tmpResources = [];
        alreadyUsedIds = [];
        counter++;

        for (i=0; i<resources.length; i++)
        {
            if (rank == this.CalculateRank(resources[i]))
            {
                resources[i].ra = rank;
                var resourceHtml = that.GetResourceHTML(resources[i], chatPartner, inDialog);
                $('#'+sid+'folder-' + resources[i].pid).append(resourceHtml);
                alreadyUsedIds.push(resources[i].rid);
            }
        }
        for (i=0; i<resources.length; i++)
        {
            if ($.inArray(resources[i].rid, alreadyUsedIds) == -1)
            {
                tmpResources.push(resources[i]);
            }
        }
        rank++;
        if (resources.length == tmpResources.length)
        {
            //counter = 1000;
        }
        resources = tmpResources;
    }
};

KnowledgebaseUI.prototype.fillQrdSearchList = function(_caller, inDialog) {
    var that = this, searchCategories =  ['ti', 't', 'text'];

    that.KBSearchCategories = [];
    var sid = (inDialog) ? 'd-' : '';

    for (var i=0; i<searchCategories.length; i++)
    {
        if ($('#'+sid+'search-by-' + searchCategories[i]).attr('checked') == 'checked') {
            that.KBSearchCategories.push(searchCategories[i]);
        }
    }

    var searchString = $('#'+sid+'search-resource').val();
    if(d(searchString))
        searchString = $('#'+sid+'search-resource').val().replace(/^ */, '').replace(/ *$/, '');
    else
        searchString = '';

    $('#'+sid+'search-result-table').children('tbody').html(that.CreateQrdSearchResults(searchString, _caller, inDialog));
};

KnowledgebaseUI.prototype.highlightSearchResults = function(resources, isNewSearch) {
    var sid = (KnowledgebaseUI.RunsInDialog()) ? 'd-' : '';
    var that = this;
    if (isNewSearch) {
        var searchString = $('#search-qrd').val().replace(/^ */, '').replace(/ *$/, '').toLowerCase();
        if (searchString != '') {
            var i, j;
            that.qrdSearchResults = [];
            for (i=0; i<resources.length; i++) {
                if (resources[i].text.toLowerCase().indexOf(searchString) != -1 ||
                    resources[i].ti.toLowerCase().indexOf(searchString) != -1) {
                    that.qrdSearchResults.push(resources[i]);
                }
            }
        }
        else
            that.qrdSearchResults = [];
    }

    if (isNewSearch) {
        var openedResourceFolders = that.openedResourcesFolder;
        $('.resource-div').css({'background-color': '#FFFFFF', color: '#000000'});
        for (i=0; i<openedResourceFolders.length; i++) {
            openOrCloseFolder(openedResourceFolders[i], false, true);
        }
    }
    for (i=0; i<that.qrdSearchResults.length; i++) {
        $('#'+sid+'resource-' + that.qrdSearchResults[i].rid).css({'background-color': '#FFFFC6', color: '#000000', 'border-radius': '4px'});
        var parentId = that.qrdSearchResults[i].pid, counter = 0;
        if (isNewSearch) {
            while (parentId != 0 && counter < 1000) {
                for (j=0; j<resources.length; j++) {
                    if(resources[j].ty == 0 && resources[j].rid == parentId) {
                        openOrCloseFolder(resources[j].rid, true, true);
                        parentId = resources[j].pid;
                    }
                }
                counter++;
            }
        }
    }
};

KnowledgebaseUI.prototype.editQrd = function(resource, ticketId, inDialog) {

    inDialog = (typeof inDialog != 'undefined') ? inDialog : false;
    ticketId = (typeof ticketId != 'undefined') ? ticketId : '';

    var headerString = (resource != null && resource.ti.length) ? lzm_commonTools.SubStr(resource.ti,20,true) : t('Edit Resource');
    var footerString = '';

    if (!inDialog)
    {
        footerString += '<span style="float: left;">';
        footerString += lzm_inputControls.createButton('edited-qrd-settings', '', 'KnowledgebaseUI.InitKBEntrySettings(null,'+resource.ty+',\'edit-resource\');', t('Settings'), '<i class="fa fa-gears"></i>', 'lr',{'margin-left': '4px'},'',30,'d');
        footerString += '</span>';
    }

    footerString += lzm_inputControls.createButton('save-edited-qrd', '', '', t('Ok'), '', 'lr',{'margin-left': '4px'},'',30,'d') +
                    lzm_inputControls.createButton('cancel-edited-qrd', '', '', tid('cancel'), '', 'lr',{'margin-left': '4px'},'',30,'d');

    var qrdEditFormString = '<div id="edit-resource" class="lzm-fieldset"' +
        ' data-is_public="' + resource.p + '" data-full_text_search="' + resource.f + '" data-shorcut_word="' + resource.s + '"' +
        ' data-allow_bot="' + resource.ba + '" data-languages="' + resource.l + '" data-tags="' + resource.t + '">' +
        '<div id="edit-resource-inner">' +
        '<div id="qrd-edit-title-div" class="top-space-half qrd-edit-resource qrd-edit-html-resource qrd-edit-folder-resource qrd-edit-link-resource" style="margin-top: 0;">'
        + lzm_inputControls.createInput('qrd-edit-title', 'resource-input-new', lzm_commonTools.escapeHtml(resource.ti), tidc('title'), '', 'text', '') +
        '</div><div class="qrd-edit-resource qrd-edit-html-resource top-space" id="qrd-edit-text-div"><label for="qrd-edit-text">' + tidc('text') + '</label>' +
        '<div id="qrd-edit-text-inner">';

    qrdEditFormString += '<div id="qrd-edit-text-controls">' + lzm_inputControls.CreateInputControlPanel('basic','',true).replace(/lzm_chatInputEditor/g,'KnowledgebaseUI.TextEditor') + '</div>';
    qrdEditFormString += '<div id="qrd-edit-text-body"><textarea id="qrd-edit-text" data-role="none"></textarea></div></div></div>';

    if(resource.ty == 2)
        qrdEditFormString += '<div class="qrd-edit-resource qrd-edit-link-resource top-space">' + lzm_inputControls.createInput('qrd-edit-url', 'resource-input-url-new', resource.text.replace(/\"/g,''), tidc('url'), '', 'text', '') + '</div>';

    qrdEditFormString += '</div></div>';

    var dialogData = {editors: [{id: 'qrd-edit-text', instanceName: 'KnowledgebaseUI.TextEditor'}], 'resource-id': resource.rid,menu: t('Edit Resource <!--resource_title-->',[['<!--resource_title-->', resource.ti]])};

    if (ticketId != '')
        dialogData['exceptional-img'] = '<i class="fa fa-envelope"></i>';

    if (inDialog)
    {
        var taskbarIndex = TaskBarManager.GetActiveWindow().TaskBarIndex;
        TaskBarManager.RemoveActiveWindow();
        lzm_commonDialog.CreateDialogWindow(headerString, qrdEditFormString, footerString, 'database', 'qrd-edit-'+md5(ticketId), 'qrd-edit-'+md5(ticketId), 'cancel-edited-qrd', true, dialogData, true, taskbarIndex);
    }
    else
    {
        lzm_commonDialog.CreateDialogWindow(headerString, qrdEditFormString, footerString, 'database', 'qrd-edit-'+md5(resource.rid), 'qrd-edit-'+md5(resource.rid), 'cancel-edited-qrd', true, dialogData, resource.ty == 1);
    }

    this.StoreResourceValuesInNode('edit-resource',resource.p,resource.f,resource.s,resource.ba,resource.l,resource.t,resource.rid,resource.oid,resource.g);

    UIRenderer.resizeEditResources();
};

KnowledgebaseUI.prototype.ShowKBEntrySettings = function(_resource, editorText, caller) {

    var that = this,disabled,winObj,i,headerString = tid('settings');
    var footerString = lzm_inputControls.createButton('save-qrd-settings', '', '', t('Ok'), '', 'lr', {'margin-left': '4px'}, '', 30,'d') + lzm_inputControls.createButton('cancel-qrd-settings', '', '', t('Cancel'), '', 'lr', {'margin-left': '4px'}, '', 30,'d');
    var bodyString = '<div id="qrd-settings-placeholder"></div>';

    var entryIsPublic = (_resource.p == 1 || _resource.isPublic == 1) ? ' checked="checked"' : '';
    var entryUsedByBots = (_resource.ba == 1 || _resource.allowBotAccess == 1) ? ' checked="checked"' : '';
    var useFullTextSearch = (_resource.f == 1 || _resource.fullTextSearch == 1) ? ' checked="checked"' : '';

    var tagsText = (d(_resource.t)) ? _resource.t : '';
    var shortcutText = (d(_resource.s)) ? _resource.s : (d(_resource.shortcutWord)) ? _resource.shortcutWord : '';
    var languageText = (d(_resource.l)) ? _resource.l : (d(_resource.languages)) ? _resource.languages : '';

    // id
    var rid = (typeof _resource.rid != 'undefined') ? _resource.rid : '';
    disabled = (d(_resource.draft)) ? 'ui-disabled' : '';
    var knbContent = '<fieldset class="lzm-fieldset" id="qrd-knb-id"><legend>' + tid('entry') + '</legend>' + lzm_inputControls.createInput('qrd-knb-id-text', disabled, rid, t('ID:'), '', 'text', '') + '</fieldset>';

    // owner operator
    var ownerOPArray = [], ownerGRArray = [];
    var operators = DataEngine.operators.getOperatorList('name','',true,false);

    for (i=0; i<operators.length; i++)
        ownerOPArray.push({value: operators[i].id, text: operators[i].name});

    ownerGRArray.push({value: '', text: '-'});
    var groups = DataEngine.groups.getGroupList('id',true,false);
    for (i=0; i<groups.length; i++)
        ownerGRArray.push({value: groups[i].id, text: groups[i].id});

    knbContent += '<fieldset class="lzm-fieldset" id="qrd-knb-owner-fs"><legend>' + tid('owner') + '</legend>';
    knbContent += '<label for="qrd-knb-owner-op-id-fs">' + tid('operator2') + '</label>' + lzm_inputControls.createSelect("qrd-knb-owner-op-id-fs", 'bottom-space', '', '', {position: 'right', gap: '0px'}, {}, tid('operator2'), ownerOPArray, _resource.oid, '');

    if(_resource.ty == 0)
    {
        var groupDisabeld = (lzm_commonPermissions.permissions.resources_write < 3) ? 'ui-disabled' : '';
        knbContent += '<label for="qrd-knb-owner-gr-id-fs">' + tidc('group') + '</label>' + lzm_inputControls.createSelect("qrd-knb-owner-gr-id-fs", groupDisabeld, '', '', {position: 'right', gap: '0px'}, {}, tid('group2'), ownerGRArray, _resource.g, '');
    }

    knbContent += '</fieldset>';

    knbContent += '<fieldset class="lzm-fieldset" id="qrd-knb-pub-acc-fs"><legend>' + t('Public Access') + '</legend><div><input type="checkbox" class="checkbox-custom" id="qrd-knb-pub-entry"' + entryIsPublic + ' /><label for="qrd-knb-pub-entry" class="checkbox-custom-label">' + tid('public_knb') + '</label></div>';
    var botsDisabled = (_resource.ty == 0) ? 'ui-disabled ' : '';
    knbContent += '<div class="' + botsDisabled + '"><input type="checkbox" class="checkbox-custom" id="qrd-knb-pub-bot"' + entryUsedByBots + ' /><label for="qrd-knb-pub-bot" class="checkbox-custom-label">' + t('Bots will use this resource (Virtual Assistance)') + '</label></div></fieldset>';

    if(KnowledgebaseUI.ResourceIsFile(_resource))
    {
        knbContent += '<fieldset class="lzm-fieldset top-space" id="qrd-knb-direct-access-fs"><legend>Download</legend>';
        knbContent += '<div>'+lzm_inputControls.createInput('qrd-knb-access-url', '', KnowledgebaseUI.GetFileURL(_resource), 'Download URL:', '', 'text', '') +'</div>';
        knbContent += '</fieldset>';
    }
    else if(_resource.ty>0)
    {
        knbContent += '<fieldset class="lzm-fieldset top-space" id="qrd-knb-direct-access-fs"><legend>' + tid('direct_access') + '</legend>';
        knbContent += '<div>'+lzm_inputControls.createInput('qrd-knb-access-url', '', KnowledgebaseUI.GetAccessUrl(_resource), tid('direct_access')+' URL:', '', 'text', '') +'</div>';
        knbContent += '</fieldset>';
    }

    var fulltextDisabled = (_resource.ty == 0) ? ' class="ui-disabled"' : '';
    knbContent += '<fieldset class="lzm-fieldset" id="qrd-knb-search-fs"><legend>' + t('Search') + '</legend><div' + fulltextDisabled + '><input type="checkbox" class="checkbox-custom" id="qrd-knb-search-full"' + useFullTextSearch + ' /><label for="qrd-knb-search-full" class="checkbox-custom-label">' + t('Fulltext Search (slower)') + '</label></div></fieldset>';

    var shortcutDisabeld = (_resource.ty == 0) ? 'ui-disabled' : '';
    knbContent += '<fieldset class="lzm-fieldset top-space" id="qrd-knb-shortcuts-fs"><legend>' + t('Shortcuts') + '</legend>' + lzm_inputControls.createInput('qrd-knb-shortcuts-text', shortcutDisabeld, shortcutText, t('Shortcut (word, global)'), '<span class="icon-blue" style="font-weight:bold;">/</span>', 'text', 'a') + '<div class="top-space-half lzm-info-text">' + t('Example: /welcome') + '</div></fieldset>';
    knbContent += '<fieldset class="lzm-fieldset top-space" id="qrd-knb-language-fs"><legend>' + t('Language') + '</legend>';
    knbContent += lzm_inputControls.createInput('qrd-knb-language-text', '', languageText, t('Language (leave blank for all)'), '', 'text', '');
    knbContent += '<div class="top-space-half lzm-info-text">' + t('ISO 639-1 twoletter, comma-separated, case insensitive, example: en, it, fr') + '</div>';
    knbContent += '</fieldset>';

    var tagsDisabled = (_resource.ty == 0) ? ' class="ui-disabled"' : '';
    var tagsContent = '<fieldset class="lzm-fieldset" id="qrd-tags-fs"><legend>' + t('Tags') + '</legend><textarea' + tagsDisabled + ' id="qrd-tags-input">' + tagsText + '</textarea></fieldset>';
    var tabArray = [{name: tid('knowledgebase'), content: knbContent}, {name: t('Tags'), content: tagsContent}];
    var dialogData = {}, dialogId = '', tabControlWidth = 0;

    if (caller == 'qrd-tree')
    {
        dialogData = {'resource-id': _resource.rid};
        headerString = tid('settings') + ' (' + lzm_commonTools.SubStr(_resource.ti,15,true) + ')';
        lzm_commonDialog.CreateDialogWindow(headerString, bodyString, footerString, 'gears', 'qrd-settings-'+md5(_resource.rid), 'qrd-settings-'+md5(_resource.rid), 'cancel-qrd-settings', true, dialogData);
        tabControlWidth = $('#'+'qrd-settings-'+md5(_resource.rid)+'-body').width();
    }
    else if (caller == 'add-resource')
    {
        winObj = TaskBarManager.GetActiveWindow();
        dialogData = {editors: [{id: 'qrd-add-text', instanceName: 'KnowledgebaseUI.TextEditor', text: editorText}], 'resource-id': _resource.rid};
        dialogId = winObj.DialogId;
        tabControlWidth = $('#qrd-add-body').width();
        lzm_commonDialog.CreateDialogWindow(headerString, bodyString, footerString, 'gears', dialogId + '_settings',dialogId + '_settings', 'cancel-qrd-settings', true,dialogData,true,winObj.TaskBarIndex);
    }
    else if (caller == 'edit-resource')
    {
        winObj = TaskBarManager.GetActiveWindow();
        dialogData = {editors: [{id: 'qrd-edit-text', instanceName: 'KnowledgebaseUI.TextEditor', text: editorText}], 'resource-id': _resource.rid,menu: t('Edit Resource <!--resource_title-->',[['<!--resource_title-->', _resource.ti]])};
        dialogId = winObj.DialogId;
        tabControlWidth = $('#'+dialogId+'-body').width();
        headerString = tid('settings') + ' (' + lzm_commonTools.SubStr(_resource.ti,15,true) + ')';
        lzm_commonDialog.CreateDialogWindow(headerString, bodyString, footerString, 'gears', dialogId + '_settings',dialogId + '_settings', 'cancel-qrd-settings', true,dialogData,true,winObj.TaskBarIndex);
    }
    lzm_inputControls.createTabControl('qrd-settings-placeholder', tabArray, 0, tabControlWidth);
    UIRenderer.resizeResourceSettings();

    if(!KnowledgebaseUI.ResourceIsFile(_resource))
    {
        $('#qrd-knb-pub-entry').change(function() {
            if($('#qrd-knb-pub-entry').prop('checked') || $('#qrd-knb-pub-bot').prop('checked'))
                $('#qrd-knb-access-url').removeClass('ui-disabled');
            else
                $('#qrd-knb-access-url').addClass('ui-disabled');
        });
        $('#qrd-knb-pub-bot').change(function() {
            $('#qrd-knb-pub-entry').change();
        });
    }
    $('#qrd-knb-pub-entry').change();
    $('#cancel-qrd-settings').click(function(){
        if (caller == 'qrd-tree')
        {
            TaskBarManager.RemoveActiveWindow();
        }
        else if (caller == 'add-resource')
        {
            TaskBarManager.RemoveActiveWindow();
            winObj = TaskBarManager.GetWindow(dialogId);
            winObj.ShowInTaskBar = true;
            winObj.Maximize();
        }
        else if (caller == 'edit-resource')
        {
            TaskBarManager.RemoveActiveWindow();
            var winObj = TaskBarManager.GetWindow(dialogId);
            winObj.ShowInTaskBar = true;
            winObj.Maximize();
        }
    });
    $('#save-qrd-settings').click(function() {

        var alertMessage = '';
        var id = $('#qrd-knb-id-text').val();
        var isPublic = $('#qrd-knb-pub-entry').prop('checked') ? '1' : '0';
        var allowBot = $('#qrd-knb-pub-bot').prop('checked') ? '1' : '0';
        var fullTextSearch = $('#qrd-knb-search-full').prop('checked') ? '1' : '0';
        var tags = $('#qrd-tags-input').val();
        var shortcutWord = $('#qrd-knb-shortcuts-text').val();
        var languages = $('#qrd-knb-language-text').val().replace(/ +/g, '');
        var ownerOPId = $('#qrd-knb-owner-op-id-fs').val();
        var ownerGRId = (_resource.ty == 0) ? $('#qrd-knb-owner-gr-id-fs').val() : '';

        if(id.length < 6)
            alertMessage = tid('invalid_id');

        if(alertMessage.length > 0){
            lzm_commonDialog.createAlertDialog(alertMessage, [{id: 'ok', name: t('Ok')}]);
            $('#alert-btn-ok').click(function() {
                lzm_commonDialog.removeAlertDialog();
            });
        }
        else
        {
            $('#cancel-qrd-settings').click();
            if (caller == 'qrd-tree' || true)
            {
                var newRes = {
                    rid: _resource.rid,
                    pid: _resource.pid,
                    ra: _resource.ra,
                    ti: _resource.ti,
                    ty: _resource.ty,
                    text: _resource.text,
                    si: _resource.si,
                    oid: ownerOPId,
                    g: ownerGRId,
                    t: tags,
                    di: 0,
                    isPublic: isPublic,
                    fullTextSearch: fullTextSearch,
                    shortcutWord: shortcutWord,
                    allowBotAccess: allowBot,
                    languages: languages,
                    new_id: id
                };

                if(d(_resource.draft))
                {
                    newRes.draft = true;
                    KnowledgebaseUI.DraftResources[_resource.rid] = lzm_commonTools.clone(newRes);
                }
                else
                {
                    CommunicationEngine.PollServerResource({First:newRes}, "set");
                    _resource.p = isPublic;
                    $('#resource-' + _resource.rid + '-icon-and-text').html(lzm_chatDisplay.resourcesDisplay.GetResourceIconHTML(_resource) + '<span class="qrd-title-span">'+lzm_commonTools.htmlEntities(_resource.ti)+'</span>');
                }
            }

            if (caller == 'add-resource' || caller == 'edit-resource')
            {
                setTimeout(function(){
                    that.StoreResourceValuesInNode(caller,isPublic,fullTextSearch,shortcutWord,allowBot,languages,tags,id,ownerOPId,ownerGRId);
                },400);
            }
        }
    });
};

KnowledgebaseUI.prototype.AddQrd = function(_newType, _newResourceId, _parentResource, ticketId, inDialog, toAttachment, sendToChat, menuEntry, _windowObj) {

    inDialog = (typeof inDialog != 'undefined') ? inDialog : false;
    toAttachment = (typeof toAttachment != 'undefined') ? toAttachment : false;
    sendToChat = (typeof sendToChat != 'undefined') ? sendToChat : null;
    menuEntry = (typeof menuEntry != 'undefined') ? menuEntry : '';
    ticketId = (typeof ticketId != 'undefined') ? ticketId : '';
    _windowObj = (d(_windowObj)) ? _windowObj : null;

    var headerString = '';

    if (toAttachment)
        headerString = tid('add_attachment');
    else if(sendToChat != null)
        headerString = (sendToChat.type == 'link') ? tid('send_url') : tid('send_file');
    else
        headerString = t('Add new Resource');

    var footerString = '',okDisabled = '';

    if (!inDialog)
    {
        footerString += '<span style="float: left;">';
        footerString += lzm_inputControls.createButton('add-qrd-settings', '', 'KnowledgebaseUI.InitKBEntrySettings(\''+_newResourceId+'\','+_newType+',\'add-resource\');', tid('settings'), '<i class="fa fa-gears"></i>', 'lr',{'margin-left': '4px'},'',30,'d');
        footerString += '</span>';
    }

    footerString +=
        lzm_inputControls.createButton('save-new-qrd', okDisabled, '', tid('ok'), '', 'lr', {'margin-left': '4px'}, '',30,'d') +
        lzm_inputControls.createButton('cancel-new-qrd', '', '', tid('cancel'), '', 'lr', {'margin-left': '4px'}, '',30,'d');

    var qrdAddFormString = '<div id="add-resource" class="lzm-fieldset" data-role="none" data-is_public="" data-full_text_search="" data-shorcut_word="" data-allow_bot="" data-languages="" data-tags=""><div id="add-resource-inner">';
    var isVisible = (sendToChat != null && sendToChat.type == 'link') ? ' style="display:block;"' : '';
    qrdAddFormString += '<div' + isVisible + ' id="qrd-add-title-div" class="top-space-half qrd-add-resource qrd-add-html-resource qrd-add-folder-resource qrd-add-link-resource">' + lzm_inputControls.createInput('qrd-add-title', 'resource-input-new', '', tidc('title'), '', 'text', '') + '</div>';

    qrdAddFormString += '<div id="qrd-add-text-div" class="qrd-add-resource qrd-add-html-resource"><div class="top-space"><label for="qrd-add-text">' + tidc('text') + '</label></div><div id="qrd-add-text-inner">';
    qrdAddFormString += '<div id="qrd-add-text-controls">' + lzm_inputControls.CreateInputControlPanel('basic').replace(/lzm_chatInputEditor/g,'KnowledgebaseUI.TextEditor') + '</div>';
    qrdAddFormString += '<div id="qrd-add-text-body"><textarea id="qrd-add-text" data-role="none"></textarea></div></div></div>';

    isVisible = (sendToChat != null && sendToChat.type == 'link') ? ' style="display:block;"' : '';
    qrdAddFormString += '<div' + isVisible + ' id="qrd-add-url-div" class="top-space qrd-add-link-resource qrd-add-resource">' + lzm_inputControls.createInput('qrd-add-url', 'resource-input-url-new', '', tidc('url'), '', 'text', '') + '</div>';

    isVisible = (sendToChat != null && sendToChat.type == 'file') ? ' style="display:block;"' : '';
    qrdAddFormString += '<div' + isVisible + ' id="qrd-add-file-div" class="qrd-add-file-resource qrd-add-resource">' +

        '<label class="file-upload-label file-drop-zone">' +
        '<i class="fa fa-cloud-upload icon-xxxl icon-light"></i>' +
        lzm_inputControls.createInput('file-upload-input', 'resource-input-new', '', '', '', 'file', '') +
        '<span></span>' +
        '<div id="file-upload-progress" style="display: none;"><span id="file-upload-numeric" class="text-xxl text-green">0%</span></div>' +
        '<div id="file-upload-name" class="text-bold text-xl"></div>' +
        '<div id="file-upload-size"></div>' +
        '<div id="file-upload-type"></div>' +
        '<div id="file-upload-error" class="text-orange text-bold"></div>' +
        '<div id="cancel-file-upload-div" style="display: none;"><br><br>' + lzm_inputControls.createButton('cancel-file-upload','', 'cancelFileUpload(event)', tid('cancel'), '', 'lr',{padding:'5px 10px;','display': 'none'}) + '</div>' +
        '</label>';

    qrdAddFormString += '<div id="file-drop-box" class="file-drop-zone"></div></div></div></div>';

    var dialogData = {editors: [{id: 'qrd-add-text', instanceName: 'KnowledgebaseUI.TextEditor'}], 'resource-id': _parentResource.rid};

    if (ticketId != '')
        dialogData['exceptional-img'] = '<i class="fa fa-envelope"></i>';

    if (inDialog)
    {
        if (toAttachment)
        {
            dialogData.menu = menuEntry;
            lzm_commonDialog.CreateDialogWindow(headerString, qrdAddFormString, footerString, 'link', toAttachment + '_attachment',toAttachment + '_attachment', 'cancel-new-qrd', true, dialogData, true, _windowObj.TaskBarSorterIndex);
        }
        else
        {
            var taskBarIndex = TaskBarManager.GetActiveWindow().TaskBarIndex;
            TaskBarManager.RemoveActiveWindow();
            lzm_commonDialog.CreateDialogWindow(headerString, qrdAddFormString, footerString, 'database', 'qrd-add-' + md5(ticketId), 'qrd-add-' + md5(ticketId), 'cancel-new-qrd', _newType == 1, dialogData, true, taskBarIndex);
        }
    }
    else
    {
        var showFullscreen = (_newType == 1 || _newType == 3);
        var dialogId = (sendToChat == null) ? 'qrd-add-'+lzm_commonTools.guid() : sendToChat.dialog_id;
        if (sendToChat != null)
            dialogData.menu = headerString;

        dialogId = lzm_commonDialog.CreateDialogWindow(headerString, qrdAddFormString, footerString, 'database', 'qrd-add', dialogId, 'cancel-new-qrd', showFullscreen, dialogData);
        $('#qrd-add').data('dialog_id', dialogId);
    }

    var dropContainer = document.getElementById('file-drop-box');
    $('#file-upload-input').change(function(){changeFile();});
    $('.file-drop-zone').on({
        dragstart: function(evt) {
            dropContainer.style.background = '#f1f1f1';
            evt.preventDefault();

        },
        dragover: function(evt) {
            dropContainer.style.background = '#f1f1f1';
            evt.preventDefault();

        },
        dragleave: function(evt) {
            dropContainer.style.background = '#fff';
            evt.preventDefault();
        },
        dragenter: function(evt) {
            dropContainer.style.background = '#f1f1f1';
            evt.preventDefault();

        },
        dragend: function(evt) {
            dropContainer.style.background = '#fff';
            evt.preventDefault();

        },
        drop: function(evt) {
            evt.preventDefault();
            changeFile(evt.originalEvent.dataTransfer.files[0]);
        }
    });

    document.body.addEventListener('drop', function(e) {
        e.preventDefault();
    }, false);

    $('#add-resource, #qrd-add-body').on({
        dragstart: function(evt) {evt.preventDefault();},
        dragover: function(evt) {evt.preventDefault();},
        dragleave: function(evt) {evt.preventDefault();},
        dragenter: function(evt) {evt.preventDefault();},
        dragend: function(evt) {evt.preventDefault();},
        drop: function(evt) {evt.preventDefault();}
    });

    //UIRenderer.resizeAddResources();

    if (ticketId != '')
        delete lzm_chatDisplay.ticketResourceText[ticketId];
};

KnowledgebaseUI.prototype.updateResources = function() {

    this.invalidateCache();
    var resources = DataEngine.cannedResources.getResourceList(), that = this;
    var reloadAll = false;
    if ($('#resource-1').length > 0)
    {
        var chatPartner = $('#qrd-tree-body').data('chat-partner');
        chatPartner = (typeof chatPartner != 'undefined') ? chatPartner : '';
        var inDialog = $('#qrd-tree-body').data('in-dialog');
        inDialog = (d(inDialog)) ? inDialog : false;
        var preparedResources = that.prepareResources(resources);
        var i;
        resources = preparedResources[0];
        var allResources = preparedResources[1];
        var counter = 0;
        while (resources.length > 0 && counter < 1000)
        {
            var tmpResources = [];
            for (i=0; i<resources.length; i++) {
                if ($('#resource-' + resources[i].rid).length == 0)
                {
                    if ($('#folder-' + resources[i].pid).length > 0)
                    {
                        var resourceHtml = that.GetResourceHTML(resources[i], chatPartner, inDialog);
                        $('#folder-' + resources[i].pid).append(resourceHtml);
                        KnowledgebaseUI.RenderFolderArrow(resources[i].pid, true);
                    }
                    else
                    {
                        tmpResources.push(resources[i]);
                    }
                }
            }
            if (resources.length == tmpResources.length) {
                counter = 1000;
            }
            resources = tmpResources;
            counter++;
        }

        for (i=0; i<allResources.length; i++)
        {
            if (typeof allResources[i].md5 != 'undefined')
            {
                for (var j=0; j<that.resources.length; j++)
                {
                    if (allResources[i].rid == that.resources[j].rid && allResources[i].md5 != that.resources[j].md5)
                    {
                        if(allResources[i].pid != that.resources[j].pid)
                            reloadAll = true;

                        $('#resource-' + allResources[i].rid).find('span.qrd-title-span').html(lzm_commonTools.htmlEntities(allResources[i].ti));
                        $('#resource-' + allResources[i].rid+'-icon-and-text').find('i.icon-public').remove();
                        $('#resource-' + allResources[i].rid+'-icon-and-text').find('span.qrd-title-span').before(this.GetPublicIconHTML(allResources[i]));

                        $('#qrd-search-line-' + allResources[i].rid).replaceWith(that.createQrdSearchLine(allResources[i], $('#search-result-table').data('search-string'), chatPartner, inDialog));
                        $('#qrd-recently-line-' + allResources[i].rid).replaceWith(that.createQrdRecentlyLine(allResources[i], chatPartner, inDialog));
                    }
                }
            }
        }
        that.resources = preparedResources[0];
        $('.resource-div').each(function()
        {
            var deleteThisResource = true;
            var thisResourceId = $(this).attr('id').split('resource-')[1];
            for (var i=0; i<allResources.length; i++)
            {
                if (allResources[i].rid == thisResourceId)
                {
                    deleteThisResource = false;
                }
            }
            if (deleteThisResource)
            {
                var parentNode = $('#resource-' + thisResourceId).parent().attr('id').replace('folder-','');
                $('#resource-' + thisResourceId).remove();
                $('#qrd-search-line-' + thisResourceId).remove();
                $('#qrd-recently-line-' + thisResourceId).remove();
                KnowledgebaseUI.RenderFolderArrow(parentNode);
            }
        });
    }

    if(reloadAll)
    {
        this.setLoading(true);
        this.createQrdTree('view-select-panel', ChatManager.LastActiveChat);
    }
    this.UpdatePreview();
};

KnowledgebaseUI.prototype.StoreResourceValuesInNode = function(_node,isPublic,fullTextSearch,shortcutWord,allowBot,languages,tags,id,ownerOPId,ownerGRId){
    $('#' + _node).data('is_public', isPublic);
    $('#' + _node).data('full_text_search', fullTextSearch);
    $('#' + _node).data('shorcut_word', shortcutWord);
    $('#' + _node).data('allow_bot', allowBot);
    $('#' + _node).data('languages', languages);
    $('#' + _node).data('tags', tags);
    $('#' + _node).data('new_id', id);
    $('#' + _node).data('oid', ownerOPId);
    $('#' + _node).data('g', ownerGRId);
};

KnowledgebaseUI.prototype.prepareResources = function (resources) {
    var allResources = resources;

    var tmpResources = [], topLayerResource, i;
    for (i=0; i<resources.length; i++)
    {
        resources[i].ti = resources[i].ti
            .replace(/%%_Files_%%/, t('Files'))
            .replace(/%%_External_%%/, t('External'))
            .replace(/%%_Internal_%%/, t('Internal'));
        if (resources[i].ra == 0)
        {
            topLayerResource = resources[i];
        }
        else
        {
            tmpResources.push(resources[i]);
        }
    }
    resources = tmpResources;
    return [resources, allResources, topLayerResource];
};

KnowledgebaseUI.prototype.GetResourceIconHTML = function(resource) {
    var that = this;

    var resourceIcon;
    switch(resource.ty.toString())
    {
        case '0':
            resourceIcon = '<i class="fa fa-folder"></i>';
            break;
        case '1':
            resourceIcon = '<i class="fa fa-file-text icon-gray"></i>';
            break;
        case '2':
            if (typeof resource.text != 'undefined' && resource.text.indexOf('mailto:') == 0)
                resourceIcon = '<i class="fa fa-envelope icon-blue"></i>';
            else
                resourceIcon = '<i class="fa fa-link icon-red"></i>';
            break;
        default:
            resourceIcon = that.getFileTypeIcon(resource.ti);
            break;
    }
    return resourceIcon + this.GetPublicIconHTML(resource);
};

KnowledgebaseUI.prototype.getFileTypeIcon = function(fileName) {

    fileName = (d(fileName)) ? fileName.toLowerCase() : '';

    var fileIcon = '<i class="fa fa-file"></i>';
    if (checkEnding(fileName, ['mp3', 'wav', 'ogg', 'wma']))
        fileIcon = '<i class="fa fa-file-sound-o icon-orange"></i>';
    else if (checkEnding(fileName, ['png', 'gif', 'jpg', 'bmp', 'jpeg']))
        fileIcon = '<i class="fa fa-file-picture-o icon-blue"></i>';
    else if (checkEnding(fileName, ['doc', 'docx', 'odt', 'rtf'])) {
        fileIcon = '<i class="fa fa-file-word-o icon-blue"></i>';
    } else if (checkEnding(fileName, ['xls', 'xlsx', 'ods', 'csv'])) {
        fileIcon = '<i class="fa fa-file-excel-o icon-green"></i>';
    } else if (checkEnding(fileName, ['ppt', 'pptx', 'odp'])) {
        fileIcon = '<i class="fa fa-file-powerpoint-o"></i>';
    } else if (checkEnding(fileName, ['zip', 'rar', 'tar', 'tar.gz', 'tar.bz2', 'tar.xz', 'tgz', '7z'])) {
        fileIcon = '<i class="fa fa-file-archive-o icon-red"></i>';
    } else if (checkEnding(fileName, ['pdf', 'ps'])) {
        fileIcon = '<i class="fa fa-file-pdf-o icon-red"></i>';
    } else if (checkEnding(fileName, ['exe', 'bat'])) {
        fileIcon = '<i class="fa fa-gear icon-red"></i>';
    } else if (checkEnding(fileName, ['mpg', 'mpeg', 'avi', 'mp4', 'webm', 'mov', 'ogm', 'wmf'])) {
        fileIcon = '<i class="fa fa-file-movie-o"></i>';
    } else if (checkEnding(fileName, ['js', 'php', 'html', 'css', 'py', 'sh', 'pl', 'cs', 'java', 'c', '.c++', '.cpp']))
        fileIcon = '<i class="fa fa-file-code-o"></i>';

    return fileIcon;
};

var checkEnding = function(fileName, ending) {
    ending = (typeof ending == 'string') ? [ending] : (typeof ending == 'object' && ending instanceof Array) ? ending : [];
    var fnLength = fileName.length, eLength = 0, rt = false;
    for (var i=0; i<ending.length; i++) {
        eLength = ending[i].length;
        rt = rt || (ending[i] != '' && fileName.indexOf('.' + ending[i]) == fnLength - eLength - 1);
    }
    return rt;
};

KnowledgebaseUI.prototype.GetPublicIconHTML = function(resource) {
    var html = '';
    if(d(resource.p) && resource.p.toString()=='1')
        html += '<i class="fa fa-life-ring icon-blue icon-public"></i>';
    if(d(resource.ba) && resource.ba.toString()=='1')
        html += '<i class="fa fa-microchip icon-green icon-public icon-bot"></i>';
    return html;
};

KnowledgebaseUI.prototype.createQrdTreeTopLevel = function(topLayerResource, chatPartner, inDialog) {
    if(topLayerResource == null)
        return "";

    var onclickAction = ' onclick="KnowledgebaseUI.HandleResourceClickEvents(\'' + topLayerResource.rid + '\')"';
    var onContextMenu = ' oncontextmenu="return false;"', that = this;

    if (((!IFManager.IsAppFrame && !IFManager.IsMobileOS) || IFManager.IsDesktopApp()) && !inDialog)
        onContextMenu = ' oncontextmenu="KnowledgebaseUI.OpenKBContextMenu(event, \'' + chatPartner + '\', \'' + topLayerResource.rid + '\');return false;"';

    var id = (inDialog) ? 'all-resources-dialog' : 'all-resources';
    var sid = (inDialog) ? 'd-' : '';
    var plusMinusImage = '';
    var resourceHtml = '<div id="'+id+'" class="lzm-fieldset" data-role="none">' +
        '<div id="'+id+'-inner"><div id="'+sid+'resource-' + topLayerResource.rid + '" class="resource-div lzm-unselectable">' +
        '<span class="resource-open-mark" id="'+sid+'resource-' + topLayerResource.rid + '-open-mark"' +
        onclickAction + onContextMenu + '>' + plusMinusImage + '</span>' +
        '<span class="resource-icon-and-text" id="'+sid+'resource-' + topLayerResource.rid + '-icon-and-text"' +
        onclickAction + onContextMenu + '>' + that.GetResourceIconHTML(topLayerResource) +
        '<span class="qrd-title-span">' + lzm_commonTools.htmlEntities(topLayerResource.ti) + '</span>' +
        '</span></div><div id="'+sid+'folder-' + topLayerResource.rid + '" style="display: none;"></div>' +
        '</div></div>';

    if(!inDialog)
        resourceHtml += '<div id="all-resources-preview" class="kb-preview-box"></div>';
    else
        resourceHtml += '<div id="all-resources-preview-dialog" class="kb-preview-box"></div>';

    return resourceHtml;
};

KnowledgebaseUI.prototype.SetPreview = function(_resource){

    var pd = null;
    if($('#all-resources-preview-dialog').length)
        pd = $('#all-resources-preview-dialog');
    else if($('#all-resources-preview').length)
        pd = $('#all-resources-preview');

    if(pd != null)
    {
        KnowledgebaseUI.PreviewResourceId = null;
        pd.html('');
        if(_resource!=null)
        {
            KnowledgebaseUI.PreviewResourceId = _resource.rid;
            if(_resource.ty=='1'||_resource.ty=='0')
                pd.html(_resource.text);
            else if(_resource.ty=='2')
                pd.html('<a target="_blank" href="'+_resource.text+'">' + _resource.ti+'</a>');
            else if(_resource.ty=='3' && checkEnding(_resource.ti, ['png', 'gif', 'jpg', 'bmp', 'jpeg']))
            {
                pd.html('<img src="'+DataEngine.getServerUrl("getfile.php")+"?file=&id="+_resource.rid+'">');
            }
        }
    }
};

KnowledgebaseUI.prototype.UpdatePreview = function(){
    if(KnowledgebaseUI.PreviewResourceId != null)
    {
        var ures = DataEngine.cannedResources.getResource(KnowledgebaseUI.PreviewResourceId);
        if(ures != null)
        {
            if($('#all-resources-preview').html() != ures.text)
                this.SetPreview(ures);
        }
        else
            this.SetPreview(null);
    }
};

KnowledgebaseUI.prototype.createQrdSearch = function(chatPartner, inDialog) {
    var sid = (inDialog) ? 'd-' : '';
    var that = this, attachmentDataString = (chatPartner.indexOf('ATTACHMENT') != -1) ? ' data-attachment="1"' : ' data-attachment="0"';
    var searchHtml = '<div id="search-input" data-role="none">' +
        '<div class="lzm-fieldset"><table id="search-input-inner">' +
        '<tr><td colspan="2">' +
        lzm_inputControls.createInput(sid+'search-resource','', '', t('Search'), '<i class="fa fa-remove"></i>', 'text', 'b') +
        '</td>';
    var checkedString = ($.inArray('ti', that.KBSearchCategories) != -1) ? ' checked="checked"' : '';
    searchHtml += '<tr><td>' +
        '<input type="checkbox" class="checkbox-custom qrd-'+sid+'search-by" data-role="none" id="'+sid+'search-by-ti"' + checkedString + ' />' +
        '<label for="'+sid+'search-by-ti" class="checkbox-custom-label"></label>' +
        '</td>' +
        '<td>' + t('Title') + '</td></tr>';
    checkedString = ($.inArray('t', that.KBSearchCategories) != -1) ? ' checked="checked"' : '';
    searchHtml += '<tr><td><input type="checkbox" data-role="none" id="'+sid+'search-by-t" class="checkbox-custom qrd-'+sid+'search-by"' + checkedString + ' />' +
        '<label for="'+sid+'search-by-t" class="checkbox-custom-label"></label>' +
        '</td>' +
        '<td>' + t('Tags') + '</td></tr>';
    checkedString = ($.inArray('text', that.KBSearchCategories) != -1) ? ' checked="checked"' : '';
    searchHtml += '<tr><td><input type="checkbox" data-role="none" id="'+sid+'search-by-text" class="checkbox-custom qrd-'+sid+'search-by"' + checkedString + ' />' +
        '<label for="'+sid+'search-by-text" class="checkbox-custom-label"></label>' +
        '</td>' +
        '<td>' + t('Content') + '</td></tr>' +
        '</table></div>' +
        '</div><br>' +
        '<div id="'+sid+'search-results" data-role="none">' +
        '<div class="lzm-dialog-headline4"><span>' + t('Results') + '</span></div>' +
        '<div id="'+sid+'search-result-frame">' +
        '<table id="'+sid+'search-result-table" class="visible-list-table alternating-rows-table lzm-unselectable" style="width: 100%;"' + attachmentDataString + '><thead><tr>' +
        '<th></th><th>' + t('Title') + '</th><th>' + t('Tags') + '</th><th>' + t('Content') + '</th>' +
        '</tr></thead><tbody></tbody></table></div>' +
        '</div>';

    return searchHtml;
};

KnowledgebaseUI.prototype.CreateQrdSearchResults = function(searchString, _caller, inDialog) {
    var searchHtml = '', that = this;
    var sid = (inDialog) ? 'd-' : '';
    var resources = DataEngine.cannedResources.getResourceList();
    var searchCategories = that.KBSearchCategories;
    $('#'+sid+'search-result-table').data('search-string', searchString);
    var resultIds = [];
    if (searchString != '') {
        for (var i=0; i<resources.length; i++)
        {
            for (var j=0; j<searchCategories.length; j++)
            {
                var contentToSearch = resources[i][searchCategories[j]].toLowerCase();
                if (resources[i].ty != 0 && contentToSearch.indexOf(searchString.toLowerCase()) != -1 && $.inArray(resources[i].rid, resultIds) == -1)
                {
                    if (resources[i].ty == 3 || resources[i].ty == 4 || $('#'+sid+'search-result-table').data('attachment') != '1')
                    {
                        searchHtml += that.createQrdSearchLine(resources[i], searchString, _caller, inDialog);
                        resultIds.push(resources[i].rid);
                    }
                }
            }
        }
    }
    return searchHtml;
};

KnowledgebaseUI.prototype.createQrdSearchLine = function(resource, searchString, chatPartner, inDialog) {
    searchString = (typeof searchString != 'undefined') ? searchString : '';
    chatPartner = (typeof chatPartner != 'undefined') ? chatPartner : '';
    var regExp = new RegExp(RegExp.escape(searchString), 'i'), that = this;
    var sid = (inDialog) ? 'd-' : '';
    var onclickAction = ' onclick="KnowledgebaseUI.HandleResourceClickEvents(\'' + resource.rid + '\');"';
    var onDblClickAction = '', onContextMenu = ' oncontextmenu="return false;"';

    if (((!IFManager.IsAppFrame && !IFManager.IsMobileOS) || IFManager.IsDesktopApp()) && !inDialog)
        onContextMenu = ' oncontextmenu="KnowledgebaseUI.OpenKBContextMenu(event, \'' + chatPartner + '\', \'' + resource.rid + '\');return false;"';

    if ((!IFManager.IsAppFrame && !IFManager.IsMobileOS) || IFManager.IsDesktopApp())
    {
        if (chatPartner.indexOf('TICKET LOAD') != -1)
            onDblClickAction = ' ondblclick="insertQrdIntoTicket(\'' + chatPartner.split('~')[1] + '\');"';
        else if (chatPartner.indexOf('ATTACHMENT') != -1)
            onDblClickAction = ' ondblclick="addQrdAttachment(\'' + chatPartner.split('~')[1] + '\');"';
        else if (inDialog && chatPartner != '')
            onDblClickAction = ' ondblclick="sendQrdPreview(\'' + resource.rid + '\', \'' + chatPartner + '\');"';
        else if (parseInt(resource.ty) < 3)
            onDblClickAction = ' ondblclick="editQrd();"';
    }

    var sstyle=' style="color: #000000 !important; background-color: #fff9a9 !important;"';
    var content = ($.inArray(parseInt(resource.ty), [3,4]) == -1) ? resource.text.replace(/<.*?>/g, ' ') : '';

    if(content.length > 200)
        content = content.substring(0,200)+" ...";
    content = content.replace(regExp, '<span'+sstyle+'>' + searchString + '</span>')

    var title = lzm_commonTools.htmlEntities(resource.ti).replace(/<.*?>/g, ' ');
    if(title.length > 200)
        title = title.substring(0,200)+" ...";
    title = title.replace(regExp, '<span'+sstyle+'>' + searchString + '</span>')

    var searchLineHtml = '<tr style="cursor: pointer;" class="qrd-search-line lzm-unselectable" id="qrd-'+sid+'search-line-' + resource.rid + '"' + onclickAction + onDblClickAction + onContextMenu + '>' +
        '<td class="icon-column resource-icon-and-text">' + that.GetResourceIconHTML(resource,false) + '</td>' +
        '<td>' + title + '</td>' +
        '<td>' + resource.t + '</td>' +
        '<td>' + content + '</td>' +
        '</tr>';
    return searchLineHtml;
};

KnowledgebaseUI.prototype.createQrdRecently = function() {
    return '';
};

KnowledgebaseUI.prototype.createQrdRecentlyLine = function(resource, chatPartner, inDialog) {

};

KnowledgebaseUI.prototype.GetResourceHTML = function(resource, chatPartner, inDialog) {

    chatPartner = (typeof chatPartner != 'undefined') ? chatPartner : '';
    inDialog = (typeof inDialog != 'undefined') ? inDialog : false;
    var sid = (inDialog) ? 'd-' : '';
    var onclickAction = ' onclick="KnowledgebaseUI.HandleResourceClickEvents(\'' + resource.rid + '\')"';
    var onDblClickAction = '', that = this;
    var onContextMenu = ' oncontextmenu="return false;"';

    if (((!IFManager.IsAppFrame && !IFManager.IsMobileOS) || IFManager.IsDesktopApp()) && !inDialog)
        onContextMenu = ' oncontextmenu="KnowledgebaseUI.OpenKBContextMenu(event, \'' + chatPartner + '\', \'' + resource.rid + '\');return false;"';

    var resourceHtml = '<div id="'+sid+'resource-' + resource.rid + '" class="resource-div lzm-unselectable" style="padding-left: ' + (20 * resource.ra) + 'px;">';
    if (resource.ty == 0)
    {
        var openMarkIcon = (DataEngine.cannedResources.getResourceList('', {parent: resource.rid}).length > 0) ? '<i class="fa fa-caret-right"></i>' : '<i class="fa"></i>';
        resourceHtml += '<span class="resource-open-mark" id="'+sid+'resource-' + resource.rid + '-open-mark"' + onclickAction + onContextMenu + '>' + openMarkIcon + '</span>';
    }
    else
    {
        resourceHtml += '<span class="resource-empty-mark"></span>';
        if ((!IFManager.IsAppFrame && !IFManager.IsMobileOS) || IFManager.IsDesktopApp())
        {
            if (chatPartner.indexOf('TICKET LOAD') != -1)
            {
                onDblClickAction = ' ondblclick="insertQrdIntoTicket(\'' + chatPartner.split('~')[1] + '\');"';
            }
            else if (chatPartner.indexOf('ATTACHMENT') != -1)
            {
                onDblClickAction = ' ondblclick="addQrdAttachment(\'' + chatPartner.split('~')[1] + '\');"';
            }
            else if (inDialog && chatPartner != '')
            {
                onDblClickAction = ' ondblclick="sendQrdPreview(\'' + resource.rid + '\', \'' + chatPartner + '\');"';
            }
            else if (parseInt(resource.ty) < 3)
            {
                onDblClickAction = ' ondblclick="editQrd();"';
            }
        }
    }
    resourceHtml += '<span class="resource-icon-and-text" id="'+sid+'resource-' + resource.rid + '-icon-and-text"' +
        onclickAction + onDblClickAction + onContextMenu + '>' +
        that.GetResourceIconHTML(resource) +
        '<span class="qrd-title-span">' +
        lzm_commonTools.htmlEntities(resource.ti) + '</span>' +
        '</span></div>';
    if (resource.ty == 0) {
        resourceHtml += '<div id="'+sid+'folder-' + resource.rid + '" style="display: none;"></div>';
    }
    return resourceHtml;
};

KnowledgebaseUI.prototype.createQrdTreeContextMenu = function(myObject){
    var contextMenuHtml = '', disabledClass;

    if(myObject != 'MENU')
    {
        contextMenuHtml += '<div onclick="showSubMenu(\'qrd-tree\', \'kb_add\', \'\', %CONTEXTX%, %CONTEXTY%, %MYWIDTH%, %MYHEIGHT%)"><span class="cm-line cm-click">' + tid('add') + '</span><i class="fa fa-caret-right lzm-ctxt-right-fa"></i></div><hr />';

        disabledClass = (myObject != 'MENU' && myObject.rid == 1) ? ' class="ui-disabled"' : '';
        contextMenuHtml += '<div' + disabledClass + ' onclick="KnowledgebaseUI.__Copy();"><span class="cm-line">' + tid('copy') + '</span></div>';

        disabledClass = (myObject != 'MENU' && myObject.rid == 1) ? ' class="ui-disabled"' : '';
        contextMenuHtml += '<div' + disabledClass + ' onclick="KnowledgebaseUI.__Cut();"><span class="cm-line">' + tid('cut') + '</span></div>';

        disabledClass = (myObject != 'MENU' && (KnowledgebaseUI.CopyResource==null&&KnowledgebaseUI.CutResource==null)) ? ' class="ui-disabled"' : '';
        contextMenuHtml += '<div' + disabledClass + ' onclick="KnowledgebaseUI.__Paste();"><span class="cm-line">' + tid('paste') + '</span></div><hr />';

        disabledClass = (myObject != 'MENU' && (myObject.rid == 1 || myObject.ty == 3 || myObject.ty == 4)) ? ' class="ui-disabled"' : '';
        contextMenuHtml += '<div' + disabledClass + ' onclick="editQrd();"><span id="edit-qrd-ctxt" class="cm-line">' + t('Edit') + '</span></div>';

        disabledClass = (myObject != 'MENU' && myObject.rid == 1) ? ' class="ui-disabled"' : '';
        contextMenuHtml += '<div' + disabledClass + ' onclick="deleteQrd();"><span id="delete-qrd-ctxt" class="cm-line">' + t('Delete') + '</span></div><hr />';

        disabledClass = (myObject != 'MENU' && (myObject.ty < 3 || myObject.ty > 4)) ? ' class="ui-disabled"' : '';
        contextMenuHtml += '<div' + disabledClass + ' onclick="KnowledgebaseUI.DownloadFile();">' + '<i class="fa fa-download"></i><span id="show-qrd-download-ctxt" class="cm-line cm-line-icon-left">' + tid('save') + '</span></div><hr />';

        disabledClass = (myObject != 'MENU' && myObject.rid == 1) ? ' class="ui-disabled"' : '';
        contextMenuHtml += '<div' + disabledClass + ' onclick="KnowledgebaseUI.InitKBEntrySettings(null, \'\', \'qrd-tree\');">' + '<i class="fa fa-gears"></i><span id="show-qrd-settings-ctxt" class="cm-line cm-line-icon-left">' + t('Settings') + '</span></div>';
    }
    else
    {
        contextMenuHtml += '<div onclick="addQrd(1);"><span id="add-qrd-ctxt" class="cm-line">' + tid('text') + '</span></div>';
        contextMenuHtml += '<div onclick="addQrd(2);"><span id="add-qrd-clnk" class="cm-line">' + tid('link') + '</span></div>';
        contextMenuHtml += '<div onclick="addQrd(3);"><span id="add-qrd-cfile" class="cm-line">' + tid('file') + '</span></div>';
        if(IFManager.IsDesktopApp() && d(IFManager.DeviceInterface.hasModule) && IFManager.DeviceInterface.hasModule('lz-screenshot-widget')){
            contextMenuHtml += '<div onclick="IFManager.IFScreenCast(\'knowledgebase\', \'' + lzm_chatDisplay.selectedResource + '\');lzm_chatDisplay.RemoveAllContextMenus();"><span id="add-qrd-cfile" class="cm-line">' + tid('screenshot') + '</span></div>';
        }
        contextMenuHtml += '<div onclick="addQrd(0);"><span id="add-qrd-cfld" class="cm-line">' + tid('resource_folder') + '</span></div>';
    }

    return contextMenuHtml;
};

KnowledgebaseUI.prototype.CalculateRank = function(_resource,_rank){
    _rank = (d(_rank)) ? _rank : 0;
    var p = DataEngine.cannedResources.getResource(_resource.pid);
    if(p==null)
        return _rank;
    else
        return this.CalculateRank(p,_rank+1);
};

KnowledgebaseUI.prototype.IsParentOf = function(_a,_b){

    if(_b.pid == _a.pid)
    {
        return false;
    }

    if(_b.pid == _a.rid)
    {
        return true;
    }

    var parent = DataEngine.cannedResources.getResource(_b.pid);
    if(parent == null)
        return false;
    else if(parent.rid==_a.pid && parent.rid != '1')
    {
        return true;
    }
    else
        return this.IsParentOf(_a,parent);
};

KnowledgebaseUI.__Copy = function(){
    removeKBContextMenu();
    KnowledgebaseUI.CutResource = null;
    KnowledgebaseUI.CopyResource = lzm_chatDisplay.selectedResource;
};

KnowledgebaseUI.__Cut = function(){
    removeKBContextMenu();

    if (!lzm_commonPermissions.checkUserResourceWritePermissions(lzm_chatDisplay.myId, 'edit', DataEngine.cannedResources.getResource(lzm_chatDisplay.selectedResource)))
    {
        showNoPermissionMessage();
        return;
    }

    KnowledgebaseUI.CopyResource = null;
    KnowledgebaseUI.CutResource = lzm_chatDisplay.selectedResource;
};

KnowledgebaseUI.__Paste = function(){
    removeKBContextMenu();
    var actionNode=null,action='';

    if(KnowledgebaseUI.CutResource != null)
    {
        action = 'cut';
        actionNode = DataEngine.cannedResources.getResource(KnowledgebaseUI.CutResource);
        KnowledgebaseUI.CutResource = null;

    }
    else if(KnowledgebaseUI.CopyResource != null)
    {
        action = 'copy';
        actionNode = DataEngine.cannedResources.getResource(KnowledgebaseUI.CopyResource);
    }

    var targetFolder = DataEngine.cannedResources.getResource(lzm_chatDisplay.selectedResource);

    if(targetFolder.ty != '0')
        targetFolder = DataEngine.cannedResources.getResource(targetFolder.pid);

    if (!lzm_commonPermissions.checkUserResourceWritePermissions(lzm_chatDisplay.myId, 'add', targetFolder))
    {
        showNoPermissionMessage();
        return;
    }

    if(actionNode != null && targetFolder != null)
    {
        if(actionNode.rid != targetFolder.rid || action == 'copy')
        {
            if(action == 'cut' && actionNode.ty == '0' && lzm_chatDisplay.resourcesDisplay.IsParentOf(actionNode,targetFolder))
            {
                return;
            }
            CommunicationEngine.PollServerResource({First:actionNode,Second:targetFolder},action);
        }
    }
};

KnowledgebaseUI.__ShowKBEntrySettings = function(_resourceId, caller, editorText){
    removeKBContextMenu();
    _resourceId = (_resourceId == null) ? lzm_chatDisplay.selectedResource : _resourceId;
    var resource = DataEngine.cannedResources.getResource(_resourceId);

    if (resource == null && d(KnowledgebaseUI.DraftResources[_resourceId]))
    {
        resource = KnowledgebaseUI.DraftResources[_resourceId];
    }

    if (resource == null)
    {
        resource = {t: ''};
        if (_resourceId == 'FOLDER')
            resource.ty = 0;
    }

    if (caller == 'add-qrd-settings' || _resourceId == 'TEXT_FILE_URL' || _resourceId == 'FOLDER' || lzm_commonPermissions.checkUserPermissions('', 'resources', 'edit', resource))
    {
        lzm_chatDisplay.resourcesDisplay.ShowKBEntrySettings(resource, editorText, caller);
    }
    else
        showNoPermissionMessage();

};

KnowledgebaseUI.RunsInDialog = function(){
    var winObj = TaskBarManager.GetActiveWindow();
    return (winObj != null);
};

KnowledgebaseUI.UpdateSelection = function(){


};

KnowledgebaseUI.InitKBEntrySettings = function(_resourceId,_type,_caller){
    var editorText = (_type == 1) ? KnowledgebaseUI.TextEditor.grabHtml() : '';
    KnowledgebaseUI.__ShowKBEntrySettings(_resourceId, _caller, editorText);
};

KnowledgebaseUI.DownloadFile = function(){
    removeKBContextMenu();
    var resource = DataEngine.cannedResources.getResource(lzm_chatDisplay.selectedResource);
    openLink(KnowledgebaseUI.GetFileURL(resource));
};

KnowledgebaseUI.GetFileURL = function(_resource){
    var thisServer = CommunicationEngine.chosenProfile.server_protocol + CommunicationEngine.chosenProfile.server_url;
    return thisServer + '/getfile.php?file=' + _resource.ti + '&id=' + _resource.rid;
};

KnowledgebaseUI.ResourceIsFile = function(_resource){
    return $.inArray(_resource.ty, ['2', '3', '4']) != -1
};

KnowledgebaseUI.GetAccessUrl = function(_resource){
    if(!KnowledgebaseUI.ResourceIsFile(_resource))
        return DataEngine.serverProtocol + DataEngine.serverUrl.replace(':80','').replace(':443','') + '/knowledgebase.php?article=' + lzm_commonTools.htmlEntities(_resource.rid);
    else
        return KnowledgebaseUI.GetFileURL(_resource);
};

KnowledgebaseUI.ShowKBAddMenu = function(e){
    KnowledgebaseUI.OpenKBContextMenu(e,'LIST','MENU');
    e.stopPropagation();
};

KnowledgebaseUI.OpenKBContextMenu = function(e, chatPartner, resourceId){
    if(resourceId != 'MENU')
        KnowledgebaseUI.HandleResourceClickEvents(resourceId, true);
    else if(lzm_chatDisplay.selectedResource != '')
    {
        var sel = DataEngine.cannedResources.getResource(lzm_chatDisplay.selectedResource);
        if(sel != null)
        {
            if(sel.ty == 0)
                openOrCloseFolder(sel.rid, true, true);
        }
    }
    var resource = (resourceId != 'MENU') ? DataEngine.cannedResources.getResource(resourceId) : 'MENU';
    var scrolledDownY = (resourceId != 'MENU') ? $('#qrd-tree-body').scrollTop() : 15;
    var scrolledDownX = (resourceId != 'MENU') ? $('#qrd-tree-body').scrollLeft() : -15;
    var parentOffset = $('#qrd-tree-body').offset();
    var yValue = e.pageY - parentOffset.top;
    var xValue = e.pageX - parentOffset.left;
    if (resource != null)
    {
        resource.chatPartner = chatPartner;
        lzm_chatDisplay.showContextMenu('qrd-tree', resource, xValue + scrolledDownX, yValue + scrolledDownY);
        e.preventDefault();
    }
};

KnowledgebaseUI.HandleResourceClickEvents = function(resourceId, onlyOpenFolders){
    removeKBContextMenu();
    onlyOpenFolders = (typeof onlyOpenFolders != 'undefined') ? onlyOpenFolders : false;

    var sid = (KnowledgebaseUI.RunsInDialog()) ? 'd-' : '';

    lzm_chatDisplay.selectedResource = resourceId;
    var resource = DataEngine.cannedResources.getResource(resourceId);
    lzm_chatDisplay.resourcesDisplay.SetPreview(resource);

    if (resource != null)
    {
        var parentFolder = DataEngine.cannedResources.getResource(resource.pid);
        var wasSelected = $('#'+sid+'resource-' + resourceId).hasClass('selected-resource-div');

        $('.resource-div').removeClass('selected-resource-div');
        $('.qrd-search-line').removeClass('selected-table-line');
        $('.qrd-recently-line').removeClass('selected-table-line');
        $('.resource-open-mark').removeClass('resource-open-mark-selected');
        $('.resource-icon-and-text').removeClass('resource-icon-and-text-selected');

        lzm_chatDisplay.resourcesDisplay.highlightSearchResults(DataEngine.cannedResources.CacheResourceList, false);

        $('#'+sid+'resource-' + resourceId).addClass('selected-resource-div');

        $('#qrd-'+sid+'search-line-' + resourceId).addClass('selected-table-line');
        $('#qrd-'+sid+'recently-line-' + resourceId).addClass('selected-table-line');
        $('#'+sid+'resource-' + resourceId + '-open-mark').addClass('resource-open-mark-selected');
        $('#'+sid+'resource-' + resourceId + '-icon-and-text').addClass('resource-icon-and-text-selected');
        $('.qrd-change-buttons').addClass('ui-disabled');

        switch (parseInt(resource.ty))
        {
            case 0:
                openOrCloseFolder(resourceId, onlyOpenFolders, wasSelected);
                if (resourceId != '1' && lzm_commonPermissions.checkUserPermissions('', 'resources', 'edit', resource)) {
                    $('#edit-qrd').removeClass('ui-disabled');
                    $('#show-qrd-settings').removeClass('ui-disabled');
                }

                if (lzm_chatDisplay.resourcesDisplay.SelectedResourceTab == 0 && lzm_commonPermissions.checkUserPermissions('', 'resources', 'add', resource))
                    $('#add-qrd').removeClass('ui-disabled');

                if (resourceId != '1' && lzm_commonPermissions.checkUserPermissions('', 'resources', 'delete', resource)) {
                    $('#delete-qrd').removeClass('ui-disabled');
                }
                if (lzm_commonPermissions.checkUserPermissions('', 'resources', 'add', resource)) {
                    $('#add-or-edit-qrd').removeClass('ui-disabled');
                }
                $('#add-qrd-attachment').addClass('ui-disabled');
                break;
            case 1:
                if (lzm_commonPermissions.checkUserPermissions('', 'resources', 'edit', resource)) {
                    $('#edit-qrd').removeClass('ui-disabled');
                    $('#show-qrd-settings').removeClass('ui-disabled');
                }
                if (lzm_commonPermissions.checkUserPermissions('', 'resources', 'delete', resource)) {
                    $('#delete-qrd').removeClass('ui-disabled');
                }
                $('#view-qrd').removeClass('ui-disabled');

                $('#'+sid+'send-qrd-preview').removeClass('ui-disabled');

                $('#insert-qrd-preview').removeClass('ui-disabled');
                if (lzm_commonPermissions.checkUserPermissions('', 'resources', 'add', resource)) {
                    $('#add-or-edit-qrd').removeClass('ui-disabled');
                }
                if (lzm_chatDisplay.resourcesDisplay.SelectedResourceTab == 0 && parentFolder != null && lzm_commonPermissions.checkUserPermissions('', 'resources', 'add', parentFolder))
                    $('#add-qrd').removeClass('ui-disabled');

                $('#add-qrd-attachment').addClass('ui-disabled');
                break;
            case 2:
                if (lzm_commonPermissions.checkUserPermissions('', 'resources', 'edit', resource)) {
                    $('#edit-qrd').removeClass('ui-disabled');
                    $('#show-qrd-settings').removeClass('ui-disabled');
                }
                if (lzm_commonPermissions.checkUserPermissions('', 'resources', 'delete', resource)) {
                    $('#delete-qrd').removeClass('ui-disabled');
                }
                $('#view-qrd').removeClass('ui-disabled');

                $('#'+sid+'send-qrd-preview').removeClass('ui-disabled');

                $('#insert-qrd-preview').removeClass('ui-disabled');

                if (lzm_chatDisplay.resourcesDisplay.SelectedResourceTab == 0 && parentFolder != null && lzm_commonPermissions.checkUserPermissions('', 'resources', 'add', parentFolder))
                    $('#add-qrd').removeClass('ui-disabled');

                $('#add-qrd-attachment').addClass('ui-disabled');
                break;
            default:
                if (lzm_commonPermissions.checkUserPermissions('', 'resources', 'edit', resource)) {
                    $('#show-qrd-settings').removeClass('ui-disabled');
                }
                if (lzm_commonPermissions.checkUserPermissions('', 'resources', 'delete', resource)) {
                    $('#delete-qrd').removeClass('ui-disabled');
                }

                $('#'+sid+'send-qrd-preview').removeClass('ui-disabled');

                $('#insert-qrd-preview').removeClass('ui-disabled');

                if (lzm_chatDisplay.resourcesDisplay.SelectedResourceTab == 0 && parentFolder != null && lzm_commonPermissions.checkUserPermissions('', 'resources', 'add', parentFolder))
                    $('#add-qrd').removeClass('ui-disabled');

                $('#add-qrd-attachment').removeClass('ui-disabled');
                break;
        }
    }
};

KnowledgebaseUI.Synchronize = function(){
    if(lzm_chatDisplay.resourcesDisplay.CachePreparedResources != null && lzm_chatDisplay.resourcesDisplay.CachePreparedResources[1].length==1)
        return;

    KnowledgebaseUI.HandleResourceClickEvents('1');

    lzm_commonStorage.deleteKeyValuePair('qrd_' + DataEngine.myId);
    lzm_commonStorage.deleteKeyValuePair('qrd_request_time_' + DataEngine.myId);
    lzm_commonStorage.deleteKeyValuePair('qrd_id_list_' + DataEngine.myId);

    KnowledgebaseUI.IsSyncing = true;
    KnowledgebaseUI.IsLoading = true;
    DataEngine.resourceIdList = [];
    DataEngine.resources = [];
    DataEngine.resourceLastEdited = 0;
    CommunicationEngine.qrdRequestTime = 1;
    DataEngine.cannedResources = new LzmResources();
    lzm_chatDisplay.resourcesDisplay.invalidateCache();
    lzm_chatDisplay.resourcesDisplay.updateResources();

    SelectView('qrd',true);
};

KnowledgebaseUI.FinishSynchronize = function(){
    KnowledgebaseUI.IsSyncing = false;
    setTimeout(function(){
        KnowledgebaseUI.HandleResourceClickEvents('1');
    },300);
};

KnowledgebaseUI.RenderFolderArrow = function(_resourceId,_hasChildren){
    var sid = (KnowledgebaseUI.RunsInDialog()) ? 'd-' : '';
    var markDiv = $('#'+sid+'resource-' + _resourceId + '-open-mark');

    if(!d(_hasChildren))
    {
        var folderDiv = $('#'+sid+'folder-' + _resourceId);
        _hasChildren = (folderDiv.html() != '');
    }

    if(_hasChildren)
    {
        if ($.inArray(_resourceId, lzm_chatDisplay.resourcesDisplay.openedResourcesFolder) == -1)
            markDiv.html('<i class="fa fa-caret-right"></i>');
        else
            markDiv.html('<i class="fa fa-caret-down"></i>');
    }
    else
        markDiv.html('');
};



