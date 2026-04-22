import { Router } from 'express';
import { requireAuth, AuthRequest } from '../middleware/auth';
import { validate } from '../middleware/validate';
import { shortlistCommentSchema, shortlistCreateSchema, shortlistItemCreateSchema, shortlistItemUpdateSchema, shortlistVoteSchema } from '../schemas/shortlistSchemas';
import * as shortlistService from '../services/shortlistService';
import { getCookie } from '../utils/cookies';
import { config } from '../config';
import { verifyAccessToken } from '../utils/jwt';

const router = Router();

const parseId = (value: string, label: string) => {
  const parsed = Number(value);
  if (!Number.isInteger(parsed) || parsed <= 0) throw { status: 400, message: `Invalid ${label} id` };
  return parsed;
};

const getOptionalViewerId = (req: AuthRequest) => {
  try {
    const token = getCookie(req, config.cookies.accessTokenName);
    if (!token) return null;
    const payload = verifyAccessToken(token) as { userId: number };
    return payload.userId;
  } catch {
    return null;
  }
};

router.get('/', requireAuth, async (req: AuthRequest, res, next) => {
  try {
    const shortlists = await shortlistService.listForUser(req.user!.id);
    res.json(shortlists);
  } catch (err) {
    next(err);
  }
});

router.post('/', requireAuth, validate(shortlistCreateSchema), async (req: AuthRequest, res, next) => {
  try {
    const shortlist = await shortlistService.create(req.user!.id, req.body.name, req.body.propertyIds);
    res.status(201).json(shortlist);
  } catch (err) {
    next(err);
  }
});

router.get('/shared/:token', async (req: AuthRequest, res, next) => {
  try {
    const viewerId = getOptionalViewerId(req);
    const shortlist = await shortlistService.getByToken(req.params.token, viewerId);
    res.json(shortlist);
  } catch (err) {
    next(err);
  }
});

router.post('/shared/:token/join', requireAuth, async (req: AuthRequest, res, next) => {
  try {
    const shortlist = await shortlistService.joinByToken(req.user!.id, req.params.token);
    res.json(shortlist);
  } catch (err) {
    next(err);
  }
});

router.get('/:id', requireAuth, async (req: AuthRequest, res, next) => {
  try {
    const shortlist = await shortlistService.getForUser(req.user!.id, parseId(req.params.id, 'shortlist'));
    res.json(shortlist);
  } catch (err) {
    next(err);
  }
});

router.post('/:id/items', requireAuth, validate(shortlistItemCreateSchema), async (req: AuthRequest, res, next) => {
  try {
    const shortlist = await shortlistService.addItem(req.user!.id, parseId(req.params.id, 'shortlist'), req.body.propertyId);
    res.json(shortlist);
  } catch (err) {
    next(err);
  }
});

router.delete('/:id/items/:propertyId', requireAuth, async (req: AuthRequest, res, next) => {
  try {
    const shortlist = await shortlistService.removeItem(
      req.user!.id,
      parseId(req.params.id, 'shortlist'),
      parseId(req.params.propertyId, 'property'),
    );
    res.json(shortlist);
  } catch (err) {
    next(err);
  }
});

router.patch('/:id/items/:propertyId', requireAuth, validate(shortlistItemUpdateSchema), async (req: AuthRequest, res, next) => {
  try {
    const shortlist = await shortlistService.updateItem(
      req.user!.id,
      parseId(req.params.id, 'shortlist'),
      parseId(req.params.propertyId, 'property'),
      req.body,
    );
    res.json(shortlist);
  } catch (err) {
    next(err);
  }
});

router.post('/:id/items/:propertyId/comments', requireAuth, validate(shortlistCommentSchema), async (req: AuthRequest, res, next) => {
  try {
    const shortlist = await shortlistService.addComment(
      req.user!.id,
      parseId(req.params.id, 'shortlist'),
      parseId(req.params.propertyId, 'property'),
      req.body.body,
    );
    res.json(shortlist);
  } catch (err) {
    next(err);
  }
});

router.put('/:id/items/:propertyId/vote', requireAuth, validate(shortlistVoteSchema), async (req: AuthRequest, res, next) => {
  try {
    const shortlist = await shortlistService.upsertVote(
      req.user!.id,
      parseId(req.params.id, 'shortlist'),
      parseId(req.params.propertyId, 'property'),
      req.body.value,
    );
    res.json(shortlist);
  } catch (err) {
    next(err);
  }
});

export default router;
