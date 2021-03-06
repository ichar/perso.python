// **********************************************
// PERSOSTATION PAGE DECLARATION: /provision.html
// ----------------------------------------------
// Version: 1.00
// Date: 10-06-2019

default_submit_mode  = 2;
default_action       = '830';
default_log_action   = '831';
default_print_action = '850';
default_input_name   = 'order_id';
default_menu_item    = 'data-menu-reviews';
default_handler      = function(x) { $PageLoader.refresh(x); };
default_params       = null;

IsDebug = 0;
IsTrace = 0;
IsLog = 0;

LINE    = 'order';
SUBLINE = 'review';

var default_screen_max = 0;

// Animated resizing of 'sizable-container'
var line_base_size = [0, 0];

// Sidebar callback timeout
var sidebar_timeout = 500;
var timer = null;

// Flag for 'input' keyboards
var is_input_focused = false;

// List of modes to arrange size of page
var default_startups = []; //, 'resize', 'sidebar'

// List of review classes
var review_classes = ['accepted', 'rejected', 'confirm'];

// ----------------------
// Dialog Action Handlers
// ----------------------

function subline_refresh(info, is_print) {
/***
 *  Callback of SUBLINE refresher.
 *  Used for update `.filename` area after loading of SUBLINE container.
 *
 *  Action:         default_action
 *  Page Handler:   default_handler
 *
 *  Track: 
 *      log.default:$updateSublineData
 *      provision.default:$PageLoader.refresh
 *      db.controller: -> handler
 *      db.controller:$web_logging
 *      db.controller:$LineSelector.onRefresh
 *      local:Line selection
 *          or
 *      common:$ShowOnStartup
 *      local:$Init
 *
 *  Hard link.
 */
    var dates = info['dates'];
    var review_date = !is_null(dates) ? dates[1][2] : '';

    var html = '' +
        (getObjectValueByKey(info, 'order') ? '<h3><span id="subline_name">'+info['order']+'</span></h3>' : '') +
        '<div class="x5">' +
        '<div class="x5_left">' +
            '<div class="purpose">' +
                (getObjectValueByKey(info, 'purpose') ? '<h4>Обоснование:</h4><div class="info">'+info['purpose']+'</div>' : '') +
            '</div>' +
            '<div class="equipment">' +
                (getObjectValueByKey(info, 'equipment_title') ? '<div class="equipment_title"><h4>Описание:</h4><div class="info">'+info['equipment_title']+'</div></div>' : '') +
                (getObjectValueByKey(info, 'equipment_name') ? '<br><div class="equipment_name"><h4>Оборудование:</h4><div class="info">'+info['equipment_name']+'</div></div>' : '') +
            '</div>' +
            '<div class="seller">' +
                (getObjectValueByKey(info, 'seller_name') ? '<div class="seller_name"><h4>Поставщик:</h4><div class="info">'+info['seller_name']+'</div></div>' : '') +
                (getObjectValueByKey(info, 'seller_title') ? '<br><div class="seller_title"><h4>Наименование организации:</h4><div class="info">'+info['seller_title']+'</div></div>' : '') +
                (getObjectValueByKey(info, 'seller_address') ? '<br><div class="seller_address"><h4>Адрес (URL):</h4><div class="info">'+info['seller_address']+'</div></div>' : '') +
            '</div>' +
        '</div>' +
        '<div class="x5_right">' +
            (getObjectValueByKey(info, 'category') ? '<div class="category '+info['category']['class']+'"><div class="category_name" title="'+info['category']['title']+'">'+info['category']['code']+'</div></div>' : '') +
        '</div>' +
        '</div>' +
        (getObjectValueByKey(info, 'EUR') ? '<div class="EUR"><span>EUR[€]&nbsp;'+
            info['EUR']+'&nbsp;=&nbsp;CROSS:&nbsp;'+
            info['cross']+'&nbsp;=&nbsp;TAX:&nbsp;'+
            info['tax']+'&nbsp;RUR[₽]&nbsp;=&nbsp;RATE:&nbsp;'+
            info['rate']+'</span></div>' : '') +
        (getObjectValueByKey(info, 'author') ? '<div class="author">'+info['author']+'</div>' : '') +
        (review_date && review_date != '**.**.****' ? '<div class="review_date"><h3>ВНИМАНИЕ! Заказу назначен передельный срок обоснования:'+'&nbsp;<span>'+review_date+'</span></h3></div>' : '') +
        '';

    if (is_print)
        return html;

    $(".filename").each(function() { 
        $(this).html(html);
    });

    if (is_null(dates))
        return;

    html = '';

    for (var i=0; i < dates.length; i++) {
        var key = dates[i][0];
        var title = dates[i][1];
        var value = dates[i][2] || '**.**.****';
        html += '<div class="order_date '+key+'"><h4>'+title+'</h4><dd><nobr>'+value+'</nobr></dd></div>';
    }

    $("#dates-box").html(html);
}

function sidebar_callback() {
/***
 *  Callback of $SidebarControl.
 *  Used for arange main page after Sidebar screen changed.
 *
 *  Track: 
 *      controls:$SidebarControl.checkShown
 *
 *  Sets by local:$Init.
 */
    if (!is_null(timer)) {
        clearTimeout(timer);
        timer = null;
    }

    if ($SidebarControl.isDueAnimated())
        timer = setTimeout(function() { sidebar_callback(); }, sidebar_timeout);

    $onInfoContainerChanged('sidebar');
}

function sidebar_toggle() {
/***
 *  Callback of $SidebarControl.
 *
 *  Track: 
 *      controls:$SidebarControl.onToggle
 *
 *  Hard link.
 */
    default_startups.remove('sidebar');
}

function sidebar_submit() {
/***
 *  Callback of $SidebarControl.
 *  Used for handle before submit of form $SidebarControl
 *
 *  Track: 
 *      controls:$SidebarControl.onBeforeSubmit
 *
 *  Hard link.
 */
    //var container = $("#pagination-form");
    //$("#reset").each(function() { $(this).val(1); });
    //container.find("#reset").each(function(index, x) { $x.val(1); });
}

function log_callback_error(action, errors) {
/***
 *  Callback of check loader errors.
 *  Used for handle after respond (response is loaded) by $web_logging before process handler.
 *
 *  Track: 
 *      db.controller:$web_logging
 *
 *  Hard link.
 */
   //alert('log_callback_error');

   if (!is_null(errors) && errors.length > 0) {
        var msg = errors.join('<br>');
        $ShowError(msg, true, true, false);
        should_be_updated = false;
    }
}

function log_callback(current_action, data, props) {
/***
 *  Callback of loader.
 *  Used for handle after respond (response is loaded) by $web_logging.
 *
 *  Track: 
 *      db.controller:$web_logging
 *
 *  Hard link.
 */
    selected_menu_action = null;

    $("#note").val('');

    if (should_be_updated) {
        should_be_updated = false;
        timer = setTimeout(function() { update_review(); }, 100);
    }
}

function update_review() {
    if (!is_null(timer)) {
        clearTimeout(timer);
        timer = null;
    }

    var params = {};

    $Handle('840', function(x) { update_order_status(x); }, params);
}

function update_order_status(response) {
    var props = response['props'];
    var status = response['data'];

    //alert(status+':'+columns.join('-')+':'+props.join('-'));

    if (is_empty(status))
        return;

    var ob = SelectedGetItem(LINE, 'ob');

    if (is_null(ob))
        return;

    function clean_class(ob) {
        review_classes.forEach(function(x, index) {
            ob.removeClass(x);
        });
    }

    clean_class(ob);

    $('td', ob).each(function(index) {
        if (props.indexOf(index) > -1) {
            clean_class($(this));
            $(this).removeClass("selected").addClass(status).addClass("noselected");
        }
    });

    ob.removeClass("unread");

    ob.addClass(status);
}

function approval_sent(x) {
    $NotificationDialog.open(keywords['Message:Action was done successfully']);
}

function notification_sent(x) {
    $NotificationDialog.open(keywords['Message:Action was done successfully']);
}

// --------------
// Page Functions
// --------------

function $Init() {
    $SidebarControl.init(sidebar_callback, ['seller']);

    page_sort_title = $("#sort_icon").attr('title');

    SelectedReset();

    $LineSelector.init();
    //$SublineSelector.init();
    //$ShowMenu(default_menu_item);
    //$TabSelector.init();

    // ------------------------
    // Start default log action
    // ------------------------

    interrupt(true, 1);
}

function $Confirm(mode, ob) {
    $ConfirmDialog.close();

    if (mode == 1) {
        switch (confirm_action) {
            case 'admin:deleteorder':
                $ProvisionSelectorDialog.confirmed();
                break;
            case 'admin:download':
            case 'admin:delete-orders':
            case 'admin:clear-history':
                $ProvisionServiceDialog.confirmed();
                break;
            case 'admin:send-approval':
            case 'admin:send-review-notification':
            case 'admin:send-order-notification':
                $ProvisionServiceDialog.lived();
                break;
        }
    }

    confirm_action = '';
}

function $Notification(mode, ob) {
    $NotificationDialog.close();
}

function $ShowMenu(id, status, path) {

    // -----------------------------------------
    // Show (open) selected DataMenu item (Tabs)
    // -----------------------------------------

    var reviews = $("#reviews-content");
    var params = $("#params-content");
    var items = $("#items-content");
    var payments = $("#payments-content");
    var comments = $("#comments-content");
    var documents = $("#documents-content");
    var statuses = $("#statuses-content");

    var tab = $("#"+id);

    if (selected_data_menu)
        selected_data_menu.removeClass('selected');

    selected_data_menu = tab;

    reviews.hide();
    params.hide();
    items.hide();
    payments.hide();
    comments.hide();
    documents.hide();
    statuses.hide();

    if (id == 'data-menu-reviews')
        reviews.show();
    else if (id == 'data-menu-params')
        params.show();
    else if (id == 'data-menu-items')
        items.show();
    else if (id == 'data-menu-payments')
        payments.show();
    else if (id == 'data-menu-comments')
        comments.show();
    else if (id == 'data-menu-documents')
        documents.show();
    else if (id == 'data-menu-statuses')
        statuses.show();

    if (id == default_menu_item)
        $SublineSelector.init();
    else if (['data-menu-statuses'].indexOf(id) == -1)
        $TablineSelector.init(tab);

    selected_data_menu.addClass('selected');
    selected_data_menu_id = id;

    if (IsLog)
        console.log('$ShowMenu, selected_data_menu_id:', selected_data_menu_id);
}

function $onPaginationFormSubmit(frm) {
    return true;
}

function $onFilterFormSubmit(frm) {
    return true;
}

function $onInfoContainerChanged(startup) {
    if (default_startups.indexOf(startup) > -1)
        return;

    if (!is_null(timer))
        return;

    var container = $("#line-content");
    var box = $("#line-box");

    if (!is_exist(container) || !is_exist(box))
        return;

    //alert(startup);

    if (startup == 'refresh')
        removeClass(container, "hidden");

    // Flag: sidebar is open
    var s = $SidebarControl.state == 1;
    // Flag: this is mobile frame
    var f = $IS_FRAME == 0;

    //alert('W:'+[$_width('screen-max'), $_width('screen-min'), $_width('max'), $_width('min')].join(':'));
    //alert('H:'+[$_height('screen-max'), $_height('screen-min'), $_height('max'), $_height('min'), $_height('available')].join(':'));

    var mainmenu = $("#mainmenu");
    var info_container = $("#info-container");
    var pagination = $("table", "#log-pagination");

    if (!is_exist(info_container) || info_container.height() == 0)
        return;

    var content_width = $("#line-table").width();
    var sidebar_width = s ? $("#sidebarFrame").width() : 50;
    var box_width = box.width();
    var info_height = $("#tab-content").height() + mainmenu.height(); // $("#tab-content") info_container
    var pagination_width = Math.max(pagination.width() + 10, mainmenu.width());

    //alert(startup+':'+info_height+':'+$IS_FRAME+':'+is_webkit+':'+is_full_container);

    var screen_width = 0;
    var screen_height = 0;
    var W = 0;
    var H = 0;
    
    var default_min_height = 0;

    if (f) {
        screen_width = $_width('max');
        screen_height = $_height('max'); //'available'

        W = screen_width - sidebar_width - (s ? 40 : 0); //48
        H = screen_height - 215;

        info_height += 20;
        default_min_height = 216;
    }
    else {
        var mode = 'min'; //is_webkit ? 'min' : 'max';

        screen_width = $_width(mode);
        screen_height = $_height('max');

        W = screen_width - sidebar_width - (s ? 48 : 22);
        H = screen_height - 186;

        info_height += 10;
        default_min_height = 304;
    }

    if (is_full_container)
        H = H - info_height; //H = H - info_height > default_min_height ? H - info_height : default_min_height;

    if (pagination_width > W)
        W = pagination_width;

    //if ($_screen_with_scroll('height') && $IS_FRAME == 1) W = W - 20;

    if (W == line_base_size[0] && H == line_base_size[1] && startup != 'refresh')
        return;

    if (IsDebug)
        alert([startup, f, s, 'W', sidebar_width, screen_width, box_width, content_width, W, 'H', screen_height, H].join(':'));

    var width = int(W) - 6;
    var height = int(H) - 6;

    if (is_full_container) {
        container.css("height", $_get_css_size(H));
        box.css("height", $_get_css_size(height));

        if (f && s)
            return;
    }

    if (IsOptionContainerChanged) {
        container.css("width", $_get_css_size(W));
        box.css("width", $_get_css_size(width));

        if (!f && !is_full_container)
            box.css({ "overflow-y" : "hidden", "overflow-x" : width <= content_width ? "scroll" : "hidden" });
    }

    line_base_size = [W, H];

    $reset_container();
}

function $reset_container() {
    var control = $("#note");
    var control_width_offset = $IS_FRAME == 0 ? 56 : 74; //74
    var content = $("#line-content");
    var W = Math.min(line_base_size[0], content.width());
    var subline = $("#subline-data");
    var subline_width = is_exist(subline) ? subline.width() : 0;
    var buttons = $("#review-data-buttons");
    var buttons_children = is_exist(buttons) ? buttons.children().length : 3;
    var buttons_width = buttons_children > 1 ? 654 : 240; // 586
    //var width = Math.max(240, buttons_width);
    var width = buttons_width < 654 ? Math.max(buttons_width, int(W - subline_width - control_width_offset)) : buttons_width;
    //var width = Math.max(240, buttons_width, int(W - subline_width - control_width_offset));

    //alert([buttons_children, buttons_width, subline_width, W, width].join(':'));

    control.css("width", $_get_css_size(width)); // IE !!!
}

function $onTabSelect(ob) {
    var id = ob.attr("id");

    $ShowMenu(id);

    var tab = $("#selected_data_menu_id");

    if (is_exist(tab))
        tab.val(selected_data_menu_id);

    var box = $("#dates-box");

    if (!is_exist(box))
        return;

    if ($TabSelector.number == $TabSelector.count)
        box.show();
    else
        box.hide();

    return true;
}

// ===========================
// Dialog windows declarations
// ===========================

function MakeFilterSubmit(mode, page) {
    $("#filter-form").attr("action", baseURI);

    switch (mode) {

        // -------------
        // Submit modes:
        // -------------
        //  0 - changed subdivision
        //  1 - changed author
        //  2 - changed seller
        //  3 - changed currency
        //  4 - changed condition
        //  5 - changed date from
        //  5 - changed date to
        //  6 - changed status
        //  7 - changed paid

        case 0:
            //$("#reviewtype").each(function() { $(this).val(0); });
        case 1:
        case 2:
        case 3:
        case 4:
        case 5:
        case 6:
        case 7:
            $("#window_scroll").each(function() { $(this).val(0); });
            no_window_scroll = true;
            break;

        // ---------------------------
        // LineSelector Handler submit
        // ---------------------------

        case 9:
            $("#order_id").each(function() { $(this).val(0); });
            $("#review_id").each(function() { $(this).val(0); });
    }

    $ResetLogPage();

    $setPaginationFormSubmit(page);
    $onParentFormSubmit('filter-form');
}

function MakeAction(ob) {
    var id = ob.attr("id");
    var action = 
        (id == 'REVIEW_ACCEPT' ? '832' : 
        (id == 'REVIEW_REJECT' ? '833' : 
        (id == 'REVIEW_CONFIRM' ? '834' : 
        (id == 'REVIEW_CONFIRMATION' ? '835' : 
        (id == 'ADD_PARAM'   || id == 'DEL_PARAM'   || id == 'SAVE_PARAM'   ? '836' : 
        (id == 'ADD_ITEM'    || id == 'DEL_ITEM'    || id == 'SAVE_ITEM'    ? '837' : 
        (id == 'ADD_PAYMENT' || id == 'DEL_PAYMENT' || id == 'SAVE_PAYMENT' ? '838' : 
        (id == 'ADD_COMMENT' || id == 'DEL_COMMENT' || id == 'SAVE_COMMENT' ? '839' : 
        (id == 'DEL_DOCUMENT' ? '847' : 
        (['EDIT_PARAM', 'EDIT_ITEM', 'EDIT_PAYMENT', 'EDIT_COMMENT'].indexOf(id) > -1 ? '841' : 
        (['CANCEL_PARAM', 'CANCEL_ITEM', 'CANCEL_PAYMENT', 'CANCEL_COMMENT'].indexOf(id) > -1 ? '000' : 
        (id.startswith('STATUS_') ? '842' :
        null))))))))))));

    if (is_null(action))
        return false;

    else if (action == '000')
        $PageLoader.cancel(action, ob, id);

    else if (action == '842')
        $PageLoader.handle_status(action, ob, id);

    else if (action == '841')
        $PageLoader.get(action, ob, id);

    else if (action == '836')
        $PageLoader.handle_param(action, ob, id);

    else if (action == '837')
        $PageLoader.handle_item(action, ob, id);

    else if (action == '838')
        $PageLoader.handle_payment(action, ob, id);

    else if (action == '839')
        $PageLoader.handle_comment(action, ob, id);

    else if (action == '847')
        $PageLoader.handle_document(action, ob, id);

    else {
        should_be_updated = true;
        selected_menu_action = action;
        $InProgress(ob, 1);
        $Go(action);
    }

    return true;
}

// ====================
// Page Event Listeners
// ====================

jQuery(function($) 
{
    // ---------------
    // Register review
    // ---------------

    $("#data-section").on('click', '.btn', function(e) {
        var ob = $(this);
        var id = ob.attr('id');

        if (is_null(id))
            return;

        //alert(['btn:', e.target, $(this), id].join(':'));

        if (id == 'REVIEW_CONFIRM') {
            $ProvisionReviewDialog.open(ob, 'review');
            return;
        }
        if (id == 'REVIEW_PAID') {
            $ProvisionReviewDialog.open(ob, 'paid');
            return;
        }
        if (id == 'ADD_DOCUMENT') {
            $ProvisionImageLoader.add_document(ob, id);
            return;
        }

        MakeAction(ob);
    });

    $("#data-section").on('change', '#uploadDocument', function(e) {
        var value = $(this).val().split("\\");
        if (!is_null(value) && value.length > 0) {
            value = value[value.length-1];
            $("#document_filename").val(value);
        }
    });

    // -------------
    // Tab selection
    // -------------

    $("#data-section").on('click', '.menu', function(e) {
        $TabSelector.onClick($(this));
    });

    // --------------
    // Line selection
    // --------------

    $("#data-section").on('click', 'a', function(e) {
        e.stopPropagation();
    });

    $(".line").click(function(e) {
        //console.log(e.target, $(this).has(e.target).length, e.target.tagName);

        if (is_show_error || $PageLoader.locked() || e.target.tagName == 'A')
            return;

        $PageLoader.activate($(this));
        /*
        $PageLoader.reset();

        $LineSelector.onRefresh($(this));
        */
    });

    // -----------------
    // SubLine selection
    // -----------------

    $("#data-section").on('click', '.subline', function(e) {
        if (is_show_error)
            return;

        $SublineSelector.onRefresh($(this));
    });

    // -----------------
    // Tabline selection
    // -----------------

    $("#data-section").on('click', '.tabline', function(e) {
        if ($PageLoader.is_shown)
            return;

        $TablineSelector.onRefresh($(this));
    });

    $("#history-box").on('click', '.history', function(e) {
        $TablineSelector.onRefresh($(this));
    });

    // -----------------------------------
    // Data Section progress & Maintenance
    // -----------------------------------

    $("#data-section").on('click', '.column', function(e) {
        var ob = $(this);
        var parent = ob.parents("*[class*='line']").first();
        if (is_exist(parent) && !parent.hasClass("tabline") && !ob.hasClass("header") && $PageLoader.is_activated())
            $InProgress(ob, 1);
    });

    $("#data-section").on('focusin', 'textarea', function(e) {
        is_input_focused = true;
    }).on('focusout', function(e) {
        is_input_focused = false;
    });

    $("#data-section").on('focusin', 'input', function(e) {
        is_input_focused = true;
    }).on('focusout', function(e) {
        is_input_focused = false;
    });

    // ------------------------
    // Control Panel Menu items
    // ------------------------

    $("#uploadButton").on('change', function(e) {
        var value = $(this).val().split("\\");
        if (!is_null(value) && value.length > 0) {
            value = value[value.length-1];
            $("#filename").val(value);
        }
    });

    $("button[id^='admin']", this).click(function(e) {
        var ob = $(this);
        var command = ob.attr('id');

        $onControlPanelClick($("#admin-panel-dropdown"));

        if (command == 'admin:create') {
            $ProvisionSelectorDialog.create();
            return;
        }
        
        if (command == 'admin:update') {
            $ProvisionSelectorDialog.update();
            return;
        }

        if (command == 'admin:delete') {
            $ProvisionSelectorDialog.delete();
            return;
        }

        if (command == 'admin:clone') {
            $ProvisionSelectorDialog.clone();
            return;
        }

        if (command == 'admin:history') {
            $ProvisionOrderHistoryDialog.open(ob, 'order');
            return;
        }
    });

    $("button[id^='service']", this).click(function(e) {
        var command = $(this).attr('id');

        $onControlPanelClick($("#services-dropdown"));
        
        if (IsAdmin && command == 'service:upload') {
            $ProvisionServiceDialog.upload();
            return;
        }
        
        if (IsAdmin && command == 'service:download') {
            $ProvisionServiceDialog.download();
            return;
        }
        
        if (IsAdmin && command == 'service:delete-orders') {
            $ProvisionServiceDialog.deleteOrders();
            return;
        }
        
        if (command == 'service:send-approval') {
            $ProvisionServiceDialog.sendApproval();
            return;
        }
        
        if (command == 'service:send-review-notification') {
            $ProvisionServiceDialog.sendReviewNotification();
            return;
        }
        
        if (command == 'service:send-order-notification') {
            $ProvisionServiceDialog.sendOrderNotification();
            return;
        }
        
        if (IsAdmin && command == 'service:clear-history') {
            $ProvisionServiceDialog.clearHistory();
            return;
        }
    });

    $("button[id^='action']", this).click(function(e) {
        var ob = $(this);
        var command = ob.attr('id');

        $onControlPanelClick($("#actions-dropdown"));

        if (command == 'action:set-unread') {
            $ProvisionReviewDialog.set_unread(ob);
            return;
        }

        if (command == 'action:set-read') {
            $ProvisionReviewDialog.set_read(ob);
            return;
        }

        if (command == 'action:set-all-read') {
            $ProvisionReviewDialog.set_read(ob, 'all');
            return;
        }
        
        if (command == 'action:print-order') {
            $ProvisionReviewDialog.print_order(ob);
            return;
        }
    });

    // -------------
    // Resize window
    // -------------

    $(window).on("resize", function() {
        resize();
    });

    $(window).scroll(function(e){});

    // --------
    // Keyboard
    // --------

    $(window).keydown(function(e) {
        if ($ConfirmDialog.is_focused() || $NotificationDialog.is_focused())
            return;

        if (is_show_error)
            return;

        if (e.keyCode==13) {                                     // Enter
        }
        
        if (e.keyCode==27) {                                     // Esc
        }

        if ($BaseDialog.is_focused() || is_search_focused || is_input_focused)
            return;

        var exit = false;

        if (e.shiftKey && e.keyCode==76) {                       // Shift-L
            $ProvisionServiceDialog.upload();
            exit = true;
        }
        
        else if (e.shiftKey && e.keyCode==73) {                  // Shift-I
            $ProvisionSelectorDialog.create();
            exit = true;
        }

        else if (e.shiftKey && e.keyCode==85) {                  // Shift-U
            $ProvisionSelectorDialog.update();
            exit = true;
        }

        else if (e.shiftKey && e.keyCode==68) {                  // Shift-D
            $ProvisionSelectorDialog.delete();
            exit = true;
        }

        else if (e.shiftKey && e.keyCode==84) {                  // Shift-T
            $ProvisionSelectorDialog.clone();
            exit = true;
        }

        else if (e.shiftKey && e.keyCode==70) {                  // Shift-F
            if (IsAdmin) $ProvisionServiceDialog.download();
            exit = true;
        }

        else if (e.shiftKey && e.keyCode==71) {                  // Shift-G
            if (IsAdmin) $ProvisionServiceDialog.deleteOrders();
            exit = true;
        }

        else if (e.shiftKey && e.keyCode==72) {                  // Shift-H
            $ProvisionServiceDialog.sendApproval();
            exit = true;
        }

        else if (e.shiftKey && e.keyCode==74) {                  // Shift-J
            if (IsAdmin) $ProvisionServiceDialog.clearHistory();
            exit = true;
        }

        else if (e.shiftKey && e.keyCode==81) {                  // Shift-Q
            MakeAction($("#REVIEW_CONFIRM"));
            exit = true;
        }

        else if (e.shiftKey && e.keyCode==87) {                  // Shift-W
            MakeAction($("#REVIEW_ACCEPT"));
            exit = true;
        }

        else if (e.shiftKey && e.keyCode==69) {                  // Shift-E
            MakeAction($("#REVIEW_REJECT"));
            exit = true;
        }

        else if (e.shiftKey && e.keyCode==188) {                 // Shift-<
            $ProvisionReviewDialog.set_unread();
            exit = true;
        }

        else if (e.shiftKey && e.keyCode==190) {                 // Shift->
            $ProvisionReviewDialog.set_read();
            exit = true;
        }

        else if (e.shiftKey && e.keyCode==80) {                  // Shift-P
            $ProvisionReviewDialog.print_order();
            exit = true;
        }

        else if (e.shiftKey && e.keyCode==77) {                  // Shift-M
            $ProvisionOrderHistoryDialog.open(null, 'order');
            exit = true;
        }

        //alert(e.ctrlKey+':'+e.shiftKey+':'+e.altKey+':'+e.keyCode);

        if (exit) {
            e.preventDefault();
            return false;
        }
    });
});

function page_is_focused(e) {
    if (e.shiftKey)
        return is_input_focused;
    return false;
}

function resize() {
    $onInfoContainerChanged('resize');
}

function $_activate(check) {
    var id = 'selected_data_menu_id';
    var tab = $("#"+id);
    var exists = is_exist(tab) && tab.attr('id') == id ? 1 : 0;
    if (check) {
        $("#window_scroll").each(function() { $(this).val(page_scroll_top); });
        return exists;
    }
    return exists ? tab : null;
}

function $_show_page(mode) {
    $ShowPage(mode);
}

// =======
// STARTER
// =======

$(function() 
{
    if (IsTrace)
        alert('Document Ready (provision)');

    IsShowLoader = 1;

    default_screen_max = $_width('screen-max');

    $("#search-context").attr('placeholder', 'Найти номер заявки, товар...');

    IsOptionRowspan = 0;
    IsOptionContainerChanged = default_screen_max <= 1280 && $IS_FRAME == 1 ? 1 : 0;
    IsOptionCheckBigScreen = default_screen_max > 1600 ? 0 : 1;

    var tab = $_activate(0);
    selected_data_menu_id = !is_null(tab) ? tab.val() : '';

    window_scroll = int($("#window_scroll").val() || 0);

    current_context = 'provision';
    resize();

    try {
        $_init();
    }
    catch(e) {}
});
