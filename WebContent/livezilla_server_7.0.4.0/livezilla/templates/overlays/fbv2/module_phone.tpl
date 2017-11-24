<tr>
    <td class="lz_fbv2_icon"><div class="lz_fbv2_phone_icon"></div></td>
    <td class="lz_fbv2_module_content">
        <div style="display:<!--show_opi-->;" class="lz_fbv2_text_big"><!--number--></div>
        <div style="display:<!--show_opi-->;" class="lz_fbv2_text_small"><!--info--></div>
        <div style="display:<!--show_opo-->;"><span style="display:<!--show_opi-->;"><!--lang_client_or--> </span><a onclick="document.getElementById('lz_fbv2_callback').style.display='block';if(document.getElementById('lz_fbv2_callback_number').value=='' && lz_user_phone != '')document.getElementById('lz_fbv2_callback_number').value=lz_global_base64_url_decode(lz_user_phone);" style="color:<!--color-->"><!--lang_client_tab_callback--></a>
            <div id="lz_fbv2_callback" style="display:none;">
                <div class="lz_fbv2_close" onclick="document.getElementById('lz_fbv2_callback').style.display='none';">X</div>
                <!--lang_client_tab_callback-->
                <br>
                <input id="lz_fbv2_callback_number" placeholder="<!--lang_client_your_phone-->">
                <div class="lz_fbv2_callback_init" style="background:<!--color-->" onclick="lz_tracking_selector_init_callback('<!--addition-->');"><!--button_text--></div>
            </div>
        </div>
    </td>
</tr>
