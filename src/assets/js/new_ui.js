$(function () {
	// graph image change
	if ( $('.compareRate').get(0) !== undefined)  {
		$('.btnListCR li a').on('click', function() {
			var $thisImg = $('.areaGraph img');
			var liAll = $('.btnListCR li');
			var $thisIndex = $(this).closest('li').index();
			var activeClass = 'active';
			liAll.removeClass(activeClass);
			liAll.eq($thisIndex).addClass(activeClass);
			$thisImg.removeClass(activeClass);
			$thisImg.eq($thisIndex - 1).addClass(activeClass);
		})
	}

	// scroll tab box shadow
	if ( $('.includeTab').get(0) !== undefined)  {
		$(window).on('scroll',function () {
			if ($(document).scrollTop() > 0) {
				$('.includeTab > div').addClass('scrollActive');
			} else {
				$('.includeTab > div').removeClass('scrollActive');
			}
		});
	}

	// scroll tab last menu position: tabTy5
	if ( $('.tabTy5').get(0) !== undefined)  {
		if ($('.tabTy5').hasClass('lastMenu')) {
			var bWidth = $('body').outerWidth();
			$('.wrapTabTy5').scrollLeft(bWidth);
		}
	}

	var offsets = new Array();
	var chk = true;
	const el = document.querySelectorAll('.toggleList > li');
	var $thisIndex = 0;
	var _thisOffset = null;

	// toggleList: content visible/hidden
	if ( $('.toggleList').get(0) !== undefined)  {
			$('.toggleList li').each(function(){
				if ($(this).hasClass('active')){
					$(this).find('.toggleBox').slideDown(100);
				}
			});
			
			$('.toggleList li > a').on('click',function() {
				if (chk){
					el.forEach((el, index) => {
						el.setAttribute('data-index',index);
						_thisOffset = window.pageYOffset + el.getBoundingClientRect().top;  // offsetTop 절대값
						offsets.push( Math.floor(_thisOffset));
						console.log(offsets);
					});
					chk = false;
				}
				$thisIndex = this.parentNode.getAttribute('data-index');
				var $this = $(this);
				var $thisLi = $this.closest('li');
				var $thisUl = $this.closest('Ul');
				
				var activeClass = 'active';
				var beforeThis = '';
				
				
				$("html, body").animate({scrollTop:offsets[$thisIndex]}, 300);
			

			if (!$thisLi.hasClass(activeClass) ) {

				$('.toggleList li').removeClass('active').find('.toggleBox').slideUp(100);
				if ($thisUl.hasClass('toggleAccordion')) {
					if ( beforeThis !== '') {
						$(beforeThis).removeClass(activeClass).find('.toggleBox').slideUp(100);
					}
					if ( $('.wrapTy5').hasClass('includeTab') && $('.toggleList').length === 1) {
						
					} else if ( $('.toggleList').length === 1) {
						// $("html, body").animate({scrollTop:offsets[$thisIndex]}, 300);
					}
				}
				$thisLi.toggleClass(activeClass).find('.toggleBox').slideToggle(100);
				beforeThis = $thisLi;
				return beforeThis;
			} else {
				$thisLi.removeClass(activeClass).find('.toggleBox').slideUp(100);
			}
		});
	}

	// slide: guide
	if ($('.importantGuide').get(0) !== undefined) {
		var isArrows = true;
		var isDots = true;
		if (!$('.importantGuide').hasClass('ty2')) {
			isArrows = false;
		} else {
			isDots = false;
		}
		$('.importantGuide').slick(
			{
				arrows:isArrows,
				dots: isDots,
				infinite: false
			}
		);
	}

});