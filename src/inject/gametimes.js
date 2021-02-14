chrome.extension.sendMessage({}, function(response) {
	var readyStateCheckInterval = setInterval(function() {
	if (document.readyState === "complete") {
		clearInterval(readyStateCheckInterval);
		placeLocalHours();			
		startChangeDetector();
	}}, 10);
});

function placeLocalHours(){
	let estOffset = getTimeZoneOffset(new Date(), 'America/New_York');
	let localOffset = new Date().getTimezoneOffset();
	let offset = (estOffset - localOffset) / 60;
	let gametimeArr = $('section > div.shadow-block > .flex a .items-center p.h9');

	let gmtCalcdOffset = localOffset / -60; //convert to hours and change sign since returned offset is GMT-(returnedOffset)
	let localTZ = Intl.DateTimeFormat().resolvedOptions().timeZone;
	let tooltipText = "Localized time of game in: " + localTZ + " | GMT";
	tooltipText += gmtCalcdOffset > 0 ? '+'+gmtCalcdOffset : '-'+gmtCalcdOffset;
	
	$(gametimeArr).each(function(i, el){
		const $el = $(el);
		//ignore live and postponed games
		if($el.hasClass('relative')) return;
		if($el.text() === 'PPD') return;
		
		let mins = $el.text().split(':')[1];
		mins = mins.split(' ')[0];
		let hour = $el.text().split(':')[0];
		hour = +hour + 12;
		let localHour = (hour + offset) % 24;
		localHour = (localHour+'').padStart(2, '0');
		let url = chrome.runtime.getURL('../../assets/wizard_color.png');

		let html = `
			<div class='local-hour'>(${localHour}:${mins})
				<span>${tooltipText}
					<img src='${url}'>
				</span>
			</div>
		`;
		$(html).insertBefore($el);
	});

	let css = `<style>
	.local-hour {
		display:inline-block;
		cursor:help;
		border-bottom: 2px dotted #0268d6;
	}
	.local-hour img{
		display: none;
		position: absolute;
		width: 40px;
		right: 3px;
		bottom: 5px;
	}
	.local-hour span {
		display: none;
		width: 240px;
		background-color: #222;
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
	$('head').append(css);
}

function startChangeDetector() {
	let targetNode = $('section > div.shadow-block').parent();
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