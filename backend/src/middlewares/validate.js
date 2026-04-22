const { ZodError } = require('zod');

const validate = (schema) => {
    return (req, res, next) => {
        try {
            // Parse req.body, req.query, and req.params using the provided schema
            schema.parse({
                body: req.body,
                query: req.query,
                params: req.params,
            });
            next();
        } catch (error) {
            if (error instanceof ZodError) {
                // Map zod errors to a readable format
                const errors = error.errors.map(err => ({
                    field: err.path.join('.'),
                    message: err.message
                }));
                return res.status(400).json({ success: false, message: 'Validation failed', errors });
            }
            next(error);
        }
    };
};

module.exports = validate;
