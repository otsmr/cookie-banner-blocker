let startUp = +new Date();
let blockedCookieBanner = false;
let lastModification = null;
let checkAfterModification = null;

// TODO: create config page
let configs = {
    removeRadicalAllPopus: true,
    cookieHtmlKeywords: [ "cookie" ],
    verbose: true
};


function log (type, ...msg) {
    if (configs.verbose)
    console[type](...msg);
}

const logger = {
    info: (...msg) => log("info", ...msg),
    error: (...msg) => log("error", ...msg)
}


// -- Popups --
// Searches for popups like newsletter signups, cookie banners
// or similar, which are displayed as popups within the pages. 
// The logic: it searches for overlays that overlay the whole page.
// The overlay and everything that has a higher zIndex will be removed.

function findAndRemovePopups() {


    let fixedElements = findElementByCssRule('position', "fixed");

    let zIndex = -1;
    let removed = 0;
    let removeFixedElements = [];
    
    for (fixedElement of fixedElements) {
        
        const rect = fixedElement.getBoundingClientRect()
        
        if ( rect.top === 0 && hasSameSizeAsWindow(rect) ) {
            let tempZIndex = window.getComputedStyle(fixedElement).zIndex;
            if (tempZIndex < 500) continue;
            if (tempZIndex > zIndex) {
                zIndex = tempZIndex;
            }
            removeFixedElements.push(fixedElement);
        }
        
    }

    if (removeFixedElements.length > 0) {
        logger.info("[inline-popup-blocker] REMOVE removeFixedElements: ", removeFixedElements);
        removeFixedElements.forEach(hideElementWithCSS);
        removed = removeFixedElements.length;
    }

    if (zIndex > -1 && zIndex > 100) {

        let popupElements = findElementByCssRule('zIndex', parseInt(zIndex), (a, b) => a > b);

        logger.info("[inline-popup-blocker] REMOVE popupElements: ", popupElements);

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

    let fixedElements = findElementByCssRule('position', "fixed");

    fixedElements = fixedElements.concat(findElementByCssRule('zIndex', 100, (a, b) => a > b));
    fixedElements = fixedElements.concat(findElementByCssRule('position', "absolute"));

    fixedElements.forEach(fixedElement => {

        let childrenWithFixed = findElementByCssRule("position", "fixed", (a, b) => a === b, fixedElement)
        if (childrenWithFixed.length > 0) return;

        configs.cookieHtmlKeywords.forEach(cookieHtmlKeyword => {
            
            try {
                if (fixedElement.innerHTML.toLowerCase().indexOf(cookieHtmlKeyword) > 1) {
                    if ( window.getComputedStyle(fixedElement).display !== "none") {

                        logger.info("[inline-popup-blocker] HIDE fixedElement (keyword = " + cookieHtmlKeyword + "): ", fixedElement);   
                        hideElementWithCSS(fixedElement);
                        blocked = true;

                    }
                }
            } catch (error) {}

        })
        
    });

    return blocked;


}


// -- Unblock scroll --

function removeScrollBlocker () {

    const html = document.getElementsByTagName("html")[0];

    if ( document.body.style.overflow !== "auto" || html.style.overflow !== "auto" ) {

        [ html, document.body ].forEach(element => {
            element.style.setProperty("overflow", "auto", "important");
            element.style.setProperty("position", "unset", "important");
        })

        addStyleRules(`
html { overflow: auto !important; }    
body { overflow: auto !important; }    
`, false);

    }

}


// -- Main function --
let currentWaitTimer = 200;

function startPopUpCleaner () {
    
    removeScrollBlocker();

    if (!configs.removeRadicalAllPopus && startUp <= +new Date() - 1000 * 30) {
        // After 30 seconds at the latest, all cookie banners should have appeared.
        return;
    }

    if (!blockedCookieBanner) {
        if (blockedCookieBanner = removeCookieBanner()) {
            browser.runtime.sendMessage('blocked-cookie-banner');
        }
    }

    // So that the performance when using pages does not suffer as for
    // example on youtube.com, where elements are quite often mitigated.
    if ((+new Date() - startUp) / 1000 > 5) {
        currentWaitTimer = 500;
    }
    if ((+new Date() - startUp) / 1000 > 10) {
        currentWaitTimer = 1000;
    }

    if (lastModification >= +new Date() - currentWaitTimer) {
        // The next function is very computationally intensive (for loops), so it should not
        // be called immediately after each change, but several changes should
        // first be collected and then checked again.
        return;
    }

    if (removed = findAndRemovePopups() > 0) {
        browser.runtime.sendMessage('blocked-inline-popup');
    }

}


function createObserver() {

    // callback function to execute when mutations are observed
    const observer = new MutationObserver(mutationRecords => {

        lastModification = +new Date();
        if (checkAfterModification) clearTimeout(checkAfterModification);
        checkAfterModification = setTimeout(startPopUpCleaner, currentWaitTimer);
        
    })

    observer.observe(document.body, { attributes: false, childList: true, subtree: true })

}

try {

    // run initially (after dom content loaded)
    
    const hostname = window.location.hostname;
    
    browser.storage.sync.get(hostname).then(async (res) => {
        
        if (res[hostname] == 'i') {
            return browser.runtime.sendMessage('ignored');
        }
        
        // let useCachedVersion = await getCSSCache();

        removeScrollBlocker();
        startPopUpCleaner();
        createObserver();

    }).catch(logger.error);
    

} catch (error) {
    logger.error("[inline-popup-blocker] ERROR:", error);
}


//  ---------- Cache Functions ----------
// Cache found popups so that they can be removed
// faster at the next startup.
// Also, with large sites (youtube.com) there is
// still performance problem when detecting popups

const cacheName = location.host + "-cache";

let elementsToRemove = [];
let cssRulesCache = "";

async function getCSSCache () {
    
    const cachedForHostname = await browser.storage.sync.get(cacheName);
    let cache = cachedForHostname[cacheName];
    
    if (
        cache === undefined ||
        cache.cssRulesCache === undefined ||
        cache.cssRulesCache === "" 
    ) {
        return null;
    }
        
    logger.info("[inline-popup-blocker] restoredFromCache");

    addStyleRules(cache.cssRulesCache, false);

    return cache.cssRulesCache;

}

function cacheCssRules () {

    const hostname = window.location.hostname;

    browser.storage.sync.get(hostname).then(async (cachedForHostname) => {

        browser.storage.sync.set({ [cacheName]:  {
            ...cachedForHostname[cacheName],
            cssRulesCache
        }});

    })

}


//  ---------- Some Helper Functions ----------

function getSelectorByIdentifier (elementToRemove) {

    let selector = `${elementToRemove.tagName}`;
    
    if (elementToRemove.id !== "")
        selector += "#" + elementToRemove.id;
    
    if (elementToRemove.className !== "")
        selector += "." + elementToRemove.className.split(" ").join(".");

    return selector;
    
}

function getIdentifierForElement (element) {

    return {
        tagName: element.tagName,
        className: element.className,
        id: element.id,
        date: +new Date()
    }

}

function findElementByCssRule (name, value, check = (a, b) => a === b, element = document.body) {

    let elements = [...element.getElementsByTagName("*")];

    let shadowElements = elements.filter(e => e.shadowRoot).map(e => {
        return [...e.shadowRoot.childNodes].map(e => [...e.getElementsByTagName("*")]).flat();
    }).flat();

    elements = elements.concat(shadowElements);

    let foundElements = []

    for (element of elements) {

        if (check(window.getComputedStyle(element, null)[name], value)) {
            foundElements.push(element)
        }

    }
    return foundElements;

}

function hasSameSizeAsWindow (rect, radius = 100) {
    return (
        rect.width > window.innerWidth - radius && rect.width < window.innerWidth + radius && 
        rect.height > window.innerHeight - radius
    )
}


function isFixed(node) {
    return window.getComputedStyle(node).position === 'fixed'
}

function hideElementWithCSS (element) {

    if (element.getRootNode().host) {
        element = element.getRootNode().host;
    }

    let selector = getSelectorByIdentifier(getIdentifierForElement(element));
    addStyleRules(`${selector} { display: none !important; }`);

}

function addStyleRules (rules, addToCache = true) {

    if (addToCache) {
        cssRulesCache += rules;
        cacheCssRules();
    }

    logger.info("[inline-popup-blocker] ADD customCSSRules ", rules.split("\n").join(" "));

    try {
        let style = document.createElement("style")
        style.innerHTML = rules;
        document.head.append(style);
    } catch (error) {
        console.log(error);
    }

}