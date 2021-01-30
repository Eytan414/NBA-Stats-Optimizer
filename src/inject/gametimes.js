chrome.extension.sendMessage({}, function(response) {
	var readyStateCheckInterval = setInterval(function() {
	if (document.readyState === "complete") {
		clearInterval(readyStateCheckInterval);
		let estOffset = getTimeZoneOffset(new Date(), 'America/New_York');
		let localOffset = new Date().getTimezoneOffset();
		let offset = (estOffset - localOffset) / 60;
		let gametimesArr = $('section > div.shadow-block > .flex a .items-center p.h9');
		
		$(gametimesArr).each(function(i, el){
			if($(el).hasClass('relative')) return; //ignore live games
			let mins = $(el).text().split(':')[1];
			mins = mins.split(' ')[0];
			let hour = $(el).text().split(':')[0];
			let ilHour = (+hour + offset) % 12;
			$('<span class="q">(' + ilHour + ':' + mins +')</span>').insertBefore($(el));
		});
	}}, 10);
});

function getTimeZoneOffset(date, timeZone) {
	let iso = date.toLocaleString('en-CA', { timeZone, hour12: false }).replace(', ', 'T');
	iso += '.' + date.getMilliseconds().toString().padStart(3, '0');
	const tmp = new Date(iso + 'Z');
	return -(tmp - date) / 60 / 1000;
  }