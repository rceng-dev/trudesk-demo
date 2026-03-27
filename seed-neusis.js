/**
 * Trudesk – Neusis seed script
 * Run via:  mongosh trudesk seed-neusis.js
 *
 * Drops and rebuilds all trudesk collections with realistic
 * Neusis AI company data.
 */

// ─── helpers ────────────────────────────────────────────────────────────────

function oid() { return new ObjectId(); }

function daysAgo(n) {
  var d = new Date();
  d.setDate(d.getDate() - n);
  return d;
}

function hoursAgo(n) {
  var d = new Date();
  d.setHours(d.getHours() - n);
  return d;
}

// bcrypt hash of "Password1!" (cost 10)
var PASSWORD_HASH = "$2b$10$rvS8Fcn4iyGvKCePldSzDuMCCPVPtToLkTshESLmavT5MK4K3njrW";

// ─── drop existing data ──────────────────────────────────────────────────────

print("Dropping existing trudesk collections...");
db.accounts.drop();
db.roles.drop();
db.teams.drop();
db.groups.drop();
db.departments.drop();
db.priorities.drop();
db.statuses.drop();
db.tickettypes.drop();
db.tickets.drop();
db.tags.drop();
db.settings.drop();
db.counters.drop();
db.notices.drop();
db.reports.drop();

// ─── counters ───────────────────────────────────────────────────────────────

db.counters.insertMany([
  { _id: "tickets", next: 1051 },
  { _id: "reports", next: 1011 },
  { _id: "statuses", next: 5 }
]);

// ─── roles ──────────────────────────────────────────────────────────────────

var roleAdminId    = oid();
var roleSupportId  = oid();
var roleUserId     = oid();

db.roles.insertMany([
  {
    _id: roleAdminId,
    name: "Administrator",
    normalized: "administrator",
    description: "Full system access",
    grants: ["admin:*","agent:*","chat:*","tickets:*","accounts:*","groups:*",
             "teams:*","departments:*","comments:*","reports:*","notices:*",
             "settings:*","api:*"],
    hierarchy: true
  },
  {
    _id: roleSupportId,
    name: "Support",
    normalized: "support",
    description: "Agent / support staff",
    grants: ["tickets:*","agent:*","accounts:create update view import",
             "teams:create update view","comments:create view update delete",
             "reports:view create","notices:*"],
    hierarchy: true
  },
  {
    _id: roleUserId,
    name: "User",
    normalized: "user",
    description: "End-user / customer",
    grants: ["tickets:create view update","comments:create view update"],
    hierarchy: true
  }
]);

// ─── ticket priorities ───────────────────────────────────────────────────────

var priCriticalId = oid();
var priHighId     = oid();
var priNormalId   = oid();
var priLowId      = oid();

db.priorities.insertMany([
  { _id: priCriticalId, name: "Critical", overdueIn: 240,  htmlColor: "#c0392b", default: false },
  { _id: priHighId,     name: "High",     overdueIn: 480,  htmlColor: "#e67e22", default: false },
  { _id: priNormalId,   name: "Normal",   overdueIn: 1440, htmlColor: "#2980b9", default: true  },
  { _id: priLowId,      name: "Low",      overdueIn: 4320, htmlColor: "#27ae60", default: false }
]);

// ─── ticket statuses ─────────────────────────────────────────────────────────

var stNewId      = oid();
var stOpenId     = oid();
var stPendingId  = oid();
var stClosedId   = oid();

db.statuses.insertMany([
  { _id: stNewId,     name: "New",     htmlColor: "#3498db", uid: 1, order: 0, slatimer: true,  isResolved: false, isLocked: false },
  { _id: stOpenId,    name: "Open",    htmlColor: "#e67e22", uid: 2, order: 1, slatimer: true,  isResolved: false, isLocked: false },
  { _id: stPendingId, name: "Pending", htmlColor: "#9b59b6", uid: 3, order: 2, slatimer: false, isResolved: false, isLocked: false },
  { _id: stClosedId,  name: "Closed",  htmlColor: "#2ecc71", uid: 4, order: 3, slatimer: false, isResolved: true,  isLocked: true  }
]);

// ─── ticket types ────────────────────────────────────────────────────────────

var ttIssueId   = oid();
var ttTaskId    = oid();
var ttRequestId = oid();
var ttBugId     = oid();

db.tickettypes.insertMany([
  { _id: ttIssueId,   name: "Issue",          priorities: [priCriticalId, priHighId, priNormalId, priLowId] },
  { _id: ttTaskId,    name: "Task",            priorities: [priNormalId, priLowId] },
  { _id: ttRequestId, name: "Feature Request", priorities: [priHighId, priNormalId, priLowId] },
  { _id: ttBugId,     name: "Bug",             priorities: [priCriticalId, priHighId, priNormalId] }
]);

// ─── tags ────────────────────────────────────────────────────────────────────

var tagBillingId    = oid();
var tagOnboardingId = oid();
var tagApiId        = oid();
var tagSecurityId   = oid();
var tagUiId         = oid();
var tagPerfId       = oid();
var tagIntegrationId = oid();
var tagMobileId     = oid();

db.tags.insertMany([
  { _id: tagBillingId,     name: "billing",     normalized: "billing"     },
  { _id: tagOnboardingId,  name: "onboarding",  normalized: "onboarding"  },
  { _id: tagApiId,         name: "api",         normalized: "api"         },
  { _id: tagSecurityId,    name: "security",    normalized: "security"    },
  { _id: tagUiId,          name: "ui",          normalized: "ui"          },
  { _id: tagPerfId,        name: "performance", normalized: "performance" },
  { _id: tagIntegrationId, name: "integration", normalized: "integration" },
  { _id: tagMobileId,      name: "mobile",      normalized: "mobile"      }
]);

// ─── users (accounts) ────────────────────────────────────────────────────────

// Admin
var uAdminId = oid();
// Support agents
var uSarahId   = oid();
var uMarcusId  = oid();
var uPriyaId   = oid();
var uJorgeId   = oid();
// Customers
var uAliceId   = oid();
var uBobId     = oid();
var uCarlaId   = oid();
var uDerekId   = oid();
var uEmilyId   = oid();
var uFrankId   = oid();
var uGraceId   = oid();
var uHenryId   = oid();

db.accounts.insertMany([
  // ── admin ──
  {
    _id: uAdminId,
    username: "admin",
    password: PASSWORD_HASH,
    fullname: "Neusis Admin",
    email: "admin@neusis.ai",
    role: roleAdminId,
    title: "System Administrator",
    companyName: "Neusis AI",
    workNumber: "+1 (555) 000-0001",
    lastOnline: new Date(),
    hasL2Auth: false,
    deleted: false,
    preferences: { tourCompleted: true, autoRefreshTicketGrid: true, openChatWindows: [], keyboardShortcuts: true }
  },
  // ── support agents ──
  {
    _id: uSarahId,
    username: "sarah.chen",
    password: PASSWORD_HASH,
    fullname: "Sarah Chen",
    email: "sarah.chen@neusis.ai",
    role: roleSupportId,
    title: "Senior Support Engineer",
    companyName: "Neusis AI",
    workNumber: "+1 (555) 100-0101",
    lastOnline: hoursAgo(1),
    hasL2Auth: false,
    deleted: false,
    preferences: { tourCompleted: true, autoRefreshTicketGrid: true, openChatWindows: [], keyboardShortcuts: true }
  },
  {
    _id: uMarcusId,
    username: "marcus.riley",
    password: PASSWORD_HASH,
    fullname: "Marcus Riley",
    email: "marcus.riley@neusis.ai",
    role: roleSupportId,
    title: "Support Engineer",
    companyName: "Neusis AI",
    workNumber: "+1 (555) 100-0102",
    lastOnline: hoursAgo(3),
    hasL2Auth: false,
    deleted: false,
    preferences: { tourCompleted: true, autoRefreshTicketGrid: true, openChatWindows: [], keyboardShortcuts: false }
  },
  {
    _id: uPriyaId,
    username: "priya.nair",
    password: PASSWORD_HASH,
    fullname: "Priya Nair",
    email: "priya.nair@neusis.ai",
    role: roleSupportId,
    title: "Support Engineer",
    companyName: "Neusis AI",
    workNumber: "+1 (555) 100-0103",
    lastOnline: hoursAgo(2),
    hasL2Auth: false,
    deleted: false,
    preferences: { tourCompleted: false, autoRefreshTicketGrid: true, openChatWindows: [], keyboardShortcuts: true }
  },
  {
    _id: uJorgeId,
    username: "jorge.santos",
    password: PASSWORD_HASH,
    fullname: "Jorge Santos",
    email: "jorge.santos@neusis.ai",
    role: roleSupportId,
    title: "Tier-2 Support Lead",
    companyName: "Neusis AI",
    workNumber: "+1 (555) 100-0104",
    lastOnline: daysAgo(1),
    hasL2Auth: false,
    deleted: false,
    preferences: { tourCompleted: true, autoRefreshTicketGrid: false, openChatWindows: [], keyboardShortcuts: true }
  },
  // ── customers ──
  {
    _id: uAliceId,
    username: "alice.johnson",
    password: PASSWORD_HASH,
    fullname: "Alice Johnson",
    email: "alice.johnson@acmecorp.com",
    role: roleUserId,
    title: "CTO",
    companyName: "Acme Corp",
    workNumber: "+1 (555) 200-0201",
    lastOnline: hoursAgo(4),
    hasL2Auth: false,
    deleted: false,
    preferences: { tourCompleted: true, autoRefreshTicketGrid: true, openChatWindows: [], keyboardShortcuts: false }
  },
  {
    _id: uBobId,
    username: "bob.martinez",
    password: PASSWORD_HASH,
    fullname: "Bob Martinez",
    email: "bob.martinez@globaltrade.io",
    role: roleUserId,
    title: "IT Manager",
    companyName: "Global Trade Inc.",
    workNumber: "+1 (555) 200-0202",
    lastOnline: daysAgo(2),
    hasL2Auth: false,
    deleted: false,
    preferences: { tourCompleted: true, autoRefreshTicketGrid: true, openChatWindows: [], keyboardShortcuts: true }
  },
  {
    _id: uCarlaId,
    username: "carla.nguyen",
    password: PASSWORD_HASH,
    fullname: "Carla Nguyen",
    email: "carla.nguyen@brightmedia.com",
    role: roleUserId,
    title: "Product Manager",
    companyName: "Bright Media",
    workNumber: "+1 (555) 200-0203",
    lastOnline: daysAgo(1),
    hasL2Auth: false,
    deleted: false,
    preferences: { tourCompleted: false, autoRefreshTicketGrid: true, openChatWindows: [], keyboardShortcuts: false }
  },
  {
    _id: uDerekId,
    username: "derek.owusu",
    password: PASSWORD_HASH,
    fullname: "Derek Owusu",
    email: "derek.owusu@nexgenfinance.com",
    role: roleUserId,
    title: "DevOps Lead",
    companyName: "NexGen Finance",
    workNumber: "+1 (555) 200-0204",
    lastOnline: daysAgo(3),
    hasL2Auth: false,
    deleted: false,
    preferences: { tourCompleted: true, autoRefreshTicketGrid: false, openChatWindows: [], keyboardShortcuts: true }
  },
  {
    _id: uEmilyId,
    username: "emily.watson",
    password: PASSWORD_HASH,
    fullname: "Emily Watson",
    email: "emily.watson@skyretail.com",
    role: roleUserId,
    title: "Operations Director",
    companyName: "Sky Retail",
    workNumber: "+1 (555) 200-0205",
    lastOnline: daysAgo(5),
    hasL2Auth: false,
    deleted: false,
    preferences: { tourCompleted: true, autoRefreshTicketGrid: true, openChatWindows: [], keyboardShortcuts: false }
  },
  {
    _id: uFrankId,
    username: "frank.mueller",
    password: PASSWORD_HASH,
    fullname: "Frank Mueller",
    email: "frank.mueller@alphalogistics.de",
    role: roleUserId,
    title: "Systems Architect",
    companyName: "Alpha Logistics",
    workNumber: "+49 30 555-0206",
    lastOnline: daysAgo(7),
    hasL2Auth: false,
    deleted: false,
    preferences: { tourCompleted: false, autoRefreshTicketGrid: true, openChatWindows: [], keyboardShortcuts: true }
  },
  {
    _id: uGraceId,
    username: "grace.lee",
    password: PASSWORD_HASH,
    fullname: "Grace Lee",
    email: "grace.lee@quantumhealth.io",
    role: roleUserId,
    title: "Platform Engineer",
    companyName: "Quantum Health",
    workNumber: "+1 (555) 200-0207",
    lastOnline: daysAgo(2),
    hasL2Auth: false,
    deleted: false,
    preferences: { tourCompleted: true, autoRefreshTicketGrid: true, openChatWindows: [], keyboardShortcuts: true }
  },
  {
    _id: uHenryId,
    username: "henry.park",
    password: PASSWORD_HASH,
    fullname: "Henry Park",
    email: "henry.park@zenithsoftware.com",
    role: roleUserId,
    title: "Lead Developer",
    companyName: "Zenith Software",
    workNumber: "+1 (555) 200-0208",
    lastOnline: daysAgo(10),
    hasL2Auth: false,
    deleted: false,
    preferences: { tourCompleted: false, autoRefreshTicketGrid: false, openChatWindows: [], keyboardShortcuts: false }
  }
]);

// ─── teams ───────────────────────────────────────────────────────────────────

var teamTier1Id = oid();
var teamTier2Id = oid();

db.teams.insertMany([
  {
    _id: teamTier1Id,
    name: "Tier 1 Support",
    normalized: "tier 1 support",
    members: [uAdminId, uSarahId, uMarcusId, uPriyaId]
  },
  {
    _id: teamTier2Id,
    name: "Tier 2 Engineering",
    normalized: "tier 2 engineering",
    members: [uAdminId, uJorgeId, uSarahId]
  }
]);

// ─── groups ──────────────────────────────────────────────────────────────────

var grpGeneralId    = oid();
var grpBillingId    = oid();
var grpEnterpriseId = oid();

db.groups.insertMany([
  {
    _id: grpGeneralId,
    name: "General Support",
    members: [uAdminId, uSarahId, uMarcusId, uPriyaId, uJorgeId,
              uAliceId, uBobId, uCarlaId, uDerekId, uEmilyId, uFrankId, uGraceId, uHenryId],
    sendMailTo: [uSarahId, uJorgeId],
    public: true
  },
  {
    _id: grpBillingId,
    name: "Billing & Accounts",
    members: [uAdminId, uSarahId, uJorgeId, uAliceId, uBobId, uEmilyId],
    sendMailTo: [uJorgeId],
    public: false
  },
  {
    _id: grpEnterpriseId,
    name: "Enterprise Clients",
    members: [uAdminId, uJorgeId, uPriyaId, uDerekId, uFrankId, uGraceId, uHenryId],
    sendMailTo: [uJorgeId, uPriyaId],
    public: false
  }
]);

// ─── departments ──────────────────────────────────────────────────────────────

db.departments.insertMany([
  {
    _id: oid(),
    name: "Customer Support",
    normalized: "customer support",
    teams: [teamTier1Id],
    allGroups: false,
    publicGroups: true,
    groups: [grpGeneralId]
  },
  {
    _id: oid(),
    name: "Billing",
    normalized: "billing",
    teams: [teamTier1Id, teamTier2Id],
    allGroups: false,
    publicGroups: false,
    groups: [grpBillingId]
  },
  {
    _id: oid(),
    name: "Enterprise",
    normalized: "enterprise",
    teams: [teamTier2Id],
    allGroups: false,
    publicGroups: false,
    groups: [grpEnterpriseId]
  }
]);

// ─── settings ─────────────────────────────────────────────────────────────────

db.settings.insertMany([
  { name: "siteTitle",               value: "Neusis AI Support" },
  { name: "siteUrl",                 value: "http://localhost:8118" },
  { name: "defaultTicketType",       value: ttIssueId },
  { name: "defaultTicketPriority",   value: priNormalId },
  { name: "defaultTicketStatus",     value: stNewId },
  { name: "allowUserRegistration",   value: false },
  { name: "maintenanceMode",         value: false },
  { name: "playSound",               value: true },
  { name: "showTour",                value: false },
  { name: "mailerEnabled",           value: false },
  { name: "ticketIdPrefix",          value: "" },
  { name: "email:signature",         value: "The Neusis AI Support Team" },
  { name: "legal:privacyPolicy",     value: "" },
  { name: "legal:tos",               value: "" },
  { name: "installed",               value: true }
]);

// ─── tickets ──────────────────────────────────────────────────────────────────

function makeTicket(uid, owner, group, assignee, type, status, priority, tags, subject, issue, date, comments, notes) {
  var t = {
    _id:      oid(),
    uid:      uid,
    owner:    owner,
    group:    group,
    type:     type,
    status:   status,
    priority: priority,
    tags:     tags,
    subject:  subject,
    issue:    issue,
    date:     date,
    updated:  date,
    deleted:  false,
    comments: comments || [],
    notes:    notes || [],
    attachments: [],
    history: [],
    subscribers: assignee ? [assignee] : []
  };
  if (assignee) t.assignee = assignee;
  if (status === stClosedId) t.closedDate = new Date(date.getTime() + 1000 * 3600 * 8);
  return t;
}

function comment(owner, text, daysBack) {
  return { _id: oid(), owner: owner, date: daysAgo(daysBack), comment: text, deleted: false };
}

function note(owner, text, daysBack) {
  return { _id: oid(), owner: owner, date: daysAgo(daysBack), note: text, deleted: false };
}

db.tickets.insertMany([

  // ── OPEN tickets ────────────────────────────────────────────────────────

  makeTicket(1001, uAliceId, grpGeneralId, uSarahId, ttIssueId, stOpenId, priHighId,
    [tagApiId],
    "API rate limit exceeded intermittently",
    "We are intermittently hitting 429 responses on the /v2/infer endpoint even though our usage dashboard shows we are well within our contracted 10,000 req/min limit. This started around 2026-03-20 and happens roughly every 2 hours for about 5 minutes at a time. Please investigate urgently as it is impacting our production pipeline.",
    daysAgo(6),
    [
      comment(uSarahId, "Hi Alice, I've escalated this to the infrastructure team and we are reviewing API gateway logs for your account. I'll update you within 2 hours.", 5),
      comment(uAliceId, "Thanks Sarah. Still seeing the issue this morning. Our on-call engineer has a workaround (exponential backoff) but we need a root-cause fix.", 4),
      comment(uSarahId, "We identified a misconfigured rate-limit rule for enterprise plans that was introduced in last week's deployment. A patch is being rolled out now — expected resolution within 1 hour.", 3)
    ],
    [note(uJorgeId, "Confirmed the gateway config bug in issue tracker NG-4821. Patch deployed to staging, prod rollout 14:00 UTC.", 3)]
  ),

  makeTicket(1002, uBobId, grpGeneralId, uMarcusId, ttBugId, stOpenId, priCriticalId,
    [tagSecurityId],
    "SSO login loop after password reset",
    "After resetting my password via the Neusis dashboard, logging in with SSO (Okta) redirects back to the login page in an infinite loop. I cannot access the platform at all. Our entire team is blocked. Tried clearing cookies and a different browser — same result.",
    daysAgo(2),
    [
      comment(uMarcusId, "Bob, I've confirmed the issue on a test account. This appears to be a session token conflict introduced in the v2.3.1 auth service release. I'm working with the auth team now.", 1),
      comment(uBobId, "Any ETA? We have a board demo in 4 hours.", 1),
      comment(uMarcusId, "We've issued a hotfix. Please try logging in now and let me know if you're still seeing the loop.", 0)
    ],
    [note(uSarahId, "Auth service rollback approved. Hotfix SHA: 9f3a2bc. Customer notified.", 0)]
  ),

  makeTicket(1003, uCarlaId, grpGeneralId, uPriyaId, ttRequestId, stOpenId, priNormalId,
    [tagUiId, tagMobileId],
    "Mobile dashboard missing export button",
    "On the iOS app (v3.1.2) the export-to-CSV button that exists on the web dashboard is not present on the Reports > Analytics screen. We rely on weekly exports for executive reporting. Is this a known limitation or a bug?",
    daysAgo(5),
    [
      comment(uPriyaId, "Hi Carla, this is a known gap — the export feature was not included in the initial mobile release. It is on our Q2 roadmap. I'm logging this as a feature request and adding your vote.", 4),
      comment(uCarlaId, "Thanks for confirming. Can you provide a rough timeline? Q2 is broad.", 3),
      comment(uPriyaId, "Our current target is the May mobile release. I'll personally follow up with you once it reaches QA.", 2)
    ],
    []
  ),

  makeTicket(1004, uDerekId, grpEnterpriseId, uJorgeId, ttIssueId, stNewId, priHighId,
    [tagIntegrationId, tagApiId],
    "Webhook delivery failures to AWS Lambda endpoint",
    "Our AWS Lambda function receiving Neusis webhooks has not received any events since 2026-03-24 08:00 UTC. The endpoint returns 200 correctly when tested manually via curl. The Neusis delivery logs in the dashboard show events as 'delivered' but our Lambda has no invocations logged in CloudWatch for the same period.",
    daysAgo(1),
    [],
    []
  ),

  makeTicket(1005, uEmilyId, grpBillingId, uSarahId, ttIssueId, stPendingId, priNormalId,
    [tagBillingId],
    "Invoice for March shows incorrect seat count",
    "Our March 2026 invoice (#INV-20260301-4421) shows 85 seats but we only have 72 active users. We upgraded from 60 to 72 seats on March 5th. It appears the system charged us for the old seat tier plus the new tier as separate line items, doubling the overage charges. Please review and issue a corrected invoice.",
    daysAgo(8),
    [
      comment(uSarahId, "Emily, I've forwarded this to our billing team with the invoice number. They will review within 1 business day.", 7),
      comment(uEmilyId, "Following up — it's been 2 days and I haven't heard back.", 5),
      comment(uSarahId, "Apologies for the delay. The billing team confirmed a proration bug. A corrected invoice and credit note will be issued by EOD tomorrow.", 4)
    ],
    [note(uJorgeId, "Billing bug confirmed in JIRA BIL-392. Credit note for $340 approved by finance. Waiting on finance to issue.", 4)]
  ),

  makeTicket(1006, uFrankId, grpEnterpriseId, uJorgeId, ttIssueId, stOpenId, priHighId,
    [tagPerfId],
    "Model inference latency spike — p99 > 8s",
    "Since the v2.4.0 model update on 2026-03-22 our p99 inference latency has gone from ~450ms to over 8 seconds. p50 is unchanged at ~200ms so only tail latency is affected. We process ~50k requests per day and roughly 500 of them are now timing out client-side. Attaching our Grafana dashboard screenshot in the follow-up.",
    daysAgo(4),
    [
      comment(uJorgeId, "Frank, I've reproduced this with a synthetic load test on the v2.4.0 serving cluster. Tagging the ML infra team. I'll have an update by end of day.", 3),
      comment(uFrankId, "Here's our Grafana link (internal VPN required): https://grafana.alphalogistics.internal/d/neusis-latency. The spike is very visible on the 'Inference P99' panel.", 3),
      comment(uJorgeId, "Root cause identified: the new model has a memory allocation pattern that interacts poorly with our batch scheduler under high concurrency. A config fix is being tested in staging.", 2)
    ],
    [
      note(uJorgeId, "ML infra ticket: MLINFRA-2209. Workaround: reduce max_batch_size from 64 to 16 in serving config. Applying after change window tonight.", 2),
      note(uPriyaId, "Customer is enterprise tier — priority handling applies. SLA clock running.", 3)
    ]
  ),

  makeTicket(1007, uGraceId, grpGeneralId, uMarcusId, ttBugId, stNewId, priNormalId,
    [tagApiId, tagSecurityId],
    "API key rotation does not invalidate old keys immediately",
    "When I rotate an API key via the dashboard the old key continues to work for approximately 15 minutes afterward. This is a security concern as revoked keys should be invalidated immediately. We discovered this when an accidentally leaked key continued to make successful API calls 10 minutes after we rotated it.",
    daysAgo(1),
    [],
    []
  ),

  makeTicket(1008, uHenryId, grpEnterpriseId, null, ttRequestId, stNewId, priLowId,
    [tagOnboardingId],
    "Request for dedicated onboarding session for new engineering team",
    "We have 4 new engineers joining our team next month who will be working with the Neusis API. We'd like to request a dedicated 90-minute technical onboarding session covering authentication, rate limits, best practices, and the new streaming API. Do you offer this for enterprise customers?",
    daysAgo(3),
    [],
    []
  ),

  makeTicket(1009, uAliceId, grpGeneralId, uPriyaId, ttIssueId, stPendingId, priHighId,
    [tagIntegrationId],
    "Slack integration not posting ticket notifications",
    "Our Slack integration stopped posting new ticket notifications to #support-alerts around 2026-03-18. The integration shows as 'connected' in the dashboard. I've tried disconnecting and reconnecting — same result. Other Slack bots in our workspace work fine.",
    daysAgo(9),
    [
      comment(uPriyaId, "Alice, I'm looking into this. Can you confirm which Slack workspace and channel? Also, does the test notification in settings fire correctly?", 8),
      comment(uAliceId, "Workspace: AcmeCorp, channel: #support-alerts. Test notification also does not fire.", 8),
      comment(uPriyaId, "I've found the issue — our Slack app token expired. We are renewing it now. Should be resolved within the hour.", 7),
      comment(uAliceId, "Confirmed — notifications are working again. Thanks!", 7)
    ],
    [note(uJorgeId, "Slack OAuth token renewal automated going forward via new cron job. Deployed in release v2.3.3.", 6)]
  ),

  makeTicket(1010, uBobId, grpBillingId, uSarahId, ttIssueId, stNewId, priNormalId,
    [tagBillingId, tagOnboardingId],
    "Cannot add secondary payment method",
    "When I try to add a second credit card to the account for backup purposes the dashboard shows 'Payment method saved' but on refresh only the original card is listed. Tried with two different cards.",
    daysAgo(1),
    [],
    []
  ),

  // ── CLOSED tickets ──────────────────────────────────────────────────────

  makeTicket(1011, uCarlaId, grpGeneralId, uMarcusId, ttBugId, stClosedId, priNormalId,
    [tagUiId],
    "Dark mode toggle not persisting across sessions",
    "When I enable dark mode and then log out and log back in the theme resets to light mode. This happens every time. Expected: theme preference should be saved to my account.",
    daysAgo(20),
    [
      comment(uMarcusId, "Carla, confirmed bug. The theme preference was being saved to localStorage only, not the user profile. Fix is deployed in v2.2.8.", 18),
      comment(uCarlaId, "Confirmed — working now. Thanks for the quick fix!", 17)
    ],
    []
  ),

  makeTicket(1012, uDerekId, grpEnterpriseId, uJorgeId, ttIssueId, stClosedId, priCriticalId,
    [tagSecurityId, tagApiId],
    "Data export returns records belonging to another tenant",
    "URGENT SECURITY ISSUE: Our data export (Settings > Export > Full Dataset) returned approximately 200 records that clearly belong to a different customer — they contain company names and email domains we don't recognize. We immediately stopped the export and did not share the file. Please investigate immediately.",
    daysAgo(30),
    [
      comment(uJorgeId, "Derek, this has been escalated to our security team and CTO immediately. We are treating this as a P0 incident. Please do not share or open the export file. An engineer will contact you directly within 15 minutes.", 30),
      comment(uDerekId, "Understood. File is secured. Awaiting your call.", 30),
      comment(uJorgeId, "Root cause identified: a tenant isolation bug in our export service introduced in v2.1.0. We have patched the issue, audited all exports from the past 72 hours, and notified the affected tenant. A full incident report will be shared with you within 24 hours.", 29)
    ],
    [
      note(uAdminId, "Security incident SI-2026-003. RCA: missing tenant_id filter in export query. All other affected customers notified. Legal informed.", 29),
      note(uJorgeId, "Post-mortem completed and shared with customer. SOC-2 compliance review scheduled.", 25)
    ]
  ),

  makeTicket(1013, uEmilyId, grpGeneralId, uPriyaId, ttTaskId, stClosedId, priLowId,
    [tagOnboardingId],
    "Add team members to Sky Retail account",
    "Please add the following users to our account: james.reid@skyretail.com (admin), nina.cross@skyretail.com (user), tom.barnes@skyretail.com (user).",
    daysAgo(15),
    [
      comment(uPriyaId, "All three users have been invited. They should receive email invitations within 5 minutes.", 14),
      comment(uEmilyId, "All confirmed — they've accepted the invitations. Thanks!", 14)
    ],
    []
  ),

  makeTicket(1014, uGraceId, grpEnterpriseId, uSarahId, ttBugId, stClosedId, priHighId,
    [tagPerfId, tagApiId],
    "Batch inference API returns 504 for payloads over 2MB",
    "The /v2/batch-infer endpoint consistently returns 504 Gateway Timeout for request payloads over approximately 2MB. Our typical payload is 2.4MB (96 samples × 25KB each). Smaller payloads work fine.",
    daysAgo(12),
    [
      comment(uSarahId, "Grace, this is a known nginx upstream timeout configuration issue for large payloads. We've increased the proxy_read_timeout for the batch endpoint to 120s and bumped the client_max_body_size to 10MB. Deployed in v2.3.0.", 10),
      comment(uGraceId, "Tested with our standard payload — working perfectly now. Thanks!", 10)
    ],
    []
  ),

  makeTicket(1015, uFrankId, grpBillingId, uJorgeId, ttIssueId, stClosedId, priNormalId,
    [tagBillingId],
    "Annual subscription renewal email not received",
    "Our annual subscription is up for renewal on April 1st but we haven't received the 30-day or 15-day reminder emails. I want to make sure the renewal is processed in time to avoid service interruption.",
    daysAgo(18),
    [
      comment(uJorgeId, "Frank, I checked your account and found that your billing contact email (procurement@alphalogistics.de) had a hard bounce flag from a previous email campaign. I've cleared the flag and re-sent the renewal notice. You should receive it within the hour.", 17),
      comment(uFrankId, "Received! Renewal has been processed. Thanks.", 17)
    ],
    []
  ),

  makeTicket(1016, uHenryId, grpGeneralId, uMarcusId, ttBugId, stClosedId, priNormalId,
    [tagUiId],
    "Date picker in report builder shows incorrect month",
    "In the Reports > Custom Builder the date picker calendar shows month names offset by one (January shows as February, etc.). The selected date value itself appears correct in the query but the visual display is confusing.",
    daysAgo(25),
    [
      comment(uMarcusId, "Henry, this was a 0-indexed month display bug in our date picker component. Fixed in v2.2.5 — please refresh your browser or clear cache.", 24),
      comment(uHenryId, "Confirmed fixed after refresh. Thanks for the fast turnaround.", 24)
    ],
    []
  ),

  makeTicket(1017, uAliceId, grpEnterpriseId, uJorgeId, ttRequestId, stClosedId, priNormalId,
    [tagApiId, tagIntegrationId],
    "Request for API usage breakdown by endpoint in billing dashboard",
    "Currently our billing dashboard only shows total API call count. For cost allocation across our internal teams we need a breakdown by endpoint (e.g., /v2/infer vs /v2/batch-infer vs /v2/embed). Is this on the roadmap?",
    daysAgo(22),
    [
      comment(uJorgeId, "Alice, per-endpoint usage breakdown is on our roadmap for Q3. In the meantime I can set up a weekly usage report email that includes endpoint-level detail — would that work?", 21),
      comment(uAliceId, "That would be very helpful as a temporary solution. Please set it up for alice.johnson@acmecorp.com.", 21),
      comment(uJorgeId, "Done — weekly report will arrive every Monday at 09:00 UTC. Closing this ticket; I'll reopen when the dashboard feature ships.", 20)
    ],
    []
  ),

  makeTicket(1018, uBobId, grpGeneralId, uPriyaId, ttIssueId, stClosedId, priLowId,
    [],
    "Documentation link in welcome email is broken",
    "The 'Getting Started' link in the welcome email we received after signing up goes to a 404 page (https://docs.neusis.ai/getting-started).",
    daysAgo(35),
    [
      comment(uPriyaId, "Bob, thanks for reporting. The docs were recently reorganized and the link in the email template was not updated. Fixed now — the correct URL is https://docs.neusis.ai/quickstart. The email template has been updated.", 34)
    ],
    []
  ),

  makeTicket(1019, uCarlaId, grpBillingId, uSarahId, ttIssueId, stClosedId, priNormalId,
    [tagBillingId],
    "Upgrade from Starter to Professional plan mid-month proration",
    "We upgraded from Starter to Professional on March 10th. Our invoice for March shows the full Professional price for the month instead of prorated amounts. We should only be charged for 21 days of Professional and 9 days of Starter.",
    daysAgo(13),
    [
      comment(uSarahId, "Carla, you're correct — proration should have been applied. I've raised this with billing. A corrected invoice will be issued within 2 business days with a credit note for the difference.", 12),
      comment(uCarlaId, "Thank you. Received the corrected invoice — looks right now.", 10)
    ],
    []
  ),

  makeTicket(1020, uDerekId, grpGeneralId, uMarcusId, ttTaskId, stClosedId, priLowId,
    [tagOnboardingId],
    "Request sandbox environment credentials",
    "We are starting integration work with the Neusis API and would like access to a sandbox environment so our developers can test without impacting production data or API quotas.",
    daysAgo(40),
    [
      comment(uMarcusId, "Derek, sandbox credentials have been provisioned. Details sent to your registered email. The sandbox environment mirrors production but with a 100 req/min rate limit and isolated data.", 39),
      comment(uDerekId, "Got them — thanks! Already have two devs testing.", 38)
    ],
    []
  )

]);

// ─── done ────────────────────────────────────────────────────────────────────

print("");
print("==========================================================");
print("  Neusis seed complete!");
print("==========================================================");
print("  Roles     : Administrator, Support, User");
print("  Users     : 1 admin  |  4 agents  |  8 customers");
print("  Groups    : General Support, Billing & Accounts, Enterprise Clients");
print("  Teams     : Tier 1 Support, Tier 2 Engineering");
print("  Priorities: Critical, High, Normal, Low");
print("  Statuses  : New, Open, Pending, Closed");
print("  Types     : Issue, Task, Feature Request, Bug");
print("  Tags      : billing, onboarding, api, security, ui, performance, integration, mobile");
print("  Tickets   : 20 (10 open/new/pending  +  10 closed)");
print("");
print("  Login at http://localhost:8118");
print("  Username : admin");
print("  Password : Password1!");
print("==========================================================");
