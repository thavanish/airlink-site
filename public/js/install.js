function initInstallWizard() {
    var wizard = document.getElementById('install-wizard');
    if (!wizard) return;

    var selection   = wizard.querySelector('.install-selection');
    var quickPanel  = wizard.querySelector('.install-panel[data-panel="quick"]');
    var manualPanel = wizard.querySelector('.install-panel[data-panel="manual"]');

    function showPanel(panel) {
        selection.style.display   = 'none';
        quickPanel.style.display  = 'none';
        manualPanel.style.display = 'none';
        panel.style.display = 'block';
        panel.classList.add('panel-enter');
        setTimeout(function() { panel.classList.remove('panel-enter'); }, 300);
    }

    function showSelection() {
        quickPanel.style.display  = 'none';
        manualPanel.style.display = 'none';
        selection.style.display   = 'flex';
    }

    wizard.querySelector('.btn-quick').addEventListener('click',  function() { showPanel(quickPanel); });
    wizard.querySelector('.btn-manual').addEventListener('click', function() { showPanel(manualPanel); });
    wizard.querySelectorAll('.btn-back').forEach(function(btn) { btn.addEventListener('click', showSelection); });
}

initInstallWizard();
