import type { BaseTranslation } from '../i18n-types.js'

const en = {
	HI: 'Hi {name:string}! Please leave a star if you like this project: https://github.com/ivanhofer/typesafe-i18n',
	Open_User_Dashboard: `Open user dashboard`,
	Close: `Close`,
	Open_Voxxrin_website: `Open Voxxrin website`,
	Previous_screen: `Previous screen`,
	Back_User_Dashboard: `Back dashboard`,
	Avatar_Speaker: `Avatar speaker`,
	Nav_Back: `Back`,
	Conference_Selector: `Conference Selector`,
	Pinned_events: `Pinned events`,
	Config_event: `Configuration event`,
	Back_List_Events: `Back to events list`,
	Logo_event: `Logo`,
	No_pinned_events_available_yet: `No pinned events available yet`,
	No_conference_registered_yet: `No conference registered yet`,
	Search_a_conference: `Search a conference`,
	Keywords: `Keywords`,
	Actions: `Actions`,
	Remove_from_pinned_events: `Remove from pinned events`,
	Add_to_my_pinned_events: `Add to my pinned events`,
	Visit_website: `Visit website`,
	Cancel: `Cancel`,
	Dismiss: `Dismiss`,
	Schedule: `Schedule`,
	Banner_Event: `Banner event`,
	Cancel_Back_To_Schedule: `Cancel and back to schedule page`,
	Search: `Search`,
	Search_close: `Close search`,
	Filters: `Filters`,
	Add_Watch_later: `Add to Watch later`,
	Remove_Watch_later: `Removed from watch later`,
	Add_Favorites: `Add to favorites`,
	Remove_Favorites: `Removed from favorites`,
	Favorites: `Favorites`,
	Feedbacks: `Feedbacks`,
	No_feedback_yet: `No feedback yet`,
	Infos: `Infos`,
	ConfStatus_ongoing: `Ongoing`,
	ConfStatus_past: `Past`,
	ConfStatus_future: `Future`,
	ConfStatus_unknown: `Unknown`,
	Overlaps_x_slot_label: `overlaps`,
	Overlaps_x_slot_value: `{nrOfOverlappingSlots:number} slot{{nrOfOverlappingSlots:s}}`,
	Talk_summary: `Talk summary`,
	Talk_details: `Talk details`,
	Close_talk_details: `Close talk details`,
	Speakers: `Speakers`,
	Welcome_to: `Welcome to`,
	Hello_xxx: `Hello, {name:string}`,
	Add_from_the_list_below: `Add from the list below`,
	View_day: `View day`,
	Today: 'Today',
	Tomorrow: 'Tomorrow',
	No_favorites_defined_yet: "No favorites defined yet",
	Info_page_still_under_construction: 'Info page still under construction',
	Add_Feedback: 'Add Feedback',
	Add_Feedback_On_Slot: 'Add Feedback on slot',
	Open_List_Slot_Feedback: 'Open list of feedback slots',
	Pick_the_talk_you_attended: 'Pick the talk you attended',
	Select_one_of_the_talk_you_attended: 'Select one of the talk you attended',
	Either_select_one_of_the_talk_you_attended: 'Either select one of the talk you attended...',
	Or_select_a_talk_in_these_overlapping_slots: '... or select a talk in these overlapping slots',
	Currently_selected_timeslot: 'Currently selected timeslot',
	Overlapping_timeslots: '{nrOfOverlappingSlots:number} Overlapping time slot{{nrOfOverlappingSlots:s}}',
	In_favorites: 'In favorites',
	Show_non_favorited_talks: '{nrOfNonFavoritedTalks:number|typedef-only}Show non-favorited talk{{nrOfNonFavoritedTalks:s}}',
	Watch_later_all_favorited_talks: 'Watch later all favorited talks',
	I_didnt_attend_any_talk: "I didn't attend any talk",
	During_this_time_slot: "during this time slot",
	Share_your_feedback: "Share your feedback",
	Select_for_feedback: "Select for feedback",
	Rate_it: "Rate it",
	Quick_feedback: "Quick Feedback",
	Enter_some_constructive_feedback_for_the_speaker: "Enter some constructive for the speaker",
	Submit_Feedback: "Submit Feedback",
	Free_comment: "Free comment",
	Skipped: "Skipped",
	Settings_list: "Settings list",
	Hide_today_s_past_time_slots_after_1h: "Hide today's past time-slots after 1h",
	Hide_past_time_slots: "Hide past time-slots",
	Including_slots_without_feedback: "Including slots without feedback",
	Config: "Config",
	Talks_Config: "Talks",
	Open_full_version_of_the_schedule: "Open full version of the schedule",
	Here: "here",
	Feedbacks_are_not_enabled_on_this_event: "Feedbacks are not enabled on this event",
	Talk_Feedbacks: "Talk Feedbacks",
	Detailed_Feedbacks: "Detailed Feedbacks",
	Last_updated: "Last updated",
	Who: "Who",
	Linear_rating: "Linear rating",
	Linear_rating_level: "Level",
	Bingo: "Bingo",
	Custom_rating: "Custom rating",
	Stats: "Stats",
	Number_of_Feedbacks: "Number of feedbacks",
	Average_linear_ratings: "Average linear ratings",
	votes: "votes",
	Private_Bingo: "Private Bingo",
	My_talks_with_Feedbacks: "My talks with feedbacks",
	Ongoing_events_highlighted: "*Ongoing* events",
	Future_events_highlighted: "*Future* events",
	Past_events_highlighted: "*Past* events",
	Future_events: "Future events",
	Past_events: "Past events",
	New_content_available_click_on_reload_button_to_update: "New content available. Click on reload button to update in background then auto-reload page once content is downloaded.",
	Reload: "Reload",
	No_talks_matching_search_terms: "No talks found for selected day",
	Map_Event: "Event map",
	Social_media: "Social media",
	Event_plans: "Event plans",
	Event_location_link: "Address link",
	Event_summary: "Event summary",
	Sponsors: "Sponsors",
  Please_keep_this_token_private: "Please keep this token private",
  User_uid: "User uid",
  Profile: "Profile",
  Logout: "Logout",
  Preloading_event_assets_for_offline_usage: `Preloading event assets for offline usage`,
  This_can_slow_down_the_app_a_little_bit_during_pre_loading: `This can slow down the app a little bit during pre-loading`,
  Anonymous_private_user_id: "Anonymous (private) user token",
  Public_user_id: "Public user token",
  How_and_where_can_I_contact_the_team: "How and where can I contact the team ?",
  This_token_will_be_used_to_reference_you_in_APIs: "This token will be used to (anonymously) reference you in feedbacks",
  App_settings: "App settings",
  Configure_my_preferences_app: "Configure my preferences app",
  Frequently_asked_questions: "Frequently asked questions",
  Still_plenty_of_seats_available: "Still plenty of seats available",
  Room_is_becoming_crowded: "Room is becoming crowded",
  Only_few_seats_left: "Only few seats left",
  No_seats_available: "No seats available",
  Unknown_room_capacity: "No room capacity provided yet",
  xx_minutes_ago: "{minutes:number} minute{{minutes:s}} ago",
  few_seconds_ago: "Few seconds ago",
  How_is_room_capacity_indicator_calculated: "How is Room Capacity indicator calculated ?",
  Organizers_are_regularly_sending_room_capacity_ratio: "Organizers are regularly sending reports on how full the room is",
  On_flacky_connections_it_is_difficult_to_authenticate_the_user: "On flacky connections, authenticating the user can take time, leading to a long loading spinner. To workaround this, you can either Reload the page, or put your device completely offline, so that Firebase doesn't even try to update authenticated user's infos"
} satisfies BaseTranslation

export default en
