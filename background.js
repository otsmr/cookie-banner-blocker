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

        case "blocked-cookie-banner":
            showBlockedIcon(tabId);
            break;
    
        default:
            break;

    }

});

browser.pageAction.onClicked.addListener(async (tab) => {

	const hostname = tab.url.match(hostnameRegex)[1];
	const existing = await browser.storage.sync.get(hostname);
	if (existing[hostname] == "i") {
		// remove from blocklist
		await browser.storage.sync.remove(hostname);
	} else {
		// add to blocklist
		await browser.storage.sync.set({ [hostname]: "i" });
	}
    await browser.tabs.reload(tab.id);
    
});
