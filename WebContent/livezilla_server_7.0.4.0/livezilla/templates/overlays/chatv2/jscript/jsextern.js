var lz_chat_full_load = true;
var lz_chat_status_change = true;
var lz_chat_status = -1;
var lz_chat_last_message_received = null;
var lz_chat_last_poster = null;
var lz_operator = null;
var lz_sound_player = null;
var lz_external = new lz_chat_external_user();
var lz_chat_data = new lz_chat_data_box();
var lz_chat_change_data = false;
var lz_chat_connecting = false;
var lz_ticket = null;
var lz_flood = false;
var lz_timer_typing = null;
var lz_timer_connecting = null;
var lz_header_text = "";
var lz_sound_format = "ogg";
var lz_chat_id = '';
var lz_closed = false;
var lz_popped_out = false;
var lz_chat_waiting_posts_timer;
var lz_chat_invite_timer = null;
var lz_desired_operator = null;
var lz_chat_talk_to_human = false;
var lz_chat_scrolled = false;
var lz_leave_chat = false;
var lz_chat_human_available = false;
var lz_chat_declined = false;
var lz_chat_init_feedback = false;
var lz_mode_show_options = false;
var lz_chat_kb_last_search_phrase = "";
var lz_chat_kb_search_phrase = "";
var lz_chat_kb_sound_played = false;
var lz_chat_et_attempt = false;
var lz_default_meta = null;
var lz_default_overflow = '';
var lz_chat_overlay_pointer = null;
var lz_operator_typing = false;
var lz_hide_widget_by_conf = false;
var lz_first_call = true;
var lz_mode_change_details = false;
var lz_mode_phone_outbound = false;
var lz_mode_phone_inbound = false;
var lz_mode_chat_login = false;
var lz_mode_ticket_feedback = false;

OverlayChatWidgetV2.__Ratio = 1;
if(typeof lz_ovlel_rat != 'undefined')
    OverlayChatWidgetV2.__Ratio = lz_ovlel_rat;

OverlayChatWidgetV2.__Size = Math.floor(48*OverlayChatWidgetV2.__Ratio);
OverlayChatWidgetV2.__Border = Math.floor(2*OverlayChatWidgetV2.__Ratio);
OverlayChatWidgetV2.__BorderWidth = 1;
OverlayChatWidgetV2.__Space = Math.floor(5*OverlayChatWidgetV2.__Ratio);
OverlayChatWidgetV2.__Scale = '.0' + Math.floor(14*OverlayChatWidgetV2.__Ratio).toString();
OverlayChatWidgetV2.__ModeCombi = false;
OverlayChatWidgetV2.__ModeSingle = false;
OverlayChatWidgetV2.__ModeAPI = false;
OverlayChatWidgetV2.__ModeFeedback = false;
OverlayChatWidgetV2.__ModeBot = false;
OverlayChatWidgetV2.__FormConfirmRequired = false;
OverlayChatWidgetV2.__TicketRequired = false;
OverlayChatWidgetV2.__LastChatId = 0;
OverlayChatWidgetV2.__ChatStarted = false;
OverlayChatWidgetV2.__PostsNoticed = lz_is_mobile;
OverlayChatWidgetV2.__LastPostReceived = null;
OverlayChatWidgetV2.__IsPostStatusUpdate = false;
OverlayChatWidgetV2.__IsWaitingForNotice = false;
OverlayChatWidgetV2.ChatAvailable = null;

document.addEventListener('mousemove', function(){if(typeof lz_session != 'undefined' && lz_session.OVLWMState=='1')OverlayChatWidgetV2.__PostsNoticed=true;}, false);

function lz_chat_resize_area_int(_id,_maxSize,_minSize){}

function lz_chat_resize_area(_id,_maxSize,_minSize){}

function lz_chat_unset_focus(){
    try
    {
        if(lz_chat_data.InputFieldIndices != null)
        {
            if(document.getElementById("lz_chat_data_form").style.display != "none")
            {
                for(var i = 0;i< lz_chat_data.InputFieldIndices.length;i++)
                {
                    var findex = lz_chat_data.InputFieldIndices[i];
                    if(document.getElementById('lz_form_'+findex) != null && document.getElementById('lz_form_'+findex).style.display != 'none')
                    {
                        document.getElementsByName('form_'+findex)[0].blur();
                    }

                }
            }
            else
                document.getElementById('lz_chat_text').blur();
        }
    }
    catch(ex){}
}

function lz_chat_set_focus(_call){
    try
    {
        if(lz_mode_show_options)
        {
            return;
        }

        if(lz_chat_is_visible() && lz_chat_data.InputFieldIndices != null)
        {
            var input = null;
            if(document.getElementById("lz_chat_data_form").style.display != "none")
            {
                for(var i = 0;i< lz_chat_data.InputFieldIndices.length;i++)
                {
                    var findex = lz_chat_data.InputFieldIndices[i];
                    if(document.getElementById('lz_form_'+findex) != null && document.getElementById('lz_form_'+findex).style.display != 'none')
                        if(document.getElementsByName('form_'+findex)[0].value == "")
                        {
                            input = document.getElementsByName('form_'+findex)[0];
                            break;
                        }
                }
            }
            else
            {
                input = document.getElementById('lz_chat_text');
            }
            if(input != null)
                lz_chat_set_focus_ctrl(input);
        }
    }
    catch(ex){}
}

function lz_chat_set_focus_ctrl(_ctrl){
    try
    {
        _ctrl.focus();
        var val = _ctrl.value;
        _ctrl.value = '';
        _ctrl.value = val;
    }
    catch(ex){}
}

function lz_chat_scoll_down(){
    setTimeout("if(document.getElementById('lz_chat_content_box')!=null)document.getElementById('lz_chat_content_box').scrollTop = document.getElementById('lz_chat_content_box').scrollHeight;",100);
}

function lz_chat_pop_out(_type,_params){

    _type = (typeof _type != 'undefined') ? _type : lz_session.OVLWMSElem;
    var url = lz_poll_server;
    var fullscreen=false;

    if(_type == 'knowledgebase')
    {
        url += 'knowledgebase.php';
        url += "?etc=" + lz_global_base64_url_encode(lz_color_secondary);
        url += "&linkid=" + lz_global_base64_url_encode(lz_code_id);
        url += "&el=" + lz_user_language;
        url += "&ckf=" + lz_kb_root;
        fullscreen = true;
    }
    else
    {
        url += 'chat.php?v=2&linkid=' + lz_global_base64_url_encode(lz_code_id);
        if(OverlayChatWidgetV2.__PublicGroupChat.length)
            url += '&pgc=' + OverlayChatWidgetV2.__PublicGroupChat;
    }

    if(typeof _params != 'undefined')
        url += _params;

    lz_chat_open_window(url,fullscreen);
}

function lz_chat_open_window(_url,_fullscreen){
    if(_fullscreen)
        window.open(_url,'LiveZilla');
    else
    {
        var width = (OverlayChatWidgetV2.__PublicGroupChat.length) ? Math.max(lz_window_width,600) : lz_window_width;
        window.open(_url,'LiveZilla','width='+width+',height='+lz_window_height+',left=50,top=50,resizable=yes,menubar=no,location=no,status=yes,slidebars=no');
    }
}

function lz_chat_switch_details(_cancel){
    if(!_cancel && lz_mode_change_details)
    {
        if(lz_session.OVLWMSElem =="chat")
        {
            lz_chat_change_data = true;
            lz_tracking_poll_server(1112);
        }
    }
    lz_mode_change_details = !lz_mode_change_details;
    lz_chat_update_ui_elements();
    lz_chat_set_focus(1);
}

function lz_chat_update_name(){

    var _name = lz_chat_get_input_value(111);
    if(lz_global_trim(_name) == "")
        _name = lz_guest_name;
    for(var i=0;i<document.getElementById("lz_chat_content_box").getElementsByTagName("DIV").length;i++)
    {
        var dato = document.getElementById("lz_chat_content_box").getElementsByTagName("DIV")[i].getAttribute("data-my");
        if(dato == 1)
        {
            if(document.getElementById("lz_chat_content_box").getElementsByTagName("DIV")[i].className.indexOf("lz_overlay_chat_message_name_external")!=-1)
            {
                document.getElementById("lz_chat_content_box").getElementsByTagName("DIV")[i].getElementsByTagName("SPAN")[0].innerHTML = lz_global_htmlentities(_name);
            }
            else if(document.getElementById("lz_chat_content_box").getElementsByTagName("DIV")[i].className.indexOf("lz_overlay_chat_message_avatar_external")!=-1)
                document.getElementById("lz_chat_content_box").getElementsByTagName("DIV")[i].getElementsByTagName("DIV")[0].style.backgroundImage = "url('"+lz_poll_server+"picture.php?name="+lz_global_base64_url_encode(_name)+"&ebg="+lz_global_base64_url_encode(lz_color_primary)+"')";
        }
    }
}

function lz_chat_replace_time(_time){

    for(var i=0;i<document.getElementById("lz_chat_content_box").getElementsByTagName("span").length;i++)
        if(document.getElementById("lz_chat_content_box").getElementsByTagName("span")[i].className == "lz_overlay_chat_message_time")
            if(document.getElementById("lz_chat_content_box").getElementsByTagName("span")[i].innerHTML.indexOf(":") == -1)
            {
                if(!document.getElementById("lz_chat_content_box").getElementsByTagName("span")[i].innerHTML.length && lz_d(_time))
                    document.getElementById("lz_chat_content_box").getElementsByTagName("span")[i].innerHTML = _time;
                document.getElementById("lz_chat_content_box").getElementsByTagName("span")[i].innerHTML = lz_global_get_time(document.getElementById("lz_chat_content_box").getElementsByTagName("span")[i].innerHTML);
            }
}

function lz_global_get_time(_ts){

    if(!_ts.toString().length || isNaN(_ts))
        return '';
    _ts = parseInt(_ts) - lz_server_time_diff;
    var date = new Date(parseInt(_ts)*1000);
    var timeStr = date.toLocaleTimeString();
    if(timeStr=="Invalid Date")
        return _ts;
    return timeStr;
}

function lz_chat_replace_icon(){

    for(var i=0;i<document.getElementById("lz_chat_content_box").getElementsByTagName("span").length;i++)
        if(document.getElementById("lz_chat_content_box").getElementsByTagName("span")[i].className == "lz_overlay_chat_message_change")
                document.getElementById("lz_chat_content_box").getElementsByTagName("span")[i].innerHTML = lz_get_icon('','pencil','','');
}

function lz_chat_switch_options_table(_forceClose){
    lz_chat_switch_icon_toggle('lz_chat_switch_so',lz_session.OVLCSound==1);
    lz_chat_switch_icon_toggle('lz_chat_switch_tr',lz_session.TransFrom!='');
    lz_chat_update_transcript_ui();

    document.getElementById('lz_chat_options_table').style.display = (document.getElementById('lz_chat_options_table').style.display=='none' && !_forceClose) ? '' : 'none';
    document.getElementById("lz_chat_overlay_bottom").style.opacity =
    document.getElementById("lz_chat_content_box").style.opacity = (document.getElementById('lz_chat_options_table').style.display!='none') ? .2 : 1;
    document.getElementById('lz_cf_ec').style.display = (lz_chat_id.length && (lz_chat_status == 1 || lz_chat_status == 2)) ? 'block' : 'none';
    OverlayChatWidgetV2.UpdateChatFunctions();
}

function lz_chat_set_translation(_activeId,_from,_into){
    if(lz_overlay_chat != null)
    {
        if(_into != null)
        {
            _into = lz_global_base64_decode(_into).toLowerCase();
            _into = (_into.length==0) ? null : _into;
        }

        if(_from != null)
        {
            _from = lz_global_base64_decode(_from).toLowerCase();
            _from = (_from.length==0) ? null : 'AUTO';
        }

        if(_activeId != null && lz_session.TransSID != _activeId)
        {
            if(_activeId != null)
                lz_session.TransSID = _activeId;

            if(_into != null)
                lz_session.TransInto = _into;

            if(_from != null)
                lz_session.TransFrom = _from;
            else
                lz_session.TransFrom = "";

            lz_session.Save();
        }
        lz_chat_update_translation_ui();
    }
}

function lz_chat_update_translation_ui(){
    var active = lz_session.TransFrom!='';
    lz_chat_switch_icon_toggle('lz_chat_switch_tr',active);
}

function lz_chat_update_transcript_ui(){

    var active = lz_session.Transcript==1 && lz_chat_get_input_value(112) != '';
    lz_chat_switch_icon_toggle('lz_chat_switch_et',active);
}

function lz_chat_switch_translation(){
    lz_session.TransFrom = (lz_session.TransFrom=='') ? 'AUTO' : '';
    lz_session.Save();
    lz_chat_update_translation_ui();
}

function lz_chat_switch_transcript(_fromForm){

    var isEmail = lz_chat_get_input_value(112) != '';
    if(lz_session.Transcript==1 && !isEmail)
        lz_session.Transcript = 0;

    var old = lz_session.Transcript;

    lz_session.Transcript = (lz_session.Transcript==1 || !isEmail) ? 0 : 1;
    lz_session.Save();
    lz_chat_update_transcript_ui();

    if(old==0 && lz_chat_get_input_value(112) == '' && !_fromForm)
    {
        lz_chat_et_attempt = true;
        lz_chat_switch_options_table(true);
        lz_chat_switch_details(false);
        document.getElementsByName('form_112')[0].focus();
    }
}

function lz_chat_switch_sound(){
    lz_session.OVLCSound = lz_session.OVLCSound==1 ? 0 : 1;
    lz_session.Save();
    lz_chat_switch_icon_toggle('lz_chat_switch_so',lz_session.OVLCSound==1);
}

function lz_chat_switch_icon_toggle(id,on){
    document.getElementById(id).getElementsByTagName('path')[0].setAttribute('d',lz_get_icon_path(on ? 'toggle-on' : 'toggle-off'));
    document.getElementById(id).style.fill = (on) ? lz_color_primary : '#bbb';
}

function lz_chat_fade_options(_in){
    var top = parseInt((lz_overlay_chat_height - 80) - parseInt(document.getElementById("lz_chat_overlay_options_box").style.height.replace("px","")));
    document.getElementById("lz_chat_overlay_options_box").style.top = (top/2) + "px";
    document.getElementById("lz_chat_overlay_options_frame").style.display =
    document.getElementById("lz_chat_overlay_options_box_bg").style.display =
    document.getElementById("lz_chat_overlay_options_box").style.display = (_in) ? "block" : "none";
}

function lz_chat_init_data_change(_email){
    var _name = lz_chat_get_input_value(111);
    if(_email==null)
        _email = lz_chat_get_input_value(112);
    if(lz_chat_data.InputFieldIndices != null)
    {
        lz_chat_get_input(111).ChangeDataTo = _name;
        lz_chat_get_input(112).ChangeDataTo = _email;
        lz_chat_save_input_value(112,_email);
        lz_chat_save_input_value(111,_name);
    }
    lz_chat_change_data = true;
}

function lz_chat_play_sound(_file){
    if(lz_session.OVLCSound==1)
    {
        if(lz_sound_player == null)
            lz_sound_player = new Audio(lz_poll_server + "sound/"+_file+"." + lz_sound_format);
        lz_sound_player.play();

        if(OverlayChatWidgetV2.__ModeAPI)
            lz_chat_open();
    }
}

function lz_chat_set_talk_to_human(_value,_poll){
    lz_chat_input_bot_mode(false);
    lz_chat_input_bot_state(false);
    lz_chat_talk_to_human = _value;
    if(_poll && _value && !lz_chat_declined)
        lz_tracking_poll_server(1119);
}

function lz_chat_input_bot_state(_hide){
    document.getElementById("lz_chat_text").style.display = (_hide) ? 'none' : '';
    document.getElementById("lz_chat_bot_reply_loading").style.display = (!_hide || !OverlayChatWidgetV2.__ModeBot) ? 'none' : '';
    if(OverlayChatWidgetV2.__ModeBot && !_hide)
        setTimeout("lz_chat_set_focus(11);",200);
}

function lz_chat_input_bot_mode(_botmode){
    OverlayChatWidgetV2.__ModeBot = _botmode;
}

function lz_chat_message(_msg,_trans){
    if(!lz_chat_change_data && lz_chat_status == 0)
        lz_chat_change_data = true;

    lz_closed = false;
    var msg = (_msg==null) ? lz_global_trim(document.getElementById("lz_chat_text").value) : _msg;
    if(msg.length>0 && OverlayChatWidgetV2.__ModeBot)
        lz_chat_input_bot_state(true);

    var transInto = (lz_session.TransInto!=""&&lz_session.TransInto!=null) ? lz_session.TransInto : "";
    if(lz_tr_api_key != '' && transInto != '' && lz_session.TransFrom!=null && lz_session.TransFrom!="" && lz_session.TransFrom.toUpperCase() != transInto.toUpperCase() && _msg==null)
    {
        var newScript = document.createElement('script');
        newScript.type = 'text/javascript';
        window.doneTranslateCallback = function translateText(response){if(response.data!=null){lz_chat_message(msg,response.data.translations[0].translatedText);window.doneTranslateCallback=null;}else{alert("Sorry, there was an error while trying to translate:\r\n" + JSON.stringify(response));lz_chat_message(msg,null);}}

        var s = (lz_session.TransFrom != 'AUTO') ? '&source='+lz_session.TransFrom : '';
        newScript.src = "https://www.googleapis.com/language/translate/v2?key="+lz_global_base64_decode(lz_tr_api_key)+"&format=html"+s+"&target="+transInto+"&callback=doneTranslateCallback&q=" + msg;
        document.getElementsByTagName("head")[0].appendChild(newScript);
        document.getElementById("lz_chat_text").value = '';
        return false;
    }

    if(msg.length>0)
    {
        if(document.getElementById("lz_chat_invite_id") != null && lz_chat_status == 0)
        {
            lz_chat_decline_request(lz_request_active=document.getElementById("lz_chat_invite_id").value,true,false,true);
            if(msg.length > document.getElementsByName("form_114")[0].value.length)
                document.getElementsByName("form_114")[0].value = msg;
            lz_chat_start();
            return false;
        }

        var html = "";
        var msgo = new lz_chat_post();

        if(_trans != null)
        {
            msgo.MessageTranslationText =_trans;
            html = lz_global_htmlentities(msgo.MessageTranslationText) + "<div class='lz_overlay_translation'>" + lz_global_htmlentities(msg) + "</div>";
        }
        else
            html = lz_global_htmlentities(msg);

        msgo.MessageText = msg;
        msgo.MessageId = lz_global_microstamp();
        msgo.MessageTime = lz_global_timestamp();
        lz_external.MessagesSent[lz_external.MessagesSent.length] = msgo;
        document.getElementById("lz_chat_text").value = '';

        if(lz_operator==null && !OverlayChatWidgetV2.__PublicGroupChat.length)
            lz_chat_set_connecting(true,null,false);

        var posthtml = (lz_chat_last_poster != lz_external.Id) ? lz_global_base64_decode(lz_post_html) : lz_global_base64_decode(lz_add_html);
        var cname = (lz_chat_get_input_value(111).length == 0) ? lz_guest_name : lz_chat_get_input_value(111);
        posthtml = posthtml.replace("<!--message-->",html);
        posthtml = posthtml.replace("<!--server-->",lz_poll_server);
        posthtml = posthtml.replace("<!--ename-->",lz_global_base64_url_encode(cname));
        posthtml = posthtml.replace("<!--time-->",'');
        posthtml = posthtml.replace("<!--name-->",lz_global_htmlentities(cname));
        posthtml = posthtml.replace(/<!--my-->/g,1);
        posthtml = posthtml.replace("<!--bgce-->",lz_global_base64_url_encode(lz_color_primary));
        lz_chat_switch_extern_typing(false);
        lz_chat_add_html_element(lz_global_base64_encode(posthtml),false,null,null,lz_global_base64_encode(lz_external.Id),null);
        lz_tracking_poll_server(1114);
        lz_chat_set_focus(6);
    }
    return false;
}

function lz_chat_set_host(_systemId,_chatId,_groupId,_groupName,_userid,_lang,_image,_fullname){
    if(lz_overlay_chat != null)
    {
        lz_chat_id = lz_global_base64_decode(_chatId);

        if(lz_chat_id.length && lz_chat_id > 0)
            OverlayChatWidgetV2.__LastChatId = lz_chat_id;

        if(_lang != null && lz_session.TransInto == "")
        {
            lz_session.TransInto = lz_global_base64_decode(_lang);
            lz_session.Save();
        }
        if(_systemId != null)
        {
            lz_operator = new lz_chat_operator();
            lz_operator.Id = lz_global_base64_decode(_systemId);
            lz_operator.Group = lz_global_base64_decode(_groupId);
            lz_operator.Fullname = lz_global_base64_decode(_fullname);
            lz_desired_operator = lz_global_base64_decode(_userid);
            lz_chat_set_group(lz_global_base64_encode(lz_operator.Group));
        }
        else
        {
            lz_desired_operator = null;
            lz_external.MessagesSent = [];
            lz_operator = null;
        }
        OverlayChatWidgetV2.UpdateChatFunctions();
    }
}

function lz_chat_close(){
    OverlayChatWidgetV2.__ChatStarted = false;
    lz_leave_chat = true;
    lz_tracking_poll_server(1120);
}

function lz_chat_print(){
    var pURL = lz_poll_server + "print.php?c=" + lz_global_base64_url_encode(OverlayChatWidgetV2.__LastChatId) + "&b=" + lz_global_base64_url_encode(lz_session.UserId+"_OVL") + "&i=" + lz_global_base64_url_encode(lz_session.UserId) + "&r=" + Math.random().toString();
    lz_chat_open_window(pURL,false);
}

function lz_chat_set_typing(_typingText,_fromTimer){

    if(lz_overlay_chat != null)
    {
        if(lz_chat_connecting)
        {
            if(!_fromTimer && lz_timer_connecting != null)
                return;

            if(document.getElementById("lz_chat_overlay_info").innerHTML.length == 0)
            {
                document.getElementById("lz_chat_overlay_info").innerHTML = lz_text_connecting_info;
            }
            else
            {
                document.getElementById("lz_chat_overlay_info").innerHTML = "";
            }
            lz_timer_connecting = setTimeout("lz_chat_set_typing('',true);",700);
        }
        else
        {
            if(lz_timer_connecting != null)
                clearTimeout(lz_timer_connecting);
            lz_timer_connecting = null;
            if(lz_operator != null && _typingText != null && !lz_operator_typing)
            {
                var pdiv = document.createElement('div');
                pdiv.id ="lz_chat_overlay_typing_post";
                var thtml = ((lz_chat_last_poster != lz_operator.Id) ? lz_global_base64_decode(lz_post_html) : lz_global_base64_decode(lz_add_html));
                thtml = thtml.replace("<!--message-->",'<div class="lz_anim_point_load" style="padding:5px 0 0 0 !important;"><span></span><span></span><span></span></div>');
                thtml = thtml.replace("<!--server-->",lz_poll_server);
                thtml = thtml.replace("name=<!--ename-->&ebg=<!--bgce-->","intid=" + lz_global_base64_url_encode(lz_operator.Id));
                thtml = thtml.replace("<!--time-->","");
                thtml = thtml.replace("lz_overlay_chat_message_change","");
                thtml = thtml.replace("<!--name-->",lz_global_htmlentities(lz_operator.Fullname));
                pdiv.innerHTML = thtml;
                lz_operator_typing = true;
                document.getElementById('lz_chat_content_inlay').appendChild(pdiv);
                lz_chat_scoll_down();
            }
            else if(_typingText == null && lz_operator_typing)
            {
                lz_operator_typing = false;
                document.getElementById('lz_chat_content_inlay').removeChild(document.getElementById('lz_chat_overlay_typing_post'));
                delete document.getElementById('lz_chat_overlay_typing_post');
            }
        }
    }
}

function lz_chat_switch_extern_typing(_typing){
    var announce = (_typing != lz_external.Typing);
    if(_typing)
    {
        OverlayChatWidgetV2.__PostsNoticed = true;
        if(lz_timer_typing != null)
            clearTimeout(lz_timer_typing);
        lz_timer_typing = setTimeout("lz_chat_switch_extern_typing(false);",5000);
    }
    lz_external.Typing = _typing;
    if(announce && lz_operator != null)
        lz_tracking_poll_server(1115);
}

function lz_chat_show_waiting_message(_html){
    if(lz_chat_status < 2)
        lz_chat_add_html_element(_html,false,null,null,"sys",null);
}

function lz_chat_set_connecting(_connecting,_id,_hidePopOut,_waitingHTML,_waitingDelay){
    if(_id != null)
        lz_external.Id = _id;
    if(_connecting && lz_chat_data.TimerWaiting==null && _waitingHTML != null)
        lz_chat_data.TimerWaiting = setTimeout("lz_chat_show_waiting_message('"+_waitingHTML+"');",_waitingDelay*1000);
    else if(!_connecting && lz_chat_data.TimerWaiting != null)
    {
        clearTimeout(lz_chat_data.TimerWaiting);
        lz_chat_data.TimerWaiting = null;
    }

    lz_chat_connecting = _connecting;

    if(_connecting)
        lz_chat_set_typing(null,false);

    document.getElementById("lz_chat_members_box").style.bottom =
    document.getElementById("lz_chat_content_box").style.bottom = (lz_chat_connecting) ? "102px" : "80px";
    document.getElementById("lz_chat_overlay_loading_bar").style.display = (lz_chat_connecting) ? "block" : "none";
    document.getElementById("lz_chat_overlay_info").style.display = (lz_chat_connecting) ? "block" : "none";
}

function lz_chat_message_return(){
    lz_chat_update_ui_elements();
    lz_chat_set_focus(66);
}

function lz_kb_set_url(_searchFor){
    document.getElementById("lz_overlay_module_knowledgebase").style.display = 'block';
    var url = lz_poll_server + 'knowledgebase.php?tops=MQ__&no-logo=MQ__&etc=' + lz_global_base64_url_encode(lz_color_secondary) + '&el=' + lz_user_language  + "&ckf=" + lz_kb_root;
    if(_searchFor!='')
        url += '&search-for=' + _searchFor;
    document.getElementById("lz_overlay_module_knowledgebase").getElementsByTagName("iframe")[0].src = url;
}

function lz_chat_update_ui_elements(){

    lz_chat_set_input_fields();

    if(lz_chat_data.SelectedGroup == null)
        return;

    document.getElementById('lz_chat_overlay_data_form_ok_button').innerHTML = (lz_session.OVLWMSElem =="chat") ? ((lz_mode_change_details) ? lz_text_save : lz_text_start_chat) : (lz_session.OVLWMSElem=="phone") ? lz_call_me : lz_text_leave_message;
    document.getElementById('lz_chat_data_header').innerHTML = '<h2>' + ((lz_session.OVLWMSElem =="chat") ? ((!lz_mode_change_details) ? lz_text_start_chat  : lz_text_change_details) : (lz_session.OVLWMSElem=="phone") ? lz_req_callback : lz_text_leave_message) + '</h2>';

    if(lz_session.OVLWMSElem =="chat")
    {
        if(lz_mode_change_details)
            document.getElementById('lz_chat_data_header_text').innerHTML = '';
        else if(lz_chat_data.SelectedGroup.ChatInformation.length)
            document.getElementById('lz_chat_data_header_text').innerHTML = lz_chat_data.SelectedGroup.ChatInformation;
        else
            document.getElementById('lz_chat_data_header_text').innerHTML = lz_text_chat_information;
    }
    else if(lz_session.OVLWMSElem=="phone")
    {
        if(lz_chat_data.SelectedGroup.CallMeBackInformation.length)
            document.getElementById('lz_chat_data_header_text').innerHTML = lz_chat_data.SelectedGroup.CallMeBackInformation;
        else
            document.getElementById('lz_chat_data_header_text').innerHTML = lz_text_callback_information;
    }
    else if(lz_session.OVLWMSElem=="ticket")
    {
        if(lz_chat_data.SelectedGroup.TicketInformation.length)
            document.getElementById('lz_chat_data_header_text').innerHTML = lz_chat_data.SelectedGroup.TicketInformation;
        else
            document.getElementById('lz_chat_data_header_text').innerHTML = lz_text_ticket_information;
    }

    document.getElementById("lz_chat_overlay_ticket").style.display = (lz_mode_ticket_feedback) ? "block" : "none";
    document.getElementById("lz_overlay_module_chat").style.display = (lz_session.OVLWMSElem == "chat") ? "block" : "none";
    document.getElementById("lz_overlay_module_knowledgebase").style.visibility = (lz_session.OVLWMSElem == "knowledgebase") ? "visible" : "hidden";
    document.getElementById("lz_overlay_module_feedback").style.visibility = (OverlayChatWidgetV2.__ModeFeedback) ? "visible" : "hidden";
    document.getElementById("lz_chat_content_box").style.display = (lz_session.OVLWMSElem == "chat") ? "block" : "none";
    document.getElementById('lz_overlay_phone_inbound').style.display = (lz_mode_phone_inbound && lz_session.OVLWMSElem == "phone") ? 'block' : 'none';

    if(lz_session.OVLWMSElem == "phone" && lz_mode_phone_inbound)
    {
        document.getElementById('lz_chat_data_form').style.top = '180px';
        lz_add_class(document.getElementById('lz_chat_data_header'),'lz_chat_sub_header');
    }
    else
    {
        document.getElementById('lz_chat_data_form').style.top = '6px';
        lz_remove_class(document.getElementById('lz_chat_data_header'),'lz_chat_sub_header');
    }

    if(lz_session.OVLWMSElem == "knowledgebase")
        if(document.getElementById("lz_overlay_module_knowledgebase").getElementsByTagName("iframe")[0].src=="")
            lz_kb_set_url('');

    var displayDataForm = 'block';
    var inChat = (OverlayChatWidgetV2.__ChatStarted||lz_chat_status > 0);

    if(inChat)
        OverlayChatWidgetV2.__FormConfirmRequired = false;

    if(!lz_mode_change_details)
    {
        if(document.getElementById("lz_chat_invite_id") != null && lz_session.OVLWMSElem == "chat")
            displayDataForm = 'none';
        else if(lz_mode_ticket_feedback || OverlayChatWidgetV2.__ModeFeedback)
            displayDataForm = 'none';
        else if(lz_session.OVLWMSElem == "phone" && !lz_mode_phone_outbound)
            displayDataForm = 'none';
        else if(lz_session.OVLWMSElem == "knowledgebase")
            displayDataForm = 'none';
        else if(lz_session.OVLWMSElem == "chat" && !OverlayChatWidgetV2.__FormConfirmRequired)
        {
            if(lz_chat_status > 0 || inChat)
                displayDataForm = 'none';
            else if(lz_check_missing_inputs(false,null) && !OverlayChatWidgetV2.__PublicGroupChat.length)
            {
                if(OverlayChatWidgetV2.ChatAvailable!==false)
                    displayDataForm = 'none';
            }
        }
    }

    if(displayDataForm != 'none' && !inChat && lz_session.OVLWMSElem == 'chat' && lz_chat_data.InputFieldIndices!=null && lz_session.OVLWMState=='1')
        OverlayChatWidgetV2.__FormConfirmRequired = true;

    try
    {
        if(displayDataForm != 'none' && document.getElementById('lz_chat_text').value.length && !document.getElementsByName("form_114")[0].value.length)
        {
            document.getElementsByName("form_114")[0].value = document.getElementById('lz_chat_text').value;
            document.getElementById('lz_chat_text').value = '';
        }
        else if(lz_chat_status == 0 && !OverlayChatWidgetV2.__ChatStarted && displayDataForm == 'none' && !document.getElementById('lz_chat_text').value.length && document.getElementsByName("form_114")[0].value.length)
        {
            document.getElementById('lz_chat_text').value = document.getElementsByName("form_114")[0].value;
            document.getElementsByName("form_114")[0].value = '';
        }
    }
    catch(ex){}

    document.getElementById("lz_chat_data_form").style.display = displayDataForm;
    document.getElementById("lz_chat_ticket_received").style.display = (lz_mode_ticket_feedback && !lz_flood) ? "" : "none";
    document.getElementById('lz_chat_text').disabled = (document.getElementById("lz_chat_data_form").style.display != "none");
}

function lz_chat_set_members(_groupId,_show,_list){

    document.getElementById("lz_chat_members_box").style.display = _show ? 'block' : 'none';
    document.getElementById("lz_chat_content_box").style.left = !_show ? '1px' : '201px';

    if(_show)
    {
        document.getElementById("lz_overlay_chat").style.width = '600px';
        lz_overlay_chat_width = 600;
    }

    var line,html_v = '',html_o = '';
    for(var k in _list)
    {
        var avbg = (!_list[k].op) ? 'name=' + _list[k].name : 'intid=' + lz_global_base64_url_encode(_list[k].id);
        line = '<div><span style="background-image: url(\''+lz_poll_server+'picture.php?'+avbg+'\');"></span>'+lz_global_base64_url_decode(_list[k].name)+'</div>';

        if(_list[k].op)
            html_o += line;
        else
            html_v += line;
    }

    if(lz_chat_status == 2)
        OverlayChatWidgetV2.__PublicGroupChat = _groupId;

    var html = (html_o.length) ? html_o+'<hr>'+html_v : html_v;

    if(document.getElementById("lz_chat_members_box").innerHTML != html)
        document.getElementById("lz_chat_members_box").innerHTML  = html;

    lz_chat_set_element_width(_show);
}

function lz_chat_data_form_result(){

    OverlayChatWidgetV2.__FormConfirmRequired = false;
    if(lz_mode_ticket_feedback)
    {
        lz_load_inputs = true;
        lz_tracking_poll_server(1027);
        lz_mode_ticket_feedback = false;
        lz_chat_update_ui_elements();
        lz_chat_set_focus(7);
    }
    else if(lz_mode_change_details)
    {
        lz_chat_switch_details(false);
        if(lz_chat_et_attempt || lz_session.Transcript==1)
        {
            lz_chat_et_attempt = false;
            lz_chat_switch_transcript(true);
        }
    }
    else if(lz_session.OVLWMSElem =="chat")
        lz_chat_start();
    else if(lz_session.OVLWMSElem =="ticket")
        lz_chat_send_ticket();
    else if(lz_session.OVLWMSElem =="phone")
        lz_chat_send_ticket(true);
}

function lz_chat_start(){

    if(lz_chat_status > 0 || (lz_chat_status == 0 && lz_check_missing_inputs(true,'lz_chat_start')))
    {
        lz_chat_change_data = true;
        lz_chat_loading(false);
        if(lz_chat_status == 0)
        {
            document.getElementById('lz_chat_text').value = document.getElementsByName("form_114")[0].value;
            lz_chat_message(null,null);
            document.getElementById('lz_chat_text').value = "";
        }
        OverlayChatWidgetV2.__ChatStarted = true;
        lz_chat_set_group_info();
        lz_chat_update_ui_elements();
    }
    else
    {
        lz_chat_update_ui_elements();
        lz_chat_set_focus(8);
    }
    lz_tracking_poll_server(1153);
}

function lz_chat_poll_parameters(){
    var params = "",i;
    if(lz_operator != null)
        params += "&op=" + lz_global_base64_url_encode(lz_operator.Id);

    if(lz_external.Typing)
        params += "&typ=1";

    if(lz_chat_full_load && !lz_chat_declined)
        params += "&full=1";

    if(lz_closed || lz_leave_chat)
        params += "&clch=MQ__";

    if(lz_popped_out)
        params += "&po=MQ__";

    if(lz_chat_init_feedback)
    {
        lz_chat_init_feedback = false;
        params += "&ovlif=MQ__";
    }

    if(lz_chat_kb_search_phrase != "")
        params += "&skb=" + lz_global_base64_url_encode(lz_chat_kb_search_phrase);

    if(lz_chat_status_change)
        params += "&sc=1";

    if(lz_chat_talk_to_human && !lz_chat_declined)
        params += "&tth=MQ__";

    if(lz_force_monitoring)
        params += "&fm=MQ__";

    if(lz_chat_data.SelectedGroup != null)
        params += "&eg=" + lz_global_base64_url_encode(lz_chat_data.SelectedGroup.Id);

    if(OverlayChatWidgetV2.__ChatStarted && lz_chat_status==0)
        lz_chat_change_data = true;

    if(lz_chat_change_data && lz_chat_data.InputFieldValues != null)
    {
        for(i=0;i<lz_chat_data.InputFieldValues.length;i++)
            if(lz_chat_data.InputFieldValues[i].Type != "File" && lz_chat_data.InputFieldValues[i].Value != '')
                params += "&f" + lz_chat_data.InputFieldValues[i].Index +"="+ lz_global_base64_url_encode(lz_chat_data.InputFieldValues[i].Value);

        if(lz_session.OVLWMSElem =="chat")
        {
            params += "&tc=" + lz_global_base64_url_encode(lz_session.Transcript.toString());
        }

        lz_chat_change_data = false;
    }

    if(lz_ticket != null)
    {
        params += "&tid=" + lz_global_base64_url_encode(lz_ticket);
        params += "&cmb=" + lz_global_base64_url_encode(lz_session.OVLWMSElem == "phone" ? '1' : '0');
        lz_ticket = null;
    }

    lz_chat_status_change = false;
    if(OverlayChatWidgetV2.__LastPostReceived != null)
    {
        params += "&lpr=" + lz_global_base64_url_encode(OverlayChatWidgetV2.__LastPostReceived);

        if(OverlayChatWidgetV2.__IsPostStatusUpdate || (OverlayChatWidgetV2.__IsWaitingForNotice && OverlayChatWidgetV2.__PostsNoticed))
        {
            params += "&lps=" + lz_global_base64_url_encode(OverlayChatWidgetV2.__PostsNoticed ? '2' : '1');
            OverlayChatWidgetV2.__IsPostStatusUpdate = false;
            OverlayChatWidgetV2.__IsWaitingForNotice = !OverlayChatWidgetV2.__PostsNoticed;
        }
    }

    if(lz_chat_last_message_received != null)
        params += "&lmr=" + lz_global_base64_url_encode(lz_chat_last_message_received);
    if(lz_chat_last_poster != null)
        params += "&lp=" +lz_global_base64_url_encode(lz_chat_last_poster);

    if(lz_desired_operator != null)
        params += "&intid="+lz_global_base64_url_encode(lz_desired_operator);

    var count=0;
    for(i=0;i<lz_external.MessagesSent.length;i++)
        if(!lz_external.MessagesSent[i].Received)
            params+="&mi" + count.toString() + "=" + lz_global_base64_url_encode(lz_external.MessagesSent[i].MessageId) + "&mp" + (count).toString() + "=" + lz_global_base64_url_encode(lz_external.MessagesSent[i].MessageText.substr(0,600))+ "&mpt" + (count).toString() + "=" + lz_global_base64_url_encode(lz_external.MessagesSent[i].MessageTranslationText.substr(0,600))+ "&mpti" + (count++).toString() + "=" + lz_global_base64_url_encode((lz_session.TransFrom!=null)?lz_session.TransFrom:"");

    if(OverlayChatWidgetV2.__PublicGroupChat.length)
        params += "&pgc="+OverlayChatWidgetV2.__PublicGroupChat;

    return params;
}

function lz_chat_release_post(_id,_time){
    for(var mIndex in lz_external.MessagesSent)
        if(lz_external.MessagesSent[mIndex].MessageId == _id)
            lz_external.MessagesSent[mIndex].Received=true;
    lz_chat_replace_time(_time);
}

function lz_chat_update_waiting_posts(_wposts){
    if(!lz_chats_external && lz_overlay_wm != null && lz_chat_get_wm_element('chat')!=null)
    {
        if(_wposts > -1 && lz_session.OVLCWM != _wposts)
        {
            lz_session.OVLCWM = _wposts;
            lz_session.Save();
        }
        document.getElementById("livezilla_wm_c_chat").style.display = (_wposts > 0) ? "table-cell" : "none";
        document.getElementById("livezilla_wm_c_chat").innerHTML = lz_session.OVLCWM;
    }
}

function lz_chat_update_kb_counter(_count){
    if(document.getElementById("livezilla_wm_c_knowledgebase")!==null)
    {
        document.getElementById("livezilla_wm_c_knowledgebase").style.display = (_count > 0) ? "table-cell" : "none";
        document.getElementById("livezilla_wm_c_knowledgebase").innerHTML = _count;
    }
}

function lz_chat_init_search_kb(){
    var phrase = lz_chat_get_input_value(114);
    if(lz_session.KBS != 1 || phrase.length < 12)
        return;

    if(phrase != lz_chat_kb_last_search_phrase)
    {
        lz_shared_kb_last_search_time = lz_global_timestamp();
        lz_chat_kb_last_search_phrase =
            lz_chat_kb_search_phrase = phrase;
        lz_tracking_poll_server(1241);
    }
}

function lz_chat_search_result(unused,_count){
    lz_chat_kb_search_phrase = "";
    document.getElementById('lz_chat_kb_match_info').style.display = (_count > 0) ? "block" : "none";
    if(_count>0 && !lz_chat_kb_sound_played)
    {
        lz_chat_play_sound('message');
        lz_chat_kb_sound_played = true;

    }
    lz_kb_set_url(document.getElementsByName("form_114")[0].value);
    lz_chat_update_kb_counter(_count);
}

function lz_global_replace_smilies(_text){
    if(lz_chat_data.SelectedGroup != null && lz_chat_data.SelectedGroup.ChatFunctions != null && lz_chat_data.SelectedGroup.ChatFunctions[0]=='0')
        return _text;
    var shorts = [/:-\)/g,/::smile/g,/:\)/g,/:-\(/g,/::sad/g,/:\(/g,/:-]/g,/::lol/g,/;-\)/g,/::wink/g,/;\)/g,/:'-\(/g,/::cry/g,/:-O/g,/::shocked/g,/:-\\\\/g,/::sick/g,/:-p/g,/::tongue/g,/:-P/g,/:\?/g,/::question/g,/8-\)/g,/::cool/g,/zzZZ/g,/::sleep/g,/:-\|/g,/::neutral/g];
    var images = ["smile","smile","smile","sad","sad","sad","lol","lol","wink","wink","wink","cry","cry","shocked","shocked","sick","sick","tongue","tongue","tongue","question","question","cool","cool","sleep","sleep","neutral","neutral"];
    for(var i = 0;i<shorts.length;i++)
        _text = _text.replace(shorts[i]," <img border=0 src='"+lz_poll_server+"images/smilies/"+images[i]+".gif'> ");
    return _text;
}

function lz_chat_add_html_element(_html,_full,_lpr,_lmr,_lp,_ip,_posts){

    OverlayChatWidgetV2.__PostsNoticed = lz_is_mobile;

    if(_posts != null)
        lz_chat_update_waiting_posts((_posts == -1) ? 0 : (lz_session.OVLCWM + parseInt(_posts)));

    if(_html != null)
    {
        if(lz_chat_full_load && _full)
            lz_chat_full_load = false;

        if(_ip != null && lz_global_base64_decode(_ip) != lz_chat_last_poster && lz_chat_last_poster != null)
        {
            lz_tracking_poll_server(1117);
            return;
        }

        if(_lpr != null && OverlayChatWidgetV2.__LastPostReceived != lz_global_base64_decode(_lpr))
        {
            OverlayChatWidgetV2.__LastPostReceived = lz_global_base64_decode(_lpr);
            OverlayChatWidgetV2.__IsPostStatusUpdate = true;
        }

        if(_lmr != null && lz_chat_last_message_received != lz_global_base64_decode(_lmr))
            lz_chat_last_message_received = lz_global_base64_decode(_lmr);

        if(_lp != null && _html != null && lz_chat_last_poster != lz_global_base64_decode(_lp))
            lz_chat_last_poster = lz_global_base64_decode(_lp);

        var dx = document.createElement("div");

        document.getElementById("lz_chat_content_inlay").appendChild(dx);
        dx.innerHTML = lz_global_replace_smilies(lz_global_base64_decode(_html),true);

        lz_update_chat_area();
        lz_chat_replace_time();
        lz_chat_replace_icon();

        if(lz_operator_typing)
            document.getElementById('lz_chat_content_inlay').appendChild(document.getElementById("lz_chat_overlay_typing_post"));
    }
}

function lz_update_chat_area(){
    lz_chat_set_element_width();
    lz_chat_scoll_down();
}

function lz_chat_post(){
    this.MessageText = '';
    this.MessageTranslationText = '';
    this.MessageId = '';
    this.Received = false;
}

function lz_chat_operator(){
    this.Id = '';
    this.Fullname = '';
    this.Group = '';
    this.Language = "en";
}

function lz_chat_external_user(){
    this.Id = '';
    this.Username = '';
    this.Email = '';
    this.Company = '';
    this.Question = '';
    this.Typing = false;
    this.MessagesSent = [];
}

function lz_chat_detect_sound(){
    var sa = document.createElement('audio');
    var avail_ogg = !!(sa.canPlayType && sa.canPlayType('audio/ogg; codecs="vorbis"').replace(/no/, ''));
    lz_sound_format = (avail_ogg) ? "ogg" : "mp3";
}

function lz_chat_decline_request(_id,_operator,_stateChange,_result){

    if(_result == null)
        _result = false;

    var node = document.getElementById(_id);
    if(node != null && node.style.display != 'none')
    {
        if(!_operator)
        {
            lz_request_active=_id;
            lz_tracking_action_result('chat_request',_result,false,lz_chat_poll_parameters());
        }
        node.parentNode.removeChild(node);
        lz_chat_set_element_width();

        if(!_result)
            lz_chat_hide();
    }
}

function lz_chat_mail_callback(_flood){
    lz_chat_loading(false);
    lz_mode_ticket_feedback = true;

    document.getElementById('lz_chat_ticket_received').style.display = (_flood) ? "" : "none";
    document.getElementById('lz_chat_ticket_flood').style.display = (!_flood) ? "" : "none";
    if(_flood)
    {
        document.getElementsByName("form_114")[0].value = "";
        lz_ticket = null;
    }
    else
        lz_flood = true;
    lz_chat_update_ui_elements();
}

function lz_chat_send_ticket(){
    lz_chat_save_input_value(114,document.getElementsByName("form_114")[0].value);
    if(lz_check_missing_inputs(true,'lz_chat_send_ticket'))
    {
        lz_chat_loading(true);
        lz_ticket = lz_global_timestamp();
        lz_chat_change_data = true;
        setTimeout("lz_tracking_poll_server(1116);",500);
    }
}

function lz_chat_loading(_loading){
    var change = (_loading != (document.getElementById('lz_chat_overlay_loading').style.display=="block"));
    document.getElementById('lz_chat_overlay_loading').style.display = (_loading) ? "block" : "none";
    if(change)
    {
        if(_loading)
            lz_chat_unset_focus();
        else
            lz_chat_set_focus(43);
    }
}

function lz_check_missing_inputs(_display,_contFunc){

    if(lz_chat_data.InputFieldIndices == null)
        return false;

    var isFilled,missingInput=false,validationreq = false;
    var irequired = (lz_session.OVLWMSElem =="chat") ? lz_chat_data.SelectedGroup.ChatInputsMandatory : lz_chat_data.SelectedGroup.TicketInputsMandatory;
    var ihidden = (lz_session.OVLWMSElem =="chat") ? lz_chat_data.SelectedGroup.ChatInputsHidden : lz_chat_data.SelectedGroup.TicketInputsHidden;
    var isPlaceholderSupport = lz_is_placeholder_support();

    for(var i = 0;i < lz_chat_data.InputFieldIndices.length;i++)
    {
        var findex = lz_chat_data.InputFieldIndices[i];

        if(findex == 115 || (document.getElementById("files_" + findex)==null && lz_chat_data.InputFieldValues[i].Type == "File"))
            continue;

        if(lz_chat_data.InputFieldValues[i].Active || (findex == 116 && lz_session.OVLWMSElem == "phone"))
        {
            if(lz_chat_data.InputFieldValues[i].Type == "File")
                isFilled = document.getElementById("files_" + findex).children.length > 0 || lz_session.OVLWMSElem == "chat";
            else
                isFilled = (lz_chat_data.InputFieldValues[i].Type == "CheckBox") ? document.getElementsByName("form_" + findex)[0].checked : lz_global_trim(document.getElementsByName("form_" + findex)[0].value).length > 0;

            if(!isPlaceholderSupport && isFilled && lz_chat_data.InputFieldValues[i].Type != "CheckBox" && lz_global_trim(document.getElementsByName("form_" + findex)[0].value) == document.getElementById("lz_form_ph_" + findex).value)
                isFilled = false;

            var vrequired = (lz_array_indexOf(ihidden,findex) == -1 && (lz_array_indexOf(irequired,findex) != -1 || lz_chat_data.InputFieldValues[i].Validation));

            if(vrequired && document.getElementById("lz_form_" + findex).style.display == 'none')
                vrequired = false;

            var vcallback = (findex == 116 && lz_session.OVLWMSElem == "phone");
            var vquestion = (findex == 114 && _contFunc=="lz_chat_send_ticket");

            if(lz_chat_data.InputFieldValues[i].Validation && !lz_chat_data.InputFieldValues[i].Validated && lz_array_indexOf(ihidden,lz_chat_data.InputFieldIndices[i]) == -1)
                validationreq = true;

            if((vrequired || vcallback || vquestion) && (!isFilled))
            {
                if(_display)
                {
                    document.getElementById("lz_form_mandatory_" + findex).className = "lz_input_icon lz_required";
                    document.getElementById("lz_form_mandatory_" + findex).style.display = "block";
                }
                missingInput = true;
            }
            else if(_display)
            {
                if(document.getElementById("lz_form_info_" + findex).innerHTML.length > 0)
                {
                    document.getElementById("lz_form_mandatory_" + findex).className = "lz_input_icon lz_info";
                    document.getElementById("lz_form_mandatory_" + findex).style.display = "block";
                }
                else
                    document.getElementById("lz_form_mandatory_" + findex).style.display = "none";
            }
        }
    }

    var group = lz_chat_data.Groups.GetGroupById(document.getElementById('lz_form_groups').value);
    document.getElementById("lz_form_mandatory_group").className = "lz_input_icon lz_required";
    document.getElementById("lz_form_mandatory_group").style.display = (group == null && _display) ? "" : "none";

    if(group == null)
        missingInput = true;

    if(missingInput && !validationreq)
    {
        return false;
    }
    else if(!missingInput && _contFunc != null)
    {
        return lz_validate_inputs(_contFunc, ihidden);
    }
    else
    {
        return !validationreq && !missingInput;
    }
}

function lz_validate_inputs(_contFunc,_hidden){
    var i;
    lz_chat_data.ValidationRequired = false;
    for(i = 0;i < lz_chat_data.InputFieldValues.length;i++)
    {
        lz_chat_data.InputFieldValues[i].SetStatus(null,false);
    }
    for(i = 0;i < lz_chat_data.InputFieldValues.length;i++)
    {
        if(lz_chat_data.InputFieldValues[i].Active && lz_chat_data.InputFieldValues[i].Validation && !lz_chat_data.InputFieldValues[i].Validated && lz_array_indexOf(_hidden,lz_chat_data.InputFieldIndices[i]) == -1)
        {
            lz_chat_data.ValidationRequired = (lz_chat_data.InputFieldValues[i].Type != "CheckBox");
            lz_chat_data.InputFieldValues[i].ValidationResult = null;
            lz_chat_loading(true);
            if(lz_chat_data.ValidationRequired)
            {
                lz_chat_data.InputFieldValues[i].Validate(_contFunc);
                return false;
            }
        }
    }
    return true;
}

function lz_validate_input_result(_result,_id){
    var failed = false;
    for(var i = 0;i < lz_chat_data.InputFieldValues.length;i++)
    {
        if(lz_chat_data.InputFieldValues[i].Index != _id || lz_chat_data.InputFieldValues[i].Validated)
            continue;
        if(lz_chat_data.InputFieldValues[i].ValidationResult != null)
            continue;

        var cinput = lz_chat_data.InputFieldValues[i];
        cinput.Validated = true;
        cinput.ValidationResult = _result;
        clearTimeout(cinput.ValidationTimeoutObject);

        if(_result === false)
            failed = true;
        else if(_result === -1)
        {
            if(cinput.ValidationContinueOnTimeout)
            {
                cinput.ValidationResult = true;
                eval(cinput.ValidationContinueAt);
                return;
            }
            else
                failed = true;
        }
        else if(_result === true)
        {
            eval(cinput.ValidationContinueAt);
            return;
        }

        if(failed)
        {
            setTimeout("lz_chat_loading(false);",500);
            setTimeout("document.getElementById('lz_form_mandatory_" + cinput.Index.toString() + "').style.display = '';",501);
            setTimeout("document.getElementById('lz_form_mandatory_" + cinput.Index.toString() + "').className = 'lz_input_icon lz_required lz_anim_hs';",700);
            cinput.Validated = false;

            for(var x=0;x< lz_chat_data.InputFieldValues.length;x++)
                lz_chat_data.InputFieldValues[x].Validated = false;
            return;
        }
    }
}

function lz_chat_scroll(){
    if(!lz_chat_scrolled)
    {
        lz_chat_scrolled = true;
        lz_chat_set_element_width();
        lz_chat_scoll_down();
    }
}

function lz_chat_set_element_width(){
    var targetWidth = (lz_overlay_chat.m_FixedMode || lz_overlay_chat.m_FullScreenMode) ? lz_global_get_window_width(true) : lz_overlay_chat_width;
    if(document.getElementById("lz_chat_members_box").style.display == 'block')
        targetWidth -= 200;
    for(var i = 0;i<document.getElementById("lz_chat_content_box").childNodes.length;i++)
        if(document.getElementById("lz_chat_content_box").childNodes[i].tagName.toLowerCase() == "div")
            document.getElementById("lz_chat_content_box").childNodes[i].style.width = (lz_chat_scrolled || document.getElementById("lz_chat_content_box").scrollHeight > document.getElementById("lz_chat_content_box").clientHeight) ? (targetWidth-18+"px") : (targetWidth-3+"px");
}

function lz_chat_set_groups(_chatPossible, _groups, _errors, _selected){

    lz_chat_data.ForceGroupSelect = lz_force_group_select;
    if(lz_chat_data.Groups == null)
        lz_chat_data.Groups = new lz_group_list(document,document.getElementById('lz_form_groups'));

    lz_chat_data.Groups.StatusIcon = false;
    lz_chat_data.Groups.CreateHeader(lz_text_please_select);
    lz_chat_data.Groups.Update(_groups);

    var selGroup = lz_global_base64_url_decode(_selected);

    if(selGroup.length>0 && !(lz_chat_data.ForceGroupSelect && !lz_chat_data.ForceSelectMade))
        lz_chat_set_group(lz_global_base64_encode(selGroup));

    lz_chat_change_group(document.getElementById("lz_form_groups"),false);
}

function lz_chat_set_group(_groupId){
    if(lz_chat_data.Groups != null)
    {
        lz_chat_data.SelectedGroup = lz_chat_data.Groups.GetGroupById(lz_global_base64_decode(_groupId));
        if(lz_chat_data.SelectedGroup != null)
        {
            lz_chat_data.Groups.SelectGroupById(lz_chat_data.SelectedGroup.Id,document.getElementById("lz_form_groups"));
            lz_chat_set_group_info();
        }
        OverlayChatWidgetV2.UpdateChatFunctions();
    }
}

function lz_chat_set_group_info(){
    var gobj = null;
    if(lz_chat_data.SelectedGroup != null)
    {
        gobj = lz_chat_data.SelectedGroup;
        if(!OverlayChatWidgetV2.__PublicGroupChat.length)
            document.getElementById("lz_chat_operator_groupname").innerHTML = gobj.Description;
        else
            document.getElementById("lz_chat_operator_groupname").innerHTML = "";

        document.getElementById("lz_chat_operator_fullname").innerHTML = (lz_operator != null && !OverlayChatWidgetV2.__PublicGroupChat.length) ? lz_operator.Fullname : "";
        document.getElementById("lz_chat_operator_fullname").style.display = (lz_operator != null) ? 'inline-block' : 'none';
    }
}

function lz_chat_pre_change_group(_box){
    lz_chat_data.ForceSelectInit=true;
}

function lz_chat_change_group(_box){

    if(lz_chat_data.ForceGroupSelect && !lz_chat_data.ForceSelectMade && _box.selectedIndex == _box.childNodes.length-1)
        return;

    if(lz_chat_data.ForceGroupSelect && lz_chat_data.ForceSelectInit && !lz_chat_data.ForceSelectMade)
    {
        lz_chat_data.ForceSelectMade = true;
        _box.removeChild(lz_chat_data.Groups.ForceSelectOption);
        lz_chat_set_input_fields();
    }

    var last = (lz_chat_data.SelectedGroup != null) ? lz_chat_data.SelectedGroup.Id+lz_chat_data.SelectedGroup.Amount : "";
    lz_chat_data.SelectedGroup = lz_chat_data.Groups.GetGroupById(_box.value);

    //if(lz_session.OVLWMSElem == "chat" && lz_chat_data.SelectedGroup != null && lz_chat_data.SelectedGroup.Amount == 0 && !lz_chat_is_visible())
      //  lz_chat_data.SelectedGroup = null;

    if(lz_chat_data.SelectedGroup == null)
    {
        var position = _box.selectedIndex;
        var reset = false;

        while(lz_chat_data.SelectedGroup == null)
        {
            position++;
            if(position == _box.childNodes.length)
                if(!reset)
                {
                    position = 0;
                    reset=true;
                }
                else
                    break;

            lz_chat_data.SelectedGroup = lz_chat_data.Groups.GetGroupById(_box.childNodes[position].value);
        }
    }

    var current = (lz_chat_data.SelectedGroup != null) ? lz_chat_data.SelectedGroup.Id+lz_chat_data.SelectedGroup.Amount : "";
    if(lz_chat_data.SelectedGroup != null)
    {
        if(_box.length > position)
            _box.selectedIndex = position;

        if(last != current)
        {
            lz_chat_update_ui_elements();
        }
        _box.style.color = _box.childNodes[_box.selectedIndex].style.color;
        _box.style.background = _box.childNodes[_box.selectedIndex].style.background;
    }

}

function lz_chat_data_box(){
    this.InputFieldIndices = null;
    this.InputFieldValues = null;
    this.InputFieldFiles = null;
    this.SelectedGroup = null;
    this.Groups = null;
    this.ForceSelectInit = false;
    this.ForceSelectMade = false;
    this.ForceGroupSelect = false;
    this.QueueMessageAppended = false;
    this.TimerWaiting = null;
}

function lz_chat_show_info_box(_id,_active){
    var box = document.getElementById('lz_form_info_' + _id);
    box.style.display = (_active && box.style.display != 'block') ? 'block' : 'none';
    box.style.right = "30px";
}

function lz_chat_set_input_fields(){
    try
    {
        if(lz_chat_data.InputFieldIndices != null && lz_chat_data.SelectedGroup != null)
        {
            if(lz_first_call)
            {
                lz_chat_loading(false);
                lz_first_call = false;
            }
            var isHidden = false;
            var isChat = (lz_session.OVLWMSElem=="chat");
            var ihidden = (isChat) ? lz_chat_data.SelectedGroup.ChatInputsHidden : lz_chat_data.SelectedGroup.TicketInputsHidden;
            var isRequired = (isChat) ? lz_chat_data.SelectedGroup.ChatInputsMandatory : lz_chat_data.SelectedGroup.TicketInputsMandatory;
            var mandatoryFields = (lz_session.OVLWMSElem!="ticket");
            var isPlaceholderSupport = lz_is_placeholder_support();

            OverlayChatWidgetV2.ValidateMode();

            for(var i = 0;i < lz_chat_data.InputFieldIndices.length;i++)
            {
                var findex = lz_chat_data.InputFieldIndices[i];
                try
                {
                    if(document.getElementById("lz_form_active_" + findex) == null)
                        continue;

                    if(document.getElementById("lz_form_active_" + findex).value == "true" || (lz_session.OVLWMSElem=="phone" && findex == 116))
                    {
                        isHidden = ((lz_array_indexOf(ihidden,findex) > -1) || (lz_chat_data.ForceGroupSelect && !lz_chat_data.ForceSelectMade && lz_chat_data.InputFieldValues[i].IsHiddenGeneral(lz_chat_data.Groups.Groups,isChat)));
                        if(OverlayChatWidgetV2.__PublicGroupChat.length && findex == 114)
                            isHidden = true;
                        if(isChat && lz_mode_change_details && findex == 114)
                            isHidden = true;
                        if(isChat && lz_chat_data.InputFieldValues[i].Type == 'File')
                            isHidden = true;
                        if(lz_session.OVLWMSElem=="phone" && findex != 111 && findex != 114 && findex != 116)
                            isHidden = true;
                        if(lz_session.OVLWMSElem=="phone" && findex == 116)
                            isHidden = false;
                        if(findex == 115)
                            isHidden = true;

                        document.getElementById("lz_form_" + findex).className = (findex==116 && lz_session.OVLWMSElem=="phone") ? "lz_input lz_input_com" : document.getElementById("lz_form_" + findex).className;
                        document.getElementById("lz_form_" + findex).style.display = (isHidden) ? "none" : "";
                        document.getElementById("lz_form_" + findex).style.display = (findex==116 && lz_session.OVLWMSElem=="phone") ? "" : document.getElementById("lz_form_" + findex).style.display;

                        if(document.getElementById("lz_form_info_" + findex).innerHTML.length > 0 && !lz_mode_change_details)
                        {
                            if(document.getElementById("lz_form_mandatory_" + findex).className.indexOf("lz_required") == -1)
                                document.getElementById("lz_form_mandatory_" + findex).className = "lz_input_icon lz_info";

                            document.getElementById("lz_form_mandatory_" + findex).style.cursor = "pointer";
                            document.getElementById("lz_form_mandatory_" + findex).style.display = "";
                            document.getElementById("lz_form_mandatory_" + findex).onmouseover = new Function("lz_chat_show_info_box('"+findex.toString()+"',true);");
                            document.getElementById("lz_form_mandatory_" + findex).onmouseout = new Function("lz_chat_show_info_box('"+findex.toString()+"',false);");
                            document.getElementById("lz_form_mandatory_" + findex).onclick = new Function("lz_chat_show_info_box('"+findex.toString()+"',true);");
                            document.getElementById("lz_form_info_" + findex).onclick = new Function("lz_chat_show_info_box('"+findex.toString()+"',false);");
                        }
                        else if(lz_mode_change_details)
                            document.getElementById("lz_form_mandatory_" + findex).style.display = "none";

                        document.getElementsByName("form_" + findex)[0].disabled = lz_mode_change_details && lz_chat_data.InputFieldValues[i].Validation;
                    }
                    else
                        document.getElementById("lz_form_" + findex).style.display = 'none';

                    if(lz_chat_data.InputFieldValues[i].Active)
                    {
                        if(lz_array_indexOf(isRequired,findex) != -1 || (lz_chat_data.InputFieldValues[i].Validation && lz_array_indexOf(ihidden,findex) == -1))
                        {
                            if(!lz_mode_chat_login)
                                lz_mode_chat_login = lz_chat_human_available && !OverlayChatWidgetV2.__ModeBot;
                            mandatoryFields = true;
                        }

                        if(!isPlaceholderSupport && (lz_chat_data.InputFieldValues[i].Type == "Text" || lz_chat_data.InputFieldValues[i].Type == "TextArea"))
                        {
                            if(document.getElementsByName("form_" + findex)[0].value=='')
                            {
                                document.getElementsByName("form_" + findex)[0].value = document.getElementById("lz_form_ph_" + findex).value;
                                document.getElementsByName("form_" + findex)[0].style.color = '#BBB';
                            }
                            document.getElementsByName("form_" + findex)[0].onfocus=new Function("if (this.value == '"+document.getElementById("lz_form_ph_" + findex).value+"') {this.value = ''; this.style.color='#333'}");
                            document.getElementsByName("form_" + findex)[0].onblur=new Function("if (this.value == '') {this.value = '"+document.getElementById("lz_form_ph_" + findex).value+"'; this.style.color='#BBB'}");
                        }

                        if(lz_chat_data.InputFieldValues[i].Type == 'File')
                        {
                            document.getElementById("files_" + findex).style.display = 'none';
                            document.getElementById("files_" + findex).innerHTML = '';
                            if(lz_chat_data.InputFieldFiles[i].length)
                            {
                                document.getElementById("files_" + findex).style.display = 'block';
                                for(var key in lz_chat_data.InputFieldFiles[i])
                                {
                                    document.getElementById("files_" + findex).innerHTML += '<div class="lz_form_file_box"><span onclick="if(event.stopPropagation){event.stopPropagation();}event.cancelBubble=true;" class="lz_form_file_item">'+ lz_global_htmlentities(lz_global_base64_decode(lz_chat_data.InputFieldFiles[i][key][1]).substring(0,30)) + '</span><span onclick="lz_chat_remove_att(\''+lz_chat_data.InputFieldFiles[i][key][0]+'\');if(event.stopPropagation){event.stopPropagation();}event.cancelBubble=true;" class="lz_form_file_item lz_form_file_remove">X</span><div>';
                                }
                            }
                        }
                    }
                }
                catch(ex)
                {
                    console.log(ex);
                }
            }

            var hideGroup = ( (lz_session.OVLWMSElem =="chat" && (lz_mode_change_details || lz_hide_group_chat)) || ((lz_session.OVLWMSElem =="ticket"||lz_session.OVLWMSElem =="phone") && lz_hide_group_ticket));
            document.getElementById("lz_group_selection_box").style.display = hideGroup ? "none" : "";
        }
        else if(lz_first_call)
        {
            lz_chat_loading(true);
        }

        if(!lz_mode_chat_login && lz_force_group_select)
            lz_mode_chat_login = true;
    }
    catch(ex)
    {
        console.log(ex);
    }
}

function lz_chat_switch_options(_function,_cancel,_type,_findex){
    var functions = ["fu"];
    if(!_cancel)
    {
        lz_chat_unset_focus();
        var show = document.getElementById("lz_chat_overlay_options_box").style.display == "none";

        for(var i = 0;i<functions.length;i++)
            document.getElementById('lz_chat_overlay_option_function_' + functions[i]).style.display = (_function == functions[i]) ? "block" : "none";

        if(show)
        {
            lz_chat_option_function = _function;
            if(_function=="fu")
            {
                var getp = (_type == 'ticket') ? 'uid=' +lz_global_base64_url_encode(lz_session.UserId)+'&bid=' +lz_global_base64_url_encode(lz_session.BrowserId) : 'cid='+ lz_global_base64_url_encode(lz_chat_id) + '&wt=ovlv2';

                if(typeof _findex != 'undefined')
                    getp += '&find=' + lz_global_base64_url_encode(_findex);

                getp += '&etc=' + lz_global_base64_url_encode(lz_color_primary);

                if(document.getElementById('lz_chat_overlay_file_upload_frame').src != lz_poll_server+"upload.php?"+getp)
                    document.getElementById('lz_chat_overlay_file_upload_frame').src = lz_poll_server+"upload.php?"+getp;
            }
        }
        else
        {
            if(_function=="fu")
            {
                lz_load_inputs = true;
                lz_tracking_poll_server(1021);
            }
            lz_session.Save();
        }
        lz_mode_show_options = show;
        lz_chat_fade_options(show);
    }
    else
    {
        lz_chat_fade_options(false);
    }
}

function lz_chat_remove_att(_aId){
    lz_remove_att = _aId;
    lz_tracking_poll_server(1412);
}

function lz_chat_load_input_values(_reset){
    for(var i = 0;i< lz_chat_data.InputFieldIndices.length;i++)
    {
        var findex = lz_chat_data.InputFieldIndices[i];
        if(document.getElementById("lz_form_" + findex) != null)
        {
            if(lz_chat_data.InputFieldValues[i].Type == "File")
                continue;
            if(document.getElementsByName("form_" + findex)[0].tagName.toUpperCase() == "SELECT")
                document.getElementsByName("form_" + findex)[0].selectedIndex = parseInt(lz_chat_data.InputFieldValues[i].Value);
            else if(document.getElementsByName("form_" + findex)[0].type.toUpperCase() == "CHECKBOX")
            {
                if(document.getElementsByName("form_" + findex)[0].value=="" || _reset)
                    document.getElementsByName("form_" + findex)[0].value = lz_chat_data.InputFieldValues[i].Value;

                document.getElementsByName("form_" + findex)[0].checked = (parseInt(lz_chat_data.InputFieldValues[i].Value)==1);
            }
            else
            {
                if(document.getElementsByName("form_" + findex)[0].value=="" || _reset)
                    document.getElementsByName("form_" + findex)[0].value = lz_global_trim(lz_chat_data.InputFieldValues[i].Value);
            }
        }
    }
}

function lz_chat_show_queue_position(_position,_time,_html){
    if(!lz_chat_data.QueueMessageAppended)
    {
        var qmessage = lz_global_base64_decode(_html).replace("<!--queue_position-->","<span id='lz_chat_queue_position' style='color:"+lz_color_secondary+"'>-1</span>");
        qmessage = qmessage.replace("<!--queue_waiting_time-->","<span id='lz_chat_queue_waiting_time' style='color:"+lz_color_secondary+"'>-1</span>");
        lz_chat_add_html_element(lz_global_base64_encode(qmessage),false,null,null,null,null);
        lz_chat_data.QueueMessageAppended = true;
        lz_chat_last_poster = null;
    }

    if(document.getElementById('lz_chat_queue_position'))
    {
        var cposition = parseInt(document.getElementById('lz_chat_queue_position').innerHTML);
        var cwtime = parseInt(document.getElementById('lz_chat_queue_waiting_time').innerHTML);

        if(cposition == -1 || (_position > 0 && _position <= cposition))
            document.getElementById('lz_chat_queue_position').innerHTML = _position;

        if(cwtime == -1 || (_time > 0 && _time <= cwtime))
            document.getElementById('lz_chat_queue_waiting_time').innerHTML = _time;
    }
}

function lz_chat_show_feedback(){
    var getp = 'cid='+ lz_global_base64_url_encode(OverlayChatWidgetV2.__LastChatId) + '&wt=ovlv2&etc=' + lz_global_base64_url_encode(lz_color_primary) + '&el=' + lz_user_language;
    var ifr = document.getElementById('lz_overlay_module_feedback_content').getElementsByTagName('iframe')[0];
    if(ifr.src != lz_poll_server+"feedback.php?"+getp)
    {
        document.getElementById("lz_overlay_module_feedback").style.display = 'block';
        ifr.src = lz_poll_server+"feedback.php?"+getp;
    }
    OverlayChatWidgetV2.__ModeFeedback = !OverlayChatWidgetV2.__ModeFeedback;
    lz_chat_update_ui_elements();
}

function lz_chat_kb_deactivate(_closeButton,_switchTo){

    lz_chat_search_result(0);
    if(_closeButton)
    {
        lz_session.KBS = 0;
        lz_session.Save();
    }

    if(_switchTo)
    {
        if(lz_chat_get_wm_element('knowledgebase') != null)
            OverlayChatWidgetV2.SetMode('knowledgebase',true);
        else
            lz_chat_pop_out('knowledgebase','&eq='+lz_global_base64_encode(document.getElementsByName("form_114")[0].value));
    }
}

function lz_chat_open(_playSound){

    if(lz_chats_external)
        lz_chat_pop_out('chat');
    else if(lz_chat_get_wm_element('chat')!=null)
    {
        lz_session.OVLWMState='1';
        OverlayChatWidgetV2.SetMode('chat',false);

        if(_playSound)
            lz_chat_play_sound('wind');
    }
    else
    {
        OverlayChatWidgetV2.SetMode(OverlayChatWidgetV2.GetAutoMode(),true);
    }
}

function lz_chat_show(_playSound){
    lz_chat_open(_playSound);
}

function lz_chat_hide(){
    lz_session.OVLWMState='0';
    OverlayChatWidgetV2.SetMode(OverlayChatWidgetV2.GetAutoMode());
}

function lz_chat_overlay_set_mode(_a,_b){
    //comp
    OverlayChatWidgetV2.SetMode(_a,_b);
}

function lz_chat_is_visible(){
    return lz_session.OVLWMState=='1' && lz_session.OVLWMSElem != '' && lz_session.OVLWMSElem != 'wm';
}

function lz_chat_set_zoom(_click,_show){

    if(!lz_fixed_mode_possible())
        return;

    if(_show)
    {
        lz_chat_restore_meta();
        lz_overlay_chat.SetVisible(false);
        lz_overlay_chat.SetFixedMode(true);
        lz_default_overflow = document.body.style.overflow;
        document.body.style.position = "fixed";
        document.body.style.overflow = "hidden";
        document.body.style.right=0;
        document.body.style.left=0;
        lz_chat_set_meta();

        setTimeout(function(){
            lz_chat_set_slide(_click);
            lz_chat_update_css();
            lz_chat_set_element_width();
            lz_chat_scoll_down();

            },1000
        );
    }
    else
    {
        lz_overlay_chat.SetVisible(false);
        lz_chat_restore_meta();
        document.body.style.position = "";
        document.body.style.overflow = lz_default_overflow;
        lz_overlay_chat.SetFixedMode(false);
        lz_chat_set_slide(false);
    }
}

function lz_chat_set_slide(_in){
    if(_in)
    {
        lz_overlay_chat.m_FrameElement.style["transform"] = "translateY(+100%)";
        lz_overlay_chat.m_FrameElement.style["-webkit-transform"] = "translateY(+100%)";
        lz_overlay_chat.SetVisible(true);
        lz_overlay_chat.m_FrameElement.className = 'lz_anim_slide_in';
    }
    else
    {
        lz_overlay_chat.m_FrameElement.style["transform"] = "";
        lz_overlay_chat.m_FrameElement.style["-webkit-transform"] = "";
        lz_overlay_chat.m_FrameElement.className = "";
    }
}

function lz_chat_require_leave_message(_click){

    if(_click)
        OverlayChatWidgetV2.__TicketRequired = true;
    OverlayChatWidgetV2.SetMode('ticket',false);
}

function lz_overlay_chat_impose_max_length(_object, _max){
    if(_object.value.length > _max)
        _object.value = _object.value.substring(0,_max);
}

function lz_chat_set_meta(){
    var etags = document.getElementsByTagName("meta");
    if(etags.length > 0)
        for (key in etags)
            if(etags[key].name == "viewport" && etags[key].id!="lzvpc")
            {
                lz_default_meta = etags[key];
                etags[key].parentNode.removeChild(etags[key]);
            }
    var meta = document.createElement('meta');
    meta.name = "viewport";
    meta.id="lzvpc";
    meta.content = "width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no";
    document.getElementsByTagName('head')[0].appendChild(meta);
}

function lz_chat_restore_meta(){
    if(document.getElementById("lzvpc")!=null)
    {
        document.getElementById("lzvpc").setAttribute("content","");
        document.getElementsByTagName('head')[0].removeChild(document.getElementById("lzvpc"));
    }
    if(lz_default_meta != null)
        document.getElementsByTagName('head')[0].appendChild(lz_default_meta);
}

function lz_chat_set_application_status(_hideWidget,_chat,_bot,_human,_title,_chatStatus,_declined){

    if(lz_overlay_chat != null)
    {
        var isChat = (lz_session.OVLWMSElem =="chat");
        lz_hide_widget_by_conf = _hideWidget;

        if(_chatStatus==0 && lz_chat_status != _chatStatus)
            OverlayChatWidgetV2.__ChatStarted = false;

        lz_chat_status = _chatStatus;
        lz_chat_declined = false;
        lz_chat_human_available = _human;

        if(lz_operator != null || lz_chat_connecting)
            _chat = true;

        if(lz_mode_change_details && _chat != isChat)
            lz_chat_switch_details(true);

        if(!_chat && document.getElementById('lz_chat_text').value.length > 0 && document.getElementsByName("form_114")[0].value.length == 0)
            document.getElementsByName("form_114")[0].value = document.getElementById('lz_chat_text').value;

        if(!_chat && document.getElementById("lz_chat_queued_posts") != null)
            document.getElementById("lz_chat_content_box").removeChild(document.getElementById("lz_chat_queued_posts"));

        OverlayChatWidgetV2.ChatAvailable = _chat;

        OverlayChatWidgetV2.ValidateMode();
        lz_chat_update_ui_elements();
        lz_chat_update_wm_ui();
        OverlayChatWidgetV2.UpdateEyeCatcherContent();
    }
}

function lz_chat_add_wm_elems(_template,_ml,_mt,_mr,_mb){

    var VARSA = Math.floor(10*OverlayChatWidgetV2.__Ratio);

    if(lz_ovlel.length==1)
        return;

    if(lz_overlay_wm == null && !OverlayChatWidgetV2.__ModeCombi)
    {
        var cwidth = (lz_ovlel_fsm) ? 'auto' : OverlayChatWidgetV2.__Size+OverlayChatWidgetV2.__Border;
        var cheight = (lz_ovlel_fsm) ? '50' : (OverlayChatWidgetV2.__Size+OverlayChatWidgetV2.__Border)+OverlayChatWidgetV2.__Space;
        var cpos = (lz_ovlel_fsm) ? '00' : '22';

        lz_overlay_wm = new lz_livebox_v2("lz_overlay_wm",_template,cwidth,cheight + 'px',_ml,0,_mr,_mb,cpos,(lz_ovlel_fsm) ? document.getElementById('lz_chat_fs_body') : document.body);
        lz_overlay_wm.m_MaxHeight = (lz_ovlel_fsm) ? cheight + 'px' : ((OverlayChatWidgetV2.__Size+OverlayChatWidgetV2.__Border)+OverlayChatWidgetV2.__Space)*lz_ovlel.length;
        lz_overlay_wm.SetMobile(lz_is_mobile);

        lz_chat_overlay_pointer = document.getElementById('lz_chat_overlay_pointer_' + ((OverlayChatWidgetV2.__ModeSingle) ? 'v' : 'h'));

        if(lz_ovlel_fsm)
        {
            document.getElementById('lz_chat_overlay_text').style.background =
            document.getElementById('lz_chat_overlay_text').style.color = '#fff';
            document.getElementById('lz_chat_overlay_text').style.textAlign = 'right';
            lz_overlay_wm.m_FrameElement.style.whiteSpace = 'nowrap';
            lz_overlay_wm.m_FrameElement.style.overflow = 'hidden';
            lz_overlay_wm.m_FrameElement.style.background = '#f7f8f9';
            lz_overlay_wm.m_FrameElement.style.position = 'absolute';
        }

        var i,pt,cln,clnd,clnc,wm = document.getElementById('livezilla_wm'),wmd = document.getElementById('livezilla_wm_d'),wmc = document.getElementById('livezilla_wm_c');

        wm.style.height =
        wm.style.width = OverlayChatWidgetV2.__Size + 'px';

         var bzi = lz_overlay_zindex+100;

        if(lz_is_mobile && !lz_ovlel_fsm)
            bzi-=1000;

        for(var y=lz_ovlel.length-1;y>=0;y--)
        {
            i = (lz_ovlel_fsm) ? ((lz_ovlel.length-1) - y) : y;

            if(lz_ovlel[i]==null)
                continue;

            pt = (((OverlayChatWidgetV2.__Size+OverlayChatWidgetV2.__Border)*i)+(OverlayChatWidgetV2.__Space*i));
            clnd = null;

            if(lz_ovlel[i].type != 'wm')
            {
                cln = wm.cloneNode(true);
                cln.getElementsByTagName('path')[0].setAttribute("d", lz_get_icon_path(lz_ovlel[i].icon));

                cln.id += "_" + lz_ovlel[i].type;
                cln.style.zIndex = bzi-i;
                lz_overlay_wm.m_FrameElement.appendChild(cln);

                clnd = wmd.cloneNode(true);
                clnd.id += "_" + lz_ovlel[i].type;

                if(lz_ovlel[i].type != 'phone')
                    clnd.innerHTML = lz_text_wm[lz_ovlel[i].type];
                else
                {
                    clnd.innerHTML = "";
                    if(lz_ovlel[i].inbound != false)
                        clnd.innerHTML += lz_text_wm['phone_in'];

                    if(lz_ovlel[i].inbound != false && lz_ovlel[i].outbound != false)
                        clnd.innerHTML += ' / ';

                    if(lz_ovlel[i].outbound != false)
                        clnd.innerHTML += lz_text_wm['phone_out'];
                }

                clnd.style.marginTop = '-' +((OverlayChatWidgetV2.__Size+OverlayChatWidgetV2.__Border)-VARSA)+ 'px';

                if(!lz_ovlel_fsm)
                    clnd.style.right = (OverlayChatWidgetV2.__Size+OverlayChatWidgetV2.__Border) + VARSA + 'px';

                clnd.style.borderRadius = lz_border_radius + 'px';

                if(lz_is_mobile && !lz_ovlel_fsm)
                    clnd.style.transform = 'translateY('+ pt + 'px'+')';

                if(typeof lz_ovlel[i].color != 'undefined')
                    clnd.style.backgroundColor = lz_ovlel[i].color;

                clnd.style.zIndex = cln.style.zIndex;

                cln.setAttribute("data-did",clnd.id);
                cln.setAttribute("data-type",lz_ovlel[i].type);

                if(!lz_ovlel_fsm)
                    cln.appendChild(clnd);
                else
                    lz_overlay_wm.m_FrameElement.appendChild(clnd);

                if(typeof lz_ovlel[i].counter != 'undefined')
                {
                    clnc = wmc.cloneNode(true);
                    clnc.id += "_" + lz_ovlel[i].type;
                    clnc.style.zIndex = cln.style.zIndex+2;
                    cln.appendChild(clnc);

                    if(lz_ovlel_fsm)
                    {
                        clnc.style.top='-45px';
                        clnc.style.left='55px';
                    }
                }

                if(!lz_ovlel_fsm)
                    cln.style.top = (OverlayChatWidgetV2.__Size+OverlayChatWidgetV2.__Border)*-1 + 'px';
                else
                {
                    cln.style.top = parseInt((cheight - (OverlayChatWidgetV2.__Size+OverlayChatWidgetV2.__Border)) / 2) + 'px';

                    if(typeof lz_ovlel[i].href == 'undefined')
                        cln.style.left = ((OverlayChatWidgetV2.__Size+OverlayChatWidgetV2.__Border+VARSA)*(i))-(OverlayChatWidgetV2.__Size/1.3) + 'px';
                    else
                        cln.style.right = '-1000px';
                }

                if(!lz_ovlel_fsm && typeof lz_ovlel[i].margin != 'undefined')
                {
                    cln.style.marginBottom = lz_ovlel[i].margin[2] + OverlayChatWidgetV2.__Space + 'px';
                    lz_overlay_wm.m_MaxHeight += lz_ovlel[i].margin[2];
                }
                else
                    cln.style.marginBottom = OverlayChatWidgetV2.__Space + 'px';

                if(lz_ovlel[i].type == 'phone')
                {
                    lz_mode_phone_outbound = lz_ovlel[i].outbound != false;
                    lz_mode_phone_inbound = lz_ovlel[i].inbound != false;

                    if(lz_mode_phone_inbound)
                    {
                        document.getElementById('lz_chat_data_phone_header_number').innerHTML = lz_global_base64_url_decode(lz_ovlel[i].inbound.number);
                        document.getElementById('lz_chat_data_phone_header_text').innerHTML = lz_global_base64_url_decode(lz_ovlel[i].inbound.text);
                    }
                }

                if(!lz_ovlel_fsm && typeof lz_ovlel[i].color != 'undefined')
                    cln.style.backgroundColor = lz_ovlel[i].color;
                else if(!lz_ovlel_fsm)
                    cln.style.borderColor = lz_color_primary_dark;
            }
            else
            {
                cln = wm;
                cln.style.zIndex = bzi+100;
                if(!lz_ovlel_fsm)
                    cln.style.borderColor = lz_color_primary_dark;
            }
            cln.setAttribute('data-tid',lz_ovlel[i].type);

            if(!lz_ovlel_fsm)
            {
                cln.style.transform = 'translateY('+ pt + 'px'+')';
                cln.style.borderRadius = Math.min(50,lz_border_radius*VARSA)+'%';
                cln.style.right = 0;
            }
            else
            {
                cln.style.boxShadow = 'none';
                cln.style.width = '100px';
                cln.style.textAlign = 'center';
            }

            cln.style.position = (lz_ovlel_fsm) ? 'static' : 'relative';
            cln.style.display = (lz_ovlel_fsm) ? 'inline-block' : 'block';
        }

        if(lz_ovlel.length)
            wm.getElementsByTagName('path')[0].setAttribute("d", lz_get_icon_path(lz_ovlel[0].icon));

        if(!lz_ovlel_fsm)
            lz_chat_overlay_pointer.style.right = ((!OverlayChatWidgetV2.__ModeSingle) ? (parseInt(lz_overlay_chat.m_FrameElement.style.marginRight.replace('px',''))-11)  : (_mr + (((OverlayChatWidgetV2.__Size+OverlayChatWidgetV2.__Border)/2)-12))) + 'px';

        lz_chat_overlay_pointer.style.zIndex = bzi+1200;
        lz_overlay_wm.m_FrameElement.style.zIndex = lz_overlay_zindex;
    }
}

function lz_chat_update_wm_ui(){

    if(lz_overlay_wm == null)
        return;

    var did,cln,clnd,wm = document.getElementById('livezilla_wm');
    lz_overlay_wm.m_FrameElement.style.height = ((lz_session.OVLWMState=='0') ? (OverlayChatWidgetV2.__Size+OverlayChatWidgetV2.__Border) : lz_overlay_wm.m_MaxHeight) + 'px';

    for(var i=lz_ovlel.length-1;i>=0;i--)
    {
        if(lz_ovlel[i].type != 'wm')
        {
            cln = document.getElementById('livezilla_wm' + "_" + lz_ovlel[i].type);
            cln.style.display = (lz_session.OVLWMState=='0' || OverlayChatWidgetV2.__ModeSingle) ? 'none': (!lz_overlay_chat.m_FullScreenMode) ? 'block' : 'inline-block';
            if(lz_session.OVLWMSElem == lz_ovlel[i].type)
            {
                if(lz_overlay_chat.m_FullScreenMode)
                {
                    lz_chat_overlay_pointer.style.left = ((((OverlayChatWidgetV2.__Size+OverlayChatWidgetV2.__Border)*(i)) + 13) + (i*10)) - (OverlayChatWidgetV2.__Size/1.3) + 'px';
                    cln.style.background = lz_color_primary;
                    cln.getElementsByTagName('svg')[0].style.fill = '#fff';
                }
                else
                {
                    if(!OverlayChatWidgetV2.__ModeSingle)
                    {
                        var bs = (((OverlayChatWidgetV2.__Size+OverlayChatWidgetV2.__Border)*i)+(OverlayChatWidgetV2.__Space*i)) + OverlayChatWidgetV2.__Space + (13*OverlayChatWidgetV2.__Ratio);
                        lz_chat_overlay_pointer.style.bottom = bs + lz_overlay_wm.m_Margins[2] + 'px';
                    }
                }
            }
            else if(lz_overlay_chat.m_FullScreenMode)
            {
                cln.style.background = '#f7f8f9';
                cln.style.borderRight = '1px dotted #ddd';
                cln.getElementsByTagName('svg')[0].style.fill = '#999';
            }

            did = 'livezilla_wm_d_' + lz_ovlel[i].type;
            clnd = document.getElementById(did);
            if(!lz_is_mobile && !lz_overlay_chat.m_FullScreenMode)
            {
                cln.onmouseover = function(){
                    if(this.getAttribute('data-tid')==lz_session.OVLWMSElem)
                        lz_chat_overlay_pointer.style.visibility = 'hidden';

                    document.getElementById(this.getAttribute('data-did')).style.display='block';
                    var that = this;
                    if(lz_is_mobile)
                        setTimeout(function(){
                            document.getElementById(that.getAttribute('data-did')).style.display='none';
                        },2000);
                };
                cln.onmouseout = function(){
                    lz_chat_overlay_pointer.style.visibility = 'visible';
                    document.getElementById(this.getAttribute('data-did')).style.display='none';
                };
            }
            else if(!lz_overlay_chat.m_FullScreenMode)
            {
                clnd.style.display = (lz_is_mobile && lz_session.OVLWMState=='0') ? 'none': 'block';
                lz_add_class(clnd,'lz_anim_slide_in');
            }
            lz_add_class(clnd,'lz_overlay_wm_sh_act');
        }
        else
        {
            cln = wm;
            cln.style.top = (lz_session.OVLWMState!='0') ? lz_overlay_wm.m_MaxHeight-((OverlayChatWidgetV2.__Size+OverlayChatWidgetV2.__Border)+OverlayChatWidgetV2.__Space) + 'px' : 0;
            cln.style.visibility = (!lz_overlay_chat.m_FullScreenMode) ? 'visible' : 'hidden';
            cln.style.display = (!lz_overlay_chat.m_FullScreenMode) ? 'block' : 'none';

            if(OverlayChatWidgetV2.__ModeSingle)
            {
                if(lz_session.OVLWMSElem=='chat' && lz_chat_get_wm_element('chat') != null)
                    cln.getElementsByTagName('path')[0].setAttribute("d", lz_get_icon_path(lz_chat_get_wm_element('chat').icon));
                else if(lz_session.OVLWMSElem=='ticket' && lz_chat_get_wm_element('ticket') != null)
                    cln.getElementsByTagName('path')[0].setAttribute("d", lz_get_icon_path(lz_chat_get_wm_element('ticket').icon));
                else if(lz_ovlel.length>1)
                    cln.getElementsByTagName('path')[0].setAttribute("d", lz_get_icon_path(lz_ovlel[1].icon));
                else if(lz_ovlel.length==1)
                    cln.getElementsByTagName('path')[0].setAttribute("d", lz_get_icon_path(lz_ovlel[0].icon));
            }
            else
            {
                if(lz_chat_get_wm_element('chat') == null)
                {
                    cln.getElementsByTagName('path')[0].setAttribute("d", lz_get_icon_path('question'));
                    cln.getElementsByTagName('svg')[0].setAttribute("viewBox", lz_get_icon_v('question'));
                    cln.getElementsByTagName('path')[0].setAttribute("transform", lz_get_icon_t('question'));
                }
            }
        }

        lz_add_class(cln,'lz_overlay_wm_button');

        if(typeof lz_ovlel[i].href != 'undefined')
            cln.onclick = function(arg) {return function() {lz_chat_open_window(arg,true);}}(lz_global_base64_decode(lz_ovlel[i].href));
        else if(lz_ovlel[i].type == 'knowledgebase' && lz_kb_external)
            cln.onclick = function() {lz_chat_pop_out('knowledgebase')};
        else if(lz_ovlel[i].type == 'knowledgebase' && lz_kb_embed)
            cln.onclick = function() {window.location.href=lz_kb_embed_url};
        else
        {
            if(lz_ovlel[i].type=='wm' && lz_chats_external)
                cln.onclick = function(){lz_chat_pop_out('chat');};
            else
                cln.onclick = function(){OverlayChatWidgetV2.SetMode(this.getAttribute('data-tid'),true);};
        }

        if(lz_ovlel[i].type == 'chat')
        {
            if(!OverlayChatWidgetV2.ChatAvailable || lz_chat_declined)
                lz_add_class(cln,'lz_chat_disabled');
            else
                lz_remove_class(cln,'lz_chat_disabled');
        }

        if(lz_ovlel[i].type == 'ticket')
        {
            if(!lz_ticket_when_online && OverlayChatWidgetV2.ChatAvailable)
                lz_add_class(cln,'lz_chat_disabled');
            else
                lz_remove_class(cln,'lz_chat_disabled');
        }
        lz_add_class(cln,'lz_overlay_wm_sh_act');
        lz_add_class(cln,'lz_anim_slide_in');
    }

    if(OverlayChatWidgetV2.__ModeSingle)
        lz_chat_overlay_pointer.style.bottom = (parseInt(lz_overlay_chat.m_FrameElement.style.marginBottom.replace('px',''))-14) + 'px';

    if(lz_chat_get_wm_element('chat') != null)
    {
        if(OverlayChatWidgetV2.__ModeSingle || lz_session.OVLWMState == '0')
            lz_overlay_wm.m_FrameElement.appendChild(document.getElementById('livezilla_wm_c_chat'));
        else
            document.getElementById('livezilla_wm_chat').appendChild(document.getElementById('livezilla_wm_c_chat'));
    }

    if(lz_session.OVLWMSElem == 'chat' && lz_session.OVLWMState == '1')
        lz_chat_update_waiting_posts(0);

    lz_chat_overlay_pointer.style.display = OverlayChatWidgetV2.__ModeAPI || lz_session.OVLWMSElem=='' || lz_session.OVLWMState=='0' || lz_is_mobile || lz_overlay_chat.m_FullScreenMode ? 'none': 'block';

    if(lz_eye_catcher != null)
    {
        lz_eye_catcher.SetVisible(lz_eye_catcher.m_FrameElement.style.opacity >= 1 && lz_session.OVLWMState=='0');
    }
}

function lz_chat_update_chat_ui(_visible){
    if(lz_overlay_chat.m_FullScreenMode || (_visible && !lz_overlay_chat.IsVisible()))
    {
        lz_overlay_chat.SetVisible(true);
        if(lz_is_mobile && !lz_overlay_chat.m_FullScreenMode)
        {
            lz_chat_set_zoom(true,true);
            OverlayChatWidgetV2.ValidateMode();

            lz_overlay_wm.SetVisible(false);
        }
    }
    if(!lz_overlay_chat.m_FullScreenMode && (!_visible && lz_overlay_chat.IsVisible()))
    {
        if(lz_is_mobile && !lz_overlay_chat.m_FullScreenMode)
        {
            lz_chat_set_zoom(true,false);
            lz_overlay_wm.SetVisible(true);
        }
        lz_overlay_chat.SetVisible(false);
    }
}

function lz_chat_get_wm_element(_type){
    for(var key in lz_ovlel)
        if(lz_ovlel[key].type == _type)
            return lz_ovlel[key];
    return null;
}

OverlayChatWidgetV2.UpdateChatFunctions = function(){
    if(lz_chat_data.SelectedGroup == null)
        return;

    var functions = lz_chat_data.SelectedGroup.ChatFunctions;
    if(functions != null)
    {
        var inChat = lz_chat_id.length && lz_chat_status == 2;

        document.getElementById("lz_cf_so").style.display = (functions != null && functions[1]=='0') ? 'none' : 'block';
        document.getElementById("lz_cf_pr").style.display = !(functions != null && functions[2]=='0') && inChat ? 'block' : 'none';

        if(document.getElementById("lz_chat_feedback_init").style.display!='block')
            document.getElementById("lz_chat_feedback_init").style.display = !(functions != null && functions[3]=='0') && inChat ? 'block' : 'none';

        document.getElementById("lz_cf_fu").style.display = !(functions != null && functions[5]=='0') && inChat ? 'block' : 'none';
    }
};

OverlayChatWidgetV2.UpdateEyeCatcherContent = function(){

    if(lz_ovlec != null && !lz_d(lz_ovlec.ec_p) && document.getElementById('lz_overlay_eyecatcher_avatar') != null)
        document.getElementById('lz_overlay_eyecatcher_avatar').style.display='none';
    if(document.getElementById("lz_ec_image")!=null)
    {
        if(OverlayChatWidgetV2.ChatAvailable && lz_ec_image == '')
            lz_fade_out(document.getElementById('lz_eye_catcher'),25);
        else  if(!OverlayChatWidgetV2.ChatAvailable && lz_ec_o_image == '')
            lz_fade_out(document.getElementById('lz_eye_catcher'),25);
        else
            document.getElementById("lz_ec_image").src = lz_global_base64_url_decode(((OverlayChatWidgetV2.ChatAvailable) ? lz_ec_image : lz_ec_o_image));
    }
    else if(document.getElementById("lz_ec_header_text")!=null)
    {
        document.getElementById("lz_ec_header_text").innerHTML = ((OverlayChatWidgetV2.ChatAvailable && lz_chat_get_wm_element('chat') != null) ? lz_ec_header : lz_ec_o_header);
        document.getElementById("lz_ec_sub_header_text").innerHTML = ((OverlayChatWidgetV2.ChatAvailable && lz_chat_get_wm_element('chat') != null) ? ((lz_d(lz_ovlec.ec_p) && typeof lz_ec_sub_header_p != 'undefined') ? lz_global_base64_decode(lz_ec_sub_header_p) :  lz_ec_sub_header) : lz_ec_o_sub_header);
    }
};

OverlayChatWidgetV2.ForwardTicket = function(_click){
    if(OverlayChatWidgetV2.OfflineMessageMode == 1)
    {
        if(lz_overlay_chat.m_FullScreenMode || _click)
        {
            window.location.href = OverlayChatWidgetV2.OfflineMessageHTTP;
            lz_chat_loading(true);
        }
        return true;
    }
    return false;
};

OverlayChatWidgetV2.GetAutoMode = function(){

    var autoMode = 'NA';
    if(!lz_hide_widget_by_conf)
    {
        if(lz_chat_get_wm_element('phone') != null)
            autoMode = 'phone';

        if(lz_chat_get_wm_element('knowledgebase') != null)
            autoMode = 'knowledgebase';

        if(OverlayChatWidgetV2.OfflineMessageMode != 1)
            if(OverlayChatWidgetV2.__ModeCombi || lz_chat_get_wm_element('ticket') != null)
                autoMode = 'ticket';

        if((OverlayChatWidgetV2.__ModeCombi || lz_chat_get_wm_element('chat') != null) && (OverlayChatWidgetV2.ChatAvailable!==false||OverlayChatWidgetV2.__ModeBot) && !lz_chat_declined && !OverlayChatWidgetV2.__TicketRequired)
            autoMode = 'chat';
    }

    return autoMode;
};

OverlayChatWidgetV2.ValidateMode = function(){

    var autoMode = OverlayChatWidgetV2.GetAutoMode();

    if(lz_overlay_wm != null && !OverlayChatWidgetV2.__ModeAPI)
    {
        var vis = (autoMode != 'NA' || lz_chat_get_wm_element('ticket') != null) && !lz_overlay_chat.m_FixedMode && !(lz_overlay_chat.m_FullScreenMode && OverlayChatWidgetV2.__ModeSingle);
        lz_overlay_wm.SetVisible(vis);
        if(!vis)
            lz_tracking_add_eye_catcher_v2 = function(){};
    }

    if(autoMode == 'NA')
    {
        lz_overlay_chat.SetVisible(false);
        if(lz_overlay_chat.m_FullScreenMode)
            OverlayChatWidgetV2.ForwardTicket(true);
    }

    if(lz_session.OVLWMSElem != autoMode)
    {
        if(lz_session.OVLWMSElem == 'phone')
            return;
        if(lz_session.OVLWMSElem == 'knowledgebase')
            return;
        if(lz_session.OVLWMSElem == 'feedback')
            return;
        if(lz_session.OVLWMSElem == 'ticket')
        {
            if(!lz_ticket_when_online && OverlayChatWidgetV2.ChatAvailable)
            {
                OverlayChatWidgetV2.SetMode(autoMode,false);
                return;
            }

            if(lz_chat_get_input_value(114) != '')
                return;

            if(!OverlayChatWidgetV2.__ModeSingle)
                return;
        }
        if(lz_session.OVLWMSElem == 'chat')
        {
            if((lz_chat_status > 0 || OverlayChatWidgetV2.__ChatStarted) && !lz_chat_declined)
                return;
        }

        if(!lz_is_mobile || lz_overlay_chat.m_FixedMode)
        {
            OverlayChatWidgetV2.SetMode(autoMode,false);
        }
    }

    // from set input fields
    if(lz_session.OVLWMSElem == 'chat' && !OverlayChatWidgetV2.__ModeBot && lz_chat_data.SelectedGroup != null && lz_chat_data.SelectedGroup.Amount == 0 && !OverlayChatWidgetV2.__PublicGroupChat.length && lz_chat_status == 0)
    {
        OverlayChatWidgetV2.SetMode("ticket",false);
    }
    else if(lz_session.OVLWMSElem=="ticket" && lz_chat_data.SelectedGroup != null && lz_chat_data.SelectedGroup.Amount > 0 && lz_chat_get_wm_element('ticket') == null)
    {
        OverlayChatWidgetV2.SetMode("chat",false);
    }
};

OverlayChatWidgetV2.SetMode = function(_type,_click){

    var showBox;

    if(_type == 'chat' && OverlayChatWidgetV2.__TicketRequired && _click)
    {
        OverlayChatWidgetV2.__TicketRequired = false;
    }

    if(_type == 'ticket' && OverlayChatWidgetV2.ForwardTicket(_click))
    {
        lz_session.OVLWMSElem = 'wm';
        lz_session.OVLWMState = '0';
    }
    else
    {

        lz_chat_switch_options_table(true);
        if(_type == null)
        {
            _type = '';
            if(_click && document.getElementById("lz_chat_invite_id") != null && lz_chat_status == 0)
            {
                lz_chat_decline_request(lz_request_active=document.getElementById("lz_chat_invite_id").value,false,false);
                return;
            }
        }

        if(_click)
            OverlayChatWidgetV2.__ModeFeedback = false;

        if(OverlayChatWidgetV2.__ModeSingle || OverlayChatWidgetV2.__ModeCombi)
        {
            if(_type!='wm' && _type != '')
                lz_session.OVLWMSElem = _type;
            else if(_type=='wm' && !OverlayChatWidgetV2.ChatAvailable && lz_session.OVLWMSElem == 'NA')
                OverlayChatWidgetV2.ForwardTicket(_click);

            if(_click)
                lz_session.OVLWMState = (lz_session.OVLWMState=='0') ? '1' : '0';

            showBox = (lz_session.OVLWMState=='1' && lz_session.OVLWMSElem != '' && lz_session.OVLWMSElem != 'NA');
        }
        else
        {
            if(_type == '')
                lz_session.OVLWMState = '0';
            else if(_type=='wm')
                lz_session.OVLWMState = (lz_session.OVLWMState=='0') ? '1' : '0';

            if(_type != 'wm')
                lz_session.OVLWMSElem = _type;

            if(lz_overlay_chat.m_FullScreenMode)
                lz_session.OVLWMState = '1';

            if(lz_is_mobile)
                showBox = (lz_session.OVLWMState=='1' && lz_session.OVLWMSElem != '' && lz_session.OVLWMSElem != 'NA' && _type != 'wm');
            else
                showBox = (lz_session.OVLWMState=='1' && lz_session.OVLWMSElem != '' && lz_session.OVLWMSElem != 'NA');
        }

        if(_click && !OverlayChatWidgetV2.__ModeSingle)
        {
            if(_type == lz_session.OVLWMSElem && !lz_overlay_chat.m_FullScreenMode)
            {
                if(lz_chat_overlay_pointer != null && lz_session.OVLWMState!='0')
                    lz_chat_overlay_pointer.style.visibility = 'hidden';
            }
            if(_type == 'knowledgebase' && document.getElementById('lz_chat_kb_match_info').style.display != 'none')
                lz_chat_kb_deactivate(false,false);
        }
    }

    lz_session.Save();
    lz_chat_update_chat_ui(showBox);
    lz_chat_update_wm_ui();
    lz_chat_update_ui_elements();

    if(_click && lz_session.OVLWMSElem == 'chat')
        lz_chat_scoll_down();
};

OverlayChatWidgetV2.APIButtonClick = function(_option){
    document.getElementById('lz_chat_text').value = lz_global_base64_decode(_option);
    lz_chat_message(null,null);
};