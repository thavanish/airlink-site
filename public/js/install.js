function initInstallWizard() {
    const wizard = document.getElementById('install-wizard');
    if (!wizard) return;

    const selection   = wizard.querySelector('.install-selection');
    const quickPanel  = wizard.querySelector('.install-panel[data-panel="quick"]');
    const manualPanel = wizard.querySelector('.install-panel[data-panel="manual"]');

    function showPanel(panel) {
        selection.style.display   = 'none';
        quickPanel.style.display  = 'none';
        manualPanel.style.display = 'none';
        panel.style.display = 'block';
        panel.classList.add('panel-enter');
        setTimeout(() => panel.classList.remove('panel-enter'), 300);
    }

    function showSelection() {
        quickPanel.style.display  = 'none';
        manualPanel.style.display = 'none';
        selection.style.display   = 'flex';
    }

    wizard.querySelector('.btn-quick').addEventListener('click',  () => showPanel(quickPanel));
    wizard.querySelector('.btn-manual').addEventListener('click', () => showPanel(manualPanel));
    wizard.querySelectorAll('.btn-back').forEach(btn => btn.addEventListener('click', showSelection));
}

initInstallWizard();
