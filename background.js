const hostnameRegex = /\/\/([\.\-\_\w]+)/i;


function showBlockedIcon (tabId) {

    browser.pageAction.setIcon({ tabId, path: "icons/cookie-bite-solid.svg" });
    browser.pageAction.setTitle({
        tabId,
        title: "Disable popup blocking for this site",
    });
    browser.pageAction.show(tabId);

}

browser.runtime.onMessage.addListener((msg, sender) => {
    const tabId = sender.tab.id;
    
    switch (msg) {

        case "ignored":

            browser.pageAction.setIcon({ tabId, path: "icons/cookie-solid.svg" });
            browser.pageAction.setTitle({
                tabId,
                title: "Enable popup blocking for this site",
            });
            browser.pageAction.show(tabId);

            break;

        case "blocked-inline-popup":
            //TODO: custom icon for blocked-inline-popup
            showBlockedIcon(tabId);
            break;

        case "blocked-by-cache":
            //TODO: custom icon for blocked-by-cache
            showBlockedIcon(tabId);
            break;

        case "blocked-cookie-banner":
            showBlockedIcon(tabId);
            break;
    
        default:
            break;

    }

});

browser.pageAction.onClicked.addListener(async (tab) => {

    const hostname = tab.url.match(hostnameRegex)[1];
    const cacheName = hostname + "-cache";

	const existing = await browser.storage.sync.get(hostname);
    
	if (existing[hostname] == "i") {
		// remove from blocklist
		await browser.storage.sync.remove(hostname);
	} else {
        // add to blocklist
        await browser.storage.sync.remove(cacheName);
		await browser.storage.sync.set({ [hostname]: "i" });
	}
    await browser.tabs.reload(tab.id);
    
});

async function getCSSRulesCache (targetTabId) {

    const tab = await browser.tabs.get(targetTabId);

    let hostname = tab.url.match(hostnameRegex);

    if (hostname == null) return null;
    hostname = hostname[1];

    const cacheName = hostname + "-cache";
    
    const existing = await browser.storage.sync.get(hostname);

    if (existing[hostname] == "i") return null;
    
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



// browser.contextMenus.create({
//     id: "log-selection",
//     title: "Zeige verstecke Popups",
//     contexts: ["page", "frame"]
// }, console.log);

// browser.contextMenus.onClicked.addListener(async (info, tab) => {
//     console.log(info, tab);

//     let cssRulesCache = await getCSSRulesCache(tab.id);
    
//     if (cssRulesCache) {

//         await browser.tabs.removeCSS(tab.id, {code: cssRulesCache});

//         cssRulesCache = cssRulesCache.replace(/display: none !important;/g, "opacity: 0.5 !important; border: 2px solid green !important")

//         cssRulesCache += cssRulesCache.replace(/\n/g, " ").replace(/ \{(.*?)\}/g, `:hover {opacity: 1 !important;border: 2px solid red !important}`)
//         cssRulesCache += "iframe {display: none};"

//         await browser.tabs.insertCSS(tab.id, {code: cssRulesCache});

//     }

// })


