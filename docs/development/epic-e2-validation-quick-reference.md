# Epic E2 Validation Checkpoint — Quick Reference

**Target Date:** 2026-07-06 (or next day jobs run)  
**Staging Commit:** 101d32ba  
**Gate Criteria:** >= 500 labeled openings + precursor_stats populated + admin API working

---

## 📋 Checkpoint 1: outcome-label-backfill-job (@10:03 UTC)

**Time Window:** 10:03 UTC ±5 min  
**Check After:** ~10:15 UTC (allow 15 min for job completion)

```bash
# View logs
railway logs --service worker | grep "outcome-label-backfill-job"
```

**Expected Output:**
```
outcome-label-backfill-job: exec_hire labeler fetched N events
outcome-label-backfill-job: pipeline labeler fetched M companies
outcome-label-backfill-job: proxy_diff labeler processed K CIKs
outcome-label-backfill-job: complete { execHire: A, pipeline: B, proxy: C, labeledEvents: D }
```

**Database Query:**
```sql
SELECT label_source, COUNT(*) as count
FROM role_openings
WHERE created_at > now() - interval '7 days'
GROUP BY label_source
ORDER BY count DESC;
```

**✅ PASS Criteria:** 
- >= 500 total openings (sum across all sources)
- At least 4 sources present: career_scan, exec_hire, user_pipeline, proxy_diff

**If no recent rows:** Job hasn't run yet. Wait or manually trigger:
```bash
railway run node worker/jobs/outcome-label-backfill-job.js
```

---

## 📊 Checkpoint 2: precursor-stats-job (@10:40 UTC)

**Time Window:** 10:40 UTC ±5 min  
**Check After:** ~10:50 UTC (allow 15 min for job completion)

```bash
# View logs
railway logs --service worker | grep "precursor-stats-job"
```

**Expected Output:**
```
precursor-stats-job: running aggregation
precursor-stats-job: complete { inserted: N, updated: M, rows: X }
```

**Database Query:**
```sql
SELECT 
  event_type, 
  sector, 
  role_family,
  n_events,
  n_preceded,
  ROUND(hit_rate::numeric, 4) as hit_rate,
  median_days_to_opening
FROM precursor_stats
ORDER BY computed_at DESC
LIMIT 20;
```

**✅ PASS Criteria:**
- n_preceded > 0 (labeled outcomes exist)
- 0 < hit_rate < 1 (valid Laplace-smoothed value)
- median_days_to_opening > 0 (positive lead time)
- >= 10 rows for event_type/sector/family combinations

**If no rows:** Job hasn't run yet. Wait or manually trigger:
```bash
railway run node worker/jobs/precursor-stats-job.js
```

---

## 🔌 Checkpoint 3: Admin API Endpoint

**Test URL:** `/api/admin/intelligence/label-metrics`  
**Check After:** All jobs complete

**Production Curl:**
```bash
curl -H "Authorization: Bearer $ADMIN_TOKEN" \
  https://api.startingmonday.com/api/admin/intelligence/label-metrics \
  | jq '.gate'
```

**Dev/Local Test:**
```bash
curl http://localhost:3000/api/admin/intelligence/label-metrics | jq '.'
```

**Expected Response:**
```json
{
  "stats": {
    "totalCompanies": N,
    "companiesWithLabels": M,
    "coveragePercent": X.X,
    "medianDaysToOpening": Y,
    "openingsBySource": { "career_scan": A, "exec_hire": B, "user_pipeline": C, "proxy_diff": D },
    "openingsByFamily": { ... },
    "openingsBySector": { ... },
    "sourceDetails": [ ... ]
  },
  "gate": {
    "target": ">= 500 labeled openings",
    "current": 500+,
    "status": "pass"
  }
}
```

**✅ PASS Criteria:**
- HTTP 200 response
- gate.current >= 500
- gate.status = "pass"
- medianDaysToOpening > 0
- 4 sources in openingsBySource

---

## 🎯 Decision Point

### ✅ If All Checkpoints Pass:

1. **Promote staging → main:**
   ```bash
   git checkout main
   git pull
   git merge staging
   git push origin main
   # Railway auto-deploys
   ```

2. **Proceed to Epic E3:**
   - Weeks 5-6: Backtest Harness + Free Sources
   - Tasks: T3.1-T3.7 (cohort builder, matched controls, replay engine, etc.)

### ❌ If Any Checkpoint Fails:

**Troubleshooting Map:**

| Failure | Check | Action |
|---------|-------|--------|
| < 500 openings | outcome-label logs | Review for errors; check canonical resolution in write-signal.js |
| Empty precursor_stats | precursor-stats logs | Verify event_outcome_labels has rows; check hit_rate calculation |
| API 500/404 error | label-metrics route | Check server logs; verify database connectivity |

**Manual Recovery:**
```bash
# Rerun jobs manually
railway run node worker/jobs/outcome-label-backfill-job.js
railway run node worker/jobs/precursor-stats-job.js

# Retest
curl http://localhost:3000/api/admin/intelligence/label-metrics
```

**Rollback if Needed:**
```bash
# Revert E2 commit
git log --oneline | head -10  # Find commit 101d32ba
git revert 101d32ba
git push origin main
railway deploy
```

---

## 📅 Timeline

- **@10:03 UTC:** outcome-label-backfill-job scheduled
- **@10:15 UTC:** ✅ Check Checkpoint 1
- **@10:40 UTC:** precursor-stats-job scheduled
- **@10:50 UTC:** ✅ Check Checkpoint 2
- **@11:00 UTC:** ✅ Test Checkpoint 3
- **@12:00 UTC:** 🎯 Decision point: proceed to E3 or troubleshoot?

---

## 📞 Related Documentation

- **Deployment Checklist:** [docs/epic-e2-deployment-checklist.md](docs/epic-e2-deployment-checklist.md)
- **Vendor Audit:** [docs/vendor-tos-audit-2026-07-05.md](docs/vendor-tos-audit-2026-07-05.md)
- **Staging Commit:** 101d32ba (5 files, 1025 insertions)
- **Calendar Alert:** docs/operations/reminders/epic-e2-validation-checkpoint.ics (import to calendar app)

---

## ⚡ Quick Command Reference

```bash
# View worker logs
railway logs --service worker | grep -E "(outcome-label-backfill-job|precursor-stats-job)"

# Manual job triggers
railway run node worker/jobs/outcome-label-backfill-job.js
railway run node worker/jobs/precursor-stats-job.js

# API test
curl http://localhost:3000/api/admin/intelligence/label-metrics | jq '.gate'

# Current branch status
git status
git log --oneline | head -5

# Promote to main (if gates pass)
git checkout main && git pull && git merge staging && git push origin main

# Monitor deployment
railway logs --service web --follow
```
