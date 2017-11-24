<?php
/****************************************************************************************
 * LiveZilla resource.php
 *
 * Copyright 2017 LiveZilla GmbH
 * All rights reserved.
 * LiveZilla is a registered trademark.
 *
 * Improper changes to this file may cause critical errors.
 ***************************************************************************************/

$ftype = (false) ? "min." : "";
$paramIndex = 1;
$code = "";
while(isset($_REQUEST[$paramIndex]))
{
    if(strtolower($_REQUEST[$paramIndex])=="style.min.css")
        $code .= file_get_contents("./templates/style.".$ftype."css");
    else if(strtolower($_REQUEST[$paramIndex])=="overlays/chat/style.min.css")
        $code .= file_get_contents("./templates/overlays/chat/style.".$ftype."css");
    else if(strtolower($_REQUEST[$paramIndex])=="overlays/chatv2/style.min.css")
        $code .= file_get_contents("./templates/overlays/chatv2/style.".$ftype."css");
    else if(strtolower($_REQUEST[$paramIndex])=="jscript/jsglobal.min.js")
    {
        $code .= file_get_contents("./templates/jscript/jsglobal.".$ftype."js");
        $code .= file_get_contents("./templates/jscript/icons.".$ftype."js");
    }
    else if(strtolower($_REQUEST[$paramIndex])=="jscript/jsbox.min.js")
    {
        $code .= file_get_contents("./templates/jscript/jsbox.".$ftype."js");
        $code .= file_get_contents("./templates/jscript/jsboxv2.".$ftype."js");
    }
    else if(strtolower($_REQUEST[$paramIndex])=="jscript/jstrack.min.js")
        $code .= file_get_contents("./templates/jscript/jstrack.".$ftype."js");
    else if(strtolower($_REQUEST[$paramIndex])=="overlays/chat/jscript/jsextern.min.js")
        $code .= file_get_contents("./templates/overlays/chat/jscript/jsextern.".$ftype."js");
    else if(strtolower($_REQUEST[$paramIndex])=="overlays/chatv2/jscript/jsextern.min.js")
        $code .= file_get_contents("./templates/overlays/chatv2/jscript/jsextern.".$ftype."js");
    $paramIndex++;
}
if($_REQUEST["t"]=="css")
    header("Content-Type: text/css;");
else
    header("Content-Type: application/javascript;");

$expires = 60*60*24;
header("Pragma: public");
header("Cache-Control: maxage=".$expires);
header('Expires: ' . gmdate('D, d M Y H:i:s', time()+$expires) . ' GMT');
exit($code);
?>