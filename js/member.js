$(function() {
  var $title = $('#title');
  var $session = $('#session-id');
  var $name = $('#name').val(StoryPoints.user.name);
  var $buttons = $('.btn');
  var visited = false;
  
  var session_id = null;
  var user = null;

  // session change
  (function(handler) {
    $session.on('blur', handler).on('keydown', function(e) {
      if(e.keyCode === 13) handler();
    });
  })(function(e) {
    window.location.hash = '#' + $session.val().trim().toUpperCase();
  });

  // name change
  (function(handler) {
    $name.on('blur', handler).on('keydown', function(e) {
      if(e.keyCode === 13) handler();
    });
  })(function(e) {
    var name = $name.val();
    if(name) {
      StoryPoints.setUserName(name);
    }
  });

  // handle session result
  function handleResult(data) {
    if(data) {
      user = data.users.filter(function(u) { return u._id == StoryPoints.user._id; })[0];
      $buttons.removeClass('selected');
      $title.text(data.name);

      if(user) {
        Cookies.set('points' + session_id, user.points);

        $buttons.filter('[data-points="' + user.points + '"]').addClass('selected');
      } else {
        user = {};
        if(!visited && StoryPoints.user.name) {
          Cookies.set('visited' + session_id, '1');
          // submit 0
          submitPoints(0);
        }
      }
      $title.show();
      $buttons.show();
    } else {
      $title.hide();
      $buttons.not('.btn-switch').hide();
    }
  }

  // submit points
  function submitPoints(points, cb) {
    var name = $name.val().trim();
    if(!name) return bootbox.alert('Name is required') && $name.focus();
    var future = {};

    StoryPoints.request('/sessions/' + session_id + '/points', {name: name, points: points}, 'POST').call = function(err, data) {
      if(err) {
        StoryPoints.handleError(err);
      } else {
        handleResult(data);
      }

      future.call && future.call(err, data);
    }

    return future;
  }

  // point button
  $('.btn-points').on('click', function(e) {
    if(!session_id) return;

    submitPoints($(this).data('points'));
  });

  // render
  function render() {
    if(session_id) {
      $session.val(session_id);
      visited = Cookies.get('visited' + session_id);
      $name.val(StoryPoints.user.name);

      StoryPoints.request('/sessions/' + session_id, null, 'GET').call = function(err, data) {
        if(err) return StoryPoints.handleError(err);
        
        handleResult(data);
        // StoryPoints.connectSocket(session_id, render);
      };
    } else {
      $session.val('');
      $title.text('');
      $buttons.not('.btn-switch').hide();
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