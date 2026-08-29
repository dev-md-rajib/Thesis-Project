const User = require('../models/User');
const InterviewLevel = require('../models/InterviewLevel');
const QuestionBank = require('../models/QuestionBank');
const CandidateProfile = require('../models/CandidateProfile');
const logger = require('../config/logger');

async function autoSeed() {
  try {
    // 1. Seed Demo Users with password123
    const demoUsers = [
      {
        name: 'Platform Admin',
        email: 'admin@aiplatform.com',
        password: 'password123',
        role: 'ADMIN',
        isEmailVerified: true,
        isVerified: true,
      },
      {
        name: 'Test Candidate',
        email: 'candidate_test@example.com',
        password: 'password123',
        role: 'CANDIDATE',
        isEmailVerified: true,
        isVerified: true,
      },
      {
        name: 'Test Recruiter',
        email: 'recruiter@aiplatform.com',
        password: 'password123',
        role: 'RECRUITER',
        isEmailVerified: true,
        isVerified: true,
        recruiterProfile: {
          company: 'AI Tech Corp',
          position: 'Lead Recruiter',
          location: 'San Francisco, CA',
        },
      },
      {
        name: 'Test Interviewer',
        email: 'interviewer@aiplatform.com',
        password: 'password123',
        role: 'INTERVIEWER',
        isEmailVerified: true,
        isVerified: true,
        interviewerProfile: {
          expertise: ['JavaScript', 'React', 'Node.js', 'Python'],
          isActive: true,
          totalInterviewsConducted: 5,
        },
      },
    ];

    for (const u of demoUsers) {
      const exists = await User.findOne({ email: u.email });
      if (!exists) {
        const createdUser = await User.create(u);
        if (u.role === 'CANDIDATE') {
          await CandidateProfile.create({ user: createdUser._id }).catch(() => {});
        }
        logger.info(`Auto-seeded demo user: ${u.email} (${u.role})`);
      }
    }

    // 2. Seed Interview Levels if missing
    const levelsCount = await InterviewLevel.countDocuments();
    if (levelsCount === 0) {
      const levels = [
        {
          level: 1,
          name: 'Junior Level',
          description: 'Foundational knowledge — basic concepts, syntax, simple patterns',
          requiredSkills: ['Variables', 'Functions', 'Loops', 'Data Structures'],
          minimumPassScore: 60,
          allowedStacks: ['JavaScript', 'Python', 'React', 'Node.js', 'Java', 'PHP', 'Vue.js', 'Angular', 'SQL', 'MongoDB'],
          durationMinutes: 45,
          questionCount: 10,
        },
        {
          level: 2,
          name: 'Mid Level',
          description: 'Intermediate knowledge — system design basics, optimization, architecture',
          requiredSkills: ['Design Patterns', 'APIs', 'Testing', 'Performance', 'Security'],
          minimumPassScore: 70,
          allowedStacks: ['JavaScript', 'Python', 'React', 'Node.js', 'Java', 'PHP', 'Vue.js', 'Angular', 'SQL', 'MongoDB', 'TypeScript', 'Docker'],
          durationMinutes: 60,
          questionCount: 12,
        },
        {
          level: 3,
          name: 'Senior Level',
          description: 'Advanced knowledge — complex architecture, scalability, leadership, deep analysis',
          requiredSkills: ['System Design', 'Scalability', 'Distributed Systems', 'Team Leadership'],
          minimumPassScore: 80,
          allowedStacks: ['JavaScript', 'Python', 'React', 'Node.js', 'Java', 'PHP', 'Vue.js', 'Angular', 'SQL', 'MongoDB', 'TypeScript', 'Docker', 'Kubernetes', 'AWS'],
          durationMinutes: 90,
          questionCount: 15,
        },
      ];
      await InterviewLevel.insertMany(levels);
      logger.info('Auto-seeded Interview Levels');
    }

    // 3. Seed sample questions if missing
    const qCount = await QuestionBank.countDocuments();
    if (qCount === 0) {
      await QuestionBank.insertMany([
        {
          stack: 'JavaScript',
          level: 1,
          type: 'mcq',
          question: 'What is the correct syntax for referring to an external script called "xxx.js"?',
          options: ['<script name="xxx.js">', '<script href="xxx.js">', '<script src="xxx.js">', '<link src="xxx.js">'],
          correctAnswer: '<script src="xxx.js">',
          difficulty: 'easy',
          skill: 'HTML/JS Integration'
        },
        {
          stack: 'JavaScript',
          level: 1,
          type: 'mcq',
          question: 'How do you write "Hello World" in an alert box?',
          options: ['msg("Hello World");', 'alert("Hello World");', 'msgBox("Hello World");', 'alertBox("Hello World");'],
          correctAnswer: 'alert("Hello World");',
          difficulty: 'easy',
          skill: 'Basic Syntax'
        },
        {
          stack: 'JavaScript',
          level: 2,
          type: 'coding',
          question: 'Write a program to reverse a string.',
          difficulty: 'easy',
          skill: 'Strings',
          testCases: [
            { input: 'hello', expectedOutput: 'olleh', hidden: false },
            { input: 'world', expectedOutput: 'dlrow', hidden: false },
          ],
          allowedLanguages: ['javascript', 'python'],
          marks: 10
        }
      ]);
      logger.info('Auto-seeded QuestionBank sample questions');
    }
  } catch (err) {
    logger.warn(`Auto-seed non-fatal warning: ${err.message}`);
  }
}

module.exports = autoSeed;
