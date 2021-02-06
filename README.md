# [Inline Popup Blocker](https://addons.mozilla.org/de/firefox/addon/inline-popup-blocker/)

Simple inline popup blocker that removes most cookie and newsletter popups without blocklist.  
Redirects to consent pages are also detected and prevented (for example at golem.de or spiegel.de)

![Video](example.gif)


## Prevent cookie banner redirects
A short analysis about the used technique can be found [here](docs/detected-cookie-consent-redirects.md).


## Inline Popup Blocker
Searches for popups like newsletter signups, cookie banners or similar, which are displayed as popups within the pages. It searches for overlays that overlay the whole page. The overlay and everything that has a higher zIndex will be removed.


## Cookie Banner Blocker
Fixed or absolute element, elements with high z-index, which have inside specific keywords.



## Credits
Inspired by [this project](https://github.com/jannisch/cookie-popup-blocker).
