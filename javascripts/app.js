/*
* Redditate
* Copyright 2011, Dave Gamache
* www.redditate.com
* Free to use under the MIT license.
* http://www.opensource.org/licenses/mit-license.php
* 10/01/2011
*/


// TEXT CHANGE TEMPORARILY HERE FOR DUMMY SIGN IN

/*
 * jQuery TextChange Plugin
 * http://www.zurb.com/playground/jquery-text-change-custom-event
 *
 * Copyright 2010, ZURB
 * Released under the MIT License
 */
 (function(a){a.event.special.textchange={setup:function(){a(this).data("lastValue",this.contentEditable==="true"?a(this).html():a(this).val());a(this).bind("keyup.textchange",a.event.special.textchange.handler);a(this).bind("cut.textchange paste.textchange input.textchange",a.event.special.textchange.delayedHandler)},teardown:function(){a(this).unbind(".textchange")},handler:function(){a.event.special.textchange.triggerIfChanged(a(this))},delayedHandler:function(){var c=a(this);setTimeout(function(){a.event.special.textchange.triggerIfChanged(c)},
 25)},triggerIfChanged:function(a){var b=a[0].contentEditable==="true"?a.html():a.val();b!==a.data("lastValue")&&(a.trigger("textchange",[a.data("lastValue")]),a.data("lastValue",b))}};a.event.special.hastext={setup:function(){a(this).bind("textchange",a.event.special.hastext.handler)},teardown:function(){a(this).unbind("textchange",a.event.special.hastext.handler)},handler:function(c,b){b===""&&b!==a(this).val()&&a(this).trigger("hastext")}};a.event.special.notext={setup:function(){a(this).bind("textchange",
 a.event.special.notext.handler)},teardown:function(){a(this).unbind("textchange",a.event.special.notext.handler)},handler:function(c,b){a(this).val()===""&&a(this).val()!==b&&a(this).trigger("notext")}}})(jQuery);


$(document).ready(function() {

  if($.cookie("passwordEntered")) {
    $('.pw-wash').remove();
    loadSite();
  } else {
    $('#pw-holder').bind('textchange', function (event, previousText) {
      if($(this).val() == "betastyle") {
        $('.pw-wash').fadeOut(function() {
          $(this).remove();
          $.cookie("passwordEntered", true, { expires: 100 });
          loadSite();
        });
      }
    });
  }

function loadSite() {

  //Global Vars -----------------------------------------------------

  var posts = $('.posts'),
  afterString,
  subdomain = readParams('r'),
  loader = $('.wash'),
  loadMore = $('.loadmore-button'),
  activePost = 0,
  post,
  subredditHint = $('.subreddit-hint p'),
  hintIndex = 0;


//Initial Load -------------------------------------------------------------------------------

  window.scrollTo(0,0);

  // If viewType cookied, set it
  if($.cookie("viewType")) {
    $('body')
      .removeClass('fullview')
      .removeClass('listview')
      .addClass($.cookie("viewType"));
  }

  //Initial JSON load
  loadJSON();

  //JSON -------------------------------------------------------------------------------

  // Load data
  function loadJSON() {
    console.log("laoding")
    $.getJSON("http://www.reddit.com/"+subdomain+".json?limit=25&after="+afterString+"&jsonp=?", null, function(data) {
      $.each(data.data.children, function(i, post) {
        renderPost(post.data);
        afterString = post.data.name;
      });
    }).complete(function() {
      post = $('.post');
      classifyImages();
      loader.fadeOut(100);
      loadMore.removeClass('loading');
    });
  }

  $(window).scroll(function(){
    // Load more JSON from scroll
    if ($(window).scrollTop() >= $(document).height() - $(window).height() - 10){
      if (navigator.userAgent.match(/iPhone/i) || navigator.userAgent.match(/iPod/i) || navigator.userAgent.match(/iPad/i)) {
        //Do nothing
      } else {
        loader.fadeIn(100);
        loadJSON();
      }
    }
    //Control activePost value based on scroll position
    if($(document).scrollTop() > (post.eq(activePost).offset().top-90)) {
      activePost++
    }
    if($(document).scrollTop() < (post.eq(activePost-1).offset().top-90)) {
      if(activePost-1 > 0) {
        activePost--
      }
    }
    // console.log("activePost: "+activePost+", documentScrollTop: "+$(document).scrollTop()+", activePost offset top: "+(post.eq(activePost).offset().top-90))
  });

  // Load more JSON from click (tablet/mobile)
  $('.loadmore-button').click(function() {
    loader.fadeIn(100);
    loadMore.addClass('loading')
    loadJSON();
  });

  //Rendering -------------------------------------------------------------------------------

  // Render Post with Handlebars
  function renderPost(postData) {
    var templateSource   = $("#postTemplate").html();
    var postTemplate = Handlebars.compile(templateSource);
    var postHTML = postTemplate(postData);
    posts.append(postHTML);
  }

  //Create readable title from ?r= subdomain value
  if(!subdomain == "") {
    var readableSubdomain = subdomain.replace("r/", "")
    $('.logo .subreddit .title').text(readableSubdomain);
    document.title = "Redditate: "+readableSubdomain;
  }


  // Template Helpers -------------------------------------------------------------------------------

  // IMAGE: Rendering fullsize images
  Handlebars.registerHelper('hasImage', function(url, fn) {
    var isImgur = (/imgur*/).test(url);
    // Fix broken imgur links
    if(isImgur) {
      if(isImage(url)) {
        // do nothing
      } else {
        url += ".jpg"
      }
    }
    if(isImage(url)) {
      return '<a class="image-embed"><img src="'+url+'" alt="" /></a>';
    } else {
      return false;
    }
  });

  // YOUTUBE: If embedded video is real, render it
  Handlebars.registerHelper('hasYoutube', function(url, fn) {
    if(isYoutube(url)) {
      youtubeID = url.replace(/^[^v]+v.(.{11}).*/,"$1");
      youtubeLinkTime = url.split("#");
      youtubeLinkTime = youtubeLinkTime[1];
      return '<iframe width="420" height="345" src="http://www.youtube.com/embed/'+youtubeID+'?wmode=transparent&#'+youtubeLinkTime+'" frameborder="0" wmode="Opaque" allowfullscreen></iframe>';
    } else {
      return false;
    }
  });

  // LISTVIEW THUMBNAIL: If thumb is real, render it
  Handlebars.registerHelper('hasThumbnail', function(thumbnail, url, fn) {
    if(thumbnail != "") {
      return '<a class="thumbnail-embed" href="'+url+'" target="_blank"><img src="'+thumbnail+'" alt="" /></a>';
    } else {
      return false;
    }
  });


  //Interactions -------------------------------------------------------------------------------

  // Image fullsize on click
  $('.post .image-embed').live('click', function(e) {
    e.preventDefault();
    resizeImage($(this));
  });

  // Toggling grid/list/full view
  $('.view-options a').click(function(e) {
    e.preventDefault();
    setupViewtype($(this));
  });

  // Open Subreddit Picker
  $('.subreddit').click(function(e) {
    e.preventDefault();
    openSubredditPicker();
  });
  $('.subreddit-close-button').click(function(e) {
    e.preventDefault();
    closeSubredditPicker();
  });
  $('.subreddit-heading').click(function(e) {
    e.preventDefault();
    closeSubredditPicker();
  });

  //Cycling hints
  subredditHint.eq(hintIndex).show();
  $('.down-carrot-wrapper').click(function() {
    subredditHint.hide();
    if(hintIndex < subredditHint.length-1) {
      hintIndex++
      subredditHint.eq(hintIndex).show();
    } else {
      hintIndex = 0;
      subredditHint.eq(hintIndex).show();
    }
  })

  // Keyboard interactions
  document.onkeydown = function(evt) {
    evt = evt || window.event;
    // Esc close of subreddit picker
    if (evt.keyCode == 27) {
      closeSubredditPicker();
    }
    // "J" goes to next post
    if (evt.keyCode == 74) {
      if(activePost == post.length-1) {
        $("html, body").attr({ scrollTop: $(document).height() });
      } else {
        var postScrollOffset = post.eq(activePost).offset();
        window.scrollTo(postScrollOffset.left, postScrollOffset.top - $('nav').height() - 10)
      }
    }
    // "K" goes to prev post
    if (evt.keyCode == 75) {
      if(activePost > 1) {
        var postScrollOffset = post.eq(activePost-2).offset();
        window.scrollTo(postScrollOffset.left, postScrollOffset.top - $('nav').height() - 10)
      }
    }
    // "F" changes to fullview
    if (evt.keyCode == 70) {
      setupViewtype($('a.fullview'));
    }
    // "L" changes to listview
    if (evt.keyCode == 76) {
      setupViewtype($('a.listview'));
    }
    // "Z" zooms on image in post if there is one
    if (evt.keyCode == 90) {
      resizeImage(post.eq(activePost-1).find('.image-embed'));
    }
    // "C" zooms on image in post if there is one
    if (evt.keyCode == 67) {
      var permalink = post.eq(activePost-1).find('.permalink').attr('href')
      window.open(permalink,'_newtab');
    }
    // Enter opens to current post
    if (evt.keyCode == 13) {
      var postLink = post.eq(activePost-1).find('.post-title').attr('href');
      window.open(postLink,'_newtab');
    }
  };


  //Utility Functions -------------------------------------------------------------------------------

  // Read URL to get params
  function readParams(name) {
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
    if (result) {
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

  function classifyImages() {
    $('img').not('already-classified').imagesLoaded(function() {
      $(this).each(function() {
      $(this).addClass('already-classified');
        if($(this).width() == 880) {
          $(this).addClass('not-resizeable')
        } else if($(this).width() != 880 && $(this).height() != 501) {
          $(this).addClass('not-resizeable')
        }
      })
    });
  }

  // Resize fullview inlined image
  function resizeImage(clickTarget) {
    if(clickTarget.children('img').hasClass('fullwidth')) {
      // Determine if image is above offscreen and if so, make it at top of shrink
      var postParentPosition = clickTarget.children('img').offset();
      if(postParentPosition.top < $(window).scrollTop()) {
        window.scrollTo(postParentPosition.left, (postParentPosition.top - $('nav').height() - 10));
      }
    }
    // Toggle fullwidth class
    clickTarget.children('img').toggleClass('fullwidth');
  }

  //Set and cookie the viewType (fullview/listview)
  function setupViewtype(viewClick) {
    var activeClass = viewClick.data('viewType');
    $('body')
      .removeClass('listview')
      .removeClass('fullview')
      .addClass(activeClass);
    if(activePost != 0) {
      window.scrollTo(0,post.eq(activePost-1).offset().top);
    } else {
      window.scrollTo(0,0);
    }
    $.cookie("viewType", null);
    $.cookie("viewType", activeClass, { expires: 100 });
  }

  // Open picker
  function openSubredditPicker() {
    $('body').addClass('subreddit-picker-open');
    $('.subreddit-picker').slideDown(250);
  }

  // Close picker
  function closeSubredditPicker() {
    $('body').removeClass('subreddit-picker-open');
    $('.subreddit-picker').slideUp(250);
  }

  //Spinner -------------------------------------------------------------------------------
  var optsWash = {
    width: 2 // The line thickness
  },
  optsButton = {
    width: 2, // The line thickness
    radius: 6,
    length: 4
  },
  targetWash = document.getElementById('loading'),
  targetButton = document.getElementById('spinner'),
  spinnerWash = new Spinner(optsWash).spin(targetWash),
  spinnerButton = new Spinner(optsButton).spin(targetButton);

} //closing load site

});