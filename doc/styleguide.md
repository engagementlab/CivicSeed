# Styleguide

Admittedly, the change in developers for CivicSeed over time has resulted in a mishmash of coding styles existing all at once. This is my preferred style which I would recommend using going forward.

## HTML / CSS

* Use lower-case-letters-with-dashes for CSS IDs and classes. Never use camelCase.

## Code style

* Always use camelCase for variable and function names. Do not use underscores.
* It is better to have really long, descriptive names for things than not.
* Use soft tabs with two spaces. This is a common default in many editors. While tabs may be more organizational, spaces guarantee that the scripts look the same for every developer. (See, for instance, [Doug Crockford's styleguide](http://javascript.crockford.com/code.html) for a good explanation why tabstops are unreliable.)
* Semicolons are optional. [To put it another way, they are not needed at all.](http://mislav.uniqpath.com/2010/05/semicolons/)
* Use single quotation marks, not double quotes for strings.
* Always use EcmaScript strict mode.
* Always use implicit parentheses on ternary operators. For example: `(valueToTest) ? true : false`
* Always use spaces in between operators. For example `'string ' + 'concatenation'`
* Always insert a space before the parenthetical arguments on functions, e.g. `function ()` or `function theFunction (argument)`
* Whenever possible, use native HTML5 implementations over jQuery, particularly for DOM element selection. This is faster and most modern browsers have standardized fairly well. jQuery remains valuable for certain common tasks like fading elements in and out.
* To set text content, the .`textContent` property is the HTML5 standard. Avoid using `.innerText`.
* To set HTML content, avoid using `.innerHTML` whenever possible; it is much slower than the equivalent with DOM creation and appending methods and is much safer. Using HTML strings can introduce bugs because of typos.
* If using jQuery, always attempt to replace deprecated jQuery functionality as soon as possible (e.g. `$.on` vs `$.bind`)
* Use `for` loops instead of `while` loops for counting. They are more readable and there is now no longer any discernible increase in speed for while loops, particularly reverse-counting while loops, which are less readable.
* Multiple nested `if`-`else` blocks more than two or three levels deep are less readable. If you find yourself needing them to sort out a function, try rethinking your approach.
* If the contents of your function are dependent on an if statement for execution, try testing it and then returning out of the function if not true, rather than having to indent another level.


## Code organization
* When needed, group functionality in a separate `.js` file with its own namespace. Each `script.js` has should have two objects: `$script` which will be available to other scripts in game, and a private `_script` one which should contain functions and variables that are only needed by that script.
* Whenever possible, do not rely on global variables to remember game state or data. Store variables on each script's private namespace (e.g. `_script`) or on the global namespace (e.g. `$script`) if necessary.
* When referring to variables or functions on its own namespace do not use the `$game` prefix.
* When referring to variables or functions on another namespace, try to store it as a local variable first to make updating names across functions easier to handle, unless doing so will make the function harder to read.
* If it is necessary to remember some aspect of the game state for retrieval by other parts of the script use the `$game.flags.set()` and `$game.flags.check()` methods (see also `flags.md`).
* Keep in mind DRY (Don't Repeat Yourself). If it looks like you are repeating code, create a separate function for it.

## General

* When in doubt, leave a comment about what the code does and assume that someone who reads it won't know who you are.
* It's okay to leave old formats in place until necessary for a rewrite.
* If in the future a developer(s) agree to modify the styleguide please update it here.


## Graphics

* Use approved colors whenever possible. See `variables.styl` in the `css/globals` folder for colors that have already been set.
* Use SVG tangram data over images whenever possible
* Create Retina-ready (2x) versions of graphics whenever possible
