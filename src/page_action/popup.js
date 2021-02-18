document.addEventListener("DOMContentLoaded", function() {
    chrome.tabs.query({active:true,currentWindow:true},function(tabs){
        init();
        let supportedUrl = tabs[0].url.startsWith('https://www.nba.com/game/');
        if(supportedUrl){
            chrome.tabs.sendMessage(tabs[0].id,'ptwGetSwitchStatus', setupSwitch);
        } else{
            document.getElementById('mainPopup').style.display = 'none'; 
            document.getElementById('fallbackPopup').style.display = 'block';
        }

        chrome.tabs.sendMessage(tabs[0].id,'setupPrefs', setupPrefs);
    });

});

function setupPrefs(trackPlayer){

}
function setupSwitch(trackPlayer){
    let powerEl = document.getElementById('power');
    
    if(trackPlayer === -1){//game over
        powerEl.classList.add('disabled');
        let mainContentEl = document.getElementById('mainContent');
        mainContentEl.textContent = 'Player tracking option is N/A after ther game is over';
    }
    else{
        powerEl.addEventListener('click', togglePlayerTrack);
        trackPlayer ?
            powerEl.classList.add('on'):
            powerEl.classList.remove('on');
    }
}

function togglePlayerTrack(ev){
    let powerBtnClasses = document.getElementById('power').classList;
    powerBtnClasses.toggle('on');
    let msg = powerBtnClasses.contains('on') ? "ptw-on" : "ptw-off";
    
    chrome.tabs.query({active:true,currentWindow:true},function(tabs){
        chrome.tabs.sendMessage(tabs[0].id, msg);
    });
    
    
}
function blinkClicked(ev){
    let blinkTgl = document.getElementById('blink');
    if(localStorage.getItem('blink') === 'on'){
        localStorage.setItem('blink', 'off');
        blinkTgl.src = '../../assets/ui/toggle_off.png';
    }else{
        localStorage.setItem('blink', 'on');
        blinkTgl.src = '../../assets/ui/toggle_on.png';
    }

}

function teamcolorClicked(ev){
    let teamcolorTgl = document.getElementById('teamcolor');
    if(localStorage.getItem('teamcolor') === 'on'){
        localStorage.setItem('teamcolor', 'off');
        teamcolorTgl.src = '../../assets/ui/toggle_off.png';
    }else{
        localStorage.setItem('teamcolor', 'on');
        teamcolorTgl.src = '../../assets/ui/toggle_on.png';
    }
}

function init(){
    // setTimeout(() => {
        let blinkTgl = document.getElementById('blink');
        let teamcolorTgl = document.getElementById('teamcolor');
        
    // }, 1500);
    
    let blinkActive = localStorage.getItem('blink') === 'on';
    let teamcolorActive = localStorage.getItem('teamcolor') === 'on';
    blinkTgl.src = blinkActive ? '../../assets/ui/toggle_on.png' : '../../assets/ui/toggle_off.png';
    teamcolorTgl.src = teamcolorActive ? '../../assets/ui/toggle_on.png' : '../../assets/ui/toggle_off.png';
    
    blinkTgl.addEventListener('click', blinkClicked);
    teamcolorTgl.addEventListener('click', teamcolorClicked);
}