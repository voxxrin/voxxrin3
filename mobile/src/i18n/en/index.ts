import type { BaseTranslation } from '../i18n-types.js'

const en = {
	HI: 'Hi {name:string}! Please leave a star if you like this project: https://github.com/ivanhofer/typesafe-i18n',
	Conference_Selector: `Conference Selector`,
	Favorited_conferences: `Favorited conferences`,
	No_favorites_available_yet: `No favorites available yet`,
	No_conference_registered_yet: `No conference registered yet`,
	Past_events: `Past events`,
	Search_a_conference: `Search a conference`,
	Keywords: `Keywords`,
	Actions: `Actions`,
	Remove_from_favorites: `Remove from favorites`,
	Add_to_my_favorites: `Add to my favorites`,
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
	Overlaps_x_slot: `⚠️ overlaps {nrOfOverlappingSlots} slot{{nrOfOverlappingSlots:s}}`,
} satisfies BaseTranslation

export default en
