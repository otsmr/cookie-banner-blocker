const hostnameRegex = /\/\/([\.\-\_\w]+)/i;

function showBlockedIcon (tabId) {

    browser.pageAction.setIcon({ tabId, path: "icons/cookie-bite-solid.svg" });
    browser.pageAction.setTitle({
        tabId,
        title: "Inline Popup Blocker für diese Seite deaktivieren",
    });
    browser.pageAction.show(tabId);

}

function showIgnoredIcon (tabId) {

    browser.pageAction.setIcon({ tabId, path: "icons/cookie-solid.svg" });
    browser.pageAction.setTitle({
        tabId,
        title: "Inline Popup Blocker für diese Seite aktivieren",
    });
    browser.pageAction.show(tabId);

}


// tabUrl is required when a page is loaded for the
// first time. Then this function is called before
// the request is completed. 

async function isIgnoreThisTabEnabled (tabId, tabUrl = null) {

    if (tabId === -1) return;

    try {

        const tab = await browser.tabs.get(tabId);

           
        let hostname = tab.url.match(hostnameRegex);
    
         // ignore no valid hostnames
        if (hostname == null) {

            if (tabUrl) {
                hostname = tabUrl.match(hostnameRegex);
            }
            
            if (hostname == null) return true;

        }
        
        hostname = hostname[1];
    
        const existing = await browser.storage.sync.get(hostname);
    
        if (existing[hostname] == "i") {
            showIgnoredIcon(tabId);
            return true;
        }

    } catch (error) {
        console.log(error);
    }

    return false;

}