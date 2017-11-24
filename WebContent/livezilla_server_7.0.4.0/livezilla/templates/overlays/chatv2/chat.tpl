<div id="lz_chat_overlay_pointer_h" class="lz_chat_overlay_pointer" style="border-top:12px solid transparent; border-left: 12px solid <!--pc-->;border-bottom: 12px solid transparent;">
    <div style="top:-10px;left:-12px;border-top:10px solid transparent; border-left: 10px solid #fff;border-bottom: 10px solid transparent;"></div>
</div>
<div id="lz_chat_overlay_pointer_v" class="lz_chat_overlay_pointer" style="border-left:12px solid transparent; border-top: 12px solid <!--pc-->;border-right: 12px solid transparent;">
    <div style="top:-12px;left:-10px;border-left:10px solid transparent; border-top: 10px solid #f7f8f9;border-right: 10px solid transparent;"></div>
</div>
<div id="lz_chat_overlay_main" class="lz_chat_base notranslate" style="direction:<!--dir-->;border-radius:6px;border:1px solid <!--pc-->;" onclick="lz_chat_switch_options_table(true);">
    <div class="lz_overlay_chat_gradient" class="lz_chat_unselectable">
        <div id="lz_chat_overlay_text" class="lz_chat_unselectable "><!--text--></div>
        <!--lz_chat_min-->
    </div>
    <div id="lz_chat_content">
        <div id="lz_overlay_phone_inbound" class="lz_chat_module" style="display:none;">
            <div class="lz_chat_header"><h2><!--lang_client_hotline--></h2></div>
            <div id="lz_chat_data_phone_header_number" style="color:<!--sc-->;"></div>
            <div id="lz_chat_data_phone_header_text"></div>
        </div>
        <div id="lz_chat_data_form" class="lz_chat_module">
            <div id="lz_chat_data_header" class="lz_chat_header"></div>
            <div id="lz_chat_data_form_inputs">
                <div>
                    <div id="lz_chat_data_header_text"><!--ticket_information--></div>
                    <!--chat_login_group_top-->
                    <!--chat_login_inputs-->
                    <!--chat_login_group_bottom-->
                    <br>
                    <div id="lz_chat_overlay_data_form_ok_button" class="lz_overlay_chat_button lz_chat_unselectable lz_overlay_br_five" style="background:<!--pc-->;" onclick="lz_chat_data_form_result();"></div>
                </div>
            </div>
        </div>
        <div id="lz_overlay_module_feedback" class="lz_chat_module">
            <div class="lz_chat_header"><h2><!--lang_client_feedback--></h2></div>
            <div id="lz_overlay_module_feedback_content">
                <iframe></iframe>
            </div>
        </div>
        <div id="lz_overlay_module_knowledgebase" class="lz_chat_module">
            <div class="lz_chat_header"><h2><!--lang_client_kb_search--></h2></div>
            <div id="lz_overlay_module_knowledgebase_content">
                <iframe></iframe>
            </div>
        </div>
        <div id="lz_chat_overlay_ticket" class="lz_chat_module">
            <div id="lz_chat_ticket_received" class="lz_overlay_chat_ticket_response"><!--lang_client_message_received--></div>
            <div id="lz_chat_ticket_flood" class="lz_overlay_chat_ticket_response"><!--lang_client_message_flood--></div>
            <div class="lz_overlay_chat_button lz_chat_unselectable lz_overlay_br_five" style="background:<!--pc-->;" onclick="lz_chat_data_form_result();"><!--lang_client_back--></div>
        </div>
		<div id="lz_overlay_module_chat" class="lz_chat_module">
            <div id="lz_chat_state_bar" class="lz_chat_header">
               <div id="lz_chat_options_table" class="lz_chat_unselectable" style="display:none;border: 1px solid <!--pc-->;">
                    <div id="lz_cf_tr" onclick="lz_stop_propagation(event);lz_chat_switch_translation();" style="display:<!--tr_vis-->;"><!--lang_client_use_auto_translation_service_short--><!--lz_chat_switch_tr--></div>
                    <div id="lz_cf_so" onclick="lz_stop_propagation(event);lz_chat_switch_sound();"><!--lang_client_switch_sounds--><!--lz_chat_switch_so--></div>
                    <div id="lz_cf_et" onclick="lz_stop_propagation(event);lz_chat_switch_transcript(false);" style="display:<!--et_vis-->;"><!--lang_client_request_chat_transcript_short--><!--lz_chat_switch_et--></div>
                    <div id="lz_cf_ed" style="<!--ocpd-->" onclick="lz_chat_switch_options_table();lz_chat_switch_details(false);"><!--lang_client_change_my_details--></div>
                    <div id="lz_cf_fu" onclick="lz_chat_switch_options_table();lz_chat_switch_options('fu');"><!--lang_client_send_file--></div>
                    <div id="lz_cf_pr" onclick="lz_chat_switch_options_table();lz_chat_print();"><!--lang_client_print--></div>
                    <div id="lz_cf_ec" onclick="lz_chat_switch_options_table();lz_chat_close();"><!--lang_client_end_chat--></div>
                </div>
                <div id="lz_chat_operator_details" class="lz_chat_unselectable">
                    <div>
                        <span id="lz_chat_operator_groupname" style="color:<!--sc-->;"></span>
                        <span id="lz_chat_operator_fullname"></span>
                    </div>
                </div>
                <!--lz_chat_ob-->
                <!--lz_chat_fb-->
            </div>
            <div id="lz_chat_members_box"></div>
            <div id="lz_chat_content_box" style="display:none;" class="lz_chat_content_box_fh" onScroll="lz_chat_scroll();"><div id="lz_chat_content_inlay"></div></div>
            <div id="lz_chat_overlay_bottom">
                <div id="lz_chat_bot_reply_loading" style="display:none;">
                    <div class="lz_anim_point_load"><span></span><span></span><span></span></div>
                </div>
                <div>
                    <textarea id="lz_chat_text" placeholder="<!--lang_client_type_message-->" onkeydown="if(event.keyCode==13){return lz_chat_message(null,null);}else{lz_chat_switch_extern_typing(true);return true;}" onchange="lz_overlay_chat_impose_max_length(this, <!--overlay_input_max_length-->);" onkeyup="lz_overlay_chat_impose_max_length(this, <!--overlay_input_max_length-->);"></textarea>
                </div>
            </div>
            <div id="lz_chat_overlay_info" style="color:<!--sc-->;"></div>
            <div id="lz_chat_overlay_loading_bar">
                <div class="lz_anim_point_load"><span class="lz_chat_bg"></span><span class="lz_chat_bg"></span><span class="lz_chat_bg"></span></div>
            </div>
        </div>
        <div id="lz_chat_overlay_loading" class="lz_chat_module" style="display:none;">
            <div class="lz_anim_point_load"><span></span><span></span><span></span></div>
        </div>
        <div id="lz_chat_overlay_options_box_bg" style="display:none;"></div>
        <div id="lz_chat_overlay_options_frame" style="display:none;">
            <div id="lz_chat_overlay_options_box" style="display:none;border:1px solid <!--pc-->;">
                <div id="lz_chat_overlay_option_title" class=""><!--lang_client_file--></div>
                <div id="lz_chat_overlay_option_function_fu">
                    <iframe id="lz_chat_overlay_file_upload_frame"></iframe>
                </div>
                <!--lz_chat_co-->
            </div>
        </div>
	</div>
    <div id="lz_chat_apo" style="<!--apo-->"><!--lz_chat_po--></div>
    <div id="lz_chat_apa" class="lz_overlay_chat_footer lz_chat_unselectable lz_overlay_chat_options_link"><!--param--></div>
</div>
