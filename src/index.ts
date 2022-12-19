import { https } from 'firebase-functions';
import express from 'express';
import { initializeApp } from 'firebase-admin';

const firebase = initializeApp();
const firestore = firebase.firestore();

const app = express();

app
  .get('/api/todos', async (req, res) => {
    const limit = Number(req.query.limit || 5);
    const docs = await firestore.collection('todos').limit(limit).get();
    res.status(200).send(docs.docs.map((doc) => doc.data()));
  })
  .get('/api/todos/:id', async (req, res) => {
    const doc = await firestore.collection('todos').doc(req.params.id).get();
    if (!doc.exists) {
      res.status(404).send({
        message: `Todo with id ${req.params.id} not found`,
        error: 'Not found',
      });
      return;
    }
    res.status(200).send(doc.data());
  })
  .delete('/api/todos/:id', async (req, res) => {
    const doc = firestore.collection('todos').doc(req.params.id);
    await doc.delete();
    res.status(200).send();
  })
  .post('/api/todos', async (req, res) => {
    const result = await firestore.collection('todos').add(req.body);
    const doc = await result.get();
    res.status(201).send(doc.data());
  })
  .patch('/api/todos/:id', async (req, res) => {
    const doc = await firestore.collection('todos').doc(req.params.id);
    const docSnapshot = await doc.get();
    if (!docSnapshot.exists) {
      res.status(404).send({
        message: `Todo with id ${req.params.id} not found`,
        error: 'Not found',
      });
      return;
    }
    await doc.update(req.body);
    res.status(200).send({ ...docSnapshot.data(), ...req.body });
  });

// TODO add zod validation

export const api = https.onRequest(app);
