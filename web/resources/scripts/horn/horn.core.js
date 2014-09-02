/*
 * Licensed to the Apache Software Foundation (ASF) under one or more
 * contributor license agreements.  See the NOTICE file distributed with
 * this work for additional information regarding copyright ownership.
 * The ASF licenses this file to You under the Apache License, Version 2.0
 * (the "License"); you may not use this file except in compliance with
 * the License.  You may obtain a copy of the License at
 * 
 *      http://www.apache.org/licenses/LICENSE-2.0
 * 
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */
(function($) {
	_horn_public = {
		_current : null,
		readyFun : new Array(),
		registerFun : new Array(),
		register : function(fun) {
			_horn_public.registerFun.push(fun);
		},
		ready : function(fun) {
			_horn_public.readyFun.push(fun);
		},
		init : function() {
			for ( var i = 0; i < _horn_public.registerFun.length; i++) {
				_horn_public.registerFun[i]();
			}
			while (_horn_public.readyFun.length > 0) {
				var fun = _horn_public.readyFun.shift();
				fun();
			}
			var form = _horn_public.getCurrent().find("form");
			form.submit(function(e) {
				var data = $(this).data("click.submit");
				if (data) {
					for ( var i = 0; i < data.length; i++) {
						if (data[i]() === false) {
							return false;
						}
					}
				}
			});
		},
		getCurrent : function() {
			if (_horn_public._current == null) {
				if ($("div.h_tab-screen").children("ul").children("li").size() > 0) {
					_horn_public._current = $("div.h_tab-screen")
							.nextAll("div").first();
				} else {
					_horn_public._current = $("div.h_screen");
				}
			}
			return _horn_public._current;
		},
		submitHandler : function(fn) {
			var form = _horn_public.getCurrent().find("form");
			var data = form.data("click.submit");
			if (!data) {
				$(form).data("click.submit", [ fn ]);
			} else {
				data.unshift(fn);
			}
		},
		render : function(pageletId, html) {
			if (html.indexOf("Redirect:") > -1) {
				window.location = html.substr(9);
			} else {
				$("#" + pageletId).append(html);
			}
		}
	};

	_horn_tab_screen = {
		callbackFun : new Array(),
		callback : function(fun) {
			_horn_tab_screen.callbackFun.push(fun);
		},
		render : function(obj, html) {
			var ref = obj.attr("ref_target");
			obj.children().remove();
			var node = $(eval("\"" + html + "\""));
			obj.append(node);
			_horn_public._current = obj;
			var title = obj.children("div").children("h1").children("span")
					.html();
			_horn_public.init();
			_horn_tab_screen.submit(obj);
			$("div.h_tab-screen").children("ul").children(
					"li[ref=\"" + ref + "\"]").children("a").children("b")
					.text(title);
			_horn_tab_screen.click(ref);
		},
		redirect : function(obj, url) {
			url = url.indexOf('?') === -1 ? url + '?_2T_=W' : url + '&_2T_=W';
			$.get(url, function(result) {
				$("div.h_tab-screen").children("ul").children("li.h_cur").attr(
						"url", url);
				_horn_tab_screen.render(obj, result);
			});
		},
		submit : function(obj) {
			var form = obj.find("form");
			if (form.length > 0) {
				var data = form.data("click.submit");
				if (!data) {
					form.data("click.submit", []);
				}
				form.data("click.submit").push(function() {
					var action = form.attr("action");
					var datas = form.serializeArray();
					datas.push({
						"name" : "_2T_",
						"value" : "W"
					});
					$.post(action, datas, function(result) {
						if (result.indexOf('Redirect:') > -1) {
							_horn_tab_screen.redirect(obj, result.substr(9));
						} else {
							_horn_tab_screen.render(obj, result);
						}
					});
					return false;
				});
			}
		},
		create : function(params) {
			var screen = $("div.h_screen");
			var ul = screen.children("div.h_tab-screen").children("ul");
			var c_title = ul.children("li[url='" + params.url + "']");
			if (!c_title[0]) {
				var ref = "h_tab-screen-" + new Date().getTime();
				var h_tab_screen = $("div.h_tab-screen");
				h_tab_screen.children("ul").prepend(
						"<li ref=\"" + ref + "\" url=\"" + params.url
								+ "\"><a href=\"#\"><b>" + params.title
								+ "</b><span>X</span></a></li>").children("li")
						.first().bind({
							click : function() {
								_horn_tab_screen.click(ref);
							}
						}).children("a").children("span").bind({
							click : function() {
								_horn_tab_screen.close(ref);
							}
						});
				var targetNode = $("<div ref_target=\"" + ref + "\"></div>");
				screen.append(targetNode);
				$.get(params.url, function(result) {
					_horn_tab_screen.render(targetNode, result);
				});
				return false;
			} else {
				_horn_tab_screen.click(c_title.attr("ref"));
			}
		},
		click : function(ref) {
			var ul = $("div.h_tab-screen").children("ul");
			ul.children("li").removeClass("h_cur");
			ul.children("li[ref=\"" + ref + "\"]").addClass("h_cur");
			var screen = $("div.h_screen");
			screen.children("div[ref_target]").hide();
			_horn_public._current = screen.children(
					"div[ref_target=\"" + ref + "\"]").show();
			for ( var i = 0; i < _horn_tab_screen.callbackFun.length; i++) {
				_horn_tab_screen.callbackFun[i]();
			}
		},
		close : function(ref) {
			var ul = $("div.h_tab-screen").children("ul");
			var title = ul.children("li[ref=\"" + ref + "\"]");
			$("div.h_screen").children("div[ref_target=\"" + ref + "\"]")
					.remove();
			title.remove();
			_horn_tab_screen.click(ul.children("li").first().attr("ref"));
		}
	};
	$.extend({
		horn : {
			newTabScreen : function(params) {
				var li = $("div.h_tab-screen").children("ul").children("li");
				if (li.length > 3) {
					alert("打开网页已达上限");
					return;
				}
				_horn_tab_screen.create(params);
			},
			tabClickCallback : function(fun) {
				_horn_tab_screen.callback(fun);
			},
			getCurrentScreen : function() {
				return _horn_public.getCurrent();
			},
			ready : function(fun) {
				_horn_public.ready(fun);
			},
			submitHandler : function(fun) {
				_horn_public.submitHandler(fun);
			},
			renderHtml : function(pageletId, html) {
				_horn_public.render(pageletId, html);
			}
		}
	});
	$(document).ready(function() {
		_horn_public.init();
	});
})(jQuery);
