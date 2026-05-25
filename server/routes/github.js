const express = require('express');
const { listRepos, createRepo, pushFiles, enablePages } = require('../services/githubService');

const router = express.Router();

function requireAuth(req, res, next) {
  if (!req.session.githubToken) return res.status(401).json({ error: 'Not authenticated' });
  next();
}

router.get('/repos', requireAuth, async (req, res) => {
  try {
    const repos = await listRepos(req.session.githubToken);
    res.json(repos);
  } catch (err) {
    console.error('List repos error:', err.message);
    res.status(500).json({ error: 'Failed to fetch repositories' });
  }
});

router.post('/push', requireAuth, async (req, res) => {
  const { owner, repo, files } = req.body;
  if (!owner || !repo || !files?.length) {
    return res.status(400).json({ error: 'owner, repo, and files are required' });
  }

  try {
    const repoUrl = await pushFiles(req.session.githubToken, owner, repo, files);
    const pagesUrl = await enablePages(req.session.githubToken, owner, repo);
    res.json({ success: true, repoUrl, pagesUrl });
  } catch (err) {
    console.error('Push error:', err.message);
    res.status(500).json({ error: err.message });
  }
});

// Create new repo → push files → enable Pages — all in one shot
router.post('/deploy', requireAuth, async (req, res) => {
  const { repoName, files, description } = req.body;
  if (!repoName || !files?.length) {
    return res.status(400).json({ error: 'repoName and files are required' });
  }

  try {
    // 1. Create the public repo (auto-renames if name is taken)
    const { name, owner } = await createRepo(req.session.githubToken, repoName, description);

    // 2. Push the generated files
    const repoUrl = await pushFiles(req.session.githubToken, owner, name, files, 'Initial app — built with AppBuilder');

    // 3. Enable GitHub Pages
    const pagesUrl = await enablePages(req.session.githubToken, owner, name);

    res.json({ success: true, repoUrl, pagesUrl, repoName: name });
  } catch (err) {
    console.error('Deploy error:', err.message);
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
