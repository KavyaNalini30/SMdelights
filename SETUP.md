# SM Delights — Setup & Launch Guide

This guide walks you through everything needed to take the SM Delights website from this folder to a live shop
taking real payments. No coding is needed — just follow the steps in order. Each part says roughly how long it takes.

> **Keep these safe and private:** every "key", "secret" and password in this guide. Never paste them into
> WhatsApp, email, GitHub or screenshots. They only ever go into `.env.local` (on your computer) and Vercel's
> Environment Variables screen.

**Contents**

1. [Run the site on your computer](#1-run-the-site-on-your-computer)
2. [Set up Supabase (database, logins, photos)](#2-set-up-supabase-database-logins-photos)
3. [Set up Razorpay (payments)](#3-set-up-razorpay-payments)
4. [Fill in `.env.local`](#4-fill-in-envlocal)
5. [Put the site online with Vercel](#5-put-the-site-online-with-vercel)
6. [After the domain is live: update Supabase and Razorpay](#6-after-the-domain-is-live-update-supabase-and-razorpay)
7. [Test a full order](#7-test-a-full-order)
8. [Running the shop: the admin panel](#8-running-the-shop-the-admin-panel)
9. [Pre-launch checklist](#9-pre-launch-checklist)
10. [Things still needed from the client](#10-things-still-needed-from-the-client)
11. [Order emails and WhatsApp messages (Resend + WhatsApp Cloud API)](#11-order-emails-and-whatsapp-messages-resend--whatsapp-cloud-api)

---

## 1. Run the site on your computer

*About 10 minutes.*

**Install once:**

- **Node.js 22 or newer** — download the "LTS" version from <https://nodejs.org> and install it with the default options.
- **Git** — <https://git-scm.com/downloads> (already installed on this computer).
- A code editor such as **VS Code** (already installed).

**Run the site:**

1. Open the `SMdelights` folder in VS Code.
2. Open a terminal: menu **Terminal → New Terminal**.
3. Install the project's building blocks (first time only, and whenever `package.json` changes):
   ```
   npm install
   ```
4. Make your settings file from the template (first time only):
   ```
   copy .env.example .env.local
   ```
   (On Mac: `cp .env.example .env.local`.) You'll fill it in during step 4.
5. Start the site:
   ```
   npm run dev
   ```
6. Open <http://localhost:3000> in your browser. Press **Ctrl + C** in the terminal to stop it.

Until Supabase is connected (step 2), the home page shows a "menu isn't connected yet" note — that's expected.

**Useful commands**

| Command | What it does |
|---|---|
| `npm run dev` | Runs the site on your computer, refreshing as files change |
| `npm run build` | Checks the whole site builds without errors (do this before publishing) |
| `npm test` | Runs the automatic checks for checkout, prices and payment signatures |
| `npm run images` | Re-creates the optimised photos in `public/images` from the original `Images/` folder |

---

## 2. Set up Supabase (database, logins, photos)

*About 20 minutes.* Supabase stores the menu, orders, customer accounts and product photos.

### 2.1 Create the project

1. Go to <https://supabase.com>, sign up (the **Free** plan is enough to start) and click **New project**.
2. **Name:** `smdelights`. **Database password:** click *Generate*, then save it in your password manager.
3. **Region:** choose **Mumbai (ap-south-1)** — closest to Chennai, so the site is fastest.
4. Click **Create new project** and wait a minute or two.

### 2.2 Run the SQL files (in this exact order)

The files are in the `supabase/` folder. For **each** file:

1. In Supabase, open **SQL Editor** (left menu) → **New query**.
2. Open the file in VS Code, select everything (**Ctrl + A**), copy (**Ctrl + C**), and paste into the SQL editor.
3. Click **Run**. You should see "Success" (no red error).

| Order | File | What it does |
|---|---|---|
| 1 | `01_schema.sql` | Creates all the tables (products, orders, customers …) |
| 2 | `02_rls_policies.sql` | Security rules — who can see and change what |
| 3 | `03_seed_data.sql` | Loads the full menu and prices from the client's document. The last step shows a table: 6 categories, 42 products |
| 4 | `04_storage.sql` | Creates the photo storage for the admin panel |
| 5 | `05_make_admin.sql` | **Run this later** — in step 2.5, after you've signed up on the site |
| 6 | `06_remove_products.sql` | Removes the Brownie Family Box, Fruit & Nut Cake and Cookie Tin; sets the new photos |
| 7 | `07_delivery_and_notifications.sql` | Courier delivery (zones for TN, Karnataka, Kerala, Andhra; weight-based rates), fast delivery on WhatsApp, product weights, and the order-notification log. The last step lists the six delivery areas |

⚠ **`07` must be run before the new website code goes live** (on your computer or Vercel) — the shop reads the new
weight and courier-rate columns and shows an error without them.

All files are safe to run again if something goes wrong part-way. ⚠ Don't re-run `03_seed_data.sql` after the
client has started editing prices in the admin panel — it resets the original products to the document's prices.

### 2.3 Copy the API keys

In Supabase: **Project Settings → API** (or **API Keys**). Copy into `.env.local` (see step 4):

| Supabase shows | Goes into `.env.local` as |
|---|---|
| Project URL | `NEXT_PUBLIC_SUPABASE_URL` |
| `anon` / publishable key | `NEXT_PUBLIC_SUPABASE_ANON_KEY` |
| `service_role` / secret key | `SUPABASE_SERVICE_ROLE_KEY` ⚠ secret — full access to the database |

### 2.4 Configure logins (Authentication)

1. **Authentication → Sign In / Providers → Email**: make sure **Email** is enabled and **Confirm email** is ON.
   Other providers (Google, phone) can stay off.
2. **Authentication → URL Configuration**:
   - **Site URL:** `http://localhost:3000` for now (you'll change it in step 6).
   - **Redirect URLs** — add: `http://localhost:3000/auth/callback`
3. **Authentication → Emails (Templates)** — optional but recommended: personalise the *Confirm signup* and *Reset
   password* emails, e.g. subject "Confirm your SM Delights account". Keep the `{{ .ConfirmationURL }}` link in the text.
4. **Before launch — set up your own email sender (important).** Supabase's built-in email only sends a handful
   of emails per hour and is meant for testing. Real customers signing up need a proper sender:
   - Use the same **Resend** account as the order emails (section 11) once the shop's domain is verified there.
   - In Supabase: **Authentication → Emails → SMTP Settings** → enable custom SMTP and enter: host `smtp.resend.com`,
     port `465`, username `resend`, password = a Resend API key, sender email `no-reply@yourdomain.in`,
     sender name `SM Delights`.

### 2.5 Make yourself (and the client) an admin

1. With the site running (`npm run dev`), open <http://localhost:3000/account/signup> and create an account with
   the email that should manage the shop. Click the link in the confirmation email.
2. In Supabase **SQL Editor**, open `05_make_admin.sql`, replace `REPLACE-WITH-YOUR-EMAIL@example.com` with that
   email, and click **Run**. The result should show your email with role `admin`.
3. Visit <http://localhost:3000/admin>. Repeat for the client's own email.

---

## 3. Set up Razorpay (payments)

*About 15 minutes to start testing; activation for real payments takes a few working days.*

Until you add Razorpay keys, the site runs in **demo mode**: checkout works end to end, but no money is taken and
orders are labelled **"Demo payment"**. Adding the keys switches to real Razorpay checkout — no code changes.

### 3.1 Create the account and get test keys

1. Sign up at <https://razorpay.com> with the business owner's details.
2. Make sure the dashboard is in **Test Mode** (toggle at the top).
3. **Account & Settings → API Keys → Generate Test Key.** Copy both values straight away — the secret is shown only once:
   - **Key Id** (starts with `rzp_test_`) → `RAZORPAY_KEY_ID`
   - **Key Secret** → `RAZORPAY_KEY_SECRET` ⚠ secret
4. Make sure payments are captured automatically: **Account & Settings → Payment capture** → *Automatic* (the default).

### 3.2 Set up the webhook

A webhook lets Razorpay tell the site "this order was paid" even if the customer closes their phone straight after paying.

1. **Account & Settings → Webhooks → Add New Webhook.**
2. **Webhook URL:** `https://YOUR-DOMAIN/api/razorpay/webhook` — use your Vercel address from step 5 until the
   custom domain is live (e.g. `https://smdelights.vercel.app/api/razorpay/webhook`). Razorpay can't reach `localhost`.
3. **Secret:** make up a long random password (e.g. from your password manager) and save it → `RAZORPAY_WEBHOOK_SECRET`.
4. **Active events:** tick `payment.captured`, `payment.failed` and `order.paid`. Save.

### 3.3 Activate the account for real payments (KYC)

In the Razorpay dashboard, complete **Activation / KYC**. Have these ready:

- PAN card (personal PAN for an individual / sole proprietor; business PAN for a company or partnership)
- Bank account for payouts — cancelled cheque or bank statement in the same name as the PAN/business
- Address proof (Aadhaar, passport, utility bill …)
- Business proof if registered — e.g. GST certificate, Udyam/MSME registration or **FSSAI licence** (food businesses
  should have FSSAI registration in any case)
- Website details — Razorpay checks that the site has these pages, which are already built:
  - Contact: `/contact`
  - Terms & Conditions: `/policies/terms`
  - Privacy Policy: `/policies/privacy`
  - Refund & Cancellation: `/policies/refund`
  - Shipping & Delivery: `/policies/shipping`
  - Product prices visible on the site

  ⚠ Ask the client to review the highlighted text on the four policy pages **before** applying (see section 10).

### 3.4 Switch to live payments (after activation)

1. Switch the dashboard to **Live Mode** → **API Keys → Generate Live Key**.
2. Create the webhook again in Live Mode (same URL and events; a new secret).
3. In **Vercel → Settings → Environment Variables**, replace the three Razorpay values with the live ones (step 5.3),
   then **redeploy** (Deployments → ⋯ → Redeploy).
4. Place one small real order (e.g. a ₹69 hot chocolate for pickup) and refund it from the Razorpay dashboard to confirm everything works.

---

## 4. Fill in `.env.local`

Open `.env.local` in VS Code (it's in the project root; it's never uploaded to GitHub) and fill it in:

```
NEXT_PUBLIC_SITE_URL=http://localhost:3000

NEXT_PUBLIC_SUPABASE_URL=https://xxxxxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...            (anon / publishable key)
SUPABASE_SERVICE_ROLE_KEY=eyJ...                 (service_role / secret key)

RAZORPAY_KEY_ID=rzp_test_...                     (leave empty for demo mode)
RAZORPAY_KEY_SECRET=...
RAZORPAY_WEBHOOK_SECRET=...

RESEND_API_KEY=re_...                            (order emails — section 11; empty = no emails)
EMAIL_FROM=                                      (empty until the domain is verified in Resend)
OWNER_EMAIL=owner@example.com                    (gets new-order alerts)

WHATSAPP_TOKEN=...                               (section 11; empty = no WhatsApp messages)
WHATSAPP_PHONE_NUMBER_ID=...
OWNER_WHATSAPP=9092322597                        (gets new-order alerts on WhatsApp)
```

The email and WhatsApp settings are optional: anything left empty is simply skipped (the admin order page shows
"skipped" with the reason), and checkout keeps working.

Save the file, then stop (`Ctrl + C`) and restart `npm run dev` — settings are read when the site starts.
The home page should now show the menu.

---

## 5. Put the site online with Vercel

*About 15 minutes, plus DNS waiting time.*

### 5.1 Push the code to GitHub

The code lives at <https://github.com/KavyaNalini30/SMdelights>. From the VS Code terminal:

```
git push origin main
```

The first time, a window opens asking you to sign in to GitHub — sign in and allow access. (The raw `Images/`
folder and the client's Word document are deliberately **not** uploaded; keep a backup of `Images/` somewhere safe,
e.g. Google Drive.)

### 5.2 Import the project into Vercel

1. Go to <https://vercel.com>, sign up **with your GitHub account**.
2. **Add New → Project →** pick the `SMdelights` repository → **Import**.
3. Framework is detected as **Next.js** — leave the build settings as they are.

### 5.3 Add the environment variables

Before clicking Deploy, open **Environment Variables** and add the same names and values as your
`.env.local`, with one difference:

- `NEXT_PUBLIC_SITE_URL` = your live address, e.g. `https://smdelights.vercel.app` now, and later `https://www.yourdomain.in`.

Click **Deploy**. After a minute you'll get a live link like `https://smdelights.vercel.app`.

Whenever you change an environment variable later, **redeploy** (Deployments → ⋯ → Redeploy) for it to take effect.
Every `git push` to `main` publishes the latest code automatically.

### 5.4 Connect the custom domain

Once the client has bought a domain (e.g. from GoDaddy, Hostinger or Namecheap):

1. In Vercel: **Project → Settings → Domains → Add**, type the domain (e.g. `smdelights.in`), and choose to add
   `www.smdelights.in` too (recommended: redirect the bare domain to `www`).
2. Vercel shows the exact DNS records to add — usually:
   - an **A** record for `@` pointing to the IP address Vercel shows, and
   - a **CNAME** record for `www` pointing to the value Vercel shows (ends in `vercel-dns.com`).
3. Log in to the domain seller's website → **DNS settings / Manage DNS** → add those records exactly as shown,
   deleting any old "parked" A or CNAME records for `@` and `www`.
4. Wait — usually 10–60 minutes, occasionally up to 24 hours. Vercel shows a green tick when it works, and sets up
   HTTPS (the padlock) automatically.
5. Update `NEXT_PUBLIC_SITE_URL` in Vercel to the new `https://www.…` address and redeploy.

---

## 6. After the domain is live: update Supabase and Razorpay

1. **Supabase → Authentication → URL Configuration**
   - **Site URL:** `https://www.yourdomain.in`
   - **Redirect URLs:** add `https://www.yourdomain.in/auth/callback` (keep the localhost one for testing on your computer).
     If you also use the `vercel.app` address, add `https://smdelights.vercel.app/auth/callback` too.
2. **Razorpay → Webhooks:** edit the webhook URL to `https://www.yourdomain.in/api/razorpay/webhook`
   (in both Test and Live mode if you use both).
3. **Vercel:** `NEXT_PUBLIC_SITE_URL` = `https://www.yourdomain.in`, then redeploy.
4. Open `https://www.yourdomain.in/sitemap.xml` — it should list the shop pages with the new domain.
5. Optional: add the site to **Google Search Console** and submit the sitemap, so the shop appears in Google.

---

## 7. Test a full order

Do this on your phone as well as a computer — most customers will come from Instagram on mobile.

### 7.1 Demo mode (no Razorpay keys yet)

1. Add two products to the cart, including one with a size choice (e.g. Butter Cookies 500 g) and one with a
   flavour question (e.g. Brownie Duo).
2. Refresh the page — the cart should still be there.
3. Checkout → choose **Pickup**, a date from tomorrow, and **Pay online** → the button says "Pay ₹… (demo)".
4. You land on the order page with **"Demo payment — no money was taken"**.
5. In **/admin → Orders**, the order appears with a *Demo* tag. Open it, change the status to *Preparing*, and check
   the history updates.

### 7.2 Real Razorpay test mode (test keys in `.env.local` / Vercel)

1. In **/admin → Courier rates**, set rates for Chennai (e.g. first 500 g `60`, every extra 500 g `30`) so courier
   delivery can be tested.
2. Place a **Courier delivery** order with a Chennai pincode (e.g. `600099`). The courier charge and parcel weight
   appear as soon as the pincode is typed.
3. The Razorpay window opens. Pay using Razorpay's test details:
   - **UPI:** enter the UPI ID `success@razorpay` (use `failure@razorpay` to test a failed payment).
   - **Cards:** use a test card number from Razorpay's "Test Card Details" page in their documentation
     (any future expiry date, any CVV).
4. You should land on "Thank you for your order!" with payment shown as *Paid online*.
5. In the Razorpay dashboard (Test Mode → Transactions → Payments) the payment shows as *Captured*.
6. **Abandoned payment:** start another order, then close the Razorpay window. You land on "payment pending" with a
   **Complete payment** button — use it to finish paying.
7. **Webhook:** in Razorpay → Webhooks, open your webhook — recent deliveries should show green `200` responses.
8. **Delivery rules:** choose Courier delivery with a hot chocolate in the cart — the site should say drinks can't
   travel by courier. Try a Hyderabad pincode (`500001`) — "we don't deliver here yet".
9. **Pay at pickup:** place a pickup order with *Pay at pickup*, then in the admin order page click **Paid in cash**.
10. **Fast delivery:** choose *Fast delivery* with a Chennai pincode → **Place order & continue on WhatsApp** →
    WhatsApp opens with the order details filled in. The order appears in admin with a *Fast · WhatsApp* tag. With a
    Coimbatore pincode (`641001`) fast delivery is refused.
11. **Notifications:** open any order in admin → **Notifications** shows each email/WhatsApp message as *sent*,
    *skipped* (with the reason, e.g. not set up yet) or *failed*, with a **Retry** button.

### 7.3 Accounts

Sign up with a new email → confirm → place an order while logged in, ticking *Save this address* → check
**My account** shows the order and the saved address → log out → use **Forgot password**.

---

## 8. Running the shop: the admin panel

Log in with an admin account and go to **/admin** (there's also an *Admin panel* button on **My account**).
It works on a phone.

**Overview** — what needs attention today: orders to prepare, orders due today, unpaid orders, new enquiries,
reviews waiting for approval, and last-30-day paid sales. The page refreshes itself every minute.

**Orders**
- New paid orders show as **Paid**. Tap an order to see the items (including any flavour notes), delivery or
  pickup date and address, and the customer's phone.
- **WhatsApp customer** opens a chat with a ready-made message — use it to confirm the timing, share the pickup
  location, or agree delivery details.
- Move the order along with **Order status**: *Paid → Preparing → Out for delivery → Delivered* (or *Cancelled*).
  Add a note if useful (e.g. courier tracking); every change is kept in the history.
- **Pay at pickup** orders: when the customer pays, click **Paid in cash** or **Paid by UPI**.
- **Fast delivery** orders (tag *Fast · WhatsApp*) arrive unpaid: the customer sends the order on WhatsApp, you
  agree the time, delivery charge and payment there, then click **Paid in cash / Paid by UPI** and move the status on.
- **Notifications** — shows whether the customer's confirmation (email + WhatsApp) and your alert went out, with
  **Retry / Send again** buttons.
- **Private note** — only admins see it.
- Refunds for online payments are made from the **Razorpay dashboard** (Transactions → the payment → Refund).
  Then set the order to *Cancelled* here, with a note.

**Products**
- **Add product**, or tap any product to edit its name, description, shelf life, sizes and prices (in rupees),
  and photos (**+ Add photo** works straight from the phone's gallery; the first photo is the main one).
- Each size has a **weight (g)** — the packed weight including the box. The courier charge is worked out from it, so
  keep it roughly right (weigh one packed order of each kind).
- **Hide** removes a product from the shop without deleting it (e.g. out of season) — **Show** brings it back.
- **☆ Bestseller** puts a product in the home page's Bestsellers section.
- **Not for courier** — for items that can't travel (drinks, London Cake, the combo): pickup or fast delivery in Chennai only.
- **Ask the customer a question** — e.g. "Which 2 flavours would you like?"; the answer appears on the order.
- Changes appear on the shop within seconds.

**Courier rates** — the ST Courier charges for each area: Chennai, Tamil Nadu, Bengaluru, Karnataka, Kerala and
Andhra Pradesh. For each, enter the price for the **first slab** (e.g. first 500 g = ₹60) and for **every extra
slab** (e.g. each extra 500 g = ₹30); the examples under the boxes show what customers will pay. **Leave the price
empty** and courier delivery is off for that area (customers can still pick up or WhatsApp). Pincodes are matched
automatically. Fast delivery (Chennai only) is priced on WhatsApp, and pickup is free.

**Enquiries** — bulk, wedding and corporate enquiries from the website. WhatsApp the customer straight from the
card, then track it: *New → Contacted → Quote sent → Confirmed / Closed*, with a private note.

**Reviews**
- **Add a review** — type in a review a customer sent on WhatsApp or Instagram, optionally with a screenshot. It's
  published straight away.
- Reviews customers leave on the website wait here until you click **Approve & publish**. You can unpublish or delete any review.

---

## 9. Pre-launch checklist

**Content**
- [ ] Client has confirmed the menu, prices and descriptions (section 10 lists the open questions)
- [ ] Courier rates set for every area (Admin → Courier rates), and product weights checked (Admin → Products)
- [ ] Bestsellers marked (Admin → Products)
- [ ] Photos added for products showing "Photo coming soon"; low-resolution photos replaced (section 10)
- [ ] Instagram link and contact email added in `config/site.ts` (`instagramUrl`, `email`)
- [ ] Policy pages reviewed by the client; highlighted text edited in `app/policies/*/page.tsx`; then set
      `policiesReviewed: true` (and update `policiesUpdated`) in `config/site.ts`
- [ ] Rights to use every background photo confirmed (section 10)
- [ ] A few genuine reviews added (Admin → Reviews)

**Accounts & email**
- [ ] Custom SMTP set up in Supabase so sign-up and password emails reach customers (step 2.4)
- [ ] Client's own admin account created (step 2.5)
- [ ] Domain verified in Resend, `EMAIL_FROM` set, and a test order's confirmation email received (section 11)
- [ ] WhatsApp templates approved and a test order's WhatsApp confirmation + owner alert received (section 11)

**Payments**
- [ ] Razorpay KYC approved and **live** keys + live webhook in Vercel (step 3.4)
- [ ] One real small order paid and refunded successfully
- [ ] Webhook deliveries showing `200` in Razorpay

**Domain & settings**
- [ ] Custom domain working with the padlock (HTTPS), `www` and bare domain both work
- [ ] `NEXT_PUBLIC_SITE_URL`, Supabase Site URL / Redirect URLs and Razorpay webhook all use the final domain (step 6)
- [ ] `sitemap.xml` shows the final domain; submitted to Google Search Console

**Final checks (on a phone)**
- [ ] Home, shop, a product, cart, checkout, order page, contact and corporate form all work
- [ ] Every "Chat with us on WhatsApp" button (floating button, footer, menu, Contact → Ask the baker) opens a chat
      with 90923 22597, and no phone number is shown as text on the shop pages
- [ ] A corporate enquiry arrives in Admin → Enquiries
- [ ] Sharing the site link on WhatsApp shows the SM Delights preview image
- [ ] Supabase: **Project Settings → Database → Backups** checked (daily backups are included on paid plans;
      on the free plan, export important data regularly)

---

## 10. Things still needed from the client

The site was built strictly from the client's "Client Input" document. These points weren't in it, or the menu
posters disagree with it. Until they're answered the site uses the document, or leaves the item out or hidden.

**Menu & prices**
1. **ST Courier rate card** for Chennai, Tamil Nadu, Bengaluru, Karnataka, Kerala and Andhra Pradesh (price for the
   first weight slab and for each extra slab), and whether any orders get free delivery. *(Answered: no packaging
   fee; courier applies inside Chennai too; fast same-day delivery only within Chennai, arranged on WhatsApp.)*
1a. **Packed weights** — the site uses these estimates until corrected in Admin → Products:

    | Item | Weight |
    |---|---|
    | Brownie, per piece | 120 g |
    | Brownie tub | 300 g |
    | Marshmallow brownie | 150 g |
    | Tea cakes | 600 g |
    | Cookies / biscuits 250 g · 500 g | 320 g · 600 g |
    | Fudge Brownie Box ½ kg · 1 kg | 600 g · 1,150 g |
    | Brownie Duo / Trio ½ kg | 600 g |
    | Assorted Brownie Box 5 · 10 pieces | 650 g · 1,250 g |
    | Tea-Time Family Box | 1,000 g |
    | Cookie Lover's Box | 900 g |
    | SM Delights Family Box | 1,500 g |
    | Drinks, London Cake, combo (not sent by courier) | 300 g |

1b. **Dispatch time** for courier orders — the site says "Dispatched within 1–2 days".
1c. **Puducherry and Telangana** — Puducherry pincodes are treated as Tamil Nadu (they share pincode ranges);
    Telangana / Hyderabad (500–509) is not served. Chennai suburbs with 601/602/603 pincodes count as Tamil Nadu
    (courier only, no fast delivery).
2. **Items only on the menu posters, not in the document** — do they exist, and at what price? Brownie Duo/Trio
   1 kg (posters: ₹1,199 / ₹1,249), Brownie Quartet (½ kg ₹799 / 1 kg ₹1,299), Cake Bowls, Brownie Packs
   (250 g / 500 g / 1 kg), Healthy Millet Brownie (₹75), Filled Brownie (₹80–₹110), Nankhatai, Bomboloni.
3. **Brownie + Hot Chocolate combo:** ₹159 in the document but ₹99 on the poster — which is right, and which brownie is included?
4. **Hot chocolate sizes:** document says 200 ml / 250 ml, poster says "200–220 ml".
5. **Marshmallow Brownie "Single / Double / Triple"** — what do these mean for the customer? (Shown exactly as in the document for now.)
6. **"Other available sago drink flavours"** — which flavours? (This product is hidden until we know.)
7. **Shelf life** for hot chocolate, sago drinks, London cake and the combo (left blank). Brownie tubs and
   marshmallow brownies currently use the brownie guidance; gift boxes use their shortest-lasting item.
8. Can **drinks**, the **London cake** or the combo ever go by courier? (Currently pickup or Chennai fast delivery only.)
9. *(Answered 25 Oct: Brownie Family Box, Fruit & Nut Cake and Cookie Tin have been removed from the menu.)*
10. Daily **order cut-off time** for next-day pickup, and for same-day fast delivery in Chennai.

**Photos**
11. Every product now has a photo. Small originals were enlarged with an AI upscaler (Real-ESRGAN), which looks
    acceptable but invents fine detail. Real photos of at least 1200 px would look better for these (original size in
    brackets): Butter Cookies, Salt / Jeera Biscuits (≈300 px), Millet Biscuits and Double Chocolate Cookies (≈290 × 400),
    the five brownie tubs (500 × 400), London Cake (415 × 740), Chocolate and Vanilla Tea Cakes (≈600 × 400),
    Hot Chocolate (680 × 450) and Nutella Boba Shake (554 px). Square or 4:5 photos with the product in the middle fit
    the product cards best. Re-run `npm run images` after adding them to `Images/`.
12. **Rights to the background photos** in `Images/Website wallpaper and bg/` (`cosmos_*` files) — they look like stock
    or Pinterest images; one was a screenshot. Using photos without permission is a copyright risk. The hero image is
    AI-generated (its watermark has been cropped out).
13. `Images/Example.jpg` carries another business's watermark ("Ani Cake Design") and is not used anywhere.
14. A transparent PNG or vector (SVG/PDF) version of the **logo**, if available — it would look sharper in the header.

**Business & legal (for the policies and Razorpay KYC)**
15. Legal name of the business / owner, **FSSAI number**, GST status (are prices tax-inclusive?), contact email,
    Instagram handle, and the grievance officer name for the Privacy Policy.
16. Cancellation and refund rules (currently drafted as: full refund up to 24 hours before the date; damage reported
    with a photo within 2 hours).
17. Allergen statement (drafted as: may contain gluten, dairy, eggs, nuts and soy).

**Notifications** (see section 11)
18. The **email address** for new-order alerts (`OWNER_EMAIL`).
19. Meta **Business verification** documents for the WhatsApp Business API, and agreement to the per-message cost.
20. Confirm the split: the website shows no phone numbers — every WhatsApp button opens a chat with
    **90923 22597**, which also gets the new-order alerts. **95146 70173** is only the sender of the automatic
    order messages (kept on the WhatsApp Business app; customers who reply to those land there). To change the
    chat number later, edit `whatsapp` in `config/site.ts`.

---

## 11. Order emails and WhatsApp messages (Resend + WhatsApp Cloud API)

When an order is placed, the site sends four messages:

| To | By | When |
|---|---|---|
| Customer | Email — branded confirmation with items, total, delivery details, order link, and both shop phone numbers | Online payment: once the payment is confirmed. Pay-at-pickup and fast delivery: straight away |
| Customer | WhatsApp — the same in short (only if they left "Send my order updates on WhatsApp" ticked) | Same as above |
| Owner | Email to `OWNER_EMAIL` — new-order alert with a link to the order in admin | Same as above |
| Owner | WhatsApp to `OWNER_WHATSAPP` — new-order alert | Same as above |

Each message is sent once per order (even if Razorpay confirms the payment twice) and recorded on the admin order
page. If a service isn't set up, that message is marked *skipped* and everything else carries on.

### 11.1 Email with Resend

*About 15 minutes, plus DNS waiting time.* Resend's free plan covers about 3,000 emails a month (100 a day).

1. Sign up at <https://resend.com> — ideally with the client's email, so the account is hers.
2. **API Keys → Create API key** (permission *Sending access*). Copy it into `RESEND_API_KEY` in `.env.local` and Vercel.
3. Set `OWNER_EMAIL` to the address that should receive new-order alerts.
4. **Testing before the domain exists:** leave `EMAIL_FROM` empty. Emails come from `onboarding@resend.dev`, and
   Resend **only delivers them to the email address you signed up to Resend with** — so place test orders using
   that email. Other customers' emails are marked *failed* until step 5.
5. **After buying the domain:** Resend → **Domains → Add domain** (e.g. `smdelights.in`) → it shows a few DNS records
   (TXT / MX / CNAME). Add them in Vercel (**Domains → the domain → DNS Records**) or at your domain seller, then click
   **Verify** in Resend. When it shows *Verified*, set `EMAIL_FROM` to `SM Delights <orders@smdelights.in>`, redeploy,
   and place a test order.
6. Use the same Resend account for Supabase's sign-up / password emails (step 2.4).

### 11.2 WhatsApp with the WhatsApp Cloud API (Meta)

*About 1–2 hours of setup, plus Meta's review (usually 1–3 days).* Automatic WhatsApp messages need Meta's
WhatsApp Business **API** — the normal WhatsApp Business app can't send them. Meta charges a small fee per
business-started "utility" message (a fraction of a rupee to about a rupee each in India; check Meta's current
pricing).

**The business number (95146 70173) stays on the WhatsApp Business app.** Meta's *coexistence* option connects a
number that's already on the Business app to the API, so the client keeps chatting on her phone as usual while the
website sends messages from the same number. New-order alerts go to the second number (90923 22597), because a
number can't message itself. 90923 22597 is also the number behind every "Chat with us on WhatsApp" button on the
site; 95146 70173 is never shown on the website.

1. **Meta Business account:** <https://business.facebook.com> → create one for SM Delights (client's Facebook login).
   Complete **Business verification** (Settings → Business info) — Meta asks for business details and a document.
2. **Developer app:** <https://developers.facebook.com> → **My Apps → Create app** → type *Business* → add the
   **WhatsApp** product, linked to the business account above.
3. **Connect the number with coexistence:** in WhatsApp Manager / the app's *WhatsApp → API Setup*, add a phone
   number and choose the option to connect an **existing WhatsApp Business app** number (scan the QR code / confirm
   in the app on the client's phone). Coexistence needs a recent WhatsApp Business app version; if it isn't offered
   for this number, the options are a Meta partner that supports it (e.g. Interakt, AiSensy — the code is ready for a
   provider swap in `lib/notify/whatsapp.ts`) or a separate new number for automatic messages.
4. Copy the **Phone number ID** (not the phone number) into `WHATSAPP_PHONE_NUMBER_ID`.
5. **Permanent token:** Business settings → **Users → System users → Add** (role Admin) → **Add assets** → the app
   (full control) and the WhatsApp account → **Generate new token** with permissions `whatsapp_business_messaging`
   and `whatsapp_business_management`, expiry *Never*. Copy it into `WHATSAPP_TOKEN` (secret!).
6. Set `OWNER_WHATSAPP=9092322597` (the alert number). Add all three to Vercel and redeploy.
7. **Create the two message templates** — WhatsApp Manager → **Message templates → Create template**, category
   **Utility**, language **English**. The names and texts must be exactly as below (the numbers in `{{ }}` are filled
   in by the website). Meta asks for a sample value for each variable — use the examples.

**Template 1 — name `smd_order_confirmation`** (to the customer)

```
Hi {{1}}, thank you for ordering from SM Delights!

Order: {{2}}
Items: {{3}}
Total: {{4}}
{{5}}

View your order: {{6}}
Questions? WhatsApp us on {{7}}.
```

Samples: `Asha` · `SMD-1042` · `2 × KitKat Brownie (Per piece)` · `₹290 (Paid online)` ·
`Courier to Kochi 682001. Dispatched within 1–2 days, then delivered in 2–3 days.` ·
`https://smdelights.in/order/abc` · `90923 22597`

**Template 2 — name `smd_new_order_alert`** (to the owner)

```
New website order {{1}}

Customer: {{2}} ({{3}})
Items: {{4}}
Total: {{5}}
Delivery: {{6}}
Address / pickup: {{7}}

Open in admin: {{8}}
```

Samples: `SMD-1042` · `Asha Kumar` · `+91 98765 43210` · `2 × KitKat Brownie (Per piece)` ·
`₹290 (Paid online)` · `Courier delivery` · `12 Main Rd, Kochi, Kerala, 682001` · `https://smdelights.in/admin/orders/abc`

8. When both templates show **Active / Approved**, place a test order with your own phone number and check that the
   customer message and the owner alert arrive. The admin order page shows *sent* or the exact error from Meta.

**If the templates are edited later**, keep the same number and order of `{{ }}` variables — the website fills them
in this order (see `lib/notify/messages.ts`).
