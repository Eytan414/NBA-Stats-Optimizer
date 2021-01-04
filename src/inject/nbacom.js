chrome.extension.sendMessage({}, function (response) {
	let readyStateCheckInterval = setInterval(function () {
		if (document.readyState === "complete") {
			clearInterval(readyStateCheckInterval);
			if($('#box-score').parent().attr('aria-selected') === 'true'){
				implHighlight();
				adjustDOM();
				magic();
			}			
			$('#box-score').click(function(){
				setTimeout(function(){
					implHighlight();
					adjustDOM();
					magic();
				}, 0);
			});
		}
	}, 10);
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
// let isDarkMode = false;

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
	// setupDarkMode();
	addPrecentages();
	//Dec-2020: Dragons be slayed ! ! !
}

function addPrecentages(){
	for (let i = 0; i < 2; i++) { // i=0=AWAY, i=1=HOME
		let fg = $($('table tbody')[i]).find('tr:last-child td')[+COL_MAP['FG%']+OFFSET-1];
		let treys = $($('table tbody')[i]).find('tr:last-child td')[+COL_MAP['3P%']+OFFSET-1];
		let ft = $($('table tbody')[i]).find('tr:last-child td')[+COL_MAP['FT%']+OFFSET-1];
		
		$(fg).text($(fg).text() + "%");
		$(treys).text($(treys).text() + "%");
		$(ft).text($(ft).text() + "%");
	}
}

function setupDarkMode(){
	let materialIconsUrl = '<link href="https://fonts.googleapis.com/icon?family=Material+Icons" rel="stylesheet">';
	$('head').append(materialIconsUrl);
	let darkhtml = `<div class='dark' title='toggle dark mode'><i class="material-icons dark-mode">dark_mode</i></div>`;
	$('body nav').prepend(darkhtml);
	$('.dark .dark-mode').click(function () {
		isDarkMode = !isDarkMode;
		if(isDarkMode){
			$('body')[0].style.setProperty('--highlight-color', '#303030 !important');
			$('body')[0].style.setProperty('--font-color', '#a0a0a0');
			$('body')[0].style.setProperty('--icon-color', '#444'); 
		} else{
			$('body')[0].style.setProperty('--highlight-color', '#eee');
			$('body')[0].style.setProperty('--font-color', '#000');
			$('body')[0].style.setProperty('--icon-color', '#fff');
		}
	});
}

function magic(){
	let awaytable = $('table tbody')[AWAY];
	let awayMatrix = populateMatrix(awaytable);
	let awayTeamStats = awayMatrix.pop();
	masterCssWizardry(awayMatrix, awayTeamStats, AWAY);

	let hometable = $('table tbody')[HOME];
	let homeMatrix = populateMatrix(hometable);
	let homeTeamStats = homeMatrix.pop();
	masterCssWizardry(homeMatrix, homeTeamStats, HOME);
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
					$(currentRow).hide();
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
	let otherColsToCss = ['PTS','PF','TO'];
	let teamRow = $($('table tbody')[homeAwayIdentifier]).find('tr:last-child td');
	
	cssBatchExecutor(matrix, colsToCss, homeAwayIdentifier, 'best-in-category');
	handleOtherCols(matrix, otherColsToCss, homeAwayIdentifier);
	teamStatWizardry(teamStatsArray, teamRow);
}

function handleOtherCols(matrix, statCategoryArr, homeAwayIdentifier){
	let playerIndexesToHighlight = [];

	for (let i = 0; i < statCategoryArr.length; i++) {
		const category = statCategoryArr[i];
		let columnArray = getCol(matrix, COL_MAP[category]);

		switch(category){
			case 'PF':
				playerIndexesToHighlight = getMaxIndexesInCategory(matrix, COL_MAP['PF'], homeAwayIdentifier);
				cssExecutor(COL_MAP[category], playerIndexesToHighlight, homeAwayIdentifier, 'worst');
				if(columnArray[playerIndexesToHighlight[0]-1] === 6) //additional highlight on pf column at the first index to check if max = fouled out
					cssExecutor(COL_MAP[category], playerIndexesToHighlight, homeAwayIdentifier, 'big');
				playerIndexesToHighlight = [];
				break;
			
			case 'TO':
				playerIndexesToHighlight = getMaxIndexesInCategory(matrix, COL_MAP['TO'], homeAwayIdentifier);
				cssExecutor(COL_MAP[category], playerIndexesToHighlight, homeAwayIdentifier, 'worst');
				playerIndexesToHighlight = [];
				break;
			
			case 'PTS':
				for(let i = 0 ; i < columnArray.length ; i++)
					if(columnArray[i] > 9)	
						playerIndexesToHighlight.push(i+1);

				cssExecutor(COL_MAP['PTS'], playerIndexesToHighlight, homeAwayIdentifier, 'noteworthy');

				//highlight best scorer/s
				playerIndexesToHighlight = getMaxIndexesInCategory(matrix, COL_MAP['PTS'], homeAwayIdentifier);
				cssExecutor(COL_MAP['PTS'], playerIndexesToHighlight, homeAwayIdentifier, 'best-in-team');
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
			cell.find('a').css(cssArr[i]) :
			cell.css(cssArr[i]);
	}
}

function extractTeamStatCss(value, isBadRed, bad, nice, great){
	let cssObj = {};
	if(value <= bad)
		cssObj['color'] = isBadRed ? 'red' : '#5d7eff'; //ice cold blue or bad red
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
		const rowHeight = 40;
		let offset = $($('table')[AWAY]).offset();
		let awayTableStart = offset ? Math.floor(offset.top - rowHeight) : 500;

		offset = $($('table tbody')[AWAY]).find('tr:last-child').offset();
		let awayTableEnd = offset ? Math.floor(offset.top - 2*rowHeight) : 1500;
		
		offset = $($('table')[HOME]).offset();
		let homeTableStart = offset ? Math.floor(offset.top - rowHeight) : 1600;
		
		offset = $($('table tbody')[HOME]).find('tr:last-child').offset();
		let homeTableEnd = offset ? Math.floor(offset.top - 2*rowHeight) : 2500;
		
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