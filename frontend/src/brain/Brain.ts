import { HttpClient, ContentType, RequestParams } from "./http-client";

export class Brain<SecurityDataType = unknown> extends HttpClient<SecurityDataType> {
  /**
   * @name handle_healthz
   * @request GET:/_healthz
   */
  handle_healthz = (params: RequestParams = {}) =>
    this.request<any, any>({
      path: `/_healthz`,
      method: "GET",
      format: "json",
      ...params,
    });

  /**
   * @name health_check
   * @request GET:/routes/health
   */
  health_check = (params: RequestParams = {}) =>
    this.request<any, any>({
      path: `/routes/health`,
      method: "GET",
      format: "json",
      ...params,
    });

  /**
   * @name delete_account
   * @request DELETE:/routes/delete_account
   */
  delete_account = (params: RequestParams = {}) =>
    this.request<any, any>({
      path: `/routes/delete_account`,
      method: "DELETE",
      format: "json",
      ...params,
    });

  /**
   * @name generate_agenda_flow_token
   * @request POST:/routes/auth/generate-agenda-flow-token
   */
  generate_agenda_flow_token = (params: RequestParams = {}) =>
    this.request<any, any>({
      path: `/routes/auth/generate-agenda-flow-token`,
      method: "POST",
      format: "json",
      ...params,
    });

  /**
   * @name verify_token
   * @request POST:/routes/verify-token
   */
  verify_token = (data: any, params: RequestParams = {}) =>
    this.request<any, any>({
      path: `/routes/verify-token`,
      method: "POST",
      body: data,
      type: ContentType.Json,
      format: "json",
      ...params,
    });

  /**
   * @name log_auth_error
   * @request POST:/routes/auth-error
   */
  log_auth_error = (data: any, params: RequestParams = {}) =>
    this.request<any, any>({
      path: `/routes/auth-error`,
      method: "POST",
      body: data,
      type: ContentType.Json,
      format: "json",
      ...params,
    });

  /**
   * @name log_auth_success
   * @request POST:/routes/auth-success
   */
  log_auth_success = (data: any, params: RequestParams = {}) =>
    this.request<any, any>({
      path: `/routes/auth-success`,
      method: "POST",
      body: data,
      type: ContentType.Json,
      format: "json",
      ...params,
    });

  /**
   * @name get_auth_stats
   * @request GET:/routes/auth-stats
   */
  get_auth_stats = (params: RequestParams = {}) =>
    this.request<any, any>({
      path: `/routes/auth-stats`,
      method: "GET",
      format: "json",
      ...params,
    });

  /**
   * @name submit_url_to_bing
   * @request POST:/routes/bing-indexnow/submit-url
   */
  submit_url_to_bing = (data: any, params: RequestParams = {}) =>
    this.request<any, any>({
      path: `/routes/bing-indexnow/submit-url`,
      method: "POST",
      body: data,
      type: ContentType.Json,
      format: "json",
      ...params,
    });

  /**
   * @name cleanup_firestore_sessions
   * @request POST:/routes/cleanup_firestore_sessions
   */
  cleanup_firestore_sessions = (query?: { dry_run?: boolean }, params: RequestParams = {}) =>
    this.request<any, any>({
      path: `/routes/cleanup_firestore_sessions`,
      method: "POST",
      query: query,
      format: "json",
      ...params,
    });

  /**
   * @name get_firestore_stats
   * @request GET:/routes/firestore_stats
   */
  get_firestore_stats = (params: RequestParams = {}) =>
    this.request<any, any>({
      path: `/routes/firestore_stats`,
      method: "GET",
      format: "json",
      ...params,
    });

  /**
   * @name log_error
   * @request POST:/routes/error-logging/log
   */
  log_error = (data: any, params: RequestParams = {}) =>
    this.request<any, any>({
      path: `/routes/error-logging/log`,
      method: "POST",
      body: data,
      type: ContentType.Json,
      format: "json",
      ...params,
    });

  /**
   * @name get_recent_errors
   * @request GET:/routes/error-logging/recent
   */
  get_recent_errors = (query?: { limit?: number; level?: string }, params: RequestParams = {}) =>
    this.request<any, any>({
      path: `/routes/error-logging/recent`,
      method: "GET",
      query: query,
      format: "json",
      ...params,
    });

  /**
   * @name clear_error_logs
   * @request POST:/routes/error-logging/clear
   */
  clear_error_logs = (params: RequestParams = {}) =>
    this.request<any, any>({
      path: `/routes/error-logging/clear`,
      method: "POST",
      format: "json",
      ...params,
    });

  /**
   * @name get_error_stats
   * @request GET:/routes/error-logging/stats
   */
  get_error_stats = (params: RequestParams = {}) =>
    this.request<any, any>({
      path: `/routes/error-logging/stats`,
      method: "GET",
      format: "json",
      ...params,
    });

  /**
   * @name export_session
   * @request POST:/routes/export/export/{session_id}
   */
  export_session = (pathParams: { session_id?: string; sessionId?: string }, data?: any, params: RequestParams = {}) =>
    this.request<any, any>({
      path: `/routes/export/export/${pathParams.session_id || pathParams.sessionId}`,
      method: "POST",
      body: data,
      type: ContentType.Json,
      format: "json",
      ...params,
    });

  /**
   * @name check_translation_access
   * @request GET:/routes/check-translation
   */
  check_translation_access = (params: RequestParams = {}) =>
    this.request<any, any>({
      path: `/routes/check-translation`,
      method: "GET",
      format: "json",
      ...params,
    });

  /**
   * @name check_session_creation_access
   * @request GET:/routes/check-session-creation
   */
  check_session_creation_access = (params: RequestParams = {}) =>
    this.request<any, any>({
      path: `/routes/check-session-creation`,
      method: "GET",
      format: "json",
      ...params,
    });

  /**
   * @name check_team_sharing_access
   * @request GET:/routes/check-team-sharing
   */
  check_team_sharing_access = (params: RequestParams = {}) =>
    this.request<any, any>({
      path: `/routes/check-team-sharing`,
      method: "GET",
      format: "json",
      ...params,
    });

  /**
   * @name get_my_tier_info
   * @request GET:/routes/my-tier-info
   */
  get_my_tier_info = (params: RequestParams = {}) =>
    this.request<any, any>({
      path: `/routes/my-tier-info`,
      method: "GET",
      format: "json",
      ...params,
    });

  /**
   * @name save_segment_to_firestore
   * @request POST:/routes/save-segment
   */
  save_segment_to_firestore = (data: any, params: RequestParams = {}) =>
    this.request<any, any>({
      path: `/routes/save-segment`,
      method: "POST",
      body: data,
      type: ContentType.Json,
      format: "json",
      ...params,
    });

  /**
   * @name get_gemini_websocket_url
   * @request GET:/routes/gemini-ws-url
   */
  get_gemini_websocket_url = (params: RequestParams = {}) =>
    this.request<any, any>({
      path: `/routes/gemini-ws-url`,
      method: "GET",
      format: "json",
      ...params,
    });

  /**
   * @name get_gemini_live_prompt_api
   * @request GET:/routes/gemini-live-prompt
   */
  get_gemini_live_prompt_api = (params: RequestParams = {}) =>
    this.request<any, any>({
      path: `/routes/gemini-live-prompt`,
      method: "GET",
      format: "json",
      ...params,
    });

  /**
   * @name process_audio_chunk
   * @request POST:/routes/process-audio-chunk
   */
  process_audio_chunk = (data: any, params: RequestParams = {}) =>
    this.request<any, any>({
      path: `/routes/process-audio-chunk`,
      method: "POST",
      body: data,
      type: ContentType.Json,
      format: "json",
      ...params,
    });

  /**
   * @name send_invitation
   * @request POST:/routes/invitations/send
   */
  send_invitation = (data: any, params: RequestParams = {}) =>
    this.request<any, any>({
      path: `/routes/invitations/send`,
      method: "POST",
      body: data,
      type: ContentType.Json,
      format: "json",
      ...params,
    });

  /**
   * @name check_invitation
   * @request GET:/routes/invitations/check/{invitation_id}
   */
  check_invitation = (data: { invitation_id: string }, params: RequestParams = {}) =>
    this.request<any, any>({
      path: `/routes/invitations/check/${data.invitation_id}`,
      method: "GET",
      format: "json",
      ...params,
    });

  /**
   * @name accept_invitation
   * @request POST:/routes/invitations/accept/{invitation_id}
   */
  accept_invitation = (data: { invitation_id: string }, params: RequestParams = {}) =>
    this.request<any, any>({
      path: `/routes/invitations/accept/${data.invitation_id}`,
      method: "POST",
      format: "json",
      ...params,
    });

  /**
   * @name detect_language
   * @request POST:/routes/detect-language
   */
  detect_language = (data: any, params: RequestParams = {}) =>
    this.request<any, any>({
      path: `/routes/detect-language`,
      method: "POST",
      body: data,
      type: ContentType.FormData,
      format: "json",
      ...params,
    });

  /**
   * @name migrate_sessions
   * @request POST:/routes/migrations/migrate_sessions
   */
  migrate_sessions = (data: any, params: RequestParams = {}) =>
    this.request<any, any>({
      path: `/routes/migrations/migrate_sessions`,
      method: "POST",
      body: data,
      type: ContentType.Json,
      format: "json",
      ...params,
    });

  /**
   * @name check_migration_status
   * @request GET:/routes/migrations/migration_status
   */
  check_migration_status = (params: RequestParams = {}) =>
    this.request<any, any>({
      path: `/routes/migrations/migration_status`,
      method: "GET",
      format: "json",
      ...params,
    });

  /**
   * @name list_available_modules
   * @request GET:/routes/modules
   */
  list_available_modules = (params: RequestParams = {}) =>
    this.request<any, any>({
      path: `/routes/modules`,
      method: "GET",
      format: "json",
      ...params,
    });

  /**
   * @name get_user_modules
   * @request GET:/routes/modules/user/{user_id}
   */
  get_user_modules = (data: { user_id?: string; userId?: string }, params: RequestParams = {}) =>
    this.request<any, any>({
      path: `/routes/modules/user/${data.user_id || data.userId}`,
      method: "GET",
      format: "json",
      ...params,
    });

  /**
   * @name enable_user_module
   * @request POST:/routes/modules/user/{user_id}/enable/{module_id}
   */
  enable_user_module = (data: { user_id?: string; userId?: string; module_id?: string; moduleId?: string }, params: RequestParams = {}) =>
    this.request<any, any>({
      path: `/routes/modules/user/${data.user_id || data.userId}/enable/${data.module_id || data.moduleId}`,
      method: "POST",
      format: "json",
      ...params,
    });

  /**
   * @name disable_user_module
   * @request POST:/routes/modules/user/{user_id}/disable/{module_id}
   */
  disable_user_module = (data: { user_id?: string; userId?: string; module_id?: string; moduleId?: string }, params: RequestParams = {}) =>
    this.request<any, any>({
      path: `/routes/modules/user/${data.user_id || data.userId}/disable/${data.module_id || data.moduleId}`,
      method: "POST",
      format: "json",
      ...params,
    });

  /**
   * @name cancel_subscription
   * @request POST:/routes/cancel-subscription
   */
  cancel_subscription = (params: RequestParams = {}) =>
    this.request<any, any>({
      path: `/routes/cancel-subscription`,
      method: "POST",
      format: "json",
      ...params,
    });

  /**
   * @name create_checkout
   * @request POST:/routes/create-checkout
   */
  create_checkout = (data: any, params: RequestParams = {}) =>
    this.request<any, any>({
      path: `/routes/create-checkout`,
      method: "POST",
      body: data,
      type: ContentType.Json,
      format: "json",
      ...params,
    });

  /**
   * @name update_speaker_names
   * @request PUT:/routes/reprocess/update-speakers/{session_id}
   */
  update_speaker_names = (pathParams: { session_id?: string; sessionId?: string }, data?: any, params: RequestParams = {}) =>
    this.request<any, any>({
      path: `/routes/reprocess/update-speakers/${pathParams.session_id || pathParams.sessionId}`,
      method: "PUT",
      body: data,
      type: ContentType.Json,
      format: "json",
      ...params,
    });

  /**
   * @name save_session
   * @request POST:/routes/save_session
   */
  save_session = (data: any, params: RequestParams = {}) =>
    this.request<any, any>({
      path: `/routes/save_session`,
      method: "POST",
      body: data,
      type: ContentType.Json,
      format: "json",
      ...params,
    });

  /**
   * @name list_sessions
   * @request GET:/routes/list_sessions
   */
  list_sessions = (query?: { limit?: number; offset?: number; sort_by?: string; sort_order?: string }, params: RequestParams = {}) =>
    this.request<any, any>({
      path: `/routes/list_sessions`,
      method: "GET",
      query: query,
      format: "json",
      ...params,
    });

  /**
   * @name get_session
   * @request GET:/routes/get_session/{session_id}
   */
  get_session = (data: { session_id: string }, params: RequestParams = {}) =>
    this.request<any, any>({
      path: `/routes/get_session/${data.session_id}`,
      method: "GET",
      format: "json",
      ...params,
    });

  /**
   * @name add_document
   * @request POST:/routes/add_document
   */
  add_document = (data: any, params: RequestParams = {}) =>
    this.request<any, any>({
      path: `/routes/add_document`,
      method: "POST",
      body: data,
      type: ContentType.Json,
      format: "json",
      ...params,
    });

  /**
   * @name get_session_audio
   * @request GET:/routes/get_session_audio/{session_id}
   */
  get_session_audio = (data: { session_id?: string; sessionId?: string }, params: RequestParams = {}) =>
    this.request<any, any>({
      path: `/routes/get_session_audio/${data.session_id || data.sessionId}`,
      method: "GET",
      format: "json",
      ...params,
    });

  /**
   * @name delete_session
   * @request DELETE:/routes/sessions/{session_id}
   */
  delete_session = (pathParams: { session_id?: string; sessionId?: string }, data?: any, params: RequestParams = {}) =>
    this.request<any, any>({
      path: `/routes/sessions/${pathParams.session_id || pathParams.sessionId}`,
      method: "DELETE",
      body: data,
      type: ContentType.Json,
      format: "json",
      ...params,
    });

  /**
   * @name get_session_audio_v2
   * @request GET:/routes/sessions/{session_id}/audio_info_v2
   */
  get_session_audio_v2 = (data: { session_id?: string; sessionId?: string }, params: RequestParams = {}) =>
    this.request<any, any>({
      path: `/routes/sessions/${data.session_id || data.sessionId}/audio_info_v2`,
      method: "GET",
      format: "json",
      ...params,
    });

  /**
   * @name get_storage_stats
   * @request GET:/routes/storage-stats
   */
  get_storage_stats = (params: RequestParams = {}) =>
    this.request<any, any>({
      path: `/routes/storage-stats`,
      method: "GET",
      format: "json",
      ...params,
    });

  /**
   * @name cleanup_audio_files
   * @request POST:/routes/cleanup-audio
   */
  cleanup_audio_files = (query?: { dry_run?: boolean; max_files?: number }, params: RequestParams = {}) =>
    this.request<any, any>({
      path: `/routes/cleanup-audio`,
      method: "POST",
      query: query,
      format: "json",
      ...params,
    });

  /**
   * @name cleanup_test_data
   * @request POST:/routes/cleanup-test-data
   */
  cleanup_test_data = (query?: { dry_run?: boolean; max_files?: number }, params: RequestParams = {}) =>
    this.request<any, any>({
      path: `/routes/cleanup-test-data`,
      method: "POST",
      query: query,
      format: "json",
      ...params,
    });

  /**
   * @name submit_contact_form
   * @request POST:/routes/submit-contact-form
   */
  submit_contact_form = (data: any, query?: { user?: string }, params: RequestParams = {}) =>
    this.request<any, any>({
      path: `/routes/submit-contact-form`,
      method: "POST",
      query: query,
      body: data,
      type: ContentType.Json,
      format: "json",
      ...params,
    });

  /**
   * @name get_contact_submissions
   * @request GET:/routes/contact-submissions
   */
  get_contact_submissions = (params: RequestParams = {}) =>
    this.request<any, any>({
      path: `/routes/contact-submissions`,
      method: "GET",
      format: "json",
      ...params,
    });

  /**
   * @name mark_submission_replied
   * @request POST:/routes/mark-submission-replied/{submission_id}
   */
  mark_submission_replied = (data: { submission_id?: string; submissionId?: string }, params: RequestParams = {}) =>
    this.request<any, any>({
      path: `/routes/mark-submission-replied/${data.submission_id || data.submissionId}`,
      method: "POST",
      format: "json",
      ...params,
    });

  /**
   * @name support_chat
   * @request POST:/routes/chat
   */
  support_chat = (data: any, params: RequestParams = {}) =>
    this.request<any, any>({
      path: `/routes/chat`,
      method: "POST",
      body: data,
      type: ContentType.Json,
      format: "json",
      ...params,
    });

  /**
   * @name escalate_to_support
   * @request POST:/routes/escalate
   */
  escalate_to_support = (data: any, params: RequestParams = {}) =>
    this.request<any, any>({
      path: `/routes/escalate`,
      method: "POST",
      body: data,
      type: ContentType.Json,
      format: "json",
      ...params,
    });

  /**
   * @name get_quick_help
   * @request GET:/routes/quick-help
   */
  get_quick_help = (params: RequestParams = {}) =>
    this.request<any, any>({
      path: `/routes/quick-help`,
      method: "GET",
      format: "json",
      ...params,
    });

  /**
   * @name send_support_reply
   * @request POST:/routes/send-support-reply
   */
  send_support_reply = (data: any, params: RequestParams = {}) =>
    this.request<any, any>({
      path: `/routes/send-support-reply`,
      method: "POST",
      body: data,
      type: ContentType.Json,
      format: "json",
      ...params,
    });

  /**
   * @name translate_text
   * @request POST:/routes/translate_text
   */
  translate_text = (data: any, params: RequestParams = {}) =>
    this.request<any, any>({
      path: `/routes/translate_text`,
      method: "POST",
      body: data,
      type: ContentType.Json,
      format: "json",
      ...params,
    });

  /**
   * @name translate_session
   * @request POST:/routes/translate_session
   */
  translate_session = (data: any, params: RequestParams = {}) =>
    this.request<any, any>({
      path: `/routes/translate_session`,
      method: "POST",
      body: data,
      type: ContentType.Json,
      format: "json",
      ...params,
    });

  /**
   * @name get_supported_languages
   * @request GET:/routes/supported-languages
   */
  get_supported_languages = (params: RequestParams = {}) =>
    this.request<any, any>({
      path: `/routes/supported-languages`,
      method: "GET",
      format: "json",
      ...params,
    });

  /**
   * @name get_cached_translation
   * @request POST:/routes/get-translation
   */
  get_cached_translation = (data: any, query?: { user?: string }, params: RequestParams = {}) =>
    this.request<any, any>({
      path: `/routes/get-translation`,
      method: "POST",
      query: query,
      body: data,
      type: ContentType.Json,
      format: "json",
      ...params,
    });

  /**
   * @name save_translation
   * @request POST:/routes/save-translation
   */
  save_translation = (data: any, query?: { user?: string }, params: RequestParams = {}) =>
    this.request<any, any>({
      path: `/routes/save-translation`,
      method: "POST",
      query: query,
      body: data,
      type: ContentType.Json,
      format: "json",
      ...params,
    });

  /**
   * @name update_metrics
   * @request POST:/routes/update-metrics
   */
  update_metrics = (data: any, params: RequestParams = {}) =>
    this.request<any, any>({
      path: `/routes/update-metrics`,
      method: "POST",
      body: data,
      type: ContentType.Json,
      format: "json",
      ...params,
    });

  /**
   * @name cleanup_cache
   * @request POST:/routes/cleanup
   */
  cleanup_cache = (params: RequestParams = {}) =>
    this.request<any, any>({
      path: `/routes/cleanup`,
      method: "POST",
      format: "json",
      ...params,
    });

  /**
   * @name unsubscribe_from_emails
   * @request POST:/routes/unsubscribe
   */
  unsubscribe_from_emails = (data: any, params: RequestParams = {}) =>
    this.request<any, any>({
      path: `/routes/unsubscribe`,
      method: "POST",
      body: data,
      type: ContentType.Json,
      format: "json",
      ...params,
    });

  /**
   * @name track_usage
   * @request POST:/routes/track-usage
   */
  track_usage = (data: any, params: RequestParams = {}) =>
    this.request<any, any>({
      path: `/routes/track-usage`,
      method: "POST",
      body: data,
      type: ContentType.Json,
      format: "json",
      ...params,
    });

  /**
   * @name check_quota
   * @request GET:/routes/check-quota
   */
  check_quota = (params: RequestParams = {}) =>
    this.request<any, any>({
      path: `/routes/check-quota`,
      method: "GET",
      format: "json",
      ...params,
    });

  /**
   * @name get_usage_stats
   * @request GET:/routes/usage-stats
   */
  get_usage_stats = (params: RequestParams = {}) =>
    this.request<any, any>({
      path: `/routes/usage-stats`,
      method: "GET",
      format: "json",
      ...params,
    });

  /**
   * @name reset_usage_endpoint
   * @request POST:/routes/reset-usage
   */
  reset_usage_endpoint = (data: any, params: RequestParams = {}) =>
    this.request<any, any>({
      path: `/routes/reset-usage`,
      method: "POST",
      body: data,
      type: ContentType.Json,
      format: "json",
      ...params,
    });

  /**
   * @name get_all_users_usage
   * @request GET:/routes/all-users-usage
   */
  get_all_users_usage = (params: RequestParams = {}) =>
    this.request<any, any>({
      path: `/routes/all-users-usage`,
      method: "GET",
      format: "json",
      ...params,
    });

  /**
   * @name get_all_firebase_users
   * @request GET:/routes/user-analytics/firebase-users
   */
  get_all_firebase_users = (params: RequestParams = {}) =>
    this.request<any, any>({
      path: `/routes/user-analytics/firebase-users`,
      method: "GET",
      format: "json",
      ...params,
    });

  /**
   * @name get_user_conversion_analytics
   * @request GET:/routes/user-analytics/conversion-analytics
   */
  get_user_conversion_analytics = (query?: { days_back?: number }, params: RequestParams = {}) =>
    this.request<any, any>({
      path: `/routes/user-analytics/conversion-analytics`,
      method: "GET",
      query: query,
      format: "json",
      ...params,
    });

  /**
   * @name get_language_preference
   * @request GET:/routes/language
   */
  get_language_preference = (params: RequestParams = {}) =>
    this.request<any, any>({
      path: `/routes/language`,
      method: "GET",
      format: "json",
      ...params,
    });

  /**
   * @name update_language_preference
   * @request POST:/routes/language
   */
  update_language_preference = (data: any, params: RequestParams = {}) =>
    this.request<any, any>({
      path: `/routes/language`,
      method: "POST",
      body: data,
      type: ContentType.Json,
      format: "json",
      ...params,
    });

  /**
   * @name get_user_preferences
   * @request GET:/routes/preferences
   */
  get_user_preferences = (params: RequestParams = {}) =>
    this.request<any, any>({
      path: `/routes/preferences`,
      method: "GET",
      format: "json",
      ...params,
    });

  /**
   * @name update_user_preferences
   * @request POST:/routes/preferences
   */
  update_user_preferences = (data: any, params: RequestParams = {}) =>
    this.request<any, any>({
      path: `/routes/preferences`,
      method: "POST",
      body: data,
      type: ContentType.Json,
      format: "json",
      ...params,
    });

  /**
   * @name create_default_preferences
   * @request POST:/routes/create-defaults
   */
  create_default_preferences = (params: RequestParams = {}) =>
    this.request<any, any>({
      path: `/routes/create-defaults`,
      method: "POST",
      format: "json",
      ...params,
    });

  /**
   * @name update_user_type
   * @request POST:/routes/update-user-type
   */
  update_user_type = (data: any, params: RequestParams = {}) =>
    this.request<any, any>({
      path: `/routes/update-user-type`,
      method: "POST",
      body: data,
      type: ContentType.Json,
      format: "json",
      ...params,
    });

  /**
   * @name get_user_profile
   * @request GET:/routes/profile
   */
  get_user_profile = (params: RequestParams = {}) =>
    this.request<any, any>({
      path: `/routes/profile`,
      method: "GET",
      format: "json",
      ...params,
    });

  /**
   * @name request_deletion_code
   * @request POST:/routes/request_deletion_code/{sessionId}
   */
  request_deletion_code = (data: { sessionId: string }, params: RequestParams = {}) =>
    this.request<any, any>({
      path: `/routes/request_deletion_code/${data.sessionId}`,
      method: "POST",
      format: "json",
      ...params,
    });

  /**
   * @name verify_deletion_code
   * @request POST:/routes/verify_deletion_code/{sessionId}
   */
  verify_deletion_code = (pathParams: { sessionId: string }, data?: any, params: RequestParams = {}) =>
    this.request<any, any>({
      path: `/routes/verify_deletion_code/${pathParams.sessionId}`,
      method: "POST",
      body: data,
      type: ContentType.Json,
      format: "json",
      ...params,
    });

  /**
   * @name list_meetings
   * @request GET:/routes/zoom/meetings
   */
  list_meetings = (params: RequestParams = {}) =>
    this.request<any, any>({
      path: `/routes/zoom/meetings`,
      method: "GET",
      format: "json",
      ...params,
    });

  /**
   * @name transcribe_chunk
   * @summary Transcribe an audio chunk via HTTP
   * @request POST:/routes/transcribe-chunk
   */
  transcribe_chunk = (data: any, params: RequestParams = {}) =>
    this.request<any, any>({
      path: `/routes/transcribe-chunk`,
      method: "POST",
      body: data,
      type: ContentType.Json,
      format: "json",
      ...params,
    });

  /**
   * @name micvad_only_transcribe_chunk
   * @summary Transcribe an audio chunk using MicVAD-only mode
   * @request POST:/routes/micvad-only-transcribe-chunk
   */
  micvad_only_transcribe_chunk = (data: any, params: RequestParams = {}) =>
    this.request<any, any>({
      path: `/routes/micvad-only-transcribe-chunk`,
      method: "POST",
      body: data,
      type: ContentType.Json,
      format: "json",
      ...params,
    });

  /**
   * @name upload_and_create_session
   * @summary Upload audio file and create a session
   * @request POST:/routes/upload_and_create_session
   */
  upload_and_create_session = (data: any, files?: any, params: RequestParams = {}) =>
    this.request<any, any>({
      path: `/routes/upload_and_create_session`,
      method: "POST",
      body: { ...data, ...files },
      type: ContentType.FormData,
      format: "json",
      ...params,
    });

  /**
   * @name initiate_on_demand_transcription
   * @summary Initiate on-demand transcription for a session
   * @request POST:/routes/transcribe_session/{session_id}
   */
  initiate_on_demand_transcription = (session_id: string, audio_duration_seconds?: number | null, params: RequestParams = {}) =>
    this.request<any, any>({
      path: `/routes/transcribe_session/${session_id}`,
      method: "POST",
      body: audio_duration_seconds != null ? { audio_duration_seconds } : undefined,
      type: ContentType.Json,
      format: "json",
      ...params,
    });

  /**
   * @name transcribe_audio
   * @summary Transcribe audio and differentiate between speakers using Gemini
   * @request POST:/routes/transcribe_audio
   */
  transcribe_audio = (data: any, params: RequestParams = {}) =>
    this.request<any, any>({
      path: `/routes/transcribe_audio`,
      method: "POST",
      body: data,
      type: ContentType.Json,
      format: "json",
      ...params,
    });

  /**
   * @name get_audio_file
   * @summary Get an audio file by key for playback
   * @request GET:/routes/get_audio_file/{audio_key}
   */
  get_audio_file = (data: { audioKey?: string; audio_key?: string }, params: RequestParams = {}) =>
    this.request<any, any>({
      path: `/routes/get_audio_file/${data.audioKey || data.audio_key}`,
      method: "GET",
      ...params,
    });

  /**
   * @name update_session
   * @summary Update an existing session (notes, metadata)
   * @request PUT:/routes/sessions/{session_id}
   */
  update_session = (pathParams: { session_id?: string; sessionId?: string }, data?: any, params: RequestParams = {}) =>
    this.request<any, any>({
      path: `/routes/sessions/${pathParams.session_id || pathParams.sessionId}`,
      method: "PUT",
      body: data,
      type: ContentType.Json,
      format: "json",
      ...params,
    });

  /**
   * @name process_document
   * @summary Process a document to extract metadata
   * @request POST:/routes/process_document
   */
  process_document = (data: any, params: RequestParams = {}) =>
    this.request<any, any>({
      path: `/routes/process_document`,
      method: "POST",
      body: data,
      type: ContentType.Json,
      format: "json",
      ...params,
    });

  /**
   * Alias for save_segment_to_firestore (backwards compatibility)
   */
  save_segment_to_firestore_api = (pathParams: any, data?: any, params: RequestParams = {}) =>
    this.request<any, any>({
      path: `/routes/save-segment`,
      method: "POST",
      body: { ...pathParams, ...data },
      type: ContentType.Json,
      format: "json",
      ...params,
    });

  /**
   * @name get_robots
   * @summary Get robots.txt content
   * @request GET:/routes/seo/robots.txt
   */
  get_robots = (params: RequestParams = {}) =>
    this.request<any, any>({
      path: `/routes/seo/robots.txt`,
      method: "GET",
      ...params,
    });

  /**
   * @name set_beta_end_date
   * @summary Set the beta end date
   * @request POST:/routes/set-beta-end-date
   */
  set_beta_end_date = (data: any, params: RequestParams = {}) =>
    this.request<any, any>({
      path: `/routes/set-beta-end-date`,
      method: "POST",
      body: data,
      type: ContentType.Json,
      format: "json",
      ...params,
    });

  /**
   * @name upload_audio_file
   * @summary Upload an audio file for transcription
   * @request POST:/routes/upload_audio_file
   */
  upload_audio_file = (data: any, params: RequestParams = {}) =>
    this.request<any, any>({
      path: `/routes/upload_audio_file`,
      method: "POST",
      body: data,
      type: ContentType.FormData,
      format: "json",
      ...params,
    });

  /**
   * @name document_analysis_analyze
   * @request POST:/routes/document_analysis/analyze
   */
  document_analysis_analyze = (data: { file: File | Blob }, params: RequestParams = {}) =>
    this.request<any, any>({
      path: `/routes/document_analysis/analyze`,
      method: "POST",
      body: { file: data.file },
      type: ContentType.FormData,
      format: "json",
      ...params,
    });

  /**
   * @name document_analysis_list
   * @request GET:/routes/document_analysis/list
   */
  document_analysis_list = (params: RequestParams = {}) =>
    this.request<any, any>({
      path: `/routes/document_analysis/list`,
      method: "GET",
      format: "json",
      ...params,
    });

  /**
   * @name document_analysis_analyze_images
   * @request POST:/routes/document_analysis/analyze-images
   */
  document_analysis_analyze_images = (data: { files: File[] }, params: RequestParams = {}) => {
    const formData = new FormData();
    data.files.forEach((f) => formData.append("files", f));
    return this.request<any, any>({
      path: `/routes/document_analysis/analyze-images`,
      method: "POST",
      body: formData,
      ...params,
    });
  };

  /**
   * @name document_analysis_get
   * @request GET:/routes/document_analysis/{doc_id}
   */
  document_analysis_get = (doc_id: string, params: RequestParams = {}) =>
    this.request<any, any>({
      path: `/routes/document_analysis/${encodeURIComponent(doc_id)}`,
      method: "GET",
      format: "json",
      ...params,
    });

  /**
   * @name document_analysis_delete
   * @request DELETE:/routes/document_analysis/{doc_id}
   */
  document_analysis_delete = (doc_id: string, params: RequestParams = {}) =>
    this.request<any, any>({
      path: `/routes/document_analysis/${encodeURIComponent(doc_id)}`,
      method: "DELETE",
      format: "json",
      ...params,
    });
}
