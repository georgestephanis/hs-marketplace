# Privacy Policy

**Effective date:** `2026-08-21`
**Provider:** `George Stephanis` ("we", "us", "our")
**Contact:** `daljo628@gmail.com`

> **Not legal advice.** This document is a starting template. Its factual
> claims describe the assets in this repository as they behave today
> (see §2 and §9). If you change the code, re-verify those claims. Have
> qualified counsel review this before publishing it as the Privacy Policy URL
> on any HubSpot Asset Marketplace listing.

---

## 1. Who this policy covers

This policy explains how personal data is handled in connection with our
HubSpot Asset Marketplace offerings: the **Custom Pillbox Input** module and
the **Custom Promo Card** module (each an "Asset").

It distinguishes two very different groups:

- **Customers** — HubSpot users who install an Asset into a portal.
- **Visitors** — end users who browse a website built with an Asset.

## 2. What the Assets collect

**The Assets do not collect, transmit, or store personal data.**

Every Asset is composed solely of HubL templates, CSS, and client-side
JavaScript that executes in the visitor's browser. As implemented in this
repository, the Asset code contains:

- no outbound network requests (no `fetch`, no `XMLHttpRequest`);
- no cookies, `localStorage`, or `sessionStorage` writes;
- no analytics, telemetry, fingerprinting, session recording, or advertising
  code; and
- no third-party scripts, pixels, tags, or remotely hosted assets loaded at
  runtime.

We operate no server-side component and receive no data from your website or
your visitors.

HubSpot's Template Marketplace Policies permit removal of templates that track
users without informed, explicit opt-in consent. We do not track visitors at
all, so no consent mechanism is required by the Assets themselves.

Because the Assets are GPL-licensed, you are free to modify them — including to
add tracking. **Any tracking, cookie, storage, or third-party script you add
becomes your responsibility**, and the claims in this section then describe only
our unmodified distribution, not your copy.

## 3. Form input handled by the Custom Pillbox Input module

The Custom Pillbox Input module deserves specific mention because it is an
input control.

The module renders a native `<select multiple>` element whose `name` attribute
you configure (default: `custom_pillbox_tags`). Tags a visitor selects are
written into that element **in the browser**. If you place the module inside a
form, those values are submitted along with the rest of that form.

Where those values go is determined entirely by **your** form and **your**
portal — typically to HubSpot as CRM or submission data. They never reach us.
Consequently:

- **You** are the data controller for anything collected through a form
  containing this module.
- **You** are responsible for the lawful basis, notice, and consent covering
  that collection, and for reflecting it in your own site privacy notice.
- If visitors can type free-text tags, they may enter personal data into the
  field. Configure the module — and your form's notices — accordingly.

## 4. Data we process as a business

Although the Assets themselves collect nothing, we do process limited personal
data in running our business:

| Purpose | Data | Source | Lawful basis |
| --- | --- | --- | --- |
| Responding to support requests | Name, email, message content, portal details you choose to share | You, by contacting us | Contract / legitimate interests |
| Marketplace transactions | Purchase and installation records, billing identifiers | HubSpot | Contract / legitimate interests |
| Legal and accounting records | Transaction records | HubSpot | Legal obligation |

We do not sell personal data, and we do not use support correspondence for
marketing without separate consent.

## 5. Processors and disclosures

We rely on:

- **HubSpot, Inc.** — marketplace distribution, purchase records, and
  installation data. See the
  [HubSpot Privacy Policy](https://legal.hubspot.com/privacy-policy).
- **Google LLC (Gmail)** — hosts the mailbox that receives support
  correspondence. This is a personal, non-corporate Gmail account.

We may also disclose data where required by law, or in connection with a
merger or acquisition.

## 6. International transfers

We are based in the United States, and personal data you send us is processed
there. Where personal data is transferred
outside your jurisdiction, we rely on appropriate safeguards such as Standard
Contractual Clauses.

## 7. Retention

Support correspondence is retained for `24 months`.
Transaction and accounting records are retained for as long as required by
applicable law. Because the Assets store nothing, there is no Asset-held data
to retain or delete.

## 8. Your rights

Depending on where you live, you may have the right to access, correct,
delete, port, or restrict processing of your personal data, to object to
processing, and to withdraw consent. Exercise these rights by contacting
`daljo628@gmail.com`; we respond within the period required by
applicable law.

Requests about data collected through **your** website — including tags
submitted via the Custom Pillbox Input module — must be directed to the
operator of that website, not to us.

If you are in the EEA or UK you may also lodge a complaint with your local
supervisory authority. The Assets are offered free of charge and we do not
market or target them to any particular territory, the EEA and UK included, so
we have not appointed an Article 27 representative.

## 9. Children

The Assets are developer tools and are not directed at children. We do not
knowingly process personal data from children.

## 10. Verifying the claims in section 2

The statements in §2 are verifiable against the source of each Asset. The
following returns no matches across the module JavaScript and templates:

```bash
grep -rniE 'fetch\(|XMLHttpRequest|localStorage|sessionStorage|document\.cookie|navigator\.send' \
  --include=*.js --include=*.html \
  src/custom-pillbox-input.module src/custom-promo-card.module
```

Neither Asset references an external URL at render time. **If future changes
introduce a network request, cookie, or storage write, sections 2 and 3 must be
updated before release.**

## 11. Changes to this policy

We may update this policy. Material changes will be reflected in the effective
date above and published at the Privacy Policy URL on our marketplace listing.

## 12. Contact

`George Stephanis`
`217 East Market Street, Marietta, PA 17547, USA`
`daljo628@gmail.com`
