/****************************************************************************************
 * LiveZilla FeedbacksViewerClass.js
 *
 * Copyright 2017 LiveZilla GmbH
 * All rights reserved.
 * LiveZilla is a registered trademark.
 *
 ***************************************************************************************/

function FeedbacksViewer() {
    this.m_SelectedFeedbackId = '';
}

FeedbacksViewer.Page = 1;
FeedbacksViewer.PagesTotal = 1;

FeedbacksViewer.prototype.showFeedbacksViewer = function() {

    FeedbacksViewer.PagesTotal = DataEngine.feedbacksTotal / DataEngine.feedbacksPage;

    if(FeedbacksViewer.PagesTotal%1!=0 || FeedbacksViewer.PagesTotal<1)
        FeedbacksViewer.PagesTotal++;

    FeedbacksViewer.PagesTotal = Math.floor(FeedbacksViewer.PagesTotal);

    var headerString = tid('feedbacks');
    var footLineHtml = this.createFooterLine(false);
    var bodyString = this.createFeedbacksHtml();

    lzm_commonDialog.CreateDialogWindow(headerString, bodyString, footLineHtml, 'star', 'feedbacks-viewer', 'feedbacks_viewer_dialog', 'fv-close-btn');

    $('#feedbacks-viewer-body').css({'overflow': 'auto'});

    this.createFooterLine(true);
};

FeedbacksViewer.prototype.createFooterLine = function(logic){

    if(!logic)
    {
        var footLineHtml = '<span>';
        var leftDisabled = (FeedbacksViewer.Page == 1) ? ' ui-disabled' : '', rightDisabled = (FeedbacksViewer.Page == FeedbacksViewer.PagesTotal) ? ' ui-disabled' : '';
        footLineHtml += lzm_inputControls.createButton('feedbacks-page-all-backward', 'feedbacks-list-page-button' + leftDisabled, 'FeedbacksViewer.GotoPage(1);', '',
            '<i class="fa fa-fast-backward"></i>', 'l', {'border-right-width': '1px'}) +
            lzm_inputControls.createButton('feedbacks-page-one-backward', 'feedbacks-list-page-button' + leftDisabled, 'FeedbacksViewer.GotoPage(' + (FeedbacksViewer.Page - 1) + ');', '', '<i class="fa fa-backward"></i>', 'r',{'border-left-width': '1px'}) +
            '<span style="padding: 0 15px;">' + tid('page_of_total',[['<!--this_page-->', FeedbacksViewer.Page], ['<!--total_pages-->', FeedbacksViewer.PagesTotal]]) + '</span>' +
            lzm_inputControls.createButton('feedbacks-page-one-forward', 'feedbacks-list-page-button' + rightDisabled, 'FeedbacksViewer.GotoPage(' + (FeedbacksViewer.Page + 1) + ');', '', '<i class="fa fa-forward"></i>', 'l',{'border-right-width': '1px'}) +
            lzm_inputControls.createButton('feedbacks-page-all-forward', 'feedbacks-list-page-button' + rightDisabled, 'FeedbacksViewer.GotoPage(' + FeedbacksViewer.PagesTotal + ');', '', '<i class="fa fa-fast-forward"></i>', 'r',{'border-left-width': '1px'});

        footLineHtml += '</span><span style="float:right;">';
        footLineHtml += lzm_inputControls.createButton('fv-close-btn', '', '', tid('close'), '', 'lr',{'margin-left': '4px'},'',30,'d');
        footLineHtml += '</span>';
        return footLineHtml;
    }
    else
    {
        $('#fv-close-btn').click(function(){
            FeedbacksViewer.GotoPage(0);
            TaskBarManager.RemoveActiveWindow();
            lzm_chatDisplay.FeedbacksViewer = null;
        });
    }
    return '';
};

FeedbacksViewer.prototype.initUpdateViewer = function(page){
    try
    {
        this.SwitchLoading(true);
        FeedbacksViewer.Page=page;
        CommunicationEngine.feedbacksUpdateTimestamp='';
        $('#feedbacks_viewer_dialog-footline').html(this.createFooterLine(false));
        this.createFooterLine(true);
        CommunicationEngine.stopPolling();
        CommunicationEngine.startPolling();
    }
    catch(ex)
    {
        deblog(ex);
    }
};

FeedbacksViewer.prototype.updateViewer = function(){
    $('#feedbacks-table').replaceWith(this.createFeedbacksHtml());
    this.SwitchLoading(false);
};

FeedbacksViewer.prototype.createFeedbacksHtml = function() {
    var bodyString = '<table class="visible-list-table alternating-rows-table lzm-unselectable" id="feedbacks-table"><thead><tr>' +
        '<th>' + tid('date') + '</th><th>' + tid('operator') + '</th><th>' + tid('group') + '</th>' +
        '<th>' + tid('name') + '</th><th>' + tid('email') + '</th><th>' + tid('company') + '</th>' +
        '<th>' + tid('phone') + '</th><th>' + tid('ticket') + '</th><th>' + tid('chat') + '</th>';

    var thtext='',thicon='';
    for(var key in DataEngine.global_configuration.database['fbc'])
        if(DataEngine.global_configuration.database['fbc'][key].type == '0')
            thicon += '<th class="text-center">'+DataEngine.global_configuration.database['fbc'][key].name+'</th>';
        else
            thtext += '<th style="min-width:200px;">'+DataEngine.global_configuration.database['fbc'][key].name+'</th>';

    bodyString += thtext + thicon;
    bodyString += '</tr></thead><tbody>' + this.getFeedbackLines() + '</tbody></table>';
    return bodyString;
};

FeedbacksViewer.prototype.getFeedbackLines = function() {
    var linesHtml = '',maxCreated=LocalConfiguration.LastFeedback;
    if(maxCreated==null)
        maxCreated = 0;

    for (var i=0; i<DataEngine.feedbacksList.length; i++){
        linesHtml += this.getFeedbackLine(DataEngine.feedbacksList[i]);
        maxCreated = Math.max(DataEngine.feedbacksList[i].cr,maxCreated);
    }

    return linesHtml;
};

FeedbacksViewer.prototype.getFeedbackLine = function(fb) {

    var key,crit,edTime = lzm_chatTimeStamp.getLocalTimeObject(parseInt(fb.cr * 1000), true);
    var edString = lzm_commonTools.getHumanDate(edTime, '', lzm_chatDisplay.userLanguage) + ' ';
    var onclickAction = ((!IFManager.IsAppFrame && !IFManager.IsMobileOS) || IFManager.IsDesktopApp()) ? ' onclick="selectFeedbacksLine(event, \'' + fb.i + '\');"' : ' onclick="openFeedbacksListContextMenu(event, \'' + fb.i + '\');"';
    var onconetxtMenuAction = ((!IFManager.IsAppFrame && !IFManager.IsMobileOS) || IFManager.IsDesktopApp()) ? ' oncontextmenu="openFeedbacksListContextMenu(event, \'' + fb.id + '\');"' : '';
    var ondblclickAction =  ((!IFManager.IsAppFrame && !IFManager.IsMobileOS) || IFManager.IsDesktopApp()) ? ' ondblclick="showFeedbacks(\'' + fb.i + '\', true);"' : '';

    if(this.m_SelectedFeedbackId=='')
        this.m_SelectedFeedbackId = fb.i;

    var opname = '-',grname = '-';
    var operator = DataEngine.operators.getOperator(fb.o);
    if(operator != null)
        opname = operator.userid;

    var group = DataEngine.groups.getGroup(fb.g);
    if(group != null)
        grname = group.id;

    var selectedLine = (this.m_SelectedFeedbackId==fb.i) ? ' selected-table-line' : '';
    var fbhtml = '<tr id="feedbacks-list-line-'+fb.i+'" '+onclickAction+onconetxtMenuAction+ondblclickAction+' class="feedbacks-list-line'+selectedLine+'">' +
        '<td>&nbsp;'+edString+'&nbsp;</td>' +
        '<td>'+opname+'</td><td>'+grname+'</td>'+
        '<td>'+lzm_commonTools.htmlEntities(fb.UserData.f111)+'</td>' +
        '<td>'+lzm_commonTools.htmlEntities(fb.UserData.f112)+'</td>' +
        '<td>'+lzm_commonTools.htmlEntities(fb.UserData.f113)+'</td>' +
        '<td>'+lzm_commonTools.htmlEntities(fb.UserData.f116)+'</td>' +
        '<td>'+lzm_commonTools.htmlEntities(fb.t)+'</td>' +
        '<td>'+lzm_commonTools.htmlEntities(fb.c)+'</td>';

    for(key in DataEngine.global_configuration.database['fbc'])
    {
        crit = DataEngine.global_configuration.database['fbc'][key];
        if(crit.type=='1')
            fbhtml += this.getCriteriaField(crit,fb);
    }
    for(key in DataEngine.global_configuration.database['fbc'])
    {
        crit = DataEngine.global_configuration.database['fbc'][key];
        if(crit.type=='0')
            fbhtml += this.getCriteriaField(crit,fb);
    }
    return fbhtml + '</tr>';
};

FeedbacksViewer.prototype.getCriteriaField = function(crit,fb){
    var chtml = '',data = lzm_commonTools.GetElementByProperty(fb.Criteria,'i',crit.id);
    if(data == null || !data.length)
        return '<td></td>';
    else
        data = data[0];

    if(crit.type == '0')
    {
        var rate = parseInt(data.Value);
        var col = (rate > 2) ? 'green' : ((rate > 1) ? 'orange' : 'orange');
        for(var i=0;i<5;i++)
            chtml += '<i style="margin-right:2px;" class="fa icon-small fa-circle '+((i<rate) ? 'icon-'+col : 'icon-light' )+' nobg"></i>';
        return '<td class="text-center noibg">' + chtml + '</td>';
    }
    else
        return '<td style="word-wrap:normal;word-break:break-word;white-space:normal;">'+lzm_commonTools.htmlEntities(data.Value)+'</td>';
};

FeedbacksViewer.prototype.SwitchLoading = function(show){
    if(show)
    {
        var loadingHtml = '<div id="feedbacks-viewer-loading"><div class="lz_anim_loading"></div></div>';
        $('#feedbacks_viewer_dialog-body').append(loadingHtml).trigger('create');
        $('#feedbacks-viewer-loading').css({position: 'absolute', left: 0, top: 0, bottom: '1px', right:0,'background-color': '#ffffff', 'z-index': 1000});
    }
    else
        $('#feedbacks-viewer-loading').remove();
};

FeedbacksViewer.GotoPage = function(page){
    if(lzm_chatDisplay.FeedbacksViewer != null)
        lzm_chatDisplay.FeedbacksViewer.initUpdateViewer(page);
};

function showFeedbacks(){

}







