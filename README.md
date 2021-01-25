# [Inline Popup Blocker](https://addons.mozilla.org/de/firefox/addon/inline-popup-blocker/)

A simple blocker that removes most inline and cookie banners **without a blocklist**.

![Video](example.gif)

## Inline Popup Blocker
Searches for popups like newsletter signups, cookie banners or similar, which are displayed as popups within the pages.   


**The logic**  
It searches for overlays that overlay the whole page. The overlay and everything that has a higher zIndex will be removed.


## Cookie Banner Blocker
**The logic**  
Fixed or absolute element, elements with high z-index, which have inside specific keywords.



## Credits
Inspired by [this project](https://github.com/jannisch/cookie-popup-blocker).
