$(document).ready(function() {

  //Global Vars -----------------------------------------------------

  var posts = $('.posts');
  var afterString;
  var subdomain = gup('r');
  var previousSubdomain;
  var onKeyboardPost = 0;
  var loader = $('.wash');

  //Initial Load -----------------------------------------------------

  $('body')
    .removeClass('fullview')
    .removeClass('listview')
    .removeClass('gridview')
    .addClass($.cookie("viewType"));

  //JSON -----------------------------------------------------

  // Retrieve JSON
	$.getJSON("http://www.reddit.com/"+subdomain+".json?count=25&after="+afterString+"&jsonp=?", null, function(data) {
		$.each(data.data.children, function(i, post) {
      renderPost(post.data);
      afterString = post.data.name;
    });
	}).complete(function() {
    loader.fadeOut(100);
    //If same as previous subdomain, use the scroll position
    if ($.cookie("subdomain") == subdomain) {
      $(document).scrollTop($.cookie("scrollFromTop"));
    } else {
      $.cookie("subdomain", subdomain)
      $.cookie("scrollFromTop", 0);
      $(document).scrollTop(0);
    };
  });

  // Load more JSON
  $(window).scroll(function(){
    if ($(window).scrollTop() == $(document).height() - $(window).height()){
      loader.fadeIn(100);
      $.getJSON("http://www.reddit.com/"+subdomain+".json?count=25&after="+afterString+"&jsonp=?", null, function(data) {
        $.each(data.data.children, function(i, post) {
          renderPost(post.data);
          afterString = post.data.name;
        });
      }).complete(function() {
        loader.fadeOut(100);
      })
    }
  });

  //Rendering -----------------------------------------------------

  // Render Post with Handlebars
  function renderPost(postData) {
    var templateSource   = $("#postTemplate").html();
    var postTemplate = Handlebars.compile(templateSource);
    var postHTML = postTemplate(postData);
    posts.append(postHTML);
  }

  if(!subdomain == "") {
    var readableSubdomain = subdomain.replace("r/", "")
    $('.logo .subreddit .title').text(readableSubdomain);
  }

  // If image is real, render it
  Handlebars.registerHelper('hasImage', function(url, fn) {
    if(isImage(url)) {
      if(isImgur(url)) {
        url += ".jpg"
      }
      return '<a class="image-embed"><img src="'+url+'" alt="" /></a>';
    } else {
      return false;
    }
  });

  // If embedded video is real, render it
  Handlebars.registerHelper('hasYoutube', function(url, fn) {
    if(isYoutube(url)) {
      url = url.replace("watch?v=", "embed/");
      return '<iframe width="420" height="345" src="'+url+'?wmode=transparent" frameborder="0" wmode="Opaque" allowfullscreen></iframe>';
    } else {
      return false;
    }
  });

  // If thumb is real, render it
  Handlebars.registerHelper('hasThumbnail', function(thumbnail, fn) {
    if(thumbnail != "") {
      return '<a class="thumbnail-embed"><img src="'+thumbnail+'" alt="" /></a>';
    } else {
      return false;
    }
  });


  //Interactions -----------------------------------------------------

  // Image fullsize on click
  $('.post .image-embed').live('click', function(e) {
    e.preventDefault();
    if($(this).children('img').hasClass('fullwidth')) {
      // Determine if image is above offscreen and if so, make it at top of shrink
      var postParentPosition = $(this).children('img').offset();
      if(postParentPosition.top < $(window).scrollTop()) {
        window.scrollTo(postParentPosition.left, (postParentPosition.top - $('nav').height() - 10));
      }
    }
    // Toggle fullwidth class
    $(this).children('img').toggleClass('fullwidth');
  });

  // Toggling grid/list/full view
  $('.view-options a').click(function(e) {
    e.preventDefault();
    var activeClass = $(this).data('viewType');
    $('body')
      .removeClass('gridview')
      .removeClass('listview')
      .removeClass('fullview')
      .addClass(activeClass)
    window.scrollTo(0,0);
    $.cookie("viewType", null);
    $.cookie("viewType", activeClass, { expires: 100 });
  });

  // Open Subreddit Picker
  $('.subreddit').click(function(e) {
    e.preventDefault();
    $('body').addClass('subreddit-picker-open');
    $('.subreddit-picker').slideDown(250);
  });
  $('.subreddit-close-button').click(function(e) {
    e.preventDefault();
    $('body').removeClass('subreddit-picker-open');
    $('.subreddit-picker').slideUp(250);
  });

  // Store cookie scroll position
  $(window).scroll(function() {
    $.cookie("scrollFromTop", $(document).scrollTop());
  });

  // Closing Subreddit Picker
  document.onkeydown = function(evt) {
    evt = evt || window.event;
    if (evt.keyCode == 27) {
      $('body').removeClass('subreddit-picker-open');
      $('.subreddit-picker').slideUp(250);
    } else if (evt.keyCode == 190) {
      //Right carrot
      var postScrollOffset = $('.post').eq(onKeyboardPost).offset();
      window.scrollTo(postScrollOffset.left, postScrollOffset.top - $('nav').height() - 10)
      onKeyboardPost++
    } else if (evt.keyCode == 188) {
      //Left carrot
      var postScrollOffset = $('.post').eq(onKeyboardPost).offset();
      window.scrollTo(postScrollOffset.left, postScrollOffset.top - $('nav').height() - 10)
      onKeyboardPost--
    }
  };

  //Spinner -----------------------------------------------------
  var opts = {
    width: 2, // The line thickness
  };
  var target = document.getElementById('loading');
  var spinner = new Spinner(opts).spin(target);

  //Utility Functions -----------------------------------------------------

  // Read URL to get params
  function gup(name) {
    name = name.replace(/[\[]/,"\\\[").replace(/[\]]/,"\\\]");
    var regexS = "[\\?&]"+name+"=([^&#]*)";
    var regex = new RegExp( regexS );
    var results = regex.exec( window.location.href );
    if( results == null )
      return "";
    else
      return results[1];
  }

  //Determine is this is an image
  function isImage(str){
    var result = (/\.(?=gif|jpg|png)/gi).test(str);
    var isImgur = (/imgur*/).test(str);
    if(isImgur && !result) {
      result += ".jpg"
    }
    if (result) {
      return true;
    } else {
      return false;
    }
  }

  //Determine if is mislinked imgur
  function isImgur(str){
    var isImgur = (/imgur*/).test(str);
    if(isImgur) {
      return true;
    } else {
      return false;
    }
  }

  //Determine is this is a youtube video
  function isYoutube(str){
    var result = str.indexOf('youtube');
    if (result != -1) {
      return true;
    } else {
      return false;
    }
  }

  //Deterine if image is already full-width
  function isFullWidth(img) {
    console.log($(img).width())
    // if($(img).width() == "700")
  }

});