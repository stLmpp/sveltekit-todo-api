import { RequestHandler } from 'express';
import { defineString } from 'firebase-functions/params';

const SECRET = defineString('SECRET');

export function authMiddleware(): RequestHandler {
  return (req, res, next) => {
    const header = String(req.headers['x-svelte-kit-todo-app-secret']);
    if (header !== SECRET.value()) {
      res
        .status(403)
        .send({ message: `Wait. That's illegal`, error: 'Forbidden' });
      return;
    }
    next();
  };
}
