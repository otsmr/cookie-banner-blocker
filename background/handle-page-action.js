let showPageActionIcons = {}
let detectedCookieConsentRedirects = [];
const magicUserAgent = "bingbot";
const urlConsentPageKeywords = [ "consent", "zustimmung" ]

browser.runtime.onMessage.addListener((msg, sender) => {
    const tabId = sender.tab.id;

    if (msg === "blocked")
        showBlockedIcon(tabId);

});

browser.pageAction.onClicked.addListener(async (tab) => {

    const hostname = tab.url.match(hostnameRegex)[1];
    const cacheName = hostname + "-cache";
    
	if (await isIgnoreThisTabEnabled(tab.id)) {
		// remove from blocklist
		await browser.storage.sync.remove(hostname);
	} else {
        // add to blocklist
        await browser.storage.sync.remove(cacheName);
		await browser.storage.sync.set({ [hostname]: "i" });
        detectedCookieConsentRedirects = []
	}
    await browser.tabs.reload(tab.id);
    
});


browser.tabs.onUpdated.addListener(async (tabId) => {
            
    if (await isIgnoreThisTabEnabled(tabId)) {
        return showIgnoredIcon(tabId);
    }
    
    if (showPageActionIcons[tabId]) {
        showBlockedIcon(tabId);
    }

})