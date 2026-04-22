import { Router } from 'express';
import * as intelligenceService from '../services/intelligenceService';
import { requireAuth } from '../middleware/auth';

const router = Router();

router.get('/localities', async (_req, res, next) => {
  try {
    const items = await intelligenceService.listLocalityInsights();
    res.json(items);
  } catch (err) {
    next(err);
  }
});

router.get('/localities/:slug', async (req, res, next) => {
  try {
    const item = await intelligenceService.getLocalityInsight(req.params.slug);
    res.json(item);
  } catch (err) {
    next(err);
  }
});

router.get('/agents/:id', requireAuth, async (req, res, next) => {
  try {
    const agentId = Number(req.params.id);
    if (!Number.isInteger(agentId) || agentId <= 0) return res.status(400).json({ message: 'Invalid agent id' });
    const scorecard = await intelligenceService.buildAgentScorecard(agentId);
    res.json(scorecard);
  } catch (err) {
    next(err);
  }
});

export default router;
