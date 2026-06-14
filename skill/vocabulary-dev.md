# Dev vocabulary (ubiquitous language)

Use these in-house names verbatim when presenting to the **Development Team**.
This is a curated seed mined from `/platform` and `/docs` — extend it from the repo
for the specific topic, and never rename a concept the codebase already names.

**Platform: zastrpay** (lowercase) — a **Cash-to-Digital (C2D)** e-money platform:
customers pay, deposit, and withdraw **cash at partner shops** using **QR codes**.
Licensed **e-money issuer (EMI)** supervised by the **MFSA** (Malta Financial
Services Authority); serves customers in Germany and Austria; EUR. Backend is **F#**
(functional, no OOP) microservices on **MongoDB**, hosted on **AKS** (Azure
Kubernetes Service) behind **Traefik**, with **Azure Event Hubs** and **ADX**
(Azure Data Explorer) for analytics.

## Architecture & patterns (the core model)

zastrpay is built on **CQRS + Event Sourcing (CQRS-ES)**. Name these precisely:

- **Bounded Context** — a service's boundary; it owns its aggregates, others
  reference them by id only.
- **Aggregate (Root)** — the consistency boundary (e.g. KycRequest, Transaction);
  also acts as the **Saga** for long-running, cross-service processes.
- **Command Handling / Query Handling / Event Handling / Event Publishing /
  Change Handling** — the per-service layers (write / read / consume / publish /
  change-stream).
- **Event** — immutable fact. **Internal events** are stored for audit within a
  context; **External events** are published across contexts for subscribers.
- **Last Event pattern** — store the latest event on the entity (changed fields
  only) rather than a full event stream; the audit trail rides on external events.
- **Projection** — async denormalised read view built from events (eventual
  consistency). **Orchestration** — one central function coordinating a business flow.
- **Change Stream / Change Feed** — MongoDB change feed consumed by a
  **ChangeStreamProcessor** to build projections and emit external events.
- **Double-entry bookkeeping** — every debit has a matching credit
  (AccountingService); **Reconciliation** matches distributed balances to the master
  ledger; **Compensation transaction** (reversal/refund) unwinds a prior one.
- **Decentralization of balance** — customer balance is held at the Merchant, not at
  zastrpay; zastrpay processes transfers and reconciles.
- **Eventual consistency**, **Optimistic concurrency** (etag), **Idempotency**
  (event Id + Type), **Correlation id**, **Anti-corruption layer**.

## Platform & infra terms

- **AppEnv** — strongly-typed config + clients composed once at startup.
- **MongoDB read preference** — **Primary** (immediate consistency, e.g. balance
  checks) vs **Secondary / RPSP** (Read Preference Secondary Preferred; eventual
  consistency, reporting).
- **Event Hub Consumer Group** — independent queue per listener (≤20 per hub).
- **AzureQueue / QueueProcessor** — background job queue with retry / poison handling.
- **ForwardAuth / fwd-auth-aisp** — Traefik middleware authenticating merchants
  (API key + IP allowlist) and fronting AISP/OAuth flows.
- **UMX measure types** — F# units of measure for typed ids, e.g. `Guid<CustomerId>`.
- **TickSpec + xUnit** — Gherkin BDD tests; the database is not mocked.

## Services (canonical names, from `code/`)

- **CustomerService** — central customer record, profile, and lifecycle state.
- **CustomerKycService** — KYC data and state: verification, documents, screenings, periodic reviews.
- **IdentityVerificationService** — orchestrates KYC; verifies POI/POA against providers (Schufa, IDnow, GBG, Moody's).
- **DocumentRecognitionService / DocumentIntelligenceService** — document quality checks and data extraction (OCR / AI).
- **DocumentService** — central document storage and retrieval.
- **TransactionService** — wallet transactions: deposit, withdrawal, transfer, reversal, refund; state + limit checks.
- **AccountingService** — double-entry accounts, balances, wallet transactions, settlements.
- **LimitService** — transaction/spending limits with accumulation, thresholds, time windows.
- **CustomerRiskService** — risk tiers and suspicious-activity detection feeding decline rules.
- **MerchantService** — merchant onboarding, activation, categories, settlement config.
- **DistributorService** — distributors/sub-distributors, shops, operators, affiliations, limits.
- **AffiliateService** — affiliate partners and commission structures.
- **CardService** — card issuance and card-to-customer links.
- **OrderingService** — product/gift-card orders and fulfilment.
- **SettlementImportService / SettlementExportService** — settlement data in/out for reconciliation.
- **CustomerAuthenticationService / AuthenticationService** — customer & device auth (SMS OTP + PIN, keys); AISP OAuth + SCA.
- **AadBridgeService** — Azure AD B2C identity federation bridge.
- **NotificationService / CustomerCommunicationService** — multi-channel (SMS, email) sending + preferences/tracking.
- **CustomerConsentService** — consent records (GDPR, marketing, AISP access).
- **CustomerQnAService** — customer questionnaires and completion state.
- **ChangeManagementService** — audit trail / change tracking for sensitive attributes.
- **TimeExpirationService** — time-based expiry (sessions, documents, periodic reviews).
- **TicketingService** — support tickets from system events and customer issues.
- **TrainingService** — trainee assignments and training workflows.
- **MonitoringService / SystemStatusService** — anomaly alerts; health and status.
- **ReportingService** — analytics/reporting from consumed events.
- **LocationService** — geolocation / shop-location queries.
- **POSApp** — in-shop point-of-sale app. **AdminReact** — admin dashboard (React/TS).

## Domain concepts

- **Customer** — end user; states Pending → Active → Blocked / Closed, plus
  PendingKYC and Dormant. **Duplicate merge** consolidates duplicate records.
- **Wallet / e-money account** — customer balance (EUR) for payments and payouts;
  **booked balance** vs **pending balance change**.
- **Transaction** — deposit, withdrawal, transfer, **reversal**, **refund**,
  **passthrough**; states Pending/Completed/Declined/Cancelled/Failed.
- **Redirect Session** — merchant-initiated session giving the customer a redirect
  URL + **QR code** to authenticate and pay. **Transaction intent** — the pending
  payment after redirect, before cash is taken at the **POS terminal**.
- **Network**: **Merchant** (accepts payment) · **Distributor / Sub-distributor**
  (manage shops) · **Shop** (point-of-sale location) · **Operator / Cashier**
  (staff at the till) · **Agent / Franchise Partner (FP)** · **Affiliate /
  Affiliation** (merchant↔distributor link).
- **Settlement** — end-of-period reconciliation/payout; **Commission** — per-transaction fee.
- **Certificate** — transaction-domain artifact keyed on a `CertificateId`
  (e.g. idempotent `addCertificate`).

## KYC, screening & compliance

- **KYC Request** — states Pending / DataRejected / Completed / Cancelled.
- **POI** (Proof of Identity) · **POA** (Proof of Address) · **SOF** (Source of
  Funds) · **SOW** (Source of Wealth).
- **CDD / EDD** — Customer / Enhanced Due Diligence. **Periodic Review** and
  **Re-KYC** — scheduled or triggered re-verification.
- **Screening** — **PEP** (Politically Exposed Person), **Sanctions**, **Adverse
  Media**. Providers: **Schufa, IDnow** (video), **GBG, Moody's (RDC)**, **ID Austria**.
- **Risk Tier / CRA** (Customer Risk Assessment) — High/Medium/Low drives limits and
  KYC depth. **SAR** — Suspicious Activity Report.
- **SCA** (Strong Customer Authentication, PSD2 RTS) — **SMS OTP** (6-digit) + **PIN**
  (4-digit); also **TAN**, **TOTP**.

## Open Banking / PSD2 (AISP surface)

- **PSD2** (Payment Services Directive 2) · **RTS** (Regulatory Technical Standards).
- **AISP** (Account Information) · **PISP** (Payment Initiation) · **CBPII**
  (Card-Based Payment Instrument Issuer) · **TPP** (Third-Party Provider) · **PSU**
  (customer) · **ASPSP** (the account-holding provider — zastrpay).
- **XS2A** (Access to Account) · **Berlin Group NextGenPSD2** — the standard API.
- **Consent** + its lifecycle (Received → Valid → Rejected/Revoked/Terminated/Expired).
- **eIDAS** certificates — **QWAC** (mTLS, mandatory), **QSealC** (signing, optional).
- **OAuth 2.1 Authorization Code + PKCE** — the AISP credential flow.
- **MFSA / NCA / EMI** — Malta regulator / National Competent Authority / E-Money Institution.
