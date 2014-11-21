// Apprise 1.5 by Daniel Raftery
// http://thrivingkings.com/apprise
// http://thrivingkings.com/read/Apprise-The-attractive-alert-alternative-for-jQuery
// Button text added by Adam Bezulski
// Cached jQuery variables, position center added by Josiah Ruddell
function apprise(e,t,n){var r;var i=function(){r=document.activeElement;if(t&&t["input"]){$(".aTextbox").focus()}else{h.find("button").first().focus()}};var s={confirm:false,verify:false,input:false,animate:false,textOk:"Ok",textCancel:"Cancel",textYes:"Yes",textNo:"No",position:"center"};if(t){for(var o in s){if(typeof t[o]=="undefined")t[o]=s[o]}}var u=$(window).height(),a=$(window).width(),f=$('<div class="appriseOuter"></div>'),l=$('<div class="appriseOverlay" id="aOverlay"></div>'),c=$('<div class="appriseInner"></div>'),h=$('<div class="aButtons"></div>'),p=100;l.css({height:u,width:a}).appendTo("body").fadeIn(100,function(){$(this).css("filter","alpha(opacity=70)")});f.appendTo("body");c.append(e).appendTo(f);if(t){if(t["input"]){if(typeof t["input"]=="string"){c.append('<div class="aInput"><input type="text" class="aTextbox" t="aTextbox" value="'+t["input"]+'" /></div>')}if(typeof t["input"]=="object"){c.append($('<div class="aInput"></div>').append(t["input"]))}else{c.append('<div class="aInput"><input type="text" class="aTextbox" t="aTextbox" /></div>')}}}c.append(h);if(t){if(t["confirm"]||t["input"]){h.append('<button value="ok">'+t["textOk"]+"</button>");h.append('<button value="cancel">'+t["textCancel"]+"</button>")}else if(t["verify"]){h.append('<button value="ok">'+t["textYes"]+"</button>");h.append('<button value="cancel">'+t["textNo"]+"</button>")}else{h.append('<button value="ok">'+t["textOk"]+"</button>")}}else{h.append('<button value="ok">Ok</button>')}f.css("left",($(window).width()-$(".appriseOuter").width())/2+$(window).scrollLeft()+"px");if(t){if(t["position"]&&t["position"]==="center"){p=(u-f.height())/2}if(t["animate"]){var d=t["animate"];if(isNaN(d)){d=400}f.css("top","-200px").show().animate({top:p},d,function(){i()})}else{f.css("top",p).fadeIn(200,function(){i()})}}else{f.css("top",p).fadeIn(200,function(){i()})}$(document).keydown(function(e){if(l.is(":visible")){if(e.keyCode==13){$('.aButtons > button[value="ok"]').click()}if(e.keyCode==27){$('.aButtons > button[value="cancel"]').click()}}});var v=$(".aTextbox").val();if(!v){v=false}$(".aTextbox").keyup(function(){v=$(this).val()});$(".aButtons > button").click(function(){l.remove();f.remove();$(r).focus();if(n){$(this).text("");var e=$(this).attr("value");if(e=="ok"){if(t){if(t["input"]){n(v)}else{n(true)}}else{n(true)}}else if(e=="cancel"){n(false)}}})}