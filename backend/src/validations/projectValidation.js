const { z } = require('zod');

const createProjectSchema = z.object({
    body: z.object({
        module: z.string().min(1, "Module is required"),
        title: z.string().min(5, "Project Title must be between 5 and 100 characters.").max(100, "Project Title must be between 5 and 100 characters."),
        expectedSize: z.coerce.number().int().min(2).max(10).optional(),
        members: z.array(z.string().regex(/^IT\d{8}$/i, "Invalid IT Number format. Must start with IT followed by 8 digits.")).optional(),
        abstract: z.string().min(10, "Abstract is too short").optional()
    })
});

const paramIdSchema = z.object({
    params: z.object({
        id: z.string().uuid("Invalid ID format")
    })
});

const paramProjectIdSchema = z.object({
    params: z.object({
        projectId: z.string().uuid("Invalid Project ID format")
    })
});

const paramUserIdSchema = z.object({
    params: z.object({
        userId: z.string().uuid("Invalid User ID format")
    })
});

const updateManagerApprovalSchema = z.object({
    params: z.object({
        id: z.string().uuid("Invalid ID format")
    }),
    body: z.object({
        status: z.enum(["Approved", "Rejected"])
    })
});

const updateManagerGroupSchema = z.object({
    params: z.object({
        id: z.string().uuid("Invalid ID format")
    }),
    body: z.object({
        title: z.string().min(5).max(100).optional(),
        addMembers: z.array(z.string().uuid()).optional(),
        removeMembers: z.array(z.string().uuid()).optional()
    })
});

module.exports = {
    createProjectSchema,
    paramIdSchema,
    paramProjectIdSchema,
    paramUserIdSchema,
    updateManagerApprovalSchema,
    updateManagerGroupSchema
};
