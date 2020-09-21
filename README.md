# nano.js
Minimalist DOM manipulation library for ES6 JavaScript

---

nano.js is based loosely on the jQuery API making the switch from jQuery easier. However, unlike jQuery, nano.js does not feature AJAX helper functions or built-in support for anitmations. In modern web applications AJAX can be supported through either the fetch API or the use of 3rd party libraries such as axios. Similarly, animations can (and should be) written in CSS whenever possible which make fadeIn() and fadeOut() unnecessary.

The source code of nano.js is contained in a single JavaScript file containing less than 350 lines of uncompressed code making it easy to understand and modify if needed.
