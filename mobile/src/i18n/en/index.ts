import type { BaseTranslation } from '../i18n-types.js'

const en = {
	HI: 'Hi {name:string}! Please leave a star if you like this project: https://github.com/ivanhofer/typesafe-i18n',
	Conference_Selector: `Conference Selector`,
	Pinned_events: `Pinned events`,
	No_pinned_events_available_yet: `No pinned events available yet`,
	No_conference_registered_yet: `No conference registered yet`,
	Search_a_conference: `Search a conference`,
	Keywords: `Keywords`,
	Actions: `Actions`,
	Remove_from_pinned_events: `Remove from pinned events`,
	Add_to_my_pinned_events: `Add to my pinned events`,
	Visit_website: `Visit website`,
	Cancel: `Cancel`,
	Schedule: `Schedule`,
	Search: `Search`,
	Favorites: `Favorites`,
	Feedbacks: `Feedbacks`,
	No_feedback_yet: `No feedback yet`,
	Infos: `Infos`,
	ConfStatus_ongoing: `Ongoing`,
	ConfStatus_past: `Past`,
	ConfStatus_future: `Future`,
	ConfStatus_unknown: `Unknown`,
	Overlaps_x_slot_label: `overlaps`,
	Overlaps_x_slot_value: `{nrOfOverlappingSlots} slot{{nrOfOverlappingSlots:s}}`,
	Talk_summary: `Talk summary`,
	Talk_details: `Talk details`,
	Speakers: `Speakers`,
	Welcome_to: `Welcome to`,
	Hello_xxx: `Hello, {name:string}`,
	Add_from_the_list_below: `Add from the list below`,
	Today: 'Today',
	Tomorrow: 'Tomorrow',
	No_favorites_defined_yet: "No favorites defined yet",
	Info_page_still_under_construction: 'Info page still under construction',
	Add_Feedback: 'Add Feedback',
	Pick_the_talk_you_attended: 'Pick the talk you attended',
	Select_one_of_the_talk_you_attended: 'Select one of the talk you attended',
	Either_select_one_of_the_talk_you_attended: 'Either select one of the talk you attended...',
	Or_select_a_talk_in_these_overlapping_slots: '... or select a talk in these overlapping slots',
	Currently_selected_timeslot: 'Currently selected timeslot',
	Overlapping_timeslots: '{nrOfOverlappingSlots} Overlapping time slot{{nrOfOverlappingSlots:s}}',
	In_favorites: 'In favorites',
	Show_non_favorited_talks: 'Show non-favorited talk{{nrOfNonFavoritedTalks:s}}',
	Watch_later_all_favorited_talks: 'Watch later all favorited talks',
	I_didnt_attend_any_talk: "I didn't attend any talk",
	During_this_time_slot: "during this time slot",
	Share_your_feedback: "Share your feedback",
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
	Future_events: "Future events ({nrOfEvents:number})",
	Past_events: "Past events ({nrOfEvents:number})",
} satisfies BaseTranslation

export default en
