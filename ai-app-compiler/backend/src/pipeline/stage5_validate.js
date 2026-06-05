// Stage 5: Validation + Repair Engine
// Validates the complete AppConfig and surgically repairs broken parts

const { validateAppConfig, repairAppConfig } = require('../schemas/appConfigSchema');

const MAX_REPAIR_ATTEMPTS = 3;

function runValidation(config) {
  const result = validateAppConfig(config);
  return {
    isValid: result.isValid,
    errors: result.errors,
    warnings: result.warnings,
    crossLayerChecks: result.crossLayerChecks
  };
}

function attemptRepair(config, validationResult, attemptNumber) {
  const { repaired, repairs } = repairAppConfig(config, validationResult.errors);
  return { repaired, repairs, attempt: attemptNumber };
}

function validateAndRepair(config) {
  let current = config;
  let repairAttempts = 0;
  let allRepairs = [];
  let finalValidation;

  for (let i = 0; i < MAX_REPAIR_ATTEMPTS; i++) {
    finalValidation = runValidation(current);

    if (finalValidation.isValid) break;

    const criticalErrors = finalValidation.errors.filter(e => e.severity === 'error');
    if (criticalErrors.length === 0) break;

    repairAttempts++;
    const { repaired, repairs } = attemptRepair(current, finalValidation, i + 1);
    allRepairs = [...allRepairs, ...repairs];
    current = repaired;
  }

  finalValidation = runValidation(current);

  return {
    config: current,
    validation: {
      isValid: finalValidation.isValid,
      errors: finalValidation.errors,
      warnings: finalValidation.warnings,
      crossLayerChecks: finalValidation.crossLayerChecks,
      repairAttempts,
      repairs: allRepairs
    }
  };
}

module.exports = { validateAndRepair };
