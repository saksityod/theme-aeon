<?php
/****************************************************************************************
* LiveZilla functions.internal.process.inc.php
* 
* Copyright 2017 LiveZilla GmbH
* All rights reserved.
* LiveZilla is a registered trademark.
* 
* Improper changes to this file may cause critical errors.
****************************************************************************************/

if(!defined("IN_LIVEZILLA"))
	die();

function processUpdateReport()
{
	$count = 0;
	if(STATS_ACTIVE)
    {
        CacheManager::FlushKey(DATA_CACHE_KEY_STATS);
        Server::$Statistic = new StatisticProvider();
		while(isset($_POST[POST_INTERN_PROCESS_UPDATE_REPORT . "_va_" . $count]))
		{
			$parts = explode("_",$_POST[POST_INTERN_PROCESS_UPDATE_REPORT . "_va_" . $count]);
			if($parts[1]==0)
				$report = new StatisticYear($parts[0],0,0,0,0);
			else if($parts[2]==0)
				$report = new StatisticMonth($parts[0],$parts[1],0,0,0);
			else
				$report = new StatisticDay($parts[0],$parts[1],$parts[2],0,0);
			$report->Update(!empty($_POST[POST_INTERN_PROCESS_UPDATE_REPORT . "_vb_" . $count]));
			$count++;
		}
    }
}

function processAuthentications()
{
	if(isset($_POST[POST_INTERN_PROCESS_AUTHENTICATIONS . "_va"]))
        if(OperatorRequest::IsValidated())
        {
            $users = explode(POST_ACTION_VALUE_SPLITTER,$_POST[POST_INTERN_PROCESS_AUTHENTICATIONS . "_va"]);
            $passwords = explode(POST_ACTION_VALUE_SPLITTER,$_POST[POST_INTERN_PROCESS_AUTHENTICATIONS . "_vb"]);
            foreach($users as $key => $user)
            {
                if($user == CALLER_SYSTEM_ID)
                {
                    Server::$Operators[$user]->ChangePassword($passwords[$key]);
                    Server::$Response->Authentications = "<val userid=\"".base64_encode($user)."\" />\r\n";
                }
            }
        }
}

function processStatus()
{
	if(isset($_POST[POST_INTERN_USER_STATUS]))
	{
        if(Is::Defined("LOGIN") && Server::$Operators[CALLER_SYSTEM_ID]->Status == USER_STATUS_OFFLINE)
            return;

        if(Server::$Operators[CALLER_SYSTEM_ID]->Status != $_POST[POST_INTERN_USER_STATUS] || !empty($_POST["p_groups_status"]) || (isset($_POST[POST_GLOBAL_TYPING]) && Server::$Operators[CALLER_SYSTEM_ID]->Typing != $_POST[POST_GLOBAL_TYPING]))
        {
            Server::$Operators[CALLER_SYSTEM_ID]->Status = $_POST[POST_INTERN_USER_STATUS];
            Server::$Operators[CALLER_SYSTEM_ID]->SaveUpdated = true;

            if(isset($_POST[POST_GLOBAL_TYPING]))
                Server::$Operators[CALLER_SYSTEM_ID]->Typing = $_POST[POST_GLOBAL_TYPING];

            if(!empty($_POST["p_groups_status"]))
            {
                Server::$Operators[CALLER_SYSTEM_ID]->GroupsAway = array();
                $i=0;
                while(isset($_POST["p_groups_status_" . $i]))
                    Server::$Operators[CALLER_SYSTEM_ID]->GroupsAway[] = $_POST["p_groups_status_" . $i++];
            }
            Server::$Operators[CALLER_SYSTEM_ID]->Save(false);
            Server::ForceUpdate(array("INTERNAL"));
        }
        else
        {
            if((time() - Server::$Operators[CALLER_SYSTEM_ID]->LastActive) >= 15)
            {
                Server::$Operators[CALLER_SYSTEM_ID]->Save();
            }
        }
	}
}

function processEvents()
{
    $count = 0;
    while(isset($_POST[POST_INTERN_PROCESS_EVENTS . "_va_" . $count]))
    {
        $event = new Event($_POST[POST_INTERN_PROCESS_EVENTS . "_va_" . $count],$_POST[POST_INTERN_PROCESS_EVENTS . "_vb_" . $count],$_POST[POST_INTERN_PROCESS_EVENTS . "_vc_" . $count],$_POST[POST_INTERN_PROCESS_EVENTS . "_vd_" . $count],$_POST[POST_INTERN_PROCESS_EVENTS . "_ve_" . $count],$_POST[POST_INTERN_PROCESS_EVENTS . "_vf_" . $count],$_POST[POST_INTERN_PROCESS_EVENTS . "_vg_" . $count],$_POST[POST_INTERN_PROCESS_EVENTS . "_vh_" . $count],$_POST[POST_INTERN_PROCESS_EVENTS . "_vk_" . $count],$_POST[POST_INTERN_PROCESS_EVENTS . "_vl_" . $count],$_POST[POST_INTERN_PROCESS_EVENTS . "_vm_" . $count],$_POST[POST_INTERN_PROCESS_EVENTS . "_vn_" . $count],$_POST[POST_INTERN_PROCESS_EVENTS . "_vo_" . $count],$_POST[POST_INTERN_PROCESS_EVENTS . "_vp_" . $count],$_POST[POST_INTERN_PROCESS_EVENTS . "_vq_" . $count],$_POST[POST_INTERN_PROCESS_EVENTS . "_vs_" . $count],$_POST[POST_INTERN_PROCESS_EVENTS . "_vt_" . $count],$_POST[POST_INTERN_PROCESS_EVENTS . "_vu_" . $count],$_POST[POST_INTERN_PROCESS_EVENTS . "_vv_" . $count],$_POST[POST_INTERN_PROCESS_EVENTS . "_vw_" . $count],$_POST[POST_INTERN_PROCESS_EVENTS . "_vy_" . $count],$_POST[POST_INTERN_PROCESS_EVENTS . "_vz_" . $count]);

        DBManager::Execute(true, "DELETE FROM `" . DB_PREFIX . DATABASE_EVENTS . "` WHERE `id`='" . DBManager::RealEscape($event->Id) . "' LIMIT 1;");
        DBManager::Execute(true, "DELETE FROM `" . DB_PREFIX . DATABASE_EVENT_ACTIONS . "` WHERE NOT EXISTS (SELECT * FROM `" . DB_PREFIX . DATABASE_EVENTS . "` WHERE `id` = `" . DB_PREFIX . DATABASE_EVENT_ACTIONS . "`.`eid`)");
        DBManager::Execute(true, "DELETE FROM `" . DB_PREFIX . DATABASE_EVENT_ACTION_RECEIVERS . "` WHERE NOT EXISTS (SELECT * FROM `" . DB_PREFIX . DATABASE_EVENT_ACTIONS . "` WHERE `id` = `" . DB_PREFIX . DATABASE_EVENT_ACTION_RECEIVERS . "`.`action_id`)");
        DBManager::Execute(true, "DELETE FROM `" . DB_PREFIX . DATABASE_EVENT_FUNNELS . "` WHERE NOT EXISTS (SELECT * FROM `" . DB_PREFIX . DATABASE_EVENT_URLS . "` WHERE `id` = `" . DB_PREFIX . DATABASE_EVENT_FUNNELS . "`.`uid`)");
        DBManager::Execute(true, "DELETE FROM `" . DB_PREFIX . DATABASE_EVENT_FUNNELS . "` WHERE NOT EXISTS (SELECT * FROM `" . DB_PREFIX . DATABASE_EVENTS . "` WHERE `id` = `" . DB_PREFIX . DATABASE_EVENT_FUNNELS . "`.`eid`)");
        DBManager::Execute(true, "DELETE FROM `" . DB_PREFIX . DATABASE_EVENT_ACTION_SENDERS . "` WHERE NOT EXISTS (SELECT * FROM `" . DB_PREFIX . DATABASE_EVENT_ACTIONS . "` WHERE `id` = `" . DB_PREFIX . DATABASE_EVENT_ACTION_SENDERS . "`.`pid`)");
        DBManager::Execute(true, "DELETE FROM `" . DB_PREFIX . DATABASE_EVENT_GOALS . "` WHERE NOT EXISTS (SELECT * FROM `" . DB_PREFIX . DATABASE_GOALS . "` WHERE `id` = `" . DB_PREFIX . DATABASE_EVENT_GOALS . "`.`goal_id`)");
        DBManager::Execute(true, "DELETE FROM `" . DB_PREFIX . DATABASE_EVENT_URLS . "` WHERE NOT EXISTS (SELECT * FROM `" . DB_PREFIX . DATABASE_EVENTS . "` WHERE `id` = `" . DB_PREFIX . DATABASE_EVENT_URLS . "`.`eid`)");

        if(!isset($_POST[POST_INTERN_PROCESS_EVENTS . "_vx_" . $count]))
        {
            $countdataconditions = 0;
            $event->DataConditions = array();
            while(isset($_POST[POST_INTERN_PROCESS_EVENTS . "_vw_" . $count . "_a_" .$countdataconditions]))
            {
                $event->DataConditions[] = array(base64_encode($_POST[POST_INTERN_PROCESS_EVENTS . "_vw_" . $count . "_a_" .$countdataconditions]),base64_encode($_POST[POST_INTERN_PROCESS_EVENTS . "_vw_" . $count . "_b_" .$countdataconditions]));
                $countdataconditions++;
            }

            DBManager::Execute(true, $event->GetSQL());
            $counturl = 0;
            while(isset($_POST[POST_INTERN_PROCESS_EVENTS . "_vi_" . $count . "_a_" .$counturl]))
            {
                $eventURL = new EventURL($_POST[POST_INTERN_PROCESS_EVENTS . "_vi_" . $count . "_f_" .$counturl],$event->Id,$_POST[POST_INTERN_PROCESS_EVENTS . "_vi_" . $count . "_a_" .$counturl],$_POST[POST_INTERN_PROCESS_EVENTS . "_vi_" . $count . "_b_" .$counturl],$_POST[POST_INTERN_PROCESS_EVENTS . "_vi_" . $count . "_c_" .$counturl],$_POST[POST_INTERN_PROCESS_EVENTS . "_vi_" . $count . "_d_" .$counturl]);
                DBManager::Execute(true, $eventURL->GetSQL());
                if(isset($_POST[POST_INTERN_PROCESS_EVENTS . "_vi_" . $count . "_e_" .$counturl]))
                    DBManager::Execute(true, "INSERT INTO `" . DB_PREFIX . DATABASE_EVENT_FUNNELS . "` (`eid`,`uid`,`ind`) VALUES ('" . DBManager::RealEscape($event->Id) . "','" . DBManager::RealEscape($eventURL->Id) . "','" . DBManager::RealEscape($_POST[POST_INTERN_PROCESS_EVENTS . "_vi_" . $count . "_e_" . $counturl]) . "');");
                $counturl++;
            }

            $countgoals = 0;
            DBManager::Execute(true, "DELETE FROM `" . DB_PREFIX . DATABASE_EVENT_GOALS . "` WHERE `event_id` = '" . DBManager::RealEscape($event->Id) . "';");
            while(isset($_POST[POST_INTERN_PROCESS_EVENTS . "_vs_" . $count . "_a_" .$countgoals]))
            {
                DBManager::Execute(true, "INSERT INTO `" . DB_PREFIX . DATABASE_EVENT_GOALS . "` (`event_id`,`goal_id`) VALUES ('" . DBManager::RealEscape($event->Id) . "','" . DBManager::RealEscape($_POST[POST_INTERN_PROCESS_EVENTS . "_vs_" . $count . "_a_" . $countgoals]) . "');");
                $countgoals++;
            }

            $countaction = 0;
            while(isset($_POST[POST_INTERN_PROCESS_EVENTS . "_vj_" . $count . "_a_" .$countaction]))
            {
                $eventAction = new EventAction($event->Id,$_POST[POST_INTERN_PROCESS_EVENTS . "_vj_" . $count . "_a_" .$countaction],$_POST[POST_INTERN_PROCESS_EVENTS . "_vj_" . $count . "_b_" .$countaction],$_POST[POST_INTERN_PROCESS_EVENTS . "_vj_" . $count . "_c_" .$countaction]);
                DBManager::Execute(true, $eventAction->GetSQL());
                if($eventAction->Type == 2 && isset($_POST[POST_INTERN_PROCESS_EVENTS . "_vj_" . $count . "_inv_a_" .$countaction]))
                {
                    $invitationSettings = @unserialize(base64_decode(Server::$Configuration->File["gl_invi"]));
                    array_walk($invitationSettings,"b64dcode");
                    $countsender = 0;
                    while(isset($_POST[POST_INTERN_PROCESS_EVENTS . "_vj_" . $count . "_inv_i_a_" .$countaction . "_" . $countsender]))
                    {
                        $eventActionInvitationSender = new EventActionSender($eventAction->Id,$_POST[POST_INTERN_PROCESS_EVENTS . "_vj_" . $count . "_inv_i_a_" .$countaction . "_" . $countsender],$_POST[POST_INTERN_PROCESS_EVENTS . "_vj_" . $count . "_inv_i_b_" .$countaction . "_" . $countsender],$_POST[POST_INTERN_PROCESS_EVENTS . "_vj_" . $count . "_inv_i_c_" .$countaction . "_" . $countsender]);
                        $eventActionInvitationSender->SaveSender();
                        $countsender++;
                    }

                    if(!empty($_POST[POST_INTERN_PROCESS_EVENTS . "_vj_" . $count . "_inv_r_" .$countaction]))
                    {
                        $eventActionInvitationSender = new EventActionSender($eventAction->Id,$_POST[POST_INTERN_PROCESS_EVENTS . "_vj_" . $count . "_inv_r_" .$countaction]);
                        $eventActionInvitationSender->SaveSender();
                    }

                }
                else if($eventAction->Type < 2)
                {
                    $countreceiver = 0;
                    while(isset($_POST[POST_INTERN_PROCESS_EVENTS . "_vj_" . $count . "_d_" .$countaction . "_" . $countreceiver]))
                    {
                        $eventActionReceiver = new EventActionReceiver($eventAction->Id,$_POST[POST_INTERN_PROCESS_EVENTS . "_vj_" . $count . "_d_" .$countaction . "_" . $countreceiver],$_POST[POST_INTERN_PROCESS_EVENTS . "_vj_" . $count . "_e_" .$countaction. "_" . $countreceiver]);
                        DBManager::Execute(true, $eventActionReceiver->GetSQL());
                        $countreceiver++;
                    }
                }
                $countaction++;
            }
        }
        $count++;
    }
    if($count>0)
    {
        CacheManager::SetDataUpdateTime(DATA_UPDATE_KEY_EVENTS);
        CacheManager::FlushKey(DATA_CACHE_KEY_EVENTS);
    }
}

function processPosts()
{
	$time = time();
	$count = -1;
	while(isset($_POST[POST_INTERN_PROCESS_POSTS . "_va" . ++$count]))
	{
		$intreceivers = array();
		$post = ($_POST[POST_INTERN_PROCESS_POSTS . "_va" . $count]);
		$rec = $_POST[POST_INTERN_PROCESS_POSTS . "_vb" . $count];
		
		if($rec == GROUP_EVERYONE_INTERN || isset(Server::$Groups[$rec]))
		{
			if($rec == GROUP_EVERYONE_INTERN || !Server::$Groups[$rec]->IsDynamic)
			{
                $npost = null;
				foreach(Server::$Operators as $internal)
					if(!$internal->IsBot && $internal->SystemId != CALLER_SYSTEM_ID)
						if($_POST[POST_INTERN_PROCESS_POSTS . "_vb" . $count] == GROUP_EVERYONE_INTERN || in_array($_POST[POST_INTERN_PROCESS_POSTS . "_vb" . $count],$internal->Groups))
							if(count(array_intersect($internal->Groups,Server::$Operators[CALLER_SYSTEM_ID]->Groups))>0 || (count(Server::$Operators[CALLER_SYSTEM_ID]->GroupsHidden)==0 && count($internal->GroupsHidden)==0))
								if($internal->Status != USER_STATUS_OFFLINE || !empty(Server::$Configuration->File["gl_ogcm"]))
								{
									$intreceivers[$internal->SystemId]=true;
									$npost = new Post($_POST[POST_INTERN_PROCESS_POSTS . "_vc" . $count],CALLER_SYSTEM_ID,$internal->SystemId,$post,$time,"",Server::$Operators[CALLER_SYSTEM_ID]->Fullname);
									$npost->Translation = $_POST[POST_INTERN_PROCESS_POSTS . "_vd" . $count];
									$npost->TranslationISO = $_POST[POST_INTERN_PROCESS_POSTS . "_ve" . $count];
									$npost->Persistent = true;
									if($_POST[POST_INTERN_PROCESS_POSTS . "_vb" . $count] == GROUP_EVERYONE_INTERN || in_array($_POST[POST_INTERN_PROCESS_POSTS . "_vb" . $count],Server::$Operators[CALLER_SYSTEM_ID]->Groups))
										$npost->ReceiverGroup = $_POST[POST_INTERN_PROCESS_POSTS . "_vb" . $count];
									$npost->Save();
								}

                if((isset(Server::$Groups[$rec]) || $rec == GROUP_EVERYONE_INTERN) && $npost != null)
                {
                    $npost->Receiver = $rec;
                    if(!(!empty(Server::$Configuration->File["gl_rm_gc"]) && empty(Server::$Configuration->File["gl_rm_gc_time"])))
                        $npost->SaveHistory();
                }
			}
			else
			{
				foreach(Server::$Groups[$rec]->Members as $member => $persistent)
				{
					if(empty(Server::$Operators[$member]))
						processPostForExternal($member,$rec,$post,$time,$count,false);
					else if($member != CALLER_SYSTEM_ID && (Server::$Operators[$member]->Status != USER_STATUS_OFFLINE || (!empty(Server::$Configuration->File["gl_ogcm"]) && !Server::$Groups[$rec]->IsDynamic)))
                        processPostForInternal($member,$post,$time,$count,$rec);
				}
			}
		}
        /*
		else if($_POST[POST_INTERN_PROCESS_POSTS . "_vb" . $count] == GROUP_EVERYONE_EXTERN)
		{
			//foreach(Server::$Operators[CALLER_SYSTEM_ID]->ExternalChats as $chat)
			{
				$npost = new Post($_POST[POST_INTERN_PROCESS_POSTS . "_vc" . $count],CALLER_SYSTEM_ID,$chat->SystemId,$post,$time,"",Server::$Operators[CALLER_SYSTEM_ID]->Fullname);
				$npost->ReceiverGroup = $chat->SystemId;
				$npost->ChatId = $chat->ChatId;
				$npost->Translation = $_POST[POST_INTERN_PROCESS_POSTS . "_vd" . $count];
				$npost->TranslationISO = $_POST[POST_INTERN_PROCESS_POSTS . "_ve" . $count];
				$npost->Save();
			}
		}
        */
		else
		{
			if(!empty(Server::$Operators[CALLER_SYSTEM_ID]->ExternalChats[$rec]))
				processPostForExternal($rec,$rec,$post,$time,$count,true);
			else if(!empty(Server::$Operators[$rec]))
            {
				$post = processPostForInternal($rec,$post,$time,$count,"");
                if(!(!empty(Server::$Configuration->File["gl_rm_oc"]) && empty(Server::$Configuration->File["gl_rm_oc_time"])))
                    $post->SaveHistory();
            }
		}
	}
}

function processPostForInternal($rec,$post,$time,$count,$rgroup)
{
	$npost = new Post($_POST[POST_INTERN_PROCESS_POSTS . "_vc" . $count],CALLER_SYSTEM_ID,$rec,$post,$time,"",Server::$Operators[CALLER_SYSTEM_ID]->Fullname);
	$npost->ReceiverGroup = $rgroup;
	$npost->Persistent = true;
	$npost->Translation = $_POST[POST_INTERN_PROCESS_POSTS . "_vd" . $count];
	$npost->TranslationISO = $_POST[POST_INTERN_PROCESS_POSTS . "_ve" . $count];

    if(isset($_POST[POST_INTERN_PROCESS_POSTS . "_vf" . $count]))
        $npost->ChatId = intval($_POST[POST_INTERN_PROCESS_POSTS . "_vf" . $count]);

	$npost->Save();
    return $npost;
}

function processPostForExternal($rec,$recgroup,$post,$time,$count,$_group=false)
{
	if(STATS_ACTIVE)
		Server::$Statistic->ProcessAction(ST_ACTION_INTERNAL_POST);

	if(!empty(Server::$Operators[CALLER_SYSTEM_ID]->ExternalChats[$rec]) && $_group)
	{
		Server::$Operators[CALLER_SYSTEM_ID]->ExternalChats[$rec]->Load();
		Server::$Operators[CALLER_SYSTEM_ID]->ExternalChats[$rec]->Members[$rec] = true;
		$chatId = Server::$Operators[CALLER_SYSTEM_ID]->ExternalChats[$rec]->ChatId;
		$receiverlist = Server::$Operators[CALLER_SYSTEM_ID]->ExternalChats[$rec]->Members;
	}
	else
	{
		$chatId = CacheManager::GetValueBySystemId($rec,"chat_id","");
		$receiverlist = array($rec=>$rec);
	}
	$npost = new Post($_POST[POST_INTERN_PROCESS_POSTS . "_vc" . $count],CALLER_SYSTEM_ID,"",$post,$time,$chatId,Server::$Operators[CALLER_SYSTEM_ID]->Fullname);
	
	foreach($receiverlist as $systemid => $member)
	{
		if($systemid==CALLER_SYSTEM_ID || !empty($member->Declined))
			continue;
			
		if(!empty(Server::$Operators[$systemid]) && !empty(Server::$Groups[$recgroup]->Members[$systemid]))
			continue;
			
		$npost->Receiver = $systemid;
		$npost->Persistent = false;
		$npost->Translation = $_POST[POST_INTERN_PROCESS_POSTS . "_vd" . $count];
		$npost->TranslationISO = $_POST[POST_INTERN_PROCESS_POSTS . "_ve" . $count];
		$npost->ReceiverGroup = $recgroup;
		$npost->ReceiverOriginal = $rec;
		$npost->Save();
		
		//Server::$Operators[CALLER_SYSTEM_ID]->SetRepostTime($npost->ReceiverGroup,$npost->Created);
	}
}

function processChatInvitation()
{
	if(isset($_POST[POST_INTERN_PROCESS_REQUESTS . "_va"]))
    {
        $visitors = explode(POST_ACTION_VALUE_SPLITTER,$_POST[POST_INTERN_PROCESS_REQUESTS . "_va"]);
        $browids = explode(POST_ACTION_VALUE_SPLITTER,$_POST[POST_INTERN_PROCESS_REQUESTS . "_vb"]);
        $reqids = explode(POST_ACTION_VALUE_SPLITTER,$_POST[POST_INTERN_PROCESS_REQUESTS . "_vd"]);
        $reqtexts = explode(POST_ACTION_VALUE_SPLITTER,($_POST[POST_INTERN_PROCESS_REQUESTS . "_ve"]));
        $sendergroup = explode(POST_ACTION_VALUE_SPLITTER,($_POST[POST_INTERN_PROCESS_REQUESTS . "_vf"]));

        foreach($reqids as $key => $requestid)
        {
            $request = new ChatRequest(CALLER_SYSTEM_ID,$sendergroup[$key],$visitors[$key],$browids[$key],base64_decode($reqtexts[$key]));
            $request->Save();

            $v = new Visitor($visitors[$key]);
            $v->ForceUpdate();
        }
    }
}

function processFilters()
{
	if(isset($_POST[POST_INTERN_PROCESS_FILTERS . "_va"]))
    {
        $creators = explode(POST_ACTION_VALUE_SPLITTER,$_POST[POST_INTERN_PROCESS_FILTERS . "_va"]);
        $createds = explode(POST_ACTION_VALUE_SPLITTER,$_POST[POST_INTERN_PROCESS_FILTERS . "_vb"]);
        $editors = explode(POST_ACTION_VALUE_SPLITTER,($_POST[POST_INTERN_PROCESS_FILTERS . "_vc"]));
        $ips = explode(POST_ACTION_VALUE_SPLITTER,$_POST[POST_INTERN_PROCESS_FILTERS . "_vd"]);
        $expiredates = explode(POST_ACTION_VALUE_SPLITTER,$_POST[POST_INTERN_PROCESS_FILTERS . "_ve"]);
        $userids = explode(POST_ACTION_VALUE_SPLITTER,$_POST[POST_INTERN_PROCESS_FILTERS . "_vf"]);
        $filternames = explode(POST_ACTION_VALUE_SPLITTER,$_POST[POST_INTERN_PROCESS_FILTERS . "_vg"]);
        $reasons = explode(POST_ACTION_VALUE_SPLITTER,($_POST[POST_INTERN_PROCESS_FILTERS . "_vh"]));
        $filterids = explode(POST_ACTION_VALUE_SPLITTER,$_POST[POST_INTERN_PROCESS_FILTERS . "_vi"]);
        $activestates = explode(POST_ACTION_VALUE_SPLITTER,$_POST[POST_INTERN_PROCESS_FILTERS . "_vj"]);
        $actiontypes = explode(POST_ACTION_VALUE_SPLITTER,$_POST[POST_INTERN_PROCESS_FILTERS . "_vk"]);
        $exertions = explode(POST_ACTION_VALUE_SPLITTER,$_POST[POST_INTERN_PROCESS_FILTERS . "_vl"]);
        $languages = explode(POST_ACTION_VALUE_SPLITTER,$_POST[POST_INTERN_PROCESS_FILTERS . "_vm"]);
        $countries = explode(POST_ACTION_VALUE_SPLITTER,$_POST[POST_INTERN_PROCESS_FILTERS . "_vp"]);
        $allowchats = explode(POST_ACTION_VALUE_SPLITTER,$_POST[POST_INTERN_PROCESS_FILTERS . "_vq"]);
        $allowtickets = explode(POST_ACTION_VALUE_SPLITTER,$_POST[POST_INTERN_PROCESS_FILTERS . "_vr"]);
        $allowtracking = explode(POST_ACTION_VALUE_SPLITTER,$_POST[POST_INTERN_PROCESS_FILTERS . "_vs"]);
        $types = (isset($_POST[POST_INTERN_PROCESS_FILTERS . "_vt"])) ? explode(POST_ACTION_VALUE_SPLITTER,$_POST[POST_INTERN_PROCESS_FILTERS . "_vt"]) : array();
        $emails = (isset($_POST[POST_INTERN_PROCESS_FILTERS . "_vu"])) ? explode(POST_ACTION_VALUE_SPLITTER,$_POST[POST_INTERN_PROCESS_FILTERS . "_vu"]) : array();
        $subjects = (isset($_POST[POST_INTERN_PROCESS_FILTERS . "_vv"])) ? explode(POST_ACTION_VALUE_SPLITTER,$_POST[POST_INTERN_PROCESS_FILTERS . "_vv"]) : array();

        foreach($filterids as $key => $id)
        {
            $filter = new Filter($filterids[$key]);
            $filter->Creator = $creators[$key];
            $filter->Created = ($createds[$key] != "0") ? $createds[$key] : time();
            $filter->Editor = $editors[$key];
            $filter->Edited = time();
            $filter->IP = $ips[$key];
            $filter->Expiredate = $expiredates[$key];
            $filter->Userid = $userids[$key];
            $filter->Reason = $reasons[$key];
            $filter->Filtername = $filternames[$key];
            $filter->Activestate = $activestates[$key];
            $filter->Exertion = $exertions[$key];
            $filter->Languages = $languages[$key];
            $filter->Countries = $countries[$key];
            $filter->AllowChats = !empty($allowchats[$key]);
            $filter->AllowTickets = !empty($allowtickets[$key]);
            $filter->AllowTracking = !empty($allowtracking[$key]);
            $filter->Type = (isset($types[$key])) ? $types[$key] : 0;
            $filter->Email = (isset($emails[$key])) ? $emails[$key] : "";
            $filter->Subject = (isset($subjects[$key])) ? $subjects[$key] : "";
            if($actiontypes[$key] == POST_ACTION_ADD || $actiontypes[$key] == POST_ACTION_EDIT)
                $filter->Save();
            else if($actiontypes[$key] == POST_ACTION_REMOVE)
                $filter->Destroy();
            else
                Logging::GeneralLog("unknown command f1");
        }
        CacheManager::SetDataUpdateTime(DATA_UPDATE_KEY_FILTERS);
        Server::ForceUpdate(array("FILTERS"));
    }
}

function processKBActions($count=0,$xml="")
{
    while(isset($_POST[POST_INTERN_PROCESS_KB . "_ca_".$count]))
    {
		// copy
		$kbe = new KnowledgeBaseEntry();
		$kbe->Load($_POST[POST_INTERN_PROCESS_KB . "_ca_".$count]);
		$kbe->Id = getId(32);
		$kbe->ParentId = $_POST[POST_INTERN_PROCESS_KB . "_cb_".$count];
		$kbe->Save();
		$count++;
	}

	$count=0;
	while(isset($_POST[POST_INTERN_PROCESS_KB . "_xa_".$count]))
    {
		// cut
		$kbe = new KnowledgeBaseEntry();
		$kbe->Load($_POST[POST_INTERN_PROCESS_KB . "_xa_".$count]);
		$kbe->ParentId = $_POST[POST_INTERN_PROCESS_KB . "_xb_".$count];
		$kbe->Save();
		$count++;
	}

	$count = 0;
    while(isset($_POST[POST_INTERN_PROCESS_KB . "_va_".$count]))
    {
        $kbe = new KnowledgeBaseEntry();
        $kbe->EditorId = $kbe->OwnerId = CALLER_SYSTEM_ID;
        $kbe->Id = $_POST[POST_INTERN_PROCESS_KB . "_va_".$count];
        $kbe->Value = base64_decode($_POST[POST_INTERN_PROCESS_KB . "_vb_".$count]);
        $kbe->Type = $_POST[POST_INTERN_PROCESS_KB . "_vc_".$count];
        $kbe->Title = base64_decode($_POST[POST_INTERN_PROCESS_KB . "_vd_".$count]);
        $kbe->IsDiscarded = !empty($_POST[POST_INTERN_PROCESS_KB . "_ve_".$count]);
        $kbe->ParentId = $_POST[POST_INTERN_PROCESS_KB . "_vf_".$count];
        $kbe->Rank = $_POST[POST_INTERN_PROCESS_KB . "_vg_".$count];
        $kbe->Size = $_POST[POST_INTERN_PROCESS_KB . "_vh_".$count];
        $kbe->Tags = $_POST[POST_INTERN_PROCESS_KB . "_vi_".$count];

        if(isset($_POST[POST_INTERN_PROCESS_KB . "_vj_".$count]))
            $kbe->Languages = $_POST[POST_INTERN_PROCESS_KB . "_vj_".$count];

        $kbe->Tags = $_POST[POST_INTERN_PROCESS_KB . "_vi_".$count];
        $kbe->IsPublic = !empty($_POST[POST_INTERN_PROCESS_KB . "_vk_".$count]);
        $kbe->FulltextSearch = !empty($_POST[POST_INTERN_PROCESS_KB . "_vl_".$count]);

        if(isset($_POST[POST_INTERN_PROCESS_KB . "_vm_".$count]))
            $kbe->ShortcutWord = $_POST[POST_INTERN_PROCESS_KB . "_vm_".$count];

        $kbe->AllowBotAccess = !empty($_POST[POST_INTERN_PROCESS_KB . "_vn_".$count]);

        if(isset($_POST[POST_INTERN_PROCESS_KB . "_vp_".$count]))
            $kbe->GroupId = $_POST[POST_INTERN_PROCESS_KB . "_vp_".$count];

        $kbe->OwnerId = $_POST[POST_INTERN_PROCESS_KB . "_vq_".$count];

        if(isset($_POST[POST_INTERN_PROCESS_KB . "_vo_".$count]) && !empty($_POST[POST_INTERN_PROCESS_KB . "_vo_".$count]) && strlen($_POST[POST_INTERN_PROCESS_KB . "_vo_".$count]) >= 8 && $_POST[POST_INTERN_PROCESS_KB . "_vo_".$count] != $kbe->Id)
            $kbe->ChangeId($_POST[POST_INTERN_PROCESS_KB . "_vo_".$count]);

        $kbe->Save();

        if($kbe->IsDiscarded)
            $kbe->RemoveSubs();

        $xml .= "<r rid=\"".base64_encode($kbe->Id)."\" disc=\"".base64_encode($_POST[POST_INTERN_PROCESS_KB . "_ve_".$count])."\" />\r\n";
        $count++;
    }
    Server::$Response->SetStandardResponse(1,$xml);
}

function processReceivedPosts()
{
	if(isset($_POST[POST_INTERN_PROCESS_RECEIVED_POSTS]))
    {
    	$pids = explode(POST_ACTION_VALUE_SPLITTER,$_POST[POST_INTERN_PROCESS_RECEIVED_POSTS]);
        foreach($pids as $id)
        {
            $post = new Post($id,"","","","","","");
            $post->UpdatePostStatus(CALLER_SYSTEM_ID, true);
        }
    }
}

function processCancelInvitation()
{
	if(isset($_POST[POST_INTERN_PROCESS_CANCEL_INVITATION]))
	{
		$users = explode(POST_ACTION_VALUE_SPLITTER,utf8_decode($_POST[POST_INTERN_PROCESS_CANCEL_INVITATION]));
		foreach($users as $uid)
		{
			DBManager::Execute(true, "UPDATE `" . DB_PREFIX . DATABASE_CHAT_REQUESTS . "` SET `closed`=1,`canceled`='" . DBManager::RealEscape(CALLER_SYSTEM_ID) . "' WHERE `canceled`='' AND `accepted`=0 AND `declined`=0 AND `receiver_user_id`='" . DBManager::RealEscape($uid) . "';");
            $v = new Visitor($uid);
            $v->ForceUpdate();
        }
	}
}

function processGoals($count = 0)
{
    if(isset($_POST[POST_INTERN_PROCESS_GOALS . "_va_" .$count]))
	{
		DBManager::Execute(true, "TRUNCATE TABLE `" . DB_PREFIX . DATABASE_GOALS . "`;");
        if(isset($_POST[POST_INTERN_PROCESS_GOALS . "_vb_" .$count]))
            while(isset($_POST[POST_INTERN_PROCESS_GOALS . "_va_" .$count]))
            {
                DBManager::Execute(true, "INSERT INTO `" . DB_PREFIX . DATABASE_GOALS . "` (`id`, `title`, `description`, `conversion`, `ind`) VALUES ('" . DBManager::RealEscape($_POST[POST_INTERN_PROCESS_GOALS . "_vb_" . $count]) . "', '" . DBManager::RealEscape($_POST[POST_INTERN_PROCESS_GOALS . "_vd_" . $count]) . "', '" . DBManager::RealEscape($_POST[POST_INTERN_PROCESS_GOALS . "_vc_" . $count]) . "', '" . DBManager::RealEscape($_POST[POST_INTERN_PROCESS_GOALS . "_ve_" . $count]) . "','" . DBManager::RealEscape($count) . "');");
                $count++;
            }
        DBManager::Execute(true, "DELETE FROM `" . DB_PREFIX . DATABASE_EVENT_GOALS . "` WHERE NOT EXISTS (SELECT * FROM `" . DB_PREFIX . DATABASE_GOALS . "` WHERE `id` = `" . DB_PREFIX . DATABASE_EVENT_GOALS . "`.`goal_id`);");
        CacheManager::FlushKey(DATA_CACHE_KEY_DBCONFIG);
		Server::$Response->SetStandardResponse(1,"");
	}
}

function processAutoReplies($count = 0)
{
    /*
	while(isset($_POST["p_bfl_va_" .$count]))
	{
		DBManager::Execute(false, "DELETE FROM `" . DB_PREFIX . DATABASE_AUTO_REPLIES . "` WHERE `owner_id`='" . DBManager::RealEscape($_POST["p_bfl_va_" . $count]) . "';");
		$icount = 0;
		while(isset($_POST["p_bfl_vb_" .$count."_".$icount]))
		{
			$item = new ChatAutoReply($_POST["p_bfl_vb_" .$count."_".$icount],$_POST["p_bfl_vc_" .$count."_".$icount],$_POST["p_bfl_ve_" .$count."_".$icount],$_POST["p_bfl_vd_" .$count."_".$icount],$_POST["p_bfl_vf_" .$count."_".$icount],!empty($_POST["p_bfl_vg_" .$count."_".$icount]),$_POST["p_bfl_vh_" .$count."_".$icount],!empty($_POST["p_bfl_vi_" .$count."_".$icount]),!empty($_POST["p_bfl_vj_" .$count."_".$icount]),$_POST["p_bfl_vti_" .$count."_".$icount],$_POST["p_bfl_vte_" .$count."_".$icount],!empty($_POST["p_bfl_vcc_" .$count."_".$icount]),$_POST["p_bfl_vt_" .$count."_".$icount]);
			$item->Save($_POST["p_bfl_va_" .$count]);
			$icount++;
		}
		$count++;
	}
    if($count > 0)
        CacheManager::FlushKey(DATA_CACHE_KEY_OPERATORS);
    */
}

function processTicketActions($count=0)
{
    $temporaryIds = array();
    $updateRequiredTickets=$updateRequiredEmails=false;
	while(isset($_POST[POST_INTERN_PROCESS_TICKET_ACTIONS . "_" . $count . "_vc"]))
	{
		$type = $_POST[POST_INTERN_PROCESS_TICKET_ACTIONS . "_" . $count . "_vc"];
		if($type == "SetTicketStatus")
		{
            $Ticket = new Ticket(true);
            $Ticket->Id = $_POST[POST_INTERN_PROCESS_TICKET_ACTIONS . "_" . $count . "_va"];
            $Ticket->Load();
            $Ticket->ApplyAttributesFromPost($count);

            if($_POST[POST_INTERN_PROCESS_TICKET_ACTIONS . "_" . $count . "_vd_0"] != $_POST[POST_INTERN_PROCESS_TICKET_ACTIONS . "_" . $count . "_vd_2"])
                $Ticket->Log(0,CALLER_SYSTEM_ID,$_POST[POST_INTERN_PROCESS_TICKET_ACTIONS . "_" . $count . "_vd_0"],$_POST[POST_INTERN_PROCESS_TICKET_ACTIONS . "_" . $count . "_vd_2"]);
            if(!empty($_POST[POST_INTERN_PROCESS_TICKET_ACTIONS . "_" . $count . "_vb"]) && $_POST[POST_INTERN_PROCESS_TICKET_ACTIONS . "_" . $count . "_vb"] != $_POST[POST_INTERN_PROCESS_TICKET_ACTIONS . "_" . $count . "_vd_3"])
                $Ticket->Log(2,CALLER_SYSTEM_ID,$_POST[POST_INTERN_PROCESS_TICKET_ACTIONS . "_" . $count . "_vb"],$_POST[POST_INTERN_PROCESS_TICKET_ACTIONS . "_" . $count . "_vd_3"]);
            if($_POST[POST_INTERN_PROCESS_TICKET_ACTIONS . "_" . $count . "_vd_1"] != $_POST[POST_INTERN_PROCESS_TICKET_ACTIONS . "_" . $count . "_vd_4"])
                $Ticket->Log(3,CALLER_SYSTEM_ID,$_POST[POST_INTERN_PROCESS_TICKET_ACTIONS . "_" . $count . "_vd_1"],$_POST[POST_INTERN_PROCESS_TICKET_ACTIONS . "_" . $count . "_vd_4"]);
            if(isset($_POST[POST_INTERN_PROCESS_TICKET_ACTIONS . "_" . $count . "_vs"]) && $Ticket->Editor != null && $Ticket->Editor->SubStatus != $_POST[POST_INTERN_PROCESS_TICKET_ACTIONS . "_" . $count . "_vs"])
                $Ticket->Log(26,CALLER_SYSTEM_ID,$_POST[POST_INTERN_PROCESS_TICKET_ACTIONS . "_" . $count . "_vs"],$Ticket->Editor->SubStatus);
            if(isset($_POST[POST_INTERN_PROCESS_TICKET_ACTIONS . "_" . $count . "_vu"]) && $Ticket->SubChannel != $_POST[POST_INTERN_PROCESS_TICKET_ACTIONS . "_" . $count . "_vu"])
                $Ticket->Log(27,CALLER_SYSTEM_ID,$_POST[POST_INTERN_PROCESS_TICKET_ACTIONS . "_" . $count . "_vu"],$Ticket->SubChannel);
            if(isset($_POST[POST_INTERN_PROCESS_TICKET_ACTIONS . "_" . $count . "_vt"]) && $Ticket->Channel != $_POST[POST_INTERN_PROCESS_TICKET_ACTIONS . "_" . $count . "_vt"])
                $Ticket->Log(29,CALLER_SYSTEM_ID,$_POST[POST_INTERN_PROCESS_TICKET_ACTIONS . "_" . $count . "_vt"],$Ticket->Channel);

            $TicketEditor = new TicketEditor($_POST[POST_INTERN_PROCESS_TICKET_ACTIONS . "_" . $count . "_va"]);
            if(!empty($_POST[POST_INTERN_PROCESS_TICKET_ACTIONS . "_" . $count . "_vb"]))
                $TicketEditor->Editor = $_POST[POST_INTERN_PROCESS_TICKET_ACTIONS . "_" . $count . "_vb"];
			$TicketEditor->Status = $_POST[POST_INTERN_PROCESS_TICKET_ACTIONS . "_" . $count . "_vd_0"];
            $TicketEditor->GroupId = $_POST[POST_INTERN_PROCESS_TICKET_ACTIONS . "_" . $count . "_vd_1"];
            $TicketEditor->ApplyAttributesFromPost($count);
            $TicketEditor->Save();

            if($_POST[POST_INTERN_PROCESS_TICKET_ACTIONS . "_" . $count . "_vd_1"] != $_POST[POST_INTERN_PROCESS_TICKET_ACTIONS . "_" . $count . "_vd_4"])
                $Ticket->SetGroup($_POST[POST_INTERN_PROCESS_TICKET_ACTIONS . "_" . $count . "_vd_1"]);
            $Ticket->Editor = $TicketEditor;
            $Ticket->LoadMessages();
            $time = SystemTime::GetUniqueMessageTime(DATABASE_TICKETS,"last_update");
            $Ticket->SetLastUpdate($time);
            $updateRequiredTickets = true;
		}
		else if($type == "AddTicketEditorReply")
		{
			$Ticket = new Ticket($_POST[POST_INTERN_PROCESS_TICKET_ACTIONS . "_" . $count . "_va"],$_POST[POST_INTERN_PROCESS_TICKET_ACTIONS . "_" . $count . "_vd_3"]);
            $Ticket->Load(false,false);
			$Ticket->Group = $_POST[POST_INTERN_PROCESS_TICKET_ACTIONS . "_" . $count . "_vd_4"];
            $Ticket->Messages[0]->Id = $_POST[POST_INTERN_PROCESS_TICKET_ACTIONS . "_" . $count . "_vd_7"];
            $Ticket->Messages[0]->ChannelId = getId(32);
            $Ticket->Messages[0]->Hash = $Ticket->GetHash(false);
			$Ticket->Messages[0]->SenderUserId = $_POST[POST_INTERN_PROCESS_TICKET_ACTIONS . "_" . $count . "_vb"];
			$Ticket->Messages[0]->Type = 1;
			$Ticket->Messages[0]->Email = $_POST[POST_INTERN_PROCESS_TICKET_ACTIONS . "_" . $count . "_vd_1"];
			$Ticket->Messages[0]->Text = $_POST[POST_INTERN_PROCESS_TICKET_ACTIONS . "_" . $count . "_vd_0"];

            if($Ticket->Channel >= 6 && !empty($Ticket->ChannelId))
            {
                $twchannel = SocialMediaChannel::GetChannelById($Ticket->ChannelId);
                if($Ticket->Channel == 7 && $twchannel->StreamType == 1)
                    $Ticket->Messages[0]->Text = $twchannel->AddScreenName($Ticket->Messages[0]->Text,$Ticket->Messages[0]->Email);
                else if($Ticket->Channel == 6)
                    $Ticket->Messages[0]->Email = $twchannel->PageId;
            }

            $Ticket->Messages[0]->Subject = $_POST[POST_INTERN_PROCESS_TICKET_ACTIONS . "_" . $count . "_vd_5"];
			$Ticket->Messages[0]->Save($_POST[POST_INTERN_PROCESS_TICKET_ACTIONS . "_" . $count . "_va"],time());
			
			$acount=8;
			while(isset($_POST[POST_INTERN_PROCESS_TICKET_ACTIONS . "_" . $count . "_vd_" . $acount]))
				$Ticket->Messages[0]->ApplyAttachment($_POST[POST_INTERN_PROCESS_TICKET_ACTIONS . "_" . $count . "_vd_" . $acount++]);
            $Ticket->SendOperatorReply($Ticket->Messages[0]->Id,$_POST[POST_INTERN_PROCESS_TICKET_ACTIONS . "_" . $count . "_vd_2"],$_POST[POST_INTERN_PROCESS_TICKET_ACTIONS . "_" . $count . "_vd_6"]);

            if(!empty($_POST[POST_INTERN_PROCESS_TICKET_ACTIONS . "_" . $count . "_ctor"]))
            {
                $Ticket->LoadStatus();
                $Ticket->Editor->Status = TICKET_STATUS_CLOSED;
                $Ticket->Editor->Save();
            }

            $Ticket->SetLastUpdate(time());
            $updateRequiredTickets=true;
        }
        else if($type == "SetTicketLanguage")
        {
            $Ticket = new Ticket($_POST[POST_INTERN_PROCESS_TICKET_ACTIONS . "_" . $count . "_vd_0"],$_POST[POST_INTERN_PROCESS_TICKET_ACTIONS . "_" . $count . "_vd_1"]);
            $Ticket->LoadMessages();
            $Ticket->SetLanguage($_POST[POST_INTERN_PROCESS_TICKET_ACTIONS . "_" . $count . "_vd_1"]);
            $Ticket->Log(1,CALLER_SYSTEM_ID,$_POST[POST_INTERN_PROCESS_TICKET_ACTIONS . "_" . $count . "_vd_1"],$_POST[POST_INTERN_PROCESS_TICKET_ACTIONS . "_" . $count . "_vd_2"]);
            $Ticket->SetLastUpdate(time());
            $updateRequiredTickets=true;
        }
        else if($type == "DeleteTicketFromServer")
        {
            $Ticket = new Ticket($_POST[POST_INTERN_PROCESS_TICKET_ACTIONS . "_" . $count . "_vd_0"],"");
            $Ticket->Destroy();
            $Ticket->Log(7,CALLER_SYSTEM_ID,0,1);
            $Ticket->SetLastUpdate(time());
            $updateRequiredTickets=true;
        }
        else if($type == "AddToWatchList")
        {
            $Ticket = new Ticket($_POST[POST_INTERN_PROCESS_TICKET_ACTIONS . "_" . $count . "_vd_0"],"");
            $Ticket->AddToWatchList($_POST[POST_INTERN_PROCESS_TICKET_ACTIONS . "_" . $count . "_vd_1"]);
            $updateRequiredTickets=true;
        }
        else if($type == "RemoveFromWatchList")
        {
            $Ticket = new Ticket($_POST[POST_INTERN_PROCESS_TICKET_ACTIONS . "_" . $count . "_vd_0"],"");
            $Ticket->RemoveFromWatchList(CALLER_SYSTEM_ID);
            $updateRequiredTickets=true;
        }
        else if($type == "SetPriority")
        {
            $Ticket = new Ticket($_POST[POST_INTERN_PROCESS_TICKET_ACTIONS . "_" . $count . "_vd_0"],"");
            $Ticket->Load();
            if($Ticket->Priority != $_POST[POST_INTERN_PROCESS_TICKET_ACTIONS . "_" . $count . "_vd_1"])
                $Ticket->Log(28,CALLER_SYSTEM_ID,$_POST[POST_INTERN_PROCESS_TICKET_ACTIONS . "_" . $count . "_vd_1"],$Ticket->Priority);
            $Ticket->SetPriority($_POST[POST_INTERN_PROCESS_TICKET_ACTIONS . "_" . $count . "_vd_1"]);
            $Ticket->SetLastUpdate(time(),false);
            $updateRequiredTickets=true;
        }
        else if($type == "AddComment")
        {
            $Ticket = new TicketMessage($_POST[POST_INTERN_PROCESS_TICKET_ACTIONS . "_" . $count . "_vd_1"],"");
            $Ticket->AddComment(CALLER_SYSTEM_ID,$_POST[POST_INTERN_PROCESS_TICKET_ACTIONS . "_" . $count . "_vd_0"],$_POST[POST_INTERN_PROCESS_TICKET_ACTIONS . "_" . $count . "_vd_2"]);
            $Ticket = new Ticket($_POST[POST_INTERN_PROCESS_TICKET_ACTIONS . "_" . $count . "_vd_2"],"");
            $Ticket->SetLastUpdate(time());
            $updateRequiredTickets=true;
        }
        else if($type == "LinkChat")
        {
            if(!empty($temporaryIds[$_POST[POST_INTERN_PROCESS_TICKET_ACTIONS . "_" . $count . "_vd_0"]]))
                $_POST[POST_INTERN_PROCESS_TICKET_ACTIONS . "_" . $count . "_vd_0"] = $temporaryIds[$_POST[POST_INTERN_PROCESS_TICKET_ACTIONS . "_" . $count . "_vd_0"]];

            $Ticket = new Ticket($_POST[POST_INTERN_PROCESS_TICKET_ACTIONS . "_" . $count . "_vd_0"],"");
            $Ticket->LinkChat($_POST[POST_INTERN_PROCESS_TICKET_ACTIONS . "_" . $count . "_vd_1"], getId(32));
            $Ticket->Log(5,CALLER_SYSTEM_ID,$_POST[POST_INTERN_PROCESS_TICKET_ACTIONS . "_" . $count . "_vd_0"],$_POST[POST_INTERN_PROCESS_TICKET_ACTIONS . "_" . $count . "_vd_1"]);
            $Ticket->SetLastUpdate(time());
            $updateRequiredTickets=true;
        }
        else if($type == "LinkTicket")
        {
            $Ticket = new Ticket($_POST[POST_INTERN_PROCESS_TICKET_ACTIONS . "_" . $count . "_vd_0"],"");
            $TicketSub = new Ticket($_POST[POST_INTERN_PROCESS_TICKET_ACTIONS . "_" . $count . "_vd_1"],"");
            $counts[$Ticket->Id]=Ticket::GetMessageCount($Ticket->Id);
            $counts[$TicketSub->Id]=Ticket::GetMessageCount($TicketSub->Id);
            if($counts[$Ticket->Id] > $counts[$TicketSub->Id])
                $Ticket->LinkTicket($TicketSub->Id, getId(32));
            else
                $TicketSub->LinkTicket($Ticket->Id, getId(32));
            $Ticket->SetLastUpdate(time());
            $updateRequiredTickets=true;
        }
        else if($type == "EditMessage")
        {
            $ticket = new Ticket($_POST[POST_INTERN_PROCESS_TICKET_ACTIONS . "_" . $count . "_vd_1"],"");
            $ticket->LoadStatus();
            $message = new TicketMessage($_POST[POST_INTERN_PROCESS_TICKET_ACTIONS . "_" . $count . "_vd_0"],"");
            $message->Load();
            $message->ChangeValue($ticket,10,CALLER_SYSTEM_ID,$message->Fullname,$_POST[POST_INTERN_PROCESS_TICKET_ACTIONS . "_" . $count . "_vd_2"]);
            $message->ChangeValue($ticket,11,CALLER_SYSTEM_ID,$message->Email,$_POST[POST_INTERN_PROCESS_TICKET_ACTIONS . "_" . $count . "_vd_3"]);
            $message->ChangeValue($ticket,12,CALLER_SYSTEM_ID,$message->Company,$_POST[POST_INTERN_PROCESS_TICKET_ACTIONS . "_" . $count . "_vd_4"]);
            $message->ChangeValue($ticket,13,CALLER_SYSTEM_ID,$message->Phone,$_POST[POST_INTERN_PROCESS_TICKET_ACTIONS . "_" . $count . "_vd_5"]);
            $message->ChangeValue($ticket,14,CALLER_SYSTEM_ID,$message->Subject,$_POST[POST_INTERN_PROCESS_TICKET_ACTIONS . "_" . $count . "_vd_6"]);
            $message->ChangeValue($ticket,15,CALLER_SYSTEM_ID,$message->Text,$_POST[POST_INTERN_PROCESS_TICKET_ACTIONS . "_" . $count . "_vd_7"]);
            $message->ApplyCustomFromPost($count,true,$ticket,CALLER_SYSTEM_ID);
            $message->Save($_POST[POST_INTERN_PROCESS_TICKET_ACTIONS . "_" . $count . "_vd_1"],true);
            $ticket->SetLastUpdate(time(),false);
            $updateRequiredTickets=true;

            if($ticket->Editor != null)
                $ticket->Editor->Save();
        }
		else if($type == "CreateTicket")
		{
			$Ticket = new Ticket(CacheManager::GetObjectId("ticket_id",DATABASE_TICKETS),"");
            $temporaryIds[$_POST[POST_INTERN_PROCESS_TICKET_ACTIONS . "_" . $count . "_vd_11"]] = $Ticket->Id;
			$Ticket->Messages[0]->Id = $Ticket->Id;
            $Ticket->Messages[0]->ChannelId = $_POST[POST_INTERN_PROCESS_TICKET_ACTIONS . "_" . $count . "_vd_4"];
			$Ticket->Channel = $_POST[POST_INTERN_PROCESS_TICKET_ACTIONS . "_" . $count . "_vd_3"];
			$Ticket->Group = $_POST[POST_INTERN_PROCESS_TICKET_ACTIONS . "_" . $count . "_vd_6"];
            $Ticket->Language = strtoupper(trim($_POST[POST_INTERN_PROCESS_TICKET_ACTIONS . "_" . $count . "_vd_10"]));
            $Ticket->Messages[0]->Fullname = $_POST[POST_INTERN_PROCESS_TICKET_ACTIONS . "_" . $count . "_vd_0"];
            $Ticket->Messages[0]->Email = $_POST[POST_INTERN_PROCESS_TICKET_ACTIONS . "_" . $count . "_vd_1"];
            $Ticket->Messages[0]->Text = $_POST[POST_INTERN_PROCESS_TICKET_ACTIONS . "_" . $count . "_vd_2"];
            $Ticket->Messages[0]->Company = $_POST[POST_INTERN_PROCESS_TICKET_ACTIONS . "_" . $count . "_vd_7"];
            $Ticket->Messages[0]->Phone = $_POST[POST_INTERN_PROCESS_TICKET_ACTIONS . "_" . $count . "_vd_8"];
            $Ticket->Messages[0]->Type = $_POST[POST_INTERN_PROCESS_TICKET_ACTIONS . "_" . $count . "_vd_9"];
            $Ticket->Messages[0]->Subject = $_POST[POST_INTERN_PROCESS_TICKET_ACTIONS . "_" . $count . "_vd_15"];
            $Ticket->Messages[0]->ApplyCustomFromPost($count);
            $cid = 0;
			while(isset($_POST[POST_INTERN_PROCESS_TICKET_ACTIONS . "_" . $count . "_vd_" . $cid]))
            {
                $value = $_POST[POST_INTERN_PROCESS_TICKET_ACTIONS . "_" . $count . "_vd_" . $cid++];
                if(strpos($value,"[att]") === 0)
				    $Ticket->Messages[0]->ApplyAttachment(base64_decode(str_replace("[att]","",$value)));
                else if(strpos($value,"[com]") === 0)
                    $Ticket->Messages[0]->AddComment(CALLER_SYSTEM_ID,$Ticket->Id,base64_decode(str_replace("[com]","",$value)));
            }
            $Ticket->Messages[0]->LoadAttachments();
            if(!empty($_POST[POST_INTERN_PROCESS_TICKET_ACTIONS . "_" . $count . "_vd_4"]))
            {
                $email = new TicketEmail($_POST[POST_INTERN_PROCESS_TICKET_ACTIONS . "_" . $count . "_vd_4"],false,"");
                $email->Load();
                $email->LoadAttachments();
                foreach($email->Attachments as $rid => $res)
                    if(empty($Ticket->Messages[0]->Attachments[$rid]))
                        KnowledgeBase::Process(CALLER_SYSTEM_ID, $rid, "", RESOURCE_TYPE_FILE_INTERNAL, "", true, 100, 0);
                $email->Destroy();
                if(!empty($email->Created))
                    $Ticket->Messages[0]->Created = $email->Created;
            }

            $Ticket->Log(6,CALLER_SYSTEM_ID,$Ticket->Id,"");

            if(isset($_POST[POST_INTERN_PROCESS_TICKET_ACTIONS . "_" . $count . "_vx"]))
                $Ticket->Priority = $_POST[POST_INTERN_PROCESS_TICKET_ACTIONS . "_" . $count . "_vx"];

            if(isset($_POST[POST_INTERN_PROCESS_TICKET_ACTIONS . "_" . $count . "_vy"]))
                $Ticket->SenderUserId = $_POST[POST_INTERN_PROCESS_TICKET_ACTIONS . "_" . $count . "_vy"];

			$Ticket->Save();
            $Ticket->ApplyAttributesFromPost($count);
            $TicketEditor = new TicketEditor($Ticket->Id);
            $TicketEditor->Editor = $_POST[POST_INTERN_PROCESS_TICKET_ACTIONS . "_" . $count . "_vd_13"];
            $TicketEditor->Status = $_POST[POST_INTERN_PROCESS_TICKET_ACTIONS . "_" . $count . "_vd_12"];
            $TicketEditor->GroupId = $_POST[POST_INTERN_PROCESS_TICKET_ACTIONS . "_" . $count . "_vd_14"];
            $TicketEditor->ApplyAttributesFromPost($count);
            $TicketEditor->Save();
            $Ticket->SetLastUpdate(time());
            $updateRequiredTickets=true;
        }
		else if($type == "SetEmailStatus")
		{
			$Email = new TicketEmail($_POST[POST_INTERN_PROCESS_TICKET_ACTIONS . "_" . $count . "_vd_0"],$_POST[POST_INTERN_PROCESS_TICKET_ACTIONS . "_" . $count . "_vd_1"],$_POST[POST_INTERN_PROCESS_TICKET_ACTIONS . "_" . $count . "_vd_2"]);
			$Email->SetStatus();
            $updateRequiredEmails=true;
		}
        else if($type == "ForwardMessage")
        {
            $message = new TicketMessage($_POST[POST_INTERN_PROCESS_TICKET_ACTIONS . "_" . $count . "_vd_0"],"");
            $message->Load();
            $message->Forward($_POST[POST_INTERN_PROCESS_TICKET_ACTIONS . "_" . $count . "_vd_1"],$_POST[POST_INTERN_PROCESS_TICKET_ACTIONS . "_" . $count . "_vd_2"],$_POST[POST_INTERN_PROCESS_TICKET_ACTIONS . "_" . $count . "_vd_3"],$_POST[POST_INTERN_PROCESS_TICKET_ACTIONS . "_" . $count . "_vd_4"]);
            $ticket = new Ticket($_POST[POST_INTERN_PROCESS_TICKET_ACTIONS . "_" . $count . "_vd_5"],"");
            $ticket->Log(9,CALLER_SYSTEM_ID,$message->Id,$_POST[POST_INTERN_PROCESS_TICKET_ACTIONS . "_" . $count . "_vd_2"]);
        }
        else if($type == "MoveMessageIntoTicket")
        {
            $message = new TicketMessage($_POST[POST_INTERN_PROCESS_TICKET_ACTIONS . "_" . $count . "_vd_1"],"");
            $message->Load(true);
            $message->ChannelId = getId(32);
            $ticket = new Ticket($_POST[POST_INTERN_PROCESS_TICKET_ACTIONS . "_" . $count . "_vd_0"],"");
            $ticket->Load();
            $ticket->Id = $message->Id = CacheManager::GetObjectId("ticket_id",DATABASE_TICKETS);
            $ticket->Messages = array();
            $ticket->Messages[0] = $message;
            $ticket->Save();
            $ticket->Log(8,CALLER_SYSTEM_ID,$ticket->Id,$_POST[POST_INTERN_PROCESS_TICKET_ACTIONS . "_" . $count . "_vd_0"]);
            $ticket->SetLastUpdate(time());
            $message->SaveAttachments();
            $message->SaveComments($ticket->Id);
            $updateRequiredTickets=true;
        }
		else if($type == "DeleteAttachment")
		{
			KnowledgeBase::Process(CALLER_SYSTEM_ID, $_POST[POST_INTERN_PROCESS_TICKET_ACTIONS . "_" . $count . "_vd_0"], "", RESOURCE_TYPE_FILE_INTERNAL, "", true, "100");
		}
		$count++;
	}

    if($updateRequiredTickets)
        CacheManager::SetDataUpdateTime(DATA_UPDATE_KEY_TICKETS);
    if($updateRequiredEmails)
        CacheManager::SetDataUpdateTime(DATA_UPDATE_KEY_EMAILS);
}

function processButtonIcons()
{
    if(!empty($_POST[POST_INTERN_PROCESS_IMAGE_SET . "_ve"]))
    {
        DBManager::Execute(true, "DELETE FROM `" . DB_PREFIX . DATABASE_IMAGES . "`  WHERE `id`='" . DBManager::RealEscape($_POST[POST_INTERN_PROCESS_IMAGE_SET . "_ve"]) . "' AND `button_type`='" . DBManager::RealEscape($_POST[POST_INTERN_PROCESS_IMAGE_SET . "_vf"]) . "' LIMIT 2;");
        if(!empty($_POST[POST_INTERN_PROCESS_IMAGE_SET . "_vb"]))
        {
            DBManager::Execute(true, "INSERT INTO `" . DB_PREFIX . DATABASE_IMAGES . "` (`id`,`online`,`button_type`,`image_type`,`data`) VALUES ('" . DBManager::RealEscape($_POST[POST_INTERN_PROCESS_IMAGE_SET . "_ve"]) . "',1,'" . DBManager::RealEscape($_POST[POST_INTERN_PROCESS_IMAGE_SET . "_vf"]) . "','" . DBManager::RealEscape($_POST[POST_INTERN_PROCESS_IMAGE_SET . "_vb"]) . "','" . DBManager::RealEscape($_POST[POST_INTERN_PROCESS_IMAGE_SET . "_va"]) . "');");
            DBManager::Execute(true, "INSERT INTO `" . DB_PREFIX . DATABASE_IMAGES . "` (`id`,`online`,`button_type`,`image_type`,`data`) VALUES ('" . DBManager::RealEscape($_POST[POST_INTERN_PROCESS_IMAGE_SET . "_ve"]) . "',0,'" . DBManager::RealEscape($_POST[POST_INTERN_PROCESS_IMAGE_SET . "_vf"]) . "','" . DBManager::RealEscape($_POST[POST_INTERN_PROCESS_IMAGE_SET . "_vd"]) . "','" . DBManager::RealEscape($_POST[POST_INTERN_PROCESS_IMAGE_SET . "_vc"]) . "');");
        }
    }
}

function processChatActions()
{
	$count = 0;
	while(isset($_POST[POST_INTERN_PROCESS_CHAT_ACTION . "_" . $count . "_va"]))
	{
		$type = $_POST[POST_INTERN_PROCESS_CHAT_ACTION . "_" . $count . "_vd"];
		if($type == "OperatorSignOff")
		{
			$op = Server::$Operators[$_POST[POST_INTERN_PROCESS_CHAT_ACTION . "_" . $count . "_ve_0"]];
			$op->SignOff();
            Server::ForceUpdate(array("INTERNAL","GROUPS"));
		}
		else if($type == "SendChatTranscriptTo")
		{
			$value = 1;
			while(!empty($_POST[POST_INTERN_PROCESS_CHAT_ACTION . "_" . $count . "_ve_" . $value]))
			{
				$result = DBManager::Execute(false, "SELECT * FROM `" . DB_PREFIX . DATABASE_CHAT_ARCHIVE . "` WHERE `chat_id`='" . DBManager::RealEscape($_POST[POST_INTERN_PROCESS_CHAT_ACTION . "_" . $count . "_ve_" . $value]) . "' LIMIT 1;");
                if($result)
                    if($row = DBManager::FetchArray($result))
                        Communication::SendChatTranscript($row,true,$_POST[POST_INTERN_PROCESS_CHAT_ACTION . "_" . $count . "_ve_0"]);
                $value++;
			}
		}
		else if($type == "CreatePublicGroup")
		{
			$room = new UserGroup();
			$room->IsDynamic = true;
			$room->Id = $_POST[POST_INTERN_PROCESS_CHAT_ACTION . "_" . $count . "_ve_0"];
			$room->Descriptions["EN"] = $_POST[POST_INTERN_PROCESS_CHAT_ACTION . "_" . $count . "_ve_1"];
			$room->Owner = $_POST[POST_INTERN_PROCESS_CHAT_ACTION . "_" . $count . "_ve_2"];
			$room->Save();
            $room->AddMember($_POST[POST_INTERN_PROCESS_CHAT_ACTION . "_" . $count . "_ve_2"], false);
            Server::ForceUpdate(array("INTERNAL","GROUPS"));
		}
        else if($type == "SetVisitorDetails")
        {
            $ud = new UserData();
            $ud->LoadFromPassThru();
            $visitor = new Visitor($_POST['p_vi_id']);
            $visitor->VisitorData = $ud;
            $visitor->ApplyVisitorData();
            Server::ForceUpdate(array("VISITOR"));
        }
        else if($type=="ReloadEmails")
        {
            Mailbox::ResetDownloadTime();
            Server::SetCronjobTime("gl_cj_email_in",0);
            SocialMediaChannel::ResetDownloadTime();
            Server::SetCronjobTime("gl_cj_sm_in",0);
        }
		else if($type == "DeletePublicGroup")
		{
			$room = new UserGroup();
			$room->Id = $_POST[POST_INTERN_PROCESS_CHAT_ACTION . "_" . $count . "_ve_0"];
			$room->Destroy();
            Server::ForceUpdate(array("INTERNAL","GROUPS"));
		}
		else if($type == "JoinPublicGroup")
		{
            $room = new UserGroup();
            $room->Id = $_POST[POST_INTERN_PROCESS_CHAT_ACTION . "_" . $count . "_ve_0"];
            $room->AddMember($_POST[POST_INTERN_PROCESS_CHAT_ACTION . "_" . $count . "_ve_2"], false);
            Server::ForceUpdate(array("INTERNAL","GROUPS"));

            if(strpos($_POST[POST_INTERN_PROCESS_CHAT_ACTION . "_" . $count . "_ve_2"],'~') !== false)
            {
                $parts = explode('~',$_POST[POST_INTERN_PROCESS_CHAT_ACTION . "_" . $count . "_ve_2"]);
                $chat = new VisitorChat($parts[0],$parts[1]);
                $chat->SetPublicGroup($_POST[POST_INTERN_PROCESS_CHAT_ACTION . "_" . $count . "_ve_0"]);
            }
		}
		else if($type == "QuitPublicGroup")
		{
			$room = new UserGroup();
			$room->Id = $_POST[POST_INTERN_PROCESS_CHAT_ACTION . "_" . $count . "_ve_0"];
			$room->RemoveMember($_POST[POST_INTERN_PROCESS_CHAT_ACTION . "_" . $count . "_ve_1"]);

            if(strpos($_POST[POST_INTERN_PROCESS_CHAT_ACTION . "_" . $count . "_ve_1"],'~') !== false)
            {
                $parts = explode('~',$_POST[POST_INTERN_PROCESS_CHAT_ACTION . "_" . $count . "_ve_1"]);
                $chat = new VisitorChat($parts[0],$parts[1]);
                $chat->SetPublicGroup("");
            }

            Server::ForceUpdate(array("INTERNAL","GROUPS"));
		}
		else if($type == "StartOverlayChat")
		{
			$chat = new VisitorChat($_POST[POST_INTERN_PROCESS_CHAT_ACTION . "_" . $count . "_va" ],$_POST[POST_INTERN_PROCESS_CHAT_ACTION . "_" . $count . "_vb"]);
			$chat->RequestInitChat(CALLER_SYSTEM_ID);
		}
        else if($type == "AddVisitorComment")
        {
            $visitor = new Visitor($_POST[POST_INTERN_PROCESS_CHAT_ACTION . "_" . $count . "_ve_0"]);
            $visitor->SaveComment(CALLER_SYSTEM_ID,$_POST[POST_INTERN_PROCESS_CHAT_ACTION . "_" . $count . "_ve_1"]);
            Server::ForceUpdate(array("VISITOR"));
        }
        else if($type == "RemoveVisitorComment")
        {
            $visitor = new Visitor($_POST[POST_INTERN_PROCESS_CHAT_ACTION . "_" . $count . "_ve_0"]);
            $visitor->RemoveComment($_POST[POST_INTERN_PROCESS_CHAT_ACTION . "_" . $count . "_ve_1"]);
            Server::ForceUpdate(array("VISITOR"));
        }
        else if($type == "SetTranslation")
        {
            $chat = new VisitorChat($_POST[POST_INTERN_PROCESS_CHAT_ACTION . "_" . $count . "_va" ],$_POST[POST_INTERN_PROCESS_CHAT_ACTION . "_" . $count . "_vb"]);
            $chat->ChatId = $_POST[POST_INTERN_PROCESS_CHAT_ACTION . "_" . $count . "_ve_0"];
            $chat->SetTranslation($_POST[POST_INTERN_PROCESS_CHAT_ACTION . "_" . $count . "_ve_1"]);
        }
		else if(strlen($_POST[POST_INTERN_PROCESS_CHAT_ACTION . "_" . $count . "_vb" ]) > 0 && strlen($_POST[POST_INTERN_PROCESS_CHAT_ACTION . "_" . $count . "_va" ]) > 0)
		{
			$chat = new VisitorChat($_POST[POST_INTERN_PROCESS_CHAT_ACTION . "_" . $count . "_va" ],$_POST[POST_INTERN_PROCESS_CHAT_ACTION . "_" . $count . "_vb" ]);
			$chat->ChatId = $_POST[POST_INTERN_PROCESS_CHAT_ACTION . "_" . $count . "_vc"];
			$chat->Load();

			if($type == "SetCallMeBackStatus")
				$chat->SetCallMeBackStatus($_POST[POST_INTERN_PROCESS_CHAT_ACTION . "_" . $count . "_ve_0"]);
			else if($type == "JoinChatInvisible")
				$chat->JoinChat(CALLER_SYSTEM_ID,true,!empty($_POST[POST_INTERN_PROCESS_CHAT_ACTION . "_" . $count . "_ve_0"]));
			else if($type == "JoinChat")
				$chat->JoinChat(CALLER_SYSTEM_ID,false,!empty($_POST[POST_INTERN_PROCESS_CHAT_ACTION . "_" . $count . "_ve_0"]));
			else if($type == "SetPriority")
				$chat->SetPriority($_POST[POST_INTERN_PROCESS_CHAT_ACTION . "_" . $count . "_ve_0"]);
			else if($type == "SetTargetOperator")
				$chat->SetTargetOperator($_POST[POST_INTERN_PROCESS_CHAT_ACTION . "_" . $count . "_ve_0"]);
			else if($type == "SetTargetGroup")
				$chat->SetTargetGroup($_POST[POST_INTERN_PROCESS_CHAT_ACTION . "_" . $count . "_ve_0"]);
			else if($type == "AcceptChat")
				$chat->InternalActivate(CALLER_SYSTEM_ID);
			else if($type == "CloseChat")
				$chat->InternalClose(CALLER_SYSTEM_ID);
			else if($type == "TakeChat")
				$chat->TakeChat($_POST[POST_INTERN_PROCESS_CHAT_ACTION . "_" . $count . "_ve_1"],$_POST[POST_INTERN_PROCESS_CHAT_ACTION . "_" . $count . "_ve_0"],$_POST[POST_INTERN_PROCESS_CHAT_ACTION . "_" . $count . "_ve_2"]);
			else if($type == "DeclineChat")
				$chat->InternalDecline(CALLER_SYSTEM_ID);
			else if($type == "LeaveChat")
				$chat->LeaveChat(CALLER_SYSTEM_ID);
		}
		$count++;
	}
}
?>