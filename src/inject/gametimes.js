// window.onload = function() {
// 	placeLocalHours();			
// 	startChangeDetector();
// }
let didAddCss = false;
window.onload = function() {
	$(DATE_SELECTOR).each(function(i,el){
		//TODO: replace w change detector
		$(el).on('click', function(){
			setTimeout(function(){
				placeLocalHours();
			},750);
		});
  	});

	placeLocalHours();			
}
const DATE_SELECTOR = '[class^="DatePickerWeek_weekBar"] button';
const GAME_TIME_SELECTOR = '[class^="GameCardMatchupStatusText_gcsText"]';
function placeLocalHours(){
	let est = new Date().toLocaleString("en-UK", {timeZone: "US/Eastern"});
	let gmt = new Date().toLocaleString("en-UK", {timeZone: "UTC"});
	
	let localOffset = new Date().getTimezoneOffset();
	let gmtCalcdOffset = localOffset / -60; //convert to hours and change sign since returned offset is GMT-(returnedOffset)
	let offset = getTimeZonesDifference(gmt, est) + gmtCalcdOffset;
	let localTZstring = Intl.DateTimeFormat().resolvedOptions().timeZone;
	let tooltipText = 
		`Localized time of game in: 
			${localTZstring} | GMT${(gmtCalcdOffset > 0 ? '+' : '-')}${gmtCalcdOffset}`;
	
	let gametimeArr = $(GAME_TIME_SELECTOR);
	$(gametimeArr).each(function(i, el){
		const $el = $(el);
		//ignore marked, live and postponed games
		if($el.siblings('.local-hour').length > 0) return;
		if($el.text().indexOf(':') === -1) return;
		if(!$el.text().includes('ET')) return;

		let mins = $el.text().split(':')[1];
		mins = mins.split(' ')[0];
		let hour = $el.text().split(':')[0];
		hour = +hour + 12;
		let localHour = (hour + offset) % 24;
		localHour = (localHour+'').padStart(2, '0');
		let url = chrome.runtime.getURL('assets/ui/wizard_color.png');

		let html = `
			<div class='local-hour'>(${localHour}:${mins})
				<span>${tooltipText}
					<img src='${url}'>
				</span>
			</div>
		`;
		$(html).insertBefore($el);
	});

	const css = `<style>
	.local-hour {
		display:inline-block;
		cursor:help;
		margin-bottom: 0.5rem;
		border-bottom: 2px dotted #0268d6;
	}
	.local-hour img{
		display: none;
		position: absolute;
		width: 40px;
		right: 3px;
		bottom: 5px;
	}
	div.local-hour span {
		display: none;
		width: 240px;
		background-color: #eee;
		color: #5f87e6;
		text-align: center;
		border-radius: 10px;
		padding: 10px;
		padding-right: 40px;
		position: absolute;
		border: 2px solid #5f87e6;
		font-family: cursive;
		z-index:1;
	}
	.local-hour:hover img,
	.local-hour:hover span{
		display: block;
	}
	</style>`;
	if(!didAddCss){
		$('head').append(css);
		didAddCss = true;
	} }

function getTimeZonesDifference(date1, date2) {
	let earlier = 'na';
	if(date1.split(',')[0] !== date2.split(',')[0]){
		let [day1, month1, year1] = date1.split(',')[0].split('/');
		let [day2, month2, year2] = date2.split(',')[0].split('/');
		if(year1 > year2)
			earlier = date2;
		else if(year2 > year1)
			earlier = date1;
		else if(month1 > month2)
			earlier = date2; 
		else if(month2 > month1)
			earlier = date1;
		else if(day1 > day2)
			earlier = date2;
		else if(day2 > day1)
			earlier = date1;
	}
	let h1 = date1.split(',')[1].trim().split(':')[0];
	let h2 = date2.split(',')[1].trim().split(':')[0];
	
	if(earlier === 'na') return Math.abs(h1-h2);

	if(date1 === earlier) h2 = +h2 + 24;
	if(date2 === earlier) h1 = +h1 + 24;		
	return Math.abs(h1-h2);
}

/* 
function startChangeDetector() {	
	let targetNode = $('div.shadow-block').parent();
	
	let MutationObserver = window.MutationObserver || window.WebKitMutationObserver;
	let obs = new MutationObserver((mutations)=> {
		placeLocalHours();
	});
	
	obs.observe(targetNode[0], { childList: true });
}

function getTimeZoneOffset(date, timeZone) {
	let iso = date.toLocaleString('en-CA', { timeZone, hour12: false }).replace(', ', 'T');
	iso += '.' + date.getMilliseconds().toString().padStart(3, '0');
	//handle case iso hour is midnight
	if(iso.split('T')[1].startsWith('24'))
		iso = iso.replace('T24','T00');
	const tmp = new Date(iso + 'Z');
	return -(tmp - date) / 60 / 1000;
  } */