

function ContextMenuClass() {}

ContextMenuClass.CurrentMenu = [];
ContextMenuClass.SubmenuIndent = 0;
ContextMenuClass.MinWidth = 170;
ContextMenuClass.SampleMenu = {
    id: 'sample_menu',
    onClickFunction: console.log, // Value of the entry will be function parameter
    entries: [{
            label: 'first entry',
            checked: true,
            value: 'first_entry'
        },
        '', {
            label: 'Second Entry',
            checked: false,
            onClick: 'console.log("hello")'
        }, {
            label: 'Submenu Entry',
            checked: true, // this won't apply because it is an submenu
            onClick: "console.log('test')", // this won't apply because submenu must be opened if exist
            submenu: {
                isSubmenu: true, // important for the context menu to build as submenu
                onClickFunction: ContextMenuClass.SampleFunction, // function to be called by all entries
                entries: [{
                    label: 'Another Submenu with a very long name',
                    submenu: {
                        isSubmenu: true,
                        onClickFunction: ContextMenuClass.SampleFunction,
                        entries: [{
                            label: 'Eintrag 1'
                        }, {
                            label: 'Eintrag 2'
                        }, {
                            label: '4th level of submenues',
                            submenu: {
                                onClickFunction: ContextMenuClass.SampleFunction,
                                isSubmenu: true,
                                entries: [{
                                        label: 'checkbox1',
                                        checked: true
                                    },
                                    '', {
                                        label: 'checkbox2',
                                        checked: false
                                    }
                                ]
                            }
                        } ]
                    }
                }, {
                    label: 'entry1'
                }, {
                    label: 'entry2'
                } ]
            }
        }
    ]
};

ContextMenuClass.SampleFunction = function(_input) {
    // console.log('Sample function was triggered with input: ' + _input);
};

ContextMenuClass.RemoveAll = function() {

    while (ContextMenuClass.CurrentMenu.length > 0) {
        ContextMenuClass.Pop();
    }
};

ContextMenuClass.CalculateMenuPosition = function(event, _isSubmenu) {
    var top = 0;
    var left = 0;
    if (_isSubmenu) {
        var id = ((event.target.id === '') ? event.target.parentNode.id : event.target.id);
        var pos = $('#' + id).position();
        var posParent = $('#' + id).parent().position();
        top = pos.top + posParent.top;
        left = pos.left + ContextMenuClass.SubmenuIndent + posParent.left;
    } else {
        top = event.clientY;
        left = event.clientX;
    }

    var win = event.target.ownerDocument.defaultView;
    var frame = win.frameElement;
    if (frame && frame.id !== 'appFrame') {
        var parent = frame.parentNode;
        var offset = $(parent).offset();
        top = top + offset.top;
        left = left + offset.left;
    }

    return {
        top: top,
        left: left
    };
};

ContextMenuClass.CalculateMenuId = function() {
    var lastMenuIndex = ContextMenuClass.Depth();
    var lastItem = ContextMenuClass.CurrentMenu[lastMenuIndex];
    return 'sub-' + lastItem.id;
};

ContextMenuClass.Depth = function() {
    return ContextMenuClass.CurrentMenu.length - 1;
};

ContextMenuClass.Last = function() {
    return ContextMenuClass.CurrentMenu[ContextMenuClass.Depth()];
};

ContextMenuClass.First = function() {
    return ContextMenuClass.CurrentMenu[0];
};

ContextMenuClass.Parent = function() {
    return ContextMenuClass.CurrentMenu[ContextMenuClass.CurrentMenu.length - 2];
};

ContextMenuClass.AddMouseOut = function(_id) {
    $('#' + _id).mouseout(function(event) {
        var toElem = $(event.toElement);
        var toElemId = toElem.attr('id');
        var lastMenuIndex = ContextMenuClass.Depth();
        for (var i = lastMenuIndex; i > 0; i--) {
            var itemID = ContextMenuClass.CurrentMenu[i].id;
            var isChild = (toElem.closest('#' + itemID).length > 0);
            if (isChild) {
                break;
            } else {
                ContextMenuClass.Pop();
            }
        }
    });
    $('#' + _id).parent().off('mouseout');
};

ContextMenuClass.ToggleMenu = function(event, _menu) {
    if ($('#' + _menu.id).length) {
        ContextMenuClass.RemoveAll();
    } else {
        ContextMenuClass.BuildMenu(event, _menu);
    }
};

ContextMenuClass.BuildMenu = function(event, _menu) {
    var baseZIndex = 40000;
    if (_menu === null) {
        return;
    }
    if (typeof(_menu) === 'undefined') {
        _menu = ContextMenuClass.SampleMenu;
    }
    var menuId = _menu.id || ContextMenuClass.CalculateMenuId();
    if ($('#' + menuId).length) {
        ContextMenuClass.Pop();
    } else {
        _menu.id = menuId;
        ContextMenuClass.Push(_menu);
        var position = _menu.position? _menu.position : ContextMenuClass.CalculateMenuPosition(event, _menu.isSubmenu);
        _menu.position = position;
        // add menu to body
        var wrapperDiv = $('<div></div>', {
            id: menuId,
            class: 'cm lzm-unselectable',
            style: 'z-index:'+baseZIndex.toString()+';top:' + position.top + 'px;left: ' + position.left + 'px; min-width:100px; max-height: ' + Math.floor(lzm_chatDisplay.windowHeight* 0.6) + 'px; overflow:auto'
        });
        if (_menu.isSubmenu) {
            var parentMenuId = ContextMenuClass.Parent().id;
            var parentWidth = $('#' + parentMenuId).outerWidth();
            $('#' + parentMenuId).remove();
            var targetEntryId = event.target.id || event.target.parentNode.id;
            $(wrapperDiv).attr('class', 'cm lzm-unselectable contextmenuclass-submenu').css({
                'min-width': parentWidth + 'px'
            }).appendTo($('body'));
            $('#' + targetEntryId).attr('onClick', 'ContextMenuClass.ReBuildSubMenu(event,null);event.stopPropagation()');

            //ContextMenuClass.AddMouseOut(menuId);

//            var parentMenu = ContextMenuClass.Parent();
//            if (parentMenu.isSubmenu) {
//                var parentElem = $('#' + parentMenu.id);
//                var currentLeft = parentElem.position().left;
//                parentElem.animate({
//                    'min-width': '170px',
//                    'left': currentLeft - ContextMenuClass.SubmenuIndent
//                });
//            }

        } else {
            $(wrapperDiv).appendTo($('body'));
        }

        // add entries to menu
        if(_menu.isSubmenu)
        {
            var backLinkOuter = $('<div></div>', {
                id: menuId + '-entry-back'
            }).appendTo($(wrapperDiv));
            $('<i></i>', {
                class: 'fa fa-caret-left contextmenuclass-submenu-backlink-icon'
            }).appendTo($(backLinkOuter));
            $('<span></span>', {class: 'cm-line cm-click cm-backlink'}).text(tid('back')).appendTo($(backLinkOuter));
            $(backLinkOuter.attr('onClick', 'ContextMenuClass.Pop(event);event.stopPropagation();'));
            $('<hr>').appendTo($(wrapperDiv));
        }
        for (var i = 0; i < _menu.entries.length; i++) {
            // check ruler
            if (_menu.entries[i] === '') {
                $('<hr>').appendTo($(wrapperDiv));
            } else {
                // add click event
                var entryID = menuId + '-entry' + i;
                var disabled = _menu.entries[i].disabled ? 'ui-disabled' : '';
                var outer = $('<div></div>', {
                    id: entryID,
                    class: disabled
                }).appendTo($(wrapperDiv));
                var onClick;
                if (_menu.entries[i].submenu) {
                    // MAKE snd click should close the submenu
                    onClick = 'ContextMenuClass.BuildMenu(event,ContextMenuClass.Last().entries[' + i + '].submenu);event.stopPropagation()';
                } else if (_menu.entries[i].onClick) {
                    onClick = _menu.entries[i].onClick + ';ContextMenuClass.RemoveAll();event.stopPropagation()';
                } else {
                    onClick = 'ContextMenuClass.OnClickEntry(\'' + _menu.entries[i].label + '\');';
                    //var value = _menu.entries[i].value || _menu.entries[i].label;
                    //onClick = _menu.onClickName + '("' + value + '");ContextMenuClass.RemoveAll();event.stopPropagation()';
                }
                $(outer.attr('onClick', onClick));
                // add checkbox
                if (typeof(_menu.entries[i].checked) === 'boolean' && typeof(_menu.entries[i].submenu) === 'undefined') {
                    $(outer.attr('class', 'contextmenuclass-entry-checkbox'));
                    var isChecked = _menu.entries[i].checked;
                    $('<input>', {
                        type: 'checkbox',
                        class: 'checkbox-custom contextmenuclass-checkbox',
                        id: menuId + '-checkbox' + i,
                        checked: (isChecked ? 'checked' : false)
                    }).appendTo($(outer));
                    // add label
                    $('<label>', {
                        class: 'contextmenuclass-label checkbox-custom-label',
                        for: menuId + '-checkbox'
                        //onClick: 'event.stopPropagation()'
                    }).text(_menu.entries[i].label).appendTo($(outer));
                } else if (_menu.entries[i].submenu) {
                    // MAKE add icon to submenuentries @context
                    $('<span></span>', {class: 'cm-line cm-click'}).text(_menu.entries[i].label).appendTo($(outer));
                    $('<i></i>', {
                        class: 'fa fa-caret-down contextmenuclass-submenu-icon'
                    }).appendTo($(outer));
                } else {
                    $('<span></span>', {class: 'cm-line cm-click'}).text(_menu.entries[i].label).appendTo($(outer));
                }

            }
        }

        // recalculate menu height
        var lastMenuIndex = ContextMenuClass.Depth();
        //for (var j = lastMenuIndex; j >= 0; j--) {
            var menu = ContextMenuClass.CurrentMenu[lastMenuIndex];
            var menuElem = $('#' + menu.id);
            var scrollHeight = menuElem[0].scrollHeight;
            var newHeight = scrollHeight + 'px';
            menuElem.css({
                'height': newHeight
            });
            menuElem.css({
                'z-index': baseZIndex + i
            });
        //}

        // recalculate position
//        var mainMenu = ContextMenuClass.CurrentMenu[0];
//        var mainMenuElem = $('#' + mainMenu.id);
//        var mainMenuPos = mainMenuElem.position();
//        if (($('body').height() - mainMenuPos.top) < mainMenuElem.outerHeight()) {
//            // MAKE move all parent menus, too @context
//            mainMenuElem.animate({
//                'top': ($('body').height() - mainMenuElem.outerHeight() - 5)
//            }, {
//                duration: 'fast',
//                queue: false
//            });
//        }
//        if (($('body').width() - mainMenuPos.left) < mainMenuElem.outerWidth()) {
//            // MAKE move all parent menus, too @context
//            mainMenuElem.animate({
//                'left': ($('body').width() - mainMenuElem.outerWidth() - 5)
//            }, {
//                duration: 'fast',
//                queue: false
//            });
//        }

    }
};

ContextMenuClass.OnClickEntry = function(_entryLabel){
    var currentMenu = ContextMenuClass.Last();
    var entry = ContextMenuClass.GetEntryByLabel(currentMenu,_entryLabel);
    currentMenu.onClickFunction(entry.value);
};

ContextMenuClass.GetEntryByLabel = function(_menu, _entryLabel){
    for(var i = 0; i < _menu.entries.length; i++ ){
        if(_menu.entries[i].label == _entryLabel){
            return _menu.entries[i];
        }
    }
};

ContextMenuClass.ReBuildSubMenu = function(event, _menu) {
    var targetEntryId = event.target.id || event.target.parentNode.id;
//    var menuID = $('#' + targetEntryId).parent().attr('id');
//    var parentMenu = ContextMenuClass.GetMenuById(menuID);
//    if ($('#sub-' + menuID).length) {
//        ContextMenuClass.Pop();
//    } else {
        var subMenu = ContextMenuClass.GetSubMenuByEntryId(ContextMenuClass.Parent(), targetEntryId);
        if (subMenu) {
            ContextMenuClass.BuildMenu(event, subMenu);
        }
//    }
};

ContextMenuClass.GetSubMenuByEntryId = function(_menu, _entryId) {
    var childCount = _entryId.substr(-1);
    // var entryArray = _menu.entries.filter(function(elem) {
    //     return elem !== '';
    // });
    return _menu.entries[childCount].submenu;
    // for(var i = 0; i < _menu.entries.length -1; i++){
    //     if(_menu.entries[i].submenu){
    //
    //     }
    // }
};

ContextMenuClass.GetMenuById = function(_id) {
    for (var i = 0; i < ContextMenuClass.CurrentMenu.length; i++) {
        if (ContextMenuClass.CurrentMenu[i].id === _id) {
            return ContextMenuClass.CurrentMenu[i];
        }
    }
};

ContextMenuClass.AddContextMenuListenerToElement = function(_element, _menuObjectBuilderName, _eventName) {
    _element.addEventListener(_eventName || 'contextmenu', function(event) {
        ContextMenuClass.BuildMenu(event, _menuObjectBuilderName(event));
    });
};

ContextMenuClass.Push = function(_menu) {
    ContextMenuClass.CurrentMenu.push(_menu);
};

ContextMenuClass.Pop = function(event) {
    var menuToBeRemoved = ContextMenuClass.CurrentMenu.pop();
    $('#' + menuToBeRemoved.id).remove();
    if (menuToBeRemoved.isSubmenu) {
        var lastMenu = ContextMenuClass.Last();
        ContextMenuClass.BuildMenu(event, lastMenu);
//        var lastMenuId = lastMenu.id;
//        var lastMenu = $('#' + lastMenuId);
//        var entryCount = lastMenu.children('div').length;
//        var entryOffset = lastMenu.children('hr').length;
//        $('#' + lastMenuId).animate({
//            height: (entryCount * 26 + entryOffset) + 'px'
//        }, {
//            duration: 'fast',
//            queue: false
//        });
//        var lastElem = $('#' + lastMenuId);
//        var currentLeft = lastElem.position().left;
//        if (ContextMenuClass.Last().isSubmenu) {
//            lastElem.animate({
//                'min-width': (ContextMenuClass.MinWidth - ContextMenuClass.SubmenuIndent) + 'px',
//                'left': currentLeft + ContextMenuClass.SubmenuIndent
//            }, {
//                duration: 'fast',
//                queue: false
//            });
//            ContextMenuClass.AddMouseOut(lastMenuId);
//        }

    }

};
