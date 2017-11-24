<?php

/****************************************************************************************
 * LiveZilla language.php
 *
 * Copyright 2016 LiveZilla GmbH
 * All rights reserved.
 * LiveZilla is a registered trademark.
 *
 * Improper changes to this file may cause critical errors.
 *
 ***************************************************************************************/


if(!defined("IN_LIVEZILLA"))
    define("IN_LIVEZILLA",true);

if(!defined("LIVEZILLA_PATH"))
    define("LIVEZILLA_PATH","./");

@set_time_limit(30);

require(LIVEZILLA_PATH . "_definitions/definitions.inc.php");
require(LIVEZILLA_PATH . "_lib/functions.global.inc.php");
require(LIVEZILLA_PATH . "_language/en.client.php");

function getLanguageJS($_isoLanguageCode)
{
    global $LZLANG;
    $languageData = array();
    $LZLANGEN = $LZLANG;
    if(empty($_isoLanguageCode) || strlen($_isoLanguageCode) > 5)
    {
        if(isset(Server::$Configuration->File["gl_default_language"]))
            $_isoLanguageCode = Server::$Configuration->File["gl_default_language"];
        else
            $_isoLanguageCode = "en";
    }

    $languageFiles[] = array(LocalizationManager::GetLocalizationFileString($_isoLanguageCode,true,false)=>false);
    //$languageFiles[] = array(LocalizationManager::GetLocalizationFileString($_isoLanguageCode, true,true)=>true);

    if (strlen($_isoLanguageCode) > 2)
    {
        $shortLanguageCode = substr($_isoLanguageCode, 0, 2);
        $languageFiles[] = array(LocalizationManager::GetLocalizationFileString($shortLanguageCode,true,false)=>false);
        //$languageFiles[] = array(LocalizationManager::GetLocalizationFileString($shortLanguageCode, true,true)=>true);
    }

    foreach($languageFiles as $fileParams)
        foreach($fileParams as $file => $isOrg)
            IOStruct::RequireTranslation($file);

    $translationKeys = array_keys($LZLANGEN);
    for ($i=0; $i<count($translationKeys); $i++) {
        $translation = array(
            "key" => $translationKeys[$i],
            "orig" => str_replace("'", "\'", $LZLANGEN[$translationKeys[$i]])
        );
        if (isset($LZLANG[$translationKeys[$i]]) && $LZLANG[$translationKeys[$i]] !== "") {
            $translation[$_isoLanguageCode] = str_replace("'", "\'", $LZLANG[$translationKeys[$i]]);
        } else {
            $translation[$_isoLanguageCode] = str_replace("'", "\'", $LZLANGEN[$translationKeys[$i]]);
        }
        array_push($languageData, $translation);
    }
    $jsLanguageData = "[";
    for ($i=0; $i<count($languageData) - 1; $i++) {
        $jsLanguageData .= "{'key': '".$languageData[$i]["key"]."', 'orig': '".$languageData[$i]["orig"]."', '".$_isoLanguageCode."': '".$languageData[$i][$_isoLanguageCode]."'}, ";
    }
    $i = count($languageData) - 1;
    $jsLanguageData .= "{'key': '".$languageData[$i]["key"]."', 'orig': '".$languageData[$i]["orig"]."', '".$_isoLanguageCode."': '".$languageData[$i][$_isoLanguageCode]."'}";
    $jsLanguageData .= "]";

    return $jsLanguageData;
}
?>