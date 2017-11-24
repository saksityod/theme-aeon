/****************************************************************************************
 * LiveZilla CommonPermissionClass
 *
 * Copyright 2016 LiveZilla GmbH
 * All rights reserved.
 * LiveZilla is a registered trademark.
 *
 ***************************************************************************************/
function CommonPermissionClass() {
    this.permissions = {};
}

CommonPermissionClass.prototype.getUserPermissions = function(initial, operatorId, permissions) {
    operatorId = (typeof operatorId != 'undefined') ? operatorId : (typeof DataEngine != 'undefined') ? DataEngine.myId : '';
    permissions = (typeof permissions != 'undefined') ? permissions : [];
    var i = 0;
    if (initial && typeof DataEngine != 'undefined') {
        permissions = DataEngine.permissions
    } else if (permissions.length == 0) {
        var operator = (typeof DataEngine != 'undefined') ? DataEngine.operators.getOperator(operatorId) :
            (typeof lzm_userManagement != 'undefined') ? lzm_userManagement.operators.getOperator(operatorId) : null;
        if (operator != null) {
            permissions = operator.perms.split('');
        }
    } else {
        permissions = permissions.split('');
    }

    this.permissions = {
        chats: permissions[13],
        chats_join: permissions[7],
        chats_join_invisible: permissions[8],
        chats_join_after_invitation: permissions[17],
        chats_take_over: permissions[9],
        chats_change_priority: permissions[10],
        chats_change_target_operator: permissions[12],
        chats_change_target_group: permissions[11],
        chats_send_invites: permissions[14],
        chats_cancel_invites: permissions[39],
        chats_cancel_invites_others: permissions[40],
        chats_delete_text: permissions[15],
        chats_forward: permissions[16],
        chats_create_filter: permissions[19],
        chats_start_new: permissions[38],
        chats_can_auto_accept: permissions[42],
        chats_must_auto_accept: permissions[43],
        chats_can_reject: permissions[44],
        tickets: permissions[0],
        tickets_edit_messages: permissions[41],
        tickets_change_signature: permissions[24],
        tickets_review_emails: permissions[22],
        tickets_delete_emails: permissions[25],
        tickets_change_status: permissions[26],
        tickets_status_open: permissions[27],
        tickets_status_progress: permissions[28],
        tickets_status_closed: permissions[29],
        tickets_status_deleted: permissions[37],
        tickets_create_new: permissions[23],
        tickets_assign_operators: permissions[30],
        tickets_assign_groups: permissions[31],
        tickets_process_open: permissions[33],
        tickets_take_over: permissions[32],
        tickets_delete_ticket: permissions[34],
        ratings: permissions[1],
        profiles: permissions[35],
        resources: permissions[3],
        events: permissions[4],
        reports: permissions[5],
        archives_external: permissions[2],
        archives_internal: permissions[36],
        monitoring: permissions[6],
        groups_dynamic: permissions[18],
        auto_replies: permissions[20],
        mobile_access: permissions[45],
        api_access: permissions[46],
        picture_change: permissions[21],
        resources_read: permissions[47],
        resources_write: permissions[48]
    };

    if(typeof permissions[47] == 'undefined'){
        if(permissions[3] == 2)
            this.permissions.resources_read = 3;
        else if(permissions[3] == 1)
            this.permissions.resources_read = 1;
        else
            this.permissions.resources_read = 0;
    }

    if(typeof permissions[48] == 'undefined'){
        if(permissions[3] == 2)
            this.permissions.resources_write = 3;
        else if(permissions[3] == 1)
            this.permissions.resources_write = 1;
        else
            this.permissions.resources_write = 0;

    }

    return this.permissions;
};

CommonPermissionClass.prototype.checkUserPermissions = function(uid, type, action, myObject) {
    uid = (typeof uid != 'undefined' && uid != '' && uid != null) ? uid : DataEngine.myId;
    var rtValue = false;
    this.getUserPermissions();
    switch(type) {
        case 'resources':
            rtValue = this.checkUserResourceWritePermissions(uid, action, myObject);
            break;
        case 'tickets':
            rtValue = this.checkUserTicketPermissions(uid, action, myObject);
            break;
        case 'chats':
            rtValue = this.checkUserChatPermissions(uid, action, myObject);
            break;
        case 'monitoring':
            rtValue = this.checkUserMonitoringPermissions(uid, action, myObject);
            break;
        case 'group':
            rtValue = this.checkUserGroupPermissions(uid, action, myObject);
            break;
        case 'reports':
            rtValue = this.checkUserReportPermissions(uid, action, myObject);
            break;
    }
    return rtValue
};

CommonPermissionClass.prototype.checkUserResourceWritePermissions = function(uid, action, resource) {
    var rtValue = false;
    var parent = DataEngine.cannedResources.getResource(resource.pid);

    if (resource.oid == uid)
        return true;

    if(this.permissions.resources_write == 0)
        return false;

    switch(action) {
        case 'add':
            if(this.permissions.resources_write == 3) return true;
            if(this.permissions.resources_write == 2){

                if (resource.rid == 1)return false;
                if (parent.rid == 1 && resource.ty != 0)return true;
                if (resource.oid == uid && resource.ty == 0)return true;
                if ($.inArray(resource.g, DataEngine.operators.getOperator(uid).groups) != -1)return true;
                if (resource.g == '' && $.inArray(parent.g, DataEngine.operators.getOperator(uid).groups) != -1)return true;
            }
            if(this.permissions.resources_write == 1){
                if (resource.oid == uid && resource.ty == 0)return true;
                if (parent != null && parent.oid == uid && resource.ty != 0)return true;
            }
            break;
        case 'delete':
        case 'edit':
            if(resource.oid == uid)return true;
            if(resource.rid == 1 || resource.rid == 2)return false;
            if(this.permissions.resources_write == 3)return true;
            if(this.permissions.resources_write == 2){
                if ($.inArray(resource.g, DataEngine.operators.getOperator(uid).groups) != -1)return true;
                if (resource.g == '' && $.inArray(parent.g, DataEngine.operators.getOperator(uid).groups) != -1)return true;
            }
            if(this.permissions.resources_write == 1){
                //if (resource.oid == uid && resource.ty == 0)return true;
                if (parent != null && parent.oid == uid && resource.ty != 0)return true;
            }
            break;
    }
    return rtValue;
};

CommonPermissionClass.prototype.checkUserResourceReadPermission = function(uid, resource, parent) {

    if(parent == null)
        return true;

    if (resource.oid == uid)
        return true;

    if (this.permissions.resources_read == 1)
    {
        if (resource.ty == 0 && (resource.oid != uid))
            return false;
    }
    else if (this.permissions.resources_read == 2)
    {
        if (resource.ty != 0 && $.inArray(parent.g, DataEngine.operators.getOperator(uid).groups) == -1)
            return false;

        if (resource.ty == 0 && $.inArray(resource.g, DataEngine.operators.getOperator(uid).groups) == -1)
            return false;
    }
    else if (this.permissions.resources_read == 0)
        return false;
    return true;
};

CommonPermissionClass.prototype.checkUserTicketPermissions = function(uid, action, ticket) {
    var rtValue = false;
    switch(action) {
        case 'view':
            var myGroups = [];
            var operator = DataEngine.operators.getOperator(uid);
            if (operator != null) {
                myGroups = operator.groups;
            }
            var ticketGroup = (typeof ticket.editor != 'undefined') ? ticket.editor.g : ticket.gr;
            rtValue = (this.permissions.tickets == 2 || (this.permissions.tickets == 1 && $.inArray(ticketGroup, myGroups) != -1));
            break;
        case 'change_signature':
            rtValue = (this.permissions.tickets_change_signature == 1);
            break;
        case 'review_emails':
            rtValue = (this.permissions.tickets_review_emails == 1);
            break;
        case 'delete_emails':
            rtValue = (this.permissions.tickets_delete_emails == 1);
            break;
        case 'create_tickets':
            rtValue = (this.permissions.tickets_create_new == 1);
            break;
        case 'change_ticket_status':
            rtValue = (this.permissions.tickets_change_status == 1);
            break;
        case 'status_open':
            rtValue = (this.permissions.tickets_status_open == 1);
            break;
        case 'status_progress':
            rtValue = (this.permissions.tickets_status_progress == 1);
            break;
        case 'status_closed':
            rtValue = (this.permissions.tickets_status_closed == 1);
            break;
        case 'status_deleted':
            rtValue = (this.permissions.tickets_status_deleted == 1);
            break;
        case 'assign_operators':
            rtValue = (this.permissions.tickets_assign_operators == 1);
            break;
        case 'assign_groups':
            rtValue = (this.permissions.tickets_assign_groups == 1);
            break;
        case 'process_open':
            rtValue = (this.permissions.tickets_process_open == 1);
            break;
        case 'take_over':
            rtValue = (this.permissions.tickets_take_over == 1);
            break;
        case 'delete_tickets':
            rtValue = (this.permissions.tickets_delete_ticket == 1);
            break;
        case 'edit_messages':
            rtValue = (this.permissions.tickets_edit_messages == 1);
            break;
    }
    return rtValue;
};

CommonPermissionClass.prototype.checkUserChatPermissions = function(uid, action, _obj) {
    var rtValue = false;
    switch(action) {
        case 'view':
            var myGroups = [];
            var operator = DataEngine.operators.getOperator(uid);
            if (operator != null)
            {
                myGroups = operator.groups;
            }
            rtValue = (this.permissions.chats == 2 || (this.permissions.chats == 1 && $.inArray(_obj.dcg, myGroups) != -1) || (this.permissions.chats == 0 && _obj.IsMember(uid)));
            break;
        case 'can_auto_accept':
            rtValue = (this.permissions.chats_can_auto_accept == 1);
            break;
        case 'must_auto_accept':
            rtValue = (this.permissions.chats_must_auto_accept == 1);
            break;
        case 'join':
            rtValue = (this.permissions.chats_join == 1);
            break;
        case 'join_invisible':
            rtValue = (this.permissions.chats_join_invisible == 1);
            break;
        case 'join_after_invitation':
            rtValue = (this.permissions.chats_join_after_invitation == 1);
            break;
        case 'take_over':
            rtValue = (this.permissions.chats_take_over == 1);
            break;
        case 'change_priority':
            rtValue = (this.permissions.chats_change_priority == 1);
            break;
        case 'change_target_operator':
            rtValue = (this.permissions.chats_change_target_operator == 1);
            break;
        case 'change_target_group':
            rtValue = (this.permissions.chats_change_target_group == 1);
            break;
        case 'send_invites':
            rtValue = (this.permissions.chats_send_invites == 1);
            break;
        case 'cancel_invites':
            rtValue = (this.permissions.chats_cancel_invites == 1);
            break;
        case 'cancel_invites_others':
            rtValue = (this.permissions.chats_cancel_invites_others == 1);
            break;
        case 'forward':
            rtValue = (this.permissions.chats_forward == 1);
            break;
        case 'decline':
            rtValue = (this.permissions.chats_can_reject == 1);
            break;
        case 'delete_text':
            rtValue = (this.permissions.chats_delete_text == 1);
            break;
        case 'create_filter':
            rtValue = (this.permissions.chats_create_filter == 1);
            break;
        case 'start_new':
            rtValue = (this.permissions.chats_start_new == 1);
            break;
    }
    return rtValue;
};

CommonPermissionClass.prototype.checkUserMonitoringPermissions = function(uid, action, _visitorObj) {
    var rtValue = false;
    switch (action) {
        case 'view':
            rtValue = (this.permissions.monitoring == 2 || (this.permissions.monitoring == 1 && VisitorManager.IsInChatWith(_visitorObj,lzm_chatDisplay.myId)));
            break;
    }
    return rtValue;
};

CommonPermissionClass.prototype.checkUserGroupPermissions = function(uid, action, group) {
    var rtValue = false;
    if (group != null && typeof group.o != 'undefined') {
        switch (action) {
            default:
                rtValue = (this.permissions.groups_dynamic == 2 || (this.permissions.groups_dynamic == 1 && group.o == uid));
        }
    }
    return rtValue;
};

CommonPermissionClass.prototype.checkUserReportPermissions = function(uid, action, myObject) {
    var rtValue = false;
    switch (action) {
        case 'view':
            rtValue = (this.permissions.reports != 0);
            break;
        case 'recalculate':
            rtValue = (this.permissions.reports == 2);
            break;
    }
    return rtValue;
};
