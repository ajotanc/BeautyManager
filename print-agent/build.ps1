# Gera dist\BeautyPrintAgent.exe (sem console) e copia para public\print-agent para download no site.
Set-Location $PSScriptRoot
python -m pip install -r requirements.txt
python -m PyInstaller --onefile --noconsole --name BeautyPrintAgent --icon icon.ico --add-data "icon.png;." --add-data "icon.ico;." agent.py
New-Item -ItemType Directory -Force ..\public\print-agent | Out-Null
Copy-Item dist\BeautyPrintAgent.exe ..\public\print-agent\ -Force
