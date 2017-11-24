<?php
/****************************************************************************************
* LiveZilla intern.php
* 
* Copyright 2016 LiveZilla GmbH
* All rights reserved.
* LiveZilla is a registered trademark.
* 
* Improper changes to this file may cause critical errors.
***************************************************************************************/ 

if(!defined("IN_LIVEZILLA"))
	die();
	
define("LOGIN",($_POST[POST_INTERN_SERVER_ACTION]==INTERN_ACTION_LOGIN));
define("LOGOFF",(isset($_POST[POST_INTERN_USER_STATUS]) && $_POST[POST_INTERN_USER_STATUS] == USER_STATUS_OFFLINE));
define("DB_ACCESS_REQUIRED",(DBManager::$Connected && !empty($_POST[POST_INTERN_GET_MANAGEMENT])));
define("NO_CLIPPING",LOGIN);

Server::InitDataBlock(array("INTERNAL","GROUPS","VISITOR","FILTERS","INPUTS","DBCONFIG"));
require(LIVEZILLA_PATH . "_lib/objects.internal.inc.php");
OperatorRequest::Validate();
if(OperatorRequest::IsValidated())
{
    CacheManager::GetDataUpdateTimes();
	if($_POST[POST_INTERN_SERVER_ACTION]==INTERN_ACTION_LISTEN || $_POST[POST_INTERN_SERVER_ACTION]==INTERN_ACTION_LOGIN)
	{
        Server::$Operators[CALLER_SYSTEM_ID]->SaveMobileParameters();
		OperatorRequest::Listen();
		if(STATS_ACTIVE && !LOGIN)
			Server::$Statistic->ProcessAction(ST_ACTION_LOG_STATUS,array(Server::$Operators[CALLER_SYSTEM_ID]));
	}
	else if($_POST[POST_INTERN_SERVER_ACTION]==INTERN_ACTION_SEND_FILE)
		OperatorRequest::UploadFile();
	else if($_POST[POST_INTERN_SERVER_ACTION]==INTERN_ACTION_OPTIMIZE_TABLES)
	{
		require(LIVEZILLA_PATH . "_lib/functions.internal.optimize.inc.php");
		DatabaseMaintenance::Optimize($_POST["p_table"]);
	}
	else if($_POST[POST_INTERN_SERVER_ACTION]==INTERN_ACTION_KB_ACTIONS)
	{
		require(LIVEZILLA_PATH . "_lib/functions.internal.process.inc.php");
		processKBActions();
	}
	else if($_POST[POST_INTERN_SERVER_ACTION]==INTERN_ACTION_REPORTS)
	{
		require(LIVEZILLA_PATH . "_lib/functions.internal.process.inc.php");
		require(LIVEZILLA_PATH . "_lib/functions.internal.build.inc.php");
		processUpdateReport();
	}
	else if($_POST[POST_INTERN_SERVER_ACTION]==INTERN_ACTION_SEND_TEST_MAIL)
	{
        require_once(LIVEZILLA_PATH . "_lib/functions.internal.man.inc.php");
		ServerManager::TestMailAccount();
	}
    else if($_POST[POST_INTERN_SERVER_ACTION]==INTERN_ACTION_LDAP_TEST)
    {
        require_once(LIVEZILLA_PATH . "_lib/objects.ldap.inc.php");
        LDAPManager::TestBinding();
    }
    else if($_POST[POST_INTERN_SERVER_ACTION]==INTERN_ACTION_LDAP_SEARCH)
    {
        require_once(LIVEZILLA_PATH . "_lib/objects.ldap.inc.php");
        LDAPManager::Search();
    }
	else if($_POST[POST_INTERN_SERVER_ACTION]==INTERN_ACTION_SET_MANAGEMENT)
	{
        require_once(LIVEZILLA_PATH . "_lib/functions.internal.man.inc.php");
        if(OperatorRequest::IsValidated() && Is::Defined("VALIDATED_FULL_LOGIN") && OperatorRequest::IsAdministrator(true))
            ServerManager::UpdateUserManagement(DB_PREFIX);
	}
	else if($_POST[POST_INTERN_SERVER_ACTION]==INTERN_ACTION_SET_CONFIG)
	{
        require_once(LIVEZILLA_PATH . "_lib/functions.internal.man.inc.php");
        ServerManager::UpdateConfiguration();
        ServerManager::UpdateLanguageFiles();
	}
    else if($_POST[POST_INTERN_SERVER_ACTION]=="end_trial")
    {
        require_once(LIVEZILLA_PATH . "_lib/functions.internal.man.inc.php");
        ServerManager::EndTrial();
    }
	else if($_POST[POST_INTERN_SERVER_ACTION]==INTERN_ACTION_SET_AVAILABILITY)
	{
        require_once(LIVEZILLA_PATH . "_lib/functions.internal.man.inc.php");
		ServerManager::UpdateAvailability($_POST["p_available"]);
	}
	else if($_POST[POST_INTERN_SERVER_ACTION]==INTERN_ACTION_DOWNLOAD_TRANSLATION)
	{
        require_once(LIVEZILLA_PATH . "_lib/functions.internal.man.inc.php");
		ServerManager::GetTranslationData();
	}
	else if($_POST[POST_INTERN_SERVER_ACTION]==INTERN_ACTION_GET_ICON_LIST)
	{
        require_once(LIVEZILLA_PATH . "_lib/functions.internal.man.inc.php");
		ServerManager::GetImageSets();
	}
	else if($_POST[POST_INTERN_SERVER_ACTION]=="create_code")
	{
        require_once(LIVEZILLA_PATH . "_lib/functions.internal.man.inc.php");
		ServerManager::CreateCode();
	}
    else if($_POST[POST_INTERN_SERVER_ACTION]=="delete_code")
    {
        require_once(LIVEZILLA_PATH . "_lib/functions.internal.man.inc.php");
        ServerManager::DeleteCode();
    }
    else if($_POST[POST_INTERN_SERVER_ACTION]=="create_image_set")
    {
        require_once(LIVEZILLA_PATH . "_lib/functions.internal.man.inc.php");
        ServerManager::CreateImageSet(false);
    }
    else if($_POST[POST_INTERN_SERVER_ACTION]=="delete_image_set")
    {
        require_once(LIVEZILLA_PATH . "_lib/functions.internal.man.inc.php");
        ServerManager::CreateImageSet(true);
    }
    else if($_POST[POST_INTERN_SERVER_ACTION]=="get_code_list")
    {
        require_once(LIVEZILLA_PATH . "_lib/functions.internal.man.inc.php");
        ServerManager::GetCodeList();
    }
    else if($_POST[POST_INTERN_SERVER_ACTION]=="upload_translation")
    {
        require_once(LIVEZILLA_PATH . "_lib/functions.internal.man.inc.php");
        ServerManager::UpdateLanguageFiles();
    }
    else if($_POST[POST_INTERN_SERVER_ACTION]=="backup")
    {
        require_once(LIVEZILLA_PATH . "_lib/functions.internal.man.inc.php");
        ServerManager::BackupLocalData();
    }
}
else if($_POST[POST_INTERN_SERVER_ACTION]==INTERN_ACTION_CREATE_TABLES)
{
    require_once(FILE_INSTALLER);
    require_once(LIVEZILLA_PATH . "_lib/functions.internal.man.inc.php");
    if(Installer::CreateTables())
        if(ServerManager::UpdateUserManagement($_POST[POST_INTERN_DATABASE_PREFIX]))
            Installer::CreateConfigFile(isset($_POST["p_db_cf_dl"]));
}
else if($_POST[POST_INTERN_SERVER_ACTION]==INTERN_ACTION_DATABASE_TEST)
{
    if(file_exists(FILE_INSTALLER))
    {
        require_once(FILE_INSTALLER);
        Installer::UpdateDatabase();
    }
}
else
{
	Server::$Response->SetValidationError(AUTH_RESULT);
}

if(OperatorRequest::IsValidated() && !Server::IsServerSetup())
{
	if(LOGOFF || LOGIN)
	{
		if(LOGOFF)
        {
			Server::$Operators[CALLER_SYSTEM_ID]->GetExternalObjects();
        }
		Server::$Operators[CALLER_SYSTEM_ID]->Reposts = array();
        Server::$Operators[CALLER_SYSTEM_ID]->Save();
	}
	//Server::$Operators[CALLER_SYSTEM_ID]->Save();
    //CacheManager::Flush();
}

if(LOGIN && DB_ACCESS_REQUIRED)
{
	require(LIVEZILLA_PATH . "_lib/functions.internal.man.inc.php");
    $extension = (!empty(Server::$Configuration->File["gl_db_ext"])) ? Server::$Configuration->File["gl_db_ext"] : "";
    $isUptReq=false;
    $__u__dbv=null;
	$res = ServerManager::ValidateDatabase(false,$isUptReq,$__u__dbv);
	if(!empty($res))
		Server::$Response->SetValidationError(LOGIN_REPLY_DB,$res);
}
$response = trim(Server::$Response->GetXML(true));
?>
