/*!
ARIA Menubar Module for jQuery
Built by Bryan Garaventa, distributed under the OSI-MIT License.

Implementation details: The ARIA Menubar Module specifically follows the ARIA 1.1 specification using 'roving tabindex' to properly manage focus, as documented at:
http://whatsock.com/training/matrices/#menubar
Which also includes submenu constructs, as documented at
http://whatsock.com/training/matrices/#menu

(Tested and confirmed to be accessible using JAWS in IE and Firefox, NVDA in IE and Firefox, and VoiceOver in Safari on iOS.)

*/

(function($){

	// Public function for configuring and setting up Menubar constructs on the page
	window.ARIAMenuBar = function(config){
		config = config || {};
		var cmbc = this,

		// Generic CSS selector that identifies the top level Menubar structure on each page.
		topMenuBarSelector = config.topMenuBarSelector || 'ul[role="menubar"]',

		// Class name that toggles display:none for hiding and unhiding dynamically rendered submenus
		hiddenClass = config.hiddenClass || 'hidden',

		// Click handler that executes whenever an A tag that includes role="menuitem" is clicked
		handleMenuItemClick = function(ev){
			if (typeof config.handleMenuItemClick === 'function'){
				config.handleMenuItemClick.apply(this, [ev]);
			}

			else{
				top.location.href = this.href;
			}
		},

		// Handle opening of dynamic submenus
		openMenu = function(subMenu, menuContainer){
			$(menuContainer).data('open', subMenu);
			$(subMenu).data('index', 0);

			if (typeof config.openMenu === 'function'){
				config.openMenu.apply(this,
								[
								subMenu,
								menuContainer
								]);
			}

			else{
				$(subMenu).removeClass(hiddenClass);

				if (cmbc.cb && typeof cmbc.cb === 'function'){
					cmbc.cb();
					cmbc.cb = null;
				}
			}
		},

		// Handle closing of dynamic submenus
		closeMenu = function(subMenu, closeAll, menuBar){
			if ((!subMenu && !closeAll) || (!menuBar && closeAll))
				return;
			var menuBar = menuBar || $(subMenu).data('menuBar');

			if (closeAll){
				var subMenus = $(menuBar).data('subMenus');

				for (var i = 0; i < subMenus.length; i++){
					closeMenu.apply(this,
									[
									subMenus[i],
									false,
									menuBar
									]);
				}
			}

			else{
				var triggeringMenuItem = $(subMenu).data('triggeringMenuItem'),
					parentMenuContainer = $(triggeringMenuItem).data('menuContainer');
				$(parentMenuContainer).data('open', null);
				$($(parentMenuContainer).data('menuItems')[$(parentMenuContainer).data('index')]).attr('tabindex', 0);

				if (subMenu != menuBar){
					$(subMenu).data('index', 0);

					if (typeof config.closeMenu === 'function'){
						config.closeMenu.apply(this, [subMenu]);
					}

					else{
						$(subMenu).addClass(hiddenClass);
					}
				}

				$($(subMenu).data('menuItems')).attr('tabindex', -1);
			}
		},

		// Accessible offscreen text to specify necessary keyboard directives for non-sighted users.
		// (The below wording is important, so don't change this unless absolutely necessary)
		dualHorizontalTxt = config.dualHorizontalTxt || 'Press Enter to navigate to page, or Down to open dropdown',
			dualVerticalTxt = config.dualVerticalTxt || 'Press Enter to navigate to page, or Right to open dropdown',
			horizontalTxt = config.horizontalTxt || 'Press Down to open dropdown',
			verticalTxt = config.verticalTxt || 'Press Right to open dropdown',

		// Recursively setup each Menubar on the page
		setupMenubar = function(tmbSelector){
			$(tmbSelector).each(function(i, menuBar){
				$(menuBar).data('subMenus', []);
				setupMenuItems(menuBar, menuBar, true);
				$($(menuBar).data('menuItems')[0]).attr('tabindex', 0);
				$(menuBar).bind(
								{
								mouseleave: function(ev){
									closeMenu.apply(this,
													[
													null,
													true,
													menuBar
													]);

									ev.stopPropagation();
								}
								});
			});
		},

// Recursively setup each A tag that includes role="menuitem" within individual role="menubar" and role="menu" UL tags.
		setupMenuItems = function(menuContainer, menuBar, isTopLvl){
			var isHorizontal = -1, menuId = null, menuItems = [];

			if ($(menuContainer).attr('role') == 'menubar')
				isHorizontal = $(menuContainer).hasClass('vertical') ? false : true;

			else if ($(menuContainer).attr('role') == 'menu')
				isHorizontal = $(menuContainer).hasClass('horizontal') ? true : false;
			menuId = $(menuContainer).attr('id');

			if (isHorizontal === -1){
				alert(
					'Syntax error: menuContainer must include either role=menubar for the top level container, or role=menu for submenu structures.');
				return;
			}

			else if (!menuId){
				alert(
					'Syntax error: All instances of menuContainer including role=menubar for the top level container, or role=menu for submenu structures, must include a unique ID.');
				return;
			}

			//$(menuContainer).attr('aria-orientation', isHorizontal ? 'horizontal' : 'vertical');

			$('#' + menuId + ' > li > a[role="menuitem"]').each(function(j, menuItem){
				$(menuItem).data('menuContainer', $(menuContainer)[0]).data('isHorizontal', isHorizontal).data('menuBar',
					$(menuBar)[0]).attr('tabindex', -1);
				var subMenuId = $(menuItem).attr('data-submenu-id') || null;

				if (subMenuId){
					var subMenu = $('#' + subMenuId)[0] || null;

					if (!subMenu){
						alert('Syntax error: data-submenu-id must reference a valid role=menu container.');
						return;
					}
					$(menuItem).attr('aria-haspopup', 'true');
					$(menuBar).data('subMenus').push($(subMenu)[0]);
					$(menuItem).data('subMenu', $(subMenu)[0]).data('navigatesAway',
						$(menuItem).hasClass('navigates-away') ? true : false);

					if (!('ontouchstart' in window || navigator.maxTouchPoints > 0 || navigator.msMaxTouchPoints > 0)){
						if ($(menuItem).data('navigatesAway')){
							if (isHorizontal)
								$('<span>').css(offscreenCSS).appendTo(menuItem).text(dualHorizontalTxt);

							else
								$('<span>').css(offscreenCSS).appendTo(menuItem).text(dualVerticalTxt);
						}

						else{
							if (isHorizontal)
								$('<span>').css(offscreenCSS).appendTo(menuItem).text(horizontalTxt);

							else
								$('<span>').css(offscreenCSS).appendTo(menuItem).text(verticalTxt);
						}
					}
					$(subMenu).data('triggeringMenuItem', $(menuItem)[0]).data('menuBar', $(menuBar)[0]);
					$(subMenu).bind(
									{
									mouseleave: function(ev){
										var open = $(this).data('open');

										if (!open)
											closeMenu.apply(this, [this]);

										ev.stopPropagation();
									}
									});
					setupMenuItems($(subMenu)[0], $(menuBar)[0]);
				}
				menuItems.push($(menuItem)[0]);
			});

			bindEvents(menuItems, isTopLvl);
			$(menuContainer).data('menuItems', menuItems).data('index', 0);
		},

		// Setup event bindings for every A tag that includes role="menuitem"
		bindEvents = function(menuItems, isTopLvl){
			if (!menuItems.length)
				return;

			$(menuItems).each(function(i, mI){

				$(mI).bind(
								{
								keydown: function(ev){
									var k = ev.which || ev.keyCode;

									if ((k >= 37 && k <= 40) || k == 13 || k == 32 || k == 27 || k == 9){
										var isHorizontal = $(this).data('isHorizontal'), navigatesAway = $(this).data('navigatesAway'),
											subMenu = $(this).data('subMenu'), menuContainer = $(this).data('menuContainer'),
											index = $(menuContainer).data('index'), menuItems = $(menuContainer).data('menuItems'),
											triggeringMenuItem = $(menuContainer).data('triggeringMenuItem'),
											parentMenuContainer = $(triggeringMenuItem).data('menuContainer'), menuBar = $(this).data('menuBar');

										if (k == 37){
											if (isHorizontal){
												if (!index)
													index = menuItems.length - 1;

												else
													index--;
												$(menuContainer).data('index', index);
												setFocus($(menuItems)[index], menuItems);
											}

											else{
												closeMenu.apply(this, [menuContainer]);

												if (parentMenuContainer && parentMenuContainer != menuBar && triggeringMenuItem){
													setFocus($(parentMenuContainer).data('menuItems')[$(parentMenuContainer).data('index')],
														$(parentMenuContainer).data('menuItems'), menuItems);
												}

												else if (parentMenuContainer && parentMenuContainer == menuBar && triggeringMenuItem){
													index = $(menuBar).data('index');
													menuItems = $(menuBar).data('menuItems');

													if (!index)
														index = menuItems.length - 1;

													else
														index--;
													$(menuBar).data('index', index);
													setFocus($(menuItems)[index], menuItems);
												}
											}
											ev.preventDefault();
										}

										else if (k == 38){
											if (!isHorizontal){
												if (!index)
													index = menuItems.length - 1;

												else
													index--;
												$(menuContainer).data('index', index);
												setFocus($(menuItems)[index], menuItems);
											}

											else{
												closeMenu.apply(this, [menuContainer]);
											}
											ev.preventDefault();
										}

										else if (k == 39){
											if (isHorizontal){
												if (index >= menuItems.length - 1)
													index = 0;

												else
													index++;
												$(menuContainer).data('index', index);
												setFocus($(menuItems)[index], menuItems);
											}

											else{
												if (subMenu){
													cmbc.cb = function(){
														setFocus($($(cmbc.cb.subMenu).data('menuItems'))[0], $(cmbc.cb.subMenu).data('menuItems'),
															cmbc.cb.menuItems);
													};
													cmbc.cb.subMenu = subMenu;
													cmbc.cb.menuItems = menuItems;
													openMenu.apply(this,
																	[
																	subMenu,
																	menuContainer
																	]);
												}

												else{
													closeMenu.apply(this,
																	[
																	menuContainer,
																	true
																	]);

													index = $(menuBar).data('index');
													menuItems = $(menuBar).data('menuItems');

													if (index >= menuItems.length - 1)
														index = 0;

													else
														index++;
													$(menuBar).data('index', index);
													setFocus($(menuItems)[index], menuItems);
												}
											}
											ev.preventDefault();
										}

										else if (k == 40){
											if (!isHorizontal){
												if (index >= menuItems.length - 1)
													index = 0;

												else
													index++;
												$(menuContainer).data('index', index);
												$($(menuItems)[index]).focus();
											}

											else{
												if (subMenu){
													cmbc.cb = function(){
														setFocus($($(cmbc.cb.subMenu).data('menuItems'))[0], $(cmbc.cb.subMenu).data('menuItems'),
															cmbc.cb.menuItems);
													};
													cmbc.cb.subMenu = subMenu;
													cmbc.cb.menuItems = menuItems;
													openMenu.apply(this,
																	[
																	subMenu,
																	menuContainer
																	]);
												}
											}

											ev.preventDefault();
										}

										else if (k == 13 || k == 32){
											if (subMenu && !navigatesAway){
												cmbc.cb = function(){
													setFocus($($(cmbc.cb.subMenu).data('menuItems'))[0], $(cmbc.cb.subMenu).data('menuItems'),
														cmbc.cb.menuItems);
												};
												cmbc.cb.subMenu = subMenu;
												cmbc.cb.menuItems = menuItems;
												openMenu.apply(this,
																[
																subMenu,
																menuContainer
																]);
											}

											else{
												$(this).click();
											}
											ev.preventDefault();
										}

										else if (k == 27 || k == 9){
											if (menuContainer == menuBar){
												closeMenu.apply(this,
																[
																$(menuBar).data('open'),
																true,
																menuBar
																]);
											}

											else{
												if (k == 27 && parentMenuContainer == menuBar)
													$(menuBar).data('stopFocus', true);
												closeMenu.apply(this,
																[
																menuContainer,
																k == 9 ? true : false,
																menuBar
																]);

												if (k == 27 && triggeringMenuItem){
													setFocus(triggeringMenuItem, $($(triggeringMenuItem).data('menuContainer')).data('menuItems'), menuItems);
													ev.preventDefault();
												}
											}
										}
									}
								},
								click: function(ev){
									var navigatesAway = $(this).data('navigatesAway'), subMenu = $(this).data('subMenu'),
										menuContainer = $(this).data('menuContainer'), menuBar = $(this).data('menuBar');

									if (subMenu && !navigatesAway){
										cmbc.cb = function(){
											setFocus($($(cmbc.cb.subMenu).data('menuItems'))[0], $(cmbc.cb.subMenu).data('menuItems'),
												cmbc.cb.menuItems);
										};
										cmbc.cb.subMenu = subMenu;
										cmbc.cb.menuItems = menuItems;
										openMenu.apply(this,
														[
														subMenu,
														menuContainer
														]);
									}

									else{
										closeMenu.apply(this,
														[
														menuContainer,
														true,
														menuBar
														]);

										handleMenuItemClick.apply(this, [ev]);
									}
									ev.preventDefault();
								}
								});

				if (isTopLvl)
					$(mI).bind(
									{
									'focus mouseenter': function(ev){
										var menuItem = this, menuContainer = $(menuItem).data('menuContainer'), subMenu = $(menuItem).data('subMenu'),
											menuBar = $(menuItem).data('menuBar'), open = $(menuBar).data('open'),
											stopFocus = $(menuBar).data('stopFocus');

										if (open && open != subMenu){
											closeMenu.apply(this,
															[
															open,
															true,
															menuBar
															]);

											open = null;
										}

										if (!open && subMenu && !stopFocus)
											openMenu.apply(this,
															[
															subMenu,
															menuBar
															]);

										$(menuBar).data('stopFocus', null);
									}
									});
			});
		},

		// Handle setting focus between role="menuitem" elements
		setFocus = function(menuItem, menuItems, parentMenuItems){
			$(parentMenuItems).attr('tabindex', '-1');
			$(menuItems).attr('tabindex', '-1');
			$(menuItem).attr('tabindex', '0').focus();
		},

		// CSS for hiding accessible offscreen text in a manner that doesn't conflict with touch devices
		offscreenCSS =
						{
						position: 'absolute',
						clip: 'rect(1px 1px 1px 1px)',
						clip: 'rect(1px, 1px, 1px, 1px)',
						padding: 0,
						border: 0,
						height: '1px',
						width: '1px',
						overflow: 'hidden',
						zIndex: -1000
						};

		// Start checking for role="menubar" constructs on the loaded page
		setupMenubar(topMenuBarSelector);
	};
})($);