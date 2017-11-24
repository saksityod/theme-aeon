/****************************************************************************************
 * LiveZilla LinkGeneratorClass.js
 *
 * Copyright 2016 LiveZilla GmbH
 * All rights reserved.
 * LiveZilla is a registered trademark.
 *
 ***************************************************************************************/

LinkGeneratorClass.DataPassThruPlaceholder = '<!--replace_me_with_b64_encoded_';
LinkGeneratorClass.CurrentElements = [];
LinkGeneratorClass.InlinePreviewLoaded = false;
LinkGeneratorClass.DeprecatedElements = ['overlay-button-v2','overlay-widget','overlay-widget-v1'];

function LinkGeneratorClass() {
    this.m_MaxImageSetId = 0;
    this.m_CurrentCodeId = null;
    this.m_CurrentCodeName = null;
    this.m_InlinePreviewTimer = null;
}

LinkGeneratorClass.__LoadCode = function(id){
    lzm_chatDisplay.LinkGenerator.LoadCode(id);
};

LinkGeneratorClass.prototype.ShowLinkGenerator = function() {
    var disabledClass = 'ui-disabled';
    var headerString = t('Link Generator');
    var footerString =
        lzm_inputControls.createButton('preview-btn', disabledClass, 'previewLinkGeneratorCode()', tid('preview'), '<i class="fa fa-rocket"></i>', 'force-text',{'margin-left': '4px'},'',30,'d') +
        lzm_inputControls.createButton('get-code-btn', disabledClass, 'showLinkGeneratorCode()', tid('get_code'), '<i class="fa fa-code"></i>', 'force-text',{'margin-left': '4px'},'',30,'d') +
        lzm_inputControls.createButton('close-link-generator', '', '', t('Close'), '', 'lr',{'margin-left': '4px'},'',30,'d');


    var bodyString = this.CreateLinkGeneratorHtml();

    lzm_commonDialog.CreateDialogWindow(headerString, bodyString, footerString, 'link','link-generator-dialog','link-generator-dialog', 'close-link-generator');
    UIRenderer.resizeLinkGenerator();
    $('#close-link-generator').click(function() {
        TaskBarManager.RemoveActiveWindow();

        TaskBarManager.RemoveWindowByDialogId('link_generator_add_element');
        TaskBarManager.RemoveWindowByDialogId('link_generator_edit_element');
    });

    this.LoadCodesFromServer();
};

LinkGeneratorClass.prototype.CreateNewCode = function() {

    var that=this,nameHtml = lzm_inputControls.createInput('template-name','','',tidc('name'),'','text','');
    lzm_commonDialog.createAlertDialog(nameHtml, [{id: 'ok', name: t('Save')},  {id: 'cancel', name: t('Cancel')}]);
    $('#alert-btn-ok').click(function() {
        that.m_CurrentCodeName = $('#template-name').val();

        if(that.m_CurrentCodeName.length > 32)
            that.m_CurrentCodeName = lzm_commonTools.SubStr(that.m_CurrentCodeName,32,false);

        var cid = lzm_commonTools.guid();
        lzm_commonDialog.removeAlertDialog();
        $('#code-list-table tbody').append(that.GetCodeRow(cid,lz_global_base64_encode(JSON.stringify([lz_global_base64_encode(JSON.stringify([])),cid])),that.m_CurrentCodeName,false));
        that.LoadCode(cid);
        that.SaveCodeToServer(false);

    });
    $('#alert-btn-cancel').click(function() {
        lzm_commonDialog.removeAlertDialog();
    });
    $('#template-name').focus();
};

LinkGeneratorClass.prototype.DeleteCode = function(id){
    var that = this;
    lzm_commonDialog.createAlertDialog(tid('remove_items'), [{id: 'ok', name: t('Ok')}, {id: 'cancel', name: t('Cancel')}]);
    $('#alert-btn-ok').click(function(){
        lzm_commonDialog.removeAlertDialog();
        CommunicationEngine.pollServerDiscrete('delete_code',{p_cc_c: lz_global_base64_encode(id)});
        $('#cl-'+id).remove();
        that.LoadCode(0);
    });
    $('#alert-btn-cancel').click(function(){
        lzm_commonDialog.removeAlertDialog();
    });
};

LinkGeneratorClass.prototype.CreateLinkGeneratorHtml = function() {
    var contentHtml =
        '<div style="display:none;" id="lz_link_generator_load" class="lz_anim_loading"></div>'+
        '<table id="link-generator-table" class="hspaced"><tr><td></td><td style="width:20%;min-width:300px;">' +
        '<fieldset class="lzm-fieldset-full" id="code-list-div"><legend>Codes</legend><table class="alternating-rows-table lzm-unselectable" id="code-list-table"></thead><tbody></tbody></table></fieldset>';

    contentHtml += '<div class="top-space-half"><div class="top-space"><span style="float:left;">';
    contentHtml += lzm_inputControls.createButton('new-element-to-server-btn', '', 'newLinkGeneratorCode()', tid('new'), '<i class="fa fa-plus"></i>', 'lr',{'margin-right': '5px', 'padding-left': '12px', 'padding-right': '12px'}, '', 20, 'e');
    contentHtml += '</span></div></div></td>' +
        '<td style="width:20%;min-width:300px;"><fieldset class="lzm-fieldset-full" id="elements-list-div"><legend>'+tid('elements')+'</legend><table class="alternating-rows-table" id="elements-list-table">' +
        '<tbody></tbody></table></fieldset>';

    contentHtml += '<div class="top-space-half"><div class="top-space-half"><div class="top-space"><span style="float:right;">';
    contentHtml += lzm_inputControls.createButton('add-element-btn', '', 'addLinkGeneratorElement()', t('Add'), '<i class="fa fa-plus"></i>','force-text',{'margin-right': '5px', 'padding-left': '12px', 'padding-right': '12px'}, tid('create_new_element'), 20, 'e');
    contentHtml += lzm_inputControls.createButton('edit-element-btn', 'ui-disabled element-edit-btns', 'editLinkGeneratorElement()', t('Edit'), '<i class="fa fa-gear"></i>', 'lr',{'margin-right': '5px', 'padding-left': '12px', 'padding-right': '12px'}, t('Edit selected Element'), 20, 'e');
    contentHtml += lzm_inputControls.createButton('rm-element-btn', 'ui-disabled element-edit-btns', 'removeLinkGeneratorElement()', t('Remove'), '<i class="fa fa-remove"></i>', 'lr',{'margin-right': '0px', 'padding-left': '12px', 'padding-right': '12px'}, t('Remove selected Element'), 20, 'e');
    contentHtml += '</span></div></div></div></td><td style="width:60%;height:100%;padding:26px 0 25px 0;">';
    contentHtml += '<iframe id="inline-preview"></iframe>';
    contentHtml += '</td><td></td></tr></table>';

    return contentHtml;
};

LinkGeneratorClass.prototype.ValidateButtons = function(){
    var elementsExisting = $('#elements-list-table tr').length > 0;
    var codesExisting = $('#code-list-table tr').length > 0;

    var selectedElement = this.GetSelectedElement(false);
    if(selectedElement != null){
        $('.element-edit-btns').removeClass('ui-disabled');

        if(selectedElement.m_Type=='monitoring' && lzm_chatDisplay.LinkGenerator.RequiresMonitoring())
            $('#rm-element-btn').addClass('ui-disabled');
    }
    else
        $('.element-edit-btns').addClass('ui-disabled');

    if(!codesExisting)
    {
        $('#delete-element-from-server-btn').addClass('ui-disabled');
        $('#add-element-btn').addClass('ui-disabled');
    }
    else
    {
        $('#delete-element-from-server-btn').removeClass('ui-disabled');
        $('#add-element-btn').removeClass('ui-disabled');
    }

    if(!elementsExisting)
    {
        $('#preview-btn').addClass('ui-disabled');
        $('#get-code-btn').addClass('ui-disabled');

    }
    else
    {
        $('#preview-btn').removeClass('ui-disabled');
        $('#get-code-btn').removeClass('ui-disabled');
    }
};

LinkGeneratorClass.prototype.CreateSelectElementTypeHtml = function() {
    var contentHtml = '<div class="lzm-fieldset" id="lg-elements-configuration">' +
        '<form id="select-element-form">' +
        '<div class="top-space-double left-space-child'+((this.isTypeSelected('overlay-widget-v2')) ? ' ui-disabled' : '')+'"><input id="element-overlay-widget" value="overlay-widget-v2" name="element-type" type="radio" class="radio-custom element-type" /><label for="element-overlay-widget" class="radio-custom-label">' + tid('overlay-widget-v2') + '&nbsp;<span class="text-orange text-up">'+tid('new')+'</span></label></div>' +
        '<div class="top-space left-space-child'+((this.isTypeSelected('inlay-image')) ? ' ui-disabled' : '')+'"><input id="element-inlay-image" value="inlay-image" name="element-type" type="radio" class="radio-custom element-type" /><label for="element-inlay-image" class="radio-custom-label">' + t('Graphic Button') + '</label></div>' +
        '<div class="top-space left-space-child'+((this.isTypeSelected('inlay-text')) ? ' ui-disabled' : '')+'"><input id="element-inlay-text" value="inlay-text" name="element-type" type="radio" class="radio-custom element-type" /><label for="element-inlay-text" class="radio-custom-label">' + t('Text Link') + '</label></div>' +
        '<div class="top-space left-space-child'+((this.isTypeSelected('overlay-button-v1')) ? ' ui-disabled' : '')+'"><input id="element-overlay-button" value="overlay-button-v1" name="element-type" type="radio" class="radio-custom element-type" /><label for="element-overlay-button" class="radio-custom-label">' + tid('overlay-button') + '</label></div>' +
        '<div class="top-space left-space-child'+((this.isTypeSelected('monitoring')) ? ' ui-disabled' : '')+'"><input id="element-monitoring" value="monitoring" name="element-type" type="radio" class="radio-custom element-type" /><label for="element-monitoring" class="radio-custom-label">' + t('Visitor Monitoring') + '</label></div>' +
        '<div class="top-space left-space-child'+((this.isTypeSelected('no-tracking')) ? ' ui-disabled' : '')+'"><input id="element-no-tracking" value="no-tracking" name="element-type" type="radio" class="radio-custom element-type" /><label for="element-no-tracking" class="radio-custom-label">' + tid('no-tracking') + '</label></div>';
    contentHtml += '</form></div>';
    return contentHtml;
};

LinkGeneratorClass.prototype.CreateElementConfigurationHtml = function() {
    return '<div id="lg-element-settings-placeholder"></div>';
};

LinkGeneratorClass.prototype.SelectElementType = function(editObj) {
    var that=this;
    editObj = (typeof editObj != 'undefined') ? editObj : null;
    var headerString = tid('create_new_element');
    var footerString =
        lzm_inputControls.createButton('select-element-type-btn', 'ui-disabled', '', tid('select'), '', 'lr',{'margin-left': '6px'},'',30,'d') +
        lzm_inputControls.createButton('cancel-element-type-btn', '', '', tid('cancel'), '', 'lr', {'margin-left': '6px'},'',30,'d');

    var bodyString = this.CreateSelectElementTypeHtml();
    $('#inline-preview').attr('src','');

    lzm_commonDialog.CreateDialogWindow(headerString, bodyString, footerString, 'link', 'link_generator_add_element','link_generator_add_element', 'cancel-element-type-btn');

    $('#select-element-type-btn').click(function() {
        var eType = $('input[name=element-type]:checked').val();
        if(eType == 'overlay-button')
            eType = $('input[name=element-overlay-button-type]:checked').val();
        if(eType == 'overlay-widget')
            eType = $('input[name=element-overlay-widget-type]:checked').val();

        that.AddLinkGeneratorElement(eType ,null);
    });
    $('#cancel-element-type-btn').click(function() {
        TaskBarManager.RemoveActiveWindow();
        var lgWin =TaskBarManager.GetWindow('link-generator-dialog');
        if(lgWin != null)
            lgWin.Maximize();
    });
    $('.element-type').change(function() {
        if ($('#element-overlay-button').prop('checked'))
            $('.element-overlay-button-type').removeClass('ui-disabled');
        else
            $('.element-overlay-button-type').addClass('ui-disabled');

        if ($('#element-overlay-widget').prop('checked'))
            $('.element-overlay-widget-type').removeClass('ui-disabled');
        else
            $('.element-overlay-widget-type').addClass('ui-disabled');

        $('#select-element-type-btn').removeClass('ui-disabled');
    });

    if(editObj != null)
        that.AddLinkGeneratorElement(editObj.m_Type,editObj);
};

LinkGeneratorClass.prototype.AddLinkGeneratorElement = function(elementType, editObj) {

    var that = this;
    editObj = (typeof editObj != 'undefined') ? editObj : null;

    var headerString = tid(elementType);
    var footerString =
        lzm_inputControls.createButton('save-element-btn', '', '', tid('save'), '', 'lr',{'margin-left': '6px'},'',30,'d') +
        lzm_inputControls.createButton('cancel-element-btn', '', '', tid('cancel'), '', 'lr', {'margin-left': '6px'},'',30,'d');


    var bodyString = this.CreateElementConfigurationHtml();

    $('#inline-preview').attr('src','');

    TaskBarManager.RemoveActiveWindow();

    lzm_commonDialog.CreateDialogWindow(headerString, bodyString, footerString,'link','link_generator_edit_element','link_generator_edit_element', 'cancel-element-btn');

    var element = new LinkGeneratorElement(elementType,editObj);
    if(editObj == null && LinkGeneratorClass.CurrentElements.length>0)
        element.LoadSettings(LinkGeneratorClass.CurrentElements[0].m_Settings,true);

    if(element.m_Type == 'overlay-widget-v1' && parseInt(lzm_commonTools.GetPositionIndex(UIRenderer.getSettingsProperty(element.m_Settings,'m_Position').value)) < 20)
        UIRenderer.getSettingsProperty(element.m_Settings,'m_Position').value = 'right bottom';
    else if(element.m_Type == 'overlay-widget-v2')
    {
        UIRenderer.getSettingsProperty(element.m_Settings,'m_Position').value = 'right bottom';
        if(editObj == null)
        {
            UIRenderer.getSettingsProperty(element.m_Settings,'m_MarginRight').value = 40;
            UIRenderer.getSettingsProperty(element.m_Settings,'m_MarginBottom').value = 30;
        }
    }

    if(element.m_Type == 'inlay-text')
        UIRenderer.getSettingsProperty(element.m_Settings,'m_TextDefault').value = false;

    var tabs = [];
    element.m_Settings.forEach(function(entry_name) {
        if($.inArray(elementType,entry_name.not) === -1 && $.inArray('all',entry_name.not) === -1)
            tabs.push({name: entry_name.title, content: UIRenderer.getForm(entry_name.name, element, 'lg-element'), hash: entry_name.name});
    });

    lzm_displayHelper.createTabControl('lg-element-settings-placeholder',tabs,0);

    if(element.m_Type == 'overlay-widget-v1'){
        $('.y0').addClass('ui-disabled');
        $('.y1').addClass('ui-disabled');
    }
    else if(element.m_Type == 'overlay-widget-v2')
    {

    }
    else if(element.m_Type == 'inlay-text'){
        $('.checkbox-custom-label[for="cb-m_TextDefault"]').addClass('ui-disabled');
        $('#cb-m_TextDefault').addClass('ui-disabled');
    }

    element.m_Settings.forEach(function(entry_name) {
        element.ApplyLogicToForm(entry_name.name);
    });

    $('#save-element-btn').click(function() {
        element.GUIToObject();

        TaskBarManager.RemoveActiveWindow();
        TaskBarManager.GetWindow('link-generator-dialog').Maximize();

        $('#'+element.GetLineId()).remove();
        that.AddElementRow(element.GetElementRow());
        if(!that.isTypeSelected('monitoring'))
            $('#elements-list-table > tbody').append(new LinkGeneratorElement('monitoring').GetElementRow());

        that.SettleStaticFields(element,that.GetElementsFromRows(false));
        selectLinkGeneratorElement(element.m_Type);
        that.SaveCodeToServer(false);
    });
    $('#cancel-element-btn').click(function() {
        TaskBarManager.RemoveActiveWindow();
        TaskBarManager.GetWindow('link-generator-dialog').Maximize();
        that.PreviewInline(that.m_CurrentCodeId);
    });
    $('.lzm-tab-scroll-content').css({top:($('#lg-element-settings-placeholder-tabs-row').height()+1)+'px'});

    if(DataEngine.chosen_profile.server_protocol.toLowerCase().startsWith('https'))
    {
        $('#r-m_ProtocolHTTP').parent().addClass('ui-disabled');
        $('#r-m_ProtocolHTTPS').prop('checked',true);
    }
};

LinkGeneratorClass.prototype.EditLinkGeneratorElement = function(){
    var elementToEdit = this.GetSelectedElement(false);
    this.SelectElementType(elementToEdit);
    selectLinkGeneratorElement('');
};

LinkGeneratorClass.prototype.RemoveLinkGeneratorElement = function(){
    this.GetSelectedElement(true).remove();
    $('#elements-list-table > tbody > tr').each(function() {
        selectLinkGeneratorElement(JSON.parse(lz_global_base64_url_decode($(this).attr('data-element'))).m_Type);
        return false;
    });
    this.ValidateButtons();
    this.SaveCodeToServer(false);
};

LinkGeneratorClass.prototype.GetSelectedElement = function(getRow){
    if($('#elements-list-table > tbody > tr').length > 0){
        if(getRow)
            return $(".selected-table-line","#elements-list-table");
        else if($(".selected-table-line","#elements-list-table").length>0)
            return JSON.parse(lz_global_base64_url_decode($(".selected-table-line","#elements-list-table").attr('data-element')));
    }
    return null;
};

LinkGeneratorClass.prototype.GetElement = function(type){
    var elem = null;
    $('#elements-list-table > tbody > tr').each(function() {
        if(type=='first')
            elem = new LinkGeneratorElement($(this).attr('id').replace('element-list-line-',''),JSON.parse(lz_global_base64_url_decode($(this).attr('data-element'))));
        else if($(this).attr('id').match(type+'$'))
            elem = new LinkGeneratorElement(type,JSON.parse(lz_global_base64_url_decode($(this).attr('data-element'))));
    });
    return elem;
};

LinkGeneratorClass.prototype.isTypeSelected = function(type){

    if($.inArray(type,LinkGeneratorClass.DeprecatedElements) != -1)
        return false;

    var res = false;
    $('#elements-list-table > tbody > tr').each(function() {
        if($(this).attr('id').match(type+'$'))
            res = true;
    });
    return res;
};

LinkGeneratorClass.prototype.RequiresMonitoring = function() {
    return this.isTypeSelected('overlay-button-v1')||this.isTypeSelected('overlay-button-v2')||this.isTypeSelected('overlay-widget-v1')||this.isTypeSelected('overlay-widget-v2');
};

LinkGeneratorClass.prototype.GetElementsFromRows = function(encode){
    var objects = [];
    if(encode){
        $('#elements-list-table tr').each(function() {
            objects.push($(this).attr('data-element'));
        });
        return lz_global_base64_encode(JSON.stringify(objects));
    }
    else{
        $('#elements-list-table > tbody > tr').each(function() {
            objects.push(JSON.parse(lz_global_base64_url_decode($(this).attr('data-element'))));
        });
        return objects;
    }
};

LinkGeneratorClass.prototype.Preview = function(){
    this.SaveCodeToServer(true,false,false);
};

LinkGeneratorClass.prototype.PreviewInline = function(_cid){

    var firstElm = this.GetElement('first');
    var prot = CommunicationEngine.chosenProfile.server_protocol;

    if(firstElm != null)
        prot = firstElm.GetProperty('m_ProtocolHTTP').value ? 'http://' : 'https://';

    var url = CommunicationEngine.chosenProfile.server_url;

    if(url.indexOf(':80')!=-1)
        url = url.replace(':80','');
    else if(url.indexOf(':443')!=-1)
        url = url.replace(':443','');

    var that=this, purl = prot + url + '/preview.php?inline=1&id=' + _cid + '&t=' + lz_global_timestamp();

    if(this.m_InlinePreviewTimer != null)
        clearInterval(this.m_InlinePreviewTimer);
    this.m_InlinePreviewTimer = setTimeout(function(){
        $('#inline-preview').attr('src',purl);
        that.m_InlinePreviewTimer = null;
    },1000);
};

LinkGeneratorClass.prototype.SaveCodeToServer = function(preview){
    var that = this;
    var data = {};
    data.p_cc_c = lz_global_base64_encode(that.GetCode(preview));
    data.p_cc_e = (preview) ? '' : that.GetElementsFromRows(true);
    data.p_cc_t = (preview) ? '0' : '1';

    if(that.m_CurrentCodeId==null)
        that.m_CurrentCodeId = lzm_commonTools.guid();

    if(!preview)
        data.p_cc_i = that.m_CurrentCodeId;

    if(preview)
    {
        that.SetLoading(true);
        CommunicationEngine.pollServerDiscrete('create_code',data).done(function(data) {
            that.SetLoading(false);
            var xmlDoc = $.parseXML(data);
            $(xmlDoc).find('code').each(function(){
                var cid = lz_global_base64_decode($(this).attr('id'));
                var purl = CommunicationEngine.chosenProfile.server_protocol + CommunicationEngine.chosenProfile.server_url + '/preview.php?id=' + cid;
                openLink(purl);
            });
        }).fail(function(jqXHR, textStatus, errorThrown){alert(textStatus);that.SetLoading(false);});
    }
    else
    {
        data.p_cc_n = that.m_CurrentCodeName;
        that.UploadCodeToServer(data);
        that.PreviewInline(that.m_CurrentCodeId);
    }
};

LinkGeneratorClass.prototype.UploadCodeToServer = function(data){
    var that = this;
    that.SetLoading(true);
    CommunicationEngine.pollServerDiscrete('create_code',data).done(function(data) {
        that.SetLoading(false);
    }).fail(function(jqXHR, textStatus, errorThrown){alert(textStatus);that.SetLoading(false);});
};

LinkGeneratorClass.prototype.SetLoading = function(loading){
    if(loading){
        $('#lz_link_generator_load').css({display:'block'});
        $('#link-generator-table').css({display:'none'});
    }
    else{
        $('#lz_link_generator_load').css({display:'none'});
        $('#link-generator-table').css({display:'table'});
    }
};

LinkGeneratorClass.prototype.LoadCodesFromServer = function(){
    var that = this;

    that.SetLoading(true);
    CommunicationEngine.pollServerDiscrete('get_code_list',null).done(function(data) {
        var xmlDoc = $.parseXML(data);
        //var codes = [];
        var count = 0;

        var clhtml = '';
        $(xmlDoc).find('code').each(function(){
            count++;
            var cname = lz_global_base64_decode($(this).attr('n'));
            var cid =  lz_global_base64_decode($(this).attr('i'));
            //codes.push({value: lz_global_base64_encode(JSON.stringify([$(this).text(),$(this).attr('i')])), text: cname});

            clhtml += that.GetCodeRow(cid,lz_global_base64_encode(JSON.stringify([$(this).text(),$(this).attr('i')])),cname,false);

        });

        $('#code-list-table tbody').html(clhtml);
        that.SetLoading(false);
        that.LoadCode(0);
        $('#server-codes').prop('selectedIndex',0);

    }).fail(function(jqXHR, textStatus, errorThrown){that.SetLoading(false);alert(textStatus);});
};

LinkGeneratorClass.prototype.GetCodeRow = function(id,objB64,name) {

    var icon = '<i class="fa fa-code icon-large"></i>';
    var nameClass = '';
    try{
        var obj = JSON.parse(lz_global_base64_decode(objB64));
        var valueObj = obj[0];

        var objectList = JSON.parse(lz_global_base64_decode(valueObj));
        for (var item in objectList)
        {
            if($.inArray(JSON.parse(lz_global_base64_decode(objectList[item])).m_Type,LinkGeneratorClass.DeprecatedElements) != -1)
            {
                nameClass = ' class="text-orange text-bold"';
                icon = '<i class="fa fa-warning icon-orange icon-large"></i>';
                break;
            }
        }
    }
    catch(ex)
    {
        deblog(ex);
    }
    var html = '<tr id="cl-'+id+'" class="lg-cl-code" onClick="LinkGeneratorClass.__LoadCode(\''+id+'\');" data-name="'+lz_global_base64_encode(name)+'" data-obj="'+objB64+'"><td style="width:20px;padding:4px;" class="text-center">'+icon+'</td><td'+nameClass+'>'+name+'</td><td style="text-align: right;">';
    html += lzm_inputControls.createButton('delete-element-from-server-btn-' + id, '', 'deleteLinkGeneratorCode(\''+id+'\')', '', '<i class="fa fa-trash" style="color:#808080 !important;"></i>', 'lr',{'margin-right': '0', 'padding-left': '8px', 'padding-right': '8px'}, '', 20, 'b');
    return html + '</td></tr>';
};

LinkGeneratorClass.prototype.LoadCode = function(id){

    var obj,newRow;
    if(this.m_CurrentCodeId != '' && this.m_CurrentCodeId != id && $('#cl-'+this.m_CurrentCodeId).length)
    {
        var oname =  lz_global_base64_decode($('#cl-'+this.m_CurrentCodeId).data('name'));
        var elements = this.GetElementsFromRows(true);
        var dobj = lz_global_base64_encode(JSON.stringify([elements,this.m_CurrentCodeId]));

        newRow = this.GetCodeRow(this.m_CurrentCodeId,dobj,oname,false);
        $('#cl-'+this.m_CurrentCodeId).replaceWith(newRow);
    }

    if(id==0)
    {
        this.m_CurrentCodeId =
        this.m_CurrentCodeName = '';
        if($('#code-list-table tbody tr').length)
            this.LoadCode($('#code-list-table tbody tr:first').attr('id').replace('cl-',''));
        else
        {
            $('#elements-list-table > tbody').empty();
            this.PreviewInline(0);
        }
    }
    else if(this.m_CurrentCodeId != id)
    {
        $('.lg-cl-code').removeClass('selected-table-line');
        $('#cl-' + id).addClass('selected-table-line');

        this.m_CurrentCodeId = id;
        this.m_CurrentCodeName = lz_global_base64_decode($('#cl-'+id).data('name'));

        $('#elements-list-table > tbody').empty();

        obj = JSON.parse(lz_global_base64_decode($('#cl-'+id).data('obj')));
        var valueObj = obj[0];

        var objectList = JSON.parse(lz_global_base64_decode(valueObj));
        for (var item in objectList){

            obj = JSON.parse(lz_global_base64_decode(objectList[item]));
            obj.m_Type = this.UpgradeOldType(obj.m_Type);
            var element = new LinkGeneratorElement(obj.m_Type,obj);
            this.AddElementRow(element.GetElementRow());
        }
        this.PreviewInline(id);
    }
    else
        this.PreviewInline(id);

    this.ValidateButtons();
};

LinkGeneratorClass.prototype.UpgradeOldType = function(type){
    if(type == 'overlay-widget')
        type = 'overlay-widget-v1';
    return type;
};

LinkGeneratorClass.prototype.AddElementRow = function(row){
    $('#elements-list-table > tbody').append(row);
    this.SortTable();
};

LinkGeneratorClass.prototype.SortTable = function(){
    var $table=$('#elements-list-table');
    var rows = $table.find('tr').get();
    rows.sort(function(a, b) {
        var keyA = $(a).attr('id');
        var keyB = $(b).attr('id');
        if (keyA > keyB) return 1;
        if (keyA < keyB) return -1;
        return 0;
    });
    $.each(rows, function(index, row) {
        $table.children('tbody').append(row);
    });
}

LinkGeneratorClass.prototype.ShowLinkGeneratorCode = function(){

    var that = this;
    if(this.m_CurrentCodeName==null){
        this.SaveCodeToServer(false,true,true);
        return;
    }
    else
        this.SaveCodeToServer(false,true,false);

    var codeHtml = '<div style="max-width:500px;padding-top:10px;">'+lzm_inputControls.createArea('livezilla-code',this.GetCodeWrapper(),'',tid('code_title'),'height:120px;width:100%;font-size:11px;font-family:Monospace;','autocomplete="off" autocorrect="off" autocapitalize="off" spellcheck="false"');
    codeHtml += lzm_inputControls.createRadio('code-type-dynamic', 'top-space', 'code-type', '<b>Dynamic Code</b>', true);
    codeHtml += '<div class="left-space-child bottom-space lzm-info-text">'+tid('code_dynamic')+'</div>';
    codeHtml += lzm_inputControls.createRadio('code-type-static', '', 'code-type', '<b>Static Code</b>', false);
    codeHtml += '<div class="left-space-child lzm-info-text">'+tid('code_static')+'</div></div>';

    lzm_commonDialog.createAlertDialog(codeHtml, [{id: 'copy', name: tid('copy')}, {id: 'close', name: tid('close')}],true,true,false);

    $('#livezilla-code').click(function() {this.select();});
    $('#alert-btn-copy').click(function() {
        if(!IFManager.IsMobileOS)
        {
            var $temp = $("<input>")
            $("body").append($temp);
            $temp.val($('#livezilla-code').text()).select();
            document.execCommand("copy");
            $temp.remove();
            lzm_commonDialog.removeAlertDialog();
        }
    });
    $('#alert-btn-close').click(function() {
        lzm_commonDialog.removeAlertDialog();
    });
    $('.code-type').change(function() {

        if(!$('#code-type-static').attr('checked'))
            $('#livezilla-code').text(that.GetCodeWrapper());
        else
            $('#livezilla-code').text(that.GetCode(false));
    });

    if(UIRenderer.getSettingsProperty(this.GetElementsFromRows(false)[0].m_Settings,'m_UsePassThruStandard').value
        ||UIRenderer.getSettingsProperty(this.GetElementsFromRows(false)[0].m_Settings,'m_UsePassThruCustom').value
        ||this.isTypeSelected('inlay-image')){
        $('#code-type-dynamic').parent().addClass('ui-disabled');
        $('#code-type-static').prop('checked','true');
    }

    $('.code-type').change();
};

LinkGeneratorClass.prototype.SettleStaticFields = function(from,to){
    for(var i=0;i<to.length;i++){
        var exEleme = new LinkGeneratorElement(to[i].m_Type,to[i]);
        exEleme.LoadSettings(from.m_Settings,true);
        $('#'+exEleme.GetLineId()).replaceWith(exEleme.GetElementRow());
    }
};

LinkGeneratorClass.prototype.GetCodeWrapper = function(){
    return '<!-- livezilla.net code --><script type="text/javascript" id="' + this.m_CurrentCodeId +'" src="'+DataEngine.getServerUrl('script.php')+'?id=' + this.m_CurrentCodeId +'"></script><!-- http://www.livezilla.net -->';
};

LinkGeneratorClass.prototype.GetCode = function(_preview){

    var code = '', code_elem = '';
    var elements = [];
    try
    {
        elements['inlay-image'] = this.GetElement('inlay-image');
        elements['inlay-text'] =  this.GetElement('inlay-text');
        elements['monitoring'] =  this.GetElement('monitoring');
        elements['overlay-button-v1'] = this.GetElement('overlay-button-v1');
        elements['overlay-button-v2'] = null;
        elements['overlay-widget-v1'] = null;
        elements['overlay-widget-v2'] = this.GetElement('overlay-widget-v2');
        elements['no-tracking'] = this.GetElement('no-tracking');

        var combiMode = false;
        var sid = lzm_commonTools.guid().substr(0,3);
        if(this.isTypeSelected('monitoring'))
        {
            var srobcode = (_preview) ? '' : ('_' + this.m_CurrentCodeId);
            code_elem = '<div id="lvztr_'+sid+'" style="display:none"></div><script id="lz_r_scr'+srobcode+'" type="text/javascript"><!--wm_object--><!--ec_object-->lz_code_id="'+this.m_CurrentCodeId+'";var script = document.createElement("script");script.async=true;script.type="text/javascript";var src = "<!--server--><!--addition_track-->"+Math.random();script.src=src;document.getElementById(\'lvztr_'+sid+'\').appendChild(script);</script><noscript><img src="<!--server-->&quest;rqst=track&amp;output=nojcrpt" width="0" height="0" style="visibility:hidden;" alt=""></noscript>';
            code_elem = code_elem.replace(/<!--addition_track-->/g,'?rqst=track&output=jcrpt' + this.GetCodeParameters('monitoring',elements['monitoring'],'&') + '&nse=');
            code += code_elem;
        }
        if(this.isTypeSelected('inlay-image'))
        {
            code += '<a href="javascript:void(window.open(\'<!--server_chat--><!--addition-->\',\'\',\'width=<!--width-->,height=<!--height-->,left=0,top=0,resizable=yes,menubar=no,location=no,status=yes,scrollbars=yes\'))" class="<!--class-->"><img src="<!--server_image-->?id=<!--image_set-->&type=inlay" width="<!--image_set_width-->" height="<!--image_set_height-->" style="border:0px;" alt="LiveZilla Live Chat Software"></a>';
            code = code.replace(/<!--class-->/g,'lz_cbl');
            code = code.replace(/<!--image_set-->/, elements['inlay-image'].GetProperty('m_SelectedImageSet').value);
            code = code.replace(/<!--image_set_width-->/, elements['inlay-image'].GetProperty('m_SelectedImageWidth').value);
            code = code.replace(/<!--image_set_height-->/, elements['inlay-image'].GetProperty('m_SelectedImageHeight').value);
            code = code.replace(/<!--addition-->/g,this.GetCodeParameters('inlay-image',elements['inlay-image'],'&'));
        }
        if(this.isTypeSelected('overlay-button-v1'))
        {
            code += '<!--hide_element_open--><a href="javascript:void(window.open(\'<!--server_chat--><!--addition-->\',\'\',\'width=<!--width-->,height=<!--height-->,left=0,top=0,resizable=yes,menubar=no,location=no,status=yes,scrollbars=yes\'))" class="<!--class-->"><img <!--img_id-->src="<!--server_image-->?id=<!--image_set-->&type=overlay" width="<!--image_set_width-->" height="<!--image_set_height-->" style="border:0px;" alt="LiveZilla Live Chat Software"></a><!--hide_element_close-->';
            code = code.replace(/<!--image_set-->/, elements['overlay-button-v1'].GetProperty('m_SelectedImageSet').value);
            code = code.replace(/<!--image_set_width-->/, elements['overlay-button-v1'].GetProperty('m_SelectedImageWidth').value);
            code = code.replace(/<!--image_set_height-->/, elements['overlay-button-v1'].GetProperty('m_SelectedImageHeight').value);
            code = code.replace(/<!--addition-->/g,this.GetCodeParameters('overlay-button-v1',elements['overlay-button-v1'],'&'));
        }

        if(this.isTypeSelected('overlay-button-v1') || this.isTypeSelected('overlay-button-v2')){
            code = code.replace(/<!--img_id-->/g,'id="chat_button_image" ');
            code = code.replace(/<!--hide_element_open-->/g,'<div style=\"display:none;\">');
            code = code.replace(/<!--hide_element_close-->/g,'</div>');
            code = code.replace(/<!--class-->/g,'lz_fl');
        }

        if(this.isTypeSelected('overlay-widget-v2'))
        {
            code = code.replace(/<!--wm_object-->/g,this.GetWelcomeManagerObject(elements['overlay-widget-v2'],combiMode));
            code = code.replace(/<!--ec_object-->/g,this.GetEyeCatcherObject(elements['overlay-widget-v2']));
        }

        if(this.isTypeSelected('inlay-text')){
            var guid = lzm_commonTools.guid();
            code += '<script type="text/javascript" class="lz_text_link" id="'+guid+'" src="<!--server_image--><!--values-->&sid='+guid+'"></script>';
            var values = "?tl=1&srv=" + lz_global_base64_encode(DataEngine.getServerUrl('chat.php') + '?v=2' + this.GetCodeParameters('inlay-text',elements['inlay-text'],'&'));
            if(elements['inlay-text'].GetProperty('m_TextOnline').value.length>0)values += "&tlont=" + lz_global_base64_url_encode(elements['inlay-text'].GetProperty('m_TextOnline').value);
            if(elements['inlay-text'].GetProperty('m_TextOffline').value.length>0)values += "&tloft=" + lz_global_base64_url_encode(elements['inlay-text'].GetProperty('m_TextOffline').value);
            if(elements['inlay-text'].GetProperty('m_CSSStyleOnline').value.length>0)values += "&tlons=" + lz_global_base64_url_encode(elements['inlay-text'].GetProperty('m_CSSStyleOnline').value);
            if(elements['inlay-text'].GetProperty('m_CSSStyleOffline').value.length>0)values += "&tlofs=" + lz_global_base64_url_encode(elements['inlay-text'].GetProperty('m_CSSStyleOffline').value);
            if(elements['inlay-text'].GetProperty('m_OnlineOnly').value)values += "&tloo=" + lz_global_base64_url_encode(1);
            values += this.GetCodeParameters('inlay-text',elements['inlay-text'],'&');
            code = code.replace(/<!--values-->/g,values);
        }

        if(this.isTypeSelected('no-tracking')){
            code += '<a onclick="lz_tracking_deactivate(lz_global_base64_decode(\'<!--confirmation-->\'),<!--days-->)" href="javascript:void(0);"><!--title--></a>';
            code = code.replace(/<!--confirmation-->/g,lz_global_base64_encode(elements['no-tracking'].GetProperty('m_OptOutTrackingConfirmation').value));
            code = code.replace(/<!--title-->/g,(elements['no-tracking'].GetProperty('m_OptOutTrackingTitle').value));
            code = code.replace(/<!--days-->/g,elements['no-tracking'].GetProperty('m_OptOutTrackingTime').value);
        }

        code = code.replace(/<!--c-->/g,'');
        code = code.replace(/<!--width-->/g,DataEngine.getConfigValue('wcl_window_width'));
        code = code.replace(/<!--height-->/g,DataEngine.getConfigValue('wcl_window_height'));
        code = code.replace(/<!--hide_element_open-->/g,'');
        code = code.replace(/<!--hide_element_close-->/g,'');
        code = code.replace(/<!--img_id-->/g,'');
        code = code.replace(/<!--addition-->/g,'');
        code = code.replace(/<!--wm_object-->/g,'');
        code = code.replace(/<!--ec_object-->/g,'');
        code = code.replace(/<!--server_image-->/g, DataEngine.getServerUrl('image.php'));
        code = code.replace(/<!--server_chat-->/g,DataEngine.getServerUrl('chat.php')+ '?v=2');
        code = code.replace(/<!--server-->/g,DataEngine.getServerUrl('server.php'));
    }
    catch(ex)
    {
        deblog(ex);
    }
    return '<!-- livezilla.net PLACE IN BODY -->'+code+'<!-- http://www.livezilla.net -->';
};

LinkGeneratorClass.prototype.GetEyeCatcherObject = function(e){

    var object = 'lz_ovlec = ';
    try
    {
        if (e.GetProperty('m_ECUse').value && e.GetProperty('m_ECTypeOptions').value==1)
        {
            object += '{';

            object += 'ec_br:' + e.GetProperty('m_ECBubbleBorderRadius').value + ',';
            object += 'ec_bgcs:\'' + e.GetProperty('m_ECBubbleColorBGStart').value + '\',';
            object += 'ec_bgce:\'' + e.GetProperty('m_ECBubbleColorBGEnd').value + '\',';
            object += 'ec_bw:' + e.GetProperty('m_ECBubbleBorderWidth').value + ',';
            object += 'ec_bcs:\'' + e.GetProperty('m_ECBubbleBorderColorStart').value + '\',';
            object += 'ec_bce:\'' + e.GetProperty('m_ECBubbleBorderColorEnd').value + '\',';

            if(e.GetProperty('m_ECBubbleShadowUse').value)
            {
                object += 'ec_shx:' + e.GetProperty('m_ECBubbleShadowX').value + ',';
                object += 'ec_shy:' + e.GetProperty('m_ECBubbleShadowY').value + ',';
                object += 'ec_shb:' + e.GetProperty('m_ECBubbleShadowBlur').value + ',';
                object += 'ec_shc:\'' + e.GetProperty('m_ECBubbleShadowColor').value + '\',';
            }

            object += 'ec_m:[0,' + e.GetProperty('m_ECMarginRight').value + ',' + e.GetProperty('m_ECMarginBottom').value + ',0],';
            object += 'ec_ht_c:\'' + e.GetProperty('m_ECBubbleTitleTextColor').value + '\',';
            object += 'ec_st_c:\'' + e.GetProperty('m_ECBubbleSubTextColor').value + '\',';

            if(e.GetProperty('m_ECBubblePersonalize').value)
                object += 'ec_p:' + e.GetProperty('m_ECBubblePersonalize').value + ',';

            object += 'ec_a_bc:\'' + e.GetProperty('m_ECBubbleAvatarBorderColor').value + '\',';
            object += 'ec_a_bw:' + e.GetProperty('m_ECBubbleAvatarBorderWidth').value + ',';
            object += 'ec_a_bgc:\'' + e.GetProperty('m_ECBubbleAvatarBGColor').value + '\',';

            if(e.GetProperty('m_ECFadeIn').value)
            {
                object += 'ec_fi:' + e.GetProperty('m_ECFadeInTime').value + ',';
            }

            if(e.GetProperty('m_ECFadeOut').value)
            {
                object += 'ec_fo:' + e.GetProperty('m_ECFadeOutTime').value + ',';
            }

            if(!e.GetProperty('m_ECShowOnline').value)
            {
                object += 'ec_dson:1,';
            }

            if(!e.GetProperty('m_ECHideOnPhone').value)
            {
                object += 'ec_som:1,';
            }

            if(!e.GetProperty('m_ECShowOffline').value)
            {
                object += 'ec_dsof:1,';
            }

            object += 'ec_w:' + e.GetProperty('m_ECWidth').value + ',';
            object += 'ec_h:' + e.GetProperty('m_ECHeight').value + '';
            object += '};';
        }
        else
            object += 'null;';
    }
    catch(ex)
    {
        deblog(ex);
    }
    return object;
};

LinkGeneratorClass.prototype.GetWelcomeManagerObject = function(e,_combiMode){

    var object = 'lz_ovlel = ';
    if(!_combiMode)
    {
        object += '[{type:"wm",icon:"commenting"}';

        if(e.GetProperty('m_LiveChats').value)
            object += ',{type:"chat",icon:"comments",counter:true}';

        if(e.GetProperty('m_CreateTicket').value)
            object += ',{type:"ticket",icon:"envelope"}';

        if(e.GetProperty('m_Knowledgebase').value)
            object += ',{type:"knowledgebase",icon:"lightbulb-o",counter:true}';

        if(e.GetProperty('m_PhoneInbound').value || e.GetProperty('m_PhoneOutbound').value)
        {
            object += ',{type:"phone",icon:"phone",inbound:';

            if(e.GetProperty('m_PhoneInbound').value)
                object += '{number:"'+lz_global_base64_url_encode(e.GetProperty('m_PhoneInboundNumber').value)+'",text:"'+lz_global_base64_url_encode(e.GetProperty('m_PhoneInboundText').value)+'"}';
            else
                object += 'false';

            object += ',outbound:';
            if(e.GetProperty('m_PhoneOutbound').value)
                object += 'true}';
            else
                object += 'false}';
        }

        if(e.GetProperty('m_SocialMedia').value)
        {
            if(e.GetProperty('m_SocialMediaFacebook').value)
                object += ',{type:"facebook",icon:"facebook",color:"#3b5998",margin:[0,0,20,0],href:"'+lz_global_base64_url_encode(e.GetProperty('m_SocialMediaFacebookURL').value)+'"}';

            if(e.GetProperty('m_SocialMediaTwitter').value)
                object += ',{type:"twitter",icon:"twitter",color:"#4099FF",href:"'+lz_global_base64_url_encode(e.GetProperty('m_SocialMediaTwitterURL').value)+'"}';

            if(e.GetProperty('m_SocialMediaGoogle').value)
                object += ',{type:"google",icon:"google-plus-official",color:"#4285F4",href:"'+lz_global_base64_url_encode(e.GetProperty('m_SocialMediaGoogleURL').value)+'"}';

            if(e.GetProperty('m_SocialMediaYoutube').value)
                object += ',{type:"youtube",icon:"youtube",color:"#e62117",href:"'+lz_global_base64_url_encode(e.GetProperty('m_SocialMediaYoutubeURL').value)+'"}';

        }
        object += '];';
    }
    else
        object += '[];';

    if(e.GetProperty('m_APIMode').value)
    {
        object += 'lz_ovlel_api = true;';
    }

    if(e.GetProperty('m_IconSize').value > 1)
    {
        object += 'lz_ovlel_rat = ' + e.GetProperty('m_IconSize').value + ';';
    }

    return object;
};

LinkGeneratorClass.prototype.GetCodeParameters = function(type,element,bind){
    var i,parameters = '';
    var defElem = new LinkGeneratorElement(type);
    var speElem = null;

    bind = (typeof bind == 'undefined') ? '?' : bind;

    if(element.GetProperty('m_TargetOperator').value){
        parameters += bind + "intid=" + lz_global_base64_url_encode(element.GetProperty('m_TargetOperatorId').value);
        bind = '&';
    }

    if(element.GetProperty('m_TargetGroup').value){
        parameters += bind + "intgroup=" + lz_global_base64_url_encode(element.GetProperty('m_TargetGroupId').value);
        bind = '&';

    }

    if(element.GetProperty('m_HideGroups').value){
        if(element.GetProperty('m_HideAllOtherGroups').value){
            parameters += bind + "hg=" + lz_global_base64_url_encode('?');
            bind = '&';
        }
        else{
            var groups = DataEngine.groups.getGroupList('id',true,false);
            var hgroups = '';
            for (i=0; i<groups.length; i++)
                if(element.GetProperty('m_HideGroup' + md5(groups[i].id)).value)
                    hgroups += ('?' + groups[i].id);

            parameters += bind + "hg=" + lz_global_base64_url_encode(hgroups);
            bind = '&';
        }
    }

    if(element.GetProperty('m_FieldArea').value.length > 0){
        parameters += bind + "code=" + ((element.GetProperty('m_FieldArea').value.indexOf(LinkGeneratorClass.DataPassThruPlaceholder)!=0) ? lz_global_base64_url_encode(element.GetProperty('m_FieldArea').value) : element.GetProperty('m_FieldArea').value);
        bind = '&';
    }

    if(element.GetProperty('m_Field111').value.length > 0){
        parameters += bind + "en=" + ((element.GetProperty('m_Field111').value.indexOf(LinkGeneratorClass.DataPassThruPlaceholder)!=0) ? lz_global_base64_url_encode(element.GetProperty('m_Field111').value) : element.GetProperty('m_Field111').value);
        bind = '&';
    }

    if(element.GetProperty('m_Field112').value.length > 0){
        parameters += bind + "ee=" + ((element.GetProperty('m_Field112').value.indexOf(LinkGeneratorClass.DataPassThruPlaceholder)!=0) ? lz_global_base64_url_encode(element.GetProperty('m_Field112').value) : element.GetProperty('m_Field112').value);
        bind = '&';
    }

    if(element.GetProperty('m_Field113').value.length > 0){
        parameters += bind + "ec=" + ((element.GetProperty('m_Field113').value.indexOf(LinkGeneratorClass.DataPassThruPlaceholder)!=0) ? lz_global_base64_url_encode(element.GetProperty('m_Field113').value) : element.GetProperty('m_Field113').value);
        bind = '&';
    }

    if(element.GetProperty('m_LanguageSelect').value){
        parameters += bind + "el=" + lz_global_base64_url_encode(element.GetProperty('m_Language').value);
        bind = '&';
    }

    if(element.GetProperty('m_Field114').value.length > 0){
        parameters += bind + "eq=" + ((element.GetProperty('m_Field114').value.indexOf(LinkGeneratorClass.DataPassThruPlaceholder)!=0) ? lz_global_base64_url_encode(element.GetProperty('m_Field114').value) : element.GetProperty('m_Field114').value);
        bind = '&';
    }

    if(element.GetProperty('m_Field116').value.length > 0){
        parameters += bind + "ep=" + ((element.GetProperty('m_Field116').value.indexOf(LinkGeneratorClass.DataPassThruPlaceholder)!=0) ? lz_global_base64_url_encode(element.GetProperty('m_Field116').value) : element.GetProperty('m_Field116').value);
        bind = '&';
    }

    if(element.GetProperty('m_FieldLogoURL').value.length > 0){
        parameters += bind + "eh=" + ((element.GetProperty('m_FieldLogoURL').value.indexOf(LinkGeneratorClass.DataPassThruPlaceholder)!=0) ? lz_global_base64_url_encode(element.GetProperty('m_FieldLogoURL').value) : element.GetProperty('m_FieldLogoURL').value);
        bind = '&';
    }

    for (i=0; i<10; i++)
        if(element.GetProperty('m_CustomField' + i).value.length > 0){
            parameters += bind + 'cf'+i+'=' + ((element.GetProperty('m_CustomField' + i).value.indexOf(LinkGeneratorClass.DataPassThruPlaceholder)!=0) ? lz_global_base64_url_encode(element.GetProperty('m_CustomField' + i).value) : element.GetProperty('m_CustomField' + i).value);
            bind = '&';
        }

    if(element.GetProperty('m_ChatStartsInstantly').value){
        parameters += bind + "dl=" + lz_global_base64_url_encode(1);
        bind = '&';
    }
    else if(element.GetProperty('m_Field111').value.length>0){
        parameters += bind + "mp=" + lz_global_base64_url_encode(1);
        bind = '&';
    }

    if(element.GetProperty('m_HideGroupSelectionChats').value){
        parameters += bind + "hcgs=" + lz_global_base64_url_encode(1);
        bind = '&';
    }

    if(element.GetProperty('m_HideGroupSelectionTickets').value){
        parameters += bind + "htgs=" + lz_global_base64_url_encode(1);
        bind = '&';
    }

    if(element.GetProperty('m_GroupSelectionPosition').value==1){
        parameters += bind + "grot=" + lz_global_base64_url_encode(1);
        bind = '&';
    }

    if(element.GetProperty('m_ForceGroupSelection').value){
        parameters += bind + "rgs=" + lz_global_base64_url_encode(1);
        bind = '&';
    }

    if(element.GetProperty('m_NoChatInvites').value){
        parameters += bind + "hinv=" + lz_global_base64_url_encode(1);
        bind = '&';
    }

    if(element.GetProperty('m_PhoneOutbound').value){
        parameters += bind + "ofc=" + lz_global_base64_url_encode(1);
        bind = '&';
    }

    if(!element.GetProperty('m_CreateTicket').value){
        parameters += bind + "nct=" + lz_global_base64_url_encode(1);
        bind = '&';
    }

    if(!element.GetProperty('m_LiveChats').value){
        parameters += bind + "hfc=" + lz_global_base64_url_encode(1);
        bind = '&';
    }

    if(element.GetProperty('m_LiveChatsGroup').value && !this.isTypeSelected('overlay-widget-v1')){
        parameters += bind + "pgc=" + lz_global_base64_url_encode(element.GetProperty('m_LiveChatsGroupId').value);
        bind = '&';
    }

    if(!element.GetProperty('m_Knowledgebase').value){
        parameters += bind + "hfk=" + lz_global_base64_url_encode(1);
        bind = '&';
    }

    if(element.GetProperty('m_Knowledgebase').value && element.GetProperty('m_KnowledgebaseCustomRoot').value && element.GetProperty('m_KnowledgebaseCustomRootFolder').value){
        parameters += bind + "ckf=" + lz_global_base64_url_encode(lz_global_trim(element.GetProperty('m_KnowledgebaseCustomRootFolder').value));
        bind = '&';
    }

    if(type != 'monitoring' || this.isTypeSelected('overlay-button-v2')){
        speElem = element;
        if(defElem.GetProperty('m_PrimaryColor').value != speElem.GetProperty('m_PrimaryColor').value){
            parameters += bind + "epc=" + lz_global_base64_url_encode(speElem.GetProperty('m_PrimaryColor').value);
            bind = '&';
        }
        if(defElem.GetProperty('m_SecondaryColor').value != speElem.GetProperty('m_SecondaryColor').value){
            parameters += bind + "esc=" + lz_global_base64_url_encode(speElem.GetProperty('m_SecondaryColor').value);
            bind = '&';
        }
    }
    if(type == 'monitoring' && this.isTypeSelected('inlay-image')){
        speElem = this.GetElement('inlay-image');
        if(speElem.GetProperty('m_OnlineOnly').value){
            parameters += bind + "cboo=" + lz_global_base64_url_encode(1);
            bind = '&';
        }
        if(speElem.GetProperty('m_ForceGroupSelection').value){
            parameters += bind + "rgs=" + lz_global_base64_url_encode(1);
            bind = '&';
        }
    }
    if(type == 'monitoring' && (this.isTypeSelected('overlay-button-v1') || this.isTypeSelected('overlay-button-v2'))){

        if(this.isTypeSelected('overlay-button-v1'))
            speElem = this.GetElement('overlay-button-v1');
        else
            speElem = this.GetElement('overlay-button-v2');

        parameters += bind + "fbpos=" + (lzm_commonTools.GetPositionIndex(speElem.GetProperty('m_Position').value));
        bind = '&';
        parameters += bind + "fbw=" + (speElem.GetProperty('m_SelectedImageWidth').value);
        parameters += bind + "fbh=" + (speElem.GetProperty('m_SelectedImageHeight').value);

        if(speElem.GetProperty('m_MarginLeft').value>0)parameters += bind + "fbml=" + (speElem.GetProperty('m_MarginLeft').value);
        if(speElem.GetProperty('m_MarginTop').value>0)parameters += bind + "fbmt=" + (speElem.GetProperty('m_MarginTop').value);
        if(speElem.GetProperty('m_MarginRight').value>0)parameters += bind + "fbmr=" + (speElem.GetProperty('m_MarginRight').value);
        if(speElem.GetProperty('m_MarginBottom').value>0)parameters += bind + "fbmb=" + (speElem.GetProperty('m_MarginBottom').value);

        if(speElem.GetProperty('m_UseShadow').value){
            if(speElem.GetProperty('m_PositionX').value>0)parameters += bind + "fbshx=" + lz_global_base64_url_encode(speElem.GetProperty('m_PositionX').value);
            if(speElem.GetProperty('m_PositionY').value>0)parameters += bind + "fbshy=" + lz_global_base64_url_encode(speElem.GetProperty('m_PositionY').value);
            if(speElem.GetProperty('m_ShadowColor').value!='#000000')parameters += bind + "fbshc=" + lz_global_base64_url_encode(speElem.GetProperty('m_ShadowColor').value);
            if(speElem.GetProperty('m_Blur').value>0)parameters += bind + "fbshb=" + lz_global_base64_url_encode(speElem.GetProperty('m_Blur').value);
        }

        if(speElem.GetProperty('m_OnlineOnly').value)parameters += bind + "fboo=" + lz_global_base64_url_encode(1);
    }

    if(type == 'monitoring' && (this.isTypeSelected('overlay-widget-v1')||this.isTypeSelected('overlay-widget-v2'))){

        if(this.isTypeSelected('overlay-widget-v1'))
        {
            speElem = this.GetElement('overlay-widget-v1');
            if(!speElem.GetProperty('m_TextDefault').value && speElem.GetProperty('m_TextOnline').value.length > 0)
                parameters += bind + "ovlt=" + lz_global_base64_url_encode(speElem.GetProperty('m_TextOnline').value);
            if(!speElem.GetProperty('m_TextDefault').value && speElem.GetProperty('m_TextOnline').value.length > 0)
                parameters += bind + "ovlto=" + lz_global_base64_url_encode(speElem.GetProperty('m_TextOffline').value);
            if(defElem.GetProperty('m_SecondaryColor').value != speElem.GetProperty('m_SecondaryColor').value)
                parameters += bind + "ovlct=" + lz_global_base64_url_encode(speElem.GetProperty('m_SecondaryColor').value);
        }

        if(this.isTypeSelected('overlay-widget-v2')){

            speElem = this.GetElement('overlay-widget-v2');
            parameters += bind + "ovlv=" + lz_global_base64_url_encode('v2');

            if(speElem.GetProperty('m_LeaveMessageWhenOnline').value)
                parameters += bind + "ovltwo=" + lz_global_base64_url_encode('1');

            if(speElem.GetProperty('m_LiveChatsGroup').value){
                parameters += bind + "pgc=" + lz_global_base64_url_encode(speElem.GetProperty('m_LiveChatsGroupId').value);
                bind = '&';
            }
        }

        parameters += bind + "ovlc=MQ__";
        bind = '&';

        parameters += bind + "esc=" + lz_global_base64_url_encode(speElem.GetProperty('m_SecondaryColor').value);
        bind = '&';

        parameters += bind + "epc=" + lz_global_base64_url_encode(speElem.GetProperty('m_PrimaryColor').value);
        bind = '&';

        if(!speElem.GetProperty('m_HeaderTextShadow').value)
            parameters += bind + "ovlts=" + lz_global_base64_url_encode('0');

        if(lzm_commonTools.GetPositionIndex(speElem.GetProperty('m_Position').value) != '22')
            parameters += bind + "ovlp=" + lz_global_base64_url_encode(lzm_commonTools.GetPositionIndex(speElem.GetProperty('m_Position').value));

        if(speElem.GetProperty('m_MarginLeft').value>0)parameters += bind + "ovlml=" + lz_global_base64_url_encode(speElem.GetProperty('m_MarginLeft').value);
        if(speElem.GetProperty('m_MarginTop').value>0)parameters += bind + "ovlmt=" + lz_global_base64_url_encode(speElem.GetProperty('m_MarginTop').value);

        if((!this.isTypeSelected('overlay-widget-v2') && speElem.GetProperty('m_MarginRight').value>0) || (this.isTypeSelected('overlay-widget-v2') && speElem.GetProperty('m_MarginRight').value != 40))
            parameters += bind + "ovlmr=" + lz_global_base64_url_encode(speElem.GetProperty('m_MarginRight').value);

        if((!this.isTypeSelected('overlay-widget-v2') && speElem.GetProperty('m_MarginBottom').value>0) || (this.isTypeSelected('overlay-widget-v2') && speElem.GetProperty('m_MarginBottom').value != 30))
            parameters += bind + "ovlmb=" + lz_global_base64_url_encode(speElem.GetProperty('m_MarginBottom').value);

        if(speElem.GetProperty('m_UseShadow').value){
            if(speElem.GetProperty('m_PositionX').value>0)parameters += bind + "ovlsx=" + lz_global_base64_url_encode(speElem.GetProperty('m_PositionX').value);
            if(speElem.GetProperty('m_PositionY').value>0)parameters += bind + "ovlsy=" + lz_global_base64_url_encode(speElem.GetProperty('m_PositionY').value);
            if(speElem.GetProperty('m_ShadowColor').value!='#000000')parameters += bind + "ovlsc=" + lz_global_base64_url_encode(speElem.GetProperty('m_ShadowColor').value);
            if(speElem.GetProperty('m_Blur').value>0)parameters += bind + "ovlsb=" + lz_global_base64_url_encode(speElem.GetProperty('m_Blur').value);
        }

        if(speElem.GetProperty('m_OnlineOnly').value)
            parameters += bind + "ovloo=" + lz_global_base64_url_encode('1');

        if(speElem.GetProperty('m_ShowOnlyWhenInvited').value)
            parameters += bind + "ovlio=" + lz_global_base64_url_encode('1');

        if(speElem.GetProperty('m_OpenExternalWindow').value)
            parameters += bind + "ovloe=" + lz_global_base64_url_encode('1');

        if(speElem.GetProperty('m_PhoneHide').value)
            parameters += bind + "hots=" + lz_global_base64_url_encode('1');

        if(speElem.GetProperty('m_TabletHide').value)
            parameters += bind + "hott=" + lz_global_base64_url_encode('1');

        if(speElem.GetProperty('m_PhoneExternal').value)
            parameters += bind + "oets=" + lz_global_base64_url_encode('1');

        if(speElem.GetProperty('m_TabletExternal').value)
            parameters += bind + "oett=" + lz_global_base64_url_encode('1');

        if(speElem.GetProperty('m_PopOut').value)
            parameters += bind + "ovlapo=" + lz_global_base64_url_encode('1');

        if(speElem.GetProperty('m_BorderRadius').value != 6)
            parameters += bind + "ovlbr=" + lz_global_base64_url_encode(speElem.GetProperty('m_BorderRadius').value);

        if(!speElem.GetProperty('m_DimensionsAuto').value){
            parameters += bind + "ovlw=" + lz_global_base64_url_encode(speElem.GetProperty('m_DimensionsWidth').value);
            parameters += bind + "ovlh=" + lz_global_base64_url_encode(speElem.GetProperty('m_DimensionsHeight').value);
        }

        if(speElem.GetProperty('m_ECUse').value)
        {
            if(speElem.GetProperty('m_ECTypeOptions').value == 2)
            {
                parameters += bind + "eca=" + lz_global_base64_url_encode(speElem.GetProperty('m_ECTypeOptions').value);
                parameters += bind + "ecw=" + lz_global_base64_url_encode(speElem.GetProperty('m_ECWidth').value);
                parameters += bind + "ech=" + lz_global_base64_url_encode(speElem.GetProperty('m_ECHeight').value);
                parameters += bind + "ecmb=" + lz_global_base64_url_encode(speElem.GetProperty('m_ECMarginBottom').value);
                parameters += bind + "ecmr=" + lz_global_base64_url_encode(speElem.GetProperty('m_ECMarginRight').value);
                if(speElem.GetProperty('m_ECFadeIn').value && speElem.GetProperty('m_ECFadeInTime').value > 0)
                    parameters += bind + "ecfi=" + lz_global_base64_url_encode(speElem.GetProperty('m_ECFadeInTime').value);

                if(speElem.GetProperty('m_ECFadeOut').value && speElem.GetProperty('m_ECFadeOutTime').value > 0)
                    parameters += bind + "ecfo=" + lz_global_base64_url_encode(speElem.GetProperty('m_ECFadeOutTime').value);

                if(speElem.GetProperty('m_ECHideOnPhone').value)
                    parameters += bind + "echm=" + lz_global_base64_url_encode('1');
            }

            if(speElem.GetProperty('m_ECTypeOptions').value == 0)
            {
                /*
                if(!speElem.GetProperty('m_ECBubbleTitleDefault').value){
                    parameters += bind + "echt=" + lz_global_base64_url_encode(speElem.GetProperty('m_ECBubbleTitleOnline').value);
                    parameters += bind + "ecoht=" + lz_global_base64_url_encode(speElem.GetProperty('m_ECBubbleTitleOffline').value);
                }

                if(!speElem.GetProperty('m_ECBubbleSubTitleDefault').value){
                    parameters += bind + "echst=" + lz_global_base64_url_encode(speElem.GetProperty('m_ECBubbleSubTitleOnline').value);
                    parameters += bind + "ecohst=" + lz_global_base64_url_encode(speElem.GetProperty('m_ECBubbleSubTitleOffline').value);
                }

                if(defElem.GetProperty('m_ECBubbleColorBGStart').value != speElem.GetProperty('m_ECBubbleColorBGStart').value)
                    parameters += bind + "ecfs=" + lz_global_base64_url_encode(speElem.GetProperty('m_ECBubbleColorBGStart').value);

                if(defElem.GetProperty('m_ECBubbleColorBGEnd').value != speElem.GetProperty('m_ECBubbleColorBGEnd').value)
                    parameters += bind + "ecfe=" + lz_global_base64_url_encode(speElem.GetProperty('m_ECBubbleColorBGEnd').value);

                if(speElem.GetProperty('m_ECBubbleBorderWidth').value != 2)
                    parameters += bind + "ecslw=" + lz_global_base64_url_encode(speElem.GetProperty('m_ECBubbleBorderWidth').value);

                if(defElem.GetProperty('m_ECBubbleBorderColorStart').value != speElem.GetProperty('m_ECBubbleBorderColorStart').value)
                    parameters += bind + "ecsgs=" + lz_global_base64_url_encode(speElem.GetProperty('m_ECBubbleBorderColorStart').value);

                if(defElem.GetProperty('m_ECBubbleBorderColorEnd').value != speElem.GetProperty('m_ECBubbleBorderColorEnd').value)
                    parameters += bind + "ecsge=" + lz_global_base64_url_encode(speElem.GetProperty('m_ECBubbleBorderColorEnd').value);

                if(speElem.GetProperty('m_ECBubbleShadowUse').value){
                    parameters += bind + "ecsa=" + lz_global_base64_url_encode('1');
                    parameters += bind + "ecsb=" + lz_global_base64_url_encode(speElem.GetProperty('m_ECBubbleShadowBlur').value);
                    parameters += bind + "ecsx=" + lz_global_base64_url_encode(speElem.GetProperty('m_ECBubbleShadowX').value);
                    parameters += bind + "ecsy=" + lz_global_base64_url_encode(speElem.GetProperty('m_ECBubbleShadowY').value);

                    if(defElem.GetProperty('m_ECBubbleShadowColor').value != speElem.GetProperty('m_ECBubbleShadowColor').value)
                        parameters += bind + "ecsc=" + lz_global_base64_url_encode(speElem.GetProperty('m_ECBubbleShadowColor').value);
                }

                if(speElem.GetProperty('m_ECPersonalize').value)
                    parameters += bind + "ecsp=" + lz_global_base64_url_encode('1');
                    */

            }
            else
            {
                if(speElem.GetProperty('m_ECShowOnline').value)
                    parameters += bind + "eci=" + lz_global_base64_url_encode(speElem.GetProperty('m_ECImageURLOnline').value);
                else
                    parameters += bind + "eci=";

                if(speElem.GetProperty('m_ECShowOffline').value)
                    parameters += bind + "ecio=" + lz_global_base64_url_encode(speElem.GetProperty('m_ECImageURLOffline').value);
                else
                    parameters += bind + "ecio=";
            }
        }
    }

    return parameters;
};

LinkGeneratorClass.prototype.LoadImageSets = function(type){
    var that = this;
    $('#image-sets-list-table tbody').empty();
    that.m_MaxImageSetId = 0;
    CommunicationEngine.pollServerDiscrete('get_banner_list').done(function(data) {
        var xmlDoc = $.parseXML(data);
        var offlineButton, onlineButton = null;
        var toSelectIndex = 0, cindex = 0;
        $(xmlDoc).find('button').each(function(){
            var buttonxml = $(this);
            var button = {imagetype: lz_global_base64_decode(buttonxml.attr('t')), type:lz_global_base64_decode(buttonxml.attr('type')),name:lz_global_base64_decode(buttonxml.attr('name')),data:lz_global_base64_decode(buttonxml.attr('data'))};
            if((type.indexOf('inlay') != -1 && button.name.indexOf('inlay') == -1) || (type.indexOf('overlay') != -1 && button.name.indexOf('overlay') == -1))
                return true;
            var dataId = lz_global_base64_decode(buttonxml.attr('id'));
            that.m_MaxImageSetId = Math.max(that.m_MaxImageSetId,dataId);
            if(lz_global_base64_decode(buttonxml.attr('o'))==0){
                offlineButton = button;
                var id = md5(onlineButton.name);
                var buttonName = lz_global_base64_decode(buttonxml.attr('type')) + " " + lz_global_base64_decode(buttonxml.attr('id'));
                $('#image-sets-list-table > tbody').append('<tr id="'+id+'" data-id="'+dataId+'" data-width="0" data-height="0" data-button="'+lz_global_base64_url_encode(JSON.stringify([onlineButton,offlineButton]))+'" onclick="selectLinkGeneratorImage(\'' +id+ '\');" class="image-sets-list-line"><td style="width:20px;padding:4px;" class="text-center"><i class="fa fa-image icon-large"></i></td><td>'+buttonName+'</td></tr>');

                var img = new Image();
                img.onload = function(){
                    $('#' + id).attr('data-width',this.width);
                    $('#' + id).attr('data-height',this.height);
                    $('tr','#image-sets-list-table > tbody').eq(toSelectIndex).click();
                };
                img.src = 'data:image/'+button.imagetype+';base64,' + onlineButton.data;


                if(dataId == $('#m_SelectedImageSet').val())
                    toSelectIndex = cindex;
                cindex++;
            }
            else{
                onlineButton = button;
            }
        });
    }).fail(function(jqXHR, textStatus, errorThrown){alert(textStatus);});
};


function LinkGeneratorElement(_type,_cloneObj) {
    var that = this;
    var al = lzm_commonTools.clone(lzm_chatDisplay.availableLanguages);
    var hiddenGroupList = [], routingOpArray = [], routingGrArray = [], dynGroupArray = [], langArray = [], langCodeArray = Object.keys(al);
    for (i=0; i<langCodeArray.length; i++)
        langArray.push({value: langCodeArray[i], text: langCodeArray[i].toUpperCase() + ' - ' + al[langCodeArray[i]]});

    for(var i=0;i<DataEngine.groups.idList.length;i++){
        var groupObj = DataEngine.groups.getGroup(DataEngine.groups.idList[i]);
        if(typeof groupObj.members != 'undefined')
            dynGroupArray.push({value: DataEngine.groups.idList[i], text: groupObj.name});
    }
    if(dynGroupArray.length==0)
        dynGroupArray.push({value: 'no_dyn_group', text: tid('no_dyn_group')});

    var operators = DataEngine.operators.getOperatorList('name','',true,false);
    for (i=0; i<operators.length; i++)
        routingOpArray.push({value: operators[i].userid, text: operators[i].name});

    var groups = DataEngine.groups.getGroupList('id',true,false);
    for (i=0; i<groups.length; i++)
    {
        routingGrArray.push({value: groups[i].id, text: groups[i].id});
        hiddenGroupList.push({name:'m_HideGroup' + md5(groups[i].id), static:true, type:'bool', class:'m_HideGroups m_HideAllOtherGroups', value: false, title: groups[i].id, left:'single'});
    }

    this.m_Icons = [];
    this.m_Icons['inlay-image']={icon:'fa fa-image',iconcss:'font-size:32px;'};
    this.m_Icons['inlay-text']={icon:'fa fa-navicon',iconcss:''};
    this.m_Icons['overlay-button-v1']={icon:'fa fa-arrows-v',iconcss:'margin-left:10px;'};
    this.m_Icons['overlay-button-v2']={icon:'fa fa-arrows-v',iconcss:'margin-left:10px;'};
    this.m_Icons['overlay-widget-v1']={icon:'fa fa-square-o',iconcss:'margin-left:4px;'};
    this.m_Icons['overlay-widget-v2']={icon:'fa fa-square-o',iconcss:'margin-left:4px;'};
    this.m_Icons['monitoring']={icon:'fa fa-search',iconcss:''};
    this.m_Icons['no-tracking']={icon:'fa fa-shield',iconcss:'margin-left:4px;'};

    this.m_Settings = [
        {name:'General', title: t('General'), groups: [
            {name: 'Protocol', title: tid('protocol'), controls: [
                {name:'m_ProtocolHTTP', type:'radio', group: 'prot-select', value: true, title: 'HTTP', static: true},
                {name:'m_ProtocolHTTPS', type:'radio', group: 'prot-select', value: false, top:'half', title: 'HTTPS', static: true}
            ]},
            {name: 'General', title: t('General'), controls: [
                {name:'m_OnlineOnly', type:'bool', value: false, title: t('Online only (hide when operators are offline)')},
                {name:'m_ShowOnlyWhenInvited', type:'bool', value: false, title: t('Invite only (hide unless there is a chat invite)'), not: ['inlay-image','inlay-text','overlay-button-v1','overlay-button-v2']},
                {name:'m_OpenExternalWindow', type:'bool', value: false, title: t('Open external Chat Window'), not: ['inlay-image','inlay-text','overlay-button-v1','overlay-button-v2']},
                {name:'m_PopOut', type:'bool', value: true, title: t('Allow "Popout" (switch from on-site to off-site chat)'), not: ['inlay-image','inlay-text','overlay-button-v1','overlay-button-v2']},
                {name:'m_LeaveMessageWhenOnline', type:'bool', value: true, title: t('Visitors can leave a message when operators are online')}
            ], not: ['monitoring']},
            {name: 'GUILanguage', title: t('GUI Language'), controls: [
                {name:'m_LanguageAuto', type:'radio', group: 'language-select', value: true, title: t('Automatic (Browser Language)'), static: true},
                {name:'m_LanguageSelect', type:'radio', group: 'language-select', value: false, title: tidc('language'), static: true},
                {name:'m_Language', type:'array', value: 'auto', options: langArray, left: 'single', top:'half', static: true}
            ]},
            {name: 'TouchDevices', title: t('TouchDevices'), controls: [
                {name:'m_TouchDevicesPhone', type:'label', title: t('Phone')},
                {name:'m_PhoneHide', type:'bool', value:false, title: t('Hide on Smartphones')},
                {name:'m_PhoneExternal', type:'bool', value: false, title: t('Open external Chat Window')},
                {name:'m_TouchDevicesTablet', type:'label', title: t('Tablet'), top:'single'},
                {name:'m_TabletHide', type:'bool', value: false, title: t('Hide on Tablets')},
                {name:'m_TabletExternal', type:'bool', value: false, title: t('Open external Chat Window')}
            ], not: ['inlay-image','inlay-text','overlay-button-v1' ,'overlay-button-v2','monitoring']}
        ], not:['no-tracking']},
        {name:'Colors', title: t('Colors'), groups: [
            {name: 'Colors', title: t('Colors'), controls: [
                {name:'m_PrimaryColor', type:'color', value:'#73BE28', title: t('Primary Color')},
                {name:'m_SecondaryColor', type:'color', value:'#448800', title: t('Secondary Color')},
                {name:'m_HeaderTextShadow', type:'bool', value: false, title: tid('header_text_shadow'), not: ['inlay-image' ,'inlay-text' ,'overlay-button-v1' ,'overlay-button-v2','overlay-widget-v2' ,'monitoring' ,'no-tracking']}
            ]}
        ],not:['no-tracking']},
        {name:'Images', title: t('Images'), groups: [
            {name: 'Images', title: t('Images'), controls: [
                {name:'m_SelectedImageSet', type:'hidden', value: 0},
                {name:'m_SelectedImageWidth', type:'hidden', value: 0},
                {name:'m_SelectedImageHeight', type:'hidden', value: 0}
            ], custom: true }
        ], not:['inlay-text', 'overlay-widget-v1','overlay-widget-v2','monitoring' ,'no-tracking']},
        {name:'Services', title: t('Services'), groups: [
            {name: 'Live Chats', title: t('Live Chats'), controls: [
                {name:'m_LiveChats', type:'bool', value: true, title: t('Live Chats')},
                {name:'m_LiveChatsPrivate', type:'radio', group: 'live-chat-select', value: true, top:'half', title: t('Private Conversation between Customer and Operator'), left: 'single'},
                {name:'m_LiveChatsGroup', type:'radio', group: 'live-chat-select', value: false,top:'half', title: t('Public Conversation among all participants of the group:'), left: 'single', not:['overlay-widget-v1']},
                {name:'m_LiveChatsGroupId', type:'array', value:'no_dyn_group', options: dynGroupArray, left: 'double',bottom:'single',top:'half', not:['overlay-widget-v1']}
            ]},
            {name: 'Tickets', title: t('Tickets'), controls: [
                {name:'m_CreateTicket', type:'bool', value: true, title: t('Create Ticket (Leave Message)')}
            ]},
            {name: 'Knowledgebase', title: tid('knowledgebase'), controls: [
                {name:'m_Knowledgebase', type:'bool', value: true, title: tid('knowledgebase')},
                {name:'m_KnowledgebaseMainRoot', type:'radio', class:'m_Knowledgebase', group: 'knowledgebase_root', value: true, top:'half', title: tid('knowledgebase_default_root'), left:'single', static:true},
                {name:'m_KnowledgebaseCustomRoot', type:'radio', class:'m_Knowledgebase', group: 'knowledgebase_root', value: false,top:'half', title: tid('knowledgebase_custom_root'), left:'single', static:true},
                {name:'m_KnowledgebaseCustomRootFolder', type:'string', class:'m_Knowledgebase', value: '', title: '', left:'double', top:'half',bottom:'single',static:true}
            ]},
            {name: 'Phone', title: t('Phone'), controls: [
                {name:'m_PhoneOutbound', type:'bool', value: false, title: t('Phone Outbound (Callback Service)')},
                {name:'m_PhoneInbound', type:'bool', value: false, top:'single', title: t('Phone Inbound (Hotline)'), not:['monitoring','overlay-widget-v1','inlay-image','inlay-text','overlay-button-v1']},
                {name:'m_PhoneInboundNumber', type:'string', value: '', title: t('Phone:'), left:'single', top:'single', not:['monitoring','overlay-widget-v1','inlay-image','inlay-text','overlay-button-v1']},
                {name:'m_PhoneInboundText', type:'string', value: '', title: t('Info Text:'), left:'single', top:'single', bottom:'single', not:['monitoring','overlay-widget-v1','inlay-image','inlay-text','overlay-button-v1']}
            ],not:['overlay-widget-v1']},
            {name: 'Custom Links', title: t('Custom Links'), controls: [
                {name:'m_CustomLinks', type:'bool', value: false, title: t('Custom Links')},
                {name:'m_CustomLink1', class:'m_CustomLinks', type:'bool', value: false, title: t('Custom Link')+" 1"},
                {name:'m_CustomLinkTitle1', class:'m_CustomLink1', type:'string', value: '', title: '',titleleft:tidc('title')},
                {name:'m_CustomLinkURL1', class:'m_CustomLink1', type:'string', value: '', title: '',titleleft:tidc('url')},
                {name:'m_CustomLink2', class:'m_CustomLinks',type:'bool', value: false, title: t('Custom Link')+" 2"},
                {name:'m_CustomLinkTitle2',class:'m_CustomLink2', type:'string', value: '', title: '',titleleft:tidc('title')},
                {name:'m_CustomLinkURL2',class:'m_CustomLink2', type:'string', value: '', title: '',titleleft:tidc('url')},
                {name:'m_CustomLink3', class:'m_CustomLinks', type:'bool', value: false, title: t('Custom Link')+" 3"},
                {name:'m_CustomLinkTitle3',class:'m_CustomLink3', type:'string', value: '', title: '',titleleft:tidc('title')},
                {name:'m_CustomLinkURL3',class:'m_CustomLink3', type:'string', value: '', title: '',titleleft:tidc('url')}
            ], not:['overlay-widget-v1' ,'overlay-widget-v2', 'monitoring', 'inlay-image','inlay-text','overlay-button-v1'], custom: true},
            {name: 'Social Media', title: t('Social Media'), controls: [
                {name:'m_SocialMedia', type:'bool', value: false, title: t('Social Media')},
                {name:'m_SocialMediaFacebook', class:'m_SocialMedia',type:'bool', value: false, title: t('Facebook')},
                {name:'m_SocialMediaFacebookURL',class:'m_SocialMediaFacebook',  type:'string', value:'', title:'',titleleft:tidc('url')},
                {name:'m_SocialMediaTwitter', class:'m_SocialMedia',type:'bool', value: false, title: t('Twitter')},
                {name:'m_SocialMediaTwitterURL', class:'m_SocialMediaTwitter', type:'string', value:'', title:'',titleleft:tidc('url')},
                {name:'m_SocialMediaGoogle', class:'m_SocialMedia',type:'bool', value: false, title: t('Google')},
                {name:'m_SocialMediaGoogleURL', class:'m_SocialMediaGoogle', type:'string', value:'', title:'',titleleft:tidc('url')},
                {name:'m_SocialMediaYoutube', class:'m_SocialMedia',type:'bool', value: false, title: t('Youtube')},
                {name:'m_SocialMediaYoutubeURL', class:'m_SocialMediaYoutube', type:'string', value:'', title:'',titleleft:tidc('url')}
            ], not:['overlay-widget-v1' , 'monitoring', 'inlay-image','inlay-text','overlay-button-v1'], custom: true}
        ], not:['monitoring','no-tracking']},
        {name:'Position', title: t('Position'), groups: [
            {name: 'Position', title: t('Position'), controls: [
                {name:'m_Position', type:'position', value:'left middle', title: t('')}
            ]}
        ], not:['inlay-image' ,'inlay-text' ,'monitoring' ,'no-tracking','overlay-widget-v2']},
        {name:'Margin', title: t('Margin'), groups: [
            {name: 'Margin', title: t('Margin'), controls: [
                {name:'m_MarginTop', type:'int', value:0, title: t('Top:'), not:['overlay-widget-v2'],titleright:'px'},
                {name:'m_MarginRight', type:'int', value:0, title: t('Right:'), top: 'single',titleright:'px'},
                {name:'m_MarginBottom', type:'int', value:0, title: t('Bottom:'), top: 'single',titleright:'px'},
                {name:'m_MarginLeft', type:'int', value:0, title: t('Left:'), top: 'single', not:['overlay-widget-v2'],titleright:'px'}
            ]}
        ], not:['inlay-image' ,'inlay-text' ,'monitoring' ,'no-tracking']},
        {name:'Shadow', title: t('Shadow'), groups: [
            {name: 'Shadow', title: t('Shadow'), controls: [
                {name:'m_UseShadow', type:'bool', value: false, title: t('Shadow')},
                {name:'m_ShadowColor', type:'color', class:'m_UseShadow', value:'#696969', title: t('Color:'), left:'single', top: 'single'},
                {name:'m_PositionX', type:'int', class:'m_UseShadow', value: 0, title: t('X-Position'), left:'single'},
                {name:'m_PositionY', type:'int', class:'m_UseShadow', value: 0, title: t('Y-Position:'), left:'single', top: 'single'},
                {name:'m_Blur', type:'int', class:'m_UseShadow', value: 0, title: t('Blur:'), left:'single', top: 'single'}
            ]}
        ], not:['inlay-image' ,'inlay-text' ,'monitoring' ,'no-tracking','overlay-widget-v2']},
        {name:'Texts', title: tid('texts'), groups: [
            {name: 'Texts', title: tid('texts'), controls: [
                {name:'m_TextDefault', type:'bool', value: true, title: t('Use Default')},
                {name:'m_TextOnline', type:'string', value: tid('inlay_text_online'), title: tid('online'), left: 'single', top: 'single'},
                {name:'m_TextOffline', type:'string', value: tid('inlay_text_offline'), title: tid('offline'), top: 'single', bottom: 'single', left: 'single'}
            ]},
            {name: 'Texts', title: tid('css'), controls: [
                {name:'m_CSSStyleOnline', type:'string', value: '', title: tid('css_style_online')},
                {name:'m_CSSStyleOffline', type:'string', value: '', title: tid('css_style_offline'), top: 'single'}
            ], not:['overlay-widget-v1']}
        ], not:['inlay-image','monitoring','overlay-button-v1','overlay-button-v2','no-tracking','overlay-widget-v2']},
        {name:'Script', title: t('Script'), groups: [
            {name: 'Script', title: t('Script'), controls: [
                {name:'m_AdditionalHTML', type:'area', value:'', title: t('Custom HTML:')}
            ]}
        ],not:['overlay-widget-v1','overlay-widget-v2' ,'monitoring', 'inlay-image','inlay-text','overlay-button-v1','no-tracking']},
        {name:'Routing', title: t('Routing'), groups: [
            {name: 'Operator', title: tid('operator'), controls: [
                {name:'m_TargetOperator', type:'bool', value: false, title: tid('target_operator'), static:true},
                {name:'m_TargetOperatorId', type:'array', value: '', options: routingOpArray, left:'single', static:true}
            ]},
            {name: 'Group', title: t('Group'), controls: $.merge([
                {name:'m_TargetGroup', type:'bool', value: false, title: t('Target Group:'), static:true},
                {name:'m_TargetGroupId', type:'array', value: '', options: routingGrArray, left:'single', static:true},
                {name:'m_HideGroups', type:'bool', value: false, title: t('Hide Groups'), top:'single', static:true},
                {name:'m_HideAllOtherGroups', class:'m_HideGroups', type:'bool', value: false, title: t('Hide all other groups'), top:'half', left:'single', static:true}
            ],hiddenGroupList)}
        ],not:['no-tracking']},
        {name:'Dimensions', title: t('Dimensions'), groups: [
            {name: 'Dimensions', title: t('Dimensions'), controls: [
                {name:'m_DimensionsAuto', type:'bool', value: true, title: tid('automatic')},
                {name:'m_DimensionsWidth', type:'int', value: '280', left:'single', title: t('Width:')+' (px)', top:'single'},
                {name:'m_DimensionsHeight', type:'int', value: '500', left:'single', title: t('Height:')+' (px)', top:'single'}
            ]},
            {name: 'Border Radius', title: tid('border_radius'), controls: [
                {name:'m_BorderRadius', type:'int', value: '6', title:tid('border_radius')+': (px)'}
            ]},
            {name: 'Icon Size', title: 'Icons', controls: [
                {name:'m_IconSize', type:'array', value: '1', options: [{value: 1, text: tid("small")},{value: 1.2, text: tid('medium')},{value: 1.4, text: tid('large')}]}
            ],not:['inlay-image' ,'inlay-text' ,'overlay-button-v1' ,'overlay-button-v2' ,'overlay-widget-v1' ,'no-tracking' ,'monitoring']}
        ],not:['inlay-image' ,'inlay-text' ,'overlay-button-v1' ,'overlay-button-v2' ,'no-tracking' ,'monitoring']},

        {name:'OptOutTracking', title: tid('no-tracking'), groups: [
            {name: 'OptOutTracking', title: tid('no-tracking'), controls: [
                {name:'m_OptOutTrackingTitle', type:'string', value: t('I want to deactivate tracking'), title: t('Link Title:')},
                {name:'m_OptOutTrackingConfirmation', type:'area', value:t('Thank you. Tracking has been deactivated.'), title: t('Confirmation Text:')},
                {name:'m_OptOutTrackingTime', type:'int', value: 10, title: t('Exclusion period (days):'), top: 'single'}
            ]}
        ],not:['inlay-image' ,'inlay-text' ,'overlay-button-v1' ,'overlay-button-v2' ,'overlay-widget-v1','overlay-widget-v2' ,'monitoring']},
        {name:'Eye Catcher', title: t('Eye-Catcher'), groups: [
            {name: 'EyeCatcher', title: t('Eye-Catcher'), controls: [
                {name:'m_ECUse', type:'bool', value: true, title: t('Eye-Catcher')},
                {name:'m_ECTypeLabel', class:'m_ECUse', type:'label', left:'single', title: tidc('type'), top:'single'},
                {name:'m_ECTypeOptions', class:'m_ECUse', type:'array', value: 1, options: [{value: 1, text: t('Bubble')},{value: 2, text: t('Image')}], left:'single', title: ''},
                {name:'m_ECHideOnPhone', class:'m_ECUse', type:'bool', value: true, left:'single', top:'single', title: tid('hide_mobile_device')},
                {name:'m_ECPersonalize', class:'m_ECUse', type:'bool', value: true, left:'single', title: t('Personalize (Show Operator Picture and Name)'),not:['overlay-widget-v2']},
                {name:'m_ECShowOnline', class:'m_ECUse', type:'bool', value: true, top:'single', left:'single', title: tid('online')},
                {name:'m_ECShowOffline', class:'m_ECUse', type:'bool', value: true, left:'single', title: tid('offline')}
            ]},
            {name: 'ECBubble', class:'m_ECUse m_ECTypeOptionsBubble', title: t('Bubble'), controls: [
                {name:'m_ECBubbleBorderRadius', type:'int', value: '2', title: tidc('border_radius'), left:'single',titleright:'px', top:'single'},
                {name:'m_ECBubbleColorBGStart', type:'color', class:'', value:'#ffffff', title: tidc('background_start_color'), left:'single', top:'double'},
                {name:'m_ECBubbleColorBGEnd', type:'color', class:'', value:'#ffffff', title: tidc('background_end_color'), left:'single', top:'single'},
                {name:'m_ECBubbleBorderWidth', type:'int', value: 0, title: tidc('line_width'), left:'single',titleright:'px', top:'single'},
                {name:'m_ECBubbleBorderColorStart', type:'color', class:'', value:'#6EA30C', title: tidc('border_start_color'), left:'single', top:'double'},
                {name:'m_ECBubbleBorderColorEnd', type:'color', class:'', value:'#6EA30C', title: tidc('border_end_color'), left:'single', top:'single'},
                {name:'m_ECBubbleShadowUse', type:'bool', value: true, title: tidc('shadow'), left:'single', top:'double'},
                {name:'m_ECBubbleShadowX', class:'m_ECBubbleShadowUse', type:'int', value: '1', title: tidc('x_positions'), left:'double', top:'single'},
                {name:'m_ECBubbleShadowY', class:'m_ECBubbleShadowUse', type:'int', value: '1', title: tidc('y_positions'), left:'double', top:'single'},
                {name:'m_ECBubbleShadowBlur', class:'m_ECBubbleShadowUse', type:'int', value: '3', title: tidc('blur'), left:'double', top:'single'},
                {name:'m_ECBubbleShadowColor', class:'m_ECBubbleShadowUse', type:'color', value:'#222222', title: tidc('color'), left:'double', top:'single'},
                {name:'m_ECBubblePersonalize', type:'bool', value: true, title: tid('personalize'), left:'single', top:'double'},
                {name:'m_ECBubbleAvatarBorderColor', class:'m_ECBubblePersonalize', type:'color', value:'#ffffff', title: tidc('avatar',' ') + tidc('border_color'), left:'double', top:'single'},
                {name:'m_ECBubbleAvatarBorderWidth', class:'m_ECBubblePersonalize', type:'int', value: '2', title: tidc('avatar',' ') + tidc('line_width'), left:'double',titleright:'px', top:'single'},
                {name:'m_ECBubbleAvatarBGColor', class:'m_ECBubblePersonalize', type:'color', value:'#73be28', title: tidc('avatar',' ') + tidc('background',' ')+tidc('color'), left:'double', top:'double'}
            ]},
            {name: 'ECImage', class:'m_ECUse m_ECTypeOptionsImage', title: t('Custom Images'), controls: [
                {name:'m_ECImageURLOnline', type:'string', value:'https://', title: t('Online:')+' (URL)', left:'single',top:'single'},
                {name:'m_ECImageURLOffline', type:'string', value:'https://', title: t('Offline:')+' (URL)', left:'single', top:'double', bottom:'single'}
            ]},
            {name: 'ECDimensions', class:'m_ECUse', title: t('Dimensions'), controls: [
                {name:'m_ECWidth', type:'int', value: '300', title: tidc('width'), left:'single', titleright:'px',top:'single'},
                {name:'m_ECHeight', type:'int', value: '150', title: tidc('height'), left:'single', top:'double',titleright:'px', bottom:'single'}
            ]},
            {name: 'ECMargin', class:'m_ECUse', title: tidc('margin'), controls: [
                {name:'m_ECMarginBottom', type:'int', value: '78', title: tidc('bottom'), left:'single',titleright:'px',top:'single'},
                {name:'m_ECMarginRight', type:'int', value: '28', title: tidc('right'),top:'double', left:'single',titleright:'px',not:['overlay-widget-v1'], bottom:'single'}
            ]},
            {name: 'ECFade', class:'m_ECUse', title: t('Fade in') + ' / ' + t('Fade out'), controls: [
                {name:'m_ECFadeIn', type:'bool', value: false, title: t('Fade in')+': ('+t('Seconds')+')', left:'single',top:'single'},
                {name:'m_ECFadeInTime', class:'m_ECFadeIn', type:'int', value: 0, title: '', left:'double'},
                {name:'m_ECFadeOut', type:'bool', value: false, title: t('Fade out')+': ('+t('Seconds')+')', left:'single', top:'double'},
                {name:'m_ECFadeOutTime', class:'m_ECFadeOut', type:'int', value: 0, title: '', left:'double',bottom:'single'}
            ]},
            {name: 'ECBubbleTitle', class:'m_ECUse m_ECTypeOptionsBubble', title: t('Header Text'), controls: [
                /*
                {name:'m_ECBubbleTitleDefault', type:'bool', value: true, title: t('Use Default'), left:'single'},
                {name:'m_ECBubbleTitleOnline', class:'m_ECBubbleTitleDefault', type:'string', value:'', title: t('Online:'), left:'double', top:'single'},
                {name:'m_ECBubbleTitleOffline', class:'m_ECBubbleTitleDefault', type:'string', value:'', title: t('Offline:'), left:'double', top:'single'},
                */
                {name:'m_ECBubbleTitleTextColor', type:'color', class:'', value:'#666666', title: tidc('text_color'), left:'single',top:'single'}
            ]},
            {name: 'ECBubbleSubTitle', class:'m_ECUse m_ECTypeOptionsBubble', title: t('Sub Text'), controls: [
                /*
                {name:'m_ECBubbleSubTitleDefault', type:'bool', value: true, title: t('Use Default'), left:'single'},
                {name:'m_ECBubbleSubTitleOnline', class:'m_ECBubbleSubTitleDefault', type:'string', value:'', title: t('Online:'), left:'double', top:'single'},
                {name:'m_ECBubbleSubTitleOffline', class:'m_ECBubbleSubTitleDefault', type:'string', value:'', title: t('Offline:'), left:'double', top:'single', bottom:'single'},
                */
                {name:'m_ECBubbleSubTextColor', type:'color', class:'', value:'#777777', title: tidc('text_color'), left:'single',top:'single'}
            ]}
        ], not:['inlay-image' ,'inlay-text' ,'overlay-button-v1' ,'overlay-button-v2','monitoring' ,'no-tracking']},
        {name:'Advanced', title: tid('advanced'), groups: [
            {name: 'Parameters', title: tid('parameters'), controls: [
                {name:'m_ChatStartsInstantly', type:'bool', value: false, title: tid('instant_chat'), not:['all']},
                {name:'m_HideGroupSelectionChats', type:'bool', value: false, title: tid('hide_group_select_chats'), not:['monitoring'], static:true},
                {name:'m_HideGroupSelectionTickets', type:'bool', value: false, title: tid('hide_group_select_tickets'), not:['monitoring'], static:true},
                {name:'m_ForceGroupSelection', type:'bool', value: false, title: tid('require_select_group'), not:['monitoring'], static:true},
                {name:'m_NoChatInvites', type:'bool', value: false, title: tid('no_invite_code'), static: true},
                {name:'m_GroupSelectionPosition', type:'array', value: '0', options: [{value: 0, text: tid('group_below')},{value: 1, text: tid('group_above')}], left:'half', top: 'single', bottom:'single', not:['monitoring'], static:true}
            ]}
        ],not:['no-tracking']},
        {name:'APIMode', title: 'API Mode', groups: [
            {name: 'APIModeSettings', title: tid('settings'), controls: [
                {name:'m_APIMode', type:'bool', value: false, title: 'API Mode'}
            ]},
            {name: 'APIModeCommands', title: 'Javascript Commands', controls: [

            ], custom: true},
            {name: 'APIModeExamples', title: 'Examples', controls: [

            ], custom: true}
        ],not:['inlay-image' ,'inlay-text' ,'overlay-button-v1' ,'overlay-button-v2' ,'overlay-widget-v1','monitoring','no-tracking'], custom: true},
        {name:'Data', title: tid('data'), groups: [
            {name: 'StandardInputFields', title: tid('standard_input_fields'), controls: [
                {name:'m_UsePassThruStandard', type:'bool', value: false, title: tid('use_pass_thru'), static:true},
                {name:'m_PassThruStandardLink', type:'link', value: 'https://www.livezilla.net/faq/en/?fid=passthrudata', title: tid('pass_thru_link'), left:'single', top:'falf', persistent: false},
                {name:'m_Field111', type:'string', class:'m_UsePassThruStandard', dataattr: 'Name', value: '', title: tid('name') + ':', top:'single', static:true},
                {name:'m_Field112', type:'string', class:'m_UsePassThruStandard', dataattr: 'Email', value: '', title: tid('email') + ':', top:'single', static:true},
                {name:'m_Field113', type:'string', class:'m_UsePassThruStandard', dataattr: 'Company', value: '', title: tid('company') + ':', top:'single', static:true},
                {name:'m_Field114', type:'string', class:'m_UsePassThruStandard', dataattr: 'Question', value: '', title: tid('question') + ':', top:'single', static:true},
                {name:'m_Field116', type:'string', class:'m_UsePassThruStandard', dataattr: 'Phone', value: '', title: tid('phone') + ':', top:'single', static:true},
                {name:'m_FieldArea', type:'string', class:'m_UsePassThruStandard', dataattr: 'Area', value: '', title: tid('website_name') + ':', top:'single', static:true},
                {name:'m_FieldLogoURL', type:'string', class:'m_UsePassThruStandard', dataattr: 'Logo', value: '', title: tid('logo_url'), top:'single', bottom:'single', static:true}
            ]},
            {name: 'CustomInputFields', title: tid('custom_input_fields'), controls: [
                {name:'m_UsePassThruCustom', type:'bool', value: false, title: tid('use_pass_thru'), static:true},
                {name:'m_PassThruCustomLink', type:'link', value: 'https://www.livezilla.net/faq/en/?fid=passthrudata', title: tid('pass_thru_link'), left:'single', top:'falf', persistent: false},
                {name:'m_CustomField0', class:'m_UsePassThruCustom', type:'string', dataattr: 'CustomField1', value: '', title: tid('custom_field') + ' 1:', top:'single', static:true},
                {name:'m_CustomField1', class:'m_UsePassThruCustom', type:'string', dataattr: 'CustomField2', value: '', title: tid('custom_field') + ' 2:', top:'single', static:true},
                {name:'m_CustomField2', class:'m_UsePassThruCustom', type:'string', dataattr: 'CustomField3', value: '', title: tid('custom_field') + ' 3:', top:'single', static:true},
                {name:'m_CustomField3', class:'m_UsePassThruCustom', type:'string', dataattr: 'CustomField4', value: '', title: tid('custom_field') + ' 4:', top:'single', static:true},
                {name:'m_CustomField4', class:'m_UsePassThruCustom', type:'string', dataattr: 'CustomField5', value: '', title: tid('custom_field') + ' 5:', top:'single', static:true},
                {name:'m_CustomField5', class:'m_UsePassThruCustom', type:'string', dataattr: 'CustomField6', value: '', title: tid('custom_field') + ' 6:', top:'single', static:true},
                {name:'m_CustomField6', class:'m_UsePassThruCustom', type:'string', dataattr: 'CustomField7', value: '', title: tid('custom_field') + ' 7:', top:'single', static:true},
                {name:'m_CustomField7', class:'m_UsePassThruCustom', type:'string', dataattr: 'CustomField8', value: '', title: tid('custom_field') + ' 8:', top:'single', static:true},
                {name:'m_CustomField8', class:'m_UsePassThruCustom', type:'string', dataattr: 'CustomField9', value: '', title: tid('custom_field') + ' 9:', top:'single', static:true},
                {name:'m_CustomField9', class:'m_UsePassThruCustom', type:'string', dataattr: 'CustomField10', value: '', title: tid('custom_field') + ' 10:', top:'single', bottom:'single', static:true}
            ]}
        ],not:['no-tracking']}
    ];

    if(typeof _cloneObj != 'undefined' && _cloneObj != null)
    {
        this.m_Id = _cloneObj.m_Id;
        this.m_Type = _cloneObj.m_Type;
        this.LoadSettings(_cloneObj.m_Settings, false);
    }
    else
    {
        this.m_Id = _type;
        this.m_Type = _type;
    }

    this.m_Settings.forEach(function(entry_name) {
        entry_name.icon = that.m_Icons[_type].icon.replace('fa fa-','');
        entry_name.iconcss = that.m_Icons[_type].iconcss;
    });

    for (i=0; i<10; i++) {

        var name = DataEngine.inputList.objects[i].name;
        if(name.length)
            UIRenderer.getSettingsProperty(this.m_Settings,'m_CustomField' + i).title = name+":";
    }
}

LinkGeneratorElement.prototype.ApplyStaticFields = function(from) {
    var that = this;
    this.m_Settings.forEach(function(entry_name) {
        if($.inArray(that.m_Type,entry_name.not) === -1 && $.inArray('all',entry_name.not) === -1)
            entry_name.groups.forEach(function(entry_group)
            {
                if($.inArray(that.m_Type,entry_group.not) === -1 && $.inArray('all',entry_group.not) === -1){
                    entry_group.controls.forEach(function(entry_control) {
                        if($.inArray(that.m_Type,entry_control.not) === -1 && $.inArray('all',entry_control.not) === -1 && typeof entry_control.static != 'undefined'){
                            entry_control.value = from;
                        }
                    });
                }
            });
    });

};

LinkGeneratorElement.prototype.LoadSettings = function(settings, staticOnly) {
    for(var entry_name in settings){
        for(var s_entry_name in this.m_Settings){
            if(settings[entry_name].name == this.m_Settings[s_entry_name].name) {
                for(var entry_group in settings[entry_name].groups){
                    for(var s_entry_group in this.m_Settings[s_entry_name].groups){
                        if(settings[entry_name].groups[entry_group].name == this.m_Settings[s_entry_name].groups[s_entry_group].name) {
                            for(var entry_control in settings[entry_name].groups[entry_group].controls){
                                for(var s_entry_control in this.m_Settings[s_entry_name].groups[s_entry_group].controls){
                                    if(settings[entry_name].groups[entry_group].controls[entry_control].name == this.m_Settings[s_entry_name].groups[s_entry_group].controls[s_entry_control].name) {
                                        if(typeof this.m_Settings[s_entry_name].groups[s_entry_group].controls[s_entry_control].persistent == 'undefined')
                                            if(!staticOnly || typeof this.m_Settings[s_entry_name].groups[s_entry_group].controls[s_entry_control].static != 'undefined')
                                                this.m_Settings[s_entry_name].groups[s_entry_group].controls[s_entry_control].value = settings[entry_name].groups[entry_group].controls[entry_control].value;
                                    }
                                }
                            }
                        }
                    }
                }
            }
        }
    }
};

LinkGeneratorElement.prototype.ApplyLogicToForm = function(formType) {
    var that = this;
    if(formType == "General"){
        if ($('#r-m_LanguageAuto').prop('checked'))
            $('#sl-m_Language').addClass('ui-disabled');
        $('.language-select').change(function() {
            if ($('#r-m_LanguageSelect').prop('checked'))
                $('#sl-m_Language').removeClass('ui-disabled');
            else
                $('#sl-m_Language').addClass('ui-disabled');
        });
    }
    else if(formType == "Colors"){
        $('#ci-m_PrimaryColor').change(function() {
            if(lzm_commonTools.isHEXColor($('#ci-m_PrimaryColor').val()))
                $('#ci-m_PrimaryColor-icon').css({background:$('#ci-m_PrimaryColor').val()});
        });
        $('#ci-m_SecondaryColor').change(function() {
            if(lzm_commonTools.isHEXColor($('#ci-m_SecondaryColor').val()))
                $('#ci-m_SecondaryColor-icon').css({background:$('#ci-m_SecondaryColor').val()});
        });
    }
    else if(formType == "Images"){
        lzm_chatDisplay.LinkGenerator.LoadImageSets(that.m_Type);
    }
    else if(formType == "Services"){
        $('#cb-m_PhoneInbound').change(function() {
            if ($('#cb-m_PhoneInbound').prop('checked')) {
                $('#s-m_PhoneInboundNumber').removeClass('ui-disabled');
                $('#s-m_PhoneInboundText').removeClass('ui-disabled');
            } else {
                $('#s-m_PhoneInboundNumber').addClass('ui-disabled');
                $('#s-m_PhoneInboundText').addClass('ui-disabled');
            }
        });
        if(this.m_Type != 'overlay-widget-v1' && this.m_Type != 'overlay-widget-v2')
            $('#cb-m_LiveChats').change(function(){
                if ($('#cb-m_LiveChats').prop('checked') && $('#sl-m_LiveChatsGroupId').children('option')[0].value != 'no_dyn_group')
                    $('.live-chat-select').removeClass('ui-disabled');
                else
                    $('.live-chat-select').addClass('ui-disabled');
            });
        else if(this.m_Type != 'overlay-widget-v2'){
            $('#cb-m_LiveChats').parent().addClass('ui-disabled');
            $('#cb-m_Knowledgebase').parent().addClass('ui-disabled');
            $('#cb-m_CreateTicket').parent().addClass('ui-disabled');
            $('#r-m_LiveChatsPrivate').parent().addClass('ui-disabled');
        }

        $('.live-chat-select').change(function() {
            if ($('#r-m_LiveChatsGroup').prop('checked')) {
                $('#sl-m_LiveChatsGroupId').removeClass('ui-disabled');
            } else {
                $('#sl-m_LiveChatsGroupId').addClass('ui-disabled');
            }
        });
        $('#cb-m_CustomLinks').change(function(){
            if ($('#cb-m_CustomLinks').prop('checked'))
                $('.m_CustomLinks').removeClass('ui-disabled');
            else
                $('.m_CustomLinks').addClass('ui-disabled');
        });
        $('#cb-m_CustomLink1').change(function(){
            if ($('#cb-m_CustomLink1').prop('checked'))
                $('.m_CustomLink1').removeClass('ui-disabled');
            else
                $('.m_CustomLink1').addClass('ui-disabled');
        });
        $('#cb-m_CustomLink2').change(function(){
            if ($('#cb-m_CustomLink2').prop('checked'))
                $('.m_CustomLink2').removeClass('ui-disabled');
            else
                $('.m_CustomLink2').addClass('ui-disabled');
        });
        $('#cb-m_CustomLink3').change(function(){
            if ($('#cb-m_CustomLink3').prop('checked'))
                $('.m_CustomLink3').removeClass('ui-disabled');
            else
                $('.m_CustomLink3').addClass('ui-disabled');
        });


        $('#cb-m_SocialMedia').change(function(){
            if ($('#cb-m_SocialMedia').prop('checked'))
                $('.m_SocialMedia').removeClass('ui-disabled');
            else
                $('.m_SocialMedia').addClass('ui-disabled');
        });
        $('#cb-m_SocialMediaFacebook').change(function(){
            if ($('#cb-m_SocialMediaFacebook').prop('checked'))
                $('.m_SocialMediaFacebook').removeClass('ui-disabled');
            else
                $('.m_SocialMediaFacebook').addClass('ui-disabled');
        });
        $('#cb-m_SocialMediaTwitter').change(function(){
            if ($('#cb-m_SocialMediaTwitter').prop('checked'))
                $('.m_SocialMediaTwitter').removeClass('ui-disabled');
            else
                $('.m_SocialMediaTwitter').addClass('ui-disabled');
        });
        $('#cb-m_SocialMediaGoogle').change(function(){
            if ($('#cb-m_SocialMediaGoogle').prop('checked'))
                $('.m_SocialMediaGoogle').removeClass('ui-disabled');
            else
                $('.m_SocialMediaGoogle').addClass('ui-disabled');
        });
        $('#cb-m_SocialMediaYoutube').change(function(){
            if ($('#cb-m_SocialMediaYoutube').prop('checked'))
                $('.m_SocialMediaYoutube').removeClass('ui-disabled');
            else
                $('.m_SocialMediaYoutube').addClass('ui-disabled');
        });
        var fields = $('td', '#tbl-custom-links');
        for(var i = 0;i<3;i++){
            $('#cb-m_CustomLink'+(i+1)).parent().appendTo(fields.eq((i*3)+0));
            $('#s-m_CustomLinkTitle'+(i+1)).parent().parent().appendTo(fields.eq((i*3)+1));
            $('#s-m_CustomLinkURL'+(i+1)).parent().parent().appendTo(fields.eq((i*3)+2));
        }
        fields = $('td', '#tbl-social-media');
        $('#cb-m_SocialMediaFacebook').parent().appendTo(fields.eq(0));
        $('#s-m_SocialMediaFacebookURL').parent().parent().appendTo(fields.eq(1));
        $('#cb-m_SocialMediaTwitter').parent().appendTo(fields.eq(2));
        $('#s-m_SocialMediaTwitterURL').parent().parent().appendTo(fields.eq(3));
        $('#cb-m_SocialMediaGoogle').parent().appendTo(fields.eq(4));
        $('#s-m_SocialMediaGoogleURL').parent().parent().appendTo(fields.eq(5));
        $('#cb-m_SocialMediaYoutube').parent().appendTo(fields.eq(6));
        $('#s-m_SocialMediaYoutubeURL').parent().parent().appendTo(fields.eq(7));

        $('#cb-m_SocialMedia').parent().insertBefore( $('#tbl-social-media') );
        $('#cb-m_CustomLinks').parent().insertBefore( $('#tbl-custom-links') );

        $('#cb-m_Knowledgebase').change(function(){
            if ($('#cb-m_Knowledgebase').prop('checked')){
                $('.m_Knowledgebase').removeClass('ui-disabled');}
            else
                $('.m_Knowledgebase').addClass('ui-disabled');
        });
        $('.knowledgebase_root').change(function(){
            if ($('#r-m_KnowledgebaseCustomRoot').prop('checked')){
                $('#s-m_KnowledgebaseCustomRootFolder').removeClass('ui-disabled');}
            else{
                $('#s-m_KnowledgebaseCustomRootFolder').addClass('ui-disabled');}
        });
        $('#r-m_KnowledgebaseCustomRoot').change();
        $('#cb-m_Knowledgebase').change();
        $('#cb-m_PhoneInbound').change();
        $('#cb-m_LiveChats').change();
        $('.live-chat-select').change();
        $('#cb-m_CustomLinks').change();
        $('#cb-m_CustomLink1').change();
        $('#cb-m_CustomLink2').change();
        $('#cb-m_CustomLink3').change();
        $('#cb-m_SocialMedia').change();
        $('#cb-m_SocialMediaFacebook').change();
        $('#cb-m_SocialMediaTwitter').change();
        $('#cb-m_SocialMediaGoogle').change();
        $('#cb-m_SocialMediaYoutube').change();
    }
    else if(formType == "Shadow"){
        $('#cb-m_UseShadow').change(function() {
            if ($('#cb-m_UseShadow').prop('checked')) {
                $('.m_UseShadow').removeClass('ui-disabled');
            } else {
                $('.m_UseShadow').addClass('ui-disabled');
            }
        });
        $('#ci-m_ShadowColor').change(function() {
            if(lzm_commonTools.isHEXColor($('#ci-m_ShadowColor').val()))
                $('#ci-m_ShadowColor-icon').css({background:$('#ci-m_ShadowColor').val()});
        });
        $('#ci-m_ShadowColor').change();
        $('#cb-m_UseShadow').change();
    }
    else if(formType == "Position"){
        $('.po-m_Position').click(function() {
            $('.po-m_Position').removeClass('lzm-position-selected');
            $(this).addClass('lzm-position-selected');
        });
    }
    else if(formType == "Routing"){
        $('#cb-m_TargetOperator').change(function() {
            if ($('#cb-m_TargetOperator').prop('checked')) {
                $('#sl-m_TargetOperatorId').removeClass('ui-disabled');
            } else {
                $('#sl-m_TargetOperatorId').addClass('ui-disabled');
            }
        });
        $('#cb-m_TargetGroup').change(function() {
            if ($('#cb-m_TargetGroup').prop('checked')) {
                $('#sl-m_TargetGroupId').removeClass('ui-disabled');
            } else {
                $('#sl-m_TargetGroupId').addClass('ui-disabled');
            }
        });
        $('#cb-m_HideGroups').change(function() {
            if ($('#cb-m_HideGroups').prop('checked')) {
                $('.m_HideGroups').removeClass('ui-disabled');
            } else {
                $('.m_HideGroups').addClass('ui-disabled');
            }
        });
        $('#cb-m_HideAllOtherGroups').change(function() {
            if (!$('#cb-m_HideAllOtherGroups').prop('checked')) {
                $('.m_HideAllOtherGroups').removeClass('ui-disabled');
            } else {
                $('.m_HideAllOtherGroups').addClass('ui-disabled');
            }
        });
        $('#cb-m_HideAllOtherGroups').change();
        $('#cb-m_TargetOperator').change();
        $('#cb-m_TargetGroup').change();
        $('#cb-m_HideGroups').change();
    }
    else if(formType == "Eye Catcher")
    {
        $('#sl-m_ECTypeOptions').change(function() {
            if ($('#sl-m_ECTypeOptions').prop('selectedIndex')==0)
            {
                $('.m_ECTypeOptionsBubble').css({display:'block'});
                $('.m_ECTypeOptionsImage').css({display:'none'});
            }
            else
            {
                $('.m_ECTypeOptionsBubble').css({display:'none'});
                $('.m_ECTypeOptionsImage').css({display:'block'});
            }
        });

        $('#cb-m_ECUse').change(function() {
            if ($('#cb-m_ECUse').prop('checked'))
            {
                $('.m_ECUse').removeClass('ui-disabled');
            }
            else
            {
                $('.m_ECUse').addClass('ui-disabled');
            }
            $('#sl-m_ECTypeOptions').change();
        });



        $('#cb-m_ECFadeIn').change(function() {
            if ($('#cb-m_ECFadeIn').prop('checked'))
                $('.m_ECFadeIn').removeClass('ui-disabled');
            else
                $('.m_ECFadeIn').addClass('ui-disabled');
        });
        $('#cb-m_ECFadeOut').change(function() {
            if ($('#cb-m_ECFadeOut').prop('checked'))
                $('.m_ECFadeOut').removeClass('ui-disabled');
            else
                $('.m_ECFadeOut').addClass('ui-disabled');
        });
        /*
        $('#cb-m_ECBubbleSubTitleDefault').change(function() {
            if (!$('#cb-m_ECBubbleSubTitleDefault').prop('checked'))
                $('.m_ECBubbleSubTitleDefault').removeClass('ui-disabled');
            else
                $('.m_ECBubbleSubTitleDefault').addClass('ui-disabled');
        });
        */
        /*
        $('#cb-m_ECBubbleTitleDefault').change(function() {
            if (!$('#cb-m_ECBubbleTitleDefault').prop('checked'))
                $('.m_ECBubbleTitleDefault').removeClass('ui-disabled');
            else
                $('.m_ECBubbleTitleDefault').addClass('ui-disabled');
        });
        */
        $('#cb-m_ECBubbleShadowUse').change(function() {
            if ($('#cb-m_ECBubbleShadowUse').prop('checked'))
                $('.m_ECBubbleShadowUse').removeClass('ui-disabled');
            else
                $('.m_ECBubbleShadowUse').addClass('ui-disabled');
        });
        $('#cb-m_ECBubblePersonalize').change(function() {
            if ($('#cb-m_ECBubblePersonalize').prop('checked'))
                $('.m_ECBubblePersonalize').removeClass('ui-disabled');
            else
                $('.m_ECBubblePersonalize').addClass('ui-disabled');
        });

        $('#ci-m_ECBubbleColorBGStart').change(function() {
            if(lzm_commonTools.isHEXColor($('#ci-m_ECBubbleColorBGStart').val()))
                $('#ci-m_ECBubbleColorBGStart-icon').css({background:$('#ci-m_ECBubbleColorBGStart').val()});
        });
        $('#ci-m_ECBubbleColorBGEnd').change(function() {
            if(lzm_commonTools.isHEXColor($('#ci-m_ECBubbleColorBGEnd').val()))
                $('#ci-m_ECBubbleColorBGEnd-icon').css({background:$('#ci-m_ECBubbleColorBGEnd').val()});
        });
        $('#ci-m_ECBubbleTextColor').change(function() {
            if(lzm_commonTools.isHEXColor($('#ci-m_ECBubbleTextColor').val()))
                $('#ci-m_ECBubbleTextColor-icon').css({background:$('#ci-m_ECBubbleTextColor').val()});
        });
        $('#ci-m_ECBubbleBorderColorStart').change(function() {
            if(lzm_commonTools.isHEXColor($('#ci-m_ECBubbleBorderColorStart').val()))
                $('#ci-m_ECBubbleBorderColorStart-icon').css({background:$('#ci-m_ECBubbleBorderColorStart').val()});
        });
        $('#ci-m_ECBubbleBorderColorEnd').change(function() {
            if(lzm_commonTools.isHEXColor($('#ci-m_ECBubbleBorderColorEnd').val()))
                $('#ci-m_ECBubbleBorderColorEnd-icon').css({background:$('#ci-m_ECBubbleBorderColorEnd').val()});
        });
        $('#ci-m_ECBubbleShadowColor').change(function() {
            if(lzm_commonTools.isHEXColor($('#ci-m_ECBubbleShadowColor').val()))
                $('#ci-m_ECBubbleShadowColor-icon').css({background:$('#ci-m_ECBubbleShadowColor').val()});
        });

        $('#ci-m_ECBubbleAvatarBorderColor').change(function() {
            if(lzm_commonTools.isHEXColor($('#ci-m_ECBubbleAvatarBorderColor').val()))
                $('#ci-m_ECBubbleAvatarBorderColor-icon').css({background:$('#ci-m_ECBubbleAvatarBorderColor').val()});
        });

        $('#ci-m_ECBubbleAvatarBGColor').change(function() {
            if(lzm_commonTools.isHEXColor($('#ci-m_ECBubbleAvatarBGColor').val()))
                $('#ci-m_ECBubbleAvatarBGColor-icon').css({background:$('#ci-m_ECBubbleAvatarBGColor').val()});
        });

        $('#ci-m_ECBubbleTitleTextColor').change(function() {
            if(lzm_commonTools.isHEXColor($('#ci-m_ECBubbleTitleTextColor').val()))
                $('#ci-m_ECBubbleTitleTextColor-icon').css({background:$('#ci-m_ECBubbleTitleTextColor').val()});
        });

        $('#ci-m_ECBubbleSubTextColor').change(function() {
            if(lzm_commonTools.isHEXColor($('#ci-m_ECBubbleSubTextColor').val()))
                $('#ci-m_ECBubbleSubTextColor-icon').css({background:$('#ci-m_ECBubbleSubTextColor').val()});
        });

        //$('#cb-m_ECBubbleSubTitleDefault').change();
        //$('#cb-m_ECBubbleTitleDefault').change();
        $('#cb-m_ECBubbleShadowUse').change();
        $('#cb-m_ECBubblePersonalize').change();
        $('#cb-m_ECFadeIn').change();
        $('#cb-m_ECFadeOut').change();


        $('#sl-m_ECTypeOptions').change();
        $('#cb-m_ECUse').change();

        if(this.m_Type == 'overlay-widget-v2')
        {
            $('#cb-m_ECHideOnPhone').prop('checked',true);
            $('#cb-m_ECHideOnPhone').parent().addClass('ui-disabled');
        }
    }
    else if(formType == "Texts"){
        $('#cb-m_TextDefault').change(function() {
            if (!$('#cb-m_TextDefault').prop('checked')){
                $('#s-m_TextOnline').removeClass('ui-disabled');
                $('#s-m_TextOffline').removeClass('ui-disabled');
            }
            else{
                $('#s-m_TextOnline').addClass('ui-disabled');
                $('#s-m_TextOffline').addClass('ui-disabled');
            }
        });
        $('#cb-m_TextDefault').change();
    }
    else if(formType == "Dimensions"){
        $('#cb-m_DimensionsAuto').change(function() {
            if (!$('#cb-m_DimensionsAuto').prop('checked')){
                $('#int-m_DimensionsWidth').removeClass('ui-disabled');
                $('#int-m_DimensionsHeight').removeClass('ui-disabled');
            }
            else{
                $('#int-m_DimensionsWidth').addClass('ui-disabled');
                $('#int-m_DimensionsHeight').addClass('ui-disabled');
            }
        });
        $('#cb-m_DimensionsAuto').change();
    }
    else if(formType == "Advanced"){
        $('#cb-m_UsePassThruStandard').change(function() {
            var active = $('#cb-m_UsePassThruStandard').prop('checked');
            $('.m_UsePassThruStandard input').each(function(){
                var ph = LinkGeneratorClass.DataPassThruPlaceholder+$(this).attr('data-attr-name')+'-->';
                if ($(this).val() == ph && !active)
                    $(this).val('');
                else if($(this).val()== '' && active)
                    $(this).val(ph);
            });
        });
        $('#cb-m_UsePassThruCustom').change(function() {
            var active = $('#cb-m_UsePassThruCustom').prop('checked');
            $('.m_UsePassThruCustom input').each(function(){
                var ph = LinkGeneratorClass.DataPassThruPlaceholder+$(this).attr('data-attr-name')+'-->';
                if ($(this).val()==ph && !active)
                    $(this).val('');
                else if($(this).val()== '' && active)
                    $(this).val(ph);
            });
        });
    }
};

LinkGeneratorElement.prototype.GetLineId = function() {
    return 'element-list-line-'+this.m_Id;
};

LinkGeneratorElement.prototype.GUIToObject = function() {
    var that = this;
    this.m_Settings.forEach(function(entry_name) {
        if($.inArray(that.m_Type,entry_name.not) === -1 && $.inArray('all',entry_name.not) === -1)
            entry_name.groups.forEach(function(entry_group)
            {
                if($.inArray(that.m_Type,entry_group.not) === -1 && $.inArray('all',entry_group.not) === -1){
                    entry_group.controls.forEach(function(entry_control) {
                        if($.inArray(that.m_Type,entry_control.not) === -1 && $.inArray('all',entry_control.not) === -1){
                            var val = UIRenderer.GetControlValue(entry_control);
                            if(val != null)
                                entry_control.value = val;
                        }
                    });
                }
            });
    });
};

LinkGeneratorElement.prototype.RequiresMonitoring = function() {
    return this.m_Type=='overlay-button'||this.m_Type=='overlay-widget-v1'||this.m_Type=='overlay-widget-v2';
};

LinkGeneratorElement.prototype.GetCustomForm = function(formType) {
    var contentHtml = '';
    if(formType == "Images"){
        contentHtml = '<table><tr>' +
            '<td style="width:100px;vertical-align:top;">'+lzm_inputControls.createImageBox('image-online')+'</td>' +
            '<td rowspan="2" style="vertical-align:top;"><div id="image-sets-list-div" class="alternating-rows-table lzm-list-div"><table class="alternating-rows-table" id="image-sets-list-table"><tbody></tbody></table></div>' +
            '<div style="margin-top: 15px; text-align: right;">';
        contentHtml += lzm_inputControls.createButton('add-image-set-btn', '', 'addImageSet(\''+this.m_Type+'\')', t('Add'), '', 'lr',{'margin-right': '5px', 'padding-left': '12px', 'padding-right': '12px'}, tid('create_new_element'), 20, 'b');
        contentHtml += lzm_inputControls.createButton('rm-image-set-btn', 'ui-disabled element-edit-btns', 'removeImageSet(\''+this.m_Type+'\')', t('Remove'), '', 'lr',{'margin-right': '0px', 'padding-left': '12px', 'padding-right': '12px'}, t('Remove selected Element'), 20, 'b');
        contentHtml += '</div>'+
            '</td></tr><tr>'+
            '<td class="top-space" style="vertical-align:top;">'+lzm_inputControls.createImageBox('image-offline')+'</td>' +
            '</tr></table>';
    }
    else if(formType == "Custom Links")
        contentHtml = '<table id="tbl-custom-links" class="link-generator-table"><tr><td></td><td></td><td></td></tr><tr><td></td><td></td><td></td></tr><tr><td></td><td></td><td></td></tr></table>';
    else if(formType == "Social Media")
        contentHtml = '<table id="tbl-social-media" class="link-generator-table"><tr><td></td><td></td></tr><tr><td></td><td></td></tr><tr><td></td><td></td></tr><tr><td></td><td></td></tr></table>';
    else if(formType == "APIModeCommands"){
        contentHtml = '<fieldset class="lzm-fieldset"><legend>Change Chat Widget Visibility</legend>';
        contentHtml += '<input type="text" autocapitalize="off" autocorrect="off" autocomplete="off" id="apim-command-show" value="lz_chat_show();" spellchecker="false" readonly="readonly" class="code-box">';
        contentHtml += '<br><br><input type="text" autocapitalize="off" autocorrect="off" autocomplete="off" id="apim-command-hide" value="lz_chat_hide();" spellchecker="false" readonly="readonly" class="code-box">';
        contentHtml += '</fieldset>';
        contentHtml += '<fieldset class="lzm-fieldset top-space bottom-space"><legend>Set Chat Widget Function</legend>';
        contentHtml += '<input type="text" autocapitalize="off" autocorrect="off" autocomplete="off" id="apim-command-chat" value="OverlayChatWidgetV2.SetMode(\'chat\');" spellchecker="false" readonly="readonly" class="code-box">';
        contentHtml += '<br><br><input type="text" autocapitalize="off" autocorrect="off" autocomplete="off" id="apim-command-ticket" value="OverlayChatWidgetV2.SetMode(\'ticket\');" spellchecker="false" readonly="readonly" class="code-box">';
        contentHtml += '<br><br><input type="text" autocapitalize="off" autocorrect="off" autocomplete="off" id="apim-command-phone" value="OverlayChatWidgetV2.SetMode(\'phone\');" spellchecker="false" readonly="readonly" class="code-box">';
        contentHtml += '<br><br><input type="text" autocapitalize="off" autocorrect="off" autocomplete="off" id="apim-command-knowledgebase" value="OverlayChatWidgetV2.SetMode(\'knowledgebase\');" spellchecker="false" readonly="readonly" class="code-box">';
        contentHtml += '</fieldset>';
    }
    else if(formType == "APIModeExamples"){
        contentHtml = '<input type="text" autocapitalize="off" autocorrect="off" autocomplete="off" style="max-width:800px;" value="<span onclick=&quot;lz_chat_show();OverlayChatWidgetV2.SetMode(\'chat\');\&quot;>Start Chat</span>" spellchecker="false" readonly="readonly" class="code-box">';
        contentHtml += '<br><br><input type="text" autocapitalize="off" autocorrect="off" autocomplete="off" style="max-width:800px;" value="<img onclick=&quot;lz_chat_show();OverlayChatWidgetV2.SetMode(\'ticket\');&quot; src=&quot;./leave_message.png&quot;>" spellchecker="false" readonly="readonly" class="code-box">';
    }
    return contentHtml;
};

LinkGeneratorElement.prototype.GetElementRow = function() {

    var icon='',name = tid(this.m_Type);

    if($.inArray(this.m_Type,LinkGeneratorClass.DeprecatedElements) != -1)
    {
        name = '<strike><i class="text-gray">' + name + '</i></strike>';
        icon = '<i class="fa fa-warning icon-orange icon-large"></i>';
    }
    else
        icon = '<i class="'+this.m_Icons[this.m_Type].icon+' icon-large"></i>';

    return '<tr id="'+this.GetLineId()+'" ondblclick="editLinkGeneratorElement();" onclick="selectLinkGeneratorElement(\'' + this.m_Id + '\');" class="element-list-line lzm-unselectable" data-element="'+lz_global_base64_encode(JSON.stringify(this))+'"><td style="width:20px;padding:4px;" class="text-center">'+icon+'</td><td>'+name+'</td></tr>';
};

LinkGeneratorElement.prototype.GetProperty = function(elem){
    return UIRenderer.getSettingsProperty(this.m_Settings,elem);
};


function previewLinkGeneratorCode(){
    lzm_chatDisplay.LinkGenerator.Preview();
}

function editLinkGeneratorElement(){
    lzm_chatDisplay.LinkGenerator.EditLinkGeneratorElement();
}

function selectLinkGeneratorElement(type){
    $('.element-list-line').removeClass('selected-table-line');
    $('#element-list-line-' + type).addClass('selected-table-line');
    lzm_chatDisplay.LinkGenerator.ValidateButtons();
}

function addLinkGeneratorElement(){
    LinkGeneratorClass.CurrentElements = lzm_chatDisplay.LinkGenerator.GetElementsFromRows(false);
    lzm_chatDisplay.LinkGenerator.SelectElementType();
}

function removeLinkGeneratorElement(){
    lzm_chatDisplay.LinkGenerator.RemoveLinkGeneratorElement();
}


