/*!
ARIA Menubar Module for jQuery
Built by Bryan Garaventa, distributed under the OSI-MIT License.

Implementation details: The ARIA Menubar Module specifically follows the ARIA 1.1 specification using 'roving tabindex' to properly manage focus, as documented at:
http://whatsock.com/training/matrices/#menubar
Which also includes submenu constructs, as documented at
http://whatsock.com/training/matrices/#menu

(Tested and confirmed to be accessible using JAWS in IE and Firefox, NVDA in IE and Firefox, and VoiceOver in Safari on iOS.)

How It Works:

1. The ARIA Menubar Module runs after the page finishes loading, and recursively locates any UL element that includes role="menubar". (The UL must have a unique ID)

2. The script then locates all direct children of role="menubar" that consist of A tags that include role="menuitem", the HTML markup of which must follow the CSS selector pattern:
'ul[role="menubar"] > li[role="presentation"] > a[href][role="menuitem"]'

This is true as well for all nested submenus that consist of UL elements that include role="menu", which must follow the same CSS selector pattern:
'ul[role="menu"] > li[role="presentation"] > a[href][role="menuitem"]'

(The A tag may include any additional HTML markup for styling purposes, but should not include any block-level elements.
If SVG images are embedded within the structure anywhere, they must be removed from the tab order and hidden properly from ATs by adding all of the following attributes to the SVG element: focusable="false" role="presentation" aria-hidden="true" ) 

3. Whenever an A tag that includes role="menuitem" has an attached submenu, it must include the attribute data-submenu-id, which points to the unique ID of the referenced UL element that includes role="menu".

The ARIA Menubar Module will then automatically map all parent/child associations and assign the correct focus management scripting to all 'a[role="menuitem"]' elements within the menubar construct. Supplementary offscreen text will also be added automatically to convey directional information for non-sighted screen reader users, as well as touch screen device detection to prevent keyboard directions from being conveyed within non-supporting platforms.

4. Several CSS classes can be used to customize behavioral functionality, which will automatically be applied to the menubar functionality.

'horizontal' or 'vertical': When applied to a UL element that includes role="menubar" or role="menu", the ARIA Menubar Module will automatically configure the correct Left/Right or Up/Down arrow key navigation, as well as the correct arrow key assignment for opening a submenu when detected.

(If neither is applied, a UL with role="menubar" is implicitly set to horizontal, and a UL with role="menu" is implicitly set to vertical.)

'navigates-away': When applied to an A tag that includes role="menuitem" within the top level Menubar, it will add dual functionality to the link. Meaning it will navigate to another page when clicked, but will instead open the attached menu when moused over.
All necessary keyboard functionality is automatically applied at the same time, causing the visible submenu to render when the Menubar menuitem receives focus, to move focus into a submenu when the arrow keys are used with the assigned horizontal or vertical paradigm, and to disappear when Tab is pressed to move focus away.

IMPORTANT: This class must only be applied on the top level a[role="menuitem"] elements, since it will not work accessibly within dynamically rendered submenus where 'click' is needed to open nested submenus.

5. Whenever a role="menuitem" link is clicked, it will automatically execute the handleMenuItemClick() function, which can be configured to use the A tags href attribute to navigate to the assigned page, or to perform any other action using additional attributes within the A tag such as the ID or data- attributes to include additional config directives.
An exception to this is when a role="menuitem" link opens a nested submenu from within a dynamically rendered role="menu" structure, which will perform the action of opening the submenu and not a navigational function click.

IMPORTANT NOTES

When implementing the HTML markup, the role="menubar" structure must be included within a container element that includes role="application". This is necessary in order to activate the correct modality shift when using screen readers like JAWS and NVDA in IE and Firefox.

It is equally important to make sure that there are no other embedded active elements included within this role="application" container, which should only include the focusable A tags that include role="menuitem" as focusable interactive elements. Otherwise, these additional active elements such as embedded links, buttons, form fields, and text will not be accessible to non-sighted screen reader users.

The ARIA Menubar Module should never be applied on a structure that does not open submenus.

*/

$(function(){

	// Generic CSS selector that identifies the top level Menubar structure on each page.
	var topMenuBarSelector = 'ul[role="menubar"]',

	// Class name that toggles display:none for hiding and unhiding dynamically rendered submenus
	hiddenClass = 'hidden',

	// Click handler that executes whenever an A tag that includes role="menuitem" is clicked
	handleMenuItemClick = function(ev){
		top.location.href = this.href;
	},

	// Handle opening of dynamic submenus
	openMenu = function(subMenu, menuContainer){
		$(menuContainer).data('open', subMenu);
		$(subMenu).data('index', 0).removeClass(hiddenClass);

// Focus callback for use when adding animation effect; must be moved into animation callback after animation finishes rendering
		if (openMenu.cb && typeof openMenu.cb === 'function'){
			openMenu.cb();
			openMenu.cb = null;
		}
	},

	// Handle closing of dynamic submenus
	closeMenu = function(subMenu, closeAll, menuBar){
		if (!subMenu)
			return;
		var menuBar = menuBar || $(subMenu).data('menuBar');

		if (closeAll){
			var subMenus = $(menuBar).data('subMenus');

			for (var i = 0; i < subMenus.length; i++){
				closeMenu(subMenus[i], false, menuBar);
			}
		}

		else{

			var triggeringMenuItem = $(subMenu).data('triggeringMenuItem'),
				parentMenuContainer = $(triggeringMenuItem).data('menuContainer');
			$(parentMenuContainer).data('open', null);
			$($(parentMenuContainer).data('menuItems')[$(parentMenuContainer).data('index')]).attr('tabindex', 0);

			if (subMenu != menuBar)
				$(subMenu).data('index', 0).addClass(hiddenClass);
			$($(subMenu).data('menuItems')).attr('tabindex', -1);
		}
	},

	// Accessible offscreen text to specify necessary keyboard directives for non-sighted users.
	// (The below wording is important, so don't change this unless absolutely necessary)
	dualHorizontalTxt = 'Press Enter to navigate to page, or Down to open dropdown',
		dualVerticalTxt = 'Press Enter to navigate to page, or Right to open dropdown',
		horizontalTxt = 'Press Down to open dropdown', verticalTxt = 'Press Right to open dropdown',

	// Recursively setup each Menubar on the page
	setupMenubar = function(tmbSelector){
		$(tmbSelector).each(function(i, menuBar){
			$(menuBar).data('subMenus', []);
			setupMenuItems(menuBar, menuBar, true);
			$($(menuBar).data('menuItems')[0]).attr('tabindex', 0);
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

		$(menuContainer).attr('aria-orientation', isHorizontal ? 'horizontal' : 'vertical');

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
										closeMenu(this);

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
											closeMenu(menuContainer);

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
											closeMenu(menuContainer);
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
												openMenu.cb = function(){
													setFocus($($(openMenu.cb.subMenu).data('menuItems'))[0], $(openMenu.cb.subMenu).data('menuItems'),
														openMenu.cb.menuItems);
												};
												openMenu.cb.subMenu = subMenu;
												openMenu.cb.menuItems = menuItems;
												openMenu(subMenu, menuContainer);
											}

											else{
												closeMenu(menuContainer, true);
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
												openMenu.cb = function(){
													setFocus($($(openMenu.cb.subMenu).data('menuItems'))[0], $(openMenu.cb.subMenu).data('menuItems'),
														openMenu.cb.menuItems);
												};
												openMenu.cb.subMenu = subMenu;
												openMenu.cb.menuItems = menuItems;
												openMenu(subMenu, menuContainer);
											}
										}
										ev.preventDefault();
									}

									else if (k == 13 || k == 32){
										if (subMenu && !navigatesAway){
											openMenu.cb = function(){
												setFocus($($(openMenu.cb.subMenu).data('menuItems'))[0], $(openMenu.cb.subMenu).data('menuItems'),
													openMenu.cb.menuItems);
											};
											openMenu.cb.subMenu = subMenu;
											openMenu.cb.menuItems = menuItems;
											openMenu(subMenu, menuContainer);
										}

										else{
											$(this).click();
										}
										ev.preventDefault();
									}

									else if (k == 27 || k == 9){
										if (menuContainer == menuBar){
											closeMenu($(menuBar).data('open'), true, menuBar);
										}

										else{
											if (k == 27 && parentMenuContainer == menuBar)
												$(menuBar).data('stopFocus', true);
											closeMenu(menuContainer, k == 9 ? true : false, menuBar);

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
									openMenu.cb = function(){
										setFocus($($(openMenu.cb.subMenu).data('menuItems'))[0], $(openMenu.cb.subMenu).data('menuItems'),
											openMenu.cb.menuItems);
									};
									openMenu.cb.subMenu = subMenu;
									openMenu.cb.menuItems = menuItems;
									openMenu(subMenu, menuContainer);
								}

								else{
									closeMenu(menuContainer, true, menuBar);
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
										closeMenu(open, true, menuBar);
										open = null;
									}

									if (!open && subMenu && !stopFocus)
										openMenu(subMenu, menuBar);

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
});