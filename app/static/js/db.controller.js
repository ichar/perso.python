// ***********************
// BANKPERSO DB CONTROLLER
// -----------------------
// Version: 1.50
// Date: 08-12-2017

var current_order_type = -1;            // Order type (otype) code value
var current_order_code = '';            // Current Order code value: C-000-0000

var LOG_SORT = new Array('', 'TOTAL-DESC', 'TOTAL-ASC', 'DATE-DESC', 'DATE-ASC', 'CUSTOM-CODE-DESC', 'CUSTOM-CODE-ASC');

var current_sort = 0;                   // Sorting index
var page_sort_title = '';               // Sorting title tag value

var current_line = null;                // Current (selected on Data section) line row
var current_subline = null;             // Current (selected on LogData section) subline row
var current_tabline = null;             // Current (selected on TabData section) line row

var current_row_id = null;              // ID of current (selected on Data section) row

var selected_data_menu_id = '';         // Selected Data menu item (Parameters/Products)
var selected_data_menu = null;          // Selected Data menu Object
var selected_dropdown = null;           // Selected Dropdown menu Object

var is_search_activated = false;        // Search is active
var is_search_focused = false;          // Search input in focus

var search_context = '';                // Current search context value

// Is obsolete !!! ------------------------------------------------------------------------------
/*
var IsGoPagination = false;             // Reset Log page screen flag

var page_total_rows = 0;                // Total rows on the current page
var screen_rows = 5;                    // Rows on a screen
var current_page = 0;                   // Current page number
var per_page = 10;                      // Total rows on a page by default or by custom selection
var pages = 0;                          // Total pages
*/
// ****************************************************

var default_row_item = {'num':0, 'id':null, 'ob':null};
var selected_row = 
{
    'admin'         : new Object(),
    'article'       : new Object(),
    'batch'         : new Object(),
    'change-status' : new Object(),
    'reference'     : new Object(),
    'event'         : new Object(),
    'file'          : new Object(),
    'order'         : new Object(),
    'preload'       : new Object(),
    'pers'          : new Object(),
    'oper'          : new Object(),

//  ---  Default Tab Line ---

    'tabline'       : new Object(),
};

function SelectedReset() {
    for(var key in selected_row) {
        selected_row[key] = new Object();
        for(var item in default_row_item)
            selected_row[key][item] = default_row_item[item];
    }
}

function SelectedSetItem(key, item, ob) {
    selected_row[key][item] = ob;
    if (item == 'ob')
        selected_row[key]['id'] = !is_null(ob) ? $_get_item_id(ob) : null;

    if (IsLog)
        console.log('SelectedSetItem... '+key+':'+item+', id:['+(ob && ob.attr('id'))+']');
}

function SelectedGetItem(key, item) {
    return !is_null(selected_row[key]) && (item in selected_row[key]) ? selected_row[key][item] : null;
}

// =======================
// Selected Items Handlers
// =======================

var $ActiveSelector = {
    
    selector : null,

    release: function() {
        if (is_null(this.selector))
            return;

        this.selector.release();
    },

    reset: function(ob) {
        this.selector = ob;

        if (IsLog)
            console.log('$ActiveSelector.reset:'+this.selector.alias);
    },

    is_movable: function() {
        return this.selector.is_movable();
    },

    get_current: function() {
        return this.selector.get_current();
    },

    onRefresh: function(ob) {
        return this.selector.onRefresh(ob);
    },

    onProgress: function(ob) {
        return this.selector.onProgress(ob);
    },

    up: function() {
        return this.selector.up();
    },
    
    down: function() {
        return this.selector.down();
    },

    home: function() {
        return this.selector.home();
    },
    
    pgup: function() {
        return this.selector.pgup();
    },
    
    pgdown: function() {
        return this.selector.pgdown();
    },
    
    end: function() {
        return this.selector.end();
    }
};

var $LineSelector = {
    container : null,

    // ===================
    // Line Selector Class
    // ===================

    IsDebug : 0, IsTrace : 0, IsLog : 0,

    // ----------------------------------------------------------
    // Current page (position): [0]:page, [1]:pages, [2]:per_page
    // ----------------------------------------------------------

    position  : new Array(),
    current   : null,
    oid       : '',
    number    : 0,

    page      : 0,
    pages     : 0,
    per_page  : 0,
    line      : 0,

    is_top    : false,
    is_bottom : false,

    is_end_of_data : false,

    init: function() {
        this.container = $("#line-content");
        $("#position").val().split(':').forEach(function(x) { this.push(parseInt(x)); }, this.position);

        this.page = this.position[0];
        this.pages = this.position[1];
        this.per_page = this.position[2];
        this.line = this.position[3];

        if (this.IsTrace)
            alert(this.position);

        this.current = null;
        this.oid = '';
        this.number = 0;

        var ob = $("tr[class~='selected']", this.container);
        $onToggleSelectedClass(LINE, ob, 'add', null);

        this.set_current(ob);

        this.reset();
    },

    reset: function() {
        this.is_top = this.is_bottom = this.is_end_of_data = false;
    },

    get_id: function() {
        return $_get_item_id(this.current);
    },

    get_current: function() {
        return this.current;
    },

    set_current: function(ob) {
        if (is_null(ob))
            return;

        this.current = ob;
        this.oid = ob.attr('id');
        this.number = parseInt($_get_item_id(ob, 2));

        if (this.IsTrace)
            alert(this.number);
    },

    set_position: function(page, line) {
        $("#position").val(page+':::'+line);
    },

    onReset: function() {
        this.reset();
        return this._refresh(0);
    },

    onRefresh: function(ob) {
        this.set_current(ob);
        return this._refresh(0);
    },

    onFormSubmit: function() {
        this.set_position(1, 1);
    },

    getSelectedItems: function(position) {
        var items = new Array();

        this.container.find(".line").each(function(index, x) {
            if (this.IsTrace)
                alert($(x).attr('id')+':'+parseInt($_get_item_id($(x), 2)));

            items.push(parseInt($_get_item_id($(x), position)));
        });

        return items;
    },

    _find: function(num) {
        var ob = null;

        this.container.find(".line").each(function(index, x) {
            if (this.IsTrace)
                alert($(x).attr('id')+':'+parseInt($_get_item_id($(x), 2)));
            if (parseInt($_get_item_id($(x), 2)) == num)
                ob = $(x);
        });

        if (this.IsTrace)
            alert('found:'+(ob ? ob.attr('id') : 'null'));

        return ob;
    },

    _refresh: function(new_page) {
        var exit = false;
        var page, line;

        if (this.IsLog)
            console.log('$LineSelector._refresh:'+this.number+':'+this.is_top+':'+this.is_bottom+':'+new_page);

        // --------------------
        // Refresh current page
        // --------------------

        if (new_page == 0 && !(this.is_top || this.is_bottom || this.is_end_of_data)) {
            $onToggleSelectedClass(LINE, this.current, 'submit', null);
            exit = true;
        }

        // ---------------
        // Open a new page
        // ---------------

        else {        
            if (new_page == 1) {
                page = new_page;
                line = 1;
            }
            else if (new_page > 0) {
                page = new_page;
                line = this.number;
            }
            else if (this.is_top) {
                page = this.page - 1;
                line = this.per_page;
            }
            else if (this.is_bottom) {
                page = this.page + 1;
                line = 1;
            }
            else
                return true;

            this.set_position(page, line);
            MakeFilterSubmit(9, page);

            exit = true;
        }

        return exit;
    },

    _move: function(direction) {
        var ob = null;
        var is_found = false;
        var num;

        // ------------------------
        // Move inside current page
        // ------------------------

        if ((direction > 0 && this.number < this.per_page) || (direction < 0 && this.number > 1)) {
            num = this.number + (direction > 0 ? 1 : -1);
            ob = this._find(num);
            if (!is_null(ob)) {
                this.current = ob;
                this.number = num;
                is_found = true;
            }
        }

        this.reset();

        if (!is_found) {
            this.is_end_of_data = (
                (direction < 0 && this.page == 1) || 
                (direction > 0 && this.page == this.pages)
                ) ? true : false;

            this.is_top = (direction < 0 && !this.is_end_of_data) ? true : false;
            this.is_bottom = (direction > 0 && !this.is_end_of_data) ? true : false;
        }

        if (this.IsTrace)
            alert('move:'+this.number+':'+this.is_top+':'+this.is_bottom);

        return is_found || this.is_top || this.is_bottom;
    },

    home: function() {
        return this._refresh(1);
    },

    up: function() {
        return this._move(-1) === true ? this._refresh(0) : false;
    },

    down: function() {
        return this._move(1) === true ? this._refresh(0) : false;
    },

    pgup: function() {
        return this.page > 1 ? this._refresh(this.page-1) : false;
    },

    pgdown: function() {
        return this.page < this.pages ? this._refresh(this.page+1) : false;
    },

    end: function() {
        return this._refresh(this.pages);
    }
};

var $SublineSelector = {
    container : null,

    // ======================
    // Subline Selector Class
    // ======================

    IsDebug : 0, IsTrace : 0, IsLog : 1,

    // ----------------
    // Config Object ID
    // ----------------

    alias     : '',         // Subline Object name
    mode      : '',

    current   : null,
    oid       : '',
    number    : 0,

    page      : 0,
    pages     : 0,
    per_page  : 0,
    line      : 0,

    is_top    : false,
    is_bottom : false,

    is_end_of_data : false,

    init: function() {
        this.container = $("#subline-content");

        if (this.IsLog)
            console.log('$SublineSelector.init');

        this.alias = SUBLINE;

        this.page = 1;
        this.pages = 1;
        this.line = 1;

        this.release();

        var ob = $("tr[class~='selected']", this.container);
        SelectedSetItem(this.alias, 'ob', ob, null);

        this.set_current(ob);

        this.reset();
    },

    release: function() {
        this.current = null;
        this.oid = '';
        this.number = 0;

        SelectedSetItem(this.alias, 'ob', null);
    },

    reset: function() {
        this.is_top = this.is_bottom = this.is_end_of_data = false;

        var size = this.container.find(".subline").length || 0;
        this.per_page = size;

        if (this.number > this.per_page)
            this.number = this.per_page;
    },

    get_id: function() {
        return $_get_item_id(this.current);
    },

    get_current: function() {
        return this.current;
    },

    set_current: function(ob) {
        if (is_null(ob))
            return;

        this.current = ob;
        this.oid = ob.attr('id');
        this.number = parseInt($_get_item_id(ob, 2));

        if (this.IsLog)
            console.log('$SublineSelector.set_current:'+is_null(this.current)+':'+this.oid+':'+this.number);

        $ActiveSelector.reset(this);
    },

    onRefresh: function(ob) {
        if (ob === null) {
            SelectedSetItem(this.alias, 'ob', null);
            this.is_end_of_data = true;

            $ActivateInfoData(0);
        }

        this.set_current(ob);
        return this._refresh(0);
    },

    onProgress: function(ob) {
        return isWebServiceExecute;
    },

    _find: function(num) {
        var ob = null;

        if (is_null(num) || num <= 0)
            return null;

        this.container.find(".subline").each(function(index, x) {
            if (this.IsTrace)
                alert($(x).attr('id')+':'+parseInt($_get_item_id($(x), 2)));
            if (parseInt($_get_item_id($(x), 2)) == num)
                ob = $(x);
        });

        if (this.IsTrace)
            alert('found:'+(ob ? ob.attr('id') : 'null'));

        return ob;
    },

    _refresh: function(new_page) {
        var exit = true;
        var line;

        if (this.IsLog)
            console.log('$SublineSelector._refresh:'+new_page+':'+this.is_top+':'+this.is_bottom+':'+this.is_end_of_data);

        // --------------------
        // Refresh current page
        // --------------------

        if (new_page == 0 && !(this.is_top || this.is_bottom || this.is_end_of_data)) {
            $HideLogPage();

            SelectedSetItem(this.alias, 'ob', this.current);
            //$onToggleSelectedClass(SUBLINE, this.current, 'submit', null);

            $ShowOnStartup();
        } 
        else
            exit = false;

        return exit;
    },

    _move: function(direction, number) {
        var is_found = false;
        var num = 0;

        // ------------------------
        // Move inside current page
        // ------------------------

        if ((direction > 0 && this.number < this.per_page) || (direction < 0 && this.number > 1))
            num = this.number + (direction > 0 ? 1 : -1);
        else if (direction == 0 && !is_null(number))
            num = number;
        
        var ob = this._find(num);

        if (!is_null(ob)) {
            this.set_current(ob);
            is_found = true;
        }

        this.reset();

        if (!is_found) {
            this.is_end_of_data = (
                (direction < 0 && this.page == 1) || 
                (direction > 0 && this.page == this.pages)
                ) ? true : false;

            this.is_top = (direction < 0 && !this.is_end_of_data) ? true : false;
            this.is_bottom = (direction > 0 && !this.is_end_of_data) ? true : false;
        }

        if (this.IsTrace)
            alert('move:'+this.number+':'+this.is_top+':'+this.is_bottom+':'+this.is_end_of_data);

        return is_found || this.is_top || this.is_bottom;
    },

    is_movable: function() {
        return !this.is_end_of_data && this.per_page > 0 ? true : false;
    },

    home: function() {
        return this._move(0, 1) === true ? this._refresh(0) : false;
    },

    up: function() {
        return this._move(-1) === true ? this._refresh(0) : false;
    },

    down: function() {
        return this._move(1) === true ? this._refresh(0) : false;
    },

    end: function() {
        return this._move(0, this.per_page) === true ? this._refresh(0) : false;
    }
};

var $TablineSelector = {
    container : null,

    // ======================
    // Tabline Selector Class
    // ======================

    IsDebug : 0, IsTrace : 0, IsLog : 1,

    // ----------------
    // Config Object ID
    // ----------------

    alias     : '',         // Tabline Object name
    mode      : '',
    
    // ------------------------------------------------
    // Current page: page=pages=1, per_page:rows number
    // ------------------------------------------------

    current   : null,
    oid       : '',
    number    : 0,

    page      : 0,
    pages     : 0,
    per_page  : 0,
    line      : 0,

    is_top    : false,
    is_bottom : false,

    is_end_of_data : false,

    init: function(tab) {
        this.set_mode(tab);

        if (this.IsLog)
            console.log('$TablineSelector.init, mode:'+this.get_mode());

        this.alias = TABLINE;

        this.container = $("#"+this.get_mode()+"-container");

        this.page = 1;
        this.pages = 1;
        this.line = 1;

        this.release();

        var ob = $("tr[class~='selected']", this.container);
        if (is_null(ob) || is_empty(ob.attr('id')))
            //ob = this.container.find("tr[class~='tabline']").first();
            ob = $("tr[class~='tabline']", this.container).first();

        SelectedSetItem(this.alias, 'ob', ob);

        this.reset();

        this.onRefresh(ob);
    },

    release: function() {
        this.current = null;
        this.oid = '';
        this.number = 0;

        SelectedSetItem(this.alias, 'ob', null);
    },

    reset: function() {
        this.is_top = this.is_bottom = this.is_end_of_data = false;

        var size = this.container.find(".tabline").length || 0;
        this.per_page = size;

        if (this.number > this.per_page)
            this.number = this.per_page;
    },

    get_id: function() {
        return $_get_item_id(this.current);
    },

    get_current: function() {
        return this.current;
    },

    get_mode: function() {
        return this.mode;
    },

    set_mode: function(ob) {
        this.mode = ob && ob.attr('id').split('-').slice(-1)[0];
    },

    set_current: function(ob) {
        if (is_null(ob))
            return;

        this.current = ob;
        this.oid = ob.attr('id');
        this.number = parseInt($_get_item_id(ob, 2));

        if (this.IsLog)
            console.log('$TablineSelector.set_current:'+is_null(this.current)+':'+this.oid+':'+this.number);

        $ActiveSelector.reset(this);
    },

    onRefresh: function(ob) {
        if (ob === null) {
            SelectedSetItem(this.alias, 'ob', null);
            this.is_end_of_data = true;
        }

        this.set_current(ob);
        return this._refresh(0);
    },

    onProgress: function(ob) {
        return false;
    },

    _find: function(num) {
        var ob = null;

        if (is_null(num) || num <= 0)
            return null;

        this.container.find(".tabline").each(function(index, x) {
            if (this.IsTrace)
                alert($(x).attr('id')+':'+parseInt($_get_item_id($(x), 2)));

            if (parseInt($_get_item_id($(x), 2)) == num)
                ob = $(x);
        });

        if (this.IsTrace)
            alert('found:'+(ob ? ob.attr('id') : 'null'));

        return ob;
    },

    _refresh: function(new_page) {
        var exit = true;
        var line;

        if (this.IsLog)
            console.log('$TablineSelector._refresh:'+new_page+':'+this.is_top+':'+this.is_bottom+':'+this.is_end_of_data);

        // --------------------
        // Refresh current page
        // --------------------

        if (new_page == 0 && !(this.is_top || this.is_bottom || this.is_end_of_data)) {
            var ob = SelectedGetItem(this.alias, 'ob');
            if (!is_null(ob))
                $onToggleSelectedClass(this.alias, ob, 'remove', null);
            //$onToggleSelectedClass(this.alias, null, 'remove');
            $onToggleSelectedClass(this.alias, this.current, 'add', null);
        } 
        else
            exit = false;

        return exit;
    },

    _move: function(direction, number) {
        var is_found = false;
        var num = 0;

        // ------------------------
        // Move inside current page
        // ------------------------

        if ((direction > 0 && this.number < this.per_page) || (direction < 0 && this.number > 1))
            num = this.number + (direction > 0 ? 1 : -1);
        else if (direction == 0 && !is_null(number))
            num = number;
        
        var ob = this._find(num);

        if (!is_null(ob)) {
            this.set_current(ob);
            is_found = true;
        }

        this.reset();

        if (!is_found) {
            this.is_end_of_data = (
                (direction < 0 && this.page == 1) || 
                (direction > 0 && this.page == this.pages)
                ) ? true : false;

            this.is_top = (direction < 0 && !this.is_end_of_data) ? true : false;
            this.is_bottom = (direction > 0 && !this.is_end_of_data) ? true : false;
        }

        if (this.IsTrace)
            alert('move:'+this.number+':'+this.is_top+':'+this.is_bottom+':'+this.is_end_of_data);

        return is_found || this.is_top || this.is_bottom;
    },

    is_movable: function() {
        return !this.is_end_of_data && this.per_page > 0 ? true : false;
    },

    home: function() {
        return this._move(0, 1) === true ? this._refresh(0) : false;
    },

    up: function() {
        return this._move(-1) === true ? this._refresh(0) : false;
    },

    down: function() {
        return this._move(1) === true ? this._refresh(0) : false;
    },

    end: function() {
        return this._move(0, this.per_page) === true ? this._refresh(0) : false;
    }
};

var $TabSelector = {
    container : null,

    // ===================
    // Tabs Selector Class
    // ===================

    IsDebug : 0, IsTrace : 0, IsLog : 0,

    current   : null,
    number    : 0,
    count     : 0,

    init: function() {
        this.container = $("#tab-content");
        this.count = this.container.children().length;

        if (this.IsTrace)
            alert(this.count);

        this.set_current(1);
    },

    set_current: function(num) {
        this.number = num;
    },

    get_current: function() {
        return this.current;
    },

    onClick: function(ob) {
        var id = ob.attr('id');
        var is_found = false;
        var number = 1;

        this.container.find(".menu").each(function(index, x) {
            if ($(x).attr('id') == id)
                is_found = true;
            if (!is_found)
                ++number;
        });

        this.number = number;

        if (this.IsTrace)
            alert('onClick:'+id+':'+this.number);

        $SublineSelector.release();

        $onTabSelect(ob);
    },

    _find: function(num) {
        var ob = null;
        var number = num > this.count ? 1 : (num == 0 ? this.count : num);

        this.container.find(".menu").each(function(index, x) {
            if ($TabSelector.IsTrace)
                alert($(x).attr('id')+':'+index+':'+number);
            if (index+1 == number)
                ob = $(x);
        });

        this.number = number;

        if (this.IsTrace)
            alert('found:'+(ob ? ob.attr('id') : 'null'));

        return ob;
    },

    _refresh: function(num) {
        var ob = this._find(num);
        if (!is_null(ob)) {
            if (typeof $onTabSelect === 'function')
                return $onTabSelect(ob);
        }
        return false;
    },

    left: function() {
        return this._refresh(this.number-1);
    },

    right: function() {
        return this._refresh(this.number+1);
    },

    tab: function() {
        return this.right();
    }
};

var $DblClickAction = {
    control   : null,

    // =========================
    // DoubleClick Handler Class
    // =========================

    clicks    : 0,
    timeout   : 300,
    timer     : null,

    single    : null,
    double    : null,

    reset: function() {
        this.control = null;
        this.clicks = 0;
        this.timer = null;
        this.single = null;
        this.double = null;
    },

    click: function(single, double, control) {
        this.control = control;
        this.single = single;
        this.double = double;

        this.clicks++;

        if (this.clicks === 1) {

            this.timer = setTimeout(function() {
                var self = $DblClickAction;

                // -------------------
                // Single-click action
                // -------------------

                self.single && self.single(self.control);
                self.reset();

            }, this.timeout);

        } else if (!is_null(this.timer)) {

            // -------------------
            // Double-click action
            // -------------------

            clearTimeout(this.timer);

            this.double && this.double(this.control);
            this.reset();

        }
    }
};

// ===============
// Action handlers
// ===============

function $GetLog(action, callback) {
}

function $GetLogItem(source) {
}

// ============
// WEB-SERVICES
// ============

function $web_free() {
    return !isWebServiceExecute ? true : false;
}

function $web_logging(action, handler, params) {
    if (isWebServiceExecute)
        return;

    var current_action = action;
    var args = new Object();

    if (IsLog)
        console.log('$web_logging, action:'+action+':'+selected_menu_action);

    // -----------------------
    // Check Action parameters
    // -----------------------

    if (action == default_action) {
        args = {
            'action' : action,
            'selected_menu_action' : selected_menu_action
        };

        switch (action) {
            case '100':
                args['user_id'] = SelectedGetItem(LINE, 'id');
                current_action = '000';
                break;
            case '200':
                break;
            case '300':
                args['file_id'] = SelectedGetItem(LINE, 'id');
                args['batchtype'] = $("#batchtype").val();
                args['batchstatus'] = $("#batchstatus").val();
                break;
            case '400':
                break;
            case '500':
                args['order_id'] = SelectedGetItem(LINE, 'id');
                break;
            case '600':
                args['file_id'] = SelectedGetItem(LINE, 'id');
                args['filter-batchtype'] = $("#batchtype").val();
                break;
            case '700':
                args['pers_id'] = SelectedGetItem(LINE, 'id');
                break;
        }

    } else if (action > '700') {
        var pers_id = SelectedGetItem(LINE, 'id');
        var oper_id = SelectedGetItem(SUBLINE, 'id');

        args = {
            'action'                : action,
            'pers_id'               : pers_id,
            'oper_id'               : oper_id,
            'selected-items'        : $getSelectedItems()
        };

    } else if (action > '600') {
        var file_id = SelectedGetItem(LINE, 'id');
        var batch_id = SelectedGetItem(SUBLINE, 'id');

        args = {
            'action'                : action,
            'file_id'               : file_id,
            'batch_id'              : batch_id,
            'filter-batchtype'      : $("#batchtype").val(),
            'filter-tag'            : $("#tag").val(),
            'filter-tagvalue'       : $("#tagvalue").val(),
            'active_links'          : jsonify($ConfigSelector.get_active_links())
        };

    } else if (action > '500') {
        var order_id = SelectedGetItem(LINE, 'id');
        var event_id = SelectedGetItem(SUBLINE, 'id');

        args = {
            'action'                : action,
            'order_id'              : order_id,
            'event_id'              : event_id,
            'filter-client'         : $("#client").val(),
            'filter-action'         : $("#action").val(),
            'filter-config'         : $("#config").val(),
            'filter-type'           : $("#type").val(),
            'filter-search-context' : $("#search-context").val()
        };

    } else if (action > '400') {
        var preload_id = SelectedGetItem(LINE, 'id');
        var article = SelectedGetItem(SUBLINE, 'id');

        args = {
            'action'     : action,
            'preload_id' : preload_id,
            'article'    : article
        };

    } else if (action > '300') {
        var file_id = SelectedGetItem(LINE, 'id');
        var batch_id = SelectedGetItem(SUBLINE, 'id');

        if (action == default_log_action && batch_id == null)
            return;

        args = {
            'action'     : action,
            'file_id'    : file_id,
            'batch_id'   : batch_id
        };

    } else if (action > '200') {

        args = {
            'action'     : action
        };

    } else if (action > '100') {
        var user_id = SelectedGetItem(LINE, 'id');

        if (is_null(user_id))
            return;

        args = {
            'action'     : action,
            'user_id'    : user_id
        };
    }

    if (!is_null(params))
        args['params'] = jsonify(params);

    args['current_sort'] = current_sort;

    var error = {
        'exchange_error'    : 0, 
        'exchange_message'  : '', 
        'error_description' : '', 
        'error_code'        : '', 
        'errors'            : ''
    };

    // ------------
    // START ACTION
    // ------------

    $TriggerActions(true);

    is_loaded_success = false;

    //alert(current_action+':'+$SCRIPT_ROOT+loaderURI);

    $ShowSystemMessages(true, true);
    $ShowLoader(1);

    $.post($SCRIPT_ROOT + loaderURI, args, function(x) {
        var action = x['action'];

        //if (current_action != x['action'])
        //    alert('--> post:'+action+':'+current_action+':'+default_action);

        var total = parseInt(x['total'] || 0);
        var data = x['data'];
        var props = x['props'];
        var columns = x['columns'];
        var refresh_state = true;

        // -----------------------
        // Server Exchange erorors
        // -----------------------

        error.exchange_error = parseInt(x['exchange_error'] || 0);
        error.exchange_message = x['exchange_message'];

        // --------
        // RESPONSE
        // --------

        $ShowLoader(-1);

        if (error.exchange_error)
            refresh_state = false;

        else if (!is_null(handler))
            handler(x);

        // -----------------------------------------
        // Run default action (change LINE position)
        // -----------------------------------------

        else if (current_action == default_action)
        {
            $updateSublineData(current_action, x, props, total);
        }
        else if (action == '101') 
        {
            $ProfileClients.reset();
            $updateUserForm(data);
            $ProfileClients.update(x['profile_clients']);
        }
        else if (['201','202'].indexOf(action) > -1) 
        {
            $StatusChangeDialog.open(action, data);
        }
        else if (action == default_log_action)
        {
            $updateLog(data, props);
        }
        else
        {
            $updateTabData(current_action, data, columns, total);
        }

        is_loaded_success = true;

        $TriggerActions(false);

        $ShowLogPage();

        // --------------------
        // Run Callback Handler
        // --------------------

        if (isCallback) {
            isCallback = false;

            if (typeof log_callback === 'function')
                log_callback(current_action, data, props);
        }

    }, 'json')
    .fail(function() {
        $ShowLoader(-1);
        $TriggerActions(false);
    })
    .always(function() {
        if (page_state == -1)
            page_state = 0;
    });
}
