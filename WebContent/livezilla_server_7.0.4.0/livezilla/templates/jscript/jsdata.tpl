function lz_chat_data_box()
{
	this.Id = '<!--chat_id-->';
    this.Debug = <!--debug-->;
    this.IsMobile = <!--is_mobile-->;
    this.IsSmall = <!--is_small-->;
    this.IsLogo = <!--is_logo-->;
    this.FeedbackOnExit = !<!--is_mobile--> && <!--feedback_on_exit-->;
    this.KnowledgebaseSuggest = <!--kb_suggest-->;
    this.IsIOS = <!--is_ios-->;
	this.Language = new lz_chat_data_language();
	this.Templates = new lz_chat_data_templates();
	this.InternalUser = new lz_chat_internal_user();
	this.ExternalUser = new lz_chat_external_user();
	this.Status = new lz_chat_status();
	this.LastSender = -2;
	this.LastSound = 0;
	this.QueuePostsAdded = false;
	this.AlternateRow = true;
    this.FeedbackPossible = true;
	this.SetupError = (lz_global_base64_decode('<!--setup_error-->'));
	this.PermittedFrames = 1;
	this.LastConnection = 0;
    this.Rated = false;
	this.CurrentApplication = (<!--function_chat-->) ? "chat" : ((<!--function_callback-->) ? "callback" : ((<!--function_ticket-->) ? "ticket" : ((<!--function_knowledgebase-->) ? "knowledgebase" : "chat")));
    this.WaitingLinksShow = false;
	this.ChatFrequency = <!--extern_frequency-->;
	this.PollTimeout = <!--extern_timeout-->;
    this.ShowOperatorInfoBox = <!--show_oib-->;
	this.CallMeBackMode = false;
	this.ChatActive = false;
	this.PollHash = '';
	this.PollAcid = '';
    this.ParentURI = null;
	this.DynamicGroup = "";
    this.CorrectMembers = false;
    this.ShowDynGroupMemberActivities = false;
    this.IsPublicGroupChat = <!--is_public_chat-->;
	this.ShoutNeeded = false;
	this.ShoutRunning = false;
	this.ConnectionBroken = false;
	this.ConnectionRunning = false;
	this.LastConnectionFailed = false;
    this.PrimaryColor = "<!--primary_color-->";
    this.SecondaryColor = "<!--secondary_color-->";
    this.TopMargin = 130;
    this.ForceGroupSelect = <!--require_group_selection-->;
    this.HideGroupChat = <!--hide_group_select_chat-->;
    this.HideGroupTicket = <!--hide_group_select_ticket-->;
    this.FeedbackURL = null;
    this.ForceSelectInit = false;
    this.ForceSelectMade = false;
	this.DirectLogin = <!--direct_login-->;
    this.PreselectTicket = <!--preselect_ticket-->;
    this.PreselectCallback = <!--preselect_callback-->;
    this.PreselectKnowledgebase = <!--preselect_kb-->;
	this.CheckoutOnly = <!--checkout_only-->;
	this.CheckoutExtendSuccess = <!--checkout_extend_success-->;
	this.SoundsAvailable = false;
	this.SoundPlayerMessage = null;
    this.SoundPlayerResult = null;
	this.Groups = null;
	this.TimerTyping = null;
	this.PreMessage = null;
	this.TimerWaiting = null;
    this.TimerReloadGroups = null;
	this.GetParameters = '<!--url_get_params-->';
	this.TempImage = new Image();
	this.TimezoneOffset = (new Date().getTimezoneOffset() / 60) * -1;
	this.GeoResolution;
	this.QueueMessageAppended = false;
	this.ConnectedMessageAppended = false;
	this.WaitingMessageAppended = false;
	this.ValidationRequired = false;
	this.WindowUnloaded = false;
	this.WindowNavigating = false;
	this.WindowAnnounce = null;
	this.MessageCount = 1;
    this.MessageCountReceived = 0;
    this.CheckoutActive = false;

    this.DialogSource;
    this.DialogObjectParent;
    this.DialogObject;

    this.KBLastSearchPhrase = null;
    this.KBLastSearchTime = 0;
    this.KBLastSearchCount = 0;
    this.KBSearchActive = false;
    this.KBReSearch = false;
    this.KBBackgroundSearch = false;
    this.KBOnly = <!--kb_only-->;

	this.SelectedGroup = null;
	this.Members = new Array();
	this.MembersPrevious = new Array();
	this.ChatGroupAvailable = false;
	this.InputFieldIndices = null;
	this.InputFieldValues = null;
    this.TranslateActive = null;
    this.TranslateFrom = null;
    this.TranslateInto = null;

	this.SYSTEM = -1;
	this.INTERNAL = 0;
	this.EXTERNAL = 1;
	this.MAXCHATLENGTH = 64000;
	this.STATUS_STOPPED = 4;
	this.STATUS_ACTIVE = 3;
	this.STATUS_ALLOCATED = 2;
	this.STATUS_INIT = 1;
	this.STATUS_START = 0;
	this.FILE_UPLOAD_OVERSIZED = 2;
	this.FILE_UPLOAD_REJECTED = 1;
	this.IMAGE_FILE_UPLOAD_SUCCESS = './images/file_upload_success.gif';
	
	function lz_chat_status()
	{
		this.Status = 0;
		this.Loaded = false;
	}
	
	function lz_chat_data_language()
	{
		this.JoinGroup = "<!--lang_client_join_group-->";
		this.LeaveGroup = "<!--lang_client_leave_group-->";
		this.FillMandatoryFields = "<!--lang_client_fill_mandatory_fields-->";
		this.FillMandatoryFields = "<!--lang_client_fill_mandatory_fields-->";
		this.SelectValidGroup = "<!--lang_client_select_valid_group-->";
		this.LanguageLeaveMessageShort = "<!--lang_client_leave_message-->";	
		this.LanguageLeaveMessage = "<!--lang_client_ticket_header-->";
		this.LanguageLeaveMessageInformation = "<!--lang_client_ticket_information-->";
		this.SendMessage = "<!--lang_client_send_message-->";	
		this.StartChat = "<!--lang_client_start_chat-->";
        this.StartChatHeader = "<!--lang_client_start_chat_header-->";
		this.StartChatInformation = "<!--lang_client_start_chat_information-->";
		this.StartSystem = "<!--lang_client_start_system-->";
		this.ConnectionBroken = "<!--lang_client_con_broken-->";
		this.MessageTooLong = "<!--lang_client_message_too_long-->";
		this.MessageReceived = "<!--lang_client_message_received-->";
		this.MessageFlood = "<!--lang_client_message_flood-->";
		this.RequestPermission = "<!--lang_client_file_upload_requesting-->";
		this.StartUpload = "<!--lang_client_file_upload_send_file-->";
		this.SelectFile = "<!--lang_client_file_upload_select_file-->";
		this.FileProvided = "<!--lang_client_file_upload_provided-->";
		this.RepresentativeLeft = "<!--lang_client_no_representative-->";
		this.SelectRating = "<!--lang_client_please_rate-->";
		this.TransmittingFile = "<!--lang_client_transmitting_file-->";
		this.Guest = "<!--lang_client_guest-->";
		this.ClientForwarding = "<!--lang_client_forwarding-->";
		this.ClientInternArrives = "<!--lang_client_intern_arrives-->";
		this.ClientErrorUnavailable = "<!--lang_client_error_unavailable-->";
		this.ClientIntLeft = "<!--lang_client_int_left-->";
		this.ClientInternLeft = "<!--lang_client_intern_left-->";
		this.ClientIntDeclined = "<!--lang_client_int_declined-->";
		this.ClientStillWaitingInt = "<!--lang_client_still_waiting_int-->";
		this.ClientThankYou = "<!--lang_client_thank_you-->";
		this.ClientIntIsConnected = "<!--lang_client_int_is_connected-->";
		this.ClientNoInternUsers = "<!--lang_client_no_intern_users-->";
		this.ClientNoInternUsersShort = "<!--lang_client_no_intern_users_short-->";
		this.ClientErrorGroups = "<!--lang_client_error_groups-->";
		this.ClientInvalidData = "<!--lang_client_invalid_data-->";
		this.ClientTopic = "<!--lang_client_topic-->";
		this.ClientCallMeNow = "<!--lang_client_call_me_now-->";
        this.ClientCallMeLater = "<!--lang_client_call_me_later-->";
		this.ClientRequestInstantCallback = "<!--lang_client_request_instant_callback-->";
		this.ClientRequestInstantCallbackInfo = "<!--lang_client_request_callback_information-->";
        this.ClientRequestInstantCallbackInfoOffline = "<!--lang_client_request_callback_information_offline-->";
		this.System = "<!--lang_client_system-->";
		this.NextOperator = "<!--lang_client_queue_next_operator-->";
		this.InfoFieldText = "";
		this.RepresentativeIsTyping = "<!--lang_client_representative_is_typing-->";
        this.ChatNotAvailable = "<!--lang_client_chat_not_available-->";
        this.Close = "<!--lang_client_close-->";
        this.Save = "<!--lang_client_save-->";
        this.ClientResume = "<!--lang_client_resume-->";
        this.ClientConnectingYou = "<!--lang_client_trying_to_connect_you-->";
	}
	
	function lz_chat_data_templates()
	{
		this.MessageInternal = '<!--template_message_intern-->';
        this.MessageSystem = '<!--template_message_system-->';
		this.MessageExternal = '<!--template_message_extern-->';
		this.MessageAdd = '<!--template_message_add-->';
		this.MessageAddAlt = '<!--template_message_add_alt-->';
        this.CallMeBackIF = '<!--template_call_me_back-->';
	}
	
	function lz_chat_internal_user()
	{
		this.Id = lz_global_base64_decode('<!--requested_intern_userid-->');
		this.Fullname = lz_global_base64_decode('<!--requested_intern_fullname-->');
		this.Available = false;
		this.ProfilePictureTime = 0;
		this.Language = "en";
	}
	
	function lz_chat_external_user()
	{
		this.Id = '';
		this.Username = '';
		this.Email = '';
		this.Company = '';
		this.Question = '';
		this.Phone = '';
		this.MailText = '';
		this.Group = '';
		this.Typing = false;
		this.MessagesSent = new Array();
		this.MessagesReceived = new Array();
		this.Session;
		this.TextAlign = 'left';
	}
}

function lz_chat_post()
{
	this.MessageText = '';
	this.MessageTranslation = '';
	this.MessageId = '';
	this.MessageTime = 0;
	this.Received = false;
}