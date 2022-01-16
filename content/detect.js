
let startUp = +new Date();
let blockedCookieBanner = false;
let lastModification = null;
let checkAfterModification = null;
let currentWaitTimer = 200;

// TODO: create config page
let configs = {
    removeRadicalAllPopus: true,
    cookieHtmlKeywords: [ "cookie" ],
    cookieBodyClassKeywords: [ "cookie", "consent" ],
    verbose: true
};


// All tags that are not used for a popup are filtered out via the
// CSS selector :not().
// This will also find CUSTOM tags like on youtube.com (<paper-dialog>)

const HTML_TAGS = [ "a", "abbr", "acronym", "address", "applet", "area", "article", "aside", "audio", "b", "base", "basefont", "bdi", "bdo", "big", "blockquote", "body", "br", "button", "canvas", "caption", "center", "cite", "code", "col", "colgroup", "data", "datalist", "dd", "del", "details", "dfn", "dialog", "dir", "div", "dl", "dt", "em", "embed", "fieldset", "figcaption", "figure", "font", "footer", "form", "frame", "frameset", "h1", "h2", "h3", "h4", "h5", "h6", "head", "header", "hr", "html", "i", "iframe", "img", "input", "ins", "kbd", "label", "legend", "li", "link", "main", "map", "mark", "meta", "meter", "nav", "noframes", "noscript", "object", "ol", "optgroup", "option", "output", "p", "param", "picture", "pre", "progress", "q", "rp", "rt", "ruby", "s", "samp", "script", "section", "select", "small", "source", "span", "strike", "strong", "style", "sub", "summary", "sup", "svg", "table", "tbody", "td", "template", "textarea", "tfoot", "th", "thead", "time", "title", "tr", "track", "tt", "u", "ul", "var", "video", "wbr", ]


const POPUP_TAGS = ['div', 'section', 'footer', 'aside', 'form', 'iframe', 'dialog']
const IGNORE_TAGS_SELECTOR = HTML_TAGS.filter(tag => !POPUP_TAGS.find(e => e === tag)).map(tag => `:not(${tag})`).join("")
const POPUP_TAGS_SELECTOR = "*" + IGNORE_TAGS_SELECTOR;


// -- Popups --
// Searches for popups like newsletter signups, cookie banners
// or similar, which are displayed as popups within the pages. 
// The logic: it searches for overlays that overlay the whole page.
// The overlay and everything that has a higher zIndex will be removed.

function findAndRemovePopups(checkElements = null) {

    let fixedElements = (checkElements) ? checkElements : findElementByCssRule('position', "fixed");

    let zIndex = -1;
    let removed = 0;
    let removeFixedElements = [];
    
    for (fixedElement of fixedElements) {
        
        const rect = fixedElement.getBoundingClientRect()
        
        if ( rect.top === 0 && hasSameSizeAsWindow(rect) ) {
            let tempZIndex = window.getComputedStyle(fixedElement).zIndex;
            if (tempZIndex > zIndex) {
                zIndex = tempZIndex;
            }
            const percentOfPage = 100 / document.body.innerHTML.length * fixedElement.innerHTML.length;
            if (percentOfPage < 50) {
                removeFixedElements.push(fixedElement);
            } else {
                logger.info("IGNORE Element (OVERLAY): percentOfPage=" + percentOfPage);
            }
        }
        
    }

    if (removeFixedElements.length > 0) {
        logger.info("FOUND Element (OVERLAY): ", removeFixedElements);
        removeFixedElements.forEach(hideElementWithCSS);
        removed = removeFixedElements.length;
    }

    if (zIndex > -1 && zIndex > 100) {

        let popupElements = findElementByCssRule('zIndex', parseInt(zIndex), (a, b) => a > b);

        logger.info("FOUND Element (> OVERLAY): ", popupElements);

        popupElements.forEach(hideElementWithCSS);

        removed += popupElements.length;

    }

    return removed;

}



// -- Cookies banners --
// The logic: fixed or absolute element, elements with
// high z-index, which have inside specific keywords.

function removeCookieBanner () {

    let blocked = false;

    let fixedElements = findElementByCssRule('position', null, e => e === "fixed" || e === "absolute");

    fixedElements = fixedElements.concat(findElementByCssRule('zIndex', 100, (a, b) => a > b));

    fixedElements.forEach(fixedElement => {

        let childrenWithFixed = findElementByCssRule("position", null, e => e === "fixed" || e === "absolute", fixedElement);
        if (childrenWithFixed.length > 1) return; // check if not the root element

        configs.cookieHtmlKeywords.forEach(cookieHtmlKeyword => {
            
            try {
                if (fixedElement.innerHTML.toLowerCase().indexOf(cookieHtmlKeyword) > 1) {
                    if ( window.getComputedStyle(fixedElement).display !== "none") {

                        logger.info("FOUND Element by keyword = " + cookieHtmlKeyword + ": ", fixedElement);   
                        hideElementWithCSS(fixedElement);
                        blocked = true;

                    }
                }
            } catch (error) {}

        })
        
    });

    return blocked;

}


function startPopUpCleaner (checkElements = null) {
    
    if (!configs.removeRadicalAllPopus && startUp <= +new Date() - 1000 * 30) {
        // After 30 seconds at the latest, all cookie banners should have appeared.
        return;
    }

    if (!blockedCookieBanner) {
        blockedCookieBanner = removeCookieBanner()
    }

    // So that the performance when using pages does not suffer as for
    // example on youtube.com, where elements are quite often mitigated.
    let seconds = (+new Date() - startUp) / 1000;

    if (seconds > 5)  currentWaitTimer = 500;
    if (seconds > 10) currentWaitTimer = 1000;
    if (seconds > 20) currentWaitTimer = 2000;

    if (lastModification >= +new Date() - currentWaitTimer) {
        // The next function is very computationally intensive (for loops), so it should not
        // be called immediately after each change, but several changes should
        // first be collected and then checked again.
        return;
    }

    findAndRemovePopups(checkElements);

}


function createObserver() {

    // callback function to execute when mutations are observed
    let checkElements = []
    const observer = new MutationObserver(mutationRecords => {
   
        let elements = mutationRecords.map(e => e.target);

        // for (element of elements) {
        // ?????
        //      elements = elements.concat([...element.querySelectorAll(POPUP_TAGS_SELECTOR)]);
        // }

        if (elements.length > 2000) {
            // at heise.de the cookie banner appears at ~1400 changes
            // prevent performance problems (youtube.com often has up to 20000 changes)
            return;
        }

        for (element of elements) {
            if (window.getComputedStyle(element, null)["position"] === "fixed") {
                checkElements.push(element);
            }
        }

        if (checkElements.length > 0) {

            lastModification = +new Date();
            if (checkAfterModification)
                clearTimeout(checkAfterModification);

            checkAfterModification = setTimeout(() => {

                startPopUpCleaner(checkElements);
                checkElements = [];

            }, currentWaitTimer);

        }

    })

    observer.observe(document.body, { attributes: true, childList: true, subtree: true })

}

const cache = new CSSRuleCache();

try {

    // run initially (after dom content loaded)
    
    browser.storage.sync.get(window.location.hostname)
    .then(async (res) => {
        
        if (res[window.location.hostname] == 'i')
            return;
        
        await cache.loadCacheFromStorage();

        if (cache.currentCachedSelectors.length > 0) {
            injectBlockerRules(cache.currentCachedRules);
            browser.runtime.sendMessage('blocked');
        }
        
        startPopUpCleaner();
        createObserver();

        setTimeout(() => {
            startPopUpCleaner();
        }, 100);

        setTimeout(() => {
            startPopUpCleaner();
        }, 3000);

    }).catch(logger.error);
    

} catch (error) {
    logger.error("ERROR:", error);
}
