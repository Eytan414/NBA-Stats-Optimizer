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
	let estOffset = getTimeZoneOffset(new Date(), 'America/New_York');
	let localOffset = new Date().getTimezoneOffset();
	let offset = (estOffset - localOffset) / 60;
	let gametimeArr = $(GAME_TIME_SELECTOR);
	let gmtCalcdOffset = localOffset / -60; //convert to hours and change sign since returned offset is GMT-(returnedOffset)
	let localTZ = Intl.DateTimeFormat().resolvedOptions().timeZone;
	let tooltipText = "Localized time of game in: " + localTZ + " | GMT";
	tooltipText += gmtCalcdOffset > 0 ? '+'+gmtCalcdOffset : '-'+gmtCalcdOffset;
	
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
		iso.replace('T24','T00');
	const tmp = new Date(iso + 'Z');
	return -(tmp - date) / 60 / 1000;
  }