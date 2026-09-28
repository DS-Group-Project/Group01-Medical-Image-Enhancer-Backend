import { z } from 'zod';

export const validate = (schema) => async (req, res, next) => {
  try {
    if (schema.body) {
      req.body = await schema.body.parseAsync(req.body);
    }
    if (schema.query) {
      req.query = await schema.query.parseAsync(req.query);
    }
    if (schema.params) {
      req.params = await schema.params.parseAsync(req.params);
    }
    next();
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: "VALIDATION_ERROR", details: error.errors });
    }
    next(error);
  }
};
