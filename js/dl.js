$(function () {

	//determine if the file is index.html or not. If index.html, modify links
	var path = window.location.pathname,
		pathEnd = path.substring(path.length - 14),
		root = pathEnd === 'index_lms.html' || pathEnd.substring(pathEnd.length - 1, pathEnd.length) === '/' ? 'course/' : '',
		popovers = $('[rel="popover"]'),
		subnav = $('#subnav'),
		dlmain = $('#dl-main');
	var initResourcesModal = function () {
		var resModal = $('#resourcesModal');
		resModal.load(root + 'resources.html', function () {
			resModal.find('a').each(function () {
				var self = $(this),
					href = self.attr('href');
				console.log(href);
				if (href) {
					if (href.substring(0,4) === 'res/') {
						self.attr('href', root + href);
					}
				}
			});
		});
		$(this).off('click', initResourcesModal);
	};
	//load navigation
	$('#subnav').load(root + 'subnav.html', function () {
		var pageName = $('h1').text(),
			allNavAs = $('#subnav').find('.dropdown-menu').find('a'),
			subnavLi = allNavAs.filter('a:contains("'+ pageName +'")'),
			allNavAsLength = allNavAs.length,
			curnavLi = -1, 
			nextText = '',
			prevText = '',
			nextHref = '',
			prevHref = '',
			prevBtn = $('#nav-prev'),
			nextBtn = $('#nav-nxt');
		if (subnavLi) {
			subnavLi.parent('li').addClass('active');
			subnavLi.parents('li.dropdown').addClass('active');
		}
		//if there is a root value, page is outside the course folder; modify links
		if (root) {
			var subnavLinks = $('#subnav').find('a');
			subnavLinks.each(function () {
				var self = $(this);
				if (self.html() !== '#' && !self.hasClass('dropdown-toggle')) {
					self.attr('href', 'course/' + self.attr('href'));
				}
			});
		}
		//find the current navigation index
		allNavAs.each(function (i) {
			if ($(this).attr('href') === subnavLi.attr('href')) {
				curnavLi = i;
			}
		});
		switch (curnavLi) {
			case -1: 
				var nextA = $(allNavAs[0]);
				nextHref = nextA.attr('href');
				nextText = nextA.text();
				break;
			case 0: 
				var nextA = $(allNavAs[1]);
				nextHref = nextA.attr('href');
				nextText = nextA.text();
				break;
			case allNavAsLength - 1: 
				var prevA = $(allNavAs[curnavLi - 1]);
				prevHref = prevA.attr('href');
				prevText = prevA.text();
				break;
			default: 
				var prevA = $(allNavAs[curnavLi - 1]);
				var nextA = $(allNavAs[curnavLi + 1]);
				nextHref = nextA.attr('href');
				nextText = nextA.text();
				prevHref = prevA.attr('href');
				prevText = prevA.text();
		}
		if (!prevHref) {
			prevBtn.hide();
		} else {
			prevBtn.attr('href', prevHref);
			prevBtn.attr('rel', 'tooltip');
			prevBtn.attr('data-original-title', prevText);
		}
		if (!nextHref) {
			nextBtn.hide();
		} else {
			nextBtn.attr('href', nextHref);
			nextBtn.attr('rel', 'tooltip');
			nextBtn.attr('data-original-title', nextText);
		}
	});
	//trigger popovers
	popovers.popover({trigger: 'manual', placement: 'bottom'});
	popovers.on('click', function () {
		var self = $(this);
		self.popover('toggle');
	});
	//trigger tooltips
	dlmain.tooltip({
		selector: "a[rel=tooltip]"
	});
	//attachments modal init
	$('#resourceLink').on('click', initResourcesModal);
	//load if quiz-area is on page
	if ($('.quiz-area').length > 0) {
		$.getScript('../js/quizzes.min.js');
	};
	
	//unload handler
	$(window).on('unload', function (e) {});
}); //end anon function on doc ready

