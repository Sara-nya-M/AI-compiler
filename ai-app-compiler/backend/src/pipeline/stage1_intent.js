// Stage 1: Intent Extraction
// Parses user NL input into a structured IntentSpec

const APP_TYPES = {
  crm: ['crm', 'contact', 'customer', 'lead', 'sales', 'pipeline'],
  ecommerce: ['shop', 'store', 'product', 'cart', 'order', 'payment', 'checkout'],
  lms: ['course', 'lesson', 'learning', 'student', 'instructor', 'quiz', 'lms', 'education'],
  hr: ['hr', 'employee', 'recruitment', 'leave', 'payroll', 'attendance', 'staff'],
  analytics: ['analytics', 'dashboard', 'report', 'metric', 'kpi', 'chart', 'insight'],
  project: ['project', 'task', 'kanban', 'sprint', 'ticket', 'issue', 'board'],
  healthcare: ['patient', 'doctor', 'appointment', 'medical', 'health', 'clinic'],
  finance: ['invoice', 'expense', 'budget', 'accounting', 'transaction', 'finance'],
  social: ['post', 'feed', 'follower', 'like', 'comment', 'social', 'community'],
  inventory: ['inventory', 'stock', 'warehouse', 'sku', 'supply', 'item']
};

const FEATURE_KEYWORDS = {
  auth: ['login', 'signup', 'register', 'authentication', 'auth', 'logout', 'password'],
  rbac: ['role', 'permission', 'access', 'admin', 'manager', 'rbac', 'role-based'],
  payments: ['payment', 'stripe', 'billing', 'subscription', 'premium', 'paid', 'plan', 'checkout'],
  search: ['search', 'filter', 'sort', 'query'],
  notifications: ['notification', 'email', 'alert', 'sms', 'push'],
  analytics: ['analytics', 'report', 'chart', 'graph', 'metric', 'dashboard'],
  fileUpload: ['upload', 'file', 'image', 'attachment', 'document'],
  api: ['api', 'webhook', 'integration', 'connect', 'rest'],
  realtime: ['realtime', 'live', 'socket', 'websocket', 'instant'],
  export: ['export', 'csv', 'pdf', 'download', 'report']
};

const ENTITY_PATTERNS = [
  { pattern: /\b(user|users|account|accounts)\b/i, entity: 'User' },
  { pattern: /\b(contact|contacts|customer|customers|client|clients)\b/i, entity: 'Contact' },
  { pattern: /\b(product|products|item|items)\b/i, entity: 'Product' },
  { pattern: /\b(order|orders|purchase|purchases)\b/i, entity: 'Order' },
  { pattern: /\b(payment|payments|invoice|invoices)\b/i, entity: 'Payment' },
  { pattern: /\b(project|projects)\b/i, entity: 'Project' },
  { pattern: /\b(task|tasks|ticket|tickets)\b/i, entity: 'Task' },
  { pattern: /\b(course|courses|lesson|lessons)\b/i, entity: 'Course' },
  { pattern: /\b(employee|employees|staff)\b/i, entity: 'Employee' },
  { pattern: /\b(appointment|appointments|booking|bookings)\b/i, entity: 'Appointment' },
  { pattern: /\b(report|reports|analytics|metrics)\b/i, entity: 'Report' },
  { pattern: /\b(message|messages|notification|notifications)\b/i, entity: 'Message' },
  { pattern: /\b(lead|leads|prospect|prospects)\b/i, entity: 'Lead' },
  { pattern: /\b(category|categories|tag|tags)\b/i, entity: 'Category' },
  { pattern: /\b(role|roles|permission|permissions)\b/i, entity: 'Role' },
  { pattern: /\b(plan|plans|subscription|subscriptions|tier|tiers)\b/i, entity: 'Subscription' },
  { pattern: /\b(inventory|stock|warehouse)\b/i, entity: 'Inventory' }
];

const ROLE_PATTERNS = [
  /\b(admin|administrator)\b/i,
  /\b(manager|managers)\b/i,
  /\b(user|users)\b/i,
  /\b(student|students)\b/i,
  /\b(teacher|instructor|teachers|instructors)\b/i,
  /\b(customer|customers|client|clients)\b/i,
  /\b(employee|employees)\b/i,
  /\b(super.?admin|superadmin)\b/i,
  /\b(moderator|moderators)\b/i,
  /\b(vendor|vendors|seller|sellers)\b/i
];

const PAGE_PATTERNS = [
  { pattern: /\b(dashboard|home|overview|main)\b/i, page: 'Dashboard' },
  { pattern: /\b(login|sign.?in|auth)\b/i, page: 'Login' },
  { pattern: /\b(register|sign.?up|signup)\b/i, page: 'Register' },
  { pattern: /\b(profile|account|settings)\b/i, page: 'Profile' },
  { pattern: /\b(contact|contacts|customer|customers)\b/i, page: 'Contacts' },
  { pattern: /\b(product|products|catalog)\b/i, page: 'Products' },
  { pattern: /\b(order|orders)\b/i, page: 'Orders' },
  { pattern: /\b(analytics|report|reports|metrics)\b/i, page: 'Analytics' },
  { pattern: /\b(user|users|team|members)\b/i, page: 'Users' },
  { pattern: /\b(payment|billing|subscription|plan)\b/i, page: 'Billing' },
  { pattern: /\b(task|tasks|kanban|board)\b/i, page: 'Tasks' },
  { pattern: /\b(course|courses|lesson)\b/i, page: 'Courses' },
  { pattern: /\b(employee|staff|hr)\b/i, page: 'Employees' },
  { pattern: /\b(inventory|stock|warehouse)\b/i, page: 'Inventory' },
  { pattern: /\b(message|inbox|chat)\b/i, page: 'Messages' }
];

function detectAppType(prompt) {
  const lower = prompt.toLowerCase();
  const scores = {};
  for (const [type, keywords] of Object.entries(APP_TYPES)) {
    scores[type] = keywords.filter(kw => lower.includes(kw)).length;
  }
  const sorted = Object.entries(scores).sort((a, b) => b[1] - a[1]);
  return sorted[0][1] > 0 ? sorted[0][0] : 'general';
}

function detectFeatures(prompt) {
  const lower = prompt.toLowerCase();
  const features = {};
  for (const [feature, keywords] of Object.entries(FEATURE_KEYWORDS)) {
    features[feature] = keywords.some(kw => lower.includes(kw));
  }
  return features;
}

function detectEntities(prompt) {
  const found = new Set(['User']); // always include User
  for (const { pattern, entity } of ENTITY_PATTERNS) {
    if (pattern.test(prompt)) found.add(entity);
  }
  return Array.from(found);
}

function detectRoles(prompt) {
  const found = new Set(['user']); // always have base user role
  for (const pattern of ROLE_PATTERNS) {
    const match = prompt.match(pattern);
    if (match) {
      const role = match[0].toLowerCase().replace(/s$/, '').replace(/[^a-z]/g, '');
      if (role && role !== 'user') found.add(role);
    }
  }
  if (found.size === 1) found.add('admin'); // default admin
  return Array.from(found);
}

function detectPages(prompt) {
  const found = new Set(['Dashboard', 'Login']);
  for (const { pattern, page } of PAGE_PATTERNS) {
    if (pattern.test(prompt)) found.add(page);
  }
  return Array.from(found);
}

function assessVagueness(prompt) {
  const wordCount = prompt.trim().split(/\s+/).length;
  const hasEntities = ENTITY_PATTERNS.some(({ pattern }) => pattern.test(prompt));
  const hasFeatures = Object.values(FEATURE_KEYWORDS).some(kws => kws.some(kw => prompt.toLowerCase().includes(kw)));

  if (wordCount < 5) return { isVague: true, reason: 'Prompt too short (< 5 words)', confidence: 0.2 };
  if (!hasEntities && !hasFeatures) return { isVague: true, reason: 'No recognizable entities or features detected', confidence: 0.3 };
  if (wordCount < 10) return { isVague: false, confidence: 0.5 };
  return { isVague: false, confidence: Math.min(0.95, 0.5 + (wordCount / 100)) };
}

function detectConflicts(prompt) {
  const conflicts = [];
  const lower = prompt.toLowerCase();

  if (lower.includes('free') && lower.includes('premium') && lower.includes('payment')) {
    conflicts.push({ type: 'PRICING_CONFLICT', description: 'Both free and premium/payment mentioned — assuming freemium model with optional premium upgrade' });
  }
  if ((lower.includes('no login') || lower.includes('without login')) && (lower.includes('admin') || lower.includes('role'))) {
    conflicts.push({ type: 'AUTH_CONFLICT', description: '"No login" conflicts with admin/roles — assuming login required for admin, optional for public' });
  }
  if (lower.includes('simple') && lower.includes('enterprise')) {
    conflicts.push({ type: 'SCOPE_CONFLICT', description: 'Conflicting scope (simple vs enterprise) — building modular design, start simple' });
  }

  return conflicts;
}

function extractIntent(prompt) {
  const vagueness = assessVagueness(prompt);
  const appType = detectAppType(prompt);
  const features = detectFeatures(prompt);
  const entities = detectEntities(prompt);
  const roles = detectRoles(prompt);
  const pages = detectPages(prompt);
  const conflicts = detectConflicts(prompt);

  const assumptions = [];
  if (!features.auth && roles.length > 1) {
    assumptions.push('Authentication assumed required since multiple roles detected');
    features.auth = true;
  }
  if (features.payments && !features.rbac) {
    assumptions.push('Role-based access assumed required since payments/premium mentioned');
    features.rbac = true;
  }
  if (roles.includes('admin') && !pages.includes('Analytics')) {
    assumptions.push('Analytics page added for admin role by default');
    pages.push('Analytics');
  }
  if (vagueness.isVague) {
    assumptions.push(`Vague prompt detected: ${vagueness.reason}. Building general-purpose ${appType} app`);
  }
  conflicts.forEach(c => assumptions.push(`Conflict resolved: ${c.description}`));

  return {
    stage: 'intent_extraction',
    input: prompt,
    appType,
    confidence: vagueness.confidence,
    isVague: vagueness.isVague,
    features,
    entities,
    roles,
    pages,
    conflicts,
    assumptions
  };
}

module.exports = { extractIntent };
