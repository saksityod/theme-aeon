<?php
/****************************************************************************************
* LiveZilla track.php
* 
* Copyright 2017 LiveZilla GmbH
* All rights reserved
* LiveZilla is a registered trademark.
* 
* Improper changes to this file may cause critical errors.
***************************************************************************************/ 

if(!defined("IN_LIVEZILLA"))
	die();

require(LIVEZILLA_PATH . "_lib/functions.tracking.inc.php");

if(!Server::IsAvailable())
    VisitorMonitoring::Abort(2);

define("JAVASCRIPT",!(isset($_GET[GET_TRACK_OUTPUT_TYPE]) && $_GET[GET_TRACK_OUTPUT_TYPE] == "nojcrpt") && strpos($_SERVER["QUERY_STRING"],"nojcrpt") === false);

if(!empty($_GET[GET_TRACK_USERID]))
{
	define("CALLER_BROWSER_ID",Visitor::IDValidate(Communication::GetParameter(GET_TRACK_BROWSERID,"")));
	define("CALLER_USER_ID",Visitor::IDValidate(Communication::GetParameter(GET_TRACK_USERID,"")));
}
else if(!Is::Null(Cookie::Get("userid")))
{
    define("CALLER_BROWSER_ID",Visitor::IDValidate());
	define("CALLER_USER_ID",Visitor::IDValidate(Cookie::Get("userid")));
}

if(!defined("CALLER_USER_ID"))
{
	if(!JAVASCRIPT)
	{
		define("CALLER_USER_ID",substr(md5(Communication::GetIP()),0,USER_ID_LENGTH));
        define("CALLER_BROWSER_ID",substr(strrev(md5(Communication::GetIP())),0,USER_ID_LENGTH));
	}
	else
	{
		define("CALLER_USER_ID",Visitor::IDValidate());
        define("CALLER_BROWSER_ID",Visitor::IDValidate());
	}
}

if(Cookie::Get("userid") != CALLER_USER_ID)
    Cookie::Set("userid",CALLER_USER_ID);

VisitorMonitoring::$Visitor = new Visitor(CALLER_USER_ID);

if(empty(VisitorMonitoring::$Visitor->Host) && VisitorMonitoring::$Visitor->FirstCall)
    VisitorMonitoring::$Visitor->ResolveHost();

$detector = new DeviceDetector();
$detector->DetectBrowser(VisitorMonitoring::$Visitor->Host);
$MobileDetect = $detector->DetectOperatingSystem(VisitorMonitoring::$Visitor->Host);
VisitorMonitoring::$IsMobile = $MobileDetect->isMobile();
VisitorMonitoring::$IsTablet = $MobileDetect->isTablet();

if(!empty($_GET["ovlc"]) && empty($_GET["prv"]) && $detector->BrowserName == "Internet Explorer")
{
    if($detector->BrowserVersion <= 6)
        unset($_GET["ovlc"]);
}

VisitorMonitoring::$IsMonitoringActive = !empty(Server::$Configuration->File["gl_vmac"]) || isset($_GET["ovlc"]);
VisitorMonitoring::$CreateUserObject = !empty(Server::$Configuration->File["gl_vmac"]) || isset($_GET["tth"]) || isset($_GET["mi0"]) || isset($_GET["fm"]);

VisitorMonitoring::$HideElement =
    (!empty($_GET["ovlhm"]) && (VisitorMonitoring::$IsMobile||VisitorMonitoring::$IsTablet))
    || (!empty($_GET["hots"]) && VisitorMonitoring::$IsMobile && !VisitorMonitoring::$IsTablet)
    || (!empty($_GET["hott"]) && VisitorMonitoring::$IsTablet);

Visitor::$OpenChatExternal =
    !empty($_GET["ovloe"])
    || ((!empty(Server::$Configuration->File["gl_moce"]) && VisitorMonitoring::$IsMobile))
    || (!empty($_GET["oets"]) && VisitorMonitoring::$IsMobile && !VisitorMonitoring::$IsTablet)
    || (!empty($_GET["oett"]) && VisitorMonitoring::$IsTablet);

if(isset($_GET[GET_TRACK_OUTPUT_TYPE]) && ($_GET[GET_TRACK_OUTPUT_TYPE] == "jscript" || $_GET[GET_TRACK_OUTPUT_TYPE] == "jcrpt"))
{
    VisitorMonitoring::$Browser = new VisitorBrowser(CALLER_USER_ID,CALLER_BROWSER_ID,false);
    VisitorMonitoring::$Visitor->VisitorData->LoadFromPassThru();
    VisitorMonitoring::$Visitor->VisitorData->LoadFromCookie();

    if(empty($_GET[GET_TRACK_NO_SEARCH_ENGINE]))
        exit(IOStruct::GetFile(TEMPLATE_HTML_SUPPORT));

    VisitorMonitoring::$Visitor->CreateSignature();
    VisitorMonitoring::$Response = IOStruct::GetFile(TEMPLATE_SCRIPT_TRACK);
    VisitorMonitoring::$Response = str_replace("<!--file_chat-->",FILE_CHAT,VisitorMonitoring::$Response);
    VisitorMonitoring::$Response = str_replace("<!--server_id-->",substr(md5(Server::$Configuration->File["gl_lzid"]),5,5),VisitorMonitoring::$Response);
    VisitorMonitoring::$Response = str_replace("<!--server-->",LIVEZILLA_URL,VisitorMonitoring::$Response);
    VisitorMonitoring::$Response = str_replace("<!--website-->",Encoding::Base64UrlEncode(""),VisitorMonitoring::$Response);
    VisitorMonitoring::$Response = str_replace("<!--area_code-->",Communication::GetParameter(GET_TRACK_SPECIAL_AREA_CODE,"",$nu,null,null,255,false,false),VisitorMonitoring::$Response);
    VisitorMonitoring::$Response = str_replace("<!--browser_id-->",htmlentities(CALLER_BROWSER_ID,ENT_QUOTES,"UTF-8"),VisitorMonitoring::$Response);
    VisitorMonitoring::$Response = str_replace("<!--user_id-->",htmlentities(VisitorMonitoring::$Visitor->UserId,ENT_QUOTES,"UTF-8"),VisitorMonitoring::$Response);
    VisitorMonitoring::$Response = str_replace("<!--connection_error_span-->",CONNECTION_ERROR_SPAN,VisitorMonitoring::$Response);
    VisitorMonitoring::$Response = str_replace("<!--poll_frequency-->",VisitorMonitoring::GetPollFrequency(false,false),VisitorMonitoring::$Response);
    VisitorMonitoring::$Response = GeoTracking::Replace(VisitorMonitoring::$Response);
    VisitorMonitoring::$Response = str_replace("<!--geo_resolute-->",To::BoolString(VisitorMonitoring::$Visitor->UserId == CALLER_USER_ID && !empty(Server::$Configuration->File["gl_use_ngl"]) && VisitorMonitoring::$Visitor->FirstCall && !(!Is::Null(Cookie::Get("geo_data")) && Cookie::Get("geo_data") > time()-2592000) && !GeoTracking::SpanExists()),VisitorMonitoring::$Response);
    VisitorMonitoring::$Response = str_replace("<!--alert_html-->",base64_encode(getAlertTemplate()),VisitorMonitoring::$Response);
    VisitorMonitoring::$Response = str_replace("<!--user_company-->",Encoding::Base64UrlEncode(VisitorMonitoring::$Visitor->VisitorData->Company),VisitorMonitoring::$Response);
    VisitorMonitoring::$Response = str_replace("<!--user_question-->",Encoding::Base64UrlEncode(""),VisitorMonitoring::$Response);
    VisitorMonitoring::$Response = str_replace("<!--user_phone-->",Encoding::Base64UrlEncode(VisitorMonitoring::$Visitor->VisitorData->Phone),VisitorMonitoring::$Response);
    VisitorMonitoring::$Response = str_replace("<!--user_language-->",Encoding::Base64UrlEncode(Communication::GetParameter(GET_EXTERN_USER_LANGUAGE,"",$nu,null,null,5)),VisitorMonitoring::$Response);
    VisitorMonitoring::$Response = str_replace("<!--user_header-->",Communication::GetParameter(GET_EXTERN_USER_HEADER,"",$nu,FILTER_SANITIZE_URL,null,0,true,true,true,true),VisitorMonitoring::$Response);
    VisitorMonitoring::$Response = str_replace("<!--user_customs-->",VisitorMonitoring::GetJSCustomArray(VisitorMonitoring::$Visitor->VisitorData->Customs),VisitorMonitoring::$Response);
    VisitorMonitoring::$Response = str_replace("<!--is_mobile-->",To::BoolString(VisitorMonitoring::$IsMobile),VisitorMonitoring::$Response);
    VisitorMonitoring::$Response = str_replace("<!--is_ie-->",To::BoolString(false),VisitorMonitoring::$Response);
    VisitorMonitoring::$Response = str_replace("<!--direct_login-->",To::BoolString(Communication::ReadParameter("dl")),VisitorMonitoring::$Response);
    VisitorMonitoring::$Response = str_replace("<!--is_ovlpos-->",To::BoolString(true),VisitorMonitoring::$Response);
    VisitorMonitoring::$Response = str_replace("<!--is_ovlc-->",To::BoolString(!empty($_GET["ovlc"])),VisitorMonitoring::$Response);
    VisitorMonitoring::$Response = str_replace("<!--ovlv-->",Communication::GetParameter("ovlv",""),VisitorMonitoring::$Response);
    VisitorMonitoring::$Response = str_replace("<!--server_time-->",time(),VisitorMonitoring::$Response);
    require_once(LIVEZILLA_PATH . "_lib/objects.external.inc.php");
	if(!empty($_GET["ovlc"]) && !VisitorMonitoring::$HideElement)
    {
        require_once(LIVEZILLA_PATH . "_lib/functions.external.inc.php");
        VisitorMonitoring::$Response .= IOStruct::GetFile(TEMPLATE_SCRIPT_OVERLAY_CHAT . "jscript/jsextern.tpl");
        VisitorMonitoring::$Response = str_replace("<!--def_trans_into-->",Server::$Configuration->File["gl_default_language"],VisitorMonitoring::$Response);
        VisitorMonitoring::$Response = str_replace("<!--header_offline-->",base64_encode(Communication::GetParameter("ovlto",LocalizationManager::$TranslationStrings["client_overlay_title_offline"],$c,FILTER_HTML_ENTITIES)),VisitorMonitoring::$Response);
        VisitorMonitoring::$Response = str_replace("<!--header_online-->",base64_encode(Communication::GetParameter("ovlt",LocalizationManager::$TranslationStrings["client_overlay_title_online"],$c,FILTER_HTML_ENTITIES)),VisitorMonitoring::$Response);
        VisitorMonitoring::$Response = str_replace("<!--tickets_external-->",To::BoolString(Visitor::$OpenChatExternal),VisitorMonitoring::$Response);
        VisitorMonitoring::$Response = str_replace("<!--chats_external-->",To::BoolString(Visitor::$OpenChatExternal),VisitorMonitoring::$Response);
        VisitorMonitoring::$Response = str_replace("<!--kb_embed_url-->",KnowledgeBase::GetEmbeddedURL(),VisitorMonitoring::$Response);
        VisitorMonitoring::$Response = str_replace("<!--kb_embed-->",To::BoolString(Server::$Configuration->File["gl_kbin"]==2),VisitorMonitoring::$Response);
        VisitorMonitoring::$Response = str_replace("<!--kb_root-->",base64_encode(Communication::GetParameter("ckf","")),VisitorMonitoring::$Response);
        VisitorMonitoring::$Response = str_replace("<!--kb_external-->",To::BoolString(Server::$Configuration->File["gl_kbin"]==1),VisitorMonitoring::$Response);
        VisitorMonitoring::$Response = str_replace("<!--offline_message_mode-->",Server::$Configuration->File["gl_om_mode"],VisitorMonitoring::$Response);
        VisitorMonitoring::$Response = str_replace("<!--offline_message_http-->",Server::$Configuration->File["gl_om_http"],VisitorMonitoring::$Response);

        $exchtmpl = IOStruct::GetFile(TEMPLATE_SCRIPT_OVERLAY_CHAT . "messageexternal.tpl");
        $exchtmpl = str_replace("<!--ocpd-->",(empty(Server::$Configuration->File["gl_ocpd"]) ? "display:none" : ""),$exchtmpl);

        VisitorMonitoring::$Response = str_replace("<!--post_html-->",base64_encode(str_replace("<!--color-->","#000000",str_replace("<!--lang_client_edit-->",strtoupper(LocalizationManager::$TranslationStrings["client_edit"]),$exchtmpl))),VisitorMonitoring::$Response);
        VisitorMonitoring::$Response = str_replace("<!--add_html-->",base64_encode(IOStruct::GetFile(TEMPLATE_SCRIPT_OVERLAY_CHAT . "messageexternaladd.tpl")),VisitorMonitoring::$Response);
        VisitorMonitoring::$Response = str_replace("<!--offline_message_pop-->",To::BoolString(!empty(Server::$Configuration->File["gl_om_pop_up"])),VisitorMonitoring::$Response);
        VisitorMonitoring::$Response = str_replace("<!--ec_t-->",$eca=Communication::GetParameter("eca",0,$nu,FILTER_VALIDATE_INT),VisitorMonitoring::$Response);
        VisitorMonitoring::$Response = str_replace("<!--gtv2_api_key-->",((strlen(Server::$Configuration->File["gl_otrs"])>1) ? base64_encode(Server::$Configuration->File["gl_otrs"]) : ""),VisitorMonitoring::$Response);
        VisitorMonitoring::$Response = str_replace("<!--ticket_when_online-->",To::BoolString(Communication::ReadParameter("ovltwo",false)),VisitorMonitoring::$Response);
        VisitorMonitoring::$Response = str_replace("<!--shadow-->",To::BoolString(Communication::ReadParameter("ovlsc","")),VisitorMonitoring::$Response);
        VisitorMonitoring::$Response = str_replace("<!--shadowx-->",Communication::ReadParameter("ovlsx",0),VisitorMonitoring::$Response);
        VisitorMonitoring::$Response = str_replace("<!--shadowy-->",Communication::ReadParameter("ovlsy",0),VisitorMonitoring::$Response);
        VisitorMonitoring::$Response = str_replace("<!--shadowb-->",Communication::ReadParameter("ovlsb",0),VisitorMonitoring::$Response);
        VisitorMonitoring::$Response = str_replace("<!--shadowc-->",Communication::ReadParameter("ovlsc",""),VisitorMonitoring::$Response);
        VisitorMonitoring::$Response = str_replace("<!--pgc-->",Encoding::Base64UrlEncode(Communication::ReadParameter("pgc","")),VisitorMonitoring::$Response);
        VisitorMonitoring::$Response = str_replace("<!--kb_suggest-->",To::BoolString(Server::$Configuration->File["gl_knbs"]),VisitorMonitoring::$Response);
        VisitorMonitoring::$Response = str_replace("<!--border_radius-->",Communication::ReadParameter("ovlbr",10),VisitorMonitoring::$Response);
        VisitorMonitoring::$Response = str_replace("<!--hide_group_select_chat-->",To::BoolString(Communication::GetParameter("hcgs",false) || isset($_GET["pgc"])),VisitorMonitoring::$Response);
        VisitorMonitoring::$Response = str_replace("<!--hide_group_select_ticket-->",To::BoolString(Communication::GetParameter("htgs",false)),VisitorMonitoring::$Response);
        VisitorMonitoring::$Response = str_replace("<!--require_group_selection-->",To::BoolString(Communication::GetParameter("rgs",false)),VisitorMonitoring::$Response);
        VisitorMonitoring::$Response = str_replace("<!--monitoring_active-->",To::BoolString(VisitorMonitoring::$CreateUserObject),VisitorMonitoring::$Response);
        VisitorMonitoring::$Response = OverlayChat::ReplaceColors(VisitorMonitoring::$Response,false);

        if($eca==1)
        {
            VisitorMonitoring::$Response = str_replace("<!--ec_header_text-->",Encoding::Base64UrlEncode(Communication::GetParameter("echt",@LocalizationManager::$TranslationStrings["client_ec_text"],$c,FILTER_HTML_ENTITIES)),VisitorMonitoring::$Response);
            VisitorMonitoring::$Response = str_replace("<!--ec_header_sub_text-->",Encoding::Base64UrlEncode(Communication::GetParameter("echst",@LocalizationManager::$TranslationStrings["client_ec_sub_text"],$c,FILTER_HTML_ENTITIES)),VisitorMonitoring::$Response);
            VisitorMonitoring::$Response = str_replace("<!--ec_o_header_text-->",Encoding::Base64UrlEncode(Communication::GetParameter("ecoht",@LocalizationManager::$TranslationStrings["client_ec_o_text"],$c,FILTER_HTML_ENTITIES)),VisitorMonitoring::$Response);
            VisitorMonitoring::$Response = str_replace("<!--ec_o_header_sub_text-->",Encoding::Base64UrlEncode(Communication::GetParameter("ecohst",@LocalizationManager::$TranslationStrings["client_ec_o_sub_text"],$c,FILTER_HTML_ENTITIES)),VisitorMonitoring::$Response);
        }
        else if($eca==2)
        {
            VisitorMonitoring::$Response = str_replace("<!--ec_image-->",Encoding::Base64UrlEncode(Communication::ReadParameter("eci","")),VisitorMonitoring::$Response);
            VisitorMonitoring::$Response = str_replace("<!--ec_o_image-->",Encoding::Base64UrlEncode(Communication::ReadParameter("ecio","")),VisitorMonitoring::$Response);
        }

        VisitorMonitoring::$Response = Server::Replace(VisitorMonitoring::$Response,true,false,true,false,true);
    }
	VisitorMonitoring::$Response = str_replace("<!--user_name-->",Encoding::Base64UrlEncode(VisitorMonitoring::$Visitor->VisitorData->Fullname),VisitorMonitoring::$Response);
	VisitorMonitoring::$Response = str_replace("<!--user_email-->",Encoding::Base64UrlEncode(VisitorMonitoring::$Visitor->VisitorData->Email),VisitorMonitoring::$Response);
	VisitorMonitoring::$Response = str_replace("<!--height-->",Server::$Configuration->File["wcl_window_height"],VisitorMonitoring::$Response);
	VisitorMonitoring::$Response = str_replace("<!--width-->",Server::$Configuration->File["wcl_window_width"],VisitorMonitoring::$Response);
    VisitorMonitoring::$Response = str_replace("<!--get_track_params-->",VisitorMonitoring::GetAllowedParameters(),VisitorMonitoring::$Response);
    VisitorMonitoring::$Response = str_replace("<!--get_chat_params-->",ExternalChat::GetAllowedParameters(),VisitorMonitoring::$Response);
    VisitorMonitoring::$Response = str_replace("<!--server-->",LIVEZILLA_URL,VisitorMonitoring::$Response);
}
else
{
    Visitor::$PollCount = Communication::ReadParameter("pc",0);

    $loadVisitor = Visitor::$PollCount==1 || isset($_GET["mi0"]);

    if($loadVisitor)
    {
        VisitorMonitoring::$Visitor->Load();
    }

    VisitorMonitoring::$Visitor->VisitorData = new UserData();
    VisitorMonitoring::$Visitor->LoadVisitorData();
    $wc = VisitorMonitoring::$Visitor->VisitorData->LoadFromPassThru();

    if($wc)
        VisitorMonitoring::$Visitor->ApplyVisitorData();

	VisitorMonitoring::$Response = "lz_tracking_set_sessid(\"".base64_encode(CALLER_USER_ID)."\",\"".base64_encode(CALLER_BROWSER_ID)."\",\"".base64_encode(VisitorMonitoring::$Visitor->VisitorData->Hash())."\");";

    if(BaseURL::IsInputURL() && strpos(BaseURL::GetInputURL(),"lzmobile") !== false && Visitor::$PollCount == 1)
        exit("lz_tracking_stop_tracking(75);");

	if(BaseURL::IsInputURL() && strpos(BaseURL::GetInputURL(),GET_INTERN_COBROWSE) !== false)
		VisitorMonitoring::Abort(1);

	VisitorMonitoring::$Browser = new VisitorBrowser(CALLER_BROWSER_ID,CALLER_USER_ID);
    VisitorMonitoring::$Visitor->AddBrowser(VisitorMonitoring::$Browser);
    VisitorMonitoring::$Browser->VisitId = VisitorMonitoring::$Visitor->VisitId;

	if(VisitorMonitoring::$Visitor->FirstCall && !VisitorMonitoring::$Browser->GetFirstCall())
    {
        if($loadVisitor)
        {
            exit("window.name='';lz_tracking_stop_tracking(78);");
        }
        else
            VisitorMonitoring::$Visitor->FirstCall = false;
    }

	Server::InitDataBlock(array("FILTERS","EVENTS"));

	define("IS_FILTERED",Server::$Filters->MatchUser(Communication::GetIP(),LocalizationManager::ImplodeLanguages(((!empty($_SERVER["HTTP_ACCEPT_LANGUAGE"])) ? $_SERVER["HTTP_ACCEPT_LANGUAGE"] : "")),CALLER_USER_ID, VisitorMonitoring::$Visitor->GeoCountryISO2));
	define("IS_FLOOD",false/*VisitorMonitoring::$Browser->GetFirstCall() && Filter::IsFlood(Communication::GetIP(),CALLER_USER_ID)*/);

    $deactp = Communication::ReadParameter("deactr",0);

    if((IS_FILTERED && !FILTER_ALLOW_TRACKING) || IS_FLOOD || !empty($deactp) || Cookie::Get(OO_TRACKING_FILTER_NAME) != null)
    {
        if(!IS_FILTERED)
            Filter::Create($_SERVER["REMOTE_ADDR"],CALLER_USER_ID,OO_TRACKING_FILTER_NAME,(!empty($deactp) ? $deactp : 365),true,true);

        VisitorMonitoring::LoadOverlayChat();
        VisitorMonitoring::$IsMonitoringActive=false;
        VisitorMonitoring::Abort(556);
    }
    else if(!VisitorMonitoring::$IsMonitoringActive && VisitorMonitoring::$Visitor->IsInChat(true,null,true))
    {
        VisitorMonitoring::$CreateUserObject =
        VisitorMonitoring::$IsMonitoringActive = true;
    }

	if(JAVASCRIPT)
	{
        if(Visitor::$PollCount<=3)
        {
            if(!BaseURL::IsInputURL())
                VisitorMonitoring::Abort(3);

            $currentURL = new HistoryURL(BaseURl::GetInputURL(),Communication::GetParameter(GET_TRACK_SPECIAL_AREA_CODE,"",$nu,null,null,255),Communication::GetParameter(GET_EXTERN_DOCUMENT_TITLE,"",$nu,null,null,255),Communication::GetParameter(GET_TRACK_REFERRER,"",$nu,FILTER_SANITIZE_URL,null,510),time());

            if($currentURL->Url->Excluded)
                VisitorMonitoring::Abort(4);
        }
        else if(count(VisitorMonitoring::$Browser->History) > 0)
        {
            $currentURL = VisitorMonitoring::$Browser->History[count(VisitorMonitoring::$Browser->History)-1];
        }
        else if(!empty(Server::$Configuration->File["gl_vmac"]))
        {
            // db truncate
            VisitorMonitoring::Abort(751);
        }
        else
        {

        }

        if(VisitorMonitoring::$IsMonitoringActive && VisitorMonitoring::$CreateUserObject)
        {
            VisitorMonitoring::$Visitor->Save(array(Communication::GetParameter(GET_TRACK_RESOLUTION_WIDTH,"",$nu,FILTER_SANITIZE_SPECIAL_CHARS,null,32),Communication::GetParameter(GET_TRACK_RESOLUTION_HEIGHT,"",$nu,FILTER_SANITIZE_SPECIAL_CHARS,null,32)),Communication::GetParameter(GET_TRACK_COLOR_DEPTH,"",$nu,FILTER_SANITIZE_SPECIAL_CHARS,null,32),Communication::GetParameter(GET_TRACK_TIMEZONE_OFFSET,"",$nu,FILTER_SANITIZE_SPECIAL_CHARS,null,32),Communication::GetParameter(GEO_LATITUDE,-522,$nu,FILTER_VALIDATE_FLOAT,array(),0,true,false),Communication::GetParameter(GEO_LONGITUDE,-522,$nu,FILTER_VALIDATE_FLOAT,array(),0,true,false),Communication::GetParameter(GEO_COUNTRY_ISO_2,"",$nu,null,null,32,true,false),Communication::GetParameter(GEO_CITY,"",$nu,null,null,255,true,false),Communication::GetParameter(GEO_REGION,"",$nu,null,null,255,true,false),Communication::GetParameter(GEO_TIMEZONE,"",$nu,null,null,24,true,false),Communication::GetParameter(GEO_ISP,"",$nu,null,null,255,true,false),Communication::GetParameter(GEO_SSPAN,0,$nu,FILTER_VALIDATE_INT,array(),0,false,false));
        }
    }
	else if(!empty($_SERVER["HTTP_REFERER"]))
	{
		$currentURL = new HistoryURL(Communication::GetParameter("HTTP_REFERER","",$nu,FILTER_SANITIZE_URL,null,500),Communication::GetParameter(GET_TRACK_SPECIAL_AREA_CODE,"",$nu,null,null,255),"","",time());
        if($currentURL->Url->Excluded)
			VisitorMonitoring::Abort(5);
		else if(!$currentURL->Url->IsInternalDomain())
			VisitorMonitoring::Abort(6);
        if(VisitorMonitoring::$IsMonitoringActive && VisitorMonitoring::$CreateUserObject)
            VisitorMonitoring::$Visitor->Save(null,"","",-522,-522,"","","","","","","",false);
    }
	else
		VisitorMonitoring::Abort(-1);

	if(VisitorMonitoring::$Visitor->IsCrawler)
    {
		VisitorMonitoring::Abort(8);
    }
	else
	{
		if(isset($_GET["clch"]))
		{
			$chat = VisitorChat::FromCache(VisitorMonitoring::$Visitor->UserId,Communication::ReadParameter("clch",""));
			$chat->ExternalClose();
			$chat->Destroy();
		}
		VisitorMonitoring::$Browser->LastActive = time();
		VisitorMonitoring::$Browser->VisitId = VisitorMonitoring::$Visitor->VisitId;

		$parameters = Communication::GetTargetParameters(false);
		$conline = operatorsAvailable(0,$parameters["exclude"],$parameters["include_group"],$parameters["include_user"],false) > 0;
		VisitorMonitoring::$Browser->OverlayContainer = !empty($_GET["ovlc"]);

        if(VisitorMonitoring::$IsMonitoringActive)
        {
            if(VisitorMonitoring::$CreateUserObject)
            {
                if(!VisitorMonitoring::$Browser->Save())
                {
                    VisitorMonitoring::Abort(1242);
                }
            }
            if(!empty($currentURL) && (count(VisitorMonitoring::$Browser->History) == 0 || (count(VisitorMonitoring::$Browser->History) > 0 && VisitorMonitoring::$Browser->History[count(VisitorMonitoring::$Browser->History)-1]->Url->GetAbsoluteUrl() != $currentURL->Url->GetAbsoluteUrl())))
            {
                VisitorMonitoring::$Browser->History[] = $currentURL;
                if(!Is::Null(VisitorMonitoring::$Browser->History[count(VisitorMonitoring::$Browser->History)-1]->Referrer->GetAbsoluteUrl()))
                    if(VisitorMonitoring::$Browser->SetQuery(VisitorMonitoring::$Browser->History[count(VisitorMonitoring::$Browser->History)-1]->Referrer->GetAbsoluteUrl()))
                        VisitorMonitoring::$Browser->History[count(VisitorMonitoring::$Browser->History)-1]->Referrer->MarkSearchEngine();

                if(VisitorMonitoring::$CreateUserObject)
                {
                    VisitorMonitoring::$Browser->History[count(VisitorMonitoring::$Browser->History)-1]->Save(CALLER_BROWSER_ID,count(VisitorMonitoring::$Browser->History)==1);
                }
            }
        }

        if(!empty($currentURL))
        {
            VisitorMonitoring::$Visitor->LoadChatRequests();
            VisitorMonitoring::$Response .= VisitorMonitoring::TriggerEvents($currentURL);
        }

        if(!empty($_GET["fbpos"]) && !empty($_GET["fbw"]))
        {
            $shadow=(!empty($_GET["fbshx"])) ? ("true,".Communication::ReadParameter("fbshb",0).",".Communication::ReadParameter("fbshx",0).",".Communication::ReadParameter("fbshy",0).",'".Communication::ReadParameter("fbshc","#000000")."'") : "false,0,0,0,''";
            $margin=(!empty($_GET["fbmt"])) ? (",".Communication::ReadParameter("fbml",0).",".Communication::ReadParameter("fbmt",0).",".Communication::ReadParameter("fbmr",0).",".Communication::ReadParameter("fbmb",0)) : ",0,0,0,0";
            if(!(!$conline && !empty($_GET["fboo"])))
                VisitorMonitoring::$Response .= "lz_tracking_add_floating_button(".Communication::ReadParameter("fbpos","10").",".$shadow.$margin.",".Communication::ReadParameter("fbw",0).",".Communication::ReadParameter("fbh",0).");";
            else if(!empty($_GET["fboo"]))
                VisitorMonitoring::$Response .= "lz_tracking_remove_floating_button();";
            if(isset($_GET["ifs"]))
                VisitorMonitoring::$Response .= VisitorMonitoring::GetFloatingButtonSelector($shadow,$conline);
        }

        VisitorMonitoring::LoadOverlayChat();
        VisitorMonitoring::$Response .= VisitorMonitoring::ProcessActions("",Visitor::$OpenChatExternal);

		if(!empty($_GET["cboo"]) && !operatorsAvailable(0,$parameters["exclude"],$parameters["include_group"],$parameters["include_user"],false))
			VisitorMonitoring::$Response .= "lz_tracking_remove_buttons();";

		if(empty($_GET["ovlc"]) && !empty(Server::$Configuration->File["gl_hide_inactive"]) && !VisitorMonitoring::$Visitor->IsActivity(VisitorMonitoring::$Browser))
        {
            VisitorMonitoring::$Response .= "lz_tracking_stop_tracking(17);";
        }
        else if(empty($_GET["ovlc"]) && !empty($_SERVER['HTTP_DNT']) && Server::$Configuration->File["gl_dnt"])
        {
            VisitorMonitoring::$Browser->Destroy();
            VisitorMonitoring::$Response .= "lz_tracking_stop_tracking(10);";
        }
        else if(VisitorMonitoring::$IsMonitoringActive || !empty(Visitor::$IsActiveOverlayChat))
		{
			if(IS_FLOOD)
            {
                VisitorMonitoring::$Browser->Destroy();
                VisitorMonitoring::Abort(14);
            }

            if(!empty($_GET["ovlc"]))
                VisitorMonitoring::$Response .= "lz_tracking_callback(" . VisitorMonitoring::GetPollFrequency(VisitorMonitoring::$Visitor->IsInChat(true),VisitorMonitoring::$Visitor->IsInChat(false)) . ");";
            else
                VisitorMonitoring::$Response .= "lz_tracking_callback(" . VisitorMonitoring::GetPollFrequency(false,false) . ");";
		}
		else
		{
            VisitorMonitoring::$Response .= "lz_tracking_stop_tracking(13);";
		}
	}
}

if(isset($_GET[GET_TRACK_OUTPUT_TYPE]) && $_GET[GET_TRACK_OUTPUT_TYPE] == "nojcrpt")
{
    VisitorMonitoring::Abort(7);
}
?>
