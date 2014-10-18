'use strict';
var mod = mod || {};

// this contains very specific DOM refernces based on each page
// the rest of the JS files try to remain as agnostic as possible

mod.setup = {


  single_collection_view: function () {

    // local vars
    // ----------------------------
    var items = [],
        // collection_id (from URL hash)
        collection_id = 0,
        // DOM references
        view_controls,
        export_btn,
        grid,
        // packery.js object
        pckry;


    // get the URL hash --> load the correct collection
    collection_id = parseInt(window.location.hash.split('#')[1]);

    // ping the server for that collection
    mod.collections.get_collection(collection_id, function (response) {

      // show collection name
      document.querySelector('.t1').innerHTML = response.collection_name;

      // render the collection items
      mod.utils.render_template({
        template: '#view-collection-gi-template',
        target: '#collection-wrapper',
        context: {
          collection: response.collection
        },
        append: true
      });

      // setup grid
      items = document.querySelectorAll('.collection-gi');

      // delay packery so browser has time to render the new HTML
      setTimeout(function () {
        pckry = new Packery(grid, {
          itemSelector: '.collection-gi',
          // columnWidth: 60,
          columnWidth: '.collection-grid-sizer',
          gutter: '.gutter-sizer'
        });
      }, 500);

    });



    // send user a message / remove post from collection
    grid = document.querySelector('#collection-wrapper');
    grid.onclick = function (event) {
      if (event.target.className === 'fa fa-comment') {
        alert('Send message');
      } else if (event.target.className === 'fa fa-close') {
        alert('Remove item from collection');
      }
    }



    // download .zip file of media collection
    export_btn = document.querySelector('#export-content-btn');
    export_btn.onclick = function (event) {
      alert('TODO: Download zip file of media collection');
    }


    // [X] grid  or  [ ] list
    view_controls = document.querySelector('.collection-view-controls');
    // click to change view
    view_controls.onclick = function (event) {

      // for each case we either:
      //    1. reinitilize the packery grid, or
      //    2. destroy the packery grid
      // there are specific styles attached to each
      // so we loops through the grid items and change classNames

      if (event.target.checked) {
        if (event.target.defaultValue === 'list') {
          pckry.destroy();
          // change all classnames to '.gi'
          for (var i = 0; i < items.length; i++) items[i].className = 'gi';
        } else {
          // make sure items have class of '.collections-gi'
          for (var i = 0; i < items.length; i++) items[i].className = 'collection-gi';
          // reinitialize packery
          pckry = new Packery(grid, {
            itemSelector: '.collection-gi',
            // columnWidth: 60,
            columnWidth: '.collection-grid-sizer',
            gutter: '.gutter-sizer'
          });
        }
      }
    }

  },


  login: function () {

    var $form = $('#mod-login');

    $form.submit(function (e) {
      e.preventDefault();
      var fields = $form.serializeArray();

      mod.utils.login(fields[0].value, fields[1].value);
    });
  },



  assignments_page: function () {
    mod.assignments.get_my_assignments({
      callback: function () {
        console.log(mod.DATA.assignments);

        // prep our assignments context
        var assignments = mod.DATA.assignments.filter(function (val, i, arr) {
          val.title = val.questions[0].question_text;
          val.expire_datetime = moment(val.expire_datetime).format('MMM Do YYYY');
          val.url = 'view-assignment.html#'+val.assignment_id;
          return true;
        })

        // render html
        mod.utils.render_template({
          template: '#my-assignment-li',
          target: '.my-assignments-list',
          context: {assignments: assignments}
        });
      }
    });

  },



  single_assignment_view: function () {

    var assignment_id = parseInt(window.location.hash.split('#')[1]);

    if (assignment_id !== NaN) {
      // render the question text and things
      mod.assignments.view(assignment_id);

      // get replies to question
      mod.assignments.get_responses_for({
        assignment_id: assignment_id,
        callback: function (posts) {
          var replies = mod.utils.convert_object_to_array(posts);

          mod.utils.render_template({
            template: '#assignment-response-li-template',
            target: '#assignment-replies-list',
            context: {replies: replies}
          });

          // parse UTC dates with moment.js
          var deadline = document.querySelector('.assignment-deadline');
              deadline.innerHTML = moment(deadline.innerHTML).format('MMMM Do YYYY');
          var published = document.querySelector('.assignment-published');
              published.innerHTML = moment(published.innerHTML).format('MMMM Do YYYY');

        }
      });

      // get assignment collection
      mod.collections.get_collection(assignment_id, function (response) {
        mod.utils.render_template({
          template: '#collections-li-template',
          target: '#assignment-collection-list',
          context: {
            collection: response.collection
          }
        })
      });
      // set the collection_id attribute to the #assignment-collections-list
      document.querySelector('#assignment-collection-list').setAttribute('data-collection-id', assignment_id);

    }


  },


  collections_page: function () {

    // get my collections
    mod.collections.get_my_collections({
      callback: function () {

        // parse datetime with moment.js
        // add url attribute for Handlebar template peace of mind
        var collections = mod.DATA.collections.filter(function (val, i ,arr) {
          val.collection_datetime = moment(val.collection_datetime).format('MMM Do YYYY');
          val.url = 'view-collection.html#'+val.collection_id;
          return true;
        });

        // render html
        mod.utils.render_template({
          template: '#collections-gi-template',
          target: '.collections-grid',
          context: {collections: collections}
        });
      }
    });


    // hook up the buttons
    document.querySelector('#new-collection-btn').onclick = function (e) {

      mod.utils.show_overlay({template: '#collections-form-template'});
      mod.collections.setup_form();

    }
    document.querySelector('#delete-collection-btn').onclick = function (e) {
      console.log('delete collection');
    }



  },


  inbox: function () {

    // check for new messages
    // (alert user of this action)
    mod.messages.get_messages({
      feedback: true,
      callback: function () {

        var filtered_messages = mod.messages.filter_messages();

        // render messages
        mod.utils.render_template({
          template: '#inbox-li',
          target: '#unread-mail-list',
          context: {messages: filtered_messages.unread}
        });

        mod.utils.render_template({
          template: '#inbox-li',
          target: '#read-mail-list',
          context: {messages: filtered_messages.read}
        });
      }
    });



    // view a message
    document.querySelector('#inbox').onclick = function view_message(e) {

      // read the data-id attribute of the right node
      var message_id = (e.target.nodeName === 'LI') ? e.target.getAttribute('data-id') : e.target.parentNode.getAttribute('data-id'),
          message = mod.DATA.messages.filter(function (val, i, arr) {
            if (val.message_id === parseInt(message_id)) return true;
          })[0];

      mod.utils.show_overlay({
        template: '#view-message-template',
        context: message
      });

    };


    // create a new message
    document.querySelector('#new-message-btn').onclick = function() {
      mod.messages.create_new_message();
    }
  },


  dashboard: function () {

    /**
     * setup the Yellr Admin dashboard
     * index.html
     */

    var pckry, grid;

    // get my assignments
    mod.assignments.get_my_assignments({
      callback: function () {
        // get 4 latest
        var latest_4_assignments = [];
        for (var i = 0; i < mod.DATA.assignments.length; i++) {
          latest_4_assignments.push(mod.DATA.assignments[i]);
          if (latest_4_assignments.length >= 4) break;
        };

        // use moment.js
        latest_4_assignments.filter(function (val) {
          val.expire_datetime = moment(val.expire_datetime).fromNow(true);
        });

        // render html
        mod.utils.render_template({
          template: '#active-assignment-template',
          target: '#active-assignments-list',
          context: {assignments: latest_4_assignments }
        });

      }
    });


    // get latest posts
    mod.posts.get_posts({
      callback: function () {
        mod.utils.render_template({
          template: '#latest-posts-template',
          target: '#latest-posts',
          context: {posts: mod.DATA.posts}
        });
      }
    });



    // setup the grid and filter things
    // ----------------------------
    // ----------------------------

    // auto-update
    document.querySelector('#auto-update').onclick = function (event) {
      // set auto-refresh to true
      if (event.target.checked === true) {
        AUTO_REFRESH = true;
        mod.utils.load_latest_posts();
      } else {
        // auto-refresh = false
        AUTO_REFRESH = false;
      }
    }

    // setup the filter
    document.querySelector('.feed-filter-div').onclick = function (event) {
      console.log('hello from: ');
    }


    // setup packery
    grid = document.querySelector('#raw-feed');
    pckry = new Packery(grid, {
      itemSelector: '.feed-gi',
      columnWidth: '.feed-sizer',
      gutter: '.feed-gutter'
    });

    // event listeners:
    // - send a message to a user who submitted content
    // - add post to a collection
    // - flag inappropriate content
    grid.onclick = function(e) {
      switch (e.target.className) {

        // add post to a collection
        case 'fa fa-folder':
          // show a list of collections via a dropdown
          // pass in the DOM element
          mod.feed.toggle_collections_dropdown(e.target);
          break;

        // send user a message
        case 'fa fa-comment':

          var domNode = e.target.offsetParent.querySelector('.meta-div'),
              postID = parseInt(domNode.getAttribute('data-post-id')),
              data = mod.DATA.posts.filter(function (val, i, arr) {
                if (val.post_id === postID) return true;
              })[0];

          mod.utils.show_overlay({
            template: '#send-message-template',
            context: {
              uid: data.client_id,
              subject: 'RE: '+data.title
            }
          });

          var $form = $('#send-message-form');
          $form.submit(function (e) {
            e.preventDefault();
            var array = $form.serializeArray();

            mod.messages.send_message({
              to: array[0],
              subject: array[1],
              text: array[2],
              callback: function () {
                mod.utils.clear_overlay();
              }
            });
          });

          break;
        // flag as inappropriate
        case 'fa fa-flag':
          console.log('report the motherfucker');
          break;
        default:
          break;
      }
    };


    // // refresh the feed
    // $('#refresh-posts').on('click', function (e) {

    //   // get latest posts
    //   mod.posts.get_posts({
    //     callback: function () {
    //       mod.utils.render_template({
    //         template: '#latest-posts-template',
    //         target: '#latest-posts',
    //         context: {posts: mod.DATA.posts}
    //       });
    //     }
    //   });

    // });

    // refresh posts every 10 seconds
    mod.utils.load_latest_posts();
  }
}
