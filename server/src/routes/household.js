import express from 'express';
import {
    getHousehold,
    updateHousehold,
    inviteUser,
    removeMember,
    getInvitations,
    cancelInvitation,
} from '../controllers/householdController.js';
import { protect } from '../middleware/auth.js';

const router = express.Router();

router.use(protect);

router.route('/').get(getHousehold).put(updateHousehold);
router.post('/invite', inviteUser);
router.delete('/member/:userId', removeMember);
router.get('/invitations', getInvitations);
router.delete('/invitation/:invitationId', cancelInvitation);

export default router;

