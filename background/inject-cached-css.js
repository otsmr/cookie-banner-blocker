
async function getCSSRulesCache (targetTabId) {

    if (await isIgnoreThisTabEnabled(targetTabId)) return null;

    const tab = await browser.tabs.get(targetTabId);

    let hostname = tab.url.match(hostnameRegex)[1];

    const cacheName = hostname + "-cache";
    
    const cachedForHostname = await browser.storage.sync.get(cacheName);
    let cache = cachedForHostname[cacheName];
    
    if (
        cache === undefined ||
        cache.cssRulesCache === undefined ||
        cache.cssRulesCache === "" 
    ) {
        return null;
    }

    return cache.cssRulesCache;

}

async function initializePageAction (targetTabId) {

    try {

        let cssRulesCache = await getCSSRulesCache(targetTabId);
        
        if (cssRulesCache) {

            browser.tabs.insertCSS(targetTabId, {code: cssRulesCache}).then(() => {
                showBlockedIcon(targetTabId);
            }, console.info);

        }
        
    } catch (error) {
        console.error(error);
    }

}

browser.tabs.onUpdated.addListener(initializePageAction);