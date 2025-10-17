const express = require('express');
const router = express.Router();
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const fetch = require('node-fetch');

const OPENAI_KEY = process.env.OPENAI_API_KEY || '';

router.post('/generate-user-stories', async (req, res) => {
  try {
    const { projectId, projectDescription, maxStories = 8 } = req.body;
    if (!projectDescription) return res.status(400).json({ error: 'projectDescription required' });

    if (!OPENAI_KEY) {
      // fallback
      const heur = projectDescription
        .split(/[.!\n]/)
        .map(s => s.trim())
        .filter(Boolean)
        .slice(0, maxStories)
        .map((s, i) => `As a user, I want to ${s.toLowerCase()}, so that I get value.`);
      const created = await Promise.all(heur.map(text => prisma.userStory.create({ data: { projectId, text } })));
      return res.json(created.map(c => c.text));
    }

    const prompt = `Generate ${maxStories} concise user stories in the format: As a [role], I want to [action], so that [benefit].\nProject description: ${projectDescription}`;

    const body = {
      model: "gpt-4o-mini",
      prompt,
      max_tokens: 400,
      temperature: 0.6,
      n: 1
    };

    const r = await fetch('https://api.openai.com/v1/completions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${OPENAI_KEY}` },
      body: JSON.stringify(body)
    });

    const data = await r.json();
    let text = (data.choices && data.choices[0] && data.choices[0].text) ? data.choices[0].text : (data.choices?.[0]?.message?.content || '');
    if (!text) return res.status(500).json({ error: 'AI response malformed', raw: data });

    const stories = text.split(/\n+/).map(s => s.trim()).filter(Boolean).slice(0, maxStories);
    
    const created = [];
    for (const s of stories) {
      const c = await prisma.userStory.create({ data: { projectId, text: s }});
      created.push(c.text);
    }

    res.json(created);
  } catch (err) {
    console.error('AI endpoint error', err);
    res.status(500).json({ error: 'AI error' });
  }
});

module.exports = router;
