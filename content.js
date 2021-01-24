let startUp = +new Date();
let blockedCookieBanner = false;
let lastModification = null;
let checkAfterModification = null;

// TODO: create config page
let configs = {
    removeRadicalAllPopus: true,
    cookieHtmlKeywords: [ "cookie" ]
};


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
        console.info("[inline-popup-blocker] REMOVE removeFixedElements: ", removeFixedElements);
        removeFixedElements.forEach(removeFixedElement => removeFixedElement.remove());
        removed = removeFixedElements.length;
    }

    if (zIndex > -1 && zIndex > 100) {

        let popupElements = findElementByCssRule('zIndex', parseInt(zIndex), (a, b) => a > b);

        console.info("[inline-popup-blocker] REMOVE popupElements: ", popupElements);
        popupElements.forEach(popupElement => popupElement.remove());

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
                        fixedElement.remove();
                        console.info("[inline-popup-blocker] REMOVE fixedElement (keyword = " + cookieHtmlKeyword + "): ", fixedElement);
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
`);

    }

}


// -- Main function --

function startPopUpCleaner () {

    removeScrollBlocker();

    if (!configs.removeRadicalAllPopus && startUp <= +new Date() - 1000 * 30) {
        // After 30 seconds at the latest, all cookie banners should have appeared.
        return;
    }

    if (!blockedCookieBanner) {
        if (blockedCookieBanner = removeCookieBanner()) {
            console.log("blockedCookieBanner");
            browser.runtime.sendMessage('blocked-cookie-banner');
        }
    }

    if (lastModification >= +new Date() - 500) {
        // The next function is very computationally intensive (for loops), so it should not
        // be called immediately after each change, but several changes should
        // first be collected and then checked again.
        return;
    }

    if (removed = findAndRemovePopups() > 0) {
        console.log("findAndRemovePopups");
        browser.runtime.sendMessage('blocked-inline-popup');
    }

}

function createObserver() {

    // callback function to execute when mutations are observed
    const observer = new MutationObserver(mutationRecords => {

        lastModification = +new Date();
        if (checkAfterModification) clearTimeout(checkAfterModification);
        setTimeout(startPopUpCleaner, 500);
        
    })

    observer.observe(document.body, { attributes: false, childList: true, subtree: true })

}


try {

    // run initially (after dom content loaded)

    const hostname = window.location.hostname;

    browser.storage.sync.get(hostname).then(res => {

        if (res[hostname] == 'i') {
            return browser.runtime.sendMessage('ignored');
        }
    
        startPopUpCleaner();
        createObserver();

    });
    

} catch (error) {
    console.error("[inline-popup-blocker] ERROR:", error);
}






//  ---------- Some Helpers ----------


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
function addStyleRules (rules) {
    let style = document.createElement("style")
    style.innerHTML = rules;
    document.head.append(style);
}