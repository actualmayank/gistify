document.addEventListener("DOMContentLoaded", () => {
  const API_URL = "https://tourmaline-gaufre-130bc5.netlify.app/.netlify/functions/summarize";
  const summarizeBtn = document.getElementById("summarize-btn");
  const outputEl = document.getElementById("output");
  const spinner = document.getElementById("spinner");
  const copyBtn = document.getElementById("copy-btn");
  const toast = document.getElementById("toast");
  const historyDiv = document.getElementById("history");
  const toggleTheme = document.getElementById("toggle-theme");

  chrome.storage.local.get(["theme"], (result) => {
    const savedTheme = result.theme || "dark";
    document.body.className = savedTheme;
    toggleTheme.textContent = savedTheme === "dark" ? "🌙" : "☀️";
  });

  toggleTheme.addEventListener("click", () => {
    const isCurrentlyDark = document.body.classList.contains("dark");
    const newTheme = isCurrentlyDark ? "light" : "dark";
    document.body.classList.remove("light", "dark");
    document.body.classList.add(newTheme);
    toggleTheme.textContent = newTheme === "dark" ? "🌙" : "☀️";
    chrome.storage.local.set({ theme: newTheme });
  });

  summarizeBtn.addEventListener("click", () => {
    spinner.classList.remove("hidden");
    outputEl.textContent = "";
    copyBtn.classList.add("hidden");

    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      chrome.scripting.executeScript(
        {
          target: { tabId: tabs[0].id },
          func: () => window.getSelection().toString(),
        },
        async (injectionResults) => {
          const selectedText = injectionResults[0].result;

          if (!selectedText || selectedText.length < 20) {
            spinner.classList.add("hidden");
            outputEl.textContent = "📄 Please select at least 20 characters.";
            return;
          }

          try {
            const response = await fetch(API_URL, {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ text: selectedText }),
            });

            const data = await response.json();
            spinner.classList.add("hidden");

            if (data.summary) {
              outputEl.textContent = "📝 " + data.summary;
              copyBtn.classList.remove("hidden");

              
              chrome.storage.local.get(["summaries"], (res) => {
                const summaries = res.summaries || [];
                summaries.unshift(data.summary);
                chrome.storage.local.set({ summaries: summaries.slice(0, 5) });
              });
            } else {
              outputEl.textContent = "❌ Failed: " + (data.error || "Unknown error");
            }
          } catch (err) {
            spinner.classList.add("hidden");
            outputEl.textContent = "🚨 API error: " + err.message;
          }
        }
      );
    });
  });

  
  copyBtn.addEventListener("click", () => {
    navigator.clipboard.writeText(outputEl.textContent);
    toast.classList.remove("hidden");
    setTimeout(() => toast.classList.add("hidden"), 9000); // ⏱ 9s timeout
  });

  
  chrome.storage.local.get(["summaries"], (res) => {
    const summaries = res.summaries || [];
    summaries.forEach((s, i) => {
      const p = document.createElement("p");
      p.textContent = `#${i + 1} → ${s}`;
      historyDiv.appendChild(p);
    });
  });
});