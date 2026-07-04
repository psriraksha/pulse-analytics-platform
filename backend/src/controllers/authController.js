import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import Company from '../models/Company.js';
import Site from '../models/Site.js';

function signToken(companyId) {
  return jwt.sign({ companyId }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN || '7d',
  });
}

export async function signup(req, res) {
  try {
    const { name, email, password, domain } = req.body;

    if (!name || !email || !password || !domain) {
      return res.status(400).json({ error: 'name, email, password, and domain are required' });
    }

    const existing = await Company.findOne({ email: email.toLowerCase() });
    if (existing) {
      return res.status(409).json({ error: 'An account with this email already exists' });
    }

    const hashedPassword = await bcrypt.hash(password, 12);

    const company = await Company.create({
      name,
      email: email.toLowerCase(),
      password: hashedPassword,
      domain,
    });

    // Automatically create the company's first site so they get a tracking script immediately
    const site = await Site.create({
      company: company._id,
      name: `${name} - Main Site`,
      domain,
    });

    const token = signToken(company._id);

    res.status(201).json({
      token,
      company: {
        id: company._id,
        name: company.name,
        email: company.email,
        plan: company.plan,
      },
      site: {
        id: site._id,
        siteId: site.siteId,
        domain: site.domain,
      },
    });
  } catch (err) {
    console.error('[signup] error:', err.message);
    res.status(500).json({ error: 'Internal server error' });
  }
}

export async function login(req, res) {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: 'email and password are required' });
    }

    const company = await Company.findOne({ email: email.toLowerCase() });
    if (!company) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    const isMatch = await bcrypt.compare(password, company.password);
    if (!isMatch) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    const token = signToken(company._id);

    res.json({
      token,
      company: {
        id: company._id,
        name: company.name,
        email: company.email,
        plan: company.plan,
      },
    });
  } catch (err) {
    console.error('[login] error:', err.message);
    res.status(500).json({ error: 'Internal server error' });
  }
}

export async function getMe(req, res) {
  res.json({ company: req.company });
}
