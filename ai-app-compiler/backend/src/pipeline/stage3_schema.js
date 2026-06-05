// Stage 3: Schema Generation
// Generates UI, API, DB, and Auth configs from the AppBlueprint

const COMPONENT_MAP = {
  Dashboard: ['StatsGrid', 'RecentActivityFeed', 'QuickActionsBar', 'ChartWidget'],
  Login: ['LoginForm', 'SocialLoginButtons'],
  Register: ['RegisterForm'],
  Profile: ['ProfileCard', 'EditProfileForm', 'ActivityLog'],
  Contacts: ['DataTable', 'CreateContactModal', 'ContactDetailPanel', 'SearchBar', 'FilterBar'],
  Products: ['ProductGrid', 'ProductCard', 'CreateProductModal', 'SearchBar', 'FilterBar'],
  Orders: ['DataTable', 'OrderDetailPanel', 'StatusBadge', 'DateRangePicker'],
  Analytics: ['LineChart', 'BarChart', 'PieChart', 'MetricCard', 'DateRangePicker', 'ExportButton'],
  Users: ['DataTable', 'UserDetailPanel', 'RoleBadge', 'InviteUserModal'],
  Billing: ['PlanSelector', 'PaymentForm', 'InvoiceList', 'SubscriptionStatus'],
  Tasks: ['KanbanBoard', 'TaskCard', 'CreateTaskModal', 'AssigneeSelector'],
  Courses: ['CourseGrid', 'CourseCard', 'EnrollButton', 'ProgressBar'],
  Employees: ['DataTable', 'EmployeeCard', 'DepartmentFilter'],
  Inventory: ['DataTable', 'StockAlert', 'AdjustStockModal'],
  Messages: ['MessageList', 'MessageComposer', 'ConversationPanel']
};

const LAYOUT_MAP = {
  Dashboard: 'grid',
  Login: 'centered',
  Register: 'centered',
  Profile: 'sidebar',
  Analytics: 'grid',
  Billing: 'centered'
};

function generateUISchema(blueprint) {
  const pages = blueprint.pages.map((pageName, index) => {
    const components = (COMPONENT_MAP[pageName] || ['ContentArea']).map((comp, ci) => ({
      id: `${pageName.toLowerCase()}_${comp.toLowerCase()}_${ci}`,
      type: comp,
      props: {
        title: comp.replace(/([A-Z])/g, ' $1').trim(),
        dataSource: pageName.toLowerCase()
      }
    }));

    const isPublic = ['Login', 'Register'].includes(pageName);
    return {
      id: `page_${pageName.toLowerCase()}`,
      name: pageName,
      route: pageName === 'Dashboard' ? '/' : `/${pageName.toLowerCase()}`,
      layout: LAYOUT_MAP[pageName] || 'sidebar',
      components,
      accessRoles: isPublic ? ['*'] : blueprint.roles.map(r => r.name),
      isPublic,
      icon: getPageIcon(pageName)
    };
  });

  const navigation = pages
    .filter(p => !p.isPublic)
    .map(p => ({
      id: `nav_${p.id}`,
      label: p.name,
      route: p.route,
      icon: p.icon
    }));

  return {
    pages,
    navigation,
    theme: {
      primaryColor: '#6366f1',
      secondaryColor: '#8b5cf6',
      backgroundColor: '#0f0f1a',
      surfaceColor: '#1a1a2e',
      textColor: '#e2e8f0',
      accentColor: '#06b6d4',
      mode: 'dark',
      fontFamily: 'Inter, sans-serif',
      borderRadius: '8px',
      glassmorphism: true
    }
  };
}

function getPageIcon(pageName) {
  const icons = {
    Dashboard: 'grid', Login: 'lock', Register: 'user-plus', Profile: 'user',
    Contacts: 'users', Products: 'package', Orders: 'shopping-cart',
    Analytics: 'bar-chart', Users: 'users', Billing: 'credit-card',
    Tasks: 'check-square', Courses: 'book', Employees: 'briefcase',
    Inventory: 'box', Messages: 'message-circle'
  };
  return icons[pageName] || 'circle';
}

function generateAPISchema(blueprint) {
  const endpoints = [];
  const adminRoles = blueprint.roles.filter(r => ['admin', 'superadmin', 'manager'].includes(r.name)).map(r => r.name);
  const allRoles = blueprint.roles.map(r => r.name);

  if (blueprint.features.auth) {
    endpoints.push(
      { id: 'auth_login', method: 'POST', path: '/api/auth/login', description: 'Authenticate user and return JWT', authRequired: false, roles: [], requestSchema: { entity: 'User', fields: ['email', 'password'] }, responseSchema: { token: 'string', user: 'UserObject' }, rateLimit: '10/minute' },
      { id: 'auth_register', method: 'POST', path: '/api/auth/register', description: 'Register new user account', authRequired: false, roles: [], requestSchema: { entity: 'User', fields: ['email', 'password', 'name'] }, responseSchema: { token: 'string', user: 'UserObject' }, rateLimit: '5/minute' },
      { id: 'auth_logout', method: 'POST', path: '/api/auth/logout', description: 'Logout and invalidate token', authRequired: true, roles: allRoles, requestSchema: {}, responseSchema: { success: 'boolean' } },
      { id: 'auth_me', method: 'GET', path: '/api/auth/me', description: 'Get current authenticated user', authRequired: true, roles: allRoles, requestSchema: {}, responseSchema: { user: 'UserObject' } },
      { id: 'auth_refresh', method: 'POST', path: '/api/auth/refresh', description: 'Refresh JWT token', authRequired: true, roles: allRoles, requestSchema: { token: 'string' }, responseSchema: { token: 'string' } }
    );
  }

  Object.keys(blueprint.entities).forEach(entityName => {
    const tableName = entityName.toLowerCase() + 's';
    const entityRoles = entityName === 'User' ? adminRoles : allRoles;
    endpoints.push(
      { id: `${tableName}_list`, method: 'GET', path: `/api/${tableName}`, description: `List all ${tableName} with pagination`, authRequired: true, roles: entityRoles, requestSchema: { entity: entityName, queryParams: ['page', 'limit', 'sort', 'filter'] }, responseSchema: { data: `${entityName}[]`, total: 'number', page: 'number', limit: 'number' } },
      { id: `${tableName}_get`, method: 'GET', path: `/api/${tableName}/:id`, description: `Get single ${entityName} by ID`, authRequired: true, roles: entityRoles, requestSchema: { entity: entityName, params: ['id'] }, responseSchema: { data: `${entityName}Object` } },
      { id: `${tableName}_create`, method: 'POST', path: `/api/${tableName}`, description: `Create new ${entityName}`, authRequired: true, roles: entityRoles, requestSchema: { entity: entityName, body: 'CreateDTO' }, responseSchema: { data: `${entityName}Object` } },
      { id: `${tableName}_update`, method: 'PATCH', path: `/api/${tableName}/:id`, description: `Update ${entityName}`, authRequired: true, roles: entityRoles, requestSchema: { entity: entityName, params: ['id'], body: 'UpdateDTO' }, responseSchema: { data: `${entityName}Object` } },
      { id: `${tableName}_delete`, method: 'DELETE', path: `/api/${tableName}/:id`, description: `Delete ${entityName}`, authRequired: true, roles: adminRoles.length ? adminRoles : entityRoles, requestSchema: { entity: entityName, params: ['id'] }, responseSchema: { success: 'boolean' } }
    );
  });

  if (blueprint.features.analytics) {
    endpoints.push(
      { id: 'analytics_stats', method: 'GET', path: '/api/analytics/stats', description: 'Get aggregate statistics', authRequired: true, roles: adminRoles, requestSchema: { queryParams: ['from', 'to', 'metric'] }, responseSchema: { metrics: 'MetricObject[]', charts: 'ChartData[]' } },
      { id: 'analytics_export', method: 'GET', path: '/api/analytics/export', description: 'Export analytics data as CSV', authRequired: true, roles: adminRoles, requestSchema: { queryParams: ['format', 'from', 'to'] }, responseSchema: { file: 'Buffer', filename: 'string' } }
    );
  }

  if (blueprint.features.payments) {
    endpoints.push(
      { id: 'billing_plans', method: 'GET', path: '/api/billing/plans', description: 'List available subscription plans', authRequired: false, roles: [], requestSchema: {}, responseSchema: { plans: 'Plan[]' } },
      { id: 'billing_subscribe', method: 'POST', path: '/api/billing/subscribe', description: 'Create Stripe checkout session', authRequired: true, roles: allRoles, requestSchema: { planId: 'string' }, responseSchema: { checkoutUrl: 'string', sessionId: 'string' } },
      { id: 'billing_webhook', method: 'POST', path: '/api/billing/webhook', description: 'Stripe webhook handler', authRequired: false, roles: [], requestSchema: { stripeEvent: 'StripeEvent' }, responseSchema: { received: 'boolean' } },
      { id: 'billing_portal', method: 'POST', path: '/api/billing/portal', description: 'Create billing portal session', authRequired: true, roles: allRoles, requestSchema: {}, responseSchema: { portalUrl: 'string' } }
    );
  }

  if (blueprint.features.search) {
    endpoints.push({ id: 'search_global', method: 'GET', path: '/api/search', description: 'Global search across all entities', authRequired: true, roles: allRoles, requestSchema: { queryParams: ['q', 'type', 'limit'] }, responseSchema: { results: 'SearchResult[]', total: 'number' } });
  }

  return {
    baseUrl: '/api/v1',
    version: 'v1',
    endpoints,
    middleware: [
      { name: 'authenticate', description: 'Verify JWT token', appliesTo: 'all_protected' },
      { name: 'authorize', description: 'Check role permissions', appliesTo: 'role_protected' },
      { name: 'rateLimiter', description: 'Rate limiting per IP', appliesTo: 'auth_endpoints' },
      { name: 'requestLogger', description: 'Log all requests', appliesTo: 'all' },
      { name: 'errorHandler', description: 'Global error handler', appliesTo: 'all' }
    ]
  };
}

function generateDBSchema(blueprint) {
  const tables = Object.entries(blueprint.entities).map(([entityName, entity]) => ({
    name: entity.tableName,
    displayName: entityName,
    columns: entity.fields,
    primaryKey: 'id',
    indices: entity.fields.filter(f => f.foreignKey || f.unique).map(f => ({ column: f.name, unique: !!f.unique })),
    timestamps: entity.fields.some(f => f.name === 'created_at')
  }));

  return {
    dialect: 'postgresql',
    version: '14',
    tables,
    relations: blueprint.relations,
    migrations: [
      { version: '001', name: 'initial_schema', description: 'Create all base tables' },
      { version: '002', name: 'add_indices', description: 'Add performance indices' }
    ],
    seedData: {
      description: 'Sample data for development',
      includes: ['admin user', 'sample records for each entity']
    }
  };
}

function generateAuthSchema(blueprint) {
  const resources = Object.keys(blueprint.entities).map(e => e.toLowerCase());
  const permissionsMatrix = {};

  blueprint.roles.forEach(role => {
    permissionsMatrix[role.name] = {};
    resources.forEach(resource => {
      const perms = role.permissions || [];
      permissionsMatrix[role.name][resource] = {
        create: perms.includes('create'),
        read: perms.includes('read'),
        update: perms.includes('update'),
        delete: perms.includes('delete')
      };
    });
  });

  return {
    strategy: 'jwt',
    provider: 'local',
    jwtConfig: {
      secret: 'ENV:JWT_SECRET',
      expiresIn: '7d',
      algorithm: 'HS256',
      refreshTokenExpiresIn: '30d'
    },
    roles: blueprint.roles,
    permissionsMatrix,
    passwordPolicy: {
      minLength: 8,
      requireUppercase: true,
      requireNumbers: true,
      requireSpecialChars: false
    },
    sessionConfig: {
      httpOnly: true,
      secure: true,
      sameSite: 'strict'
    }
  };
}

function generateSchemas(blueprint) {
  const ui = generateUISchema(blueprint);
  const api = generateAPISchema(blueprint);
  const db = generateDBSchema(blueprint);
  const auth = generateAuthSchema(blueprint);
  return { stage: 'schema_generation', ui, api, db, auth };
}

module.exports = { generateSchemas, generateUISchema, generateAPISchema, generateDBSchema, generateAuthSchema };
