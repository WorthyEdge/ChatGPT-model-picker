// ==UserScript==
// @name         ChatGPT model picker + extras
// @author       Worthy
// @match        https://chatgpt.com/*
// @grant        unsafeWindow
// @grant        GM.getValue
// @grant        GM.setValue
// @run-at       document-start
// ==/UserScript==

(function() {
    'use strict';

    // Default state
    let selectedModel = "gpt-5-2";
    let currentButtonName = "5.2 Instant";

    // Async load saved preferences
    (async () => {
        selectedModel = await GM.getValue("model", "gpt-5-2");
        currentButtonName = await GM.getValue("modelLabel", "5.2 Instant");
    })();

    /* ==========================================================================================
       THE BRAINS (Logic from Script 2)
       ========================================================================================== */

    function patchPayload(jsonString) {
        try {
            const body = JSON.parse(jsonString);

            // 1. Force top-level model identifiers
            body.model = selectedModel;
            if (body.model_slug) body.model_slug = selectedModel;

            // 2. Force conversation_mode (The critical fix)
            if (body.conversation_mode) {
                if (typeof body.conversation_mode === 'object') {
                    body.conversation_mode.model = selectedModel;
                    if (!body.conversation_mode.kind) {
                         body.conversation_mode.kind = "primary_assistant";
                    }
                }
            } else {
                body.conversation_mode = {
                    kind: "primary_assistant",
                    model: selectedModel
                };
            }

            // 3. Nuke specific requirements that might reset the model
            if (body.requirements) {
                 delete body.requirements.lat;
                 delete body.requirements.long;
            }

            console.log(`[Model Switcher] Patched request to: ${selectedModel}`);
            return JSON.stringify(body);

        } catch (e) {
            console.error("Payload Patch Error:", e);
            return jsonString;
        }
    }

    const originalFetch = unsafeWindow.fetch;
    unsafeWindow.fetch = async function (input, init) {
        // Case 1: Standard fetch(url, options)
        if (typeof input === "string" && input.includes("/conversation") && init && init.body) {
            init.body = patchPayload(init.body);
        }
        // Case 2: fetch(Request) - frequently used by newer React builds
        else if (input instanceof Request && input.url.includes("/conversation")) {
            try {
                const clone = input.clone();
                const text = await clone.text();
                const newBody = patchPayload(text);

                input = new Request(input, {
                    body: newBody,
                    method: input.method,
                    headers: input.headers,
                    referrer: input.referrer,
                    referrerPolicy: input.referrerPolicy,
                    mode: input.mode,
                    credentials: input.credentials,
                    cache: input.cache,
                    redirect: input.redirect,
                    integrity: input.integrity,
                });
            } catch (err) {
                console.error("Failed to patch Request object:", err);
            }
        }
        return originalFetch.call(this, input, init);
    };


    /* ==========================================================================================
       THE LOOKS (UI from Script 1)
       ========================================================================================== */

    function refreshUI() {
        // Remove original header label if it exists
        const originalLabel = document.querySelector('main .sticky.top-0 h1, main .sticky.top-0 div button[role="combobox"]');
        if (originalLabel) { originalLabel.style.display = 'none'; }

        // Find the insertion point
        const mainHeader = document.querySelector('main .sticky.top-0') || document.querySelector('header.sticky');
        if (!mainHeader || document.getElementById('phantom-naming-picker')) return;

        // Create Container
        const pickerWrap = document.createElement('div');
        pickerWrap.id = 'phantom-naming-picker';
        pickerWrap.style.cssText = "position: absolute; left: 14px; top: 50%; transform: translateY(-50%); z-index: 9999; background-color: #212121; border-radius: 8px;";

        // SVG Fixed: Removed the extra quotes and brackets from your original snippet
        pickerWrap.innerHTML = `
            <div style="position: relative; font-family: Söhne Buch, ui-sans-serif, system-ui;">
                <button id="phantom-btn" style="background: #212121; border: none; color: #ffffff; font-weight: 400; font-size: 18px; cursor: pointer; display: flex; align-items: center; gap: 4px; padding: 6px 3.5px; border-radius: 8px; white-space: nowrap;">
                    ChatGPT <span id="current-model-label" style="color: #b4b4b4; margin-left: 2px;">${currentButtonName}</span>
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round" style="opacity: 0.5; margin-left: 4px;"><path d="m6 9 6 6 6-6"/></svg>
                </button>

                <div id="phantom-menu" style="display: none; position: absolute; top: 115%; left: 0; background: #2f2f2f; border: 1px solid #424242; border-radius: 12px; padding: 4px; width: 220px; box-shadow: 0 10px 25px rgba(0,0,0,0.5);">
                    <div style="padding: 8px 12px; font-size: 11px; font-weight: 600; color: #8e8e93; text-transform: uppercase; letter-spacing: 0.5px;">Latest models</div>

                    ${createCategory("GPT-5.2", [
                        {id: 'gpt-5-2', name: 'GPT-5.2 Instant', display: '5.2 Instant', desc: 'Responds quickly for general chat'},
                        {id: 'gpt-5-2-thinking', name: 'GPT-5.2 Thinking', display: '5.2 Thinking', desc: 'Uses advanced reasoning'},
                        {id: 'gpt-5-2-pro', name: 'GPT-5.2 Pro', display: '5.2 Pro', desc: 'Best at reasoning'},
                        {id: 'auto', name: 'GPT-5.2 Auto', display: '5.2 Auto', desc: 'Automatically adjusts thinking power'}
                    ])}
                    ${createCategory("GPT-5.1", [
                        {id: 'gpt-5-1', name: 'GPT-5.1 Instant', display: '5.1 Instant', desc: 'Great for general chat'},
                        {id: 'gpt-5-1-thinking', name: 'GPT-5.1 Thinking', display: '5.1 Thinking', desc: 'Uses advanced reasoning'},
                        {id: 'gpt-5-1-pro', name: 'GPT-5.1 Pro', display: '5.1 Pro', desc: 'Previous best at reasoning'}
                    ])}
                    ${createCategory("GPT-5", [
                        {id: 'gpt-5', name: 'GPT-5 Instant', display: '5 Instant', desc: 'Previous flagship for general chat'},
                        {id: 'gpt-5-thinking', name: 'GPT-5 Thinking', display: '5 Thinking', desc: 'Uses advanced reasoning'},
                        {id: 'gpt-5-pro', name: 'GPT-5 Pro', display: '5 Pro', desc: 'Previous best at reasoning'},
                        {id: 'gpt-5-mini', name: 'GPT-5 Mini', display: '5 Mini', desc: 'Fastest for everyday tasks'}
                    ])}

                    <div style="height: 1px; background: #424242; margin: 4px 8px;"></div>
                    <div style="padding: 8px 12px; font-size: 11px; font-weight: 600; color: #8e8e93; text-transform: uppercase; letter-spacing: 0.5px;">Legacy models</div>

                    ${createCategory("Chat", [
                        {id: 'gpt-4o', name: 'GPT-4o', display: '4o', desc: 'Great for most tasks'},
                        {id: 'gpt-4-1', name: 'GPT-4.1', display: '4.1', desc: 'Great for quick coding'},
                        {id: 'gpt-4-5', name: 'GPT-4.5', display: '4.5', desc: 'Powerful for creative writing'}
                    ])}
                    ${createCategory("Thinking", [
                        {id: 'o3', name: 'o3', display: 'o3', desc: 'Uses advanced reasoning'},
                        {id: 'o4-mini', name: 'o4-mini', display: 'o4-mini', desc: 'Fastest at reasoning'},
                        {id: 'o3-mini', name: 'o3-mini', display: 'o3-mini', desc: 'Previous fastest at reasoning'},
                        {id: 'o1', name: 'o1', display: 'o1', desc: 'First to do reasoning'},
                        {id: 'o1-mini', name: 'o1-mini', display: 'o1-mini', desc: 'First at speed-optimised reasoning'},
                    ])}
                    ${createCategory("Ultra-legacy", [
                        {id: 'gpt-4-turbo', name: 'GPT-4-Turbo', display: '4 Turbo', desc: 'Faster for high-intelligence tasks'},
                        {id: 'gpt-4', name: 'GPT-4', display: '4', desc: 'Made for high-intelligence tasks'},
                        {id: 'gpt-3-5', name: 'GPT-3.5', display: '3.5', desc: 'First to be used in ChatGPT'},
                        {id: 'text-davinci-001', name: 'GPT-3', display: '3', desc: 'First to have human-like speech'},
                        {id: 'gpt2', name: 'GPT-2', display: '2', desc: 'First large-scale GPT'},
                        {id: 'openai-gpt', name: 'GPT-1', display: '1', desc: 'First ever GPT'}
                    ])}
                </div>
            </div>
        `;

        mainHeader.appendChild(pickerWrap);
        setupLogic();
    }

    function createCategory(title, models) {
        let subItems = models.map(m => `
            <div class="model-opt" data-id="${m.id}" data-btn-label="${m.display}" style="padding: 8px 12px; cursor: pointer; border-radius: 8px; color: #ececf1; display: flex; flex-direction: column; white-space: nowrap;">
                <span style="font-weight: 500; font-size: 13px;">${m.name}</span>
                <span style="font-size: 10px; color: #b4b4b4;">${m.desc}</span>
            </div>
        `).join('');

        return `
            <div class="cat-item" style="position: relative; padding: 10px 12px; cursor: default; border-radius: 8px; color: #ececf1; font-size: 14px; display: flex; align-items: center; justify-content: space-between;">
                ${title}
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" style="opacity: 0.5;"><path d="m9 18 6-6-6-6"/></svg>
                <div class="sub-menu" style="display: none; position: absolute; left: 98%; top: -4px; background: #2f2f2f; border: 1px solid #424242; border-radius: 12px; padding: 4px; width: 230px; box-shadow: 10px 10px 25px rgba(0,0,0,0.5);">
                    ${subItems}
                </div>
            </div>
        `;
    }

    function setupLogic() {
        const btn = document.getElementById('phantom-btn');
        const menu = document.getElementById('phantom-menu');
        const label = document.getElementById('current-model-label');

        btn.onclick = (e) => { e.stopPropagation(); menu.style.display = menu.style.display === 'none' ? 'block' : 'none'; };
        document.addEventListener('click', () => menu.style.display = 'none');

        document.querySelectorAll('.cat-item').forEach(cat => {
            const sub = cat.querySelector('.sub-menu');
            cat.onmouseenter = () => { sub.style.display = 'block'; cat.style.background = '#3e3e3e'; };
            cat.onmouseleave = () => { sub.style.display = 'none'; cat.style.background = 'none'; };
        });

        document.querySelectorAll('.model-opt').forEach(opt => {
            opt.onmouseover = (e) => { e.stopPropagation(); opt.style.background = '#4e4e4e'; };
            opt.onmouseout = () => opt.style.background = 'none';
            opt.onclick = async (e) => {
                e.stopPropagation();

                // Update State
                selectedModel = opt.getAttribute('data-id');
                currentButtonName = opt.getAttribute('data-btn-label');

                // Update UI
                label.innerText = currentButtonName;
                menu.style.display = 'none';

                // Save to Storage (So it remembers after refresh)
                await GM.setValue("model", selectedModel);
                await GM.setValue("modelLabel", currentButtonName);

                console.log(`[UI] Switched to ${selectedModel}`);
            };
        });
    }

    // Keep the UI alive
    setInterval(refreshUI, 500);
})();