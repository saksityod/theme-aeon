<?php

/****************************************************************************************
 * LiveZilla objects.mail.inc.php
 *
 * Copyright 2017 LiveZilla GmbH
 * All rights reserved.
 * LiveZilla is a registered trademark.
 *
 * Improper changes to this file may cause critical errors.
 ***************************************************************************************/

if(!defined("IN_LIVEZILLA"))
    die();

class MailSystem
{
    private $Mailbox;
    private $Receiver;
    private $ReplyTo;
    private $MailBodyText;
    private $MailBodyHTML;
    private $Subject;
    private $TestIt;
    private $Attachments;
    private $FakeSender;
    public $Result = "";

    function __construct()
    {
        $this->Mailbox = func_get_arg(0);
        if(func_num_args() == 8)
        {
            $this->Receiver = func_get_arg(1);
            $this->ReplyTo = func_get_arg(2);
            $this->MailBodyText = func_get_arg(3);
            $this->MailBodyHTML = func_get_arg(4);
            $this->Subject = func_get_arg(5);
            $this->TestIt = func_get_arg(6);
            $this->Attachments = func_get_arg(7);
        }
    }

    function SendEmail($_fakeSender="")
    {
        if($this->Mailbox == null)
            $this->Mailbox=Mailbox::GetDefaultOutgoing();

        if($this->Mailbox == null)
            return null;

        $this->FakeSender = $_fakeSender;

        if($this->Mailbox->Type == "SMTP")
        {
            if($this->Mailbox->Framework=="PHP_MAILER")
                return false;
            else
                $this->Result = $this->SEND_SMTP_ZEND();
        }
        else if($this->Mailbox->Type == "PHPMail")
        {
            $this->Result = $this->SEND_PHP_MAIL($this->Receiver);
        }
        return true;
    }

    function ReceiveEmails(&$_reload, $_delete, $_test=false)
    {
        if(strtolower($this->Mailbox->Framework)=="zend")
        {
            Server::LoadLibrary("ZEND","Zend_Mail");
            $config = array('host' => $this->Mailbox->Host, 'auth' => 'login', 'user' => $this->Mailbox->Username,'password' => $this->Mailbox->Password, 'port' => $this->Mailbox->Port);

            if(!empty($this->Mailbox->SSL))
                $config['ssl'] = ($this->Mailbox->SSL==1) ? 'SSL' : 'TLS';

            if($this->Mailbox->Type == "IMAP")
            {
                Server::LoadLibrary("ZEND","Zend_Mail_Storage_Imap");
                $mails = new Zend_Mail_Storage_Imap($config);
            }
            else
            {
                Server::LoadLibrary("ZEND","Zend_Mail_Storage_Pop3");
                $mails = new Zend_Mail_Storage_Pop3($config);
            }
            return $this->ZENDParseEmails($_reload, $mails, $_delete, $_test);
        }
        else if(strtolower($this->Mailbox->Framework)=="php")
        {
            if(!function_exists("imap_search"))
            {
                Logging::ErrorLog($error = "PHP extension 'php_imap.dll' missing.");
                throw new Exception($error);
            }
            else if($this->Mailbox->Type == "IMAP" || $this->Mailbox->Type == "POP")
            {
                require_once(LIVEZILLA_PATH . "_lib/trdp/phpimap.php");
                return $this->PHPParseEmails($_reload, $_delete, $_test);
            }
        }
        return array();
    }

    private function SEND_SMTP_ZEND()
    {
        try
        {
            Server::LoadLibrary("ZEND","Zend_Mail");
            Server::LoadLibrary("ZEND","Zend_Mail_Transport_Smtp");

            if(empty($this->MailBodyText))
                $this->MailBodyText = ">>";

            if($this->Mailbox->Authentication=="No")
                $config = array('port' => $this->Mailbox->Port);
            else
                $config = array('auth' => 'login', 'username' => $this->Mailbox->Username,'password' => $this->Mailbox->Password, 'port' => $this->Mailbox->Port);

            if(!empty($this->Mailbox->SSL))
                $config['ssl'] = ($this->Mailbox->SSL==1) ? 'SSL' : 'TLS';

            $transport = new Zend_Mail_Transport_Smtp($this->Mailbox->Host, $config);
            $mail = new Zend_Mail('UTF-8');
            $mail->setBodyText($this->MailBodyText);

            if(!empty($this->MailBodyHTML))
                $mail->setBodyHtml($this->MailBodyHTML);

            if(empty($this->FakeSender))
                $mail->setFrom($this->Mailbox->Email, $this->Mailbox->SenderName);
            else
                $mail->setFrom($this->FakeSender, $this->FakeSender);

            if(strpos($this->Receiver,",") !== false)
            {
                $emails = explode(",",$this->Receiver);
                $add = false;
                foreach($emails as $mailrec)
                {
                    $mailrec = trim($mailrec);
                    if(!empty($mailrec) && !Is::Null(strpos($mailrec,"@")))
                    {
                        if(!$add && !Str::EndsWith($mailrec,")"))
                        {
                            $add = true;
                            $mail->addTo($mailrec);
                        }
                        else if(Str::EndsWith($mailrec,"(cc)"))
                        {
                            $mail->addCc(str_replace("(cc)","",$mailrec));
                        }
                        else
                        {
                            $mail->addBcc(str_replace("(bcc)","",$mailrec));
                        }
                    }
                }
            }
            else if(!Is::Null(strpos($this->Receiver,"@")))
                $mail->addTo($this->Receiver, $this->Receiver);

            $mail->setSubject($this->Subject);
            $mail->setReplyTo($this->ReplyTo, $name=null);

            if(count($mail->getRecipients()) > 0)
            {
                if($this->Attachments != null)
                {
                    if(is_array($this->Attachments))
                    {
                        foreach($this->Attachments as $link => $val)
                        {
                            $res = KnowledgeBaseEntry::GetById($link);
                            if($res != null)
                            {
                                $at = $mail->createAttachment(file_get_contents("./uploads/" . $res["value"]));
                                $at->filename = $res["title"];
                            }
                            else if(file_exists($link) && strpos($link,"..") === false && strpos($link,PATH_STATS) === 0)
                            {
                                $at = $mail->createAttachment(file_get_contents($link));
                                $at->filename = $val;
                            }
                            else
                                continue;

                            $at->type        = 'application/octet-stream';
                            $at->disposition = Zend_Mime::DISPOSITION_ATTACHMENT;
                            $at->encoding    = Zend_Mime::ENCODING_BASE64;
                        }
                    }
                }
                $mail->send($transport);
            }
        }
        catch (Exception $e)
        {
            if($this->TestIt)
                throw $e;
            else
                handleError("111",$this->Mailbox->Host . " send mail connection error: " . $e->getMessage(),"functions.global.inc.php",0);
            return 0;
        }
        return 1;
    }

    private function SEND_PHP_MAIL($_receiver="",$result = "")
    {
        if(strpos($_receiver,",") !== false)
        {
            $emails = explode(",",$_receiver);
            foreach($emails as $mail)
                if(!empty($mail) && !Is::Null(strpos($mail,"@")))
                    $result = $this->SEND_PHP_MAIL(trim($mail), $result);
            return $result;
        }

        $_receiver = str_replace(array("(bcc)","(cc)"),"",$_receiver);

        $mailtext = $this->MailBodyText;
        $ehash = md5(date('r', time()));
        $EOL = "\r\n";

        if(empty($this->FakeSender))
            $headers  = "From: ".$this->Mailbox->Email.$EOL;
        else
            $headers  = "From: ".$this->FakeSender.$EOL;

        $headers .= "Reply-To: ".$this->ReplyTo.$EOL;
        $headers .= "Date: ".date("r").$EOL;
        $headers .= "MIME-Version: 1.0".$EOL;
        $headers .= "X-Mailer: LiveZilla.net/" . VERSION.$EOL;

        if($this->Attachments != null)
        {
            $headers .= "Content-Type: multipart/mixed; boundary=\"".$ehash."\"".$EOL.$EOL;
            $headers .= "--".$ehash.$EOL;
            $headers .= "Content-Type: text/plain; charset=UTF-8; format=flowed".$EOL;
            $headers .= "Content-Transfer-Encoding: 8bit".$EOL.$EOL;
            $headers .= $mailtext.$EOL.$EOL;
            $headers .= "--".$ehash.$EOL;
            foreach($this->Attachments as $resId => $fname)
            {
                $res = KnowledgeBaseEntry::GetById($resId);
                if($res==null)
                    continue;
                $content = chunk_split(base64_encode(file_get_contents("./uploads/" . $res["value"])));
                $headers .= "Content-Type: application/octet-stream; name=\"".$res["title"]."\"".$EOL;
                $headers .= "Content-Transfer-Encoding: base64".$EOL;
                $headers .= "Content-Disposition: attachment; filename=\"".$res["title"]."\"".$EOL.$EOL;
                $headers .= $content.$EOL.$EOL;
                $headers .= "--".$ehash.$EOL;
            }
            $mailtext="";
            $headers .= "--".$ehash."--".$EOL;
        }
        else
        {
            $headers .= "Content-Type: text/plain; charset=UTF-8; format=flowed".$EOL;
            $headers .= "Content-Transfer-Encoding: 8bit".$EOL.$EOL;
        }

        if(@mail($_receiver, $this->Subject, $mailtext, $headers))
            return 1;
        else
            return "The email could not be sent using PHP mail(). Please try another Return Email Address or use SMTP.";
    }

    private function PHPParseEmails(&$_reload, $_delete, $_test)
    {
        $list = array();
        $starttime = time();
        $executiontime = Server::SetTimeLimit(CALLER_TIMEOUT-10);
        try
        {
            $ssl = ($this->Mailbox->SSL==0) ? "" : (($this->Mailbox->SSL==1) ? '/ssl' : '/tls');
            $service = ($this->Mailbox->Type == "IMAP") ? "imap" : "pop3";
            $mailbox = new ImapMailbox('{'.$this->Mailbox->Host.':'.$this->Mailbox->Port.'/'.$service.$ssl.'}INBOX', $this->Mailbox->Username, $this->Mailbox->Password, "./uploads/", 'utf-8');
            $mails = $mailbox->searchMailBox('ALL');

            if($_test)
                return count($mails);

            if(empty($mails))
                return array();

            $counter = 0;
            foreach ($mails as $mailId)
            {
                $subject = "";
                try
                {
                    $temail = new TicketEmail();
                    $message = $mailbox->getMail($mailId);
                    $subject = $temail->Subject = $message->subject;
                    $temail->Id = $message->message_id;
                    $temail->Name = $message->fromName;

                    if(empty($temail->Id))
                        $temail->Id = getId(32);

                    if($_delete)
                        $delete[$mailId] = $temail->Id;

                    $temail->Email = trim($message->fromAddress);

                    reset($message->to);
                    $temail->ReceiverEmail = key($message->to);

                    if(!empty($message->replyTo))
                    {
                        reset($message->replyTo);
                        $temail->ReplyTo = key($message->replyTo);
                    }

                    $temail->BodyHTML = $message->textHtml;
                    $temail->Body = $message->textPlain;

                    if(empty($temail->Body) && !empty($temail->BodyHTML))
                        $temail->Body = MailSystem::DownConvertHTML($temail->BodyHTML);

                    $atts = $message->getAttachments();
                    foreach($atts as $att)
                    {
                        $filename = $att->name;
                        $fileid = getId(32);
                        $filesid = Server::$Configuration->File["gl_lzid"] . "_" . $fileid;
                        $content = file_get_contents($att->filePath);
                        $temail->Attachments[$fileid] = array($filesid, $filename, $content);
                        @unlink($att->filePath);
                    }

                    $temail->Created = strtotime($message->date);
                    if(!is_numeric($temail->Created) || empty($temail->Created))
                        $temail->Created = time();
                    $list[] = $temail;

                    if(((time()-$starttime) >= ($executiontime/2)) || $counter++ > DATA_ITEM_LOADS)
                    {
                        $_reload = true;
                        break;
                    }
                }
                catch(Exception $e)
                {
                    if($_test)
                        throw $e;
                    else
                        Logging::EmailLog("Email Error #115: " . $e->getMessage() . ", email: " . @$subject);
                }
            }
            try
            {
                krsort($delete);
                foreach ($delete as $num => $id)
                {
                    $mailbox->deleteMail($num);
                }
            }
            catch (Exception $e)
            {
                if($_test)
                    throw $e;
                else
                    Logging::EmailLog("Email Error #116: " . $e->getMessage() . ", email: " . @$subject);
            }
        }
        catch(Exception $e)
        {
            if($_test)
                throw $e;
            else
                Logging::EmailLog("Email Error #117: " . $e->getMessage() . ", email: " . @$subject);
        }
        return $list;
    }

    private function ZENDParseEmails(&$_reload, $mails, $_delete, $_test)
    {
        $debugElements = array();
        $list = array();
        $message = null;
        $starttime = time();
        $executiontime = Server::SetTimeLimit(CALLER_TIMEOUT-10);
        $delete = array();
        $subject = "";
        try
        {
            $counter = 0;
            foreach ($mails as $mnum => $message)
            {
                if($_test)
                    return count($mails);

                try
                {
                    $temail = new TicketEmail();

                    if($message->headerExists("subject"))
                        $subject = $temail->Subject = MailSystem::MimeHeaderDecode($message->Subject);

                    if($message->headerExists("message-id"))
                        $temail->Id = str_replace(array("<",">"),"",$message->MessageId);

                    if(empty($temail->Id))
                        $temail->Id = getId(32);

                    if($_delete)
                        $delete[$mnum] = $temail->Id;

                    if($message->headerExists("from"))
                    {
                        if(strpos($message->From,"<") !== false)
                        {
                            $fromparts = explode("<",str_replace(">","",$message->From));
                            if(!empty($fromparts[0]))
                                $temail->Name = str_replace(array("\""),"",MailSystem::MimeHeaderDecode(trim($fromparts[0])));
                            $temail->Email = trim($fromparts[1]);
                        }
                        else
                            $temail->Email = trim($message->From);
                    }
                    else if(empty($temail->Email))
                        $temail->Email = "unknown";

                    if(DEBUG_MODE)
                        $debugElements[] = $message;

                    if(strpos($message->To,"<") !== false)
                    {
                        $toparts = explode("<",str_replace(">","",$message->To));
                        $temail->ReceiverEmail = trim($toparts[1]);
                    }
                    else
                        $temail->ReceiverEmail = trim($message->To);

                    if($message->headerExists("reply-to"))
                    {
                        if(strpos($message->ReplyTo,"<") !== false)
                        {
                            $rtoparts = explode("<",str_replace(">","",$message->ReplyTo));
                            $temail->ReplyTo = trim($rtoparts[1]);
                        }
                        else
                            $temail->ReplyTo = trim($message->ReplyTo);
                    }

                    try
                    {
                        $parts = array();
                        if($b=$message->isMultipart())
                        {
                            foreach (new RecursiveIteratorIterator($message) as $part)
                            {
                                $parts[] = $part;
                            }
                        }
                        else
                            $parts[] = $message;
                    }
                    catch(Exception $e)
                    {
                        Logging::EmailLog("Email Error #109: " . $e->getMessage() . ", email: " . @$subject);
                        $parts[] = $message;
                    }

                    foreach ($parts as $part)
                    {
                        try
                        {
                            if($part->headerExists("content-type"))
                                $ctype = $part->contentType;
                            else
                                $ctype = 'text/html';

                            if($part->headerExists("content-disposition"))
                                $ctype .= "; " . $part->contentDisposition;

                            $charset = "";
                            $hpartsOriginal = explode(";", $ctype);
                            $hparts = explode(";", str_replace(" ", "",$ctype));
                            foreach ($hparts as $hpart)
                                if (strpos(strtolower($hpart), "charset=") === 0)
                                    $charset = trim(str_replace(array("charset=", "'", "\""), "", strtolower($hpart)));

                            $isatt = (strpos(strtolower($ctype), "name=") !== false || strpos(strtolower($ctype), "filename=") !== false);

                            if (!$isatt && (($html = (strpos(strtolower($ctype), 'text/html') !== false)) || strpos(strtolower($ctype), 'text/plain') !== false))
                            {
                                $content = $part->getContent();
                                foreach ($part->getHeaders() as $name => $value)
                                    if (strpos(strtolower($name), 'content-transfer-encoding') !== false && strpos(strtolower($value), 'quoted-printable') !== false)
                                        $content = quoted_printable_decode($content);
                                    else if (strpos(strtolower($name), 'content-transfer-encoding') !== false && strpos(strtolower($value), 'base64') !== false)
                                        $content = base64_decode($content);

                                if($html)
                                {
                                    $temail->BodyHTML = max($temail->BodyHTML,$content);
                                    $content = MailSystem::DownConvertHTML($content);
                                }

                                if ((!$html || empty($temail->Body)) && !empty($content))
                                {
                                    if(strpos(strtolower($charset), 'utf-8') === false && !empty($charset))
                                    {
                                        $temail->Body = @iconv(strtoupper($charset),'UTF-8',$content);
                                    }
                                    else if($html && empty($charset))
                                        $temail->Body = utf8_encode($content);
                                    else
                                        $temail->Body = $content;
                                }
                            }
                            else
                            {
                                $filename = "";
                                $fileid = getId(32);
                                $unknown = getId(32);
                                $filesid = Server::$Configuration->File["gl_lzid"] . "_" . $fileid;
                                $hasMultipartFilename = false;

                                $cid = "";
                                if($part->headerExists("content-id"))
                                    $cid = str_replace(array("<",">"),"",$part->contentId);

                                foreach ($hpartsOriginal as $hpart)
                                {
                                    $hpart = MailSystem::MimeHeaderDecode($hpart);
                                    if (strpos(strtolower(trim($hpart)), "name=") === 0 || strpos(strtolower(trim($hpart)), "filename=") === 0)
                                        $filename = trim(str_replace(array("filename=","name=", "'", "\""), "", $hpart));
                                    else if (strpos(strtolower(trim($hpart)), "name*=") === 0 || strpos(strtolower(trim($hpart)), "filename*=") === 0)
                                    {
                                        $encodedFilenameValue = trim(str_replace(array("filename*=","name*="), "", strtolower($hpart)));
                                        $filename = MailSystem::ParseRFC2184EncodedWord($encodedFilenameValue);
                                    }
                                    else if (preg_match('/name\*\d+\**/', strtolower($hpart)) || preg_match('/name\*\d+\**/', strtolower($hpart)))
                                    {
                                        $hasMultipartFilename = true;
                                    }
                                    else if (!empty($cid) && empty($filename))
                                    {
                                        $filename = trim(str_replace(array("<",">", "'", "\""), "", strtolower($cid)));
                                        if(strpos($ctype,"image/") === 0)
                                            $filename .= str_replace("image/",".",$ctype);
                                    }
                                    else if((strpos(strtolower($ctype), 'message/rfc822') !== false) && $part->headerExists("subject") && empty($filename))
                                        $filename = trim($part->Subject).".eml";
                                    else if((strpos(strtolower($ctype), 'message/rfc822') !== false))
                                        $unknown = "unknown.eml";
                                }

                                if($hasMultipartFilename)
                                {
                                    $filenameParts = array();
                                    foreach ($hpartsOriginal as $hpart)
                                    {
                                        $isPart = preg_match('/name\*\d+\**/', strtolower($hpart)) || preg_match('/filename\*\d+\**/', strtolower($hpart));
                                        if($isPart)
                                        {
                                            $partIndex=intval(explode("*",explode("'", $hpart)[0])[1]);
                                            $partValue = explode("=", $hpart)[1];
                                            $filenameParts[$partIndex] = $partValue;
                                        }
                                    }
                                    $encodedFilenameValue = implode($filenameParts);
                                    $filename = MailSystem::ParseRFC2184EncodedWord($encodedFilenameValue);
                                }

                                $base64dec = !(strpos(strtolower($ctype), 'message/rfc822') !== false || (strpos(strtolower($ctype), 'text/plain') !== false) || (strpos(strtolower($ctype), 'text/xml') !== false));

                                foreach ($part->getHeaders() as $name => $value)
                                    if (strpos(strtolower($name), 'content-transfer-encoding') !== false && strpos(strtolower($value), 'base64') !== false)
                                        $base64dec = true;

                                $filename = (empty($filename)) ? $unknown : str_replace(array("\\",":","?","*","<",">","|","/","\""),"",$filename);
                                $content = (!$base64dec) ? $part->getContent() : base64_decode($part->getContent());
                                $temail->Attachments[$fileid] = array($filesid, $filename, $content, $cid);
                            }
                        }
                        catch (Exception $e)
                        {
                            Logging::EmailLog("Email Error #111: " . $e->getMessage() . ", email: " . @$subject);
                        }
                    }

                    $temail->Created = strtotime($message->Date);
                    $temail->BodyHTML = MailSystem::ReplaceEmbeddedContentLinks($temail->BodyHTML,$temail->Attachments);

                    if((!is_numeric($temail->Created) || empty($temail->Created)) && $message->headerExists("delivery-date"))
                        $temail->Created = strtotime($message->DeliveryDate);

                    if(!is_numeric($temail->Created) || empty($temail->Created))
                        $temail->Created = time();

                    $list[] = $temail;

                    if(((time()-$starttime) >= ($executiontime/2)) || $counter++ > DATA_ITEM_LOADS)
                    {
                        $_reload = true;
                        break;
                    }
                }
                catch(Exception $e)
                {
                    if($_test)
                        throw $e;
                    else
                        Logging::EmailLog("Email Error #112: " . $e->getMessage() . ", email: " . @$subject);
                }
            }
            try
            {
                krsort($delete);
                foreach ($delete as $num => $id)
                {
                    $mails->removeMessage($num);
                }
            }
            catch (Exception $e)
            {
                if($_test)
                    throw $e;
                else
                    Logging::EmailLog("Email Error #113: " . $e->getMessage() . ", email: " . @$subject);
            }
        }
        catch(Exception $e)
        {
            if($_test)
                throw $e;
            else
                Logging::EmailLog("Email Error #114: " . $e->getMessage() . ", email: " . @$subject);
        }
        return $list;
    }

    static function DownConvertHTML($_content)
    {
        @set_error_handler("ignoreError");
        try
        {
            require_once(LIVEZILLA_PATH . "_lib/trdp/html2text.php");
            $_content = convert_html_to_text($_content);
        }
        catch(Exception $e)
        {
            $_content = preg_replace("/<style\\b[^>]*>(.*?)<\\/style>/s", "", $_content);
            $_content = trim(html_entity_decode(strip_tags($_content),ENT_COMPAT,"UTF-8"));
            $_content = preg_replace('/[\s\s\s\s\s\s]+/', " ",$_content);
        }
        @set_error_handler("handleError");
        return $_content;
    }

    static function MimeHeaderDecode($_string)
    {
        if(strpos($_string,"?") !== false && strpos($_string,"=") !== false)
        {
            if(function_exists("iconv_mime_decode"))
                return iconv_mime_decode($_string,2,"UTF-8");
            else if(strpos(strtolower($_string),"utf-8") !== false)
            {
                mb_internal_encoding("UTF-8");
                return mb_decode_mimeheader($_string);
            }
            else
                return utf8_encode(mb_decode_mimeheader($_string));
        }
        else
        {
            return Encoding::ToUTF8($_string);
        }
    }

    static function ReplaceEmbeddedContentLinks($_html,$_attachments)
    {

        foreach($_attachments as $fid => $at)
        {
            $fna = $at[1];
            $cid = $at[3];
            if(strpos($_html," src=\"cid:" . $cid . "\"") !== false)
            {
                $fileurl = " src=\"./<!--secure_file-->?file=".$fna."&id=".$fid."\"";
                $_html = str_replace(" src=\"cid:" . $cid . "\"",$fileurl,$_html);
            }
        }
        return $_html;
    }

    static function ParseRFC2184EncodedWord($encodedWord)
    {
        $encodedWordArray = explode("'", $encodedWord);
        $wordRawURL = $encodedWordArray[2];
        $decodedWord = rawurldecode($wordRawURL);
        return $decodedWord;
    }
}
?>