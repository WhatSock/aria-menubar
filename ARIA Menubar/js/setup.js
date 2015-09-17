// Run after page finishes loading

$(function(){

	// Create a new MenuBar instance

	var myMB = new ARIAMenuBar(
					{
					// Optional config overrides

					// Generic CSS selector that identifies the top level Menubar structure on each page.
					topMenuBarSelector: 'ul[role="menubar"]',

					// Class name that toggles display:none for hiding and unhiding dynamically rendered submenus
					hiddenClass: 'hidden',

					// Click handler that executes whenever an A tag that includes role="menuitem" is clicked
					handleMenuItemClick: function(ev){
						top.location.href = this.href;
					},

					// Handle opening of dynamic submenus
					openMenu: function(subMenu, menuContainer){
						$(subMenu).removeClass('hidden');

// Focus callback for use when adding animation effect; must be moved into animation callback after animation finishes rendering
						if (myMB.cb && typeof myMB.cb === 'function'){
							myMB.cb();
							myMB.cb = null;
						}
					},

					// Handle closing of dynamic submenus
					closeMenu: function(subMenu){
						$(subMenu).addClass('hidden');
					},

					// Accessible offscreen text to specify necessary keyboard directives for non-sighted users.
					// (The below wording is important, so don't change this unless absolutely necessary)
					dualHorizontalTxt: 'Press Enter to navigate to page, or Down to open dropdown',
					dualVerticalTxt: 'Press Enter to navigate to page, or Right to open dropdown',
					horizontalTxt: 'Press Down to open dropdown',
					verticalTxt: 'Press Right to open dropdown'

					//
					});
});