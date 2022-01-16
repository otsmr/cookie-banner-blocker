function removeClassNamesByKeywords () {

    // Some sites have special rules when the cookie banner is displayed (see https://www.computerbase.de)
    const newClassName = []
    document.body.classList.forEach(className => {

        for (const keyword of configs.cookieBodyClassKeywords) {
            if (className.indexOf(keyword) !== -1) 
                return;
        }
        newClassName.push(className);
    })

    document.body.className = newClassName.join(" ");
    
}

function getSelectorByIdentifier (elementToRemove) {

    let selector = `${elementToRemove.tagName}`;
    
    if (elementToRemove.id !== "")
        selector += "#" + elementToRemove.id;
    
    if (elementToRemove.className !== "")
        // filtering is important if there are too many spaces in the className for some reason
        selector += "." + elementToRemove.className.split(" ").filter(e => e !== "").join(".");

    if (elementToRemove.style !== undefined) {
        selector += "[style=\"" + elementToRemove.style + "\"]";
    }

    return selector;
    
}

function getIdentifierForElement (element) {

    console.log(element);

    return {
        tagName: element.tagName,
        className: element.className,
        id: element.id,
        style: element.attributes.style?.value,
        date: +new Date()
    }

}

function findElementByCssRule (name, value, check = (a, b) => a === b, element = document.body) {

    let elements = [...element.querySelectorAll(POPUP_TAGS_SELECTOR)];
    
    let shadowElements = elements.filter(e => e.shadowRoot).map(e => {
        // get all html elements from the shadow element and filter elements like the style tag 
        return [...e.shadowRoot.childNodes].filter(e => e.querySelectorAll).map(e => [...e.querySelectorAll(POPUP_TAGS_SELECTOR)]).flat();
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

function hideElementWithCSS (element, timeout = false) {

    if (element.getRootNode().host) {
        element = element.getRootNode().host;
    }

    let selector = getSelectorByIdentifier(getIdentifierForElement(element));

    browser.runtime.sendMessage('blocked');
    injectBlockerRules(`${selector} { display: none !important; }`);
    cache.addSelector(selector);

    if (timeout)
        return;

    setTimeout(() => {
        // sometimes the identifier changes and the cookie banner comes back
        hideElementWithCSS(element, true)
    }, 500);

}

let blockerStyleElement = null;

function injectBlockerRules (rules) {

    if (blockerStyleElement === null) {

        blockerStyleElement = document.createElement("style");
        document.head.append(blockerStyleElement);

        removeScrollBlocker();

    }

    removeClassNamesByKeywords();

    blockerStyleElement.innerHTML += rules;

    logger.info("update injectBlockerRules ", rules.split("\n").join(" "));

}

function removeScrollBlocker () {

    const html = document.getElementsByTagName("html")[0];

    if ( document.body.style.overflow !== "unset" || html.style.overflow !== "auto" ) {

        [ html, document.body ].forEach(element => {

            if (element === document.body) {
                element.style.setProperty("overflow", "unset", "important");
            } else {
                element.style.setProperty("overflow", "auto", "important");
            }

            // some pages do not work if the position of the body is not absolute (see https://www.uni-goettingen.de/)
            if (window.getComputedStyle(element).position !== "absolute") {
                element.style.setProperty("position", "unset", "important");
            }
        })

        const style = document.createElement("style");
        style.innerHTML = ` html { overflow: auto !important; } body { overflow: auto !important; } `;
        document.body.append(style);

    }

}

function log (type, ...msg) {
    if (configs.verbose)
    console[type](...msg);
}

const logger = {
    info: (...msg) => log("info", "[inline-popup-blocker]", ...msg),
    error: (...msg) => log("error", "[inline-popup-blocker]", ...msg)
}