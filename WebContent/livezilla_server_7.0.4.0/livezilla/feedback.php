<?php
/****************************************************************************************
 * LiveZilla feedback.php
 *
 * Copyright 2016 LiveZilla GmbH
 * All rights reserved.
 * LiveZilla is a registered trademark.
 *
 * Improper changes to this file may cause critical errors.
 ***************************************************************************************/

define("IN_LIVEZILLA",true);
header('Content-Type: text/html; charset=utf-8');
if(!defined("LIVEZILLA_PATH"))
    define("LIVEZILLA_PATH","./");

require(LIVEZILLA_PATH . "_definitions/definitions.inc.php");
require(LIVEZILLA_PATH . "_lib/functions.global.inc.php");
require(LIVEZILLA_PATH . "_definitions/definitions.dynamic.inc.php");
require(LIVEZILLA_PATH . "_definitions/definitions.protocol.inc.php");

@set_error_handler("handleError");
if(Server::InitDataProvider())
{
    Server::InitDataBlock(array("DBCONFIG","INTERNAL"));
    LocalizationManager::AutoLoad();
    $fb_html = IOStruct::GetFile(PATH_TEMPLATES . "feedback.tpl");
    $chat = VisitorChat::GetByChatId(intval(Communication::ReadParameter("cid",0)));
    $ticket = Ticket::GetById(intval(Communication::ReadParameter("tid","")));
    $etc = Communication::ReadParameter("etc","");

    if($ticket != null)
    {
        $ticket->LoadMessages();
        $ticket->LoadStatus();
    }

    if(Feedback::IsFlood())
    {
        $fb_html = str_replace("<!--title-->","<br><br><br>" . str_replace("<!--count-->",MAX_FEEDBACKS_PER_DAY,LocalizationManager::$TranslationStrings["client_feedback_max"]) . "<script>parent.parent.lz_chat_feedback_result();</script>",$fb_html);
        $fb_html = str_replace("<!--visible-->","none",$fb_html);
    }
    else if(!empty($_POST))
    {
        $userid = "";
        $feedback = new Feedback(getId(32));
        if($chat != null)
        {
            $feedback->ChatId = $chat->ChatId;
            $feedback->UserId = $userid = $chat->UserId;
            $feedback->GroupId = $chat->DesiredChatGroup;
            $feedback->OperatorId = $chat->DesiredChatPartner;
            $visitor = new Visitor($chat->UserId);
            $visitor->LoadVisitorData();
            $feedback->VisitorData = $visitor->VisitorData;
            Visitor::CloseAllOverlays($chat->UserId);
        }
        else if($ticket != null)
        {
            $feedback->UserId = $ticket->SenderUserId;
            $feedback->TicketId = $ticket->Id;
            if(!empty($ticket->Editor))
            {
                $feedback->OperatorId = $ticket->Editor->Editor;
                $feedback->GroupId = $ticket->Editor->GroupId;
            }
            $feedback->VisitorData = UserData::FromTicketMessage($ticket->Messages[0]);
        }

        $isSpam = (!empty(Server::$Configuration->File["gl_sfc"]) && Visitor::CreateSPAMFilter($userid,false));
        if(!$isSpam)
        {
            $feedback->AddCriteriaDataFromServerInput();
            $feedback->Save();
        }
        else
            Logging::GeneralLog("Feedback matches SPAM filter rule.");
        $fb_html = str_replace("<!--sub_title-->",LocalizationManager::$TranslationStrings["client_feedback_success"] . "<script>parent.parent.lz_chat_feedback_result();</script>",$fb_html);
        $fb_html = str_replace("<!--title-->","<br><br><br>" . LocalizationManager::$TranslationStrings["client_thank_you"],$fb_html);
        $fb_html = str_replace("<!--visible-->","none",$fb_html);
    }
    else
    {
        $inputs_html = $js_id_list = "";
        foreach(Server::$Configuration->Database["gl_fb"] as $id => $criteria)
        {
            if(!empty($js_id_list))
                $js_id_list .= ",";

            $js_id_list .= "'" . $id . "'";
            $inputs_html .= $criteria->GetHTML();
        }

        $fb_html = str_replace("<!--criteria-->",$inputs_html,$fb_html);
        $fb_html = str_replace("<!--ids-->",$js_id_list,$fb_html);
        $fb_html = str_replace("<!--visible-->","",$fb_html);
        $fb_html = str_replace("<!--sub_title-->","",$fb_html);

        if(!empty($etc))
            $fb_html = str_replace("<!--style-->","background:#" . Colors::CorrectHEX($etc),$fb_html);

        if(!empty($chat) && !empty(Server::$Operators[$chat->DesiredChatPartner]) && empty($chat->GroupChat))
            $fb_html = str_replace("<!--title-->",str_replace("<!--fullname-->",Server::$Operators[$chat->DesiredChatPartner]->Fullname,LocalizationManager::$TranslationStrings["client_feedback_title_personal"]),$fb_html);
        //else if(!empty($ticket) && !empty($ticket->Editor) && !empty(Server::$Operators[$ticket->Editor->Editor]))
          //  $fb_html = str_replace("<!--title-->",str_replace("<!--fullname-->",Server::$Operators[$ticket->Editor->Editor]->Fullname,LocalizationManager::$TranslationStrings["client_feedback_title_personal"]),$fb_html);
        else
            $fb_html = str_replace("<!--title-->",LocalizationManager::$TranslationStrings["client_feedback_title"],$fb_html);
    }
    exit(Server::Replace($fb_html));
}
?>