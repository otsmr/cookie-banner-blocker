// function saveOptions(e) {
//     browser.storage.sync.set({
//         configs: {},
//     });
//     e.preventDefault();
// }

// function restoreOptions() {

//   var configs = browser.storage.managed.get("configs");

//   storageItem.then((res) => {
//     document.querySelector("#managed-colour").innerText = res.colour;
//   });

//   var gettingItem = browser.storage.sync.get("colour");
//   gettingItem.then((res) => {
//     document.querySelector("#colour").value = res.colour || "Firefox red";
//   });
// }

// document.addEventListener("DOMContentLoaded", restoreOptions);
// document.querySelector("form").addEventListener("submit", saveOptions);
