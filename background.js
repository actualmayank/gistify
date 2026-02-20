chrome.runtime.onInstalled.addListener(() => {
  console.log("✅ Gistify installed - Context Menu registered");
  chrome.contextMenus.create({
    id: "summarize",
    title: "🧠 Summarize This Text",
    contexts: ["selection"]
  });
});

chrome.contextMenus.onClicked.addListener(async (info, tab) => {
  if (info.menuItemId === "summarize" && info.selectionText) {
    try {
      const response = await fetch("https://tourmaline-gaufre-130bc5.netlify.app/.netlify/functions/summarize", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ text: info.selectionText })
      });

      const data = await response.json();
      const summary = data?.summary || data?.error || "No summary returned.";

      chrome.scripting.executeScript({
        target: { tabId: tab.id },
        func: (summaryText) => {
          const box = document.createElement("div");
          box.style.position = "fixed";
          box.style.top = "20px";
          box.style.right = "20px";
          box.style.background = "#1e1e1e";
          box.style.color = "#fff";
          box.style.padding = "16px";
          box.style.borderRadius = "8px";
          box.style.boxShadow = "0 0 10px rgba(0,0,0,0.3)";
          box.style.zIndex = "999999";
          box.style.fontSize = "14px";
          box.style.maxWidth = "300px";
          box.style.lineHeight = "1.4";
          box.style.fontFamily = "Arial, sans-serif";
          box.innerHTML = `<strong>🧠 Gist:</strong><br>${summaryText}`;

          document.body.appendChild(box);

          setTimeout(() => box.remove(), 5000);
        },
        args: [summary]
      });

    } catch (err) {
      chrome.scripting.executeScript({
        target: { tabId: tab.id },
        func: (msg) => {
          const box = document.createElement("div");
          box.style.position = "fixed";
          box.style.top = "20px";
          box.style.right = "20px";
          box.style.background = "#800000";
          box.style.color = "#fff";
          box.style.padding = "16px";
          box.style.borderRadius = "8px";
          box.style.zIndex = "999999";
          box.style.fontSize = "14px";
          box.style.maxWidth = "300px";
          box.style.fontFamily = "Arial, sans-serif";
          box.innerText = "❌ Error:\n" + msg;

          document.body.appendChild(box);

          setTimeout(() => box.remove(), 9000);
        },
        args: [err.message]
      });
    }
  }
});