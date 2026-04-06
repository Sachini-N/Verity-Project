const express = require('express');
const router = express.Router();
const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

// GET /api/user/:id (Fetch Profile)
router.get('/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const user = await prisma.user.findUnique({
             where: { id },
             select: { 
                 id: true, 
                 name: true, 
                 email: true, 
                 indexNumber: true, 
                 role: true,
                 phone: true, 
                 github: true, 
                 linkedin: true, 
                 skills: true,
                 xpPoints: true,
                 badges: true,
                 modules: {
                    select: {
                        id: true,
                        code: true,
                        name: true
                    }
                 },
                 semester: {
                    select: {
                        id: true,
                        name: true,
                        year: {
                            select: {
                                name: true
                            }
                        },
                        modules: {
                            select: {
                                id: true,
                                code: true,
                                name: true
                            }
                        }
                    }
                 }
             }
        });

        if (!user) {
            return res.status(404).json({ success: false, message: 'User not found' });
        }

        res.status(200).json({ success: true, user });
    } catch (error) {
        console.error("Profile Fetch Error:", error);
        res.status(500).json({ success: false, message: 'Server error retrieving profile' });
    }
});

// PUT /api/user/:id (Update Profile)
router.put('/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const { name, email, indexNumber, password, phone, github, linkedin, skills } = req.body;

        const updateData = {};
        if (name) updateData.name = name;
        if (email) {
            if (!/@(gmail|yahoo)/.test(email)) {
                return res.status(400).json({ success: false, message: 'Email domain must be @gmail or @yahoo' });
            }
            updateData.email = email;
        }

        if (indexNumber !== undefined) {
            const userBefore = await prisma.user.findUnique({ where: { id } });
            if (userBefore.role === 'STUDENT' && !/^IT\d{8}$/.test(indexNumber)) {
                return res.status(400).json({ success: false, message: 'Student ID must start with IT followed by 8 digits' });
            }
            if (userBefore.role === 'LECTURER' && !/^LEC(?=.*5).*$/.test(indexNumber)) {
                return res.status(400).json({ success: false, message: 'Lecturer ID must start with LEC and contain the number 5' });
            }
            updateData.indexNumber = indexNumber;
        }

        if (phone !== undefined) {
            if (phone && !/^(0\d{9}|\+94\d{9})$/.test(phone)) {
                return res.status(400).json({ success: false, message: 'Invalid phone number format. Must start with 0 or +94 and contain 10/11 digits.' });
            }
            updateData.phone = phone;
        }
        
        if (github !== undefined) {
            if (github && !/^https:\/\/github\.com/.test(github)) {
                return res.status(400).json({ success: false, message: 'GitHub URL must start with https://github.com' });
            }
            updateData.github = github;
        }

        if (linkedin !== undefined) {
            if (linkedin && !/^https:\/\/linkedin\.com\/in/.test(linkedin)) {
                return res.status(400).json({ success: false, message: 'LinkedIn URL must start with https://linkedin.com/in' });
            }
            updateData.linkedin = linkedin;
        }
        if (skills !== undefined) updateData.skills = skills;
        
        if (password && password.trim() !== '') {
             const salt = await bcrypt.genSalt(10);
             updateData.password = await bcrypt.hash(password, salt);
        }

        const user = await prisma.user.update({
             where: { id },
             data: updateData,
             select: { 
                 id: true, name: true, email: true, indexNumber: true, role: true,
                 phone: true, github: true, linkedin: true, skills: true,
                 modules: {
                    select: {
                        id: true,
                        code: true,
                        name: true
                    }
                 },
                 semester: {
                    select: {
                        id: true,
                        name: true,
                        year: {
                            select: {
                                name: true
                            }
                        },
                        modules: {
                            select: {
                                id: true,
                                code: true,
                                name: true
                            }
                        }
                    }
                 }
             }
        });

        res.status(200).json({ success: true, user });
    } catch (error) {
        console.error("Profile Update Error:", error);
        res.status(500).json({ success: false, message: 'Server error updating profile' });
    }
});

// MANAGER: GET /api/user/manager/users (List all users)
router.get('/manager/users', async (req, res) => {
    try {
        const users = await prisma.user.findMany({
            select: {
                id: true,
                name: true,
                email: true,
                role: true,
                status: true,
                indexNumber: true,
                semester: { select: { name: true, year: { select: { name: true } } } }
            },
            orderBy: { createdAt: 'desc' }
        });

        // Format for frontend mapping
        const formattedUsers = users.map(user => {
            let enrolled = 'N/A';
            if (user.semester && user.semester.year) {
                const yearMatch = user.semester.year.name.match(/\d+/);
                const semMatch = user.semester.name.match(/\d+/);
                enrolled = (yearMatch && semMatch) ? `Y${yearMatch[0]}S${semMatch[0]}` : 'N/A';
            }
            return {
                id: user.indexNumber || user.id, // Fallback to id if indexNumber missing
                dbId: user.id,
                name: user.name,
                email: user.email,
                role: user.role === 'LECTURER' ? 'Lecturer' : user.role === 'MANAGER' ? 'Manager' : 'Student',
                status: user.status || 'Active',
                enrolled
            };
        });

        res.status(200).json({ success: true, users: formattedUsers });
    } catch (error) {
        console.error("Manager User List Error:", error);
        res.status(500).json({ success: false, message: 'Server error retrieving users' });
    }
});

// MANAGER: PUT /api/user/manager/users/:id/status (Toggle Status)
router.put('/manager/users/:id/status', async (req, res) => {
    try {
        const { id } = req.params; // we'll use dbId since frontend will pass it
        // Or if frontend passes indexNumber as `id`, we should find by whatever matches
        let user = await prisma.user.findUnique({ where: { id } });
        if (!user) {
            user = await prisma.user.findUnique({ where: { indexNumber: id } });
        }

        if (!user) {
            return res.status(404).json({ success: false, message: 'User not found' });
        }

        const newStatus = user.status === 'Active' ? 'Suspended' : 'Active';
        const updatedUser = await prisma.user.update({
            where: { id: user.id },
            data: { status: newStatus },
            select: { id: true, status: true, indexNumber: true }
        });

        res.status(200).json({ success: true, user: updatedUser });
    } catch (error) {
        console.error("Manager User Status Update Error:", error);
        res.status(500).json({ success: false, message: 'Server error updating user status' });
    }
});

module.exports = router;
