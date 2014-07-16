'use strict';
var yellr = yellr || {};

/*
	Toggle things
*/ 


yellr.toggle = {

	homepage: function(options) {

		// update nav
		// ----------------------------
		// clear class of other nav-option
		$('#homepage-subnav .current').removeClass('current');

		// find the new nav div
		var navTarget;
		if (options.target) navTarget = (options.target.localName === 'a') ? options.target.parentNode : options.target;
		else {
			if (options.pageID === '#news-feed') navTarget = '#news-feed-tab';
			if (options.pageID === '#assignments') navTarget = '#assignments-tab';
		}

		// update class
		var $target = $(navTarget);
		$target.addClass('current');


		// update content // page transition
		// ----------------------------
		// get data-attrs
		var page = $target.attr('data-page');
		var currentPage = $('.pt-page-current').attr('id');

		// prevent transitioning to same page
		if (page !== '#'+currentPage) {
			// move to left from right
			if (currentPage === 'assignments') yellr.pageManager.nextPage(page, 1);
			// move to right from left
			if (currentPage === 'news-feed') yellr.pageManager.nextPage(page, 2);
		}

	},

	more_options: function(e) {
		// toggle class="hidden", set attribute
		var moreList = document.querySelector('.more-options-list');

		if (moreList.getAttribute('data-hidden') === 'true') {
			moreList.className = moreList.className.split(' hidden')[0];
			moreList.setAttribute('data-hidden', 'false');
		} else {
			moreList.className += ' hidden';
			moreList.setAttribute('data-hidden', 'true');
		}
	},
	report_details: function(e) {
		// the element holding the extra info
		var container = document.querySelector('#submit-footer .more-info');
		// current info showin
		var current = container.getAttribute('data-current');
		// what was just selected
		var selected = e.target.getAttribute('data-info') || e.target.parentNode.getAttribute('data-info');
		console.log(current, selected);

		// show the thing
		if (current === 'none') {
			container.className = container.className.split(' hidden')[0];
		}


		var target;
		var extras = document.querySelectorAll('.extra-info');
		for (var i = 0; i < extras.length; i++) {
			// clear selected classname
			extras[i].className = extras[i].className.split('selected')[0];
			// find our target
			if (extras[i].getAttribute('data-info') == selected)
				target = extras[i];
		}
		console.log(target);
		target.className += ' selected';
		container.setAttribute('data-current', selected);

		// if (selected === current) {
		// 	container.className += ' hidden';
		// }

		// close it if we have a toggle
		if (selected === current) {
			container.className += ' hidden';
			container.setAttribute('data-current', 'none');
		}

	}
}
