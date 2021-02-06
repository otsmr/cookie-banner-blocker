const hostnameRegex = /\/\/([\.\-\_\w]+)/i;

function showBlockedIcon (tabId) {

    browser.pageAction.setIcon({ tabId, path: "icons/cookie-bite-solid.svg" });
    browser.pageAction.setTitle({
        tabId,
        title: "Disable popup blocking for this site",
    });
    browser.pageAction.show(tabId);

}

function showIgnoredIcon (tabId) {

    browser.pageAction.setIcon({ tabId, path: "icons/cookie-solid.svg" });
    browser.pageAction.setTitle({
        tabId,
        title: "Enable popup blocking for this site",
    });
    browser.pageAction.show(tabId);

}

async function isIgnoreThisTabEnabled (tabId) {


    try {

        const tab = await browser.tabs.get(tabId);
    
        let hostname = tab.url.match(hostnameRegex);
    
         // ignore no valid hostnames
        if (hostname == null) return true;
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