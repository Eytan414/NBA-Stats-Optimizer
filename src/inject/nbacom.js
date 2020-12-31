chrome.extension.sendMessage({}, function (response) {

	let readyStateCheckInterval = setInterval(function () {
		if (document.readyState === "complete") {
			clearInterval(readyStateCheckInterval);
			implHighlight();
			adjustDOM();
		}
	}, 20);
});
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
const OFFSET = 3; //compensation for the removed name+min's col's + 1 due to arr begins with 0
const AWAY = 0; const HOME = 1;
let isDarkMode = false;
// let _url;

function implHighlight() {
	$('body').on({
		mouseenter: function () {
			let index = $(this).closest('tr').index() + 1;
			let columnIndex = $(this).index();
			let isAwayTable = $($('table')[AWAY])[0] === $(this).closest('table')[0];
			let tableObj = isAwayTable ? $('table')[AWAY] : $('table')[HOME];
			
			$(tableObj).find('tbody tr:nth-child(' + index + ') td').each(function () { //get stat entire row
				$(this).addClass('highlight');
			});

			//handle column highlighting
			$(tableObj).find('tbody tr').each(function (i, node) {
				$(node).find('td').eq(columnIndex).addClass('highlight');
			});
		},
		mouseleave: function () {
			let index = $(this).closest('tr').index() + 1;
			let columnIndex = $(this).index();
			let isAwayTable = $($('table')[AWAY])[0] === $(this).closest('table')[0];
			let tableObj = isAwayTable ? $('table')[AWAY] : $('table')[HOME];
			
			$(tableObj).find('tbody tr:nth-child(' + index + ') td').each(function () {
				$(this).removeClass('highlight');

				//handle column highlighting
				$(tableObj).find('tbody tr').each(function (i, node) {
					$(node).find('td').eq(columnIndex).removeClass('highlight');
				});
			})
		}
	}, 'table tbody tr td');
}

function adjustDOM() {
	fixHeaders('away');
	fixHeaders('home');
	addScrollHandler();

	let materialIconsUrl = '<link href="https://fonts.googleapis.com/icon?family=Material+Icons" rel="stylesheet">';
	$('head').append(materialIconsUrl);
	let darkhtml = `<div class='dark' title='toggle dark mode'><i class="material-icons dark-mode">dark_mode</i></div>`;
	$('body nav').prepend(darkhtml);
	$('.dark .dark-mode').click(function () {
		isDarkMode = !isDarkMode;
		if(isDarkMode){
			$('body')[0].style.setProperty('--highlight-color', '#555');
			$('body')[0].style.setProperty('--font-color', '#a0a0a0');
			$('body')[0].style.setProperty('--icon-color', '#444'); 
		} else{
			$('body')[0].style.setProperty('--highlight-color', '#eee');
			$('body')[0].style.setProperty('--font-color', '#000');
			$('body')[0].style.setProperty('--icon-color', '#fff');
		}
	});
	
	let awaytable = $('table tbody')[AWAY];
	let awayMatrix = populateMatrix(awaytable);
	let awayTeamStats = awayMatrix.pop();
	masterCssWizardry(awayMatrix, awayTeamStats, AWAY);

	let hometable = $('table tbody')[HOME];
	let homeMatrix = populateMatrix(hometable);
	let homeTeamStats = homeMatrix.pop();
	masterCssWizardry(homeMatrix, homeTeamStats, HOME);

	//Dec-2020: Dragons be slayed ! ! !

	// });
	$('#btns-wrapper .beautify').click();
}

function populateMatrix(tableObj) {
	let playerStatline = [];
	let matrixToReturn = [];

	$(tableObj).find('tr').each((i, currentRow) => {
		playerStatline = $(currentRow).find('td').map((i, el) => {
			if (i < 2){
				if(i === 0) //do not insert name to matrix 
					return;
				else if($(el).text().length < 6 && $(el).text().length !== 3) //do not insert dnp to matrix + remove from html.
					return;
				else{
					$(currentRow).remove();
					return;
				}
			} else
				return +($(el).text());
		});
		if (playerStatline.length > 0) matrixToReturn.push(playerStatline);
	});
	return matrixToReturn;
}

function masterCssWizardry(matrix, teamStatsArray, homeAwayIdentifier){
	let colsToCss = ['3P%','FG%','FT%','AST','FGM','3PM','FTM','STL','REB','BLK'];
	let teamRow = $($('table tbody')[homeAwayIdentifier]).find('tr:last-child td');
	
	cssBatchExecutor(matrix, colsToCss, homeAwayIdentifier, 'best-in-category');
	teamStatWizardry(teamStatsArray, teamRow);

	let playerIndexesToHighlight = [];
	//highlight double figure scorers 	
	let columnArray = getCol(matrix, COL_MAP['PTS']);
	for(let i = 0 ; i < columnArray.length ; i++){
		if(columnArray[i] > 9)	
			playerIndexesToHighlight.push(i+1);
	}
	cssExecutor(COL_MAP['PTS'], playerIndexesToHighlight, homeAwayIdentifier, 'noteworthy');
	
	//highlight best scorer/s
	playerIndexesToHighlight = getMaxIndexesInCategory(matrix, COL_MAP['PTS'], homeAwayIdentifier);
	cssExecutor(COL_MAP['PTS'], playerIndexesToHighlight, homeAwayIdentifier, 'best');
	
	//highlight fouler
	playerIndexesToHighlight = [];
	columnArray = getCol(matrix, COL_MAP['PF']);
	for(let i = 0 ; i < columnArray.length ; i++){
		if(columnArray[i] === 6)	
			playerIndexesToHighlight.push(i+1);
	}
	cssExecutor(COL_MAP['PF'], playerIndexesToHighlight, homeAwayIdentifier, 'worst');

	//highlight TO-er
	playerIndexesToHighlight = [];

	playerIndexesToHighlight = getMaxIndexesInCategory(matrix, COL_MAP['TO'], homeAwayIdentifier);
	for (let i = 0 ; i < playerIndexesToHighlight.length ; i++){
		let turnoverRow = $($('table tbody')[homeAwayIdentifier])
							.find('tr:nth-child(' + playerIndexesToHighlight[i] + ')');

		turnoverRow.find('td:nth-child(' + (+COL_MAP['TO']+OFFSET) + ')').addClass('worst');
		$(turnoverRow.find('td:nth-child(' + (+COL_MAP['TO']+OFFSET) + ') a')[0]).addClass('worst');
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
	cssArr.push(extractTeamStatCss(percent3P, 30, 38, 45));
	cssArr.push(extractTeamStatCss(percentFG, 40, 50, 55));
	cssArr.push(extractTeamStatCss(percentFT, 60, 80, 90));
	cssArr.push(extractTeamStatCss(reb, 40, 55, 65));
	cssArr.push(extractTeamStatCss(ast, 15, 23, 30));
	cssArr.push(extractTeamStatCss(stl, -1, 10, 15));
	cssArr.push(extractTeamStatCss(blk, -1, 80, 90));

	for (let i = 0; i < cssArr.length; i++) {
		const title = columnsArr[i];
		let cell = $(teamRow[(+COL_MAP[title]+2)]);
		cell.find('a').length > 0 ?
			cell.find('a').css(cssArr[i]) :
			cell.css(cssArr[i]);
	}
}

function extractTeamStatCss(value, bad, nice, great){
	let cssObj = {};
	if(value <= bad)
		cssObj['color'] = '#5d7eff'; //ice cold
	else
		cssObj['color'] = 'var(--font-color)';
	
	if(value >= nice){
		cssObj['font-weight'] = 'bold'; 
		cssObj['font-size'] =  '17px'; 
	}
	if(value >= great)
		cssObj['color'] = 'green';
		
	if(value === 100)
		cssObj['color'] = 'gold';
	
	return cssObj;
}

function cssBatchExecutor(matrix, columnsArr, homeAwayIdentifier, classname){
	let playerIndexesToHighlight = [];

	for (let colTitle of columnsArr) {
		playerIndexesToHighlight = getMaxIndexesInCategory(matrix, COL_MAP[colTitle], homeAwayIdentifier);
		cssExecutor(COL_MAP[colTitle], playerIndexesToHighlight, homeAwayIdentifier, classname);
	}
}

function cssExecutor(column, playerIndexesArray, homeAwayIdentifier, classname){
	for (let i = 0 ; i < playerIndexesArray.length ; i++){
		let table = $($('table tbody')[homeAwayIdentifier]);
		let row = $(table).find('tr:nth-child(' + playerIndexesArray[i] + ')');
		let col = $(row).find('td:nth-child(' + (+column+OFFSET) + ')');

		col.find('a').length > 0 ?
			col.find('a').addClass(classname) :
			$(col).addClass(classname);
	}
}

function getMaxIndexesInCategory(matrix, col, homeAwayIdentifier) {
	let columnArray = getCol(matrix, col);
	let maxArr = [];
	let max = Math.max(...columnArray);
	if(max === 100) //if scored 100% - gold respective cell and update array so it won't affect "regular" highlighting
		columnArray = goldAll100s(col, columnArray,homeAwayIdentifier);

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
	cssExecutor(col, perfectIndexesArray, homeAwayIdentifier, 'perfect');
	return columnArray;
}


function findWorstPercent(matrix, columnIndex){ //TODO: finish up
	//$($('table tbody')[homeAwayIdentifier]).find('tr td:nth-child(' + columnIndex + ')');
	// let statPercent = getCol(matrix, columnIndex);
	// let statAttempts = getCol(matrix, columnIndex-1);
	// let eligibleIndexes = [];
	// let playerIndexesArray = [];

	// for (let i = 0; i < statAttempts.length; i++) { //shame o-fer with red color. min 2 shots
	// 	const attempts = statAttempts[i];
	// 	if(attempts > 1) eligibleIndexes.push(i);
	// }
	// cssExecutor(statPercent, playerIndexesArray,)
	// for (const i of eligibleIndexes) {
	// }

	// for (let i = 0; i < eligibleIndexes.length; i++) {
	// 	const curIndex = eligibleIndexes[i];
	// 	if(statPercent[i] == 0)
	// 	eligibleIndexes.push(i);
	// }
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
	for (let i = start ; i < end; i++) {
		const cur = cols[i];
		let text = $(cur).text();	
		let bgColor = $(cur).css('background-color');
		let width = $(cur).css('width');
		let height = $(cur).css('height');
		let left = $(cur).offset().left;
		let fSize = $(cur).css('font-size');
		let color = $(cur).css('color');
		
		let css = `
			position: absolute;			
			left: ` + left + `px;
			width: ` + width + `;
			height: ` + height + `;
			padding-top: 15px;
			background-color: ` + bgColor + `;
			z-index: 20;
		`;

		let colheadcss = `
			display: block;
			font-size:` + fSize + `;
			text-align: center;
			color: ` + color +`;
		`;

		$('#' + homeAwayIdentifier + '-headers-wrapper').append(`
			<div class="col` + i + `">			
				<span class="colhead` + i + `"></span>
			</div>`);	
		
			$('head').prepend(`
			 <style>
				.col` + i + `{` + css +`}
				.colhead` + i + `{` + colheadcss +`}
			</style>`);
							
		$('.colhead' + i).text(text);
	}
}

function addScrollHandler(){
	$(window).scroll(function(){ 
		let awayTableHeight = Math.floor($($('table')[AWAY]).offset().top);
		let awayTableBottomBorder = Math.floor($($('table tbody')[AWAY]).find('tr:last-child').offset().top);
		let homeTableHeight = Math.floor($($('table')[HOME]).offset().top);
		let homeTableBottomBorder = Math.floor($($('table tbody')[HOME]).find('tr:last-child').offset().top);
		
		if($(window).scrollTop() >= awayTableHeight && $(window).scrollTop() <= awayTableBottomBorder){ //in top table range
			$('#away-headers-wrapper').css('opacity', '1');
			$('#home-headers-wrapper').css('opacity', '0');
		} else if( $(window).scrollTop() >= homeTableHeight && $(window).scrollTop() <= homeTableBottomBorder){//in bottom table range
			$('#home-headers-wrapper').css('opacity', '1');
			$('#away-headers-wrapper').css('opacity', '0');
		} else{
			$('#away-headers-wrapper').css('opacity', '0');
			$('#home-headers-wrapper').css('opacity', '0');
		}
	}); 
}