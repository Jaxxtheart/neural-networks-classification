# AlphaEdge — Setup Guide

## Hosting the Website

### Option A — GitHub Pages (Free, Recommended)
1. Push this repo to GitHub
2. Go to **Settings → Pages → Source → main branch / `trading/` folder**
3. Your site will be live at `https://yourusername.github.io/repo-name/trading/`

### Option B — Netlify (Free, instant HTTPS)
1. Drag the `trading/` folder to [netlify.com/drop](https://netlify.com/drop)
2. Get a live URL instantly — no account needed

### Option C — Local
```bash
cd trading/
python3 -m http.server 8080
# Open http://localhost:8080
```

---

## Setting Up Email Push Notifications (EmailJS)

EmailJS lets you send emails from pure JavaScript — no backend required.

### Step 1 — Create a free EmailJS account
1. Go to [emailjs.com](https://www.emailjs.com/) and sign up (free tier: 200 emails/month)
2. Add an **Email Service** (Gmail, Outlook, etc.) under **Email Services**
3. Copy your **Service ID**

### Step 2 — Create an Email Template
1. Go to **Email Templates → Create New Template**
2. Use this template body:

```
Subject: AlphaEdge — Trading Signal Alert

Hi {{to_name}},

You have a new signal from the AlphaEdge system:

Strategy: {{strategy}}
Start Date: {{start_date}}

You'll receive real-time signals for BTC, ETH, SOL, and AVAX.

Stay disciplined. Follow the rules. Let the edge compound.

— AlphaEdge System
```

3. Copy your **Template ID**

### Step 3 — Get your Public Key
1. Go to **Account → General → Public Key**
2. Copy the key

### Step 4 — Paste into index.html
Open `trading/index.html` and find these three lines near the bottom:

```js
const EMAILJS_SERVICE_ID  = 'YOUR_SERVICE_ID';   // ← replace
const EMAILJS_TEMPLATE_ID = 'YOUR_TEMPLATE_ID';  // ← replace
const EMAILJS_PUBLIC_KEY  = 'YOUR_PUBLIC_KEY';   // ← replace
```

Replace the placeholder strings with your real values.

### Step 5 — Test
Open the site, enter your own email, and click **Subscribe Free**.
You should receive the welcome email within seconds.

---

## Sending Ongoing Signal Alerts

To broadcast signals to all subscribers (stored in `localStorage`), use this
snippet in your browser console on the hosted page:

```js
// Get all subscriber emails
const subs = JSON.parse(localStorage.getItem('ae_subscribers') || '[]');
console.log('Subscribers:', subs);

// Send a signal email to all subscribers
subs.forEach(email => {
  emailjs.send('YOUR_SERVICE_ID', 'YOUR_TEMPLATE_ID', {
    to_email: email,
    to_name: email.split('@')[0],
    strategy: 'BTC ENTRY SIGNAL — Target $114,000 | Stop $90,250',
    start_date: new Date().toLocaleDateString(),
  });
});
```

> For a production system with many subscribers, migrate to a backend (Node.js +
> SendGrid/Mailgun) and store emails in a database. EmailJS's free tier is ideal
> for getting started.

---

## Live Price Data

Prices are fetched from the **CoinGecko free API** (no API key required).
The site refreshes prices every **30 seconds** automatically.

If you hit rate limits (60 calls/minute on free tier), simply increase the
interval in `index.html`:

```js
setInterval(fetchPrices, 60000);  // change to 60 seconds
```
