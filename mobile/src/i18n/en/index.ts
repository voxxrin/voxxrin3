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
	Add_from_the_list_below: `Add from the list below`
} satisfies BaseTranslation

export default en
