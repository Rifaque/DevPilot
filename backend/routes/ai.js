const express = require('express');
const router = express.Router();
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const { Groq } = require('groq-sdk');

const GROQ_KEY = process.env.GROQ_API_KEY || '';
const groq = new Groq({ apiKey: GROQ_KEY });

router.post('/generate-user-stories', async (req, res) => {
  try {
    const { projectId, projectDescription, maxStories = 3 } = req.body;
    if (!projectDescription) return res.status(400).json({ error: 'projectDescription required' });

    let storiesText = '';

    if (GROQ_KEY) {
      // GROQ chat completion
      const messages = [
        {
          role: 'user',
          content: `Generate up to ${maxStories} concise user stories in this format:
As a [role], I want to [action], so that [benefit].
Separate each story with a newline.
Project description: ${projectDescription}`
        }
      ];

      const completion = await groq.chat.completions.create({
        messages,
        model: 'openai/gpt-oss-20b',
        temperature: 0.6,
        max_completion_tokens: 1024,
        top_p: 1,
        stream: false
      });

      storiesText = completion.choices?.[0]?.message?.content?.trim();
      if (!storiesText) return res.status(500).json({ error: 'GROQ AI response malformed', raw: completion });
    } else {
      // Fallback heuristic
      const sentences = projectDescription
        .split(/[.!\n]/)
        .map(s => s.trim())
        .filter(Boolean)
        .slice(0, maxStories);

      storiesText = sentences.map(s => `As a user, I want to ${s}, so that I get value.`).join('\n');
    }

    const stories = storiesText
      .split(/\n+/)
      .map(s => s.trim())
      .filter(Boolean)
      .slice(0, maxStories);

    const created = [];
    for (const s of stories) {
      const c = await prisma.userStory.create({ data: { projectId: parseInt(projectId), text: s } });
      created.push(c.text);
    }

    res.json(created);
  } catch (err) {
    console.error('AI endpoint error', err);
    res.status(500).json({ error: 'AI error' });
  }
});

module.exports = router;
