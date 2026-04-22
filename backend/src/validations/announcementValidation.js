const { z } = require('zod');

const createAnnouncementSchema = z.object({
    body: z.object({
        projectId: z.string().uuid().optional().nullable(),
        title: z.string().min(3, "Title must be at least 3 characters").max(100, "Title is too long"),
        content: z.string().min(5, "Content is too short"),
        category: z.string().optional(),
        targetAudience: z.string().optional(),
        attachmentUrl: z.string().url("Invalid URL format").optional().nullable()
    })
});

const updateAnnouncementSchema = z.object({
    params: z.object({
        id: z.string().uuid("Invalid announcement ID structure")
    }),
    body: z.object({
        title: z.string().min(3).max(100).optional(),
        content: z.string().min(5).optional(),
        category: z.string().optional(),
        isPinned: z.boolean().optional(),
        attachmentUrl: z.string().url("Invalid URL format").optional().nullable()
    })
});

const paramIdSchema = z.object({
    params: z.object({
        id: z.string().uuid("Invalid announcement ID structure")
    })
});

module.exports = {
    createAnnouncementSchema,
    updateAnnouncementSchema,
    paramIdSchema
};
