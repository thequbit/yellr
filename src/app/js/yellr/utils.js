'use strict';
var yellr = yellr || {};

/**
 * utility functions
 * ===================================
 *
 * - render_template
 * - render_list
 * - clearNode
 */


yellr.utils = {

  no_subnav: function() {
    /**
     * convenience function. call it to remove the subnav
     */

    this.render_template({
      target: '#app-subnav',
      template: ''
    })
  },

  save: function() {
    /**
     * Saves/updates our yellr.localStorage
     */

    localStorage.setItem('yellr', JSON.stringify({DATA: yellr.DATA, SETTINGS: yellr.SETTINGS, UUID: yellr.UUID }));
  },

  render_template: function(settings) {
    /**
     * Dependencies: Handlebar.js, zepto.js (or jQuery.js)
     *
     * settings = {
     *   template: '#script-id',
     *   target: '#query-string',
     *   context: {},
     *   events: func
     * }
     */

    if (!Handlebars || !$) {
      // missing dependencies
      console.log('missing dependencies for yellr.utils.render_template');
      return;
    }

    // get Handlebar template
    if (!settings.template || settings.template ==='') {
      $(settings.target).html(''); // if template is empty, clear HTML of target
      return;
    };
    var template = Handlebars.compile($(settings.template).html());

    // render it (check it we have a context)
    var html = template( settings.context ? settings.context : {} );

    // replace html, or return HTML frag
    if (settings.target) {
      // if (settings.append) $(settings.target).append(html);
      $(settings.target).html(html);
    }
    else return html;

  },


  clearNode: function(DOMnode) {
    while(DOMnode.hasChildNodes())
      DOMnode.removeChild(DOMnode.firstChild);
  },

  guid: function (len, radix) {
    /*!
      Math.uuid.js (v1.4)
      http://www.broofa.com
      mailto:robert@broofa.com
      http://www.broofa.com/2008/09/javascript-uuid-function/

      Copyright (c) 2010 Robert Kieffer
      Dual licensed under the MIT and GPL licenses.
    */
    var CHARS = '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz'.split('');
    var chars = CHARS, uuid = [], i;
    radix = radix || chars.length;

    if (len) {
      // Compact form
      for (i = 0; i < len; i++) uuid[i] = chars[0 | Math.random()*radix];
    } else {
      // rfc4122, version 4 form
      var r;

      // rfc4122 requires these characters
      uuid[8] = uuid[13] = uuid[18] = uuid[23] = '-';
      uuid[14] = '4';

      // Fill in random data.  At i==19 set the high bits of clock sequence as
      // per rfc4122, sec. 4.1.5
      for (i = 0; i < 36; i++) {
        if (!uuid[i]) {
          r = 0 | Math.random()*16;
          uuid[i] = chars[(i == 19) ? (r & 0x3) | 0x8 : r];
        }
      }
    }

    // alert('GUID: '+ uuid.join(''));
    // console.log('new GUID generated');
    return uuid.join('');
  }
};
