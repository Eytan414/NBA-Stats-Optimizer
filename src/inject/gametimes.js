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
	
	$(gametimeArr).each(function(i, el){
		//ignore live and postponed games
		if($(el).hasClass('relative')) return;
		if($(el).text() === 'PPD') return;
		
		let mins = $(el).text().split(':')[1];
		mins = mins.split(' ')[0];
		let hour = $(el).text().split(':')[0];
		hour = +hour + 12;
		let localHour = (hour + offset) % 24;
		let localTZ = Intl.DateTimeFormat().resolvedOptions().timeZone;
		let title = "Localized time of game in: " + localTZ + " timzone";
		let style ="cursor:help; border-bottom: 2px dotted #0268d6;";		
		$('<span title="' + title + '" style="' + style + '">(' + localHour + ':' + mins +')</span>').insertBefore($(el));
	});
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
	const tmp = new Date(iso + 'Z');
	return -(tmp - date) / 60 / 1000;
  }