const filterWebRequets = (details) => details.method !== "GET" || details.type !== "main_frame";

function getConsentPageScore (url, referrer) {

    let score = 0;
    
    referrer = encodeURIComponent(referrer);

    try {
        
        if (urlConsentPageKeywords.find(keyword => url.indexOf(keyword) > -1)) {
            score++;
        }
    
        if (url.split("?")[1]?.split("&").map(e => e.split("=")[1]).find(e => e === referrer))  {
            score++;
        }

    } catch (error) {
        console.error("getConsentPageScore", error);
    }

    return score;

}

function addNewConsentPageRule (details, detectedWith) {

    // Try the same request as before, but with googlebot as the user agent

    let newRule = {
        url: details.originUrl,
        redirectUrl: details.url,
        tabId: details.tabId,
        manipulatedUserAgent: false
    }

    if (detectedWith === "header-location") {
        newRule.url = details.url;
        newRule.redirectUrl = details.redirectUrl;
    }

    if (!detectedCookieConsentRedirects.find( e => e.url === newRule.url && e.tabId === newRule.tabId)) {
        console.log("DETECT new consent page redirect");
        detectedCookieConsentRedirects.push(newRule);
    }

}


browser.webRequest.onBeforeSendHeaders.addListener(async (details) => {

    let modifyHeaders = false;

    for (detectedCookieConsentRedirect of detectedCookieConsentRedirects) {

        if (
            detectedCookieConsentRedirect.tabId === details.tabId &&
            details.url.startsWith(detectedCookieConsentRedirect.url) 
        ) {
            modifyHeaders = true;
            detectedCookieConsentRedirect.manipulatedUserAgent = true;
            break;
        }

    }

    if (!modifyHeaders) return;
    if (await isIgnoreThisTabEnabled(details.tabId, details.url)) return;

    showPageActionIcons[details.tabId] = true;

    for (var header of details.requestHeaders) {
        if (header.name.toLowerCase() === "user-agent") {
            header.value = magicUserAgent;
        }
    }

    return { requestHeaders: details.requestHeaders };

}, {urls: ["<all_urls>"]}, ["blocking", "requestHeaders"]);


function checkIsAlreadyDetected (details) {

    let modifyHeaders = null;

    for (detectedCookieConsentRedirect of detectedCookieConsentRedirects) {

        if (
            detectedCookieConsentRedirect.tabId === details.tabId && 
            detectedCookieConsentRedirect.redirectUrl === details.url 
        ) {

            // If the user agent has already changed, then the page
            // may recognize that it is not the googlebot
            if (detectedCookieConsentRedirect.manipulatedUserAgent === false) {
                modifyHeaders = detectedCookieConsentRedirect;
                break;
            }

        }

    }

    return modifyHeaders;

}

browser.webRequest.onBeforeRequest.addListener(async (details) => {
    if (filterWebRequets(details)) return;

    
    let modifyHeaders = checkIsAlreadyDetected(details);
    
    if (!modifyHeaders && typeof details.originUrl !== "undefined") {
        
        const score = getConsentPageScore(details.url, details.originUrl);
        
        if (score >= 2) {
            addNewConsentPageRule(details, "");
            modifyHeaders = checkIsAlreadyDetected(details);
            
        }
        
    }

    if (await isIgnoreThisTabEnabled(details.tabId, details.url)) return;

    if (modifyHeaders) {

        showPageActionIcons[details.tabId] = true;

        return {
            redirectUrl: detectedCookieConsentRedirect.url
        };

    }

}, {urls: ["<all_urls>"]}, ["blocking"]);


// Detect redirects to consent page through *HTTP header Location*
// (like on golem.de)

browser.webRequest.onBeforeRedirect.addListener((details) => {
    if (filterWebRequets(details)) return;
    
    const score = getConsentPageScore(details.redirectUrl, details.url);
    
    if (score >= 2) {
        addNewConsentPageRule(details, "header-location");
    }

}, {urls: ["<all_urls>"]});