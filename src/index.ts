import { https } from 'firebase-functions';
import express from 'express';
import { initializeApp } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import {
  Todo,
  TodoAdd,
  TodoAddSchema,
  TodoSchema,
  TodoUpdateSchema,
} from './schemas';
import helmet from 'helmet';
import compression from 'compression';
import rateLimit from 'express-rate-limit';
import { authMiddleware } from './auth-middleware';

initializeApp();
const firestore = getFirestore();

function getCollection() {
  return firestore.collection('todos');
}

const app = express()
  .use(
    rateLimit({
      windowMs: 2 * 60 * 1000,
      max: 100,
      standardHeaders: true,
      legacyHeaders: false,
    })
  )
  .use(helmet())
  .use(compression())
  .use(authMiddleware())
  .get('/todos', async (req, res) => {
    const { docs } = await getCollection().get();
    const todos: (Todo & { dateMs: number })[] = [];
    for (const doc of docs) {
      const parsed = TodoSchema.safeParse({ ...doc.data(), id: doc.id });
      if (parsed.success) {
        todos.push({ ...parsed.data, dateMs: doc.createTime.toMillis() });
      }
    }
    res
      .status(200)
      .send(
        todos
          .sort((todoA, todoB) => todoA.dateMs - todoB.dateMs)
          .map(({ dateMs, ...todo }) => todo)
      );
  })
  .get('/todos/:id', async (req, res) => {
    const doc = await getCollection().doc(req.params.id).get();
    const parsed = await TodoSchema.safeParseAsync({
      ...doc.data(),
      id: doc.id,
    });
    if (!doc.exists || !parsed.success) {
      res.status(404).send({
        message: `Todo with id ${req.params.id} not found`,
        error: 'Not found',
      });
      return;
    }
    res.status(200).send(parsed.data);
  })
  .delete('/todos/:id', async (req, res) => {
    const doc = getCollection().doc(req.params.id);
    await doc.delete();
    res.status(200).send();
  })
  .post('/todos', async (req, res) => {
    const parsed = await TodoAddSchema.safeParseAsync(req.body);
    if (!parsed.success) {
      res.status(400).send({
        message: parsed.error.issues
          .map((issue) => `${issue.path.join('.')}: ${issue.message}`)
          .join(', '),
        error: 'Bad request',
      });
      return;
    }
    const todo = { completed: false, ...parsed.data } satisfies TodoAdd;
    const result = await getCollection().add(todo);
    const doc = await result.get();
    res.status(201).send({ ...doc.data(), id: doc.id });
  })
  .patch('/todos/:id', async (req, res) => {
    const doc = getCollection().doc(req.params.id);
    const docSnapshot = await doc.get();
    if (!docSnapshot.exists) {
      res.status(404).send({
        message: `Todo with id ${req.params.id} not found`,
        error: 'Not found',
      });
      return;
    }
    const parsed = await TodoUpdateSchema.safeParseAsync(req.body);
    if (!parsed.success) {
      res.status(400).send({
        message: parsed.error.issues
          .map((issue) => `${issue.path.join('.')}: ${issue.message}`)
          .join(', '),
        error: 'Bad request',
      });
      return;
    }
    await doc.update(parsed.data);
    res
      .status(200)
      .send({ ...docSnapshot.data(), ...parsed.data, id: docSnapshot.id });
  });

export const api = https.onRequest(app);
