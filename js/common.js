(function() {
  var hadError = false;

  /**
   * Module for displaying "Waiting for..." dialog using Bootstrap
   *
   * @author Eugene Maslovich <ehpc@em42.ru>
   */

  var waitingDialog = waitingDialog || (function ($) {
      'use strict';

    // Creating modal dialog's DOM
    var $dialog = $(
      '<div class="modal fade" data-backdrop="static" data-keyboard="false" tabindex="-1" role="dialog" aria-hidden="true" style="padding-top:15%; overflow-y:visible;">' +
      '<div class="modal-dialog modal-m">' +
      '<div class="modal-content">' +
        '<div class="modal-header"><h3 style="margin:0;"></h3></div>' +
        '<div class="modal-body">' +
          '<div class="progress progress-striped active" style="margin-bottom:0;"><div class="progress-bar" style="width: 100%"></div></div>' +
        '</div>' +
      '</div></div></div>');

    return {
      /**
       * Opens our dialog
       * @param message Custom message
       * @param options Custom options:
       * 				  options.dialogSize - bootstrap postfix for dialog size, e.g. "sm", "m";
       * 				  options.progressType - bootstrap postfix for progress bar type, e.g. "success", "warning".
       */
      show: function (message, options) {
        // Assigning defaults
        if (typeof options === 'undefined') {
          options = {};
        }
        if (typeof message === 'undefined') {
          message = 'Loading';
        }
        var settings = $.extend({
          dialogSize: 'm',
          progressType: '',
          onHide: null // This callback runs after the dialog was hidden
        }, options);

        // Configuring dialog
        $dialog.find('.modal-dialog').attr('class', 'modal-dialog').addClass('modal-' + settings.dialogSize);
        $dialog.find('.progress-bar').attr('class', 'progress-bar');
        if (settings.progressType) {
          $dialog.find('.progress-bar').addClass('progress-bar-' + settings.progressType);
        }
        $dialog.find('h3').text(message);
        // Adding callbacks
        if (typeof settings.onHide === 'function') {
          $dialog.off('hidden.bs.modal').on('hidden.bs.modal', function (e) {
            settings.onHide.call($dialog);
          });
        }
        // Opening dialog
        $dialog.modal();
      },
      /**
       * Closes dialog
       */
      hide: function () {
        $dialog.modal('hide');
      }
    };

  })(jQuery);

  // bust ajax cache
  $.ajaxSetup({ cache: false });
  
  // catch-all exception handler
  window.onerror = function (msg, url, lineNo, columnNo, error) {
    hadError = true;
    var string = msg.toLowerCase();
    var substring = "script error";
    var message = null;

    if (string.indexOf(substring) > -1){
      message = msg;
    } else {
      message = JSON.stringify({
          message:  msg,
          url: url,
          line: lineNo,
          column: columnNo,
          error: + error
      }, null, 2);
    }

    window.bootbox && window.bootbox.alert({
      title: 'Sorry, there was an error',
      message: message
    }) || alert('Unhandled Error, please check the console log');

    return false;
  };

  // bootbox vertical alignment fix
  bootbox.setDefaults({
    animate: false
  });

  ['alert', 'confirm', 'prompt', 'dialog'].forEach(function(name) {
    var org = bootbox[name];

    if(org) {
      bootbox[name] = function() {
        var $box = org.apply(this, arguments);
        setTimeout(function() {
          $box.css({
            'top': ($(window).height() - $box.find('.modal-dialog').height()) / 2 - 50
          });
        });
        
        return $box;
      };
    }
  });

  window.StoryPoints = new function() {
    var self = this;
    
    // load user
    this.user = Cookies.get('user');
    if(this.user) {
      try {
        this.user = JSON.parse(this.user);
      } catch(e) {
        this.user = null;
      }
    }

    if(!this.user) {
      this.user = {
        _id: uuid()
      };

      Cookies.set('user', JSON.stringify(this.user));
    }

    // set user name
    this.setUserName = function(name) {
      this.user.name = name;

      Cookies.set('user', JSON.stringify(this.user));
    };
    
    // loading screen
    this.loading = 0;
    this.loadingCounter = 0;
    this.showLoading = function(show) {
      if(hadError) return;

      if(show) {
        self.loadingCounter++;
        if(self.loading) return;

        self.loading = setTimeout(function() {
          if(hadError) return;
          waitingDialog.show('Processing ...', {dialogSize: 'sm'});
          self.loading = 0;
        }, 500);
      } else {
        if(--self.loadingCounter <= 0) {
          self.loadingCounter = 0;
          clearTimeout(self.loading);
          self.loading = 0;
          waitingDialog.hide();
        }
      }
    };

    // parse hash
    this.parseHash = function(hash) {
      var result = {};
      
      (hash || window.location.hash).slice(1).split('&').forEach(function(pair) {
          var splits = pair.split('=');
          var name = splits[0];
          var value = splits[1];
          if(name && value) {
            result[name] = value;
          }
      });

      return result;
    };

    // set hash
    this.setHash = function(name, value) {
      var parsed = this.parseHash();

      parsed[name] = value;

      var serialized = [];
      
      Object.keys(parsed).sort().forEach(function(key) {
        var value = parsed[key];
        if(key && value) {
          serialized.push(key + '=' + value);
        }
      });
      
      serialized = serialized.join('&');
      
      window.location.hash = '#' + serialized;
    };

    // handle error
    this.handleError = function(err) {
      return bootbox.alert(err.message || err.error || JSON.stringify(err));
    };

    // api request
    this.request = function(url, query, method, data, background) {
      method = method || 'GET';
      method = method.toUpperCase();
      if(!background) {
        self.showLoading(true);
      }

      var p = {};

      // stupid IE workaround, uncomment if implemented
      // if(method === 'PUT') {
      //   method = 'POST';
      //   var splitted = url.split('?');
      //   url = splitted[0] + '/update' + (splitted[1] ? '?' + splitted[1] : '');
      // } else if(method === 'DELETE') {
      //   method = 'POST';
      //   var splitted = url.split('?');
      //   url = splitted[0] + '/deleted' + (splitted[1] ? '?' + splitted[1] : '');
      // }

      var payload = {
        url: __config.api_base + url + (query ? '?' + $.param(query) : ''),
        method: method,
        contentType: 'application/json; charset=utf-8',
        dataType: 'json',
        success:  function(data) {
          p.call && p.call(null, data);
        },
        error: function(xhr, status, err) {
          p.call && p.call({
            status: xhr.status,
            error: xhr.responseJSON || err || (xhr.readyState === 0 ? 'Connection Error, please check your internet connection.' : 'Unknown Error')
          });
        },
        complete: function() {
          if(!background) {
            self.showLoading(false);
          }
        }
      };

      if(data) {
        payload.data = JSON.stringify(data);
      }
      
      if(self.user) {
        payload.headers = payload.headers || {};
        payload.headers['Authorization'] = 'Bearer ' + self.user._id;
      }

      $.ajax(payload);

      return p;
    };

  };

  // wake up server
  StoryPoints.request('/', null, 'HEAD', null, true);
})();