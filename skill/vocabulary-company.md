# Company-wide vocabulary (plain language)

For **Company-Wide** decks: use the business words below and avoid engineering
jargon. Spell out any abbreviation on first use. Curated from `/platform` and
`/docs` — extend per topic.

**How we describe ourselves: zastrpay** (lowercase) — a regulated **cash payment
service** that lets people **pay, deposit, and withdraw cash at partner shops using
a QR code**, bringing **"cash to the digital world."** We are a licensed **e-money
issuer** (supervised by the **MFSA**, Malta's financial regulator) serving customers
in Germany and Austria.

## Say this (business terms)

- **Customer** — not "user" or "account holder".
- **Wallet** — the customer's money in zastrpay; **balance** is what's available.
- **Cash deposit / cash withdrawal** — adding or taking out cash at a partner shop.
- **Pay with cash** — paying a merchant by scanning a **QR code** at a **partner shop**.
- **Partner shop** — a retail location where customers deposit, withdraw, or pay.
  **Cashier** — the shop employee who scans the QR code and handles the cash.
- **Merchant** — a business that accepts zastrpay. **Distributor** — a partner that
  runs a network of shops.
- **Registration / onboarding** — becoming a verified customer.
- **Identity verification** — confirming who a customer is:
  - **Proof of Identity (POI)** — who they are. **Proof of Address (POA)** — where they live.
  - **Source of Funds / Source of Wealth** — where their money comes from (for compliance).
  - Options: **ID Austria**, **IDnow** (video call), **in-shop** verification.
- **Limit** — the most a customer can deposit, withdraw, or spend in a period.
- **Transaction**, **refund**, **withdrawal request**, **account statement** (shared
  in the customer's inbox), **account closed / dormant account**.
- **Two-step verification** — a one-time SMS code plus the customer's PIN (this is
  what "Strong Customer Authentication / SCA" means — say it the plain way).

## Don't say this → say this instead

- KYC → "the identity checks regulators require".
- OpenID Connect / OAuth / single sign-on → "a secure login, like *Sign in with Google*".
- Strong Customer Authentication / SCA → "two-step verification (an SMS code + a PIN)".
- PSD2 / Open Banking → "EU rules that let customers securely share their account
  with apps they approve".
- AISP / TPP → "an approved third-party app that can read account info with the
  customer's permission".
- MFSA → "our financial regulator (in Malta)"; e-money issuer → "a licensed digital-money provider".
- Webhook → "an automatic notification we send the merchant when something happens".
- API / endpoint / integration → "connection" — or just describe the outcome.
- Microservice / event-driven / change stream / Kubernetes / MongoDB → omit entirely;
  say "the system does X automatically in the background".
- bPK / Vollfunktion / Meldezettel / eIDAS certificate → explain in one plain phrase; don't name them.
- Latency / throughput / p95 → "speed" / "how fast", with the real number.
- Idempotent → "safe to retry — it won't double-charge".

## Avoid (marketing buzzwords)

game-changing, revolutionary, best-in-class, cutting-edge, world-class, seamless,
transformative — state the concrete outcome instead (a real number, a real example,
a clear before/after).

## Follow the website for more
Read the website thoroughly for more information: https://zastrpay.com, specially https://zastrpay.com/en/data-privacy/ and latest https://zastrpay.com/en/terms-and-conditions/