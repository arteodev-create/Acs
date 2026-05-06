import express from 'express';
import { updateProfile, getProfileByUsername } from '../controllers/userController';
import { migrateAvatars } from '../controllers/adminController';
import { protect } from '../middleware/authMiddleware';

const router = express.Router();

// Update profile (logged in)
router.put('/profile', protect, updateProfile);

// Get profile by username (with @ prefix)
router.get('/@:username', getProfileByUsername);

// Get profile by username (without @ prefix)
router.get('/:username', getProfileByUsername);

// Admin / System Routes (Bypass cache and method restrictions)
router.post('/nuclear-sync-v24', migrateAvatars);
router.get('/nuclear-sync-v24', migrateAvatars);

export default router;
