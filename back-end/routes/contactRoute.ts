import express from 'express';
import { submitContact } from '../controllers/contactController.js';

const router = express.Router();

router.post('/send', submitContact);

export default router;
