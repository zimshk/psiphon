/*
 * Copyright (c) 2015, Psiphon Inc.
 * All rights reserved.
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 *
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU General Public License for more details.
 *
 * You should have received a copy of the GNU General Public License
 * along with this program.  If not, see <http://www.gnu.org/licenses/>.
 *
 */

;(function(window) {
"use strict";
/* jshint strict:true, newcap:false */

/* GENERAL */

var $window = $(window);

// Fired when the UI language changes
var LANGUAGE_CHANGE_EVENT = 'language-change';

// We often test in-browser and need to behave a bit differently
var IS_BROWSER = true;

// Parse whatever JSON parameters were passed by the application.
var g_initObj = {};
(function() {
  var uriSearch = location.search;
  if (uriSearch) {
    g_initObj = JSON.parse(decodeURIComponent(uriSearch.slice(1)));
    IS_BROWSER = false;
  }

  // For browser debugging
  if (IS_BROWSER) {
    g_initObj = {
      Config: {
        Language: 'en',
        Banner: 'banner.png'
      }
    };
  }
})();

$(function() {
  // The banner image filename is parameterized.
  $('.banner img').attr('src', g_initObj.Config.Banner);

  // Update the size of our tab content element when the window resizes...
  var lastWindowHeight = $window.height();
  var lastWindowWidth = $window.width();
  $window.smartresize(function() {
    // Only go through the resize logic if the window actually changed size.
    // This helps with the constant resize events we get with IE7.
    if (lastWindowHeight !== $window.height() ||
        lastWindowWidth !== $window.width()) {
      lastWindowHeight = $window.height();
      lastWindowWidth = $window.width();
      setTimeout(resizeContent, 1);
    }
  });
  // ...and when a tab is activated...
  $('a[data-toggle="tab"]').on('shown', function() {
    setTimeout(resizeContent, 1);
  });
  // ...and when the language changes...
  $window.on(LANGUAGE_CHANGE_EVENT, function() {
    setTimeout(resizeContent, 1);
  });
  // ...and now.
  resizeContent();
});

function resizeContent() {
  // We want the content part of our window to fill the window, we don't want
  // excessive scroll bars, etc. It's difficult to do "fill the remaining height"
  // with just CSS, so we're going to do some on-resize height adjustment in JS.
  var fillHeight = $window.innerHeight() - $('.main-height').position().top;
  var footerHeight = $('.footer').outerHeight();
  $('.main-height').outerHeight(fillHeight - footerHeight);
  $('.main-height').parentsUntil('.body').add($('.main-height').siblings()).css('height', '100%');

  // Let the panes know that content resized
  $('.main-height').trigger('resize');

  doMatchHeight();
}


/* CONNECTION ****************************************************************/

var g_lastState = 'stopped';

$(function() {
  $('#start').click(function() {
    if ($(this).hasClass('disabled')) {
      return;
    }
    HtmlCtrlInterface_Start();
  });
  $('#stop').click(function() {
    if ($(this).hasClass('disabled')) {
      return;
    }
    HtmlCtrlInterface_Stop();
  });

  setupConnectToggle();

  // Update the size of our elements when the tab content element resizes...
  $('.main-height').on('resize', function() {
    // Only if this tab is active
    if ($('#connection-pane').hasClass('active')) {
      setTimeout(resizeConnectContent, 1);
    }
  });
  // ...and when the tab is activated...
  $('a[href="#connection-pane"][data-toggle="tab"]').on('shown', function() {
    setTimeout(resizeConnectContent, 1);
  });
  // ...and now.
  resizeConnectContent();
});

function resizeConnectContent() {
  // Set the outer box to the correct height
  $('#connect-toggle').height($('#connect-toggle > *').outerHeight());
}

function setupConnectToggle() {
  var opts = {
    lines: 10, // The number of lines to draw
    length: 6, // The length of each line
    width: 2, // The line thickness
    radius: 6, // The radius of the inner circle
    corners: 1, // Corner roundness (0..1)
    rotate: 50, // The rotation offset
    direction: 1, // 1: clockwise, -1: counterclockwise
    color: ['#000', '#888', '#FFF'], // #rgb or #rrggbb or array of colors
    speed: 0.8, // Rounds per second
    trail: 100, // Afterglow percentage
    shadow: false, // Whether to render a shadow
    hwaccel: true, // Whether to use hardware acceleration
    className: 'spinner', // The CSS class to assign to the spinner
    zIndex: 2e9, // The z-index (defaults to 2000000000)
    top: '50%', // Top position relative to parent
    left: '50%' // Left position relative to parent
  };
  var spinner = new Spinner(opts).spin($('#connect-toggle .wait-spinner')[0]);

  $('#connect-toggle a').click(function() {
    var buttonConnectState = $(this).parents('.connect-toggle-content').data('connect-state');
    if (buttonConnectState === 'stopped') {
      HtmlCtrlInterface_Start();
    }
    else if (buttonConnectState === 'starting' || buttonConnectState === 'connected') {
      HtmlCtrlInterface_Stop();
    }
    // the stopping button is disabled
  });
  updateConnectToggle();
}

// Update the main connect button, as well as the connection indicator on the tab.
function updateConnectToggle() {
  $('.connect-toggle-content').each(function() {
    $(this).toggleClass('z-behind', $(this).data('connect-state') !== g_lastState);
  });

  $('a[href="#connection-pane"][data-toggle="tab"] .label').each(function() {
    $(this).toggleClass('hidden', $(this).data('connect-state') !== g_lastState);
  });

  if (g_lastState === 'starting') {
    cycleToggleClass($('.connect-toggle-content[data-connect-state="starting"]'), 'alert-success', g_lastState);
  }
  else if (g_lastState === 'connected') {
  }
  else if (g_lastState === 'stopping') {
    cycleToggleClass($('.connect-toggle-content[data-connect-state="stopping"]'), 'alert-danger', g_lastState);
  }
  else if (g_lastState === 'stopped') {
  }
}

function cycleToggleClass(elem, cls, untilStateChangeFrom) {
  $(elem).toggleClass(cls, 1000, function() {
    if (g_lastState === untilStateChangeFrom) {
      setTimeout(function() {
        cycleToggleClass(elem, cls, untilStateChangeFrom);
      }, 1);
    }
  });
}


/* SETTINGS ******************************************************************/

// We will use this later to check if any settings have changed.
var g_initialSettingsJSON;

$(function() {
  // This is merely to help with testing
  if (!g_initObj.Settings)
  {
    g_initObj.Settings = { "SplitTunnel": 0, "VPN": 0, "LocalHttpProxyPort": 7771, "LocalSocksProxyPort": 7770, "SkipUpstreamProxy": 1, "UpstreamProxyHostname": "upstreamhost", "UpstreamProxyPort": 234, "EgressRegion": "GB", "defaults": { "SplitTunnel": 0, "VPN": 0, "LocalHttpProxyPort": "", "LocalSocksProxyPort": "", "SkipUpstreamProxy": 0, "UpstreamProxyHostname": "", "UpstreamProxyPort": "", "EgressRegion": ""  } };
  }

  fillSettingsValues(g_initObj.Settings);

  // Some fields are disabled in VPN mode
  $('#VPN').change(vpnModeUpdate);
  vpnModeUpdate();

  // Check for valid input in port number fields
  $('.port-entry').on('keyup change blur', function(event) {checkPortField(event.target);});
  $('.port-entry').each(function() {checkPortField(this);});

  // Disable the other upstream proxy settings if skipping
  $('#SkipUpstreamProxy').change(skipUpstreamProxyUpdate);
  skipUpstreamProxyUpdate();

  // Capture the settings as the tab is entered, to check for changes later.
  $('a[href="#settings-pane"][data-toggle="tab"]').on('shown', function(e) {
    g_initialSettingsJSON = settingsToJSON();
  });

  // The settings are saved (and applied) when the user navigates away from the
  // Settings tab.
  $('a[data-toggle="tab"]').on('show', function(e) {
    // If we are navigating away from our tab, then we need to apply our settings
    // (if changed).
    if ($('#settings-tab').hasClass('active') &&    // we were active
        !$(this).parent().is($('#settings-tab'))) { // we won't be active
      var settingsJSON = settingsToJSON();
      if (settingsJSON === false) {
        // Settings are invalid. Scroll to the (first) offender and prevent switching tabs.
        $('.tab-content').scrollTo(
          $('#settings-pane .error').eq(0),
          500,            // animation time
          {offset: -50}); // leave some space for the alert
        $('#settings-pane .error input').eq(0).focus();
        e.preventDefault();
        return;
      }
      else if (settingsJSON !== g_initialSettingsJSON) {
        // Settings have changed -- update them in the application (and trigger a reconnect).
        HtmlCtrlInterface_UpdateSettings(settingsJSON);
      }
    }
  });
});

function fillSettingsValues(obj) {
  if (typeof(obj.SplitTunnel) !== 'undefined') {
    $('#SplitTunnel').prop('checked', obj.SplitTunnel);
  }

  if (typeof(obj.VPN) !== 'undefined') {
    $('#VPN').prop('checked', obj.VPN);
  }
  $('#VPN').change(vpnModeUpdate);
  vpnModeUpdate();

  if (typeof(obj.LocalHttpProxyPort) !== 'undefined') {
    $('#LocalHttpProxyPort').val(obj.LocalHttpProxyPort > 0 ? obj.LocalHttpProxyPort : "");
  }
  $('#LocalHttpProxyPort').trigger('keyup');

  if (typeof(obj.LocalSocksProxyPort) !== 'undefined') {
    $('#LocalSocksProxyPort').val(obj.LocalSocksProxyPort > 0 ? obj.LocalSocksProxyPort : "");
  }
  $('#LocalSocksProxyPort').trigger('keyup');

  if (typeof(obj.UpstreamProxyHostname) !== 'undefined') {
    $('#UpstreamProxyHostname').val(obj.UpstreamProxyHostname);
  }

  if (typeof(obj.UpstreamProxyPort) !== 'undefined') {
    $('#UpstreamProxyPort').val(obj.UpstreamProxyPort > 0 ? obj.UpstreamProxyPort : "");
  }
  $('#UpstreamProxyPort').trigger('keyup');

  if (typeof(obj.SkipUpstreamProxy) !== 'undefined') {
    $('#SkipUpstreamProxy').prop('checked', obj.SkipUpstreamProxy);
  }
  $('#SkipUpstreamProxy').change(skipUpstreamProxyUpdate);
  skipUpstreamProxyUpdate();

  if (typeof(obj.EgressRegion) !== 'undefined') {
    $('#EgressRegion').val(obj.EgressRegion);
  }
  $('body select').each(function() {
    if (this.refresh) this.refresh();
  });
}

// Packages the current settings into JSON string. Returns if invalid value found.
function settingsToJSON() {
  var valid = true;

  $('.port-entry').each(function() {
    if (checkPortField(this) === false) {
      valid = false;
    }
  });

  if (!valid) {
    return false;
  }

  var returnValue = {
    VPN: $('#VPN').prop('checked') ? 1 : 0,
    SplitTunnel: $('#SplitTunnel').prop('checked') ? 1 : 0,
    LocalHttpProxyPort: validatePort($('#LocalHttpProxyPort').val()),
    LocalSocksProxyPort: validatePort($('#LocalSocksProxyPort').val()),
    UpstreamProxyHostname: $('#UpstreamProxyHostname').val(),
    UpstreamProxyPort: validatePort($('#UpstreamProxyPort').val()),
    SkipUpstreamProxy: $('#SkipUpstreamProxy').prop('checked') ? 1 : 0,
    EgressRegion: $('#EgressRegion').val()
  };

  return JSON.stringify(returnValue);
}

// Returns the numeric port if valid, otherwise false. Note that 0 is a valid
// return value, and falsy, so use `=== false`.
function validatePort(val) {
  if (val.length === 0) {
    return 0;
  }

  val = parseInt(val);
  if (isNaN(val) || val < 1 || val > 65535) {
    return false;
  }

  return val;
}

// Returns the numeric port if valid, otherwise false. Note that 0 is a valid
// return value, and falsy, so use `=== false`.
function checkPortField(target) {
  var val = $(target).val();
  var port = validatePort(val);
  var portOK = (port !== false);
  $('.help-inline.'+target.id)
    .toggleClass('hidden', portOK)
    .parents('.control-group').eq(0).toggleClass('error', !portOK);

  // Show/hide the error alert depending on whether we have an erroneous field
  $('#settings-pane .value-error-alert').toggleClass(
    'hidden', $('#settings-pane .control-group.error').length === 0);

  return port;
}

// Some of the settings are incompatible with VPN mode. We'll modify the display
// depending on the choice of VPN mode.
function vpnModeUpdate() {
  var vpn = $('#VPN').prop('checked');
  $('input.vpn-incompatible:not(.perma-disabled), .vpn-incompatible:not(.perma-disabled) input, '+
    'select.vpn-incompatible:not(.perma-disabled), .vpn-incompatible:not(.perma-disabled) select')
      .prop('disabled', vpn).toggleClass('disabled', vpn);
  $('.vpn-incompatible-msg').toggleClass('invisible', !vpn);
  $('.vpn-incompatible').toggleClass('disabled-text', vpn);

  // The fancy msDropDown controls require more work to disable.
  $('body select').each(function() {
    if ($(this).data('dd')) {
      $(this).data('dd').set('disabled', this.disabled);
    }
  });
}

// The other upstream proxy settings should be disabled if skip-upstream-proxy is set.
function skipUpstreamProxyUpdate() {
  var skipUpstreamProxy = $('#SkipUpstreamProxy').prop('checked');
  $('.skip-upstream-proxy-incompatible input').prop('disabled', skipUpstreamProxy);
  $('.skip-upstream-proxy-incompatible').toggleClass('disabled-text', skipUpstreamProxy);
}

/* FEEDBACK ******************************************************************/

$(function() {
  // This is to help with testing
  if (!g_initObj.Feedback)
  {
    g_initObj.Feedback = {
      "NewVersionURL": "http://www.example.com/en/download.html",
      "NewVersionEmail": "get@example.com",
      "FaqURL": "http://www.example.com/en/faq.html",
      "DataCollectionInfoURL": "http://example.com/en/faq.html#information-collected"
    };
  }

  // Add click listener to the happy/sad choices
  $('.feedback-smiley .feedback-choice').click(function() {
    $('.feedback-smiley .feedback-choice').removeClass('selected');
    $(this).addClass('selected');
  });

  // Values in the feedback text need to be replaced when the text changes -- i.e., on language switch.
  $window.on(LANGUAGE_CHANGE_EVENT, fillFeedbackValues);
  fillFeedbackValues();

  $('#feedback-submit').click(function(e) {
    e.preventDefault();
    sendFeedback();
  });
});

// Some of the text in the feedback form has values that need to be replaced at runtime.
// They also need to be replaced when switching values.
function fillFeedbackValues() {
  if (g_initObj.Feedback.NewVersionURL && g_initObj.Feedback.NewVersionEmail) {
    // Fill in the links and addresses that are specific to this client
    $('.NewVersionURL').attr('href', g_initObj.Feedback.NewVersionURL);
    $('.NewVersionEmail').attr('href', 'mailto:'+g_initObj.Feedback.NewVersionEmail)
                         .text(g_initObj.Feedback.NewVersionEmail);
    $('.NewVersionURL').parent().removeClass('hidden');
  }

  if (g_initObj.Feedback.FaqURL) {
    $('.FaqURL').attr('href', g_initObj.Feedback.FaqURL);
  }

  if (g_initObj.Feedback.DataCollectionInfoURL) {
    $('.DataCollectionInfoURL').attr('href', g_initObj.Feedback.DataCollectionInfoURL);
  }
}

function sendFeedback() {
  var smileyResponses = [];
  $('.feedback-choice.selected').each(function() {
    smileyResponses.push({
      title: $(this).data('feedback-choice-title'),
      question: $(this).data('feedback-choice-hash'),
      answer: $(this).data('feedback-choice-value')
    });
  });

  var fields = {
    responses: smileyResponses,
    feedback: $('#feedback-comments').val(),
    email: $('#feedback-email').val(),
    sendDiagnosticInfo: !!$('#feedback-send-diagnostic').prop('checked')
  };

  // Switch to the connection tab
  $('.main-nav a:first').tab('show');

  // Clear the feedback form
  $('.feedback-choice.selected').removeClass('selected');
  $('#feedback-comments').val('');
  $('#feedback-email').val('');
  $('#feedback-send-diagnostic').prop('checked', true);

  // Actually send the feedback
  HtmlCtrlInterface_SendFeedback(JSON.stringify(fields));

  // Show (and hide) the success alert
  $('#feedback-success-alert').toggle('fold', {horizFirst: true}, function() {
    setTimeout(function() {
      $('#feedback-success-alert').toggle('fold', {horizFirst: true}, 1000);
    }, 5000);
  });
}

/* LOG MESSAGES **************************************************************/

$(function() {
  $('#show-debug-messages').click(showDebugMessagesClicked);
});

function showDebugMessagesClicked() {
  /*jshint validthis:true */
  var show = $(this).prop('checked');
  $('.log-messages').toggleClass('showing-priority-0', show);
}

function addLogMessage(obj) {
  var row = $('<tr>');
  var msgCell = $('<td>');
  msgCell.text(obj.message);
  row.addClass('priority-' + obj.priority);
  row.append(msgCell);
  $('.log-messages').prepend(row);

  // The "Show Debug Messages" checkbox is hidden until we actually get a debug
  // message.
  if (obj.priority < 1) {
    $('label[for="show-debug-messages"]').removeClass('invisible');
  }
}

/* LANGUAGE ******************************************************************/

var RTL_LOCALES = ['devrtl', 'fa', 'ar', 'he'];

$(function() {
  var fallbackLanguage = 'en';

  // Language priority: cookie, system locale, fallback
  var lang = getCookie('language') ||
              (g_initObj.Config && g_initObj.Config.Language) ||
              fallbackLanguage;

  i18n.init(
    {
      lang: lang,
      fallbackLng: fallbackLanguage,
      resStore: window.PSIPHON.LOCALES
    },
    function(t) {
      switchLocale(lang);
    });

  $('.language-choice').click(function() { switchLocale(this.name); });
});

function switchLocale(locale) {
  i18n.setLng(locale, function() {
    $('body').i18n();

    // The content of elements will have changed, so trigger custom event that can
    // be listened for to take additional actions.
    $window.trigger(LANGUAGE_CHANGE_EVENT);

    // Remember the user's choice
    setCookie('language', locale);
  });

  //
  // Right-to-left languages need special consideration.
  //

  var rtl = RTL_LOCALES.indexOf(locale) >= 0;

  $('body').attr('dir', rtl ? 'rtl' : 'ltr')
           .css('direction', rtl ? 'rtl' : 'ltr');

  // We'll use a data attribute to store classes which should only be used
  // for RTL and not LTR, and vice-versa.
  $('[data-i18n-rtl-classes]').each(function() {
      $(this).toggleClass($(this).data('i18n-ltr-classes'), !rtl)
             .toggleClass($(this).data('i18n-rtl-classes'), rtl);
  });
}


/* HELPERS *******************************************************************/

// Support the `data-match-height` feature
function doMatchHeight() {
  var matchSelectors = [];
  $('[data-match-height]').each(function() {
    var $this = $(this);

    // Store the original padding, if we don't already have it.
    if (typeof($this.data('match-height-orig-padding-top')) === 'undefined') {
      $this.data('match-height-orig-padding-top', parseInt($this.css('padding-top')))
           .data('match-height-orig-padding-bottom', parseInt($this.css('padding-bottom')));
    }

    var matchSelector = $this.data('match-height');
    if (matchSelectors.indexOf(matchSelector) < 0) {
      matchSelectors.push(matchSelector);
    }
  });

  for (var i = 0; i < matchSelectors.length; i++) {
    matchHeights(matchSelectors[i]);
  }

  function matchHeights(matchSelector) {
    var maxHeight = 0;
    $(matchSelector).each(function() {
      var $this = $(this);
      // Reset the padding to its original state
      $this.css('padding-top', $this.data('match-height-orig-padding-top'))
           .css('padding-bottom', $this.data('match-height-orig-padding-bottom'));

      maxHeight = Math.max(maxHeight, $this.height());
    });

    $(matchSelector).each(function() {
      var $this = $(this);

      var heightDiff = maxHeight - $this.height();
      if (heightDiff <= 0) {
        // Don't adjust the largest
        return;
      }

      var align = $this.data('match-height-align');
      if (align === 'top') {
        $this.css('padding-bottom', heightDiff + $this.data('match-height-orig-padding-bottom'));
      }
      else if (align === 'bottom') {
        $this.css('padding-top', heightDiff + $this.data('match-height-orig-padding-top'));
      }
      else { // center
        $this.css('padding-top', heightDiff/2 + $this.data('match-height-orig-padding-top'))
             .css('padding-bottom', heightDiff/2 + $this.data('match-height-orig-padding-bottom'));
      }
    });
  }
}

//
// We don't have the ability to use real cookies or DOM storage, so we'll store
// persistent stuff in the registry via the win32 code.
//

var g_cookies = g_initObj.Cookies ? JSON.parse(g_initObj.Cookies) : {};

function getCookie(name) {
  return g_cookies[name];
}

function setCookie(name, value) {
  g_cookies[name] = value;
  HtmlCtrlInterface_SetCookies(JSON.stringify(g_cookies));
}


/* INTERFACE METHODS *********************************************************/

function HtmlCtrlInterface_AddMessage(jsonArgs) {
  setTimeout(function() {
    addLogMessage(JSON.parse(jsonArgs));
  }, 1);
}

function HtmlCtrlInterface_SetState(jsonArgs) {
  setTimeout(function() {
    var args = JSON.parse(jsonArgs);
    g_lastState = args.state;
    updateConnectToggle();
  }, 1);
}

function HtmlCtrlInterface_Start() {
  // Prevent duplicate state change attempts
  if (g_lastState === 'starting' || g_lastState === 'connected') {
    return;
  }
  setTimeout(function() {
    var appURL = 'app:start';
    if (IS_BROWSER) {
      console.log(appURL);
    }
    else {
      window.location = appURL;
    }
  }, 1);
}

function HtmlCtrlInterface_Stop() {
  // Prevent duplicate state change attempts
  if (g_lastState === 'stopping' || g_lastState === 'disconnected') {
    return;
  }
  setTimeout(function() {
    var appURL = 'app:stop';
    if (IS_BROWSER) {
      console.log(appURL);
    }
    else {
      window.location = appURL;
    }
  }, 1);
}

function HtmlCtrlInterface_UpdateSettings(settingsJSON) {
  setTimeout(function() {
    var appURL = 'app:updatesettings?' + encodeURIComponent(settingsJSON);
    if (IS_BROWSER) {
      console.log(appURL);
    }
    else {
      window.location = appURL;
    }
  }, 1);
}

function HtmlCtrlInterface_SendFeedback(feedbackJSON) {
  setTimeout(function() {
    var appURL = 'app:sendfeedback?' + encodeURIComponent(feedbackJSON);
    if (IS_BROWSER) {
      console.log(appURL);
    }
    else {
      window.location = appURL;
    }
  }, 1);
}

function HtmlCtrlInterface_SetCookies(cookiesJSON) {
  setTimeout(function() {
    var appURL = 'app:setcookies?' + encodeURIComponent(cookiesJSON);
    if (IS_BROWSER) {
      console.log(appURL);
    }
    else {
      window.location = appURL;
    }
  }, 1);
}


/* EXPORTS */

// The C interface code is unable to access functions that are members of objects,
// so we'll need to directly expose our exports.

window.HtmlCtrlInterface_AddMessage = HtmlCtrlInterface_AddMessage;
window.HtmlCtrlInterface_SetState = HtmlCtrlInterface_SetState;

})(window);