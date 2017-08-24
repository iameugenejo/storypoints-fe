$(function() {
  var $body = $('body');
  var $title = $('#title');
  var $member_link = $('#member-link');
  var $session = $('#session-id');
  var $users = $('.users');
  var $summary = $('.point-table tfoot');
  var $summary_spinner = $summary.find('.icon');
  var $avg = $('.avg');
  var $buttons = $('.btn');
  var $header_detail = $('.panel-heading.detail');
  var $header_simple = $('.panel-heading.simple').hide();
  var $session_title = $('#session-title');
  var user_template = Handlebars.compile($('#user-template').html());
  var session_id = $session.val().trim().toUpperCase();
  var is_admin = true;
  
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
    
    StoryPoints.disconnectSocket();
    StoryPoints.request('/sessions/' + session_id, null, 'DELETE').call = function(err, data) {
      if(err) return StoryPoints.handleError(err);
      
      window.location.hash = '#';
    };
  });

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

        var has_pending = false;
        for(var i in data.users) {
          if(data.users[i].points == 0) {
            has_pending = true;
            break;
          }
        }

        var total = has_pending;
        var count = 0;

        data.users.forEach(function(u) {
          if(has_pending) {
            if(u.points > 0) {
              u.points = -1;
            }
          } else {
            if(u.points) {
              total += u.points;
              count++;
            }
          }

          $users.append(user_template(u));
        });

        $summary.toggle(!!data.users.length);

        if(count) {
          $avg.val(Math.round(total / count));
        } else {
          $avg.val('');
        }
        $avg.toggle(!has_pending);
        $summary_spinner.toggle(has_pending);

        StoryPoints.connectSocket(session_id, render);
      };
    } else {
      $member_link.attr('href', '#').text('');
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