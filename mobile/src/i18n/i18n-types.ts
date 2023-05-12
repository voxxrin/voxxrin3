// This file was auto-generated by 'typesafe-i18n'. Any manual changes will be overwritten.
/* eslint-disable */
import type { BaseTranslation as BaseTranslationType, LocalizedString, RequiredParams } from 'typesafe-i18n'

export type BaseTranslation = BaseTranslationType
export type BaseLocale = 'en'

export type Locales =
	| 'en'

export type Translation = RootTranslation

export type Translations = RootTranslation

type RootTranslation = {
	/**
	 * H​i​ ​{​n​a​m​e​}​!​ ​P​l​e​a​s​e​ ​l​e​a​v​e​ ​a​ ​s​t​a​r​ ​i​f​ ​y​o​u​ ​l​i​k​e​ ​t​h​i​s​ ​p​r​o​j​e​c​t​:​ ​h​t​t​p​s​:​/​/​g​i​t​h​u​b​.​c​o​m​/​i​v​a​n​h​o​f​e​r​/​t​y​p​e​s​a​f​e​-​i​1​8​n
	 * @param {string} name
	 */
	HI: RequiredParams<'name'>
	/**
	 * C​o​n​f​e​r​e​n​c​e​ ​S​e​l​e​c​t​o​r
	 */
	Conference_Selector: string
	/**
	 * F​a​v​o​r​i​t​e​d​ ​c​o​n​f​e​r​e​n​c​e​s
	 */
	Favorited_conferences: string
	/**
	 * N​o​ ​f​a​v​o​r​i​t​e​s​ ​a​v​a​i​l​a​b​l​e​ ​y​e​t
	 */
	No_favorites_available_yet: string
	/**
	 * N​o​ ​c​o​n​f​e​r​e​n​c​e​ ​r​e​g​i​s​t​e​r​e​d​ ​y​e​t
	 */
	No_conference_registered_yet: string
	/**
	 * P​a​s​t​ ​e​v​e​n​t​s
	 */
	Past_events: string
	/**
	 * S​e​a​r​c​h​ ​a​ ​c​o​n​f​e​r​e​n​c​e
	 */
	Search_a_conference: string
	/**
	 * K​e​y​w​o​r​d​s
	 */
	Keywords: string
	/**
	 * A​c​t​i​o​n​s
	 */
	Actions: string
	/**
	 * R​e​m​o​v​e​ ​f​r​o​m​ ​f​a​v​o​r​i​t​e​s
	 */
	Remove_from_favorites: string
	/**
	 * A​d​d​ ​t​o​ ​m​y​ ​f​a​v​o​r​i​t​e​s
	 */
	Add_to_my_favorites: string
	/**
	 * V​i​s​i​t​ ​w​e​b​s​i​t​e
	 */
	Visit_website: string
	/**
	 * C​a​n​c​e​l
	 */
	Cancel: string
	/**
	 * S​c​h​e​d​u​l​e
	 */
	Schedule: string
	/**
	 * F​a​v​o​r​i​t​e​s
	 */
	Favorites: string
	/**
	 * F​e​e​d​b​a​c​k​s
	 */
	Feedbacks: string
	/**
	 * I​n​f​o​s
	 */
	Infos: string
	/**
	 * O​n​g​o​i​n​g
	 */
	ConfStatus_ongoing: string
	/**
	 * P​a​s​t
	 */
	ConfStatus_past: string
	/**
	 * F​u​t​u​r​e
	 */
	ConfStatus_future: string
	/**
	 * U​n​k​n​o​w​n
	 */
	ConfStatus_unknown: string
	/**
	 * o​v​e​r​l​a​p​s
	 */
	Overlaps_x_slot_label: string
	/**
	 * {​n​r​O​f​O​v​e​r​l​a​p​p​i​n​g​S​l​o​t​s​}​ ​s​l​o​t​{​{​s​}​}
	 * @param {string | number | boolean} nrOfOverlappingSlots
	 */
	Overlaps_x_slot_value: RequiredParams<'nrOfOverlappingSlots'>
	/**
	 * T​a​l​k​ ​s​u​m​m​a​r​y
	 */
	Talk_summary: string
	/**
	 * S​p​e​a​k​e​r​s
	 */
	Speakers: string
}

export type TranslationFunctions = {
	/**
	 * Hi {name}! Please leave a star if you like this project: https://github.com/ivanhofer/typesafe-i18n
	 */
	HI: (arg: { name: string }) => LocalizedString
	/**
	 * Conference Selector
	 */
	Conference_Selector: () => LocalizedString
	/**
	 * Favorited conferences
	 */
	Favorited_conferences: () => LocalizedString
	/**
	 * No favorites available yet
	 */
	No_favorites_available_yet: () => LocalizedString
	/**
	 * No conference registered yet
	 */
	No_conference_registered_yet: () => LocalizedString
	/**
	 * Past events
	 */
	Past_events: () => LocalizedString
	/**
	 * Search a conference
	 */
	Search_a_conference: () => LocalizedString
	/**
	 * Keywords
	 */
	Keywords: () => LocalizedString
	/**
	 * Actions
	 */
	Actions: () => LocalizedString
	/**
	 * Remove from favorites
	 */
	Remove_from_favorites: () => LocalizedString
	/**
	 * Add to my favorites
	 */
	Add_to_my_favorites: () => LocalizedString
	/**
	 * Visit website
	 */
	Visit_website: () => LocalizedString
	/**
	 * Cancel
	 */
	Cancel: () => LocalizedString
	/**
	 * Schedule
	 */
	Schedule: () => LocalizedString
	/**
	 * Favorites
	 */
	Favorites: () => LocalizedString
	/**
	 * Feedbacks
	 */
	Feedbacks: () => LocalizedString
	/**
	 * Infos
	 */
	Infos: () => LocalizedString
	/**
	 * Ongoing
	 */
	ConfStatus_ongoing: () => LocalizedString
	/**
	 * Past
	 */
	ConfStatus_past: () => LocalizedString
	/**
	 * Future
	 */
	ConfStatus_future: () => LocalizedString
	/**
	 * Unknown
	 */
	ConfStatus_unknown: () => LocalizedString
	/**
	 * overlaps
	 */
	Overlaps_x_slot_label: () => LocalizedString
	/**
	 * {nrOfOverlappingSlots} slot{{s}}
	 */
	Overlaps_x_slot_value: (arg: { nrOfOverlappingSlots: string | number | boolean }) => LocalizedString
	/**
	 * Talk summary
	 */
	Talk_summary: () => LocalizedString
	/**
	 * Speakers
	 */
	Speakers: () => LocalizedString
}

export type Formatters = {}
