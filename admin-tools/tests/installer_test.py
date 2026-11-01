import os
from pathlib import Path
import subprocess
import tempfile
import unittest

ROOT=Path(__file__).resolve().parents[1]
class InstallerTest(unittest.TestCase):
    def test_persistent_function_and_idempotent_setup_without_credentials(self):
        with tempfile.TemporaryDirectory() as temp:
            home=Path(temp);bin=home/'bin';bin.mkdir()
            (home/'.bashrc').write_text('# existing custom settings\n')
            (bin/'gcloud').write_text('#!/bin/bash\nexit 99\n')
            (bin/'curl').write_text('#!/bin/bash\nname=${2##*/}; cp "$TEST_SOURCE_DIR/$name" "${@: -1}"\n')
            for file in bin.iterdir():file.chmod(0o700)
            env={**os.environ,'HOME':str(home),'PATH':str(bin)+':'+os.environ['PATH'],'TEST_SOURCE_DIR':str(ROOT)}
            command='source "$1" "$2" && source "$1" "$2" && /Duyuru --help && /bildirim --help && /Bildirim --help && /bakım --help && /bakim --help && /premium --help && /oyuncu --help && /duyurular --help && /duyuru-sil --help && /durum --help && /yardım && /yardim && /event --help'
            result=subprocess.run(['bash','--noprofile','--norc','-c',command,'test',str(ROOT/'install-duyuru.sh'),'a'*40],env=env,capture_output=True,text=True)
            self.assertEqual(result.returncode,0,result.stderr)
            self.assertIn('Kullanım:',result.stdout)
            self.assertEqual((home/'.bashrc').read_text().count('# Kelime Seyyahi /Duyuru command v1'),1)
            self.assertEqual((home/'.bashrc').read_text().count('# Kelime Seyyahi /bildirim command v1'),1)
            self.assertEqual((home/'.bashrc').read_text().count('# Kelime Seyyahi /bakim command v1'),1)
            self.assertEqual((home/'.bashrc').read_text().count('# Kelime Seyyahi yonetim commands v1'),1)
            self.assertTrue((home/'.bashrc').read_text().startswith('# existing custom settings'))
            result=subprocess.run(['bash','--noprofile','--norc','-c','source "$HOME/.bashrc" && /Duyuru --help && /bildirim --help && /Bildirim --help && /bakım --help && /bakim --help && /premium --help && /oyuncu --help && /duyurular --help && /duyuru-sil --help && /durum --help && /yardım && /yardim && /event --help'],env=env,capture_output=True,text=True)
            self.assertEqual(result.returncode,0,result.stderr)
            self.assertEqual((home/'.local/share/kelime-seyyahi/duyuru.py').stat().st_mode & 0o777,0o600)

if __name__=='__main__':unittest.main()
