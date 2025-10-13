import express from 'express';
import {
    getHousehold,
    updateHousehold,
    inviteUser,
    removeMember,
} from '../controllers/householdController.js';
import { auth } from '../middleware/auth.js';

const router = express.Router();

router.use(auth);

router.route('/').get(getHousehold).put(updateHousehold);
router.post('/invite', inviteUser);
router.delete('/member/:userId', removeMember);

export default router;

