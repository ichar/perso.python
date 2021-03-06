// ********************************
// HELPER FUNCTION CONTROLS MANAGER
// --------------------------------
// Version: 1.0
// Date: 14-07-2019

// =======================
// Component control class
// =======================

var $ReferenceDialog = {

    is_focused: function() {
        return false;
    }

};

var $PageScroller = {
    page      : { 'base':null, 'top':0, 'height':0 },
    control   : { 'ob':null, 'default_position':0, 'top':0, 'height':0, 'isDefault':0, 'isMoved':0, 'isShouldBeMoved':0 },
    position  : 0,
    is_trace  : 0,

    init: function() {
    },

    reset: function(force) {
    },

    trace: function(force) {
    },

    checkPosition: function(reset) {
    },

    move: function() {
    }
};

// Current review container ID
var selected_review_id = 'subline_review';
// Size for scroll after activate
var window_scroll = 0;
// Page scroll mode by default
var default_scroll_mode = 'on-place';

var $PageLoader = {
    container   : null,
    actions     : {'param' : '830-1', 'item' : '830-2', 'payment' : '830-3', 'comment' : '830-4', 'document' : '830-5'},

    IsDebug : 0, IsDeepDebug : 0, IsTrace : 0, IsLog : 0,

    action      : null,
    id          : null,
    command     : '',
    mode        : '',
    
    scroll_mode : '',
    scroll_top  : 0,
    top         : 0,
    height      : 0,

    is_error    : false,
    is_shown    : false,
    is_locked   : false,

    line        : {'id' : null, 'state_is_open' : -1},

    init: function() {
        this.container = $("#"+selected_review_id);

        if (this.IsTrace)
            alert('init:'+$LineSelector.get_id()+':'+$LineSelector.get_current().get(0).outerHTML);

        this.line['id'] = null;

        this.scroll_top = $(window).scrollTop();
    },

    reset: function() {
        this._show();
        this._reset();

        this.scroll_top = $(window).scrollTop();
    },

    scroll: function() {
        if (window_scroll != null) {
            $(window).scrollTop(window_scroll || 0);

            window_scroll = null;

            $_show_page(0);
            return;
        }

        var current_top = $LineSelector.get_current().position().top;

        if (this.IsDebug)
            alert(['scroll', this.scroll_mode, this.line['state_is_open'], this.scroll_top, this.height, int(this.top), int(current_top)].join(':'));

        if (this.top == 0 || this.height == 0 || this.top > current_top)
            return;

        var offset = 5;

        switch (this.scroll_mode) {
            case 'top':
                $(window).scrollTop(current_top - offset);
                break;
            case 'on-place':
                if (this.line['state_is_open'] != 0) {
                    var x = this.scroll_top - this.height - offset;
                    if (x > 0)
                        $(window).scrollTop(x);
                }
                break;
            default:
                break;
        }

        this.scroll_mode = '';
    },

    remove_current: function() {
        if (!is_null(this.container)) {
            try {
                this.top = this.container.position().top;
                this.height = this.container.height();
            } 
            catch(e) {
                if (this.IsTrace) 
                    alert('$PageLoader.remove_current: Error');
                this.height = 0;
            }
            this.container.remove();
        }
    },

    update_tab: function(mode, data) {
        if (is_null(data)) {
            $onInfoContainerChanged('refresh');
            return;
        }

        $updateTabData(mode, data['data'], data['config'], data['total'], data['status'], null);
    },

    _lock: function() {
        this.is_locked = true;
    },

    _unlock: function() {
        this.is_locked = false;
    },

    locked: function() {
        return this.is_locked;
    },

    _before: function(ob, command) {
        should_be_updated = true;
        selected_menu_action = default_log_action;

        this.command = command;

        if (!is_null(this.command)) {
            if (this.command.toLowerCase().search('add') > -1)
                this.id = null;
            else
                this.id = $TablineSelector.get_id();
        }

        $InProgress(ob, 1);

        this.is_error = false;
    },

    _reset: function() {
        this.action = null;
        this.id = null;
        this.mode = null;
    },

    _hide: function() {
        if (is_empty(this.mode))
            return;

        var key = this.mode.toUpperCase();

        $("#ADD_"+key).hide();
        $("#EDIT_"+key).hide();
        $("#DEL_"+key).hide();
        $("#SAVE_"+key).show();
        $("#CANCEL_"+key).show();

        this.is_shown = true;
    },

    _show: function() {
        if (is_empty(this.mode))
            return;

        var key = this.mode.toUpperCase();

        $("#ADD_"+key).show();
        $("#EDIT_"+key).show();
        $("#DEL_"+key).show();
        $("#SAVE_"+key).hide();
        $("#CANCEL_"+key).hide();

        this.is_shown = false;
    },

    _clean: function() {
        switch (this.mode) {
            case 'param':
                $("#param").val('0');
                $("#new_param").val('');
                $("#param_value").val('');
                break;
            case 'item':
                $("#item_name").val('');
                $("#item_qty").val(0);
                $("#item_units").val('');
                $("#item_total").val('');
                $("#item_account").val('');
                break;
            case 'payment':
                $("#payment").val('0');
                $("#new_payment").val('');
                $("#payment_date").val('');
                $("#payment_total").val('');
                $("#payment_status").val('0');
                break;
            case 'comment':
                $("#comment").val('0');
                $("#new_comment").val('');
                $("#comment_value").val('');
                break;
            case 'document':
                $("#document_filename").val('');
                $("#document_value").val('');
                break;
        }
    },

    set: function(x) {
        var data = x['data']['data'][0];

        if (this.IsLog)
            console.log('$PageLoader.set, mode:', this.mode, data, x);

        switch (this.mode) {
            case 'param':
                $("#param").val(data['ParamID']);
                $("#new_param").val('');
                $("#param_value").val(data['Value']);
                break;
            case 'item':
                $("#item_name").val(data['Name']);
                $("#item_qty").val(data['Qty']);
                $("#item_units").val(data['Units']);
                $("#item_total").val(data['Total']);
                $("#item_account").val(data['Account']);
                break;
            case 'payment':
                $("#payment").val(data['PaymentID']);
                $("#new_payment").val('');
                $("#payment_date").val(data['PaymentDate']);
                $("#payment_total").val(data['Total']);
                $("#payment_status").val(data['StatusID']);
                break;
            case 'comment':
                $("#comment").val(data['CommentID']);
                $("#new_comment").val('');
                $("#comment_value").val(data['Value']);
                break;
            case 'document':
                $("#document_filename").val(data['FileName']);
                $("#document_value").val(data['Note']);
                break;
        }

        this._hide();
        this._after();
    },

    get: function(action, ob, command) {
        this.action = action;
        this.mode = command.split('_')[1].toLowerCase();

        this._before(ob, command);

        var params = {'command':command, 'id':this.id};

        $Handle(this.action, function(x) { $PageLoader.set(x); }, params);
    },

    cancel: function(action, ob, command) {
        this._clean();
        this._show();
        this._after();
    },

    check: function(x) {
        var errors = x['errors'];

        if (this.IsLog)
            console.log('$PageLoader.check, errors:', errors.length);

        if (!is_null(errors) && errors.length > 0) {
            var msg = errors.join('<br>');
            $ShowError(msg, true, true, false);
            this.is_error = true;

            this._show();
        }
    },

    check_refer: function(x) {
        var refer = x['refer'];

        if (is_empty(refer))
            return;

        var key = refer[0];
        var id = refer[1];
        var value = refer[2];

        var obs = [$("select[id='__"+key+"']", $("#provision_container_template")), 
                   $("select[id='"+key+"']", $("#"+key+"s-items"))];

        if (this.IsLog)
            console.log('$PageLoader.check_refer, refer:', refer, obs);

        obs.forEach(function(container, index) {
            if (!is_null(container)) {
                var options = container.prop("options");
                var option = new Option(value, id, false, false);

                if (!is_null(options))
                    options[options.length] = option;
            }
        });
    },

    handle: function(x) {
        this.check(x);

        if (this.mode in this.actions) {
            if (!this.is_error) {
                this.update_tab(this.actions[this.mode], x['data']);
                this.check_refer(x['data']);
            }

            this._clean();
            this._show();
        
            if (this.command.toLowerCase().search('del') > -1)
                this.id = null;

            var menu = 'data-menu-'+this.mode+'s';

            $ShowMenu(menu);

            if (this.IsLog)
                console.log('$PageLoader.handle, command:', this.command, this.id);

            if (!is_null(this.id))
                $TablineSelector.set_current_by_id(this.id);
        } 
        else if (this.mode == 'set-status') {
            var status= x['data'];
            
            if (!this.is_error)
                this.set_status(status);
        }

        this._reset();
        this._after();
    },

    handle_param: function(action, ob, command) {
        this.action = action;
        this.mode = 'param';

        this._before(ob, command);

        var param_id = $("#param").val();
        var new_param = $("#new_param").val();
        var value = $("#param_value").val();
        var params = {'command':command, 'id':this.id, 'param_id':param_id, 'new_param':new_param, 'value':value};

        $Handle(this.action, function(x) { $PageLoader.handle(x); }, params);
    },

    handle_item: function(action, ob, command) {
        this.action = action;
        this.mode = 'item';

        this._before(ob, command);

        var name = $("#item_name").val();
        var qty = $("#item_qty").val();
        var units = $("#item_units").val();
        var total = $("#item_total").val();
        var account = $("#item_account").val();
        var no_tax = $("#item_no_tax").prop('checked') ? 1 : 0;
        var params = {'command':command, 'id':this.id, 'name':name, 'qty':qty, 'units':units, 'total':total, 'no_tax':no_tax, 'account':account};

        $Handle(this.action, function(x) { $PageLoader.handle(x); }, params);
    },

    handle_payment: function(action, ob, command) {
        this.action = action;
        this.mode = 'payment';

        this._before(ob, command);

        var payment_id = $("#payment").val();
        var new_payment = $("#new_payment").val();
        var date = $("#payment_date").val();
        var total = $("#payment_total").val();
        var status = $("#payment_status").val();
        var params = {'command':command, 'id':this.id, 'payment_id':payment_id, 'new_payment':new_payment, 'date':date, 'total':total, 'status':status};

        $Handle(this.action, function(x) { $PageLoader.handle(x); }, params);
    },

    handle_comment: function(action, ob, command) {
        this.action = action;
        this.mode = 'comment';

        this._before(ob, command);

        var comment_id = $("#comment").val();
        var new_comment = $("#new_comment").val();
        var note = $("#comment_value").val();
        var params = {'command':command, 'id':this.id, 'comment_id':comment_id, 'new_comment':new_comment, 'note':note};

        $Handle(this.action, function(x) { $PageLoader.handle(x); }, params);
    },

    handle_document: function(action, ob, command, data) {
        this.action = action;
        this.mode = 'document';

        if (this.IsTrace)
            alert('handle_document, action:'+action+', command:'+command);

        this._before(ob, command);

        var params = {'command':command, 'id':this.id};

        if (command == 'DEL_DOCUMENT')
            params['document_id'] = $TablineSelector.get_id();

        $Handle(this.action, function(x) { $PageLoader.handle(x); }, params);
    },

    handle_status: function(action, ob, command) {
        this.action = action;
        this.mode = 'set-status';

        this._before(ob);

        var params = {'command':command};

        $Handle(this.action, function(x) { $PageLoader.handle(x); }, params);
    },

    set_status: function(status) {
        $("#status-info").removeClass().addClass(status[0]).html(status[1]);
    },

    disable_edit: function(props) {
        var prop_disabled = props['disabled_edit'];

        if (!prop_disabled)
            return;

        var obs = $(".edit-box");

        obs.each(function(index) {
            $(this).prop("disabled", prop_disabled).hide();
        });
    },

    disable_review: function(props) {
        var prop_disabled = props['disabled_review'];

        $("#info-container").addClass(prop_disabled ? 'frozen' : 'editable');

        if (!prop_disabled)
            return;

        var hidden = 0;
        var obs = $("#review-data-buttons").children();

        obs.each(function(index) {
            var ob = $(this);
            var id = ob.attr('id');

            if (['REVIEW_CONFIRM', 'REVIEW_ACCEPT', 'REVIEW_REJECT'].indexOf(id) > -1) {
                ob.prop("disabled", prop_disabled).addClass('invisible');
                ++hidden;
            }
        });

        if (hidden == obs.length)
            $("#review-info-data").addClass('hidden');
    },

    _register: function() {
        this.container = $("#"+selected_review_id);
        
        this.line['id'] = $LineSelector.get_id();
        this.line['state_is_open'] = 1;
    },

    is_activated: function() {
        return this.line['state_is_open'] == -1 ? true : false;
    },

    activate: function(ob) {
        var line_id = $_get_item_id(ob);

        if (this.IsDeepDebug)
            alert(['activate', this.line['id'], line_id, this.container.attr('id'), ob.position().top].join(':'));

        if (this.line['id'] == line_id) {
            if (this.line['state_is_open'] == 1) {
                this.container.addClass('closed');
                this.line['state_is_open'] = 0;
            }
            else if (this.line['state_is_open'] == 0) {
                this.container.removeClass('closed');
                this.line['state_is_open'] = 1;
                
            }
            return;
        }

        this.scroll_mode = default_scroll_mode;

        $LineSelector.onRefresh(ob);
    },

    refresh: function(x) {
        /***
         *  Called by default_handler, action:default_log_action
         */
        if (this.IsTrace)
            alert('$PageLoader.refresh');

        this.reset();

        var current_action = default_action;

        this.init();

        this._lock();

        this.remove_current();

        var content = $("#provision_container_template").html().replace(/__/g, '');
        var columns = x['columns'];
        var colspan = columns.length || 10;

        $LineSelector.get_current().after(
            '<tr class="line" id="'+selected_review_id+'"><td colspan="'+colspan.toString()+'">'+content+'</td></tr>'
            );

        var total = parseInt(x['total'] || 0);
        var status = x['status'];
        var path = x['path'];
        var props = x['props'];

        $updateSublineData(current_action, x, props, total, status, path);

        var tabs = x['currentfile'][1]['tabs'];
        var status = x['currentfile'][1]['status'];

        this.update_tab(this.actions['param'], tabs['params']);
        this.update_tab(this.actions['item'], tabs['items']);
        this.update_tab(this.actions['payment'], tabs['payments']);
        this.update_tab(this.actions['comment'], tabs['comments']);
        
        if (is_show_documents)
            this.update_tab(this.actions['document'], tabs['documents']);

        this.set_status(status);

        this.disable_review(props);
        this.disable_edit(props);

        if (this.IsLog)
            console.log('$PageLoader.refresh, selected_data_menu_id:', selected_data_menu_id);

        $TabSelector.init();

        if (!is_empty(selected_data_menu_id))
            $TabSelector.set_current_by_id(selected_data_menu_id);
        else {
            $ShowMenu(default_menu_item);
            $TabSelector.onMove(selected_data_menu_id);
        }

        $onInfoContainerChanged('refresh');

        if (!is_full_container)
            this.scroll();

        this._unlock();

        this._after();

        this._register();
    },

    _after: function() {
        selected_menu_action = default_log_action;
        isCallback = false;
    }
};
