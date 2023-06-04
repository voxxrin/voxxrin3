import type { BaseTranslation } from '../i18n-types.js'

const en = {
	HI: 'Hi {name:string}! Please leave a star if you like this project: https://github.com/ivanhofer/typesafe-i18n',
	Conference_Selector: `Conference Selector`,
	Pinned_events: `Pinned events`,
	No_pinned_events_available_yet: `No pinned events available yet`,
	No_conference_registered_yet: `No conference registered yet`,
	Past_events: `Past events`,
	Search_a_conference: `Search a conference`,
	Keywords: `Keywords`,
	Actions: `Actions`,
	Remove_from_pinned_events: `Remove from pinned events`,
	Add_to_my_pinned_events: `Add to my pinned events`,
	Visit_website: `Visit website`,
	Cancel: `Cancel`,
	Schedule: `Schedule`,
	Favorites: `Favorites`,
	Feedbacks: `Feedbacks`,
	Infos: `Infos`,
	ConfStatus_ongoing: `Ongoing`,
	ConfStatus_past: `Past`,
	ConfStatus_future: `Future`,
	ConfStatus_unknown: `Unknown`,
	Overlaps_x_slot_label: `overlaps`,
	Overlaps_x_slot_value: `{nrOfOverlappingSlots} slot{{nrOfOverlappingSlots:s}}`,
	Talk_summary: `Talk summary`,
	Speakers: `Speakers`,
	Welcome_to: `Welcome to`,
	Hello_xxx: `Hello, {name:string}`,
	Add_from_the_list_below: `Add from the list below`,
	Today: 'Today',
	Tomorrow: 'Tomorrow',
	Add_Feedback: 'Add Feedback',
	Pick_the_talk_you_attended: 'Pick the talk you attended',
	Currently_selected_timeslot: 'Currently selected timeslot',
	Overlapping_timeslots: '{nrOfOverlappingSlots} Overlapping time slot{{nrOfOverlappingSlots:s}}',
	In_favorites: 'In favorites',
	Show_non_favorited_talks: 'Show non-favorited talk{{nrOfNonFavoritedTalks:s}}',
	Watch_later_all_favorited_talks: 'Watch later all favorited talks',
	I_didnt_attend_any_talk: "I didn't attend any talk",
	During_this_time_slot: "During this time slot",
	Share_your_feedback: "Share your feedback",
	Rate_it: "Rate it",
	Quick_feedback: "Quick Feedback",
	Enter_some_constructive_feedback_for_the_speaker: "Enter some constructive for the speaker",
} satisfies BaseTranslation

export default en
