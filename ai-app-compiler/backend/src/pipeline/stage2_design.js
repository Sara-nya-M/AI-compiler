// Stage 2: System Design Layer
// Converts IntentSpec → AppBlueprint with entities, flows, roles

const ENTITY_FIELDS = {
  User: [
    { name: 'id', type: 'uuid', nullable: false, primaryKey: true },
    { name: 'email', type: 'string', nullable: false, unique: true },
    { name: 'password_hash', type: 'string', nullable: false },
    { name: 'name', type: 'string', nullable: false },
    { name: 'role', type: 'enum', nullable: false, default: 'user' },
    { name: 'created_at', type: 'timestamp', nullable: false, default: 'now()' },
    { name: 'updated_at', type: 'timestamp', nullable: false, default: 'now()' },
    { name: 'is_active', type: 'boolean', nullable: false, default: true }
  ],
  Contact: [
    { name: 'id', type: 'uuid', nullable: false, primaryKey: true },
    { name: 'name', type: 'string', nullable: false },
    { name: 'email', type: 'string', nullable: true },
    { name: 'phone', type: 'string', nullable: true },
    { name: 'company', type: 'string', nullable: true },
    { name: 'status', type: 'enum', nullable: false, default: 'active', enumValues: ['active', 'inactive', 'lead'] },
    { name: 'owner_id', type: 'uuid', nullable: false, foreignKey: 'users.id' },
    { name: 'created_at', type: 'timestamp', nullable: false, default: 'now()' },
    { name: 'notes', type: 'text', nullable: true }
  ],
  Product: [
    { name: 'id', type: 'uuid', nullable: false, primaryKey: true },
    { name: 'name', type: 'string', nullable: false },
    { name: 'description', type: 'text', nullable: true },
    { name: 'price', type: 'decimal', nullable: false },
    { name: 'sku', type: 'string', nullable: false, unique: true },
    { name: 'stock_quantity', type: 'integer', nullable: false, default: 0 },
    { name: 'category_id', type: 'uuid', nullable: true },
    { name: 'is_active', type: 'boolean', nullable: false, default: true },
    { name: 'created_at', type: 'timestamp', nullable: false, default: 'now()' }
  ],
  Order: [
    { name: 'id', type: 'uuid', nullable: false, primaryKey: true },
    { name: 'user_id', type: 'uuid', nullable: false, foreignKey: 'users.id' },
    { name: 'total_amount', type: 'decimal', nullable: false },
    { name: 'status', type: 'enum', nullable: false, default: 'pending', enumValues: ['pending', 'processing', 'shipped', 'delivered', 'cancelled'] },
    { name: 'payment_status', type: 'enum', nullable: false, default: 'unpaid', enumValues: ['unpaid', 'paid', 'refunded'] },
    { name: 'created_at', type: 'timestamp', nullable: false, default: 'now()' },
    { name: 'updated_at', type: 'timestamp', nullable: false, default: 'now()' }
  ],
  Payment: [
    { name: 'id', type: 'uuid', nullable: false, primaryKey: true },
    { name: 'user_id', type: 'uuid', nullable: false, foreignKey: 'users.id' },
    { name: 'amount', type: 'decimal', nullable: false },
    { name: 'currency', type: 'string', nullable: false, default: 'USD' },
    { name: 'status', type: 'enum', nullable: false, default: 'pending', enumValues: ['pending', 'succeeded', 'failed', 'refunded'] },
    { name: 'payment_method', type: 'string', nullable: true },
    { name: 'stripe_payment_id', type: 'string', nullable: true },
    { name: 'created_at', type: 'timestamp', nullable: false, default: 'now()' }
  ],
  Subscription: [
    { name: 'id', type: 'uuid', nullable: false, primaryKey: true },
    { name: 'user_id', type: 'uuid', nullable: false, foreignKey: 'users.id' },
    { name: 'plan', type: 'enum', nullable: false, default: 'free', enumValues: ['free', 'basic', 'premium', 'enterprise'] },
    { name: 'status', type: 'enum', nullable: false, default: 'active', enumValues: ['active', 'cancelled', 'past_due'] },
    { name: 'current_period_start', type: 'timestamp', nullable: false },
    { name: 'current_period_end', type: 'timestamp', nullable: false },
    { name: 'stripe_subscription_id', type: 'string', nullable: true }
  ],
  Project: [
    { name: 'id', type: 'uuid', nullable: false, primaryKey: true },
    { name: 'name', type: 'string', nullable: false },
    { name: 'description', type: 'text', nullable: true },
    { name: 'status', type: 'enum', nullable: false, default: 'active', enumValues: ['planning', 'active', 'on_hold', 'completed'] },
    { name: 'owner_id', type: 'uuid', nullable: false, foreignKey: 'users.id' },
    { name: 'due_date', type: 'date', nullable: true },
    { name: 'created_at', type: 'timestamp', nullable: false, default: 'now()' }
  ],
  Task: [
    { name: 'id', type: 'uuid', nullable: false, primaryKey: true },
    { name: 'title', type: 'string', nullable: false },
    { name: 'description', type: 'text', nullable: true },
    { name: 'status', type: 'enum', nullable: false, default: 'todo', enumValues: ['todo', 'in_progress', 'review', 'done'] },
    { name: 'priority', type: 'enum', nullable: false, default: 'medium', enumValues: ['low', 'medium', 'high', 'critical'] },
    { name: 'assignee_id', type: 'uuid', nullable: true, foreignKey: 'users.id' },
    { name: 'project_id', type: 'uuid', nullable: true, foreignKey: 'projects.id' },
    { name: 'due_date', type: 'timestamp', nullable: true },
    { name: 'created_at', type: 'timestamp', nullable: false, default: 'now()' }
  ],
  Course: [
    { name: 'id', type: 'uuid', nullable: false, primaryKey: true },
    { name: 'title', type: 'string', nullable: false },
    { name: 'description', type: 'text', nullable: true },
    { name: 'instructor_id', type: 'uuid', nullable: false, foreignKey: 'users.id' },
    { name: 'category', type: 'string', nullable: true },
    { name: 'price', type: 'decimal', nullable: false, default: 0 },
    { name: 'is_published', type: 'boolean', nullable: false, default: false },
    { name: 'created_at', type: 'timestamp', nullable: false, default: 'now()' }
  ],
  Employee: [
    { name: 'id', type: 'uuid', nullable: false, primaryKey: true },
    { name: 'user_id', type: 'uuid', nullable: true, foreignKey: 'users.id' },
    { name: 'name', type: 'string', nullable: false },
    { name: 'email', type: 'string', nullable: false, unique: true },
    { name: 'department', type: 'string', nullable: true },
    { name: 'position', type: 'string', nullable: true },
    { name: 'salary', type: 'decimal', nullable: true },
    { name: 'hire_date', type: 'date', nullable: false },
    { name: 'status', type: 'enum', nullable: false, default: 'active', enumValues: ['active', 'on_leave', 'terminated'] }
  ],
  Lead: [
    { name: 'id', type: 'uuid', nullable: false, primaryKey: true },
    { name: 'name', type: 'string', nullable: false },
    { name: 'email', type: 'string', nullable: true },
    { name: 'phone', type: 'string', nullable: true },
    { name: 'company', type: 'string', nullable: true },
    { name: 'source', type: 'string', nullable: true },
    { name: 'stage', type: 'enum', nullable: false, default: 'new', enumValues: ['new', 'contacted', 'qualified', 'proposal', 'closed_won', 'closed_lost'] },
    { name: 'assigned_to', type: 'uuid', nullable: true, foreignKey: 'users.id' },
    { name: 'value', type: 'decimal', nullable: true },
    { name: 'created_at', type: 'timestamp', nullable: false, default: 'now()' }
  ],
  Appointment: [
    { name: 'id', type: 'uuid', nullable: false, primaryKey: true },
    { name: 'title', type: 'string', nullable: false },
    { name: 'user_id', type: 'uuid', nullable: false, foreignKey: 'users.id' },
    { name: 'start_time', type: 'timestamp', nullable: false },
    { name: 'end_time', type: 'timestamp', nullable: false },
    { name: 'status', type: 'enum', nullable: false, default: 'scheduled', enumValues: ['scheduled', 'completed', 'cancelled'] },
    { name: 'notes', type: 'text', nullable: true }
  ],
  Report: [
    { name: 'id', type: 'uuid', nullable: false, primaryKey: true },
    { name: 'name', type: 'string', nullable: false },
    { name: 'type', type: 'string', nullable: false },
    { name: 'data', type: 'json', nullable: true },
    { name: 'created_by', type: 'uuid', nullable: false, foreignKey: 'users.id' },
    { name: 'created_at', type: 'timestamp', nullable: false, default: 'now()' }
  ],
  Message: [
    { name: 'id', type: 'uuid', nullable: false, primaryKey: true },
    { name: 'sender_id', type: 'uuid', nullable: false, foreignKey: 'users.id' },
    { name: 'recipient_id', type: 'uuid', nullable: true, foreignKey: 'users.id' },
    { name: 'content', type: 'text', nullable: false },
    { name: 'is_read', type: 'boolean', nullable: false, default: false },
    { name: 'created_at', type: 'timestamp', nullable: false, default: 'now()' }
  ],
  Inventory: [
    { name: 'id', type: 'uuid', nullable: false, primaryKey: true },
    { name: 'product_id', type: 'uuid', nullable: false, foreignKey: 'products.id' },
    { name: 'quantity', type: 'integer', nullable: false, default: 0 },
    { name: 'warehouse_location', type: 'string', nullable: true },
    { name: 'last_updated', type: 'timestamp', nullable: false, default: 'now()' }
  ],
  Category: [
    { name: 'id', type: 'uuid', nullable: false, primaryKey: true },
    { name: 'name', type: 'string', nullable: false, unique: true },
    { name: 'description', type: 'text', nullable: true },
    { name: 'parent_id', type: 'uuid', nullable: true, foreignKey: 'categories.id' }
  ],
  Role: [
    { name: 'id', type: 'uuid', nullable: false, primaryKey: true },
    { name: 'name', type: 'string', nullable: false, unique: true },
    { name: 'description', type: 'text', nullable: true },
    { name: 'permissions', type: 'json', nullable: false, default: '[]' }
  ]
};

const ROLE_PERMISSIONS = {
  superadmin: ['create', 'read', 'update', 'delete', 'manage_users', 'manage_roles', 'view_analytics', 'manage_billing', 'export'],
  admin: ['create', 'read', 'update', 'delete', 'manage_users', 'view_analytics', 'export'],
  manager: ['create', 'read', 'update', 'view_analytics', 'export'],
  user: ['create', 'read', 'update'],
  customer: ['read', 'create_order'],
  student: ['read', 'submit'],
  instructor: ['read', 'create', 'update'],
  teacher: ['read', 'create', 'update', 'grade'],
  employee: ['read', 'update_self'],
  moderator: ['read', 'update', 'delete'],
  vendor: ['create', 'read', 'update']
};

function buildEntityGraph(entities) {
  const graph = {};
  entities.forEach(entity => {
    const fields = ENTITY_FIELDS[entity] || [
      { name: 'id', type: 'uuid', nullable: false, primaryKey: true },
      { name: 'name', type: 'string', nullable: false },
      { name: 'created_at', type: 'timestamp', nullable: false, default: 'now()' }
    ];
    graph[entity] = { name: entity, fields, tableName: entity.toLowerCase() + 's' };
  });
  return graph;
}

function buildRelations(entities) {
  const relations = [];
  const entitySet = new Set(entities);

  if (entitySet.has('Contact') && entitySet.has('User')) {
    relations.push({ from: 'Contact', to: 'User', type: 'belongsTo', foreignKey: 'owner_id', label: 'Contact belongs to User (owner)' });
  }
  if (entitySet.has('Order') && entitySet.has('User')) {
    relations.push({ from: 'Order', to: 'User', type: 'belongsTo', foreignKey: 'user_id', label: 'Order belongs to User' });
  }
  if (entitySet.has('Order') && entitySet.has('Product')) {
    relations.push({ from: 'Order', to: 'Product', type: 'manyToMany', through: 'order_items', label: 'Order has many Products' });
  }
  if (entitySet.has('Payment') && entitySet.has('User')) {
    relations.push({ from: 'Payment', to: 'User', type: 'belongsTo', foreignKey: 'user_id', label: 'Payment belongs to User' });
  }
  if (entitySet.has('Subscription') && entitySet.has('User')) {
    relations.push({ from: 'Subscription', to: 'User', type: 'belongsTo', foreignKey: 'user_id', label: 'Subscription belongs to User' });
  }
  if (entitySet.has('Task') && entitySet.has('Project')) {
    relations.push({ from: 'Task', to: 'Project', type: 'belongsTo', foreignKey: 'project_id', label: 'Task belongs to Project' });
  }
  if (entitySet.has('Task') && entitySet.has('User')) {
    relations.push({ from: 'Task', to: 'User', type: 'belongsTo', foreignKey: 'assignee_id', label: 'Task assigned to User' });
  }
  if (entitySet.has('Course') && entitySet.has('User')) {
    relations.push({ from: 'Course', to: 'User', type: 'belongsTo', foreignKey: 'instructor_id', label: 'Course belongs to User (instructor)' });
  }
  if (entitySet.has('Lead') && entitySet.has('User')) {
    relations.push({ from: 'Lead', to: 'User', type: 'belongsTo', foreignKey: 'assigned_to', label: 'Lead assigned to User' });
  }
  if (entitySet.has('Product') && entitySet.has('Category')) {
    relations.push({ from: 'Product', to: 'Category', type: 'belongsTo', foreignKey: 'category_id', label: 'Product belongs to Category' });
  }
  if (entitySet.has('Inventory') && entitySet.has('Product')) {
    relations.push({ from: 'Inventory', to: 'Product', type: 'belongsTo', foreignKey: 'product_id', label: 'Inventory belongs to Product' });
  }

  return relations;
}

function buildRoleConfig(roles, entities) {
  return roles.map(role => ({
    name: role,
    description: `${role.charAt(0).toUpperCase() + role.slice(1)} role with appropriate permissions`,
    permissions: ROLE_PERMISSIONS[role] || ['read'],
    accessibleEntities: role === 'admin' || role === 'superadmin' ? entities : entities.filter(e => e !== 'Role')
  }));
}

function buildFlows(features, roles) {
  const flows = [];
  if (features.auth) {
    flows.push({ name: 'Authentication Flow', steps: ['User visits login page', 'Enters credentials', 'JWT token issued', 'Redirected to dashboard'], type: 'auth' });
  }
  if (features.payments) {
    flows.push({ name: 'Payment Flow', steps: ['User selects plan', 'Stripe checkout initiated', 'Payment confirmed', 'Subscription activated', 'Premium features unlocked'], type: 'payment' });
  }
  if (features.rbac) {
    flows.push({ name: 'Authorization Flow', steps: ['Request received', 'JWT decoded', 'Role extracted', 'Permissions checked', 'Access granted or denied'], type: 'auth' });
  }
  return flows;
}

function designSystem(intentSpec) {
  const entityGraph = buildEntityGraph(intentSpec.entities);
  const relations = buildRelations(intentSpec.entities);
  const roleConfig = buildRoleConfig(intentSpec.roles, intentSpec.entities);
  const flows = buildFlows(intentSpec.features, intentSpec.roles);

  return {
    stage: 'system_design',
    appType: intentSpec.appType,
    entities: entityGraph,
    relations,
    roles: roleConfig,
    flows,
    features: intentSpec.features,
    pages: intentSpec.pages,
    assumptions: intentSpec.assumptions
  };
}

module.exports = { designSystem, ENTITY_FIELDS, ROLE_PERMISSIONS };
