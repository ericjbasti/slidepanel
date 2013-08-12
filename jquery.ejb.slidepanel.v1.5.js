
//*******************************************************************************************************
//
//  v1.5
//  added horizontal/vertical scrolling possiblities.
//	added scrollwheel controls of slides.
//	cleaned up code a little... more to come.
//	added the ability to reset the slidepanel. for use with resizing slide panels.
//	got smart about the timer... no longer adds it to the DOM.
//
//
//*******************************************************************************************************

(function($){
	$.fn.slidepanel = function(options) {
		var defaults = {
			pause: 5,
			start: 0,
			autoPlay:true,
			loop:true,
			height:null,
			playBtn:null,
			pauseBtn:null,
			nextBtn:null,
			prevBtn:null,
			slideButtons:null,
			slideButtonsAutoCreate:true, //if this is set to false, you should include a class for slideButtonsClass
			slideButtonsClass:"button",
			slideButtonsSelectedClass:"selected",
			endOfLoopClass:"endOfLoop",
			grouped:true, // this only applies to slide transitioned slidepanels, works with regular or irregular sizes.
			trans:'fade',
			orientation:'horizontal', // or vertical
			transSpeed:500,
			perfectFit:true,
			buildList:new Object({}),
			scroll:true,
			externalAction:function(){}
		};
		
		var options = $.extend(defaults, options);
	
		return this.each(function() {
			var parent=this;
			var current=options.start;
			var prev=null;
			var playStatus=true;
			var slideButtons=null;
			var obj=null;
			
			var timer=document.createElement('div'); // Creates a empty DOM element used simply for transitions...
			
			
			//  DEFAULT BUTTONS (optional) **************************************************************
			//
			//	These buttons are not required for the slidepanel to function, as it turns out you never
			//  are required to use these, they do however receive some extra functionality you would
			//  not receive otherwise. example: the next and previous buttons will fade dependins on 
			//  the avalibily of the next or previous slides (you never see this if the slidepanel is set
			//  to loop).
			//
			//  *****************************************************************************************
			
			
			function setupControls(){
				if (options.playBtn){
					$(options.playBtn).click(function(){
						slidePlay(true);
					});
				}
				if (options.pauseBtn){
					$(options.pauseBtn).click(function(){
						slidePlay(false);
					});
				}
				if (options.nextBtn){
					$(options.nextBtn).click(function(){
						slideNext();
					});
				}
				if (options.prevBtn){
					$(options.prevBtn).click(function(){
						slidePrev();
					});
				}
				if (options.slideButtons){
					for (i=0;i!=obj.length;i++){
						var element =$('<div/>',{addClass:options.slideButtonsClass});
						$(element).data('slideIndex',i);
						$(options.slideButtons).append($(element));
					}
					slideButtons=$('.'+options.slideButtonsClass);
					$(slideButtons).click(function(){
						if ($(this).data('slideIndex')!=current){
							current=$(this).data('slideIndex');
							$(timer).stop(true);
							loadSlide(current);
						}
					});
				}
				
				if (!options.slideButtonsAutoCreate){
					slideButtons=$('.'+options.slideButtonsClass);
				}
			
			}
			
			function loopStatus(cur){
				if (cur<=0) {
					$(options.prevBtn).addClass(options.endOfLoopClass);
				}else{
					$(options.prevBtn).removeClass(options.endOfLoopClass);
				}
				if (cur>=obj.length-1) {
					$(options.nextBtn).addClass(options.endOfLoopClass);
				}else{
					$(options.nextBtn).removeClass(options.endOfLoopClass);
				}
			}
			
			//  SETUP SLIDEPANEL *************************************************************************
			//
			//  Since the 2 transition types supported require very different DOM settings, this code will 
			//  run though and set them up accordingly.
			//
			// *******************************************************************************************
			

			
			function init(child){
				var temp=$(parent).children(child); // use children so a slidepanel of slidepanels can be made

				if (options.trans.toLowerCase()=='fade'){
					$(temp).css({
						'display':'none','position':'absolute'
					});
					obj=temp;
				}else{
					if (options.orientation.toLowerCase()=='horizontal'){
						$(temp).css({
							'float':'left'
						});
					}
					var element = document.createElement("div");
					$(parent).css({'overflow':'hidden'});
					$(element).css('width',500000);
					$(temp).wrapAll($(element));
					setup();
					
				}
			}
			
			
			function setup(){
				var temp=$(parent).find('div:first').find('li');
					var panelWidth=$(parent).width();
					var panelHeight=$(parent).height();
					var widthIndex=0;
					var heightIndex=0;
					var distanceTillNextSlide=0;
					$(temp).removeClass('slidePanelMarker');
					$(temp).each(function(){
						$(this).data('position',{left:widthIndex,top:heightIndex});
						var oldWidth=widthIndex;
						var oldHeight=heightIndex;
						widthIndex=parseInt($(this).outerWidth(true)+widthIndex);
						heightIndex=parseInt($(this).outerHeight(true)+heightIndex);
						
						if (options.grouped){
							switch (options.orientation.toLowerCase()){
								case 'horizontal':
								if (widthIndex>distanceTillNextSlide) {
									$(this).addClass('slidePanelMarker');
									distanceTillNextSlide=oldWidth+panelWidth;
								};
								break;
								case 'vertical':
								if (heightIndex>distanceTillNextSlide) {
									$(this).addClass('slidePanelMarker');
									distanceTillNextSlide=oldHeight+panelHeight;
								}
								break;
							}
						}
					});
					var myLeft=$(temp[temp.length-1]).data('position').left;
					var myTop=$(temp[temp.length-1]).data('position').top;
					
					if (options.perfectFit){
						myLeft=($(temp[temp.length-1]).data('position').left+$(temp[temp.length-1]).outerWidth(true))-panelWidth;
						myTop=($(temp[temp.length-1]).data('position').top+$(temp[temp.length-1]).outerHeight(true))-panelHeight;
					}
				
					if (options.grouped){
						$(temp[0]).addClass('slidePanelMarker');
						
					}else{
						for (i=0;i!=temp.length-1;i++){
							var deLeft=($(temp[i]).data('position').left);
							var deTop=($(temp[i]).data('position').top);
							$(temp[i]).addClass('slidePanelMarker');
							if(deLeft>myLeft) break;
							if(deTop>myTop) break;
						}
					}
				
					temp=$(parent).find('.slidePanelMarker');
					$(temp[temp.length-1]).data('position').left=myLeft;
					$(temp[temp.length-1]).data('position').top=myTop;
								
				obj=$(parent).find('.slidePanelMarker');
			}
			
			if (options.buildList.url){
				getData(options.buildList);
			}else{
				init('li');
				setupControls();
				loadSlide(current);
				loopStatus(-1);
			}
			
			//  TRANSITIONS ********************************************************************************
			//
			//  
			//
			//  ********************************************************************************************
			
			
			function animateOut(who){
				switch(options.trans.toLowerCase()){
					case 'fade':$(who).fadeOut(options.transSpeed);break;
					case 'slide':break;
				}
			}
			
			function animateIn(who){
				switch(options.trans.toLowerCase()){
				case 'fade':$(who).fadeIn(options.transSpeed);break;
				case 'slide':
					if(options.orientation.toLowerCase()=='horizontal'){
						$(who).parent().animate({marginLeft:-$(who).data('position').left},options.transSpeed);
						break;
					}else{
						if(-$(who).data('position').top>0){
						}else{
							$(who).parent().animate({marginTop:-$(who).data('position').top},options.transSpeed);
						}
						break;
					}
				}
			}
			
			
			//  SLIDE FUNCTIONS ***************************************************************************
			//
			//  these functions are used to manipulate the slide show
			//
			//  *******************************************************************************************
			
			
			function reset(){
				var temp=$(parent).find('div:first').find('li');
				$(temp).removeClass('slidePanelMarker');
				
				setup();
				
			}
			
			
			function slidePlay(status){
				if(status){
					$(timer).stop(true);
					options.autoPlay=true;
					$(timer).fadeTo(options.transSpeed,100,function (){
						current++;
						if (current>=obj.length){
							current=(options.loop)?0:obj.length-1;
							loadSlide(current);
						}else{
							loadSlide(current);
						}
					});
				}else{
					options.autoPlay=false;
					$(timer).stop(true);
				}
			}
			
			
			function slidePrev(){
				current--;
				$(timer).stop(true);
				if (current<0) {
					current=(options.loop)?obj.length-1:0;
					if (options.loop) loadSlide(current);
				}else{
					loadSlide(current);
				}
			}
			
			function slideNext(){
				current++;
				$(timer).stop(true);
				if (current>obj.length-1) {
					current=(options.loop)?0:obj.length-1;
					if (options.loop) loadSlide(current);
				}else{
					loadSlide(current);
				}
			}
			
			function loadSlide(which){
				if(which>obj.length-1) which=current=obj.length-1;
				if(which<0) which=current=0;
				
				if (!options.loop) loopStatus(which);
				if (slideButtons){
					$(slideButtons).removeClass(options.slideButtonsSelectedClass);
					$(slideButtons[which]).addClass(options.slideButtonsSelectedClass);
				}
				animateOut(obj);
				animateIn(obj[which]);
				try {
					options.externalAction();
				}
				catch(err){
					alert(err);
				};
				
				if (options.autoPlay){
					$(timer).fadeTo(options.pause*1000,100,function (){
						current++;
						if (current>=obj.length){
							current=(options.loop)?0:obj.length-1;
							loadSlide(current);
						}else{
							loadSlide(current);
						}
					});
				}
			}
			
			
			
			
			//  BINDING EVENTS TO THE SLIDESHOW  **********************************************************
			//
			//  these can be referenced from outside, makikng it really easy to create a custom interface
			//  that can reference the slideshow.
			//
			//*********************************************************************************************
			//
			// #who = the slide show to be effected by the calls.
			// number = the slide index to load.
			//
			
			// CALL: $('#who').trigger('loadSlide', number);
			
			$(this).bind('loadSlide',function(event,slideNumber){
				current=slideNumber;
				loadSlide(slideNumber);
			});
			
			// CALL: $('#who').trigger('slideNext');
			
			$(this).bind('slideNext',function(event){
				slideNext();
			});
			
			// CALL: $('#who').trigger('slidePrev');
			
			$(this).bind('slidePrev',function(event){
				slidePrev();
			});
			
			// CALL: $('#who').trigger('slidePrev');
			
			$(this).bind('slidePlay',function(event,status){
				slidePlay(status);
			});
			
			$(this).bind('changeSetting',function(event,obj){
				options[obj.setting]=obj.value;
			});
			
			$(this).bind('reset',function(event){
				reset();
			});
			
			// XML loading
			
			
			function getData(params){
				$.ajax({
					type: params.type,
					url: params.url,
					data: params.data,
		            dataType: params.dataType,
					error: function(e){alert(e);},
					success: function(w){
						params.callback(w),obj=setup('li');
							loadSlide(current);
							}
				})
			}
			
			
			function setEvents(){
				if(options.scroll && this.addEventListener){
					parent.addEventListener('DOMMouseScroll', wheel, false);
					parent.addEventListener('mousewheel', wheel, false );
				}
				else if(options.scroll){parent.onmousewheel = wheel;}
			};
			
			function wheel(e){
	            e = $.event.fix(e || window.event);
	            var delta = e.wheelDelta ? e.wheelDelta/120 : -e.detail/3;
				if(delta>0){
					slidePrev();
				}else{
					slideNext();
				}
				e.preventDefault();
	        };
			
			setEvents();
			
		});
	}
	
})(jQuery);


