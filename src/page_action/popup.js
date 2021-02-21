document.addEventListener("DOMContentLoaded", function() {   
    chrome.tabs.query({active:true,currentWindow:true},function(tabs){
        init();
        let supportedUrl = tabs[0].url.startsWith('https://www.nba.com/game/');
        if(supportedUrl){
            chrome.tabs.sendMessage(tabs[0].id,'ptwGetSwitchStatus', setupSwitch);
        } else{
            document.getElementById('fallbackPopup').style.display = 'block';
        }
    });
    
});

async function setupSwitch(trackPlayer){
    document.getElementById('mainPopup').style.display = 'block'; 
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
    let blink;
    chrome.storage.sync.get(['blink'],function(val){
        blink = val.blink ?? false;   
        if(blink){
            blinkTgl.src = '../../assets/ui/toggle_off.png';
            chrome.storage.sync.set({'blink': false},function(){});
        }else{
            chrome.storage.sync.set({'blink': true},function(){});
            blinkTgl.src = '../../assets/ui/toggle_on.png';
        }

        chrome.tabs.query({active:true,currentWindow:true},function(tabs){
            chrome.tabs.sendMessage(tabs[0].id,{'blink': blink});
        });
    });
}

function teamcolorClicked(ev){
    let teamcolorTgl = document.getElementById('teamcolor');
    chrome.storage.sync.get(['teamcolor'],function(val){
        let teamcolor = val.teamcolor ?? true;
        if(teamcolor){
            teamcolorTgl.src = '../../assets/ui/toggle_off.png';
            chrome.storage.sync.set({'teamcolor': false},function(){});
        }else{
            teamcolorTgl.src = '../../assets/ui/toggle_on.png';
            chrome.storage.sync.set({'teamcolor': true},function(){});
        }
        chrome.tabs.query({active:true,currentWindow:true},function(tabs){
            chrome.tabs.sendMessage(tabs[0].id,{'teamcolor': teamcolor});
        });
    });
}

function init(){
        
// setTimeout(function(){

    let blinkTgl = document.getElementById('blink');
    chrome.storage.sync.get(['blink'], function(val){
		let blinkActive = val.blink ?? false;
        blinkTgl.src = blinkActive ? '../../assets/ui/toggle_on.png' : '../../assets/ui/toggle_off.png';
	});
    blinkTgl.addEventListener('click', blinkClicked);
    
    let teamcolorTgl = document.getElementById('teamcolor');
	chrome.storage.sync.get(['teamcolor'], function(val){
		let teamcolorActive = val.teamcolor ?? true;
        teamcolorTgl.src = teamcolorActive ? '../../assets/ui/toggle_on.png' : '../../assets/ui/toggle_off.png';
	});
    teamcolorTgl.addEventListener('click', teamcolorClicked);
// }, 2000);
}

function updateToggleValue(toggle, value){

}