let interval;
document.addEventListener("DOMContentLoaded", function() {   
    chrome.tabs.query({active:true,currentWindow:true},function(tabs){
    interval = setInterval(function(){        
        init();
        let supportedUrl = tabs[0].url.startsWith('https://www.nba.com/game/');
        supportedUrl ?
            chrome.tabs.sendMessage(tabs[0].id,'ptwGetSwitchStatus', setupSwitch):
            document.getElementById('fallbackPopup').style.display = 'block';
        }, 100);
    });
});

async function setupSwitch(trackPlayer){
    document.getElementById('mainPopup').style.display = 'block'; 
    let mainContentEl = document.getElementById('mainContent');
    
    if(trackPlayer !== -1){//game over
        // TODO: add ptw volume control 
        mainContentEl.innerHTML = `
        <h2>Player tracking:</h2>
        <div id='power'></div>
        <div>(When enabled: hover on a player's cell and right click on it)</div>
        <div>*disable to enjoy faster algorithm </div>`;
        
        let powerEl = document.getElementById('power');
        powerEl.addEventListener('click', togglePlayerTrack);
        trackPlayer ?
        powerEl.classList.add('on'):
        powerEl.classList.remove('on');
    } else {
        mainContentEl.textContent = 'Player tracking option is available only on live games';
    }
    clearInterval(interval);
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

function volumeControlChanged(){
    let volume = document.getElementById('volume').value;
    chrome.storage.sync.set({'volume': volume},function(){});
    chrome.tabs.query({active:true,currentWindow:true},function(tabs){
        chrome.tabs.sendMessage(tabs[0].id,{'volume': volume});
    });

}

function init(){
    let blinkTgl = document.getElementById('blink');
    chrome.storage.sync.get(['blink'], function(val){
		let blinkActive = val.blink ?? false;
        blinkTgl.src = blinkActive ? 
            '../../assets/ui/toggle_on.png' :
            '../../assets/ui/toggle_off.png';
	});
    blinkTgl.addEventListener('click', blinkClicked);
    
    let teamcolorTgl = document.getElementById('teamcolor');
	chrome.storage.sync.get(['teamcolor'], function(val){
		let teamcolorActive = val.teamcolor ?? true;
        teamcolorTgl.src = teamcolorActive ?
            '../../assets/ui/toggle_on.png' : 
            '../../assets/ui/toggle_off.png';
	});
    teamcolorTgl.addEventListener('click', teamcolorClicked);
    
    let volumeElement = document.getElementById('volume');
	chrome.storage.sync.get(['volume'], function(val){
		volumeElement.value = val.volume ?? 0.5;
	});
    volumeElement.addEventListener('input', volumeControlChanged);
}