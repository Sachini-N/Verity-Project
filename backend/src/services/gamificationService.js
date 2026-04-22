const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const XP_VALUES = {
    TASK_COMPLETE: 10,
    COMMIT_PUSH: 5,
    ANNOUNCEMENT_POST: 20,
    CLEAN_SUBMISSION: 15
};

const BADGE_MODS = {
    TASK_MASTER: { id: 'task_master', name: 'Task Master', threshold: 10 },
    CODE_WARRIOR: { id: 'code_warrior', name: 'Code Warrior', threshold: 50 }
};

/**
 * Add XP and check for badge eligibility.
 */
async function addXP(userId, actionType) {
    try {
        const xpToAdd = XP_VALUES[actionType] || 0;
        if (xpToAdd === 0) return;

        const user = await prisma.user.findUnique({
            where: { id: userId },
            select: { xpPoints: true, badges: true }
        });

        if (!user) return;

        const newXP = user.xpPoints + xpToAdd;
        
        let badges = user.badges ? user.badges.split(',') : [];
        
        // Check for new badges
        if (actionType === 'TASK_COMPLETE') {
            const taskCount = await prisma.task.count({
                where: { assigneeId: userId, status: 'Done' }
            });
            if (taskCount >= BADGE_MODS.TASK_MASTER.threshold && !badges.includes(BADGE_MODS.TASK_MASTER.id)) {
                badges.push(BADGE_MODS.TASK_MASTER.id);
            }
        }

        await prisma.user.update({
            where: { id: userId },
            data: {
                xpPoints: newXP,
                badges: badges.join(',')
            }
        });
        
        console.log(`User ${userId} earned ${xpToAdd} XP. Total: ${newXP}`);
    } catch (error) {
        console.error('Gamification Error:', error.message);
    }
}

module.exports = { addXP, XP_VALUES };
