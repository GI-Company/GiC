"""Offline application-source secret scan; report locations, never candidates."""
import json
from pathlib import Path
import subprocess
import sys

ROOT=Path(__file__).resolve().parents[1]
PATHS=['app','components','lib','scripts','docs','integrations','supabase','.github','.env.example','README.md','package.json','next.config.ts']


def main():
    baseline=json.loads((ROOT/'.secrets.baseline').read_bytes())['results']
    known={(name,entry['type'],entry['hashed_secret']) for name,entries in baseline.items() for entry in entries}
    run=subprocess.run([sys.executable,'-m','detect_secrets','scan','--no-verify','--all-files',
        '--exclude-files',r'(__pycache__/|\.pyc$)',*PATHS],cwd=ROOT,capture_output=True,text=True,check=True)
    current=json.loads(run.stdout)['results']
    unexpected=[]
    reviewed=0
    for name,entries in current.items():
        for entry in entries:
            if (name,entry['type'],entry['hashed_secret']) in known: reviewed+=1
            else: unexpected.append({'file':name,'line':entry['line_number'],'type':entry['type']})
    print(json.dumps({'passed':not unexpected,'scanner':'detect-secrets 1.5.0','offline':True,
        'reviewed_nonsecret_matches':reviewed,'unexpected_findings':unexpected}))
    if unexpected: raise SystemExit(1)


if __name__=='__main__':main()
