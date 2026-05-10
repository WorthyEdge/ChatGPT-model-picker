// ==UserScript==
// @name         ChatGPT model picker + extras
// @author       Worthy
// @match        https://chatgpt.com/
// @match        https://chatgpt.com/c/*
// @grant        unsafeWindow
// @grant        GM.getValue
// @grant        GM.setValue
// @run-at       document-start
// @version      1.03
// @license      MIT
// ==/UserScript==

(async function() {
'use strict';

/* ==========================================================================================
   LOAD SAVED STATE FIRST
   ========================================================================================== */

let selectedModel = await GM.getValue("model", "auto");
let currentButtonName = await GM.getValue("modelLabel", "Auto");

/* ==========================================================================================
   THE BRAINS
   ========================================================================================== */

function patchPayload(jsonString) {
    try {
        const body = JSON.parse(jsonString);

        body.model = selectedModel;
        body.model_slug = selectedModel;
        body.custom_model = selectedModel;

        body.conversation_mode = {
            kind: "primary_assistant",
            model: selectedModel
        };

        if (body.requirements) {
            delete body.requirements.lat;
            delete body.requirements.long;
        }

        if (body.messages && Array.isArray(body.messages)) {
            body.messages.forEach(msg => {
                if (!msg.metadata) msg.metadata = {};
                msg.metadata.model_slug = selectedModel;
                msg.metadata.requested_model = selectedModel;
            });
        }

        return JSON.stringify(body);

    } catch {
        return jsonString;
    }
}

/* ==========================================================================================
   FETCH HOOK
   ========================================================================================== */

const originalFetch = unsafeWindow.fetch;

unsafeWindow.fetch = async function(input, init = {}) {

    if (typeof input === "string" && input.includes("/conversation") && init?.body) {
        init.body = patchPayload(init.body);

        if (!init.headers) init.headers = {};
        if (init.headers instanceof Headers) {
            init.headers.set("OpenAI-Model", selectedModel);
            init.headers.set("x-openai-model", selectedModel);
        } else {
            init.headers["OpenAI-Model"] = selectedModel;
            init.headers["x-openai-model"] = selectedModel;
        }
    }

    else if (input instanceof Request && input.url.includes("/conversation")) {
        try {
            const clone = input.clone();
            const text = await clone.text();
            const newBody = patchPayload(text);

            const newHeaders = new Headers(input.headers);
            newHeaders.set("OpenAI-Model", selectedModel);
            newHeaders.set("x-openai-model", selectedModel);

            input = new Request(input, {
                body: newBody,
                method: input.method,
                headers: newHeaders,
                referrer: input.referrer,
                referrerPolicy: input.referrerPolicy,
                mode: input.mode,
                credentials: input.credentials,
                cache: input.cache,
                redirect: input.redirect,
                integrity: input.integrity,
            });
        } catch {}
    }

    return originalFetch.call(this, input, init);
};

/* ==========================================================================================
   XHR HOOK
   ========================================================================================== */

const origOpen = XMLHttpRequest.prototype.open;
const origSend = XMLHttpRequest.prototype.send;

XMLHttpRequest.prototype.open = function(method, url) {
    this._url = url;
    return origOpen.apply(this, arguments);
};

XMLHttpRequest.prototype.send = function(body) {
    try {
        if (this._url?.includes("/conversation") && body) {
            body = patchPayload(body);
            this.setRequestHeader("OpenAI-Model", selectedModel);
            this.setRequestHeader("x-openai-model", selectedModel);
        }
    } catch {}
    return origSend.call(this, body);
};

/* ==========================================================================================
   THE LOOKS
   ========================================================================================== */

function refreshUI() {

    const originalLabel = document.querySelector('main .sticky.top-0 h1, main .sticky.top-0 div button[role="combobox"]');
    if (originalLabel) originalLabel.style.display = 'none';

    const mainHeader = document.querySelector('main .sticky.top-0') || document.querySelector('header.sticky');
    if (!mainHeader || document.getElementById('phantom-naming-picker')) return;

    const pickerWrap = document.createElement('div');
    pickerWrap.id = 'phantom-naming-picker';
    pickerWrap.style.cssText = "position: absolute; left: 14px; top: 50%; transform: translateY(-50%); z-index: 9999; background-color: #212121; border-radius: 20px;";

    pickerWrap.innerHTML = `
        <div style="position: relative; font-family: Söhne Buch, ui-sans-serif, system-ui;">
            <button id="phantom-btn" style="background: #000000; border: none; color: #ffffff; font-weight: 400; font-size: 18px; cursor: pointer; display: flex; align-items: center; gap: 4px; padding: 6px 3.5px; border-radius: 20px; white-space: nowrap;">
                ChatGPT <span id="current-model-label" style="color: #b4b4b4; margin-left: 2px;">${currentButtonName}</span>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round" style="opacity: 0.5; margin-left: 4px;"><path d="m6 9 6 6 6-6"/></svg>
            </button>

            <div id="phantom-menu" style="display: none; position: absolute; top: 115%; left: 0; background: #00000; border: 1px solid #000000; border-radius: 20px; padding: 4px; width: 220px; box-shadow: 0 0px 20px rgba(255,255,255,0.5);">

                <div style="padding: 8px 12px; font-size: 11px; font-weight: 600; color: #8e8e93; text-transform: uppercase; letter-spacing: 0.5px;">Latest models</div>

                ${createCategory("Instant", [
                    {id: 'gpt-5-5', name: 'GPT-5.5', display: '5.5 Instant', desc: 'Autistic genius'},
                    {id: 'gpt-5-3', name: 'GPT-5.3', display: '5.3 Instant', desc: 'Keeps responses concise'},
                    {id: 'gpt-5-2', name: 'GPT-5.2', display: '5.2 Instant', desc: 'Leans heavily analytical'},
                    {id: 'gpt-5-1', name: 'GPT-5.1', display: '5.1 Instant', desc: 'Naturally conversational'},
                    {id: 'gpt-5', name: 'GPT-5', display: '5 Instant', desc: 'Defaults to formality'},
                    {id: 'gpt-5-3-mini', name: 'GPT-5.3 mini', display: '5.3 mini', desc: 'Faster for everyday tasks'},
                    {id: 'gpt-5-mini', name: 'GPT-5 mini', display: '5 mini', desc: 'Previous fastest for everyday tasks'}
                ])}
                ${createCategory("Thinking", [
                    {id: 'gpt-5-5', name: 'GPT-5.5 Thinking', display: '5.5 Thinking', desc: 'A new class of intelligence'},
                    {id: 'gpt-5-4', name: 'GPT-5.4 Thinking', display: '5.4 Thinking', desc: 'Broadly capable reasoning'},
                    {id: 'gpt-5-2-thinking', name: 'GPT-5.2 Thinking', display: '5.2 Thinking', desc: 'Leans heavily exacting and clinical'},
                    {id: 'gpt-5-1-thinking', name: 'GPT-5.1 Thinking', display: '5.1 Thinking', desc: 'Reasons with genuine warmth'},
                    {id: 'gpt-5-thinking', name: 'GPT-5 Thinking', display: '5 Thinking', desc: 'Structured with a reserved tone'},
                    {id: 'gpt-5-4-thinking-mini', name: 'GPT-5.4 Thinking mini', display: '5.4 Thinking mini', desc: 'Fastest at reasoning'},
                    {id: 'gpt-5-mini-thinking', name: 'GPT-5 Thinking mini', display: '5 Thinking mini', desc: 'Previous fastest at reasoning'}
                ])}

                ${createCategory("Pro", [
                    {id: 'gpt-5-5-pro', name: 'GPT-5.5 Pro', display: '5.5 Pro', desc: 'Research-grade intelligence'},
                    {id: 'gpt-5-4-pro', name: 'GPT-5.4 Pro', display: '5.4 Pro', desc: 'Previous best at reasoning'},
                    {id: 'gpt-5-2-pro', name: 'GPT-5.2 Pro', display: '5.2 Pro', desc: 'Former best at reasoning'},
                    {id: 'gpt-5-1-pro', name: 'GPT-5.1 Pro', display: '5.1 Pro', desc: 'Legacy best at reasoning'},
                    {id: 'gpt-5-pro', name: 'GPT-5 Pro', display: '5 Pro', desc: 'Legacy best at reasoning'},
                ])}

                <div style="height: 1px; background: #424242; margin: 4px 8px;"></div>
                <div style="padding: 8px 12px; font-size: 11px; font-weight: 600; color: #8e8e93; text-transform: uppercase; letter-spacing: 0.5px;">Legacy models</div>

                ${createCategory("Chat", [
                    {id: 'gpt-4o', name: 'GPT-4o', display: '4o', desc: 'Great for most tasks'},
                    {id: 'gpt-4-1', name: 'GPT-4.1', display: '4.1', desc: 'Great for quick coding'},
                    {id: 'gpt-4-5', name: 'GPT-4.5', display: '4.5', desc: 'Powerful for creative writing'},
                    {id: 'gpt-4-1-mini', name: 'GPT-4.1-mini', display: '4.1-mini', desc: 'Faster for structured tasks'},
                    {id: 'gpt-4o-mini', name: 'GPT-4o-mini', display: '4o-mini', desc: 'Faster for general tasks'}
                ])}

                ${createCategory("Reasoning", [
                    {id: 'o3', name: 'o3', display: 'o3', desc: 'Uses advanced reasoning'},
                    {id: 'o3-pro', name: 'o3-Pro', display: 'o3 Pro', desc: 'Former best at reasoning'},
                    {id: 'o4-mini', name: 'o4-mini', display:'o4-mini', desc:'Fastest at reasoning'},
                    {id: 'o3-mini', name: 'o3-mini', display:'o3-mini', desc:'Previous fastest at reasoning'},
                    {id: 'o1', name:'o1', display:'o1', desc:'First to do reasoning'},
                    {id: 'o1-pro', name: 'o1-Pro', display: 'o1-Pro', desc: 'First for research-grade intelligence'},
                    {id: 'o1-mini', name: 'o1-mini', display: 'o1-mini', desc: 'First at speed-optimised reasoning'}
                ])}

                ${createCategory("Foundation", [
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
        <div class="model-opt" data-id="${m.id}" data-btn-label="${m.display}" style="padding: 10px 12px; cursor: pointer; border-radius: 16px; color: #ffffff; display: flex; flex-direction: column; white-space: nowrap;">
            <span style="font-weight: 500; font-size: 13px;">${m.name}</span>
            <span style="font-size: 10px; color: #b4b4b4;">${m.desc}</span>
        </div>
    `).join('');

    return `
        <div class="cat-item" style="position: relative; padding: 10px 12px; cursor: default; border-radius: 16px; color: #ffffff; font-size: 14px; display: flex; align-items: center; justify-content: space-between;">
            ${title}
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" style="opacity: 0.5;"><path d="m9 18 6-6-6-6"/></svg>
            <div class="sub-menu" style="display: none; position: absolute; left: 98%; top: -4px; background: #000000; border: 1px solid #000000; border-radius: 20px; padding: 5px; width: 230px; box-shadow: 0px 0px 20px rgba(255,255,255,0.5);">
                ${subItems}
            </div>
        </div>
    `;
}

function setupLogic() {

    const btn = document.getElementById('phantom-btn');
    const menu = document.getElementById('phantom-menu');
    const label = document.getElementById('current-model-label');

    btn.onclick = e => { e.stopPropagation(); menu.style.display = menu.style.display==='none'?'block':'none'; };
    document.addEventListener('click',()=>menu.style.display='none');

    document.querySelectorAll('.cat-item').forEach(cat=>{
        const sub=cat.querySelector('.sub-menu');
        cat.onmouseenter=()=>{sub.style.display='block';cat.style.background='#222222';};
        cat.onmouseleave=()=>{sub.style.display='none';cat.style.background='none';};
    });

    document.querySelectorAll('.model-opt').forEach(opt=>{
        opt.onmouseover=e=>{e.stopPropagation();opt.style.background='#222222';};
        opt.onmouseout=()=>opt.style.background='none';
        opt.onclick=async e=>{
            e.stopPropagation();
            selectedModel=opt.getAttribute('data-id');
            currentButtonName=opt.getAttribute('data-btn-label');
            label.innerText=currentButtonName;
            menu.style.display='none';
            await GM.setValue("model",selectedModel);
            await GM.setValue("modelLabel",currentButtonName);
        };
    });
}

setInterval(refreshUI,500);

})();
