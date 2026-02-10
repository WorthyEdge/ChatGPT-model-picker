# ChatGPT-model-picker
A seamlessly integrated model picker for ChatGPT that restores access to models previously available to Free and Go users, even after the removal of the legacy model selector.

This userscript injects a native-looking model dropdown into the ChatGPT UI and ensures your selected model is persistently enforced on every conversation request.

> ⚠️ This script is unofficial and not affiliated with OpenAI.

# Features
- Native-style model picker
  - Visually matches ChatGPT's model picker UI design, but with an improved UI
  - Fully integrated into the top bar
- Persistent model selection
  - Your chosen model survives reloads and new chats, as well as new tabs
- Restores removed models
  - Models like GPT-5.1, GPT-5 etc are selectable again for Free/Go users
- Request-level enforcement
  - Ensured ChatGPT doesn't silently reset your model mid-conversation
- Instant switching
  - No page reloads required
# Available Models
Latest section:
- GPT-5.2: Instant/Thinking/Pro/Auto
- GPT-5.1: Instant/Thinking/Pro
- GPT-5: Instant/Thinking/Pro/Mini
Legacy section:
- Chat:
  - GPT-4o
  - GPT-4.1
  - GPT-4.5
- Legacy:
  - o3
  - o4-mini
  - o3-mini
  - o1
  - o1-mini
- Ultra-legacy (Visual only. These models redirect to the latest instant model):
  - GPT-4-Turbo
  - GPT-4
  - GPT-3.5
  - GPT-3
  - GPT-2
  - GPT-1
# NOTE: GPT-5.x Thinking/Pro, GPT-4.1, GPT-4.5, o3, o4-mini, o1 are only available to Plus or higher subscribers.
## Another Note: some models, like o3-mini, o1-mini, and Ultra-legacy are treated as calling the latest instant model and are only there as an example of if OpenAI actually wanted to preserve their model history in ChatGPT

# How It Works (High-Level)
This script does 2 things:
1. UI Injection
   It replaces ChatGPT's model label with a custom dropdown that:
   - Matches the official layout and typography
   - Uses hover submenus for clean categorization
   - Stores your choice locally
2. Request Patching
   Before each /conversation request is sent, the script:
   - Forces the selected model into the request body
   - Ensures conversation_mode.model matches
   - Removes request flags that can cause model fallback
   This prevents ChatGPT from silently reverting to a default model unless the selected model is unavailable
# Installation
1. Install a userscript manager:
   - Tampermonkey
   - Violentmonkey
   - Greasemonkey
2. Install this script from Greasy Fork
3. Open https://chatgpt.com
4. Use the new model picker in the top-left header, where the "ChatGPT" text is present

# Persistence
Your selected model is saved localyl and automatically restored on:
- Page reload
- New chats
- New tabs

# Important Notes
- This script does not grant paid access
- The ChatGPT backend is designed such that you can only talk to models that were available to your subscription in the past
- Behavious may break if ChatGPT's internal APIs change
- Use at your own risk
If OpenAI fully disables a model server-side (such as GPT-3.5), no userscript can revive it. It will simply respond with the latest Instant model

# Intended Audience
This script is for:
- Power users
- Researchers
- Developers
- People who miss having **actual choice**
NOT for:
- Automation
- Abuse
- Circumventing payment systems

# License
MIT
Do whatever you want, just don't pretend it's official

# Credits
Created by Worthy (with a bit of help from Gemini 3 Pro)

Because I wanted to be able to talk to GPT-5.1 because GPT-5.2 is garb
