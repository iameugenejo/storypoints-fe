$(function() {
  var $body = $('body');
  var $title = $('#title');
  var $member_link = $('#member-link');
  var $session = $('#session-id');
  var $users = $('.users');
  var $summary = $('.point-table tfoot');
  var $avg = $('.avg');
  var $buttons = $('.btn');
  var $header_detail = $('.panel-heading.detail');
  var $header_simple = $('.panel-heading.simple').hide();
  var $session_title = $('#session-title');
  var user_template = Handlebars.compile($('#user-template').html());
  var session_id = $session.val().trim().toUpperCase();
  var is_admin = true;
  var ws = null;
  var last_updated_at = 0;
  
  // header toggle
  $('.btn-detail').on('click', function() {
    $header_detail.show();
    $header_simple.hide();
    $
  });

  $('.btn-simple').on('click', function() {
    $header_detail.hide();
    $header_simple.show();
  });

  // session switch 
  (function(handler) {
    $session.on('blur', handler).on('keydown', function(e) {
      if(e.keyCode === 13) handler();
    });
  })(function() {
    window.location.hash = '#' + $session.val().trim().toUpperCase();
  });

  // session click
  $session.on('click', function(e) {
    $session.select();
  });
  // avg click
  $avg.on('click', function(e) {
    $avg.select();
  });

  // save button
  (function(handler) {
    $('.btn-save').on('click', handler);
    $title.on('keydown', function(e) {
      if(e.keyCode === 13) handler();
    });
  })(function(e) {
    if(!is_admin) return;
    
    var title = $title.val().trim();

    if(!title) return bootbox.alert('Title is required') && $title.focus();

    if(session_id) {
      StoryPoints.request('/sessions/' + session_id, null, 'PUT', {
        name: title
      }).call = function(err, data) {
        if(err) return StoryPoints.handleError(err);

        handleHash();
      };
    } else {
      StoryPoints.request('/sessions', null, 'POST', {
        name: title
      }).call = function(err, data) {
        if(err) return StoryPoints.handleError(err);
        
        session_id = data._id;

        window.location.hash = '#' + data._id;
      };
    }
  });
  
  // remove user button
  $body.on('click', '.btn-remove-user', function(e) {
    e.preventDefault();

    if(!session_id) return;

    var user = $(this).data('user');

    StoryPoints.request('/sessions/' + session_id + '/users', {user: user}, 'DELETE').call = function(err, data) {
      if(err) return StoryPoints.handleError(err);

      handleHash();
    };
  });

  // reset button
  var $btn_reset = $('.btn-reset').on('click', function(e) {
    e.preventDefault();
    
    if(!session_id) return;

    StoryPoints.request('/sessions/' + session_id + '/points', null, 'DELETE').call = function(err, data) {
      if(err) return StoryPoints.handleError(err);

      handleHash();
    };
  });

  // delete button
  var $btn_delete = $('.btn-delete').on('click', function(e) {
    if(!session_id) return;

    StoryPoints.request('/sessions/' + session_id, null, 'DELETE').call = function(err, data) {
      if(err) return StoryPoints.handleError(err);
      
      Cookies.remove('session' + session_id);

      window.location.hash = '#';
    };
  });

  // socket
  function connectSocket() {
    if(!ws) {
      ws = new WebSocket(__config.socket_base);
      ws.onmessage = function (event) {
        var message = JSON.parse(event.data);
        if(message.session == session_id) {
          if(last_updated_at < message.updated_at) {
            console.log('session updated at ' + new Date());
            render();
          }
        } else {
          try { ws.close(); } catch(e) {} finally {ws=null;}
        }
      };
      ws.onopen = function() {
        checkin();
      };
      ws.onclose = function() {
        ws = null;
        console.log('session disconnected, retrying ... ');
        setTimeout(function() {
          render();
        }, 3000);
      };
    }
  }

  function checkin() {
    if(ws) {
      if(ws.readyState === ws.OPEN) {
        try {
          ws.send(JSON.stringify({
            session: session_id,
            token: StoryPoints.user._id
          }));
        } catch(e) {
          console.error(e);
          setTimeout(checkin, 3000);
        }
      } else {
        setTimeout(checkin, 3000);
      }
    } else {
      connectSocket();
    }
  }

  // render
  function render() {
    if(session_id) {
      StoryPoints.request('/sessions/' + session_id, null, 'GET').call = function(err, data) {
        if(err) return StoryPoints.handleError(err);
        if(!data) {
          StoryPoints.handleError('Session ' + session_id + ' is not found');
          window.location.hash = '';
          return;
        }

        last_updated_at = Date.now();

        is_admin = data.owner === StoryPoints.user._id;

        $member_link.attr('href', '/member/#' + session_id).text(window.location.protocol + '//' + window.location.host + '/member/#' + session_id);
        $session.val(session_id);
        $title.val(data.name).prop('readonly', !is_admin);
        $session_title.val(session_id + ' - ' + data.name);
        $buttons.toggle(is_admin);

        // populate users
        $users.empty();
        var total = 0;
        var count = 0;
        data.users.forEach(function(u) {
          $users.append(user_template(u));
          if(u.points) {
            total += u.points;
            count++;
          }
        });
        $summary.toggle(!!data.users.length);
        $avg.val(Math.round(total / count));

        if(is_admin) {
          connectSocket();
        }
      };
    } else {
      $member_link.attr('href', '#').text();
      $session.val('');
      $title.val('').prop('readonly', false);
      $session_title.val('');
      $buttons.show();
      $summary.hide();
    }
  }

  // hash control
  window.addEventListener("hashchange", function() {
    handleHash();
  });

  function handleHash() {
    session_id = window.location.hash.substr(1).trim().toUpperCase();
    render();
  }

  handleHash();
});