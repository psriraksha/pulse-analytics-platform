import Site from '../models/Site.js';

export async function listSites(req, res) {
  try {
    const sites = await Site.find({ company: req.company._id }).sort({ createdAt: -1 });
    res.json({ sites });
  } catch (err) {
    console.error('[listSites] error:', err.message);
    res.status(500).json({ error: 'Internal server error' });
  }
}

export async function createSite(req, res) {
  try {
    const { name, domain } = req.body;

    if (!name || !domain) {
      return res.status(400).json({ error: 'name and domain are required' });
    }

    const site = await Site.create({
      company: req.company._id,
      name,
      domain,
    });

    res.status(201).json({ site });
  } catch (err) {
    console.error('[createSite] error:', err.message);
    res.status(500).json({ error: 'Internal server error' });
  }
}

export async function deleteSite(req, res) {
  try {
    const { siteId } = req.params;

    const site = await Site.findOneAndUpdate(
      { siteId, company: req.company._id },
      { isActive: false },
      { new: true }
    );

    if (!site) {
      return res.status(404).json({ error: 'Site not found' });
    }

    res.json({ message: 'Site deactivated', site });
  } catch (err) {
    console.error('[deleteSite] error:', err.message);
    res.status(500).json({ error: 'Internal server error' });
  }
}

// Verifies the requested siteId belongs to the authenticated company before
// any dashboard/analytics/export route is allowed to read its data.
export async function verifySiteOwnership(req, res, next) {
  try {
    const siteId = req.params.siteId || req.query.siteId;

    const site = await Site.findOne({ siteId, company: req.company._id });
    if (!site) {
      return res.status(404).json({ error: 'Site not found or does not belong to your account' });
    }

    req.site = site;
    next();
  } catch (err) {
    console.error('[verifySiteOwnership] error:', err.message);
    res.status(500).json({ error: 'Internal server error' });
  }
}
