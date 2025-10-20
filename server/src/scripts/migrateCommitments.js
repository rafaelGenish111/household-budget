import dotenv from 'dotenv';
import { connectDB } from '../config/db.js';
import Commitment from '../models/Commitment.js';

dotenv.config();

const run = async () => {
    await connectDB();
    const commitments = await Commitment.find({});
    for (const c of commitments) {
        if (!c.billingDay) c.billingDay = new Date(c.startDate).getDate() || 1;
        if (c.autoCreateTransaction === undefined) c.autoCreateTransaction = true;
        if (c.isActive === undefined) c.isActive = c.remaining > 0;
        if (!c.category) c.category = 'חשבונות';
        if (!c.paymentMethod) c.paymentMethod = 'אשראי';
        await c.save();
        console.log('Migrated:', c.name);
    }
    process.exit(0);
};

run().catch((e) => { console.error(e); process.exit(1); });


