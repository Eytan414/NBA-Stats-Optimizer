chrome.runtime.onMessage.addListener(function(message,sender,sendResponse){
	switch(message){
		case 'ptw-on':
			watchPlayer = true;
			if(isLiveGame) setupPTW();
			return true;
		case 'ptw-off':
			watchPlayer = false;
			deactivatePtw();
			return true;
		case 'ptwGetSwitchStatus':
			isLiveGame ? sendResponse(watchPlayer) : sendResponse(-1);
			return true;
		default:
			if(message.blink !== undefined)
				updateBlink();
			if(message.teamcolor !== undefined)
				updateTeamcolorPreference();
			return true;
	}
});
	
function updateBlink(){ 
	chrome.storage.sync.get(['blink'], function(val){
		blinkOn = val.blink;
	});
}

function updateTeamcolorPreference(){ 
	chrome.storage.sync.get(['teamcolor'], function(val){
		teamcolorOn = val.teamcolor;
		teamcolorOn ?
			colorHeadersByTeamsColors() :
			cleanHeadersByTeamsColors() ;
	});
}

function deactivatePtw(){ 
	//TODO: implement logic bla bla
}
	

function setupPTW(){
	$('table tbody tr td:nth-child(1)').each(function(i, el){ //add right click event on name columns
		$(el).on('mousedown', mousedownHandler);
		$(el).on('mouseup', mouseupHandler);
		$(el).on('contextmenu', rightClickHandler);
	});
	magicExecutor();
	$('body')[0].style.setProperty('--ptw-grab', 'grab');
	
}

function rightClickHandler(event){
	return false;
}
function mouseupHandler(event){
	if(event.button === 2)
		$('body')[0].style.setProperty('--ptw-grab', 'grab');
}

function mousedownHandler(event){
	if(event.button !== 2) return false;
	const $clickedEl = $(this);
	let minsVal = $clickedEl.next().text().length;
	if(minsVal > 5 || minsVal === 1) return false;

	$('body')[0].style.setProperty('--ptw-grab', 'grabbing');
	$('table tbody tr td:nth-child(1)').each(function(i, el){
		$(el).find('a').removeClass('ptw');
	});
	$clickedEl.find('a').addClass('ptw');
	playerToWatchName = $clickedEl.find('a span.hidden').text();
	ptwBenched = true;
	magicExecutor();
	if($('#ptw').length > 0) updatePtwTracker();
}

window.onload = function() {
	//remove sticky headers on irrelevant tabs
	$('section + div ul li a:not(#box-score)').click(function(){ 
		$('#home-headers-wrapper, #away-headers-wrapper').remove();
	});
	
	if($('.z-10 .w-full div:first-child .w-full .items-center > *:first-child').text() === "LIVE"){
		let url = chrome.runtime.getURL('../../assets/ui/hello.wav');
		let audioTag = `<audio id="ptwsound" preload="auto">
							<source src="${url}" type="audio/wav" />
						</audio>`;
		$('body').prepend(audioTag);
		isLiveGame = true;
		startChangeDetector();
		prevMillis = new Date().getTime();
	}

	
	//handle boxscore tab selected
	let $boxscoreElem = $('#box-score');
	$boxscoreElem.click(function(){ setTimeout(function(){ handleBoxscoreTab(); }, 0); });
	
	chrome.storage.sync.get(['blink','teamcolor'], function(val){
		blinkOn = val.blink ?? false;
		teamcolorOn = val.teamcolor ?? true;
		if($boxscoreElem.parent().attr('aria-selected') === 'true'){
			handleBoxscoreTab(); 
		}		
	});
		
};

const COL_MAP = {
	'FGM' : '0',	'FGA' : '1',
	'FG%' : '2',	'3PM' : '3',
	'3PA' : '4',	'3P%' : '5',
	'FTM' : '6',	'FTA' : '7',
	'FT%' : '8',	'OREB': '9',
	'DREB': '10',	'REB' : '11',
	'AST' : '12',	'STL' : '13',
	'BLK' : '14',	'TO'  : '15',
	'PF'  : '16',	'PTS' : '17',
	'+/-' : '18'};

const TEAM_COLORS_MAP = [
	{
		'fullName': 'Atlanta Hawks',
		'mainColor': '#c8102e',
		'secondaryColor': '#fafafa'
	},
	{
		'fullName': 'Brooklyn Nets',
		'mainColor': '#121212',
		'secondaryColor': '#fafafa'
	},
	{
		'fullName': 'Boston Celtics',
		'mainColor': '#007a33',
		'secondaryColor': '#fafafa'
	},
	{
		'fullName': 'Charlotte Hornets',
		'mainColor': '#201747',
		'secondaryColor': '#00778b'
	},
	{
		'fullName': 'Chicago Bulls',
		'mainColor': '#ba0c2f',
		'secondaryColor': '#222222'
	},
	{
		'fullName': 'Cleveland Cavaliers',
		'mainColor': '#6f263d',
		'secondaryColor': '#ffb81c'
	},
	{
		'fullName': 'Dallas Mavericks',
		'mainColor': '#0050b5',
		'secondaryColor': '#8d9093'
	},
	{
		'fullName': 'Denver Nuggets',
		'mainColor': '#418fde',
		'secondaryColor': '#ffc72c'
	},
	{
		'fullName': 'Detroit Pistons',
		'mainColor': '#003da5',
		'secondaryColor': '#d50032'
	},
	{
		'fullName': 'Golden State Warriors',
		'mainColor': '#ffc72d',
		'secondaryColor': '#003da5'
	},
	{
		'fullName': 'Houston Rockets',
		'mainColor': '#ba0c2f',
		'secondaryColor': '#8d9093'
	},
	{
		'fullName': 'Indiana Pacers',
		'mainColor': '#041e42',
		'secondaryColor': '#ffb81c'
	},
	{
		'fullName': 'LA Clippers',
		'mainColor': '#d50032',
		'secondaryColor': '#003da5'
	},
	{
		'fullName': 'Los Angeles Lakers',
		'mainColor': '#702f8a',
		'secondaryColor': '#ffc72c'
	},
	{
		'fullName': 'Memphis Grizzlies',
		'mainColor': '#23375b',
		'secondaryColor': '#6189b9'
	},
	{
		'fullName': 'Miami Heat',
		'mainColor': '#862633',
		'secondaryColor': '#222222'
	},
	{
		'fullName': 'Milwaukee Bucks',
		'mainColor': '#2c5234',
		'secondaryColor': '#ddcba4'
	},
	{
		'fullName': 'Minnesota Timberwolves',
		'mainColor': '#002b5c',
		'secondaryColor': '#7ac143'
	},
	{
		'fullName': 'New Orleans Pelicans',
		'mainColor': '#002b5c',
		'secondaryColor': '#e31937'
	},
	{
		'fullName': 'New York Knicks',
		'mainColor': '#003da5',
		'secondaryColor': '#ff671f'
	},
	{
		'fullName': 'Oklahoma City Thunder',
		'mainColor': '#0072ff',
		'secondaryColor': '#f05133'
	},
	{
		'fullName': 'Orlando Magic',
		'mainColor': '#007dc5',
		'secondaryColor': '#c4ced3'
	},
	{
		'fullName': 'Philadelphia 76ers',
		'mainColor': '#006bb6',
		'secondaryColor': '#ed174c'
	},
	{
		'fullName': 'Phoenix Suns',
		'mainColor': '#e56020',
		'secondaryColor': '#1d1160'
	},
	{
		'fullName': 'Portland Trail Blazers',
		'mainColor': '#f0163a',
		'secondaryColor': '#222222'
	},
	{
		'fullName': 'Sacramento Kings',
		'mainColor': '#8e9090',
		'secondaryColor': '#724c9f'
	},
	{
		'fullName': 'San Antonio Spurs',
		'mainColor': '#b6bfbf',
		'secondaryColor': '#222222'
	},
	{
		'fullName': 'Toronto Raptors',
		'mainColor': '#ce1141',
		'secondaryColor': '#c4ced3'
	},
	{
		'fullName': 'Utah Jazz',
		'mainColor': '#002b5c',
		'secondaryColor': '#ea910b'
	},
	{
		'fullName': 'Washington Wizards',
		'mainColor': '#0c2340',
		'secondaryColor': '#c8102e'
	}
];
const OFFSET = 3; //compensation for the removed name+min's col's + 1 due to arr begins on 0
const AWAY = 0;
const HOME = 1;
const MIN_INTERVAL = 1000 * 10;

//css classes
const BAD = 'worst';
const GREAT = 'great';
const BIG = 'big';
const NOTEWORTHY = 'noteworthy';
const PERFECT = 'perfect';
const CATEGORY_BEST = 'best-in-category';
const TEAM_GREAT = 'team-great';
const DEFAULT_COLOR = 'default-color';
const COLD = 'ice-cold';

let minsArray = [];
let calcTeamStats = true;
let canCalcPeriodChange = true;
let isLiveGame = false;
let highlightEnabled = false;
//player to watch vars:
let watchPlayer = false;
let ptwBenched = true;
let playerToWatchName;
let prevMillis;
//userPreferences:
let blinkOn;
let teamcolorOn;

function tableSrcChanged(){
	let msg = $('body .msg');
	msg.show();
	setTimeout(function() { msg.hide(); }, 5000);

	let elmOpts = this.event.srcElement.options;
	let tableSrc = elmOpts[elmOpts.selectedIndex].value;
	//TODO: add clauses according to table source
	cleanup();
	$('#away-headers-wrapper,#home-headers-wrapper').remove();
	canCalcPeriodChange = false;
}

function periodChanged(){ //period changed (q3,q4,h1,h2 etc.)
	$('#home-headers-wrapper, #away-headers-wrapper').remove();
	if(!canCalcPeriodChange){
		let msg = $('body .msg');
		msg.show();
		setTimeout(function() { msg.hide(); }, 5000);
		cleanup();
		return;
	}
	let curMinsArray;	
	let interval = setInterval(function(){
		curMinsArray = $($('table tbody')[AWAY]).find('tr td:nth-child(2)');
		curMinsArray =  curMinsArray.map(function(ind,elm){
			return $(elm).text();
		});

		if(minsArray.length === 0) minsArray = curMinsArray;
		for (let i = 0; i < minsArray.length/2; i++) 
			if(minsArray[i] !== curMinsArray[i]){
				calcTeamStats = false;
				cleanup();
				colorHeadersByTeamsColors();
				magicExecutor();
				minsArray = curMinsArray;
				clearInterval(interval);
		}
	},20);
}

function handleBoxscoreTab() {
	let html = "<div class='msg'> Please refresh page to enable full wizard </div>";
	$('body').prepend(html);
	$('select[name=splits]').change(function() { tableSrcChanged(); });
	$('select[name=period]').change(function(){ periodChanged(); });
	colorHeadersByTeamsColors();
	magicExecutor();
}

function startChangeDetector() {
	//TODO: identify ptw's table and narrow mut observers
	let targetNodes = $('table td');
	let gameStatusNode = $('.z-10 .w-full div:first-child .w-full .items-center > *:first-child')[0];// LIVE || FINAL
	let MutationObserver = window.MutationObserver || window.WebKitMutationObserver;
	let tableCellsObs = new MutationObserver(livePlusPtwMutationHandler);
	let gameStatusObs = new MutationObserver(gameStatusMutationHandler);
	let tableCellsConfig = { characterData: true, subtree: true};
	let gameStatusConfig = { characterData: true, childList: true, subtree: true}; //TODO: test

	targetNodes.each(function() {
		tableCellsObs.observe(this, tableCellsConfig);
	});
	gameStatusObs.observe(gameStatusNode, gameStatusConfig);
}

function gameStatusMutationHandler(mutationRecord) {
	if(mutationRecord[0].target.textContent === 'FINAL'){
		let $ptw = $('#ptw');
		$ptw.text($ptw.text() + ' | FINAL |');
	}
}

function livePlusPtwMutationHandler(mutationRecords) {
	let millis = new Date().getTime();
	// prevMillis ?? millis; shouldn't be necessary
	if(millis - prevMillis < MIN_INTERVAL) return;
	
	bodyBlink();
	if(watchPlayer && playerToWatchName){
		let minutesRecords = [];
		//get changed minutes columns values
		for(let i=0 ; i < mutationRecords.length ; i++){
			let colIndex = $(mutationRecords[i].target.parentElement).index();
			if(colIndex === 1) //min's played
				minutesRecords.push(mutationRecords[i].target.parentElement);
			//TODO: highlight entire player row when his statline updates
		}
		if(minutesRecords.length > 0) handlePlayerToWatch(minutesRecords);	
	}
	magicExecutor();
}

function handlePlayerToWatch(minutesRecords){
	let ptwUpdatedMinsCell;
	//identify if player to watch's minutes updated
	for(let record of minutesRecords){
		let name = $(record).prev().find('a span span')[0].innerText;
		if(name === playerToWatchName){ //ptw came of the bench - watch the game!
			if(isLiveGame && ptwBenched) playSound(); 
			ptwUpdatedMinsCell = record;
		}
	}
	ptwBenched = ptwUpdatedMinsCell === undefined; //update benched status
	updatePtwTracker();
}

function updatePtwTracker(){
	let $tracker = $('#ptw');
	let ptwMins = $('.ptw').closest('td').next().text();
	let text = `${playerToWatchName}: ${ptwMins} played`;
	ptwBenched ? $tracker.removeClass('on') : $tracker.addClass('on');
	$tracker.text(text);
}

function playSound() {
	document.getElementById('ptwsound').play(); 
}

function magicExecutor() {
	cleanup();
	magic();
	if(!highlightEnabled) implHighlight();

	if(isLiveGame && watchPlayer){
		if(playerToWatchName && $('#ptw').length === 0){
			let ptwTracker = `<p id="ptw"></p>`;
			$(ptwTracker).insertAfter($('nav').parent());
			updatePtwTracker();
		}
	}
}

function implHighlight() {
	$('body').on({
		mouseenter: function () {
			let rowIndex = $(this).closest('tr').index() + 1;
			let columnIndex = $(this).index();
			let isAwayTable = $($('table')[AWAY])[0] === $(this).closest('table')[0];
			let tableObj = isAwayTable ? $('table')[AWAY] : $('table')[HOME];
			
			$(tableObj).find('tbody tr:nth-child(' + rowIndex + ') td').each(function (i) { //get entire stat row
				if(i === 0)
					$(this).addClass('zoomed');
				$(this).addClass('highlight');
			});
			
			//handle column + sticky headers highlighting
			let headerSelector = isAwayTable ? 
				'#away-headers-wrapper .col' + columnIndex :
				'#home-headers-wrapper .col' + (columnIndex+21);		
			$(headerSelector).addClass('col-zoomed');

			$(tableObj).find('thead th:nth-child('+ (columnIndex+1) + ')').addClass('col-zoomed');
			$(tableObj).find('tbody tr').each(function (i, node) {
				$(node).find('td').eq(columnIndex).addClass('highlight');
			});
		},
		mouseleave: function () {
			let rowIndex = $(this).closest('tr').index() + 1;
			let columnIndex = $(this).index();
			let isAwayTable = $($('table')[AWAY])[0] === $(this).closest('table')[0];
			let tableObj = isAwayTable ? $('table')[AWAY] : $('table')[HOME];
			
			$(tableObj).find('tbody tr:nth-child(' + rowIndex + ') td').each(function (i) {
				if(i === 0)
					$(this).removeClass('zoomed');
				$(this).removeClass('highlight');
			
				//handle sticky headers + column highlighting
				let headerSelector = isAwayTable ? 
					'#away-headers-wrapper .col' + columnIndex :
					'#home-headers-wrapper .col' + (columnIndex+21);		
				$(headerSelector).removeClass('col-zoomed');

				$(tableObj).find('thead th:nth-child('+ (columnIndex+1) + ')').removeClass('col-zoomed');
				$(tableObj).find('tbody tr').each(function (i, node) {
					$(node).find('td').eq(columnIndex).removeClass('highlight');
				});
			})
		}
	}, 'table tbody tr td');
	highlightEnabled = true;
}

function colorHeadersByTeamsColors() {
	if(!teamcolorOn) return;
	let [awayTable, homeTable] = $('table');
	let [awayTeam, homeTeam] = $('h1 span');
	awayTeam = $(awayTeam).text();
	homeTeam = $(homeTeam).text();

	let homeObj = TEAM_COLORS_MAP.filter(team =>{
		return team.fullName.toLowerCase() === homeTeam.toLowerCase();		
	});
	let awayObj = TEAM_COLORS_MAP.filter(team =>{
		return team.fullName.toLowerCase() === awayTeam.toLowerCase();		
	});
	
	let aMainColor = awayObj[0].mainColor;
	let aSecColor  = awayObj[0].secondaryColor;
	let hMainColor = homeObj[0].mainColor;
	let hSecColor  = homeObj[0].secondaryColor;
	
	let awayBGVal = 'linear-gradient(230deg,' + aSecColor+'80' + ' 50%, ' + aMainColor+'80' + ' 85%)';
	let homeBgVal = 'linear-gradient(230deg,' + hSecColor+'80' + ' 50%, ' + hMainColor+'80' + ' 85%)';
	let awayTitleBGVal = 'linear-gradient(230deg,' + aSecColor+'cd' + ' 50%, ' + aMainColor+'cd' + ' 85%)';
	let homeTitleBgVal = 'linear-gradient(230deg,' + hSecColor+'cd' + ' 50%, ' + hMainColor+'cd' + ' 85%)';

	let offset = $('#__next > div:nth-child(2) .p-0 section').length === 2 ? 0 : 1; //finished games has additional section
	$('#__next > div:nth-child(2) .p-0 section:nth-child(' + (offset+1) +') > div:first-child').css('background', awayTitleBGVal);
	$('#__next > div:nth-child(2) .p-0 section:nth-child(' + (offset+2) +') > div:first-child').css('background', homeTitleBgVal);
	//color players
	$(awayTable).find('tbody tr').each(function (i, el) { 
		$(el).find('td').each(function (i, el) { 
			if(i === 0)
				$(el).css('background', awayBGVal);
		});
	});
	$(homeTable).find('tbody tr').each(function (i, el) { 
		$(el).find('td').each(function (i, el) { 
			if(i === 0)
				$(el).css('background', homeBgVal);
		});
	});

}
function cleanHeadersByTeamsColors() {
	let [awayTable, homeTable] = $('table');
	let offset = $('#__next > div:nth-child(2) .p-0 section').length === 2 ? 0 : 1; //finished games has additional section
	$('#__next > div:nth-child(2) .p-0 section:nth-child(' + (offset+1) +') > div:first-child').css('background', 'white');
	$('#__next > div:nth-child(2) .p-0 section:nth-child(' + (offset+2) +') > div:first-child').css('background', 'white');
	//color players
	$(awayTable).find('tbody tr').each(function (i, el) { 
		$(el).find('td').each(function (i, el) { 
			if(i === 0)
				$(el).css('background', 'white');
		});
	});
	$(homeTable).find('tbody tr').each(function (i, el) { 
		$(el).find('td').each(function (i, el) { 
			if(i === 0)
				$(el).css('background', 'white');
		});
	});

}

function magic(){
	let [awaytable, hometable] = $('table tbody');
	
	let awayMatrix = populateMatrix(awaytable);
	let awayTeamStats = awayMatrix.pop();
	masterCssWizardry(awayMatrix, awayTeamStats, AWAY, awaytable);
	
	let homeMatrix = populateMatrix(hometable);
	let homeTeamStats = homeMatrix.pop();
	masterCssWizardry(homeMatrix, homeTeamStats, HOME, hometable);	

	setTimeout(function(){
		fixHeaders('away');
		fixHeaders('home');
	},0);
}

function populateMatrix(tableObj) {
	let playerStatline = [];
	let matrixToReturn = [];

	$(tableObj).find('tr').each((i, currentRow) => {
		playerStatline = $(currentRow).find('td').map((i, el) => {
			const $el = $(el);
			const shift = 2;
			if (i < 2){
				if(i === 0) //do not insert name to matrix 
					return;
				else if($el.text().length < 6 && $el.text().length !== 3) //do not insert dnp to matrix + hide row
					return;
				else if(!isLiveGame){ 
					$(currentRow).hide();
					return;
				}
			} else {
				if(i === +(COL_MAP['FG%']) + shift || 
						i === +(COL_MAP['FT%']) + shift ||
				 			i === +(COL_MAP['3P%']) + shift)
								$el.addClass('pct');
				return +($el.text());
			}
		});
		if (playerStatline.length > 0) matrixToReturn.push(playerStatline);
	});
	return matrixToReturn;
}

function masterCssWizardry(matrix, teamStatsArray, homeAwayIdentifier, $table){
	let colsToCss = ['3P%','FG%','FT%','AST','FGM','3PM','FTM','STL','REB','BLK','+/-'];
	let otherColsToCss = ['PTS','PF','TO'];
	let teamRow = $($table).find('tr:last-child td');
	
	cssBatchExecutor(matrix, colsToCss, homeAwayIdentifier, CATEGORY_BEST, $table);
	colorOtherCols(matrix, otherColsToCss, homeAwayIdentifier, $table);
	if(calcTeamStats) teamStatWizardry(teamStatsArray, teamRow);
}
	
function getMinsByTeam($table) {
	let playersMinsArr = [];
	$table.find('tr').each((i, currentRow) => {
		playersMinsArr.push($(currentRow).find('td:nth-child(2)').text());
	});
	return playersMinsArr;
}

function colorOtherCols(matrix, statCategoryArr, homeAwayIdentifier, $table){
	let playerIndexesToHighlight = [];

	for (let i = 0; i < statCategoryArr.length; i++) {
		const category = statCategoryArr[i];
		let columnArray = getCol(matrix, COL_MAP[category]);

		switch(category){
			case 'PF':
				playerIndexesToHighlight = getMaxIndexesInCategory(matrix, COL_MAP['PF'], homeAwayIdentifier);
				cssExecutor(COL_MAP[category], playerIndexesToHighlight, homeAwayIdentifier, BAD, $table);
				if(columnArray[playerIndexesToHighlight[0]-1] === 6) //additional highlight on pf column at the first index to check if max = fouled out
					cssExecutor(COL_MAP[category], playerIndexesToHighlight, homeAwayIdentifier, BIG, $table);
				playerIndexesToHighlight = [];
				break;
			
			case 'TO':
				playerIndexesToHighlight = getMaxIndexesInCategory(matrix, COL_MAP['TO'], homeAwayIdentifier);
				cssExecutor(COL_MAP[category], playerIndexesToHighlight, homeAwayIdentifier, BAD, $table);
				playerIndexesToHighlight = [];
				break;
			
			case 'PTS':
				for(let i = 0 ; i < columnArray.length ; i++)
					if(columnArray[i] > 9)	
						playerIndexesToHighlight.push(i+1);

				cssExecutor(COL_MAP['PTS'], playerIndexesToHighlight, homeAwayIdentifier, NOTEWORTHY, $table);

				//highlight best scorer/s
				playerIndexesToHighlight = getMaxIndexesInCategory(matrix, COL_MAP['PTS'], homeAwayIdentifier);
				cssExecutor(COL_MAP['PTS'], playerIndexesToHighlight, homeAwayIdentifier, GREAT, $table);
				break;

				default:
					break;
		}
	}
}

function teamStatWizardry(teamStatsArray, teamRow){
	let columnsArr = ['3P%','FG%','FT%','REB','AST','STL','BLK'];

	let percent3P = teamStatsArray[COL_MAP['3P%']];
	let percentFG = teamStatsArray[COL_MAP['FG%']];
	let percentFT = teamStatsArray[COL_MAP['FT%']];
	let reb = teamStatsArray[COL_MAP['REB']];
	let ast = teamStatsArray[COL_MAP['AST']];
	let stl = teamStatsArray[COL_MAP['STL']];
	let blk = teamStatsArray[COL_MAP['BLK']];

	let cssArr = [];
	cssArr.push(extractTeamStatCss(percent3P, false, 30, 38, 45));
	cssArr.push(extractTeamStatCss(percentFG, false, 40, 50, 55));
	cssArr.push(extractTeamStatCss(percentFT, false, 60, 80, 90));
	cssArr.push(extractTeamStatCss(reb, true , 40, 55, 65));
	cssArr.push(extractTeamStatCss(ast, true , 15, 23, 30));
	cssArr.push(extractTeamStatCss(stl, true, -1, 10, 15));
	cssArr.push(extractTeamStatCss(blk, true, -1, 80, 90));

	for (let i = 0; i < cssArr.length; i++) {
		const title = columnsArr[i];
		let cell = $(teamRow[(+COL_MAP[title]+2)]);
		cell.find('a').length > 0 ?
			cell.find('a').addClass(cssArr[i]) :
			cell.addClass(cssArr[i]);
	}
}

function extractTeamStatCss(value, isBadRed, bad, nice, great){
	let cssClasses = '';
	if(value <= bad)
		isBadRed ? cssClasses += ' ' + BAD : cssClasses += ' ' + COLD; 
	else
		cssClasses += ' ' + DEFAULT_COLOR;
	
	if(value >= nice){
		cssClasses += ' ' + BIG;
	}
	if(value >= great)
		cssClasses += ' ' + TEAM_GREAT;
	if(value === 100)
		cssClasses += ' ' + PERFECT;

	return cssClasses;
}

function cssBatchExecutor(matrix, statCategoryArr, homeAwayIdentifier, classname, $table){
	let playerIndexesToHighlight = [];

	for (let colTitle of statCategoryArr) {
		playerIndexesToHighlight = getMaxIndexesInCategory(matrix, COL_MAP[colTitle], homeAwayIdentifier);
		cssExecutor(COL_MAP[colTitle], playerIndexesToHighlight, homeAwayIdentifier, classname, $table);
		if(colTitle === '+/-'){
			let lowlightIndexes = getMinIndexesInCategory(matrix, COL_MAP[colTitle], homeAwayIdentifier);
			cssExecutor(COL_MAP[colTitle], lowlightIndexes, homeAwayIdentifier, BAD, $table);
		}
	}
}

function cssExecutor(column, playerIndexesArray, homeAwayIdentifier, classname, $table){
	let table = $table ?? $('table tbody')[homeAwayIdentifier]; //find table if doesn't exists (such as gold100s)
	for (let i = 0 ; i < playerIndexesArray.length ; i++){
		let row = $(table).find('tr:nth-child(' + playerIndexesArray[i] + ')');
		let col = $(row).find('td:nth-child(' + (+column+OFFSET) + ')');

		let nestedAnchor = col.find('a');
		nestedAnchor.length > 0 ?
			nestedAnchor.addClass(classname) :
			col.addClass(classname);
	}
}

function getMinIndexesInCategory(matrix, col, homeAwayIdentifier) {
	let statsArray = getCol(matrix, col);
	let minutes = getMinsByTeam($($('table')[homeAwayIdentifier]));
	let minArr = [];
	let min = Math.min(...statsArray);
	for(let i = 0 ; i < statsArray.length ; i++)
		if (statsArray[i] === min && minutes[i+1] !== '0.0')
			minArr.push(i+1);
	return minArr;
}

function getMaxIndexesInCategory(matrix, col, homeAwayIdentifier) {
	//TODO: REWRITE use single for loop that deals with everything
	let columnArray = getCol(matrix, col);
	let maxArr = [];
	let max = Math.max(...columnArray);
	if(max === 100) //if scored 100% - gold respective cell and update array so it won't affect "regular" highlighting
		columnArray = goldAll100s(col, columnArray, homeAwayIdentifier);

	max = Math.max(...columnArray); //after zero-ing perfect
	if (max !== 0){
		for(let i = 0 ; i < columnArray.length ; i++){
			if (columnArray[i] === max )
				maxArr.push(i+1);
		}
	}
	return maxArr;
}

function goldAll100s(col, columnArray, homeAwayIdentifier) {
	let perfectIndexesArray = [];
	for(let i = 0 ; i < columnArray.length ; i++){
		if(columnArray[i] === 100){
			perfectIndexesArray.push(i+1);
			columnArray[i] = 0; 
		}
	}
	cssExecutor(col, perfectIndexesArray, homeAwayIdentifier, PERFECT);
	return columnArray;
}

function getCol(matrix, col){
	let column = [];
	for(let i=0; i<matrix.length; i++){
	   column.push(matrix[i][col]);
	}
	return column;
}

function fixHeaders(homeAwayIdentifier){ 
	let cols = $('thead th');
	$('body').prepend('<div id="' + homeAwayIdentifier + '-headers-wrapper" ></div>');
	$('#' + homeAwayIdentifier + '-headers-wrapper').css('opacity', '0');
	let start = homeAwayIdentifier === 'away' ? 0 : cols.length/2;
	let end = homeAwayIdentifier === 'away' ? cols.length/2 : cols.length;
	let $head = $('head');
	for (let i = start ; i < end; i++) {
		const $cur = $(cols[i]);
		let text = $cur.text();	
		let bgColor = $cur.css('background-color');
		let width = $cur.css('width');
		let height = $cur.css('height');
		let left = $cur.offset().left;
		let fSize = $cur.css('font-size');
		let color = $cur.css('color');
		
		let css = `
			position: absolute;			
			left: ${left}px;
			width: ${width};
			height: ${height};
			padding-top: 15px;
			background-color: ${bgColor};
			user-select: none;
			z-index: 20;
		`;

		let colheadcss = `
			display: block;
			font-size: ${fSize};
			text-align: center;
			color: ${color};
		`;

		$('#' + homeAwayIdentifier + '-headers-wrapper').append(`
			<div class="col${i}">			
				<span class="colhead${i}"></span>
			</div>`);	
		
		$head.prepend(`
			<style>
				.col${i} { ${css} }
				.colhead${i} { ${colheadcss} }
			</style>`);
							
		$(`.colhead${i}`).text(text);
	}
	addScrollHandler();
}

function addScrollHandler(){
	$(window).scroll(function(){ 
		const rowHeight = 40;
		const [awayTableElem, homeTableElem] = $('table');
		const [awayTbodyElem, homeTbodyElem] = $('table tbody');
		//calc offset + get away boundaries
		let offset = $(awayTableElem).offset();
		let awayTableStart = offset ? Math.floor(offset.top - rowHeight) : 500;
		offset = $(awayTbodyElem).find('tr:last-child').offset();
		let awayTableEnd = offset ? Math.floor(offset.top - 2*rowHeight) : 1500;
		//update offset + get home boundaries
		offset = $(homeTableElem).offset();
		let homeTableStart = offset ? Math.floor(offset.top - rowHeight) : 1600;
		offset = $(homeTbodyElem).find('tr:last-child').offset();
		let homeTableEnd = offset ? Math.floor(offset.top - 2*rowHeight) : 2500;
		
		let $awayTableStickyElem = $('#away-headers-wrapper');
		let $homeTableStickyElem = $('#home-headers-wrapper');
		let curScroll = $(window).scrollTop();
		if(curScroll >= awayTableStart && curScroll <= awayTableEnd){ //in top (away) table range
			$awayTableStickyElem.css('opacity', '1');
			$homeTableStickyElem.css('opacity', '0');
		} else if(curScroll >= homeTableStart && curScroll <= homeTableEnd){//in bottom (home) table range
			$awayTableStickyElem.css('opacity', '0');
			$homeTableStickyElem.css('opacity', '1');
		} else{
			$awayTableStickyElem.css('opacity', '0');
			$homeTableStickyElem.css('opacity', '0');
		}
	}); 
}

function bodyBlink(){ 
	if(!blinkOn) return;
	let $body = $('body')
	
	$body.removeClass('blink');
	setTimeout(function() {
		$body.addClass('blink');
	}, 1);
}

function cleanup(){
	$('#home-headers-wrapper, #away-headers-wrapper').remove();
	$('td, td a').each(function(){
		$(this).removeClass('perfect best-in-category noteworthy best-in-team worst ice-cold big pct');
	});
}