var lz_default_info_text = '<!--lang_client_type_message-->';
var lz_text_connecting_info = '<!--lang_client_trying_to_connect_you-->';
var lz_text_save = '<!--lang_client_save-->';
var lz_text_back = '<!--lang_client_back-->';
var lz_text_send_message = '<!--lang_client_send_message-->';
var lz_text_start_chat = '<!--lang_client_start_chat-->';
var lz_text_chat_header = '<!--lang_client_start_chat_header-->';
var lz_text_ticket_header = '<!--lang_client_ticket_header-->';
var lz_text_please_select = '<!--lang_client_please_select-->';
var lz_text_chat_information = '<!--lang_client_start_chat_information-->';
var lz_text_ticket_information = '<!--lang_client_ticket_information-->';
var lz_text_leave_message = '<!--lang_client_leave_message-->';
var lz_text_change_details = '<!--lang_client_change_my_details-->';
var lz_text_wm = {chat:'<!--lang_client_wm_chat-->',ticket:'<!--lang_client_wm_ticket-->',phone_in:'<!--lang_client_wm_phone_inbound-->',phone_out:'<!--lang_client_wm_phone_outbound-->',knowledgebase:'<!--lang_client_wm_knowledgebase-->',facebook:'<!--lang_client_wm_facebook-->',youtube:'<!--lang_client_wm_youtube-->',twitter:'<!--lang_client_wm_twitter-->',google:'<!--lang_client_wm_google-->'};
var lz_ec_header = '<!--lang_client_ec_text-->';
var lz_ec_o_header = '<!--lang_client_ec_o_text-->';
var lz_ec_sub_header = '<!--lang_client_ec_sub_text-->';
var lz_ec_o_sub_header = '<!--lang_client_ec_o_sub_text-->';
var lz_guest_name = '<!--lang_client_guest-->';
var lz_req_callback = '<!--lang_client_request_callback-->';
var lz_call_me = '<!--lang_client_call_me_later-->';
var lz_text_callback_information = '<!--lang_client_request_callback_information_offline-->';

var lz_force_group_select = <!--require_group_selection-->;
var lz_hide_group_chat = <!--hide_group_select_chat-->;
var lz_hide_group_ticket = <!--hide_group_select_ticket-->;
var lz_color_primary = '<!--pc-->';
var lz_color_primary_dark = '<!--pcd-->';
var lz_color_secondary = '<!--sc-->';
var lz_border_radius = <!--border_radius-->;
var lz_tickets_external = <!--tickets_external-->;
var lz_chats_external = <!--chats_external-->;
var lz_kb_external = <!--kb_external-->;
var lz_kb_embed = <!--kb_embed-->;
var lz_kb_embed_url = '<!--kb_embed_url-->';
var lz_kb_root = '<!--kb_root-->';
var lz_post_html = '<!--post_html-->';
var lz_add_html = '<!--add_html-->';
var lz_tr_api_key = '<!--gtv2_api_key-->';
var lz_trans_into = '<!--def_trans_into-->';
var lz_ticket_when_online = <!--ticket_when_online-->;
var lz_shared_kb_auto_search = <!--kb_suggest-->;
var lz_shared_kb_last_search_time = 0;
var lz_monitoring_active = <!--monitoring_active-->;
var lz_ec_image = '<!--ec_image-->';
var lz_ec_o_image = '<!--ec_o_image-->';

function OverlayChatWidgetV2(){
}

OverlayChatWidgetV2.__PublicGroupChat = '<!--pgc-->';
OverlayChatWidgetV2.OfflineMessageMode = '<!--offline_message_mode-->';
OverlayChatWidgetV2.OfflineMessageHTTP = '<!--offline_message_http-->';

try
{
    var style = document.createElement('style');
    style.type = 'text/css';
    style.innerHTML += '.lz_chat_link, .lz_chat_file, .lz_chat_mail, .lz_chat_human{color: <!--sc--> !important;}';
    style.innerHTML += '.lz_chat_fill{fill: <!--pc--> !important;}';
    style.innerHTML += '.lz_chat_bg{background: <!--pc--> !important;}';
    style.innerHTML += '#lz_overlay_chat .lz_form_check:checked + .lz_form_check_label:before {content: "";background: radial-gradient(<!--pc--> 35%, #f1f1f1 45%, #fafafa 100%);}';
    document.getElementsByTagName('head')[0].appendChild(style);
}
catch(ex)
{

}

function lz_chat_get_parameters(_ws)
{
    return lz_getp_track;
}

function lz_chat_open()
{

}

function lz_chat_update_css(){
    document.getElementById('lz_chat_overlay_minimize').style.display = (lz_overlay_chat.m_FullScreenMode) ? 'none' : '';
    document.getElementById("lz_chat_overlay_main").className = (lz_overlay_chat.m_FixedMode) ? "lz_chat_base notranslate lz_chat_mdc" : "lz_chat_base notranslate";
    document.getElementById('lz_chat_overlay_options_box').style.height = (Math.min(lz_overlay_chat_height-200,300)) + "px";
    document.getElementById('lz_chat_overlay_main').style.borderRadius = (lz_overlay_chat.m_FixedMode || lz_overlay_chat.m_FullScreenMode) ? 0 : lz_border_radius + 'px';
    if(<!--shadow-->)
        lz_overlay_chat.m_FrameElement.style.boxShadow = "<!--shadowx-->px <!--shadowy-->px <!--shadowb-->px <!--shadowc-->";
}