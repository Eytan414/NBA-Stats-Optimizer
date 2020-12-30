chrome.extension.sendMessage({}, function (response) {

	let readyStateCheckInterval = setInterval(function () {
		if (document.readyState === "complete") {
			clearInterval(readyStateCheckInterval);
			implHighlight();
			adjustDOM();
		}
	}, 20);
});
const colMap = {
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
const OFFSET = 3; //compensation for the removed name+min's col's 
const AWAY = 0; const HOME = 1;
let isDarkMode = true; //default
let isAwayToggleHeadersOn = false; //default off
let isHomeToggleHeadersOn = false; //default off
let _url;
function implHighlight() {
	$('body').on({
		mouseenter: function () {
			let index = $(this).closest('tr').index() + 1;
			let columnIndex = $(this).index();

			$('table tbody tr:nth-child(' + index + ') td').each(function () { //get stat entire row
				$(this).addClass('myHighlight');
			});

			//handle column highlighting
			$('table tbody tr').each(function (i, node) {
				$(node).find('td').eq(columnIndex).addClass('myHighlight');
			});
		},
		mouseleave: function () {
			let index = $(this).closest('tr').index() + 1;
			let columnIndex = $(this).index();

			$('table tbody tr:nth-child(' + index + ') td').each(function () {
				$(this).removeClass('myHighlight');

				//handle column highlighting
				$('table tbody tr').each(function (i, node) {
					$(node).find('td').eq(columnIndex).removeClass('myHighlight');
				});
			})
		}
	}, 'table tbody tr td');
}

function adjustDOM() { 
	var url = chrome.extension.getURL('src/inject/assets/fantasy_gray.png');
	fixHeaders('away');
	fixHeaders('home');

	let magicBtn = `<div id="btns-wrapper">
						<div class="beautify">
							<span> Beautify </span>
							<img class='fantasy' src="">
						</div>
						<hr>
						<div class="action-btns">
							<span>away<i class="toggle-headers material-icons away">toggle_off</i></span>
							<span>home<i class="toggle-headers material-icons home">toggle_off</i></span>
							<span>dark<i class="material-icons dark-mode">dark_mode</i></span>
						</div>
					</div>`;	

	let materialIconsUrl = '<link href="https://fonts.googleapis.com/icon?family=Material+Icons" rel="stylesheet">';
	$('head').append(materialIconsUrl);
	$('body').prepend(magicBtn);
	$('#btns-wrapper .fantasy').attr('src', url);
	$('#btns-wrapper .toggle-headers.away').click(function () {
		isAwayToggleHeadersOn = !isAwayToggleHeadersOn;
		$('#away-headers-wrapper').toggle();
		if(isAwayToggleHeadersOn){
			$('#btns-wrapper .toggle-headers.away').text('toggle_on');
			$('#btns-wrapper .toggle-headers.away').css('color', 'var(--nba-red)' );
		}else {
			$('#btns-wrapper .toggle-headers.away').text('toggle_off') ;
			$('#btns-wrapper .toggle-headers.away').css('color', '#a2a2a2' );
		}
	});

	$('#btns-wrapper .toggle-headers.home').click(function () {
		isHomeToggleHeadersOn = !isHomeToggleHeadersOn;
		$('#home-headers-wrapper').toggle();
		if(isHomeToggleHeadersOn){
			$('#btns-wrapper .toggle-headers.home').text('toggle_on');
			$('#btns-wrapper .toggle-headers.home').css('color', 'var(--nba-red)' );
		}else {
			$('#btns-wrapper .toggle-headers.home').text('toggle_off') ;
			$('#btns-wrapper .toggle-headers.home').css('color', '#a2a2a2' );
		}
	});

	$('#btns-wrapper .dark-mode').click(function () {
		isDarkMode = !isDarkMode;
		if(isDarkMode){
			$('body')[0].style.setProperty('--highlight-color', '#555');
			$('body')[0].style.setProperty('--font-color', '#a0a0a0');
			$('body')[0].style.setProperty('--icon-color', '#444'); //nba's Cornflower Blue
		} else{
			$('body')[0].style.setProperty('--highlight-color', '#eee');
			$('body')[0].style.setProperty('--font-color', '#000');
			$('body')[0].style.setProperty('--icon-color', 'white');
		}
	});
	_url = chrome.extension.getURL('src/inject/assets/fantasy_colored.png');

	$('#btns-wrapper .beautify').click(function () { //here be dragons be very very careful
		$('#btns-wrapper .beautify').css('filter', 'drop-shadow(0 0 6px gold)');
		$('#btns-wrapper .fantasy').attr('src', _url);
		let awaytable = $('table tbody')[AWAY];
		let awayMatrix = populateMatrix(awaytable);
		let awayTeamStats = awayMatrix.pop();
		masterCssWizardry(awayMatrix, awayTeamStats, AWAY);

		let hometable = $('table tbody')[HOME];
		let homeMatrix = populateMatrix(hometable);
		let homeTeamStats = homeMatrix.pop();
		masterCssWizardry(homeMatrix, homeTeamStats, HOME);

		//Dec-2020: Dragons be slayed ! ! !

	});
}

function populateMatrix(tableObj) {
	let tmpMatrix = [];
	let matrixToReturn = [];

	$(tableObj).find('tr').each((i, currentRow) => {
		tmpMatrix = $(currentRow).find('td').map((i, el) => {
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
		if (tmpMatrix.length > 0) matrixToReturn.push(tmpMatrix);
	});
	return matrixToReturn;
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

function teamStatWizardry(teamStatsArray, teamRow){
	const nice = { 'font-weight': 'bold', 'color': 'green' };
	const great = { 'font-weight': 'bold', 'color': 'green', 'font-size' : '17px' };
	let columnsArr = ['3P%','FG%','FT%','REB','AST','STL','BLK'];

	let percent3P = teamStatsArray[colMap['3P%']];
	let percentFG = teamStatsArray[colMap['FG%']];
	let percentFT = teamStatsArray[colMap['FT%']];
	let reb = teamStatsArray[colMap['REB']];
	let ast = teamStatsArray[colMap['AST']];
	let stl = teamStatsArray[colMap['STL']];
	let blk = teamStatsArray[colMap['BLK']];

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
		let cell = $(teamRow[(+colMap[title]+2)]);
		cell.find('a').length > 0 ?
			cell.find('a').css(cssArr[i]) :
			cell.css(cssArr[i]);
	}
}

function masterCssWizardry(matrix, teamStatsArray, homeAwayIdentifier){
	let tmpColArr = ['3P%','FG%','FT%','AST','FGM','3PM','FTM','STL','REB','BLK'];
	const bestInCategoryCss = { 'font-weight': 'bold', 'color': 'green' };
	const noteworthyCss = { 'font-weight': 'bold', 'font-size': '15px' };
	const bestCss = { 'background-color': 'rgba(0, 255, 0, .15)', 'font-weight': 'bold', 'color': 'green', 'font-size': '17px' };
	const worstCss = { 'font-weight': 'bold', 'font-size': '18px', 'color':'red' };
	let teamRow = $($('table tbody')[homeAwayIdentifier]).find('tr:last-child td');
	
	cssBatchExecutor(matrix, tmpColArr, bestInCategoryCss, homeAwayIdentifier);
	teamStatWizardry(teamStatsArray, teamRow);

	let playerIndexesToHighlight = [];
	//highlight double figure scorers 	
	let columnArray = getCol(matrix, colMap['PTS']);
	for(let i = 0 ; i < columnArray.length ; i++){
		if(columnArray[i] > 9)	
			playerIndexesToHighlight.push(i+1);
	}
	cssExecutor(colMap['PTS'], playerIndexesToHighlight, homeAwayIdentifier, noteworthyCss);
	
	//highlight best scorer/s
	playerIndexesToHighlight = getMaxIndexesInCategory(matrix, colMap['PTS'], homeAwayIdentifier);
	cssExecutor(colMap['PTS'], playerIndexesToHighlight, homeAwayIdentifier, bestCss);
	
	//highlight fouler
	playerIndexesToHighlight = [];
	columnArray = getCol(matrix, colMap['PF']);
	for(let i = 0 ; i < columnArray.length ; i++){
		if(columnArray[i] === 6)	
			playerIndexesToHighlight.push(i+1);
	}
	cssExecutor(colMap['PF'], playerIndexesToHighlight, homeAwayIdentifier, worstCss);


	//highlight TO-er
	playerIndexesToHighlight = [];

	playerIndexesToHighlight = getMaxIndexesInCategory(matrix, colMap['TO'], homeAwayIdentifier);
	for (let i = 0 ; i < playerIndexesToHighlight.length ; i++){
		let turnoverRow = $($('table tbody')[homeAwayIdentifier])
							.find('tr:nth-child(' + playerIndexesToHighlight[i] + ')');
		turnoverRow.find('td:nth-child(' + (+colMap['TO']+OFFSET) + ')')
		.css(worstCss);
		$(turnoverRow.find('td:nth-child(' + (+colMap['TO']+OFFSET) + ') a')[0]).css(worstCss);
	}
	
}

function getCol(matrix, col){
	let column = [];
	for(let i=0; i<matrix.length; i++){
	   column.push(matrix[i][col]);
	}
	return column;
 }

function getMaxIndexesInCategory(mat, col, homeAwayIdentifier) {
	let columnArray = getCol(mat, col);
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
	let cssObj = { 'color': 'gold', 'font-weight': 'bold'};
	cssExecutor(col, perfectIndexesArray, homeAwayIdentifier, cssObj);
	return columnArray;
}

function cssBatchExecutor(matrix, columnsArr, cssObj, homeAwayIdentifier){
	let playerIndexesToHighlight = [];

	for (let colTitle of columnsArr) {
		playerIndexesToHighlight = getMaxIndexesInCategory(matrix, colMap[colTitle], homeAwayIdentifier);
		cssExecutor(colMap[colTitle], playerIndexesToHighlight, homeAwayIdentifier, cssObj);
	}
}

function cssExecutor(column, playerIndexesArray, homeAwayIdentifier, cssObj){
	for (let i = 0 ; i < playerIndexesArray.length ; i++){
		let table = $($('table tbody')[homeAwayIdentifier]);
		let row = $(table).find('tr:nth-child(' + playerIndexesArray[i] + ')');
		let col = $(row).find('td:nth-child(' + (+column+OFFSET) + ')');

		col.find('a').length > 0 ?
			col.find('a').css(cssObj) :
			$(col).css(cssObj);
	}
}

function fixHeaders(homeAwayIdentifier){ 
	let cols = $('thead th');
	$(`body`).prepend(`<div id="` + homeAwayIdentifier + `-headers-wrapper" 
							style="top: 150px; position: sticky; z-index: 99;">
						</div>`);
	let start = homeAwayIdentifier === 'away' ? 0 :cols.length/2;
	let end = homeAwayIdentifier === 'away' ? cols.length/2 : cols.length;
	for (let i = start ; i < end; i++) {
		const cur = cols[i];
		let text = $(cur).text();	
		let bgColor = $(cur).css('background-color');
		let width = $(cur).width();
		let height = $(cur).height();
		let top = $( cols[i]).offset().top;
		let left = $(cur).offset().left;
		let fSize = $(cur).css('font-size');
		let css = `
			position: absolute;			
			left: ` + left + `px;
			width: ` + width + `px;
			height: ` + height + `px;
			padding: 15px 0 0 0;
			background-color: ` + bgColor + `;
			z-index: 99;
		`;

		let colheadcss = `
			display: block;
			font-size:` + fSize + `;
			text-align: center;
			color: red;
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
		$('#' + homeAwayIdentifier + '-headers-wrapper').hide();
	}

}