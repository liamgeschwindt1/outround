'use strict';

/**
 * CRM routes — Pipedrive data proxy
 *
 *   GET /api/crm/contacts   — list Pipedrive persons
 *   GET /api/crm/deals      — list Pipedrive deals (open)
 *   GET /api/crm/status     — check if Pipedrive is connected
 */

const express = require('express');
const { requireAuth } = require('../middleware/auth');
const pipedrive = require('../services/pipedrive');

const router = express.Router();

router.get('/crm/status', requireAuth, async (req, res) => {
  const userId = req.user?.id || req.supabaseUser?.id;
  if (!userId) return res.status(401).json({ error: 'Unauthorised' });
  try {
    const connected = await pipedrive.isConnected(userId);
    res.json({ connected });
  } catch {
    res.json({ connected: false });
  }
});

router.get('/crm/contacts', requireAuth, async (req, res) => {
  const userId = req.user?.id || req.supabaseUser?.id;
  if (!userId) return res.status(401).json({ error: 'Unauthorised' });

  try {
    const data = await pipedrive.get(userId, '/persons?limit=50&sort=add_time+DESC');
    const persons = (data?.data || []).map((p) => ({
      id: p.id,
      name: p.name,
      email: p.email?.[0]?.value || null,
      phone: p.phone?.[0]?.value || null,
      company: p.org_name || null,
      owner: p.owner_name || null,
      deals_count: p.open_deals_count || 0,
      won_deals_count: p.won_deals_count || 0,
      added: p.add_time || null,
    }));
    res.json({
      contacts: persons,
      total: data?.additional_data?.pagination?.total_count || persons.length,
    });
  } catch (err) {
    if (err.message?.includes('connect Pipedrive first')) {
      return res
        .status(403)
        .json({ error: 'not_connected', message: 'Connect Pipedrive in Settings first.' });
    }
    console.error('[crm] contacts error:', err.message);
    res.status(500).json({ error: err.message });
  }
});

router.get('/crm/deals', requireAuth, async (req, res) => {
  const userId = req.user?.id || req.supabaseUser?.id;
  if (!userId) return res.status(401).json({ error: 'Unauthorised' });

  try {
    const data = await pipedrive.get(userId, '/deals?status=open&limit=50&sort=add_time+DESC');
    const deals = (data?.data || []).map((d) => ({
      id: d.id,
      title: d.title,
      value: d.value,
      currency: d.currency,
      status: d.status,
      stage: d.stage_name || null,
      pipeline: d.pipeline_id || null,
      person_name: d.person_name || null,
      org_name: d.org_name || null,
      owner: d.owner_name || null,
      probability: d.probability || null,
      expected_close: d.expected_close_date || null,
      added: d.add_time || null,
      updated: d.update_time || null,
    }));
    res.json({ deals, total: data?.additional_data?.pagination?.total_count || deals.length });
  } catch (err) {
    if (err.message?.includes('connect Pipedrive first')) {
      return res
        .status(403)
        .json({ error: 'not_connected', message: 'Connect Pipedrive in Settings first.' });
    }
    console.error('[crm] deals error:', err.message);
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
