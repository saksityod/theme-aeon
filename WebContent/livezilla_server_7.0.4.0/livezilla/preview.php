<?php
/****************************************************************************************
 * LiveZilla preview.php
 *
 * Copyright 2017 LiveZilla GmbH
 * All rights reserved.
 * LiveZilla is a registered trademark.
 *
 * Improper changes to this file may cause critical errors.
 ***************************************************************************************/

define("IN_LIVEZILLA",true);
header('Content-Type: text/html; charset=utf-8');
header("Cache-Control: no-store, no-cache, must-revalidate, max-age=0");
header("Cache-Control: post-check=0, pre-check=0", false);
header("Pragma: no-cache");
if(!defined("LIVEZILLA_PATH"))
    define("LIVEZILLA_PATH","./");

require(LIVEZILLA_PATH . "_definitions/definitions.inc.php");
require(LIVEZILLA_PATH . "_lib/functions.global.inc.php");
require(LIVEZILLA_PATH . "_definitions/definitions.dynamic.inc.php");
require(LIVEZILLA_PATH . "_definitions/definitions.protocol.inc.php");

@set_error_handler("handleError");

$bhtml = "<!DOCTYPE HTML><html><head><meta charset=\"UTF-8\"><link rel=\"shortcut icon\" href=\"./images/favicon.ico\" type=\"image/x-icon\"><title>LiveZilla Link Generator Preview</title><meta http-equiv=\"X-UA-Compatible\" content=\"IE=9\" /></head><body topmargin=\"0\" leftmargin=\"0\" background=\"./images/preview_bg.gif\">";

if(Server::InitDataProvider())
{
    Server::DefineURL("preview.php");
    if(!empty($_GET["id"]) && !empty($_GET["id"]) && strlen($_GET["id"])==32)
    {
        $result = DBManager::Execute(true, "SELECT * FROM `" . DB_PREFIX . DATABASE_CODES . "` WHERE `id`='" . DBManager::RealEscape($_GET["id"]) . "';");
        if($row = @DBManager::FetchArray($result))
            $bhtml .= "<script type=\"text/javascript\" src=\"./script.php?id=".$_GET["id"]."\"></script>";
    }
}
exit($bhtml . "</body></html>");
?>