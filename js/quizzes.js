(function ($) {	
	var totalQuestions = 0,
	//functions for setting data attributes on the input rather than the list items
		dataSetter = function (el, attArr, other) {
			var i = 0, 
				attArrLength = attArr.length,
				da = '',
				dataName = '',
				otherEl = other || el;
			for (i = 0; i < attArrLength; i = i + 1) {
				da = attArr[i];
				dataName = da.replace(/^data\-/, '');
				if (el.attr(da)) {
					otherEl.data(dataName, el.attr(da));
					el.removeAttr(da);
				}
			}
		},
	
		//function for loading the feedback into data attributes on the input rather than the elements
		feedbackSetter = function (fbString, el, other) {
			var i = 0, 
				fbEls = el.find(fbString),
				otherEl = other || el;
			fbEls.each(function () {
				var fbEl = $(this);
				otherEl.data(fbEl.attr('class').replace(/^qz\-/, ''), fbEl.html());
				fbEl.remove();
			});
		},
	
		//randomize the list items in total quiz or options in multiple choice
		randomize = function (elarr) {
			var elparent = elarr.eq(0).parent('ul, ol, div.quiz-items');
			elarr.sort(function (a, b) {
				var temp = parseInt(Math.random() * 10, 10),
					isOddOrEven = temp%2,
					isPosOrNeg = temp > 5 ? 1 : -1;
				return (isOddOrEven * isPosOrNeg);
			}).appendTo(elparent);
		}, 
		
		//takes a value and a text string (comma separated) and compares to see if any of the values match the initial value. strict === false means that the comparison will only include letters
		checkAllValues = function (val, txt, strict) {
			var makeArray = txt.split(','), 
				i = 0,
				arrLength = makeArray.length, 
				simplify = function (t) {
					return t.toLowerCase().replace(/[^A-z]/ig,'');
				},
				isItemCorrect = false;
			for (i = 0; i < arrLength; i = i + 1) {
				if ((simplify(makeArray[i]) === simplify(val)) && !strict || (makeArray[i] === val)) {
					isItemCorrect = true
					break;
				}
			}
			return isItemCorrect;
		},
		//helper function to determine the index array of the quiz item
		lookupix = function (curqi) {
			return curqi.data('num');
		},
		//helper functions to traverse
		childToQi = function (el) {
			var qi = el.parents('div.quiz-items > div').eq(0);
			return qi;
		},
		
		getDimensions = function (el) {
			var top = parseInt(el.css('top').replace('px', ''), 10),
				left = parseInt(el.css('left').replace('px', ''), 10);
			return {
				top: isNaN(top) ? 0 : top,
				left: isNaN(left) ? 0 : left,
				width: el.width(),
				height: el.height()
			};
		},
		//resize Elements takes an element, an object containing the original dimensions and the percent change
		resizeElements = function (el, widthPercent, heightPercent) {
			var dim = el.data('orig-position');
			if (!dim) {
				var origDimensions = getDimensions(el)
				el.data('orig-position', origDimensions);
				dim = origDimensions;
			}
			
			el.css({
				'top': Math.floor(dim.top * heightPercent) + 'px',
				'left': Math.floor(dim.left * widthPercent) + 'px',
				'width': Math.floor(dim.width * widthPercent) + 'px',
				'height': Math.floor(dim.height * heightPercent) + 'px'
			});
		},
		
		//quiz items have the following pattern
		//	{
		//		el: quiz item element
		//		quiztype: type of quiz i.e. 'multi', 'hotspot', 'fillin'
		//		attempts: how many have been attempted so far
		//		tries: how many tries does the quiz-taker have
		//		status: -1 (not yet clicked), 0 (active), 1 (inactive)
		//		correct: true or false
		//		correctels: elements used to determine if the item is correct 
		//		mainels: all the main items used in the quiz item
		//		triggerel: reference to a submit button or other trigger element
		//		feedbackel: reference to the feedback element
		//		data: {} //object for storing custom data of the quiz type
		//	}
		qi = [],
		qilength = 0,
		quiztypes = {
			multi: {
				init: function (qix) {
					var curqi = qi[qix],
						curel = curqi.el,
						allLis = curel.find('ul.quiz-body li'),
						allOptions = allLis.find('input[type="radio"], input[type="checkbox"]');
						correctOptions = allOptions.filter('[data-correct="true"]');
						possibleCorrect = correctOptions.length, 
						multiCorrect = 0,
						submitButton = curel.find('.qz-item-submit');
					randomize(allOptions);
					//requery to get order after randomization
					allLis = curel.find('ul.quiz-body li');
					allLis.each(function () {
						var el = $(this),
							elHtml = el.html(), 
							elInput;
						elInput = el.find('input');
						dataSetter(elInput, ['data-correct']);
						feedbackSetter('.qz-feedback', el, elInput);
						if (elInput.data('correct')) {
							multiCorrect = multiCorrect + 1;
						}
					});
					curqi.correctels = correctOptions;
					curqi.mainels = allOptions;	
					curqi.data.numcorrect = possibleCorrect;
					curqi.data.multicorrect = multiCorrect;
					curqi.triggerel = submitButton;
					submitButton.on('click.multi', '', {self: this, qix: qix}, this.check);
				},
				check: function (e) {
					var	qix = e.data.qix,
						curqi = qi[qix],
						curel = curqi.el,
						sel = curel.find('input:checked'),
						correctNeeded = curqi.data.multicorrect,
						selLength = sel.length,
						correct = false, 
						fbText = '',
						allCorrect = 0;
						if(selLength > 0) {
							if(selLength === 1 && correctNeeded === selLength) {
								correct = sel.data('correct'), 
								fbText = sel.data('feedback');
							} else {
								sel.each(function () {
									var cursel = $(this);
									if(cursel.data('correct')) {
										allCorrect = allCorrect + 1;
									}
									fbText = fbText + cursel.data('feedback') + '<br>';
								});
								if (allCorrect === selLength && selLength === correctNeeded) {
									correct = true;
								}
								fbText = allCorrect + '/' + correctNeeded + ' correct options checked<br>' + fbText;
							}
							qzmanager.showFeedback(curqi.feedbackel, fbText, correct);
							qzmanager.update(qix, correct);
						}
				},
				disable: function (qix) {
					var curqi = qi[qix];
					curqi.triggerel.off('.multi');
					curqi.triggerel.attr('disabled', 'disabled');
					curqi.mainels.each(function () {
						var el = $(this);
						if (el.data('correct')) {
							el.parent().append('<span class="label label-success"><i class="icon-ok icon-white"></i> Correct</span>');
						}
					});
					curqi.mainels.attr('disabled', 'disabled');
					qzmanager.endquiz();
				},
				helper: function (qix) {}
			},
			fillin: {
				init: function (qix) {
					var curqi = qi[qix],
						curel = curqi.el,
						allInputs = curel.find('input');
					allInputs.each(function () {
						var curInput = $(this);
						dataSetter(curInput, ['data-correct']);
						feedbackSetter('.qz-feedback-right, .qz-feedback-wrong', curel, curInput);
					});
					curqi.mainels = allInputs;	
					allInputs.on('change.fillin', '', {self: this, qix:qix}, this.check);
				},
				check: function (e) {
					var	qix = e.data.qix,
						curqi = qi[qix],
						curel = curqi.el,
						sel = $(this),
						strict = sel.data('strict'),
						isItemCorrect = checkAllValues(sel.val(), sel.data('correct'), strict), 
						fbText = isItemCorrect ? sel.data('feedback-right') : sel.data('feedback-wrong');
					qzmanager.showFeedback(curqi.feedbackel, fbText, isItemCorrect);
					qzmanager.update(qix, isItemCorrect);
				},
				disable: function (qix) {
					var curqi = qi[qix];
					curqi.mainels.off('.fillin');
					curqi.mainels.attr('disabled', 'disabled');
					qzmanager.endquiz();
				},
				helper: function (qix) {}
			},
			hotspot: {
				init: function (qix) {
					var curqi = qi[qix],
						curel = curqi.el,
						submitButton = curel.find('.qz-item-submit'),
						hotspot = curel.find('.quiz-hot-spot'),
						hotdrop = curel.find('.quiz-hot-drop'),
						img = curel.find('.quiz-hotspot-backdrop'),
						imgOrigWidth = parseInt(img.data('image-width'), 10),
						imgOrigHeight = parseInt(img.data('image-height'), 10),
						resizeHotSpot = function () {
							var imgWidth = img.width(),
								imgHeight = img.height(),
								heightPercent = imgHeight / imgOrigHeight,
								widthPercent = imgWidth / imgOrigWidth;
							resizeElements(hotspot, widthPercent, heightPercent);
							resizeElements(hotdrop, widthPercent, heightPercent);
						}
						hit = false;						
					resizeHotSpot();
					$(window).smartresize(function () {
						resizeHotSpot();
					});					
					curqi.triggerel = submitButton;
					curqi.mainels = hotspot;
					curqi.correctels = hotdrop;
					hotspot.draggable({containment: 'parent'});
					hotdrop.droppable({containment: 'parent'});
					hotdrop.on('dropover', function(e, ui) {
						hotdrop.data('hit', true);
					});
					hotdrop.on('dropout', function(e, ui) {
						hotdrop.data('hit', false);
					});
					feedbackSetter('.qz-feedback-right, .qz-feedback-wrong', curel);
					submitButton.on('click.hotspot', '', {self: this, qix: qix}, this.check);
				},
				check: function (e, ui) {
					var	qix = e.data.qix,
						curqi = qi[qix],
						curel = curqi.el,
						hitTarget = curqi.correctels.data('hit') || false,
						fbText = hitTarget ? curel.data('feedback-right') : curel.data('feedback-wrong');
					qzmanager.showFeedback(curqi.feedbackel, fbText, hitTarget);
					qzmanager.update(qix, hitTarget);
				},
				disable: function (qix) {
					var curqi = qi[qix];
					curqi.triggerel.off('.hotspot');
					curqi.triggerel.attr('disabled', 'disabled');
					curqi.mainels.draggable('disable');
					curqi.correctels.addClass('quiz-hot-drop-set');
					qzmanager.endquiz();
				},
				helper: function (el) {
					var curel = el,
						submitButton = curel.find('.qz-item-submit'),
						hotdrop = curel.find('.quiz-hot-drop'),
						quizbody = hotdrop.parent();
						showPositionString = function () {
							var hs = hotdrop.position(),
								b = quizbody.position();
							var displayPosition = prompt('Copy this string', 'style="position: relative; width: ' + hotdrop.width() +'px; height: ' + hotdrop.height() +'px; top: ' + Math.floor(hs.top - b.top) +'px; left: ' + Math.floor(hs.left - b.left) +'px;"');
						};
					hotdrop.css({height: '30px'});
					hotdrop.addClass('quiz-hot-drop-set');
					hotdrop.draggable({containment: 'parent'});
					hotdrop.resizable();
					hotdrop.on('resizestart', function () {hotdrop.draggable('option', 'disabled', true);});
					hotdrop.on('resizestop', function () {hotdrop.draggable('option', 'disabled', false);});
					submitButton.on('click', function () {
						showPositionString();
					});
				}
			}
		},
		
		qzmanager = {
			stats: function () {
				var i = 0, correct = 0, completed = 0,
					percentRight = 0, percentTotal = 100;
				for (i = 0; i < qilength; i = i + 1) {
					correct = correct + (qi[i].correct ? 1 : 0);
					if (qi[i].status === 1) {
						completed = completed + 1;
					}
				}
				percentRight = Math.round((correct / qilength) * 100)
				return {
					correct: correct, 
					completed: completed, 
					total: qilength, 
					percentRight: percentRight, 
					percentTotal: percentTotal
				};
			},
			endquiz: function () {
				var tqz = this.stats(),
					statsArea = $('.quiz-stats'),
					percentageRight = tqz.percentRight + '%';
				if (tqz.completed === qilength && statsArea.length > 0) {
					statsArea.slideDown();
					$('.progress .bar').css('width', percentageRight);
					$('#quiz-percent').html(percentageRight);
					$('#quiz-possible').html(tqz.total);
					$('#quiz-score').html(tqz.correct);
				}
			},
			update: function (qix, isItemCorrect) {
				var curqi = qi[qix];
					qiStatus = function (val) {
						if (val >= 0) {
							curqi.status = val;
						}
						return curqi.status;
					},
					qiAttempts = function (val) {
						qiAttemptVal = curqi.attempts;
						if (val) {
							curqi.attempts = qiAttemptVal + val;
						}					
						return curqi.attempts;
					},
					qiIsCorrect = function (val) {
						if (val) {
							curqi.correct = val;
						}
						return curqi.correct;
					},
					hitLimit = function () {
						var	limits = curqi.attempts === curqi.tries || curqi.correct ? true : false;
						return limits;
					};
				if (isItemCorrect) {
					qiIsCorrect(true);
				}
				qiAttempts(1);
				if (hitLimit() || isItemCorrect) {
					qiStatus(1);
					quiztypes[curqi.quiztype].disable(qix);
				} else {
					qiStatus(0);
				}			
			},
			showFeedback: function (fb, fbText, right) {
				var initialValue = fb.hasClass('alert-info');
				fb.html(fbText);
				if (right) {
					fb.switchClass(initialValue ? 'alert-info' : 'alert-error', 'alert-success');
				} else {
					fb.switchClass(initialValue ? 'alert-info' : 'alert-success', 'alert-error');
				}
			}
		};
	

			
	//plugin function
	$.fn.dlquiz = function () {
		var	quizArea = $(this), 
			quizItems = $('.quiz-items > div'), 
			writerMode = quizArea.data('writer-mode'),
			rand = quizArea.data('random');
		//if out of writer mode then run the functions to set up the quiz
		if (!writerMode) {
			if (rand) {
				randomize(quizItems);
			}
			//requery to establish new order of the elements
			quizItems = $('.quiz-items > div');
			quizItemLength = quizItems.length;
			quizItems.each(function (ix) {
				var curqi = $(this);
					quizStatement = curqi.find('.quiz-item-statement'); 
				qi.push({
					el: curqi,
					ix: ix,
					quiztype: curqi.data('quiz-type'),
					attempts: 0,
					tries: curqi.data('quiz-tries'),
					status: -1,
					correct: false,
					feedbackel: curqi.find('.qz-feedback-area'),
					data: {}
				});
				qilength = qilength + 1;
				curqi.data('ix', ix);
				quizStatement.html((ix + 1) + '. ' + quizStatement.html());
				//if the quiztypes object has a matching quiztype, execute the init command
				if (quiztypes[qi[ix].quiztype]) {
					quiztypes[qi[ix].quiztype].init(ix);
				}
			});
		} else {
			quizItems.each(function (ix) {
				var curel = $(this);
				if (quiztypes[curel.data('quiz-type')]) {
					quiztypes[curel.data('quiz-type')].helper(curel);
				}
			});
		}
		quizArea.css('visibility', 'visible');
			return {
				stats: qzmanager.stats,
				qi: qi
			}
	};
	$.fn.dlquiz.version = "0.2";
}) (jQuery);
var qz = $('.quiz-area').dlquiz();
