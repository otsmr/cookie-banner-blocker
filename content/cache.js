class CSSRuleCache {

    constructor () {
        this.currentCachedSelectors = [];
        this.cacheID = window.location.hostname + "-cache";
    }

    get currentCachedRules () {
        return this.currentCachedSelectors.map(selector => `${selector} { display:none !important; }`).join(" ")
    }

    saveCurrentCachedSelectors () {

        browser.storage.sync.get(window.location.hostname)
        .then(cachedForHostname => {

            browser.storage.sync.set({ [this.cacheID]:  {
                ...cachedForHostname[this.cacheID],
                cachedSelectors: JSON.stringify(this.currentCachedSelectors)
            }}).then(e => {
                this.loadCacheFromStorage();
            })


        })

    }

    async addSelector (selector) {
        
        if (this.currentCachedSelectors.find(e => e === selector)) {
            return;
        }

        this.currentCachedSelectors.push(selector);

        this.saveCurrentCachedSelectors();

    }
    
    async loadCacheFromStorage () {

        const cachedForHostname = await browser.storage.sync.get(this.cacheID);
        let cache = cachedForHostname[this.cacheID];
        
        if (
            cache === undefined ||
            cache.cachedSelectors === undefined ||
            cache.cachedSelectors === "" 
        ) {
            return null;
        }

        return this.currentCachedSelectors = JSON.parse(cache.cachedSelectors);

    }  


}