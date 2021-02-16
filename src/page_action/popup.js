document.addEventListener("DOMContentLoaded", function() {
    chrome.tabs.query({active:true,currentWindow:true},function(tabs){
        let supportedUrl = tabs[0].url.startsWith('https://www.nba.com/game/');
            
        if(supportedUrl){
            chrome.tabs.sendMessage(tabs[0].id,'ptwSwitch', handleSwitch);
            }
        else{
            document.getElementById('mainPopup').style.display = 'none'; 
            document.getElementById('fallbackPopup').style.display = 'block';
    

        }
    });

});
function handleSwitch(trackPlayer){
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
    let msg = powerBtnClasses.contains('on') ? "activate" : "deactivate";
    
    chrome.tabs.query({active:true,currentWindow:true},function(tabs){
        chrome.tabs.sendMessage(tabs[0].id, msg);
    });
    
    
}