<?php
/****************************************************************************************
* LiveZilla functions.external.inc.php
* 
* Copyright 2017 LiveZilla GmbH
* All rights reserved.
* LiveZilla is a registered trademark.
* 
* Improper changes to this file may cause critical errors.
***************************************************************************************/

if(!defined("IN_LIVEZILLA"))
	die();

function processPost($id,$post,$systemid,$counter,$rgroup,$chatid,$_received=false)
{
    
	$post->Id = $id;

	if(isset($_POST["p_pt" . $counter]))
	{
		$post->Translation = Encoding::Base64UrlDecode($_POST["p_pt" . $counter]);
		$post->TranslationISO = Encoding::Base64UrlDecode($_POST["p_ptiso" . $counter]);
	}

    $post->ChatId = $chatid;
	$post->ReceiverOriginal =
	$post->Receiver = $systemid;
	$post->ReceiverGroup = $rgroup;
	$post->Received=$_received;
	$post->Save();

    if((!empty(Server::$Configuration->File["gl_sfc"]) && Visitor::CreateSPAMFilter(VisitorMonitoring::$Visitor->UserId)))
        return false;

	return true;
}

function refreshPicture()
{
	
	if(!empty(Server::$Operators[VisitorMonitoring::$Visitor->Browsers[0]->OperatorId]->WebcamPicture))
		$edited = Server::$Operators[VisitorMonitoring::$Visitor->Browsers[0]->OperatorId]->WebcamPictureTime;
	else if(!empty(Server::$Operators[VisitorMonitoring::$Visitor->Browsers[0]->OperatorId]->ProfilePicture))
		$edited = Server::$Operators[VisitorMonitoring::$Visitor->Browsers[0]->OperatorId]->ProfilePictureTime;
	else
		$edited = 0;
	VisitorMonitoring::$Visitor->AddFunctionCall("lz_chat_set_intern_image(".$edited.",'" . Server::$Operators[VisitorMonitoring::$Visitor->Browsers[0]->OperatorId]->GetOperatorPictureFile() . "',false);",false);
	VisitorMonitoring::$Visitor->AddFunctionCall("lz_chat_set_config(".Server::$Configuration->File["timeout_chats"].",".Server::$Configuration->File["poll_frequency_clients"].");",false);
}

function updateMembers($_dgroup="")
{
	
    Server::InitDataBlock(array("DBCONFIG"));
	$groupname = addslashes(Server::$Groups[VisitorMonitoring::$Visitor->Browsers[0]->DesiredChatGroup]->GetDescription(VisitorMonitoring::$Visitor->Language));
	foreach(Server::$Groups as $group)
		if($group->IsDynamic && isset($group->Members[VisitorMonitoring::$Visitor->Browsers[0]->SystemId]))
		{
			$_dgroup = $group->Descriptions["EN"];
			foreach($group->Members as $member => $persistent)
				if(true || $member != VisitorMonitoring::$Visitor->Browsers[0]->SystemId)
				{
                    $isOperator = false;
                    $isBusyAway = false;
					if(!empty(Server::$Operators[$member]))
					{
                        $isOperator = true;
						if(Server::$Operators[$member]->Status==USER_STATUS_OFFLINE)
							continue;
                        if(Server::$Operators[$member]->Status != USER_STATUS_ONLINE || Server::$Operators[$member]->IsBot)
                            $isBusyAway = true;
						$name = Server::$Operators[$member]->Fullname;
					}
					else
                    {
						$data = UserData::FromSystemId($member);
                        $name = $data->Fullname;
                        if(empty($name))
                            $name = LocalizationManager::$TranslationStrings["client_guest"];

                        if($member != VisitorMonitoring::$Visitor->Browsers[0]->SystemId)
                        {
                            $chatobj = VisitorChat::GetBySystemId($member);
                            if(!($chatobj != null && !$chatobj->ExternalClosed && !$chatobj->InternalClosed))
                                continue;
                        }
                    }
				    VisitorMonitoring::$Visitor->AddFunctionCall("lz_chat_set_room_member('".base64_encode($member)."','".base64_encode($name)."',".To::BoolString($isOperator).",".To::BoolString($isBusyAway).",true);",false);
				}
		}
	foreach(VisitorMonitoring::$Visitor->Browsers[0]->Members as $sysid => $chatm)
		if($chatm->Status < 2 && empty($chatm->Declined) && Server::$Operators[$sysid]->Status!=USER_STATUS_OFFLINE)
			VisitorMonitoring::$Visitor->AddFunctionCall("lz_chat_set_room_member('".base64_encode($sysid)."','".base64_encode(Server::$Operators[$sysid]->Fullname)."',true,".To::BoolString(Server::$Operators[$sysid]->Status!=USER_STATUS_ONLINE).",false);",false);

    $fb = !empty(Server::$Groups[VisitorMonitoring::$Visitor->Browsers[0]->DesiredChatGroup]->ChatFunctions[3]) && !empty(Server::$Configuration->Database["gl_fb"]);
	VisitorMonitoring::$Visitor->AddFunctionCall("lz_chat_set_host(\"".base64_encode(Server::$Operators[VisitorMonitoring::$Visitor->Browsers[0]->OperatorId]->UserId)."\",\"".base64_encode(addslashes(Server::$Operators[VisitorMonitoring::$Visitor->Browsers[0]->OperatorId]->Fullname))."\",\"". base64_encode($groupname)."\",\"".strtolower(Server::$Operators[VisitorMonitoring::$Visitor->Browsers[0]->OperatorId]->Language)."\",".To::BoolString(Server::$Operators[VisitorMonitoring::$Visitor->Browsers[0]->OperatorId]->Typing==VisitorMonitoring::$Visitor->Browsers[0]->SystemId).",false,\"". base64_encode($_dgroup)."\",".To::BoolString($fb).",null);",false);
}

function buildLoginErrorField($_visitor=null,$_browser=null,$error="",$addition = "")
{
	if(!Server::IsAvailable())
		return LocalizationManager::$TranslationStrings["client_error_deactivated"];
		
	if(!DBManager::$Connected || !empty(Server::$Configuration->File["gl_stmo"]))
		return LocalizationManager::$TranslationStrings["client_error_unavailable"];

	if(IS_FILTERED && !FILTER_ALLOW_CHATS && !FILTER_ALLOW_TICKETS)
	{
		$error = LocalizationManager::$TranslationStrings["client_error_unavailable"];
		if(isset(Server::$Filters->Message) && strlen(Server::$Filters->Message) > 0)
			$addition = "<br><br>" . Server::$Filters->Message;
	}

    if($_visitor != null)
        if(!empty(Server::$Configuration->File["gl_damc"]) && $_visitor->IsInChat(true,$_browser,true))
            $error = LocalizationManager::$TranslationStrings["client_chat_running"];

	return $error . $addition;
}

function getSessionId()
{
	if(!Is::Null(Cookie::Get("userid")))
		$session = Cookie::Get("userid");
	else if(!empty($_GET[GET_TRACK_USERID]))
		$session = Encoding::Base64UrlDecode(getParam(GET_TRACK_USERID));
	else
		Cookie::Set("userid",$session = Visitor::IDValidate());
	return Visitor::IDValidate($session);
}

function isTicketFlood()
{
	$result = DBManager::Execute(true, "SELECT count(id) as ticket_count FROM `" . DB_PREFIX . DATABASE_TICKET_MESSAGES . "` WHERE time>" . DBManager::RealEscape(time() - 86400) . " AND ip='" . DBManager::RealEscape(Communication::GetIP()) . "';");
	if($result)
	{
        $row = DBManager::FetchArray($result);
		return ($row["ticket_count"] > MAX_TICKETS_PER_DAY);
	}
	else
		return true;
}

class OverlayChat
{
    public $Botmode;
    public $Human;
    public $HumanGeneral;
    public $RepollRequired;
    public $OperatorCount;
    public $Flags;
    public $LastMessageReceived;
    public $LastPostReceived;
    public $IsHumanChatAvailable;
    public $IsChatAvailable;
    public $ChatHTML;
    public $OverlayHTML;
    public $PostHTML;
    public $FullLoad;
    public $LanguageRequired = false;
    public $LastPoster;
    public $EyeCatcher;
    public $GroupBuilder;
    public $CurrentOperatorId;
    public $BotTitle;
    public $OperatorPostCount;
    public $PlaySound;
    public $SpeakingToHTML;
    public $SpeakingToAdded;
    public $Version = 1;
    public static $MaxPosts = 50;
    public static $Response;

    function __construct()
    {
        $this->Flags = array();
        VisitorChat::$Router = new ChatRouter();
    }

    function GetChatStatus()
    {
        
        if(VisitorMonitoring::$Visitor->Browsers[0]->Declined)
            return 0;
        else if($this->Botmode && !empty(VisitorMonitoring::$Visitor->Browsers[0]->OperatorId) && Server::$Operators[VisitorMonitoring::$Visitor->Browsers[0]->OperatorId]->IsBot)
            return 1;
        else if(VisitorMonitoring::$Visitor->Browsers[0]->Waiting || VisitorMonitoring::$Visitor->Browsers[0]->Status>0)
            return max(VisitorMonitoring::$Visitor->Browsers[0]->Status,VisitorMonitoring::$Visitor->Browsers[0]->Waiting);
        else
            return 0;
    }

    function GetWaitingMessage()
    {
        $wmsg = "null";
        if(!empty(Server::$Configuration->File["gl_wmes"]) && Server::$Configuration->File["gl_wmes"]>-1 && isset($_GET["ovltwo"]))
        {
            $wmsg = LocalizationManager::$TranslationStrings["client_still_waiting_int"];
            $wmsg .= " <a href=\"javascript:lz_chat_require_leave_message(true);\"><b>" . LocalizationManager::$TranslationStrings["client_leave_a_message"] . "</b></a>";
            $wmsg .= ". " . LocalizationManager::$TranslationStrings["client_thank_you"];
            $wmsg = "'".base64_encode($this->GetStatusHTML($wmsg))."'";
        }
        return $wmsg;
    }

    function GetDeclinedMessage()
    {
        $dmsg = LocalizationManager::$TranslationStrings["client_int_declined"];
        $dmsg .= " <a href=\"javascript:lz_chat_require_leave_message(true);\"><b>" . LocalizationManager::$TranslationStrings["client_leave_a_message"] . "</b></a>";
        $dmsg .= ". " . LocalizationManager::$TranslationStrings["client_thank_you"];
        return $dmsg;
    }

    function Init()
    {
        
        if(empty(VisitorMonitoring::$Visitor->Browsers[0]->ChatId))
        {
            if(VisitorMonitoring::$Visitor->Browsers[0]->SetChatId())
                VisitorMonitoring::$Visitor->AddFunctionCall("lz_closed=false;lz_chat_id='".VisitorMonitoring::$Visitor->Browsers[0]->ChatId."';",false);
            else
            {
                VisitorMonitoring::$Visitor->AddFunctionCall("lz_closed=false;",false);
                return false;
            }
        }

        if(VisitorMonitoring::$Visitor->Browsers[0]->Status == CHAT_STATUS_OPEN)
        {
            VisitorMonitoring::$Visitor->Browsers[0]->SetTargetOperatorId(VisitorChat::$Router,VisitorMonitoring::$Visitor,$this->Botmode,$this->Botmode,null,true,false,$this->Botmode);

            if((count(VisitorChat::$Router->OperatorsAvailable) + count(VisitorChat::$Router->OperatorsBusy)) > 0)
            {
                $chatPosition = VisitorChat::$Router->GetQueuePosition(VisitorMonitoring::$Visitor->Browsers[0]->DesiredChatGroup);
                $chatWaitingTime = VisitorChat::$Router->GetQueueWaitingTime($chatPosition);

                VisitorMonitoring::$Visitor->Browsers[0]->SetWaiting(!$this->Botmode && !($chatPosition == 1 && count(VisitorChat::$Router->OperatorsAvailable) > 0 && !(!empty(VisitorMonitoring::$Visitor->Browsers[0]->OperatorId) && Server::$Operators[VisitorMonitoring::$Visitor->Browsers[0]->OperatorId]->Status == USER_STATUS_BUSY)));

                if(isset($_GET[GET_EXTERN_PUBLIC_CHAT_GROUP]))
                {
                    $pgcid = Encoding::Base64UrlDecode($_GET[GET_EXTERN_PUBLIC_CHAT_GROUP]);
                    if(strlen($pgcid)==32)
                    {
                        $sysop = Operator::GetSystemOperator();//Server::$Operators["SYSTEM"];
                        VisitorMonitoring::$Visitor->Browsers[0]->CreateChat($sysop,VisitorMonitoring::$Visitor,true,"","",false);
                        VisitorMonitoring::$Visitor->Browsers[0]->SetPublicGroup($pgcid);
                        $room = new UserGroup();
                        $room->Id = $pgcid;
                        $room->AddMember(VisitorMonitoring::$Visitor->Browsers[0]->SystemId, false);
                        VisitorMonitoring::$Visitor->Browsers[0]->RemoteActivate($sysop);
                        $this->RepollRequired = true;
                        return false;
                    }
                }
                else if(!VisitorMonitoring::$Visitor->Browsers[0]->Waiting)
                {
                    if(Server::$Configuration->File["gl_alloc_mode"] != ALLOCATION_MODE_ALL || !empty(VisitorMonitoring::$Visitor->Browsers[0]->DesiredChatPartner))
                    {
                        VisitorMonitoring::$Visitor->Browsers[0]->CreateChat(Server::$Operators[VisitorMonitoring::$Visitor->Browsers[0]->DesiredChatPartner],VisitorMonitoring::$Visitor,true,"","",false);
                    }
                    else
                    {
                        foreach(VisitorChat::$Router->OperatorsAvailable as $intid => $am)
                            if(!VisitorMonitoring::$Visitor->Browsers[0]->CreateChat(Server::$Operators[$intid],VisitorMonitoring::$Visitor,false,"","",false))
                                break;
                    }
                    VisitorMonitoring::$Visitor->Browsers[0]->LoadMembers();

                    if(!empty(Server::$Groups[VisitorMonitoring::$Visitor->Browsers[0]->DesiredChatGroup]->PostJS))
                        VisitorMonitoring::$Visitor->AddFunctionCall("lz_chat_execute('".base64_encode(Server::$Groups[VisitorMonitoring::$Visitor->Browsers[0]->DesiredChatGroup]->PostJS)."');",false);
                }
                else
                {
                    if(VisitorMonitoring::$Visitor->Browsers[0]->IsMaxWaitingTime(true))
                    {
                        //VisitorMonitoring::$Visitor->AddFunctionCall("lz_chat_set_talk_to_human(false,false);lz_mode_create_ticket=true;",false);
                        VisitorMonitoring::$Visitor->AddFunctionCall("lz_chat_set_talk_to_human(false,false);",false);
                        VisitorMonitoring::$Visitor->Browsers[0]->UpdateUserStatus(false,false,true,false,false);
                    }
                    $qtext = (!empty(Server::$Configuration->File["gl_sho_qu_inf"]) ? LocalizationManager::$TranslationStrings["client_ints_are_busy"]." ".LocalizationManager::$TranslationStrings["client_queue_message"] : LocalizationManager::$TranslationStrings["client_ints_are_busy"]);
                    VisitorMonitoring::$Visitor->Browsers[0]->ShowQueueInformation(VisitorMonitoring::$Visitor,$chatPosition,$chatWaitingTime,$this->GetStatusHTML($qtext));
                    $gqmt = VisitorMonitoring::$Visitor->Browsers[0]->ShowGroupQueueInformation(VisitorMonitoring::$Visitor,VisitorMonitoring::$Visitor->Browsers[0]->QueueMessageShown);

                    if(!empty($gqmt))
                        $this->AddHTML($this->GetStatusHTML($gqmt),"sys","GQM");

                    if(!VisitorChat::$Router->WasTarget && !empty(VisitorMonitoring::$Visitor->Browsers[0]->DesiredChatPartner))
                        VisitorMonitoring::$Visitor->Browsers[0]->DesiredChatPartner = "";

                    VisitorMonitoring::$Visitor->Browsers[0]->CreateArchiveEntry(null,VisitorMonitoring::$Visitor);
                }
            }
        }
        else
        {
            if(empty(VisitorMonitoring::$Visitor->Browsers[0]->ArchiveCreated) && !empty(VisitorMonitoring::$Visitor->Browsers[0]->DesiredChatPartner))
            {
                VisitorMonitoring::$Visitor->Browsers[0]->CreateChat(Server::$Operators[VisitorMonitoring::$Visitor->Browsers[0]->DesiredChatPartner],VisitorMonitoring::$Visitor,true);
                if(!empty(Server::$Groups[VisitorMonitoring::$Visitor->Browsers[0]->DesiredChatGroup]->PostJS))
                    VisitorMonitoring::$Visitor->AddFunctionCall("lz_chat_execute('".base64_encode(Server::$Groups[VisitorMonitoring::$Visitor->Browsers[0]->DesiredChatGroup]->PostJS)."');",false);
            }
        }
        return true;
    }

    function BuildElements()
    {
        $this->SpeakingToHTML = empty(VisitorMonitoring::$Visitor->Browsers[0]->GroupChat) ? $this->GetSpeakingToHTML($this->CurrentOperatorId) : "";;
        $this->PostHTML = "";
        $pstrchngreq = $this->PlaySound = $this->SpeakingToAdded = false;

        $this->OperatorPostCount = 0;
        $this->Flags["LPP"] = $this->LastPoster;

        if(!VisitorMonitoring::$Visitor->FirstCall && !VisitorMonitoring::$Visitor->Browsers[0]->Declined && $result = DBManager::Execute(true, "SELECT * FROM `" . DB_PREFIX . DATABASE_POSTS . "` WHERE `chat_id`='" . DBManager::RealEscape(VisitorMonitoring::$Visitor->Browsers[0]->ChatId) . "' AND `chat_id`!='' AND `chat_id`!='0' AND (`receiver`='" . DBManager::RealEscape(VisitorMonitoring::$Visitor->Browsers[0]->SystemId) . "' OR (`sender`='" . DBManager::RealEscape(VisitorMonitoring::$Visitor->Browsers[0]->SystemId) . "' AND `repost`=0)) GROUP BY `id` ORDER BY `time` ASC, `micro` ASC;"))
        {
            $all = DBManager::GetRowCount($result);
            if($all > 0)
            {
                $count = OverlayChat::$MaxPosts-$all;
                while($row = DBManager::FetchArray($result))
                {
                    if($count++ >= 0)
                    {
                        $postobj = new Post($row);
                        if(empty(Server::$Operators[$postobj->Sender]))
                        {
                            $postobj->Text = htmlentities($postobj->Text,ENT_QUOTES,'UTF-8');
                            $postobj->Translation = htmlentities($postobj->Translation,ENT_QUOTES,'UTF-8');
                        }

                        if(VisitorMonitoring::$Visitor->Browsers[0]->AllocatedTime > 0 && VisitorMonitoring::$Visitor->Browsers[0]->AllocatedTime && !$this->SpeakingToAdded)
                        {
                            $this->Flags["LPP"] = "sys";
                            $this->PostHTML .= $this->SpeakingToHTML;
                            $this->SpeakingToAdded = true;
                        }

                        $post = $this->GetPostHTML($postobj->Text, $postobj->Translation, ($this->Flags["LPP"] != $postobj->Sender || $pstrchngreq), (($postobj->Sender != VisitorMonitoring::$Visitor->Browsers[0]->SystemId) ? $postobj->SenderName : VisitorMonitoring::$Visitor->VisitorData->Fullname), $postobj->Created, $postobj->Sender, VisitorMonitoring::$Visitor->Browsers[0]->SystemId);

                        $pstrchngreq = false;
                        if($postobj->Sender != VisitorMonitoring::$Visitor->Browsers[0]->SystemId)
                            $this->OperatorPostCount++;

                        if(!$postobj->Received && $postobj->Sender != VisitorMonitoring::$Visitor->Browsers[0]->SystemId)
                            $this->PlaySound = true;

                        if($this->FullLoad || $postobj->Sender != VisitorMonitoring::$Visitor->Browsers[0]->SystemId || $postobj->BrowserId != VisitorMonitoring::$Browser->BrowserId)
                            $this->Flags["LPP"] = $postobj->Sender;
                        if(empty($_GET["full"]) && $postobj->Id == $this->Flags["LPR"])
                        {
                            $this->PlaySound = false;
                            $this->PostHTML = $this->SpeakingToHTML;
                            $this->SpeakingToAdded = true;
                            $this->OperatorPostCount = 0;
                            $this->Flags["LPP"] = (!empty($this->SpeakingToHTML)) ? "sys" : $this->LastPoster;
                            if(VisitorMonitoring::$Visitor->Browsers[0]->AllocatedTime > 0 && $postobj->Created < VisitorMonitoring::$Visitor->Browsers[0]->AllocatedTime)
                                $pstrchngreq = true;
                        }
                        else
                        {
                            if($this->FullLoad || $postobj->Sender != VisitorMonitoring::$Visitor->Browsers[0]->SystemId || $postobj->BrowserId != VisitorMonitoring::$Browser->BrowserId)
                                $this->PostHTML .= $post;
                        }

                        $this->LastPostReceived = "'".base64_encode($postobj->Id)."'";
                    }
                }
            }
        }
    }

    function RemoveTicketFile()
    {
        $tfitd = Communication::ReadParameter("tra","");
        if(strlen($tfitd)==32)
            KnowledgeBase::RemoveTicketFile($tfitd,true);
    }

    function ProcessTicket($_visitor)
    {
        if(!empty($_GET["tid"]))
        {
            if($ticket = $_visitor->SaveTicket(Communication::GetParameter("eg","",$c),$_visitor->GeoCountryISO2,Communication::GetParameter("cmb","",$c)=="1",true,BaseURL::GetInputURL()))
            {
                $ticket->SendAutoresponder($_visitor,$_visitor->Browsers[0]);
            }
        }
    }

    function CreateChatTemplate()
    {
        $this->ChatHTML = "";
        if(Visitor::$PollCount == 1)
        {
            $this->ChatHTML = str_replace("<!--server-->",LIVEZILLA_URL,IOStruct::GetFile(TEMPLATE_SCRIPT_OVERLAY_CHAT . "chat.tpl"));
            $this->ChatHTML = str_replace("<!--file_upload_template-->",IOStruct::GetFile(PATH_TEMPLATES."file_upload.tpl"),$this->ChatHTML);
            $this->ChatHTML = str_replace("<!--dir-->",LocalizationManager::$Direction,$this->ChatHTML);
            $this->ChatHTML = DataInput::GetChatLoginInputs($this->ChatHTML,MAX_INPUT_LENGTH_OVERLAY,true);
            $this->ChatHTML = str_replace("<!--tr_vis-->",((strlen(Server::$Configuration->File["gl_otrs"])>1) ? "block" : "none"),$this->ChatHTML);
            $this->ChatHTML = str_replace("<!--overlay_input_max_length-->",MAX_INPUT_LENGTH_OVERLAY,$this->ChatHTML);
            $this->ChatHTML = str_replace("<!--ocpd-->",(empty(Server::$Configuration->File["gl_ocpd"]) ? "display:none" : ""),$this->ChatHTML);
            $this->ChatHTML = Server::Replace($this->ChatHTML,true,false);
            $this->ChatHTML = OverlayChat::ReplaceColors($this->ChatHTML,false);
            $this->ChatHTML = str_replace("<!--tc-->",Communication::ReadParameter("ovlct","#fff"),$this->ChatHTML);
            $this->ChatHTML = str_replace("<!--apo-->",((!empty($_GET["ovlapo"])) ? "" : "display:none;"),$this->ChatHTML);
            $this->ChatHTML = str_replace("<!--et_vis-->",((!empty(Server::$Configuration->File["gl_retr"]) && !empty(Server::$Configuration->File["gl_soct"])) ? "block":"none"),$this->ChatHTML);
            $this->ChatHTML = str_replace("<!--activate_transcript-->",((empty(Server::$Configuration->File["gl_soct"])) ? "":"CHECKED"),$this->ChatHTML);
            $this->ChatHTML = str_replace("<!--param-->",@Server::$Configuration->File["gl_cpas"],$this->ChatHTML);
            $this->ChatHTML = str_replace("<!--languages-->",GroupBuilder::GetLanguageSelects(LocalizationManager::GetBrowserLocalization()),$this->ChatHTML);
        }
    }

    function DefineModes()
    {
        
        $count = 0;

        foreach(Server::$Operators as $sysId => $internaluser)
        {
            $isex = $internaluser->IsExternal(Server::$Groups, null, array(VisitorMonitoring::$Visitor->Browsers[0]->DesiredChatGroup), VisitorMonitoring::$Visitor->Browsers[0]->DesiredChatPartner==$sysId, false);
            if($isex && $internaluser->Status < USER_STATUS_OFFLINE && !$internaluser->Deactivated)
            {
                if(!$internaluser->IsBot)
                    $this->HumanGeneral = true;
                $count++;

                if(!$internaluser->IsBot && !ChatRouter::$WelcomeManager)
                    $this->Botmode = false;
                else if($internaluser->IsBot && $internaluser->WelcomeManager && !defined("IGNORE_WM"))
                    $this->Botmode = ChatRouter::$WelcomeManager = true;

                if(!$internaluser->IsBot)
                {
                    $this->Human = true;
                    if(!empty(VisitorMonitoring::$Visitor->Browsers[0]->InitChatWith) && $sysId == VisitorMonitoring::$Visitor->Browsers[0]->InitChatWith)
                    {
                        $this->Botmode = ChatRouter::$WelcomeManager = false;
                        break;
                    }
                }
            }
            else if($internaluser->Status < USER_STATUS_OFFLINE && !$internaluser->Deactivated && !$internaluser->IsBot && $internaluser->IsExternal(Server::$Groups))
                $this->HumanGeneral = true;
        }
        if($count == 0)
        {
            $this->Botmode = false;
            $this->Human = false;
            $this->OperatorCount = 0;
        }

    }

    function DefineTargets()
    {
        
        if(!empty($_GET["tth"]) || VisitorMonitoring::$Visitor->IsInChat(true,VisitorMonitoring::$Visitor->Browsers[0]) || Visitor::$OpenChatExternal)
            define("IGNORE_WM",true);

        if(defined("IGNORE_WM") && !empty(VisitorMonitoring::$Visitor->Browsers[0]->DesiredChatPartner) && Server::$Operators[VisitorMonitoring::$Visitor->Browsers[0]->DesiredChatPartner]->IsBot)
            VisitorMonitoring::$Visitor->Browsers[0]->DesiredChatPartner = "";

        $groupSelected = false;
        if(UserGroup::ReadParams() != "" && VisitorMonitoring::$Visitor->Browsers[0]->Status == 0)
        {
            VisitorMonitoring::$Visitor->Browsers[0]->DesiredChatGroup = UserGroup::ReadParams();
            $groupSelected = true;
        }

        if(!empty($_GET[GET_EXTERN_INTERN_USER_ID]))
            VisitorMonitoring::$Visitor->Browsers[0]->DesiredChatPartner = Operator::GetSystemId(Encoding::Base64UrlDecode(getParam(GET_EXTERN_INTERN_USER_ID)));
        if(!empty(VisitorMonitoring::$Visitor->Browsers[0]->InitChatWith))
            VisitorMonitoring::$Visitor->Browsers[0]->DesiredChatPartner = VisitorMonitoring::$Visitor->Browsers[0]->InitChatWith;
        if(!$groupSelected && !(!empty(VisitorMonitoring::$Visitor->Browsers[0]->DesiredChatPartner) && !empty(VisitorMonitoring::$Visitor->Browsers[0]->DesiredChatGroup) && !empty(VisitorMonitoring::$Visitor->Browsers[0]->OperatorId)))
        {
            VisitorMonitoring::$Visitor->Browsers[0]->DesiredChatGroup = $this->GroupBuilder->GetTargetGroup($this->OperatorCount,VisitorMonitoring::$Visitor->Browsers[0]->DesiredChatPartner,VisitorMonitoring::$Visitor->Browsers[0]->DesiredChatGroup);
        }
        else
            $this->OperatorCount = 1;

        ChatRouter::$WelcomeManager = false;
        $this->Human =
        $this->HumanGeneral = false;
        $this->Botmode = true;
        $this->RepollRequired = false;
    }

    function SetHost($_systemId)
    {
        $groupId = (!empty($_systemId)) ? "'".base64_encode(VisitorMonitoring::$Visitor->Browsers[0]->DesiredChatGroup)."'" : "null";
        $groupDescription = (!empty($_systemId)) ? "'".base64_encode(Server::$Groups[VisitorMonitoring::$Visitor->Browsers[0]->DesiredChatGroup]->GetDescription(VisitorMonitoring::$Visitor->Language))."'" : "null";
        $userId = (!empty($_systemId)) ? "'".base64_encode(Server::$Operators[$_systemId]->UserId)."'" : "null";
        $fullname = (!empty($_systemId)) ? "'".base64_encode(Server::$Operators[$_systemId]->Fullname)."'" : "null";
        $language = (!empty($_systemId)) ? "'".base64_encode(Server::$Operators[$_systemId]->Language)."'" : "null";
        $image = (!empty($_systemId)) ? "'".base64_encode(LIVEZILLA_URL . Server::$Operators[$_systemId]->GetOperatorPictureFile())."'" : "null";
        $functions = (!empty($_systemId) && is_array(Server::$Groups[VisitorMonitoring::$Visitor->Browsers[0]->DesiredChatGroup]->ChatFunctions)) ? "[".implode(",",Server::$Groups[VisitorMonitoring::$Visitor->Browsers[0]->DesiredChatGroup]->ChatFunctions)."]" : "null";
        $_systemId = (!empty($_systemId)) ? "'".base64_encode($_systemId)."'" : "null";
        VisitorMonitoring::$Visitor->AddFunctionCall("lz_chat_set_host(".$_systemId.",'".base64_encode(VisitorMonitoring::$Visitor->Browsers[0]->ChatId)."',".$groupId.",".$groupDescription.",".$userId.",".$language.",".$image.",".$fullname.",".$functions.");",false);
    }

    function SetMembers()
    {
        
        $list = "";
        if(!empty(VisitorMonitoring::$Visitor->Browsers[0]->GroupChat))
        {
            $pcgobj = new UserGroup();
            $pcgobj->Id = VisitorMonitoring::$Visitor->Browsers[0]->GroupChat;
            $pcgobj->LoadMembers();
            foreach($pcgobj->Members as $id => $member)
            {
                if(!empty($list))
                    $list .= ',';

                $op = false;
                if(isset(Server::$Operators[$id]))
                {
                    $name = Server::$Operators[$id]->Fullname;
                    $op = true;

                    if(Server::$Operators[$id]->Status == USER_STATUS_OFFLINE)
                        continue;
                }
                else
                {
                    $vd = UserData::FromSystemId($id);
                    $name = $vd->Fullname;
                    $vc = VisitorChat::GetBySystemId($id);

                    if($vc==null)
                        continue;
                }
                $list .= "{id:'".$id."',name:'".Encoding::Base64UrlEncode($name)."',op:".To::BoolString($op)."}";
            }
            VisitorMonitoring::$Visitor->AddFunctionCall("lz_chat_set_members('".Encoding::Base64UrlEncode($pcgobj->Id)."',true,[".$list."]);",false);
        }
        else
            VisitorMonitoring::$Visitor->AddFunctionCall("lz_chat_set_members('',false,[]);",false);
    }

    function AddHTML($_html,$_poster,$_lmr="")
    {
        if(!empty($_lmr) && $_lmr == $this->Flags["LMR"])
        {
            logit("POST BLOCKED: " . $_lmr);
            return;
        }
        else if(!empty($_lmr))
            $this->LastMessageReceived = "'".base64_encode($_lmr)."'";

        $this->OverlayHTML .= $_html;
        $this->LastPoster = $_poster;
    }

    function GetPostHTML($_text, $_translation, $_add, $_name, $_time, $_senderId, $myId="")
    {
        $isOperator = isset(Server::$Operators[$_senderId]);
        $myPost = $myId==$_senderId && $myId != "";
        $bot = (!empty($_senderId) && isset(Server::$Operators[$_senderId]) && Server::$Operators[$_senderId]->IsBot);
        $exchtmpl = IOStruct::GetFile(TEMPLATE_SCRIPT_OVERLAY_CHAT . "messageexternal.tpl");
        $exchtmpl = str_replace("<!--ocpd-->",(empty(Server::$Configuration->File["gl_ocpd"]) ? "display:none" : ""),$exchtmpl);
        $post = ($_add) ? ((!$isOperator) ? $exchtmpl : IOStruct::GetFile(TEMPLATE_SCRIPT_OVERLAY_CHAT . "messageoperator.tpl")) : ((!$isOperator) ? IOStruct::GetFile(TEMPLATE_SCRIPT_OVERLAY_CHAT . "messageexternaladd.tpl") : IOStruct::GetFile(TEMPLATE_SCRIPT_OVERLAY_CHAT . "messageoperatoradd.tpl"));
        $image = ($bot) ? "<td rowspan=\"2\" style=\"vertical-align:top;\"><img style=\"border-radius:2px;margin:4px 0 0 4px;\" src=\"".LIVEZILLA_URL.Server::$Operators[$_senderId]->GetOperatorPictureFile()."\" width=\"60\" height=\"45\"></td>" : "";
        $name = ($isOperator) ? $_name : ((!empty($_name)) ? $_name : LocalizationManager::$TranslationStrings["client_guest"]);
        $post = str_replace("<!--name-->",htmlentities($name,ENT_QUOTES,"UTF-8"),$post);
        $post = str_replace("<!--ename-->",Encoding::Base64UrlEncode($name),$post);
        $post = str_replace("<!--time-->",$_time,$post);
        $post = str_replace("<!--picture-->",$image,$post);
        $post = str_replace("<!--sender_id-->",Encoding::Base64UrlEncode($_senderId),$post);
        $post = str_replace("<!--my-->",$myPost?1:0,$post);
        $post = str_replace("<!--lang_client_edit-->",LocalizationManager::$TranslationStrings["client_edit"],$post);
        $post = str_replace("<!--edit_display-->",($myPost && !empty(Server::$Configuration->File["gl_ocpd"])) ? "inline" : "none",$post);
        $post = str_replace("<!--bgce-->",($myPost) ? "<!--bgce-->" : Encoding::Base64UrlEncode("#bebebe"),$post);
        $post = OverlayChat::ReplaceColors($post,$isOperator);
        if(!$bot)
        {
            $_text = preg_replace('/(<(?!img)\w+[^>]+)(style="[^"]+")([^>]*)(>)/', '${1}${3}${4}', strip_tags($_text,"<a><br><b><ul><li><ol><b><i><u><strong><img><iframe>"));
            if(!empty($_translation))
            {
                $_translation = preg_replace('/(<(?!img)\w+[^>]+)(style="[^"]+")([^>]*)(>)/', '${1}${3}${4}', strip_tags($_translation,"<a><br><b><ul><li><ol><b><i><u><strong><img><iframe>"));
                $_text = $_translation . "<div class='lz_overlay_translation'>" . $_text . "</div>";
            }

            $_text = preg_replace('/\[\_\_\[(.*?)\]\_\_\]/','',$_text);
        }
        return str_replace("<!--message-->",$_text,$post);
    }

    function GetStatusHTML($_text)
    {
        $body = IOStruct::GetFile(TEMPLATE_HTML_MESSAGE_OVERLAY_CHAT_STATUS);
        return str_replace("<!--message-->",$_text,$body);
    }

    function GetLeaveChatHTML($_host,$_name,$_add="")
    {
        $html = IOStruct::GetFile(TEMPLATE_HTML_MESSAGE_OVERLAY_CHAT_STATUS);

        if($_host)
            $this->SetHost(null);

        return str_replace("<!--message-->",str_replace("<!--intern_name-->",$_name,LocalizationManager::$TranslationStrings["client_intern_left"]).$_add,$html);
    }

    function GetSpeakingToHTML($_opId)
    {
        $html = "";
        if(!empty(VisitorMonitoring::$Visitor->Browsers[0]->OperatorId))
        {
            if(!empty($_opId) && $_opId != VisitorMonitoring::$Visitor->Browsers[0]->OperatorId)
                $_opId="";

            if(VisitorMonitoring::$Visitor->Browsers[0]->DesiredChatPartner != VisitorMonitoring::$Visitor->Browsers[0]->OperatorId)
            {
                VisitorMonitoring::$Visitor->Browsers[0]->DesiredChatPartner = VisitorMonitoring::$Visitor->Browsers[0]->OperatorId;
                VisitorMonitoring::$Visitor->Browsers[0]->Save();
            }
            if(!VisitorMonitoring::$Visitor->Browsers[0]->Closed && VisitorMonitoring::$Visitor->Browsers[0]->InternalActivation && empty($_opId))
            {
                $text = LocalizationManager::$TranslationStrings["client_now_speaking_to"];
                if(Server::$Operators[VisitorMonitoring::$Visitor->Browsers[0]->OperatorId]->IsBot)
                    return "";

                $html .= $this->GetStatusHTML(str_replace("<!--operator_name-->",Server::$Operators[VisitorMonitoring::$Visitor->Browsers[0]->OperatorId]->Fullname,$text));

                $this->SetHost(VisitorMonitoring::$Visitor->Browsers[0]->OperatorId);
            }
        }
        return $html;
    }

    function GetInviteHTML($_operatorID,$_text,$_crid)
    {
        $this->LanguageRequired = true;
        $html = IOStruct::GetFile(TEMPLATE_SCRIPT_OVERLAY_CHAT . "messageinvite.tpl");
        $html = str_replace("<!--display_image-->","''",$html);
        $html = str_replace("<!--sender_id-->",Encoding::Base64UrlEncode($_operatorID),$html);
        $html = str_replace("<!--image-->","<img style=\"border-radius:2px;\" align=\"left\" src=\"".LIVEZILLA_URL.Server::$Operators[$_operatorID]->GetOperatorPictureFile()."\" width=\"80\" height=\"60\">",$html);
        $html = str_replace("<!--font_color-->","#000000",$html);
        $html = str_replace("<!--id-->",$_crid,$html);
        $html = OverlayChat::ReplaceColors($html,true);
        return str_replace("<!--message-->",str_replace("<!--intern_name-->",Server::$Operators[$_operatorID]->Fullname,$_text),$html);
    }

    function ProcessPosts()
    {
        $pc = 0;
        $this->OverlayHTML = "";

        if(!empty($_GET["mi".$pc]) || VisitorMonitoring::$Visitor->Browsers[0]->Waiting || !empty(VisitorMonitoring::$Visitor->Browsers[0]->InitChatWith))
        {
            if(!$this->Init())
                return false;
        }

        if(!empty(VisitorMonitoring::$Visitor->Browsers[0]->ChatId))
            VisitorMonitoring::$Visitor->AddFunctionCall("lz_chat_id='".VisitorMonitoring::$Visitor->Browsers[0]->ChatId."';",false);

        VisitorMonitoring::$Visitor->Browsers[0]->VisitId = VisitorMonitoring::$Visitor->VisitId;

        while(!empty($_GET["mi".$pc]))
        {
            $id = Communication::ReadParameter("mrid".$pc,md5(VisitorMonitoring::$Visitor->Browsers[0]->SystemId . VisitorMonitoring::$Visitor->Browsers[0]->ChatId . $_GET["mi".$pc]));
            $senderName = (!empty(VisitorMonitoring::$Visitor->VisitorData->Fullname)) ? VisitorMonitoring::$Visitor->VisitorData->Fullname : (LocalizationManager::$TranslationStrings["client_guest"] . " " . Visitor::GetNoName(VisitorMonitoring::$Visitor->UserId.Communication::GetIP()));
            $post = new Post($id,VisitorMonitoring::$Visitor->Browsers[0]->SystemId,"",Encoding::Base64UrlDecode($_GET["mp".$pc]),Communication::ReadParameter("mc".$pc,time()),VisitorMonitoring::$Visitor->Browsers[0]->ChatId,$senderName);
            $post->BrowserId = VisitorMonitoring::$Browser->BrowserId;

            if(!empty($_GET["mpti".$pc]))
            {
                $post->Translation = Encoding::Base64UrlDecode($_GET["mpt".$pc]);
                $post->TranslationISO = Encoding::Base64UrlDecode($_GET["mpti".$pc]);
            }
            $saved = false;
            if(!VisitorMonitoring::$Visitor->Browsers[0]->Waiting)
            {
                foreach(Server::$Groups as $groupid => $group)
                    if($group->IsDynamic && VisitorMonitoring::$Visitor->Browsers[0]->Status == CHAT_STATUS_ACTIVE && isset($group->Members[VisitorMonitoring::$Visitor->Browsers[0]->SystemId]))
                    {
                        foreach($group->Members as $member => $persistent)
                            if($member != VisitorMonitoring::$Visitor->Browsers[0]->SystemId)
                            {
                                if(!empty(Server::$Operators[$member]))
                                    processPost($id,$post,$member,$pc,$groupid,VisitorMonitoring::$Visitor->Browsers[0]->ChatId);
                                else
                                    processPost($id,$post,$member,$pc,$groupid,CacheManager::GetValueBySystemId($member,"chat_id",""));
                                $saved = true;
                            }
                        $pGroup=$group;
                    }

                foreach(VisitorMonitoring::$Visitor->Browsers[0]->Members as $systemid => $member)
                {
                    if(!empty($member->Declined))
                        continue;
                    if(!empty(Server::$Operators[$systemid]) && !empty($pGroup) && isset($pGroup->Members[$systemid]))
                        continue;
                    if(!(!empty($pGroup) && !empty(Server::$Operators[$systemid])))
                        $saved = processPost($id,$post,$systemid,$pc,VisitorMonitoring::$Visitor->Browsers[0]->SystemId,VisitorMonitoring::$Visitor->Browsers[0]->ChatId,Server::$Operators[$systemid]->IsBot);
                }

                if(!empty(VisitorMonitoring::$Visitor->Browsers[0]->OperatorId) && Server::$Operators[VisitorMonitoring::$Visitor->Browsers[0]->OperatorId]->IsBot)
                    $saved = $this->FeedBot(Server::$Operators[VisitorMonitoring::$Visitor->Browsers[0]->OperatorId],$post,$saved);

                if($saved)
                    VisitorMonitoring::$Visitor->AddFunctionCall("lz_chat_release_post('".Encoding::Base64UrlDecode($_GET["mi".$pc])."',".time().");",false);
            }
            else
            {
                processPost($id,$post,"",$pc,VisitorMonitoring::$Visitor->Browsers[0]->SystemId,VisitorMonitoring::$Visitor->Browsers[0]->ChatId,false);
                VisitorMonitoring::$Visitor->AddFunctionCall("lz_chat_release_post('".Encoding::Base64UrlDecode($_GET["mi".$pc])."',".time().");",false);
            }
            $pc++;
        }
        return true;
    }

    function FeedBot($bot,$post,$saved)
    {
        $api_res_obj = null;
        $api_req_obj = null;
        $answer = $bot->GetAutoReplies($post->Text,VisitorMonitoring::$Visitor->Browsers[0],VisitorMonitoring::$Visitor,$api_req_obj,$api_res_obj);
        if(!empty($answer))
        {
            $rpost = new Post($id = getId(32),$bot->SystemId,VisitorMonitoring::$Visitor->Browsers[0]->SystemId,$answer,time(),VisitorMonitoring::$Visitor->Browsers[0]->ChatId,$bot->Fullname);
            $rpost->ReceiverOriginal = $rpost->ReceiverGroup = VisitorMonitoring::$Visitor->Browsers[0]->SystemId;
            $rpost->APIObject = $api_res_obj;
            $rpost->Save();

            $saved = true;
            foreach(VisitorMonitoring::$Visitor->Browsers[0]->Members as $opsysid => $member)
            {
                if($opsysid != Server::$Operators[VisitorMonitoring::$Visitor->Browsers[0]->OperatorId]->SystemId)
                {
                    $rpost = new Post($id,$bot->SystemId,$opsysid,$answer,time(),VisitorMonitoring::$Visitor->Browsers[0]->ChatId,Server::$Operators[$opsysid]->Fullname);
                    $rpost->ReceiverOriginal = $rpost->ReceiverGroup = VisitorMonitoring::$Visitor->Browsers[0]->SystemId;
                    $rpost->Save();
                }
            }

            if($api_req_obj != null)
            {
                $post->SetAPIObject($api_req_obj);
            }
        }
        VisitorMonitoring::$Visitor->AddFunctionCall("lz_chat_input_bot_state(false);",false);
        return $saved;
    }

    function InitFeedback($_userInitiated=true)
    {
        
        Server::InitDataBlock(array("DBCONFIG"));
        if(empty(Server::$Configuration->Database["gl_fb"]) || Feedback::IsFlood())
            return;

        $cid = VisitorMonitoring::$Visitor->Browsers[0]->GetLastActiveChatId();
        if($_userInitiated || !empty($cid))
            if($_userInitiated || Feedback::GetByChatId($cid)==null)
                if($this->Version == 2)
                    VisitorMonitoring::$Visitor->AddFunctionCall("lz_chat_show_feedback();",false);
    }

    function GetFeedbackTemplate()
    {
        
        Server::InitDataBlock(array("DBCONFIG"));
        $template = new OverlayElement();
        $template->Style = "rounded";
        $template->Height = 180;

        foreach(Server::$Configuration->Database["gl_fb"] as $fc)
            $template->Height += $fc->GetHeight();

        $template->Id = md5(VisitorMonitoring::$Visitor->Browsers[0]->ChatId);
        return $template;
    }

    function AutoCloseChat($_chat,$_operator){

        $closeafterseconds = max(15,30);
        $mess = "";
        if($closeafterseconds > 0)
        {
            $lpi = Chat::GetLastPost($_chat->ChatId,true);
            $lpe = Chat::GetLastPost($_chat->ChatId,false);
            $lmsi = ($lpi != null) ? $lpi->Created : 0;
            $lmse = ($lpe != null) ? $lpe->Created : $_chat->AllocatedTime;
        }
        $lm = max($lmsi,$lmse);
        $lastMessageExternal = ($lmse > $lmsi && !empty($lm));
        $lastMessageInternal = ($lmsi >= $lmse || $lpe == null);

        if(empty($lm))
            $lm = $_chat->AllocatedTime;

        if(!empty($lm))
        {
            if($lastMessageInternal > $lastMessageExternal)
            {
                if($lm < (time()-$closeafterseconds))
                {
                    $npost = new Post(getId(32),$_operator->SystemId,$_chat->SystemId,$mess,time(),$_chat->ChatId,$_operator->Fullname);
                    $npost->ReceiverGroup = $_chat->SystemId;
                    $npost->Save();
                    $_chat->InternalClose($_operator->SystemId);
                }
            }
        }
    }

    function Listen()
    {
        
        $members = array();
        $isOp = false;
        if(VisitorMonitoring::$Visitor->Browsers[0]->Status == CHAT_STATUS_ACTIVE)
        {
            $result = DBManager::Execute(true, "SELECT * FROM `" . DB_PREFIX . DATABASE_VISITOR_CHAT_OPERATORS . "` WHERE `chat_id`='" . DBManager::RealEscape(VisitorMonitoring::$Visitor->Browsers[0]->ChatId) . "' ORDER BY `status` DESC, `dtime` DESC;");
            while($row = DBManager::FetchArray($result))
                if(isset(Server::$Operators[$row["user_id"]]))
                {
                    $ChatMember = new ChatMember($row["user_id"],$row["status"],!empty($row["declined"]),$row["jtime"],$row["ltime"]);
                    if($ChatMember->Status == 1 && $ChatMember->Joined >= VisitorMonitoring::$Visitor->Browsers[0]->LastActive)
                    {
                        $isOp = true;
                        $this->AddHTML(str_replace("<!--message-->",str_replace("<!--intern_name-->",Server::$Operators[$ChatMember->SystemId]->Fullname,LocalizationManager::$TranslationStrings["client_intern_arrives"]),IOStruct::GetFile(TEMPLATE_HTML_MESSAGE_OVERLAY_CHAT_STATUS)),"sys","LMMJ".$ChatMember->SystemId);
                    }
                    else if(($ChatMember->Status == 9 || $ChatMember->Status == 2) && $ChatMember->Left >= VisitorMonitoring::$Visitor->Browsers[0]->LastActive && $ChatMember->Joined > 0)
                    {
                        $this->AddHTML($this->GetLeaveChatHTML(false,Server::$Operators[$ChatMember->SystemId]->Fullname),"sys","LCM01".$ChatMember->SystemId);
                    }
                    if($ChatMember->Status == 0)
                    {
                        $isOp = true;
                    }
                    $members[] = $ChatMember;
                }

            //if(!$this->Botmode && count($members) == 1)
              //  $this->AutoCloseChat(VisitorMonitoring::$Visitor->Browsers[0],Server::$Operators[$members[0]->SystemId],Server::$Groups[VisitorMonitoring::$Visitor->Browsers[0]->DesiredChatGroup]);
        }
        else
            $isOp = true;

        if(Communication::ReadParameter("ovlif"))
            $this->InitFeedback();

        VisitorMonitoring::$Visitor->Browsers[0]->Typing = isset($_GET["typ"]);

        if(VisitorMonitoring::$CreateUserObject)
        {
            if(!VisitorMonitoring::$Visitor->Browsers[0]->Declined)
                VisitorMonitoring::$Visitor->Browsers[0]->Save();
        }

        VisitorMonitoring::$Visitor->Browsers[0]->ValidateOperator();

        $this->CurrentOperatorId = Communication::GetParameter("op","",$c,FILTER_SANITIZE_SPECIAL_CHARS,null,32);

        $a = VisitorMonitoring::$Visitor->Browsers[0]->Waiting && $this->Botmode;
        $b = empty(VisitorMonitoring::$Visitor->Browsers[0]->OperatorId) && !empty($this->CurrentOperatorId) && isset(Server::$Operators[$this->CurrentOperatorId]) && !Server::$Operators[$this->CurrentOperatorId]->IsBot;
        $c = (!empty($this->CurrentOperatorId) && empty(VisitorMonitoring::$Visitor->Browsers[0]->ChatId) && !$this->Botmode);
        $d = !$isOp;
        $e = VisitorMonitoring::$Visitor->Browsers[0]->Closed;

        if($a || $b || $c || $d || $e)
        {
            if(!VisitorMonitoring::$Visitor->Browsers[0]->ExternalClosed)
            {
                VisitorMonitoring::$Visitor->Browsers[0]->ExternalClose();
                VisitorMonitoring::$Visitor->Browsers[0]->Save();
                VisitorMonitoring::$Visitor->Browsers[0]->Load();
            }

            VisitorMonitoring::$Visitor->Browsers[0]->Members = array();
            if(!empty($this->CurrentOperatorId) && isset(Server::$Operators[$this->CurrentOperatorId]) && $isOp)
            {
                $this->AddHTML($this->GetLeaveChatHTML(true,Server::$Operators[$this->CurrentOperatorId]->Fullname),"sys","LCM01" . $this->CurrentOperatorId);

                if(!empty(Server::$Configuration->File["gl_fboe"]) && Communication::ReadParameter("po",0)==0 && !Server::$Operators[$this->CurrentOperatorId]->IsBot)
                    if(!empty(Server::$Groups[VisitorMonitoring::$Visitor->Browsers[0]->DesiredChatGroup]->ChatFunctions[3]))
                    {
                        $this->InitFeedback(false);
                    }

                $this->Flags["LMR"] = "null";
                VisitorMonitoring::$Visitor->Browsers[0]->OperatorId = null;
                $this->CurrentOperatorId = "";
                $this->RepollRequired = true;
            }
        }
    }

    function KnowledgebaseSearch()
    {
        
        if(!empty($_GET["skb"]))
        {
            $root = Communication::ReadParameter("ckf","");
            $c = count(KnowledgeBase::GetMatches($root,Communication::ReadParameter("skb",""),Visitor::$BrowserLanguage));
            VisitorMonitoring::$Visitor->AddFunctionCall("lz_chat_search_result(false,".$c.");",false);
        }
    }

    function GetEyeCatcherV2(){
        
        $catcher = array();
        $catcher["operator_name"] = "";
        $catcher["html"] = IOStruct::GetFile(TEMPLATE_SCRIPT_OVERLAY_CHAT."eyecatcher_bubble.tpl");
        if(!Visitor::$IsActiveOverlayChat)
        {
            VisitorMonitoring::$Visitor->Browsers[0]->FindOperator(VisitorChat::$Router,VisitorMonitoring::$Visitor,$this->Botmode,$this->Botmode,null,true,false);
            if(Server::$Configuration->File["gl_alloc_mode"] == ALLOCATION_MODE_ALL && !empty(VisitorChat::$Router->OperatorsAvailable))
                VisitorMonitoring::$Visitor->Browsers[0]->DesiredChatPartner = array_rand(VisitorChat::$Router->OperatorsAvailable,1);

            if(empty(VisitorMonitoring::$Visitor->Browsers[0]->DesiredChatPartner) && !empty(VisitorChat::$Router->OperatorsBusy))
                VisitorMonitoring::$Visitor->Browsers[0]->DesiredChatPartner = array_rand(VisitorChat::$Router->OperatorsBusy,1);
        }

        if(!empty(VisitorMonitoring::$Visitor->Browsers[0]->DesiredChatPartner))
        {
            $catcher["html"] = str_replace("<!--avatar_src-->",LIVEZILLA_URL.Server::$Operators[VisitorMonitoring::$Visitor->Browsers[0]->DesiredChatPartner]->GetOperatorPictureFile(),$catcher["html"]);
            $catcher["html"] = str_replace("<!--avatar_visible-->","block",$catcher["html"]);
            $catcher["html"] = str_replace("<!--avatar_bg_col-->",Server::$Operators[VisitorMonitoring::$Visitor->Browsers[0]->DesiredChatPartner]->Color,$catcher["html"]);
            $catcher["html"] = str_replace("<!--border-->",2,$catcher["html"]);
            $catcher["operator_name"] = Server::$Operators[VisitorMonitoring::$Visitor->Browsers[0]->DesiredChatPartner]->Fullname;

            if(empty(Server::$Operators[VisitorMonitoring::$Visitor->Browsers[0]->DesiredChatPartner]->ProfilePicture))
                $catcher["html"] = str_replace("<!--bg_size-->","56px 42px",$catcher["html"]);
            else
                $catcher["html"] = str_replace("<!--bg_size-->","80px 60px",$catcher["html"]);

            if(!isset($_GET["echst"]))
                VisitorMonitoring::$Visitor->AddFunctionCall("lz_ec_sub_header_p='".base64_encode(str_replace("<!--operator_name-->",Server::$Operators[VisitorMonitoring::$Visitor->Browsers[0]->DesiredChatPartner]->Fullname,LocalizationManager::$TranslationStrings["client_ec_sub_text_personal"]))."';",false);

            if(Server::$Configuration->File["gl_alloc_mode"] != ALLOCATION_MODE_ALL)
                VisitorMonitoring::$Visitor->AddFunctionCall("lz_desired_operator='".Server::$Operators[VisitorMonitoring::$Visitor->Browsers[0]->DesiredChatPartner]->UserId."';",false);
        }
        else
        {
            $catcher["html"] = str_replace("<!--avatar_visible-->","none",$catcher["html"]);
        }
        return $catcher;
    }

    function UpdatePostStatus(){

        
        $lastPostId = Communication::ReadParameter("lpr","");
        $lastPostNoticed = Communication::ReadParameter("lps","");

        if(!empty($lastPostNoticed))
        {
            $markAllBelow = false;
            if($result = DBManager::Execute(true, "SELECT * FROM `" . DB_PREFIX . DATABASE_POSTS . "` WHERE (`noticed`=0 OR `received`=0) AND `receiver`='".DBManager::RealEscape(VisitorMonitoring::$Visitor->Browsers[0]->SystemId)."' ORDER BY `time` DESC, `micro` DESC;"))
                while($row = DBManager::FetchArray($result))
                {
                    if($row["id"] == $lastPostId)
                    {
                        $markAllBelow = true;
                    }

                    if($markAllBelow)
                    {
                        if($lastPostNoticed=='2')
                        {
                            DBManager::Execute(true, "UPDATE `" . DB_PREFIX . DATABASE_POSTS . "` SET `updated`=".time().",`noticed`=1,`received`=1 WHERE `id`='".DBManager::RealEscape($row["id"])."' LIMIT 1");
                        }
                        else if($row["received"]==0)
                        {
                            DBManager::Execute(true, "UPDATE `" . DB_PREFIX . DATABASE_POSTS . "` SET `updated`=".time().",`received`=1 WHERE `id`='".DBManager::RealEscape($row["id"])."' LIMIT 1");
                        }
                    }
                }
        }
    }

    function IsBotChat()
    {
        
        return !empty(VisitorMonitoring::$Visitor->Browsers[0]->OperatorId) && Server::$Operators[VisitorMonitoring::$Visitor->Browsers[0]->OperatorId]->IsBot;
    }

    function CloseChat(){
        
        VisitorMonitoring::$Visitor->Browsers[0]->ExternalClose();
        VisitorMonitoring::$Visitor->Browsers[0]->Destroy();
        VisitorMonitoring::$Visitor->AddFunctionCall("lz_leave_chat=false;",false);
        VisitorMonitoring::$Visitor->AddFunctionCall("lz_closed=false;",false);
        VisitorMonitoring::$Visitor->AddFunctionCall("lz_tracking_poll_server();",false);

        if($this->IsBotChat())
        {
            $post = new Post(getId(32),VisitorMonitoring::$Visitor->Browsers[0]->SystemId,"","[__[EXIT]__]","",VisitorMonitoring::$Visitor->Browsers[0]->ChatId,"");
            $this->FeedBot(Server::$Operators[VisitorMonitoring::$Visitor->Browsers[0]->OperatorId],$post,true);
        }
    }

    static function GetDefaultScript($_fullScreen=false){
        require_once(LIVEZILLA_PATH . "_lib/functions.tracking.inc.php");
        $script = str_replace("<!--fs-->",To::BoolString($_fullScreen),IOStruct::GetFile(PATH_TEMPLATES . "default.tpl"));
        $params = "&" . Communication::GetTargetParameterString("");
        $script = str_replace("<!--f_kb-->",To::BoolString(!isset($_GET["hfk"])),$script);
        $script = str_replace("<!--f_chat-->",To::BoolString(!isset($_GET["hfc"])),$script);
        $script = str_replace("<!--f_ticket-->",To::BoolString(!isset($_GET["nct"])),$script);
        $script = str_replace("<!--f_phone-->",To::BoolString(isset($_GET["ofc"])),$script);
        $script = str_replace("<!--params-->",$params,$script);
        return $script;
    }

    static function ReplaceColors($_html,$_operator)
    {
        if(isset($_GET["ovlv"]))
        {
            $primary = Communication::ReadParameter("epc","#73be28");
            $secondary = Communication::ReadParameter("esc","#569a13");
        }
        else
        {
            $primary = Communication::ReadParameter("ovlc","#73be28");
            $secondary = Communication::ReadParameter("ovlct","#ffffff");
        }

        $textshadow = Communication::ReadParameter("ovlts",1);
        $_html = str_replace(array("<!--pc-->","<!--bgc-->"),$primary,$_html);
        $_html = str_replace(array("<!--sc-->","<!--tc-->","<!--tch-->"),$secondary,$_html);
        $_html = str_replace(array("<!--bgcd-->","<!--pcd-->"),Colors::TransformBrightness($primary,-0.15),$_html);

        //depr
        $_html = str_replace("<!--bgce-->",Encoding::Base64UrlEncode($primary),$_html);
        $_html = str_replace("<!--bgcm-->",Colors::TransformBrightness($primary,-0.1),$_html);
        $_html = str_replace("<!--bgcl-->",Colors::TransformBrightness($primary,0.98),$_html);
        $_html = str_replace("<!--ts-->",($textshadow==1) ? "text-shadow:1px 1px 0 #6b6b6b;" : "",$_html);

        return str_replace("<!--color-->",($_operator) ? Colors::TransformBrightness($secondary,-0.2) : "#000000",$_html);
    }
}
?>
