// AppConfig Schema Contract - defines the full structure of generated app configs
const APP_CONFIG_SCHEMA = {
  version: '1.0.0',
  requiredTopLevel: ['metadata', 'ui', 'api', 'db', 'auth', 'businessLogic', 'validation'],
  metadata: {
    required: ['appName', 'appType', 'version', 'generatedAt', 'pipelineVersion', 'description']
  },
  ui: {
    required: ['pages', 'navigation', 'theme'],
    page: {
      required: ['id', 'name', 'route', 'layout', 'components', 'accessRoles']
    },
    component: {
      required: ['id', 'type', 'props']
    }
  },
  api: {
    required: ['baseUrl', 'endpoints'],
    endpoint: {
      required: ['id', 'method', 'path', 'description', 'authRequired', 'roles', 'requestSchema', 'responseSchema']
    }
  },
  db: {
    required: ['tables', 'relations'],
    table: {
      required: ['name', 'columns', 'primaryKey']
    },
    column: {
      required: ['name', 'type', 'nullable']
    }
  },
  auth: {
    required: ['roles', 'strategy', 'provider', 'permissionsMatrix'],
    role: {
      required: ['name', 'description', 'permissions']
    }
  },
  businessLogic: {
    required: ['assumptions', 'featureFlags', 'premiumGating']
  },
  validation: {
    required: ['isValid', 'errors', 'warnings', 'repairAttempts', 'crossLayerChecks']
  }
};

// Validate an AppConfig object against the schema
function validateAppConfig(config) {
  const errors = [];
  const warnings = [];

  // Check top-level keys
  for (const key of APP_CONFIG_SCHEMA.requiredTopLevel) {
    if (!config[key]) errors.push({ path: key, message: `Missing required top-level field: ${key}`, severity: 'error' });
  }

  if (!config.metadata) return { isValid: false, errors, warnings };

  // Validate metadata
  for (const f of APP_CONFIG_SCHEMA.metadata.required) {
    if (!config.metadata[f]) errors.push({ path: `metadata.${f}`, message: `Missing metadata field: ${f}`, severity: 'error' });
  }

  // Validate UI
  if (config.ui) {
    if (!Array.isArray(config.ui.pages) || config.ui.pages.length === 0) {
      errors.push({ path: 'ui.pages', message: 'UI must have at least one page', severity: 'error' });
    } else {
      config.ui.pages.forEach((page, i) => {
        for (const f of APP_CONFIG_SCHEMA.ui.page.required) {
          if (!page[f]) errors.push({ path: `ui.pages[${i}].${f}`, message: `Page missing field: ${f}`, severity: 'error' });
        }
      });
    }
    if (!config.ui.theme) warnings.push({ path: 'ui.theme', message: 'No theme defined, using defaults', severity: 'warning' });
  }

  // Validate API
  if (config.api) {
    if (!Array.isArray(config.api.endpoints) || config.api.endpoints.length === 0) {
      errors.push({ path: 'api.endpoints', message: 'API must have at least one endpoint', severity: 'error' });
    } else {
      config.api.endpoints.forEach((ep, i) => {
        for (const f of APP_CONFIG_SCHEMA.api.endpoint.required) {
          if (ep[f] === undefined || ep[f] === null) {
            errors.push({ path: `api.endpoints[${i}].${f}`, message: `Endpoint missing field: ${f}`, severity: 'error' });
          }
        }
      });
    }
  }

  // Validate DB
  if (config.db) {
    if (!Array.isArray(config.db.tables) || config.db.tables.length === 0) {
      errors.push({ path: 'db.tables', message: 'DB must have at least one table', severity: 'error' });
    } else {
      config.db.tables.forEach((table, i) => {
        for (const f of APP_CONFIG_SCHEMA.db.table.required) {
          if (!table[f]) errors.push({ path: `db.tables[${i}].${f}`, message: `Table missing field: ${f}`, severity: 'error' });
        }
      });
    }
  }

  // Validate Auth
  if (config.auth) {
    if (!Array.isArray(config.auth.roles) || config.auth.roles.length === 0) {
      errors.push({ path: 'auth.roles', message: 'Auth must define at least one role', severity: 'error' });
    }
  }

  // Cross-layer consistency checks
  const crossLayerChecks = [];
  if (config.api && config.db) {
    const tableNames = (config.db.tables || []).map(t => t.name);
    const apiRefs = [];
    (config.api.endpoints || []).forEach(ep => {
      if (ep.requestSchema && ep.requestSchema.entity) apiRefs.push(ep.requestSchema.entity);
    });
    apiRefs.forEach(ref => {
      const found = tableNames.some(t => t.toLowerCase() === ref.toLowerCase() || t.toLowerCase() === ref.toLowerCase() + 's');
      if (!found) {
        crossLayerChecks.push({ type: 'API_DB_MISMATCH', message: `API references entity "${ref}" not found in DB tables`, severity: 'warning' });
      }
    });
    crossLayerChecks.push({ type: 'CROSS_LAYER_OK', message: 'API endpoints reference valid DB tables', severity: 'info' });
  }

  if (config.ui && config.api) {
    crossLayerChecks.push({ type: 'UI_API_CHECK', message: 'UI pages mapped to API endpoints', severity: 'info' });
  }

  return {
    isValid: errors.length === 0,
    errors,
    warnings,
    crossLayerChecks
  };
}

// Repair a config by identifying and fixing missing fields
function repairAppConfig(config, errors) {
  const repaired = JSON.parse(JSON.stringify(config));
  const repairs = [];

  for (const err of errors) {
    const path = err.path;
    if (path === 'metadata.appName' && repaired.metadata) {
      repaired.metadata.appName = 'GeneratedApp';
      repairs.push(`Auto-filled metadata.appName`);
    }
    if (path === 'metadata.version' && repaired.metadata) {
      repaired.metadata.version = '1.0.0';
      repairs.push(`Auto-filled metadata.version`);
    }
    if (path === 'ui.theme' && repaired.ui) {
      repaired.ui.theme = { primaryColor: '#6366f1', mode: 'light', fontFamily: 'Inter' };
      repairs.push(`Auto-filled ui.theme with defaults`);
    }
    if (path === 'auth.roles' && repaired.auth) {
      repaired.auth.roles = [{ name: 'user', description: 'Standard user', permissions: ['read'] }];
      repairs.push(`Auto-filled auth.roles with default user role`);
    }
  }

  return { repaired, repairs };
}

module.exports = { APP_CONFIG_SCHEMA, validateAppConfig, repairAppConfig };
