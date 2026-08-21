export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[]

export type Database = {
  public: {
    Tables: {
      companies: {
        Row: {
          id: string
          user_id: string
          name: string
          career_page_url: string | null
          sector: string | null
          fit_score: number | null
          stage: string
          notes: string | null
          last_checked_at: string | null
          alert_threshold: number | null
          archived_at: string | null
          archived_reason: string | null
          created_at: string
          updated_at: string
          crunchbase_id: string | null
          company_url: string | null
          company_size: string | null
          linkedin_url: string | null
          scan_alert_sent_at: string | null
          role_watch_description: string | null
          offer_role_title: string | null
          offer_base: number | null
          offer_bonus_pct: number | null
          offer_signing: number | null
          offer_equity: string | null
          offer_notes: string | null
          offer_decision_factors: string | null
          competitive_context: string | null
          interview_notes: string | null
        }
        Insert: {
          id?: string
          user_id: string
          name: string
          [key: string]: unknown
        }
        Update: {
          [key: string]: unknown
        }
        Relationships: [
          {
            foreignKeyName: 'companies_user_id_fkey'
            columns: ['user_id']
            isOneToOne: false
            referencedRelation: 'users'
            referencedColumns: ['id']
          },
        ]
      }
      contacts: {
        Row: {
          id: string
          user_id: string
          company_id: string | null
          name: string
          title: string | null
          firm: string | null
          channel: string | null
          status: string
          contacted_at: string | null
          follow_up_at: string | null
          notes: string | null
          created_at: string
          updated_at: string
          email: string | null
          linkedin_url: string | null
          outreach_status: string
          is_priority: boolean
          lead_score: number
          lead_tier: string
          lead_queue: string
          lead_score_reasons: Json
          lead_scored_at: string | null
          lead_routed_at: string | null
          contact_type: string | null
          last_role_discussed: string | null
        }
        Insert: {
          id?: string
          user_id: string
          name: string
          [key: string]: unknown
        }
        Update: {
          [key: string]: unknown
        }
        Relationships: [
          {
            foreignKeyName: 'contacts_user_id_fkey'
            columns: ['user_id']
            isOneToOne: false
            referencedRelation: 'users'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'contacts_company_id_fkey'
            columns: ['company_id']
            isOneToOne: false
            referencedRelation: 'companies'
            referencedColumns: ['id']
          },
        ]
      }
      linkedin_import_consents: {
        Row: {
          id: string
          user_id: string
          purpose: string
          method: string
          consented_at: string
          revoked_at: string | null
          data_deleted_at: string | null
          raw_file_name: string | null
          connection_count: number | null
          ip_hash: string | null
          user_agent_hash: string | null
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          method: string
          [key: string]: unknown
        }
        Update: {
          [key: string]: unknown
        }
        Relationships: [
          {
            foreignKeyName: 'linkedin_import_consents_user_id_fkey'
            columns: ['user_id']
            isOneToOne: false
            referencedRelation: 'users'
            referencedColumns: ['id']
          },
        ]
      }
      linkedin_imported_connections: {
        Row: {
          id: string
          user_id: string
          consent_id: string
          full_name: string
          headline: string | null
          company_name: string | null
          company_name_normalized: string | null
          email: string | null
          connected_on: string | null
          linkedin_url: string | null
          source_row: Json
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          consent_id: string
          full_name: string
          [key: string]: unknown
        }
        Update: {
          [key: string]: unknown
        }
        Relationships: [
          {
            foreignKeyName: 'linkedin_imported_connections_user_id_fkey'
            columns: ['user_id']
            isOneToOne: false
            referencedRelation: 'users'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'linkedin_imported_connections_consent_id_fkey'
            columns: ['consent_id']
            isOneToOne: false
            referencedRelation: 'linkedin_import_consents'
            referencedColumns: ['id']
          },
        ]
      }
      linkedin_contact_matches: {
        Row: {
          id: string
          user_id: string
          consent_id: string
          imported_conn_id: string
          company_id: string | null
          contact_id: string | null
          match_reason: string
          confidence: string
          promoted_at: string | null
          dismissed_at: string | null
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          consent_id: string
          imported_conn_id: string
          match_reason: string
          confidence: string
          [key: string]: unknown
        }
        Update: {
          [key: string]: unknown
        }
        Relationships: [
          {
            foreignKeyName: 'linkedin_contact_matches_user_id_fkey'
            columns: ['user_id']
            isOneToOne: false
            referencedRelation: 'users'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'linkedin_contact_matches_consent_id_fkey'
            columns: ['consent_id']
            isOneToOne: false
            referencedRelation: 'linkedin_import_consents'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'linkedin_contact_matches_imported_conn_id_fkey'
            columns: ['imported_conn_id']
            isOneToOne: false
            referencedRelation: 'linkedin_imported_connections'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'linkedin_contact_matches_company_id_fkey'
            columns: ['company_id']
            isOneToOne: false
            referencedRelation: 'companies'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'linkedin_contact_matches_contact_id_fkey'
            columns: ['contact_id']
            isOneToOne: false
            referencedRelation: 'contacts'
            referencedColumns: ['id']
          },
        ]
      }
      linkedin_import_audit_events: {
        Row: {
          id: string
          user_id: string
          consent_id: string | null
          event_type: string
          event_data: Json
          occurred_at: string
        }
        Insert: {
          id?: string
          user_id: string
          event_type: string
          [key: string]: unknown
        }
        Update: {
          [key: string]: unknown
        }
        Relationships: [
          {
            foreignKeyName: 'linkedin_import_audit_events_user_id_fkey'
            columns: ['user_id']
            isOneToOne: false
            referencedRelation: 'users'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'linkedin_import_audit_events_consent_id_fkey'
            columns: ['consent_id']
            isOneToOne: false
            referencedRelation: 'linkedin_import_consents'
            referencedColumns: ['id']
          },
        ]
      }
      company_signals: {
        Row: {
          id: string
          company_id: string
          user_id: string
          signal_type: string
          signal_summary: string
          outreach_angle: string | null
          outreach_draft: Json | null
          confidence: number | null
          source_kind: string | null
          focus_tags: string[] | null
          profile_channel: string | null
          profile_persona: string | null
          relevance_score: number | null
          suppressed_at: string | null
          suppression_reason: string | null
          evidence_snippets: string[] | null
          filing_form: string | null
          filing_items: string[] | null
          partner_entities: string[] | null
          signal_date: string
          source_url: string | null
          notified_at: string | null
          created_at: string
        }
        Insert: {
          id?: string
          company_id: string
          user_id: string
          signal_type: string
          signal_summary: string
          signal_date: string
          [key: string]: unknown
        }
        Update: {
          [key: string]: unknown
        }
        Relationships: [
          {
            foreignKeyName: 'company_signals_company_id_fkey'
            columns: ['company_id']
            isOneToOne: false
            referencedRelation: 'companies'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'company_signals_user_id_fkey'
            columns: ['user_id']
            isOneToOne: false
            referencedRelation: 'users'
            referencedColumns: ['id']
          },
        ]
      }
      follow_ups: {
        Row: {
          id: string
          user_id: string
          contact_id: string | null
          company_id: string | null
          due_date: string
          action: string
          status: string
          next_action_owner: string | null
          next_action_due_date: string | null
          next_action_status: string
          notified_at: string | null
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          due_date: string
          action: string
          next_action_owner?: string | null
          next_action_due_date?: string | null
          next_action_status?: string
          [key: string]: unknown
        }
        Update: {
          [key: string]: unknown
        }
        Relationships: [
          {
            foreignKeyName: 'follow_ups_user_id_fkey'
            columns: ['user_id']
            isOneToOne: false
            referencedRelation: 'users'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'follow_ups_company_id_fkey'
            columns: ['company_id']
            isOneToOne: false
            referencedRelation: 'companies'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'follow_ups_contact_id_fkey'
            columns: ['contact_id']
            isOneToOne: false
            referencedRelation: 'contacts'
            referencedColumns: ['id']
          },
        ]
      }
      coach_weekly_reviews: {
        Row: {
          id: string
          coach_id: string
          client_id: string
          week_start: string
          review_answers: Json
          next_follow_up_id: string | null
          status: string
          completed_at: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          coach_id: string
          client_id: string
          week_start: string
          review_answers?: Json
          next_follow_up_id?: string | null
          status?: string
          completed_at?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          [key: string]: unknown
        }
        Relationships: [
          {
            foreignKeyName: 'coach_weekly_reviews_coach_id_fkey'
            columns: ['coach_id']
            isOneToOne: false
            referencedRelation: 'users'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'coach_weekly_reviews_client_id_fkey'
            columns: ['client_id']
            isOneToOne: false
            referencedRelation: 'users'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'coach_weekly_reviews_next_follow_up_id_fkey'
            columns: ['next_follow_up_id']
            isOneToOne: false
            referencedRelation: 'follow_ups'
            referencedColumns: ['id']
          },
        ]
      }
      scan_results: {
        Row: {
          id: string
          company_id: string
          user_id: string
          scanned_at: string
          status: string
          raw_hits: Json | null
          ai_score: number | null
          ai_summary: string | null
          notified_at: string | null
          error_message: string | null
        }
        Insert: {
          id?: string
          company_id: string
          user_id: string
          status: string
          [key: string]: unknown
        }
        Update: {
          [key: string]: unknown
        }
        Relationships: [
          {
            foreignKeyName: 'scan_results_company_id_fkey'
            columns: ['company_id']
            isOneToOne: false
            referencedRelation: 'companies'
            referencedColumns: ['id']
          },
        ]
      }
      company_interview_logs: {
        Row: {
          id: string
          user_id: string
          company_id: string
          interview_date: string | null
          interview_stage: string | null
          questions_asked: string | null
          what_landed: string | null
          what_surprised: string | null
          follow_up_needed: string | null
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          company_id: string
          [key: string]: unknown
        }
        Update: {
          [key: string]: unknown
        }
        Relationships: [
          {
            foreignKeyName: 'company_interview_logs_company_id_fkey'
            columns: ['company_id']
            isOneToOne: false
            referencedRelation: 'companies'
            referencedColumns: ['id']
          },
        ]
      }
      users: {
        Row: {
          id: string
          email: string
          stripe_customer_id: string | null
          subscription_tier: string
          subscription_status: string
          created_at: string
          trial_ends_at: string | null
          subscription_period_end: string | null
          first_company_added_at: string | null
          drip_unsubscribed_at: string | null
          weekly_digest_sent_at: string | null
          signup_source: string | null
          acquisition_channel: string | null
          plan_at_trial_end: string | null
          offer_accepted_at: string | null
          referral_source: string | null
        }
        Insert: {
          id: string
          email: string
          [key: string]: unknown
        }
        Update: {
          [key: string]: unknown
        }
        Relationships: [
          {
            foreignKeyName: 'users_id_fkey'
            columns: ['id']
            isOneToOne: true
            referencedRelation: 'users'
            referencedColumns: ['id']
          },
        ]
      }
      user_profiles: {
        Row: {
          user_id: string
          full_name: string | null
          resume_text: string | null
          resume_json: Json | null
          target_titles: string[] | null
          target_sectors: string[] | null
          target_locations: string[] | null
          target_role_tracks: string[] | null
          positioning_summary: string | null
          linkedin_headline: string | null
          linkedin_about: string | null
          search_status: string | null
          briefing_time: string | null
          briefing_timezone: string | null
          briefing_days: string[] | null
          search_started_at: string | null
          updated_at: string
          current_title: string | null
          current_company: string | null
          linkedin_url: string | null
          linkedin_raw_text: string | null
          beyond_resume: string | null
          onboarding_completed_at: string | null
          onboarding_current_step: number
          onboarding_draft: Json
          momentum_score: number | null
          momentum_computed_at: string | null
          briefing_email: string | null
          role_type: string | null
          role_family: string | null
          role_title: string | null
          role_seniority: string | null
          workflow_variant: string | null
          search_persona: string | null
          career_history_json: Json | null
          role_context: Json | null
          placed_at: string | null
          placement_company: string | null
          search_path: string | null
          weekly_goal: number | null
          stall_nudge_dismissed_at: string | null
          star_stories: Json | null
          briefing_frequency: string | null
          last_briefing_sent_at: string | null
          search_driver: string | null
          employment_status: string | null
          search_timeline: string | null
          is_concierge: boolean
          invite_code: string | null
          referred_by: string | null
        }
        Insert: {
          user_id: string
          [key: string]: unknown
        }
        Update: {
          [key: string]: unknown
        }
        Relationships: [
          {
            foreignKeyName: 'user_profiles_user_id_fkey'
            columns: ['user_id']
            isOneToOne: true
            referencedRelation: 'users'
            referencedColumns: ['id']
          },
        ]
      }
      briefs: {
        Row: {
          id: string
          user_id: string
          company_id: string | null
          contact_id: string | null
          type: string
          output_text: string
          user_rating: number | null
          rating_feedback: string | null
          section_name: string | null
          provenance_version: number | null
          claim_provenance: unknown | null
          lifecycle_state: string
          reviewed_at: string | null
          used_at: string | null
          lifecycle_updated_at: string
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          type: string
          output_text: string
          lifecycle_state?: string
          reviewed_at?: string | null
          used_at?: string | null
          lifecycle_updated_at?: string
          section_name?: string | null
          provenance_version?: number | null
          claim_provenance?: unknown | null
          [key: string]: unknown
        }
        Update: {
          [key: string]: unknown
        }
        Relationships: []
      }
      briefing_daily_notes: {
        Row: {
          id: string
          user_id: string
          note_date: string
          source: string
          title: string | null
          body: string
          metadata: Json
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          note_date: string
          source?: string
          title?: string | null
          body: string
          metadata?: Json
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          note_date?: string
          source?: string
          title?: string | null
          body?: string
          metadata?: Json
          created_at?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: 'briefing_daily_notes_user_id_fkey'
            columns: ['user_id']
            isOneToOne: false
            referencedRelation: 'users'
            referencedColumns: ['id']
          },
        ]
      }
      drip_sends: {
        Row: {
          id: string
          user_id: string
          drip_day: number
          sent_at: string
        }
        Insert: {
          id?: string
          user_id: string
          drip_day: number
          [key: string]: unknown
        }
        Update: {
          [key: string]: unknown
        }
        Relationships: []
      }
      outreach_logs: {
        Row: {
          id: string
          user_id: string
          contact_id: string | null
          company_id: string | null
          signal_id: string | null
          channel: string
          message_preview: string | null
          sent_at: string
        }
        Insert: {
          id?: string
          user_id: string
          channel: string
          [key: string]: unknown
        }
        Update: {
          [key: string]: unknown
        }
        Relationships: [
          {
            foreignKeyName: 'outreach_logs_user_id_fkey'
            columns: ['user_id']
            isOneToOne: false
            referencedRelation: 'users'
            referencedColumns: ['id']
          },
        ]
      }
      user_events: {
        Row: {
          id: string
          user_id: string
          event_name: string
          properties: Json
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          event_name: string
          [key: string]: unknown
        }
        Update: {
          [key: string]: unknown
        }
        Relationships: [
          {
            foreignKeyName: 'user_events_user_id_fkey'
            columns: ['user_id']
            isOneToOne: false
            referencedRelation: 'users'
            referencedColumns: ['id']
          },
        ]
      }
      llm_traces: {
        Row: {
          id: string
          created_at: string
          user_id: string | null
          feature: string
          model: string
          prompt_tokens: number | null
          completion_tokens: number | null
          latency_ms: number | null
          input_snapshot: Json | null
          output_snapshot: string | null
          eval_pass: boolean | null
          eval_notes: string | null
          success: boolean
        }
        Insert: {
          id?: string
          feature: string
          model: string
          [key: string]: unknown
        }
        Update: {
          [key: string]: unknown
        }
        Relationships: []
      }
      social_posts: {
        Row: {
          id: string
          post_date: string
          pillar: string
          draft_text: string
          is_posted: boolean
          posted_at: string | null
          platform: string | null
          generated_at: string
          updated_at: string
          buffer_update_id: string | null
          buffer_scheduled_at: string | null
          notes: string | null
        }
        Insert: {
          id?: string
          post_date: string
          pillar: string
          draft_text: string
          [key: string]: unknown
        }
        Update: {
          [key: string]: unknown
        }
        Relationships: []
      }
      partners: {
        Row: {
          id: string
          name: string
          email: string
          company: string | null
          referral_code: string
          commission_pct: number
          is_active: boolean
          notes: string | null
          created_at: string
          seats_purchased: number
          seats_subscription_id: string | null
          user_id: string | null
        }
        Insert: {
          id?: string
          name: string
          email: string
          referral_code: string
          [key: string]: unknown
        }
        Update: {
          [key: string]: unknown
        }
        Relationships: []
      }
      referral_attributions: {
        Row: {
          id: string
          signup_user_id: string
          partner_id: string
          attributed_at: string
        }
        Insert: {
          id?: string
          signup_user_id: string
          partner_id: string
          [key: string]: unknown
        }
        Update: {
          [key: string]: unknown
        }
        Relationships: [
          {
            foreignKeyName: 'referral_attributions_partner_id_fkey'
            columns: ['partner_id']
            isOneToOne: false
            referencedRelation: 'partners'
            referencedColumns: ['id']
          },
        ]
      }
      team_seats: {
        Row: {
          id: string
          owner_id: string
          member_email: string
          member_user_id: string | null
          token: string
          status: string
          invited_at: string
          accepted_at: string | null
          coach_access_enabled: boolean
          access_level: string
          access_granted_at: string | null
          last_accessed_at: string | null
        }
        Insert: {
          id?: string
          owner_id: string
          member_email: string
          [key: string]: unknown
        }
        Update: {
          [key: string]: unknown
        }
        Relationships: []
      }
      coach_access_logs: {
        Row: {
          id: string
          coach_id: string
          client_id: string
          table_name: string
          record_id: string
          action: string
          old_values: Json | null
          new_values: Json | null
          created_at: string
        }
        Insert: {
          id?: string
          coach_id: string
          client_id: string
          table_name: string
          record_id: string
          action: string
          [key: string]: unknown
        }
        Update: {
          [key: string]: unknown
        }
        Relationships: []
      }
      coach_alert_preferences: {
        Row: {
          id: string
          coach_id: string
          client_id: string
          alert_on_company_signal: boolean
          alert_on_new_interview: boolean
          alert_on_client_edit: boolean
          alert_frequency: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          coach_id: string
          client_id: string
          [key: string]: unknown
        }
        Update: {
          [key: string]: unknown
        }
        Relationships: []
      }
      coach_client_permissions: {
        Row: {
          id: string
          coach_id: string
          client_id: string
          access_enabled: boolean
          access_level: string
          updated_at: string
          created_at: string
        }
        Insert: {
          id?: string
          coach_id: string
          client_id: string
          [key: string]: unknown
        }
        Update: {
          [key: string]: unknown
        }
        Relationships: []
      }
      coach_profiles: {
        Row: {
          coach_id: string
          display_name: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          coach_id: string
          [key: string]: unknown
        }
        Update: {
          [key: string]: unknown
        }
        Relationships: []
      }
      conference_speakers: {
        Row: {
          id: string
          full_name: string
          first_name: string | null
          last_name: string | null
          title: string | null
          company: string | null
          linkedin_url: string | null
          pdl_id: string | null
          sector: string | null
          notes: string | null
          outreach_status: string
          outreach_date: string | null
          outreach_notes: string | null
          priority: number
          matched_user_id: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          full_name: string
          [key: string]: unknown
        }
        Update: {
          [key: string]: unknown
        }
        Relationships: []
      }
      b2b_prospects: {
        Row: {
          id: string
          created_at: string
          updated_at: string
          name: string
          type: string
          website: string | null
          stage: string
          estimated_seats: number | null
          estimated_arr: number | null
          notes: string | null
          archived_at: string | null
        }
        Insert: {
          id?: string
          name: string
          [key: string]: unknown
        }
        Update: {
          [key: string]: unknown
        }
        Relationships: []
      }
      b2b_contacts: {
        Row: {
          id: string
          created_at: string
          prospect_id: string
          name: string
          title: string | null
          email: string | null
          linkedin_url: string | null
          notes: string | null
        }
        Insert: {
          id?: string
          prospect_id: string
          name: string
          [key: string]: unknown
        }
        Update: {
          [key: string]: unknown
        }
        Relationships: [
          {
            foreignKeyName: 'b2b_contacts_prospect_id_fkey'
            columns: ['prospect_id']
            isOneToOne: false
            referencedRelation: 'b2b_prospects'
            referencedColumns: ['id']
          },
        ]
      }
      b2b_activities: {
        Row: {
          id: string
          created_at: string
          prospect_id: string
          contact_id: string | null
          activity_type: string
          summary: string
          occurred_at: string
          next_action: string | null
          next_action_due: string | null
          logged_by: string | null
        }
        Insert: {
          id?: string
          prospect_id: string
          activity_type: string
          summary: string
          occurred_at: string
          [key: string]: unknown
        }
        Update: {
          [key: string]: unknown
        }
        Relationships: [
          {
            foreignKeyName: 'b2b_activities_prospect_id_fkey'
            columns: ['prospect_id']
            isOneToOne: false
            referencedRelation: 'b2b_prospects'
            referencedColumns: ['id']
          },
        ]
      }
      b2b_materials: {
        Row: {
          id: string
          created_at: string
          prospect_id: string
          title: string
          content: string
          created_by: string | null
        }
        Insert: {
          id?: string
          prospect_id: string
          title: string
          content: string
          [key: string]: unknown
        }
        Update: {
          [key: string]: unknown
        }
        Relationships: [
          {
            foreignKeyName: 'b2b_materials_prospect_id_fkey'
            columns: ['prospect_id']
            isOneToOne: false
            referencedRelation: 'b2b_prospects'
            referencedColumns: ['id']
          },
        ]
      }
      intelligence_companies: {
        Row: {
          id: string
          slug: string
          company_name: string
          description: string | null
          sector: string | null
          website: string | null
          is_featured: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          slug: string
          company_name: string
          [key: string]: unknown
        }
        Update: {
          [key: string]: unknown
        }
        Relationships: []
      }
      intelligence_access_tokens: {
        Row: {
          id: string
          company_slug: string
          created_by: string
          label: string | null
          expires_at: string | null
          created_at: string
        }
        Insert: {
          id?: string
          company_slug: string
          created_by: string
          [key: string]: unknown
        }
        Update: {
          [key: string]: unknown
        }
        Relationships: [
          {
            foreignKeyName: 'intel_tokens_company_slug_fkey'
            columns: ['company_slug']
            isOneToOne: false
            referencedRelation: 'intelligence_companies'
            referencedColumns: ['slug']
          },
        ]
      }
      signal_action_events: {
        Row: {
          id: string
          user_id: string
          signal_id: string | null
          company_id: string | null
          action_type: string
          hours_since_signal: number | null
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          action_type: string
          [key: string]: unknown
        }
        Update: {
          [key: string]: unknown
        }
        Relationships: []
      }
      brief_quality_log: {
        Row: {
          id: string
          brief_id: string | null
          user_id: string
          company_id: string | null
          context_score: number | null
          has_resume: boolean
          has_positioning: boolean
          has_scan_result: boolean
          has_contacts: boolean
          word_count: number | null
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          [key: string]: unknown
        }
        Update: {
          [key: string]: unknown
        }
        Relationships: []
      }
      partner_inquiries: {
        Row: {
          id: string
          name: string
          company: string
          role: string
          how_heard: string | null
          interests: string | null
          created_at: string
        }
        Insert: {
          id?: string
          name: string
          company: string
          role: string
          [key: string]: unknown
        }
        Update: {
          [key: string]: unknown
        }
        Relationships: []
      }
      company_documents: {
        Row: {
          id: string
          company_id: string
          user_id: string
          label: string
          content: string
          created_at: string
        }
        Insert: {
          id?: string
          company_id: string
          user_id: string
          label: string
          content: string
          [key: string]: unknown
        }
        Update: {
          [key: string]: unknown
        }
        Relationships: [
          {
            foreignKeyName: 'company_documents_company_id_fkey'
            columns: ['company_id']
            isOneToOne: false
            referencedRelation: 'companies'
            referencedColumns: ['id']
          },
        ]
      }
      narrative_versions: {
        Row: {
          id: string
          user_id: string
          positioning: string
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          positioning: string
          [key: string]: unknown
        }
        Update: {
          [key: string]: unknown
        }
        Relationships: []
      }
      conference_appearances: {
        Row: {
          id: string
          speaker_id: string
          conference_name: string
          conference_year: number
          topic: string | null
          session_type: string | null
          created_at: string
        }
        Insert: {
          id?: string
          speaker_id: string
          conference_name: string
          conference_year: number
          [key: string]: unknown
        }
        Update: {
          [key: string]: unknown
        }
        Relationships: [
          {
            foreignKeyName: 'conference_appearances_speaker_id_fkey'
            columns: ['speaker_id']
            isOneToOne: false
            referencedRelation: 'conference_speakers'
            referencedColumns: ['id']
          },
        ]
      }
      conversations: {
        Row: {
          id: string
          user_id: string
          messages: Json
          token_count: number | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          messages?: Json
          [key: string]: unknown
        }
        Update: {
          [key: string]: unknown
        }
        Relationships: []
      }
      staff_members: {
        Row: {
          id: string
          email: string
          role: string
          permissions: Json
          created_at: string
          created_by: string | null
        }
        Insert: {
          id?: string
          email: string
          role?: string
          [key: string]: unknown
        }
        Update: {
          [key: string]: unknown
        }
        Relationships: []
      }
      demo_leads: {
        Row: {
          id: string
          email: string
          company: string | null
          role: string | null
          created_at: string
        }
        Insert: {
          id?: string
          email: string
          [key: string]: unknown
        }
        Update: {
          [key: string]: unknown
        }
        Relationships: []
      }
      testimonials: {
        Row: {
          id: string
          invite_code: string | null
          body: string
          created_at: string
        }
        Insert: {
          id?: string
          body: string
          [key: string]: unknown
        }
        Update: {
          [key: string]: unknown
        }
        Relationships: []
      }
      rate_limits: {
        Row: {
          key: string
          period: string
          count: number
          updated_at: string
        }
        Insert: {
          key: string
          period: string
          count?: number
          [key: string]: unknown
        }
        Update: {
          [key: string]: unknown
        }
        Relationships: []
      }
      company_watch_events: {
        Row: {
          id: string
          user_id: string
          company_id: string
          sector: string | null
          career_page_url_present: boolean
          fit_score: number | null
          stage: string | null
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          company_id: string
          [key: string]: unknown
        }
        Update: {
          [key: string]: unknown
        }
        Relationships: []
      }
      drafts: {
        Row: {
          id: string
          user_id: string
          contact_id: string | null
          company_id: string | null
          draft_type: string
          subject: string | null
          body: string
          sent_at: string | null
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          draft_type: string
          body: string
          [key: string]: unknown
        }
        Update: {
          [key: string]: unknown
        }
        Relationships: []
      }
      live_brief_requests: {
        Row: {
          id: string
          requested_by_user_id: string
          hubspot_contact_id: string | null
          hubspot_deal_id: string | null
          prospect_name: string
          prospect_email: string
          linkedin_url: string | null
          source_text_encrypted_ref: string
          consent_attested_at: string
          consent_source: string
          request_received_at: string
          request_source: string
          location_preference: string | null
          target_role_lane: string | null
          operator_notes: string | null
          reviewed_profile: Json
          status: string
          hubspot_sync_status: string
          hubspot_synced_at: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          requested_by_user_id: string
          prospect_name: string
          prospect_email: string
          source_text_encrypted_ref: string
          consent_attested_at: string
          consent_source: string
          request_source: string
          [key: string]: unknown
        }
        Update: { [key: string]: unknown }
        Relationships: []
      }
      live_brief_scan_runs: {
        Row: {
          id: string
          request_id: string
          idempotency_key: string
          created_by_user_id: string
          status: string
          selected_company_count: number
          completed_company_count: number
          blocked_company_count: number
          failed_company_count: number
          accepted_partial_at: string | null
          accepted_partial_by_user_id: string | null
          started_at: string | null
          completed_at: string | null
          created_at: string
        }
        Insert: {
          id?: string
          request_id: string
          idempotency_key: string
          created_by_user_id: string
          selected_company_count: number
          [key: string]: unknown
        }
        Update: { [key: string]: unknown }
        Relationships: []
      }
      live_brief_scan_companies: {
        Row: {
          id: string
          run_id: string
          company_key: string
          company_name: string
          career_page_url: string | null
          target_role_lane: string | null
          operator_selected: boolean
          status: string
          evidence_summary: Json
          error_class: string | null
          observed_at: string | null
          created_at: string
        }
        Insert: {
          id?: string
          run_id: string
          company_key: string
          company_name: string
          [key: string]: unknown
        }
        Update: { [key: string]: unknown }
        Relationships: []
      }
      live_brief_deliveries: {
        Row: {
          id: string
          request_id: string
          artifact_id: string | null
          token_digest: string
          released_by_user_id: string
          sent_at: string | null
          expires_at: string
          revoked_at: string | null
          revoked_by_user_id: string | null
          first_opened_at: string | null
          last_opened_at: string | null
          view_count: number
          cta_clicked_at: string | null
          hubspot_meeting_id: string | null
          call_booked_at: string | null
          created_at: string
        }
        Insert: {
          id?: string
          request_id: string
          token_digest: string
          released_by_user_id: string
          expires_at: string
          [key: string]: unknown
        }
        Update: { [key: string]: unknown }
        Relationships: []
      }
      live_brief_events: {
        Row: {
          id: string
          request_id: string
          delivery_id: string | null
          event_type: string
          actor_user_id: string | null
          idempotency_key: string
          event_payload: Json
          occurred_at: string
        }
        Insert: {
          id?: string
          request_id: string
          event_type: string
          idempotency_key: string
          [key: string]: unknown
        }
        Update: { [key: string]: unknown }
        Relationships: []
      }
      live_brief_artifacts: {
        Row: {
          id: string
          request_id: string
          version: number
          brief_payload: Json
          content_hash: string
          finalized_by_user_id: string
          finalized_at: string
          created_at: string
        }
        Insert: {
          id?: string
          request_id: string
          version: number
          brief_payload: Json
          content_hash: string
          finalized_by_user_id: string
          [key: string]: unknown
        }
        Update: { [key: string]: unknown }
        Relationships: []
      }
      live_brief_handoff_metrics: {
        Row: {
          delivery_id: string
          destination: string
          click_count: number
          first_clicked_at: string
          last_clicked_at: string
        }
        Insert: {
          delivery_id: string
          destination: string
          [key: string]: unknown
        }
        Update: { [key: string]: unknown }
        Relationships: []
      }
    }
    Views: Record<string, never>
    Functions: {
      check_and_increment_rate_limit: {
        Args: { p_key: string; p_window: string; p_limit: number }
        Returns: boolean
      }
      get_rate_limit_count: {
        Args: { p_key: string; p_window: string }
        Returns: number
      }
      record_live_brief_handoff_click: {
        Args: { p_delivery_id: string; p_destination: string }
        Returns: undefined
      }
    }
    Enums: Record<string, never>
    CompositeTypes: Record<string, never>
  }
}
