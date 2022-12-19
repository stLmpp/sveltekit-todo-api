import { https } from 'firebase-functions';
import express from 'express';
import { initializeApp } from 'firebase-admin';
import { TodoAdd, TodoAddSchema, TodoSchema } from './schemas';

const firebase = initializeApp();
const firestore = firebase.firestore();

const app = express();

function getCollection() {
  return firestore.collection('todos');
}

function isNotNil<T>(value: T): value is NonNullable<T> {
  return value != null;
}

app
  .get('/api/todos', async (req, res) => {
    const docs = await getCollection().get();
    const todos = docs.docs
      .map((doc) => {
        const parsed = TodoSchema.safeParse({ ...doc.data(), id: doc.id });
        if (parsed.success) {
          return parsed.data;
        }
        return null;
      })
      .filter(isNotNil);
    res.status(200).send(todos);
  })
  .get('/api/todos/:id', async (req, res) => {
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
  .delete('/api/todos/:id', async (req, res) => {
    const doc = getCollection().doc(req.params.id);
    await doc.delete();
    res.status(200).send();
  })
  .post('/api/todos', async (req, res) => {
    const parsed = await TodoAddSchema.safeParseAsync(req.body);
    if (!parsed.success) {
      res.status(400).send({
        message: parsed.error.message,
        error: 'Bad request',
      });
      return;
    }
    const todo = { completed: false, ...parsed.data } satisfies TodoAdd;
    const result = await getCollection().add(todo);
    const doc = await result.get();
    res.status(201).send({ ...doc.data(), id: doc.id });
  })
  .patch('/api/todos/:id', async (req, res) => {
    const doc = await getCollection().doc(req.params.id);
    const docSnapshot = await doc.get();
    if (!docSnapshot.exists) {
      res.status(404).send({
        message: `Todo with id ${req.params.id} not found`,
        error: 'Not found',
      });
      return;
    }
    await doc.update(req.body);
    res
      .status(200)
      .send({ ...docSnapshot.data(), ...req.body, id: docSnapshot.id });
  });

export const api = https.onRequest(app);
