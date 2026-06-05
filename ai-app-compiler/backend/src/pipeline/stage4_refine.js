// Stage 4: Refinement Layer
// Cross-validates all 4 schemas and fixes inconsistencies

function findInconsistencies(schemas) {
  const issues = [];
  const { ui, api, db, auth } = schemas;

  // Check: API endpoints reference entities that exist in DB
  if (api && db) {
    const tableNames = db.tables.map(t => t.name.toLowerCase());
    api.endpoints.forEach(ep => {
      if (ep.requestSchema && ep.requestSchema.entity) {
        const entityTable = ep.requestSchema.entity.toLowerCase() + 's';
        if (!tableNames.includes(entityTable) && !tableNames.includes(ep.requestSchema.entity.toLowerCase())) {
          issues.push({ type: 'API_DB_MISMATCH', severity: 'warning', endpoint: ep.id, message: `Endpoint references entity "${ep.requestSchema.entity}" but table "${entityTable}" not found in DB` });
        }
      }
    });
  }

  // Check: UI pages have corresponding API endpoints
  if (ui && api) {
    const apiPaths = api.endpoints.map(e => e.path.replace('/api/', '').split('/')[0]);
    ui.pages.filter(p => !p.isPublic).forEach(page => {
      const pageResource = page.name.toLowerCase();
      const hasEndpoint = apiPaths.some(p => p.includes(pageResource.slice(0, -1)) || p.includes(pageResource));
      if (!hasEndpoint && page.name !== 'Dashboard') {
        issues.push({ type: 'UI_API_GAP', severity: 'info', page: page.id, message: `UI page "${page.name}" may not have corresponding API endpoints` });
      }
    });
  }

  // Check: Auth roles in API match Auth schema roles
  if (api && auth) {
    const definedRoles = auth.roles.map(r => r.name);
    api.endpoints.forEach(ep => {
      ep.roles.forEach(role => {
        if (!definedRoles.includes(role)) {
          issues.push({ type: 'ROLE_UNDEFINED', severity: 'error', endpoint: ep.id, message: `Endpoint uses role "${role}" not defined in Auth schema` });
        }
      });
    });
  }

  // Check: UI access roles match Auth schema roles
  if (ui && auth) {
    const definedRoles = auth.roles.map(r => r.name);
    ui.pages.forEach(page => {
      (page.accessRoles || []).forEach(role => {
        if (role !== '*' && !definedRoles.includes(role)) {
          issues.push({ type: 'UI_ROLE_MISMATCH', severity: 'warning', page: page.id, message: `Page uses role "${role}" not defined in Auth schema` });
        }
      });
    });
  }

  return issues;
}

function repairInconsistencies(schemas, issues) {
  const refined = JSON.parse(JSON.stringify(schemas));
  const repairs = [];

  issues.forEach(issue => {
    if (issue.type === 'ROLE_UNDEFINED' && refined.api) {
      // Remove undefined roles from endpoint
      const ep = refined.api.endpoints.find(e => e.id === issue.endpoint);
      if (ep) {
        const definedRoles = refined.auth.roles.map(r => r.name);
        const before = ep.roles.length;
        ep.roles = ep.roles.filter(r => definedRoles.includes(r));
        if (ep.roles.length === 0) ep.roles = [definedRoles[0]]; // fallback to first role
        repairs.push(`Fixed endpoint ${issue.endpoint}: removed undefined roles (${before - ep.roles.length} removed)`);
      }
    }
    if (issue.type === 'UI_ROLE_MISMATCH' && refined.ui) {
      const page = refined.ui.pages.find(p => p.id === issue.page);
      if (page) {
        const definedRoles = refined.auth.roles.map(r => r.name);
        page.accessRoles = page.accessRoles.filter(r => r === '*' || definedRoles.includes(r));
        if (page.accessRoles.length === 0) page.accessRoles = definedRoles;
        repairs.push(`Fixed page ${issue.page}: corrected access roles`);
      }
    }
  });

  // Ensure navigation only includes accessible pages
  if (refined.ui) {
    refined.ui.navigation = refined.ui.pages
      .filter(p => !p.isPublic)
      .map(p => ({ id: `nav_${p.id}`, label: p.name, route: p.route, icon: p.icon }));
    repairs.push('Rebuilt navigation from valid non-public pages');
  }

  return { refined, repairs, issuesFound: issues.length, issuesFixed: repairs.length };
}

function refineSchemas(schemas) {
  const issues = findInconsistencies(schemas);
  const { refined, repairs, issuesFound, issuesFixed } = repairInconsistencies(schemas, issues);
  return {
    stage: 'refinement',
    ...refined,
    refinementReport: {
      issuesFound,
      issuesFixed,
      issues,
      repairs,
      isConsistent: issues.filter(i => i.severity === 'error').length === 0
    }
  };
}

module.exports = { refineSchemas };
