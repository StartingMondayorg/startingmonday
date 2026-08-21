-- Migration 129: Fix auth_rls_initplan warnings
-- Wraps auth.uid() / auth.role() / auth.jwt() in (SELECT ...) so Postgres
-- evaluates them once per query instead of once per row.
-- Source: Supabase performance advisor, 119 policies across
--         93 tables, all flagged WARN.

ALTER POLICY "Users manage their own activation milestones" ON public.activation_milestones
    USING ((user_id = (SELECT auth.uid())))
    WITH CHECK ((user_id = (SELECT auth.uid())));

ALTER POLICY "Users manage their own activation reminder logs" ON public.activation_reminder_logs
    USING ((user_id = (SELECT auth.uid())))
    WITH CHECK ((user_id = (SELECT auth.uid())));

ALTER POLICY api_usage_read_own ON public.api_usage
    USING (((SELECT auth.uid()) = user_id));

ALTER POLICY "Users manage their own automation alerts" ON public.automation_alerts
    USING ((user_id = (SELECT auth.uid())))
    WITH CHECK ((user_id = (SELECT auth.uid())));

ALTER POLICY "Users manage their own billing renewal reminder logs" ON public.billing_renewal_reminder_logs
    USING ((user_id = (SELECT auth.uid())))
    WITH CHECK ((user_id = (SELECT auth.uid())));

ALTER POLICY "Users manage their own bookkeeping entry preparation runs" ON public.bookkeeping_entry_preparation_runs
    USING ((user_id = (SELECT auth.uid())))
    WITH CHECK ((user_id = (SELECT auth.uid())));

ALTER POLICY "users read own brief quality log" ON public.brief_quality_log
    USING (((SELECT auth.uid()) = user_id));

ALTER POLICY "Users manage own briefs" ON public.briefs
    USING (((SELECT auth.uid()) = user_id))
    WITH CHECK (((SELECT auth.uid()) = user_id));

ALTER POLICY briefs_own ON public.briefs
    USING (((SELECT auth.uid()) = user_id));

ALTER POLICY coaches_access_briefs ON public.briefs
    USING ((EXISTS ( SELECT 1
   FROM team_seats
  WHERE ((team_seats.owner_id = briefs.user_id) AND (team_seats.member_user_id = (SELECT auth.uid())) AND (team_seats.coach_access_enabled = true) AND (team_seats.status = 'accepted'::text)))));

ALTER POLICY "Users manage their own ci check runs" ON public.ci_check_runs
    USING ((user_id = (SELECT auth.uid())))
    WITH CHECK ((user_id = (SELECT auth.uid())));

ALTER POLICY coaches_view_own_logs ON public.coach_access_logs
    USING ((((SELECT auth.uid()) = coach_id) OR ((SELECT auth.uid()) = client_id)));

ALTER POLICY coaches_manage_prefs ON public.coach_alert_preferences
    USING (((SELECT auth.uid()) = coach_id))
    WITH CHECK (((SELECT auth.uid()) = coach_id));

ALTER POLICY clients_manage_own_coach_permissions ON public.coach_client_permissions
    USING (((SELECT auth.uid()) = client_id))
    WITH CHECK (((SELECT auth.uid()) = client_id));

ALTER POLICY coaches_read_client_permissions ON public.coach_client_permissions
    USING (((SELECT auth.uid()) = coach_id));

ALTER POLICY clients_read_connected_coach_profiles ON public.coach_profiles
    USING ((EXISTS ( SELECT 1
   FROM team_seats ts
  WHERE ((ts.owner_id = coach_profiles.coach_id) AND (ts.member_user_id = (SELECT auth.uid())) AND (ts.status = 'accepted'::text)))));

ALTER POLICY coach_profiles_own_manage ON public.coach_profiles
    USING (((SELECT auth.uid()) = coach_id))
    WITH CHECK (((SELECT auth.uid()) = coach_id));

ALTER POLICY coaches_manage_weekly_reviews ON public.coach_weekly_reviews
    USING ((((SELECT auth.uid()) = coach_id) OR ((SELECT auth.uid()) = client_id)))
    WITH CHECK ((((SELECT auth.uid()) = coach_id) OR ((SELECT auth.uid()) = client_id)));

ALTER POLICY coaches_access_companies ON public.companies
    USING ((EXISTS ( SELECT 1
   FROM team_seats
  WHERE ((team_seats.owner_id = companies.user_id) AND (team_seats.member_user_id = (SELECT auth.uid())) AND (team_seats.coach_access_enabled = true) AND (team_seats.status = 'accepted'::text)))));

ALTER POLICY companies_own ON public.companies
    USING (((SELECT auth.uid()) = user_id))
    WITH CHECK (((SELECT auth.uid()) = user_id));

ALTER POLICY coaches_access_documents ON public.company_documents
    USING ((EXISTS ( SELECT 1
   FROM team_seats
  WHERE ((team_seats.owner_id = company_documents.user_id) AND (team_seats.member_user_id = (SELECT auth.uid())) AND (team_seats.coach_access_enabled = true) AND (team_seats.status = 'accepted'::text)))));

ALTER POLICY documents_delete_own ON public.company_documents
    USING (((SELECT auth.uid()) = user_id));

ALTER POLICY documents_insert_own ON public.company_documents
    WITH CHECK (((SELECT auth.uid()) = user_id));

ALTER POLICY documents_own ON public.company_documents
    USING (((SELECT auth.uid()) = user_id));

ALTER POLICY documents_select_own ON public.company_documents
    USING (((SELECT auth.uid()) = user_id));

ALTER POLICY documents_update_own ON public.company_documents
    USING (((SELECT auth.uid()) = user_id))
    WITH CHECK (((SELECT auth.uid()) = user_id));

ALTER POLICY users_own_interview_logs ON public.company_interview_logs
    USING ((user_id = (SELECT auth.uid())));

ALTER POLICY coaches_access_signals ON public.company_signals
    USING ((EXISTS ( SELECT 1
   FROM team_seats
  WHERE ((team_seats.owner_id = company_signals.user_id) AND (team_seats.member_user_id = (SELECT auth.uid())) AND (team_seats.coach_access_enabled = true) AND (team_seats.status = 'accepted'::text)))));

ALTER POLICY signals_own ON public.company_signals
    USING (((SELECT auth.uid()) = user_id));

ALTER POLICY "Users manage own signals" ON public.company_signals
    USING ((user_id = (SELECT auth.uid())))
    WITH CHECK ((user_id = (SELECT auth.uid())));

ALTER POLICY "Users read own concierge calls" ON public.concierge_calls
    USING (((SELECT auth.uid()) = user_id));

ALTER POLICY coaches_access_contacts ON public.contacts
    USING ((EXISTS ( SELECT 1
   FROM team_seats
  WHERE ((team_seats.owner_id = contacts.user_id) AND (team_seats.member_user_id = (SELECT auth.uid())) AND (team_seats.coach_access_enabled = true) AND (team_seats.status = 'accepted'::text)))));

ALTER POLICY contacts_own ON public.contacts
    USING (((SELECT auth.uid()) = user_id));

ALTER POLICY contacts_own ON public.contacts
    USING ((user_id = (SELECT auth.uid())))
    WITH CHECK ((user_id = (SELECT auth.uid())));

ALTER POLICY conversations_own ON public.conversations
    USING ((user_id = (SELECT auth.uid())))
    WITH CHECK ((user_id = (SELECT auth.uid())));

ALTER POLICY "Users manage their own council review prep runs" ON public.council_review_prep_runs
    USING ((user_id = (SELECT auth.uid())))
    WITH CHECK ((user_id = (SELECT auth.uid())));

ALTER POLICY "Users manage their own customer health checks" ON public.customer_health_checks
    USING ((user_id = (SELECT auth.uid())))
    WITH CHECK ((user_id = (SELECT auth.uid())));

ALTER POLICY "Users manage their own customer status reports" ON public.customer_status_reports
    USING ((user_id = (SELECT auth.uid())))
    WITH CHECK ((user_id = (SELECT auth.uid())));

ALTER POLICY "Users manage their own daily operating snapshots" ON public.daily_operating_snapshots
    USING ((user_id = (SELECT auth.uid())))
    WITH CHECK ((user_id = (SELECT auth.uid())));

ALTER POLICY "Users manage their own deployment validation runs" ON public.deployment_validation_runs
    USING ((user_id = (SELECT auth.uid())))
    WITH CHECK ((user_id = (SELECT auth.uid())));

ALTER POLICY drafts_own ON public.drafts
    USING ((user_id = (SELECT auth.uid())))
    WITH CHECK ((user_id = (SELECT auth.uid())));

ALTER POLICY "Users manage their own EMI sprint export runs" ON public.emi_sprint_export_runs
    USING ((user_id = (SELECT auth.uid())))
    WITH CHECK ((user_id = (SELECT auth.uid())));

ALTER POLICY "Users manage their own error monitoring runs" ON public.error_monitoring_runs
    USING ((user_id = (SELECT auth.uid())))
    WITH CHECK ((user_id = (SELECT auth.uid())));

ALTER POLICY "Users manage their own exception list runs" ON public.exception_list_runs
    USING ((user_id = (SELECT auth.uid())))
    WITH CHECK ((user_id = (SELECT auth.uid())));

ALTER POLICY "Users can read own exec snapshots" ON public.exec_snapshots
    USING ((user_id = (SELECT auth.uid())));

ALTER POLICY "Users manage their own failed payment retry runs" ON public.failed_payment_retry_runs
    USING ((user_id = (SELECT auth.uid())))
    WITH CHECK ((user_id = (SELECT auth.uid())));

ALTER POLICY "Users manage their own faq response logs" ON public.faq_response_logs
    USING ((user_id = (SELECT auth.uid())))
    WITH CHECK ((user_id = (SELECT auth.uid())));

ALTER POLICY feedback_comments_delete_own ON public.feedback_comments
    USING (((SELECT auth.uid()) = user_id));

ALTER POLICY feedback_comments_insert_own ON public.feedback_comments
    WITH CHECK (((SELECT auth.uid()) = user_id));

ALTER POLICY feedback_comments_update_own ON public.feedback_comments
    USING (((SELECT auth.uid()) = user_id))
    WITH CHECK (((SELECT auth.uid()) = user_id));

ALTER POLICY feedback_items_insert_authenticated_role ON public.feedback_items
    WITH CHECK ((((SELECT auth.role()) = 'authenticated'::text) AND (type = 'feedback'::text)));

ALTER POLICY feedback_status_history_insert_authenticated ON public.feedback_status_history
    WITH CHECK (((SELECT auth.uid()) = changed_by));

ALTER POLICY feedback_votes_delete_own ON public.feedback_votes
    USING (((SELECT auth.uid()) = user_id));

ALTER POLICY feedback_votes_insert_own ON public.feedback_votes
    WITH CHECK (((SELECT auth.uid()) = user_id));

ALTER POLICY follow_ups_own_or_coach_access ON public.follow_ups
    USING ((((SELECT auth.uid()) = user_id) OR (EXISTS ( SELECT 1
   FROM team_seats ts
  WHERE ((ts.owner_id = follow_ups.user_id) AND (ts.member_user_id = (SELECT auth.uid())) AND (ts.coach_access_enabled = true) AND (ts.status = 'accepted'::text))))))
    WITH CHECK ((((SELECT auth.uid()) = user_id) OR (EXISTS ( SELECT 1
   FROM team_seats ts
  WHERE ((ts.owner_id = follow_ups.user_id) AND (ts.member_user_id = (SELECT auth.uid())) AND (ts.coach_access_enabled = true) AND (ts.status = 'accepted'::text))))));

ALTER POLICY "Users manage their own help center routing logs" ON public.help_center_routing_logs
    USING ((user_id = (SELECT auth.uid())))
    WITH CHECK ((user_id = (SELECT auth.uid())));

ALTER POLICY "Users manage their own identity checks" ON public.identity_verification_checks
    USING ((user_id = (SELECT auth.uid())))
    WITH CHECK ((user_id = (SELECT auth.uid())));

ALTER POLICY "Users manage their own inactivity nudge logs" ON public.inactivity_nudge_logs
    USING ((user_id = (SELECT auth.uid())))
    WITH CHECK ((user_id = (SELECT auth.uid())));

ALTER POLICY "Users read own pulse" ON public.industry_pulse
    USING (((SELECT auth.uid()) = user_id));

ALTER POLICY "Users manage their own invoice receipt runs" ON public.invoice_receipt_runs
    USING ((user_id = (SELECT auth.uid())))
    WITH CHECK ((user_id = (SELECT auth.uid())));

ALTER POLICY linkedin_contact_matches_own ON public.linkedin_contact_matches
    USING (((SELECT auth.uid()) = user_id))
    WITH CHECK (((SELECT auth.uid()) = user_id));

ALTER POLICY linkedin_import_audit_events_insert_own ON public.linkedin_import_audit_events
    WITH CHECK (((SELECT auth.uid()) = user_id));

ALTER POLICY linkedin_import_audit_events_select_own ON public.linkedin_import_audit_events
    USING (((SELECT auth.uid()) = user_id));

ALTER POLICY linkedin_import_consents_own ON public.linkedin_import_consents
    USING (((SELECT auth.uid()) = user_id))
    WITH CHECK (((SELECT auth.uid()) = user_id));

ALTER POLICY linkedin_imported_connections_own ON public.linkedin_imported_connections
    USING (((SELECT auth.uid()) = user_id))
    WITH CHECK (((SELECT auth.uid()) = user_id));

ALTER POLICY "Users manage their own lint typecheck runs" ON public.lint_typecheck_runs
    USING ((user_id = (SELECT auth.uid())))
    WITH CHECK ((user_id = (SELECT auth.uid())));

ALTER POLICY user_insert_own_trace ON public.llm_traces
    WITH CHECK (((SELECT auth.uid()) = user_id));

ALTER POLICY "Users manage their own meeting bookings" ON public.meeting_bookings
    USING ((user_id = (SELECT auth.uid())))
    WITH CHECK ((user_id = (SELECT auth.uid())));

ALTER POLICY momentum_scores_own ON public.momentum_scores
    USING ((user_id = (SELECT auth.uid())))
    WITH CHECK ((user_id = (SELECT auth.uid())));

ALTER POLICY "Users manage their own monthly business review runs" ON public.monthly_business_review_runs
    USING ((user_id = (SELECT auth.uid())))
    WITH CHECK ((user_id = (SELECT auth.uid())));

ALTER POLICY "users manage own narrative versions" ON public.narrative_versions
    USING (((SELECT auth.uid()) = user_id))
    WITH CHECK (((SELECT auth.uid()) = user_id));

ALTER POLICY "Users manage their own onboarding brief runs" ON public.onboarding_brief_runs
    USING ((user_id = (SELECT auth.uid())))
    WITH CHECK ((user_id = (SELECT auth.uid())));

ALTER POLICY "Users manage their own onboarding context snapshots" ON public.onboarding_context_snapshots
    USING ((user_id = (SELECT auth.uid())))
    WITH CHECK ((user_id = (SELECT auth.uid())));

ALTER POLICY "Users manage their own intake submissions" ON public.onboarding_intake_submissions
    USING ((user_id = (SELECT auth.uid())))
    WITH CHECK ((user_id = (SELECT auth.uid())));

ALTER POLICY "Users manage their own onboarding video run events" ON public.onboarding_video_run_events
    USING ((EXISTS ( SELECT 1
   FROM onboarding_video_runs r
  WHERE ((r.id = onboarding_video_run_events.run_id) AND (r.user_id = (SELECT auth.uid()))))))
    WITH CHECK ((EXISTS ( SELECT 1
   FROM onboarding_video_runs r
  WHERE ((r.id = onboarding_video_run_events.run_id) AND (r.user_id = (SELECT auth.uid()))))));

ALTER POLICY "Users manage their own onboarding video runs" ON public.onboarding_video_runs
    USING ((user_id = (SELECT auth.uid())))
    WITH CHECK ((user_id = (SELECT auth.uid())));

ALTER POLICY "Users read their onboarding video webhook events" ON public.onboarding_video_webhook_events
    USING ((user_id = (SELECT auth.uid())));

ALTER POLICY "Users manage their own onboarding video workflows" ON public.onboarding_video_workflows
    USING ((user_id = (SELECT auth.uid())))
    WITH CHECK ((user_id = (SELECT auth.uid())));

ALTER POLICY "Users manage their own onboarding workflow assignments" ON public.onboarding_workflow_assignments
    USING ((user_id = (SELECT auth.uid())))
    WITH CHECK ((user_id = (SELECT auth.uid())));

ALTER POLICY "Users read own radar" ON public.opportunity_radar
    USING (((SELECT auth.uid()) = user_id));

ALTER POLICY "Users manage their own outreach logs" ON public.outreach_logs
    USING ((user_id = (SELECT auth.uid())))
    WITH CHECK ((user_id = (SELECT auth.uid())));

ALTER POLICY coaches_access_outreach_logs ON public.outreach_logs
    USING ((EXISTS ( SELECT 1
   FROM team_seats
  WHERE ((team_seats.owner_id = outreach_logs.user_id) AND (team_seats.member_user_id = (SELECT auth.uid())) AND (team_seats.coach_access_enabled = true) AND (team_seats.status = 'accepted'::text)))));

ALTER POLICY outreach_logs_own ON public.outreach_logs
    USING (((SELECT auth.uid()) = user_id));

ALTER POLICY "Users manage their own outreach reply inbox" ON public.outreach_reply_inbox
    USING ((user_id = (SELECT auth.uid())))
    WITH CHECK ((user_id = (SELECT auth.uid())));

ALTER POLICY "Users manage their own outreach send batches" ON public.outreach_send_batches
    USING ((user_id = (SELECT auth.uid())))
    WITH CHECK ((user_id = (SELECT auth.uid())));

ALTER POLICY "Users manage their own outreach send jobs" ON public.outreach_send_jobs
    USING ((user_id = (SELECT auth.uid())))
    WITH CHECK ((user_id = (SELECT auth.uid())));

ALTER POLICY "Users manage their own outreach suppressions" ON public.outreach_suppressions
    USING ((user_id = (SELECT auth.uid())))
    WITH CHECK ((user_id = (SELECT auth.uid())));

ALTER POLICY "Users manage their own payment reconciliation checks" ON public.payment_reconciliation_checks
    USING ((user_id = (SELECT auth.uid())))
    WITH CHECK ((user_id = (SELECT auth.uid())));

ALTER POLICY "Users manage their own payout matching runs" ON public.payout_matching_runs
    USING ((user_id = (SELECT auth.uid())))
    WITH CHECK ((user_id = (SELECT auth.uid())));

ALTER POLICY audit_log_read ON public.pipeline_audit_log
    USING ((user_id = (SELECT auth.uid())));

ALTER POLICY "Users manage their own plan change requests" ON public.plan_change_requests
    USING ((user_id = (SELECT auth.uid())))
    WITH CHECK ((user_id = (SELECT auth.uid())));

ALTER POLICY "Users manage their own refund workflow triggers" ON public.refund_workflow_triggers
    USING ((user_id = (SELECT auth.uid())))
    WITH CHECK ((user_id = (SELECT auth.uid())));

ALTER POLICY "Users manage their own release note runs" ON public.release_note_runs
    USING ((user_id = (SELECT auth.uid())))
    WITH CHECK ((user_id = (SELECT auth.uid())));

ALTER POLICY "Users manage their own renewal reminder logs" ON public.renewal_reminder_logs
    USING ((user_id = (SELECT auth.uid())))
    WITH CHECK ((user_id = (SELECT auth.uid())));

ALTER POLICY "Users manage their own revenue classification runs" ON public.revenue_classification_runs
    USING ((user_id = (SELECT auth.uid())))
    WITH CHECK ((user_id = (SELECT auth.uid())));

ALTER POLICY "Users manage their own revenue exception reports" ON public.revenue_exception_reports
    USING ((user_id = (SELECT auth.uid())))
    WITH CHECK ((user_id = (SELECT auth.uid())));

ALTER POLICY "Users manage their own revenue mismatch flags" ON public.revenue_mismatch_flags
    USING ((user_id = (SELECT auth.uid())))
    WITH CHECK ((user_id = (SELECT auth.uid())));

ALTER POLICY "Users manage their own revenue recognition inputs" ON public.revenue_recognition_inputs
    USING ((user_id = (SELECT auth.uid())))
    WITH CHECK ((user_id = (SELECT auth.uid())));

ALTER POLICY "Users manage their own revenue sync runs" ON public.revenue_sync_runs
    USING ((user_id = (SELECT auth.uid())))
    WITH CHECK ((user_id = (SELECT auth.uid())));

ALTER POLICY "Users manage their own runtime health check runs" ON public.runtime_health_check_runs
    USING ((user_id = (SELECT auth.uid())))
    WITH CHECK ((user_id = (SELECT auth.uid())));

ALTER POLICY scan_results_own ON public.scan_results
    USING ((user_id = (SELECT auth.uid())))
    WITH CHECK ((user_id = (SELECT auth.uid())));

ALTER POLICY "Users manage their own scheduled job observability runs" ON public.scheduled_job_observability_runs
    USING ((user_id = (SELECT auth.uid())))
    WITH CHECK ((user_id = (SELECT auth.uid())));

ALTER POLICY "users read own signal action events" ON public.signal_action_events
    USING (((SELECT auth.uid()) = user_id));

ALTER POLICY "Users manage their own subscription status update logs" ON public.subscription_status_update_logs
    USING ((user_id = (SELECT auth.uid())))
    WITH CHECK ((user_id = (SELECT auth.uid())));

ALTER POLICY "Users manage their own support issue triage" ON public.support_issue_triage
    USING ((user_id = (SELECT auth.uid())))
    WITH CHECK ((user_id = (SELECT auth.uid())));

ALTER POLICY coaches_view_client_access ON public.team_seats
    USING ((((SELECT auth.uid()) = member_user_id) AND (coach_access_enabled = true) AND (status = 'accepted'::text)));

ALTER POLICY members_select_seat ON public.team_seats
    USING (((SELECT auth.uid()) = member_user_id));

ALTER POLICY owners_delete_seats ON public.team_seats
    USING (((SELECT auth.uid()) = owner_id));

ALTER POLICY owners_insert_seats ON public.team_seats
    WITH CHECK (((SELECT auth.uid()) = owner_id));

ALTER POLICY owners_select_seats ON public.team_seats
    USING (((SELECT auth.uid()) = owner_id));

ALTER POLICY "Users manage their own test execution runs" ON public.test_execution_runs
    USING ((user_id = (SELECT auth.uid())))
    WITH CHECK ((user_id = (SELECT auth.uid())));

ALTER POLICY "Users manage their own trend report runs" ON public.trend_report_runs
    USING ((user_id = (SELECT auth.uid())))
    WITH CHECK ((user_id = (SELECT auth.uid())));

ALTER POLICY "Users manage their own usage monitor runs" ON public.usage_monitor_runs
    USING ((user_id = (SELECT auth.uid())))
    WITH CHECK ((user_id = (SELECT auth.uid())));

ALTER POLICY users_read_own_events ON public.user_events
    USING (((SELECT auth.uid()) = user_id));

ALTER POLICY user_profiles_own ON public.user_profiles
    USING ((user_id = (SELECT auth.uid())))
    WITH CHECK ((user_id = (SELECT auth.uid())));

ALTER POLICY users_own ON public.users
    USING ((id = (SELECT auth.uid())))
    WITH CHECK ((id = (SELECT auth.uid())));

ALTER POLICY "Users manage their own weekly KPI summary runs" ON public.weekly_kpi_summary_runs
    USING ((user_id = (SELECT auth.uid())))
    WITH CHECK ((user_id = (SELECT auth.uid())));

-- 119 policies updated