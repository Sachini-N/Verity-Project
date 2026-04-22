const express = require('express');
const router = express.Router();

const validate = require('../middlewares/validate');
const {
    createProjectSchema,
    paramProjectIdSchema,
    paramUserIdSchema,
    paramIdSchema,
    updateManagerApprovalSchema,
    updateManagerGroupSchema
} = require('../validations/projectValidation');

const {
    createProject,
    getProjectList,
    getMyProjects,
    getFairnessAnalyticsData,
    getMemberTracking,
    getEngagementAnalyticsEndpoint,
    getIntelligenceOverviewEndpoint,
    getIntelligenceReportPdfEndpoint,
    resolveRiskFlag,
    getManagerGroups,
    deleteManagerGroup,
    updateManagerApproval,
    updateManagerGroup
} = require('../controllers/projectController');

// All standard endpoints
router.post('/create', validate(createProjectSchema), createProject);
router.get('/list', getProjectList);
router.get('/my-projects/:userId', validate(paramUserIdSchema), getMyProjects);
router.get('/fairness/:projectId', validate(paramProjectIdSchema), getFairnessAnalyticsData);
router.get('/member-tracking/:projectId', validate(paramProjectIdSchema), getMemberTracking);
router.get('/engagement/:projectId', validate(paramProjectIdSchema), getEngagementAnalyticsEndpoint);
router.get('/intelligence/:projectId', validate(paramProjectIdSchema), getIntelligenceOverviewEndpoint);
router.get('/intelligence/:projectId/report.pdf', validate(paramProjectIdSchema), getIntelligenceReportPdfEndpoint);
router.put('/riskflag/:id/resolve', validate(paramIdSchema), resolveRiskFlag);

// Manager specific endpoints
router.get('/manager/groups', getManagerGroups);
router.delete('/manager/groups/:id', validate(paramIdSchema), deleteManagerGroup);
router.put('/manager/approvals/:id', validate(updateManagerApprovalSchema), updateManagerApproval);
router.put('/manager/groups/:id', validate(updateManagerGroupSchema), updateManagerGroup);

module.exports = router;
