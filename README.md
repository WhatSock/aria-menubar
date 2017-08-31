# aria-menubar
A jQuery based ARIA Menubar widget that supports dual functionality for top level Menuitem nodes for external page navigation with strict adherance to the ARIA 1.1 specification.

Demos:

Basic with jQuery only: http://whatsock.com/test/ARIA%20Menubar/ARIA%20Menubar/menubar.html

Modified with AccDC by Laurence Lewis: http://whatsock.com/test/ARIA%20Menubar/index.html

[Excerpted from setup.js]

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